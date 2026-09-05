# IS-15 — Session survives the day (ADR 0059 P1 then P2)

**Execution superseded (2026-09-05):** do **not** paste this file after wave 12 exists. Implement [`.cursor/prompts/livelihood-kernel-05-adr-0059-bff-p1.md`](livelihood-kernel-05-adr-0059-bff-p1.md), [`livelihood-kernel-06-bff-p2-no-js-bearer.md`](livelihood-kernel-06-bff-p2-no-js-bearer.md), and [`livelihood-kernel-07-bff-idle-csrf-meeting.md`](livelihood-kernel-07-bff-idle-csrf-meeting.md) instead. This file remains the historical IS pointer.

**Do not fork PT-19 / RS-09** for presenter/print activity heartbeats. Those keep idle from dumping a meeting while tokens stay in `sessionStorage`. This file is the load-bearing security bet: **implement ADR 0059** for the architect workspace so XSS cannot steal the Bearer and a long ARB does not depend on a two-minute expiry warning.

**Dedicated PR.** Do not mix with IS-01–14 copy/gate work.

## Goal

**P1:** Next BFF proxy accepts an **HttpOnly, Secure, SameSite** session cookie **or** Bearer (CLI/integrations unchanged). Working UI prefers cookie; JS cannot read the access token. **P2:** GA/Working builds stop `persistTokenResponse` / `sessionStorage` token persistence. Idle timeout remains (4h Working) but is enforced with the session, not only a client timer. CSRF: SameSite + anti-forgery on mutating `/api/proxy` routes. Session encryption keys in Key Vault via Terraform (existing IaC modules — do not invent a side channel).

## Why

Livelihoods depending on the sealed record cannot sit on XSS-exfiltratable Bearer tokens. Idle-only client logout is a casual SPA. ADR 0059 already chose B for GA; this wave authorizes doing it for the paying desk without waiting for a separate public-self-service gate.

## Context

- `docs/architecture/adrs/0059-spa-bff-http-only-session-plan.md`
- `docs/architecture/architecture_handbook/72-ui-bff-proxy-session.md`
- Next proxy / `archlucid-ui` auth (`persistTokenResponse`, sessionStorage)
- `session-idle-timeout.ts` / `OidcTokenExpiryWarningGuard`
- `infra/terraform` Key Vault patterns
- CLI and API JwtBearer must keep working

## What to build

1. Dual-mode proxy (P1): cookie session for browser same-origin; Bearer still valid for `/v1` from CLI. Document the residual until P2.
2. Working/production UI: stop writing tokens to sessionStorage (P2 for operator bundle). Marketing paths stay stripped of privileged upstream auth.
3. Meeting/print: reuse shared activity so opener does not idle-out (PT-19 leftover if still missing).
4. Terraform: session encryption material in Key Vault; no secrets in repo.
5. Tests: proxy rejects cookie-less browser mutation without CSRF token; CLI Bearer smoke unchanged; UI auth tests do not read tokens from sessionStorage in Working.

## Acceptance criteria

- A XSS payload in the operator SPA cannot `sessionStorage.getItem` an access token on a Working GA build.
- CLI `archlucid` still authenticates with Bearer/API key.
- Presenter/print does not dump to `/auth/session-expired` solely because the access token TTL is shorter than the meeting (heartbeat + BFF refresh).
- 4h Working idle remains; this is not “never log out.”

## Constraints

- Do not replace Entra/Google IdP cookies (ADR 0059 non-goal).
- Do not disable idle timeout globally.
- Do not store refresh tokens in localStorage.
- Tenant isolation unchanged.
