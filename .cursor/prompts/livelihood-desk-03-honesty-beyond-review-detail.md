# LD-03 — Finding honesty beyond review-detail (queues and packets)

**Do not fork LI-01 or WD-03.** Review-detail already names Unknown blockers, hoists quiet-engine copy, and shows a Working density band. This file is **the other desks that still look all-clear**.

## Goal

Governance findings queue, finding inspect, and the exported sponsor/package packet cannot look cleaner or more certain than the evidence. Quiet actor-dependent engines must not read as “no issues found” on those surfaces. Density honesty (typed-engine scores are advisory and do not hide findings) travels with the finding, not only the review-detail table. Hide-generic stays **opt-in**. Do **not** change `typed-engine-protected`.

## Why

If livelihoods depend on ArchLucid, triage **is** the product on every surface the architect shows a sponsor. LI-01 closed review-detail. The governance queue, inspect drawer, and exported packet can still present an empty or generic-looking list without saying engines did not run. A professional who pastes a “clean” PDF into a steering deck can lose the argument later.

## Context

- `ArchLucid.Core/Findings/DeterministicInsightDensityGate.cs` — **diff must stay empty**
- `archlucid-ui/src/components/findings/ActorDependentFindingsQuietEnginesHint.tsx` — **reuse**, do not fork copy
- `archlucid-ui/src/app/(operator)/governance/findings/GovernanceFindingsQueueClient.tsx`
- Finding inspect: grep `FindingInspect` under `archlucid-ui/src`
- Sponsor/package export serializers that list findings
- `docs/quality/INSIGHT_DENSITY_MISS_CLAUSE.md`
- `InsightDensityCurationBanner` — do not imply typed engines were demoted

## What to build

1. When analysis is complete and actor count is 0, Working **governance queue** headline/toolbar uses the same quiet-engine hint as review-detail (hoist, not bury). Copy: engines did not run, not “clean.”
2. Finding inspect: if the parent package has quiet engines or Unknown intake still on the trail, inspect does not present the finding in isolation as if coverage was complete.
3. Package/sponsor export: when quiet engines or skipped MUST exist, the packet includes the existing honesty line (reuse trail/quiet-engine copy). Do not invent a second density scale.
4. Hide-generic remains opt-in on the queue. Default sort stays density then severity where a table already sorts.
5. Vitest: queue with zero actors cannot read as all-clear; export fixture with quiet engines includes honesty copy; `DeterministicInsightDensityGate.cs` empty diff.

## Acceptance criteria

- A Working governance queue with zero actors cannot be screenshot as an all-clear.
- Inspect and export do not strip the quiet-engine / Unknown honesty that review-detail already shows.
- Generic typed-engine rows remain unless hide-generic is on.
- `DeterministicInsightDensityGate.cs` is untouched.

## Constraints

- **Forbidden:** applying `DemotionThreshold` to typed engines; adding a 40th coverage engine; fake frontier transcripts.
- Do not invent a second density scale.
- Do not collapse review tabs to “simplify” triage.
