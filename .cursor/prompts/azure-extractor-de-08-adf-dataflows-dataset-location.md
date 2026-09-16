# AX-DE-08 — ADF mapping data flows and dataset location

**Wave:** AX-DE. **Depends on:** AX-DE-01. Prefer after AX-DE-05.

Follow [`.cursor/prompts/azure-extractor-diagram-enrichment-00-index.md`](azure-extractor-diagram-enrichment-00-index.md) global constraints.

## Goal

1. Collect mapping data flows (`GET …/dataflows?api-version=2018-06-01`) and honor `ExecuteDataFlow` in pipeline flow extraction.
2. Add sanitized dataset **location** fields (container, filesystem, folder, table, schema) for inferred Raw / Curated labels.

## Why

Pipeline Copy activities use dataset inputs/outputs. Mapping data flows often **do not** list those arrays; transform stays empty. Dataset names alone cannot label ADLS zones.

## Context

- `AzureInventoryAdfPipelineFlowExtractor` (skips ExecutePipeline; ignores data flow)
- `AzureInventoryAdfDatasetSanitizer` / dataset companion
- SN-DF: zone labels are inference — say so

## What to build

1. Optional `adf-dataflows.json`: `factoryResourceId`, `dataflowName`, `dataflowResourceId`, `sourceLinkedServiceNames[]`, `sinkLinkedServiceNames[]` from **static** references only. Skip expressions.
2. Pipeline extractor: `ExecuteDataFlow` → join dataflow sources/sinks as Read/Write (DerivedFact) through linked services, same as datasets.
3. Dataset companion: optional `locationKind`, `containerOrFilesystem`, `folderPath`, `tableName`, `schemaName` — strings only, truncate (e.g. 256 chars), never connection strings.
4. Do **not** auto-draw “Raw” vs “Curated” as ObservedFact. Optional DeterministicInference label helper (`raw`/`curated`/`bronze`/`silver`/`gold` in folder or dataset name) is OK if tests lock the heuristic and the humanizer says **Inferred zone**. Skip if that explodes scope — then store fields only and leave labeling to SN-DF later.
5. Tests: ExecuteDataFlow to blob source + SQL sink; folder `raw/ingest` stored; `connectionString` in typeProperties not persisted.

## Acceptance criteria

- Optional companions. Fail-soft.
- Hosted + Tier 1.

## Constraints

- Compile Core + Integrations + Application ADF tests.
- Do not claim Spark runtime traffic.

## Done when

A factory whose only transform is ExecuteDataFlow still emits `adfReadsFrom` / `adfWritesTo` through the dataflow’s static linked services.
