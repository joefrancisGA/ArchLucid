# CIS security 01 — Real email-OTP bot challenge verifier (H-05)

> **Depends on:** PSS-01 seam (`IEmailOtpBotChallengeVerifier`, `Auth:EmailOtp:RequireBotChallenge`).  
> **Assessment:** `.local/owner/customer_identity_security_assessment.md` **H-05**.  
> **Blocks:** public self-service GREEN; weakens E1 when open signup is considered.

## Why

`PermissiveEmailOtpBotChallengeVerifier` only checks “token non-empty” when `RequireBotChallenge=true`. That is not anti-automation. Public self-service and open OTP endpoints remain farmable via scripted clients and IP rotation even with per-email/IP rate limits.

## Goal

Ship a **real** server-side bot challenge verifier (Cloudflare Turnstile preferred; hCaptcha acceptable) behind the existing interface, wire UI when a public site key is present, and keep customer messages neutral.

## Context (read first)

- `ArchLucid.Application/Identity/IEmailOtpBotChallengeVerifier.cs`
- `ArchLucid.Application/Identity/PermissiveEmailOtpBotChallengeVerifier.cs` — keep for tests / local default
- `ArchLucid.Application/Identity/EmailOtpAuthService.cs` — challenge path calls verifier
- `ArchLucid.Core/Configuration/EmailOtpAuthOptions.cs` — `RequireBotChallenge`
- DI: `ArchLucid.Host.Composition/Startup/ServiceCollectionExtensions.TenancyMeteringSecrets.cs`
- UI: `archlucid-ui/src/lib/auth/email-otp-api.ts`, sign-in / signup OTP forms
- Config docs: `docs/library/CONFIGURATION_REFERENCE.md`
- Assessment: H-05; gate Evidence **E1**

## What to build

### 1. Options

Add under `Auth:EmailOtp` (or nested section) without breaking existing keys:

- `RequireBotChallenge` (existing)
- `BotChallenge:Provider` — `None` | `Turnstile` | `HCaptcha` (or equivalent enum)
- `BotChallenge:SecretKey` — server secret (Key Vault / env only; never commit)
- `BotChallenge:SiteKey` — optional server copy for diagnostics; UI uses `NEXT_PUBLIC_*`

Normalize: when `RequireBotChallenge=true` and provider is not `None`, secret must be non-empty in production-like hosts (fail startup or fail closed on challenge).

### 2. Host-edge adapter

- Implement `TurnstileEmailOtpBotChallengeVerifier` (or generic `HttpBotChallengeVerifier`) that POSTs token to provider verify API.
- Register in DI: if `RequireBotChallenge` and provider configured → real verifier; else `PermissiveEmailOtpBotChallengeVerifier` (dev/tests).
- Timeouts, no raw token in logs; metric result `bot_challenge_failed` already exists on challenge path — keep using it.
- On failure: same **neutral** customer outcome as other soft denials (no CAPTCHA-specific enumeration).

### 3. UI

- When `NEXT_PUBLIC_TURNSTILE_SITE_KEY` (or chosen vendor) is set, render widget on email OTP challenge step and send `botChallengeToken`.
- When site key absent: do not advertise CAPTCHA; if API requires challenge, show buyer-safe “try again later / contact support” style message (no internal codes).
- Mirror optional Google OIDC advertising pattern (hide unless configured).

### 4. Docs

- Document keys in `CONFIGURATION_REFERENCE.md`.
- Note in `docs/runbooks/EMAIL_OTP_DELIVERY_AND_ABUSE.md`: enable `RequireBotChallenge` before public signup.

## Tests

- Unit: mock HTTP — invalid/missing token → verify false; valid stub response → true.
- Unit: `EmailOtpAuthService` with real verifier mock — denied when required and invalid; accepted when valid.
- Keep `Permissive*` for existing tests when challenge not required.
- Do **not** call live Turnstile/hCaptcha in CI.

## Acceptance criteria

- [ ] Production-capable verifier implements `IEmailOtpBotChallengeVerifier` with real provider protocol.
- [ ] Permissive stub remains for local/tests when challenge not required.
- [ ] UI sends token only when public site key present.
- [ ] Assessment H-05 → **FIXED**; gate note updated (E1 still needs drill).
- [ ] Anti-enumeration preserved.

## Non-goals

- Full WAF / bot management product.
- Enabling public signup.
- Replacing rate limits (complement, not substitute).

## Compile / verify scope

- `ArchLucid.Application`, `ArchLucid.Host.Composition`, `ArchLucid.Api` (if models change)
- `ArchLucid.Application.Tests` filter EmailOtp / BotChallenge
- UI vitest for OTP client token wiring when env mocked
