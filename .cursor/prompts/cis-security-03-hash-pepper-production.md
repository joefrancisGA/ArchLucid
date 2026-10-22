# CIS security 03 — Email OTP HashPepper required in production-like hosts (M-01)

> **Depends on:** none.  
> **Assessment:** `.local/owner/customer_identity_security_assessment.md` **M-01**.  
> **Blocks:** public self-service / production OTP if DB leak risk is in scope.

## Why

`EmailOtpCodeHasher` uses SHA-256 over `challengeId:code` with optional `Auth:EmailOtp:HashPepper`. Default empty pepper means a leaked `EmailOtpChallenges` row can be offline-bruteforced (10⁶ codes for 6-digit OTP) in seconds. Online limits do not help after DB compromise.

## Goal

Fail closed (or loudly prevent host start) when Email OTP is enabled in production-like environments without a non-empty pepper from secret store; document rotation; keep local/dev ergonomic.

## Context (read first)

- `ArchLucid.Core/Configuration/EmailOtpAuthOptions.cs` — `HashPepper`, `Normalize()`
- `ArchLucid.Application/Identity/EmailOtpCrypto.cs` (or hasher helper)
- Host environment classification: `HostEnvironmentClassification.IsProductionOrStagingLike` (or equivalent used elsewhere)
- Existing `ValidateOnStart` / options patterns in `ArchLucid.Host.Composition`
- `docs/library/CONFIGURATION_REFERENCE.md` — Auth:EmailOtp keys
- Assessment M-01

## What to build

### 1. Options validation

When **all** of the following are true:

- `Auth:EmailOtp:Enabled=true`
- Host is production-like (Production / Staging / `ARCHLUCID_ENVIRONMENT=Production` per existing classifier)

Then require `HashPepper` non-whitespace with a **minimum length** (e.g. ≥ 32 chars). Prefer `IValidateOptions<EmailOtpAuthOptions>` + `ValidateOnStart()`.

Development / unit tests: allow empty pepper (or use test pepper).

### 2. Secret guidance

- Document: pepper from Key Vault / env (`Auth__EmailOtp__HashPepper`), never appsettings committed secrets.
- Note: changing pepper invalidates in-flight challenges (acceptable; short TTL).

### 3. Optional hardening (only if cheap)

- Prefer keeping SHA-256 + pepper for this prompt; do **not** migrate to Argon2 unless already common in repo.
- Metric/log once at startup: “Email OTP hash pepper configured” (boolean only — never log pepper).

### 4. Docs

- `CONFIGURATION_REFERENCE.md` row: required when OTP enabled in prod-like.
- One line in `docs/runbooks/EMAIL_OTP_DELIVERY_AND_ABUSE.md` under production checklist.

## Tests

- Unit: validate options — prod-like + enabled + empty pepper → fails validation.
- Unit: enabled + pepper present → succeeds.
- Unit: Development + empty pepper → succeeds (or document test host overlay).
- Existing OTP hash tests continue to pass with explicit test pepper.

## Acceptance criteria

- [ ] Production-like host with OTP enabled cannot start (or rejects challenges) without HashPepper.
- [ ] Config reference + runbook updated.
- [ ] Assessment M-01 → **FIXED**.
- [ ] No pepper values in logs, tests fixtures, or committed appsettings.

## Non-goals

- Re-hashing historical challenges across pepper rotation.
- Changing code length or lifetime defaults.

## Compile / verify scope

- `ArchLucid.Core`, `ArchLucid.Host.Composition`
- Options validation unit tests (or Host.Composition.Tests if that is the pattern)
