> **Scope:** Paste-ready Composer prompts for a SecureNow procurement evidence pack. Internal engineering only. Do not implement from this index.
> **Paste-ready files:** [`.cursor/prompts/securenow-procurement-00-index.md`](../../.cursor/prompts/securenow-procurement-00-index.md)

# SecureNow procurement readiness — Composer prompts

**Created:** 2026-10-29 · **Updated:** 2026-10-30 · **Status:** SN-PROC-01–04 shipped. SN-PROC-05–09 not started. **Audience:** Composer 2.5 slow (`composer-2.5`)

Procurement Readiness scored **38** on the 2026-10-29 47-quality desk review (`master` `125bf3c07e`). That pass predates the first pack. ArchLucid scored **74** on the same attribute. SN-PROC-01 through SN-PROC-04 landed in pull requests **#5571** and **#5576**: a product-scoped index, a buyer security brief, a short overlay, and a warn-only checker.

SN-PROC-05 through SN-PROC-09 are the next paper a reviewer can redline: a data-processing schedule, a subprocessors delta, a questionnaire crosswalk, a quote cover with no prices, and an extension of the checker. They do not approve a customer offer, a public price, Marketplace publication, a contractual SLA, a beta GO, or a required CI gate.

Paste one numbered file per session, from [`.cursor/prompts/`](../../.cursor/prompts/).

| ID | Paste file | What moves |
|----|------------|------------|
| **SN-PROC-01** | `securenow-procurement-01-pack-index.md` | `docs/securenow/PROCUREMENT_PACK_INDEX.md` (**shipped**) |
| **SN-PROC-02** | `securenow-procurement-02-security-one-pager.md` | `docs/securenow/BUYER_SECURITY_ONE_PAGER.md` (**shipped**) |
| **SN-PROC-03** | `securenow-procurement-03-response-overlay.md` | `docs/securenow/PROCUREMENT_RESPONSE_OVERLAY.md` (**shipped**) |
| **SN-PROC-04** | `securenow-procurement-04-pack-check.md` | `scripts/ci/check_securenow_procurement_pack.py` and CI (**shipped**) |
| **SN-PROC-05** | `securenow-procurement-05-data-schedule.md` | `docs/securenow/DATA_PROCESSING_SCHEDULE.md` |
| **SN-PROC-06** | `securenow-procurement-06-subprocessors-delta.md` | `docs/securenow/SUBPROCESSORS_DELTA.md` |
| **SN-PROC-07** | `securenow-procurement-07-questionnaire-crosswalk.md` | `docs/securenow/QUESTIONNAIRE_CROSSWALK.md` |
| **SN-PROC-08** | `securenow-procurement-08-quote-cover.md` | `docs/securenow/QUOTE_COVER.md` |
| **SN-PROC-09** | `securenow-procurement-09-pack-check-extend.md` | Extend `scripts/ci/check_securenow_procurement_pack.py` |
| **SN-PROC-HOLD** | `securenow-procurement-hold.md` | Stop list |

Run **SN-PROC-05**, then **06**, then **07**, then **08**, then **09**. They share the SecureNow pack index and the commercial claim scanner. Do not run them in parallel. **SN-PROC-HOLD** is not a build step.
