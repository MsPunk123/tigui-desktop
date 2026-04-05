# TigUI Desktop Developer Guide

This guide defines the standard architecture and coding boundaries for TigUI Desktop.

## 1) Folder Structure and Naming (Hybrid Standard)

The app follows a hybrid model:

- Renderer: feature-first.
- Main + preload: layer/infrastructure-first.
- Shared contracts: cross-process types/constants only.

Target structure:

```text
src/
  main/
    ipc/
      connections/
      system/
    services/
      <feature>/
    windows/
  preload/
    bridge/
  renderer/
    features/
      <feature>/
        components/
        hooks/
        services/
        state/
        types.ts
        constants.ts
        index.ts
    shared/
      components/
      state/
      utils/
      constants/
  shared/
    ipc/
      channels.ts
      bridge.ts
    <feature>/
      types.ts
      results.ts
      index.ts
```

Naming conventions:

- Files: kebab-case for utilities and config files, PascalCase for React components.
- Features: domain names (`accounts`, `transfers`, `session`), not UI names (`table1`, `screenA`).
- Entry points: each feature exposes public API via `index.ts`.
- Keep `shared` contracts split by domain (`shared/connections`, `shared/transfers`, etc.); avoid adding unrelated types to a single file.

## 2) Process Boundaries and Dependency Rules

Boundary ownership:

- `main`: privileged runtime (OS/file/network/process/window lifecycle).
- `preload`: strict bridge; expose safe typed APIs to renderer.
- `renderer`: UI only; no direct Node/Electron access.
- `shared`: typed contracts/constants used across processes.

Allowed dependency direction:

- `renderer` -> `window.tigui` bridge methods.
- `preload` -> `shared` contracts and Electron APIs.
- `main` -> `shared` contracts and platform APIs.

Forbidden patterns:

- Direct `ipcRenderer` usage in renderer code.
- Direct imports from `electron` or Node built-ins in renderer code.
- Feature-to-feature direct imports (`features/a` importing from `features/b`).
- Duplicated IPC channel strings outside shared contracts.

## 3) Modular Design Rules

Local-first policy:

- If logic/state is used by one feature, keep it inside that feature folder.

Promote-to-shared policy:

- Promote only when reused by 2+ features and domain meaning is stable.
- Promote to `src/renderer/shared/state/<domain>.store.ts`.
- Shared stores must expose a public API (selectors/actions); internal state shape stays private.

Ownership policy:

- Every shared store has one domain owner (example: `session`).
- Features consume shared APIs, never internal implementation.
- Cross-feature imports are not allowed; use `renderer/shared` contracts instead.

## 4) Configuration Strategy and Environment Policy

Configuration rules:

- All configurable values must be declared in `.env.example`.
- Renderer-exposed environment variables must use `VITE_` prefix.
- Main/preload environment variables must not leak into renderer by default.
- Keep `@` alias resolution consistent across `vite.renderer.config.mts`, `vite.main.config.mts`, and `vite.preload.config.mts`.

Constants placement:

- Feature constants: `src/renderer/features/<feature>/constants.ts`.
- Renderer-wide constants: `src/renderer/shared/constants`.
- Cross-process constants: `src/shared/constants`.
- IPC names/types: `src/shared/ipc` (or equivalent under `src/shared`).

No magic values:

- Do not hardcode endpoints, ports, timeouts, limits, feature flags, channel names.
- Place values in config/constant modules and reference by name.

## 5) No-Hardcoding Standard

Default rule:

- Hardcoded business/infra values are not allowed in implementation code.

Allowed exceptions (must be documented inline with a short comment):

- Protocol-required literals and fixed framework requirements.
- Security-critical defaults required by Electron policy.
- Immutable one-time branding copy in UI.

Examples:

- Good: `const REQUEST_TIMEOUT_MS = appConfig.requestTimeoutMs;`
- Bad: `fetch(url, { timeout: 30000 })`
- Good: `ipcRenderer.invoke(IPC_CHANNELS.getAppVersion)`
- Bad: `ipcRenderer.invoke("app:get-version")`

## 6) Contribution and Review Checklist (Moderate Enforcement)

Merge-blocking checks:

- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`

Pre-commit:

- `lint-staged` must run from Husky pre-commit hook.

Non-blocking architecture checklist for each PR:

- [ ] Changes respect process boundaries (`main`, `preload`, `renderer`).
- [ ] Renderer has no direct Electron/Node imports.
- [ ] No feature-to-feature import coupling.
- [ ] Shared store promotion policy is respected.
- [ ] New config values are added to `.env.example`.
- [ ] No hardcoded endpoints/ports/timeouts/limits/channel strings.
- [ ] IPC additions update shared typed contracts before preload exposure.

## 7) Scalability Guardrails (Prevent God Files Early)

Module responsibility rules:

- One module should have one primary responsibility.
- Keep orchestration in one file and move validation/testing/persistence into focused modules.
- Prefer `hooks + mappers + components` split in renderer feature folders once a file starts mixing concerns.

File size guidance:

- Soft cap: ~150-200 LOC per module.
- If a file crosses the soft cap and has mixed responsibilities, split it before adding new feature logic.
- Exceptions: shared UI primitives, token files, and generated files.

Import hygiene:

- Use feature-local imports first; only promote to `renderer/shared` or `shared/*` when used by 2+ features.
- Keep compatibility wrappers small (single re-export), and avoid adding logic to wrapper files.

## 8) UI Design System and Consistency Rules

Primary stack:

- Tailwind + semantic CSS variables in `src/index.css` are the single source of truth for visual tokens.
- Shared primitives live in `src/renderer/shared/components/ui`.
- Feature code should consume primitives through `@/renderer/shared/components/ui`.
- All top-level renderer screens must compose through `AppShell` using a typed layout config contract.
- Use `lucide-react` as the standard icon library for renderer controls and status icons.
- `App.tsx` is the platform workbench owner (`routing + module registry + app layout composition`), not a feature page.
- Features must plug into app layout regions (sidebar/topbar/content) and must not own the global shell.
- Top-level module navigation must be URL-driven (`react-router-dom`) with module definitions registered in a typed module registry.

Component API conventions:

- Reusable controls expose `variant` and `size` props where practical.
- Prefer passing stronger props (`variant`, `size`, `pressed`, `disabled`, state attrs) to existing shared components before adding new primitives.
- Feature code should prefer component props over custom ad-hoc class overrides.
- `cn` from `@/renderer/shared/lib/cn` is the only class merge helper.

Style and accessibility conventions:

- Raw color literals (`#hex`, `rgb`, `hsl`) are allowed only in token files.
- Shared controls must include visible focus treatment and keyboard accessibility.
- Interactive controls should keep stable labels and semantics for testing (`role`, accessible name, `aria-*` where needed).
