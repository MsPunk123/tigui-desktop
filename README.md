# TigUI Desktop

Electron + React + TypeScript desktop foundation with secure defaults and typed IPC.

## Developer Standards

Architecture and coding standards are defined in [docs/DEVELOPER_GUIDE.md](docs/DEVELOPER_GUIDE.md).

## Stack

- Electron Forge + Vite
- React 19 + TypeScript
- Tailwind CSS + shadcn-style shared UI primitives
- ESLint + Prettier
- Vitest + Testing Library
- Husky + lint-staged

## Requirements

- Node.js 22.x (see `.nvmrc`)
- pnpm 10+

## Getting Started

```bash
pnpm install
pnpm dev
```

## Quality Checks

```bash
pnpm lint
pnpm typecheck
pnpm test
```

## Packaging

```bash
pnpm build
pnpm make
```

## Security Notes

- `contextIsolation` is enabled.
- `nodeIntegration` is disabled.
- `sandbox` is enabled.
- Renderer communicates with Electron only through `window.tigui` exposed by preload.
