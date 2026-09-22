# IE-RF-09 — Completeness warnings per relationship class

Follow [`.cursor/prompts/infra-evidence-relationship-first-00-index.md`](infra-evidence-relationship-first-00-index.md) global constraints. **Depends on IE-RF-02** and **IE-RF-03**.

## Goal

When ARG truncates, a type list 404s, or Get-AzResource fallback is used, the snapshot must record **which relationship classes are incomplete** instead of emitting a silently sparse diagram.

## Why

Operators currently see a disconnected Mermaid and assume Azure has no NICs. The collector often had NICs with empty properties. Plane: collectors fail soft; do not invent topology.

## Context

- Extractor telemetry helpers (`Add-ArchLucidExtractorWarning`, completeness metadata on schema v2 manifest)
- `AzureInventorySnapshot` completeness score / warnings
- Hosted client skip/log paths
- `docs/library/INFRA_EVIDENCE_PLANE.md` §2 collectors fail soft

## What to build

1. Define a small closed set of completeness codes (own file), e.g. `arg-vm-nic-missing`, `hosted-nic-list-failed`, `arm-fallback-thin-properties`, `agw-backend-fqdn-unresolved`.
2. Manifest or snapshot warning list includes those codes when:
   - Inventory contains VMs but zero `vmToNic` rows.
   - Inventory contains NICs but zero `nicToSubnet` rows.
   - Hosted NIC list failed and `/resources` properties are empty.
   - ARG relationship query failed but index succeeded.
3. Do **not** fail ZIP ingest. `CaptureStatus` Partial when any relationship class required for Network mode is missing.
4. Diagram UX: do not treat this as IE-ND-05 “too large.” If you expose a string to the workbench, reuse existing completeness/warning surfaces (snapshot header / Operate disclosure). Do not add a new nav item.
5. Tests: VM-only resources.json without NIC associations → warning `arg-vm-nic-missing` (or hosted equivalent); healthy VM+NIC fixture → no that code.

## Acceptance criteria

- Codes are stable strings (tests lock them).
- No Azure calls at read/API time to “fill in.”

## Constraints

- Do not implement effective NSG (**IE-RF-10**).
- Compile: Application.Tests and/or extractor tests as touched.

## Done when

A thin Get-AzResource-style fixture (VMs+NICs, no nested properties, no associations) ingest warns instead of looking like a successful empty topology.
