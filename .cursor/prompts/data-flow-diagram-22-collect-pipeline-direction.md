# DFV-22 — Collect pipeline direction from static dataset names

**Model:** GPT-5.6 Luna. Paste this file as the whole task. Do not implement DFV-16, DFV-17, DFV-20, DFV-21, or DFV-23 in this session.

**Repo:** `c:\ArchLucid`

**Wave:** Data flow diagram (**DFV**). **Depends on:** current `master`. Do not redraw the canvas. Do not add observed-traffic edges. An old ZIP cannot gain direction until the owner re-collects.

## Goal

On a new Azure inventory package, Data Factory and Synapse pipeline activities that name a dataset become rows in `adf-pipeline-flows.json`. A read is `Read`. A write is `Write`. The existing mapper can then emit **Reads from** and **Writes to**. The collector keeps a static dataset name even when that reference also carries parameters.

## Why

On snapshot `Hmd_HI_HAP_Non_Prod` the data-flow canvas says **Pipeline direction was not in this package.** That sentence is painted when ingestion exists, linked-service edges exist, and no `adfReadsFrom` or `adfWritesTo` edge exists (`DiagramDataFlowCompileSupport`).

`AzureInventoryAdfPipelineFlowExtractor.AddDatasetReferences` and `Add-ArchLucidAzureAdfDatasetReferenceFlows` skip a dataset reference when it has a `parameters` object. Enterprise copy activities almost always pass parameters and still name the dataset in `referenceName`. Those rows never reach `adf-pipeline-flows.json`, so the diagram only shows **Likely connected to**.

Lookup and Get Metadata activities often put the dataset on `typeProperties.dataset` or `typeProperties.source.dataset`. Copy sinks often put it on `typeProperties.sink.dataset`. Those shapes are skipped when `inputs` and `outputs` are absent.

## Read first

- `docs/library/AZURE_EXTRACTOR.md` (ADF companions)
- `ArchLucid.Core/AzureExtractor/AzureInventoryAdfPipelineFlowExtractor.cs`
- `ArchLucid.Core/AzureExtractor/AzureInventoryAdfStaticReferenceValidator.cs`
- `scripts/azure/ArchLucid.SecurityInventory.helpers.ps1` (`Get-ArchLucidAzureAdfPipelineFlowCompanionRows`, `Add-ArchLucidAzureAdfDatasetReferenceFlows`)
- `ArchLucid.Integrations.AzureExtractor/HostedAzureInventoryAdfPipelineMetadataCollector.cs`
- `ArchLucid.Core.Tests/AzureExtractor/AzureInventoryAdfPipelineFlowExtractorTests.cs`

## What to build

1. Branch `dfv/22-collect-pipeline-direction` from current `master`.
2. In the C# extractor and in the PowerShell helper, keep a dataset reference when `referenceName` is a static name, even if `parameters` is a non-empty object. Do not persist parameter names or values.
3. Still skip a reference whose type contains `Expression`, and still skip a name that `AzureInventoryAdfStaticReferenceValidator` rejects.
4. When an activity has no usable `inputs` entry, also read a static dataset from `typeProperties.dataset` and from `typeProperties.source.dataset`. Those are `Read`.
5. When an activity has no usable `outputs` entry, also read a static dataset from `typeProperties.sink.dataset`. That is `Write`.
6. Do not double-count the same factory, pipeline, activity, direction, and dataset. `ExecutePipeline` and `ExecuteDataFlow` stay as they are.
7. Hosted collection already calls `ExtractFlows`. Do not add a second parser there.
8. Tests in `AzureInventoryAdfPipelineFlowExtractorTests`:
    - A Copy activity whose input reference has `parameters` and `referenceName` `SrcBlob` emits one `Read` row for `SrcBlob`.
    - A Lookup activity with only `typeProperties.dataset.referenceName` `LookupSet` emits one `Read` row.
    - A Copy activity with only `typeProperties.sink.dataset.referenceName` `SinkSql` emits one `Write` row.
    - An expression reference still emits nothing.
    - Parameter values do not appear in the row.

## Acceptance criteria

- A static dataset name with parameters becomes a flow row.
- Source, sink, and dataset slots on `typeProperties` become flow rows when `inputs` or `outputs` do not already name that dataset.
- Secrets, connection strings, and parameter values are not stored.
- Tier 1 PowerShell and the C# extractor follow the same rules.

## Constraints

- Before editing any tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. If it exits 2, stop and report the blocked path.
- Do not change edge labels, the honesty sentence, or diagram layout. That is DFV-23.
- Do not collect Log Analytics or call pipeline runs.
- Working-tree safety. Stage only the extractor, the PowerShell helper, and the tests. **No `git add -A`.**
- **Do not commit.**

## Verification

```powershell
dotnet test ArchLucid.Core.Tests/ArchLucid.Core.Tests.csproj --filter "FullyQualifiedName~AdfPipelineFlow"
.\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.Core/ArchLucid.Core.csproj'
```

Heartbeat every 8s on the compile. One compile, plus one retry if it exits 1.

## Done when

Tests pass. Tell the owner the current `Hmd_HI_HAP_Non_Prod` ZIP will keep the missing-direction sentence until they re-run `scripts/azure/Get-SecureNowAzurePackage.ps1` and upload the new package. Wait for that new capture before any commit.
