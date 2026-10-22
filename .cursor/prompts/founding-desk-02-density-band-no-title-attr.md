# FD-02 — Density band honesty is press/keyboard visible, not a `title` attribute

**Do not fork CD-12** for list-row honesty text. `FindingInsightDensityBand` already shows `INSIGHT_DENSITY_TYPED_ENGINE_HONESTY_LINE` in Working and puts it in `aria-label`. This file is the leftover: `StatusTag` still gets `title={honesty line}`. Native `title` is banned help (TB-2147 / `UI_DESIGN_SYSTEM.md`).

## Goal

Remove the `title` attribute from the density band chip. Honesty remains visible (adjacent microcopy already present) and in the accessible name. Do not change `typed-engine-protected`. Hide-generic stays opt-in.

## Why

If livelihoods depend on ArchLucid, “Decision-grade” is a legal-sounding word. A mouse-only `title` is not a trail. Keyboard and touch never see it. The design system already forbids this pattern.

## Context

- `archlucid-ui/src/components/findings/FindingInsightDensityBand.tsx` — `title={showHonestyLine ? INSIGHT_DENSITY_TYPED_ENGINE_HONESTY_LINE : undefined}`
- `archlucid-ui/src/lib/findings/insight-density-band.ts`
- `docs/library/UI_DESIGN_SYSTEM.md` § Banned — `title` attribute
- `eslint-rules/title-attribute-legacy-surfaces.mjs` — do not add a new baseline; remove the attribute
- CD-12 list honesty — keep adjacent sentence
- FD-13 owns Ready-kind mapping — this file is `title` only

## What to build

1. Delete `title` on the density `StatusTag`. Keep adjacent honesty `<p>` in Working and `aria-label` that includes the honesty constant.
2. If `StatusTag` requires a title prop, stop passing it here — do not invent a hover-only tooltip for the gate.
3. Vitest: render has honesty text in the document for Working; `title` attribute absent on the tag. Gate `.cs` empty diff.

## Acceptance criteria

- Keyboard-only Working user hears/sees the gate without hovering.
- Screenshot of the chip still has the honesty sentence adjacent (CD-12).
- Guided may omit the sentence; must not use `title` as the substitute.

## Constraints

- **Forbidden:** applying `DemotionThreshold` to typed engines.
- Do not collapse review tabs.
- Do not use `FieldHelpTooltip` as a hide for the gate.
