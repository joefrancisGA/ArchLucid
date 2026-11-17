# FS-09 — Name the role and the subscription when collection is missing

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file as the whole task. Do not use a fast-tier slug and do not use a model outside the workspace allowlist. Do not implement another FS prompt in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/FRESH_SCORE_20_COMPOSER_PROMPTS.md`


## Goal

The cloud-connections empty state names the Reader role and the subscription scope, and the capture status stays missing.

## Why

Adoption Friction is **64** (weight 6). Home already links "No collection yet" to cloud connections. That screen does not say which role or which subscription is missing.

## Read first

- `archlucid-ui/src/components/product-line/SecureNowHomeEnvironmentContext.tsx`
- `archlucid-ui/src/app/(operator)/integrations/cloud-connections/_sections/CloudConnectionsPageClient.tsx`
- `docs/architecture/adrs/0103-securenow-in-tenant-collection-agent.md` (Reader-only boundary only)

## What to build

1. Branch `fresh-score/09-missing-collection` from current `master`.
2. When the connections list is empty, or the latest snapshot status is missing, show a block with `data-testid="securenow-collection-missing"`:
   - `Collection status: Missing.`
   - `Connector role: Reader on the subscription in scope.`
   - The subscription name from the scope switcher when it is present. When it is absent: `Subscription scope: not selected.`
3. Do not mark the capture current. Do not add a collect button that writes to Azure.
4. Keep the existing connection form.
5. Add a client test for the empty list.

## Tests

From `archlucid-ui`, run the cloud-connections page test.

## Done when

A missing collection says Missing, names the Reader role, and names the subscription or says it is not selected.

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
