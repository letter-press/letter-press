/**
 * Example Event Plugin - Demonstrates the TypeSafe Event System
 * 
 * This plugin showcases how to:
 * - Listen to system events
 * - Emit custom events with type safety
 * - Use the plugin-specific event namespace
 * - Handle event errors and conditions
 */

const plugin = {
  config: {
    name: 'example-event-plugin',
    version: '1.0.0',
    description: 'Example plugin demonstrating the TypeSafe Event System',
    author: 'Letter-Press CMS'
  },

  /**
   * Plugin activation - Set up event listeners
   */
  async activate() {
    console.log('🎉 Example Event Plugin activated');
    
    // Get the plugin context (this would normally be passed in)
    // For testing, we'll simulate getting it from the plugin manager
    if (typeof global !== 'undefined' && global.pluginManager) {
      const context = global.pluginManager.getPluginContext('example-event-plugin');
      if (context) {
        this.setupEventListeners(context);
        this.testEventSystem(context);
      }
    }
  },

  /**
   * Set up various event listeners to demonstrate the system
   */
  setupEventListeners(context) {
    const { events } = context;

    // Listen to system-wide content events
    events.events.on('content:created', async (payload) => {
      console.log('📄 Content created event received:', payload.data);
      
      // Emit a custom plugin event in response
      await events.emitPluginEvent('content-processed', {
        originalId: payload.data?.id,
        processedAt: new Date(),
        processingTime: Math.random() * 100
      });
    });

    // Listen to plugin lifecycle events
    events.events.on('plugin:enabled', async (payload) => {
      console.log('🔌 Plugin enabled:', payload.data?.pluginId);
      
      if (payload.data?.pluginId !== 'example-event-plugin') {
        // Welcome other plugins
        await events.emitPluginEvent('plugin-welcomed', {
          welcomedPlugin: payload.data?.pluginId,
          message: `Welcome to the system, ${payload.data?.pluginId}!`
        });
      }
    });

    // Listen to our own plugin events
    events.onPluginEvent('content-processed', async (payload) => {
      console.log('✅ Our plugin processed content:', payload.data);
    });

    // Conditional event listener - only process during business hours
    events.events.on('content:published', async (payload) => {
      const hour = new Date().getHours();
      if (hour >= 9 && hour <= 17) {
        console.log('📢 Content published during business hours:', payload.data);
        await events.emitPluginEvent('business-hours-publish', payload.data);
      }
    }, {
      condition: (payload) => {
        const hour = new Date().getHours();
        return hour >= 9 && hour <= 17;
      }
    });

    // High-priority event listener
    events.events.on('system:error', async (payload) => {
      console.log('🚨 System error detected:', payload.data);
      // This would typically send alerts, log to external service, etc.
    }, {
      priority: 1, // High priority
      once: false
    });

    console.log('📡 Event listeners set up successfully');
  },

  /**
   * Test the event system with various scenarios
   */
  async testEventSystem(context) {
    const { events } = context;

    console.log('🧪 Testing event system...');

    // Test 1: Emit a content creation event
    setTimeout(async () => {
      await events.events.emit('content:created', {
        id: 'test-post-1',
        title: 'Test Post',
        author: 'Test User',
        createdAt: new Date()
      });
    }, 1000);

    // Test 2: Emit a plugin-specific event
    setTimeout(async () => {
      await events.emitPluginEvent('test-event', {
        message: 'This is a test event from the example plugin',
        timestamp: new Date(),
        data: { key: 'value', number: 42 }
      });
    }, 2000);

    // Test 3: Emit a content publication event
    setTimeout(async () => {
      await events.events.emit('content:published', {
        id: 'test-post-2',
        title: 'Published Test Post',
        publishedAt: new Date()
      });
    }, 3000);

    // Test 4: Wait for an event with timeout
    setTimeout(async () => {
      try {
        console.log('⏳ Waiting for content:updated event (5 second timeout)...');
        
        // This would timeout since we're not emitting this event
        const result = await events.events.waitForEvent('content:updated', 5000);
        console.log('📄 Content updated event received:', result);
      } catch (error) {
        console.log('⏰ Timeout waiting for content:updated event:', error.message);
      }
    }, 4000);

    console.log('✅ Event system tests scheduled');
  },

  /**
   * Plugin hooks - integrate with existing hook system
   */
  hooks: {
    afterPostCreate: async (post) => {
      console.log('🪝 Hook: Post created:', post?.title);
      
      // Use global plugin manager if available for testing
      if (typeof global !== 'undefined' && global.pluginManager) {
        await global.pluginManager.emitEvent('content:created', {
          id: post?.id,
          title: post?.title,
          type: 'post'
        });
      }
      
      return post;
    },

    afterPostUpdate: async (post) => {
      console.log('🪝 Hook: Post updated:', post?.title);
      
      if (typeof global !== 'undefined' && global.pluginManager) {
        await global.pluginManager.emitEvent('content:updated', {
          id: post?.id,
          title: post?.title,
          type: 'post'
        });
      }
      
      return post;
    }
  },

  /**
   * Plugin deactivation - Clean up event listeners
   */
  async deactivate() {
    console.log('👋 Example Event Plugin deactivated');
    
    // Event listeners are automatically cleaned up by the plugin manager
    // when a plugin is deactivated, but you could also do manual cleanup here
  }
};

// Export the plugin
export default plugin;

// For CommonJS compatibility
if (typeof module !== 'undefined' && module.exports) {
  module.exports = plugin;
}