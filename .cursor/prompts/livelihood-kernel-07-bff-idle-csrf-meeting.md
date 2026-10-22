# LK-07 — BFF idle, CSRF, and meeting keepalive

**Do not paste IS-15.** **Do not fork PT-19 / RS-09** for presenter/print *activity* heartbeats if they already exist — reuse them on the BFF session. This file finishes ADR 0059 operations: **idle is a session fact**, mutating `/api/proxy` is CSRF-safe, and a long ARB does not dump solely because access-token TTL is two minutes.

## Goal

1. Working idle (4h) is enforced with the BFF session (server or cookie expiry + server check), not only `session-idle-timeout.ts` in the browser. The client timer may remain as UX. Guided idle unchanged unless it shares the cookie — then document the timeout that actually applies.
2. Mutating `/api/proxy` routes require SameSite cookie plus anti-forgery (header or double-submit) so a foreign site cannot ride the session.
3. Presenter/print windows share activity so the opener does not idle-out mid-meeting (reuse PT-19). Token refresh happens in the BFF, not via JS-readable refresh tokens.

## Why

Client-only idle is a casual SPA. A professional four-hour architecture review board is the persona in R4. Dumping to `/auth/session-expired` because JWT TTL is shorter than the meeting is an evaluator defect. CSRF is the cost of HttpOnly cookies.

## Context

- ADR 0059 Constraints (CSRF)
- `session-idle-timeout.ts` / `SESSION_IDLE_WORKING_TIMEOUT_MS`
- `OidcTokenExpiryWarningGuard`
- Presenter elicitation (FD-01 / IS-11) — do not build a second loop; keep the window alive
- `archlucid-ui/src/app/api/proxy/[...path]/route.ts`
- LK-05/06 session cookie

## What to build

1. Sliding idle on the session (activity from UI heartbeat + presenter/print). After 4h Working inactivity, cookie is cleared and API mutations fail closed until re-auth.
2. Anti-forgery on POST/PUT/PATCH/DELETE proxy. Tests: cookie-less browser mutation rejected; forged origin without CSRF token rejected.
3. Meeting/print: reuse shared activity so opener does not idle-out. Do not lengthen Guided idle as a side effect.
4. Vitest + proxy tests named above. Terraform already has keys from LK-05 — do not invent a side channel.

## Acceptance criteria

- Presenter/print does not dump to session-expired solely because access-token TTL is shorter than the meeting.
- 4h Working idle remains; this is not “never log out.”
- CSRF tests fail closed on mutating proxy without the token.

## Constraints

- Do not replace Entra/Google IdP cookies.
- Do not invent live presence avatars.
- Do not disable SoD.
