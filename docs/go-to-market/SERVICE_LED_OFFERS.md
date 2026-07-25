> **Reviewed:** 2026-07-25

> **Scope:** Internal productized consulting and service-SKU definitions for founder-led revenue — named offers, indicative bands, and deliverables; not a public price list until published on the marketing site and aligned with `PRICING_PHILOSOPHY.md`.

> **Spine doc:** [`START_HERE.md`](../START_HERE.md).

# ArchLucid — productized service offers (founder-led)

**Audience:** Founder, sales-led pilot owners, and boutique consultants using ArchLucid as **delivery infrastructure** for client-facing architecture reviews.

**Last reviewed:** 2026-07-25

**Purpose:** V1 already ships **Architecture Review Report** export (DOCX/PDF), **consultant whitelabel**, **bulk evidence attach**, **default policy packs**, and **curated demo workspaces**. This document names **buyable SKUs** so GTM leads with **relief from pain** and a **defensible report**, not a platform feature tour.

**Related:** [`GTM_BACKLOG.md`](GTM_BACKLOG.md) (tasks M-22–M-28, M-34), [`ORDER_FORM_TEMPLATE.md`](ORDER_FORM_TEMPLATE.md), [`SERVICE_LED_SOW_QUOTE_TEMPLATE.md`](SERVICE_LED_SOW_QUOTE_TEMPLATE.md), [`POSITIONING.md`](POSITIONING.md), [`PRICING_PHILOSOPHY.md`](PRICING_PHILOSOPHY.md) (public pricing posture; **Marketing alignment Q8** companion).

---

## Positioning guardrails

- **Primary wedge:** Evidence-backed **architecture review** for AI/cloud-era systems — not a replacement for enterprise GRC registries.
- **Avoid headline-only “AI governance platform”** — frames a crowded category; prefer **architecture evidence, review, and report** (packs may still map to NIST AI RMF / EU AI Act as *evidence for review*, not certification).
- **Stripe live / Marketplace self-serve** remains **`V1.1`** per [`V1_SCOPE.md`](../library/V1_SCOPE.md) and [`V1_DEFERRED.md`](../library/V1_DEFERRED.md) §6b; **service revenue does not depend** on those rails.

---

## Named offers (SKU menu)

Use these names in landing copy, Upwork, SOWs, and outreach so buyers purchase a **package**, not “ArchLucid” as an abstract platform.

| SKU | Buyer / use | Core deliverables (typical) | Indicative band (USD) |
|-----|-------------|-----------------------------|------------------------|
| **ArchLucid AI & Cloud Architecture Readiness Review** | Mid-market CTO, fractional CTO, cloud consultant, regulated startup needing credibility | Executive summary; architecture evidence inventory; decision register; risk register; policy/finding summary; recommended actions; final **Architecture Review Report** (DOCX/PDF, whitelabel as needed) | **$1,500–$3,000** lightweight scope · **$5,000–$10,000** standard · multi-system / team pilot — upper bands per [PRICING_PHILOSOPHY.md](PRICING_PHILOSOPHY.md) **section 5** |
| **ArchLucid Evidence Pack** | Team with scattered artifacts; needs one structured dossier before a board or ARB | Curated evidence set in-workbench + export bundle aligned to review narrative; gap list | Scope by effort — often bundled **inside** Readiness Review |
| **ArchLucid Architecture Board / ARB Report** | Sponsor needs a single executive- or ARB-ready artifact | Short cycle focused on **report** sections and traceability appendix; whitelabel firm/client branding | Typically **upper half** of Readiness Review band |
| **ArchLucid Cloud Governance Review (Azure-first)** | Azure-heavy estate; cost + security baseline narrative | Customer **`Get-ArchLucidAzurePackage.ps1`** ZIP ingest where applicable; security-baseline + cost-oriented findings; report | Align with **Azure Architecture Readiness** Upwork listing in [`GTM_BACKLOG.md`](GTM_BACKLOG.md) M-25 |

**Note:** Indicative bands are planning defaults for **founder-led / consulting-enabled** motion. **[PRICING_PHILOSOPHY.md](PRICING_PHILOSOPHY.md)** (**Marketing alignment Q7**) still applies: **no public paid-pilot $ band on the landing page** in the first 90 days — use **walkthrough → qualify → quote** and private SOWs.

