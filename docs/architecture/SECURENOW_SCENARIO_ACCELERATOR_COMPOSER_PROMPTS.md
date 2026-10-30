> **Scope:** Paste-ready Composer prompts for a SecureNow scenario chooser. Internal engineering only. Do not implement from this index.
> **Paste-ready files:** [`.cursor/prompts/securenow-scenario-00-index.md`](../../.cursor/prompts/securenow-scenario-00-index.md)

# SecureNow scenario accelerators — Composer prompts

**Created:** 2026-10-30 · **Status:** Not started. **Audience:** Composer 2.5 slow (`composer-2.5`)

Template and Accelerator Richness scored **42** for SecureNow on the 30 October 2026 desk pass. ArchLucid scored **70** because `templates/starter-proof-packs/` is a choosable, dry-run catalog. SecureNow has one fixture storyboard and an empty executive proof form. These prompts add a five-row chooser, one short pack per row, and a warn-only checker. They do not add ArchLucid starter-pack JSON, fill the executive proof packet, or approve a customer demo.

Paste one numbered file per session, from [`.cursor/prompts/`](../../.cursor/prompts/).

| ID | Paste file | What moves |
|----|------------|------------|
| **SN-ACCEL-01** | `securenow-scenario-01-chooser.md` | `docs/securenow/SCENARIO_CHOOSER.md` |
| **SN-ACCEL-02** | `securenow-scenario-02-packs.md` | `docs/securenow/scenario-packs/*.md` |
| **SN-ACCEL-03** | `securenow-scenario-03-checker.md` | `scripts/ci/check_securenow_scenario_chooser.py` and CI |
| **SN-ACCEL-HOLD** | `securenow-scenario-hold.md` | Stop list |

Run **SN-ACCEL-01**, then **02**, then **03**. **SN-ACCEL-HOLD** is not a build step.
