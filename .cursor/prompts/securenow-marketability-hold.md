# SN-MKT-HOLD — SecureNow marketability stop list

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file only when a session starts building something this list forbids. This file is not a feature.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/SECURENOW_MARKETABILITY_COMPOSER_PROMPTS.md`

## Stop

Do not build any of the following while implementing SN-MKT prompts.

SN-MKT-08 through SN-MKT-11 lift three older stops: `robots` index true on `/why-securenow`, a resources-menu link to that page and to `/securenow-sample`, and a security-shell exception for `/securenow-sample`. Those three are allowed only in the numbered prompt that names them. Every other stop below still applies.

- A public price, a pricing page, or any dollar amount on a SecureNow surface.
- A Stripe link, a Partner Center offer, a Marketplace plan, or a live billing toggle.
- A beta GO, or a checked box on the owner checklist in `CONTROLLED_PILOT_OFFER.md`.
- A "Start trial", "Buy", or "Sign up" control.
- The phrases "guaranteed ROI", "guaranteed savings", "guaranteed breach prevention", "autonomous remediation", "automatically apply", "SOC 2 certified", or "observed exploit".
- A numeric probability or a numeric confidence score.
- A link to `/why-securenow` or `/securenow-sample` from the welcome page, the marketing footer, or the operator sidebar. SN-MKT-10 may add those two hrefs to `MarketingResourcesMenu` only. SN-MKT-01 through SN-MKT-07 do not add them.
- Rendering `MarketingPublicHeader`, the marketing footer, signup, pricing, or analytics on the security-shell render of `/why-securenow` or `/securenow-sample`.
- Letting any marketing path other than exact `/why-securenow` and exact `/securenow-sample` (trailing slash allowed) render on the security product line. `/securenow-sample` is added by SN-MKT-09.
- Changing the blocked-prefix matcher so `/why` also matches `/why-securenow`.
- Leaving `robots` index false on `/why-securenow` after SN-MKT-08, or setting index false on `/securenow-sample`.
- A `$` or a copied fee in `docs/securenow/BUYER_OVERVIEW.md`.
- A sidebar or header nav item for the reviewer section.
- Setting `continue-on-error` to false on the marketability checker.
- Treating `BUYER_OVERVIEW.md` as approved buyer communication. It stays an internal draft. The public Why page and the synthetic sample are an explanation, not an offer and not a beta GO.
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
