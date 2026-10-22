# Fix: CI run #2179 — `RetrievalQueryEmptyIndexSmokeIntegrationTests` hang (integration shard 2/6)

**Run:** 27486770797 · **Branch:** `ci/fix-idempotency-concurrency-hang-guard`  
**Commit:** `b7bf442d12e0a49c587758bf1104ad7bf77a2ff4`  
**Job:** `.NET: full regression — Api.Tests integration shard 2/6 (SQL)` (databaseId `81246428579`)

## Symptom

```
[xUnit.net 00:08:21.26]
  ArchLucid.Api.Tests.RetrievalQueryEmptyIndexSmokeIntegrationTests
    .Query_with_no_indexed_documents_returns_empty_list [FAIL]

  Error Message:
    System.TimeoutException : Integration test
    'Query_with_no_indexed_documents_returns_empty_list' exceeded 480s.

Failed  1, Passed  84, Skipped  2, Total  87 — Duration: 1 h 50 m
```

A test that should return an empty list quickly hangs for the full **480-second** `IntegrationTestDeadline`.

## Context

`RetrievalQueryEmptyIndexSmokeIntegrationTests` is a class that appeared in the committed version
of this branch (`b7bf442d12e0a49c587758bf1104ad7bf77a2ff4`). The local working tree has
`RetrievalQuerySmokeIntegrationTests.cs` modified, suggesting an ongoing refactor. The committed
class likely hosts the "empty index" test case that was split from the main smoke class.

Prior hang work:
- `.cursor/prompts/fix-ci-run-2155-api-tests-shard2-retrieval-smoke-hang.md` — covers
  `RetrievalQuerySmokeIntegrationTests` hangs; introduced `RetrievalQuerySmokeSharedHostFixture`
  and `IntegrationTestHostStartup.EnsureStartedAsync` for retrieval tests.
- `.cursor/prompts/fix-retrieval-smoke-hang-240s.md` — covers all 4 tests in
  `RetrievalQuerySmokeIntegrationTests` timing out at 240 s.

`Query_with_no_indexed_documents_returns_empty_list` was previously part of
`RetrievalQuerySmokeIntegrationTests`. If the branch split it into `RetrievalQueryEmptyIndexSmokeIntegrationTests`,
that new class may not have the bounded startup pattern in place.

## Root cause

`RetrievalQueryEmptyIndexSmokeIntegrationTests` (in the committed version) likely:
1. Creates its own `WebApplicationFactory` instance (separate from `RetrievalQuerySmokeSharedHostFixture`),
   OR reuses `RetrievalQuerySmokeSharedHostFixture` but does not call
   `IntegrationTestHostStartup.EnsureStartedAsync` before accessing `factory.Services`/`CreateClient()`.
2. Under CI load, the host startup blocks, and `IntegrationTestDeadline` fires at 480 s.

## Fix

### Option A — use the shared fixture (preferred)

If `RetrievalQueryEmptyIndexSmokeIntegrationTests` was meant to share the same warm host as
`RetrievalQuerySmokeIntegrationTests`:

- Make it an `IClassFixture<RetrievalQuerySmokeSharedHostFixture>` (same fixture as the main class).
- Call `IntegrationTestHostStartup.EnsureStartedAsync(() => sharedHost.Services)` at the start of
  the test (or in the fixture's `InitializeAsync`).
- This ensures the empty-index test shares the bounded-startup pattern already established.

### Option B — dedicated bounded startup

If the class needs its own host:

- Follow the same pattern as `RetrievalQuerySmokeIntegrationTests.cs` (lines 116–119).
- Add a bounded `EnsureStartedAsync` call before any `factory.Services` / `CreateClient()` access.

### Option C — collapse the class (if the split was accidental)

If the local working tree modifications to `RetrievalQuerySmokeIntegrationTests.cs` represent the
correct intent (moving `Query_with_no_indexed_documents_returns_empty_list` back into the main
class as `A_Query_with_no_indexed_documents_returns_empty_list`), commit the working tree changes
and confirm the test is guarded by the existing `EnsureStartedAsync` setup in the fixture.

## Investigation steps

1. Read the committed `ArchLucid.Api.Tests/RetrievalQuerySmokeIntegrationTests.cs` (current working
   tree — modified) to see what `RetrievalQueryEmptyIndexSmokeIntegrationTests` looked like.
2. Read `ArchLucid.Api.Tests/RetrievalQuerySmokeSharedHostFixture.cs` (also modified locally).
3. Determine whether the working tree changes (Option C) are complete and correct, or whether a
   new class still needs the bounded-start pattern (Option A/B).

## Acceptance criteria

1. `Query_with_no_indexed_documents_returns_empty_list` passes (fast, no hang).
2. No `Completed="False"` in the blame `Sequence_*.xml` for this test.
3. All other `RetrievalQuerySmokeIntegrationTests` tests continue to pass.
4. `ArchLucid.Backend.slnf` compile check passes.

## Verification

```powershell
dotnet test ArchLucid.Api.Tests/ArchLucid.Api.Tests.csproj -c Release `
    --filter 'FullyQualifiedName~RetrievalQuery' `
    --blame-hang --blame-hang-timeout 3min --blame-hang-dump-type mini
```

## Related

- `.cursor/prompts/fix-ci-run-2155-api-tests-shard2-retrieval-smoke-hang.md` (prior shard 2/6 retrieval hang)
- `.cursor/prompts/fix-retrieval-smoke-hang-240s.md` (240-second deadline fix for all 4 retrieval tests)
- `ArchLucid.Api.Tests/RetrievalQuerySmokeSharedHostFixture.cs` (locally modified)
- `ArchLucid.Api.Tests/RetrievalQuerySmokeIntegrationTests.cs` (locally modified)
- `ArchLucid.Api.Tests/IntegrationTestHostStartup.cs` — `EnsureStartedAsync`, 120s bound
