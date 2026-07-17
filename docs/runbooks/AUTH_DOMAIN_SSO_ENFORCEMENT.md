# Auth domain SSO enforcement — support runbook

## Preconditions before enable

Use admin **Auth domains** UI readiness checklist (`GetEnforcementReadinessAsync`):

- Identity provider configured and active
- DNS domain verified
- Routing test passed
- Recovery administrators verified (when mode = SSO with recovery exception)

## Common failures

| Symptom | Check |
|---------|--------|
| Email OTP still offered for corporate domain | Domain not verified or enforcement not enabled |
| Users locked out | IdP misconfig; use recovery admin Email OTP or platform grant |
| Cannot enable enforcement | Missing recovery path for SSO-only mode |

## Diagnostics

- Tenant admin: Settings → Identity providers → Diagnostics
- CLI: `archlucid auth diagnostics` (when configured for environment)

## Drill

See [SSO_ENFORCEMENT_AND_RECOVERY_DRILL.md](SSO_ENFORCEMENT_AND_RECOVERY_DRILL.md).
