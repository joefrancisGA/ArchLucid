# PSS identity 07 — Auth error customer safety (P0 hard-blocker row)

> **Depends on:** none; complements 01 (OTP messages) and 06 (signup posture).  
> **Assessment:** `.local/owner/public_self_service_identity_gate.md` §3 “authentication errors expose internals” / `.local/owner/signup_verify_assessment.md` (62/100).

## Why

OTP failures are mostly mapped to buyer-safe copy, but `/signup/verify` still has misleading “session expired” / conflated delivery states, and residual risk remains that API problem details or IdP callback errors leak internals. Public self-service must not show stack traces, SQL, correlation internals, or raw OIDC/SAML payloads.

## Goal

Audit and harden **all customer-visible auth/signup/callback/bootstrap error paths** so failures are understandable, accurate, and non-leaky; close the highest-severity signup verify defects from the owner assessment.

## Context (read first)

- `.local/owner/signup_verify_assessment.md` — defect list and phases
- `archlucid-ui/src/app/(marketing)/signup/verify/*`
- `archlucid-ui/src/lib/signup-verify-*.ts`
- `archlucid-ui/src/lib/auth/sign-in-page-copy.ts` — `mapEmailOtpFailureToCustomerMessage`
- `archlucid-ui/src/lib/auth/buyer-safe-auth-messages.ts` (or equivalent)
- Callback: `CallbackClient.tsx`, `AuthCallbackAccessPanel.tsx`, `/auth/session-expired`
- API: Email OTP + Registration + PostAuthBootstrap problem details shaping
- Report Problem surfaces (TB-782+) — ensure auth errors offer support without dumping internals

## What to build

### 1. Inventory (PR description table)

List every user-visible auth error string/source:

- Sign-in OTP
- Sign-in SSO redirect failures
- OIDC/SAML callback
- Signup + signup verify
- Invitation accept mismatch
- Post-auth bootstrap / create workspace denies

Mark each: Safe / Needs fix.

### 2. Fixes (priority order from signup_verify_assessment)

At minimum:

- Replace misleading “session expired” on missing `sessionStorage` with accurate copy (“We lost the signup handoff on this device”).
- Separate **delivery failed** vs **verification still pending** vs **rate limited**.
- Ensure resend path does not claim success when API/ESP failed.
- Map unknown API errors to generic safe copy; log details server-side / Report Problem reference only.

### 3. API hygiene

- Confirm anonymous auth endpoints never return `exception.Message`, stack traces, or SQL in production problem details.
- Add/adjust regression tests that force a failure and assert body has no forbidden substrings (reuse any existing buyer-safety test helpers).

### 4. Tests

- Vitest for signup verify phase copy and state transitions.
- Vitest/API tests for forbidden internal leakage patterns on auth errors.
- Keep `mapEmailOtpFailureToCustomerMessage` exhaustive (`never` default) if categories change.

## Acceptance criteria

- [ ] Signup verify owner score issues called out as fixed or explicitly deferred with reason.
- [ ] No customer-visible auth path returns raw exception/IdP XML/JSON.
- [ ] Errors remain actionable (what to do next).
- [ ] Gate hard-blocker “auth errors expose internals” → Proven or Partially proven with only P2 residuals.

## Non-goals

- Full marketing redesign of `/signup`.
- Mobile responsive audit (P1 separate).
- Changing SSO product rules (see prompt 04).

## Compile / verify scope

- `archlucid-ui` vitest for touched auth/signup files
- Api tests if problem details changed
)
