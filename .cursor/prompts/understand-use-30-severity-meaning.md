# UU-30 — What this severity asks for

**Model:** GPT-5.6 Luna. Paste this file as the whole task.

**Repo:** `c:\ArchLucid`

**Wave:** Understand and use, wave C (**UU-30**). **Depends on:** `SeverityTag` and the findings queue row.

## Goal

The first severity chip on a finding row says what that severity asks the reader to do.

## Why

Critical, High, Medium, and Low are already on the row. The chip does not say whether the finding blocks finalize or can be recorded as a decision and left for later.

## Read first

- `archlucid-ui/src/components/ui/severity-tag.tsx`
- `archlucid-ui/src/app/(operator)/governance/findings/GovernanceFindingsQueueTableRow.tsx`
- The review findings row if it uses a different component. Search for `SeverityTag` under `architecture/reviews`.
- `docs/library/customer-facing/CONCEPTS_IN_5_MINUTES.md`

## What to build

1. Branch `uu/30-severity-meaning` from current `master`.
2. Add a meaning map for the severities the tag already renders:
   - Critical: "Resolve this before you finalize."
   - High: "Resolve this or record a decision before you finalize."
   - Medium: "Record a decision. It does not block finalize by itself."
   - Low: "Record a decision when you triage the rest."
3. Show the meaning once per findings list, on the first row that uses that severity, as helper text beside the chip. Later rows with the same severity keep the chip only.
4. Do not change severity calculation. Do not add a new severity. Do not turn the meaning into a score.
5. If a product rule already says a high finding blocks finalize, use that rule's words instead of the High sentence above, and say which rule you followed.

## Acceptance criteria

- A list whose first row is Critical shows the Critical sentence once.
- A later Critical row does not repeat the sentence.
- Severity labels on the chips stay Critical, High, Medium, and Low.

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2.
- Sentence case. Do not tint the row.
- **Do not commit.**

## Verification

```powershell
cd archlucid-ui
npx vitest run "src/app/(operator)/governance/findings/GovernanceFindingsQueueClient.test.tsx"
```

Add a row test if that suite does not render severity text. Run only the tests you add or change.

## Done when

Tests pass. Tell the owner to open a findings list with two severities and read the first meaning for each. Wait for that look before any commit.
