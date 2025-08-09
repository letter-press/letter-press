# Letter-Press CMS Documentation

> **Quick Access**: [🏠 Home](/) | [🔌 Plugin Dev](./Plugin-Development.md) | [📖 API](./API-Reference.md) | [🚀 Deploy](./Deployment.md) | [❓ Help](./Troubleshooting.md)

Welcome to Letter-Press, a modern, type-safe content management system built with cutting-edge web technologies.

## 🔌 Plugin Development (Start Here!)

**Most developers start here** - Plugin development is the primary way to extend Letter-Press:

### Essential Plugin Resources
| Resource | Description | When to Use |
|----------|-------------|-------------|
| **[Plugin Development Guide](./Plugin-Development.md)** | Complete how-to with code examples | Creating your first plugin |
| **[API Reference](./API-Reference.md)** | All available hooks and functions | Looking up specific APIs |
| **[Troubleshooting](./Troubleshooting.md)** | Debug plugin issues | When things don't work |

### Quick Plugin Start
```bash
# 1. Create plugin directory
mkdir plugins/my-plugin && cd plugins/my-plugin

# 2. Create main.ts with Plugin class
# See: Plugin Development Guide for templates

# 3. Restart server to load plugin
pnpm dev
```

---

## 📚 Complete Documentation

### 🚀 Getting Started
| Document | Description | Audience |
|----------|-------------|----------|
| **[System Overview](/)** | Architecture, features, quick start | Everyone |
| **[Architecture Deep Dive](./Architecture.md)** | Technical details, performance, patterns | Developers, Architects |
| **[Deployment Guide](./Deployment.md)** | Production setup for all platforms | DevOps, Administrators |

### 🎛️ Administration
| Document | Description | Audience |
|----------|-------------|----------|
| **[Admin Dashboard](./Admin-Dashboard.md)** | Content management, user admin | Site Administrators |
| **[Authentication & Security](./Authentication-Middleware.md)** | Auth configuration, security | Administrators, DevOps |
| **[Database Schema](./Database-Schema.md)** | Table structure, relationships | Developers, DBAs |

### 💻 Development
| Document | Description | Audience |
|----------|-------------|----------|
| **[Plugin Development](./Plugin-Development.md)** | **Primary development guide** | Plugin Developers |
| **[API Reference](./API-Reference.md)** | Complete API documentation | All Developers |
| **[Query Optimization](./Query-Optimization.md)** | Database performance tuning | Backend Developers |

### 🔧 Support
| Document | Description | When to Use |
|----------|-------------|-------------|
| **[Troubleshooting](./Troubleshooting.md)** | Common issues, debugging | When you have problems |

---

## 🎯 Common Use Cases

### I want to...

**Create a Plugin**
1. [Plugin Development Guide](./Plugin-Development.md) - Complete walkthrough
2. [API Reference](./API-Reference.md) - Available hooks and functions

**Deploy to Production**  
1. [Deployment Guide](./Deployment.md) - All platforms covered
2. [Troubleshooting](./Troubleshooting.md) - If issues arise

**Manage Content**
1. [Admin Dashboard](./Admin-Dashboard.md) - Interface guide
2. [Authentication](./Authentication-Middleware.md) - User management

**Understand the System**
1. [System Overview](/) - High-level architecture
2. [Architecture](./Architecture.md) - Technical deep dive

**Optimize Performance**
1. [Query Optimization](./Query-Optimization.md) - Database tuning
2. [Architecture](./Architecture.md) - Performance patterns

**Fix Problems**
1. [Troubleshooting](./Troubleshooting.md) - Common issues
2. [Community Support](#-getting-help) - Ask for help

---

## 🚀 Quick Setup Guide

### 5-Minute Install
```bash
# Clone and setup
git clone <repo> && cd letter-press && pnpm install

# Configure database  
cp .env.example .env && nano .env

# Initialize and start
pnpm db:migrate && pnpm dev
```

### Next Steps
1. **Admin Setup**: Visit `http://localhost:3000/admin`
2. **Create Plugin**: Follow [Plugin Development Guide](./Plugin-Development.md)
3. **Deploy**: Use [Deployment Guide](./Deployment.md) when ready

---

## 💡 Getting Help

### Self-Service
- **Plugin Issues**: [Plugin Guide](./Plugin-Development.md) → [API Ref](./API-Reference.md) → [Troubleshooting](./Troubleshooting.md)
- **Deployment**: [Deployment Guide](./Deployment.md) → [Troubleshooting](./Troubleshooting.md)
- **Database**: [Schema](./Database-Schema.md) → [Optimization](./Query-Optimization.md)

### Community Support
- **GitHub Discussions**: Questions, feature requests, sharing
- **Discord Server**: Real-time help and community chat
- **Stack Overflow**: Tag with `letter-press-cms`

### Quick Links by Role

**Plugin Developer**
- [🔌 Plugin Development](./Plugin-Development.md)
- [📖 API Reference](./API-Reference.md) 
- [❓ Troubleshooting](./Troubleshooting.md)

**Site Administrator**
- [🎛️ Admin Dashboard](./Admin-Dashboard.md)
- [🔐 Authentication](./Authentication-Middleware.md)
- [🚀 Deployment](./Deployment.md)

**System Architect**
- [🏗️ Architecture](./Architecture.md)
- [🗄️ Database Schema](./Database-Schema.md)
- [⚡ Query Optimization](./Query-Optimization.md)

---

**Version**: 1.0.0 | **Updated**: August 9, 2025 | **[🏠 Back to Home](/)**