# SN-DV-HOLD — SecureNow decision-velocity stop list

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file only when a session starts building something this list forbids. This file is not a feature.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/SECURENOW_DECISION_VELOCITY_COMPOSER_PROMPTS.md`

## Stop

Do not build any of the following while implementing SN-DV prompts:

- A clock time, a customer name, or a selected outcome written into `DECISION_CYCLE_LOG.md` or `PILOT_DECISION_RECORD.md`.
- A product timer that starts or stops itself.
- A form post that stores a disposition.
- Checking **Proceed**, **Extend**, or **Stop** in source as if a sponsor already chose.
- Merging this log into `PILOT_MEASUREMENT_LOG.md` or converting minutes into dollars.
- A public price, a `$`, a Stripe link, or a "Start trial" control.
- A beta GO, or a checked box on `CONTROLLED_PILOT_OFFER.md`.
- Treating `fixture-path-01` or `SYNTHETIC FIXTURE` as a customer result.
- A new mailbox.
- Hands-free Azure repair.
- A sidebar item that hides an existing review workspace tab behind More.
- Setting `continue-on-error` to false on the decision-velocity checker.
- More than one SN-DV prompt in the same session.

If the session is about to do one of these, stop and report which line it hit.
