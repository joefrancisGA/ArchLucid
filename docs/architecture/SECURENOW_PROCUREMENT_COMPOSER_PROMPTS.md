> **Scope:** Paste-ready Composer prompts for a SecureNow procurement evidence pack. Internal engineering only. Do not implement from this index.
> **Paste-ready files:** [`.cursor/prompts/securenow-procurement-00-index.md`](../../.cursor/prompts/securenow-procurement-00-index.md)

# SecureNow procurement readiness — Composer prompts

**Created:** 2026-10-29 · **Status:** Not started. **Audience:** Composer 2.5 slow (`composer-2.5`)

Procurement Readiness scored **38** on the 2026-10-29 47-quality desk review (`master` `125bf3c07e` and later). ArchLucid scored **74** on the same attribute because `docs/go-to-market/PROCUREMENT_PACK_INDEX.md` and the buyer security packet already exist for architecture review. SecureNow has honest internal commercial drafts and a Marketplace **HOLD**. It does not have a product-scoped index a security reviewer can cite.

These prompts add that index, a one-page security brief, a short SIG-style overlay, and a static checker. They do not approve a customer offer, a public price, Marketplace publication, a contractual SLA, or a beta GO.

Paste one numbered file per session, from [`.cursor/prompts/`](../../.cursor/prompts/).

| ID | Paste file | What moves |
|----|------------|------------|
| **SN-PROC-01** | `securenow-procurement-01-pack-index.md` | `docs/securenow/PROCUREMENT_PACK_INDEX.md` |
| **SN-PROC-02** | `securenow-procurement-02-security-one-pager.md` | `docs/securenow/BUYER_SECURITY_ONE_PAGER.md` |
| **SN-PROC-03** | `securenow-procurement-03-response-overlay.md` | `docs/securenow/PROCUREMENT_RESPONSE_OVERLAY.md` |
| **SN-PROC-04** | `securenow-procurement-04-pack-check.md` | `scripts/ci/check_securenow_procurement_pack.py` and CI |
| **SN-PROC-HOLD** | `securenow-procurement-hold.md` | Stop list |

Run **SN-PROC-01** first. **SN-PROC-02** and **SN-PROC-03** may follow in either order after the index exists. Run **SN-PROC-04** last, when the three markdown files are on the branch. **SN-PROC-HOLD** is not a build step.
