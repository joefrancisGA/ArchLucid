# Platform auth recovery — support runbook

## Recovery paths

1. **Recovery administrator** — designated emails on enforced domain; Email OTP allowed when routing grants recovery bypass (audited `AuthDomainRecoveryBypassUsed`).
2. **Platform grant** — platform operator issues time-bound grant (`PlatformTenantAuthRecovery`); audited.

## Never

- Disable SSO enforcement without owner approval and audit note.
- Remove the last recovery administrator while enforcement is active (API blocks this).

## Lockout procedure

1. Confirm tenant Id and enforced domain.
2. Verify IdP outage vs misconfiguration (diagnostics).
3. If recovery admin available: guide user through Email OTP with recovery-capable address.
4. If not: platform grant per internal approval workflow; log ticket reference in audit actor.

## Drill

See [SSO_ENFORCEMENT_AND_RECOVERY_DRILL.md](SSO_ENFORCEMENT_AND_RECOVERY_DRILL.md).
