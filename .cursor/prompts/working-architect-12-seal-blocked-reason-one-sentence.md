# WA-12 — Seal blocked-reason is one sentence on UI, API, and CLI

**Do not fork LD-04.** `AuthorityCommitSkippedMustGate` and the UI scorecard already block skipped MUST. This file is **copy/contract consistency**: Problem Details, CLI stderr, and the Finalize readiness line must use the same sentence-case reason.

## Goal

A review with N skipped MUST questions cannot be sealed from UI, API, or CLI, and the user-visible reason is the same sentence (“N required questions are unanswered”), not a raw exception or a second scoring model. SHOULD skips stay advisory. Missing trail on in-flight drafts that never produced one does not invent a MUST block.

## Why

Visibility without one voice is a casual checklist. LD-04 closed the gate. CLI/API can still refuse with a different string, so runbooks and the desk disagree. Livelihoods depend on a stamp the architect can explain.

## Context

- `ArchLucid.Application` `AuthorityCommitSkippedMustGate`
- `archlucid-ui/src/lib/review-quality/finalize-quality-scorecard.ts` / `resolve-client-commit-blocked-reason.ts`
- CLI commit/finalize commands (grep ArchLucid.Cli)
- API Problem Details for commit
- LD-04 acceptance — do not re-zero the helper

## What to build

1. Extract or reuse one canonical blocked-reason string (server is source of truth; client displays it).
2. CLI: print that sentence; non-zero exit; no stack as the only message.
3. Contract test: skipped-MUST trail cannot commit; SHOULD-only does not block; three surfaces contain the same phrase.
4. `finalizeAssumptionGateApplies` false paths: do not newly skip this gate; name current behavior in a test if scorecard-off is intentional.

## Acceptance criteria

- UI, API body, and CLI all refuse skipped MUST with the same sentence-case reason.
- SHOULD skips do not block.
- Empty diff on `DeterministicInsightDensityGate.cs`.

## Constraints

- Do not claim Hard infeasible from skipped questions.
- Do not collapse review tabs.
- One class per file; no `ConfigureAwait(false)` in tests.
