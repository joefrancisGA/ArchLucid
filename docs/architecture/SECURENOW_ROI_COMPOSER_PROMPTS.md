> **Scope:** Paste-ready Composer prompts for SecureNow proof-of-ROI readiness. Internal engineering only. Do not implement from this index.
> **Paste-ready files:** [`.cursor/prompts/securenow-roi-00-index.md`](../../.cursor/prompts/securenow-roi-00-index.md)

# SecureNow proof-of-ROI — Composer prompts

**Created:** 2026-10-30 · **Updated:** 2026-11-01 · **Status:** SN-ROI-01–04 shipped. SN-ROI-05–08 not started. **Audience:** Composer 2.5 slow (`composer-2.5`)

Proof-of-ROI Readiness scored **49** for SecureNow on the 30 October 2026 desk pass. ArchLucid scored **88** because the architecture-review model has a worked example and a sponsor send rule. SN-ROI-01–04 added the blank timing log, the cost card, the fixture worksheet with a negative net value, and the warn-only checker. The executive packet still says **ROI not calculated**.

SN-ROI-05–08 join minutes to the hour formula, add a SecureNow send rule, and surface the blank kit on an operator page. They still do not fill the executive proof packet or reuse the ArchLucid ROI model.

Paste one numbered file per session, from [`.cursor/prompts/`](../../.cursor/prompts/).

| ID | Paste file | What moves |
|----|------------|------------|
| **SN-ROI-01** | `securenow-roi-01-measurement-log.md` | `docs/securenow/PILOT_MEASUREMENT_LOG.md` (**shipped**) |
| **SN-ROI-02** | `securenow-roi-02-cost-input.md` | `docs/securenow/ROI_COST_INPUT.md` (**shipped**) |
| **SN-ROI-03** | `securenow-roi-03-fixture-worksheet.md` | `docs/securenow/ROI_FIXTURE_WORKSHEET.md` (**shipped**) |
| **SN-ROI-04** | `securenow-roi-04-checker.md` | `scripts/ci/check_securenow_roi_notes.py` and CI (**shipped**) |
| **SN-ROI-05** | `securenow-roi-05-measurement-units.md` | Hour join and blank honesty columns |
| **SN-ROI-06** | `securenow-roi-06-send-rule.md` | `docs/securenow/ROI_SEND_RULE.md` |
| **SN-ROI-07** | `securenow-roi-07-operator-page.md` | Sponsor Home row and `/administration/securenow-investigation-effort` |
| **SN-ROI-08** | `securenow-roi-08-checker.md` | Extend the warn-only ROI checker |
| **SN-ROI-HOLD** | `securenow-roi-hold.md` | Stop list for 01–04 |
| **SN-ROI-HOLD** | `securenow-roi-05-hold.md` | Stop list for 05–08 |

Run **SN-ROI-05**, then **06**, then **07**, then **08**. **SN-ROI-HOLD** is not a build step.

## Human tasks (owner)

These are not Composer sessions. Do them after the log and the send rule exist, on a private copy or in a follow-up you explicitly ask an agent to record.

1. Walk `fixture-path-01` once the old way and once in SecureNow. Same question, same Azure scope, same definition of done. Write the minutes on row 1 of `PILOT_MEASUREMENT_LOG.md` and label that row a synthetic fixture. Leave the other rows blank. Do not copy those minutes into `EXECUTIVE_PROOF_PACKET_TEMPLATE.md`.
2. Ask one sponsor for the year’s hosting, staff, and change-control cost, or record that they declined. Leave fee amounts in `PRIVATE_PRICE_SHEET.md`.
3. Take **R** from the sponsor. Do not invent a default hourly rate.
4. After a real comparable pair, and only when **B**, **A**, **N**, **R**, and **C** exist, a person may run the packet formula in a private copy and follow `ROI_SEND_RULE.md` before anyone outside the company sees the number.
