# RS-02 — Coverage is a seal-desk fact, not a findings helper

**Do not fork LI-01, LI-03, WD-02, or LD-03.** LD-03 owns queues/inspect/export honesty. Quiet-engine hint, Overview transparency trail, and `FindingInsightDensityBand` already exist. This file is the leftover: **Finalize/Overview still can look cleaner than the evidence**.

## Goal

On Working Overview and next to Finalize, the architect can see in one glance: (1) which required questions are unanswered, (2) which actor-dependent engines did not run, (3) that insight-density bands are advisory and do not hide typed-engine findings. Review-detail finding **rows** in Working show the density band (today it mounts on Quick Decision cards, not the review-detail findings table). Hide-generic stays opt-in. Do **not** change `typed-engine-protected`.

## Why

If livelihoods depend on ArchLucid, triage honesty **is** the product. LI-01 hoisted the quiet hint onto the findings toolbar. LI-03 asked for skipped MUST next to Finalize. Density is still a disclosure on inspect (`FindingInsightDensityDisclosure`) plus a band on Quick Decision cards — `FindingInsightDensityBand` is **not** used under `architecture/reviews/[reviewId]/`. An ARB packet that looks official while engines never ran is a career event.

## Context

- `ArchLucid.Core/Findings/DeterministicInsightDensityGate.cs` — **diff must stay empty**
- `archlucid-ui/src/components/findings/FindingInsightDensityBand.tsx`
- `archlucid-ui/src/components/findings/ActorDependentFindingsQuietEnginesHint.tsx`
- `archlucid-ui/src/components/reviews/RunDetailOverviewTransparencyTrail.tsx`
- Finalize CTA / `review-package` tab
- `archlucid-ui/src/app/(operator)/architecture/reviews/[reviewId]/_sections/RunDetailFindingsWorkspace.tsx`
- LI-04 already wires `skippedMustCount` via `countSkippedMustQuestions` — do not add a second gate; this prompt is **visibility on the seal desk**

## What to build

1. Working review-detail finding rows (the list the architect seals from) render `FindingInsightDensityBand` plus the existing honesty line that typed-engine scores do not hide findings. Reuse the band component; do not invent a second scale.
2. Working Overview + Finalize cluster: a compact **Coverage** strip when analysis is complete: quiet-engine line (reuse hint copy, no wizard CTA — RS-02 owns that link) and skipped-MUST names from the trail when present. Missing trail on a completed review keeps the existing defect callout.
3. `InsightDensityCurationBanner` must not imply typed engines were demoted when `typed-engine-protected` kept them.
4. Guided may keep density as a disclosure. Working must not require opening inspect to see the band.
5. Vitest: Working findings row has the band test id; Finalize/Overview coverage strip shows quiet-engine copy when actor count is 0; empty diff on `DeterministicInsightDensityGate.cs`.

## Acceptance criteria

- Working findings table shows density on the row the architect is about to seal.
- Working Finalize/Overview shows unanswered required questions and “engines did not run” when those facts are true.
- Generic typed-engine rows remain unless hide-generic is on.
- `DeterministicInsightDensityGate.cs` is untouched.

## Constraints

- **Forbidden:** applying `DemotionThreshold` to typed engines; adding coverage engines; fake frontier transcripts.
- Do not invent a second density scale.
- Do not collapse review tabs to “simplify” triage.
- Do not duplicate LI-04’s scorecard disable logic.
