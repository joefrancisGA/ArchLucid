# Fix: CI run #2529 — Operator UI: e2e live API + SQL (extended matrix; warn-only) [shard 3/4] (90m timeout)

> Workflow run: `28871046590` (run_number **2529**), workflow **CI**, branch `RC7`, commit
> `bc04b30d01f46e92d4cbfafd1c9d45fd5e62f015`, `workflow_dispatch`-triggered.
> Job: `Operator UI: e2e live API + SQL (extended matrix; warn-only) [shard 3/4]`
> (job id `85651988168`, started `2026-07-07T15:00:19Z`, canceled `2026-07-07T16:30:35Z` — **90m16s**,
> `https://github.com/joefrancisGA/ArchLucid/actions/runs/28871046590/job/85651988168`).
> Job **conclusion: canceled** (GitHub Actions `timeout-minutes: 90` at
> `.github/workflows/ci.yml:3645` fired mid-test; Playwright never printed a final summary).
> This job is `warn-only` (does not block CI). Root cause is the **same production bug** as shard 2/4
> in this run — **do not implement the old tenant-purge E2E isolation fix**; implement the production
> fix documented in
> `.cursor/prompts/fix-ci-run-2529-live-api-extended-shard2-decision-trace-reuse-collision.md`.

## Why this prompt supersedes `fix-ci-run-28828296262-live-api-extended-shard3-sample-purge.md`

Run **2527** (`28828296262`) timed out on shard 3/4 with a symptom shape that *looked* like the
tenant-wide `SampleRunPurgeForTenant` theory from run 2526. Run **2529** shard 3 reproduces the
**same wall-clock timeout** but log forensics on the downloaded `ui-e2e-live-extended-api-log-3`
artifact show a **different, better-evidenced root cause** — identical to shard 2/4 in this same run:

| Evidence | Run 2527 (old shard-3 prompt) | Run 2529 shard 3 (this run) |
|---|---|---|
| `Sample run purge completed` / `PurgeForTenant` | Assumed from source reading | **Absent** (`grep -i purge` → no matches) |
| `unique-key violation without reconcilable manifest` on `dbo.DecisioningTraces` | Not checked | **840 log lines**, 10 distinct runs |
| `DecisionTraceId` at request time vs commit retry | Not checked | **Same GUID repeats verbatim** across every commit retry per run |
| Fix target | E2E `tenantScope` isolation (never implemented) | **`ManifestFinalizationService` reuse path** (production) |

Shard 2/4 in run 2529 **failed** (11 tests, 77m) with the decision-trace bug; shard 3/4 **canceled**
(90m) with the same bug on a different spec subset. One production fix covers both shards.

## Symptom

`npx playwright test --shard=3/4` scheduled **30 tests**, ran with **1 worker** (serial). The job
never finished: GitHub Actions canceled the Playwright step at `16:30:31Z` with
`##[error]The operation was canceled.` while test #33 (`live-api-negative-paths.spec.ts:159`, second
commit → 409 conflict) was still in its **first** attempt's commit-retry loop.

Every test that creates a real run via `createRun()` → `/execute` → `/commit` burned ~**8.2 minutes**
(492s Playwright timeout) per attempt, ×2 (original + retry), before the job ceiling killed the shard.
Only **5 spec files** (10 run-creation attempts total) reached `/commit` before timeout; the API log
shows **10** `Authority pipeline completed` lines and **10** distinct `RunId`s stuck in commit retry.

