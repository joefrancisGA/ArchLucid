# DFV-27 — Collect data-flow sources and Logic App peers

**Model:** GPT-5.6 Luna. Paste this file as the whole task. Do not implement DFV-21, DFV-23, DFV-26, or a NAT-gateway or load-balancer pass in this session.

**Repo:** `c:\ArchLucid`

**Wave:** Data flow diagram (**DFV**). **Depends on:** current `master`. DFV-22 already keeps a static dataset name when an activity also passes parameters. This session fills the data-flow companion and the Logic App companion. An old ZIP cannot gain those rows until the owner re-collects.

## Goal

On a new Azure inventory package, `adf-dataflows.json` names the linked services each mapping data flow reads and writes. `adf-pipeline-flows.json` turns an `ExecuteDataFlow` activity into `Read` and `Write` rows for those linked services. `logic-app-connections.json` contains a row when a Consumption workflow names an API connection or names another Azure resource in an action. A workflow that has such a row is no longer asked whether it stands alone. A workflow with neither is still asked.

## Why

On snapshot `Hmd_HI_HAP_Non_Prod`, every workflow is a stand-alone Review question, and `logic-app-connections.json` is `[]`. `adf-dataflows.json` lists real data flows (`DF_AHCCCS_CLMENC_INTG_CLAIM_HEADER`, `SnowLoadDev`, `DB6table loads`, `SLA15_DATA_LOAD`, and the rest) on factories `adf-edw-hi-dev-wus-001`, `adf-edw-reports-hi-dev`, `adf-edw-hi-ppd`, and `adf-edw-hi-tst`, each with `collectionStatus` `Succeeded` and both `sourceLinkedServiceNames` and `sinkLinkedServiceNames` empty.

`Succeeded` means the list call returned the resource. `Get-ArchLucidAzureAdfDataflowCompanionRows` then writes empty arrays. It never reads `properties`. The hosted C# extractor (`AzureInventoryAdfDataflowExtractor`) reads only `dataset.linkedService.referenceName` under `sources` and `sinks`. Mapping data flows usually put the linked service on the source or sink itself (`linkedService.referenceName`), or they name a dataset (`dataset.referenceName`) whose linked service is already on `adf-datasets.json`. Copying only the current C# path would leave this package empty again.

`Get-ArchLucidAzureAdfPipelineFlowCompanionRows` expands `ExecutePipeline`. It never expands `ExecuteDataFlow`. The C# extractor already does, in `TryExpandExecuteDataFlow`, and it emits `DatasetName` `__linkedService:{name}`. The package script also collects pipeline flows before data flows, so the PowerShell expander would have nothing to look up even after the data-flow file is filled.

`Get-ArchLucidAzureLogicAppConnectionCompanionRows` GETs each `Microsoft.Logic/workflows` resource at `api-version=2019-05-01`, reads only `properties.parameters.$connections.value`, and swallows every failure. A workflow that calls Data Factory, storage, or another resource from an action, without an API connection, produces no row. `AzureInventoryLogicAppConnectionEdgeMapper` skips a row whose `connectionResourceId` is empty. `TargetResourceId` is a second edge, and only after that id is present. A relationship that names the workflow removes the stand-alone question. Data Factory and Logic Apps are not on the shared-service allowlist. Filling data-flow sources connects factories to stores. It does not attach Logic Apps.

`resources.json` stores empty `properties`, so a Standard Logic App (`Microsoft.Web/sites` whose kind contains `workflowapp`) cannot be recognized from the inventory record. Do not guess from the name, and do not call Kudu.

## Read first

