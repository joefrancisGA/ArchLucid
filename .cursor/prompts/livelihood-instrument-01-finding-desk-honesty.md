# LI-01 — Finding desk honesty (unknowns, quiet engines, density as the job)

**Do not fork WD-03 or PT-07.** Ranking (`sortReviewDetailFindingsBySignal`) and `ActorDependentFindingsQuietEnginesHint` already exist. This file is **honesty on the desk you are about to seal**.

## Goal

The findings list on the package about to be sealed cannot look cleaner or more certain than the evidence. Unknown intake must not read as confirmed architecture. Quiet actor-dependent engines must not read as “no issues found.” Density is a visible Working-mode column (or equivalent band) and the default sort; hide-generic stays **opt-in**. Do **not** change `typed-engine-protected`.

## Why

If livelihoods depend on ArchLucid, triage **is** the product. Typed-engine findings stay on the package even when the density score would demote them (`docs/quality/INSIGHT_DENSITY_MISS_CLAUSE.md`). A professional tool that looks official while omitting coverage is a career event, not a chrome bug.

Current gaps: structured-brief “Unknown — confirm before review” is a **server** start block (`ArchitectureDraftReviewReadinessValidator`) but the draft UI can fail to **name** the blocking fields. The quiet-engine hint mounts **below** the simulator notice, not in the findings toolbar/hero. Density is a sort plus a hide-generic checkbox and a body disclosure — not a first-class desk column.

## Context

- `ArchLucid.Core/Findings/DeterministicInsightDensityGate.cs` — **diff must stay empty**
- `ArchLucid.Application/Drafts/ArchitectureDraftReviewReadinessValidator.cs`
- `ArchLucid.Application/Drafts/UniversalIntakeAnswerProjector.cs`
- `archlucid-ui/src/components/findings/ActorDependentFindingsQuietEnginesHint.tsx`
- `archlucid-ui/src/app/(operator)/architecture/reviews/[reviewId]/_sections/RunDetailFindingsWorkspace.tsx`
- `archlucid-ui/src/lib/findings/review-detail-findings-density-sort.ts`
- `archlucid-ui/src/components/usability/FindingInsightDensityDisclosure.tsx`
- `archlucid-ui/src/components/usability/InsightDensityCurationBanner.tsx`

## What to build

1. **Unknowns:** Start review stays disabled while structured-brief placeholders are unconfirmed. Draft UI names **which fields** are still Unknown. Projector must not promote the sentinel into requirement-like graph nodes. Keep/extend tests on the projector and readiness validator.
2. **Quiet engines:** When analysis is complete and actor count is 0, the findings **headline/toolbar** in Working must not imply “no issues found.” Hoist `ActorDependentFindingsQuietEnginesHint` to that hero. Copy: engines did not run, not “clean.”
3. **Density desk:** Working review-detail rows show a compact band (decision-grade / review / generic) plus the existing honesty line that typed-engine scores are **advisory and do not hide findings**. Default sort remains density then severity. Hide-generic stays off until the user opts in.
4. `InsightDensityCurationBanner` must not imply typed engines were demoted when `typed-engine-protected` kept them.
5. Vitest for named readiness blockers, projector non-promotion, quiet-engine copy placement, Working sort/filter. **Empty diff** on `DeterministicInsightDensityGate.cs`.

## Acceptance criteria

- A draft with only “Unknown — confirm before review” cannot start a review; the form names the placeholders.
- A findings tab with zero actors cannot read as an all-clear.
- Working findings table shows density and sorts by it; generic typed-engine rows remain unless hide-generic is on.
- `DeterministicInsightDensityGate.cs` is untouched.

## Constraints

- **Forbidden:** applying `DemotionThreshold` to typed engines; adding a 40th coverage engine; fake frontier transcripts.
- Do not invent a second density scale.
- Do not collapse review tabs to “simplify” triage.
