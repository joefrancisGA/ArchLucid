# Fix: AuditTrailCommitIntegrityIntegrationTests CI timeout (TB-290)

## Symptom

`Tenant_b_audit_search_by_tenant_a_run_id_returns_empty_sql_tb290` hard-fails in CI after ~50 minutes:

```
System.InvalidOperationException : POST /v1/architecture/request did not succeed after 10 greenfield transient retries.
```

The test runs for ~50 m because `PostSingleArchitectureRequestWithGreenfieldTransientRetryAsync` fires
10 × 15-minute per-attempt timeouts before throwing.

## Root cause

`Tenant_b_audit_search_by_tenant_a_run_id_returns_empty_sql_tb290` (line ~100 in
`ArchLucid.Api.Tests/Security/AuditTrailCommitIntegrityIntegrationTests.cs`) calls the warmup
helper with `includePostCreateRunWarmup: false`:

```csharp
await GreenfieldSqlIntegrationWarmup.WarmArchitectureRequestHostOrSkipOnShardOverloadAsync(
    primer,
    includePostCreateRunWarmup: false);
```

This means the warmup only performs `HealthReadyProbe.EnsureReadyAsync` + `WarmListRunsPathAsync`.
The SQL host is therefore **not warm for the architecture-request endpoint** when the test body
executes its own `PostArchitectureRequestAsync`.

`PostSingleArchitectureRequestWithGreenfieldTransientRetryAsync` is designed for **post-warmup
transient** 503s (10 attempts, exponential back-off, no time budget). On a cold host, all 10
attempts return `503 ServiceUnavailable` and the method throws `InvalidOperationException`, causing a
hard failure instead of a `Skip`.

The sibling test `Commit_path_audit_search_contains_run_lifecycle_events_sql_tb290` uses the default
`includePostCreateRunWarmup: true` and never fails this way.

## Fix

**File:** `ArchLucid.Api.Tests/Security/AuditTrailCommitIntegrityIntegrationTests.cs`

Remove the `includePostCreateRunWarmup: false` argument so the warmup performs the full
health → list-runs → create-run sequence (20 attempts within the 50-minute bootstrap budget).
The test body's own `PostArchitectureRequestAsync` call then runs against a warm host, where
10 transient-retry attempts are more than sufficient.

### Change

```csharp
// BEFORE (line ~100)
await GreenfieldSqlIntegrationWarmup.WarmArchitectureRequestHostOrSkipOnShardOverloadAsync(
    primer,
    includePostCreateRunWarmup: false);

// AFTER — restore full warmup; cold-start create-run recovery belongs in the warmup
// budget path (20 attempts / 50 m) not in the 10-attempt transient-retry helper.
await GreenfieldSqlIntegrationWarmup.WarmArchitectureRequestHostOrSkipOnShardOverloadAsync(primer);
```

Also update the stale comment immediately above that call:

```csharp
// BEFORE comment
// Readiness + list-runs only; this test performs its own create-run with transient retry.

// AFTER comment
// Full warmup including one create-run POST; ensures SQL is warm before the tenant-A
// create-run in the test body. The 10-attempt transient-retry helper is not a cold-start
// substitute for the warmup's 50-minute bootstrap budget.
```

## Acceptance criteria

1. The change is purely in `AuditTrailCommitIntegrityIntegrationTests.cs` — no other files.
2. `Commit_path_audit_search_contains_run_lifecycle_events_sql_tb290` is unchanged.
3. Both TB-290 tests still skip gracefully (`WarmupTimedOutException` → `Skip`) when the CI
   shard is overloaded.
4. No compile errors (`ArchLucid.Backend.slnf` must still build).

## Verification (read-only — do not run)

Confirm no other callers in `AuditTrailCommitIntegrityIntegrationTests.cs` pass
`includePostCreateRunWarmup` as an explicit argument.
