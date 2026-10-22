> **Reviewed:** 2026-07-31

> **Scope:** ArchLucid pilot success scorecard — full detail, tables, and links below — plus the steering / ARB decision memo template (formerly `STEERING_DECISION_MEMO_TEMPLATE.md`), the customer onboarding operating playbook (formerly `CUSTOMER_ONBOARDING_PLAYBOOK.md`), the pilot ROI measurement model (formerly the body of `docs/library/PILOT_ROI_MODEL.md`; that filename remains a path-stable alias for product/CI strings), the renewal/expansion playbook plus customer health scoring (formerly the body of `RENEWAL_EXPANSION_PLAYBOOK.md`; that filename remains a path-stable alias), the minimum viable pilot success lane (formerly the body of `docs/library/MINIMUM_VIABLE_PILOT_SUCCESS.md`; that filename remains a path-stable alias for operator cookbooks), the internal dogfood pilot kit (formerly the body of `docs/library/DOGFOOD_PILOT_KIT.md`; that filename remains a path-stable alias for M-93 / PMF Pilot A), and the proof-of-value snapshot assembly playbook (formerly the body of `docs/library/PROOF_OF_VALUE_SNAPSHOT.md`; that filename remains a path-stable alias).

> **Spine doc:** [`START_HERE.md`](../START_HERE.md).


# ArchLucid pilot success scorecard

**Audience:** Pilot champions, architecture team leads, and sales engineers who need to measure whether a pilot succeeded — and present the results to leadership for a purchase decision.

**Last reviewed:** 2026-07-31

**Grounding rule:** Metrics reference shipped V1 capabilities per [V1_SCOPE.md](../library/V1_SCOPE.md) and existing data collection per [PRODUCT_LEARNING.md](../library/PRODUCT_LEARNING.md).