| # | Spec | Test (approx.) | E2E `RequestId` prefix (from API log) | Outcome |
|---|------|----------------|---------------------------------------|---------|
| 1 | `live-api-email-run-to-sponsor.spec.ts:39` | post-commit banner downloads sponsor PDF | `E2E-EMAIL-SPONSOR-*` | stuck on commit (×2) |
| 2 | `live-api-governance-rejection.spec.ts:46` | submit → reject → audit → UI | `E2E-LIVE-REJECT-*` | stuck on commit (×2) |
| 3 | `live-api-journey.spec.ts:56` | operator happy path | `E2E-LIVE-*` | stuck on commit (×2) |
| 4 | `live-api-negative-paths.spec.ts:49` | governance self-approval blocked | `E2E-LIVE-SELF-APPR-*` | stuck on commit (×2) |
| 5 | `live-api-negative-paths.spec.ts:159` | second commit → 409 conflict | `E2E-LIVE-DBL-COMMIT-*` | **canceled mid-first-attempt** |

Tests that **do not** call `createRun()`/`commitRun()` on a real run (e.g. `live-api-error-states`,
`live-api-demo-screenshots`, `live-api-digest-webhook`, marketing specs, fake-run-id negative-path
checks) passed in milliseconds earlier in the shard — same split as shard 2: **real-commit tests hang;
no-real-commit tests pass instantly.**

`live-api-executive-board-pack.spec.ts` was **not reached** before timeout in this run (unlike run
2527, where it was collateral damage after an earlier stuck test). Do not modify it for this fix.

## Root cause (confirmed via artifact + source, not guessed)

### The evidence: unrecoverable `DecisioningTraces` PK collision on every `/commit`

Downloaded artifact `ui-e2e-live-extended-api-log-3` from run `28871046590` (~2.8 MB). The **first**
real-run test (`live-api-email-run-to-sponsor`) shows the exact failure chain:

```
2026-07-07 15:05:16.226 [INF] Authority pipeline completed: RunId=e743b524-105e-4cad-a73a-5acc2ab3b08c, ... DecisionTraceId=66db41b6-394e-4ae0-8ab2-a290cb19e0a5
2026-07-07 15:05:16.238 [INF] Coordination completed: RunId=e743b524105e4cada73a5acc2ab3b08c, RequestId=E2E-EMAIL-SPONSOR-1783436715702, ... Deferred=False
...
2026-07-07 15:05:21.282 [WRN] CommitRunAsync (authority) unique-key violation without reconcilable manifest (attempt 1/12) for RunId=e743b524105e4cada73a5acc2ab3b08c.
Microsoft.Data.SqlClient.SqlException: Violation of PRIMARY KEY constraint 'PK__Decision__6E04AA3E57BEF6EA'. Cannot insert duplicate key in object 'dbo.DecisioningTraces'. The duplicate key value is (66db41b6-394e-4ae0-8ab2-a290cb19e0a5).
```

`66db41b6-394e-4ae0-8ab2-a290cb19e0a5` is the **same** `DecisionTraceId` logged at Authority pipeline
completion during `POST /v1/architecture/request` — **before** the E2E test ever calls `/commit`.
The commit path tries to `INSERT` a row that already exists because `CommitPipelineManifestReuseService`
returned the persisted trace, but `ManifestFinalizationService.FinalizeSqlAsync` unconditionally calls
`decisionTraceRepository.SaveAsync` (INSERT-only) anyway.

Forensic counts from the full log:

- `unique-key violation without reconcilable manifest`: **840** lines
- Distinct `RunId`s hitting attempt 1/12: **10** (matches 5 specs × 2 Playwright attempts)
- `duplicate key value is (66db41b6-394e-4ae0-8ab2-a290cb19e0a5)`: **85** repeats for the first run alone
- Last log line before job cancel (`16:30:27Z`): still retrying commit for run `0cf22bd6e33e455a8ff0c71a27f7b0b1` (10th stuck run)
- `Sample run purge completed`: **0** matches

### Why 90 minutes specifically

`.github/workflows/ci.yml:3645` sets `timeout-minutes: 90`. With 1 worker and ~8.2m × 2 per stuck
real-run test, **5 specs × 16.4m ≈ 82m** of commit-retry wall time plus setup (~15m) exceeds the
90m ceiling before the remaining ~25 shard-3 tests can run — hence `conclusion: canceled`, not
`failure`, and no Playwright pass/fail summary.

