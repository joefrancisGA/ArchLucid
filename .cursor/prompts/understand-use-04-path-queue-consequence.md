# UU-04 — Path queue consequence sentence

**Model:** GPT-5.6 Luna. Paste this file as the whole task. Do not implement UU-05 in this session.

**Repo:** `c:\ArchLucid`

**Wave:** Understand and use (**UU**). **Depends on:** ranked architect path rows already returned by the rank API.

## Goal

A ranked SecureNow path row leads with what the path means. Kind and confidence band follow that sentence.

## Why

`RemediationFactoryRankedPathsTable` leads with rank, kind, band, and score. The consequence already exists as `explanationSummary` and is the last column. People buy the sentence, then the kind.

## Read first

- `docs/library/SECURENOW_ARCHITECT_PLANE.md` (ordinal confidence, no magic score)
- `archlucid-ui/src/app/(operator)/governance/remediation-factory/RemediationFactoryRankedPathsTable.tsx`
- `archlucid-ui/src/lib/security-evidence-path-types.ts` (`SecurityEvidencePathRankSummary.explanationSummary`)
- `archlucid-ui/src/lib/security-evidence-path-presentation.ts`
- `archlucid-ui/src/lib/product-line/securenow-path-inspect-copy.ts`
- `archlucid-ui/src/app/(operator)/governance/findings/GovernanceFindingsQueueClient.securenow.test.tsx` (only to see whether that queue is the same path table)

## What to build

1. Branch `uu/04-path-queue-consequence` from current `master`.
2. In `RemediationFactoryRankedPathsTable`, make the first text the consequence sentence from `explanationSummary`. Kind and band stay on the row after it. Rank stays. The numeric score column stays and does not become the lead, a percent, or a new label such as confidence.
3. When `explanationSummary` is blank, the sentence is "Path recorded. Open inspect for the hops." Do not invent a resource, a threat, or a path.
4. Render `pathKind` with the existing display string. Do not rename path kinds in the API.
5. If the governance findings queue is a different table and does not list these path rows, leave it unchanged and say so in the session note.
6. Do not change rank order, score calculation, or the rank API.

## Acceptance criteria

- A row with `explanationSummary` "A public path can reach this storage account." shows that sentence before the kind.
- A blank summary shows the fallback sentence.
- The band chip still uses `formatSecurityEvidencePathConfidenceBandLabel`.
- No new numeric confidence and no new composite buyer score.

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2.
- No LLM call. No Azure write.
- **Do not commit.**

## Verification

```powershell
cd archlucid-ui
npx vitest run "src/app/(operator)/governance/remediation-factory/RemediationFactoryClient.test.tsx"
```

Add a table test next to the table if the client suite does not render row text. Run only the tests you add or change.

## Done when

Tests pass. Tell the owner to open the remediation factory ranked paths and read the first line of a row before the kind. Wait for that look before any commit.
