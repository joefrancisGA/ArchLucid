# FS-08 — One sponsor page for the open path

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file as the whole task. Do not use a fast-tier slug and do not use a model outside the workspace allowlist. Do not implement another FS prompt in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/FRESH_SCORE_20_COMPOSER_PROMPTS.md`


## Goal

A sponsor page shows the open path's cited hops, the advisory cut point, and an empty proceed / extend / stop choice.

## Why

Sponsor Value Visibility is **60** (weight 4). The readout outline is a document. The open path does not have a sponsor page.

## Read first

- `docs/securenow/SPONSOR_READOUT_OUTLINE.md`
- `docs/securenow/PILOT_DECISION_RECORD.md`
- `archlucid-ui/src/components/security/SecurityEvidencePathInspectPanel.tsx`
- `archlucid-ui/src/lib/product-line/securenow-pilot-decision-copy.ts`

## What to build

1. Branch `fresh-score/08-sponsor-path` from current `master`.
2. Add route `/administration/securenow-sponsor-path`.
3. The page reads `pathId` from the query. With no `pathId`, it says `Select a ranked path in Path inspect.` and links to `/security/remediation-factory`.
4. With a `pathId`, it shows the path id, the cited hops the inspect panel already loads, and the advisory cut point. Include `SecureNow recommends. It does not change Azure.`
5. When `pathId` is `fixture-path-01`, show `Synthetic fixture. Not a customer result.`
6. Show three empty choices: Proceed, Extend, Stop. None is selected. The rationale box placeholder is `NOT COLLECTED`. Do not persist a choice in this session. FS-13 owns persistence.
7. Link the page from Path inspect as `Sponsor page for this path`, carrying the current `pathId`.
8. Add a view test for no `pathId`, for `fixture-path-01`, and for another path id.

## Tests

From `archlucid-ui`, run the new sponsor-path view test.

## Done when

The sponsor page shows hops and the cut point for the open path, labels the fixture, and leaves the decision empty.

## Constraints

- Before editing a tracked file, run `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2.
- If the done-when text is already present, stop and report that. Do not add a second copy.
- Read `.cursor/prompts/fresh-score-hold.md` before editing.
- Do not implement another FS prompt in this session.
- Do not commit.
- Beta remains **NO_GO**. Do not publish a fee, a public list price, a CPA SOC 2 report, or a third-party pen-test claim.
- Do not write a customer result, a timed SLA, or a minutes-to-value claim.
- Do not hide review workspace tabs behind a More menu.
- Do not call `PathRankingEngine` or change rank weights.
