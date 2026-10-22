# PC-03 — Execute HttpOnly BFF session (LK-05 → LK-06 → LK-07)

**This prompt executes existing files — do not rewrite them.** Paste in order:

1. `livelihood-kernel-05-adr-0059-bff-p1.md`
2. `livelihood-kernel-06-bff-p2-no-js-bearer.md`
3. `livelihood-kernel-07-bff-idle-csrf-meeting.md`

**Do not paste `instrument-spine-15-session-survives-the-day.md`.** **Dedicated PRs** — one per LK file if the combined diff is large.

## Goal

Working architect session survives an **all-day desk** and a **projector meeting** without XSS-readable Bearer in `sessionStorage`. CLI Bearer/API key unchanged. ADR 0059 **Accepted** with Terraform Key Vault session material.

## Why

`persistTokenResponse` in `archlucid-ui/src/lib/oidc/session.ts` is a consumer-SPA bet. Livelihoods depend on not losing authority mid-finalize and not exposing tokens to any injected script. Overlays (presenter quiet, keepalive hints) cannot fix storage.

## Acceptance criteria

- Same as LK-05, LK-06, LK-07 acceptance blocks in those files.
- After **06**, Working path does not require `sessionStorage` access token for API calls.
- After **07**, mutating proxy routes have CSRF + server-aware idle for long finalize/export.

## Constraints

- All infra in Terraform. No secrets in repo.
- Do not disable Guided/demo sign-in.
