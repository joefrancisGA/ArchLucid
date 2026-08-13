# Fix: CI run #2529 — Operator UI: e2e live API + SQL (extended matrix; warn-only) [shard 2/4]

> Workflow run: `28871046590` (run_number **2529**), workflow **CI**, branch `RC7`, commit at
> `2026-07-07T15:00:18Z`, `workflow_dispatch`-triggered. Job **conclusion: failure**; the overall
> workflow run shows `conclusion: canceled` (a different, unrelated job caused the whole run to be
> canceled after this job had already finished — do not conflate the two).
> Job: `Operator UI: e2e live API + SQL (extended matrix; warn-only) [shard 2/4]`
> (job id `85651988017`, started `15:00:18Z`, ended `16:17:46Z` — **77 minutes**,
> `https://github.com/joefrancisGA/ArchLucid/actions/runs/28871046590/job/85651988017`).
> This job is `warn-only` (does not block CI). This prompt was written after full root-cause analysis
> (log + source-code verification) of a **newly identified, previously undiagnosed production bug** —
> **do not re-diagnose from scratch**; verify Step 0, then implement.

## Why this prompt supersedes the two prior shard-2/shard-3 prompts

Two earlier prompts — `.cursor/prompts/fix-ci-run-2526-live-api-extended-shard2-sample-purge.md` (run
`28819021651`) and `.cursor/prompts/fix-ci-run-28828296262-live-api-extended-shard3-sample-purge.md`
(run `28828296262`) — diagnosed this **exact same 11-test failure signature** as a tenant-wide
`SampleRunPurge` triggered by non-isolated E2E tenant commits, and proposed an E2E-test-harness-only
fix (per-test `tenantScope` isolation) plus a CI-only `Observability__ConsoleExporter__Enabled: "false"`
change.

**Neither fix was ever implemented** — confirmed by grep, 2026-07-07:

- No `tenantScope` / `freshIsolatedTenantScope` anywhere in `archlucid-ui/e2e/**` or
  `archlucid-ui/e2e/helpers/live-api-client.ts`.
- No `Observability__ConsoleExporter__Enabled` anywhere in `.github/workflows/ci.yml`.

Yet run **2529** (this run) reproduces the **identical 11-test failure list** from run 2526, three
days later, on the same unpatched code. Two things follow from that:

1. **The OTel-console-noise symptom that motivated the old prompt's Step 2 is already gone without any
   fix landing** — this run's `live-api-extended.log` artifact is **207 KB** (vs. the previously
   reported **189 MB**), and contains **zero** `Activity.StartTime`/`Activity.TraceId` console dumps.
   Whatever caused that noise in run 2526 is not reproducing here; do not re-attempt that fix blindly.
2. **No `SampleRunPurge` / `PurgeForTenant` / "Sample run purge completed" log line appears anywhere in
   this run's full log** (`grep -i purge` only matches migration-script *names*, never the
   `SampleRunPurgeService.PurgeInternalAsync` completion log at
   `ArchLucid.Application/Runs/Sample/SampleRunPurgeService.cs:89-90`). If the tenant-wide purge were
   firing and hard-deleting rows mid-run, that log line would appear. It does not. **The tenant-purge
   theory was never directly confirmed in an actual log** (the 2526 prompt inferred it from source
   reading, not from an observed purge-completion log line) — and this run's evidence points at a
   different, more fundamental bug that fully explains the same symptom on its own (see below).

This prompt documents that different, better-evidenced root cause. **Do not implement the old
tenant-isolation E2E fix yet** — see Â§ Related for what to do with the two old prompts.

## Symptom

`npx playwright test --shard=2/4` scheduled **19 tests**, ran serially (1 worker): **11 failed** (2 of
those — `live-api-buyer-golden-path`, `live-api-core-pilot-path` — failed on *both* the original
attempt and the retry), **7 skipped** (JWT/ApiKey-only specs, correctly skipped in
`DevelopmentBypass` mode), **1 passed**, total wall time **1.2 hours**:

