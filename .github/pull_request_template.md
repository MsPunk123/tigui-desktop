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
