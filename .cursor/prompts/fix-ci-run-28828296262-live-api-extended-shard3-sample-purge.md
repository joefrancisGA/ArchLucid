# Fix: CI run `28828296262` — Operator UI: e2e live API + SQL (extended matrix; warn-only) [shard 3/4]

> **Superseded for run 2529+:** Run **2529** shard 3/4 log forensics show the decision-trace reuse
> collision bug (same as shard 2/4), not tenant-wide `SampleRunPurge`. Use
> `.cursor/prompts/fix-ci-run-2529-live-api-extended-shard3-decision-trace-timeout.md` and implement the
> production fix in
> `.cursor/prompts/fix-ci-run-2529-live-api-extended-shard2-decision-trace-reuse-collision.md`.
> Keep this file for run **2527** historical context only unless follow-up recheck finds actual purge
> log lines after that fix lands.

> Workflow run: `28828296262`, workflow **CI**, branch `RC7`, `workflow_dispatch`,
> **conclusion: canceled** (job-level `timeout-minutes: 90` fired — this run predates the shard-2 fix
> in commit `623dc6d578`, so neither the tenant-isolation nor the OTel-console-exporter change from
> `.cursor/prompts/fix-ci-run-2526-live-api-extended-shard2-sample-purge.md` was active here).
> Job: `Operator UI: e2e live API + SQL (extended matrix; warn-only) [shard 3/4]`
> (job id `85506190450`, started `2026-07-06T23:56:33Z`, canceled `2026-07-07T01:26:50Z` — **90m17s**,
> `https://github.com/joefrancisGA/ArchLucid/actions/runs/28828296262/job/85506190450`).
> This is the **same disease as shard 2** (`SampleRunPurgeForTenant` triggered by non-isolated real-run
> commits into the shared `DefaultTenant`), but hitting a **different set of shard-3 spec files** that
> the shard-2 fix did not touch. Root cause already confirmed via log timestamps + source; **do not
> re-diagnose from scratch** — verify Step 0, then implement.

## Symptom

`npx playwright test --shard=3/4` scheduled 30 tests, ran with **1 worker** (serial), and never
finished: the **job's `timeout-minutes: 90` ceiling** (`.github/workflows/ci.yml:3652`) killed it
mid-test at `01:26:46Z` with `##[error]The operation was canceled.`, right after test #33 finished.
Every failing test burned its **entire** configured Playwright timeout (`8.2m` = 492s, or `2.0m` = 120s
for the cheaper contract test) on **both** the original attempt and the retry:

| # | Spec | Test | Duration (×2, attempt+retry) |
|---|------|------|------|
| 4–5 | `live-api-email-run-to-sponsor.spec.ts:39` | post-commit banner downloads sponsor PDF | 8.2m ×2 |
| 10–11 | `live-api-executive-board-pack.spec.ts:27` | executive summary + board-pack download | 2.0m ×2 |
| 13–14 | `live-api-governance-rejection.spec.ts:46` | submit → reject → audit → UI | 8.2m ×2 |
| 15–16 | `live-api-journey.spec.ts:56` | operator happy path (create→…→audit) | 8.2m ×2 |
| 27–28 | `live-api-negative-paths.spec.ts:49` | governance self-approval blocked | 8.2m ×2 |
| 33(+) | `live-api-negative-paths.spec.ts:159` | second commit → 409 conflict | 8.2m (job canceled before its retry could even start) |

Every other test in the shard — `live-api-demo-screenshots`, `live-api-digest-webhook` (the one
non-skipped test), `live-api-error-states` (all 3), `live-api-executive-board-pack`'s second
(mocked-runs) test, `live-api-marketing-*` (3 files), and `live-api-negative-paths`'s other 3
fake-run-id checks — **passed in well under 1 second each**. `live-api-jwt-auth.spec.ts` (6 tests) is
correctly skipped in this job (DevelopmentBypass mode, not JWT).

## Root cause (confirmed via job log timestamps, not guessed)

