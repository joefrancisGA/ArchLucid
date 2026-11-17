# SN-ROI-02 — SecureNow cost input for C

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file as the whole task. Do not use a fast-tier slug and do not use a model outside the workspace allowlist. Do not implement another SN-ROI prompt in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/SECURENOW_ROI_COMPOSER_PROMPTS.md`

## Goal

A one-page card that shows how annual cost **C** is assembled. The product fee is a pointer to the private quote. The customer’s operating cost stays blank.

## Why

The ROI formula needs **C**, and the private quote sheet already holds owner-approved fees. Those fees are not a public list price, and a fee is not a savings result. Copying the amounts into a second page would publish them.

## Read first

- `docs/securenow/PILOT_MEASUREMENT_LOG.md`
- `docs/securenow/PRIVATE_PRICE_SHEET.md` (SKU identifiers only; do not copy prices)
- `docs/securenow/QUOTE_COVER.md` (how a page names SKUs without amounts)
- `docs/securenow/EXECUTIVE_PROOF_PACKET_TEMPLATE.md` (definition of **C** only; do not edit)
- `docs/securenow/PROCUREMENT_PACK_INDEX.md`

## What to build

1. Branch `sn-roi/02-cost-input` from current `master` after SN-ROI-01 has merged.
2. Add `docs/securenow/ROI_COST_INPUT.md`.
3. First line is a Scope blockquote: SecureNow cost input for C. Price pointer plus a blank operating cost. Not a savings result. Not a public list price. Not an approved offer. Beta remains NO_GO.
4. One sentence under the title: **C** is the annual product fee plus the customer’s operating cost. The fee is an input. It is not evidence that money was saved.
5. A table with columns `Part of C`, `Where it comes from`, `Status`. **Exactly 2 data rows:**
    - Product fee — link `PRIVATE_PRICE_SHEET.md` and name the SKU identifiers **SN-EVAL** and **SN-ANNUAL**. Status: owner-approved private quote. Do not print an amount.
    - Customer operating cost — the sponsor’s own hosting, staff, and change-control cost for the year. Status: **NOT COLLECTED**.
6. One line after the table: do not add these parts until both are known. An unknown operating cost means **C** is not ready.
7. A short section `## What this card does not do`. State that it does not copy fee amounts, that it does not fill `EXECUTIVE_PROOF_PACKET_TEMPLATE.md`, and that it does not claim ROI.
8. In `docs/securenow/PROCUREMENT_PACK_INDEX.md`, add one **SecureNow-specific** status-map row: artifact `ROI cost input`, status `Template`, source link to the new file, notes that it names SKUs and leaves operating cost blank. Do not remove existing rows.
9. Add one README bullet that links the card and says it is a cost input, not a savings claim.

## Tests

Run `python3 scripts/ci/check_securenow_procurement_pack.py` and confirm it still exits 0. Confirm the new file contains no `$` character.

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2. On a Linux Cloud Agent, use `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path '<path>'`.
- Do not print a fee, a tax rate, or a dollar sign.
- Do not edit `PRIVATE_PRICE_SHEET.md` or `EXECUTIVE_PROOF_PACKET_TEMPLATE.md`.
- Do not add the new file to `claims()` in `build_two_product_commercial_workpack.py`.
- Do not commit.

## Done when

The card has two rows, names the SKUs without amounts, and the procurement pack checker still passes.
