# PT-17 — Skipped MUST questions block finalize

## Goal

When a `TransparencyTrail` exists and contains skipped **MUST** questions, finalize is blocked with the same client scorecard path used for unverified assumptions. The architect must answer, record an explicit caveat, or stay blocked. Visibility-only (PT-08) is not enough.

## Why

ADR 0050: skipped MUST/SHOULD are part of the mandatory trail; the liability stance fails if the human can seal without seeing skipped MUSTs. `evaluateFinalizeQualityScorecard` already blocks blocking findings, existential assumptions, uncovered mandatory requirements, open cannot-determine, low extraction confidence, and unresolved high-severity dispositions (`finalize-quality-scorecard.ts`). Skipped MUST rows from the trail are **not** in that scorecard. PT-08 puts the trail on Overview; this prompt **wires the gate**.

## Context

- `archlucid-ui/src/lib/review-quality/finalize-quality-scorecard.ts`
- `archlucid-ui/src/lib/review-quality/resolve-client-commit-blocked-reason.ts`
- `archlucid-ui/src/hooks/use-assumption-aware-commit-blocked-reason.ts`
- `TransparencyTrail` / `SkippedQuestionTrailEntry` (MUST vs SHOULD)
- `RunDetailFeasibilityVerdictSection` / `TransparencyTrailPanel`
- Server commit blocked reason — if the API already blocks, keep it; client must stay consistent
- PT-08: if trail is not on Overview yet, still block from trail on the payload

## What to build

1. Extend scorecard input with `skippedMustCount` (or equivalent). Count only MUST skips; SHOULD stays advisory.
2. Blocking copy: sentence case, product language (“N required questions are unanswered”). Do not say “MUST key” in buyer chrome.
3. Optional: acknowledge-caveat for a skipped MUST **only** if product already has assumption ack (TB-2314) and you can reuse that store with a distinct id prefix — otherwise block until answered. Do not invent a second ack database if you can extend the existing one.
4. `finalizeAssumptionGateApplies` false paths: do not newly skip this gate; if that flag means “scorecard off,” keep current behavior and document it in a test name.
5. Vitest: zero MUST skips → no new reason; ≥1 MUST skip → not ready; SHOULD-only skips → ready unless other reasons fire. `DeterministicInsightDensityGate.cs` diff empty.

## Acceptance criteria

- Finalize CTA stays disabled (TB-2005) while skipped MUSTs remain, with inline scorecard reason — not a toast-only block.
- SHOULD skips do not block.
- Missing trail on a **completed** review remains the PT-08 defect callout; do not block finalize on a missing trail for in-flight drafts that never produced one yet.
- No density-gate demotion changes.

## Constraints

- **Forbidden:** changing `typed-engine-protected` or adding engines.
- Do not claim Hard infeasible from skipped questions.
- Tenant isolation: trail text stays in-tenant.
