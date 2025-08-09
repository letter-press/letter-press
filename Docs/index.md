---
layout: home

hero:
  name: "LetterPress"
  text: "Modern CMS Platform"
  tagline: "Type-safe content management built with SolidStart, Prisma, and Auth.js"
  actions:
    - theme: brand
      text: Get Started
      link: /QUICK_REFERENCE
    - theme: alt
      text: View on GitHub
      link: https://github.com/letter-press/letter-press

features:
  - title: Plugin Architecture
    details: Extensible hook system with content lifecycle, server events, and custom registrations
  - title: Type Safety
    details: Full TypeScript support from database to frontend with Prisma ORM
  - title: Modern Stack
    details: Built with SolidJS, SolidStart, and contemporary web standards
  - title: Admin Interface
    details: Real-time dashboard, block editor, user management, and plugin configuration
  - title: Performance Optimized
    details: Efficient queries, built-in caching, and minimal runtime overhead
  - title: Security First
    details: Role-based access control, secure authentication, and plugin sandboxing
---

## What is Letter-Press?

Letter-Press is designed for developers who want:
- **Type Safety**: Full TypeScript support from database to frontend
- **Performance**: Optimized queries and minimal runtime overhead  
- **Extensibility**: Rich plugin system with hooks and lifecycle management
- **Modern Stack**: Built with SolidJS, SolidStart, and contemporary web standards
- **Developer Experience**: Intuitive APIs, comprehensive tooling, and excellent documentation

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL database  
- pnpm (recommended)

### 5-Minute Setup
```bash
# 1. Clone and install
git clone <repo> && cd letter-press
pnpm install

# 2. Configure database
cp .env.example .env
# Edit .env with your database URL

# 3. Setup database
pnpm db:migrate

# 4. Start development
pnpm dev
```

### First Steps
1. **Admin Setup**: Navigate to `http://localhost:3000/admin`
2. **Create Content**: Add your first post or page
3. **Explore Plugins**: Check out `/plugins` directory
4. **Customize**: Start with [Plugin Development](./Plugin-Development)

## Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | SolidJS + SolidStart | Reactive UI with SSR |
| **Styling** | Tailwind CSS | Utility-first CSS |
| **Backend** | Node.js + Server Functions | Type-safe server operations |
| **Database** | PostgreSQL + Prisma | Relational data with type safety |
| **Auth** | Auth.js | Multi-provider authentication |
| **Plugins** | Custom System | Extensible architecture |