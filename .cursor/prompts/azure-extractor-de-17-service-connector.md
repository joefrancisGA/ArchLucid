# AX-DE-17 — Service Connector (opportunistic)

**Wave:** AX-DE. **Depends on:** AX-DE-01. **P3** — do not block 02–16 on this.

Follow [`.cursor/prompts/azure-extractor-diagram-enrichment-00-index.md`](azure-extractor-diagram-enrichment-00-index.md) global constraints.

## Goal

When `Microsoft.ServiceLinker/linkers` exist, emit `serviceConnectorLink` (**Connected to**, ObservedFact) from the parent app to the target ARM id.

## Why

Service Connector is uncommon in legacy estates but high-confidence when present. Connection-point doc: opportunistic, not the roadmap anchor.

## Context

- Child list on `Microsoft.Web/sites`, Container Apps, etc.: `…/providers/Microsoft.ServiceLinker/linkers?api-version=2022-11-01-preview` (or stable — document)
- Do not require customers to adopt Service Connector

## What to build

1. For compute types already inventoried (Web/sites, containerApps), list linkers. Fail-soft 404 as empty (most apps have none).
2. Row: `sourceResourceId`, `linkerName`, `targetResourceId`, `collectionStatus`.
3. Map ObservedFact `serviceConnectorLink`. Skip rows without target ARM id.
4. Completeness: none required when zero linkers.
5. Tests: Function → SQL linker; app with no linkers → empty array no warning; secrets in linker properties redacted.

## Acceptance criteria

- Reader GET. Optional companion `service-linker.json` or association rows in `network-associations.json`.
- Do not design discovery around linker presence.

## Constraints

- Compile Integrations + Application mapper.
- Do not add a trust-center extra role.

## Done when

A fixture with one linker draws app **Connected to** the SQL ARM target as ObservedFact, distinct from **May access**.