**Every one of the 6 failing test instances above calls `createRun()`/`commitRun()`
(`archlucid-ui/e2e/helpers/live-api-client.ts`) without an explicit `tenantScope` argument** — except
`live-api-executive-board-pack.spec.ts`, which creates **no run at all** (see below). All commits
therefore land in the shared fallback tenant, `ArchLucid.Core/Scoping/ScopeIds.cs:17` →
`DefaultTenant = 11111111-1111-1111-1111-111111111111`, same as the shard-2 bug. This is the **exact
same trigger** documented in `fix-ci-run-2526-live-api-extended-shard2-sample-purge.md`'s Root cause
section: every non-sample commit enqueues a **tenant-wide** `SampleRunPurgeForTenant`
(`AuthorityDrivenArchitectureRunCommitOrchestrator.cs:424-491` →
`PostCommitProjectionEnqueuer.EnqueueAfterCommitAsync` → `SampleRunPurgeService.PurgeInternalAsync`),
which hard-deletes **every `IsSample = 1` run for the whole tenant** and generates lock contention on
`dbo.Runs` (+ FK cascades) that pushes unrelated concurrent/adjacent tests over their own timeouts.
That fix only touched 7 shard-2 files (`advisory-flow`, `alert-rules`, `analysis-report`, `archival`,
`compare-runs`, `concurrency`, `conflict-journey`); it does **not** cover any of the shard-3 files
above, which is why shard 3 still exhibits the identical failure signature.

### `live-api-executive-board-pack.spec.ts` is collateral damage, not a cause

This file's failing test creates **no run** — it only calls `ensureDemoWorkspaceSeedReady(request)` in
`beforeAll` (`helpers/ensure-demo-workspace-seed.ts:73-121`), which re-seeds and then probes the
**pinned** Workspace A/B demo runs (`demoWorkspacesFixtureManifest.workspaceA/B.runId`), then reads
`/v1/roi/executive-summary` and `/v1/roi/executive-summary/board-pack`. In file-execution order it runs
**immediately after** `live-api-email-run-to-sponsor.spec.ts`, whose real-run commit is the most
recent trigger of the tenant-wide sample purge at that point in the shard. If that purge is in flight
(or has just fired) when `ensureDemoWorkspaceSeedReady`'s transient-retry probes run, the seeded
Workspace A/B runs it depends on are gone or being re-created, and the probe retries burn the full
timeout. **No code change is needed in this file** — it should stop failing once the files below stop
triggering the purge.

### Cross-job risk: `live-api-journey.spec.ts` and `live-api-negative-paths.spec.ts` are shared

Unlike the shard-2 file set, these two files are **also** run by the ApiKey job
(`.github/workflows/ci.yml:3931-3935`) and the JWT job (`:4099-4103`) — not just this
DevelopmentBypass-mode extended-matrix shard. Blindly adding `x-tenant-id`/`x-workspace-id`/
`x-project-id` headers to every call in these two files must not break those other two jobs. Traced
`ScopeIdentityBindingMiddleware.cs:52-68`:

```52:68:ArchLucid.Api/Middleware/ScopeIdentityBindingMiddleware.cs
if (!string.Equals(authType, AuthServiceCollectionExtensions.ApiKeySchemeName, StringComparison.Ordinal))
    return ScopeIdentityBindingValidator.ScopeIdentityBindingResult.Ok();

if (TryParseClaimGuid(user, "tenant_id", out _))
    return ScopeIdentityBindingValidator.ScopeIdentityBindingResult.Ok();

if (!headers.TryGetValue("x-tenant-id", out StringValues tenantHeader))
    return ScopeIdentityBindingValidator.ScopeIdentityBindingResult.Ok();
...
return ScopeIdentityBindingValidator.ScopeIdentityBindingResult.Forbidden(
    "API key authentication requires Authentication:ApiKey:TenantId (tenant_id claim); "
    + "x-tenant-id cannot be used without a bound key scope.");
```

Reading this: **non-ApiKey schemes (JWT) return `Ok()` immediately** regardless of the header, and
**ApiKey requests whose key already carries a `tenant_id` claim also return `Ok()` immediately**
without validating that the header matches the claim — i.e. an extra `x-tenant-id` header should be a
silent no-op (ignored, scope resolved from the claim/JWT instead) for both other jobs, **not** a 403.
This is a reasonable basis to proceed, but it is inferred from one middleware, not exhaustively proven
against the live ApiKey/JWT CI jobs — treat it as the Step 0 check below, not a certainty.

### Why 90 minutes specifically

