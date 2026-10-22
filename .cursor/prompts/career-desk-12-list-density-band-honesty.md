# CD-12 — Findings list Decision-grade band shows typed-engine honesty

**Do not fork WA-18** for list disposition keys/row actions. This file is **honesty on the list**: `FindingInsightDensityBand` uses label “Decision-grade” with `INSIGHT_DENSITY_TYPED_ENGINE_HONESTY_LINE` in the data model, but the list row may show only the chip. Inspect-only honesty is evaluator design.

## Goal

Working findings table/cards that render a Decision-grade (or Review/Generic) band also expose the typed-engine honesty line without opening inspect — tooltip, row subtitle, or visible helper on the chip is enough if it is keyboard-reachable and present in the accessibility name. Hide-generic stays opt-in. Do not change the gate.

## Why

Triage is the product. A chip that says Decision-grade without “scores do not hide findings” is the same false confidence as the snapshot lead sentence.

## Context

- `archlucid-ui/src/lib/findings/insight-density-band.ts`
- `archlucid-ui/src/components/findings/FindingInsightDensityBand.tsx`
- Findings table on review-detail / `FindingListDispositionRowActions.tsx` (keep actions)
- `docs/quality/INSIGHT_DENSITY_MISS_CLAUSE.md`

## What to build

1. Band presentation always includes `honestyLine` in the accessible name or adjacent text on Working lists.
2. Screenshot contract: “Decision-grade” is never the only visible density words on a typed-engine row in Working.
3. Vitest: list render with a high score includes `INSIGHT_DENSITY_TYPED_ENGINE_HONESTY_LINE` (or the visible equivalent). Gate `.cs` empty diff.

## Acceptance criteria

- Working list triage cannot hide the gate behind inspect.
- Guided may keep a denser chip; Working gets the sentence.
- Disposition row actions still work.

## Constraints

- **Forbidden:** demoting typed engines; new coverage engine.
- Do not collapse review tabs.
- No new shortcut library.
