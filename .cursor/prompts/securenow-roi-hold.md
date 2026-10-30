# SN-ROI-HOLD — SecureNow proof-of-ROI stop list

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file only when a session starts building something this list forbids. This file is not a feature.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/SECURENOW_ROI_COMPOSER_PROMPTS.md`

## Stop

Do not build any of the following while implementing SN-ROI prompts:

- Filling `docs/securenow/EXECUTIVE_PROOF_PACKET_TEMPLATE.md` with hours, fees, or a calculated ROI.
- Copying figures from `docs/go-to-market/ROI_MODEL.md`, including the Contoso example and any percent result from that file.
- Copying a fee amount from `docs/securenow/PRIVATE_PRICE_SHEET.md` into another file.
- A `$` character on the measurement log, the cost card, or the fixture worksheet.
- Converting a removed path, a finding count, or an avoided breach into money.
- Putting ROI fields into the synthetic demo JSON, or editing `scripts/ci/audit_securenow_synthetic_demo.py` to allow them.
- An in-product time field, a new API, or a sponsor export. That work is outside this prompt set.
- The phrase `guaranteed ROI` as a product claim.
- Adding the new docs to `claims()` in `build_two_product_commercial_workpack.py`.
- More than one SN-ROI prompt in the same session.
- Setting `continue-on-error` to false on the ROI checker.

If the session is about to do one of these, stop and report which line it hit.
