# SN-PERF-13 — Factory metrics from SQL aggregates

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file as the whole task. Do not use a fast-tier slug. Do not implement another SN-PERF prompt in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/SECURENOW_PERFORMANCE_LUNA_PROMPTS.md`

## Goal

`RemediationFactoryMetricsService.GetMetricsAsync` fills `RemediationFactoryMetrics` from grouped SQL (and the existing active-match batch) instead of loading every finding, instance, and exception in the project.

## Why

**SN-PERF-07** already replaced the per-finding `TryGetActiveMatchInScopeAsync` loop with `ListActiveMatchesByOpenFindingInScopeAsync`. The method still calls `ListByScopeAsync` for findings, instances, and exceptions, then counts in memory. Home and the factory page only need the metric fields.

## Read first

- `ArchLucid.Application/InfraEvidence/RemediationMetrics/RemediationFactoryMetricsService.cs`
- `ArchLucid.Application/InfraEvidence/RemediationMetrics/RemediationFactoryWorkbenchQueryService.cs` (do not change the workbench wave counts from **SN-PERF-01**)
- `ArchLucid.Persistence/InfraEvidence/SqlRemediationInstanceRepository.cs` (`CountOpenInstancesByStatusInScopeAsync` is the pattern)
- `ArchLucid.Persistence.Tests/InfraEvidence/ProjectScopeSqlPushdownBoundaryTests.cs`

## What to build

1. Branch `sn-perf/13-factory-metric-aggregates` from current `master`.
2. Add scoped aggregate reads. Each SQL implementation filters `TenantId`, `WorkspaceId`, and `ProjectId`. Default interface methods may aggregate `ListByScopeAsync` so in-memory fakes keep working.
3. Cover the fields the service sets today:
   - Findings: open count (Open or Recurred), critical exposure (severity `critical`, or exposure `high` or `critical`, ordinal-ignore-case), created since `weekStart`, recurrence count, average age in days from `FirstObservedUtc`, top 5 `ControlId` values by count.
   - Scores: risk-weighted open is the sum of prioritization scores for open findings only. A finding with no score contributes 0.
   - Instances: remediated this week (`VerifiedUtc >= weekStart` and status Verified or Closed), automation percent (SemiAutomated or Automated over all instances), verification-failure count, preflight-blocked count, top 5 `PatternKey` values by count.
   - Exceptions: active, expired, and expiring soon (active, expiration within 14 days and still in the future). Pass `utcNow` as a parameter.
4. Keep `ListActiveMatchesByOpenFindingInScopeAsync` for pattern coverage. Do not go back to one query per finding.
5. Return the same `RemediationFactoryMetrics` shape. Round the same way (`riskWeightedOpen` 4 decimals, percents 2 decimals, average age 2 decimals). Empty groups stay empty lists. `NetBurn` stays `createdThisWeek - remediatedThisWeek`.
6. Top-5 order is count descending. When counts tie, order the key ordinal-ignore-case so the five keys are stable.

## Tests

1. A service test with a fake aggregate repository (or in-memory default) matches a hand-computed `RemediationFactoryMetrics` for a mix of open, closed, critical, recurred, automated, and expiring exceptions.
2. `ProjectScopeSqlPushdownBoundaryTests` includes each new SQL method.
3. `GetMetricsAsync` does not call `ListByScopeAsync` on findings, instances, or exceptions.

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'` (Cloud Agent: `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path '<path>'`). Stop on exit code 2.
- Security: every aggregate is project-scoped. Do not sum another workspace.
- Scalability: a handful of grouped queries, not three full table reads.
- Reliability: pass `CancellationToken`. Week boundaries use the same UTC clock the service uses today.
- Cost: no new index required. Add one only if an existing test database already has a matching key and the query cannot seek it.
- Do not commit.

## Done when

Factory metrics match the previous arithmetic, and the three full `ListByScopeAsync` reads are gone from `GetMetricsAsync`.
