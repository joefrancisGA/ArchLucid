# Private-beta operator launch kit

**Scope:** Cursor-maintained operating contract for the controlled beta: invitation →
JwtBearer authentication → trusted tenant scope → first committed review. This is
an operator kit, not evidence that Gate 1, G-REAL-06, or G-REAL-07 has been
completed.

## Cut definition

The only success path for the first invite wave is:

1. Invite a named operator from the administration users surface.
2. Accept the invitation and establish a JwtBearer session.
3. Confirm the session resolves the intended tenant, workspace, project, and role.
4. Open the first-review path and create one review.
5. Wait for the committed golden manifest and at least one artifact.
6. Export the review package and retain the `runId`, `correlationId`, execution
   mode, and manifest verification result.

Everything else is deferred during the cut freeze. The path is exercised by
[`PRIVATE_BETA_TRUNK_SMOKE.md`](PRIVATE_BETA_TRUNK_SMOKE.md), while a real
staging witness remains the owner's Gate 1 action.

## Go / no-go preflight

| Check | Evidence | Owner | Cut decision |
| --- | --- | --- | --- |
| RC34 typecheck, push corset, OpenAPI, and beta wiring | Green RC34 Actions run | Cursor | No-go if red |
| JwtBearer invite path | `Operator UI: private-beta access-path (JwtBearer)` green; flaky tests are investigated, not ignored | Cursor | No-go on a hard failure |
| Recovery cases | Expired invite/session, wrong tenant, missing role, and dead deep link show a bounded recovery surface | Cursor + owner witness | No-go if blank or cross-tenant |
| Gate 1 | `ship-gate-evidence/{runId}/` from a staging smoke | Owner | Unknown until observed |
| Real proof | Three committed Real runs and proof packets | Owner | G4 remains HOLD until complete |
| Spend freeze | API and worker can be forced to Simulator in under five minutes | Owner | No-go if only one execution surface is covered |
| Support route | Report Problem reference, `correlationId`, and `runId` reach the support inbox | Cursor | No-go if support cannot correlate |
| Claims | Public copy passes the claim-boundary checks below | Cursor | Rewrite before sending |

## Access recovery checks

Run these as a separate recovery pass after the happy-path smoke. Use a fresh
test identity or a deliberately expired fixture; never use a customer token.

| Scenario | Expected result | Evidence to retain |
| --- | --- | --- |
| Expired invitation | Expired-invite explanation and request-support/reissue path; no authenticated tenant data | Screenshot or Playwright result |
| Expired session | Session-expired surface; sign-in returns to the intended route without a blank loop | Route, response status, `correlationId` |
| Wrong tenant | Scope denial or not-found behavior; no data from the requested tenant is rendered | Tenant/workspace ids and response status |
| Missing role | Forbidden/role explanation and support path; no mutation control is enabled | Role claim and visible recovery surface |
| Dead review deep link | Branded not-found state; no generic server error or cross-tenant fallback | URL, `runId`, response status |

The CI suite is a regression signal, not proof of a human staging witness. A
test that passes only on retry is recorded as flaky and remains a follow-up.

## Spend, rollback, and offboarding

Use [`PRIVATE_BETA_KILL_SWITCH_AND_SPEND_INVENTORY.md`](PRIVATE_BETA_KILL_SWITCH_AND_SPEND_INVENTORY.md)
as the operational source of truth.

### Spend paths

| Path | Existing control | Operator verification |
| --- | --- | --- |
| Real authority execute | Tenant budget and reservation | Set API and worker `AgentExecution__Mode=Simulator`; confirm a controlled request returns the mode/correlation response |
| Ask / explain | Same tenant budget decorators | Confirm it cannot reserve Real work after the freeze |
| Anonymous Quick Scan | `AnonymousExecutionEnabled=false`; sample-only | Confirm the response is sample-only |
| Invite email | Admin-only endpoint and provider limits | Confirm a denied/disabled sender produces an actionable admin error |
| Report Problem bundle | Consent-gated and size-capped | Confirm queue/flag failure is visible with a correlation id |
| Evidence and exports | Authenticated operator and tenant storage quota | Confirm existing committed exports remain available during an execution freeze |

