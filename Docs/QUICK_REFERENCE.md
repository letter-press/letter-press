# Documentation Quick Reference

## 🚀 Getting Started

```bash
# Work on documentation
cd Docs
pnpm dev

# Build and test
pnpm build
pnpm preview
```

## 📝 Writing Documentation

### File Structure
- Add new `.md` files in `/Docs/` directory
- Use clear, descriptive filenames
- Update navigation in `.vitepress/config.ts`

### Internal Links
```markdown
[Plugin Development](./Plugin-Development.md)
[API Reference](/API-Reference)
```

### Code Examples
````markdown
```typescript
import { definePlugin } from '@letter-press/plugin-sdk';

export default definePlugin({
  name: 'my-plugin',
  // ...
});
```
````

## 🔧 Configuration

### Add to Navigation
Edit `/Docs/.vitepress/config.ts`:

```typescript
nav: [
  { text: 'New Page', link: '/New-Page' }
],

sidebar: [
  {
    text: 'Section Name',
    items: [
      { text: 'New Page', link: '/New-Page' }
    ]
  }
]
```

### Update Base Path
For GitHub Pages deployment:

```typescript
export default defineConfig({
  base: '/your-repository-name/',
  // ...
})
```

## 🚀 Deployment

### Automatic
- Push changes to `main` branch
- GitHub Actions automatically builds and deploys
- Available at: `https://username.github.io/repository-name/`

### Manual
1. Go to repository **Actions** tab
2. Select **Deploy Documentation**
3. Click **Run workflow**

## 📋 Best Practices

### Writing
- ✅ Use clear, descriptive headings
- ✅ Include code examples
- ✅ Add table of contents for long pages
- ✅ Use consistent formatting
- ✅ Test all links

### Structure
- ✅ Group related content in sections
- ✅ Use logical navigation hierarchy
- ✅ Keep filenames consistent (kebab-case)
- ✅ Update both nav and sidebar

### Maintenance
- ✅ Keep documentation up-to-date with code changes
- ✅ Review and test before merging
- ✅ Check deployment after changes
- ✅ Monitor for broken links

## 🔗 Useful Links

- [VitePress Guide](https://vitepress.dev/guide/)
- [Markdown Syntax](https://www.markdownguide.org/basic-syntax/)
- [GitHub Actions Docs](https://docs.github.com/en/actions)