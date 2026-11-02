# SN-ROI-HOLD — Wave 2 stop list (SN-ROI-05–08)

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file only when a session starts building something this list forbids. This file is not a feature.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/SECURENOW_ROI_COMPOSER_PROMPTS.md`

## Stop

Do not build any of the following while implementing SN-ROI-05 through SN-ROI-08:

- Filling `docs/securenow/EXECUTIVE_PROOF_PACKET_TEMPLATE.md` with hours, fees, or a calculated ROI.
- Writing a minute, an hour, a sample size, a rate, or a customer name into `PILOT_MEASUREMENT_LOG.md`.
- Copying a fee amount from `docs/securenow/PRIVATE_PRICE_SHEET.md` into another file.
- A `$` character on the measurement log, the cost card, the fixture worksheet, the send rule, or the operator page.
- Converting a removed path, a finding count, or an avoided breach into money.
- Copying a percent from `docs/go-to-market/ROI_MODEL.md`.
- Putting ROI fields into the synthetic demo JSON, or editing `scripts/ci/audit_securenow_synthetic_demo.py` to allow them.
- A product timer, a form post, a new API, or a sponsor export.
- The phrase `guaranteed ROI` as a product claim.
- A sidebar item, or a review workspace tab hidden behind More.
- Setting `continue-on-error` to false on the ROI checker.
- More than one SN-ROI prompt in the same session.

The operator page may link the four repository paths. That link is not a timer and not an export.

If the session is about to do one of these, stop and report which line it hit.
