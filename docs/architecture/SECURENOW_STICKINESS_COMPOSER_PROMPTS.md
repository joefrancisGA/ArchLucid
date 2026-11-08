> **Scope:** Paste-ready Composer prompts for SecureNow stickiness. Internal engineering only. Do not implement from this index.
> **Paste-ready files:** [`.cursor/prompts/securenow-stickiness-00-index.md`](../../.cursor/prompts/securenow-stickiness-00-index.md)

# SecureNow stickiness — Composer prompts

**Created:** 2026-10-31 · **Status:** Not started. **Audience:** Composer 2.5 slow (`composer-2.5`)

Stickiness scored **58** on the 31 October 2026 SecureNow desk pass (weight 1). The product already has later-capture verification, snapshot drift, open diagram questions, and a human pilot-decision page. An operator can finish a review and have no named reason to come back. These prompts name those four return reasons, surface them on SecureNow Home, add an operator preparation page, and add a warn-only checker.

They do not add email, a digest, a streak, an engagement score, a new notification service, or a claim that a customer returned.

Paste one numbered file per session, from [`.cursor/prompts/`](../../.cursor/prompts/).

| ID | Paste file | What moves |
|----|------------|------------|
| **SN-STICK-01** | `securenow-stickiness-01-return-reasons.md` | `docs/securenow/RETURN_REASONS.md` |
| **SN-STICK-02** | `securenow-stickiness-02-home-section.md` | SecureNow Home "Come back for" section |
| **SN-STICK-03** | `securenow-stickiness-03-operator-page.md` | `/administration/securenow-return-reasons` |
| **SN-STICK-04** | `securenow-stickiness-04-checker.md` | `scripts/ci/check_securenow_stickiness.py` and CI |
| **SN-STICK-HOLD** | `securenow-stickiness-hold.md` | Stop list |

Run **SN-STICK-01**, then **02**, then **03**, then **04**. **SN-STICK-HOLD** is not a build step.