| # | Spec | Test | Outcome |
|---|------|------|---------|
| 1 | `live-api-advisory-flow.spec.ts:35` | schedule advisory scan after committed run and verify audit trail | failed (Ã—2) |
| 2 | `live-api-alert-rules.spec.ts:32` | create alert rule then list includes it; alerts page renders | failed (Ã—2) |
| 3 | `live-api-analysis-report.spec.ts:36` | generate analysis report for committed run and verify audit | failed (Ã—2) |
| 4 | `live-api-archival.spec.ts:39` | multiple committed runs remain visible on GET /v1/architecture/runs | failed (Ã—2) |
| 5 | `live-api-buyer-golden-path.spec.ts:50` | five-step diligence spine (`@smoke-golden-path`) | failed (Ã—2) |
| 6 | `live-api-compare-runs.spec.ts:48` | two committed runs → compare page loads | failed (Ã—2) |
| 7 | `live-api-compare-runs.spec.ts:96` | compare with missing right run returns 404 | failed (Ã—2) |
| 8 | `live-api-concurrency.spec.ts:28` | parallel first commit: no 5xx; run ends Committed | failed (Ã—2) |
| 9 | `live-api-concurrency.spec.ts:73` | parallel governance approve | failed (Ã—2) |
| 10 | `live-api-conflict-journey.spec.ts:70` | second commit is idempotent (200) | failed (Ã—2) |
| — | `live-api-conflict-journey.spec.ts:144` | commit on **non-existent** run returns 404 | **passed** (189ms) |
| 11 | `live-api-core-pilot-path.spec.ts:22` | operator home → new request → reviews → showcase deliverables | failed (Ã—2) |

**The one test that passed never creates a real run** — it calls `POST .../commit` against a
random/non-existent run id and asserts a 404. **Every one of the 11 failing tests creates a real run
via `createRun()`/`executeRun()`/`commitRun()`** (`archlucid-ui/e2e/helpers/live-api-client.ts`) and
then hangs until its full Playwright timeout (120s–480s, Ã—2 for the retry) trying to commit it. This
split (real-commit tests always fail; the one no-real-commit test passes instantly) is the first clue
that **the commit path itself is broken for every run**, not that any one test's tenant/data is being
clobbered by something else.

## Root cause (confirmed via log + source, not guessed)

### The evidence: an unrecoverable, permanently-repeating unique-key violation on commit

Downloaded the job's `ui-e2e-live-extended-api-log-2` artifact (`live-api-extended.log`, 207 KB —
small enough to read in full, unlike prior runs). The **very first test's very first commit attempt**
(`live-api-advisory-flow`, `RunId=44c0e97d-c409-41c9-84cf-40ab1852c32a`) never succeeds:

```
2026-07-07 15:04:59.630 [INF] Authority pipeline completed: RunId=44c0e97d-c409-41c9-84cf-40ab1852c32a, ManifestId=4c616516-4a68-4018-9940-2ce697ea022e, ContextSnapshotId=94e4396b-a840-460d-99a6-62cafd729d10, FindingsSnapshotId=8ca1f63c-57f3-4be2-8aa6-47f0e302e0e8, DecisionTraceId=c958837b-a4be-4a44-b44a-6bfe9e071a80
2026-07-07 15:04:59.639 [INF] Coordination completed: RunId=44c0e97dc40941c984cf40ab1852c32a, RequestId=E2E-LIVE-ADVISORY-1783436699093, StarterTaskCount=4, EvidenceBundleId=a1aa165307244a5e94e78d9eca3cd5e1, Deferred=False
2026-07-07 15:04:59.642 [INF] Creating architecture run: RunId=44c0e97dc40941c984cf40ab1852c32a, ...
...
2026-07-07 15:05:00.347 [INF] Committing architecture run (authority): RunId=44c0e97dc40941c984cf40ab1852c32a
2026-07-07 15:05:04.623 [WRN] CommitRunAsync (authority) unique-key violation without reconcilable manifest (attempt 1/12) for RunId=44c0e97dc40941c984cf40ab1852c32a.
Microsoft.Data.SqlClient.SqlException: Violation of PRIMARY KEY constraint 'PK__Decision__6E04AA3E52D07DE8'. Cannot insert duplicate key in object 'dbo.DecisioningTraces'. The duplicate key value is (c958837b-a4be-4a44-b44a-6bfe9e071a80).
   at ...SqlDecisionTraceRepository.SaveAsync(...)
   at ...ManifestFinalizationService.FinalizeSqlAsync(...)
   at ...AuthorityDrivenArchitectureRunCommitOrchestrator.CommitRunCoreAsync(...)
```

