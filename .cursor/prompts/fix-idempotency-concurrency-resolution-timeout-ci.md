# Fix: CreateRunIdempotencyConcurrencyIntegrationTests resolution-phase CI timeout

## Symptom

`Parallel_posts_with_same_idempotency_key_yield_single_run_id` fails in CI after ~40 minutes:

```
System.OperationCanceledException : ResolveServiceUnavailablePerResponseAsync aborted: outer cancellation token fired (hang guard or test CancellationToken expired) while retrying slot 0, attempt 4.
---- System.OperationCanceledException : Response buffering was aborted after the request cancellation token fired.
```

Stack lines match post-`cd73860ba` code (`CreateRunIdempotencyConcurrencyIntegrationTests.cs` ~125,
`ArchitectureRequestConcurrencyTestSupport.cs` ~203).

## Recent fix (partial)

Commit **`cd73860ba`** (2026-06-09, branch `ci/fix-idempotency-concurrency-hang-guard`) split the
100-minute outer hang guard into:

| Phase | Budget |
|-------|--------|
| Burst (`PostParallelArchitectureRequestWithTransientRetryAsync`) | 80 min (`ParallelCreateRunBurstPhaseGuard`) |
| Resolution (`ResolveServiceUnavailablePerResponseAsync`) | 20 min (`ParallelCreateRunResolutionGuard`) |

That fixed the earlier failure mode where the burst consumed the entire 100-minute token and
resolution started already canceled. **This failure is the next bottleneck.**

## Root cause

`ParallelCreateRunResolutionGuard` is hard-capped at **20 minutes** (15 min per-POST ceiling + 5 min
headroom), even when the burst finishes early and the outer 100-minute hang guard still has ~80 minutes
remaining.

`ResolveServiceUnavailablePerResponseAsync` gives each 503 slot up to **25** retries, each with its own
`GreenfieldSqlArchitectureRequestBurstHttpTimeout` (**15 min**) per-attempt budget. On cold CI SQL, a
single slot can legitimately need several near-full 15-minute attempts before the idempotency lock chain
clears.

Typical failing timeline (~40 m total):

1. Greenfield warmup (readiness + list-runs, no create-run warm): ~5–15 min
2. Burst phase completes: ~15–25 min
3. Resolution phase hits the **20 min** `resolutionPhaseGuard` during slot-0 attempt 4 → cancel

The burst-phase guard already guarantees at least 20 minutes remain on the outer hang guard when burst
ends at its 80-minute cap. **Resolution should consume remaining outer time, not a second fixed 20-minute
wall.**

## Fix

**Primary files:**

- `ArchLucid.Api.Tests/CreateRunIdempotencyConcurrencyIntegrationTests.cs`
- `ArchLucid.Api.Tests/ArchitectureRequestConcurrencyTestSupport.cs` (only if helper changes are needed)

### 1. Give resolution the remaining hang-guard budget

Replace the fixed `resolutionPhaseGuard.CancelAfter(ParallelCreateRunResolutionGuard)` with a budget
derived from elapsed wall time since the outer hang guard started:

```csharp
using CancellationTokenSource resolutionPhaseGuard = CancellationTokenSource.CreateLinkedTokenSource(ct);
TimeSpan resolutionBudget = ComputeRemainingParallelCreateRunBudget(burstStopwatch.Elapsed);
resolutionPhaseGuard.CancelAfter(resolutionBudget);
```

Where `ComputeRemainingParallelCreateRunBudget` returns:

```csharp
TimeSpan remaining = ParallelCreateRunHangGuard - elapsedSinceHangGuardStart;
TimeSpan floor = ParallelCreateRunResolutionGuard; // minimum 20 min when burst ran long
return remaining > floor ? remaining : floor;
```

Alternatively (simpler): pass **`ct` directly** to `ResolveServiceUnavailablePerResponseAsync` and
**remove** the resolution-phase `CancelAfter` entirely — the burst-phase guard already prevents burst
from consuming more than 80 of the 100 minutes.

Prefer the explicit remaining-budget helper so comments and CI blame-hang math stay auditable.

### 2. Optional hardening (pick one if still flaky)

- **Skip on overload:** wrap resolution in `catch (OperationCanceledException)` when
  `resolutionPhaseGuard.Token.IsCancellationRequested` and call
  `GreenfieldSqlIntegrationWarmup.SkipShardOverload()` (same pattern as TB-290 audit tests).
- **Raise outer guard + CI blame-hang** only if resolution still needs >80 min after fix (unlikely).

Do **not** revert the burst/resolution split from `cd73860ba`.

### 3. Update comments

Document that `ParallelCreateRunResolutionGuard` is a **minimum** reserve when burst consumes nearly
all 80 minutes, not the maximum resolution time when burst finishes early.

## Acceptance criteria

1. Resolution phase can use **remaining** outer hang-guard time (up to ~100 min minus burst elapsed),
   not a flat 20-minute cap after a short burst.
2. Burst phase remains capped at `ParallelCreateRunHangGuard - ParallelCreateRunResolutionReserve`
   (80 min today).
3. Total wall clock stays below slow-shard `--blame-hang-timeout 105min` including
   `GreenfieldSqlHostBootstrapBudget` warmup (~50 min) — adjust CI comment in `.github/workflows/ci.yml`
   only if outer guard increases.
4. No product/API changes — test harness timing only.
5. `ArchLucid.Backend.slnf` compile check passes.

## Verification (read-only — do not run full slow shard locally unless asked)

1. Confirm line numbers in failing CI log match resolution block (~121–131) in current
   `CreateRunIdempotencyConcurrencyIntegrationTests.cs`.
2. Grep for `ParallelCreateRunResolutionGuard` — ensure it is documented as floor, not ceiling.
3. Confirm `ArchitectureRequestIdempotencyConcurrencyIntegrationTests` (InMemory factory, no hang guard)
   is unchanged unless shared helper signature changes.

## Related

- Prior fix: `cd73860ba` — split burst/resolution hang guards
- Similar skip pattern: `.cursor/prompts/fix-audit-trail-warmup-timeout-ci.md` (TB-290 warmup)
- CI slow shard: `.github/workflows/ci.yml` — `--blame-hang-timeout 105min` for `Category=Slow`
