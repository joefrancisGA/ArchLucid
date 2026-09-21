# AX-DE-07 — ADF integration runtimes

**Wave:** AX-DE. **Depends on:** AX-DE-01.

Follow [`.cursor/prompts/azure-extractor-diagram-enrichment-00-index.md`](azure-extractor-diagram-enrichment-00-index.md) global constraints.

## Goal

Collect `GET …/factories/{factory}/integrationruntimes?api-version=2018-06-01` into optional `adf-integration-runtimes.json` and emit `adfIntegrationRuntime` (factory **Runs on** Azure IR / SHIR / VNet IR).

## Why

Self-hosted IR is the on-prem hop for SAP/files. VNet IR is a network attachment. Linked-service rows already store `integrationRuntimeName` but there is no IR node or subnet.

## Context

- Linked-service `connectVia.referenceName` already collected
- Never-show catalog: do **not** AlwaysDispose IRs on Data Flow

## What to build

1. Row: `factoryResourceId`, `integrationRuntimeResourceId`, `name`, `kind` (`Managed` / `SelfHosted` / `ManagedVNet` as ARM reports), `subnetId?`, `state?` (Ready/Offline — not secrets), `collectionStatus`.
2. Graph: factory → IR node (stable id = IR ARM id). If `subnetId` present, IR → subnet `adfIntegrationRuntime` or reuse `appServiceToSubnet`-style ObservedFact.
3. SHIR with no subnet: still a node (on-prem hop). Label **Runs on**.
4. Hosted + PowerShell + ZipBuilder + validator.
5. Tests: ManagedVNet IR with subnet; Azure IR no subnet; failed list fail-soft.

## Acceptance criteria

- No SHIR installer keys or auth keys.
- Optional companion.

## Constraints

- Compile Integrations + Core + Application tests scoped to AdfIntegrationRuntime.
- Do not scrape on-prem VMs.

## Done when

Factory with VNet IR shows factory **Runs on** IR and IR **connects** subnet when subnet id is present.
