# LK-06 — BFF P2: Working JS cannot read the access token

**Do not paste IS-15.** **Do not fork LK-05.** P1 dual-mode must exist or land in this PR if P1 was deferred only as a cookie issuer without UI cutover. This file is **P2 for the operator/Working bundle:** stop `persistTokenResponse` / `sessionStorage` token persistence so XSS cannot `sessionStorage.getItem` an access token.

## Goal

GA/Working operator builds do not write access, refresh, or id tokens to `sessionStorage`. Same-origin `/api/proxy/*` uses the HttpOnly session cookie. CLI and non-browser clients unchanged. Marketing paths stay stripped of privileged upstream auth. Tests in Working fixtures must not read tokens from `sessionStorage`.

## Why

P1 dual-mode still allows a migration Bearer. A livelihood desk that can be stolen by XSS is still a casual SPA. P2 is the load-bearing cutover.

## Context

- ADR 0059 P2
- `archlucid-ui/src/lib/oidc/session.ts` `persistTokenResponse`, `OIDC_ACCESS_TOKEN_KEY`
- `CallbackClient.tsx` / `PostAuthBootstrapClient.tsx` / sign-in flow `persistTokenResponse` call sites
- `proxy-upstream-headers.ts` — stop preferring browser Bearer on Working same-origin once cookie exists
- `archlucid-ui/src/lib/oidc/session.test.ts`
- Guided / demo: if they share the operator bundle, they take P2 too unless a documented eval exception remains — prefer one session mechanism; do not keep a second token store “for Guided convenience”

## What to build

1. Inventory every `persistTokenResponse` / `sessionStorage.setItem(OIDC_*TOKEN*)` call site. Working/operator bundle: delete persistence of token material. PKCE verifier/state may remain sessionStorage (short-lived, not the access token) — say so in comments.
2. `getAccessToken` / `ensureOidcBearerReady` for browser proxy calls become no-ops or cookie-only; do not attach Bearer from JS.
3. Vitest: after mock sign-in, `sessionStorage.getItem(OIDC_ACCESS_TOKEN_KEY)` is null on Working. Existing tests that set tokens must switch to cookie/header harness.
4. Trust-center: XSS residual for SPA Bearer is **closed** for Working GA; CLI Bearer remains intentional.

## Acceptance criteria

- A XSS payload in the operator SPA cannot read an access token from `sessionStorage` on a Working GA build.
- CLI `archlucid` still uses Bearer/API key against `/v1`.
- Sign-in, callback, and bootstrap still establish a working proxy session.

## Constraints

- Do not store refresh tokens in `localStorage`.
- Do not disable idle timeout (LK-07).
- Do not rewrite ADR 0059 body except Status / implementation evidence / Consequences follow-up close.