`.github/workflows/ci.yml:3652` sets `timeout-minutes: 90` on the extended-matrix job (shard 2's job at
`:3485` also has `timeout-minutes: 90`; the plain live job differs). With **1 worker** (serial
execution, no parallelism within the shard) and 5–6 tests each burning 8.2m/2.0m twice (attempt +
retry), the cumulative wall time exceeds 90 minutes before the shard's remaining tests can run, so
GitHub Actions cancels the whole job rather than letting Playwright's own timeout/reporter finish
cleanly — hence `conclusion: canceled`, not `failure`, and no final pass/fail summary or artifacts
report for the tests that never got to start.

### Note: the OTel console-exporter fix was not active for this run

Commit `623dc6d578` (already pushed to `origin/RC7`) added
`Observability__ConsoleExporter__Enabled: "false"` to this same job's `env:` block, but this run
started at `23:56:33Z` on 2026-07-06 — **before** that commit landed (`~01:47:29Z` on 2026-07-07).
Re-running shard 3 after that commit should reduce log volume and some contention noise, but will
**not** fix the failures above — the tenant-purge root cause is untouched by that change and needs the
isolation fix below regardless.

## Fix

### Step 0 — verify the ApiKey/JWT no-op assumption before touching shared files (~5 minutes)

Before modifying `live-api-journey.spec.ts` or `live-api-negative-paths.spec.ts`, confirm passing an
`x-tenant-id` header alongside a valid API key does **not** 403 in this codebase's current CI
configuration. Either:

- Read `ArchLucid.Api/Auth/Services/ApiKeyAuthenticationHandler.cs` (or equivalent) to confirm the
  `tenant_id` claim is always populated for the CI test keys used by
  `Authentication__ApiKey__DevelopmentBypassAll` / the apikey job's configured keys, **or**
- Run the apikey job's `live-api-journey.spec.ts` locally against an API started the same way as that
  job (ApiKey auth, a real bound key), with a throwaway `x-tenant-id` header added to one `createRun`
  call, and confirm `2xx` (not `403`).

If either check fails (i.e. the header is *not* a safe no-op for ApiKey/JWT), skip isolating
`live-api-journey.spec.ts`/`live-api-negative-paths.spec.ts` for now and report back — an
auth-mode-aware conditional (e.g. only pass `tenantScope` when `process.env.LIVE_API_AUTH_MODE` is
unset/`"DevelopmentBypass"`) will be needed instead of the blanket fix below.

### Step 1 — give each non-shared, non-seed-dependent spec its own throwaway tenant

These two files are **exclusive** to this extended-matrix job (not referenced by the apikey/jwt CI
jobs) — safe to fix the same way as the shard-2 files, reusing
`freshIsolatedTenantScope()` (already added to `helpers/live-api-client.ts` by the shard-2 fix):

- `live-api-email-run-to-sponsor.spec.ts` — thread `tenantScope` through `createRun`, `executeRun`,
  `waitForReadyForCommit`, `commitRun`, `waitForRunDetailCommitted`. **Also navigates the browser** to
  `/reviews/${runId}` (line 67) — inject matching page-side operator scope via
  `injectDemoWorkspaceOperatorScope(page, tenantScope)` (`helpers/demo-workspace-live-scope.ts`)
  **before** that `page.goto`, same pattern as shard-2's `live-api-conflict-journey.spec.ts`.
- `live-api-governance-rejection.spec.ts` — thread `tenantScope` through `createRun`, `executeRun`,
  `waitForReadyForCommit`, `commitRun`, `waitForRunDetailCommitted`, `createApprovalRequest`,
  `rejectGovernanceRequest`, `postGovernanceApproveRaw`, `postGovernanceRejectRaw`, `searchAudit`. Also
  navigates to `/governance?runId=...` (line 143) — inject matching page-side scope before that
  `page.goto` too.

### Step 2 — apply the same isolation to the shared files, conditional on Step 0's outcome

If Step 0 confirms the header is a safe no-op under ApiKey/JWT:

