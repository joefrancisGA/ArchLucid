# AX-DE-09 — Synapse pipelines, linked services, datasets

**Wave:** AX-DE. **Depends on:** AX-DE-01. Prefer after AX-DE-05 so the sanitizer already knows more connectors.

Follow [`.cursor/prompts/azure-extractor-diagram-enrichment-00-index.md`](azure-extractor-diagram-enrichment-00-index.md) global constraints.

## Goal

Treat `Microsoft.Synapse/workspaces` as an ADF cousin: GET linked services, datasets, and pipelines; emit `synapseLinkedService*` / `synapseReadsFrom` / `synapseWritesTo` (or reuse ADF parsers with workspace id).

## Why

Executive already shows Synapse workspaces. Without child lists, the node has no **Reads from / Writes to**. Synapse pipelines use the same activity input/output shape as ADF (api-version `2020-12-01` or `2021-06-01` — pick one documented version and test it).

## Context

- `IHostedAzureArmReadClient` ADF list methods — extend or generalize to `ListDataFactoryStyleChildrenAsync` with resource type + api-version
- `AzureInventoryAdfPipelineFlowExtractor` — reuse; do not fork
- Topology: Synapse is Transform on SN-DF-02

## What to build

1. Hosted + PowerShell: for each Synapse workspace, list `linkedServices`, `datasets`, `pipelines` (fail-soft per workspace).
2. Prefer writing into existing ADF companion arrays with `factoryResourceId` = workspace ARM id **if** parsers and mappers stay correct. If that confuses Data Factory vs Synapse, use `synapse-linked-services.json` etc. and a thin adapter into the same row types.
3. Mapper: same directional-omit-neutral rule as ADF. Labels identical (**Reads from** / **Writes to**).
4. Completeness: `synapse-pipeline-flows-missing` when workspaces exist and companions absent.
5. Tests: workspace + SQL linked service + Copy activity → synapseWritesTo; ExecutePipeline depth 3 reuse; secrets redacted; Data Factory tests unchanged.

## Acceptance criteria

- Reader GET only.
- Do not collect Spark notebook source or SQL pool query text.

## Constraints

- Compile Integrations + Application ADF/Synapse mapper tests.
- Heartbeat if >15s.

## Done when

A Synapse workspace in the snapshot has declared writes to ADLS/SQL the same way ADF Prompt 7 does for factories.
