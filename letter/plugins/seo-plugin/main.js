import { definePlugin } from '@letterpress/plugin-sdk';

// SEO plugin that adds meta fields and improves SEO
export default definePlugin({
  name: 'seo-plugin',
  version: '1.0.0',
  description: 'SEO enhancements for posts and pages',
  author: 'CMS Team',

  activate: () => {
    console.log('🔍 SEO plugin activated');
  },

  hooks: {
    /**
     * Hook called before creating a post
     * @param {any} data - The post data
     * @returns {any} Modified post data
     */
    beforePostCreate: (data) => {
      // Auto-generate slug if not provided
      if (!data.slug && data.title) {
        data.slug = data.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '');
        console.log(`🔍 SEO plugin: Auto-generated slug: ${data.slug}`);
      }

      // Auto-generate excerpt if not provided
      if (!data.excerpt && data.content) {
        data.excerpt = data.content
          .replace(/<[^>]*>/g, '') // Strip HTML
          .substring(0, 155) + '...';
        console.log('🔍 SEO plugin: Auto-generated excerpt');
      }

      return data;
    },
    /**
     * Hook called after creating a post
     * @param {any} post - The created post
     */
    afterPostCreate: (post) => {
      console.log(`🔍 SEO plugin: Optimized post for SEO: ${post.title}`);
      
      // Here you could:
      // - Generate sitemap
      // - Submit to search engines
      // - Analyze content for SEO issues
      // - Generate structured data
    },
    /**
     * Hook called before updating a post
     * @param {number} id - The post ID
     * @param {any} data - The post data to update
     * @returns {any} Modified post data
     */
    beforePostUpdate: (id, data) => {
      // Update slug if title changed and no custom slug provided
      if (data.title && !data.slug) {
        data.slug = data.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '');
        console.log(`🔍 SEO plugin: Updated slug: ${data.slug}`);
      }

      return data;
    }
  },

  // Admin pages
  adminPages: [{
    title: 'SEO Settings',
    path: '/admin/seo',
    component: () => 'SEO Plugin Admin Page',
    icon: '🔍'
  }],

  // Shortcodes for SEO
  shortcodes: [{
    name: 'meta-description',
    /**
     * Shortcode handler for [meta-description] shortcode
     * @param {Record<string, any>} attributes - Shortcode attributes
     * @returns {string} HTML meta tag
     */
    handler: (attributes) => {
      const description = attributes.content || '';
      return `<meta name="description" content="${description}">`;
    },
    attributes: {
      content: {
        type: 'string',
        required: true,
        default: ''
      }
    }
  }, {
    name: 'canonical',
    /**
     * Shortcode handler for [canonical] shortcode
     * @param {Record<string, any>} attributes - Shortcode attributes
     * @returns {string} HTML canonical link tag
     */
    handler: (attributes) => {
      const url = attributes.url || '';
      return `<link rel="canonical" href="${url}">`;
    },
    attributes: {
      url: {
        type: 'string',
        required: true,
        default: ''
      }
    }
  }],

  // Settings schema
  settings: {
    defaultMetaDescription: {
      type: 'textarea',
      label: 'Default Meta Description',
      description: 'Default meta description for pages without one',
      default: 'Powered by LetterPress CMS'
    },
    enableOpenGraph: {
      type: 'boolean',
      label: 'Enable Open Graph',
      description: 'Add Open Graph meta tags',
      default: true
    },
    enableTwitterCards: {
      type: 'boolean',
      label: 'Enable Twitter Cards',
      description: 'Add Twitter Card meta tags',
      default: true
    },
    enableSitemap: {
      type: 'boolean',
      label: 'Enable Sitemap Generation',
      description: 'Automatically generate XML sitemap',
      default: true
    },
    enableStructuredData: {
      type: 'boolean',
      label: 'Enable Structured Data',
      description: 'Add JSON-LD structured data',
      default: true
    }
  }
});
