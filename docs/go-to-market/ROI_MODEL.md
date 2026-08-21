> **Scope:** ArchLucid ROI model — full detail, tables, and links below — plus the operational cost guide for Azure/LLM footprint (formerly `COST_GUIDE.md`), the synthetic Contoso Retail case study (formerly `SYNTHETIC_CASE_STUDY_CONTOSO_RETAIL.md`), the Contoso worked-example ROI value-report mirror (formerly `WORKED_EXAMPLE_ROI.md`), and the quarterly aggregate ROI bulletin template (formerly the body of `AGGREGATE_ROI_BULLETIN_TEMPLATE.md`; that filename remains a path-stable alias for CLI/CI pins).

> **Reviewed:** 2026-07-28

> **Spine doc:** [`START_HERE.md`](../START_HERE.md).


# ArchLucid ROI model

**Audience:** Pilot champions, enterprise architects, and engineering leaders who need to justify an ArchLucid purchase to their CFO or procurement team.

**Last reviewed:** 2026-07-28

**Pricing reference:** [`PRICING_PHILOSOPHY.md` §5](PRICING_PHILOSOPHY.md) — verify §8–9 inline numbers match before any sponsor conversation.

**Grounding rule:** Value claims are mapped to shipped V1 capabilities per [V1_SCOPE.md](../library/V1_SCOPE.md). Estimates are conservative. Adjust all numbers to your organization's actuals.

