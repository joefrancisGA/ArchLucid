# SN-ACCEL-HOLD — SecureNow scenario accelerator stop list

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file only when a session starts building something this list forbids. This file is not a feature.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/SECURENOW_SCENARIO_ACCELERATOR_COMPOSER_PROMPTS.md`

## Stop

Do not build any of the following while implementing SN-ACCEL prompts:

- Filling `docs/securenow/EXECUTIVE_PROOF_PACKET_TEMPLATE.md` with fixture results, customer names, or any status other than the existing empty labels.
- A new file under `templates/starter-proof-packs/`, or a SecureNow scenario that links one of those packs as if it were a path walkthrough.
- `starter-pack.json`, `architecture-request.json`, `policy-context.json`, or `second-run.json` for SecureNow.
- A product route, help page, or marketing nav item for the chooser.
- Marking a fixture row **Verified**, or removing **NOT VERIFIED** from the later-capture pack.
- Calling a fixture customer evidence, a production validation, or an observed exploit.
- A beta GO, a checked pilot checklist box, a public price, or a Marketplace listing.
- More than one SN-ACCEL prompt in the same session.
- Setting `continue-on-error` to false on the scenario checker. The ArchLucid starter-pack step stays warn-only until an owner changes branch protection.
- Editing `scripts/ci/check_starter_proof_packs.py` so that it parses the SecureNow chooser.

If the session is about to do one of these, stop and report which line it hit.
