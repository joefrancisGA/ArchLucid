# Fix: CI #2152 — recurring SQL .NET shard failures (core libs 1/4 + Api.Tests 3/6)

**Run:** 27395468550 · **Branch:** `ci/fix-idempotency-concurrency-hang-guard` · **Commit:** `e5910318a`

## Affected jobs

- `.NET: full regression — core libraries shard 1/4 (SQL, non-Api Category!=Slow)`
- `.NET: full regression — Api.Tests integration shard 3/6 (SQL)`

These same two shards also failed in CI #2151. The other core-libs shards (2/4, 3/4, 4/4) pass
cleanly in the same run, which points to a localized test-host hang/deadlock rather than a broad
regression.

## Symptom (core libs shard 1/4, from #2151 logs)

```
The active test run was aborted. Reason: Test host process crashed
Data collector 'Blame' message: The specified inactivity time of 30 minutes has elapsed.
  Collecting hang dumps from testhost and its child processes.
The active Test Run was aborted because the host process exited unexpectedly.
Process completed with exit code 1.
```

The 30-minute inactivity window fell **between** `ArchLucid.ContextIngestion.Tests` (passed) and
`ArchLucid.Host.Composition.Tests` (passed after the crash) — i.e. a SQL-backed test assembly in
that ordering (most likely `ArchLucid.Persistence.Tests` or `ArchLucid.Application.Tests`) held the
test host until the blame timer fired.

## Investigation steps (do these before changing any code)

1. **Pull the blame hang dump** uploaded by the failing job (artifact named like
   `dotnet_<pid>_<timestamp>_hangdump.dmp`). The managed stacks in the dump name the exact test and
   the blocking call (SQL command, lock wait, or an un-canceled await).
2. **Check the SQL test fixtures** for transactions opened at `Serializable` isolation without a
   command/connection timeout — these can deadlock under shared CI catalogs:
   - `ArchLucid.Persistence.Tests/SqlServerPersistenceFixture.cs` (line ~286 opens a
     `Serializable` transaction)
   - `ArchLucid.Persistence.Tests/Contracts/TenantPriming*Repository.cs` (several `Serializable`
     `BeginTransactionAsync` calls)
3. **Review the recently-touched delete path.** `DapperDraftRequestRepository.HardDeleteTerminalDraftsBatchAsync`
   (annotated `[TenantScopeExempt]` earlier this session) issues a `DELETE TOP (@BatchSize) … OUTPUT`
   against `dbo.DraftRequests`. Confirm no test runs it concurrently with another writer in a way
   that produces a lock cycle, and that the Dapper `CommandDefinition` carries the
   `CancellationToken` (it does in the repo) and a bounded command timeout.

## Fix options (apply only what the dump justifies)

- If the dump names a specific test holding a SQL lock: add a bounded `CommandTimeout` to the
  offending Dapper command, or a per-test timeout, so it fails fast instead of hanging 30 minutes.
- If a `Serializable` fixture transaction is the blocker: lower isolation where correctness allows,
  or ensure the transaction is always committed/rolled back in a `finally`.
- If the dump shows no product/test defect (e.g. the host was starved waiting on the SQL container):
  treat as infrastructure flakiness and **re-run CI**. Shards 2–4 passing supports this. Do **not**
  widen global timeouts speculatively.

## Api.Tests shard 3/6

In #2151 and #2152 this shard's logs were unavailable (log blob expired / step had no recorded
conclusion). After the deterministic UI/docs fixes land and a fresh CI run starts:

1. If shard 3 fails again, fetch its logs immediately (before the blob expires) and capture the
   specific failing test names + error.
2. Append the findings here as a new section and fix the named tests.

## Verify

- After any code fix, run the affected assembly locally against a SQL container, e.g.:
  `.\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.Persistence.Tests/ArchLucid.Persistence.Tests.csproj'`
  then the project's `dotnet test` with the same `Category!=Slow` filter the shard uses.
- Confirm the assembly completes well under the blame inactivity window.