**Commercial SEND:** Before sponsor send with projected ROI, baselines must reach **COMPLETE** per [QUOTE_TO_PROOF_PACKET.md#roi-baseline-send-policy](QUOTE_TO_PROOF_PACKET.md#roi-baseline-send-policy) or ship with an approved `roi-baseline-send-override.json`.

**Pricing:** Current list prices (seat, platform fee, run overage, pilot) are in [PRICING_PHILOSOPHY.md §5](PRICING_PHILOSOPHY.md) — the single source of truth. The value model in this document is the input that justifies those prices; the prices themselves live only in that file. Distinct from sponsor-report ROI exports — this doc is the champion worksheet, not the sealed sponsor PDF narrative.

---

## 1. Objective

Provide a **reusable template** for building a business case. Fill in your organization's numbers in the "Your value" column and present the result to leadership.

---

## 2. Cost of the status quo

Collect these numbers from your architecture practice before starting the pilot.

| Input | Description | Industry benchmark | Your value |
|-------|-------------|-------------------|------------|
| **Reviews per quarter** | Architecture reviews conducted (formal or informal) | 8–20 for a 200-person eng org | _______ |
| **Hours per review** | Total person-hours: architect prep, stakeholder sessions, documentation, follow-up | 30–60 hours | _______ |
| **Architect hourly cost** | Fully loaded (salary + benefits + overhead) | $120–$200/hr | _______ |
| **Compliance gaps found post-deploy (per year)** | Architecture-related findings surfaced during audits or incidents, not during design | 4–12 per year | _______ |
| **Cost per remediation** | Average cost to fix a compliance or architecture gap found in production (eng time + incident + audit response) | $15K–$75K | _______ |
| **Inconsistency incidents (per year)** | Incidents caused by teams making different architecture choices for the same problem (duplicated infra, conflicting patterns, integration failures) | 2–8 per year | _______ |
| **Cost per inconsistency incident** | Average eng time + customer impact + rework | $10,000–$50,000 | _______ |

### Status quo annual cost formula

```
Annual review cost       = Reviews/quarter × 4 × Hours/review × Hourly cost
Annual remediation cost  = Gaps/year × Cost per remediation
Annual inconsistency cost = Incidents/year × Cost per incident
─────────────────────────────────────────────────────────────
Total status quo cost    = Sum of above
```

### Example: 200-person engineering organization

| Input | Value |
|-------|-------|
| Reviews per quarter | 12 |
| Hours per review | 40 |
| Architect hourly cost | $150 |
| Compliance gaps post-deploy | 6 / year |
| Cost per remediation | $30,000 |
| Inconsistency incidents | 4 / year |
| Cost per incident | $25,000 |

```
Annual review cost       = 12 × 4 × 40 × $150 = $288,000
Annual remediation cost  = 6 × $30,000          = $180,000
Annual inconsistency cost = 4 × $25,000          = $100,000
─────────────────────────────────────────────────────────────
Total status quo cost    = $568,000
```

---

## 3. ArchLucid value model

Each value lever maps to a specific product capability. Do not claim value for capabilities you will not use.

### 3.1 Review cycle time reduction

| Lever | How ArchLucid helps | V1 capability | Conservative estimate |
|-------|--------------------|--------------|-----------------------|
| **Automated initial analysis** | AI agents perform topology, cost, compliance, and critique analysis — architect reviews findings rather than conducting full analysis from scratch | `IAuthorityRunOrchestrator`, 4 agent types, 10 finding engines | 50% reduction in architect hours per review |
| **Structured request intake** | Seven-step wizard standardizes what information is captured, eliminating back-and-forth on "what do I need to provide" | First-run wizard, `ArchitectureRequest` schema | 10% reduction in total review cycle time |
| **Automated documentation** | DOCX export produces a stakeholder-ready report automatically — no manual report writing | `IDocxExportService`, artifact bundles | 4–8 hours saved per review (documentation phase) |

**Review cost with ArchLucid:**

```
Reduced hours/review     = Current hours × 0.50 (conservative)
New annual review cost   = Reviews/quarter × 4 × Reduced hours × Hourly cost
Review savings           = Current review cost − New review cost
```

**Example:** `12 × 4 × 20 × $150 = $144,000` → **savings: $144,000/year**

### 3.2 Compliance shift-left

| Lever | How ArchLucid helps | V1 capability | Conservative estimate |
|-------|--------------------|--------------|-----------------------|
| **Pre-finalize governance gate** | Findings at or above a configurable severity threshold block architecture-package finalize — compliance gaps caught at design time, not in production | `PreCommitGovernanceGate`, `BlockCommitMinimumSeverity` | 50% reduction in post-deploy compliance gaps |
| **Policy pack enforcement** | Versioned compliance rules applied consistently across every review — no "forgot to check" scenarios | `PolicyPackContentDocument`, `IEffectiveGovernanceResolver` | 30% reduction in inconsistency incidents |
| **Approval workflow** | Segregation of duties enforced — architecture changes require explicit approval | `GovernanceApprovalRequests`, self-approval blocked | Audit evidence generated automatically |

**Compliance savings:**

```
Reduced gaps/year        = Current gaps × 0.50
Compliance savings       = (Current gaps − Reduced gaps) × Cost per remediation
Reduced incidents/year   = Current incidents × 0.30
Inconsistency savings    = (Current − Reduced) × Cost per incident
```

**Example:**
- Compliance: `3 × $30,000 = $90,000 saved`
- Inconsistency: `1.2 × $25,000 = $30,000 saved`
- **Total compliance savings: $120,000/year**

### 3.3 Audit and documentation efficiency

| Lever | How ArchLucid helps | V1 capability | Conservative estimate |
|-------|--------------------|--------------|-----------------------|
| **Durable audit trail** | 78 typed audit events with append-only enforcement — compliance evidence generated as a byproduct of normal operation | `dbo.AuditEvents`, `DENY UPDATE/DELETE`, JSON/CSV export | 2–4 weeks saved per audit cycle |
| **Evidence packages** | ZIP artifact bundles, DOCX reports, and comparison replays provide ready-made audit evidence | Artifact bundles, comparison replay, export endpoints | $20,000–$50,000 saved per audit in evidence-gathering effort |
| **Explainability trace** | Every finding has a structured trace — auditors can verify the basis for each recommendation | `ExplainabilityTrace` (5 fields per finding) | Audit response time reduced by 40% |

**Audit savings (conservative):** **$30,000/year** (assumes 1–2 audits per year with reduced evidence-gathering effort)

---

## 4. Total cost of ArchLucid

| Cost component | Estimate | Notes |
|----------------|----------|-------|
| **Infrastructure** (Azure SQL, Container Apps, blob storage) | $500–$2,000/month | Consumption-based; varies by run volume and data retention |
| **LLM consumption** (Azure OpenAI) | $2–$10 per run | Depends on model, prompt length, and number of agents. Simulator mode is free. |
| **Team time** (setup, configuration, learning) | 40–80 hours one-time | Pilot setup, Terraform deployment, auth configuration |
| **Ongoing operation** | 2–4 hours/month | Health monitoring, policy pack updates, audit export |

**Example annual cost:** `$1,000/mo infra × 12 + $5/run × 48 runs/quarter × 4 + 60 hrs × $150 + 3 hrs/mo × 12 × $150 = $12,000 + $960 + $9,000 + $5,400 = $27,360`

---

## 5. ROI calculation

```
Annual savings           = Review savings + Compliance savings + Audit savings
Annual cost              = Infrastructure + LLM + Team time (amortized) + Operations
Net annual value         = Annual savings − Annual cost
ROI                      = Net annual value / Annual cost × 100%
Payback period           = Annual cost / (Annual savings / 12)
```

### Example calculation

| Line item | Amount |
|-----------|--------|
| Review savings | $144,000 |
| Compliance savings | $120,000 |
| Audit savings | $30,000 |
| **Total annual savings** | **$294,000** |
| Total annual cost | $27,360 |
| **Net annual value** | **$266,640** |
| **ROI** | **975%** |
| **Payback period** | **1.1 months** |

---

## 6. Intangible benefits

These are difficult to quantify but frequently cited by enterprise architecture leaders:

| Benefit | Description |
|---------|-------------|
| **Consistency** | Every architecture review follows the same process, applies the same engines, and produces the same artifact structure — regardless of which architect is involved |
| **Institutional knowledge** | Golden manifests, findings, and decision traces accumulate as an organizational knowledge base — architecture decisions do not leave when people do |
| **Speed of onboarding** | New architects review AI-generated findings against policy packs rather than learning tribal knowledge about what to check |
| **Stakeholder confidence** | DOCX exports and provenance graphs give non-technical stakeholders a tangible, visual understanding of architecture decisions |
| **Regulatory posture** | Demonstrating a governed, auditable architecture review process strengthens the organization's compliance narrative during audits and regulatory examinations |

---

## 7. Sensitivity analysis

The ROI model is most sensitive to these inputs. Adjust these first when customizing for your organization.

| Input | If higher than benchmark | If lower than benchmark |
|-------|--------------------------|-------------------------|
| **Hours per review** | ROI increases — more time to save | ROI decreases — less room for improvement |
| **Cost per remediation** | ROI increases significantly — compliance shift-left becomes dominant | ROI still positive from review time savings |
| **Reviews per quarter** | ROI scales linearly | Below 4 reviews/quarter, ROI may be marginal for small teams |
| **LLM cost per run** | ROI decreases slightly — monitor with `archlucid_llm_*` OTel metrics | ROI increases — simulator mode eliminates this cost entirely for testing |

**Break-even point:** ArchLucid pays for itself if it saves **more than ~180 architect-hours per year** (at $150/hr vs. $27K annual cost). That is approximately **4.5 hours saved per review across 40 reviews** — a conservative threshold.

---

## 8. ArchLucid subscription cost and payback (locked 2026 prices)

> All prices in this section are drawn from [PRICING_PHILOSOPHY.md §5](PRICING_PHILOSOPHY.md) — the single source of truth. If a re-rate gate has been cleared since 2026-04-17, verify the current list before presenting this section.

### 8.1 Annual subscription cost — Professional tier, 6-architect baseline

The 6-architect baseline used throughout this document maps to Professional tier (up to 20 architects, governance, policy packs, audit export).

| Component | Calculation | Monthly | Annual (monthly billing) | Annual (prepay, 2 months free) |
|-----------|------------|---------|--------------------------|-------------------------------|
| Platform fee | 1 workspace × list (see [PRICING_PHILOSOPHY.md §5](PRICING_PHILOSOPHY.md)) | $899 | $10,788 | $8,990 |
| Seat fee | 6 seats × list (see [PRICING_PHILOSOPHY.md §5](PRICING_PHILOSOPHY.md)) | $1,074 | $12,888 | $10,740 |
| **Total subscription** | | **$1,973 / month** | **$23,676 / year** | **$19,730 / year** |

*Infrastructure (Azure SQL, Container Apps, OpenAI) is additional — see §4 for estimates.*

### 8.2 All-in first-year cost

| Cost item | Amount | Notes |
|-----------|--------|-------|
| Subscription (annual prepay) | $19,730 | From §8.1; draws from [PRICING_PHILOSOPHY.md §5](PRICING_PHILOSOPHY.md) |
| Infrastructure | $12,000 | $1,000/mo Azure estimate from §4 |
| LLM consumption | $960 | $5/run × 48 runs/quarter × 4 quarters |
| Setup + onboarding | $9,000 | 60 hrs × $150/hr one-time |
| Operations | $5,400 | 3 hrs/mo × 12 × $150 |
| **Total year 1** | **$47,090** | |

### 8.3 Payback period — full list price

Using the §5 example: $294,000 annual savings, $47,090 all-in year-1 cost.

```
Monthly savings          = $294,000 / 12 = $24,500
Monthly cost (year 1)    = $47,090 / 12  = $3,924
Payback period           = $47,090 / $24,500/mo ≈ 1.9 months
```

**Payback at full Professional list price: approximately 2 months.**

Year 2+ all-in cost drops to ~$38,090 (subscription + infra + LLM + ops; no setup cost), so steady-state ROI improves further.

### 8.4 Payback period — Design partner discount (50% off Professional list, 12 months)

Design partner terms: 50% off platform fee and seat fee for the first 12 months (see [PRICING_PHILOSOPHY.md §4](PRICING_PHILOSOPHY.md) and [ORDER_FORM_TEMPLATE.md Addendum B](ORDER_FORM_TEMPLATE.md)).

| Cost item | Amount |
|-----------|--------|
| Subscription at 50% off (annual prepay) | $9,865 |
| Infrastructure | $12,000 |
| LLM consumption | $960 |
| Setup + onboarding | $9,000 |
| Operations | $5,400 |
| **Total year 1 (design partner)** | **$37,225** |

```
Payback period (design partner) = $37,225 / $24,500/mo ≈ 1.5 months
```

**Payback at design partner discount: approximately 6 weeks.**

---

## 9. Three-year TCO comparison vs. incumbents

**Basis:** Professional tier, 6-architect team, 3-year horizon. Infrastructure and operations costs are included for ArchLucid. Competitor prices are **publicly observed ranges** from [COMPETITIVE_LANDSCAPE.md §2.1](COMPETITIVE_LANDSCAPE.md) and public pricing pages; actual quotes may differ significantly based on negotiation and feature scope.

### 9.1 Assumptions

| Assumption | Value | Source |
|------------|-------|--------|
| ArchLucid subscription (year 1 prepay) | $19,730 | [PRICING_PHILOSOPHY.md §5](PRICING_PHILOSOPHY.md) via §8.1 above |
| ArchLucid subscription (year 2–3, no setup) | $19,730/yr | Same |
| ArchLucid infrastructure + LLM + ops | ~$18,360/yr | §8.2 without setup |
| LeanIX per-seat range | $100–$300 / seat / month | Publicly observed enterprise range; SAP-backed; negotiated |
| Ardoq per-seat range | $80–$200 / seat / month | Publicly observed range; varies by module selection |
| LeanIX/Ardoq typical contract | Annual with 1–3 year commitments | Standard EAM deal structure |

*Publicly observed ranges are sourced from analyst reports, public case studies, and community price disclosures as of 2026-Q2. They are cited for directional comparison only — treat as rough order of magnitude.*

### 9.2 Three-year total cost of ownership

All figures are for a 6-architect team. ArchLucid includes infrastructure; competitors include subscription only (no infrastructure required for SaaS-only tools).

| | Year 1 | Year 2 | Year 3 | **3-year total** |
|--|--------|--------|--------|-----------------|
| **ArchLucid — full list, monthly billing** | $47,090 | $38,090 | $38,090 | **$123,270** |
| **ArchLucid — full list, annual prepay** | $47,090 | $38,090 | $38,090 | **$123,270** |
| **ArchLucid — design partner (year 1 only)** | $37,225 | $38,090 | $38,090 | **$113,405** |
| **LeanIX (low end: $100/seat/mo, 6 seats)** | $7,200 | $7,200 | $7,200 | **$21,600** |
| **LeanIX (high end: $300/seat/mo, 6 seats)** | $21,600 | $21,600 | $21,600 | **$64,800** |
| **Ardoq (low end: $80/seat/mo, 6 seats)** | $5,760 | $5,760 | $5,760 | **$17,280** |
| **Ardoq (high end: $200/seat/mo, 6 seats)** | $14,400 | $14,400 | $14,400 | **$43,200** |

### 9.3 TCO interpretation

**Why ArchLucid costs more than EAM incumbents:** ArchLucid costs are higher because the product delivers capabilities incumbents do not offer at any price: AI-agent orchestration, structured explainability traces, pre-commit governance gates, typed audit events, and comparison replay. The TCO comparison is not apples-to-apples — it is a decision between tools with fundamentally different capabilities.

**The correct frame is net value, not cost:**

| | ArchLucid (full list, 3-year) | LeanIX (high end, 3-year) |
|--|-------------------------------|--------------------------|
| 3-year cost | ~$123,270 | ~$64,800 |
| 3-year savings (from §5 model) | ~$882,000 ($294K × 3) | Savings not quantified (no AI analysis, no shift-left compliance) |
| **3-year net value** | **~$758,730** | **Not comparable** |

**Buy vs augment decision:** ArchLucid is **not** a replacement for LeanIX or Ardoq for CMDB, application portfolio inventory, or roadmap management. See [COMPETITIVE_LANDSCAPE.md §4.1](COMPETITIVE_LANDSCAPE.md). The correct question is: "What is the cost of continuing manual architecture review vs shifting to AI-governed review?" — not "Is ArchLucid cheaper than LeanIX?"

### 9.4 Sensitivity: what if savings are 50% of benchmark?

Even if the savings model is optimistic by 50% (conservative scenario):

```
Conservative annual savings = $294,000 × 0.50 = $147,000
3-year conservative savings = $441,000
3-year ArchLucid cost       = $123,270
3-year net value            = $317,730
Payback period              = $47,090 / ($147,000/12) ≈ 3.8 months
```

ArchLucid pays for itself in under 4 months even in the conservative scenario.

---

## 10. How to present to leadership

1. **Fill in your numbers** in the "Your value" column of Section 2.
2. **Choose which value levers apply** to your organization (Section 3) — do not claim all of them if you will not use all capabilities.
3. **Run the calculation** (Section 5) with your numbers.
4. **Show the payback** from Section 8 — use the Professional tier numbers as the baseline; adjust if your team size or tier differs.
5. **Show the 3-year TCO** from Section 9 if the conversation is about cost vs. incumbents — always pair TCO with net-value, not cost alone.
6. **Add 1–2 intangible benefits** (Section 7) that resonate with your leadership's priorities.
7. **Present the one-page summary:** current cost, projected savings, net value, ROI percentage, payback period.
8. **Attach the pilot scorecard** ([PILOT_SUCCESS_SCORECARD.md](PILOT_SUCCESS_SCORECARD.md)) as the measurement plan.

---

## Operational cost guide (Azure + LLM)

Buyer-facing **cost-of-operations** framing for ArchLucid-hosted and self-hosted pilots — estimates, not contractual pricing; verify against your Azure subscription and AOAI deployment. Audience: finance + platform owners sizing **LLM token burn** and **Azure footprint** before a pilot.

### What this section is

- **Operational** cost (Azure resources + LLM usage) — **not** ArchLucid **commercial** subscription pricing (see [`ORDER_FORM_TEMPLATE.md`](ORDER_FORM_TEMPLATE.md) / sales; list prices in [`PRICING_PHILOSOPHY.md`](PRICING_PHILOSOPHY.md)).
- Mixes **measured instrumentation** (meter names in [`OBSERVABILITY.md`](../library/OBSERVABILITY.md)) with **illustrative arithmetic** using **public Azure OpenAI** list pricing — **recompute** before board approval.

### Variable: LLM tokens per run

| Signal | Where it lives |
|--------|----------------|
| Calls per run | Histogram **`archlucid_llm_calls_per_run`** |
| Token counters | **`archlucid_llm_*`** family (see **`ArchLucid.Core/Diagnostics/ArchLucidInstrumentation.cs`**) |
| Baseline script | [`PERFORMANCE_BASELINES.md`](../library/PERFORMANCE_BASELINES.md) (simulator only) + **`tests/load`** for API smoke |

**Worked example (illustrative)** — replace with **your** measured `input+output` totals / 1e6 × $/MTok from the **Azure OpenAI pricing page** for **your** SKU/region.

| Hypothesis | Value |
|------------|-------|
| Runs / month | **50** pilot runs |
| Avg **input** tokens / run | **18k** (guess — measure) |
| Avg **output** tokens / run | **6k** |
| Model list price (placeholder) | **$5 / 1M input tok**, **$15 / 1M output tok** |

Monthly LLM subtotal ≈ `50 * (18 * 5 / 1000 + 6 * 15 / 1000)` = `50 * (0.09 + 0.09)` ≈ **$9** (pure fiction until you plug **real** token meters).

**Cost levers:** Simulator mode → **$0** AOAI (CI / dev); smaller/cheaper model deployment for non-critical agents; **`IHotPathReadCache` + explanation cache** → fewer duplicate LLM completions.

### Shared Azure fabric (order-of-magnitude)

Rough **US East** list-style **orders of magnitude** — **not** quotes:

| Tier | Includes (typical pilot) | Monthly **ballpark** |
|------|--------------------------|-----------------------|
| Minimal | Azure SQL **Basic/Standard-small**, single **Container App**, **Storage** | **$150–$450** |
| Production-shaped | SQL **S2+**, **Front Door + WAF**, **Key Vault**, HA worker | **$800–$2500+** |

**Validate** with the [Azure pricing calculator](https://azure.microsoft.com/pricing/calculator/) + `infra/terraform-*` modules you enable.

### Compared to manual architecture review hours

Use this ROI model (and [`PILOT_ROI_MODEL.md`](../library/PILOT_ROI_MODEL.md)) to translate **hours saved × blended rate** vs. **fully loaded** ArchLucid + Azure + change mgmt — never double-count the same hour in two line items.

### Next steps (ops cost)

1. Export **Prometheus** totals for **`archlucid_llm_*`** after a representative week.
2. Re-run the appropriate [k6](../library/LOAD_TEST_BASELINE.md) profile for your rollout tier.
3. Drop results into [`PILOT_SUCCESS_SCORECARD.md#proof-of-value-snapshot-assembly`](PILOT_SUCCESS_SCORECARD.md#proof-of-value-snapshot-assembly) binder for exec sign-off.

Former standalone: `docs/go-to-market/COST_GUIDE.md` → this section.

---

## Synthetic Retail Checkout case study

> **SYNTHETIC — NOT REAL CUSTOMER DATA.** Fabricated for sales-enablement and DOCX examples. Do not cite figures as observed outcomes without replacing them with measured pilot data.

**Audience:** Go-to-market and sales-enablement readers.  
**Label:** SYNTHETIC · Retail Checkout Modernization (aligned with trusted-baseline demo seed).  
**Measurement companion:** [`PILOT_ROI_MODEL.md`](../library/PILOT_ROI_MODEL.md).  
**Structured twin:** `SyntheticCaseStudyDataProvider` for DOCX and sample rendering.

### Sponsor summary

Retail Checkout Co is modernizing checkout onto Azure while preserving its existing payment-processor integration. This **synthetic** vignette shows how the same measurement scaffolding used in `ValueReportRawMetrics` can tell a conservative before/after story: shorter review cycles, fewer re-review loops, and less manual evidence assembly.

### Baseline (pre-ArchLucid) — illustrative

| Dimension | Value | Notes |
|-----------|------:|-------|
| Review cycle time (request → reviewable package) | **40 hours** | Sponsor estimate for one representative architecture change |
| Review iterations per change | **3** | Rework driven by ambiguity and missing governance evidence |
| Evidence assembly (narrative, traceability, review pack) | **8 hours** | Manual collation across email, tickets, and slide decks |

### After ArchLucid — illustrative (conservative)

| Dimension | Value | Notes |
|-----------|------:|-------|
| Review cycle time | **12 hours** | Same team, measured over a short pilot window (N small by design) |
| Review iterations | **1.5** (average) | Fewer round-trips because decisions and deltas are explicit |
| Evidence assembly | **2 hours** | Manifest, findings, and exports reduce manual reconstruction |

### Indicative deltas (non-claim)

- **Review-cycle hours saved per cycle:** 40 − 12 = **28 hours** (~**70%** reduction vs the synthetic baseline).
- **Iteration load:** (3 − 1.5) / 3 ≈ **50%** reduction in average iterations (illustrative).
- **Evidence assembly:** (8 − 2) / 8 = **75%** reduction vs the synthetic baseline.

Annualization and payback depend on how many architecture changes your enterprise runs per year; see `PILOT_ROI_MODEL.md` for the guardrails ArchLucid uses in pilot evaluation.

### Illustrative throughput and FTE levers (synthetic)

Assume **six** EA-relevant modernization threads per calendar year matching the **`PILOT_ROI_MODEL.md`** illustrative team sizing (principal + five senior reviewers). Applying the illustrative hour deltas above yields:

| Lever | Synthetic value | Notes |
|-------|-----------------|-------|
| Review-cycle hour savings vs baseline | **168 h/year** (6 × 28 h) | Same 28 h/thread delta as indicative deltas above |
| Evidence-assembly savings vs baseline | **36 h/year** (6 × 6 h) | From 8 h → 2 h per thread × six threads |

At a **fully loaded blended rate** of **$150/h**, the illustrative **annualized value** lands near **$30.6k/year** from review/evidence deltas alone (**204** professional hours: 168 + 36, × **$150**). This is deliberately conservative versus large-program savings and excludes vendor change costs or cloud spend — it exists to show arithmetic alignment with ROI-model guardrails rather than promised customer outcomes.

### Disclaimer

These numbers are **not** SQL-backed tenant metrics. Replace them with measured pilot data before external publication.

Former standalone: `docs/go-to-market/SYNTHETIC_CASE_STUDY_CONTOSO_RETAIL.md` → this section.

---

## Worked example ROI (Contoso sample)

Former standalone: `docs/go-to-market/WORKED_EXAMPLE_ROI.md` → this section.

> **Honesty:** This is sample data from a fictional Contoso tenant; numbers are reproducible from `scripts/ops/generate-worked-example-roi.ps1` (Docker demo profile + `POST /v1/demo/seed` + per-tenant `POST /v1/value-report/{tenantId}/generate`). **Do not cite as customer ROI.**

**Download:** [WORKED_EXAMPLE_ROI.pdf](/WORKED_EXAMPLE_ROI.pdf) (same bytes under `docs/go-to-market/WORKED_EXAMPLE_ROI.pdf` in the repository).

### What this is

- **PDF:** `DocxValueReportRenderer` output from the **existing** value-report DOCX path, converted to PDF (LibreOffice, Word COM, or pandoc — see the script header).
- **Markdown table below:** Parsed from the **same DOCX bytes** as the PDF (`scripts/ops/value_report_docx_extract_to_md.py`), so the two surfaces stay aligned after regeneration.

### Inline metrics mirror (from value-report DOCX)

<!-- BEGIN_AUTOGENERATED_ROI_MD -->
| Metric | Value (from value-report DOCX) |
| --- | --- |
| Runs completed (terminal) | 2 |
| Manifests committed | 1 |
| Governance-class audit events | 3 |
| Drift / alert-class audit events | 4 |
| Finding feedback net score | 0 |
| Finding feedback votes | 0 |
| Architect-hours saved (manifests) | 4 architect-hours |
| Architect-hours saved (governance) | 1.5 architect-hours |
| Architect-hours saved (drift/alerts) | 1 architect-hours |
| Architect-hours saved (total) | 6.5 architect-hours |
| LLM cost window USD | 10 |
| Annualized hours value USD | 100000 |
| Annualized LLM cost USD | 500 |
| Baseline annual subscription + ops USD | 27360 |
| Net annualized value vs baseline USD | 72140 |
| ROI vs baseline (%) | 263.67 |
<!-- END_AUTOGENERATED_ROI_MD -->

> **Regeneration note (2026-04-24):** The table above matches the **deterministic** `ValueReportSnapshot` fixture in `ArchLucid.Api.Tests/ValueReports/DocxValueReportRendererTests.cs` (same paragraph labels as `DocxValueReportRenderer`). It is **not** a live SQL read from the Contoso demo tenant. For SQL-backed Contoso numbers and an updated PDF, run `scripts/ops/generate-worked-example-roi.ps1` after `docker compose --profile full-stack up -d` (see script header).

---

## Aggregate ROI bulletin template {#aggregate-roi-bulletin-template}

Former standalone body: `docs/go-to-market/AGGREGATE_ROI_BULLETIN_TEMPLATE.md` → this section (filename kept as a path-stable alias for CLI / CI string pins). Quarterly **aggregate** ROI bulletin for GTM and leadership — sanitized statistics only; not a vehicle for per-customer disclosure.

**Path-stable alias:** [`AGGREGATE_ROI_BULLETIN_TEMPLATE.md`](AGGREGATE_ROI_BULLETIN_TEMPLATE.md).

### Owner-approval gate (mandatory)

**No version of this bulletin may be published externally** (web, email to prospects, press, or partner decks) without **explicit owner sign-off** recorded per [`docs/PENDING_QUESTIONS.md`](../PENDING_QUESTIONS.md) item **27**. Engineering may generate **drafts** from production using `archlucid roi-bulletin` (see [`docs/CLI_USAGE.md`](../library/CLI_USAGE.md)); publication remains **owner-only**.

**Resolved 2026-04-21 (item 27):**

| Decision | Value |
|----------|-------|
| **Minimum N for first issue** | **5** qualifying tenants |
| **Signatory** | **Owner-solo** sign-off (no CRO / GC co-sign required) |
| **Percentile bands** | **Mean + p50 + p90** all stay in v1 bulletins |
| **First publication window** | Opens **once at least one PLG tenant reaches `Status: Published`** in [`reference-customers/README.md`](reference-customers/README.md) (item 19) — the first published reference is the trigger to ship the first bulletin |
| **Repository of record for sign-off** | **Dedicated tagged section** in [`docs/CHANGELOG.md`](../CHANGELOG.md) — see [Sign-off audit format](#sign-off-audit-format-2026-04-21-owner-qa-follow-up) below for the exact heading shape and `grep` recipe an auditor can run. |
| **Synthetic shape sample (not sign-off)** | Public Markdown: [`SAMPLE_AGGREGATE_ROI_BULLETIN_SYNTHETIC.md`](SAMPLE_AGGREGATE_ROI_BULLETIN_SYNTHETIC.md) — **never** append to CHANGELOG; no signed heading; illustrates artefact shape before N≥5. |

### Minimum-N privacy guard

- The bulletin **must** aggregate **≥ 5 tenants** that have **tenant-supplied** `BaselineReviewCycleHours` captured in the reporting quarter (`BaselineReviewCycleCapturedUtc` window). Drafts **must refuse** to render public numbers below that threshold — the CLI and API return **400** / exit **UsageError** when `--min-tenants` is not met.
- **Never** attach a **per-tenant** row, customer name, or free-text baseline source string to the published bulletin body.

### Allowed statistics (this template)

| Statistic | Allowed? | Notes |
|-----------|----------|-------|
| Count of qualifying tenants | Yes | Integer only. |
| Mean baseline hours | Yes | Aggregate across qualifying tenants. |
| Median (p50) baseline hours | Yes | Use SQL `PERCENTILE_CONT(0.5)` semantics on the qualifying set. |
| p90 baseline hours | Yes | Upper tail for “heavy review culture” sensitivity; label as p90, not “max”. |
| Per-tenant baseline hours | **No** | Violates the privacy posture of this bulletin. |
| Measured time-to-commit per tenant | **No** | Same — aggregate measured stats belong in a **separate** engineering bulletin with its own owner gate. |

### Draft body skeleton (Markdown)

```markdown
# ArchLucid — aggregate review-cycle baseline bulletin (INTERNAL)

**Quarter:** Q?_-____
**Generated:** <UTC ISO timestamp>
**Qualifying tenants (N):** <integer ≥ 5>

## Headline numbers (tenant-supplied baseline hours only)

| Metric | Hours |
|--------|------:|
| Mean   | _._ |
| p50    | _._ |
| p90    | _._ |

## Interpretation guardrails

- These numbers describe **self-reported pre-ArchLucid review-cycle length** for tenants who **chose** to supply a baseline at signup — **not** ArchLucid runtime performance.
- “Before vs measured” product charts for any **single** tenant remain **in tenant-scoped operator surfaces** (value report / first-value report).

## Sign-off (owner-solo per 2026-04-21 decision)

| Role | Name | Date | CHANGELOG.md section anchor |
|------|------|------|-----------------------------|
| Owner | | | `#YYYY-MM-DD--roi-bulletin-signed-Q?-YYYY` (per Sign-off audit format in ROI_MODEL) |
```

### Sign-off audit format (2026-04-21 owner Q&A follow-up) {#sign-off-audit-format-2026-04-21-owner-qa-follow-up}

To make owner-solo sign-off mechanically auditable, **every** published bulletin appends a dedicated section to [`docs/CHANGELOG.md`](../CHANGELOG.md) with a fixed heading shape:

```markdown
## YYYY-MM-DD — ROI bulletin signed: Q?-YYYY

**Bulletin:** Q?-YYYY (link to the rendered bulletin artifact)
**Qualifying tenants (N):** <integer ≥ 5>
**Statistics published:** Mean / p50 / p90 baseline review-cycle hours
**Owner sign-off:** <owner name> on <ISO date>
**Sign-off mechanism:** This `## …` section, committed by the owner directly on `main`, is the sign-off — no separate signature artifact, no co-signer.
```

**Audit recipe (one command):**

```bash
# List every signed bulletin, newest-first, with its date and quarter
rg -n '^## \d{4}-\d{2}-\d{2} — ROI bulletin signed: Q[1-4]-\d{4}$' docs/CHANGELOG.md
```

**Why a dedicated section (vs. a free-form sentence in another entry).** The fixed heading is greppable and survives `docs/CHANGELOG.md` reorganization. Auditors and Trust Center reviewers can produce the full historical sign-off log with a single `rg` invocation; no screenshots, no separate audit artifact, no risk of a sign-off being silently buried inside an unrelated entry. This is also why the Sign-off table column above is `CHANGELOG.md section anchor` rather than `Signature / link` — the section *is* the signature.

**No bulletin without a section.** A published bulletin without the matching `## YYYY-MM-DD — ROI bulletin signed: Q?-YYYY` section in `docs/CHANGELOG.md` is **out of policy** — the next quality assessment will flag it. There is no rollback path other than retracting the publication and recording the retraction in the same format.

### Automation

- **API:** `GET /v1/admin/roi-bulletin-preview?quarter=Q1-YYYY&minTenants=5` (AdminAuthority).
- **CLI:** `archlucid roi-bulletin --quarter Q1-YYYY [--min-tenants 5] [--out draft.md]` — uses `ARCHLUCID_API_KEY` with admin scope.
- **CLI (synthetic, no API):** `archlucid roi-bulletin --quarter Q1-YYYY --synthetic [--explain] [--out sample.md]` — fixed illustrative numbers for buyer education only; never eligible for CHANGELOG sign-off.

### Bulletin-related links

- [`TRIAL_AND_SIGNUP.md`](TRIAL_AND_SIGNUP.md#baseline-review-cycle-privacy) — how the per-tenant baseline field is used and *not* used.
- [`PILOT_SUCCESS_SCORECARD.md#pilot-roi-measurement`](PILOT_SUCCESS_SCORECARD.md#pilot-roi-measurement) — modeled default when prospects skip custom hours (`docs/library/PILOT_ROI_MODEL.md` alias).

---

## Related documents

| Doc | Use |
|-----|-----|
| [PRICING_PHILOSOPHY.md](PRICING_PHILOSOPHY.md) | **Single source of truth** for all list prices used in §8 and §9 |
| [ORDER_FORM_TEMPLATE.md](ORDER_FORM_TEMPLATE.md) | Order form with Design partner addendum and worked examples |
| [COMPETITIVE_LANDSCAPE.md](COMPETITIVE_LANDSCAPE.md) | Competitor capability and pricing context used in §9 |
| [PILOT_SUCCESS_SCORECARD.md](PILOT_SUCCESS_SCORECARD.md) | Measurement framework for the pilot that validates this ROI model |
| [`#worked-example-roi-contoso-sample`](#worked-example-roi-contoso-sample) | Contoso sample ROI artifact (PDF + MD mirror) — demo-derived only, not customer ROI |
| [`#synthetic-retail-checkout-case-study`](#synthetic-retail-checkout-case-study) | Synthetic Retail Checkout before/after vignette (not real customer data) |
| [`#aggregate-roi-bulletin-template`](#aggregate-roi-bulletin-template) · [AGGREGATE_ROI_BULLETIN_TEMPLATE.md](AGGREGATE_ROI_BULLETIN_TEMPLATE.md) (alias) | Quarterly aggregate bulletin gate + draft skeleton |
| [BUYER_PERSONAS.md](BUYER_PERSONAS.md) | Who presents this model and to whom |
| [POSITIONING.md](POSITIONING.md) | Value pillars that map to the levers above |
| [../V1_SCOPE.md](../library/V1_SCOPE.md) | What V1 actually ships (grounding for capability claims) |
| [../PILOT_GUIDE.md](../library/customer-facing/PILOT_GUIDE.md) | Technical pilot onboarding |

---

## 10. Savings confidence labels (sponsor ROI surfaces)

Portfolio and sponsor-facing ROI totals (`GET /v1/roi/sponsor-summary`) include **labeling metadata only** — savings math is unchanged.

| Label | Meaning |
|-------|---------|
| **Retail** | Azure Retail list prices (public PAYG catalog). |
| **EA-adjusted** | Tenant-configured EA discount multiplier applied to Retail-derived cost findings. |
| **Uploaded actual/amortized** | Uploaded Azure extractor `cost-actual.json` / amortized evidence in workspace scope (EA multiplier may also apply). |
| **Heuristic fallback** | Monthly heuristic estimate when Retail SKU match is unavailable. |

**Cost evidence freshness** (uploaded extractor only):

| Status | Meaning |
|--------|---------|
| **Fresh** | Latest extractor collection timestamp is within `ExecutiveRoi:CostEvidenceFreshness:StaleAfterDays` (default **90** days). |
| **Stale** | Collection timestamp exceeds the threshold — re-run Tier 1/Tier 2 extraction before board/sponsor reviews. |
| **Missing** | No uploaded extractor packages in the current workspace scope. |

Configure the stale threshold in host configuration (`ExecutiveRoi:CostEvidenceFreshness:StaleAfterDays`). Architect workspace surfaces basis text and freshness warnings on the Home → Portfolio ROI summary panel.

---

## Cross-surface scope semantics (do not conflate totals)

Server-authoritative labels prevent sponsor confusion when multiple ROI surfaces appear together:

| Surface | Scope label gist |
| --- | --- |
| Sponsor summary headline | **Disposition-aware** open + needs-evidence estimated USD from latest committed run per system. |
| Per-system rows | Snapshot potential USD — **do not sum** to the portfolio headline. |
| Cross-tenant portfolio | Sums disposition-aware basis per tenant — **Not comparable** to single-tenant headline or value-report hours ROI. |
| Value report window | Activity-window hours/annualized USD — **Distinct from sponsor-summary** disposition-aware USD headline. |
| Trailing 30-day activity | **Counts only — not USD savings** (finding events, not dollars). |

When comparing surfaces, read `headlineSavingsScopeDescription` on API responses before interpreting totals together.
