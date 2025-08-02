import { createPlugin } from '../src/index.js';

/**
 * Advanced Plugin Example using Fluent API
 * 
 * This example demonstrates:
 * - Fluent API usage
 * - Advanced settings
 * - Meta fields
 * - Shortcodes
 * - Admin pages
 * - External service integration
 */

// External service mock
interface AnalyticsService {
  track(event: string, data: any): Promise<void>;
  identify(userId: string, traits: any): Promise<void>;
}

class MockAnalyticsService implements AnalyticsService {
  private apiKey: string;
  
  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }
  
  async track(event: string, data: any): Promise<void> {
    console.log(`📊 Analytics: ${event}`, data);
  }
  
  async identify(userId: string, traits: any): Promise<void> {
    console.log(`👤 User identified: ${userId}`, traits);
  }
}

let analyticsService: AnalyticsService | null = null;

export default createPlugin()
  .configure({
    name: 'advanced-analytics-plugin',
    version: '2.1.0',
    description: 'Advanced analytics and content enhancement plugin',
    author: 'Analytics Team',
    license: 'MIT',
    homepage: 'https://github.com/letterpress/advanced-analytics-plugin',
    requiresDatabase: true,
    requiresAuth: true
  })
  
  // Plugin settings with validation
  .addSettings({
    analyticsApiKey: {
      type: 'string',
      label: 'Analytics API Key',
      description: 'Your analytics service API key',
      required: true,
      validation: (value: string) => {
        if (!/^[a-zA-Z0-9_-]{32,}$/.test(value)) {
          return 'API key must be at least 32 characters and contain only alphanumeric characters, hyphens, and underscores';
        }
        return true;
      }
    },
    trackingDomain: {
      type: 'url',
      label: 'Tracking Domain',
      description: 'Domain for analytics tracking',
      default: 'https://analytics.example.com',
      required: true
    },
    enableUserTracking: {
      type: 'boolean',
      label: 'Enable User Tracking',
      description: 'Track user behavior and interactions',
      default: true
    },
    samplingRate: {
      type: 'number',
      label: 'Sampling Rate',
      description: 'Percentage of events to track (1-100)',
      default: 100,
      min: 1,
      max: 100
    },
    trackingMode: {
      type: 'select',
      label: 'Tracking Mode',
      description: 'How to handle tracking data',
      options: [
        { label: 'Real-time', value: 'realtime' },
        { label: 'Batched', value: 'batch' },
        { label: 'Queued', value: 'queue' }
      ],
      default: 'realtime'
    },
    excludedPaths: {
      type: 'textarea',
      label: 'Excluded Paths',
      description: 'Paths to exclude from tracking (one per line)',
      default: '/admin\n/api\n/health'
    }
  })
  
  // Lifecycle methods
  .onInstall(async () => {
    console.log('🔧 Installing Advanced Analytics Plugin...');
    // Create database tables, initialize configs
  })
  
  .onActivate(async () => {
    console.log('✅ Advanced Analytics Plugin activated');
    
    // Initialize analytics service
    const settings = await getPluginSettings();
    if (settings.analyticsApiKey) {
      analyticsService = new MockAnalyticsService(settings.analyticsApiKey);
      console.log('📊 Analytics service initialized');
    }
  })
  
  .onDeactivate(async () => {
    console.log('⏸️ Advanced Analytics Plugin deactivated');
    analyticsService = null;
  })
  
  .onUninstall(async () => {
    console.log('🗑️ Uninstalling Advanced Analytics Plugin...');
    // Clean up database tables, remove files
  })
  
  // Server lifecycle hooks
  .onServerStart(async () => {
    console.log('🚀 Analytics plugin: Server started');
    
    // Start background tasks
    startPeriodicReporting();
  })
  
  .onServerStop(async () => {
    console.log('🛑 Analytics plugin: Server stopping');
    
    // Flush pending analytics data
    await flushAnalyticsData();
  })
  
  // Content hooks with analytics tracking
  .beforePostCreate(async (data: any) => {
    console.log(`📝 Analytics: About to create post "${data.title}"`);
    
    // Add analytics metadata
    data.analytics = {
      createdBy: 'advanced-analytics-plugin',
      createdAt: new Date().toISOString(),
      trackingEnabled: true
    };
    
    // Generate SEO-friendly slug if missing
    if (!data.slug && data.title) {
      data.slug = generateSlug(data.title);
    }
    
    return data;
  })
  
  .afterPostCreate(async (post: any) => {
    console.log(`✅ Analytics: Post created "${post.title}" (ID: ${post.id})`);
    
    if (analyticsService) {
      await analyticsService.track('post_created', {
        postId: post.id,
        title: post.title,
        author: post.author?.username,
        categories: post.categories,
        timestamp: new Date().toISOString()
      });
    }
  })
  
  .afterPostUpdate(async (post: any) => {
    if (analyticsService) {
      await analyticsService.track('post_updated', {
        postId: post.id,
        title: post.title,
        timestamp: new Date().toISOString()
      });
    }
  })
  
  // Auth hooks for user tracking
  .afterLogin(async (user: any) => {
    if (analyticsService) {
      await analyticsService.identify(user.id.toString(), {
        username: user.username,
        email: user.email,
        role: user.role,
        lastLogin: new Date().toISOString()
      });
      
      await analyticsService.track('user_login', {
        userId: user.id,
        timestamp: new Date().toISOString()
      });
    }
  })
  
  // Add custom meta fields
  .addMetaFields([
    {
      key: 'analytics_campaign',
      label: 'Marketing Campaign',
      type: 'text',
      description: 'Associated marketing campaign',
      group: 'analytics'
    },
    {
      key: 'analytics_source',
      label: 'Traffic Source',
      type: 'select',
      options: [
        { label: 'Organic', value: 'organic' },
        { label: 'Social Media', value: 'social' },
        { label: 'Email', value: 'email' },
        { label: 'Paid Ads', value: 'ads' }
      ],
      group: 'analytics'
    },
    {
      key: 'reading_time',
      label: 'Estimated Reading Time',
      type: 'number',
      description: 'Reading time in minutes (auto-calculated)',
      group: 'analytics'
    },
    {
      key: 'seo_score',
      label: 'SEO Score',
      type: 'number',
      description: 'SEO optimization score (0-100)',
      group: 'seo',
      validation: (value: number) => {
        if (value < 0 || value > 100) return 'SEO score must be between 0 and 100';
        return true;
      }
    }
  ])
  
  // Add shortcodes for analytics
  .addShortcode({
    name: 'analytics-event',
    description: 'Track custom analytics events',
    handler: (attributes, content) => {
      const eventName = attributes.event || 'custom_event';
      const eventData = JSON.parse(attributes.data || '{}');
      
      // Track the event
      if (analyticsService) {
        analyticsService.track(eventName, eventData);
      }
      
      return content || '';
    },
    attributes: {
      event: {
        type: 'string',
        required: true,
        description: 'Event name to track'
      },
      data: {
        type: 'string',
        required: false,
        description: 'JSON data to send with event'
      }
    }
  })
  
  .addShortcode({
    name: 'reading-progress',
    description: 'Add reading progress indicator',
    handler: (attributes) => {
      const style = attributes.style || 'bar';
      const color = attributes.color || '#007cba';
      
      return `
        <div class="reading-progress" data-style="${style}" data-color="${color}">
          <div class="reading-progress-indicator"></div>
        </div>
        <script>
          // Reading progress tracking script would go here
          console.log('Reading progress tracker initialized');
        </script>
      `;
    },
    attributes: {
      style: {
        type: 'string',
        description: 'Progress indicator style (bar, circle, percentage)',
        default: 'bar'
      },
      color: {
        type: 'string',
        description: 'Progress indicator color',
        default: '#007cba'
      }
    }
  })
  
  // Build the final plugin
  .build();

// Helper functions

async function getPluginSettings(): Promise<any> {
  // Mock getting settings from database
  return {
    analyticsApiKey: 'mock_api_key_12345',
    trackingDomain: 'https://analytics.example.com',
    enableUserTracking: true,
    samplingRate: 100,
    trackingMode: 'realtime'
  };
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

function startPeriodicReporting(): void {
  // Mock periodic reporting
  setInterval(() => {
    console.log('📊 Sending periodic analytics report...');
  }, 60000); // Every minute
}

async function flushAnalyticsData(): Promise<void> {
  console.log('📊 Flushing pending analytics data...');
  // Flush any pending analytics data
}
