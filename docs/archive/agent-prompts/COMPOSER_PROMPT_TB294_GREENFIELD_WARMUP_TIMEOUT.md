> **Scope:** Fix CI failure `ValueReportDemoRunIsolationIntegrationTests.First_value_report_for_real_run_does_not_reference_showcase_demo_run_ids_sql_tb294` — greenfield SQL warmup budget exhaustion on overloaded shards. Composer implementation prompt only.

# Composer Prompt — TB-294 greenfield warmup timeout (CI shard flake)

> **Created:** 2026-06-09  
> **Failure:** `System.OperationCanceledException` — "Response buffering was aborted after the request cancellation token fired."  
> **Duration:** ~50m 10s (matches `GreenfieldSqlHostBootstrapBudget`)  
> **Precedent:** TB-291 fixed in `c202b87cc` (`ReferenceEvidenceAdminExportIntegrationTests` + `WarmupTimedOutException`)  
> **Related:** TB-295 (`AuditExportTenantIsolationIntegrationTests`) uses the same warmup path without skip handling

---

## Diagnosis (read first)

### What failed

The test never reached its TB-294 assertion (`GET /v1/pilots/runs/{runId}/first-value-report` must not contain Contoso demo run ids). It failed during **primer warmup**:

```
WarmGreenfieldSqlHostForArchitectureRequestTestsAsync(primer)
  → WarmSingleCreateRunPathAsync
    → PostSingleArchitectureRequestWithGreenfieldTransientRetryAsync (max 20 attempts × 15 min attempt budget)
      → PostArchitectureRequestAndBufferAsync  ← cancellation during response buffering
```

### Why ~50 minutes

`ArchitectureRequestConcurrencyTestSupport.GreenfieldSqlHostBootstrapBudget` is **50 minutes**. On cold/overloaded CI SQL shards, create-run warmup can burn the budget through:

1. **Health + list-runs** backoff (503 retries, up to ~8 min worst case)
2. **Repeated 15-minute per-attempt ceilings** (`GreenfieldSqlArchitectureRequestBurstHttpTimeout`) when `POST /v1/architecture/request` waits on `sp_getapplock` + authority pipeline on a slow shard
3. **Transient 503 / client-abort retries** inside `PostSingleArchitectureRequestWithGreenfieldTransientRetryAsync`

The failure duration (~50m 10s) is the bootstrap `CancelAfter` firing mid-buffer, not a product bug in first-value-report demo isolation.

### Gap vs TB-291

`ReferenceEvidenceAdminExportIntegrationTests` already:

- Catches `WarmupTimedOutException` and calls `Skip.Always(...)` for overloaded shards
- Relies on `WarmGreenfieldSqlHostForArchitectureRequestTestsAsync` wrapping bootstrap `OperationCanceledException` into `WarmupTimedOutException` (added in `c202b87cc`)

`ValueReportDemoRunIsolationIntegrationTests` (TB-294) calls the same warmup but **does not** handle `WarmupTimedOutException`. On shards before `c202b87cc`, the raw `OperationCanceledException` surfaces (as in the CI log).

### What this is NOT

- Not a regression in `FirstValueReportBuilder` demo-run isolation logic (test never got that far)
- Not fixed by raising bootstrap budget again alone (already raised 30m → 50m in `fbbadfd7a`; still exhausts on worst shards)
- Not a reason to remove full create-run warmup (comment in TB-294 is correct: list/health-only warmup leaves the first real POST on the 15m retry loop)

---

## Composer task (copy below into a fresh Agent session)

