# SN-ADOPT-HOLD — Wave 2 stop list (SN-ADOPT-05–08)

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file only when a session starts building something this list forbids. This file is not a feature.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/SECURENOW_ADOPTION_FRICTION_COMPOSER_PROMPTS.md`

## Stop

Do not build any of the following while implementing SN-ADOPT-05 through SN-ADOPT-08:

- A setup wizard that marks a missing or stale capture as healthy.
- An auto-apply remediation control.
- A timed SLA, a minutes-to-value claim, or a clock on the first hour.
- Reusing the ArchLucid `/help/first-architecture-review` wizard.
- A new route whose only job is Path inspect. Path inspect stays the panel on a selected row.
- Two Home rows with the same `href`.
- Hiding a SecureNow Home section behind More.
- A sidebar item for this wave.
- Setting `continue-on-error` to false on the adoption checker.
- More than one SN-ADOPT prompt in the same session.

If the session is about to do one of these, stop and report which line it hit.
