# Add startup-timing diagnostics to retrieval smoke integration tests

## Context

`RetrievalQuerySmokeIntegrationTests.A_Query_with_no_indexed_documents_returns_empty_list` is
still hitting the 480-second `IntegrationTestDeadline` on CI builds (most recently a build starting
2026-06-14 ~10:59 EDT), despite the following fixes already being in place:

| Commit | Fix |
|---|---|
| `3efaf8ede` | Bounded host startup to prevent shard hang |
| `803677bfe` | Relieved deadline stacking under slow CI host startup |
| `8b82a0fc5` | Batch fix for CI runs #2179 and #2180 |
| `441498864` | Corrected `nameof` labels after `A_/B_/C_/D_` rename |

The outer `IntegrationTestDeadline` fires at 480 s, but the current CI output does not say which
phase consumed that time. The goal of this task is **not** to change any timeout value — it is to
add structured, timestamped log lines so the next hang tells us exactly where the time went.

## Files involved

- `ArchLucid.Api.Tests/IntegrationTestHostStartup.cs` — `EnsureCompletedAsync` wraps host startup
  in a `Task.WhenAny` / `Task.Run`; logs nothing today.
- `ArchLucid.Api.Tests/AlertLifecycleWebAppFactory.cs` — `StartServicesCoreAsync` touches `Services`
  and calls `CreateClient()` inside the same `Task.Run`; logs nothing on the happy path.
- `ArchLucid.Api.Tests/RetrievalQuerySmokeSharedHostFixture.cs` — `InitializeAsync` calls
  `EnsureStartedAsync`; logs nothing.
- `ArchLucid.Api.Tests/AlertLifecycleIntegrationHost.cs` — thin facade; fine as-is unless callers need
  timing.
- `ArchLucid.Api.Tests/IntegrationTestDeadline.cs` — fires the 480 s timeout; logs nothing before
  throwing.

## Logging to add

Add `Console.Error.WriteLine` (same channel as the existing abandoned-dispose message in
`AlertLifecycleWebAppFactory`) for every checkpoint below. All messages must include a UTC timestamp
and a `[ClassName]` prefix so CI log grep is easy.

### 1. `IntegrationTestHostStartup.EnsureCompletedAsync`

```csharp
// Before starting the worker:
Console.Error.WriteLine(
    $"[IntegrationTestHostStartup] Starting bounded operation (limit {effectiveTimeout.TotalSeconds:N0}s) at {DateTime.UtcNow:HH:mm:ss.fff}Z");

// After Task.WhenAny — replace the existing bare TimeoutException:
Console.Error.WriteLine(
    $"[IntegrationTestHostStartup] TIMEOUT: operation exceeded {effectiveTimeout.TotalSeconds:N0}s at {DateTime.UtcNow:HH:mm:ss.fff}Z");
throw new TimeoutException(
    $"Integration host operation exceeded {effectiveTimeout.TotalSeconds:N0}s.");

// On success path (after awaiting operationTask):
Console.Error.WriteLine(
    $"[IntegrationTestHostStartup] Bounded operation completed in {elapsed:N1}s at {DateTime.UtcNow:HH:mm:ss.fff}Z");
```

Capture `Stopwatch.StartNew()` before the `Task.Run` so the elapsed value is correct.

### 2. `AlertLifecycleWebAppFactory.StartServicesCoreAsync`

```csharp
// Before EnsureStartedAsync call:
Console.Error.WriteLine(
    $"[AlertLifecycleWebAppFactory] Host startup beginning at {DateTime.UtcNow:HH:mm:ss.fff}Z");

// At end of the lambda, just before return services:
Console.Error.WriteLine(
    $"[AlertLifecycleWebAppFactory] Services resolved + CreateClient complete at {DateTime.UtcNow:HH:mm:ss.fff}Z");
```

### 3. `AlertLifecycleWebAppFactory.DisposeAsync` (already has a timeout message — add a start marker)

```csharp
// First line of DisposeAsync, before Task.WhenAny:
Console.Error.WriteLine(
    $"[AlertLifecycleWebAppFactory] Dispose beginning at {DateTime.UtcNow:HH:mm:ss.fff}Z");
```

### 4. `RetrievalQuerySmokeSharedHostFixture.InitializeAsync`

```csharp
Console.Error.WriteLine(
    $"[RetrievalQuerySmokeSharedHostFixture] InitializeAsync starting at {DateTime.UtcNow:HH:mm:ss.fff}Z");
await AlertLifecycleIntegrationHost.EnsureStartedAsync(Factory);
Console.Error.WriteLine(
    $"[RetrievalQuerySmokeSharedHostFixture] InitializeAsync complete at {DateTime.UtcNow:HH:mm:ss.fff}Z");
```

### 5. `IntegrationTestDeadline.RunAsync`

Log elapsed time when the outer deadline fires (before throwing) so the CI output shows the full
480 s was consumed, not a race:

```csharp
if (completed != runTask)
{
    await deadline.CancelAsync().ConfigureAwait(false);

    Console.Error.WriteLine(
        $"[IntegrationTestDeadline] TIMEOUT: test '{testName}' exceeded {effectiveTimeout.TotalSeconds:N0}s at {DateTime.UtcNow:HH:mm:ss.fff}Z");

    throw new TimeoutException(
        $"Integration test '{testName}' exceeded {effectiveTimeout.TotalSeconds:N0}s.");
}
```

## What these logs will reveal

With the five checkpoints above, the next hang will produce a CI log that shows one of:

| Observed pattern | Root cause |
|---|---|
| `InitializeAsync starting` then silence for 480 s | Host startup is blocking inside `EnsureCompletedAsync` (a hosted service's `StartAsync` is not returning) |
| `InitializeAsync complete` quickly, then silence in the test body | `EnsureClientAsync` → `CreateBoundedClientAsync` is hanging on second `CreateClient()` call |
| All checkpoints logged quickly, then silence | The HTTP `GET v1/retrieval/search` call itself is hanging |
| `TIMEOUT` from `EnsureCompletedAsync` (180 s) but outer deadline fires at 480 s | The `TimeoutException` from step 1 is being swallowed or the fixture isn't propagating it |

## Implementation notes

- Do **not** change any timeout constants — this task is diagnostics only.
- Do **not** add `using Microsoft.Extensions.Logging` or inject `ILogger` — all existing
  diagnostic output in these files uses `Console.Error.WriteLine` and that is the correct
  channel for infrastructure-level test noise.
- Place log lines as close to the timing boundary as possible; do not aggregate them into helper
  methods (the value is seeing individual phase start/end, not a summary).
- All five files should compile after the changes; run:
  ```powershell
  .\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.Api.Tests/ArchLucid.Api.Tests.csproj'
  ```

## Acceptance criteria

1. All five files contain at least one new `Console.Error.WriteLine` timestamped log line.
2. `IntegrationTestHostStartup.EnsureCompletedAsync` logs both the start and the
   timeout/success outcome with elapsed time.
3. `RetrievalQuerySmokeSharedHostFixture.InitializeAsync` logs start and completion.
4. `IntegrationTestDeadline.RunAsync` logs when the outer deadline fires.
5. Compile check passes with exit code 0.
6. No existing timeout values are changed.
