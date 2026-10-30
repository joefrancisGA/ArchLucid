> **Scope:** Paste-ready Composer prompts for SecureNow marketability. Internal engineering only. Do not implement from this index.
> **Paste-ready files:** [`.cursor/prompts/securenow-marketability-00-index.md`](../../.cursor/prompts/securenow-marketability-00-index.md)

# SecureNow marketability — Composer prompts

**Created:** 2026-10-29 · **Updated:** 2026-10-30 · **Status:** SN-MKT-01–03 shipped. SN-MKT-04–07 not started. **Audience:** Composer 2.5 slow (`composer-2.5`)

Marketability scored **36** on the 2026-10-29 desk review and **50** after SN-MKT-01–03 landed on trunk. Differentiability is **74**. The first three prompts put the buyer job on the Security section of Home, in an unlisted draft page, and in a fixture storyboard.

The follow-on prompts make that draft render on a SecureNow host without opening the rest of the marketing site, add a forwardable overview with no fees, link it from SecureNow Home, and add a warn-only checker. They do not approve buyer communication, a public price, Marketplace publication, or a beta GO.

Paste one numbered file per session, from [`.cursor/prompts/`](../../.cursor/prompts/).

| ID | Paste file | What moves |
|----|------------|------------|
| **SN-MKT-01** | `securenow-marketability-01-security-section-lead.md` | Security section lead and recommended first row (**shipped**) |
| **SN-MKT-02** | `securenow-marketability-02-why-page-draft.md` | Noindex `/why-securenow` draft (**shipped**) |
| **SN-MKT-03** | `securenow-marketability-03-fixture-storyboard.md` | `docs/securenow/FIXTURE_STORYBOARD.md` (**shipped**) |
| **SN-MKT-04** | `securenow-marketability-04-draft-on-security-shell.md` | Security-shell exception for `/why-securenow` only |
| **SN-MKT-05** | `securenow-marketability-05-buyer-overview.md` | `docs/securenow/BUYER_OVERVIEW.md` |
| **SN-MKT-06** | `securenow-marketability-06-reviewer-home-links.md` | SecureNow Home "For reviewers" |
| **SN-MKT-07** | `securenow-marketability-07-checker.md` | `scripts/ci/check_securenow_marketability.py` and CI |
| **SN-MKT-HOLD** | `securenow-marketability-hold.md` | Stop list |

**SN-MKT-01** through **SN-MKT-03** are on trunk. Do not redo them. Run **SN-MKT-04**, then **05**, then **06**, then **07**. **SN-MKT-HOLD** is not a build step.
