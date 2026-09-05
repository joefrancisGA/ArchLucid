# CR-02 — Remaining Working copy names one work object

**Do not fork IS-02 / IS-03** (Home primary, Alt+N resolver). **Do not fork LS-04 / LS-08** (Path chooser / two resume primaries). **Do not rewrite ADR 0067.** This file is leftover **Working copy** that still tells a paying architect to pick between Create architecture and Start a review as peer products.

## Goal

Working-mode evidence copy, drafts-list helper text, first-review guide CTAs, and contextual-help “what to do next” resume **one work object** (last in-flight / last-open / new draft). Guided / demo / trial keep ADR 0067 co-equal Create + Review when both appear.

## Why

A repeat professional does not open the drafts list to self-classify into two start products. Residual sentences like “Use Create architecture or Start a review” undo IS-02 muscle memory.

## Context

- `archlucid-ui/src/lib/architectures-list-evidence-copy.ts` (still names both products)
- `archlucid-ui/src/lib/first-review-guide-evidence-copy.ts`
- `archlucid-ui/src/lib/contextual-help-registry.ts` / `contextual-help-registry.test.ts`
- `archlucid-ui/src/lib/architecture-created-clarifications-sources.ts` / `architecture-created-overview-sources.ts` (guided-intake hrefs — keep for Guided)
- `CREATE_ARCHITECTURE_LABEL` / `START_REVIEW_LABEL` — do not delete the constants; stop pairing them as peer Working CTAs
- `resolveWorkingStartHref` — reuse; do not fork the resolver

## What to build

1. Grep `archlucid-ui/src` for Working-visible strings that pair “Create architecture” with “Start a review” as the next action. Skip Guided-only routes and `?path=guided-intake`.
2. Rewrite Working copy to resume last work or open the draft editor. Secondary links to drafts list / packages list stay links, not a second filled primary.
3. Split Vitest fixtures: Working vs Guided. ADR 0067 tests must still pass on Guided.
4. Do not hide desktop review tabs. Do not change spawn lock.

## Acceptance criteria

- Working drafts-list evidence copy no longer tells the architect to choose between two start products.
- Guided first-review / Path chooser still shows co-equal Create + Review where those surfaces already do.
- `working-start-route.ts` unchanged except if a test import is needed.

## Constraints

- Do not merge draft and run tables.
- Do not auto-switch stored Guided users.
- TB-645 vocabulary.
