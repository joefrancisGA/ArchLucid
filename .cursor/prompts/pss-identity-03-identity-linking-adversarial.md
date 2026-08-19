# PSS identity 03 — Identity linking adversarial suite (P0)

> **Depends on:** none.  
> **Assessment:** `.local/owner/public_self_service_identity_gate.md` §3 / §6 item 3 / Evidence **E2**.

## Why

`AuthenticationIdentityLinkingService` uses proposals, OTP verification for email links, external-key uniqueness, and audits. Email match is explicitly “guidance only.” There is **no adversarial suite** proving account-takeover classes are closed. Public self-service stays RED until takeover is Proven absent under attack scenarios.

## Goal

Add a comprehensive automated adversarial test suite (and any minimal code fixes the suite reveals) so linking cannot steal an account or attach an attacker-controlled identity to a victim.

## Context (read first)

- `ArchLucid.Application/Identity/AuthenticationIdentityLinkingService.cs`
- `ArchLucid.Application.Tests/Identity/AuthenticationIdentityLinkingServiceTests.cs`
- `ArchLucid.Application.Tests/Identity/PlatformIdentityServiceTests.cs`
- `ArchLucid.Application/Identity/SignInMethodRemovalPolicyService.cs` — last-method / SSO rules
- Controllers under `ArchLucid.Api/Controllers/Auth/` for link challenge/confirm
- Migration `282_AuthenticationIdentityLinkProposals.sql` (name may vary — search)

## Attack scenarios to prove closed (each = named test)

Implement as unit/integration tests with clear names. For each: attacker goal, steps, expected deny + audit.

1. **Stolen OTP reuse** — completed challenge cannot be replayed; wrong user cannot complete another user’s challenge.
2. **Cross-account email claim** — user A cannot link email already bound as active identity on user B.
3. **External subject collision** — Microsoft/Google subject already on B cannot attach to A (409/safe error).
4. **Proposal swap / IDOR** — user A cannot confirm user B’s `proposalId`.
5. **Unverified email attach** — cannot create link from unverified external email when policy requires verified (cover both EmailOtp and external provider paths).
6. **Race: simultaneous confirm** — two confirms for same external key → one wins, one fails safely (no dual attach).
7. **Remove last sign-in method** — cannot leave user with zero recovery paths when SSO-enforced / policy forbids (align with `SignInMethodRemovalPolicyService`).
8. **Link then SSO bypass** — linking email OTP must not defeat `RequireEnterpriseSso` for enforced domains (coordinate with step 04 if needed; add failing test here if gap found).
9. **Stale proposal** — expired/canceled proposal cannot confirm.
10. **Actor mismatch** — confirm/cancel with wrong `userId` / actor rejected.

## What to build

### 1. Test suite

- Prefer extending `AuthenticationIdentityLinkingServiceTests` + controller tests if HTTP surface can IDOR.
- Use in-memory repos already in test project; add helpers rather than duplicating large arrange blocks.
- Where a scenario is **not** blocked today: **fix the service** with minimal change, then keep the test.

### 2. Fixes (only if tests fail)

- Tighten authorization on proposal confirm/cancel.
- Ensure external key uniqueness under concurrency (transaction/unique index — migration if missing).
- Never auto-link solely on email string match.

### 3. Evidence note

- Add `docs/security/IDENTITY_LINKING_ADVERSARIAL_SUITE.md` listing the 10 scenarios, mapping to test method names, and residual risks (if any).
- This file is the Evidence **E2** artifact.

## Tests

- All scenarios above automated and green.
- No test depends on real IdP or real email.

## Acceptance criteria

- [ ] Adversarial suite document + tests committed.
- [ ] Any gap found is fixed or explicitly residual with owner-accepted severity (default: fix P0 gaps).
- [ ] Gate file: identity linking takeover → **Proven** (or Partially proven only if residual is non-P0 and documented).

## Non-goals

- Full third-party pen test (TB-136).
- Redesigning the proposal UX.
- SCIM provisioning redesign.

## Compile / verify scope

- `ArchLucid.Application.Tests` (filter Identity)
- Api tests if controllers changed
)