- `docs/architecture/DATA_FLOW_DIAGRAM_LUNA_PROMPTS.md`
- `scripts/azure/ArchLucid.SecurityInventory.helpers.ps1` (`Get-ArchLucidAzureAdfDataflowCompanionRows`, `Get-ArchLucidAzureAdfPipelineFlowCompanionRows`, `Add-ArchLucidAzureAdfPipelineActivityFlows`, `Get-ArchLucidAzureLogicAppConnectionCompanionRows`, `Test-ArchLucidAzureAdfStaticReferenceName`)
- `scripts/azure/Get-SecureNowAzurePackage.ps1` and `scripts/azure/Get-ArchLucidAzurePackage.ps1` (dataset, pipeline-flow, and data-flow call order)
- `scripts/azure/tests/ArchLucid.SecurityInventory.helpers.Tests.ps1`
- `ArchLucid.Core/AzureExtractor/AzureInventoryAdfDataflowExtractor.cs`
- `ArchLucid.Core/AzureExtractor/AzureInventoryAdfPipelineFlowExtractor.cs` (`TryExpandExecuteDataFlow`)
- `ArchLucid.Core/AzureExtractor/AzureInventoryLogicAppConnectionExtractor.cs`
- `ArchLucid.Application/InfraEvidence/AzureInventoryLogicAppConnectionEdgeMapper.cs`
- `ArchLucid.Integrations.AzureExtractor/HostedAzureInventoryAdfPipelineMetadataCollector.cs`
- `ArchLucid.Core.Tests/AzureExtractor/AzureInventoryAdfPipelineFlowExtractorTests.cs` (`ExtractFlows_expands_execute_data_flow_through_linked_services`)

## What to build

1. Branch `dfv/27-adf-workflow-collection` from current `master`.
2. Stop writing empty source and sink arrays on the data-flow success path. Add a pure function that reads one data-flow resource and returns the two name lists. `Get-ArchLucidAzureAdfDataflowCompanionRows` calls it. The list response is enough when `properties.typeProperties` is present. When that object is missing, GET the data-flow id once with the same factory API version. A present `typeProperties` with empty `sources` and `sinks` is a real empty result. Do not GET again. A failed list or a failed per-resource GET skips that factory or that data flow and leaves the other rows. Do not fail the package.
3. From each item in `sources` and `sinks`, keep a static linked-service name from the first shape that applies. Use `Test-ArchLucidAzureAdfStaticReferenceName`. Skip expression names.
   - `linkedService.referenceName` on the source or sink item.
   - `dataset.linkedService.referenceName` on that item.
   - `dataset.referenceName` resolved through the dataset rows already collected for the same factory (`linkedServiceName`). Pass those dataset rows into the data-flow function. Do not list datasets a second time.
4. Teach `AzureInventoryAdfDataflowExtractor.TryExtractFromArmResource` the same three shapes. Add an optional dataset-name map. `HostedAzureInventoryAdfPipelineMetadataCollector` already lists datasets before data flows. Pass that map. Do not add a second parser. Where the extended metadata collector lists data flows without datasets, list datasets with the existing client method first and pass the same map. One list per factory.
5. Collect data-flow rows before pipeline-flow rows in both package scripts. Pass the data-flow rows into pipeline-flow collection. Keep the ZIP entry names and the order the files are written.
6. In `Add-ArchLucidAzureAdfPipelineActivityFlows`, when the activity type is `ExecuteDataFlow`, read `typeProperties.dataFlow.referenceName` (PowerShell property access is case-insensitive). Look up that data flow by name for the same factory. Emit one `Read` row per source linked service and one `Write` row per sink linked service. `datasetName` is `__linkedService:{name}`, matching `TryExpandExecuteDataFlow`. Dedup with the existing flow key. An unknown data-flow name, or an expression reference, emits nothing. Do not change `ExecutePipeline` nesting. Do not double-count a Copy activity that already names a dataset.
7. Keep the existing `$connections` rows. After a successful workflow GET, also walk `properties.definition` for action resource ids. Include nested `actions`, `else.actions`, switch `cases`, and `default.actions`. Emit one row per static ARM resource id (`/subscriptions/.../providers/...`) whose provider is `Microsoft.DataFactory/factories`, `Microsoft.Synapse/workspaces`, `Microsoft.Storage/storageAccounts`, `Microsoft.Web/sites`, `Microsoft.ServiceBus/namespaces`, `Microsoft.EventHub/namespaces`, `Microsoft.Sql/servers`, or `Microsoft.DocumentDB/databaseAccounts`. Put that id in `connectionResourceId`. `AzureInventoryLogicAppConnectionEdgeMapper` drops a row without it. `connectionName` is the action name. Dedup on workflow, connection name, and resource id. Skip the workflow's own id. Skip an id already emitted as an API connection. Skip any string that contains `@`. Skip properties whose names contain `password`, `secret`, `connectionString`, `secureData`, `accessKey`, `accountKey`, `token`, `sas`, or `authentication`. Do not read `parameterValues`.
8. Apply that same action walk in `AzureInventoryLogicAppConnectionExtractor.ExtractFromWorkflow`, so the hosted collector and the ZIP collector follow one rule. PowerShell mirrors it. It cannot call the C# type from the package script.
9. A workflow GET that throws still adds no row and does not fail the package. A successful GET with no `$connections` value and no allowed action id also adds no row. Do not write a `Succeeded` row that claims a connection which was not there.
10. Do not query `Microsoft.Web/sites`. Do not call Kudu. Do not store the workflow definition, data-flow script, dataset parameters, request bodies, or secrets. Do not add Logic Apps or Data Factory to the shared-service allowlist. Do not change Review question copy. Do not delete stored **It stands alone** answers. A new relationship changes the evidence fingerprint on the next upload. Until then, a stored answer stays stored.
11. Tests:
    - A data flow whose source has `linkedService.referenceName` `BlobLS` and whose sink has `dataset.referenceName` `SinkSet` emits `BlobLS` and the linked service named on dataset `SinkSet`. An expression reference is omitted. Parameter values do not appear in the row.
    - A listed data flow with no `typeProperties` is the only shape that requires a second GET. A listed data flow that already has `typeProperties` does not.
    - An `ExecuteDataFlow` activity whose data flow names source `BlobLS` and sink `SqlLS` emits one `Read` and one `Write`, with dataset names `__linkedService:BlobLS` and `__linkedService:SqlLS`.
    - A workflow with `$connections.value.azureblob.connectionId` still emits that API connection.
    - A workflow action whose input URI is the ARM id of `Microsoft.DataFactory/factories/adf-edw-hi-dev` emits one row with that id as `connectionResourceId`. A `@parameters(...)` string emits nothing. A secret property emits nothing.
    - The C# data-flow extractor and `ExtractFromWorkflow` cover the same two cases.

