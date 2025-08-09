import { definePlugin } from '@letter-press/plugin-sdk';

// Example plugin to demonstrate the plugin system
export default definePlugin({
  name: 'example-plugin',
  version: '1.0.0',
  description: 'An example plugin demonstrating various features',
  author: 'Letter-Press Team',

  activate: () => {
    console.log('🎉 Example plugin activated');
  },

  deactivate: () => {
    console.log('👋 Example plugin deactivated');
  },

  hooks: {
    beforePostCreate: (data) => {
      console.log('🔍 Example plugin: Processing before post creation', data.title);
      
      // Add a prefix to all post titles
      if (data.title && !data.title.startsWith('[Example]')) {
        data.title = `[Example] ${data.title}`;
        console.log('📝 Example plugin: Added prefix to title');
      }

      return data;
    },
    afterPostCreate: (post) => {
      console.log(`✅ Example plugin: Post created successfully: ${post.title}`);
      
      // Here you could:
      // - Send notifications
      // - Update external systems
      // - Trigger other workflows
    },
    /**
     * Hook called before updating a post
     * @param {number} id - The post ID
     * @param {any} data - The post data to update
     * @returns {any} Modified post data
     */
    beforePostUpdate: (id, data) => {
      console.log(`🔄 Example plugin: Processing post update for ID ${id}`);
      return data;
    },
    /**
     * Hook called after updating a post
     * @param {any} post - The updated post
     */
    afterPostUpdate: (post) => {
      console.log(`✅ Example plugin: Post updated successfully: ${post.title}`);
    },
    /**
     * Hook called before deleting a post
     * @param {number} id - The post ID to delete
     */
    beforePostDelete: (id) => {
      console.log(`🗑️ Example plugin: Preparing to delete post ID ${id}`);
      // Perform any cleanup or validation here
    },
    /**
     * Hook called after deleting a post
     * @param {number} id - The deleted post ID
     */
    afterPostDelete: (id) => {
      console.log(`✅ Example plugin: Post ${id} deleted successfully`);
    }
  },

  // Admin pages
  adminPages: [{
    title: 'Example Settings',
    path: '/admin/example',
    component: () => 'Example Plugin Admin Page',
    icon: '🎉'
  }],

  // Shortcodes
  shortcodes: [{
    name: 'hello',
    /**
     * Shortcode handler for [hello] shortcode
     * @param {Record<string, any>} attributes - Shortcode attributes
     * @returns {string} HTML output
     */
    handler: (attributes) => {
      const name = attributes.name || 'World';
      return `<p>Hello, ${name}!</p>`;
    },
    attributes: {
      name: {
        type: 'string',
        required: false,
        default: 'World'
      }
    }
  }, {
    name: 'highlight',
    /**
     * Shortcode handler for [highlight] shortcode
     * @param {Record<string, any>} attributes - Shortcode attributes
     * @param {string} content - Content to highlight
     * @returns {string} HTML output
     */
    handler: (attributes, content = '') => {
      const color = attributes.color || 'yellow';
      return `<mark style="background-color: ${color};">${content}</mark>`;
    },
    attributes: {
      color: {
        type: 'string',
        required: false,
        default: 'yellow'
      }
    }
  }],

  // Settings schema
  settings: {
    enableTitlePrefix: {
      type: 'boolean',
      label: 'Enable Title Prefix',
      description: 'Add [Example] prefix to all post titles',
      default: true
    },
    prefixText: {
      type: 'string',
      label: 'Prefix Text',
      description: 'Custom prefix text for titles',
      default: '[Example]'
    },
    notificationEmail: {
      type: 'email',
      label: 'Notification Email',
      description: 'Email to send notifications to',
      default: ''
    },
    debugMode: {
      type: 'boolean',
      label: 'Debug Mode',
      description: 'Enable debug logging',
      default: false
    }
  }
});
