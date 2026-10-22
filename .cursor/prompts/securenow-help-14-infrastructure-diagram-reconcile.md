# SH-14 — Diagram reconcile `/governance/infrastructure/diagram-reconcile`

Follow [`.cursor/prompts/securenow-help-00-index.md`](securenow-help-00-index.md) global constraints.

## Goal

Category-1 for diagram reconciliation: uploaded diagrams vs inventory snapshots with explainable correspondence rows. Not inventory-diagram render (SH-13). Not Approval. Not “start a review with a diagram”.

## Why

Prefix steal + Learn more `cloud-connections`.

Live lead: `GOVERNANCE_INFRASTRUCTURE_DIAGRAM_RECONCILE_PAGE_LEAD`. Home: “Reconcile uploaded diagrams against inventory snapshots with explainable correspondence rows.”

## Context

- `archlucid-ui/src/lib/governance/governance-infrastructure-copy.ts`
- Live client under `archlucid-ui/src/app/(operator)/governance/infrastructure/diagram-reconcile/`

## What to build

1. Prefix `/governance/infrastructure/diagram-reconcile`. Reuse page lead. Next = upload/select diagram, pick snapshot, inspect correspondence; empty = after a snapshot and a diagram exist; configure = inventory + upload authority. Actions: diagrams workbench, resource explorer.
2. Learn more omit or dedicated slug. Not cloud-connections or evidence-intake.
3. Vitest as siblings.

## Acceptance criteria

- F1 is correspondence/explainability, not architecture-review evidence intake.
- Help does not claim the uploaded diagram becomes a sealed review record.

## Constraints

- Read live empty/error copy first.
- Stage reconcile row + topic map + tests.
