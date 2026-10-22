# SN-PERF-01 — Home counts without a full instance list

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file as the whole task. Do not use a fast-tier slug. Do not implement another SN-PERF prompt in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/SECURENOW_PERFORMANCE_LUNA_PROMPTS.md`

## Goal

SecureNow Home still shows the same four work counts. Building the factory summary no longer loads every remediation instance, and it no longer calls `GetWaveAsync` once per wave.

## Why

`SecureNowHomeWorkSummary` calls `fetchRemediationFactorySummary`. `RemediationFactoryWorkbenchQueryService.GetSummaryAsync` then lists every instance in the project and groups statuses in memory. It lists every wave and calls `GetWaveAsync` for each one only to read `Members.Count`. The home panel uses `criticalExposureCount`, `ChangeImplemented`, and `VerificationFailed`. The factory page still needs wave name, status, target size, and member count, but not a member row per wave.

## Read first

- `ArchLucid.Application/InfraEvidence/RemediationMetrics/RemediationFactoryWorkbenchQueryService.cs`
- `ArchLucid.Core/Persistence/ApplicationPorts/InfraEvidence/ProjectScopedRepositoryCapabilities.cs` (`IProjectScopedRemediationInstanceRepository`)
- `ArchLucid.Core/Persistence/ApplicationPorts/InfraEvidence/IRemediationInstanceRepository.cs`
- `ArchLucid.Persistence/InfraEvidence/ProjectScopedRepositoryAdapters.cs`
- `ArchLucid.Persistence/InfraEvidence/SqlRemediationInstanceRepository.cs` (`ListByScopeAsync`)
- `ArchLucid.Core/Persistence/ApplicationPorts/InfraEvidence/IRemediationWaveRepository.cs`
- `ArchLucid.Persistence/InfraEvidence/SqlRemediationWaveRepository.cs` (`ListMembersByWaveInScopeAsync`)
- `ArchLucid.Application/InfraEvidence/RemediationWaves/RemediationWaveService.cs`
- `archlucid-ui/src/components/product-line/SecureNowHomeWorkSummary.tsx`
- `archlucid-ui/src/components/product-line/SecureNowHomeEnvironmentContext.tsx`
- `ArchLucid.Persistence/InfraEvidence/SqlAzureInventorySnapshotRepository.List.cs` (list is `ORDER BY COALESCE(CapturedUtc, CreatedUtc) DESC`)
- `ArchLucid.Persistence/InfraEvidence/SqlAzureInventoryDiffRepository.cs` (`ListDiffsBySnapshotIdAsync` is `ORDER BY CreatedUtc DESC`)

## What to build

1. Branch `sn-perf/01-home-read-counts` from current `master`.
2. Add a scoped open-status count on the remediation instance repository. SQL groups `dbo.RemediationInstances` by status for the current tenant, workspace, and project, and omits `Closed`. Return only statuses that have at least one row. Map the status integer through the enum's `ToString()`, so the dictionary key stays `ChangeImplemented`, not `"3"`.
3. Give `IRemediationInstanceRepository` a default method that groups `ListByScopeAsync` the same way, so in-memory fakes still compile. Override it on `SqlRemediationInstanceRepository` with the grouped query. Forward it through `ProjectScopedRemediationInstanceRepositoryAdapter` and `IProjectScopedRemediationInstanceRepository`.
4. Add a scoped member-count method on the wave repository that returns `waveId → count` for every wave in the project in one `GROUP BY`. A wave with no members is absent or zero. Default the interface method from the existing list methods so fakes compile. Override it in SQL. `GetSummaryAsync` uses that count. It does not call `GetWaveAsync`.
5. `GetSummaryAsync` still calls `GetMetricsAsync` and `ListWavesAsync`. Wave order stays `UpdatedUtc` descending. `MemberCount` matches today's `detail.Members.Count`. Name, status, and target size still come from the wave record.
6. Do not add an HTTP route. Do not change `RemediationFactoryWorkbenchSummary`. Do not regenerate OpenAPI.
7. On Home, the snapshot list and the diff list are already newest-first. Use the first row. Delete the copy-and-sort in `newestSnapshotId`, `newestSnapshot`, and `newestDiff`. Keep page size 20. The environment line counts subscriptions on that page. Do not add a snapshot or diff endpoint.

## Tests

1. A summary with two open statuses and one closed instance returns only the open keys, with the same names Home already reads.
2. A project with no `ChangeImplemented` row omits that key. Home still treats a missing key as an empty count, not as `None waiting for a check`.
3. `GetSummaryAsync` does not call `ListByScopeAsync` or `GetWaveAsync`. Three waves produce three member counts from one count call.
4. Existing `SecureNowHomeWorkSummary` and `SecureNowHomeEnvironmentContext` Vitest tests pass. Add one case where the newest snapshot is the first item and an older snapshot is second, and the work summary follows the first.

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'` (Cloud Agent: `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path '<path>'`). Stop on exit code 2.
- Security: the count queries use the same tenant, workspace, and project predicates as `ListByScopeAsync` and `ListMembersByWaveInScopeAsync`. A missing scope returns no rows.
- Scalability: two grouped reads replace a full instance list and one member list per wave.
- Reliability: a failed count fails the summary. Do not substitute zeros for a failed query.
- Cost: no new table, no new collector, no stored aggregate.
- Visible Home copy stays as it is, including the checks-failed suffix and the separate Checks failed row.
- Do not commit.

## Done when

The factory summary JSON is unchanged, Home still shows the same counts from the same response, and the summary path no longer materializes every instance or every wave member.
