# SN-TTV-HOLD — SecureNow time-to-value stop list

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file only when a session starts building something this list forbids. This file is not a feature.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/SECURENOW_SCORE66_COMPOSER_PROMPTS.md`

## Stop

Do not build any of the following while implementing SN-TTV prompts:

- A clock, a minutes-to-value claim, a timer, or a timed SLA on the first hour.
- Reopening **M-90** as an engineering cohort, or timing the **M-308** walk.
- A new question-queue route. The queue stays on `/infrastructure/diagrams`.
- A wizard, an engagement score, or auto-apply Azure remediation.
- Filling `EXECUTIVE_PROOF_PACKET_TEMPLATE.md` or treating `fixture-path-01` as a customer result.
- A beta GO, a public price, a `$`, or a "Start trial" control.
- A sixth row inside Home **Start here**.
- Hiding a desktop review workspace tab behind More.
- Setting `continue-on-error` to false on the time-to-value checker.
- More than one SN-TTV prompt in the same session.

If the session is about to do one of these, stop and report which line it hit.
