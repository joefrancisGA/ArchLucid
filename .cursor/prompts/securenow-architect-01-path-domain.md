# SA-01 — Security evidence path domain

**Do not** add engines, UI, or `IFindingEngine`. Follow [`.cursor/prompts/securenow-architect-00-index.md`](securenow-architect-00-index.md) global constraints.

## Goal

Persist `SecurityEvidencePath` and ordered hops as the first-class record SecureNow architect engines will cite. `OperationalSecurityFinding` may later reference `PathId`; do not emit findings in this prompt.

## Why

Today operational findings are resource/control rows. Architect reasoning needs an ordered, provenance-labeled hop list so the product can say “actor A through identity B and network C to asset D” without treating AI prose as evidence.

## Context

- `docs/library/SECURENOW_ARCHITECT_PLANE.md` §§2–6
- `ArchLucid.Core/InfraEvidence/ProvenanceKind.cs`
- `ArchLucid.Core/Persistence/ApplicationPorts/InfraEvidence/OperationalSecurityFindingRecord.cs`
- `docs/library/SQL_SCRIPTS.md`
- Isolation tests: `SqlAzureExtractorPackageRepositoryScopeIsolationSqlIntegrationTests`

## What to build

1. Contracts (one type per file): `SecurityEvidencePathRecord`, `SecurityEvidencePathHopRecord`, `PathKind` enum (Privilege, IntendedReachability, CapabilityToFlow, SharedControlBlastRadius, ToxicCombination, FourRealityDrift), `PathConfidenceBand` enum (Confirmed, HighlyLikely, Probable, Possible, InsufficientEvidence).
2. Hop fields: ordinal, from node id, to node id, edge type, `ProvenanceKind` **required**, hop confidence band, `InferenceSource`, `EvidenceReference` (snapshot row / ARM id pointer), optional `CloudResourceId`.
3. Path fields: `PathId`, `TenantId`, `WorkspaceId`, `ProjectId`, `SnapshotId`, `PathKind`, `PathConfidenceBand`, canonical hop hash, `WeakestHopOrdinal`, `WeakestHopReason`, optional `CrownJewelAssertionId` (nullable FK; SA-18 will fill), timestamps. Do not store a confidence percentage.
4. SQL: next DbUp + `ArchLucid.sql` + rollback. TenantId everywhere. Indexes `(TenantId, SnapshotId, PathKind)`, `(TenantId, PathId)`, unique `(TenantId, SnapshotId, CanonicalHopHash)`.
5. `ISecurityEvidencePathRepository` + Sql + NoOp. Insert is idempotent on the unique hash. Do not update hops in place; new snapshot → new paths (SA-13 will invalidate).
6. Guard: reject paths with zero hops; reject hops missing `ProvenanceKind`; compute path band as **minimum** hop band (document the order Confirmed > HighlyLikely > Probable > Possible > InsufficientEvidence).
7. Optional nullable `PathId` on operational finding **only if** you can add it without breaking ingest tests — otherwise leave a documented extension point for SA-03.
8. Tests: isolation; duplicate hash no second row; weakest-link band; AiInference hop cannot yield Confirmed.

## Acceptance criteria

- Path rows are tenant-scoped and hashed.
- No engine, no HTTP required (repository + SQL is enough).
- No percentage column.

## Constraints

- Do not subclass `Finding` or `GraphNode`.
- Compile: `.\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.Persistence.Tests/ArchLucid.Persistence.Tests.csproj'`

## Done when

A snapshot can own idempotent path headers with labeled hops; engines in later prompts have a place to write.
