> **Scope:** Owner-only record of the approved SecureNow private quote: fees, USD, tax extra, and payout identity. Not a public list price, not a customer offer, and not permission to invoice.

# SecureNow private quote sheet

> **OWNER APPROVED PRIVATE QUOTE SHEET** (2026-10-29). **NOT A PUBLIC LIST PRICE.** Not a customer offer, not a Partner Center plan, not a Stripe Price, and not permission to invoice. SecureNow beta remains **NO_GO**. Live billing stays off.

This sheet records the fee, currency, tax posture, and payout identity the owner approved. Each customer still needs the open gates in [CONTROLLED_PILOT_OFFER.md](CONTROLLED_PILOT_OFFER.md). Marketplace publication stays **HOLD** in [MARKETPLACE_PREPUBLICATION_CONTRACT.md](MARKETPLACE_PREPUBLICATION_CONTRACT.md).

## Fees (USD)

| ID | What it sells | Price | Meter |
| --- | --- | --- | --- |
| **SN-EVAL** | 45-day controlled evaluation | **$8,000** once | Up to **2** Azure subscriptions and **4** successful snapshots. Reader-only. The customer makes any change outside SecureNow. |
| **SN-ANNUAL** | One-year subscription evidence | **$24,000** per year, billed annually in advance | **3** Azure subscriptions, **24** successful snapshots in the year, **5** named operators. Included contact channel is business-hours email under [SUPPORT_COMMITMENT.md](SUPPORT_COMMITMENT.md). That channel is an acknowledgement target, not a support SLA. |
| **SN-SUB-ADD** | One more subscription on an annual term | **$6,000** per year | Cap **10** subscriptions on this sheet. An 11th subscription is a custom order, not this row. |
| **SN-SNAP-4** | Extra captures | **$1,500** prepaid | **4** successful snapshots. Unused balance expires at the end of that annual term. |

The **$8,000** evaluation fee is credited in full against **SN-ANNUAL** only when the annual order is signed within **90 days** after the evaluation ends. It is not credited against any ArchLucid SKU. There is no monthly card price.

These amounts are tax extra. See tax posture below.

## Currency

**USD** only. Do not quote another currency from this sheet.

## Tax posture

Prices exclude sales tax. The invoice states that sales tax will be added if the seller has a duty to collect it for that customer. Do not print a rate, and do not print a tax amount of zero as if a determination had been made. A CPA still has to decide nexus and whether this service is taxable in the buyer’s jurisdiction.

If a Marketplace charge is ever collected later, Microsoft’s tax calculation on that charge is the tax for that charge. Do not also invoice sales tax on the same charge. No Marketplace charge is authorized by this sheet.

## Payout identity

| Field | Approved value |
| --- | --- |
| Seller of record | **Joseph Francis (Sole Proprietorship)** |
| Name on a future invoice or W-9 | Joseph Francis (Sole Proprietorship) |
| Publisher display name, if a listing is created later | **SecureNow** |
| Reserved offer id (not registered) | `securenow-azure-evidence` |
| Reserved plan ids (not registered) | `sn-eval`, `sn-annual` |
| Payout bank | The sole proprietorship’s existing Partner Center payout profile. No second bank profile for SecureNow. |
| ArchLucid offer | Must be a different id. An ArchLucid Team, Professional, or Enterprise payment does not grant SecureNow. |

**Francis Architecture, LLC** is not the seller on this sheet. It becomes the seller only after the LLC commercial cutover is recorded as done. Do not invent an EIN or a bank account here.

## Still not approved

A contractual support SLA and service credits. Founder response targets are recorded in [SUPPORT_COMMITMENT.md](SUPPORT_COMMITMENT.md) and are not that SLA. Also still not approved: a data-processing agreement, security assurances, beta release, a Partner Center listing, a Stripe Price, a public pricing page, and any live webhook or billing toggle.

Reserved ids are names to keep distinct from ArchLucid. They are not Partner Center records.
