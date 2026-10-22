# WD-03 — Finding desk honesty (unknowns, quiet engines, density as the job)

## Goal

The findings list on the package you are about to seal cannot look cleaner or more certain than the evidence. Unknown intake must not read as confirmed architecture. Quiet actor-dependent engines must not read as “no findings.” Density is visible and the default Working sort; hide-generic stays **opt-in**. Do **not** change `typed-engine-protected`.

## Why

If livelihoods depend on ArchLucid, triage **is** the product. The weighted assessment still ranks insight density as the largest engineering gap because the gate computes a score then keeps typed-engine findings (`docs/quality/INSIGHT_DENSITY_MISS_CLAUSE.md`). Ranking already exists on review-detail under architect chrome (`sortReviewDetailFindingsBySignal`). The remaining livelihood bugs are **false confidence**:

- `ArchitectureDraftStructuredBrief.UnknownConfirmBeforeReview` projected as filled constraints (TB-2343 class).
- Actor-dependent engines silent when Actor nodes are missing — looks like a clean review.
- Density as a disclosure on the finding body rather than the desk column.

A professional tool either puts decision-grade work first with honest gaps, or it is a checklist generator that looks official.

## Context

- `ArchLucid.Core/Findings/DeterministicInsightDensityGate.cs` — **diff must stay empty**
- `ArchLucid.Application/Drafts/ArchitectureDraftReviewReadinessValidator.cs` — already blocks unconfirmed structured-brief placeholders; verify UI matches
- `ArchLucid.Application/Drafts/UniversalIntakeAnswerProjector.cs`
- `ArchLucid.Contracts/Drafts/ArchitectureDraftStructuredBrief.cs`
- `archlucid-ui/src/components/findings/ActorDependentFindingsQuietEnginesHint.tsx`
- `archlucid-ui/src/app/(operator)/architecture/reviews/[reviewId]/_sections/RunDetailFindingsWorkspace.tsx`
- `archlucid-ui/src/lib/findings/review-detail-findings-density-sort.ts`
- `archlucid-ui/src/components/usability/FindingInsightDensityDisclosure.tsx`
- `archlucid-ui/src/components/usability/InsightDensityCurationBanner.tsx`
- PT-07: do not re-implement sort; this prompt is **honesty + desk column**

## What to build

1. **Unknowns:** Start review remains disabled while structured-brief placeholders are unconfirmed. Draft UI must show *why* (named fields), not only a generic disabled CTA. Projector must not promote the sentinel into requirement-like graph nodes. Add/keep tests on `UniversalIntakeAnswerProjector` and the readiness validator.
2. **Quiet engines:** When analysis is complete and actor count is 0, the findings workspace headline must not imply “no issues found.” Keep `ActorDependentFindingsQuietEnginesHint`; hoist it to the findings toolbar/hero in Working mode. Copy: engines did not run, not “clean.”
3. **Density desk:** Working review-detail rows show a compact band (decision-grade / review / generic) plus the existing honesty line that typed-engine scores are **advisory and do not hide findings**. Default sort remains density then severity. Hide-generic stays off until the user opts in.
4. `InsightDensityCurationBanner` must not imply typed engines were demoted when `typed-engine-protected` kept them.
5. Vitest for readiness blockers, projector non-promotion, quiet-engine copy, Working sort/filter. **Empty diff** on `DeterministicInsightDensityGate.cs`.

## Acceptance criteria

- A draft with only “Unknown — confirm before review” cannot start a review; the form names the placeholders.
- A sealed-looking findings tab with zero actors cannot read as an all-clear.
- Working findings table shows density and sorts by it; generic typed-engine rows remain unless hide-generic is on.
- `DeterministicInsightDensityGate.cs` is untouched.

## Constraints

- **Forbidden:** applying `DemotionThreshold` to typed engines; adding a 40th coverage engine; fake frontier transcripts.
- Do not invent a second density scale.
- Do not collapse review tabs to “simplify” triage.
