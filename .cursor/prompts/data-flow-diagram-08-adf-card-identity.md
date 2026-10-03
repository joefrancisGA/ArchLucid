# DFV-08 — Say which factory and host an ADF link belongs to

**Model:** GPT-5.6 Luna. Paste this file as the whole task. Do not implement DFV-06, DFV-07, or DFV-09 in this session.

**Repo:** `c:\ArchLucid`

**Wave:** Data flow diagram (**DFV**). **Depends on:** DFV-11 on current `master`. Do not redo the edge router. The linked-service row is gone after materialization. DFV-11 stores the type, host, factory, runtime, and Key Vault flag on `dbo.AzureInventoryAdfExternalSources`. This session paints that stored identity. If those rows are not in the repository yet, stop and report that DFV-11 has to land first.

## Goal

An external ADF linked-service card shows its own name, its connector type, the factory it belongs to, and the target host when that host is already collected. The same linked-service name in dev, ppd, and tst is three readable cards. DFV-12 may later collapse cards that share a host. This session still paints each card.

## Why

`AzureInventoryAdfLinkedServiceEdgeMapper` points an unresolved linked service at `adf-external:{factory}|{name}`. `AzureInventorySnapshotExternalSourceNodeHydrator.EnsureExternalSourceNode` then builds the graph node with the linked-service name as the label and passes `linkedServiceType: null` and `targetHost: null`.

The capture row already has `LinkedServiceType`, `TargetHost`, `FactoryResourceId`, `IntegrationRuntimeName`, and `KeyVaultResourceId`. DFV-11 saves those fields. The hydrator on current `master` never reads them, so the card shows `hsag_sftp` or `azuremysql1` and the lines to three factories share one label, `likely · Likely connected to`.

`AzureInventoryAdfExternalSourceNodeFactory.BuildDisplayLabel` can format type and host. The hydrator does not call it. Pipeline and dataset rows exist. This session does not add them as cards.

## Read first

- `docs/architecture/DATA_FLOW_DIAGRAM_LUNA_PROMPTS.md`
- `ArchLucid.Application/InfraEvidence/Mermaid/AzureInventorySnapshotExternalSourceNodeHydrator.cs`
- `ArchLucid.Application/InfraEvidence/AzureInventoryAdfLinkedServiceEdgeMapper.cs`
- `ArchLucid.Core/AzureExtractor/AzureInventoryAdfExternalSourceNodeFactory.cs`
- `ArchLucid.Core/AzureExtractor/AzureInventoryAdfLinkedServiceRow.cs`
- `ArchLucid.ArtifactSynthesis/Compilers/DiagramAstFromGraphCompiler.cs` (`BuildDiagramNode`)
- `ArchLucid.ArtifactSynthesis/Mermaid/MermaidDiagramDeterministicRepairer.cs`
- `ArchLucid.ArtifactSynthesis/Layout/DiagramForestCanvasLabelContext.cs`

## What to build

1. Branch `dfv/08-adf-card-identity` from current `master`.
2. When the snapshot graph builds an external linked-service node, copy from the persisted external-source row for that `adf-external:` id:
   - `arm.externalLinkedServiceType`
   - `arm.externalTargetHost` when `TargetHost` is present
   - `arm.externalFactoryName` as the factory resource name, the last ARM segment
   - `arm.externalIntegrationRuntime` when `IntegrationRuntimeName` is present
3. Keep the card title as the linked-service name. Do not replace `hsag_sftp` with the raw ARM id.
4. The hydrator reads the persisted row. Do not pass null type and null host when that row has values. Do not invent a host. A snapshot with no external-source row keeps today's card.
5. Copy those properties onto `DiagramNode` and through `MermaidDiagramDeterministicRepairer`. A field that dies in repair will not appear on the canvas.
6. On a data-flow card, under the name, paint the lines that have values, in this order: connector phrase (`SFTP link`, `MySQL link`, `Blob link`, otherwise `{type} link`), `Factory {name}`, host, and `Runtime {name}`. When `KeyVaultResourceId` is set and `TargetHost` is empty, paint `Host in Key Vault` instead of a host. If DFV-07 already painted the connector phrase, do not paint it twice. Keep a `Used by N` or `No consumer found` line if one is already there.
7. Do not change edge routing, label collapse, or the words `likely ·`. Do not add pipeline or dataset nodes.
8. Tests: a row with type `Sftp`, host `files.partner.example`, factory name `adf-edw-hi-dev`, and runtime `selfHostedIr` produces a data-flow card whose SVG contains `hsag_sftp`, `SFTP link`, `Factory adf-edw-hi-dev`, `files.partner.example`, and `Runtime selfHostedIr`. A second card with the same linked-service name and factory `adf-edw-hi-tst` contains `Factory adf-edw-hi-tst`. A row with a Key Vault id and no host contains `Host in Key Vault` and does not contain a fabricated hostname. Repair keeps the factory name and host.

## Acceptance criteria

- Each external linked service names its factory.
- A collected host is visible on the card. A Key Vault reference does not become a fake host.
- The connector line still reaches the factory. Routing is unchanged.
- No secret value is written onto the node, the edge, or a log.

## Constraints

- Before editing any tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. If it exits 2, stop and report the blocked path.
- Do not read or store connection strings in this session. That is DFV-09.
- Working-tree safety. Stage only the hydrator, the node fields, the repairer, the caption, and the tests. **No `git add -A`.**
- **Do not commit.**

## Verification

```powershell
dotnet test ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj --filter "FullyQualifiedName~ExternalSource|FullyQualifiedName~AdfLinked|FullyQualifiedName~DiagramForest"
dotnet test ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj --filter FullyQualifiedName~ExternalSource
.\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.ArtifactSynthesis/ArchLucid.ArtifactSynthesis.csproj'
```

Heartbeat every 8s on the compile. One compile, plus one retry if it exits 1.

## Done when

Tests pass. Tell the owner to restart the API and open Data flow on `Hmd_HI_HAP_Non_Prod`. Each `hsag_sftp` card should name its factory. An SFTP or HTTP card with a collected host should show that host. `azuremysql1` should show `MySQL link` and either a host or `Host in Key Vault`. The connectors should still be present. Wait for that look before any commit.
