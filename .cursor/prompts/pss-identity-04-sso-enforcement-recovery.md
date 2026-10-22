# PSS identity 04 — SSO enforcement + tenant recovery (P0)

> **Depends on:** prefer after 03 if linking/SSO interaction tests overlap.  
> **Assessment:** `.local/owner/public_self_service_identity_gate.md` §3 / §6 item 4 / Evidence **E3**.

## Why

Routine Email OTP bypass of SSO-enforced domains is blocked in `EmailOtpSignInDomainPolicyService` / `AuthSignInRoutingService`, and recovery-admin / platform-grant bypasses are audited. Missing: proof that **unauthorized** bypass is impossible under misconfig, and that recovery cannot **permanently lock out** a tenant (last recovery admin removed, IdP broken, no break-glass).

## Goal

1. Automated tests for SSO enforce + unauthorized bypass attempts.  
2. Hard guards so last recovery path cannot be destroyed without succession.  
3. A staging **drill script/checklist** that produces Evidence E3.

## Context (read first)

- `ArchLucid.Application/Identity/AuthSignInRoutingService.cs`
- `ArchLucid.Application/Identity/EmailOtpSignInDomainPolicyService.cs`
- `ArchLucid.Application/Identity/TenantAuthDomainAdminService.cs` — enforce SSO, last recovery admin warning
- `ArchLucid.Application/Identity/PlatformAuthRecoveryService.cs`
- `ArchLucid.Application/Identity/PostAuthBootstrapService.cs` — create blocked when `RequireEnterpriseSso`
- `ArchLucid.Application.Tests/Identity/*Domain*`, `PlatformAuthRecoveryServiceTests`, `EmailOtpAuthServiceTests`
- UI: `AuthDomainsPageClient.tsx` — enforcement confirmation
- Existing: `docs/runbooks/*SAML*`, `PRODUCTION_LIKE_AUTH_HANDOFF_CHECKLIST.md`

## What to build

### 1. Unauthorized bypass matrix (automated)

Named tests proving deny for enforced verified domain:

| Attempt | Expected |
|---------|----------|
| Email OTP challenge | `SsoRequired` / no code send |
| Email OTP verify (stale challenge) | deny |
| Post-auth create workspace with OTP identity | deny |
| Invitation for enforced domain without SSO (if product requires SSO for invite) | document actual product rule; test it |
| Recovery bypass without being recovery admin / platform grant | deny |
| Disable domain verification then OTP | define expected; prefer fail-closed if enforcement flag still on |

### 2. Lockout prevention

- Enforce in `TenantAuthDomainAdminService` (or recovery service): **cannot remove/disable the last recovery administrator** while `RequireEnterpriseSso` is true (upgrade warning to hard error if currently soft).
- Cannot enable `RequireEnterpriseSso` unless: domain verified + IdP configured + ≥1 recovery admin (or platform grant path documented).
- Audit all deny/enable decisions.

### 3. Drill checklist (Evidence E3)

Drill checklist lives in [`docs/runbooks/PLATFORM_IDENTITY_SUPPORT.md`](../../docs/runbooks/PLATFORM_IDENTITY_SUPPORT.md#sso-enforcement-and-recovery-drill-evidence-e3) (Evidence E3).

1. Verify domain → configure IdP → enable enforcement.  
2. Prove personal Email OTP blocked for that domain.  
3. Break IdP (or point to bad metadata) → prove recovery-admin Email OTP (or platform grant) still works.  
4. Attempt to delete last recovery admin → blocked.  
5. Restore IdP → normal SSO works.  
6. Record timestamps, tenant id, audit event names, operator.

Owner/staging execution may remain manual; the prompt must ship the checklist + any CLI hooks that make it repeatable (`archlucid auth diagnostics` if useful).

### 4. Minimal product fixes

Only fix gaps the matrix exposes. Do not invent a second recovery system.

## Tests

- All bypass matrix rows automated.
- Last-recovery-admin removal denied under enforcement.
- Enable enforcement preconditions tested.
- Extend existing in-memory IdP/domain fixtures.

## Acceptance criteria

- [ ] Unauthorized OTP bypass of enforced SSO is Proven denied by tests.
- [ ] Last recovery path cannot be deleted while SSO enforced.
- [ ] Drill runbook committed (E3); note “execution pending owner” if not run in this PR.
- [ ] Gate file SSO bypass + recovery lockout rows updated.

## Non-goals

- Full dynamic per-tenant OIDC authority rewrite (enterprise YELLOW residual — out of scope unless a tiny fix unblocks tests).
- Replacing host-level SAML.

## Compile / verify scope

- `ArchLucid.Application.Tests` Identity filter
- Api/admin controller tests if enforcement API changed
)
