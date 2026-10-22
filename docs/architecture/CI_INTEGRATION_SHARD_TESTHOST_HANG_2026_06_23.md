# CI integration shard testhost hang (2026-06-23)

## Symptom

After one or more integration tests fail or complete, a chunk can sit until the **20-minute chunk
watchdog** fires even though stdout already shows `Failed!` with a short duration (e.g. 239 ms).
`vstest` host diagnostics show `TcpClientExtensions.MessageLoopAsync` polling indefinitely.

## Root cause

**In-process `--blame-hang`** on `dotnet test` (added for CI #2168/#2277) keeps the test host alive
after failures/shutdown and wedges the vstest ↔ testhost adapter loop. The parent chunk watchdog in
`ApiIntegrationTestChunkWatchdog.ps1` already captures out-of-process dumps on timeout; in-process
blame-hang is redundant and harmful.

Secondary amplifier: `IntegrationTestDeadline.RunAsync` abandoned wedged test bodies without
observing the orphaned task (fixed with `ObserveAbandonedRunTask`, mirroring
`IntegrationTestHostStartup`).

## Fix (2026-06-23)

| Area | Change |
|------|--------|
| `ApiIntegrationTestChunkWatchdog.ps1` | Remove `--blame-hang*` from chunk `dotnet test` args; keep parent dump + `dotnet-stack` fallback |
| `IntegrationTestDeadline.cs` | Observe abandoned run tasks after deadline timeout |
| `RunFindingsCsvExportEndpointTests.cs` | Skip when demo baseline run absent (404) instead of failing on unseeded SQL catalogs |

## Product follow-up

Server-side non-cancellable HTTP stalls (CI #2268 retrieval smoke) remain a separate backlog item
(tracked on the Slow shard). This doc covers the **testhost shutdown wedge** that inflated chunk
runtimes after ordinary failures.
