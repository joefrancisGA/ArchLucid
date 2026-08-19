# Fix: CI run #2179 — `ArchitectureFindingAskControllerIntegrationTests` hang (integration shard 4/6)

**Run:** 27486770797 · **Branch:** `ci/fix-idempotency-concurrency-hang-guard`  
**Commit:** `b7bf442d12e0a49c587758bf1104ad7bf77a2ff4`  
**Job:** `.NET: full regression — Api.Tests integration shard 4/6 (SQL)` (databaseId `81246428577`)

## Symptom

```
[xUnit.net 00:08:21.76]
  ArchLucid.Api.Tests.ArchitectureFindingAskControllerIntegrationTests
    .AskAboutFinding_returns_bad_request_when_question_missing [FAIL]

  Error Message:
    System.TimeoutException : Integration test
    'AskAboutFinding_returns_bad_request_when_question_missing' exceeded 480s.

Failed  1, Passed  88, Skipped  2, Total  91 — Duration: 1 h 49 m
```

A validation-only test that should return `400 Bad Request` in milliseconds instead hangs for
**480 seconds** (the `IntegrationTestDeadline` ceiling).

## Root cause

This is the same host-start unbounded hang identified in
`.cursor/prompts/fix-ci-run-2164-api-tests-shard3-ask-host-start-hang.md` (CI #2164):

The first access to `factory.Services` or `factory.CreateClient()` inside
`ArchitectureFindingAskControllerIntegrationTests` triggers `WebApplicationFactory.EnsureServer()`
→ `IHost.StartAsync`. Under heavy CI load, a hosted service blocks on startup indefinitely; the
test hangs until `IntegrationTestDeadline` fires at 480 seconds.

**The fix from #2164 has not been applied to this class.** `ArchitectureFindingAskControllerIntegrationTests`
still accesses `factory.Services` / `factory.CreateClient()` directly without routing through the
bounded `IntegrationTestHostStartup.EnsureStartedAsync` helper.

## Files

| File | Role |
|------|------|
| `ArchLucid.Api.Tests/ArchitectureFindingAskControllerIntegrationTests.cs` | Class to fix |
| `ArchLucid.Api.Tests/IntegrationTestHostStartup.cs` | Reuse: `EnsureStartedAsync`, 120s bound |
| `ArchLucid.Api.Tests/RetrievalQuerySmokeIntegrationTests.cs` (lines 116–119) | Established pattern to copy |
| `ArchLucid.Api.Tests/AlertLifecycleWebAppFactory.cs` | InMemory host; dispose already bounded |

## Fix (from #2164 — apply to this class)

For **every test** in `ArchitectureFindingAskControllerIntegrationTests`, route the **first** host
touch through `IntegrationTestHostStartup.EnsureStartedAsync(() => factory.Services)` **before** any
`factory.Services` access or `factory.CreateClient()` call.

Add a private helper (reuse if an identical helper already exists in this class or a shared base):

```csharp
private static async Task<IServiceProvider> EnsureHostStartedAsync(AlertLifecycleWebAppFactory factory)
    => await IntegrationTestHostStartup.EnsureStartedAsync(() => factory.Services);
```

For **validation-only tests** (like `AskAboutFinding_returns_bad_request_when_question_missing`)
that don't call seed helpers, `await EnsureHostStartedAsync(factory)` immediately before
`CreateScopedClient(factory)` so the bounded start runs first and `CreateClient()` reuses the
already-started host:

```csharp
await EnsureHostStartedAsync(factory);
using HttpClient client = CreateScopedClient(factory);
```

For tests that do seed, pass the returned `IServiceProvider` to the seed helper instead of
`factory.Services`.

## Acceptance criteria

1. All tests in `ArchitectureFindingAskControllerIntegrationTests` complete (pass or fail with
   a fast assertion) — never hang. First host touch is bounded at 120 seconds.
2. If the host stalls, the test receives `TimeoutException` at ~120 s (not 480 s).
3. No `Completed="False"` in the blame `Sequence_*.xml` for this class.
4. `ArchLucid.Backend.slnf` compile check passes.

## Verification (InMemory — no SQL needed)

```powershell
dotnet test ArchLucid.Api.Tests/ArchLucid.Api.Tests.csproj -c Release `
    --filter 'FullyQualifiedName~ArchitectureFindingAskControllerIntegrationTests' `
    --blame-hang --blame-hang-timeout 3min --blame-hang-dump-type mini
```

## Related

- `.cursor/prompts/fix-ci-run-2164-api-tests-shard3-ask-host-start-hang.md` (canonical framing)
- `IntegrationTestHostStartup.EnsureStartedAsync` — 120-second bound helper
- `AskThreadIntegrationTests` — sibling class with the same unbounded-start pattern (also needs fix per #2164)
