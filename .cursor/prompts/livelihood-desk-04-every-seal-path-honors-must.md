# LD-04 — Every seal path honors skipped MUST questions

**Do not fork LI-04 or PT-17.** The UI findings-derived scorecard already takes `skippedMustCount` from the transparency trail and disables Finalize (TB-2005). This file closes **other mint paths**.

## Goal

Every path that can mint a sealed review record — UI Finalize, keyboard Finalize if added, API commit, CLI — uses the same skipped-MUST gate as the UI scorecard. SHOULD skips stay advisory. Missing trail on in-flight drafts that never produced one does not invent a MUST block. Do not change `typed-engine-protected`.

## Why

Visibility without a gate is a casual checklist. LI-04 closed the zeroed UI helper. A livelihood tool cannot let a fat-fingered CLI or a second client seal while required questions are unanswered. If the API still accepts commit when the trail has skipped MUST, the UI disable is theater.

## Context

- `archlucid-ui/src/lib/review-quality/finalize-quality-scorecard.ts`
- `archlucid-ui/src/lib/review-quality/finalize-quality-scorecard-from-findings.ts` — already wired in LI-04; do not re-zero
- `archlucid-ui/src/lib/review-quality/resolve-client-commit-blocked-reason.ts`
- `archlucid-ui/src/lib/review-quality/count-skipped-must-questions.ts`
- Grep commit/finalize/seal in `ArchLucid.Api` / `ArchLucid.Application` / `ArchLucid.Cli`
- Server blocked-reason DTOs — keep client and server consistent
- LD-03 is packet honesty; this prompt is the **gate**

## What to build

1. Inventory every server/CLI/UI path that creates a sealed review record. Each must apply the same `countSkippedMustQuestions` rule (or the existing server equivalent).
2. If the API already blocks, add/keep a contract test so a skipped-MUST trail cannot commit. If it does not block, add the block next to the existing quality scorecard — do not invent a second scoring model.
3. CLI: refuse with the same sentence-case reason (“N required questions are unanswered”), not a raw exception.
4. SHOULD-only skips must not add a blocking reason.
5. `finalizeAssumptionGateApplies` false paths: do not newly skip this gate; if that flag means “scorecard off,” keep current behavior and name it in a test.
6. Vitest + scoped C# tests. Empty diff on `DeterministicInsightDensityGate.cs`.

## Acceptance criteria

- A review with two skipped MUST questions cannot be sealed from UI, API, or CLI.
- SHOULD skips do not block.
- Missing trail on in-flight drafts that never produced one does not invent a MUST block.
- Copy stays sentence case — no “MUST key” in buyer chrome.

## Constraints

- **Forbidden:** changing `typed-engine-protected` or adding engines.
- Do not claim Hard infeasible from skipped questions.
- Do not collapse review tabs.
- Tenant isolation on any new read of the trail.