### Rollback

Redeploy the last green API/worker image and UI artifact, restore the prior
configuration revision, and use forward-compatible database changes only.
Record the old and new revisions, UTC time, operator, and affected tenant
scope. Do not down-migrate production data as an incident shortcut.

### Single-tenant offboarding

1. Disable the tenant's users or SCIM access and revoke outstanding invites.
2. Set the tenant budget to zero or deny execution for that tenant.
3. Export the requested sponsor/audit package while access is authorized.
4. Apply the documented tombstone or hard-purge policy; sealed evidence and
   retention exceptions must be explained, not silently deleted.

## Cost, abuse, and capacity review

Before inviting more than the controlled 2–5 named operators, record the
following for the environment:

- tenant budget, AOAI deployment/TPM ceiling, reservation behavior, and the
  Simulator override;
- worker queue depth, stale-run threshold, retry behavior, and SQL connection
  pool/DTU observation;
- invite, sign-in/reset, Report Problem, upload, and public-form rate limits;
- the user-visible response for 401, 403, 409, 429, 5xx, timeout, and
  cross-tenant suspicion.

The expected failure order is HTTP capacity, worker queue, SQL/pool pressure,
and then the AOAI TPM ceiling. Scale-out does not create more AOAI TPM. See
[`PRIVATE_BETA_KILL_SWITCH_AND_SPEND_INVENTORY.md`](PRIVATE_BETA_KILL_SWITCH_AND_SPEND_INVENTORY.md)
and [`RATE_LIMIT_EXCEEDED.md`](RATE_LIMIT_EXCEEDED.md).

## On-call observability

Bind the dashboards and alerts in
[`OBSERVABILITY_DASHBOARD_BINDING.md`](OBSERVABILITY_DASHBOARD_BINDING.md) and
[`INCIDENT_INVESTIGATION.md`](INCIDENT_INVESTIGATION.md) before the first
invite wave. The minimum watch set is:

| Signal | Primary evidence | First action |
| --- | --- | --- |
| API 5xx / health | API SLO and health panels | Check blast radius, then incident severity |
| Auth failures | JwtBearer logs and correlation query | Check token expiry, role, and scope |
| Stuck runs | stale in-flight gauge and run lifecycle board | Capture `runId`; do not blindly retry |
| LLM spend/budget | tenant budget and faithfulness-budget dashboard | Freeze Real mode if the cap is uncertain |
| Queue depth | authority/outbox panels | Check worker health and projection lag |

`Report Problem` is the tenant-scoped support path, not a promise that every
single-tenant issue pages an operator. Triage the report reference first, then
classify fleet alerts versus a tenant-scoped defect using
[`SUPPORT_PROBLEM_REPORT_TRIAGE.md`](SUPPORT_PROBLEM_REPORT_TRIAGE.md).

## First-week support loop

Track these funnel milestones using the existing invitation, audit, run, and
export records; do not add a parallel counter until the existing event cannot
answer the question:

| Milestone | Audit/event mapping | Minimum dimensions |
| --- | --- |
| Invited | `Admin.UserInvitationCreated` | tenant, workspace, actor, invite result, UTC |
| Accepted | `Admin.UserInvitationAccepted` | invite/user reference, actor, UTC |
| Signed in | auth correlation record; no durable audit event is currently mapped | tenant/workspace scope, auth result, correlation id |
| Run created | `Architecture.RunCreated` | `runId`, project, execution mode, correlation id |
| Finalized | `ManifestFinalized` / `Run.CommitCompleted` | `runId`, `GoldenManifestId`, status, UTC |
| Exported | `RunExported` / `Export.DownloadSucceeded` | `runId`, artifact/export kind, response status, UTC |

Use [`TRIAL_FUNNEL.md`](TRIAL_FUNNEL.md) and the first-tenant funnel telemetry
implementation as the mapping reference. A report is useful when it includes a
report reference, `correlationId`, and `runId`; never place bearer tokens,
invite URLs, raw evidence, or unredacted bundles in a customer channel.

