# SD-09 — Bearer residual honesty until the BFF (do not implement IS-15)

**Do not fork IS-15.** **Do not fork ADR 0059** into a new ADR. **Do not implement** HttpOnly BFF, CSRF tokens, or Key Vault session material in this prompt. This file is the **career-defense residual** while Bearer still lives in `sessionStorage`: publish the residual where operators and buyers already look, and apply ADR 0059 **P0** (document + short access-token TTL in staging/prod config) if not already done.

## Goal

Trust-center (or the canonical identity residual doc) states that the architect SPA still stores access tokens in `sessionStorage` (XSS can steal the session) until IS-15’s BFF. Staging/prod access-token TTL is short per ADR 0059 P0. No customer chrome banner. CLI Bearer remains supported. Do not implement the BFF here.

## Why

Livelihoods depending on the sealed record cannot sit on an unpublished XSS = account-takeover story. Implementing the BFF is IS-15 (dedicated PR). Until that lands, silence is a casual-SPA posture.

## Context

- `docs/architecture/adrs/0059-spa-bff-http-only-session-plan.md` (still Proposed — leave Proposed until IS-15)
- `archlucid-ui/src/lib/oidc/session.ts` `sessionStorage.setItem` access/refresh/id tokens
- `docs/go-to-market/trust-center.md` / identity security narrative (honest residual, not a scare banner on every page)
- `docs/security/` identity assessment H-10 if that is the canonical residual home
- JWT TTL configuration (`CONFIGURATION_REFERENCE` auth token lifetime)
- `OidcTokenExpiryWarningGuard` / `SESSION_IDLE_WORKING_TIMEOUT_MS` — do not disable idle; do not lengthen Guided

## What to build

1. Confirm tokens still persist via `persistTokenResponse` / `sessionStorage`. If IS-15 already removed them on Working GA builds, this prompt is a no-op besides Status notes.
2. P0: one honest residual paragraph on the trust-center (or the existing identity residual doc) — XSS in the architect SPA can read the access token; mitigation is short TTL + IS-15 BFF; CLI Bearer is intentional.
3. P0: verify staging/prod access-token TTL is short enough that a stolen token dies inside the Working idle window documentation (do not invent a new timeout; cite the config key). If TTL is day-scale, shorten per ADR 0059 P0 — that is config, not a new session store.
4. Do not show an SRE “AI budget / Service Bus” style banner to architects. Do not put raw `sessionStorage` in customer chrome.
5. No Terraform session-encryption keys here (IS-15).

## Acceptance criteria

- A buyer/security reader can find the Bearer-in-sessionStorage residual without opening `oidc/session.ts`.
- Working idle remains 4 hours. Guided idle unchanged.
- CLI Bearer still documented as supported.
- IS-15 remains the implementation owner.

## Constraints

- Do not store refresh tokens in `localStorage`.
- Do not replace Entra/Google IdP cookies.
- Do not claim the SPA is XSS-safe.
