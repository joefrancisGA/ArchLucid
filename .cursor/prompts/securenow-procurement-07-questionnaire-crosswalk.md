# SN-PROC-07 — SecureNow questionnaire crosswalk

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file as the whole task. Do not use a fast-tier slug and do not use a model outside the workspace allowlist. Do not implement another SN-PROC prompt in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/SECURENOW_PROCUREMENT_COMPOSER_PROMPTS.md`

## Goal

A spreadsheet map: for each common security-questionnaire theme, either cite the platform packet or cite the SecureNow overlay. The file says it is not a completed SIG or CAIQ.

## Why

ArchLucid keeps a long accelerator inside `docs/go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md`. SecureNow has about twenty product-specific answers in `docs/securenow/PROCUREMENT_RESPONSE_OVERLAY.md`. A reviewer still has to guess which platform answer applies. This crosswalk is the index between those two files. It does not copy the platform packet.

## Read first

- `docs/securenow/PROCUREMENT_RESPONSE_OVERLAY.md`
- `docs/securenow/PROCUREMENT_PACK_INDEX.md`
- `docs/securenow/BUYER_SECURITY_ONE_PAGER.md`
- `docs/securenow/DATA_PROCESSING_SCHEDULE.md` if present
- `docs/securenow/SUBPROCESSORS_DELTA.md` if present
- `docs/go-to-market/PROCUREMENT_RESPONSE_ACCELERATOR.md` (path-stable alias only)
- `docs/go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md` (search headings; do not copy sections)
- `docs/go-to-market/SOC2_STATUS_PROCUREMENT.md`
- `docs/go-to-market/SUBPROCESSORS.md`
- `docs/library/V1_DEFERRED.md` (section 6c only)
- `scripts/ci/build_two_product_commercial_workpack.py` (`claims`)
- `scripts/ci/test_commercial_claim_scope.py`
- `scripts/ci/test_build_two_product_commercial_workpack.py`

## What to build

1. Branch `sn-proc/07-questionnaire-crosswalk` from current `master` after SN-PROC-05 and SN-PROC-06 if those have merged. Do not redo earlier SN-PROC prompts.
2. Add `docs/securenow/QUESTIONNAIRE_CROSSWALK.md`.
3. First line is a Scope blockquote: SecureNow questionnaire crosswalk. Not a completed SIG or CAIQ. Not an approved customer offer. Beta remains NO_GO.
4. One sentence under the title: shared controls stay in the ArchLucid packet; this table only routes the question.
5. A table with columns `Theme`, `Where the shared answer lives`, `SecureNow difference`, `Paste this`.
    - **24 to 36 data rows.** Not fewer than 24.
    - Every overlay theme in `PROCUREMENT_RESPONSE_OVERLAY.md` appears once. `SecureNow difference` links that overlay row's source file. `Paste this` is one sentence taken from the overlay answer, not a new claim.
    - Add shared-control rows only when you can point at an existing heading or file. Cover at least: identity binding, database-per-tenant isolation, subprocessors list, DPA template, SOC 2 status, vulnerability contact, support hours versus SLA. For those, `SecureNow difference` is `Same as platform` plus the SecureNow entitlement or beta sentence when the overlay already has one.
    - `Where the shared answer lives` is a markdown link. Prefer a stable file under `docs/go-to-market/` or `docs/securenow/`. Do not link a heading that you have not opened.
6. Do not add rows for insurance, a bug-bounty payout, ISO 27001 certification, a completed third-party penetration test, or a CPA SOC 2 report. If a theme must appear because buyers ask it, the `Paste this` cell refuses the claim and links `SOC2_STATUS_PROCUREMENT.md` or `V1_DEFERRED.md`.
7. A closing section `## How to use`. Tell the reviewer to copy `Paste this` into their spreadsheet and attach the linked file. Say this crosswalk does not replace legal review.
8. Add one **Template** row to the SecureNow-specific status map and one **Self-asserted** evidence row in `docs/securenow/PROCUREMENT_PACK_INDEX.md`. The note says this is a route map, not a completed questionnaire. Link `QUESTIONNAIRE_CROSSWALK.md`. Update **Last reviewed** to today's UTC date.
9. Add `docs/securenow/QUESTIONNAIRE_CROSSWALK.md` to the SecureNow list in `claims()`, to `SOURCES` in `scripts/ci/test_commercial_claim_scope.py`, and to the temp-root fixture in `scripts/ci/test_build_two_product_commercial_workpack.py` if that fixture lists SecureNow claim files.
10. Add a README bullet that links the crosswalk and says it is not a completed SIG or CAIQ and not an approved offer.

## Tests

```bash
python3 scripts/ci/check_securenow_procurement_pack.py
python3 scripts/ci/check_securenow_buyer_proof.py
python3 -m unittest scripts.ci.test_commercial_claim_scope scripts.ci.test_build_two_product_commercial_workpack
```

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2. On a Linux Cloud Agent, use `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path '<path>'`.
- Do not edit `docs/go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md` or `docs/go-to-market/PROCUREMENT_RESPONSE_ACCELERATOR.md`.
- Do not copy fee amounts from `PRIVATE_PRICE_SHEET.md`.
- Do not claim "SOC 2 certified", "ISO 27001 certified", or "third-party penetration test completed" except on a line that also refuses the claim.
- Do not commit.

## Done when

The crosswalk has 24–36 rows, every overlay theme is routed, shared rows link a real file, and the ArchLucid packet is unchanged.
