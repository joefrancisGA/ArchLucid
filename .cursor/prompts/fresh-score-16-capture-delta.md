# FS-16 — List path changes since the previous capture

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file as the whole task. Do not use a fast-tier slug and do not use a model outside the workspace allowlist. Do not implement another FS prompt in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/FRESH_SCORE_20_COMPOSER_PROMPTS.md`


## Goal

After two captures, SecureNow Home lists path ids added, gone, and unchanged since the previous capture.

## Why

Stickiness is **56** (weight 1). Return reasons explain why someone might reopen the product. Home does not show what changed.

## Read first

- `archlucid-ui/src/components/product-line/SecureNowHomeEnvironmentContext.tsx`
- `archlucid-ui/src/lib/infra-evidence/infra-evidence-drift-api.ts`
- `archlucid-ui/src/lib/package-changes-since-finalize.ts` (shape only; do not import ArchLucid package logic into SecureNow)

## What to build

1. Branch `fresh-score/16-capture-delta` from current `master`.
2. On SecureNow Home, add `data-testid="securenow-capture-delta"`.
3. When fewer than two successful snapshots are loaded, the text is `A second capture is required before path changes can be listed.`
4. When two exist, compare path ids on the latest successful snapshot with the previous successful snapshot. Show three lists: Added, Gone, Unchanged. An empty list says `None`.
5. Include `This is not a usage claim.`
6. Do not send a reminder and do not schedule a job.
7. Test one snapshot, and two snapshots with one added id, one gone id, and one shared id.

## Tests

From `archlucid-ui`, run the new capture-delta test.

## Done when

One capture asks for a second capture. Two captures list added, gone, and unchanged path ids.

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