## Acceptance criteria

- A mapping data flow that names a linked service or a dataset no longer ships with empty source and sink arrays unless those collections are actually empty.
- An `ExecuteDataFlow` activity becomes **Reads from** and **Writes to** once the owner re-uploads, through the rows DFV-23 already knows how to paint. This session does not change labels.
- A Consumption workflow that names an API connection or an allowed Azure resource id is on a relationship, so it is not a stand-alone candidate.
- A workflow with no such peer is still a stand-alone candidate.
- Secrets, parameter values, and the workflow definition are not in the package.
- One factory or one workflow failure does not empty the other companion files.

## Constraints

- Before editing any tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. If it exits 2, stop and report the blocked path.
- Do not relabel factory edges. That is DFV-23.
- Do not collect firewall routes, NAT gateways, or load balancers. That is DFV-26 and out of scope here.
- No `ConfigureAwait(false)` in tests.
- Working-tree safety. Stage only the Security Inventory helper, the two package scripts, the C# extractors, the hosted callers that pass the dataset map, and the tests. **No `git add -A`.**
- **Do not commit.**

## Verification

```powershell
pwsh -NoProfile -Command "Invoke-Pester -Strict -EnableExit -Path 'scripts/azure/tests/ArchLucid.SecurityInventory.helpers.Tests.ps1'"
dotnet test ArchLucid.Core.Tests/ArchLucid.Core.Tests.csproj --filter "FullyQualifiedName~AdfDataflow|FullyQualifiedName~AdfPipelineFlow|FullyQualifiedName~LogicAppConnection"
.\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.Core/ArchLucid.Core.csproj'
```

Heartbeat every 8 seconds on the compile. One compile, plus one retry if it exits 1.

## Done when

Tests pass. Tell the owner the current `Hmd_HI_HAP_Non_Prod` ZIP stays unchanged until they re-run `scripts/azure/Run-SecureNowAzureExtractor.ps1` and upload the new package. After that upload, `adf-dataflows.json` should name linked services for data flows that have them, `ExecuteDataFlow` activities should add `Read` and `Write` rows, and `logic-app-connections.json` should contain a row for each Consumption workflow that names an API connection or an allowed resource id. A workflow that still has no peer should remain a stand-alone question. Wait for that look before any commit.
