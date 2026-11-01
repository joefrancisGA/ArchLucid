> **Scope:** Paste-ready Composer prompts for SecureNow customer self-sufficiency. Internal engineering only. Do not implement from this index.
> **Paste-ready files:** [`.cursor/prompts/securenow-self-00-index.md`](../../.cursor/prompts/securenow-self-00-index.md)

# SecureNow customer self-sufficiency — Composer prompts

**Created:** 2026-10-31 · **Updated:** 2026-11-01 · **Status:** SN-SELF-01–04 shipped on trunk. **Audience:** Composer 2.5 slow (`composer-2.5`)

Customer Self-Sufficiency scored **62** on the 31 October 2026 desk pass (weight 1). `/administration/support` is the ArchLucid support page, and the product-line catalog keeps it on the architecture line. A SecureNow operator who is stuck has `support@archlucid.net` and no ordered checks. SN-SELF-01–04 add a four-situation note, a Home link, an operator page, and a warn-only checker. The implementation is on trunk in commit `73651c71ae`.

They do not open the ArchLucid support bundle on SecureNow, add a mailbox, or turn founder acknowledgement targets into a support SLA.

Paste one numbered file per session, from [`.cursor/prompts/`](../../.cursor/prompts/).

| ID | Paste file | What moves |
|----|------------|------------|
| **SN-SELF-01** | `securenow-self-01-stuck-note.md` | `docs/securenow/SELF_SERVICE.md` (**shipped**) |
| **SN-SELF-02** | `securenow-self-02-home-section.md` | SecureNow Home **When you are stuck** (**shipped**) |
| **SN-SELF-03** | `securenow-self-03-operator-page.md` | `/administration/securenow-self-service` (**shipped**) |
| **SN-SELF-04** | `securenow-self-04-checker.md` | `scripts/ci/check_securenow_self_service.py` and CI (**shipped**) |
| **SN-SELF-HOLD** | `securenow-self-hold.md` | Stop list |

**SN-SELF-01** through **SN-SELF-04** are on trunk. Do not redo them. **SN-SELF-HOLD** is not a build step.

## Human tasks (owner)

These are not Composer sessions. The owner check is **M-315** in [`docs/go-to-market/GTM_BACKLOG.md`](../go-to-market/GTM_BACKLOG.md).

1. Start at SecureNow Home **When you are stuck** and follow the four situations in [`docs/securenow/SELF_SERVICE.md`](../securenow/SELF_SERVICE.md).
2. Record whether each situation lands on the named page: cloud connections, connection status, remediation factory or instances, and the `support@archlucid.net` mailto.
3. Leave `/administration/support` closed. Do not add a mailbox or turn founder acknowledgement into an SLA. Leave beta **NO_GO** in place.
