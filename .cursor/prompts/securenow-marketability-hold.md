# SN-MKT-HOLD — SecureNow marketability stop list

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file only when a session starts building something this list forbids. This file is not a feature.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/SECURENOW_MARKETABILITY_COMPOSER_PROMPTS.md`

## Stop

Do not build any of the following while implementing SN-MKT prompts:

- A public price, a pricing page, or any dollar amount on a SecureNow surface.
- A Stripe link, a Partner Center offer, a Marketplace plan, or a live billing toggle.
- A beta GO, or a checked box on the owner checklist in `CONTROLLED_PILOT_OFFER.md`.
- A "Start trial", "Buy", or "Sign up" control.
- The phrases "guaranteed ROI", "guaranteed savings", "guaranteed breach prevention", "autonomous remediation", "automatically apply", "SOC 2 certified", or "observed exploit".
- A numeric probability or a numeric confidence score.
- A link to `/why-securenow` from the marketing header, footer, welcome page, or resources menu.
- `robots` index true on `/why-securenow`.
- A rewrite of `SECURENOW_HOME_PAGE_LEAD` or `SECURENOW_HOME_CLAIM_DISCIPLINE` (SN-HOME-01, already shipped).
- A new SecureNow mailbox. Intake stays `support@archlucid.net` and `security@archlucid.net`.
- A 24×7 support claim, a service-credit SLA, or a hired-rotation geography.
- A design-partner cohort, a SOC 2 CPA program, or a third-party pen-test program.
- A screenshot presented as a customer result.
- A write to customer Azure, `terraform apply`, or remediation that changes Azure.
- A review workspace tab hidden behind More.
- ArchLucid list prices reused as SecureNow plans.
- More than one SN-MKT prompt in the same session.

If the session is about to do one of these, stop and report which line it hit.
