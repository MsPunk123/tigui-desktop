## Summary

Describe what changed and why.

## Validation

- [ ] `pnpm lint`
- [ ] `pnpm typecheck`
- [ ] `pnpm test`

## Architecture and Standards Checklist (Non-blocking)

- [ ] Respects process boundaries (`main`, `preload`, `renderer`)
- [ ] Renderer does not import `electron` or Node built-ins directly
- [ ] No direct feature-to-feature coupling
- [ ] Shared store promotion policy is respected (local-first, promote when reused)
- [ ] New configuration values are added to `.env.example`
- [ ] No hardcoded endpoints/ports/timeouts/limits/channel strings
- [ ] IPC changes are added to shared typed contracts before preload exposure
- [ ] Shared controls are imported from `@/renderer/shared/components/ui` (no local duplicate Button/Input primitives)
- [ ] New UI uses semantic design tokens; raw color literals stay in `src/index.css` token definitions
- [ ] Component variants use standardized `variant` and `size` APIs where applicable
