# LS-03 — Density copy inventory: stop saying the score is advisory

**Do not fork IS-04 or IS-05.** Those own ADR 0070 and the gate method. **Do not fork CD-05/12 or FD-07.** Those added honesty while the gate still promoted. This file is a **CI inventory of product strings** that still teach `typed-engine-protected` as “stay Decision-grade regardless of score.”

## Goal

Every customer-visible line that says typed-engine findings stay on the package **regardless of insight-density score**, or that the computed score is “not a control,” is inventoried. After IS-05, those strings must change to: rows remain on the package; **classification** follows the gate (Decision-grade vs checklist). If IS-05 has not landed, land the inventory + tests that will fail the old strings once the gate moves — or fix the strings in the same PR as IS-05 if you are executing both.

## Why

Honesty chrome that still recites the miss clause is a lie the day the gate moves, and it is already a lie relative to R4: the liability stance requires the stamp to match the control. Tests currently **assert** the advisory sentence (`copy-finding-as-work-item-coverage-honesty.test.ts`, `findings-snapshot-insight-density.test.ts`).

## Context

- `COPY_FINDING_TYPED_ENGINE_PROTECTED_HONESTY` / `copy-finding-as-work-item-coverage-honesty.ts`
- `findings-snapshot-insight-density.ts`
- `InsightDensityCurationBanner.tsx` + test
- `package-print-view.ts`
- `docs/quality/INSIGHT_DENSITY_MISS_CLAUSE.md` (IS-04/05 update the contract; this file is **UI/export strings + Vitest**)
- Pattern: `production-desk-chrome-eval-inventory.ts` (inventory + guard)

## What to build

1. Inventory module listing source files + required/forbidden substrings (forbidden: `regardless of insight-density score` on Working/customer surfaces after the gate).
2. Guard test: listed files must not contain the advisory sentence once IS-05 is in; until then, the inventory documents the sweep.
3. Replace customer copy with classification-honest lines. Keep “rows stay on the package” (not deleted). Do not say they stay Decision-grade.
4. Update tests that currently `toContain("regardless of insight-density score")`.
5. Guided/demo may keep a shorter honesty line; they must not claim the score is unused if the gate applies to those tenants’ packages too (it does).

## Acceptance criteria

- Grep of `archlucid-ui/src` for `regardless of insight-density score` is empty (or only in the inventory’s forbidden-example comment).
- Clipboard / print / snapshot messages name checklist vs Decision-grade, not “protected from the score.”
- No 40th engine.

## Constraints

- Do not edit `DeterministicInsightDensityGate.cs` here.
- Do not check in fake frontier transcripts.
- Do not implement G-REAL-06.