### Secondary, non-blocking finding

Same log shows tolerated `dbo.AgentResults` duplicate-key warnings during `/execute` (handled
gracefully, does not block). Do not fix in this prompt — see shard-2 prompt § Secondary finding.

## Fix — use the shard-2 prompt; do not fork a separate implementation

**Production fix:** `SkipPersistingPipelineArtifacts` on `ManifestFinalizationRequest`, set from
`AuthorityDrivenArchitectureRunCommitOrchestrator` when `CommitPipelineManifestReuseService` returns a
reused manifest — landed on `RC7` in commit `dcbbb4542d` (same change described in
`.cursor/prompts/fix-ci-run-2529-live-api-extended-shard2-decision-trace-reuse-collision.md` Step 1,
Option A, under the name `SkipPersistingPipelineArtifacts`).

**Do not:**

- Add `tenantScope` / `freshIsolatedTenantScope` to shard-3 E2E specs
- Modify `live-api-executive-board-pack.spec.ts` for this run
- Add `Observability__ConsoleExporter__Enabled` to CI (OTel console noise is already absent in this run's 2.8 MB log)
- Re-diagnose from scratch unless Step 0 local repro **does not** match the log evidence above

There is **one bug, one fix** — shard 3 does not need a separate code change beyond what shard 2 requires.

## Acceptance criteria

1. Same as shard-2 prompt acceptance criteria 1–6 (local repro, first `/commit` succeeds, idempotent
   second `/commit`, new automated test, no E2E/CI workflow changes in this diff).
2. After merge, re-run extended-matrix **shard 3/4** (and shard 2/4) and confirm:
   - No `unique-key violation without reconcilable manifest` in `ui-e2e-live-extended-api-log-3`
   - Job completes within 90m with a Playwright summary (not canceled mid-shard)
   - The five specs listed above pass (or fail for unrelated, newly evidenced reasons — report those explicitly)

## Verification

```powershell
# Local: reproduce shard-3's first failing path (email sponsor)
cd archlucid-ui
npx playwright test e2e/live-api-email-run-to-sponsor.spec.ts

# After production fix: full shard-3 subset that creates real runs
npx playwright test e2e/live-api-email-run-to-sponsor.spec.ts `
  e2e/live-api-governance-rejection.spec.ts `
  e2e/live-api-journey.spec.ts `
  e2e/live-api-negative-paths.spec.ts
```

CI: trigger `workflow_dispatch` on `RC7` and inspect jobs
`Operator UI: e2e live API + SQL (extended matrix; warn-only) [shard 2/4]` and `[shard 3/4]`.

Download logs:

```powershell
gh run download <run-id> -n ui-e2e-live-extended-api-log-3 -D $env:TEMP\shard3-log
Select-String -Path $env:TEMP\shard3-log\live-api-extended.log -Pattern 'unique-key violation|Sample run purge'
```

## Related

- `.cursor/prompts/fix-ci-run-2529-live-api-extended-shard2-decision-trace-reuse-collision.md` —
  **canonical implementation prompt** (production fix; read and implement this)
- `.cursor/prompts/fix-ci-run-2529-live-api-extended-shard2-followup-recheck.md` — run **after** the
  fix merges to decide whether old tenant-purge prompts can be closed
- `.cursor/prompts/fix-ci-run-28828296262-live-api-extended-shard3-sample-purge.md` — **superseded**
  for run 2529+; do not implement unless follow-up recheck finds actual purge log lines post-fix
- `.cursor/prompts/fix-ci-run-2526-live-api-extended-shard2-sample-purge.md` — same; superseded by
  decision-trace diagnosis
- CI artifacts (run `28871046590`, job `85651988168`): `ui-e2e-live-extended-api-log-3`,
  `ui-e2e-live-extended-test-results-3`, `ui-e2e-live-extended-playwright-report-3`
