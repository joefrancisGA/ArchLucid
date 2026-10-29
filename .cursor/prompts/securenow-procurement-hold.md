# SN-PROC-HOLD — SecureNow procurement stop list

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file only when a session starts building something this list forbids. This file is not a feature.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/SECURENOW_PROCUREMENT_COMPOSER_PROMPTS.md`

## Stop

Do not build any of the following while implementing SN-PROC prompts:

- An edit to `docs/go-to-market/PROCUREMENT_PACK_INDEX.md` or `docs/go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md` that folds SecureNow into the architecture-review pack.
- A checked box on the owner checklist in `docs/securenow/CONTROLLED_PILOT_OFFER.md`.
- A PASS row in `docs/securenow/BETA_EVIDENCE_MATRIX.json`, or a beta GO.
- A public price, a pricing page, or dollar amounts copied out of `docs/securenow/PRIVATE_PRICE_SHEET.md` onto the index, one-pager, or overlay.
- A Stripe link, a Partner Center offer, a Marketplace plan, or a live billing toggle.
- Setting `ownerApprovedPlanAndPricing` to true in `scripts/ci/audit_securenow_marketplace_prepublication.py`.
- A contractual support SLA, service credits, or a 24×7 support claim.
- The phrases "SOC 2 certified", "ISO 27001 certified", "third-party penetration test completed", "guaranteed ROI", "guaranteed savings", "guaranteed breach prevention", "autonomous remediation", or "observed exploit" as positive claims.
- A SOC 2 CPA program or a third-party pen-test program (TB-135 / TB-136 stay closed as engineering work; G-REAL-05 and G-ASSURANCE-02 stay owner GTM).
- A design-partner cohort or M-90 / M-44 / M-91 / M-92 work.
- A new mailbox. Intake stays `support@archlucid.net` and `security@archlucid.net`.
- A help route, marketing nav item, or Trust Center ZIP entry for these drafts.
- A write to customer Azure, `terraform apply`, or remediation that changes Azure.
- ArchLucid list prices reused as SecureNow plans.
- More than one SN-PROC prompt in the same session.

If the session is about to do one of these, stop and report which line it hit.
