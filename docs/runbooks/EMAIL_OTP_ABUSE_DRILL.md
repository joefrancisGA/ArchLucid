# Email OTP abuse drill (Evidence E1)

**Environment:** staging only. **Do not** run against production.

## Goal

Prove rate limits, metrics, and alerts respond to anonymous OTP challenge flood.

## Preconditions (bot challenge)

- [ ] `Auth:EmailOtp:RequireBotChallenge=true`
- [ ] `Auth:EmailOtp:BotChallenge:Provider=Turnstile` with secret in Key Vault / env
- [ ] `NEXT_PUBLIC_TURNSTILE_SITE_KEY` set on UI (for browser path)
- [ ] `Auth:EmailOtp:HashPepper` configured (≥ 32 chars)

## Procedure

1. Configure staging with `Auth:EmailOtp:Enabled=true` and notifier stub/disabled outbound mail if available.
2. Scripted challenge **without** bot token → expect neutral denial / rate limit; no code sent.
3. Browser path with valid Turnstile → challenge succeeds (delivery stub OK).
4. Run `scripts/load/email-otp-challenge-stub.js` with `--vus 5 --duration 2m` against staging base URL.
5. Observe:
   - `archlucid_email_otp_challenge_requested_total{result="rate_limited"}` increases
   - `archlucid_email_otp_rate_limit_triggered_total` increases
   - `archlucid_email_otp_bot_challenge_failed` (or equivalent) visible when tokens missing/invalid
   - Alert `ArchLucidEmailOtpRateLimitHigh` fires (if Prometheus wired)

## Pass criteria

- [ ] Rate limit triggers before unbounded challenge inserts
- [ ] Missing/invalid bot challenge denied without CAPTCHA-specific enumeration
- [ ] No stack traces or internal errors returned to client
- [ ] Customer message remains neutral on challenge endpoint
- [ ] Metrics visible in observability backend

## Execution record

| Field | Value |
|-------|--------|
| Date | _pending_ |
| Environment | _staging_ |
| Operator | _name_ |
| Result | _pass / fail_ |
| Notes | _follow-ups_ |

## Fail actions

- Tune `Auth:EmailOtp:MaxCodeRequestsPerEmailPerHour` / IP limits
- Confirm Turnstile secret/site key pairing and `RequireBotChallenge` before public signup
