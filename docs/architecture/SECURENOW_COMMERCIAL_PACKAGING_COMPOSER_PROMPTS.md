> **Scope:** Paste-ready Composer prompts for SecureNow commercial packaging. Internal engineering only. Do not implement from this index.
> **Paste-ready files:** [`.cursor/prompts/securenow-commercial-packaging-00-index.md`](../../.cursor/prompts/securenow-commercial-packaging-00-index.md)

# SecureNow commercial packaging — Composer prompts

**Created:** 2026-11-02 · **Status:** SN-CPKG-01–03 not started. **Audience:** Composer 2.5 slow (`composer-2.5`)

Commercial Packaging Readiness is **67** (weight 2) on the 2 Nov 2026 board. The private quote package already exists as documents: `SKU_METER_CARD.md`, `ORDER_FORM_TEMPLATE.md`, `QUOTE_COVER.md`, `QUOTE_TO_PILOT_CHECKLIST.md`, and `PRIVATE_PRICE_SHEET.md`. Home tells a reviewer to ask the owner for the packet. These prompts put the buyer-safe identifiers and the quote sequence on an operator page. They aim at about **70**. They do not approve an offer.

Paste one numbered file per session, from [`.cursor/prompts/`](../../.cursor/prompts/).

| ID | Paste file | What moves |
|----|------------|------------|
| **SN-CPKG-01** | `securenow-commercial-packaging-01-operator-page.md` | `/administration/securenow-quote-packet` |
| **SN-CPKG-02** | `securenow-commercial-packaging-02-home-row.md` | Home **For reviewers** row **Quote packet** |
| **SN-CPKG-03** | `securenow-commercial-packaging-03-checker.md` | Fee-free check of the new page and the public hold sentence |
| **SN-CPKG-HOLD** | `securenow-commercial-packaging-hold.md` | Stop list |

## Human tasks

These prompts do not perform the owner work. The paid close is already **M-95** / **G-COMMERCE-02**. Do not open a second paid-close row.

| Row | What stays with the owner |
|-----|---------------------------|
| **M-316** | Record `APPROVE_PUBLIC_LINKS` or `KEEP_OWNER_HELD` before `/why-securenow` links the procurement index, the quote cover, or the controlled pilot proposal. |
| **M-317** | One private practice quote, kept out of git. Record `SEND`, `HOLD`, or `DEFERRED_SCOPE`. |
| **M-318** | Walk the 22-row beta evidence matrix. This is a release gate. It does not move Commercial Packaging Readiness. |

## Stop

No fee amount, public list price, Stripe price, or Marketplace publication. No copy of `PRIVATE_PRICE_SHEET.md` into the UI. No beta GO. No filled customer order in source. No hidden review-workspace tabs.