- `live-api-journey.spec.ts` — thread `tenantScope` through every scoped call (`createRun`,
  `executeRun`, `waitForReadyForCommit`, `commitRun`, `waitForRunDetailCommitted`,
  `getRunDetailsWithTransientRetries`, `createApprovalRequest`, `postGovernanceApproveRaw`,
  `approveGovernanceRequest`, `searchAudit`, `waitForArchitectureRunListCommitted`,
  `listArchitectureRuns`). This file navigates to `/reviews`, `/reviews/${runId}`,
  `/governance?runId=...`, and `/governance/audit` — inject page-side scope before each `page.goto`
  that targets a specific run (the `/reviews` list and `/governance/audit` pages don't need it, but
  `/reviews/${runId}` and `/governance?runId=...` do).
- `live-api-negative-paths.spec.ts` — only 2 of 5 tests create real runs (`:49` self-approval,
  `:159` already-committed conflict); thread `tenantScope` through those two tests' `createRun`,
  `executeRun`, `waitForReadyForCommit`, `commitRun`, `waitForRunDetailCommitted`,
  `createApprovalRequest`, `postGovernanceApproveRaw`, `searchAudit` calls. No `page` navigation in
  this file — API-only, no localStorage injection needed. Leave the other 3 fake-run-id tests
  untouched (they already pass in milliseconds and don't create real runs).

### Step 3 — no change needed for `live-api-executive-board-pack.spec.ts`

Do not modify this file. It should pass once Steps 1–2 stop the tenant-wide purge from firing during
its `beforeAll` seed check.

## Acceptance criteria

1. Step 0's ApiKey/JWT no-op check is done and its outcome (pass or fail) is stated explicitly before
   Step 2 is attempted.
2. `live-api-email-run-to-sponsor.spec.ts` and `live-api-governance-rejection.spec.ts` never call
   `createRun`/`executeRun`/`commitRun`/governance helpers without an explicit `tenantScope`, and both
   inject matching page-side scope before their run-specific `page.goto`.
3. If (and only if) Step 0 passes: `live-api-journey.spec.ts` and `live-api-negative-paths.spec.ts`
   (its two real-run tests only) get the same treatment.
4. `live-api-executive-board-pack.spec.ts` is **not** modified.
5. No production code (`ArchLucid.Application`, `ArchLucid.Api`, `ArchLucid.Persistence`, etc.)
   changes — this is entirely test-harness scoped, consistent with the shard-2 fix.
6. This prompt does not re-touch the 7 files already fixed for shard 2, nor duplicate the
   `Observability__ConsoleExporter__Enabled` change (already applied workflow-wide in `623dc6d578`).

## Verification

Local repro (start the API + SQL locally per `archlucid-ui/docs/TESTING_AND_TROUBLESHOOTING.md`, then
from `archlucid-ui/`):

```powershell
npx playwright test e2e/live-api-email-run-to-sponsor.spec.ts e2e/live-api-executive-board-pack.spec.ts `
  e2e/live-api-governance-rejection.spec.ts e2e/live-api-journey.spec.ts e2e/live-api-negative-paths.spec.ts
```

Confirm all 5 files pass together in this order (matching shard 3's relative ordering), and that a
targeted SQL check on the seeded Workspace A/B run IDs
(`demoWorkspacesFixtureManifest.workspaceA/B.runId`) shows them still present after the full run.

For the apikey/jwt cross-job safety check, run (if Step 2 is attempted):

```powershell
npx playwright test live-api-apikey-auth.spec.ts live-api-auth-parity-spine.spec.ts live-api-journey.spec.ts live-api-negative-paths.spec.ts
```

against an API started in ApiKey auth mode, and confirm no new `403`s appear that weren't there before
the `tenantScope` threading.

## Related

- `.cursor/prompts/fix-ci-run-2526-live-api-extended-shard2-sample-purge.md` — the shard-2 sibling of
  this exact bug; read it first, it has the full root-cause chain (purge mechanics, `SampleRunPurge:Enabled`
  dead-end, OTel console-exporter finding) that this file does not repeat.
- `docs/architecture/adrs/0044-durable-post-commit-projection-outbox.md` — durable outbox carrying the
  sample-run purge side effect (intentional in production; the bug is the E2E suite's shared-tenant
  design).
- `.cursor/rules/Tenant-Isolation-Defense-In-Depth.mdc` — this is a test-harness/product-UX concern, not
  a security defect; do not frame as a tenant-isolation security finding.
- CI artifacts (run `28828296262`, job `85506190450`): `ui-e2e-live-extended-test-results-3`.
