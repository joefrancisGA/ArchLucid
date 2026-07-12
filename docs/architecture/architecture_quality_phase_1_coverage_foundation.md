# Phase 1 — Coverage foundation implementation report

**Date:** 2026-07-12  
**Scope:** Option B coverage layer above the existing policy-pack engine (bounded Phase 1 only).

## Implementation summary

Phase 1 adds a read-only coverage-selection layer that records *why* policy packs are in scope for a run without duplicating pack content or altering the existing policy-pack engine. The layer persists `CoverageAssignment` rows (append-only), exposes read APIs, and extends commit snapshot descriptors additively. Policy evaluation, generation, review, focused-pilot behavior, and core resolver/filter/merger algorithms are unchanged.

## Actual domain model

| Type | Location | Role |
|------|----------|------|
| `QualityDimension` | `ArchLucid.Contracts/Governance/Coverage/` | Closed enum (6 canonical baseline dimensions) |
| `CoverageType` | same | ProviderNeutralBaseline, OrganizationRequired, PlatformOverlay, ContextualRecommended, AdditionalOptional |
| `CoverageSelectionState` | same | AlwaysActive, RequiredAndLocked, RecommendedAndSelected, RecommendedButExcluded, OptionalAndSelected, OptionalAndNotSelected, NotApplicable, Retired |
| `RecommendationConfidence` | same | High / Medium / Low (recommended coverage only) |
| `CoverageAssignment` | same | Run-scoped coverage row referencing `PolicyPackId` + exact `PolicyPackVersion` |
| `CoverageSummary` | same | Read DTO with `LegacyCoverageNotRecorded` for historical runs |
| `PolicyPack.QualityDimension` | `PolicyPack.cs` | Nullable; baseline-pack dimension only (null in migration) |
| `CommittedCoverageAssignmentSnapshot` | `Governance/Resolution/` | Frozen snapshot slice for commit manifests |
| `CoverageAssignmentValidator` | `ArchLucid.Application/Governance/Coverage/` | Phase 1 validation rules |
| `CoverageQueryService` | same | Tenant-scoped read queries |

`RequiredAndLocked` is independent of `PolicyPackAssignment.IsPinned` (precedence vs. user-exclusion lock).

## Files changed

**New**

- `ArchLucid.Contracts/Governance/Coverage/*.cs` (6 files)
- `ArchLucid.Contracts/Governance/Resolution/CommittedCoverageAssignmentSnapshot.cs`
- `ArchLucid.Core/Persistence/ApplicationPorts/Data/Repositories/ICoverageAssignmentRepository.cs`
- `ArchLucid.Persistence/Migrations/273_CoverageFoundation.sql`
- `ArchLucid.Persistence/Data/Repositories/DapperCoverageAssignmentRepository.cs`
- `ArchLucid.Persistence/Data/Repositories/InMemoryCoverageAssignmentRepository.cs`
- `ArchLucid.Application/Governance/Coverage/*.cs` (4 files)
- `ArchLucid.Api/Controllers/Authority/RunCoverageController.cs`
- `ArchLucid.Api/Controllers/Governance/GovernanceCoverageController.cs`
- `ArchLucid.Api/Mapping/CoverageAssignmentMapper.cs`
- `ArchLucid.Api/Models/Coverage/*.cs`
- `ArchLucid.Application.Tests/Governance/Coverage/*.cs` (4 test files, 20 tests)

**Modified**

- `ArchLucid.Contracts/Governance/PolicyPacks/PolicyPack.cs` — nullable `QualityDimension`
- `ArchLucid.Contracts/Governance/Resolution/CommittedEffectiveGovernanceSnapshotDescriptor.cs` — additive `CoverageAssignments`
- `ArchLucid.Persistence/Governance/DapperPolicyPackRepository.cs` — `QualityDimension` column mapping
- `ArchLucid.Host.Composition/Startup/ServiceCollectionExtensions.CoordinatorAndArtifacts.cs` — repository DI
- `ArchLucid.Host.Composition/Startup/ServiceCollectionExtensions.ApplicationPipeline.cs` — query service + validator DI

## Migration behavior (`273_CoverageFoundation.sql`)

- Adds nullable `QualityDimension` to `dbo.PolicyPacks` with PascalCase CHECK constraint (no backfill).
- Creates `dbo.CoverageAssignments` with FK to `PolicyPacks`, nullable FK to `Runs`, no cascade delete on historical scope.
- Indexes: tenant + run, tenant + project (query-driven).
- RLS not applied; tenant isolation enforced in repository queries (consistent with adjacent governance tables).

## Compatibility decisions

