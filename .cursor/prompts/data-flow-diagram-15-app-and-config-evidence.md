# DFV-15 — Read app settings and uploaded config as data-flow evidence

**Model:** GPT-5.6 Luna. Paste this file as the whole task. Do not implement DFV-09, DFV-12, or DFV-14 in this session.

**Repo:** `c:\ArchLucid`

**Wave:** Data flow diagram (**DFV**). **Depends on:** current `master`. `HostnameInferredTarget` and `OperatorConfirmedConnection` are already on the data-flow catalog. Do not redo ADF pipeline direction. `AzureInventoryAdfPipelineFlowEdgeMapper` already emits `Reads from` and `Writes to`.

## Goal

Function Apps and App Services contribute host edges the way Container Apps already do. A confirmed connection that came from an uploaded config file is labelled `From config`. A data store says `No evidence checked` when this snapshot has no app, ADF, or confirmed-connection evidence, and `No consumer found` when that evidence exists and nothing points at the store.

## Why

`HostedAzureInventoryAppSettingHostCollector` reads only `Microsoft.App/containerApps`. `AzureInventoryAppSettingHostEdgeMapper` already turns a redacted host row into a `HostnameInferredTarget` edge, and the catalog already paints `Likely connected to`. The Function Apps on this subscription never produce those rows.

`AppSettingsJsonInfrastructureDeclarationParser`, the dotenv parser, the compose parser, and the Terraform show parser already emit a host and a catalog. `OperatorInferredConnectionSnapshotMerger` draws a confirmed row as `Confirmed connection`. The diagram does not say when that confirmation came from a file.

`DiagramForestCanvasLabelContext` paints `No consumer found` for every storage and database card with no neighbor. A capture that never collected app settings looks the same as a capture that collected them and found nothing.

## Read first

- `docs/architecture/DATA_FLOW_DIAGRAM_LUNA_PROMPTS.md`
- `ArchLucid.Integrations.AzureExtractor/HostedAzureInventoryAppSettingHostCollector.cs`
- `ArchLucid.Core/AzureExtractor/AzureInventoryAppSettingHostRedactor.cs`
- `ArchLucid.Core/AzureExtractor/AzureInventoryAppSettingHostParser.cs`
- `ArchLucid.Application/InfraEvidence/AzureInventoryAppSettingHostEdgeMapper.cs`
- `ArchLucid.Application/InfraEvidence/OperatorInferredConnections/OperatorInferredConnectionSnapshotMerger.cs`
- `ArchLucid.Core/Persistence/ApplicationPorts/InfraEvidence/OperatorInferredConnectionRecord.cs` (`SourceFileFormat`)
- `ArchLucid.Core/AzureExtractor/AzureInventoryDataFlowEvidenceCatalog.cs`
- `ArchLucid.ArtifactSynthesis/Layout/DiagramForestCanvasLabelContext.cs`
- `ArchLucid.ArtifactSynthesis/Layout/DiagramForestEdgeLabelSvgEmitter.cs`

## What to build

1. Branch `dfv/15-app-and-config-evidence` from current `master`.
2. Extend the hosted app-setting collector to `Microsoft.Web/sites`, including kind `functionapp`. Read app settings and connection strings through the existing redactor and host parser. Persist an `AzureInventoryAppSettingHostRow` (host, catalog, key vault host, setting name). Do not persist the raw setting value. Do not log it. A value `ShouldRejectValue` already rejects does not become a row.
3. Leave `AzureInventoryAppSettingHostEdgeMapper` as the only place that turns those rows into relationships. New site rows go through it.
4. When a confirmed connection has a non-empty `SourceFileFormat` that one of the parsers in `ArchLucid.ContextIngestion/Infrastructure` already accepts (`appsettings-json`, `dotenv`, `compose-env`, `terraform-show-json`, and the other formats those parsers declare), set its inference source to a new constant `inventory-operator-config-file`. Add that source to the data-flow catalog with diagram label `From config`, family `HumanConfirmed`, and `IncludeOnDataFlow` true. A confirmed connection with an empty source format stays `Confirmed connection`. The edge keeps the declared dash it already has. Add `From config` to the legend only when such an edge is on the canvas.
5. Consumer line, data flow only, for the same ARM types DFV-06 already marks:
   - `No evidence checked` when the snapshot has no relationship whose inference source is an ADF linked service, an app-setting host, an app-to-Key-Vault ref, or an operator-confirmed connection (including the new config source).
   - `No consumer found` when any of those sources exist and this card has no neighbor.
   - `Used by N` stays as it is.
6. Tests:
    - A Function App site setting `Server=tcp:sql1.database.windows.net` produces a host row whose host is `sql1.database.windows.net` and whose stored fields do not contain `Password` or the raw string.
    - The existing mapper then draws `HostnameInferredTarget` to the matching server.
    - A confirmed connection with `SourceFileFormat` `appsettings-json` renders the label `From config`.
    - A confirmed connection with an empty source format still renders `Confirmed connection`.
    - A data-flow storage card on a snapshot with no ADF, app-setting, or confirmed edge renders `No evidence checked`.
    - The same card on a snapshot that has one ADF edge elsewhere renders `No consumer found`.

## Acceptance criteria

- Function Apps and App Services can produce host edges after a new capture.
- Uploaded-config confirmations read `From config`.
- A snapshot that never collected this evidence does not call every store an orphan.
- Secrets stay out of rows, edges, labels, and logs.
- Pipeline `Reads from` / `Writes to` behavior is unchanged.

## Constraints

- Before editing any tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. If it exits 2, stop and report the blocked path.
- Do not add an upload page. The parsers and the confirm path already exist.
- Do not call Key Vault.
- Do not put VNet, subnet, NIC, or diagnostic edges on Data flow.
- Working-tree safety. Stage only the site collector, the catalog row, the merger inference source, the consumer line, and the tests. **No `git add -A`.**
- **Do not commit.**

## Verification

```powershell
dotnet test ArchLucid.Integrations.AzureExtractor.Tests/ArchLucid.Integrations.AzureExtractor.Tests.csproj --filter FullyQualifiedName~AppSetting
dotnet test ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj --filter "FullyQualifiedName~AppSetting|FullyQualifiedName~OperatorInferred"
dotnet test ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj --filter FullyQualifiedName~DiagramForest
.\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.Integrations.AzureExtractor/ArchLucid.Integrations.AzureExtractor.csproj'
```

Heartbeat every 8s on the compile. One compile, plus one retry if it exits 1.

## Done when

Tests pass. Tell the owner that Function App and App Service edges need a new inventory capture. Confirmed config connections can show `From config` on the next diagram load. After the capture, a storage account referenced by a Function App setting should show `Used by N` and a `Likely connected to` edge. A snapshot that has none of this evidence should say `No evidence checked` on its data stores. Wait for that look before any commit.
