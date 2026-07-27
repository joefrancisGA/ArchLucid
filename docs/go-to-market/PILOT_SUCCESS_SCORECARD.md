> **Reviewed:** 2026-07-26

> **Scope:** ArchLucid pilot success scorecard — full detail, tables, and links below — plus the steering / ARB decision memo template (formerly `STEERING_DECISION_MEMO_TEMPLATE.md`) and the customer onboarding operating playbook (formerly `CUSTOMER_ONBOARDING_PLAYBOOK.md`).

> **Spine doc:** [`START_HERE.md`](../START_HERE.md).


# ArchLucid pilot success scorecard

**Audience:** Pilot champions, architecture team leads, and sales engineers who need to measure whether a pilot succeeded — and present the results to leadership for a purchase decision.

**Last reviewed:** 2026-07-26

**Grounding rule:** Metrics reference shipped V1 capabilities per [V1_SCOPE.md](../library/V1_SCOPE.md) and existing data collection per [PRODUCT_LEARNING.md](../library/PRODUCT_LEARNING.md).

**PASS / HOLD thresholds:** Pre-agreed pilot acceptance gates live in [`PILOT_ACCEPTANCE_THRESHOLDS.md`](PILOT_ACCEPTANCE_THRESHOLDS.md) (TB-158).

**Executive review packet (CI golden fixture):** Seeded demo run `claims-intake-modernization` packet composition (manifest summary, top findings, ROI basis labels) is regression-tested in `ArchLucid.Application.Tests/Exports/ExecutiveReviewPacketGoldenFixtureTests.cs` against `Exports/Golden/executive-review-packet-demo-run.md`. Healthcare vertical walkthrough: [`docs/library/walkthroughs/POLICY_PACK_HEALTHCARE_CLAIMS_PILOT.md`](../library/walkthroughs/POLICY_PACK_HEALTHCARE_CLAIMS_PILOT.md).

---

## 1. Purpose

This scorecard defines **what to measure, when to measure it, and what "good" looks like** during an ArchLucid pilot. Use it alongside the [ROI_MODEL.md](ROI_MODEL.md) to translate pilot results into a business case.

---

## 2. Quantitative metrics

Measure these before the pilot (baseline) and at pilot end (actual). The delta is the evidence. Before any sponsor packet leaves the team, mark whether each baseline is **buyer-provided**, **defaulted**, **demo-derived**, or **not collected**.

### 2.1 Efficiency metrics

| Metric | How to measure | Baseline (before pilot) | Pilot actual | Source |
|--------|---------------|------------------------|--------------|--------|
| **Time to complete an architecture review** | Wall-clock hours from "review requested" to "approved manifest" | _______ hours | _______ hours | Team tracking (Jira, calendar) |
| **Architect hours per review** | Person-hours of architect effort per review (prep + sessions + documentation) | _______ hours | _______ hours | Time tracking |
| **Documentation time per review** | Hours spent writing the architecture review report | _______ hours | _______ hours | Time tracking |
| **Evidence assembly effort** | Hours spent collecting diagrams, cloud exports, review notes, and supporting proof before review | _______ hours | _______ hours | Team estimate or time tracking |
| **Reviews completed per quarter** | Number of formal reviews completed in the pilot period (annualized) | _______ / qtr | _______ / qtr | Team tracking |

### 2.1.1 ROI basis labels

| Label | Meaning | Sponsor handling |
| --- | --- | --- |
| **Buyer-provided** | The buyer supplied the baseline or actual value for this pilot | Safe to include in the sponsor packet with normal caveats |
| **Defaulted** | ArchLucid used a conservative model default because the buyer did not supply a value | Include only with a clear default label; do not lead with projected dollars |
| **Demo-derived** | The value came from a seeded or agreed demo workspace | Use for walkthrough shape only; do not quote as buyer outcome |
| **Not collected** | The value was unavailable | Keep the row blank or explain the gap; do not invent a number |

### 2.2 Quality metrics