**`c958837b-a4be-4a44-b44a-6bfe9e071a80` is the exact same `DecisionTraceId` that was computed and
logged as "Authority pipeline completed" *before the run even existed* — i.e. during
`POST /v1/architecture/request`, not during the later `/commit` call.** The commit call is trying to
INSERT a `DecisioningTraces` row whose primary key was **already durably persisted minutes earlier by
a different code path**, and it keeps colliding with that same row **every single retry, across every
new HTTP `/commit` request the test client makes**, for the rest of the job — this is not a transient
race, it never resolves:

```
grep -c "duplicate key value is (c958837b" live-api-extended.log   # → 32 occurrences, spanning
                                                                     #   15:05:00Z .. 15:06:44Z+,
                                                                     #   across 6+ separate HTTP
                                                                     #   POST .../commit requests
```

The second failing test (`live-api-alert-rules`) shows the identical shape with a *different* fixed
`DecisionTraceId` (`18b91af2-509c-484e-9944-c3828651af62`) that also repeats verbatim across every
retry of *that* run's commit. Every subsequent failing test in the shard follows the same pattern (not
individually re-verified in this prompt — Step 0 asks you to confirm this for at least one more).

### Why the same `DecisionTraceId` reappears: request-time inline pipeline vs. commit-time re-decisioning

`POST /v1/architecture/request` does **not** just create a row and return — for a non-deferred run
(`Deferred=False` in the log above) it runs the **entire** Authority pipeline inline, synchronously,
including decisioning and artifact synthesis, before the request even returns 201:

```388:394:ArchLucid.Application/Runs/Orchestration/Pipeline/AuthorityPipelineStagesExecutor.cs
    run.DecisionTraceId = ruleAuditTrace.RuleAudit.DecisionTraceId;
    run.GoldenManifestId = ctx.Manifest!.ManifestId;
    run.ArtifactBundleId = artifactBundle.BundleId;
    await UpdateRunAsync(run, uow, token);
```

This is intentional design (see `docs/architecture/adrs/0030-coordinator-authority-pipeline-unification.md`
— the Coordinator/Authority pipelines were unified so the classic Create → Execute → Commit
operator-facing UX is preserved on top of a single Authority engine; running the pipeline inline for
non-deferred requests is by design, not itself the bug). `ArchitectureRunAuthorityCoordination.CreateRunAsync`
persists that `GoldenManifestId`/`DecisionTraceId` onto the `RunRecord` **before** returning from
`POST /request`:

```128:147:ArchLucid.Application/Runs/Coordination/ArchitectureRunAuthorityCoordination.cs
    private static ArchitectureRun BuildRunFromAuthority(RunRecord authorityRun, ArchitectureRequest request, bool deferred)
    {
        return new ArchitectureRun
        {
            ...
            GoldenManifestId = authorityRun.GoldenManifestId,
            DecisionTraceId = authorityRun.DecisionTraceId,
            ...
```

Later, when the E2E test calls the classic `/commit` endpoint,
`AuthorityDrivenArchitectureRunCommitOrchestrator.CommitRunCoreAsync` correctly notices the run already
has a `GoldenManifestId`/`DecisionTraceId` and tries to **reuse** the already-computed pipeline output
instead of re-deciding from scratch:

```372:390:ArchLucid.Application/Runs/Orchestration/AuthorityDrivenArchitectureRunCommitOrchestrator.cs
            CommitPipelineManifestReuseResult? reusedManifest = await _commitPipelineManifestReuseService.TryReusePipelineManifestAsync(
                run, runGuid, contextSnapshotId, graph, graphForDecision, findings, scope, cancellationToken);

            if (reusedManifest is not null)
            {
                manifestModel = reusedManifest.Manifest;
                traceDto = reusedManifest.TraceDto;
            }
            else
            {
                (manifestModel, traceDto) = await _decisionEngine.DecideAsync(runGuid, contextSnapshotId, graphForDecision, findings, cancellationToken);
            }
```

