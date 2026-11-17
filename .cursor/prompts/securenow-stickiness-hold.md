# SN-STICK-HOLD — SecureNow stickiness stop list

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file only when a session starts building something this list forbids. This file is not a feature.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/SECURENOW_STICKINESS_COMPOSER_PROMPTS.md`

## Stop

Do not build any of the following while implementing SN-STICK prompts:

- An email, digest, webhook, or in-app notification that tells someone to return.
- A cron job, hosted service, or preference screen for reminders.
- A streak, engagement score, daily-active count, or "customer returned" claim.
- A new capture scheduler. Collection remains the existing operator action.
- A fifth return reason, or a Home row whose href is not one of the four named destinations.
- Copying fee amounts from `docs/securenow/PRIVATE_PRICE_SHEET.md`.
- Filling `PILOT_DECISION_RECORD.md` or `EXECUTIVE_PROOF_PACKET_TEMPLATE.md`.
- Editing `SecureNowHomeWorkSummary` so that it calculates a new metric.
- Adding these notes to `claims()` in `build_two_product_commercial_workpack.py`.
- More than one SN-STICK prompt in the same session.
- Setting `continue-on-error` to false on the stickiness checker.

If the session is about to do one of these, stop and report which line it hit.