- Existing policy-pack APIs unchanged; 41-pack provisioning unchanged.
- Historical manifests deserialize with empty `coverageAssignments` when JSON field absent (`JsonSerializerDefaults.Web` camelCase).
- Runs with no coverage rows return `LegacyCoverageNotRecorded = true` — not treated as fully assessed.
- No retrospective backfill; reruns append new rows; original run rows immutable (append-only repository).
- `EffectiveGovernanceResolver`, `ComplianceRulePackGovernanceFilter`, `PolicyPackPriorityFloor`, `TenantCuratedComplianceRulePackMerger` — **not modified**.
- Commit capturer not wired for coverage writes in Phase 1 (no review-behavior change).

## API contracts added

| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/v1/runs/{runId}/coverage` | Run-level coverage assignments + summary |
| GET | `/v1/governance/coverage` | Tenant/project scoped coverage query |

Dedicated response DTOs under `ArchLucid.Api/Models/Coverage/` — no persistence entities exposed. No mutation endpoints in Phase 1.

## Test commands

```powershell
dotnet test ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj --filter "FullyQualifiedName~Governance.Coverage"
dotnet test ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj --filter "FullyQualifiedName~DefaultPolicyPackCoverageTests"
dotnet test ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj --filter "FullyQualifiedName~DefaultPolicyPackSeederTests"
dotnet test ArchLucid.Decisioning.Tests/ArchLucid.Decisioning.Tests.csproj --filter "FullyQualifiedName~EffectiveGovernanceResolverTests"
dotnet test ArchLucid.Decisioning.Tests/ArchLucid.Decisioning.Tests.csproj --filter "FullyQualifiedName~PolicyPackPriorityFloorTests|FullyQualifiedName~ComplianceRulePackGovernanceFilter"
dotnet build ArchLucid.Api/ArchLucid.Api.csproj -o $env:TEMP\archlucid-api-coverage-build
```

## Test results (2026-07-12)

| Suite | Result |
|-------|--------|
| `Governance.Coverage` (20 tests) | **Passed** |
| `DefaultPolicyPackCoverageTests` (44 tests) | **Passed** |
| `DefaultPolicyPackSeederTests` (2 tests) | **Passed** |
| `EffectiveGovernanceResolverTests` (11 tests) | **Passed** |
| `PolicyPackPriorityFloorTests` + `ComplianceRulePackGovernanceFilter` (9 tests) | **Passed** |
| `ArchLucid.Api` build (alternate output path) | **Succeeded** (0 errors) |

Required test mapping (assessment checklist):

1. QualityDimension serialization — `CoverageAssignmentValidatorTests`
2. QualityDimension DB persistence — `CoverageAssignmentRepositoryTests`
3. Null QualityDimension for non-baseline packs — validator + repository tests
4. CoverageAssignment persistence — `CoverageAssignmentRepositoryTests`
5. Tenant isolation — `CoverageAssignmentRepositoryTests`
6. AlwaysActive validation — `CoverageAssignmentValidatorTests`
7. RequiredAndLocked validation — `CoverageAssignmentValidatorTests`
8. RecommendedButExcluded exclusion reason — `CoverageAssignmentValidatorTests`
9. Recommendation-confidence validation — `CoverageAssignmentValidatorTests`
10. Exact policy-pack-version preservation — `CoverageAssignmentRepositoryTests`
11. Historical run with no coverage — `CoverageQueryServiceTests`
12. New run with coverage record — `CoverageQueryServiceTests`
13. No retrospective backfill — `CoverageQueryServiceTests`
14. Rerun creates new scope — `CoverageQueryServiceTests`
15. Original run unchanged after rerun — `CoverageQueryServiceTests`
16. Committed manifest deserialization — `CommittedCoverageSnapshotTests`
17. Existing provisioning — `DefaultPolicyPackCoverageTests`
18–20. Resolver / filter / priority-floor — Decisioning regression suites above

## Unresolved risks

- **Coverage not yet written at commit time:** Phase 1 read path + schema only; wiring `CommittedEffectiveGovernanceSnapshotCapturer` deferred to Phase 2.
- **Baseline pack `QualityDimension` values:** Column exists but bundled packs remain null until canonical six-pack mapping is implemented.
- **Local API build lock:** Running `ArchLucid.Api.exe` (PID 50116) can block in-place `dotnet build`; CI is authoritative for full Api output copy.

## Assessment assumptions disproved by repository evidence

| Assessment note | Repository finding |
|-----------------|-------------------|
| C.5 migration text implied no `PolicyPacks` changes | Phase 1 owner decision (§C.19a/b) explicitly adds nullable `QualityDimension`; migration 273 is additive only. |
| Snapshot JSON uses PascalCase property names | `JsonSerializerDefaults.Web` serializes `coverageAssignments` (camelCase); tests and descriptors follow Web defaults. |

## Explicitly not changed (Phase 1 boundary)

- Policy pack content, recommendation engines, UI, mutation endpoints.
- `FindingDisposition`, focused-pilot allow-list, generation/review evaluation pipelines.