---

## Readiness Review engagement pack (TB-133)

Owner-reviewable before customer send. Not a legal order form. Primary motion aligns with [`PRICING_PHILOSOPHY.md`](PRICING_PHILOSOPHY.md) and [`FIRST_PILOT_OPERATOR_PATH.md`](../runbooks/FIRST_PILOT_OPERATOR_PATH.md).

### One-page offer

ArchLucid delivers a **time-boxed architecture review** that produces a **committed, sponsor-safe proof package** on Azure workloads. The engagement uses the ArchLucid proof engine (agents + governance policy packs + audit trail) with explicit **non-certification** boundaries.

### Buyer prerequisites

- Azure architecture evidence (topology, identity, data flows) the buyer may share under contract
- Executive sponsor and technical lead for a 30-minute findings review
- Agreement that outputs are **architecture-review evidence**, not regulator attestation

### Week 1 / week 2 outcomes

| Week | Buyer-visible outcomes |
| --- | --- |
| **Week 1** | Scoped architecture request, first finalized review, limitations + execution mode labeled |
| **Week 2** | Sponsor proof packet, governance summary, quote-to-proof readiness checklist, commercial closeout next step |

### Proof outputs (from platform)

- Finalized architecture package and `pilot proof-packet` folder
- `governance-outcome-summary`, `audit-evidence-summary`, `policy-pack-freshness`
- `quote-to-proof-readiness` and `commercial-closeout` artifacts
- Optional: procurement deal-ready classification when buyer procurement is in scope

### Exclusions (do not promise)

- SOC 2 CPA attestation, third-party pen-test publication, public reference logo
- Live Marketplace / Stripe self-serve unless explicitly enabled for the tenant
- V1.1 connectors (Jira, ServiceNow, Teams, Slack) unless separately contracted
- Multi-tenant load-test SLA or production AI certification

### Pricing bands (owner-reviewable)

| Motion | Indicative list | Notes |
| --- | --- | --- |
| Guided pilot | See PRICING_PHILOSOPHY §4 | Credited toward Professional/Enterprise on conversion |
| Professional tier | Link PRICING_PHILOSOPHY | After PASS proof + tier-fit validation |
| Custom enterprise | Negotiated | Order form + procurement pack |

### Order-form path

1. PASS proof disposition on quote-to-proof readiness
2. Agree tier via [`tier_fit_validation_matrix.v1.json`](../../scripts/ci/data/tier_fit_validation_matrix.v1.json)
3. Execute [`ORDER_FORM_TEMPLATE.md`](ORDER_FORM_TEMPLATE.md)

### Next step after proof

Use `commercial-closeout.json` **recommendedNextAction** — typically schedule sponsor review, then quote request for Team/Professional expansion. See [`QUOTE_TO_PROOF_PACKET.md`](QUOTE_TO_PROOF_PACKET.md).

---

## Delivery stack (what ArchLucid is in this motion)

1. Evidence intake (including bulk attach within V1 limits — disclose **up to 200 files** per multipart request; **ZIP archives count as one file** and expand server-side).
2. Structured review in the operator workflow (Capture → Evidence → Review → Findings → Decisions → Report).
3. AI-assisted analysis with **human** architecture judgment and sign-off framing in exports.
4. Traceable findings and **exportable** DOCX/PDF.

After each paid engagement, run the [**decision-delta interview**](DECISION_DELTA_INTERVIEW.md) within seven days to capture whether ArchLucid changed an approval outcome versus frontier AI alone.

---

## Productization learnings (after paid engagements)

After **roughly 5–10** paid reviews, reconcile:

- Evidence clients always provide vs exceptions.
- Repeated finding patterns and report sections buyers forward.
- Objections and what screenshots or exports closed trust.

Feed results into **engineering backlog** / **`GTM_BACKLOG.md` retros** and pack/report templates — **do not** expand **`V1_SCOPE.md`** breadth on speculation alone.

---

## Change control

When a SKU name, band, or deliverable list becomes **public** on `archlucid.net`, update **`PRICING_PHILOSOPHY.md`** / procurement templates if numbers are no longer private — and refresh **`GTM_BACKLOG.md`** notes if **Marketing alignment** posture (Q7) changes.

