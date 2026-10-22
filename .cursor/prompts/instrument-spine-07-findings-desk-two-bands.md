# IS-07 — Findings desk: decision-grade and checklist are two bands

**Depends on IS-05.** **Do not fork PT-07** (ranking only). **Do not fork CD-12** (honesty line). Working default view is **decision-grade first**; checklist is a first-class second band, not an opt-in “hide generic” that implies the rest is certain.

## Goal

Working review-detail and governance findings queues show two bands: **Decision-grade** (default) and **Checklist coverage**. Density sort stays. Hide-generic as a boolean that secretly drops checklist is replaced or renamed so the architect knows those rows still exist on the package. Guided may keep a single list with the honesty line.

## Why

A professional triage desk is not a filter that makes the work look done. After the gate demotes, the UI must not still present one “Findings” list that reads as decisions.

## Context

- `archlucid-ui/src/app/(operator)/architecture/reviews/[reviewId]/_sections/RunDetailFindingsWorkspace.tsx`
- `archlucid-ui/src/lib/findings/review-detail-findings-density-sort.ts`
- `governance-findings-density-sort.ts` / `GovernanceFindingsQueueClient.tsx`
- `FindingInsightDensityBand`
- `InsightDensityCurationBanner.tsx`
- Keyboard triage host (`FindingKeyboardTriageHost`) — both bands remain keyboard-reachable (IS-10)

## What to build

1. Working findings workspace: band toggle or tabs **Decision-grade** | **Checklist** | **All**. Default Decision-grade. Counts on the control. Empty Decision-grade with non-empty checklist must say checklist remains, not “no findings.”
2. Quiet-engine hint stays on All / Decision-grade when actors are missing.
3. Remove or rewrite copy that says typed-engine scores are advisory and do not change treatment.
4. Governance queue: same default in Working; Guided unchanged unless it would show a lie.
5. Vitest: default Working fixture hides demoted rows from the Decision-grade band but not from Checklist; All shows both; keyboard next/prev still works within the visible band.

## Acceptance criteria

- Working cannot screenshot a generic typed finding as the only visible “finding” marked Decision-grade.
- Checklist rows remain on the package and on the Checklist band.
- Desktop review tabs stay a full strip.

## Constraints

- Do not collapse findings into a More menu.
- Do not auto-enable hide that deletes checklist from the sealed snapshot.
