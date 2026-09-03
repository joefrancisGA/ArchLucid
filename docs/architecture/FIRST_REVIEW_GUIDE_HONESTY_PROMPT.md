> **Scope:** Copy-paste Composer / Cloud Agent prompt. Internal engineering only — not buyer-facing runtime docs.
> **Surface:** Authenticated first review guide (`/architecture/first-review-guide`).
> **Status:** ready to run (one prompt per chat). Do **not** treat this file as implemented product work.

# First review guide — honesty, copy, and spacing

Owner review of the completed-looking first review guide (Customer Intake Demo workspace, 2026-09-03) found four product defects and one layout problem. This prompt remediates them. It does **not** add features.

**Hard product rule:** a seeded sample architecture package is **never** the tenant's first finalized review. The page currently treats the created Copilot RAG sample as a completed first review. That is a trust break.

## Sequencing

One chat. Feature branch per prompt. Suggested Cloud Agent shape: `cursor/first-review-guide-honesty-<suffix>`. Name the branch in any commit/push request.

---

# FRG-HONESTY — Do not treat samples as the first finalized review; collapse completed chrome

**Depends on:** none
**Branch suggestion:** `cursor/first-review-guide-honesty-<suffix>`

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH (not master). Goal: fix the first review guide so it never treats a sample as the tenant's first finalized review, drop two completed-state chrome blocks, replace the progress heading stack with one sentence, stop showing internal sample jargon, and tighten spacing. Do not add features. Do not redesign the in-progress walkthrough.

Model: composer-2.5 (Composer 2.5 slow). Do not use a fast-tier or non-allowlisted model.

Why: On `/architecture/first-review-guide` in a Customer Intake Demo workspace that only has seeded samples, the page currently renders a completed first-review state. That is false. Completing this guide must mean the tenant finalized their own architecture review, not that a demo seed exists.

Owner-reported defects (fix all of them in this chat):

1. Eliminate the sentence that starts "This guide is onboarding…".
2. Eliminate the completed-state hero that says "7 of 7 steps complete" / "Every step in your first review is complete".
3. Spacing on the page is awkward — too much vertical air and stacked restatements of the same status.
4. The completed provenance line shows "Enterprise Copilot RAG platform — born-governed created architecture package (synthetic guided-intake sample)." Operators do not know what a born-governed architecture package is. Do not put that jargon on this page.
5. Instead of the heading "Your first review" plus the two lines under it ("Complete" and "Your first architecture review is finalized."), show one sentence: "Your first review is finalized".
6. CRITICAL: the page is treating one of the samples as the first finalized review. That is forbidden.

Observed completed-state chrome today (verify on HEAD; names may have drifted slightly):

- StatusTag "First review completed"
- Detail "Your finalized architecture review is ready to inspect and share."
- Provenance using the created-sample RunRecord.Description: "Enterprise Copilot RAG platform — born-governed created architecture package (synthetic guided-intake sample)." — finalized Apr 2, 2026
- Primary "Open sealed review record" pointing at that sample
- Secondary "Start another review"
- Section heading FIRST_REVIEW_GUIDE_PROGRESS_SECTION_TITLE = "Your first review"
- Progress summaryLabel "Complete" and detailLabel "Your first architecture review is finalized."
- Walkthrough completed hero: formatStepProgressCompleteLabel → "7 of 7 steps complete" plus "Every step in your first review is complete" plus "View step ledger"
- Claim-discipline strip: FIRST_REVIEW_GUIDE_CLAIM_DISCIPLINE = "This guide is onboarding checklist orientation — completing steps here does not create a full audit export. …"
- Right rail "What you have" linking into the sample as if it were the user's sealed record

Root cause (verify, then fix — do not paper over with copy only):

