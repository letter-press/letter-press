# Letter-Press Monorepo

A modern monorepo setup for Letter-Press CMS using Turbo for build orchestration.

## Packages

- **`letter/`** - Main Letter-Press CMS application (SolidStart)
- **`letter-press-plugin-sdk/`** - Plugin development SDK
- **`Docs/`** - VitePress documentation (auto-deploys to GitHub Pages)

## Development

### Commands

```bash
# Build all packages
pnpm build

# Start development servers for all packages
pnpm dev

# Type check all packages
pnpm typecheck

# Clean build artifacts
pnpm clean

# Lint all packages
pnpm lint
```

### Package-specific commands

```bash
# Work with specific packages
pnpm dev:letter        # Start letter app dev server
pnpm build:letter      # Build letter app only
pnpm dev:sdk          # Start SDK in watch mode
pnpm build:sdk        # Build SDK only
```

### Plugin commands

```bash
# Plugin management (runs on letter package)
pnpm plugin:list      # List all plugins
pnpm plugin:health    # Check plugin health
pnpm plugin:reload    # Reload plugins
pnpm plugin:diagnostics # Plugin system diagnostics
```

## Workspace Setup

This is a pnpm workspace with Turbo for:
- ⚡ **Fast builds** with dependency graph optimization
- 🏗️ **Incremental builds** with intelligent caching
- 🔄 **Task orchestration** across packages
- 📦 **Package dependency management**

## Architecture

```
Letter-Press/
├── letter/                    # Main CMS app
│   ├── src/
│   ├── public/
│   └── package.json
├── letter-press-plugin-sdk/    # Plugin SDK
│   ├── src/
│   ├── dist/
│   └── package.json
├── turbo.json                 # Turbo configuration
├── pnpm-workspace.yaml        # Workspace definition
└── package.json              # Root workspace
```

## Development Workflow

1. **Install dependencies**: `pnpm install`
2. **Build SDK first**: `pnpm build:sdk` (letter app depends on it)
3. **Start development**: `pnpm dev`
4. **Work on features**: Edit code in any package
5. **Build everything**: `pnpm build`
6. **Type check**: `pnpm typecheck`

## Documentation

Documentation is built with VitePress and automatically deployed to GitHub Pages:

- **Local development**: `cd Docs && pnpm dev`
- **Build docs**: `cd Docs && pnpm build`
- **Auto-deployment**: Pushes to `main` with changes in `Docs/` trigger deployment
- **Manual deployment**: Use GitHub Actions workflow dispatch

See [`.github/DOCS_DEPLOYMENT.md`](.github/DOCS_DEPLOYMENT.md) for setup instructions.