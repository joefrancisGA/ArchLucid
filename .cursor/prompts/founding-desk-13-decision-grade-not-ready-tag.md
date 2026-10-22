# FD-13 — Decision-grade is not a Ready status tag

**Do not fork CD-12** for the honesty sentence on the list. **Do not fork FD-02** for the `title` attribute. `FindingInsightDensityBand` maps `decision-grade` → `StatusTag kind="ready"`. Ready is a governance status (Approved / Ready). A density band is not an approval.

## Goal

Working density band uses a **neutral** (or dedicated non-Ready) `StatusTag` kind for Decision-grade. Generic stays needs-attention. The honesty sentence remains. Do not change `typed-engine-protected`. Do not use Ready/Approved chrome for a score band.

## Why

Status tags are semantic (`UI_DESIGN_SYSTEM.md`: Ready · Needs attention · Blocked · Approved). Painting Decision-grade as Ready makes a board screenshot look like the package passed. Density is not disposition. That is false confidence.

## Context

- `archlucid-ui/src/components/findings/FindingInsightDensityBand.tsx` — `densityBandKind`
- `archlucid-ui/src/components/ui/status-tag.tsx`
- `docs/library/UI_DESIGN_SYSTEM.md` status tags
- `docs/quality/INSIGHT_DENSITY_MISS_CLAUSE.md`

## What to build

1. Map decision-grade → `neutral` (or an existing non-ready kind that is not Approved). Do not add a new pastel variant.
2. Accessible name still includes the band label + honesty line (FD-02).
3. Vitest: Decision-grade tag is not `kind="ready"`; honesty line still present in Working. Gate `.cs` empty diff.

## Acceptance criteria

- A Working screenshot of the chip cannot be mistaken for a Ready/Approved disposition.
- Guided may keep a denser chip; still must not use Ready for density.
- List disposition actions unchanged.

## Constraints

- **Forbidden:** demoting typed engines; new coverage engine.
- Do not collapse review tabs.
- Do not invent a fourth density scale.
