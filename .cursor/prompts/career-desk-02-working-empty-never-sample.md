# CD-02 — Working empty states never hero a sample or two start products

**Do not fork WA-02 or RS-15** for Home dual-path cards, Working palette one start, or empty-preset *sample-gated* helpers that already exist. This file is **remaining presets**: `RUNS_EMPTY`, `RUNS_EMPTY_COMPACT`, `GRAPH_IDLE` still list a showcase sample and/or dual Create architecture + Start review doors. Tests currently pin the sample CTA (`empty-state-presets.test.ts`).

## Goal

Working-mode empty reviews list and evidence graph: one start (`WORKING_NEW_REVIEW_LABEL` → `ARCHITECTURES_NEW_PATH` or the existing Working start href), no sample review hero. Guided / buyer / demo may keep the Azure-reference sample with TB-778 honesty. Saving a draft still never starts a review.

## Why

RS-15 gated some operator empty presets. The reviews list and graph idle still recover into a fabricated package. That is first-session theater. A daily driver with an empty tenant starts work, not a sample.

## Context

- `archlucid-ui/src/lib/empty-state-presets.ts` — `RUNS_EMPTY`, `GRAPH_IDLE`, `GRAPH_IDLE_BUYER`
- `archlucid-ui/src/lib/enterprise-compact-empty-state-presets-reviews.ts` — `RUNS_EMPTY_COMPACT`
- `archlucid-ui/src/app/(operator)/insights/evidence-graph/_sections/graph-page-helpers.ts`
- `WORKING_NEW_REVIEW_LABEL` / `WORKING_MODE_NEW_REVIEW_ROUTE`
- `SHOWCASE_STATIC_DEMO_RUN_ID` — keep for Guided/demo only
- ADR 0067 §6 — Working emphasis from workspace state (empty tenant → one start is legal; do not add Step 1/Step 2)

## What to build

1. Working resolver for these presets: single New review action; drop sample outline (or move sample behind Guided/demo only).
2. Compact reviews empty used on the operator list: same Working contract.
3. Graph idle helper: Working uses `GRAPH_IDLE` without sample; buyer/demo keep `GRAPH_IDLE_BUYER` / sample.
4. Vitest: Working fixtures have no `SHOWCASE_STATIC_DEMO_RUN_ID` in primary/secondary empty actions; Guided/demo still can. Update tests that currently require the sample on `RUNS_EMPTY`.

## Acceptance criteria

- Working empty reviews/graph cannot screenshot “explore the sample review” as the job.
- Guided/demo sample recovery remains labeled as Azure reference (TB-778).
- No ordinal funnel copy (ADR 0067).

## Constraints

- Do not delete the guided intake **route**.
- Do not collapse review tabs.
- Do not implement **M-44**.