### Canned replies

**Invite expired:** “Your invitation has expired. We will reissue it after
confirming the intended workspace. Please do not forward the original link.”

**Run stuck:** “We have the review reference `{runId}` and are checking its
pipeline state. Please do not retry repeatedly; reply with the
`correlationId` if the review remains pending.”

**Training-data question:** “Your review is processed under the configured
tenant and provider boundary described in the trust pack. We can provide the
specific execution mode and data-handling record for this run.”

**Empty export:** “The review must have a committed golden manifest before an
export is available. Send the review URL or `runId`; do not upload the export
to a public channel.”

**SSO misconfigured:** “The sign-in identity is not resolving to the invited
workspace and role. We will verify the tenant scope and role mapping; please
do not create a second account.”

## Claim and data-handling gate

Before sending an invitee, sponsor, or landing-page copy change, compare it
with [`PUBLIC_CLAIM_BOUNDARY_GUIDE.md`](../library/PUBLIC_CLAIM_BOUNDARY_GUIDE.md)
and [`CLAIM_READINESS_STATUS.md`](../go-to-market/CLAIM_READINESS_STATUS.md).

Run the repository checks before recording a green claim review:

```bash
python3 scripts/ci/check_buyer_claim_drift.py
python3 scripts/ci/check_claim_evidence_consistency.py
```

Allowed language includes committed review evidence, labeled execution mode,
self-assessed security posture, and source-classified ROI. Do not imply CPA SOC
2, a published third-party pen test, a named reference customer, guaranteed
savings, production readiness, or that Simulator output is Real proof.

Record for each tenant: what data was supplied, where it is stored, retention
and deletion policy, who can access it, execution mode, committed manifest
reference, and the support/correlation references. The trust-center and
procurement pack remain the source of truth for legal terms, privacy, DPA,
subprocessors, and retention; this kit does not create an assurance claim.

### Spend-freeze verification

Record the configuration revision and one controlled response for both API and
worker before inviting more than the named pilot operators:

```text
API:     AgentExecution__Mode=Simulator
Worker:  AgentExecution__Mode=Simulator
Expected: the controlled create/execute response reports Simulator and a
          correlation id; no Real reservation is created.
```

If either surface cannot be switched independently, the cut is `NO-GO`.

## Cut-freeze rule

During the first invite wave, merge only:

- auth, tenant-scope, invite, recovery, support-correlation, and smoke fixes;
- release-gate, typecheck, OpenAPI, and security regressions;
- documentation required to operate or honestly describe the cut.

Pause new engines, retrieval expansion, public anonymous AI, Marketplace/live
Stripe work, and unrelated UI polish until the wave has a completed funnel
record and the owner has decided whether to proceed.

## Evidence record

For every cut, retain:

- RC34 head SHA and links to typecheck, private-beta, OpenAPI, and release-gate
  runs;
- Gate 1 `ship-gate-evidence` path, or an explicit `UNKNOWN`;
- tenant-scoped access-recovery results;
- spend-freeze verification and configuration revision;
- first-week funnel export and open support references;
- claim-boundary review result and any owner-only blockers.

### RC34 evidence snapshot

The last completed RC34 witness on 2026-10-07 was:

| Evidence | Run |
| --- | --- |
| UI typecheck, OpenAPI, beta-readiness, gitleaks, and push corset | `37642959507` |
| JwtBearer private-beta access path | `37642959086` |
| RC release gate | `37642959088` |

For a new cut, replace these run ids with the current SHA's runs. A green RC34
run is not a staging Gate 1 witness; retain `UNKNOWN` until
`ship-gate-evidence/{runId}/` exists.

When a current Real artifact is available, verify its age and attach the
generated report to the cut record:

```bash
python3 scripts/ci/report_real_mode_evidence_freshness.py \
  --strict \
  --markdown-out artifacts/release/real-mode-evidence-freshness.md
```

This kit makes Cursor-owned work repeatable. It does not close Gate 1,
G-REAL-06, G-REAL-07, M-07, M-09, G-REAL-09, or G-REAL-08 without the required
human execution.
