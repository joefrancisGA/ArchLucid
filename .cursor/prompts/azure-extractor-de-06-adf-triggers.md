# AX-DE-06 — ADF triggers companion

**Wave:** AX-DE. **Depends on:** AX-DE-01. **Do not** implement IRs or data flows.

Follow [`.cursor/prompts/azure-extractor-diagram-enrichment-00-index.md`](azure-extractor-diagram-enrichment-00-index.md) global constraints.

## Goal

Emit optional `adf-triggers.json` from `GET …/factories/{factory}/triggers?api-version=2018-06-01` and map Event Grid / blob / schedule wiring to `adfTriggerSource`.

## Why

Pipelines describe activity I/O. Triggers explain **when** ingestion runs (blob created, Event Grid, tumbling window). Without them, Data Flow cannot show source→factory causality.

## Context

- ADF pipeline-flow collector pattern (`HostedAzureInventoryAdfPipelineMetadataCollector`, SecurityInventory helpers)
- `AzureExtractorPackageZipEntryNames` optional list
- ZIP validator optional array readers (copy ADF datasets pattern)

## What to build

1. Companion row (sanitized): `factoryResourceId`, `triggerResourceId`, `triggerName`, `triggerType`, `pipelineNames[]` (static references only), `sourceResourceId?`, `sourceHost?`, `scheduleRecurrence?` (string like `Hour` — not a cron secret), `collectionStatus`, `warningCode`.
2. Blob/Event Grid: extract storage ARM id or host from typeProperties **without** keys. Skip expression-based names (`AzureInventoryAdfStaticReferenceValidator`).
3. Map: source ARM/host → factory `adfTriggerSource`. Also factory → pipeline is **not** required if pipeline flows already exist.
4. Fail-soft per factory (Forbidden/NotFound/throttle rows + completeness code `adf-triggers-missing` when factories exist and file absent).
5. Hosted GET-only client method `ListFactoryTriggersAsync`. PowerShell `Get-ArchLucidAzureAdfTriggerCompanionRows`. ZipBuilder + validator + inventory reader.
6. Tests: blob trigger to storage account; schedule-only trigger has no source edge; dynamic path skipped; secret properties redacted.

## Acceptance criteria

- Optional sibling; old ZIPs still ingest.
- Hosted + Tier 1 parity.

## Constraints

- Compile Integrations.AzureExtractor.Tests + Core.Tests + Application.Tests mapper.
- No `git add -A`.

## Done when

Fixture factory + blob trigger produces **Triggers** from storage (or inferred host) to the factory.
