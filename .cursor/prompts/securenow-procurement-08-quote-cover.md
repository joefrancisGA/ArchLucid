# SN-PROC-08 — SecureNow quote cover

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file as the whole task. Do not use a fast-tier slug and do not use a model outside the workspace allowlist. Do not implement another SN-PROC prompt in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/SECURENOW_PROCUREMENT_COMPOSER_PROMPTS.md`

## Goal

A one-page attachment a champion can put in a vendor-setup folder. It names the product, the SKU identifiers, and what the pilot excludes. It contains no prices.

## Why

Procurement can open a vendor record before anyone approves an order. `docs/securenow/PRIVATE_PRICE_SHEET.md` is the fee table. Copying it into a buyer document would publish a price. The cover points at that sheet and stops.

## Read first

- `docs/securenow/PRIVATE_PRICE_SHEET.md` (identifiers and seller line only; do not copy the Fees table)
- `docs/securenow/SUPPORT_COMMITMENT.md`
- `docs/securenow/BUYER_SECURITY_ONE_PAGER.md`
- `docs/securenow/MARKETPLACE_PREPUBLICATION_CONTRACT.md`
- `docs/securenow/CONTROLLED_PILOT_OFFER.md`
- `docs/securenow/PROCUREMENT_PACK_INDEX.md`
- `scripts/ci/build_two_product_commercial_workpack.py` (`claims`)
- `scripts/ci/test_commercial_claim_scope.py`
- `scripts/ci/test_build_two_product_commercial_workpack.py`

## What to build

1. Branch `sn-proc/08-quote-cover` from current `master`. Do not redo earlier SN-PROC prompts.
2. Add `docs/securenow/QUOTE_COVER.md`.
3. First line is a Scope blockquote: SecureNow quote cover for vendor setup. Not an approved customer offer. Not a public list price. Beta remains NO_GO.
4. Use these headings:
    - `## What this attachment is`
    - `## What a pilot conversation covers`
    - `## What this attachment excludes`
    - `## How to ask for the fee`
    - `## Seller`
5. **What this attachment is.** Say it is the cover a champion attaches while legal and the owner are still negotiating. Repeat **NOT AN APPROVED CUSTOMER OFFER**.
6. **What a pilot conversation covers.** Use only facts already in the one-pager or the support commitment: Azure Reader inventory or an approved upload, advisory output, changes applied **outside** SecureNow, founder acknowledgement that is not a contractual SLA. You may name the SKU identifiers **SN-EVAL**, **SN-ANNUAL**, **SN-SUB-ADD**, and **SN-SNAP-4**, because `SUPPORT_COMMITMENT.md` already names them. Do not copy prices, currency amounts, subscription caps, snapshot caps, the 45-day length, or the credit rule from the private sheet.
7. **What this attachment excludes.** Marketplace publication (**HOLD_NO_PUBLICATION**), live billing, a contractual SLA, service credits, a CPA-issued SOC 2 report, and a public list price.
8. **How to ask for the fee.** The owner sends figures from `PRIVATE_PRICE_SHEET.md` under a separate approval. This cover does not contain those figures. Link the private sheet and say the link is an internal source, not permission to forward the fee table.
9. **Seller.** You may repeat the seller-of-record line already printed in `PRIVATE_PRICE_SHEET.md`. Do not add a bank account, a tax id, or an address that the sheet does not already print.
10. The file must not contain a dollar sign.
11. Add one **Template** row to the SecureNow-specific status map and one **Self-asserted** evidence row in `docs/securenow/PROCUREMENT_PACK_INDEX.md`. The note says the cover names SKU identifiers and does not publish fees. Link `QUOTE_COVER.md`. Update **Last reviewed** to today's UTC date.
12. Add `docs/securenow/QUOTE_COVER.md` to the SecureNow list in `claims()`, to `SOURCES` in `scripts/ci/test_commercial_claim_scope.py`, and to the temp-root fixture in `scripts/ci/test_build_two_product_commercial_workpack.py` if that fixture lists SecureNow claim files.
13. Add a README bullet that links the cover and says it is not a price list and not an approved offer.

## Tests

```bash
python3 scripts/ci/check_securenow_procurement_pack.py
python3 scripts/ci/check_securenow_buyer_proof.py
python3 -m unittest scripts.ci.test_commercial_claim_scope scripts.ci.test_build_two_product_commercial_workpack
```

Confirm `QUOTE_COVER.md` has no `$` character:

```bash
python3 -c "from pathlib import Path; t=Path('docs/securenow/QUOTE_COVER.md').read_text(); assert '$' not in t"
```

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2. On a Linux Cloud Agent, use `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path '<path>'`.
- Do not edit `docs/securenow/PRIVATE_PRICE_SHEET.md`.
- Do not add a help route, a marketing nav item, or a Trust Center link.
- Do not check pilot checklist boxes.
- Do not commit.

## Done when

The cover names the four SKU identifiers, states the exclusions, contains no dollar sign, and the claim scanner includes the new file.