| Metric | How to measure | Baseline | Pilot actual | Source |
|--------|---------------|----------|--------------|--------|
| **Findings per review** | Average number of findings produced per architecture run | N/A (manual: ___) | _______ | `GET /v1.0/runs/{id}/findings` or UI run detail |
| **Findings with complete explainability trace** | Percentage of findings where all 5 `ExplainabilityTrace` fields are populated | N/A | _______% | `archlucid.explanation_trace_completeness_ratio` OTel metric |
| **Unique finding engine types triggered** | Number of distinct finding engine types that produced findings across the pilot | N/A | _______ / 10 | Finding engine type distribution in run results |
| **Agent output quality score** | Average structural completeness + semantic quality score across runs | N/A | _______ | `archlucid.authority.agent_output_quality` OTel metric |

### 2.3 Governance metrics

| Metric | How to measure | Baseline | Pilot actual | Source |
|--------|---------------|----------|--------------|--------|
| **Governance compliance rate** | Percentage of manifests committed that passed the pre-commit governance gate without critical/high findings | N/A | _______% | Governance gate pass/fail count |
| **Time from manifest to approval** | Average hours from manifest commit to governance approval | _______ hours | _______ hours | `GovernanceApprovalRequests` timestamps |
| **Compliance gaps found pre-deploy (during pilot)** | Architecture or compliance findings surfaced by ArchLucid that would have been missed in the manual process | 0 (baseline) | _______ | Finding review with architecture team |

### 2.4 Operational metrics

| Metric | How to measure | Target | Pilot actual | Source |
|--------|---------------|--------|--------------|--------|
| **Run success rate** | Percentage of runs that reach "Committed" status without errors | ≥ 90% | _______% | Run status counts in API or UI |
| **Average run duration** | Wall-clock time from run creation to manifest availability | < 5 min | _______ min | `archlucid.authority.run_duration_ms` OTel histogram |
| **Wizard-to-finalize wall-clock** | Minutes from wizard submit to first finalized architecture package (wizard-sourced runs only; metric key still `wizard_to_committed_minutes`) | p50 ≤ 15 min (aspirational) | p50 _______ / p95 _______ min | `archlucid.pilot.wizard_to_committed_minutes` OTel histogram (`execution_mode`, `preset_used`) |
| **LLM cost per run** | Average Azure OpenAI consumption per run | < $10 | $_______ | `archlucid.llm_*` OTel metrics, Azure billing |

---

## 3. Qualitative metrics

Collect via stakeholder interviews at pilot midpoint and end. Score each on a 1–5 scale.

| Question | Who to ask | Midpoint (1–5) | End (1–5) |
|----------|-----------|----------------|-----------|
| "How confident are you that ArchLucid findings are useful and accurate?" | Architects who reviewed findings | _______ | _______ |
| "Would you trust ArchLucid as the first pass for architecture reviews going forward?" | Lead architect / architecture board | _______ | _______ |
| "How much time did ArchLucid save you compared to a fully manual review?" | Architects who ran reviews during the pilot | _______ | _______ |
| "How easy was it to configure policy packs and governance rules for your organization?" | Architect who set up governance | _______ | _______ |
| "Would you recommend ArchLucid to a peer at another organization?" | All pilot participants | _______ | _______ |
| "How clear and useful is the explainability trace on findings?" | Architects who reviewed findings in detail | _______ | _______ |
| "How useful is the provenance graph for understanding decision lineage?" | Architects and stakeholders who viewed it | _______ | _______ |
| "How satisfied are you with the DOCX export quality for stakeholder communication?" | Architects who shared reports with non-technical stakeholders | _______ | _______ |

### Scoring guide

| Score | Meaning |
|-------|---------|
| 1 | Strongly disagree / not useful at all |
| 2 | Disagree / marginally useful |
| 3 | Neutral / moderately useful |
| 4 | Agree / useful |
| 5 | Strongly agree / very useful |

**Qualitative success threshold:** Average score ≥ 3.5 across all questions at pilot end.

---

## 4. Data collection plan — six-week pilot timeline

