# SA-11 — Architecture-outcome metrics

**Do not** headline “findings closed.” Follow [`.cursor/prompts/securenow-architect-00-index.md`](securenow-architect-00-index.md) global constraints.

## Goal

Add SecureNow architect metrics comparing snapshot N vs N+1: critical/high-confidence paths removed, privileged identities on paths reduced, unrestricted-egress capability paths reduced, asserted crown-jewel exposure reduced, shared-control radius reduced, exceptions expired, recurrence on same CloudResourceId+control. IE-15 ticket metrics remain supporting.

## Why

Architecture outcomes are flow reductions, not inventory of closed tickets.

## Context

- Plane §9
- `docs/library/REMEDIATION_PRIORITIZATION_AND_WAVES.md`
- IE-06 diffs; SA-09 bands
- Remediation factory UI (later SA-16 may display; API this prompt)

## What to build

1. `GET /v1/operational-security/architect-metrics?fromSnapshotId&toSnapshotId` (ReadAuthority). Deterministic counts. Document definitions in `docs/library/SECURENOW_ARCHITECT_METRICS.md`.
2. “Path removed” = canonical hop hash present in from, absent in to (or band improved past a documented threshold — pick **hash absence** for v1 to avoid gameability).
3. Recurrence: operational finding same natural key after Closed/Verified.
4. Tests: fixture pair with one privilege path gone → count 1; identical snapshots → zeros; tenant isolation.

## Acceptance criteria

- Headline DTO fields are path/identity/egress/crown-jewel/shared-control/exception/recurrence — not `findingsClosed`.
- Optional `supportingOperationalMetrics` may include IE-15 open count.

## Constraints

- No LLM.
- Compile: `.\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.Api.Tests/ArchLucid.Api.Tests.csproj'`

## Done when

An executive GET can be shown without implying a scanner burn-down is the product.
