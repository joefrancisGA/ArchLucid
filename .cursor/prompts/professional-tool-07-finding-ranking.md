# PT-07 — Professional finding ranking (do not change typed-engine-protected)

## Goal

Working-mode finding lists default to a ranking professionals can use: insight-density score visible, sortable, filterable, with honest “advisory — not gated” labeling. Do **not** demote typed-engine findings in `DeterministicInsightDensityGate`.

## Why

If livelihoods depend on ArchLucid, the finding queue *is* the product. Assessment still ranks decision-changing insight density as the largest weighted gap. `DeterministicInsightDensityGate` computes a score then promotes typed engines with `typed-engine-protected` (`docs/quality/INSIGHT_DENSITY_MISS_CLAUSE.md`). A filter cannot raise density — but a professional must still **see** generic vs decision-grade rows instead of drowning in unranked output.

## Context

- `ArchLucid.Core/Findings/DeterministicInsightDensityGate.cs` — **do not change** `typed-engine-protected`
- `archlucid-ui/src/lib/findings/findings-snapshot-insight-density.ts`
- `archlucid-ui/src/components/usability/InsightDensityCurationBanner.tsx`
- Governance findings list / review findings tab
- Owner decision: do not apply `DemotionThreshold` to typed engines; do not add a 40th coverage engine from this prompt

## What to build

1. Surface `insightDensityScore` (or equivalent) on finding rows in Working mode: compact numeric or band (e.g. decision-grade / review / generic) with a one-line honesty note that **typed-engine scores are advisory and do not hide findings**.
2. Default Working-mode sort: density descending, then severity. Guided mode may keep the current default.
3. Filter: “Hide generic / low-density” as an explicit control, **off** until the user turns it on. Never silently drop findings.
4. Keep `InsightDensityCurationBanner` honest: demoted-to-checklist counts vs retained; do not imply the gate filtered typed engines.
5. Exhaustive UI mapping tests; no C# gate change. If the API already returns the score, do not add engines.

## Acceptance criteria

- Working-mode findings table/cards show a density signal and can sort by it.
- A low-density typed-engine finding still appears unless the user opted into hide-generic.
- Copy never claims engines were demoted when `typed-engine-protected` kept them.
- `DeterministicInsightDensityGate.cs` diff is empty.

## Constraints

- **Forbidden:** removing `typed-engine-protected`, applying `DemotionThreshold` to typed engines, adding engines, checking in fake frontier transcripts.
- Do not invent a second scoring scale; reuse the 0–100 density score already computed.
