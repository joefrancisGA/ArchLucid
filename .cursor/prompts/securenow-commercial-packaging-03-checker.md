# SN-CPKG-03 — Keep the quote packet fee-free

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file as the whole task. Do not use a fast-tier slug and do not use a model outside the workspace allowlist. Do not implement another SN-CPKG prompt in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/SECURENOW_COMMERCIAL_PACKAGING_COMPOSER_PROMPTS.md`

## Goal

`scripts/ci/check_securenow_commercial_packaging.py` rejects a dollar amount on the new quote-packet copy and rejects removal of the public hold sentence.

## Why

The checker already rejects `$` in the order form, the checklist, and the SKU card. The new page and Home row are outside that check. **M-316** is still open, so `/why-securenow` must keep the owner-held sentence.

## Read first

- `scripts/ci/check_securenow_commercial_packaging.py`
- `scripts/ci/test_check_securenow_commercial_packaging.py`
- `archlucid-ui/src/lib/product-line/securenow-quote-packet-copy.ts`
- `archlucid-ui/src/lib/product-line/securenow-reviewer-home-copy.ts`
- `archlucid-ui/src/lib/marketing/why-securenow-draft-copy.ts`

## What to build

1. Branch `sn-cpkg/03-checker` from current `master` after SN-CPKG-02 is present.
2. Extend `validate` so these files exist and are read:
    - `archlucid-ui/src/lib/product-line/securenow-quote-packet-copy.ts` must contain `SN-EVAL`, `SN-ANNUAL`, `SN-SUB-ADD`, `SN-SNAP-4`, `Not an approved offer`, `NO_GO`, and `cannot authorize commerce`. It must not contain `$` or `PRIVATE_PRICE_SHEET`.
    - `archlucid-ui/src/lib/product-line/securenow-reviewer-home-copy.ts` must contain `/administration/securenow-quote-packet` and `Quote packet`. It must not contain `$`.
    - `archlucid-ui/src/lib/marketing/why-securenow-draft-copy.ts` must contain `Those documents stay with the owner until buyer communication is approved.`
3. Keep the existing order-form, checklist, and meter-card checks.
4. Extend `_copy_tree` in the unit test so a temporary root includes the three new files. Add a test that appends `$100` to the quote-packet copy and expects `contains '$'`. Add a test that deletes the owner-held sentence and expects the missing-sentence error.
5. Leave the CI step `continue-on-error: true`.

## Tests

From the repo root:

`python3 scripts/ci/check_securenow_commercial_packaging.py`

`python3 -m unittest scripts.ci.test_check_securenow_commercial_packaging`

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. On Linux, use `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path '<path>'`.
- Do not print a fee in a fixture that is committed as product copy. A unit test may write `$` only inside a temporary directory.
- Do not commit.

## Done when

The checker passes on the repo, fails when the quote-packet copy gains a dollar sign, and fails when the Why page loses the owner-held sentence.
