# PT-07 — Professional finding ranking on every findings list

## Goal

Working-mode **review-detail** (and any other finding list that is not the governance queue) defaults to a ranking professionals can use: insight-density score visible, sortable, filterable, with honest “advisory — not gated” labeling. The governance queue already sorts by density — reuse that helper; do not fork a second scale. Do **not** demote typed-engine findings in `DeterministicInsightDensityGate`.

## Why

If livelihoods depend on ArchLucid, the finding queue *is* the product. Assessment still ranks decision-changing insight density as a large weighted gap. `DeterministicInsightDensityGate` computes a score then keeps typed engines with `typed-engine-protected` (`docs/quality/INSIGHT_DENSITY_MISS_CLAUSE.md`). The governance findings queue already default-sorts by `sortGovernanceFindingsRowsBySignal` and offers opt-in hide-generic (`GovernanceFindingsQueueClient.tsx`). Review-detail findings and inspect lists still treat density as a disclosure on the finding body (`FindingInsightDensityDisclosure`). A professional must see generic vs decision-grade rows while triaging the package they are about to seal.

## Context

- `ArchLucid.Core/Findings/DeterministicInsightDensityGate.cs` — **do not change** `typed-engine-protected`
- `archlucid-ui/src/lib/governance/governance-findings-density-sort.ts` — reuse
- `archlucid-ui/src/lib/findings/findings-snapshot-insight-density.ts`
- `archlucid-ui/src/components/usability/InsightDensityCurationBanner.tsx`
- `archlucid-ui/src/components/usability/FindingInsightDensityDisclosure.tsx`
- Review findings tab / cards / `EnterpriseTable` under `archlucid-ui/src/app/(operator)/architecture/reviews/[reviewId]/`
- Owner decision: do not apply `DemotionThreshold` to typed engines; do not add a 40th coverage engine from this prompt

## What to build

1. Surface `insightDensityScore` on review-detail finding rows in Working mode: compact numeric or band (decision-grade / review / generic) with a one-line honesty note that **typed-engine scores are advisory and do not hide findings**.
2. Default Working-mode sort on those lists: density descending, then severity (same as `sortGovernanceFindingsRowsBySignal`). Guided may keep the current default.
3. Filter: “Hide generic / low-density” as an explicit control, **off** until the user turns it on. Never silently drop findings. Reuse `INSIGHT_DENSITY_GENERIC_THRESHOLD` / `filterGovernanceFindingsHideGenericRows` or extract a shared non-queue helper if the row type differs.
4. Keep `InsightDensityCurationBanner` honest: demoted-to-checklist counts vs retained; do not imply the gate filtered typed engines.
5. Exhaustive UI mapping tests; no C# gate change. If the API already returns the score, do not add engines.

## Acceptance criteria

- Working-mode review findings table/cards show a density signal and sort by it by default.
- A low-density typed-engine finding still appears unless the user opted into hide-generic.
- Copy never claims engines were demoted when `typed-engine-protected` kept them.
- `DeterministicInsightDensityGate.cs` diff is empty.
- Governance queue behavior is unchanged except for shared-helper extraction.

## Constraints

- **Forbidden:** removing `typed-engine-protected`, applying `DemotionThreshold` to typed engines, adding engines, checking in fake frontier transcripts.
- Do not invent a second scoring scale; reuse the 0–100 density score already computed.