`CommitPipelineManifestReuseService.TryReusePipelineManifestAsync` (`ArchLucid.Application/Runs/Orchestration/CommitPipelineManifestReuseService.cs:47-92`)
correctly finds and returns the **existing, already-persisted** manifest + trace row (fetched via
`_goldenManifestRepository.GetByIdAsync` / `_decisionTraceRepository.GetByIdAsync`, which only succeed
because the rows are already there) when `run.GoldenManifestId`/`DecisionTraceId` are set and the
context/graph/findings snapshot ids still align.

**This is where the bug is: nothing downstream distinguishes "trace/manifest freshly decided, needs to
be INSERTed" from "trace/manifest reused from an already-persisted row, must NOT be INSERTed again."**
`ManifestFinalizationService.FinalizeSqlAsync` unconditionally calls an INSERT-only save on whatever
`DecisionTraceDto` it was handed, reused or not:

```105:124:ArchLucid.Application/Runs/Finalization/ManifestFinalizationService.cs
        if (string.Equals(locked.LegacyRunStatus, nameof(ArchitectureRunStatus.Committed), StringComparison.OrdinalIgnoreCase))
        {
            if (locked.GoldenManifestId is not { } manifestId)
                throw new ConflictException($"Run '{request.RunId:D}' is Committed but GoldenManifestId is missing on the run record.");
            await uow.CommitAsync(cancellationToken);
            return new ManifestFinalizationResult(manifestId, true, locked.CurrentManifestVersion ?? string.Empty, null);
        }
        ...
        RuleAuditTracePayload audit = request.Trace.RequireRuleAudit();
        await decisionTraceRepository.SaveAsync(DecisionTraceRecordMapper.ToDto(request.Trace), cancellationToken, connection, transaction);
```

The **only** idempotent short-circuit (line 105) checks `LegacyRunStatus == "Committed"` — but this run
**never reaches `Committed`**, precisely *because* every attempt to get there throws on line 124. That
is the deadlock: the guard that would prevent the duplicate insert only activates *after* a successful
commit, but a successful commit is exactly what this bug prevents from ever happening.

```24:92:ArchLucid.Persistence/Repositories/SqlDecisionTraceRepository.cs
    public async Task SaveAsync(DecisionTraceDto trace, CancellationToken ct, IDbConnection? connection = null, IDbTransaction? transaction = null)
    {
        ...
        const string sql = """
                           INSERT INTO dbo.DecisioningTraces
                           ( TenantId, WorkspaceId, ProjectId, DecisionTraceId, RunId, CreatedUtc, ... )
                           VALUES ( @TenantId, @WorkspaceId, @ProjectId, @DecisionTraceId, @RunId, @CreatedUtc, ... );
                           """;
```

