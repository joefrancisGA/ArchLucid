# Email OTP abuse drill (Evidence E1)

**Environment:** staging only. **Do not** run against production.

## Goal

Prove rate limits, metrics, and alerts respond to anonymous OTP challenge flood.

## Procedure

1. Configure staging with `Auth:EmailOtp:Enabled=true` and notifier stub/disabled outbound mail if available.
2. Run `scripts/load/email-otp-challenge-stub.js` with `--vus 5 --duration 2m` against staging base URL.
3. Observe:
   - `archlucid_email_otp_challenge_requested_total{result="rate_limited"}` increases
   - `archlucid_email_otp_rate_limit_triggered_total` increases
   - Alert `ArchLucidEmailOtpRateLimitHigh` fires (if Prometheus wired)

## Pass criteria

- [ ] Rate limit triggers before unbounded challenge inserts
- [ ] No stack traces or internal errors returned to client
- [ ] Customer message remains neutral on challenge endpoint
- [ ] Metrics visible in observability backend

## Fail actions

- Tune `Auth:EmailOtp:MaxCodeRequestsPerEmailPerHour` / IP limits
- Enable `Auth:EmailOtp:RequireBotChallenge` for open signup posture
