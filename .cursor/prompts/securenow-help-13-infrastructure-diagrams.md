# SH-13 — Inventory diagrams `/governance/infrastructure/diagrams`

Follow [`.cursor/prompts/securenow-help-00-index.md`](securenow-help-00-index.md) global constraints.

## Goal

Category-1 for inventory diagrams: render large inventory diagrams with partitioned fallbacks and server PNG export. Not Approval. Not cloud-connections. Not architecture diagram intake for reviews.

## Why

Prefix steal + Learn more `cloud-connections`.

Live lead: `GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_PAGE_LEAD` in `governance-infrastructure-copy.ts`. Home: “Render large inventory diagrams with partitioned fallbacks and server PNG export.”

## Context

- `archlucid-ui/src/lib/governance/governance-infrastructure-copy.ts`
- Live client under `archlucid-ui/src/app/(operator)/governance/infrastructure/diagrams/`
- Diagram **reconcile** is SH-14 (different job).

## What to build

1. Prefix `/governance/infrastructure/diagrams`. Reuse page lead. Next = wait for/select snapshot, render, export PNG; empty = after inventory snapshots; configure = Azure inventory. Actions: resource explorer, diagram-reconcile.
2. Learn more omit or dedicated slug. Not cloud-connections, not evidence-intake, not architecture-intelligence.
3. Vitest as other infrastructure children.

## Acceptance criteria

- F1 describes inventory diagram render/export, not architecture-review diagrams.
- Partitioned fallback / PNG honesty from the page is preserved if present on-page.

## Constraints

- Do not add screenshot galleries to help (repo convention).
- Stage diagrams row + topic map + tests.
