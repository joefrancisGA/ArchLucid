# PSS identity 05 — Platform identity support runbooks (P0)

> **Depends on:** ideally after 01 and 04 so runbooks can link to real metrics/alerts and recovery drills.  
> **Assessment:** `.local/owner/public_self_service_identity_gate.md` §6 item 5 / Evidence **E4**.

## Why

Trial, SAML cert rotation, generic OIDC, and support-problem triage runbooks exist. The **new** platform identity plane (Email OTP, auth domains, linking, recovery grants, post-auth bootstrap) lacks a single support-facing procedure. Without it, controlled beta is founder-memory-only and public self-service is unsafe to operate.

## Goal

Ship a small set of **internal** runbooks + help-registry gating (internal-runbook tier) that a support operator can follow without reading the C# source.

## Context (read first)

- `docs/runbooks/SUPPORT_PROBLEM_REPORT_TRIAGE.md` — tone/structure to mirror
- `docs/runbooks/SAML_SP_CERTIFICATE_ROTATION_RUNBOOK.md`
- `docs/security/TRIAL_AUTH.md`, `docs/library/customer-facing/AUTHENTICATION_AND_SIGN_IN.md` (customer; do not duplicate secrets)
- `docs/library/TROUBLESHOOTING.md` — add index links
- Help registry / TB-735 pattern: internal-runbook contentKind + authority gate
- Audit event names in `AuditEventTypes.cs` (Identity.*)
- Controllers: Email OTP, post-auth bootstrap, tenant auth domains, platform recovery, invitations

## What to build

### 1. Runbooks (markdown under `docs/runbooks/`)

Create focused files (prefer separate files, cross-linked):

| File | Contents |
|------|----------|
| `PLATFORM_IDENTITY_SUPPORT.md` | Index: symptoms → which child runbook; severity; SLA pointer |
| `EMAIL_OTP_DELIVERY_AND_ABUSE.md` | User didn’t get code; delayed mail; rate limited; how to read audits/metrics; when to suspect ESP vs abuse; link to abuse drill |
| `PLATFORM_IDENTITY_SUPPORT.md` | Canonical index + body for auth domain SSO, recovery, identity linking, and E3 drill (former child runbooks merged 2026-08-02) |

Each runbook must include:

- Preconditions (auth mode JwtBearer, not DevelopmentBypass)
- Step-by-step
- “Safe customer words” vs internal checks
- App Insights / audit query sketches (reuse TB-329 tag style from support triage)
- Escalation to platform grant (who is allowed)

### 2. Product wiring

- Link from `TROUBLESHOOTING.md` and `SUPPORT_PROBLEM_REPORT_TRIAGE.md`.
- Register as **internal-runbook** help topics if the in-app help system is the chosen distribution — follow TB-735 gating (not buyer-visible).
- Do **not** put break-glass secrets or production connection strings in docs.

### 3. Evidence E4

- Add a one-page “dry run” checkbox at the bottom of `PLATFORM_IDENTITY_SUPPORT.md`: founder/support walks one OTP failure + one recovery scenario and signs date.
- PR can leave dry-run unchecked with “owner action”; code/docs still merge.

## Tests

- If help registry changed: existing gating tests must still pass; add slug → internal-only assertion.
- Docs-only: no compile required beyond link/check scripts if repo has `check_docs_coherence` for new paths.

## Acceptance criteria

- [ ] Five runbook surfaces exist and are cross-linked.
- [ ] Internal-only (not on public marketing or ungated `/help` for anonymous buyers).
- [ ] Gate file Operations rows updated; E4 marked docs-ready / dry-run pending as appropriate.

## Non-goals

- Replacing customer-facing `AUTHENTICATION_AND_SIGN_IN.md`.
- Building a full status page product.
- Executing the owner dry-run (owner action).

## Compile / verify scope

- Docs + help registry tests only unless code comments/references require Api touch
)
