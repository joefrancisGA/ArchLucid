# PSS identity — platform identity support runbooks (index)

**Audience:** ArchLucid support / platform operators (internal).  
**Not buyer-facing.** Link from `docs/library/TROUBLESHOOTING.md` and `docs/runbooks/SUPPORT_PROBLEM_REPORT_TRIAGE.md`.

## Child runbooks

| Runbook | When to use |
|---------|-------------|
| [EMAIL_OTP_DELIVERY_AND_ABUSE.md](EMAIL_OTP_DELIVERY_AND_ABUSE.md) | Sign-in code not received, rate limits, abuse spikes |
| [AUTH_DOMAIN_SSO_ENFORCEMENT.md](AUTH_DOMAIN_SSO_ENFORCEMENT.md) | Domain verify, SSO enforce, routing test failures |
| [PLATFORM_AUTH_RECOVERY.md](PLATFORM_AUTH_RECOVERY.md) | Tenant lockout, recovery admin, platform grants |
| [IDENTITY_LINKING_SUPPORT.md](IDENTITY_LINKING_SUPPORT.md) | Disputed link, cannot add Microsoft/Google/email method |
| [SSO_ENFORCEMENT_AND_RECOVERY_DRILL.md](SSO_ENFORCEMENT_AND_RECOVERY_DRILL.md) | Staging drill checklist (Evidence E3) |
| [EMAIL_OTP_ABUSE_DRILL.md](EMAIL_OTP_ABUSE_DRILL.md) | Staging OTP flood drill (Evidence E1) |
| [SELF_SERVICE_TRIAL_ABUSE_DRILL.md](SELF_SERVICE_TRIAL_ABUSE_DRILL.md) | Trial farm drill (Evidence E1) |

## Dry-run sign-off (Evidence E4)

- [ ] Walked OTP delivery failure with audit lookup — date: ______ operator: ______
- [ ] Walked recovery-admin break-glass on staging tenant — date: ______ operator: ______
