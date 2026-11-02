# SN-LIFT-HOLD — SecureNow score-lift stop list

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file only when a session starts building something this list forbids. This file is not a feature.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/SECURENOW_SCORE_LIFT_COMPOSER_PROMPTS.md`

## Stop

Do not build any of the following while implementing SN-LIFT prompts:

- A public list price, a `$` amount, Stripe price, or Marketplace publication.
- Welcome-page or marketing-footer links to `/why-securenow` or `/securenow-sample`.
- A CPA SOC 2 program, a third-party pen-test claim, or a numeric compliance score.
- A clock, a minute count, or a duration written into `DECISION_CYCLE_LOG.md` or `PILOT_MEASUREMENT_LOG.md`.
- Filling `EXECUTIVE_PROOF_PACKET_TEMPLATE.md` with customer outcomes.
- An Azure write, an ARM change, or `terraform apply`.
- A support SLA, a new mailbox, or `/administration/support` on the SecureNow line.
- Hiding a desktop review workspace tab behind a More menu.
- A second path ranker, or an Ask answer that reorders ranked paths.
- Marking a fixture `verified clean` or `remediation succeeded`.
- More than one SN-LIFT prompt in the same session.
- Setting `continue-on-error` to false on a SecureNow warn-only checker.

If the session is about to do one of these, stop and report which line it hit.
