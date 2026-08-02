# CIS security 02 — Session / token revocation after identity removal (H-06)

> **Depends on:** none (orthogonal to bot challenge).  
> **Assessment:** `.local/owner/customer_identity_security_assessment.md` **H-06**.  
> **Blocks:** enterprise containment story; public self-service “stale session after unlink” risk.

## Why

Removing a sign-in method (`DisableIdentityAsync` / `RemoveSignInMethodAsync`) updates the identity row and audits, but outstanding JWTs (OIDC access/refresh, local trial JWTs) remain valid until natural expiry. Idle timeout now clears **client** storage (H-07), but a stolen Bearer still works server-side.

## Goal

Ensure that after security-relevant identity changes, previously issued access tokens for that user are rejected (or forced to re-auth) within a short, documented window — without inventing a full IdP product.

## Context (read first)

- `ArchLucid.Application/Identity/PlatformIdentityService.cs` — `DisableIdentityAsync`
- `ArchLucid.Application/Identity/AuthenticationIdentityLinkingService.cs` — `RemoveSignInMethodAsync`
- JWT validation / bearer pipeline in Api + Host.Composition
- Local trial JWT issuer (post-auth bootstrap) if used for OTP sessions
- `ArchLucid.Api/Auth/Services/RecentAuthenticationEvaluator.cs` — step-up pattern
- Assessment H-06; runbooks under `docs/runbooks/PLATFORM_IDENTITY_SUPPORT.md`

## Design choices (pick one; document trade-offs)

Prefer the **simplest viable** approach that reuses existing stores:

| Option | Idea | Trade-off |
|--------|------|-----------|
| **A. Auth version claim** | Persist `SecurityStamp` / `AuthVersion` on `PlatformUsers`; include in JWT; reject if stamp ≠ token claim | Needs claim on issue + check on every request; migrate OTP + OIDC resource-server paths that ArchLucid controls |
| **B. Denylist** | On disable, write `(jti|sub, expiresUtc)` to SQL/cache; middleware rejects matches | Good for targeted revocation; needs TTL cleanup |
| **C. Short access TTL + IdP refresh rotation** | Rely on IdP; document that ArchLucid cannot revoke Entra refresh tokens | Incomplete for local JWT / OTP-issued tokens |

**Minimum for this prompt:** cover tokens **issued by ArchLucid** (local trial JWT / email-OTP access tokens). For pure Entra-issued access tokens, document residual + recommend short TTL / Entra revoke APIs as ops follow-up.

## What to build

### 1. User security stamp (if Option A)

- Add `SecurityStamp` (or `AuthVersion` int/guid) on platform user — migration + in-memory/Dapper repos.
- Bump stamp on: `DisableIdentityAsync`, optional future: password/primary-email change, platform lock.
- When minting ArchLucid-issued JWTs, embed claim (e.g. `archlucid_auth_ver`).
- Validation middleware / JWT events: if user stamp ≠ claim → 401.

### 2. Or denylist (if Option B)

- Repository + migration; write on disable for current user’s active `jti` if available, or denylist `sub` until stamp epoch.
- Prefer stamp (A) if JWT already has stable `sub` = platform user id.

### 3. Wire identity removal

- After successful disable, bump stamp / denylist **before** returning success.
- Audit event for revocation (reuse or extend existing identity-removal audit).

### 4. Docs

- Short section in `docs/runbooks/PLATFORM_IDENTITY_SUPPORT.md` (§ Identity linking / Platform auth recovery): “after remove sign-in method, ArchLucid-issued tokens invalid; IdP refresh may still exist until IdP revoke.”

## Tests

- Unit: disable identity → subsequent validation with old stamp/version fails.
- Unit: mint after disable → new token with new stamp succeeds.
- Integration (if light API test harness exists): Bearer from before disable → 401 after disable.
- Do not require live Entra.

## Acceptance criteria

- [ ] ArchLucid-issued access tokens for a user are rejected after that user’s sign-in method is disabled (same request or next request).
- [ ] Residual for third-party IdP refresh tokens documented (not silent).
- [ ] Assessment H-06 → **FIXED** (or **Partially fixed** with explicit IdP residual accepted by owner).
- [ ] Gate hard-blocker note updated.

## Non-goals

- Full OIDC RP refresh-token family revocation at Entra.
- Changing idle-timeout UX (already clears client storage).
- Impersonation / support sessions.

## Compile / verify scope

- Persistence migration + Application Identity + Api JWT validation path
- `ArchLucid.Application.Tests` Identity + any Api auth tests touched