Plain `INSERT`, no existence check, no `MERGE`/upsert. When `trace` came from the **reuse** path, this
row **already exists** (that's the whole point of "reuse" — it was read back via `GetByIdAsync`), so
this always throws `SqlException` 2627, forever, for that run.

`AuthorityDrivenArchitectureRunCommitOrchestrator.CommitRunAsync`'s outer retry loop
(`ArchLucid.Application/Runs/Orchestration/AuthorityDrivenArchitectureRunCommitOrchestrator.cs:191-258`)
catches this via `SqlUniqueConstraintViolationDetector.IsUniqueKeyViolation(ex)`, calls
`TryReconcileAfterConcurrentCommitAsync` (designed for the *legitimate* case of a genuinely concurrent
commit by another caller finishing first) — which fails to reconcile because the run's status is not
`Committed` — retries a few times, then gives up and returns a `409 Conflict` telling the *client* to
retry. The E2E test's own `commitRun` helper (or its underlying transient-retry wrapper) does retry,
which is why the log shows this exact cycle repeating across multiple separate HTTP requests
(`00000006`, `00000008`, `0000000A`, `0000000D`, `00000010`, ...) for **22+ minutes** before the test's
Playwright timeout finally kills it. With 1 worker (serial shard execution), this single stuck test
alone burns ~20+ minutes of the shard before even reaching the next test, and the pattern repeats for
every subsequent test that creates a real run — accounting for essentially all 77 minutes of job time.

### Secondary, non-blocking finding (same shape, does not need fixing here)

The same log also shows, once per run, a **tolerated** duplicate-key exception on `dbo.AgentResults`
during `/execute` (`AgentResultDuplicateConflictException` → `PK__AgentRes__...`), caught inside
`AgentArchitectureFindingConfidenceEnricher.TryEnrichRunAsync` and logged as a `WRN` ("Engine
provenance capture failed ... continuing without enriched scores") — this one **does not block or
retry**, execution proceeds. It looks like the same class of "something already inserted this row"
issue, but since it is already handled gracefully and does not affect the test outcome, **do not fix
it in this prompt** — file it as a follow-up backlog note if you want (optional), but the commit-path
bug above is the one actually failing tests.

## Fix

### Step 0 — reproduce locally before coding (should take ~10 minutes)

1. Start the API + SQL locally per `archlucid-ui/docs/TESTING_AND_TROUBLESHOOTING.md`, in
   `DevelopmentBypass` auth mode with `Demo:SeedOnStartup=true` (matching CI).
2. Run `POST /v1/architecture/request` with a payload shaped like
   `archlucid-ui/e2e/helpers/live-api-client.ts`'s `createRun()` (short description, `environment:
   "prod"`, no `priorManifestVersion`) and confirm the response / a `GET
   /v1/architecture/review/{id}` shows `Deferred=false` behavior — i.e. `GoldenManifestId` and
   `DecisionTraceId` are **already populated** on the run immediately after creation, before you ever
   call `/execute` or `/commit`. If they are **not** already populated at this point for your local
   repro, this specific mechanism does not apply the same way here — stop and report back with what
   you observe instead of proceeding blindly to the fix below.
3. Call `/execute` then `/commit` on that run id and confirm you reproduce the exact
   `PK__Decision...` violation on `dbo.DecisioningTraces` with a `DecisionTraceId` matching the value
   already logged at "Authority pipeline completed" during step 2.
4. Confirm at least one *other* failing spec from the table above (e.g. `live-api-alert-rules` or
   `live-api-concurrency`) reproduces the same shape locally, to rule out this being specific to the
   `advisory-flow` scenario content.

### Step 1 — make the reused-manifest commit path idempotent

Read `ManifestFinalizationRequest`, `ManifestFinalizationSqlRepository`, and the existing tests
(`ArchLucid.Application.Tests/Runs/Finalization/ManifestFinalizationServiceTests.cs`,
`ManifestFinalizationConcurrencyTests.cs`, and
`ArchLucid.Application.Tests/Runs/Orchestration/CommitPipelineManifestReuseServiceTests.cs`) before
choosing an approach. Note that **no existing test exercises "reuse returned non-null AND the run is
not yet Committed"** — that gap is why this shipped unnoticed. Candidate approaches (pick the one that
best fits the existing design after reading the code; do not assume Option A without checking):

- **Option A (preferred if it fits cleanly):** Thread a `bool isReusedManifest` (or similar) from
  `AuthorityDrivenArchitectureRunCommitOrchestrator.CommitRunCoreAsync` through
  `ManifestFinalizationRequest` into `FinalizeSqlAsync`/`FinalizeLegacyAsync`. When true, **skip** the
  `decisionTraceRepository.SaveAsync(...)` call (line 124) and the `goldenManifestRepository.SaveAsync(...)`
  call (line 129) entirely — the rows already exist and already match (that's what "reuse" verified via
  `PipelineManifestAlignsWithCommitSnapshots`) — and proceed straight to the run-header
  status transition (`ExecuteFinalizeProcedureAsync`, audit, outbox) using the **existing**
  `GoldenManifestId`/`DecisionTraceId`.
- **Option B:** Make `SqlDecisionTraceRepository.SaveAsync` (and the equivalent `GoldenManifests` save
  path) tolerate "this exact row, with this exact content, already exists" as a no-op success instead
  of throwing — e.g. check-then-skip, or catch the specific duplicate-key error **only** when the
  existing row's content matches what would have been inserted. Weigh this against the risk of
  silently swallowing a **genuine** cross-run id collision (a real bug) if one ever occurs elsewhere.
- Whichever option you choose, add the missing test case to
  `ManifestFinalizationServiceTests.cs` (or a new integration test) that exercises "reuse returned a
  result, run not yet Committed, finalize succeeds without a duplicate-key throw" — this is the exact
  gap that let this ship.

### Step 2 — do not touch the E2E test harness or CI workflow

This is a production application bug (`ArchLucid.Application` / `ArchLucid.Persistence`), not a
test-isolation problem. Do **not** add `tenantScope` isolation to the E2E spec files, and do **not**
add `Observability__ConsoleExporter__Enabled` to `.github/workflows/ci.yml` — that work belongs to the
old prompts (see Â§ Related) and should only be picked up later, if at all, after this fix lands and
shard 2/3 are re-run.

## Acceptance criteria

1. Step 0's local repro is completed and its outcome (matches / doesn't match the description) is
   stated explicitly before Step 1 is attempted.
2. A run that goes through `POST /request` (non-deferred) → `/execute` → `/commit` succeeds (200) on
   the **first** `/commit` call — no `PK__Decision...`/`PK__GoldenManifest...` violation, no 409, no
   retry loop.
3. A **second** `/commit` call on the **same already-committed** run still returns the existing
   idempotent-committed result (the `LegacyRunStatus == "Committed"` short-circuit at
   `ManifestFinalizationService.cs:105-111` must still work correctly for genuinely-already-committed
   runs — do not regress that path while fixing the reuse-but-not-yet-committed path).
4. A new automated test (unit or integration) covers "reuse returned a result while the run is not yet
   Committed" and fails on the pre-fix code, passes on the post-fix code.
5. No changes to `archlucid-ui/e2e/**` or `.github/workflows/ci.yml` in this prompt's diff.
6. `dotnet build`/relevant test project(s) touched by the fix pass locally (see
   `.cursor/rules/shell-hygiene.mdc` for compile-check invocation).

## Verification

After the fix, re-run the local repro from Step 0 end-to-end (`request` → `execute` → `commit`) at
least 3 times against a fresh local DB and confirm every commit succeeds on the first attempt with no
duplicate-key warnings in the console log. Then, if you have CI access, trigger (or wait for) the next
scheduled/`workflow_dispatch` run of shard 2 and shard 3 of the extended-matrix job and confirm the
`unique-key violation without reconcilable manifest` log line no longer appears for either shard.

## Related

- `.cursor/prompts/fix-ci-run-2526-live-api-extended-shard2-sample-purge.md` — the prior (never
  implemented) diagnosis of this same 11-test failure signature as a tenant-wide `SampleRunPurge`
  problem. **Do not implement its E2E `tenantScope` isolation fix or its CI `ConsoleExporter` env var
  yet.** See the follow-up prompt below for when (if ever) to revisit it.
- `.cursor/prompts/fix-ci-run-28828296262-live-api-extended-shard3-sample-purge.md` — the shard-3
  sibling of the above, also never implemented. Same guidance applies.
- `.cursor/prompts/fix-ci-run-2529-live-api-extended-shard2-followup-recheck.md` — run this **after**
  the fix in this prompt has merged and a fresh shard 2/3 CI run has completed, to decide whether the
  old tenant-isolation prompts are still needed.
- `.cursor/prompts/fix-ci-run-2529-live-api-extended-shard3-decision-trace-timeout.md` — shard 3/4
  sibling diagnosis for run **2529** (90m timeout, same bug, different spec subset); **do not implement
  separately** — this prompt's fix covers both shards.
- `docs/architecture/adrs/0030-coordinator-authority-pipeline-unification.md` — background on why the
  Authority pipeline runs inline at request-creation time for non-deferred runs (intentional design;
  not itself the bug).
- CI artifacts (run `28871046590`, job `85651988017`): `ui-e2e-live-extended-test-results-2` (Playwright
  traces), `ui-e2e-live-extended-api-log-2` (207 KB API console log — small enough to read in full),
  `ui-e2e-live-extended-playwright-report-2` (HTML report).
