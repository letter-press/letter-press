import { definePlugin } from '../src/index.js';

/**
 * Basic Plugin Example
 * 
 * This example demonstrates:
 * - Basic plugin configuration
 * - Content lifecycle hooks
 * - Server lifecycle hooks
 * - Simple settings
 */

export default definePlugin({
  name: 'basic-example-plugin',
  version: '1.0.0',
  description: 'A basic example plugin showing core functionality',
  author: 'Letter-Press Team',
  
  // Plugin settings
  settings: {
    enableLogging: {
      type: 'boolean',
      label: 'Enable Logging',
      description: 'Log all plugin activity',
      default: true
    },
    prefix: {
      type: 'string',
      label: 'Log Prefix',
      description: 'Prefix for log messages',
      default: '[BASIC]',
      validation: (value: string) => {
        if (value.length > 20) return 'Prefix must be 20 characters or less';
        return true;
      }
    }
  },

  // Lifecycle hooks
  install: async () => {
    console.log('🔧 Installing basic plugin...');
    // Perform any installation tasks
    // e.g., create database tables, initialize files
  },

  activate: async () => {
    console.log('✅ Basic plugin activated');
    // Plugin is now active and hooks will be called
  },

  deactivate: async () => {
    console.log('⏸️ Basic plugin deactivated');
    // Clean up active processes, but keep data
  },

  uninstall: async () => {
    console.log('🗑️ Uninstalling basic plugin...');
    // Remove all plugin data, files, database entries
  },

  // Content hooks
  hooks: {
    // Server lifecycle
    onServerStart: async () => {
      console.log('🚀 Server started - Basic plugin is ready');
    },

    onServerStop: async () => {
      console.log('🛑 Server stopping - Basic plugin cleanup');
    },

    // Content lifecycle hooks
    beforePostCreate: async (data: any) => {
      console.log(`📝 About to create post: ${data.title}`);
      
      // Example: Auto-generate slug if not provided
      if (!data.slug && data.title) {
        data.slug = data.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '');
        
        console.log(`🔗 Auto-generated slug: ${data.slug}`);
      }
      
      // Example: Add creation metadata
      data.meta = {
        ...data.meta,
        processedBy: 'basic-example-plugin',
        processedAt: new Date().toISOString()
      };
      
      return data;
    },

    afterPostCreate: async (post: any) => {
      console.log(`✅ Post created successfully: ${post.title} (ID: ${post.id})`);
      
      // Example: Send notification (mock)
      await sendNotification(`New post published: ${post.title}`);
    },

    beforePostUpdate: async (id: number, data: any) => {
      console.log(`📝 About to update post ID: ${id}`);
      
      // Example: Track update metadata
      data.meta = {
        ...data.meta,
        lastModifiedBy: 'basic-example-plugin',
        lastModifiedAt: new Date().toISOString()
      };
      
      return data;
    },

    afterPostUpdate: async (post: any) => {
      console.log(`✅ Post updated successfully: ${post.title} (ID: ${post.id})`);
    },

    beforePostDelete: async (id: number) => {
      console.log(`🗑️ About to delete post ID: ${id}`);
      
      // Example: Backup post before deletion
      await backupPost(id);
    },

    afterPostDelete: async (id: number) => {
      console.log(`✅ Post deleted successfully: ID ${id}`);
    },

    // Auth hooks
    afterLogin: async (user: any) => {
      console.log(`👋 User logged in: ${user.username || user.email}`);
    },

    afterLogout: async (user: any) => {
      console.log(`👋 User logged out: ${user.username || user.email}`);
    }
  }
});

// Mock helper functions (in a real plugin, these would be actual implementations)

async function sendNotification(message: string): Promise<void> {
  // Mock notification service
  console.log(`📬 Notification: ${message}`);
  
  // In a real plugin, you might:
  // - Send email notifications
  // - Post to Slack/Discord
  // - Send webhooks
  // - Update external services
}

async function backupPost(id: number): Promise<void> {
  // Mock backup service
  console.log(`💾 Backing up post ID: ${id}`);
  
  // In a real plugin, you might:
  // - Save to external storage
  // - Create database backup
  // - Export to file
}
