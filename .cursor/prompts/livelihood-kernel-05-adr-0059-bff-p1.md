# LK-05 — ADR 0059 P1: HttpOnly BFF session (dual-mode)

**Do not paste `instrument-spine-15-session-survives-the-day.md`.** This file **supersedes IS-15 P1 execution**. **Do not fork SD-09** (honesty-until-BFF); after P1 lands, update that residual to “P1 dual-mode; JS Bearer deprecated.” **Do not fork PT-19 / RS-09** heartbeats (LK-07). **Dedicated PR.** Do not mix with LK-01–04 copy.

## Goal

Implement ADR 0059 **P1** for the architect workspace and set ADR 0059 **Status: Accepted** with implementation evidence (or Accepted when P1 is mergeable and P2 is an explicit follow-up in Consequences).

**P1:** The Next BFF proxy accepts an **HttpOnly, Secure, SameSite** session cookie **or** `Authorization: Bearer` (CLI/integrations unchanged). Working UI prefers the cookie path for same-origin `/api/proxy/*`. Document the residual: until P2, a Working build might still attach Bearer for migration — say so honestly. Session encryption material in Key Vault via **Terraform** (existing IaC modules). CSRF strategy named in the ADR update (SameSite + anti-forgery on mutating proxy routes — wiring may complete in LK-07 if this PR is already large; then LK-07 is required before calling P1 “done” for mutations).

Also **override** ADR 0059’s “A until public self-service gate is GREEN” for the **paying Working desk**: owner authorized not waiting on that gate.

## Why

Livelihoods depending on the sealed record cannot sit on XSS-exfiltratable Bearer tokens. Idle-only client logout is a casual SPA. IS-15 named this and left it as one underspecified prompt. SD-09 published the residual instead of fixing it.

## Context

- `docs/architecture/adrs/0059-spa-bff-http-only-session-plan.md` (Proposed → Accepted; do not rewrite history — add implementation section + Status)
- `docs/architecture/architecture_handbook/72-ui-bff-proxy-session.md`
- `archlucid-ui/src/app/api/proxy/[...path]/route.ts` + `archlucid-ui/src/lib/proxy/proxy-upstream-headers.ts` (today forwards browser `Authorization`)
- `archlucid-ui/src/lib/oidc/session.ts` `persistTokenResponse`
- `infra/terraform` Key Vault patterns
- CLI `archlucid` JwtBearer / API key
- ADR 0037 tenant isolation

## What to build

1. Dual-mode proxy: cookie session for browser same-origin; Bearer still valid for `/v1` from CLI and for the proxy when a Bearer is presented (migration). Do not send tokens to marketing anonymous paths (existing strip).
2. Issue the session cookie from the OIDC callback / sign-in success path (HttpOnly, Secure, SameSite=Lax or Strict — pick in Trade-offs; Lax is usually required for OIDC return). Encrypt at rest if the cookie holds refresh material.
3. Terraform: session encryption key in Key Vault; no secrets in repo. All SQL for a session store, if any, in that database’s single DDL file. Prefer encrypted cookie over a new table unless size forces a store.
4. Tests: proxy still forwards CLI-shaped Bearer; browser happy-path can authenticate via cookie; marketing paths stay unprivileged. Scoped compile if C# changes.
5. ADR 0059 Status Accepted (or Proposed with P1 evidence and P2 follow-up — prefer Accepted when P1 is real). Trust-center residual: dual-mode until LK-06.

## Acceptance criteria

- A reviewer can describe how the browser session is stored without reading `sessionStorage` as the GA design.
- CLI Bearer/API key still authenticates to `/v1`.
- No secrets committed. Session keys are Terraform + Key Vault.
- 4h Working idle is not removed (enforcement may still be client until LK-07).

## Constraints

- Do not replace Entra/Google IdP cookies (ADR 0059 non-goal).
- Do not store refresh tokens in `localStorage`.
- Do not disable Guided/demo auth.
- Do not mix this PR with density/copy work.
