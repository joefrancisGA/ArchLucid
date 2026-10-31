> **Scope:** Paste-ready Composer prompts for SecureNow proof-of-ROI readiness. Internal engineering only. Do not implement from this index.
> **Paste-ready files:** [`.cursor/prompts/securenow-roi-00-index.md`](../../.cursor/prompts/securenow-roi-00-index.md)

# SecureNow proof-of-ROI — Composer prompts

**Created:** 2026-10-30 · **Status:** Not started. **Audience:** Composer 2.5 slow (`composer-2.5`)

Proof-of-ROI Readiness scored **49** for SecureNow on the 30 October 2026 desk pass. ArchLucid scored **88** because the architecture-review model has a worked example and a sponsor send rule. SecureNow already has the analyst-hour formula, and every input is **NOT COLLECTED**. These prompts add a blank timing log, a cost card that points at the private quote without copying fees, a fixture worksheet with a negative net value, and a warn-only checker. They do not fill the executive proof packet or reuse the ArchLucid ROI model.

Paste one numbered file per session, from [`.cursor/prompts/`](../../.cursor/prompts/).

| ID | Paste file | What moves |
|----|------------|------------|
| **SN-ROI-01** | `securenow-roi-01-measurement-log.md` | `docs/securenow/PILOT_MEASUREMENT_LOG.md` |
| **SN-ROI-02** | `securenow-roi-02-cost-input.md` | `docs/securenow/ROI_COST_INPUT.md` |
| **SN-ROI-03** | `securenow-roi-03-fixture-worksheet.md` | `docs/securenow/ROI_FIXTURE_WORKSHEET.md` |
| **SN-ROI-04** | `securenow-roi-04-checker.md` | `scripts/ci/check_securenow_roi_notes.py` and CI |
| **SN-ROI-HOLD** | `securenow-roi-hold.md` | Stop list |

Run **SN-ROI-01**, then **02**, then **03**, then **04**. **SN-ROI-HOLD** is not a build step.
