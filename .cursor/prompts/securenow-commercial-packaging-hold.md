# SN-CPKG-HOLD — SecureNow commercial packaging stop list

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file only when a session starts building something this list forbids. This file is not a feature.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/SECURENOW_COMMERCIAL_PACKAGING_COMPOSER_PROMPTS.md`

## Stop

Do not build any of the following while implementing SN-CPKG prompts:

- A public list price, a `$` amount, or a pricing page for SecureNow.
- Copying `docs/securenow/PRIVATE_PRICE_SHEET.md` into UI copy, a test fixture that ships in the product, or a buyer-safe markdown file.
- A link whose target contains `PRIVATE_PRICE_SHEET`.
- Stripe prices, live billing, Partner Center publication, or the phrase `READY_TO_PUBLISH`.
- Treating an ArchLucid Team, Professional, or Enterprise subscription as a SecureNow entitlement.
- Editing `/why-securenow` so it links the procurement index, the quote cover, or the controlled pilot proposal. That wait is **M-316**.
- Filling `ORDER_FORM_TEMPLATE.md` with a customer name, a fee, or a signature. The practice quote is **M-317** and stays out of git.
- Closing **M-95** or **G-COMMERCE-02**, or calling a pilot a paid customer.
- Setting beta to GO, or marking the 22-row matrix in `BETA_EVIDENCE_GATE.md` as passed. That walk is **M-318**.
- A contractual support SLA or service credits.
- Hiding a desktop review workspace tab behind a More menu.
- More than one SN-CPKG prompt in the same session.
- Setting `continue-on-error` to false on the commercial packaging checker.
- Adding the private price sheet to `claims()` in `build_two_product_commercial_workpack.py`.

If the session is about to do one of these, stop and report which line it hit.