- `buildCorePilotCommitContextFromRunItems` in `archlucid-ui/src/lib/core-pilot-commit-context.ts` picks the first run with `hasGoldenManifest === true` as `firstCommittedRunId`. Seeded samples (reviewed showcase AND created Copilot RAG package) have golden manifests.
- `hasSealedReviewRecord` in `archlucid-ui/src/lib/first-review-guide-state.ts` is `commitContext.firstCommittedRunId !== null`.
- Created sample seed copy lives in `ArchLucid.Application/Bootstrap/CreatedSampleWorkspaceSeed.SeedPayload.cs` (`Description = "Enterprise Copilot RAG platform — born-governed created architecture package (synthetic guided-intake sample)."`). The created sample uses a tenant-scoped authority run GUID (`DemoCreatedSampleWorkspaceIds.AuthorityRunId`), so slug-only checks against `SHOWCASE_CREATED_STATIC_DEMO_RUN_ID` (`northwind-copilot-rag-platform`) are not sufficient.
- Run summaries already expose `isSample` and `isDemoWelcomeRun` (`RunSummaryResponse`). Reviews hub already treats a row as sample when `run.isSample === true` OR showcase run id OR `run.isDemoWelcomeRun === true` (`toReviewsHubReviewRowDisplay`).

Hard invariant — do not violate:

A sample, showcase, demo-welcome, public-showcase, or seeded created-package run MUST NOT:

- set first-review-guide readiness `kind: "completed"`
- set progress `phase: "complete"`
- populate `sealedReviewRecord` used by this page
- drive header actions "Open sealed review record" / "Start another review"
- fill the right-rail "What you have" links as if they were the tenant's sealed record
- hide the sample-as-sample rail in favor of a fake completed first review

When the workspace has only samples (or samples plus in-progress non-sample work):

- Treat the guide as not-started or in-progress from REAL tenant reviews only.
- Primary CTA remains "Start first review" (or "Continue review" / "Seal review" for a real in-progress run).
- Secondary CTA may remain "Explore sample review".
- Keep sample clearly labeled as sample (`DemoDataBadge`, "Sample architecture package", "Open sample review").
- Do not show "First review completed".
- Do not show created-sample description / "born-governed" provenance.

When the tenant has actually finalized a non-sample review:

- Then and only then show completed state.
- Progress block is exactly one sentence, sentence case: "Your first review is finalized"
- Do not keep the h2 "Your first review".
- Do not keep the "Complete" summary line.
- Do not keep "Your first architecture review is finalized." as a second line.
- Do not render the "7 of 7 steps complete" hero card, the "Every step in your first review is complete" line, or any equivalent restatement.
- "View step ledger" may remain as a quiet collapsed disclosure with no 7-of-7 headline, or be dropped if it only exists to wrap that hero. Do not invent a new progress meter in the completed state.
- Provenance title must be a buyer-facing review title (`buyerFacingReviewTitleFromSummary` or equivalent), never raw seed Description, never "born-governed", never "synthetic guided-intake sample", never "created architecture package" as a buyer phrase on this page.
- Right rail "What you have" may link to THAT real sealed record. Keep a separate sample card so the sample stays a sample.

Do not "fix" this by renaming the sample into a first review. Do not delete demo seeds. Do not change CreatedSampleWorkspaceSeed payload unless a UI-only title mapping is insufficient AND you still must not present that seed as the first finalized review.

Implementation guidance:

A. Completion predicate (required)

- First-review-guide completed state must ignore sample runs.
- Prefer filtering inside `buildCorePilotCommitContextFromRunItems` (and any first-review-guide wrapper) so `firstCommittedRunId` / `sealedReviewRecord` used by this page are non-sample only.
- A run is a sample if ANY of these are true (reuse existing helpers; do not invent a parallel taxonomy):
  - `run.isSample === true`
  - `run.isDemoWelcomeRun === true`
  - `isShowcaseStaticDemoRunId(run.runId)`
  - `isShowcaseCreatedStaticDemoRunId(run.runId)`
  - `SHOWCASE_DEMO_RUN_SLUG_KEYS` / demo aliases
  - reviews-hub `isSampleReview` equivalent
