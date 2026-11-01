> **Scope:** Paste-ready Composer prompts for SecureNow adoption friction. Internal engineering only. Do not implement from this index.
> **Paste-ready files:** [`.cursor/prompts/securenow-adoption-00-index.md`](../../.cursor/prompts/securenow-adoption-00-index.md)

# SecureNow adoption friction — Composer prompts

**Created:** 2026-10-31 · **Status:** Shipped on trunk. **Audience:** Composer 2.5 slow (`composer-2.5`)

Adoption friction scored **60** on the 31 October 2026 SecureNow desk pass (weight 6). Help, scenario chooser, and Home already expose honest vocabulary, but the first hour still lacks one in-product path. These prompts add a four-step first-hour note, a Home **Start here** section, an operator preparation page, and a warn-only checker.

They do not add a setup wizard that hides collection gaps, autonomous remediation, a timed SLA, or ArchLucid first-review wizard reuse.

Paste one numbered file per session, from [`.cursor/prompts/`](../../.cursor/prompts/).

| ID | Paste file | What moves |
|----|------------|------------|
| **SN-ADOPT-01** | `securenow-adoption-01-first-hour.md` | `docs/securenow/FIRST_HOUR.md` |
| **SN-ADOPT-02** | `securenow-adoption-02-home-section.md` | SecureNow Home **Start here** section |
| **SN-ADOPT-03** | `securenow-adoption-03-operator-page.md` | `/administration/securenow-first-hour` |
| **SN-ADOPT-04** | `securenow-adoption-04-checker.md` | `scripts/ci/check_securenow_adoption_friction.py` and CI |
| **SN-ADOPT-HOLD** | `securenow-adoption-hold.md` | Stop list |

Run **SN-ADOPT-01**, then **02**, then **03**, then **04**. **SN-ADOPT-HOLD** is not a build step.
