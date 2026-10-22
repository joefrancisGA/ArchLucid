# SN-DF-01 — External ADF linked-service source nodes

**Wave:** SecureNow data flow (**SN-DF**). **Depends on:** ADF linked-service + pipeline-flow materialization on trunk (Prompt 7). **Do not** implement SN-DF-02–08.

Do not implement from the wave index. Implement only *What to build*.

## Goal

When an ADF linked service does **not** resolve to an inventoried ARM resource, still emit a **stable external source node** so Data Flow can show SAP / Oracle / files / HTTPS hosts on the left — instead of dropping the origin.

## Why

Owner examples all start with ERP/SAP/CRM/Oracle/files. `AzureInventoryAdfLinkedServiceTargetResolver` only returns an edge when `TargetResourceId` is in the snapshot or a unique hostname matches. Unresolved rows become warnings. The factory then looks like an isolated box.

These nodes are **not** Azure resources. Do not invent ARM ids or persist fake `AzureInventoryResourceRecord` rows.

## Context

- `docs/securenow/DATA_ARCHITECTURE_AND_DATA_FLOW_DIAGRAMS.md` §4.2 / §5
- `.cursor/prompts/securenow-data-flow-00-index.md`
- `ArchLucid.Core/AzureExtractor/AzureInventoryAdfLinkedServiceRow.cs`
- `ArchLucid.Core/AzureExtractor/AzureInventoryAdfLinkedServiceTargetResolver.cs`
- `ArchLucid.Application/InfraEvidence/AzureInventoryAdfLinkedServiceEdgeMapper.cs`
- `ArchLucid.Application/InfraEvidence/AzureInventoryAdfPipelineFlowEdgeMapper.cs`

## What to build

1. New helper class (own file) that builds a stable node key from factory ARM id + linked service name, e.g. `adf-external:{normalizedFactoryId}|{linkedServiceName}` (ordinal ignore-case). Null-check inputs; skip `_collection_failed`.
2. Display label: `linkedServiceType` plus sanitized `targetHost` when present (no connection strings). If type is empty, use `External source`.
3. From succeeded or `TargetUnresolved` linked-service rows **without** a resolved ARM target, emit graph nodes **at Data Flow compile time** (injection into the node list the compiler sees). Do **not** add SQL tables in this prompt.
4. When a later compile draws `adfReadsFrom` / `adfWritesTo` / `adfLinkedService*` and the “to” ARM id is missing, attach the factory edge to this external node instead of dropping the edge.
5. Tests (must fail on current master, pass after):
   - Unresolved `SapTable` + host `sap.example.com` produces one external node and a factory→source edge (or factory←source for Read — follow existing ADF direction).
   - Resolved AzureBlobStorage to an in-snapshot storage account does **not** create an external node.
   - Two factories with the same linked-service name produce **two** nodes (factory-scoped keys).
   - Dynamic / expression names are already skipped by collectors — do not re-parse ARM JSON here.

## Acceptance criteria

- Unresolved SAP/Oracle/file linked services appear as nodes with type+host labels.
- In-subscription ARM targets still use the real resource node only.
- No new extractor ZIP companion. No secrets. Provenance stays DeterministicInference or DerivedFact — never ObservedFact for the synthetic node identity.

## Constraints

- Working-tree safety: `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path <file>` before editing a tracked file. Exit 2 → skip and report.
- Do **not** change Network/Executive compile. Do **not** add `DiagramMode.DataFlow` in this prompt (that is SN-DF-03) — expose the helper + unit tests; if a compile hook is required, a private/internal method on the future compiler is OK only if SN-DF-03 can call it without rewrite.
- Prefer: ship the helper + mapper tests that assert node key/label/skip rules; SN-DF-03 wires it into the new mode. If injecting into existing Data mode would leak external nodes onto the ARM forest, **do not** inject into Data mode.
- No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**.
- Stage only this prompt’s paths. **No `git add -A`.**

## Verification

```bash
dotnet test ArchLucid.Core.Tests/ArchLucid.Core.Tests.csproj --filter 'FullyQualifiedName~AzureInventoryAdf'
dotnet test ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj --filter 'FullyQualifiedName~AzureInventoryAdf'
pwsh -NoProfile -File scripts/ci/agent-compile-check.ps1 -ProjectPath 'ArchLucid.Application/ArchLucid.Application.csproj'
```

Heartbeat every 8s if >15s. No full-solution build, no dev server, no `npm ci`.

## Done when

- Helper tests prove stable keys and “no external node when ARM target resolved.”
- Mapper/compiler hook is ready for SN-DF-03 without a second design pass.