- Created-sample authority GUIDs will not match the public slug. `isSample === true` on the seeded row is the primary signal; keep the id helpers as belt-and-suspenders.
- If you change shared `CorePilotCommitContext` globally, that is acceptable when home / core-pilot / recommended-next already should not treat samples as the tenant's first commit. Do not regress those surfaces into claiming sample completion either. Add tests for both "samples only" and "real sealed review plus samples" (samples remain visible as samples; the real review is the first finalized review).
- There is already a test that trial-anchored commit without a sealed run is not complete (`first-review-guide-state.test.ts`). Add the sample analogue: sample-only commit context → ready-to-start (or in-progress if a real latestRunId exists), not completed.
- `PUBLIC_DEMO_CORE_PILOT_COMMIT_CONTEXT` is public demo mode. Do not use that canned completed context for the authenticated Customer Intake Demo / seeded tenant workspace. If public demo still needs a tour, it must stay labeled sample and must not be the code path for this page in a seeded tenant.

B. Remove the onboarding claim sentence (required)

- Current string: `FIRST_REVIEW_GUIDE_CLAIM_DISCIPLINE` in `archlucid-ui/src/lib/first-review-guide-evidence-copy.ts`.
- `FirstReviewGuidePageClient` passes it as `claim={FIRST_REVIEW_GUIDE_CLAIM_DISCIPLINE}` into `EvidenceOrientationClaimAndSourcesStrip`.
- Stop rendering that sentence on this page. Keep the "Where to go next" / sources index if it still earns its keep.
- Preferred: omit `claim` for slug `first-review-guide` and add `first-review-guide` to `CLAIM_DISCIPLINE_BAND_OMIT_SLUGS` in `archlucid-ui/src/lib/claim-discipline-policy.ts` if that is how other operator hubs suppress the band. Follow the existing omit pattern; do not leave a drift-guard failure.
- Update tests that assert the claim text is visible. Do not keep the constant only to satisfy a leftover assertion.

C. Collapse completed progress copy (required)

- `FIRST_REVIEW_GUIDE_PROGRESS_SECTION_TITLE` is "Your first review" in `archlucid-ui/src/lib/buyer-copy/onboarding.ts`.
- `resolveFirstReviewGuideProgress` sets summaryLabel "Complete" and detailLabel "Your first architecture review is finalized." when sealed.
- `FirstReviewGuidePageClient` renders h2 title + `FirstReviewGuideProgressSummary` (those two lines) + `FirstReviewGuideWalkthrough` completed hero.
- In completed state, replace that whole stack with the single sentence: "Your first review is finalized"
- Sentence case. No extra heading, no StatusTag restatement in that block, no "Complete" line.
- Keep the page header ("First review guide" + existing subtitle) unchanged unless a test forces a conflict — do not retitle the page.

D. Delete the 7-of-7 completed hero (required)

- `FirstReviewGuideWalkthrough` when `progressPhase === "complete"` renders `data-testid="first-review-guide-walkthrough-completed-summary"` with `completionLabel` ("7 of 7 steps complete") and "Every step in your first review is complete."
- Remove that hero. Do not replace it with another large status card.
- In-progress / not-started walkthrough (the numbered step cards) stays.

E. Spacing (required)

The page feels sparse because completed status is restated four times and stacks use marketing-scale gaps.

- `FirstReviewGuidePageClient` uses `grid gap-8` for the main/aside split. Operator standard is compact: `OPERATOR_LAYOUT.sectionStack` is `space-y-4`; prefer `gap-4` (or the existing layout token), not `gap-8`. Do not introduce `space-y-8` / `py-8`.
- Nested `OPERATOR_LAYOUT.sectionStack` on `OperatorPageContainer`, primary content, first viewport, AND the left column compounds vertical gap. Flatten so one stack owns vertical rhythm. Do not wrap every inner block in another `space-y-4`.
- After removing the claim band and 7-of-7 hero, do not add spacer divs to "fill" the page.
- Follow `.cursor/rules/UI-Enterprise-Design-Standard.mdc`: `space-y-4`, `p-4`, `gap-2` on operator views; sentence case; no decorative pastel; `StatusTag` for status.

