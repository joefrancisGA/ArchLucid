# PSS identity 01 — Email OTP abuse controls (P0)

> **Depends on:** none. **Blocks:** public self-service GREEN.  
> **Assessment:** `.local/owner/public_self_service_identity_gate.md` §3 / §6 item 1 / Evidence **E1**.

## Why

`EmailOtpAuthService` already has per-email and per-IP hourly limits, resend cooldown, and neutral responses. That is **not** enough for open-internet self-service: there are no OTP-specific Prometheus/App Insights series, no alert rules, no optional bot challenge, and no measured flood drill artifact.

## Goal

Make email-code abuse **operationally detectable and resistible** at public scale without breaking legitimate sign-in or anti-enumeration.

## Context (read first)

- `ArchLucid.Application/Identity/EmailOtpAuthService.cs` — `IsRateLimitedForRequestAsync`, `NeutralResult`, delivery-failure audit
- `ArchLucid.Core/Configuration/EmailOtpAuthOptions.cs` — defaults (5/email/hr, 20/IP/hr, 45s resend)
- `ArchLucid.Api/Controllers/Auth/EmailOtpAuthController.cs`
- `ArchLucid.Core/Audit/AuditEventTypes.cs` — `EmailOtpRateLimitTriggered`, `EmailOtpSuspiciousBehaviorDetected`
- `ArchLucid.Core/Diagnostics/ArchLucidInstrumentation.cs` — pattern for counters (trial funnel)
- `infra/prometheus/archlucid-alerts.yml` — existing `archlucid_trial_signup_failures_total` pattern
- `docs/library/OBSERVABILITY.md` — where to document new series
- UI: `archlucid-ui/src/lib/auth/email-otp-api.ts`, `mapEmailOtpFailureToCustomerMessage`

## What to build

### 1. Metrics

Emit durable counters (or equivalent App Insights customMetrics if that is the host pattern) for at least:

- `email_otp_challenge_requested_total` (result: accepted | rate_limited | sso_required | disabled | invalid_email)
- `email_otp_challenge_verified_total` (result: success | invalid | expired | rate_limited)
- `email_otp_delivery_failed_total`
- `email_otp_rate_limit_triggered_total` (scope: email | ip)

Dimensions must **not** include raw email. Use existing `EmailOtpCorrelationFingerprint` / hashed IP patterns already used in audit.

### 2. Alerts

Add Prometheus (or App Insights) alert rules for:

- Sustained rate-limit trigger rate above a documented threshold
- Delivery-failure spike
- Challenge request surge vs verify success collapse (abuse / ESP outage signal)

Document thresholds and runbook link in `docs/library/OBSERVABILITY.md` (or sibling).

### 3. Optional bot challenge (config-gated, default off for beta)

- Add `Auth:EmailOtp:RequireBotChallenge` (bool, default `false`) and a pluggable verifier interface (e.g. Turnstile/hCaptcha token on challenge request).
- When enabled: reject missing/invalid tokens with the **same neutral customer message** as other soft failures (no enumeration).
- Wire UI to send the token only when a public site key env is present (`NEXT_PUBLIC_*`), mirroring Google OIDC optional advertising.
- Do **not** hard-depend on a specific CAPTCHA vendor in core domain logic — keep adapter at API/host edge.

### 4. Abuse drill artifact

- Add `docs/runbooks/EMAIL_OTP_ABUSE_DRILL.md` (or under `docs/architecture/` if that matches load-drill docs) describing:
  - How to run a staging flood against challenge/verify
  - Expected rate-limit + alert fire
  - Pass/fail checklist for Evidence E1
- Optionally add a k6 or script stub under `scripts/load/` that exercises anonymous OTP challenge within safe staging limits (no production defaults that could mail-bomb).

### 5. Customer UX

- Ensure rate-limited and delivery-failed paths continue to use buyer-safe copy (`mapEmailOtpFailureToCustomerMessage`).
- If the API cannot distinguish delivery failure today on the client, improve the contract **without** revealing whether an account exists.

## Tests

- Unit: rate-limit increments metrics / audit (extend `EmailOtpAuthServiceTests`).
- Unit: bot challenge disabled → no token required; enabled → invalid token denied with neutral outcome.
- Alert rule YAML lint or existing infra test pattern if present.
- Do **not** send real email in CI.

## Acceptance criteria

- [ ] OTP abuse is visible in metrics + at least one alert rule committed.
- [ ] Bot challenge is config-gated default off, with adapter seam and UI hook when env set.
- [ ] Drill runbook exists with a clear E1 checklist.
- [ ] Anti-enumeration preserved (neutral responses).
- [ ] Gate file updated: Email-code abuse row → Partially proven or Proven with evidence links.

## Non-goals

- Replacing Email OTP with passwords.
- Full ESP webhook ingestion (can stub interface; full bounce pipeline is OK as follow-on if small).
- Changing default rate-limit numbers without documenting why (tuning OK if justified).

## Compile / verify scope

- `ArchLucid.Application.Tests` (identity)
- `ArchLucid.Api` if controller/options changed
- UI unit tests for optional captcha field when touched
- `.\scripts\ci\agent-compile-check.ps1` on touched projects
)
