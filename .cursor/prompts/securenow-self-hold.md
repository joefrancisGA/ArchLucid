# SN-SELF-HOLD — SecureNow self-sufficiency stop list

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file only when a session starts building something this list forbids. This file is not a feature.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/SECURENOW_SELF_SUFFICIENCY_COMPOSER_PROMPTS.md`

## Stop

Do not build any of the following while implementing SN-SELF prompts:

- Assigning `/administration/support` to the security product line, or rendering the ArchLucid support page inside SecureNow.
- Calling `POST /v1/admin/support-bundle` or adding a SecureNow diagnostics ZIP.
- A new mailbox. Intake stays `support@archlucid.net` and `security@archlucid.net`.
- A support SLA, a response-time promise, service credits, or a 24×7 claim.
- A beta GO, or a checked box on `CONTROLLED_PILOT_OFFER.md`.
- A public price, a `$`, a Stripe link, or a "Start trial" control.
- Hands-free Azure repair, or copy that says SecureNow changes Azure.
- Treating a missing capture or an empty ranking as a clean environment.
- Setting `recommendedFirst` on the stuck-state Home row.
- A sidebar item that hides an existing review workspace tab behind More.
- Setting `continue-on-error` to false on the self-service checker.
- More than one SN-SELF prompt in the same session.

If the session is about to do one of these, stop and report which line it hit.