| Week | Activity | Data collected |
|------|----------|---------------|
| **0 (pre-pilot)** | Collect baseline metrics: review hours, documentation time, compliance gap history. Deploy ArchLucid to pilot environment. Configure auth, policy packs, and governance rules. | Baseline numbers for Section 2 |
| **1** | Run 2–3 architecture reviews using ArchLucid. Architects review AI-generated findings alongside their normal process. | First run metrics, initial qualitative impressions |
| **2** | Run 2–3 more reviews. Enable pre-commit governance gate (warning-only mode). Compare ArchLucid findings to manual findings for accuracy assessment. | Finding accuracy comparison, governance gate metrics |
| **3 (midpoint)** | Conduct midpoint stakeholder interviews (Section 3). Review and adjust policy packs based on feedback. Switch governance gate to enforcing mode if findings quality is satisfactory. | Midpoint qualitative scores, policy pack refinements |
| **4** | Run 3–4 reviews. Conduct at least one two-run comparison. Export DOCX reports and share with non-technical stakeholders for feedback. | Comparison metrics, export feedback, operational metrics |
| **5** | Run 3–4 reviews. Focus on governance workflow: submit approval requests, test segregation of duties, review approval SLA metrics. | Governance metrics, approval workflow feedback |
| **6 (end)** | Conduct end-of-pilot stakeholder interviews. Compile all metrics. Calculate ROI using [ROI_MODEL.md](ROI_MODEL.md). Prepare leadership presentation. | Final qualitative scores, complete scorecard |

**Total runs during pilot:** 12–18 (enough to establish patterns without overwhelming the team).

---

## Customer onboarding operating playbook

Former standalone: `docs/go-to-market/CUSTOMER_ONBOARDING_PLAYBOOK.md` → this section.

**Audience:** Customer success, sales engineering, and account management teams onboarding new SaaS customers.

This playbook aligns with the six-week pilot timeline above and the technical quickstart in [../OPERATOR_QUICKSTART.md](../library/customer-facing/OPERATOR_QUICKSTART.md).

**Pricing:** Current tier pricing, pilot fee, and design-partner terms are in [PRICING_PHILOSOPHY.md §4–§5](PRICING_PHILOSOPHY.md). Do not restate prices here.

