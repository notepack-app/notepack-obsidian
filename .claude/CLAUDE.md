# Architecture

See [ARCHITECTURE.md](ARCHITECTURE.md) for full codebase architecture, file structure, data flow, key types, design patterns. Read before making structural changes.

# Follow Obsidian plugin guidelines

Obsidian plugin — follow all best-practice guidelines. Before enhancements, retrieve plugin guidelines at https://docs.obsidian.md/Plugins/Releasing/Plugin+guidelines and apply to code modifications.

# Coding best-practices

- After modifying JavaScript files run `pnpm run build` to verify build and `pnpm test` to verify operation.
- After modifications, keep ARCHITECTURE.md and README.md up-to-date