# AX-DC-05 — Identity mode authorization overlay

**Wave:** AX-DC. **Depends on:** AX-DC-02. **Do not** add collectors.

Follow [`.cursor/prompts/azure-extractor-diagram-consumption-00-index.md`](azure-extractor-diagram-consumption-00-index.md) global constraints.

## Goal

**Identity** diagram mode should show **authorization relationships** (app / compute → data resource **May access**) alongside identity primitives (`USES_IDENTITY`, role assignments on principals) — without turning Identity mode into a full subscription inventory.

## Why

Identity mode filters to identity-category nodes. Compute apps and data stores are often excluded, so `appAuthorizedAccess` edges never paint even after AX-DC-02’s Executive fix. Identity is the natural mode for “what can this workload access?” per discovery doc §1.1.

## Context

- `ArchLucid.Application/InfraEvidence/Mermaid/InfraEvidenceMermaidModeParser.cs` — Identity mode
- `DiagramAstFromGraphCompiler.ApplyModeNodeFilter`
- `AzureInventoryAppAuthorizedAccessEdgeMapper.cs`
- [`INFRA_EVIDENCE_IDENTITY_DIAGRAM_COMPOSER_PROMPTS.md`](../../docs/architecture/INFRA_EVIDENCE_IDENTITY_DIAGRAM_COMPOSER_PROMPTS.md) — IE-ID shipped paint bugs; do not re-run IE-ID for this overlay

## What to build

1. Extend Identity mode compile path to include:
   - Identity-category nodes (existing)
   - **Plus** endpoints of `appAuthorizedAccess`, `appToKeyVaultRef`, and `hostnameInferredTarget` edges (reuse AX-DC-02 includer or Identity-specific wrapper with tighter cap)
2. Edge filter: on Identity mode, include:
   - Existing identity edges (HAS_ROLE, USES_IDENTITY, etc.)
   - `appAuthorizedAccess` / `appToKeyVaultRef` / `hostnameInferredTarget` when both endpoints included
   - Do **not** import full network PE spine into Identity mode
3. Labels: **May access** / **Likely connected to** via existing humanizer; AX-DC-03 strokes when landed.
4. Honest empty: if no authorization edges and no identity nodes, keep existing empty UX — do not fake nodes.
5. Tests:
   - Identity compile with Web App + SQL + `appAuthorizedAccess` → edge present
   - Identity compile without authorization edges → no compute/data flood
   - Cap respected when many apps (truncate with same priority as AX-DC-02)

## Acceptance criteria

- Identity canvas answers “what is this app allowed to access?” without claiming traffic.
- Network and Executive behavior unchanged except shared includer code paths.

## Constraints

- `dotnet test ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj --filter 'FullyQualifiedName~DiagramAstFromGraphCompiler|Identity'`
- `dotnet test ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj --filter 'FullyQualifiedName~InfraEvidenceMermaidModeParser'`
- Heartbeat if >15s.

## Done when

Identity mode fixture shows **May access** Web App→SQL with MI+RBAC ZIP only.
