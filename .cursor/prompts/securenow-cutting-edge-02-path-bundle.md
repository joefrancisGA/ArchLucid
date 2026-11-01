# SN-CE-02 — Stored path bundle for Ask

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file as the whole task. Do not use a fast-tier slug and do not use a model outside the workspace allowlist. Do not implement another SN-CE prompt in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/SECURENOW_CUTTING_EDGE_COMPOSER_PROMPTS.md`

## Goal

When the topic is `RankedPath`, Ask collects the stored path, its hops, the stored rank row, and the stored cut points for that path’s snapshot. A missing path yields an empty bundle. The existing grounding service already turns an empty bundle into insufficient evidence.

## Why

SN-CE-01 names the path. The model still needs the stored rows, and only those rows. Re-running `PathRankingEngine` or `CutPointAnalysisEngine` from Ask would invent a second ranker.

## Read first

- `ArchLucid.Application/InfraEvidence/Ask/InfraEvidenceAskEvidenceCollector.cs`
- `ArchLucid.Application/InfraEvidence/Ask/InfraEvidenceAskEvidenceBundle.cs` (`AddCitation`, `HasEvidence`)
- `ArchLucid.Application.Tests/InfraEvidence/InfraEvidenceAskEvidenceCollectorTests.cs` (constructor call sites)
- `ArchLucid.Core/Persistence/ApplicationPorts/InfraEvidence/ISecurityEvidencePathRepository.cs` (`TryGetByIdInScopeAsync`, `ListHopsByPathInScopeAsync`)
- `ArchLucid.Core/Persistence/ApplicationPorts/InfraEvidence/ISecurityEvidencePathRankRepository.cs` (`TryGetRankInScopeAsync`)
- `ArchLucid.Core/Persistence/ApplicationPorts/InfraEvidence/ISecurityEvidenceCutPointRepository.cs` (`ListByPathIdInScopeAsync`)
- `ArchLucid.Core/Persistence/ApplicationPorts/InfraEvidence/SecurityEvidencePathRankRecord.cs`
- `ArchLucid.Core/Persistence/ApplicationPorts/InfraEvidence/SecurityEvidenceCutPointRecord.cs`
- `ArchLucid.Core/Persistence/ApplicationPorts/InfraEvidence/SecurityEvidencePathHopRecord.cs`
- `ArchLucid.Contracts/InfraEvidence/InfraEvidenceAskCitationKinds.cs`
- `ArchLucid.Host.Composition/Startup/Modules/InfraEvidenceCompositionModule.cs` (the collector is already `AddScoped`; new constructor parameters must be ports that are already registered)

## What to build

1. Branch `sn-ce/02-path-bundle` from current `master` after SN-CE-01 is present.
2. Add these citation kinds:
   - `SecurityEvidencePathId`
   - `SecurityEvidencePathHopId`
   - `SecurityEvidencePathRankId`
   - `SecurityEvidenceCutPointId`
3. Construct `InfraEvidenceAskEvidenceCollector` with the three existing ports: `ISecurityEvidencePathRepository`, `ISecurityEvidencePathRankRepository`, `ISecurityEvidenceCutPointRepository`. Update the test constructor. Do not add a repository method.
4. At the start of `CollectAsync`, when `topicKind` is `RankedPath`, collect that bundle and return it. Other topics keep their current branches.
5. Resolve the path with `TryGetByIdInScopeAsync(scope.ToProjectScopeKey(), pathId)`.
   - No path id, `Guid.Empty`, or a null record → return the bundle with no citations.
   - `request.SnapshotId` has a value and it differs from `path.SnapshotId` → return the bundle with no citations.
   - After resolving an in-scope path and validating any supplied snapshot id, enforce `InfraEvidenceSnapshotSealedManifestHashGuard.EnsureRunCitedSnapshotSealedOrThrowAsync` on `path.SnapshotId` before emitting evidence, including when `request.SnapshotId` is absent. Reuse the existing guard dependencies and preserve propagation of `ConflictException` to the existing 409 response.
6. Load hops with `ListHopsByPathInScopeAsync` and emit them in `HopOrdinal` order.
7. Load the rank with `TryGetRankInScopeAsync`. Include it only when the record exists and `rank.SnapshotId` equals `path.SnapshotId`. A path with hops and no rank row still has evidence.
8. Load cut points with `ListByPathIdInScopeAsync`. Keep rows whose `SnapshotId` equals `path.SnapshotId`, in `CutOrder`. `ListByPathIdInScopeAsync` is tenant-scoped by default, so this snapshot filter is required. Do not add a new query.
9. Emit citations through the existing `TryAddCitation` helper so the count stops at 50. Order: path, hops, rank, cut points. When rows are omitted, use the existing `AppendOmittedRowLine` pattern. Do not raise `AskEvidenceRowCap`.
10. Evidence lines quote stored fields only:
    - Path: `pathId`, `snapshotId`, `pathKind`, `pathConfidenceBand`.
    - Hop: `hopRowId`, `hopOrdinal`, `fromNodeId`, `toNodeId`, `edgeType`, `hopConfidenceBand`. Citation id is `HopRowId`.
    - Rank: `ruleVersion`, `technicalExposureScore`, `privilegeDepthScore`, `blastRadiusScore`, `businessConsequenceScore` (say it was not stored when null), `confidenceBandScore`, `compositeSortScore`, `rankOrder`, and `explanationSummary`. Citation id is the path id. Call `compositeSortScore` the stored composite sort.
    - Cut point: `cutPointId`, `cutKind`, `cutKey`, `fromNodeId`, `toNodeId`, `edgeType`, `cutOrder`, `leverageScore`, `pathsCollapsedCount`, `suggestedPatternKey`, and `cloudResourceId` when it has a value.
11. Do not copy `CanonicalHopHashSha256`, `BreakdownJson`, `EvidenceReferencesJson`, or `CollapsedPathIdsJson` into the evidence line.

## Tests

Extend `InfraEvidenceAskEvidenceCollectorTests`:

- A path in scope with two hops, a matching rank, and one matching cut point produces four citation kinds, in path → hop → rank → cut order.
- An unknown path id produces a bundle with `HasEvidence` false.
- A request snapshot id that differs from the path snapshot produces a bundle with `HasEvidence` false.
- A cut point whose snapshot differs from the path snapshot is omitted.
- Fifty-one hops produce `AskEvidenceRowCap` citations (50) and an omitted-row line.

`dotnet test ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj --filter FullyQualifiedName~InfraEvidenceAskEvidenceCollectorTests`

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2. On a Linux Cloud Agent, use `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path '<path>'`.
- Do not call `PathRankingEngine`, `CutPointAnalysisEngine`, `SecurityEvidencePathRankCalculator`, or `SecurityEvidencePathRankExplanationBuilder`.
- Do not invent an ARM id when `CloudResourceId` is null.
- Do not change rank weights.
- Do not commit.

## Done when

`RankedPath` citations are loaded from the path, hop, rank, and cut-point repositories, and a path outside the snapshot yields no citations.
