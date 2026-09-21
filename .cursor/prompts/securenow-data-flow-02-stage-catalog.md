# SN-DF-02 — Data-flow stage catalog

**Wave:** SecureNow data flow (**SN-DF**). **Depends on:** SN-DF-01 helper exists (or can no-op if 01 not merged — still land the catalog). **Do not** implement SN-DF-03–08.

Do not implement from the wave index. Implement only *What to build*.

## Goal

One code-owned catalog maps ARM types (and SN-DF-01 external nodes) to pipeline **stages**: Source, Ingestion, Storage, Transform, Consumer. Data Flow compile (SN-DF-03) must not scatter `if (resourceType.Contains("sql"))` copies.

## Why

Owner pipeline is stage-ordered, not resource-group ordered. ADF is Ingestion. SQL/ADLS are Storage. Synapse can be Transform **when present**. External linked-service nodes are Source. Consumers (Power BI, Fabric) stay unmapped until those ARM types exist in inventory — do not add placeholder types you cannot collect.

## Context

- `docs/securenow/DATA_ARCHITECTURE_AND_DATA_FLOW_DIAGRAMS.md` §1
- `ArchLucid.KnowledgeGraph/Inventory/AzureInventoryTopologyCategory.cs` (reuse provider prefixes; do not fork `/sql`)
- `ArchLucid.ArtifactSynthesis/Compilers/ExecutiveAlwaysShowTiers.cs` (do not overload this list for stages)
- `ArchLucid.ArtifactSynthesis/Layout/DiagramArmTypeFriendlyName.cs`

## What to build

1. New types in their own files:
   - Stage name constants: `Source`, `Ingestion`, `Storage`, `Transform`, `Consumer` (string constants, ordinal ignore-case compare helpers).
   - `AzureInventoryDataFlowStageResolver.Resolve(resourceType, isExternalSource)` → stage string.
2. Mapping (OrdinalIgnoreCase, provider prefix — copy IE-ND-01 / IE-DD-01 style):
   - External source flag → **Source**.
   - `Microsoft.DataFactory/factories` → **Ingestion**.
   - `Microsoft.Sql/`, `Microsoft.DocumentDB/`, `Microsoft.DBfor`, `Microsoft.Storage/` → **Storage**.
   - `Microsoft.Synapse/workspaces` → **Transform**.
   - `Microsoft.Databricks/` → **Transform** (only if type string matches; no fake nodes).
   - `Microsoft.PowerBI/`, `Microsoft.Fabric/` → **Consumer** when those prefixes appear; otherwise unused.
   - Unknown ARM → null / omit from Data Flow (do not dump VMs into Consumer).
3. Network types (`Microsoft.Network/`) resolve to **null** (hidden on Data Flow).
4. Tests without pre-stamping Category:
   - Table of ARM types → expected stage.
   - External true → Source even if resourceType is empty.
   - `Microsoft.Network/virtualNetworks` → omit.
   - `Microsoft.Sql/servers` → Storage even while IE-DD-01 is still open (this catalog keys off ARM type, not topology category).

## Acceptance criteria

- Single resolver; no second copy in the compiler.
- Unknown compute/network omitted.
- Storage includes SQL MI, Cosmos account, storage account.

## Constraints

- Working-tree safety script before tracked edits. Exit 2 → skip and report.
- Do **not** change `DiagramMode` or the workbench in this prompt.
- Do **not** add IE-DD-01 category fixes here.
- Stage only this prompt’s paths. **No `git add -A`.**

## Verification

```bash
dotnet test ArchLucid.KnowledgeGraph.Tests/ArchLucid.KnowledgeGraph.Tests.csproj --filter 'FullyQualifiedName~AzureInventoryDataFlowStage'
pwsh -NoProfile -File scripts/ci/agent-compile-check.ps1 -ProjectPath 'ArchLucid.KnowledgeGraph/ArchLucid.KnowledgeGraph.csproj'
```

If the catalog lives in ArtifactSynthesis instead, retarget tests/compile to that project. Prefer KnowledgeGraph or Core next to topology category so Application/ArtifactSynthesis both consume it.

Heartbeat every 8s if >15s.

## Done when

- Tests lock the stage table from the design doc §1 / §4.1.
- Resolver is the only mapping SN-DF-03 is allowed to call.
