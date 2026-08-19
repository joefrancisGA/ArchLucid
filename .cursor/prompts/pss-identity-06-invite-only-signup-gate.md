# PSS identity 06 — Hard invite-only / public-signup kill switch (P0)

> **Depends on:** none. Strongly recommended before any “private beta” marketing claim.  
> **Assessment:** `.local/owner/public_self_service_identity_gate.md` §2 invite-only YELLOW / §6 item 6 / Evidence **E5**.

## Why

Copy and access-request UX imply private beta, but `/signup` and anonymous `POST /v1/register` remain available. Invite-only trial cannot be GREEN without a **server-enforced** switch that disables public registration/workspace self-create while preserving invitation redemption and founder/admin provisioning.

## Goal

Ship a configuration-gated **PublicSelfService** posture:

- `InviteOnly` (default for production-like): anonymous register + anonymous self-serve workspace create **disabled**; invites + SSO enterprise paths work.
- `PublicSelfService` (explicit opt-in): current open behavior (still subject to abuse controls from prompts 01–02).

UI must match API (no dead-end forms).

## Context (read first)

- `ArchLucid.Api/Controllers/RegistrationController.cs`
- `ArchLucid.Application/Identity/PostAuthBootstrapService.cs` — `CanCreateWorkspace` / create
- `archlucid-ui` marketing: `SignupForm.tsx`, `/signup`, `/get-started`, `access-request-copy.ts`, `buildPricingSignupHref`
- `NEXT_PUBLIC_STRIPE_TEAM_CHECKOUT_ENABLED` pattern — mirror for clarity (`is-public-stripe-team-checkout-enabled.ts`)
- Feature flag / options patterns in `ArchLucid.Core/Configuration`
- Invitation: `UserInvitationPublicController`, `InvitationAcceptPageClient`

## What to build

### 1. Server options

- Add e.g. `Trials:PublicSignupMode` = `InviteOnly` | `PublicSelfService` (names may match existing vocabulary if one exists — search before inventing).
- Production host default: **`InviteOnly`** (or fail-safe: if unset in Production → InviteOnly).
- Development default: allow PublicSelfService for local DX if needed, documented.

### 2. API enforcement

When `InviteOnly`:

- `POST /v1/register` → **404 or 403** with buyer-safe problem details (“Registration is by invitation. Request access.”) — pick one status and use consistently; prefer not advertising an open API.
- `PostAuthBootstrap` create-workspace for users **without** invitation context → denied with same message; **with** valid invitation → allowed to join/create per existing invite semantics.
- Admin `POST /v1/admin/tenants` (or equivalent) remains available for founder provisioning.
- Email OTP sign-in and invitation accept remain available.

### 3. UI enforcement

- `/signup` in InviteOnly: replace form with access-request CTA (reuse `/get-started` patterns), no client-only hide.
- Pricing / welcome CTAs: “Request access” not “Start evaluation” when InviteOnly.
- Drive UI from public config endpoint or build-time `NEXT_PUBLIC_PUBLIC_SIGNUP_MODE` **and** trust API as source of truth (defense in depth).

### 4. Tests + Evidence E5

- API tests: InviteOnly blocks register; PublicSelfService allows (rate-limited).
- API tests: invite accept still works in InviteOnly.
- UI unit tests: signup page renders access-request in InviteOnly.
- Document in `docs/library/CONFIGURATION_REFERENCE.md` (or equivalent).
- Short proof section in gate file / runbook: “flip flag → register 403 → invite still works.”

## Acceptance criteria

- [ ] Production-safe default is invite-only.
- [ ] Invites + admin provision work when public signup is off.
- [ ] Marketing UI cannot present a working open signup when API is InviteOnly.
- [ ] Evidence E5 checklist satisfied in PR description.
- [ ] Gate: Invite-only trial → **GREEN** (or YELLOW only if email delivery ops still open).

## Non-goals

- Enabling PublicSelfService in production in this PR.
- Stripe checkout flag changes.
- Redesigning the entire marketing funnel.

## Compile / verify scope

- Api + Application tests
- `archlucid-ui` vitest for signup/CTA
- `agent-compile-check.ps1` Api + Ui as needed
)
