# PR 4279 — Offboard audit time, legacy audit identity, and question camera focus

**Model:** GPT-5.6 Luna. Paste this file as the whole task.

**Repo:** `c:\ArchLucid`

**Branch:** `fix/bugsmash-copilot-review` (pull request **4279**). Do not cut a new branch. Do not start from `master`. `master` does not have the resume path this prompt finishes.

## Goal

On an offboard retry, the `TenantErasureOffboarded` audit keeps the original offboard instant, and a tenant offboarded before this release does not gain a second audit. On the diagram, a SecureNow question whose subject is a full ARM resource id focuses that outline node and its one-hop neighbors.

## Why

Copilot reviewed https://github.com/joefrancisGA/ArchLucid/pull/4279. Three comments are still right. One is already done. One is only half right.

`CompleteOffboardSideEffectsAsync` appends `PlatformAuditEvent` without `OccurredUtc`. The property default is `TimeProvider.System.UtcNowDateTime()`, so a retry records the retry clock. The payload already has `tenant.OffboardedUtc`. The column used for ordering does not.

`CreateOffboardAuditEventId` is a hash of the event type, tenant, offboard instant, and erasure-eligible instant. `DapperPlatformAuditRepository.AppendAsync` skips an insert only when that `EventId` already exists. Audits written before this release used `Guid.NewGuid()`. Calling offboard again on those tenants inserts a second `TenantErasureOffboarded` row. `TryOffboardTenantAsync` always enters the resume path once `OffboardedUtc` is set.

`useSecureNowQuestionSubjectNodeId` returns `currentQuestion.resourceId`. `DiagramsWorkbenchSecureNowAwareDiagramViewer` passes that string to `resolveDiagramCameraFocusNodeIds`. That helper compares outline **edge** endpoints for equality and puts the same string in the focus set. `diagramOutlineIncludesFocusResource` can already match `node.id` or `node.seedNodeId`, including a resource-name suffix of a full ARM id, and then throws the matched node away. `inventoryDiagramNodeElementMatchesFocusId` matches SVG id and title. A full ARM id matches neither, so the camera fits the whole diagram and adds no neighbors. The existing test that treats `/subscriptions/.../factories/ADF-EDW-HI-DEV` as present on node `adf-edw-hi-dev` is the same gap.

## Already done — do not redo

The `SuspendedUtc` early return is gone. Resume suspends only when `SuspendedUtc` is null, then appends with the deterministic id. Copilot marked that comment addressed in `37be5e4c56`. Leave that shape in place.

## Read first

- `ArchLucid.Application/Tenancy/TenantErasureCommandService.cs` (`TryOffboardTenantAsync`, `CompleteOffboardSideEffectsAsync`, `CreateOffboardAuditEventId`, `AppendPlatformAuditAsync`)
- `ArchLucid.Core/Audit/PlatformAuditEvent.cs` (`OccurredUtc` default)
- `ArchLucid.Core/Audit/IPlatformAuditRepository.cs`
- `ArchLucid.Persistence/Audit/DapperPlatformAuditRepository.cs`
- `ArchLucid.Persistence/Audit/NoOpPlatformAuditRepository.cs`
- `ArchLucid.Core/Audit/AuditEventTypes.Tenant.cs` (`TenantErasureOffboarded`)
- `ArchLucid.Application.Tests/Tenancy/TenantErasureCommandServiceIdempotentRetryTests.cs`
- `archlucid-ui/src/lib/architecture/architecture-diagram-camera-focus.ts`
- `archlucid-ui/src/lib/architecture/architecture-diagram-camera-focus.test.ts`
- `archlucid-ui/src/app/(operator)/governance/infrastructure/diagrams/DiagramsWorkbenchClient.tsx` (`DiagramsWorkbenchSecureNowAwareDiagramViewer`, and the existing `appliedSeedNodeId` call around the seed-node URL)
- `archlucid-ui/src/components/infra-evidence/securenow-question-queue-provider.tsx` (`useSecureNowQuestionSubjectNodeId`)

## What to build

1. Stay on `fix/bugsmash-copilot-review`. Before editing any tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. If it exits 2, stop and report the blocked path.

2. **Audit time.** Both `TenantErasureOffboarded` appends (the first offboard and the resume path) set `OccurredUtc` to the offboard instant as UTC `DateTime` (`DateTimeOffset.UtcDateTime`). On the resume path that instant is `tenant.OffboardedUtc`. On the first path it is the same `now` stored in the payload as `offboardedUtc`. Pass it into `AppendPlatformAuditAsync` as an optional argument. Callers that omit it keep today's property default. Do not change the default on `PlatformAuditEvent`.

