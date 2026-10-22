> **Scope:** Email OTP delivery failures, abuse response, and staging abuse-drill (Evidence E1).

> **Spine doc:** [`START_HERE.md`](../START_HERE.md).

# Email OTP delivery and abuse — support runbook

**Last reviewed:** 2026-07-21

**Prerequisites:** JwtBearer auth mode (not DevelopmentBypass). App Insights or Prometheus access.

## Symptoms

- User reports no sign-in code
- Sustained `archlucid_email_otp_rate_limit_triggered_total` alerts
- `archlucid_email_otp_delivery_failed_total` spike

## Steps

1. Find audit events: `Identity.EmailOtpCodeRequested`, `Identity.EmailOtpCodeSent`, `Identity.EmailOtpSuspiciousBehaviorDetected` (reason `email_delivery_failed`), `Identity.EmailOtpRateLimitTriggered`.
2. Check metrics: `archlucid_email_otp_challenge_requested_total{result="rate_limited"}`, delivery_failed counter.
3. If delivery failure: verify ESP/notifier configuration; check spam suppression; do **not** reveal whether the email exists in the product UI.
4. If abuse: confirm rate limits firing; review IP hash scope `ip_request_hourly`; escalate to enable `Auth:EmailOtp:RequireBotChallenge` if farm continues.
5. Customer-safe words: "Wait a few minutes and request a new code" / "Check spam folder."

## Production checklist (before open OTP / public signup)

- [ ] `Auth:EmailOtp:HashPepper` ≥ 32 characters from Key Vault / env (`Auth__EmailOtp__HashPepper`)
- [ ] `Auth:EmailOtp:RequireBotChallenge=true` with `BotChallenge:Provider=Turnstile` and secret configured
- [ ] UI `NEXT_PUBLIC_TURNSTILE_SITE_KEY` set to the matching site key
- [ ] Rate-limit and delivery-failed alerts wired (see [OBSERVABILITY.md](../library/OBSERVABILITY.md))

## Abuse drill (Evidence E1)

**Environment:** staging only. **Do not** run against production.

### Goal

Prove rate limits, metrics, and alerts respond to anonymous OTP challenge flood — and that challenge responses stay buyer-safe (no stack traces / internals).

### Artifacts

| Artifact | Role |
|----------|------|
| `scripts/load/email-otp-challenge-flood.js` | k6 flood + body leak checks |
| `scripts/load/email-otp-challenge-stub.js` | Compatibility alias → flood script |
| `scripts/load/self-service-trial-farm-stub.js` | Optional registration farm (PublicSelfService only) |
| `scripts/ci/run_email_otp_abuse_drill.ps1` | Local/CI harness (unit flood proof + optional k6) |
| `ArchLucid.Application.Tests` `RequestCodeAsync_flood_*` | In-process rate-limit proof (always runnable) |

### Preconditions (bot challenge)

- [ ] `Auth:EmailOtp:RequireBotChallenge=true`
- [ ] `Auth:EmailOtp:BotChallenge:Provider=Turnstile` with secret in Key Vault / env
- [ ] `NEXT_PUBLIC_TURNSTILE_SITE_KEY` set on UI (for browser path)
- [ ] `Auth:EmailOtp:HashPepper` configured (≥ 32 chars)

### Procedure

#### A. Always (local / CI) — unit flood proof

```powershell
.\scripts\ci\run_email_otp_abuse_drill.ps1 -SkipK6 -WriteEvidenceStub
```

Pass when `RequestCodeAsync_flood_rate_limits_same_email_burst` and `RequestCodeAsync_flood_rate_limits_shared_ip_across_emails` succeed.

#### B. Staging k6 flood

1. Configure staging with `Auth:EmailOtp:Enabled=true` and notifier stub/disabled outbound mail if available.
2. Scripted challenge **without** bot token → expect neutral denial / rate limit; no code sent.
3. Browser path with valid Turnstile → challenge succeeds (delivery stub OK).
4. Run:

```powershell
.\scripts\ci\run_email_otp_abuse_drill.ps1 `
  -BaseUrl 'https://YOUR-STAGING-API' `
  -ExpectBotChallenge `
  -Vus 5 `
  -Duration 2m `
  -WriteEvidenceStub
```

Or directly:

```text
k6 run scripts/load/email-otp-challenge-flood.js -e BASE_URL=https://YOUR-STAGING-API -e EXPECT_BOT_CHALLENGE=true -e VUS=5 -e DURATION=2m
```

5. Observe:
   - `archlucid_email_otp_challenge_requested_total{result="rate_limited"}` increases
   - `archlucid_email_otp_rate_limit_triggered_total` increases
   - `archlucid_email_otp_bot_challenge_failed` (or equivalent) visible when tokens missing/invalid
   - Alert `ArchLucidEmailOtpRateLimitHigh` fires (if Prometheus wired)
   - k6 `email_otp_challenge_body_safe` rate ≈ 1.0

#### C. Optional farm half

Only with `Auth:PublicSignup:Mode=PublicSelfService` for the drill window — see [`SELF_SERVICE_TRIAL_ABUSE_DRILL.md`](SELF_SERVICE_TRIAL_ABUSE_DRILL.md).

```powershell
.\scripts\ci\run_email_otp_abuse_drill.ps1 -BaseUrl 'https://YOUR-STAGING-API' -IncludeFarmStub -SkipUnitProof
```

### Pass criteria

- [ ] Rate limit triggers before unbounded challenge inserts (unit and/or k6)
- [ ] Missing/invalid bot challenge denied without CAPTCHA-specific enumeration (staging + `EXPECT_BOT_CHALLENGE=true`)
- [ ] No stack traces or internal errors returned to client (`body_safe` / unit message asserts)
- [ ] Customer message remains neutral on challenge endpoint
- [ ] Metrics visible in observability backend (staging)
- [ ] Alert `ArchLucidEmailOtpRateLimitHigh` observed or explicitly waived with reason

### Execution record

| Field | Value |
|-------|--------|
| Date | _pending_ |
| Environment | _staging_ |
| Operator | _name_ |
| Unit flood proof | _pass / fail_ |
| k6 flood | _pass / fail / skipped_ |
| Bot challenge enforced | _yes / no_ |
| Result | _pass / fail_ |
| Notes | _follow-ups_ |

Copy dated notes into `.local/owner/e1_abuse_drill_execution.md` when using `-WriteEvidenceStub`.

### Fail actions

- Tune `Auth:EmailOtp:MaxCodeRequestsPerEmailPerHour` / IP limits
- Confirm Turnstile secret/site key pairing and `RequireBotChallenge` before public signup
- If body leak checks fail, treat as P0 auth error safety regression before any signup mode change