```
Fix TB-294 CI flake: greenfield SQL warmup budget exhaustion on overloaded shards.

CONTEXT
- Failing test: ArchLucid.Api.Tests/ValueReports/ValueReportDemoRunIsolationIntegrationTests.cs
  First_value_report_for_real_run_does_not_reference_showcase_demo_run_ids_sql_tb294
- Error: OperationCanceledException / WarmupTimedOutException during
  ArchitectureRequestConcurrencyTestSupport.WarmGreenfieldSqlHostForArchitectureRequestTestsAsync
- TB-291 precedent: ArchLucid.Api.Tests/Security/ReferenceEvidenceAdminExportIntegrationTests.cs
  catches WarmupTimedOutException and Skip.Always(...) — mirror this pattern.

GOALS
1. TB-294 must not hard-fail when an overloaded CI shard cannot finish greenfield create-run warmup
   within GreenfieldSqlHostBootstrapBudget (50 min).
2. When warmup succeeds, TB-294 behavior is unchanged (real run → execute → commit → first-value-report
   must not contain ContosoRetailDemoIdentifiers).
3. Keep the full create-run warmup (includePostCreateRunWarmup: true default) — do not switch to
   list/health-only warmup for this test.

IMPLEMENTATION (minimal, reuse aggressively)

A) ValueReportDemoRunIsolationIntegrationTests.cs
   - Wrap the primer warmup block in try/catch (WarmupTimedOutException) exactly like TB-291.
   - Skip message should mention TB-294, GreenfieldSqlHostBootstrapBudget, and overloaded shard.
   - Use Skip.Always (not Skip.If) — same as TB-291.

B) Optional but preferred — DRY helper (only if it reduces duplication without scope creep)
   - Add a small internal helper in ArchitectureRequestConcurrencyTestSupport, e.g.
     TryWarmGreenfieldSqlHostForArchitectureRequestTestsOrThrowAsync, OR a test-side extension
     used by TB-291 and TB-294, so skip messaging stays consistent.
   - If you add a helper, update TB-291 to use it in the same PR (no behavior change).

C) Hardening — ArchitectureRequestConcurrencyTestSupport.cs
   - Apply the same try/catch → WarmupTimedOutException wrapper to
     WarmGreenfieldSqlHostAndSeedExecutedRunAsync (currently missing; inconsistent with
     WarmGreenfieldSqlHostForArchitectureRequestTestsAsync).
   - In WarmGreenfieldSqlHostForArchitectureRequestTestsAsync catch block, also treat raw
     OperationCanceledException whose message contains
     "Response buffering was aborted after the request cancellation token fired"
     as warmup timeout when bootstrap.Token.IsCancellationRequested (belt-and-suspenders for
     shards running pre-c202b87cc wrapper code paths).

D) TB-295 (same PR if trivial)
   - AuditExportTenantIsolationIntegrationTests.SeedTenantACommittedRunAsync uses full warmup
     without skip handling. Apply the same WarmupTimedOutException → Skip.Always pattern at the
     test level OR propagate via shared seed helper — pick the smallest diff.

CONSTRAINTS
- Do not increase GreenfieldSqlHostBootstrapBudget again unless you add a comment proving math
  (2 × 15m + list-runs + headroom); prefer skip-on-overload over longer CI hangs.
- Do not weaken TB-294 assertions (demo id checks stay).
- Do not change production API or FirstValueReportBuilder — test infrastructure only.
- One class per file; match existing ArchLucid.Api.Tests style (blank line before if/foreach).
- No ConfigureAwait(false) in tests.

ACCEPTANCE CRITERIA
- dotnet test ArchLucid.Api.Tests/ArchLucid.Api.Tests.csproj \
    --filter "FullyQualifiedName~ValueReportDemoRunIsolationIntegrationTests" \
    passes locally when SQL is configured (or skips cleanly when not).
- Unit-level: if you add a helper, add a focused test only when it encodes non-trivial branching;
  otherwise manual review is enough.
- Grep confirms TB-294 and TB-291 share the same warmup-timeout posture.
- WarmGreenfieldSqlHostAndSeedExecutedRunAsync throws WarmupTimedOutException on bootstrap expiry.

VERIFY
- Read ReferenceEvidenceAdminExportIntegrationTests.cs lines ~39-50 for the exact skip pattern.
- Read ArchitectureRequestConcurrencyTestSupport.cs GreenfieldSqlHostBootstrapBudget comments
  before editing budgets.
```

---

## Test plan (human / CI)

- [ ] Run TB-294 filter on a machine with SQL env configured
- [ ] Confirm skip path: temporarily lower `GreenfieldSqlHostBootstrapBudget` to 1s in a local branch, run test → expect `Skip.Always` not hard fail (revert before commit)
- [ ] Regression shard: TB-291 still skips or passes on same warmup helper
- [ ] No change to TB-294 assertion strings (`ContosoRetailDemoIdentifiers.*`)

---

## Follow-up (out of scope for this prompt)

- Investigate why cold-shard `POST /v1/architecture/request` repeatedly nears the 15m attempt ceiling (demo seed at host boot, lock contention, pipeline timeout). Track as separate TB if warmup skip rate is high in CI metrics.
- Consider collection-level shared `GreenfieldSqlApiFactory` warmup for `ArchLucidEnvMutation` tests to amortize DbUp — larger refactor.