3. **Legacy identity.** Before the resume append, ask the repository whether this subject tenant already has a `TenantErasureOffboarded` row for the same UTC offboard instant. If it does, skip `AppendAsync` and still return the existing offboard result. Compare instants after reading `DataJson`, so `+00:00` and `Z` for the same tick count as one offboard. Keep the deterministic `EventId` and the existing `IF NOT EXISTS` on `EventId` for two concurrent writers that both miss. Add the lookup to `IPlatformAuditRepository`, `DapperPlatformAuditRepository`, and `NoOpPlatformAuditRepository` (`NoOp` returns false). Put any new type in its own file. Do not add a tenant column, a migration, or a rewrite of historical `EventId` values.

4. **Camera.** In `resolveDiagramCameraFocusNodeIds`, keep today's result when the trimmed seed already equals an outline edge endpoint (the `" B "` test must stay `["B", "a", "c"]`). Otherwise resolve one outline node: exact normalized `id`, then exact normalized `seedNodeId`, then a unique contains match of `id` or `seedNodeId` against the seed. Use that node's `id` as the focus seed and as the endpoint walked for one-hop neighbors. Do not also put the raw ARM id in the set. If no node matches, or more than one node matches and none is exact, return an empty set. `diagramOutlineIncludesFocusResource` may stay as the viewer's gate. The seed-node URL path must still focus that seed and its neighbors.

5. **Pull request text.** Update the description of pull request 4279. Keep the execute-lease and hunt-ledger bullets. Add the question bar on the diagram viewport and this camera rule to Summary and Test plan. Replace the claim that every later retry writes no second audit with the rule above: a retry writes no second `TenantErasureOffboarded` row when either the deterministic id or the same offboard instant is already stored. Do not split the pull request.

6. Tests:
   - Resume append sets `OccurredUtc` to the persisted `OffboardedUtc`, not the test clock at retry time.
   - A second resume with the deterministic id does not call append again.
   - A resume whose repository already has a `TenantErasureOffboarded` row for that tenant and offboard instant, under some other `EventId`, does not append.
   - A resume with no such row appends once, with the deterministic id.
   - `resolveDiagramCameraFocusNodeIds("/subscriptions/sub/resourceGroups/rg/providers/Microsoft.DataFactory/factories/ADF-EDW-HI-DEV", outline)` where the node id is `adf-edw-hi-dev` and an edge runs `adf-edw-hi-dev` → `storage` returns that node id and `storage`, and does not return the ARM string.
   - Two nodes that only partially match the same ARM id produce an empty set.
   - The existing seed-plus-neighbors cases stay as they are.

## Acceptance criteria

- A delayed offboard retry stores `OccurredUtc` equal to `tenant.OffboardedUtc`.
- A tenant offboarded before this release, retried after it, still has one `TenantErasureOffboarded` audit for that offboard instant.
- Two concurrent first-time retries still collapse on the deterministic `EventId`.
- A SecureNow question addressed by a full ARM id frames the matching outline node and its one-hop neighbors.
- An ambiguous ARM id does not move the camera.
- The seed-node URL focus is unchanged.

## Constraints

- One class per file. A blank line before `if` and `foreach` unless it is the first line in the method. Concrete types. Null-check arguments on new public methods. No `ConfigureAwait(false)` in tests. No new package.
- Do not change legal-hold, restore, or approve audits.
- Do not change execute-lease admission or the hunt ledger.
- Working-tree safety. Stage only the offboard audit time, the legacy lookup, the camera seed resolution, their tests, and the pull request description. **No `git add -A`.**
- **Do not commit. Do not push.**

## Verification

```powershell
dotnet test ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj --filter "FullyQualifiedName~TenantErasureCommandService"
```

```powershell
cd archlucid-ui
npx vitest run src/lib/architecture/architecture-diagram-camera-focus.test.ts "src/app/(operator)/governance/infrastructure/diagrams/DiagramsWorkbenchClient.test.tsx"
```

Heartbeat every 8 seconds on the dotnet test:

```powershell
$intervalSec = 8
$repoRoot = (Get-Location).Path
$job = Start-Job -ScriptBlock {
  param($Root)
  Set-StrictMode -Version Latest
  Set-Location -LiteralPath $Root
  dotnet test ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj --filter "FullyQualifiedName~TenantErasureCommandService"
  exit $LASTEXITCODE
} -ArgumentList $repoRoot
try {
  while ($job.State -eq 'Running') {
    Write-Host ("STILL EXECUTING... {0}" -f (Get-Date -Format 'HH:mm:ss'))
    Start-Sleep -Seconds $intervalSec
  }
  $output = Receive-Job $job -Wait -AutoRemoveJob
  if ($null -ne $output) { $output | ForEach-Object { Write-Host $_ } }
  if ($job.JobStateInfo.State -eq 'Failed') {
    $reason = $job.ChildJobs[0].JobStateInfo.Reason
    if ($null -ne $reason) { Write-Error $reason }
    exit 1
  }
  exit 0
}
finally {
  if ($job.State -eq 'Running') {
    Stop-Job $job -Force
    Remove-Job $job -Force
  }
}
```

## Done when

Those tests pass. Report the files changed and the pull request description you wrote. Wait for the owner before any commit.
