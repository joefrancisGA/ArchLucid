> **Scope:** ArchLucid support / platform operators (internal) — auth domain SSO, lockout recovery, identity linking, and staging drills. Not buyer-facing.

# PSS identity — platform identity support

**Last reviewed:** 2026-08-02

**Audience:** ArchLucid support / platform operators (internal).  
Link from [`docs/library/TROUBLESHOOTING.md`](TROUBLESHOOTING.md) and [`SUPPORT_PROBLEM_REPORT_TRIAGE.md`](SUPPORT_PROBLEM_REPORT_TRIAGE.md).

## Quick index

| Topic | Section |
| --- | --- |
| Domain verify, SSO enforce, routing test failures | [Auth domain SSO enforcement](#auth-domain-sso-enforcement) |
| Tenant lockout, recovery admin, platform grants | [Platform auth recovery](#platform-auth-recovery) |
| Disputed link, cannot add Microsoft/Google/email method | [Identity linking](#identity-linking) |
| Staging drill checklist (Evidence E3) | [SSO enforcement and recovery drill](#sso-enforcement-and-recovery-drill-evidence-e3) |
| Sign-in code not received, rate limits, abuse spikes | [`EMAIL_OTP_DELIVERY_AND_ABUSE.md`](EMAIL_OTP_DELIVERY_AND_ABUSE.md) |
| Staging OTP flood drill (Evidence E1) | [`EMAIL_OTP_DELIVERY_AND_ABUSE.md#abuse-drill-evidence-e1`](EMAIL_OTP_DELIVERY_AND_ABUSE.md#abuse-drill-evidence-e1) |
| Trial farm drill (Evidence E1) | [`SELF_SERVICE_TRIAL_ABUSE_DRILL.md`](SELF_SERVICE_TRIAL_ABUSE_DRILL.md) |

## Auth domain SSO enforcement

### Preconditions before enable

Use admin **Auth domains** UI readiness checklist (`GetEnforcementReadinessAsync`):

- Identity provider configured and active
- DNS domain verified
- Routing test passed
- Recovery administrators verified (when mode = SSO with recovery exception)

### Common failures

| Symptom | Check |
|---------|--------|
| Email OTP still offered for corporate domain | Domain not verified or enforcement not enabled |
| Users locked out | IdP misconfig; use recovery admin Email OTP or platform grant |
| Cannot enable enforcement | Missing recovery path for SSO-only mode |

### Diagnostics

- Tenant admin: Settings → Identity providers → Diagnostics
- CLI: `archlucid auth diagnostics` (when configured for environment)

## Platform auth recovery

### Recovery paths

1. **Recovery administrator** — designated emails on enforced domain; Email OTP allowed when routing grants recovery bypass (audited `AuthDomainRecoveryBypassUsed`).
2. **Platform grant** — platform operator issues time-bound grant (`PlatformTenantAuthRecovery`); audited.

### Never

- Disable SSO enforcement without owner approval and audit note.
- Remove the last recovery administrator while enforcement is active (API blocks this).

### Lockout procedure

1. Confirm tenant Id and enforced domain.
2. Verify IdP outage vs misconfiguration (diagnostics).
3. If recovery admin available: guide user through Email OTP with recovery-capable address.
4. If not: platform grant per internal approval workflow; log ticket reference in audit actor.

## Identity linking

### Safe inspection

- Audit types: `Identity.AuthenticationIdentityLinkProposed`, `Confirmed`, `Failed`, `Cancelled`.
- Never link accounts based on email string match alone (product enforces external-key uniqueness).

### Disputed link

1. Confirm both platform user IDs and provider subjects from audit.
2. If external identity attached elsewhere: `IdentityAlreadyAttachedToAnotherUserException` — expected deny.
3. User must sign in with the provider that owns the subject, or cancel pending proposal.

### After removing a sign-in method

Disabling an authentication identity rotates `PlatformUsers.AuthVersion`. ArchLucid-issued access tokens (email OTP / local trial JWT) that embed `archlucid_auth_ver` are rejected on the next request when the claim no longer matches.

**Residual:** Third-party IdP refresh tokens (e.g. Entra) are not revoked by ArchLucid. Prefer short access TTLs and IdP revoke APIs when containment requires that path.

### Adversarial test map

See [`docs/security/IDENTITY_LINKING_ADVERSARIAL_SUITE.md`](../security/IDENTITY_LINKING_ADVERSARIAL_SUITE.md).

## SSO enforcement and recovery drill (Evidence E3)

**Environment:** staging tenant with test IdP.

### Checklist

1. [ ] Verify domain DNS TXT → routing test passes
2. [ ] Configure tenant IdP (SAML or OIDC) → activate
3. [ ] Add ≥2 recovery administrators; verify routing test for each
4. [ ] Enable SSO enforcement (recovery exception mode)
5. [ ] Attempt Email OTP for enforced domain → denied / SSO required
6. [ ] Sign in via IdP → success
7. [ ] Simulate IdP failure (bad metadata) → recovery admin Email OTP succeeds (audited bypass)
8. [ ] Attempt remove last recovery admin while enforced → **blocked**
9. [ ] Restore IdP → normal SSO works

Record: tenant ID, domain, audit event names, timestamps, operator.

## Dry-run sign-off (Evidence E4)

- [ ] Walked OTP delivery failure with audit lookup — date: ______ operator: ______
- [ ] Walked recovery-admin break-glass on staging tenant — date: ______ operator: ______
