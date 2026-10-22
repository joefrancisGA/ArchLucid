# DA-08 — Hidden-filter honesty on findings

**Do not change** the density demotion predicate (ADR 0070 / IS-05). **Do not** remove `hideGenericLowDensity`. This prompt makes **power-user filters** fail safe for livelihood triage.

## Goal

When Working findings filters hide rows (generic low-density, severity, search), the visible band is not presented as the whole queue.

1. A persistent count: **{hidden} findings hidden by filters** with a one-click **Show all** (not a native `title` tooltip).
2. Keyboard Alt+J/K remains on the **visible** band (existing `KEYBOARD_SHORTCUTS.md`) — but the honesty line must stay visible while filters are active so shortcuts cannot silently skip career-relevant rows without the architect knowing.
3. If a hidden finding is Decision-grade (not checklist), the honesty line must say that **decision-grade** rows are hidden (stronger than “generic”).
4. Print/export is DA-11; this prompt is the **desk**.

## Why

Density tuning is a professional control. Unlabeled hiding is how a principal misses a finding and the tool takes the blame. Casual tools hide “noise.” Livelihood tools count what they hid.

## Context

- `use-review-findings-visibility-state.ts`
- `use-governance-findings-hide-generic-state.ts`
- `useFindingCardShortcuts.ts` / `KEYBOARD_SHORTCUTS.md` (“visible band in Working mode”)
- `FindingInsightDensityBand.tsx` (FD-02 — no native `title`)
- ADR 0070 checklist vs Decision-grade

## What to build

1. Copy + counter derived from the same visibility reducer the shortcuts use.
2. Show-all control (`Button` outline, `CTA_WIDTH.content`).
3. Vitest: 10 visible / 3 hidden → line present; Show all → hidden 0; Decision-grade hidden uses the stronger sentence.
4. Do not store “I dismissed the honesty line” in localStorage.

## Acceptance criteria

- Working with hide-generic on and at least one hidden row always shows the count.
- Guided may use the same line (preferred) or inherit Working-only if eval chrome is documented.

## Constraints

- No hover-only reveal (TB-1666).
- Do not add engines to “unhide” density.
