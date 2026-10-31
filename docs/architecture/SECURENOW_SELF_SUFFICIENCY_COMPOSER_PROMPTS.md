> **Scope:** Paste-ready Composer prompts for SecureNow customer self-sufficiency. Internal engineering only. Do not implement from this index.
> **Paste-ready files:** [`.cursor/prompts/securenow-self-00-index.md`](../../.cursor/prompts/securenow-self-00-index.md)

# SecureNow customer self-sufficiency — Composer prompts

**Created:** 2026-10-31 · **Status:** Not started. **Audience:** Composer 2.5 slow (`composer-2.5`)

Customer Self-Sufficiency scored **62** on the 31 October 2026 desk pass (weight 1). `/administration/support` is the ArchLucid support page, and the product-line catalog keeps it on the architecture line. A SecureNow operator who is stuck has `support@archlucid.net` and no ordered checks. These prompts add a four-situation note, a Home link, an operator page, and a warn-only checker.

They do not open the ArchLucid support bundle on SecureNow, add a mailbox, or turn founder acknowledgement targets into a support SLA.

Paste one numbered file per session, from [`.cursor/prompts/`](../../.cursor/prompts/).

| ID | Paste file | What moves |
|----|------------|------------|
| **SN-SELF-01** | `securenow-self-01-stuck-note.md` | `docs/securenow/SELF_SERVICE.md` |
| **SN-SELF-02** | `securenow-self-02-home-section.md` | SecureNow Home **When you are stuck** |
| **SN-SELF-03** | `securenow-self-03-operator-page.md` | `/administration/securenow-self-service` |
| **SN-SELF-04** | `securenow-self-04-checker.md` | `scripts/ci/check_securenow_self_service.py` and CI |
| **SN-SELF-HOLD** | `securenow-self-hold.md` | Stop list |

Run **SN-SELF-01**, then **02**, then **03**, then **04**. **SN-SELF-HOLD** is not a build step.
