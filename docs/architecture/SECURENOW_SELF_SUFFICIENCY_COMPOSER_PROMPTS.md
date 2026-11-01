> **Scope:** Paste-ready Composer prompts for SecureNow customer self-sufficiency. Internal engineering only. Do not implement from this index.
> **Paste-ready files:** [`.cursor/prompts/securenow-self-00-index.md`](../../.cursor/prompts/securenow-self-00-index.md)

# SecureNow customer self-sufficiency — Composer prompts

**Created:** 2026-10-31 · **Updated:** 2026-11-01 · **Status:** SN-SELF-01–04 shipped. SN-SELF-05–08 are the follow-on. **Audience:** Composer 2.5 slow (`composer-2.5`)

Customer Self-Sufficiency is **66** (weight 1). SN-SELF-01–04 shipped a four-situation note, a Home link, an operator page, and a warn-only checker in commit `73651c71ae`. SN-SELF-05–08 add anchors, Home rows to those anchors, a second link on the ranking check, and a checker extension. They do not open the ArchLucid support bundle on SecureNow, add a mailbox, or turn founder acknowledgement into a support SLA. The owner check is **M-315**.

Paste one numbered file per session, from [`.cursor/prompts/`](../../.cursor/prompts/).

| ID | Paste file | What moves |
|----|------------|------------|
| **SN-SELF-01** | `securenow-self-01-stuck-note.md` | `docs/securenow/SELF_SERVICE.md` (**shipped**) |
| **SN-SELF-02** | `securenow-self-02-home-section.md` | SecureNow Home **When you are stuck** (**shipped**) |
| **SN-SELF-03** | `securenow-self-03-operator-page.md` | `/administration/securenow-self-service` (**shipped**) |
| **SN-SELF-04** | `securenow-self-04-checker.md` | `scripts/ci/check_securenow_self_service.py` and CI (**shipped**) |
| **SN-SELF-05** | `securenow-self-05-anchors.md` | Anchors `#collection`, `#connector`, `#ranking`, `#email` |
| **SN-SELF-06** | `securenow-self-06-home-rows.md` | Four Home rows, none recommended first |
| **SN-SELF-07** | `securenow-self-07-second-link.md` | Ranking check links the factory and the tracker |
| **SN-SELF-08** | `securenow-self-08-checker.md` | Checker extension |
| **SN-SELF-HOLD** | `securenow-self-hold.md` | Stop list |

**SN-SELF-01** through **SN-SELF-04** are on trunk. Do not redo them. Run **SN-SELF-05**, then **06**, then **07**, then **08**. **SN-SELF-HOLD** is not a build step.

## Human tasks (owner)

These are not Composer sessions. The owner check is **M-315** in [`docs/go-to-market/GTM_BACKLOG.md`](../go-to-market/GTM_BACKLOG.md).

1. Start at SecureNow Home **When you are stuck** and follow the four situations.
2. Record whether each situation lands on the named page.
3. Leave `/administration/support` closed. Do not add a mailbox or an SLA. Leave beta **NO_GO** in place.