**Enterprise hosted SaaS:** Use the step-by-step checklist in [`HOSTED_ENTERPRISE_ONBOARDING_CHECKLIST.md`](../library/HOSTED_ENTERPRISE_ONBOARDING_CHECKLIST.md) for SCIM, SAML/OIDC, policy packs, governance, and audit export wiring (ArchLucid-hosted only — not self-hosted V2). For SAML workforce SSO, complete **[§2.1 claim-mapping tables](../library/HOSTED_ENTERPRISE_ONBOARDING_CHECKLIST.md#saml-claim-mapping-reference)** (Entra, Okta, Ping) and pre-flight with **`archlucid auth validate-saml`** before cutover.

**Custom policy pack authoring (PS):** After the Customer's **first committed manifest**, review whether recurring finding themes or governance gaps indicate a need for customer-specific packs beyond bundled **`PlatformDefault`** packs. When gaps are consistent across runs, position the productized SKUs from the public **`/pricing`** page (Custom Policy Pack Authoring section), [PRICING_PHILOSOPHY.md §4.2](PRICING_PHILOSOPHY.md#42-custom-policy-pack-authoring-professional-services), and the SoW template [`CUSTOM_POLICY_PACK_AUTHORING_SOW_TEMPLATE.md`](CUSTOM_POLICY_PACK_AUTHORING_SOW_TEMPLATE.md). Prefer **ArchLucid-owned (shared)** tier when Customer accepts generalized pattern reuse; use **customer-exclusive** when confidentiality dominates. Do not quote PS fees outside the canonical pricing files.

### Onboarding phases

#### Week 0 — Pre-launch

| Item | Owner | Definition of done |
|------|-------|--------------------|
| Tenant provisioned in ArchLucid SaaS | ArchLucid | Tenant ID confirmed, workspace created |
| SSO configured (Entra / OIDC) | Joint | Admin can sign in with corporate identity |
| Admin account active with Admin role | ArchLucid | Admin sees first-run wizard on login |
| Welcome email sent with getting-started links | ArchLucid | Email delivered, links verified |
| Kickoff call scheduled | ArchLucid CSM | Calendar invite sent to champion + team |
| Success criteria agreed (from scorecard) | Joint | Minimum / target / stretch documented |

**Common blockers:** Entra app registration delays (coordinate with customer IT), firewall rules blocking API access (provide IP ranges or use private connectivity).

#### Week 1 — Foundation

| Item | Owner | Definition of done |
|------|-------|--------------------|
| Kickoff call completed | Joint | Team introduced, goals reviewed, questions answered |
| Admin completes first-run wizard | Customer | Sample preset selected, first run visible |
| Team members invited (2–5 operators) | Customer admin | Users can sign in and view runs |
| First sample run executed and reviewed | Joint | Champion can navigate findings, manifest, explainability traces |
| Scorecard metrics baseline captured | Joint | Pre-pilot values recorded per §2 |

**Common blockers:** Team availability, confusion about presets (provide preset selection guidance).

#### Weeks 2–3 — Adoption

| Item | Owner | Definition of done |
|------|-------|--------------------|
| First **real** architecture review submitted | Customer | Run with actual system description, not sample |
| Governance workflow configured | Customer (guided) | At least one approval workflow active |
| Team completes 3+ runs | Customer | Visible in run list |
| Findings reviewed and discussed in team meeting | Customer | Architecture decisions informed by findings |
| Mid-pilot check-in call | ArchLucid CSM | Adoption signals reviewed, blockers addressed |

**Common blockers:** "We don't have a review coming up" (suggest running against a recent completed design), governance setup confusion (provide walkthrough).

#### Weeks 4–5 — Expansion

| Item | Owner | Definition of done |
|------|-------|--------------------|
| Comparison run executed (two reviews compared) | Customer | Drift or evolution visible in comparison view |
| Policy packs explored | Customer | At least one policy pack reviewed or configured |
| Governance approvals used in production | Customer | Real approval request submitted and resolved |
| Export features tested (DOCX, audit CSV) | Customer | Champion has a sample artifact for leadership |

#### Week 6 — Review

| Item | Owner | Definition of done |
|------|-------|--------------------|
| Pilot scorecard completed | Joint | All metrics captured per this scorecard |
| Results presented to leadership | Customer champion | ROI model populated with actual data per [ROI_MODEL.md](ROI_MODEL.md) |
| Renewal / expansion discussion | ArchLucid + champion | Go/no-go decision; commercial terms if proceeding |

### Touchpoint schedule

| Timing | Type | Purpose |
|--------|------|---------|
| Week 0 | Kickoff call (60 min) | Introductions, goals, success criteria, technical setup review |
| Week 1 | Check-in (30 min) | First review debrief, team readiness, early blockers |
| Week 3 | Mid-pilot review (45 min) | Adoption metrics, governance setup, course correction |
| Week 6 | Scorecard review (60 min) | Results, ROI calculation, renewal/expansion conversation |
| Ad hoc | Support / Slack / email | As needed for technical issues |

### Health signals during onboarding

| Signal | Green | Yellow | Red |
|--------|-------|--------|-----|
| **Review frequency** | Increasing week-over-week | Flat after week 2 | No reviews after week 2 |
| **Active operators** | 3+ unique users | 1 user only | Zero logins after week 1 |
| **Governance** | Approval workflow active | Configured but unused | Not configured by week 4 |
| **Support** | No critical tickets | Questions but engaged | Unresolved tickets, disengaged |
| **Champion engagement** | Attends all touchpoints | Misses one touchpoint | No-shows repeatedly |

**Action on Yellow:** Proactive outreach — offer training session, feature walkthrough, or adjusted timeline.

**Action on Red:** Escalate internally; engage executive sponsor on customer side if accessible; assess whether pilot extension or scope change is needed.

### Handoff to steady-state

After successful pilot conversion:

- Transition from pilot CSM touchpoints to **steady-state** cadence (quarterly business review).
- Activate health scoring per [RENEWAL_EXPANSION_PLAYBOOK.md](RENEWAL_EXPANSION_PLAYBOOK.md#1-customer-health-scoring).
- Enter renewal timeline per [RENEWAL_EXPANSION_PLAYBOOK.md](RENEWAL_EXPANSION_PLAYBOOK.md).

---

## 5. Success criteria

### 5.1 Minimum (pilot is viable for continued use)

| Criterion | Threshold |
|-----------|-----------|
| Review cycle time reduction | ≥ 25% reduction vs. baseline |
| Run success rate | ≥ 85% |
| Finding usefulness (qualitative) | Average ≥ 3.0 |
| At least one compliance gap caught pre-deploy | ≥ 1 finding that would have been missed manually |

### 5.2 Target (pilot supports a purchase recommendation)

| Criterion | Threshold |
|-----------|-----------|
| Review cycle time reduction | ≥ 40% reduction vs. baseline |
| Run success rate | ≥ 90% |
| Finding usefulness (qualitative) | Average ≥ 3.5 |
| Compliance gaps caught pre-deploy | ≥ 3 findings |
| Governance compliance rate | ≥ 80% of manifests pass gate |
| Overall qualitative score | Average ≥ 3.5 across all questions |
| ROI projection (annualized) | ≥ 300% using actual pilot numbers in ROI model |

### 5.3 Stretch (pilot demonstrates transformative value)

| Criterion | Threshold |
|-----------|-----------|
| Review cycle time reduction | ≥ 60% reduction vs. baseline |
| Run success rate | ≥ 95% |
| Finding usefulness (qualitative) | Average ≥ 4.0 |
| Compliance gaps caught pre-deploy | ≥ 5 findings |
| Architect willingness to recommend | Average ≥ 4.5 |
| ROI projection (annualized) | ≥ 500% using actual pilot numbers |

---

## 6. Report template for leadership

Use this structure when presenting pilot results to leadership for a purchase decision.

Before presenting, run through [`COMMERCIAL_CONVERSION_CHECKLIST.md`](COMMERCIAL_CONVERSION_CHECKLIST.md). It distinguishes send, hold, and deferred cases so the sponsor narrative does not outrun the evidence.

### Executive summary (1 paragraph)

> We conducted a [X]-week pilot of ArchLucid with [N] architecture reviews. Architecture review cycle time decreased by [Y]% from [baseline] hours to [actual] hours. ArchLucid identified [N] compliance or architecture gaps that our manual process would have missed. The projected annual ROI based on pilot results is [Z]%. We recommend [proceeding to purchase / extending the pilot / not proceeding].

### Results summary table

| Metric | Baseline | Pilot actual | Change | Target met? |
|--------|----------|-------------|--------|-------------|
| Review cycle time | ___ hrs | ___ hrs | -__% | Yes/No |
| Architect hours per review | ___ hrs | ___ hrs | -__% | Yes/No |
| Evidence assembly effort | ___ hrs | ___ hrs | -__% | Yes/No |
| Findings per review | N/A | ___ | — | — |
| Explainability trace completeness | N/A | ___% | — | — |
| Governance compliance rate | N/A | ___% | — | Yes/No |
| Compliance gaps caught pre-deploy | 0 | ___ | +___ | Yes/No |
| Run success rate | N/A | ___% | — | Yes/No |
| Overall qualitative score | N/A | ___/5 | — | Yes/No |

### ROI projection

> Using actual pilot numbers in the [ROI Model](ROI_MODEL.md):
>
> - **Annual review savings:** $___
> - **Annual compliance savings:** $___
> - **Annual audit savings:** $___
> - **Total annual savings:** $___
> - **Total annual cost:** $___
> - **Net annual value:** $___
> - **ROI:** ___%
> - **Payback period:** ___ months

### Qualitative highlights

- [2–3 specific quotes or observations from stakeholder interviews]
- [1–2 examples of findings that added value the manual process would have missed]

### Recommendation

> Based on [minimum / target / stretch] success criteria met, we recommend [action].

### Risks and mitigations

| Risk | Mitigation |
|------|-----------|
| [Risk identified during pilot] | [How to address it] |

---

## 7. Where pilot data lives in ArchLucid

| Data | Location | How to access |
|------|----------|---------------|
| Run results and findings | SQL (`dbo.Runs`, `dbo.Findings`) | API: `GET /v1.0/runs`, UI: `/runs` |
| Audit events | SQL (`dbo.AuditEvents`) | API: `GET /v1.0/audit`, UI: `/audit`, export: CSV/JSON |
| Governance approvals | SQL (`dbo.GovernanceApprovalRequests`) | API, UI: `/governance/dashboard` |
| OTel metrics | Grafana dashboards (committed in repo) | Grafana: authority, SLO, LLM usage dashboards |
| Product learning signals | SQL (`dbo.ProductLearningPilotSignals`) | UI: `/product-learning`, export: CSV |
| Comparison records | SQL (`dbo.ComparisonRecords`) | API: `GET /v1.0/comparisons`, UI: `/compare` |

---

## 8. Steering decision memo (template)

One-page steering / ARB memo aligned to this scorecard’s language. **Audience:** Architecture review board, IT steering, or innovation gate **before** expanding paid use. Copy into your wiki; **remove** rows you do not need. Internal drafts only until filled by the customer team.

### Decision

**Recommendation:** ☐ Proceed with bounded pilot ☐ Defer ☐ Reject (capture short reason below)

**Rationale (3–5 bullets):**

-

-

### Alternatives considered

| Option | Pros | Cons | Why not chosen |
|--------|------|------|----------------|
| Status quo (manual packages) | | | |
| Generic LLM chat / ad-hoc Copilot | | | |
| ArchLucid pilot | | | |

### Pilot scope (time-boxed)

| Field | Value |
|-------|-------|
| **Start (UTC date)** | |
| **End (UTC date)** | |
| **Primary use case** | |
| **Out of scope for pilot** | (e.g. full Operate governance — optional) |
| **Success owner** | Name / role |

### Success measures (mapped to [`PILOT_ROI_MODEL.md`](../library/PILOT_ROI_MODEL.md) §4)

| Area | Target (qualitative or numeric) |
|------|----------------------------------|
| Speed — time to finalized architecture package | |
| Artifact readiness | |
| Traceability / evidence | |
| Stakeholder confidence | |

**Minimum bar:** See [`PILOT_ROI_MODEL.md`](../library/PILOT_ROI_MODEL.md) §5.1–5.2 and this scorecard §5.

### Commercial / procurement notes (optional)

- Trust index: [`trust-center.md`](trust-center.md)
- Fast lane: [`TRANSACTABLE_PROCUREMENT_PATH.md`](TRANSACTABLE_PROCUREMENT_PATH.md#0-pilot-vs-procurement-fast-lane)

### Sign-off

| Role | Name | Date |
|------|------|------|
| Sponsor | | |
| Architecture lead | | |
| Security (if engaged) | | |

Former standalone: `docs/go-to-market/STEERING_DECISION_MEMO_TEMPLATE.md` → this section.

---

## Related documents

| Doc | Use |
|-----|-----|
| [ROI_MODEL.md](ROI_MODEL.md) | Fill in with actual pilot numbers to calculate ROI (includes operational cost guide) |
| [BUYER_PERSONAS.md](BUYER_PERSONAS.md) | Which persona presents the report (Section 6) and to whom |
| [POSITIONING.md](POSITIONING.md) | Value pillars to reference in the executive summary |
| [RENEWAL_EXPANSION_PLAYBOOK.md](RENEWAL_EXPANSION_PLAYBOOK.md) | Health scoring + renewal after pilot conversion |
| [../PILOT_GUIDE.md](../library/customer-facing/PILOT_GUIDE.md) | Technical setup for the pilot environment |
| [../PRODUCT_LEARNING.md](../library/PRODUCT_LEARNING.md) | How pilot feedback signals are captured and analyzed |
| [../OBSERVABILITY.md](../library/OBSERVABILITY.md) | OTel metric names referenced in this scorecard |
| [../archive/MARKETABILITY_ASSESSMENT_SERIES_2026_04_15.md](../archive/MARKETABILITY_ASSESSMENT_SERIES_2026_04_15.md) | Full marketability assessment (archived series) |
