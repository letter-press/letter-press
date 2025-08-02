This is a codebase for a CMS and plugin system. It includes various components for managing plugins, settings, and data tables. The code is written in TypeScript and uses Solid.js for the frontend.

The repo uses `turbo` for build optimization and monorepo management since it's a pnpm workspace.
Use `pnpm` for package management and command execution.
Use `npx` for running package scripts.

Currently there are the following packages:

- `letter`: The main CMS application.
- `letterpress-plugin-sdk` (@letterpress/plugin-sdk) : The types and utilities for building plugins (consumers) and also used as dependecy in `letter` package for types.

Keep the documentation up-to-date with the latest features and improvements.
Documentation is inside `Docs/` directory. The `Index.md` has a links to all documentation files.
Documentation is written in Github Markdown format.
Documentation should be clear, concise and descriptive, minimal in text and a has mermaid diagrams.

Code should always follow best practices and be type-safe.
Here are some guidelines:

- It should avoid using `any` type, and should use type-safe utilities from the library.
- It should use `tryCatch` utility for error handling. Functions should avoid throwing errors directly.
- Promises should be used for asynchronous operations, and should be handled with `await`.
- Use `Promise.all` for parallel operations when possible or use `Promise.allSettled` when clear error handling is needed.
- Use `import` statements for module imports, and avoid using `require`.
- Use best practices for `ssr` for SolidStart.
- Use `deferStream` when using `ssr` (server-side rendering).
- For exported functions that are not completely self-explanatory, add JSDoc comments to describe their purpose, parameters, and return values.
- Never create `legacy`, `old` or `deprecated` code. If a feature is no longer needed, it should be removed.
- Don't use placeholders for data or functions. Always provide real implementations or clear stubs.

### Practices for SolidStart

- Prefer fully server-side rendering.
- Don't use loaders for the base page component.

never return something like `result: boolean` use the `tryCatch` for it. We don't support JSON since we use SolidStart's remote procedures.