**Pilot ROI measurement:** [`#pilot-roi-measurement`](#pilot-roi-measurement) (`docs/library/PILOT_ROI_MODEL.md` alias).

**PASS / HOLD thresholds:** Pre-agreed pilot acceptance gates live in [`PILOT_ACCEPTANCE_THRESHOLDS.md`](PILOT_ACCEPTANCE_THRESHOLDS.md) (TB-158).

**Sponsor review packet (CI golden fixture):** Seeded demo run `claims-intake-modernization` packet composition (manifest summary, top findings, ROI basis labels) is regression-tested in `ArchLucid.Application.Tests/Exports/ExecutiveReviewPacketGoldenFixtureTests.cs` against `Exports/Golden/sponsor-review-packet-demo-run.md`. Healthcare vertical walkthrough: [`docs/library/walkthroughs/POLICY_PACK_HEALTHCARE_CLAIMS_PILOT.md`](../library/walkthroughs/POLICY_PACK_HEALTHCARE_CLAIMS_PILOT.md).

---

## 1. Purpose

This scorecard defines **what to measure, when to measure it, and what "good" looks like** during an ArchLucid pilot. Use it alongside the [ROI_MODEL.md](ROI_MODEL.md) to translate pilot results into a business case.

---

## Minimum viable pilot success lane {#minimum-viable-pilot-success-lane}

Former standalone body: `docs/library/MINIMUM_VIABLE_PILOT_SUCCESS.md` → this section (filename kept as a path-stable alias for operator cookbooks / Improvement #8). Complements [Customer onboarding operating playbook](#customer-onboarding-operating-playbook). Does **not** replace KEEP [`PILOT_ACCEPTANCE_THRESHOLDS.md`](PILOT_ACCEPTANCE_THRESHOLDS.md).

**Path-stable alias:** [`../library/MINIMUM_VIABLE_PILOT_SUCCESS.md`](../library/MINIMUM_VIABLE_PILOT_SUCCESS.md).

**Last reviewed:** 2026-07-31

This lane minimizes decisions and produces a **finalized architecture package** plus **sponsor-safe proof artifacts**. Optional paths (real AOAI, full RC evidence bundle, custom integrations) come **after** this baseline passes.

### Prerequisites (one-time)

| Step | Command / doc | Pass criterion |
| --- | --- | --- |
| API reachable | `dotnet run --project ArchLucid.Cli -- doctor` | Connected + schema OK |
| SQL configured | `ConnectionStrings:ArchLucid` documented in run notes | `/health/ready` includes database healthy |
| Architect login | [OPERATOR_QUICKSTART.md](../library/customer-facing/OPERATOR_QUICKSTART.md) | Can open architect workspace |

### The five-step lane (first-time architect — guided intake recommended)

1. **Guided intake** — open `/reviews/new`, use **Guided intake (recommended)**, enter intent/outcome/actors, admit the draft, answer or skip MUST questions, submit to spawn a review. Capture `runId`.
2. **Execute** — `POST /v1/architecture/review/{runId}/execute` (or UI equivalent) to ready-to-finalize state.
3. **Finalize** — finalize architecture package (API: `commit` / golden manifest); confirm `goldenManifestId` on review detail.
4. **Artifacts** — `GET /v1/artifacts/signed-review-records/{manifestId}` returns â‰¥ 1 descriptor.
5. **Proof packet** — `dotnet run --project ArchLucid.Cli -- pilot proof-packet <runId> --out artifacts/proof-packet/<runId>`; read `sponsor-proof-packet-index.md` and `limitations.md`.

**Expert/API shortcut:** `POST /v1/architecture/request` remains valid when the architect already has a complete brief.

**Time budget (lane):** first-value timing targets PASS â‰¤ 10 minutes create→finalize→artifact per `V1_RELEASE_CHECKLIST.md`. That is the **operator first-win** gate for this lane — complementary to Â§2.4 operational metrics (**Average run duration** < 5 min target; **Wizard-to-finalize** aspirational p50 â‰¤ 15 min), not a substitute for those scorecard rows.

### Strict verification (recommended before sponsor handoff)

| Gate | Command | Notes |
| --- | --- | --- |
| Release smoke (RC profile) | `.\scripts\release-smoke-rc.ps1 -ResultOut artifacts/release-smoke/result.json` | Requires SQL + Node; proves live UI↔SQL parity |
| Strict RC evidence | `.\scripts\Invoke-FirstPilotStrictPath.ps1` | Default for release candidates — non-strict is preliminary only |
| Readiness (fast) | `.\scripts\run-readiness-check.ps1` | Use when SQL not wired yet |

### Explicit non-goals for this lane

- Real Azure OpenAI / PilotStrict real-mode evidence (see [FIRST_REAL_VALUE.md](../library/FIRST_REAL_VALUE.md) as a **second** lane).
- Full merge-blocking SQL regression (CI job — not required for first local win).
- Commerce checkout or reference-customer publication.

### When the lane fails

Copy the **`--- FAILURE (triage) ---`** block from the failing script ([PILOT_GUIDE.md](../library/customer-facing/PILOT_GUIDE.md#when-you-report-an-issue)) and include `GET /version` + correlation id.

### Related (minimum viable lane)

- V1 scope core path: [V1_SCOPE.md](../library/V1_SCOPE.md) Â§4
- Differentiator talking points: [DIFFERENTIATION_PROOF_PACKET.md](DIFFERENTIATION_PROOF_PACKET.md#deal-cycle-heuristic-matrix)

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

**Sponsor headline rule:** Demo-derived and estimate-basis ROI figures never render as top-line KPIs on sponsor-facing artifacts. They appear only inside a clearly labeled illustrative container, or are suppressed with a call-to-action to supply buyer-provided baselines. Buyer-provided (and uploaded actual/amortized) figures remain headline-eligible.
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
| **Run success rate** | Percentage of runs that reach "Committed" status without errors | â‰¥ 90% | _______% | Run status counts in API or UI |
| **Average run duration** | Wall-clock time from run creation to manifest availability | < 5 min | _______ min | `archlucid.authority.run_duration_ms` OTel histogram |
| **Wizard-to-finalize wall-clock** | Minutes from wizard submit to first finalized architecture package (wizard-sourced runs only; metric key still `wizard_to_committed_minutes`) | p50 â‰¤ 15 min (aspirational) | p50 _______ / p95 _______ min | `archlucid.pilot.wizard_to_committed_minutes` OTel histogram (`execution_mode`, `preset_used`) |
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

**Qualitative success threshold:** Average score â‰¥ 3.5 across all questions at pilot end.

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

## Customer onboarding operating playbook {#customer-onboarding-operating-playbook}

Former standalone: `docs/go-to-market/CUSTOMER_ONBOARDING_PLAYBOOK.md` → this section.

**Audience:** Customer success, sales engineering, and account management teams onboarding new SaaS customers.

This playbook aligns with the six-week pilot timeline above and the technical quickstart in [../OPERATOR_QUICKSTART.md](../library/customer-facing/OPERATOR_QUICKSTART.md).

**Pricing:** Current tier pricing, pilot fee, and design-partner terms are in [PRICING_PHILOSOPHY.md Â§4–Â§5](PRICING_PHILOSOPHY.md). Do not restate prices here.

**Enterprise hosted SaaS:** Use the step-by-step checklist in [`HOSTED_ENTERPRISE_ONBOARDING_CHECKLIST.md`](../library/HOSTED_ENTERPRISE_ONBOARDING_CHECKLIST.md) for SCIM, SAML/OIDC, policy packs, governance, and audit export wiring (ArchLucid-hosted only — not self-hosted V2). For SAML workforce SSO, complete **[Â§2.1 claim-mapping tables](../library/HOSTED_ENTERPRISE_ONBOARDING_CHECKLIST.md#saml-claim-mapping-reference)** (Entra, Okta, Ping) and pre-flight with **`archlucid auth validate-saml`** before cutover.

**Custom policy pack authoring (PS):** After the Customer's **first committed manifest**, review whether recurring finding themes or governance gaps indicate a need for customer-specific packs beyond bundled **`PlatformDefault`** packs. When gaps are consistent across runs, position the productized SKUs from the public **`/pricing`** page (Custom Policy Pack Authoring section), [PRICING_PHILOSOPHY.md Â§4.2](PRICING_PHILOSOPHY.md#42-custom-policy-pack-authoring-professional-services), and the SoW template [`CUSTOM_POLICY_PACK_AUTHORING_SOW_TEMPLATE.md`](CUSTOM_POLICY_PACK_AUTHORING_SOW_TEMPLATE.md). Prefer **ArchLucid-owned (shared)** tier when Customer accepts generalized pattern reuse; use **customer-exclusive** when confidentiality dominates. Do not quote PS fees outside the canonical pricing files.

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
| Scorecard metrics baseline captured | Joint | Pre-pilot values recorded per Â§2 |

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

**Action on Red:** Escalate internally; engage sponsor sponsor on customer side if accessible; assess whether pilot extension or scope change is needed.

### Handoff to steady-state

After successful pilot conversion:

- Transition from pilot CSM touchpoints to **steady-state** cadence (quarterly business review).
- Activate health scoring per [customer health scoring](#1-customer-health-scoring).
- Enter renewal timeline per [renewal and expansion playbook](#renewal-and-expansion-playbook).

---

## 5. Success criteria

### 5.1 Minimum (pilot is viable for continued use)

| Criterion | Threshold |
|-----------|-----------|
| Review cycle time reduction | â‰¥ 25% reduction vs. baseline |
| Run success rate | â‰¥ 85% |
| Finding usefulness (qualitative) | Average â‰¥ 3.0 |
| At least one compliance gap caught pre-deploy | â‰¥ 1 finding that would have been missed manually |

### 5.2 Target (pilot supports a purchase recommendation)

| Criterion | Threshold |
|-----------|-----------|
| Review cycle time reduction | â‰¥ 40% reduction vs. baseline |
| Run success rate | â‰¥ 90% |
| Finding usefulness (qualitative) | Average â‰¥ 3.5 |
| Compliance gaps caught pre-deploy | â‰¥ 3 findings |
| Governance compliance rate | â‰¥ 80% of manifests pass gate |
| Overall qualitative score | Average â‰¥ 3.5 across all questions |
| ROI projection (annualized) | â‰¥ 300% using actual pilot numbers in ROI model |

### 5.3 Stretch (pilot demonstrates transformative value)

| Criterion | Threshold |
|-----------|-----------|
| Review cycle time reduction | â‰¥ 60% reduction vs. baseline |
| Run success rate | â‰¥ 95% |
| Finding usefulness (qualitative) | Average â‰¥ 4.0 |
| Compliance gaps caught pre-deploy | â‰¥ 5 findings |
| Architect willingness to recommend | Average â‰¥ 4.5 |
| ROI projection (annualized) | â‰¥ 500% using actual pilot numbers |

---

## 6. Report template for leadership

Use this structure when presenting pilot results to leadership for a purchase decision.

Before presenting, run through [`QUOTE_TO_PROOF_PACKET.md#commercial-conversion-checklist`](QUOTE_TO_PROOF_PACKET.md#commercial-conversion-checklist). It distinguishes send, hold, and deferred cases so the sponsor narrative does not outrun the evidence.

### Sponsor summary (1 paragraph)

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

## Proof-of-value snapshot assembly {#proof-of-value-snapshot-assembly}

Former standalone body: `docs/library/PROOF_OF_VALUE_SNAPSHOT.md` → this section (filename kept as a path-stable alias). Complements [Â§6 Report template for leadership](#6-report-template-for-leadership) and [`#pilot-roi-measurement`](#pilot-roi-measurement). **Not** a financial guarantee or substitute for purchaser legal diligence.

**Path-stable alias:** [`../library/PROOF_OF_VALUE_SNAPSHOT.md`](../library/PROOF_OF_VALUE_SNAPSHOT.md).

**Last reviewed:** 2026-07-31

Use this playbook when stakeholders ask for **one** cohesive evidence package after a staged evaluation: **time-to-manifest** under real AOAI (full authority run), **API stability** under scripted concurrent traffic (**k6** summary JSON), **tangible savings** modeled with the Pilot ROI workbook ([`#pilot-roi-measurement`](#pilot-roi-measurement); templates in [`ROI_MODEL.md`](ROI_MODEL.md)), and **explainability completeness** (`ExplainabilityTrace`) surfaced per finding via the deterministic explainability endpoint.

### Objective

Deliver a reproducible dossier tying four independent signals:

1. **Throughput of the pilot workflow** — end-to-end wall clock from scripted create → committed manifest (`benchmark-real-mode-e2e.ps1`).
2. **Service behavior under scripted load** — aggregate HTTP latency and failure rate — **k6** `--summary-export` (`tests/load/ci-smoke.js` is the smallest merge-blocking profile; fuller baselines live in [`LOAD_TEST_BASELINE.md`](../library/LOAD_TEST_BASELINE.md)).
3. **Economics grounded in organizational inputs** — values copied from Pilot ROI spreadsheets or first-value Markdown tables (`MEASURED_VS_BASELINE`, deltas in [`#pilot-roi-measurement`](#pilot-roi-measurement) Â§4–5 narratives).
4. **Auditability completeness** — per-finding `traceCompletenessRatio` (`GET /v1/explain/runs/{runId}/findings/{findingId}/explainability`) aggregated qualitatively (table of sample findings + Prometheus histogram `archlucid_explainability_trace_completeness_ratio` in [`OBSERVABILITY.md`](../library/OBSERVABILITY.md) when telemetry export is configured).

### Assumptions

- Evidence is sourced from **non-production** stacks unless procurement explicitly sanctions production sampling.
- You will **redact** tenant-identifying strings before sharing externally (run IDs alone are often acceptable; customer names belong in prose, not pasted SQL).
- The benchmark JSON (`artifacts/benchmark-real-mode-latest.json`) is **gitignored** — store copies beside this narrative snapshot (SharePoint attachment, Evidence folder, Deal Room binder).

### Constraints

- **Secrets never appear**: benchmark JSON exposes only `environment.apiKeyEnvPresent` booleans — never keys.
- k6 summaries contain **rates and percentiles**, not customer payloads.
- Regulatory sign-off (**SOC 2**, **legal**, **procurement**) remains separate from engineering evidence.

### Inputs (minimal artifact set)

| Signal | Canonical source | Retrieval |
| --- | --- | --- |
| Full-run timing | Stable JSON (`schemaVersion` `1.0.0`, `kind` `archlucid.benchmark.realModeE2e.v1`) | Run `scripts/benchmark-real-mode-e2e.ps1` (`-SkipArtifact` for CI-only stdout) — see [`FIRST_REAL_VALUE.md#real-mode-e2e-benchmark`](../library/FIRST_REAL_VALUE.md#real-mode-e2e-benchmark). |
| Load-test envelope | `k6-ci-summary.json` (CI) or `k6-summary.json` (manual `record_baseline`) | `k6 run ... --summary-export path.json`; see **K6 summary export JSON** in [`FIRST_REAL_VALUE.md#k6-summary-export-json`](../library/FIRST_REAL_VALUE.md#k6-summary-export-json). |
| ROI narrative | Pilot ROI tables / computed deltas | Copy cells from spreadsheets aligned with [`#pilot-roi-measurement`](#pilot-roi-measurement) measurement rows; reconcile with [`ROI_MODEL.md`](ROI_MODEL.md) value levers — avoid double-counted savings categories. |
| Trace completeness score | Persisted `ExplainabilityTrace` | Call explainability REST shape returning `traceCompletenessRatio` and `missingTraceFields` (`ExplanationController`), or correlate OTel Prometheus metric family documented in [`OBSERVABILITY.md`](../library/OBSERVABILITY.md). |

### Assembly workflow

1. **Capture benchmark JSON** immediately after each formal pilot run scenario (warm stack, AOAI quotas healthy). Archive with filename `benchmark-real-mode-<YYYYMMDD>-run-<suffix>.json` if retaining multiple attempts.
2. **Capture k6 summary** from the tier you need: merge-blocking CI (`tests/load/ci-smoke.js`) for operator API smoke, or Compose baseline (`tests/load/hotpaths.js`) for deeper hot-path evidence — store JSON alongside the benchmark file.
3. **Snapshot ROI numbers** from the pilot workbook (hours saved, delta vs baseline cost, compliance gap reduction the customer confirmed) — paste into the template table below.
4. **Sample explainability** on 3–5 representative findings (high/medium severity mix). Record `traceCompletenessRatio` and note whether `missingTraceFields` is empty for each.
5. **Write the sponsor one-pager** using the [sponsor narrative template](#pov-sponsor-narrative-template) below (export to PDF or slide — both start from the same Markdown).

**Structured pilot row (anonymized):** [PMF buyer-safe evidence row](../archive/gtm-internal/PMF_VALIDATION_TRACKER.md#21a-buyer-safe-evidence-row-template) — use when populating [PMF_VALIDATION_TRACKER.md](../archive/gtm-internal/PMF_VALIDATION_TRACKER.md) alongside this snapshot.

### Sponsor narrative template (copy into an email or deck) {#pov-sponsor-narrative-template}

| Field | Value |
| --- | --- |
| **Evidence date / UTC window** |  |
| **Environment note** | e.g., dedicated pilot tenant vs. shared sandbox |
| **Real-mode benchmark** (`totalMs`, `targets.totalWallClockUnderFiveMinutes`) |  |
| **k6** — global `http_req_duration` **`p(95)`** ms; `http_req_failed` rate |  |
| **Pilot ROI deltas** — hours reclaimed / modeled annual savings bracket | cite spreadsheet row refs |
| **Explainability completeness** — min / avg ratio across sampled findings |  |

**Storyline bullets (adapt):**

1. We measured **X** minutes from request to committed manifest under real Azure OpenAI configuration — **meets / does not meet** the **< 5 minute** design target (see `targets.totalWallClockUnderFiveMinutes`).
2. Concurrent API smoke shows **p95 Y ms** with **failed rate Z** under the recorded k6 profile — **stable / needs capacity follow-up** before broad rollout.
3. Modeled savings using customer-supplied hours and risk assumptions land at **$A–$B** annualized (methodology: [`#pilot-roi-measurement`](#pilot-roi-measurement), assumptions column completed by **< role >**).
4. Explainability traces average **ratio R** across pilot findings — evidence is structured for auditor follow-up (`ExplainabilityTrace` fields present / gaps listed per finding).

### Security

- Never attach raw API keys, PATs, or Azure OpenAI endpoint keys.
- If sharing HTTP captures, strip cookies and auth headers.
- Treat committed manifest excerpts as **confidential** unless the customer approves distribution.
- Select a **redaction profile** before building or forwarding any pack — [`PROOF_PACK_REDACTION_PROFILES.md`](../library/PROOF_PACK_REDACTION_PROFILES.md) (`internal-pilot`, `customer-approved-external`, `anonymous-benchmark`).

### Operational considerations

- Re-run the bundle after **material** changes: model deployment swap, token budget change, new region, or SQL tier lift.
- Version-control this narrative in your **customer** workspace; the repository copy here is the **method** only — numbers change per engagement.

### References

- [`PROOF_PACK_REDACTION_PROFILES.md`](../library/PROOF_PACK_REDACTION_PROFILES.md) — operational redaction profiles for sponsor and benchmark packs.
- [`FIRST_REAL_VALUE.md#real-mode-e2e-benchmark`](../library/FIRST_REAL_VALUE.md#real-mode-e2e-benchmark) — PowerShell schema + k6 JSON format (`REAL_MODE_BENCHMARK.md` alias).
- [`LOAD_TEST_BASELINE.md`](../library/LOAD_TEST_BASELINE.md) — k6 scenarios, thresholds, baseline table conventions.
- [`#pilot-roi-measurement`](#pilot-roi-measurement) Â· [`ROI_MODEL.md`](ROI_MODEL.md) — measurement + business case linkage.
- [`OBSERVABILITY.md`](../library/OBSERVABILITY.md) — trace completeness histogram and alert rationale.
- API: `GET /v1/explain/runs/{runId}/findings/{findingId}/explainability` (see OpenAPI / `ExplanationController`).

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

**Recommendation:** â˜ Proceed with bounded pilot â˜ Defer â˜ Reject (capture short reason below)

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

### Success measures (mapped to [`#pilot-roi-measurement`](#pilot-roi-measurement) primary metrics)

| Area | Target (qualitative or numeric) |
|------|----------------------------------|
| Speed — time to finalized architecture package | |
| Artifact readiness | |
| Traceability / evidence | |
| Stakeholder confidence | |

**Minimum bar:** See [`#minimum-success-bar`](#minimum-success-bar) / [`#strong-success-bar`](#strong-success-bar) and this scorecard Â§5.

### Commercial / procurement notes (optional)

- Trust index: [`trust-center.md`](trust-center.md)
- Fast lane: [`QUOTE_TO_PROOF_PACKET.md#0-pilot-vs-procurement-fast-lane`](QUOTE_TO_PROOF_PACKET.md#0-pilot-vs-procurement-fast-lane) (`TRANSACTABLE_PROCUREMENT_PATH.md` alias)

### Sign-off

| Role | Name | Date |
|------|------|------|
| Sponsor | | |
| Architecture lead | | |
| Security (if engaged) | | |

Former standalone: `docs/go-to-market/STEERING_DECISION_MEMO_TEMPLATE.md` → this section.

---

## Pilot ROI measurement {#pilot-roi-measurement}

Former standalone body: `docs/library/PILOT_ROI_MODEL.md` → this section (filename kept as a path-stable alias for product/CI strings such as `docs/library/PILOT_ROI_MODEL.md` and bare `PILOT_ROI_MODEL.md`).

**Status:** Practical V1 pilot-evaluation guidance — **how to measure pilot success using capabilities ArchLucid supports today**. It is not a pricing model and it is not a guaranteed ROI calculator.

**Narrative of record for sponsors:** [`EXECUTIVE_SPONSOR_BRIEF.md`](EXECUTIVE_SPONSOR_BRIEF.md). This section is the measurement companion; keep headline buyer claims in the brief.

### What this model is for

An ArchLucid pilot should answer one business question clearly:

> **Does ArchLucid reduce the time, ambiguity, and manual effort required to move from an architecture request to a reviewable, defensible architecture package?**

For most pilots, the goal is **not** to prove enterprise-wide transformation. The goal is to prove that a real team can:

- produce a finalized architecture package more quickly,
- produce reviewable artifacts with less manual assembly,
- improve traceability and governance evidence,
- and shorten the path to architecture discussion or approval.

### The simplest sponsor-level value story

A successful pilot should let a sponsor say:

- **We got from request to reviewable architecture output faster.**
- **We reduced manual preparation of architecture artifacts.**
- **We improved visibility into what was decided, why, and what changed.**
- **We created a stronger evidence trail for governance and review.**

That is a credible V1 value story.

### What to measure before the pilot

Capture a small baseline before using ArchLucid.

#### Baseline questions

For one representative architecture workflow, record:

1. **How long does it currently take** to go from architecture request / brief to a reviewable package?
2. **How much manual effort is required** to assemble the architecture narrative, manifest-like content, diagrams, and supporting evidence?
3. **How hard is it to explain what changed** between two versions of a design?
4. **How much governance evidence is missing or manually reconstructed** during review?
5. **How much architect time is spent on packaging and review preparation rather than on design quality?**

ArchLucid now optionally captures the **median hours from architecture request to reviewable package** (question 1) electronically at **self-service trial signup** (optional baseline review-cycle hours), persists it on the tenant row, and surfaces **before vs measured** review-cycle deltas automatically in the tenant **value-report DOCX** and the **first-value report** (Markdown and PDF), so sponsors see a consistent narrative without operator post-editing when the prospect supplied a number or when the conservative ROI-model default applies.

#### Keep the baseline light

Do not create a giant measurement program. For most pilots, a simple baseline is enough:

- One representative architecture use case
- One team or one architect group
- One or two current-state cycle-time estimates
- One rough estimate of manual prep effort
- One qualitative assessment of governance friction

### What to measure during the pilot

Use the Core Pilot path as the default evaluation lane:

**Create review → Execute → Finalize → Review artifacts**  
(API/CLI may still say **commit** / `ReadyForCommit`.)

#### Primary pilot metrics

These are the most useful V1 measures.

| Metric | Why it matters | How to judge | Computed by ArchLucid? |
|--------|----------------|--------------|------------------------|
| **Time to finalized architecture package** | Measures speed from request to durable architecture output | Faster than current-state workflow, or meaningfully more predictable | **Yes — from review start to finalize timestamps in the *Computed deltas* section of the first-value report (Markdown + PDF).** Metric keys may still say *committed manifest* in older exports. |
| **Findings (total + by severity)** | Measures how much risk the agents surface that a human would otherwise miss | Severity mix should be defensible to a reviewer | **Yes — aggregated from run findings in the first-value report.** |
| **LLM calls for the run** | Measures cost-shape and behavioural footprint of one run | Should fit the cost envelope agreed during pilot kickoff | **Yes — counted from the run's agent execution trace in the report.** |
| **Audit rows for the run** | Measures how thoroughly the run is observable / forensically reviewable | Higher is generally better, with caveats below | **Yes — from the run audit trail (capped display when very large; may show as a lower bound).** |
| **Top-severity finding evidence chain** | Lets a reviewer trace one finding back to the manifest version, snapshot ids, and graph nodes used to produce it | A sponsor can hand a reviewer the chain ids and they resolve | **Yes — from the highest-severity finding's evidence chain in the report.** |
| **Time to reviewable artifact package** | Measures how quickly stakeholders can review something concrete | Faster package preparation with less manual assembly | No — operator-filled (qualitative). |
| **Manual preparation effort reduced** | Measures architect/admin time saved | Fewer hand-built documents, fewer manual stitching steps | No — operator-filled (qualitative). |
| **Decision traceability completeness** | Measures whether decisions and evidence are easier to explain | More complete, easier-to-follow review narrative | No — operator-filled (qualitative). |
| **Change visibility between reviews** | Measures whether review of revisions is clearer | Stakeholders can see what changed and why more quickly | No — operator-filled (qualitative). |
| **Governance evidence readiness** | Measures whether approvals/reviews have better support material | Less reconstruction during review or approval prep | No — operator-filled (qualitative). |

#### How to read the demo numbers

The first-value report (Markdown and PDF) and the sponsor one-pager PDF compute the five "Computed by ArchLucid" rows above straight from persisted run state. **Baseline confidence appendix:** Markdown and PDF append an **ROI evidence completeness** section so sponsors see whether dollar narratives rely on tenant-captured baselines (**Strong / Partial**) or illustrative defaults (**Low confidence**).

**Baseline input basis labels** (sponsor outputs and proof-package badges — do not conflate):

| Label | Meaning | External ROI claim |
| --- | --- | --- |
| **buyer-provided** | Tenant supplied baseline at signup or via settings | Allowed when freshness is current |
| **measured** | Computed from finalized architecture packages in-window | Strongest cycle-time delta narrative |
| **defaulted** | Conservative value from `PILOT_ROI_MODEL.md` options | Partial confidence — label as model default |
| **demo-derived** | Contoso / demo tenant markers | Block external quotes; walkthrough only |
| **not-collected** | `NoMeasurementYet` — no baseline captured | Low confidence — no sponsor-safe dollar savings |

Every first-value report also includes a **Buyer-safe proof package contract**. Treat that table as the send/no-send checklist before a sponsor email: architecture review identity, support run id, time to finalized architecture package, findings by severity, top finding evidence-chain pointer, audit-row count or lower bound, LLM-call count, ROI evidence confidence, and demo-data warning when applicable. Do not hand-edit missing fields into the report; either rerun the check, explain the gap, or mark the proof package incomplete.

When the report is generated **for a canonical Contoso Retail demo run** (or any other seeded demo tenant run), every report renders the banner:

> _demo tenant — replace before publishing._

Treat that banner as a **non-negotiable redaction marker**:

- **Do not screenshot** the computed-deltas table from a demo run for an external deck without removing the numbers or replacing them with figures from a live tenant.
- **Do not quote** "ArchLucid produced N findings in T minutes for our pilot" using a demo number — the seed is deterministic and was tuned for clarity, not to represent any specific customer's environment.
- **Do** use the demo numbers to walk a sponsor through *what the report will look like* once they run it against their own tenant — this is the entire point of having the seed render the same shape as a live pilot.

#### Secondary pilot metrics

These matter, but should not dominate a first pilot.

| Metric | Why it matters |
|--------|----------------|
| **Operator onboarding time** | Shows whether first use is practical |
| **Support incidents / blockers** | Shows whether self-sufficiency is real enough |
| **Export usefulness** | Shows whether artifacts are usable outside the tool |
| **Reviewer confidence** | Shows whether the outputs are trusted, not just produced |

### What a successful pilot should demonstrate

A successful pilot does **not** require every layer of the product.

For V1, success usually looks like this:

#### Minimum success bar {#minimum-success-bar}

- A real architecture request was created and executed.
- The review produced a finalized architecture package.
- Stakeholders reviewed artifacts generated from that run.
- The team judged the output materially easier to review or package than the current-state approach.

#### Strong success bar {#strong-success-bar}

- The pilot reduced time from request to reviewable package.
- The pilot reduced manual artifact-preparation effort.
- Reviewers had clearer visibility into decisions, evidence, and changes.
- The team could explain why ArchLucid should be used again for similar architecture work.

#### Exceptional success bar

- The pilot created visible sponsor confidence.
- The team wants to expand into Operate (analysis workloads) or Operate (governance and trust).
- Governance, audit, or architecture review stakeholders actively prefer the ArchLucid flow.

### Suggested pilot scorecard (1–5)

Use a simple 1–5 rating for each item.

| Area | Question | Score 1–5 |
|------|----------|-----------|
| **Speed** | Did we get to a finalized architecture package faster or more predictably? | |
| **Artifact readiness** | Did we get to a reviewable package with less manual assembly? | |
| **Traceability** | Were decisions and evidence easier to explain? | |
| **Change clarity** | Was it easier to understand what changed between reviews? | |
| **Governance readiness** | Did the pilot improve review or approval readiness? | |
| **Architect usability** | Could architects complete the Core Pilot path without excessive friction? | |
| **Stakeholder confidence** | Did reviewers trust the outputs enough to use them seriously? | |
| **Repeatability** | Would we use this again for a similar architecture request? | |

#### Reading the 1–5 scorecard

- **32–40** = strong pilot result
- **24–31** = promising, but more hardening or scope narrowing may be needed
- **Below 24** = pilot likely proved interest but not enough operational or business value yet

### How sponsors can describe the result internally

Here is the kind of internal summary a sponsor should be able to use after a good pilot:

> ArchLucid shortened the path from architecture request to reviewable output, reduced manual packaging effort, and gave us a clearer evidence trail for review and governance. The pilot suggests that the product can improve architecture throughput and decision defensibility without requiring us to jump immediately into the full advanced feature set.

That is a credible V1 outcome statement.

### What not to over-claim

Do **not** over-claim these from an early pilot unless you have direct evidence:

- enterprise-wide cost savings,
- broad productivity transformation,
- full governance automation,
- universal architecture standardization,
- reduced infrastructure spend,
- reduced headcount.

A strong V1 pilot should prove **workflow improvement and decision support**, not magic.

### Best practice for pilot scope

For the cleanest ROI story:

- Use **one clear architecture use case**.
- Stay on the **Core Pilot** path first.
- Measure speed, packaging effort, and evidence quality.
- Only then expand into **Operate (analysis workloads)** or **Operate (governance and trust)**.

This keeps the pilot honest and makes sponsor judgment easier.

### Measurement summary

The most defensible ArchLucid pilot ROI story is simple:

- faster movement from request to finalized architecture package,
- less manual effort assembling reviewable architecture outputs,
- clearer visibility into decisions and changes,
- and better evidence for governance or architecture review.

If a pilot proves those four things, it is commercially meaningful.

---

## Renewal and expansion playbook {#renewal-and-expansion-playbook}

Former standalone body: `docs/go-to-market/RENEWAL_EXPANSION_PLAYBOOK.md` → this section (filename kept as a path-stable alias). Includes customer health scoring (formerly `CUSTOMER_HEALTH_SCORING.md`).

**Audience:** Customer success, account management, sales leadership, and product leadership.  
**Path-stable alias:** [`RENEWAL_EXPANSION_PLAYBOOK.md`](RENEWAL_EXPANSION_PLAYBOOK.md).

### 1. Customer health scoring {#1-customer-health-scoring}

Detect **churn risk** early, identify **expansion** opportunities, and give the CS team a **single composite health score** per account. Starts manual (Phase 1) and evolves toward in-product automation.

#### Health dimensions

| Dimension | Weight | Signals | Data source |
|-----------|--------|---------|-------------|
| **Engagement** | 30% | Runs per week, unique active operators, login frequency | `dbo.Runs` (created dates), `dbo.AuditEvents` (actor diversity) |
| **Breadth** | 20% | Finding engine types used, comparison runs, export frequency, workspaces active | Run metadata, audit events |
| **Quality** | 15% | Average agent output quality score, explainability trace completeness ratio, product-learning disposition mix (`Trusted` vs `Revised` / `Rejected` / `NeedsFollowUp`) | OTel metrics (`archlucid.authority.agent_output_quality`, `archlucid.explanation_trace_completeness_ratio`), `dbo.ProductLearningPilotSignals` |
| **Governance adoption** | 20% | Approval requests created/resolved, policy packs configured, segregation of duties active | `dbo.GovernanceApprovalRequests`, governance audit events |
| **Support** | 15% | Ticket volume, severity distribution, time-to-resolution, CSAT | External support tool (placeholder) |

#### Scoring model

##### Per-dimension scale (1–5)

| Score | Label | Criteria (example: Engagement) |
|-------|-------|-------------------------------|
| **5** | Excellent | 10+ runs/week, 5+ active operators |
| **4** | Good | 5–9 runs/week, 3–4 active operators |
| **3** | Adequate | 2–4 runs/week, 2 active operators |
| **2** | Needs attention | 1 run/week, 1 active operator |
| **1** | At risk | No runs in 2+ weeks, no logins |

Each dimension has its own scale definition (adapt from template above). Document per-dimension thresholds when real data becomes available.

##### Composite score

**Composite = Î£(dimension score Ã— dimension weight)**

| Composite range | Health status | Color |
|----------------|---------------|-------|
| **4.0–5.0** | Healthy | Green |
| **2.5–3.9** | Needs attention | Yellow |
| **1.0–2.4** | At risk | Red |

#### Implementation phases

| Phase | Scope | Effort |
|-------|-------|--------|
| **Phase 1 (manual)** | CS team fills in a spreadsheet monthly using SQL queries and support data. Review in team standup. | Low — spreadsheet + ad hoc SQL |
| **Phase 2 (semi-automated)** | Scheduled SQL report (stored procedure or Python script) emailed to CS weekly. Include product-learning feedback disposition counts; support data manually appended. | Medium — script + scheduled job |
| **Phase 3 (in-product)** | Admin dashboard with health metrics per tenant/workspace. Alerting on Red accounts. Support integration via API. | High — UI + backend + integration |

**Start with Phase 1.** Build the habit of reviewing health before building tooling.

##### Phase 1 SQL queries (starter)

```sql
-- Engagement: runs per week for a tenant (last 4 weeks)
SELECT
    DATEPART(ISOWK, CreatedUtc) AS Week,
    COUNT(*) AS RunCount,
    COUNT(DISTINCT CreatedBy) AS UniqueOperators
FROM dbo.Runs
WHERE TenantId = @TenantId
  AND CreatedUtc >= DATEADD(WEEK, -4, GETUTCDATE())
GROUP BY DATEPART(ISOWK, CreatedUtc)
ORDER BY Week;

-- Governance adoption: approval requests in last 30 days
SELECT COUNT(*) AS ApprovalRequests
FROM dbo.GovernanceApprovalRequests
WHERE TenantId = @TenantId
  AND CreatedUtc >= DATEADD(DAY, -30, GETUTCDATE());
```

#### Health action playbooks

| Health status | CS action |
|---------------|-----------|
| **Healthy** (Green) | Expansion conversation; request case study / reference; quarterly business review |
| **Needs attention** (Yellow) | Proactive check-in within 1 week; offer training session or feature walkthrough; identify blockers |
| **At risk** (Red) | Escalate to account exec within 48 hours; engage sponsor sponsor on customer side; assess root cause (product gap, onboarding failure, champion departure) |

### 2. Renewal timeline (annual subscription)

| Milestone | Action | Owner |
|-----------|--------|-------|
| **R-90 days** | Review health score ([Â§1](#1-customer-health-scoring)); analyze usage trends; identify expansion signals | CSM |
| **R-60 days** | Renewal conversation with champion; review ROI model actuals vs pilot projections ([ROI_MODEL.md](ROI_MODEL.md)); discuss tier alignment | CSM + Account Exec |
| **R-30 days** | Commercial terms finalized; pricing adjustment if tier change; order form prepared ([ORDER_FORM_TEMPLATE.md](ORDER_FORM_TEMPLATE.md)) | Account Exec |
| **Renewal date** | Signed order form; billing updated; success confirmation email | Operations |
| **R+7 days** | Post-renewal check-in; set goals for next term | CSM |

### 3. Expansion triggers

| Trigger | Signal | Opportunity |
|---------|--------|-------------|
| **New team requests access** | Champion introduces colleagues from another BU | Add seats, add workspace |
| **Governance adoption growing** | Policy packs configured, approval workflows active across projects | Tier upgrade (Team → Professional) |
| **New use case** | Customer asks about compliance reviews, cost optimization, security reviews | Additional workspaces, professional services |
| **Scorecard stretch goals met** | Pilot results exceed targets per this scorecard | Multi-year commitment, expanded seat count |
| **Run overage** | Consistently exceeding tier run allowance | Tier upgrade or run pack add-on |

### 4. Expansion motion

| Step | Action | Owner |
|------|--------|-------|
| 1 | Identify expansion trigger from health scoring or customer conversation | CSM |
| 2 | Provide champion with updated ROI model populated with actual usage data | CSM |
| 3 | Champion presents value report to CTO/VP (use [ROI_MODEL.md](ROI_MODEL.md) leadership guide) | Customer champion |
| 4 | Technical: provision additional workspaces, configure SSO for new groups | ArchLucid + Customer IT |
| 5 | Commercial: updated order form with new tier/seats/workspaces | Account Exec |

### 5. Churn prevention

#### At-risk intervention

When health scoring indicates **Red** status:

1. **Immediate:** CSM reaches out within 48 hours with specific, actionable help (not generic check-in).
2. **Root cause:** Diagnose — is it product gap, onboarding failure, champion departure, or budget issue?
3. **Escalation:** Engage account exec and, if accessible, sponsor sponsor on the customer side.
4. **Recovery plan:** Offer training, dedicated support session, feature guidance, or pilot extension.

#### Exit interview

If a customer churns:

- Conduct a **30-minute exit interview** (phone or video, not survey).
- Ask: What did you expect? What was missing? Would you reconsider if X changed?
- Document in CRM and share with product team monthly.

#### Win-back

- Maintain a **churned customer list** with reasons and last-known champion.
- On relevant feature releases, send a personalized update to churned champions.
- Offer a **re-trial** (14 days, Professional tier) for customers churned > 6 months ago.

### 6. Metrics (renewal / expansion)

| Metric | Target (placeholder) | Definition |
|--------|---------------------|------------|
| **Net revenue retention (NRR)** | > 110% | (Starting ARR + expansion âˆ’ contraction âˆ’ churn) / Starting ARR |
| **Gross churn rate** | < 10% annual | Lost ARR / Starting ARR |
| **Expansion revenue %** | > 25% of new bookings | Expansion ARR / Total new ARR |
| **Time-to-renewal-decision** | < 30 days before expiry | Days between first renewal conversation and signed order |

---

## Dogfood pilot kit (ArchLucid as subject) {#dogfood-pilot-kit}

Former standalone body: `docs/library/DOGFOOD_PILOT_KIT.md` → this section (filename kept as a path-stable alias for GTM **M-93** / PMF **Pilot A**). Internal only — not a customer design-partner substitute. Complements [`#pilot-roi-measurement`](#pilot-roi-measurement) and [`#minimum-viable-pilot-success-lane`](#minimum-viable-pilot-success-lane).

**Path-stable alias:** [`../library/DOGFOOD_PILOT_KIT.md`](../library/DOGFOOD_PILOT_KIT.md).

**Last reviewed:** 2026-07-31

**Audience:** ArchLucid product, engineering, and GTM teammates running an **internal** pilot where the system under review is internal architecture work (not a labeled customer deployment).

**Purpose:** Produce **real** baseline and pilot-outcome observations aligned to **[CORE_PILOT.md](../CORE_PILOT.md)** and [`#pilot-roi-measurement`](#pilot-roi-measurement) (`PILOT_ROI_MODEL.md` alias) — then record them in **[PMF_VALIDATION_TRACKER.md](../archive/gtm-internal/PMF_VALIDATION_TRACKER.md)** (**Pilot A** slot) **without inventing numbers**.

This is **not** a substitute for external design-partner pilots. It validates flow, tooling, and measurement hygiene before customer-facing scorecards.

### Alignment to Core Pilot

Follow the **four steps** in **[CORE_PILOT.md](../CORE_PILOT.md)** Â§3 as the default lane:

1. Create architecture request
2. Execute the run (pipeline completes)
3. Commit the manifest
4. Review manifest summary and artifacts (exportable package)

**Anti-creep:** Do not expand scope to advanced Operate layers for the first dogfood pass unless the pilot charter explicitly includes them. **[CORE_PILOT.md](../CORE_PILOT.md)** Â§1 explains what stays secondary.

**Subject matter:** Pick one **real** internal initiative (e.g. a subsystem, integration, or platform decision) that would normally get an architecture package — not synthetic demo-only inputs unless you mark outcomes as **non-customer** and never copy demo numerics into **[PMF_VALIDATION_TRACKER.md](../archive/gtm-internal/PMF_VALIDATION_TRACKER.md)** as if they were measured baselines (see [`#pilot-roi-measurement`](#pilot-roi-measurement) Â§4.1.1).

### Baseline capture worksheet (before dogfood)

Ground in [`#pilot-roi-measurement`](#pilot-roi-measurement) Â§3 (especially Â§3.1–Â§3.2). Answer **qualitatively** first; add **hours or counts** only when you actually measured them (interview, ticketing, calendar, or comparable system of record).

| # | Prompt (from ROI model Â§3 spirit) | Your notes (words / ranges OK) | Numeric only if measured |
|---|-----------------------------------|-------------------------------|---------------------------|
| B1 | Current **elapsed time** from “request / brief” to “reviewable package” for one representative workflow | | |
| B2 | **Manual effort** to assemble narrative, manifest-like content, diagrams, evidence | | |
| B3 | **Difficulty explaining what changed** between two design versions (today’s process) | | |
| B4 | **Governance evidence** gaps — what gets reconstructed by hand before review | | |
| B5 | **Architect time split** — packaging vs design quality | | |

**Outputs:**

- Copy **summaries** into your internal charter or this scorecard’s other sections — not straight into **[PMF_VALIDATION_TRACKER.md](../archive/gtm-internal/PMF_VALIDATION_TRACKER.md)** baselines unless the tracker row definitions match numerically.
- For **[PMF_VALIDATION_TRACKER.md](../archive/gtm-internal/PMF_VALIDATION_TRACKER.md)**: leave **Baseline** as **TBD** until you have a defensible number or agreed **Unknown** per tracker Â§2.2; describe gaps only in **Notes**.

### Outcome capture worksheet (after dogfood window)

Ground in [`#pilot-roi-measurement`](#pilot-roi-measurement) Â§4 and Â§4.1 primary metrics table.

| Bucket | What to capture | Where it usually comes from |
|--------|-----------------|------------------------------|
| **Computed (when applicable)** | Time to committed manifest; findings totals/severity; LLM calls; audit row count bounds; evidence chain for top finding | First-value report / run detail / APIs described in ROI Â§4.1 |
| **Operator-judged** | Time to reviewable package; manual prep reduction; traceability; change visibility; governance evidence readiness | Interviews + short written assessment |
| **Secondary** | Onboarding friction, blockers, export usefulness, reviewer confidence | Pilot retro notes |

| # | Prompt | Your notes | Evidence link (internal) |
|---|--------|------------|---------------------------|
| O1 | **Time to committed manifest** for dogfood run(s) vs baseline B1 | | |
| O2 | **Findings** — total and whether mix felt defensible | | |
| O3 | **Cost / footprint** awareness (LLM calls, agreed envelope) | | |
| O4 | **Audit / observability** — enough rows to tell the story | | |
| O5 | **Qualitative bar** — did we meet ROI Â§5.1 minimum success? Â§5.2 strong? | | |

**Outputs:** Prefer this scorecard’s synthesis first; then reflect **honest** **Result** cells in **[PMF_VALIDATION_TRACKER.md](../archive/gtm-internal/PMF_VALIDATION_TRACKER.md)** only when values are **Captured** per tracker Â§2.2 (**TBD**, **Unknown**, **See scorecard**, or real numbers).

### Updating Pilot A in PMF_VALIDATION_TRACKER.md (without inventing numbers)

**Allowed without PMF widening:**

- **Notes** column for **Pilot A** rows — cite this kit, link scorecard, clarify internal dogfood vs external pilot.
- **Status** transitions that match reality (**Pending** → **Captured** when qualitative or numeric evidence exists — see tracker Â§2.2).
- **ICP score** / **ICP segment** when scored per **[BUYER_PERSONAS.md](BUYER_PERSONAS.md#ideal-customer-profile-icp)** (else leave **TBD**).

**Not allowed:** Fabricating **Baseline** or **Result** numerics to “fill the table.” If only qualitative signal exists, use **See scorecard** for **Result** and **Captured** **Status**, per **[PMF_VALIDATION_TRACKER.md](../archive/gtm-internal/PMF_VALIDATION_TRACKER.md)** Â§2.2.

Hypothesis mapping (reminder):

| Tracker row | Typical bridge from dogfood |
|-------------|----------------------------|
| H1 | B1/O1 ↔ hours-per-review framing |
| H2–H3 | Governance / audit — only if pilot touched those workflows |
| H4 | Quality / explainability interview |
| H5 | Provisioning → first Core Pilot completion |

### Related (dogfood kit)

- **[CORE_PILOT.md](../CORE_PILOT.md)** — operator path of record
- [`#pilot-roi-measurement`](#pilot-roi-measurement) — baseline Â§3, during-pilot Â§4–Â§4.1, demo redaction Â§4.1.1
- **[PMF_VALIDATION_TRACKER.md](../archive/gtm-internal/PMF_VALIDATION_TRACKER.md)** — **Pilot A** evidence rows
- **[PILOT_GUIDE.md](../library/customer-facing/PILOT_GUIDE.md)** — fuller pilot onboarding

---

## Related documents

| Doc | Use |
|-----|-----|
| [`#proof-of-value-snapshot-assembly`](#proof-of-value-snapshot-assembly) Â· [`../library/PROOF_OF_VALUE_SNAPSHOT.md`](../library/PROOF_OF_VALUE_SNAPSHOT.md) (alias) | Sponsor PoV dossier assembly (bench + k6 + ROI + explainability) |
| [`#dogfood-pilot-kit`](#dogfood-pilot-kit) Â· [`../library/DOGFOOD_PILOT_KIT.md`](../library/DOGFOOD_PILOT_KIT.md) (alias) | Internal ArchLucid-on-ArchLucid dogfood worksheets (M-93) |
| [`#minimum-viable-pilot-success-lane`](#minimum-viable-pilot-success-lane) Â· [`../library/MINIMUM_VIABLE_PILOT_SUCCESS.md`](../library/MINIMUM_VIABLE_PILOT_SUCCESS.md) (alias) | Five-step operator first-win lane |
| [`#pilot-roi-measurement`](#pilot-roi-measurement) Â· [`../library/PILOT_ROI_MODEL.md`](../library/PILOT_ROI_MODEL.md) (alias) | Pilot measurement companion (formerly standalone) |
| [ROI_MODEL.md](ROI_MODEL.md) | Fill in with actual pilot numbers to calculate ROI (includes operational cost guide) |
| [BUYER_PERSONAS.md](BUYER_PERSONAS.md) | Which persona presents the report (Section 6) and to whom |
| [POSITIONING.md](POSITIONING.md) | Value pillars to reference in the sponsor summary |
| [`#renewal-and-expansion-playbook`](#renewal-and-expansion-playbook) Â· [`RENEWAL_EXPANSION_PLAYBOOK.md`](RENEWAL_EXPANSION_PLAYBOOK.md) (alias) | Health scoring + renewal after pilot conversion |
| [../PILOT_GUIDE.md](../library/customer-facing/PILOT_GUIDE.md) | Technical setup for the pilot environment |
| [../PRODUCT_LEARNING.md](../library/PRODUCT_LEARNING.md) | How pilot feedback signals are captured and analyzed |
| [../OBSERVABILITY.md](../library/OBSERVABILITY.md) | OTel metric names referenced in this scorecard |
| [../archive/../assessments/LATEST_GPT55.md](../archive/../assessments/LATEST_GPT55.md) | Full marketability assessment (archived series) |
