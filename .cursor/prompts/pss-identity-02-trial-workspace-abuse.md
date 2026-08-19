# PSS identity 02 — Repeated trial / workspace creation abuse (P0)

> **Depends on:** none (can parallelize with 01 if conflicts avoided).  
> **Assessment:** `.local/owner/public_self_service_identity_gate.md` §3 / §6 item 2 / Evidence **E1**.

## Why

`PostAuthBootstrapService.CreateWorkspaceAsync` denies a second create when the user already has an active membership or active owned trial, and `POST /v1/register` is rate-limited. Attackers can still farm trials via many emails/slugs/IPs. Public self-service must not allow unbounded Free-tier workspace creation.

## Goal

Add a **durable anti-farm policy** at provision/create time that is explainable, auditable, and hard to bypass, without breaking legitimate invite acceptance or enterprise provisioning.

## Context (read first)

- `ArchLucid.Application/Identity/PostAuthBootstrapService.cs` — create-workspace denies, duplicate org hints, `HasActiveOwnedTrialAsync`
- `ArchLucid.Api/Controllers/RegistrationController.cs` — anonymous register
- `ArchLucid.Application/Tenancy/TrialTenantBootstrapService.cs` (and related)
- `ArchLucid.Application/Tenancy/TenantUsageStatusService.cs` — `workspacesLimit`
- `SelfServiceTrialAiBudgetPolicyProvisioner` — budget at bootstrap (keep)
- Email correlation: `EmailOtpCorrelationFingerprint` / any existing trial email fingerprint
- Commercial tier / trial seat tables if used for seat occupancy

## What to build

### 1. Policy design (state in PR)

Choose and implement a minimal viable policy (prefer simplest that closes the gate):

**Recommended MVP (combine):**

1. **Normalized email lifetime cap** — one successful self-serve trial/workspace create per normalized email (unless invitation token present or admin/platform grant).
2. **Email domain velocity** — soft/hard cap on distinct Free trials created from the same email domain per rolling window (exclude known consumer domains list: gmail.com, outlook.com, etc., or apply stricter IP+email caps for consumer domains).
3. **IP / ASN velocity** — extend registration + post-auth create rate limits with a shared abuse counter store (reuse existing rate-limit infrastructure if possible).
4. **Hard workspacesLimit on create** — enforce commercial `workspacesLimit` (and Free = 1) inside `CreateWorkspaceAsync` / provisioning, not only UI nudge.

Document trade-offs: false positives for consultants with many clients (mitigate via invitation or access-request path).

### 2. Implementation

- New focused service e.g. `ISelfServiceTrialAbusePolicy` (one class per file) called from:
  - anonymous registration (if still enabled)
  - `PostAuthBootstrapService.CreateWorkspaceAsync`
- On deny: buyer-safe message + audit event (new `AuditEventTypes` constant) with correlation fingerprints only.
- Invitation token and enterprise SSO-provisioned paths must **bypass** or use a different policy branch (invited users joining an existing tenant are not “new trial farms”).
- Persist enough state for lifetime email cap (table or reuse identity/user trial ownership) via numbered SQL migration in the single DDL pipeline.

### 3. Config

- `Auth:SelfServiceAbuse:*` or `Trials:Abuse:*` options: enabled, max trials per email, domain window limits, consumer-domain list.
- Default: **enabled** in Production; relaxed in Development.

### 4. Evidence artifact

- Short `docs/runbooks/SELF_SERVICE_TRIAL_ABUSE_DRILL.md`: how to attempt farm in staging and see denies + audits + metrics.
- Tie to Evidence E1 alongside OTP drill.

## Tests

- Unit: same email second self-serve create → denied.
- Unit: invitation accept / join existing workspace → allowed.
- Unit: workspacesLimit reached → denied with safe message.
- Unit: consumer-domain vs corporate-domain velocity behavior as designed.
- Regression: AI budget still provisioned on allowed create.

## Acceptance criteria

- [ ] Farming via multiple org slugs with one email is denied.
- [ ] Invite join path still works.
- [ ] Create path enforces workspace limit server-side.
- [ ] Audit + (optional) metrics for abuse denies.
- [ ] Gate file: workspace creation abuse → Proven or Partially proven with clear residual.

## Non-goals

- Full fraud ML / device fingerprinting vendors.
- Charging cards for CAPTCHA of payment (Stripe).
- Changing paid-tier seat billing.

## Compile / verify scope

- `ArchLucid.Application` + `.Tests`
- Persistence migration tests if the repo has them
- `agent-compile-check.ps1` on Application + Api
)