F. Jargon / provenance (required)

- First review guide buyer-visible copy must not contain: "born-governed", "born governed", "synthetic guided-intake sample", or "created architecture package" as the thing the user supposedly just finished.
- If a real sealed review is shown, use `buyerFacingReviewTitleFromSummary` (or the same title the reviews hub shows), not `RunRecord.Description` dumped raw.
- Add a banned-copy or unit assertion covering first-review-guide rendered completed provenance / copy constants so "born-governed" cannot return on this page. Reuse `first-architecture-review-help-banned-copy.ts` style if that is the local pattern; do not create a second taxonomy if one already covers this surface.

G. Tests (required)

Update / add:

- `archlucid-ui/src/lib/first-review-guide-state.test.ts`
  - sample-only context (showcase run id AND created-sample shaped summary with `isSample: true` / created-sample description) is NOT completed
  - real `firstCommittedRunId` that is not a sample IS completed
  - mixed: real sealed review + sample → completed points at the real run, not the sample
- `archlucid-ui/src/lib/core-pilot-commit-context` tests if you change the shared builder — sample golden-manifest rows do not become `firstCommittedRunId` for this predicate
- `FirstReviewGuidePageClient.test.tsx` / `FirstReviewGuideWalkthrough` tests:
  - claim sentence gone
  - completed stack is the one sentence "Your first review is finalized"
  - "7 of 7 steps complete" not in the document
  - "Your first review" h2 not used as the completed progress heading
- `archlucid-ui/tests/onboarding.spec.ts` heading assertion if it still looks up `FIRST_REVIEW_GUIDE_PROGRESS_SECTION_TITLE`
- Support panel tests: sample-only does not render "What you have" as completed outcomes for the sample run id
- Claim-discipline omit / evidence-copy tests for slug `first-review-guide`

Do not use `ConfigureAwait(false)` in tests (N/A if this stays UI-only). Prefer concrete types over `var` in any C#. Each new class in its own file. Blank line before `if` / `foreach` unless first line of a method. Always check nulls.

H. Out of scope

- Do not rewrite optional workspace setup.
- Do not change the 7-step in-progress checklist content unless a test breaks because completed-state helpers leaked.
- Do not start SOC 2 / pen-test / GTM cohort work.
- Do not collapse desktop workspace tabs.
- Do not retitle the sample to hide that it is a sample.
- Do not implement backend seed description rewrites as the primary fix.

I. Verify

- Working-tree safety: `.\scripts\agent\check-working-tree-path.ps1` on each tracked path you edit.
- UI: from `archlucid-ui/`, run the focused vitest files you touched. Then `npm run typecheck` if you changed TS types used broadly.
- Do not run a full-solution `dotnet build` unless you changed C#.
- Browser-verify `/architecture/first-review-guide` in a seeded demo workspace with samples only (must look unstarted / ready-to-start, sample clearly a sample) AND describe the completed layout when a non-sample sealed review exists (single "Your first review is finalized" line, no 7-of-7 hero, no onboarding claim sentence, no born-governed provenance).
- Stage only files this prompt changes. No `git add -A`.

Acceptance:

- Sample-only workspace: page does not say first review completed / finalized; does not offer "Open sealed review record" for a sample; sample stays in the sample rail.
- Real first finalize: page says "Your first review is finalized" once in the former progress block; no "7 of 7"; no "This guide is onboarding…"; provenance is a human review title.
- Spacing is compact operator (`space-y-4` / `gap-4`), not stacked heroes.
```
