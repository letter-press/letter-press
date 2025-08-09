import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Letter-Press',
  description: 'Modern CMS with Plugin Architecture',
  
  // Set base path for GitHub Pages deployment
  // Update this to match your actual repository name
  base: '/letter-press/',
  
  themeConfig: {
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Plugin Development', link: '/Plugin-Development' },
      { text: 'API', link: '/API-Reference' },
      { text: 'All Docs', link: '/README' },
      { text: 'Quick Reference', link: '/QUICK_REFERENCE' }
    ],

    sidebar: [
      {
        text: 'Plugin Development',
        items: [
          { text: 'Plugin Development Guide', link: '/Plugin-Development' },
          { text: 'API Reference', link: '/API-Reference' }
        ]
      },
      {
        text: 'Getting Started',
        items: [
          { text: 'All Documentation', link: '/README' },
          { text: 'Architecture', link: '/Architecture' },
          { text: 'Deployment', link: '/Deployment' }
        ]
      },
      {
        text: 'Administration',
        items: [
          { text: 'Admin Dashboard', link: '/Admin-Dashboard' },
          { text: 'Authentication', link: '/Authentication-Middleware' },
          { text: 'Database Schema', link: '/Database-Schema' }
        ]
      },
      {
        text: 'Development',
        items: [
          { text: 'Query Optimization', link: '/Query-Optimization' }
        ]
      },
      {
        text: 'Support',
        items: [
          { text: 'Troubleshooting', link: '/Troubleshooting' },
          { text: 'Quick Reference', link: '/QUICK_REFERENCE' }
        ]
      }
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/your-username/letter-press' }
    ],

    search: {
      provider: 'local'
    },

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2025 Letter-Press CMS'
    }
  }
})