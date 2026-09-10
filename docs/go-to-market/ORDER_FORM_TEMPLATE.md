> **Reviewed:** 2026-09-07

> **Scope:** ArchLucid — Subscription order form (template) - full detail, tables, and links in the sections below.

> **Spine doc:** [`START_HERE.md`](../START_HERE.md).


# ArchLucid — Subscription order form (template)

**Important — not legal advice:** This is a **working template** to reduce friction for SMB-midmarket deals (< $50K ARR). It **does not** constitute legal advice. **Qualified legal counsel** must review and adapt it before use.

**Last reviewed:** 2026-09-07 (**M-305** profit re-rate — verify totals against [PRICING_PHILOSOPHY.md §5](PRICING_PHILOSOPHY.md) before signing)

**What this form is:** SaaS **subscription** (Team / Professional / Enterprise). It is **not** the service SOW for a paid review package.

**Service / pilot first?** Use the named SKUs and private SOW in [`QUOTE_TO_PROOF_PACKET.md#productized-service-offers`](QUOTE_TO_PROOF_PACKET.md#productized-service-offers) / [`#private-quote--sow-template`](QUOTE_TO_PROOF_PACKET.md#private-quote--sow-template). Draft packages: [`QUOTE_TO_PROOF_PACKET.md#paid-pilot-offers-draft`](QUOTE_TO_PROOF_PACKET.md#paid-pilot-offers-draft) (`PAID_PILOT_OFFERS.md` alias — **M-22** / **M-23**). After the engagement, convert with **Addendum D** below (**M-34**).

**Pricing source:** All current list prices (platform fee, seat price, run overage, pilot fee) are in [PRICING_PHILOSOPHY.md §5](PRICING_PHILOSOPHY.md). The worked examples in this document compute totals from those locked prices — the numbers are derived here for convenience, but the prices themselves live only in that file. The CI guard `scripts/ci/check_pricing_single_source.py` allows price literals in this file.

---

## 1. Parties

| Role | Detail |
|------|--------|
| **Customer** | Legal entity: __________________ |
| | Contact name: __________________ |
| | Email: __________________ |
| | Billing address: __________________ |
| **Vendor** | [ArchLucid vendor legal entity] |

---

## 2. Subscription details

| Field | Value |
|-------|-------|
| **Tier** | ☐ Team  ☐ Professional  ☐ Enterprise (see [PRICING_PHILOSOPHY.md](PRICING_PHILOSOPHY.md)) |
| **Named architect seats** | _______ |
| **Workspaces** | _______ |
| **Included runs / month** | Per tier (see [PRICING_PHILOSOPHY.md §5](PRICING_PHILOSOPHY.md)) |
| **Subscription term** | ☐ Monthly  ☐ Annual (annual = 2 months free; see §A — Annual prepay below) |
| **Start date** | __________________ |
| **Monthly platform fee** | See [PRICING_PHILOSOPHY.md §5](PRICING_PHILOSOPHY.md). Fill in: $_______ / workspace / month |
| **Monthly seat fee** | See [PRICING_PHILOSOPHY.md §5](PRICING_PHILOSOPHY.md). Fill in: $_______ × _______ seats = $_______ / month |
| **Architecture-package overage rate** | See [PRICING_PHILOSOPHY.md §5](PRICING_PHILOSOPHY.md). Fill in: $_______ / architecture package (applicable when monthly packages exceed tier allowance) |
| **Hosted LLM spend (Enterprise)** | ☐ N/A (Team / Professional use the published §3.3 band)  ☐ Schedule attached: included $_______ / UTC month; hard stop $_______ ; wallet ☐ on ☐ off |
| **Total monthly** | $_______ (bundle or platform + seats; excluding package overage — see §3) |
| **Renewal** | Auto-renew unless either party provides **30 days'** written notice before term end |

---

## 3. Architecture-package overage

Package overage is charged when the Customer's monthly committed architecture-package count exceeds the included allowance for the subscribed tier. Packages are counted per committed architecture run (a call to `POST /v1/architecture/review/{runId}/finalize`). Development and simulator runs that do not reach commit are not counted.

| Field | Value |
|-------|-------|
| **Included packages / month** | Per tier — see [PRICING_PHILOSOPHY.md §5](PRICING_PHILOSOPHY.md) |
| **Overage rate** | Per [PRICING_PHILOSOPHY.md §5](PRICING_PHILOSOPHY.md): $25/package (Team) or $20/package (Professional). Architect is $30/package. |
| **Billing cycle** | Monthly in arrears; Vendor invoices overage on the following month's invoice |
| **Overage cap** | ☐ None (default)  ☐ Customer cap at: _______ packages/month (service paused above cap until next billing period) |
| **Estimated monthly overage** | $_______ (if applicable) |

### Package overage worked example — Professional at 150 % of included allowance

Professional includes 100 architecture packages per month (see [PRICING_PHILOSOPHY.md §5](PRICING_PHILOSOPHY.md)).

```
Actual packages this month    = 150
Included packages             = 100
Overage packages              = 50
Overage charge                = 50 × $20 = $1,000
```

Monthly total for this period = regular monthly fee + $1,000 overage. The overage rate is drawn from [PRICING_PHILOSOPHY.md §5](PRICING_PHILOSOPHY.md) — confirm the current rate before quoting.

### Discount stacking and pilot credit (M-305)

Quote-time discounts follow [PRICING_PHILOSOPHY.md §4.3](PRICING_PHILOSOPHY.md#43-discount-stacking-and-floors-m-305):

- Design partner **or** published-reference 15% — never both.
- Combined quote-time discounts must not take the effective monthly price below **50% of locked list**.
- Guided-pilot $15,000 credit applies only when conversion is signed within **90 days** of pilot end.
- Trust concession is already in Professional / Enterprise list; do not take a second 25% off those lists.

---

## 4. Worked pricing examples

All prices are computed from [PRICING_PHILOSOPHY.md §5](PRICING_PHILOSOPHY.md). Verify that the locked prices have not been superseded by a re-rate gate decision before submitting an order form.

### Example A — Team tier, 3 seats, 1 workspace, monthly billing

| Component | Calculation | Amount |
|-----------|------------|--------|
| Platform fee | 1 workspace × (from [PRICING_PHILOSOPHY.md §5](PRICING_PHILOSOPHY.md)) | $339 / month |
| Seat fee | 3 seats × (from [PRICING_PHILOSOPHY.md §5](PRICING_PHILOSOPHY.md)) | $633 / month |
| Included packages | 20 / month included | — |
| **Monthly total** | | **$972 / month** |
| **Annual total (monthly billing)** | $972 × 12 | $11,664 / year |
| **Annual total (prepay, 2 months free)** | $972 × 10 | $9,720 / year |

### Example B — Professional tier, 8 seats, 1 workspace, monthly billing

| Component | Calculation | Amount |
|-----------|------------|--------|
| Public bundle | 10 seats + 1 workspace included (8-seat teams pay the bundle) | $2,299 / month |
| Included packages | 100 / month included | — |
| **Monthly total** | | **$2,299 / month** |
| **Annual total (monthly billing)** | $2,299 × 12 | $27,588 / year |
| **Annual total (prepay, 2 months free)** | $2,299 × 10 | $22,990 / year |

### Example C — Enterprise tier, 50 seats, 3 workspaces, custom audit retention, annual contract

Enterprise pricing is a custom annual contract with a floor and range defined in [PRICING_PHILOSOPHY.md §5](PRICING_PHILOSOPHY.md). This example illustrates a representative mid-range Enterprise deal; actual pricing requires a commercial proposal.

| Component | Notes | Representative amount |
|-----------|-------|----------------------|
| Annual contract | 50 named seats, 3 workspaces, unlimited runs (fair-use soft cap per [PRICING_PHILOSOPHY.md §5](PRICING_PHILOSOPHY.md)) | From [PRICING_PHILOSOPHY.md §5](PRICING_PHILOSOPHY.md) land range |
| Custom audit retention | Extended retention + cold-tier export per [`AUDIT_RETENTION_EXTENSION.md`](../library/AUDIT_RETENTION_EXTENSION.md) | TBD at contract |
| Custom policy packs | Authoring engagement — see [Addendum C](#addendum-c--custom-policy-pack-authoring-professional-services) and [PRICING_PHILOSOPHY.md §4.2](PRICING_PHILOSOPHY.md#42-custom-policy-pack-authoring-professional-services) | Per selected SKU |
| Dedicated CSM | Included in Enterprise tier | Included |
| Hosted LLM spend schedule | Required attachment — fair-use package cap does not include unlimited AOAI ([PRICING_PHILOSOPHY.md §3.3](PRICING_PHILOSOPHY.md#33-hosted-llm-spend-schedule-tier-scaled)) | Fill included USD, hard stop, wallet rules |
| **Representative annual range** | | $120,000–$180,000 / year |

*Representative range above is illustrative for a 50-seat / 3-workspace deal within the Enterprise land range in [PRICING_PHILOSOPHY.md §5](PRICING_PHILOSOPHY.md). Final pricing is determined by commercial proposal.*

### Architecture-package overage example at 150% of included allowance (Professional)

See §3 above. At 150 architecture packages in a month vs 100 included: 50 × $20 overage rate (from [PRICING_PHILOSOPHY.md §5](PRICING_PHILOSOPHY.md)) = $1,000 additional charge that month.

---

## 5. Annual prepay terms

| Field | Value |
|-------|-------|
| **Discount** | 2 months free (equivalent to ~16.7% off monthly rate) |
| **Payment** | Annual invoice due **Net 30** from contract start date |
| **Refund on cancellation** | Pro-rata refund of remaining unused months if Vendor terminates; no refund for Customer-initiated early cancellation unless agreed in writing |
| **Annual total** | $_______ (10 months × monthly rate, per §4 example applicable to Customer's tier) |

---

## 6. Incorporated terms

By signing this order form, Customer agrees to the following (each incorporated by reference):

| Document | Location |
|----------|----------|
| **Master Service Agreement** | [MSA_TEMPLATE.md](MSA_TEMPLATE.md) |
| **Data Processing Agreement** | [DPA_TEMPLATE.md](DPA_TEMPLATE.md) |
| **Service Level Objectives** | [SLA_SUMMARY.md](SLA_SUMMARY.md) |
| **Support and professional services** | [SUPPORT_POLICY.md](SUPPORT_POLICY.md) |
| **Acceptable Use Policy** | [TBD — URL] |
| **Subprocessors** | [SUBPROCESSORS.md](SUBPROCESSORS.md) |

In the event of conflict, the order of precedence is: this Order Form > DPA > Terms of Service > SLA > AUP.

---

## 7. Payment terms

| Term | Detail |
|------|--------|
| **Invoicing** | Vendor invoices Customer at the start of each billing period (monthly or annually), plus any run overage from the prior period |
| **Payment due** | **Net 30** days from invoice date |
| **Accepted methods** | Bank transfer, credit card (if billing system supports) |
| **Late payment** | Vendor may suspend access after **15 days** past due with **10 days'** written notice |
| **Taxes** | Prices exclude applicable taxes; Customer is responsible for taxes unless tax-exempt documentation is provided |

---

## 8. Termination and data

| Event | Handling |
|-------|---------|
| **Customer termination** | 30 days' written notice; access continues through paid period |
| **Vendor termination** | 30 days' written notice; pro-rata refund of prepaid unused term |
| **Data export** | Customer may export data via product features (DOCX, ZIP, audit CSV, API) before termination |
| **Data deletion** | Per [DPA](DPA_TEMPLATE.md) §9 — deletion within agreed timeline after termination, except where law requires retention |

---

## 9. Chargeback, refund, and dunning

### Chargeback

A **chargeback** is a bank-initiated dispute after the card network’s rules-based window opens for the cardholder. Vendor may submit an **evidence package** (invoices, delivery logs, contract acceptance) through Stripe’s dispute flow. **Liability** follows the card network outcome: if the dispute is upheld, the charge is reversed and network fees may apply; if Vendor wins, funds are released per Stripe settlement timing.

### Refund

**Refunds** follow the tier and term rules in **§5** (annual prepay): Vendor provides a **pro-rata refund of prepaid unused months** when Vendor terminates; there is **no Customer-initiated early-cancellation refund** unless **agreed in writing** in the order form or a signed amendment. Monthly billing refunds (if any) are handled case-by-case under the same written-agreement rule — do not imply automatic refunds in quotes without legal review.

### Dunning

**Dunning** for card failures uses **Stripe smart retries** by default unless Customer is on invoice-only terms. After repeated failure, access may align with **§7** — Vendor may suspend after **15 days past due** following **10 days’** written notice, consistent with the late-payment row in §7.

---

## Addendum A — Annual prepay schedule

*(Complete if Customer selects annual billing in §2)*

| Field | Value |
|-------|-------|
| **Annual amount** | $_______ (from §5 above) |
| **Invoice date** | __________________ |
| **Payment due** | 30 days from invoice date |
| **Auto-renew** | ☐ Yes  ☐ No — if No, confirm renewal intent **60 days** before term end |

---

## Addendum B — Design partner agreement

*(Complete only if Customer qualifies as a Design Partner — confirm slot availability with sales before signing; limited to first 3 customers)*

**Design partner discount:** 50% off Professional list price for 12 months from contract start. Discount applies to the public bundle, add-on seats, and add-on workspaces. Architecture-package overage is charged at the standard Professional rate (see [PRICING_PHILOSOPHY.md §5](PRICING_PHILOSOPHY.md)). **Mutually exclusive** with the §4.1 published-reference 15% discount — do not stack. This 50% term sits on the §4.3 aggregate floor; do not add further percentage off.

**Customer deliverables (both required for discount to apply):**

| Deliverable | Description | Due date |
|-------------|-------------|----------|
| **Published case study** | Minimum 500-word written case study with organization name, use case, and quantified outcome. Co-authored with ArchLucid; approved by Customer before publication. | Within 90 days of completing the 6-week pilot |
| **Quarterly reference call** | Up to 1 hour per quarter; Customer speaks with an ArchLucid prospect about their experience. Schedule coordinated by ArchLucid CSM. | Once per calendar quarter for the 12-month term |

**Discount table (all values computed from [PRICING_PHILOSOPHY.md §5](PRICING_PHILOSOPHY.md) — verify current list before quoting):**

| Tier | Standard monthly | Design partner monthly (50% off) |
|------|-----------------|-----------------------------------|
| Professional, 8 seats, 1 workspace | $2,299 | $1,149.50 |
| Professional, 15 seats, 2 workspaces | $2,299 + (5 × $215) + $1,079 = $4,453 | $2,226.50 |

*These rows are computed from prices in [PRICING_PHILOSOPHY.md §5](PRICING_PHILOSOPHY.md). If prices have been re-rated, recompute before signing.*

**Forfeiture:** If Customer does not deliver both case study and reference call within the 12-month term, the 50% discount is forfeited for the renewal period. Discount applied to prior months is not clawed back.

**Slot confirmation:** Sales must confirm in writing that a Design Partner slot is available. Maximum 3 simultaneous Design Partner agreements.

| Field | Value |
|-------|-------|
| **Design partner slot confirmed by** | __________________ (ArchLucid sales rep) |
| **Confirmation date** | __________________ |
| **Discount term start** | __________________ |
| **Discount term end** | __________________ (12 months from start) |

---

## Addendum C — Custom Policy Pack Authoring (professional services)

*(Complete only when Customer purchases custom policy pack authoring — prices from [PRICING_PHILOSOPHY.md §4.2 and §5.2](PRICING_PHILOSOPHY.md#42-custom-policy-pack-authoring-professional-services))*

| Field | Value |
|-------|-------|
| **SKU** | ☐ Custom Pack — Starter  ☐ Custom Pack — Standard  ☐ Custom Pack — Program |
| **IP tier** | ☐ Customer-exclusive  ☐ ArchLucid-owned (shared) |
| **One-time authoring fee** | $_______ (from [PRICING_PHILOSOPHY.md §5.2](PRICING_PHILOSOPHY.md#52-locked-price-table-do-not-edit-without-re-rate-gate-decision)) |
| **Delivery window** | Per SKU table in §4.2 |
| **Post-delivery support** | Per SKU table in §4.2 |
| **Annual maintenance** | ☐ None  ☐ 20% of authoring fee (see §4.2)  ☐ Bundled in Enterprise ARR ≥ $150,000 |
| **SoW reference** | [CUSTOM_POLICY_PACK_AUTHORING_SOW_TEMPLATE.md](CUSTOM_POLICY_PACK_AUTHORING_SOW_TEMPLATE.md) |

**Worked example — Standard SKU, ArchLucid-owned (shared):**

| Line item | Amount |
|-----------|--------|
| Custom Pack — Standard (ArchLucid-owned) | $25,000 |
| **Total PS (one-time)** | **$25,000** |

*Figure from [PRICING_PHILOSOPHY.md §5.2](PRICING_PHILOSOPHY.md#52-locked-price-table-do-not-edit-without-re-rate-gate-decision). SaaS subscription fees in §2–§4 are separate.*

---

## Addendum D — Conversion from named service SKU (M-34)

*(Complete when this subscription follows a paid service engagement. Service fees are invoiced under the SOW; this order form starts the SaaS term.)*

| Field | Value |
|-------|-------|
| **Prior SOW / quote ID** | __________________ |
| **Prior engagement** | ☐ Option A — architecture review package ([`QUOTE_TO_PROOF_PACKET.md#paid-pilot-offers-draft`](QUOTE_TO_PROOF_PACKET.md#paid-pilot-offers-draft))  ☐ Option B — 30–60 day pilot (same)  ☐ Other: __________________ |
| **Named SKU delivered** | ☐ ArchLucid AI & Cloud Architecture Readiness Review  ☐ ArchLucid Evidence Pack  ☐ ArchLucid Architecture Board / ARB Report  ☐ ArchLucid Cloud Governance Review (Azure-first) |
| **Commercial closeout** | ☐ SEND  ☐ HOLD  ☐ DEFERRED_SCOPE (per [`QUOTE_TO_PROOF_PACKET.md#commercial-conversion-checklist`](QUOTE_TO_PROOF_PACKET.md#commercial-conversion-checklist)) |
| **Pilot / service fee credit** | ☐ None  ☐ Credited $_______ against first annual invoice (guided-pilot credit per [PRICING_PHILOSOPHY.md §4](PRICING_PHILOSOPHY.md) — confirm amount before signing) |
| **Subscription start** | Aligns with §2 Start date (typically on or after SOW acceptance) |

**Talk-track lock:** Buyer purchased the **named SKU** above; this form sells **Team / Professional / Enterprise** seats and platform — not a second unnamed “platform package.”

---

## 10. Signature

| | Customer | Vendor |
|--|----------|--------|
| **Name** | | |
| **Title** | | |
| **Date** | | |

---

## Related documents

| Doc | Use |
|-----|-----|
| [MSA_TEMPLATE.md](MSA_TEMPLATE.md) | Master Service Agreement (this Order Form is governed by the MSA) |
| [PRICING_PHILOSOPHY.md](PRICING_PHILOSOPHY.md) | **Single source of truth** for all list prices, pilot pricing, re-rate gates, and sensitivity playbook |
| [QUOTE_TO_PROOF_PACKET.md#paid-pilot-offers-draft](QUOTE_TO_PROOF_PACKET.md#paid-pilot-offers-draft) · [PAID_PILOT_OFFERS.md](PAID_PILOT_OFFERS.md) (alias) | Draft Option A/B paid packages + SKU outreach talk track (**M-22** / **M-23** / **M-34**) |
| [QUOTE_TO_PROOF_PACKET.md#productized-service-offers](QUOTE_TO_PROOF_PACKET.md#productized-service-offers) | Canonical service SKU menu + private SOW |
| [DPA_TEMPLATE.md](DPA_TEMPLATE.md) | Data processing terms |
| [SLA_SUMMARY.md](SLA_SUMMARY.md) | Service level objectives |
| [trust-center.md](trust-center.md) | Trust index |
| [ROI_MODEL.md](ROI_MODEL.md) | Value model and payback analysis for the buyer |
| [PILOT_SUCCESS_SCORECARD.md](PILOT_SUCCESS_SCORECARD.md) | Success criteria for the guided pilot |
