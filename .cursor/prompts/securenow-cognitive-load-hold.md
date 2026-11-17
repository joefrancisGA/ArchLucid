# SN-COG-HOLD — SecureNow cognitive-load stop list

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file only when a session starts building something this list forbids. This file is not a feature.

**Record:** `docs/architecture/SECURENOW_SCORE64_COMPOSER_PROMPTS.md`

## Stop

Do not:

- hide SecureNow review workspace tabs behind a More menu;
- add a first-review wizard, timer, SLA, engagement score, email reminder, or retention claim;
- mark a missing, stale, blocked, or `NOT VERIFIED` capture as clean or verified;
- rename API contracts, route segments, or persisted fields to fix copy inconsistency;
- add auto-apply Azure remediation;
- fill the executive proof packet with synthetic results;
- run more than one SN-COG prompt in the same session.

If the session is about to do one of these, stop and report which line it hit.
