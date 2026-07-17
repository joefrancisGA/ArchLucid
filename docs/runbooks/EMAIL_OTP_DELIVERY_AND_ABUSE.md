# Email OTP delivery and abuse — support runbook

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

## Abuse drill

See [EMAIL_OTP_ABUSE_DRILL.md](EMAIL_OTP_ABUSE_DRILL.md).
