# UU-15 — What is missing before analysis

**Model:** GPT-5.6 Luna. Paste this file as the whole task. Do not implement UU-16 in this session.

**Repo:** `c:\ArchLucid`

**Wave:** Understand and use, wave B (**UU-15**). **Depends on:** the architecture-draft start checklist.

## Goal

Before analysis starts, the draft screen lists missing evidence, incomplete scope, and unresolved inputs that the readiness model already knows.

## Why

`resolveArchitectureDraftStartReviewSteps` has three steps: name and scope, quality readiness, and start. The missing inputs behind those steps are easy to miss until Start review fails or comes back thin.

## Read first

- `archlucid-ui/src/lib/architecture-draft-start-review-checklist.ts`
- `archlucid-ui/src/lib/architecture-draft-start-review-checklist.test.ts`
- `archlucid-ui/src/lib/architecture/architecture-draft-readiness.ts`
- The draft page that renders the checklist. Search for `ARCHITECTURE_DRAFT_START_REVIEW_CHECKLIST_TITLE`.

## What to build

1. Branch `uu/15-review-readiness` from current `master`.
2. Under the existing three-step checklist, add a list titled "Before analysis".
3. Fill the list from readiness data the draft page already has. Use these three groups, and omit a group that has no gap:
   - Scope: the existing incomplete name or scope gap.
   - Evidence: a missing brief, diagram, or other input the readiness model already flags.
   - Unresolved inputs: an open clarification or required field the page already knows is empty.
4. Each row is one sentence naming the gap. Do not add a new API to discover gaps.
5. Do not change the rule that enables or disables Start review. This list explains the gaps. It does not create a second gate.
6. When nothing is missing, the list says "Required inputs for analysis are present."

## Acceptance criteria

- A draft with a missing scope field shows a Scope row and still uses the existing start button rule.
- A draft with no gaps shows the present sentence.
- The three existing checklist step labels stay.

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2.
- Sentence case. Do not call the review a run.
- **Do not commit.**

## Verification

```powershell
cd archlucid-ui
npx vitest run src/lib/architecture-draft-start-review-checklist.test.ts
```

Add a test for the before-analysis list. Run only the tests you add or change.

## Done when

Tests pass. Tell the owner to open a draft that is missing scope and read "Before analysis" before pressing Start review. Wait for that look before any commit.
