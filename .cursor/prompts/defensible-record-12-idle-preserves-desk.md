# DR-12 — Idle timeout preserves the desk (URL, scope, dirty work)

**Do not store Bearer in JS** (ADR 0059 P2). **Do not fork LK-07** idle lengths (4h Working / 1h Guided). **Do not fork PC-03.**

## Goal

On BFF idle expiry, `SessionIdleTimeoutGuard` currently `clearOidcSession()` + `clearOperatorScopeStorage()` then `/auth/session-expired`. That wipes **which workspace/project** the architect was in and does not restore the deep link after sign-in.

Working: persist **return URL** (existing safe-return helper) **and** operator scope ids in the BFF session or a non-token HttpOnly companion **before** clear. After re-auth, restore scope + the review/architecture URL. If a draft was dirty, existing livelihood document guards / autosave must run; if unsaved, show the conflict recovery (LK-12) — do not pretend the idle clear saved.

Keepalive already pulses on print/presenter — extend activity pulse to review-detail findings and draft editor (read paths), not only finalize.

## Why

An 8-hour day includes meetings. Losing scope mid-review is a casual SPA. The server run continues; the desk must come back.

## Context

- `session-idle-timeout.ts` / `SessionIdleTimeoutGuard.tsx`
- `clearOperatorScopeStorage`
- `consumePostSignInReturnUrl` / `isSafeReturnPath`
- `useOidcSessionKeepalive` / LK-07 `la` activity
- `use-livelihood-document-guards.tsx`

## What to build

1. Stop clearing operator scope until it is copied into the restore payload.
2. Session-expired page: “Continue where you left off” using safe return + scope restore.
3. Tests: idle → sign-in → lands on the same review path with scope; token never in sessionStorage.
4. Guided 1h idle unchanged.

## Acceptance criteria

- Working idle does not feel like “new browser profile.”
- XSS still cannot `sessionStorage.getItem` an access token.

## Constraints

- Terraform/Key Vault if cookie payload grows secrets. SameSite + CSRF already LK-07.
