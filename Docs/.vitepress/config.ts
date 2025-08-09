import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'LetterPress',
  description: 'A modern CMS built with SolidStart',
  base: '/letter-press/',
  
  head: [
    ['link', { rel: 'icon', href: '/letter-press/favicon.ico' }]
  ],

  themeConfig: {
    logo: '/letter-press/favicon.ico',
    
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Quick Start', link: '/QUICK_REFERENCE' },
      { text: 'API Reference', link: '/API-Reference' },
      { text: 'GitHub', link: 'https://github.com/letter-press/letter-press' }
    ],

    sidebar: [
      {
        text: 'Getting Started',
        items: [
          { text: 'Introduction', link: '/' },
          { text: 'Quick Reference', link: '/QUICK_REFERENCE' },
          { text: 'Deployment', link: '/Deployment' }
        ]
      },
      {
        text: 'Architecture',
        items: [
          { text: 'Overview', link: '/Architecture' },
          { text: 'Database Schema', link: '/Database-Schema' },
          { text: 'Authentication', link: '/Authentication-Middleware' }
        ]
      },
      {
        text: 'Features',
        items: [
          { text: 'Admin Dashboard', link: '/Admin-Dashboard' },
          { text: 'Plugin Development', link: '/Plugin-Development' },
          { text: 'Query Optimization', link: '/Query-Optimization' }
        ]
      },
      {
        text: 'Reference',
        items: [
          { text: 'API Reference', link: '/API-Reference' },
          { text: 'Troubleshooting', link: '/Troubleshooting' }
        ]
      }
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/letter-press/letter-press' }
    ],

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2025 LetterPress'
    },

    search: {
      provider: 'local'
    }
  }
})