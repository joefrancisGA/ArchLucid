# LI-04 — Skipped MUST questions actually block the Finalize CTA

**Do not fork PT-17.** `evaluateFinalizeQualityScorecard` already blocks when `skippedMustCount > 0`, and `resolveClientAwareCommitBlockedReason` already calls `countSkippedMustQuestions`. This file closes the **zeroed path**.

## Goal

Every client path that builds a finalize scorecard from findings passes the real skipped-MUST count from the transparency trail. The Finalize CTA stays disabled (TB-2005) with the inline scorecard reason. SHOULD skips stay advisory. Do not change `typed-engine-protected`.

## Why

Visibility without a gate is a casual checklist. `deriveFinalizeQualityScorecardInput` in `finalize-quality-scorecard-from-findings.ts` still returns `skippedMustCount: 0`. Any finalize UI that uses that helper (instead of `resolveClientAwareCommitBlockedReason`) can seal while required questions are unanswered. A livelihood tool cannot let a fat-fingered Finalize skip the trail.

## Context

- `archlucid-ui/src/lib/review-quality/finalize-quality-scorecard.ts`
- `archlucid-ui/src/lib/review-quality/finalize-quality-scorecard-from-findings.ts` — **hardcoded `skippedMustCount: 0`**
- `archlucid-ui/src/lib/review-quality/resolve-client-commit-blocked-reason.ts`
- `archlucid-ui/src/lib/review-quality/count-skipped-must-questions.ts`
- Grep `deriveFinalizeQualityScorecardInput(` and Finalize CTA disable logic
- Server commit blocked reason — if the API already blocks, keep it; client must stay consistent
- LI-03: trail visibility. This prompt **wires the remaining scorecard input**.

## What to build

1. Extend `deriveFinalizeQualityScorecardInput` (or its options) so callers can pass `TransparencyTrail`. Set `skippedMustCount` via `countSkippedMustQuestions`. Default remains 0 only when no trail is supplied.
2. Update every caller that has a trail on the payload so it no longer drops MUST skips.
3. Confirm the Finalize primary CTA uses the scorecard `ready` flag (disabled until valid) and shows `blockingReasons` inline — not a toast-only block.
4. SHOULD-only skips must not add a blocking reason.
5. `finalizeAssumptionGateApplies` false paths: do not newly skip this gate; if that flag means “scorecard off,” keep current behavior and name it in a test.
6. Vitest: derive-with-trail MUST skips → count > 0; SHOULD-only → 0; resolve-client path unchanged; CTA tests if a component already asserts disabled. Empty diff on `DeterministicInsightDensityGate.cs`.

## Acceptance criteria

- A review with two skipped MUST questions cannot finalize from the findings-derived scorecard path.
- SHOULD skips do not block.
- Missing trail on in-flight drafts that never produced one does not invent a MUST block.
- Copy stays sentence case (“N required questions are unanswered”) — no “MUST key” in buyer chrome.

## Constraints

- **Forbidden:** changing `typed-engine-protected` or adding engines.
- Do not claim Hard infeasible from skipped questions.
- Do not collapse review tabs.
