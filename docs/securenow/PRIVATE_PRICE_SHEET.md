> **Scope:** Owner-only record of SecureNow seller, USD posture, tax extra, and payout identity. List prices live in [`PRICING_PHILOSOPHY.md`](../go-to-market/PRICING_PHILOSOPHY.md) §9 — not a customer offer and not permission to invoice.

# SecureNow private quote sheet

> **OWNER APPROVED PRIVATE QUOTE SHEET** (2026-10-29). **QUOTE IDENTITY ONLY.** Fees are published in pricing philosophy §9. Not a customer offer, not a Partner Center plan, not a Stripe Price, and not permission to invoice. SecureNow beta remains **NO_GO**. Live billing stays off.

This sheet records the fee, currency, tax posture, and payout identity the owner approved. Each customer still needs the open gates in [CONTROLLED_PILOT_OFFER.md](CONTROLLED_PILOT_OFFER.md). Marketplace publication stays **HOLD** in [MARKETPLACE_PREPUBLICATION_CONTRACT.md](MARKETPLACE_PREPUBLICATION_CONTRACT.md).

## Fees (USD)

Dollar amounts, meters, and the evaluation-fee credit live only in [`PRICING_PHILOSOPHY.md`](../go-to-market/PRICING_PHILOSOPHY.md) §9 and on the public SKU card and signed-in quote packet. Do not copy them into this sheet. There is no monthly card price. These amounts are tax extra. See tax posture below.

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

A contractual support SLA and service credits. Founder response targets are recorded in [SUPPORT_COMMITMENT.md](SUPPORT_COMMITMENT.md) and are not that SLA. Also still not approved: a data-processing agreement, security assurances, beta release, a Partner Center listing, a Stripe Price, self-serve checkout, and any live webhook or billing toggle.

Reserved ids are names to keep distinct from ArchLucid. They are not Partner Center records.
