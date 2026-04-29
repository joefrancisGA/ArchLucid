> **Scope:** Independent first-principles weighted quality assessment (2026-04-29) — scores, tradeoffs, and improvement prompts grounded in repo state; **not** a prior-assessment delta, procurement attestation, or financial guarantee.

# ArchLucid Assessment – Weighted Readiness 72.55%

## 1. Executive Summary

### Overall readiness

ArchLucid presents as a **credible V1-shaped product**: a decomposed .NET API and worker stack, SQL-backed multi-tenant model with RLS, an operator Next.js shell, extensive documentation and CI gates (core tests, OpenAPI contract checks, ZAP/Schemathesis, live Playwright + axe, k6 smoke). Weighted readiness **72.55%** reflects **strong engineering depth and governance mechanics** offset by **commercial proof gaps** (no published reference customer, trust discount stack, sales-led vs self-serve conversion) **and** **enterprise trust friction** (no SOC 2 Type II in hand, pen test still engagement/in-flight per Trust Center honesty). Items explicitly deferred to V1.1/V2 per [V1_SCOPE.md](V1_SCOPE.md) / [V1_DEFERRED.md](V1_DEFERRED.md) were **not** used to reduce the score.

### Commercial picture

Positioning and packaging are **document-complete**: locked pricing ([PRICING_PHILOSOPHY.md](../go-to-market/PRICING_PHILOSOPHY.md)), ICP/disqualifiers, competitive matrix, trial design, quote-request path, and pilot ROI scaffolding. **Revenue velocity** is still constrained by **missing independent proof** (reference logos, published case studies) and **deliberate commercial deferrals** (live Stripe/Marketplace “un-hold” called V1.1 in scope docs) — so the **default motion remains sales-led**, not low-touch PLG at list price without friction.

### Enterprise picture

**Traceability, policy/governance, and audit primitives are ahead of typical early-stage SaaS**: append-only audit design, typed events, segregation-of-duty patterns, policy packs, pre-commit gates, SCIM surface for Enterprise-tier automation, Terraform for Azure-native deployment. **Procurement and compliance reviewers** will still weight **SOC 2 / pen-test artifacts** heavily; the Trust Center is honest about self-assessed vs third-party states. **Workflow embeddedness** lags EAM/incumbent ITSM (no first-party Jira/ServiceNow in V1; webhooks/API are the bridge).

### Engineering picture

Architecture is **modular and internally coherent** (Application vs Persistence vs Decisioning vs AgentRuntime, Dapper, DbUp, ADRs). **Test breadth is real** (hundreds of test classes, golden corpus, merge-blocking live E2E, k6, architecture tests) but **coverage is uneven**: merged line coverage ~**77.8%** with **Persistence ~53%** and branch coverage ~**63%** per [COVERAGE_GAP_ANALYSIS.md](COVERAGE_GAP_ANALYSIS.md). **Observability is a strength** (custom OTel metrics catalog in [OBSERVABILITY.md](OBSERVABILITY.md)). **Correctness risk** concentrates in **data hydration paths, commit/export orchestration, and LLM variance** — mitigated but not eliminated by simulator mode and replay verify semantics.

---

## 2. Weighted Quality Assessment

**Method:** Each quality scored 1–100. **Weighted overall** = \(\sum_i score_i \cdot weight_i\) / **102** × **100** = **72.55%**.  
**Urgency order** below = **highest `weight × (100 − score)` first** (weighted deficiency signal), not raw score alone.

| Urgency | Quality | Score | Weight | Weighted deficiency | Impact (pts) |
|--------|---------|-------|--------|---------------------|--------------|
| 1 | Marketability | 68 | 8 | 256 | 5.33 |
| 2 | Adoption Friction | 62 | 6 | 228 | 3.65 |
| 3 | Time-to-Value | 76 | 7 | 168 | 5.22 |
| 4 | Proof-of-ROI Readiness | 72 | 5 | 140 | 3.53 |
| 5 | Workflow Embeddedness | 58 | 3 | 126 | 1.71 |
| 6 | Executive Value Visibility | 70 | 4 | 120 | 2.75 |
| 7 | Usability | 64 | 3 | 108 | 1.88 |
| 8 | Correctness | 74 | 4 | 104 | 2.90 |
| 9 | Trustworthiness | 66 | 3 | 102 | 1.94 |
| 10 | Differentiability | 78 | 4 | 88 | 3.06 |
| 11 | Security | 72 | 3 | 84 | 2.12 |
| 12 | Commercial Packaging Readiness | 58 | 2 | 84 | 1.14 |
| 13 | Compliance Readiness | 58 | 2 | 84 | 1.14 |
| 14 | Decision Velocity | 65 | 2 | 70 | 1.27 |
| 15 | Procurement Readiness | 68 | 2 | 64 | 1.33 |
| 16 | Interoperability | 72 | 2 | 56 | 1.41 |
| 17 | Traceability | 82 | 3 | 54 | 2.41 |
| 18 | Auditability | 76 | 2 | 48 | 1.49 |
| 19 | Reliability | 76 | 2 | 48 | 1.49 |
| 20 | Azure Compatibility and SaaS Deployment Readiness | 78 | 2 | 44 | 1.53 |
| 21 | Data Consistency | 78 | 2 | 44 | 1.53 |
| 22 | Explainability | 78 | 2 | 44 | 1.53 |
| 23 | Architectural Integrity | 86 | 3 | 42 | 2.53 |
| 24 | Maintainability | 80 | 2 | 40 | 1.57 |
| 25 | Cognitive Load | 60 | 1 | 40 | 0.59 |
| 26 | Scalability | 62 | 1 | 38 | 0.61 |
| 27 | AI/Agent Readiness | 82 | 2 | 36 | 1.61 |
| 28 | Policy and Governance Alignment | 84 | 2 | 32 | 1.65 |
| 29 | Performance | 70 | 1 | 30 | 0.69 |
| 30 | Stickiness | 70 | 1 | 30 | 0.69 |
| 31 | Cost-Effectiveness | 72 | 1 | 28 | 0.71 |
| 32 | Availability | 74 | 1 | 26 | 0.73 |
| 33 | Change Impact Clarity | 74 | 1 | 26 | 0.73 |
| 34 | Extensibility | 74 | 1 | 26 | 0.73 |
| 35 | Template and Accelerator Richness | 74 | 1 | 26 | 0.73 |
| 36 | Accessibility | 76 | 1 | 24 | 0.75 |
| 37 | Manageability | 76 | 1 | 24 | 0.75 |
| 38 | Testability | 76 | 1 | 24 | 0.75 |
| 39 | Customer Self-Sufficiency | 78 | 1 | 22 | 0.76 |
| 40 | Deployability | 78 | 1 | 22 | 0.76 |
| 41 | Azure Ecosystem Fit | 80 | 1 | 20 | 0.78 |
| 42 | Evolvability | 80 | 1 | 20 | 0.78 |
| 43 | Supportability | 82 | 1 | 18 | 0.80 |
| 44 | Observability | 84 | 1 | 16 | 0.82 |
| 45 | Documentation | 86 | 1 | 14 | 0.84 |
| 46 | Modularity | 88 | 1 | 12 | 0.86 |

**Weighted deficiency** = `weight × (100 − score)`. **Impact (pts)** = `(score × weight) / 102`; the **Impact** values **sum to the 72.55** overall readiness index. Ties in deficiency break by **higher weight first**, then **lower score**, then **name (A–Z)**. **Subsections §2.1–§2.46** follow this same order.

---

### 2.1 Marketability — Score **68**, Weight **8**, Weighted impact on readiness **+5.33%** (68×8/102)

**Justification:** Clear category framing (“AI Architecture Intelligence”), grounded [POSITIONING.md](../go-to-market/POSITIONING.md), [COMPETITIVE_LANDSCAPE.md](../go-to-market/COMPETITIVE_LANDSCAPE.md), and [IDEAL_CUSTOMER_PROFILE.md](../go-to-market/IDEAL_CUSTOMER_PROFILE.md). **Buyer belief** still lags because **independent social proof is thin** (no `Status: Published` reference row effect, trust discount narrative explicit in pricing).

**Tradeoffs:** Honest Trust Center vs “marketing-safe” vagueness — team chose honesty, which **slows** some top-of-funnel conversion.

**Improvements:** Ship **one** publishable reference (logo + bounded claims); tighten **homepage → pilot proof** path; keep claims tethered to [V1_SCOPE.md](V1_SCOPE.md).

**Fix horizon:** **v1** for narrative/reference **content**; **v1.1+** for removing trust-discount **structural** reasons (SOC 2/pen test publication per deferral docs).

---

### 2.2 Adoption Friction — Score **62**, Weight **6**, Weighted impact **+3.65%**

**Justification:** Evaluators face **Azure-primary** assumptions, **two-layer Pilot/Operate** mental model, optional LLM setup, and enterprise auth modes. Contributors need Docker/.NET/SQL discipline per [README.md](../../README.md). Friction is **acceptable** for ICP but **high** for casual evaluators.

**Tradeoffs:** Depth (governance, compare, replay) **increases** onboarding surface area; progressive disclosure helps but cannot remove domain complexity.

**Improvements:** Keep **Core Pilot** default narrow; invest in **first-run wizard + seeded success** (already emphasized in trial docs); add **“no infra” hosted path** as primary CTA.

**Fix horizon:** **v1** UX/docs iteration; **v1.1** for deeper ITSM embed deferred items.

---

### 2.3 Time-to-Value — Score **76**, Weight **7**, Weighted impact **+5.22%**

**Justification:** Trial design targets **\< 5 minutes** ([TRIAL_AND_SIGNUP.md](../go-to-market/TRIAL_AND_SIGNUP.md)); `archlucid try`, merge-blocking live trial E2E, seeded demo patterns, CLI `run --quick` for dev — **strong** for engineering-led adoption.

**Tradeoffs:** Real AOAI paths add **variability**; simulator mode improves predictability but can confuse buyers if mis-labeled.

**Improvements:** Standardize **“real vs simulated”** labeling in UX exports; ensure **pilot scorecard** auto-populates from first committed run.

**Fix horizon:** **v1**.

---

### 2.4 Proof-of-ROI Readiness — Score **72**, Weight **5**, Weighted impact **+3.53%**

**Justification:** [PILOT_ROI_MODEL.md](PILOT_ROI_MODEL.md), [PROOF_OF_VALUE_SNAPSHOT.md](PROOF_OF_VALUE_SNAPSHOT.md), sponsor one-pager flows, benchmark/load scripts — **good** methodology; **customer-specific** numbers still require buyer labor.

**Tradeoffs:** Honest ROI requires **customer inputs**; auto-claims risk **discredit**.

**Improvements:** Package a **1-page “evidence checklist”** tying benchmark JSON + k6 + trace completeness ratios for CS/sales.

**Fix horizon:** **v1**.

---

### 2.5 Workflow Embeddedness — Score **58**, Weight **3**, Weighted impact **+1.71%**

**Justification:** **V1** deliberately lacks first-party Jira/ServiceNow/Slack connectors (deferred per [V1_SCOPE.md](V1_SCOPE.md)); **Teams + webhooks + API** exist. For enterprises that live in ITSM queues, ArchLucid is **adjacent**, not **native**.

**Tradeoffs:** Building connectors early **increases** support burden; webhooks preserve a **single event spine**.

**Improvements:** Publish **2–3 copy-paste recipes** (Power Automate / DevOps tasks already partially documented in repo) framed as **supported V1 paths**.

**Fix horizon:** **v1** docs/recipes; **v1.1** first-party ITSM per deferral register.

---

### 2.6 Executive Value Visibility — Score **70**, Weight **4**, Weighted impact **+2.75%**

**Justification:** [EXECUTIVE_SPONSOR_BRIEF.md](../EXECUTIVE_SPONSOR_BRIEF.md), in-product pilot report endpoints, `/why-archlucid` style surfaces — executives can see **outcomes** if champion drives them there; **passive** visibility remains limited.

**Tradeoffs:** Exec dashboards are **expensive**; PDF/one-pagers are **faster**.

**Improvements:** Ensure **first session** email includes **single link** to sponsor summary + ROI worksheet.

**Fix horizon:** **v1**.

---

### 2.7 Usability — Score **64**, Weight **3**, Weighted impact **+1.88%**

**Justification:** Operator shell covers **many** routes; authority/tier shaping is nuanced ([COMMERCIAL_ENFORCEMENT_DEBT.md](COMMERCIAL_ENFORCEMENT_DEBT.md), packaging tests). High capability **without** ruthless simplification creates **discoverability issues** for new operators.

**Tradeoffs:** Enterprise feature breadth vs consumer-grade UX; tests enforce **seams** but not **cognitive simplicity**.

**Improvements:** Task-based **operator checklists** per role; stronger **empty states** linking to Core Pilot.

**Fix horizon:** **v1**.

---

### 2.8 Correctness — Score **74**, Weight **4**, Weighted impact **+2.90%**

**Justification:** Strong automated coverage overall (~77.8% line merged) but **Persistence ~53%** and known heavy paths ([COVERAGE_GAP_ANALYSIS.md](COVERAGE_GAP_ANALYSIS.md)): relational reads, commit orchestrator, export replay service. LLM outputs introduce **probabilistic** behavior; mitigated via evaluation hooks, schema validation, simulator.

**Tradeoffs:** More integration tests **slow** CI; golden corpora **stabilize** decisioning but require maintenance.

**Improvements:** Target **branch** coverage on commit/export/merge; expand **golden** cases for regression-sensitive merges.

**Fix horizon:** **v1** for tests; **continuous** for LLM correctness.

---

### 2.9 Trustworthiness — Score **66**, Weight **3**, Weighted impact **+1.94%**

**Justification:** Explainability traces + provenance + faithfulness metrics are **serious** differentiators ([OBSERVABILITY.md](OBSERVABILITY.md)). Buyers still must treat LLM narratives as **probabilistic**; **heuristic** faithfulness is not a **proof**.

**Tradeoffs:** More conservative wording **reduces** demo “wow”; aggressive claims **break** enterprise diligence.

**Improvements:** Standard sponsor language: **“trace-backed findings”** vs **“model certainty”**; surface **quality-gate** outcomes in UI for operator review.

**Fix horizon:** **v1** copy + UI; **v1.1+** for independent assurance artifacts (deferral).

---

### 2.10 Differentiability — Score **78**, Weight **4**, Weighted impact **+3.06%**

**Justification:** Governance + structured findings + replay/compare + audit trail vs “chat-only” tools — **real** differentiation if demos are run correctly.

**Tradeoffs:** Differentiation is **easier to erode** as incumbents add “AI features.”

**Improvements:** Competitive **demo scripts** that force trace/governance moments.

**Fix horizon:** **v1** GTM.

---

### 2.11 Security — Score **72**, Weight **3**, Weighted impact **+2.12%**

**Justification:** STRIDE model ([SYSTEM_THREAT_MODEL.md](../security/SYSTEM_THREAT_MODEL.md)), RLS, billing webhook verification patterns, rate limits, ZAP/Schemathesis CI, trial auth hardening docs. Residual risk: **LLM prompt injection**, **operator misconfig**, **dependency** posture — normal for the category.

**Tradeoffs:** Stricter defaults **break** local dev ergonomics; `DevelopmentBypass` must stay **non-prod**.

**Improvements:** Runbook links **from** error responses for common auth/tier mistakes (where safe).

**Fix horizon:** **v1** continuous hardening; **v1.1** PGP/disclosure polish per deferral.

---

### 2.12 Commercial Packaging Readiness — Score **58**, Weight **2**, Weighted impact **+1.14%**

**Justification:** Tier enforcement exists (`[RequiresCommercialTenantTier]`; intentional **404** semantics per [COMMERCIAL_ENFORCEMENT_DEBT.md](COMMERCIAL_ENFORCEMENT_DEBT.md)). **Live** self-serve checkout/Marketplace publication is **explicitly V1.1** in [V1_SCOPE.md](V1_SCOPE.md) — not scored as “missing V1”, but **packaging completeness for PLG** remains limited.

**Tradeoffs:** **404** hiding vs **402** transparency — security/enumeration tradeoff chosen.

**Improvements:** Buyer-facing **FAQ** explaining trial vs paid feature paths **without** exposing gated routes.

**Fix horizon:** **v1** docs/product copy; **v1.1** commercial un-hold (owner).

---

### 2.13 Compliance Readiness — Score **58**, Weight **2**, Weighted impact **+1.14%**

**Justification:** Strong **documentation** posture ([trust-center.md](../trust-center.md), CAIQ/SIG pre-fills, self-assessment). **No SOC 2 Type II** yet; pen test **engagement in flight**, not buyer-grade closure.

**Tradeoffs:** Early attestation **costs** and **fixes**; honesty **costs** sales cycles.

**Improvements:** Keep Trust Center **date-stamped**; automate evidence pack **hash/ETag** story (already described) in sales training.

**Fix horizon:** **v1.1+** for attestations (owner); **v1** for packaging existing artifacts.

---

### 2.14 Decision Velocity — Score **65**, Weight **2**, Weighted impact **+1.27%**

**Justification:** Pricing and discount stack are **explicit**; quote-request path exists. **Committee** sales still require **security + reference** answers.

**Tradeoffs:** Standardized reference discount **speeds** deals vs bespoke pricing.

**Improvements:** Prep **security Q&A** cheat sheet aligned to CAIQ rows (single link from Trust Center).

**Fix horizon:** **v1**.

---

### 2.15 Procurement Readiness — Score **68**, Weight **2**, Weighted impact **+1.33%**

**Justification:** DPA template, subprocessors, SLA summary, evidence pack ZIP endpoint — solid **basics**. Missing **third-party** artifacts buyers often mandate.

**Tradeoffs:** Procurement packs **age quickly** if not versioned — repo approach is good.

**Improvements:** Add **“last updated”** stamps per major artifact in pack index.

**Fix horizon:** **v1**; attestations **v1.1**.

---

### 2.16 Interoperability — Score **72**, Weight **2**, Weighted impact **+1.41%**

**Justification:** Versioned REST, AsyncAPI/event catalog, client package, Azure DevOps/GitHub task templates — strong **automation** stance. Not a **connector warehouse**.

**Tradeoffs:** Every first-party connector expands **security + support** perimeter.

**Improvements:** Maintain **integration recipes** as first-class CI-linked docs.

**Fix horizon:** **v1** recipes; **v1.1** connectors per deferral.

---

### 2.17 Traceability — Score **82**, Weight **3**, Weighted impact **+2.41%**

**Justification:** Provenance graph, export records, comparison replay persistence, correlation IDs — enterprise-grade **intent** executed well.

**Tradeoffs:** Full trace UX **can overwhelm** — progressive disclosure required.

**Improvements:** Jump links from **audit CSV** rows back to UI routes.

**Fix horizon:** **v1**.

---

### 2.18 Auditability — Score **76**, Weight **2**, Weighted impact **+1.49%**

**Justification:** Typed audit catalog + append-only posture; [V1_READINESS_SUMMARY.md](V1_READINESS_SUMMARY.md) acknowledges **not every** path is parity-perfect.

**Tradeoffs:** Dual channels (logs vs durable) create **reviewer questions**.

**Improvements:** Close **known gaps** called out in [AUDIT_COVERAGE_MATRIX.md](AUDIT_COVERAGE_MATRIX.md) / [V1_DEFERRED.md](V1_DEFERRED.md) where feasible in v1.

**Fix horizon:** **v1** for high-risk mutations; remainder triaged.

---

### 2.19 Reliability — Score **76**, Weight **2**, Weighted impact **+1.49%**

**Justification:** Outbox patterns, retries, chaos/simmy tests in AgentRuntime/Persistence — **mature** instincts.

**Tradeoffs:** Distributed failure modes **multiply** with Service Bus + workers — customers may under-provision.

**Improvements:** **Failure injection drill** script for top 3 incidents (LLM 429, SQL throttling, blob upload fail).

**Fix horizon:** **v1** drills.

---

### 2.20 Azure Compatibility and SaaS Deployment Readiness — Score **78**, Weight **2**, Weighted impact **+1.53%**

**Justification:** Multiple Terraform roots (`infra/terraform-*`), Container Apps patterns, private endpoints, monitoring — **strong** Azure-native story.

**Tradeoffs:** Full production apply **still** customer-subscription-specific; docs acknowledge org polish items ([V1_READINESS_SUMMARY.md](V1_READINESS_SUMMARY.md)).

**Improvements:** **Single** “reference SaaS apply order” pointer for SRE onboarding.

**Fix horizon:** **v1** docs; org work **ongoing**.

---

### 2.21 Data Consistency — Score **78**, Weight **2**, Weighted impact **+1.53%**

**Justification:** Orphan detection/quarantine metrics ([OBSERVABILITY.md](OBSERVABILITY.md)), replay verify semantics — seriousness is evident.

**Tradeoffs:** Strong enforcement modes **risk** operational surprise — must be staged.

**Improvements:** Document **quarantine recovery** runbook paths end-to-end.

**Fix horizon:** **v1**.

---

### 2.22 Explainability — Score **78**, Weight **2**, Weighted impact **+1.53%**

**Justification:** Explainability endpoints, traces on findings, citation counters, faithfulness fallbacks — **above bar**.

**Tradeoffs:** Heuristic faithfulness ≠ **legal** explainability standard.

**Improvements:** Training for SEs: **how to read** a trace in a review meeting.

**Fix horizon:** **v1**.

---

### 2.23 Architectural Integrity — Score **86**, Weight **3**, Weighted impact **+2.53%**

**Justification:** Bounded contexts, host composition separation, persistence isolation — **coherent** architecture; architecture tests exist.

**Tradeoffs:** Large solution **requires** tooling discipline (indexes, naming).

**Improvements:** Periodically re-run **dependency constraint** tests when new projects added.

**Fix horizon:** **v1** ongoing.

---

### 2.24 Maintainability — Score **80**, Weight **2**, Weighted impact **+1.57%**

**Justification:** Modular assemblies, clear naming, CI guardrails, ADRs — maintainability is **high** for team scale.

**Tradeoffs:** Large doc volume requires **discovery** aids (indexes exist — must stay current).

**Improvements:** Auto-check stale links on critical spine docs.

**Fix horizon:** **v1**.

---

### 2.25 Cognitive Load — Score **60**, Weight **1**, Weighted impact **+0.59%**

**Justification:** Domain + packaging layers + governance concepts = **heavy** for first-time operators even with good docs.

**Tradeoffs:** Simplification by hiding features **conflicts** with power-user needs.

**Improvements:** **Role-based** “what to ignore this week” guided paths ([OPERATOR_DECISION_GUIDE.md](OPERATOR_DECISION_GUIDE.md) amplification in-app).

**Fix horizon:** **v1**.

---

### 2.26 Scalability — Score **62**, Weight **1**, Weighted impact **+0.61%**

**Justification:** Load baselines and k6 gates exist ([LOAD_TEST_BASELINE.md](LOAD_TEST_BASELINE.md)); **multi-region active/active** not a V1 promise ([V1_SCOPE.md](V1_SCOPE.md)). Scale story is **credible for pilot/early production**, not **hyperscale**.

**Tradeoffs:** Over-promising regional HA **creates** liability.

**Improvements:** Buyer-facing **limits & scale-up playbook** (SQL tier, worker concurrency) — short appendix.

**Fix horizon:** **v1** documentation.

---

### 2.27 AI/Agent Readiness — Score **82**, Weight **2**, Weighted impact **+1.61%**

**Justification:** Multi-agent orchestration, simulator mode, provider fallback patterns, output evaluation hooks — **credible** agent platform for this use case.

**Tradeoffs:** True autonomous planning **explicitly out** of V1 scope — correct restraint.

**Improvements:** **Prompt/version** hygiene already in CI — keep **golden** output discipline as models churn.

**Fix horizon:** **v1** continuous.

---

### 2.28 Policy and Governance Alignment — Score **84**, Weight **2**, Weighted impact **+1.65%**

**Justification:** Pre-commit gate, approvals/SoD patterns, policy packs — rare strength for an early product.

**Tradeoffs:** Governance **can block** time-to-value if tuned aggressively — pilot presets matter.

**Improvements:** **Starter policy pack** tuned for “warn-first” pilots.

**Fix horizon:** **v1**.

---

### 2.29 Performance — Score **70**, Weight **1**, Weighted impact **+0.69%**

**Justification:** Benchmarks, CPU baselines, k6 thresholds — **present**. Real AOAI latency dominates wall-clock for “full truth” runs.

**Tradeoffs:** Aggressive caching **vs** audit/replay fidelity — must be bounded ([demo preview cache documented](README.md)).

**Improvements:** Publish **p95** targets for **non-LLM** API surfaces separately from LLM E2E.

**Fix horizon:** **v1**.

---

### 2.30 Stickiness — Score **70**, Weight **1**, Weighted impact **+0.69%**

**Justification:** Manifest history, governance workflows, alerts — **data gravity** exists pre-ITSM bridges.

**Tradeoffs:** Without adjacent workflow embedding, champions must **re-open** the product deliberately.

**Improvements:** Weekly digest defaults for **Operate** users (where policy allows).

**Fix horizon:** **v1** product polish.

---

### 2.31 Cost-Effectiveness — Score **72**, Weight **1**, Weighted impact **+0.71%**

**Justification:** Per-tenant cost docs, metering hooks, LLM instrumentation — team can **argue** unit economics; customer **TVO** still depends on pilot discipline.

**Tradeoffs:** Cost visibility **can scare** buyers if raw LLM lines spike.

**Improvements:** Standard **pilot budget envelope** worksheet.

**Fix horizon:** **v1**.

---

### 2.32 Availability — Score **74**, Weight **1**, Weighted impact **+0.73%**

**Justification:** Health endpoints, synthetic probes, SLO docs ([API_SLOS.md](API_SLOS.md)) — **credible**. **99.5%** target is **not** magically proven in all customer footprints.

**Tradeoffs:** Ready checks that expose too much **aid** attackers — summary-only patterns are appropriate.

**Improvements:** Align runbooks to **probe failure** playbooks per route family.

**Fix horizon:** **v1** ops maturity.

---

### 2.33 Change Impact Clarity — Score **74**, Weight **1**, Weighted impact **+0.73%**

**Justification:** Compare + replay/verify + manifest diffs — good **change language** for architects.

**Tradeoffs:** Non-technical buyers need **translation** layers.

**Improvements:** **Before/after** executive blurb generator from manifest diff (bounded, template-based).

**Fix horizon:** **v1** / **v1.1** depending on scope.

---

### 2.34 Extensibility — Score **74**, Weight **1**, Weighted impact **+0.73%**

**Justification:** Finding engines, policy packs, export/replay extension points — good **vertical** extensibility; not a plugin marketplace.

**Tradeoffs:** Extension without guardrails **breaks** audit promises.

**Improvements:** Contributor doc: **“safe extension surfaces”** vs internal seams.

**Fix horizon:** **v1**.

---

### 2.35 Template and Accelerator Richness — Score **74**, Weight **1**, Weighted impact **+0.73%**

**Justification:** Templates under `templates/`, policy pack starters, golden corpus — good **engineer accelerators**; business-user templates are thinner.

**Tradeoffs:** Too many templates **without** maintenance creates **dust**.

**Improvements:** Tag templates with **V1-tested** vs **experimental** in index.

**Fix horizon:** **v1**.

---

### 2.36 Accessibility — Score **76**, Weight **1**, Weighted impact **+0.75%**

**Justification:** Merge-blocking axe in live E2E per [ACCESSIBILITY_AUDIT.md](ACCESSIBILITY_AUDIT.md) — **concrete**, not aspirational.

**Tradeoffs:** Broad route coverage still **evolves** with new UI.

**Improvements:** Expand **`PAGES`** coverage when adding major layouts.

**Fix horizon:** **v1**.

---

### 2.37 Manageability — Score **76**, Weight **1**, Weighted impact **+0.75%**

**Justification:** Feature flags, documented config, tier model — operators can run it **if** trained.

**Tradeoffs:** Config explosion **hurts** supportability — docs partially compensate.

**Improvements:** **`archlucid doctor`** output links to **one** “config sanity” page.

**Fix horizon:** **v1**.

---

### 2.38 Testability — Score **76**, Weight **1**, Weighted impact **+0.75%**

**Justification:** Extensive automated tests + live harness; still **gaps** in Persistence branches.

**Tradeoffs:** Live E2E **costs** CI minutes — necessary for auth/trial truth.

**Improvements:** Narrow **mutation** budget focus on **Decisioning merge** + **Persistence reads**.

**Fix horizon:** **v1**.

---

### 2.39 Customer Self-Sufficiency — Score **78**, Weight **1**, Weighted impact **+0.76%**

**Justification:** `docs/library/` depth, START_HERE spine, troubleshooting — unusually strong.

**Tradeoffs:** Depth can **obscure** the minimal path — navigation must stay opinionated.

**Improvements:** “**3 links**” card on first login.

**Fix horizon:** **v1**.

---

### 2.40 Deployability — Score **78**, Weight **1**, Weighted impact **+0.76%**

**Justification:** Compose, Dockerfiles, release scripts, Terraform — **good** deployability for target stack.

**Tradeoffs:** Air-gapped / non-Azure **poor fit** by design ([IDEAL_CUSTOMER_PROFILE.md](../go-to-market/IDEAL_CUSTOMER_PROFILE.md)).

**Improvements:** **Apply-saas** script preflight checklist in one table.

**Fix horizon:** **v1**.

---

### 2.41 Azure Ecosystem Fit — Score **80**, Weight **1**, Weighted impact **+0.78%**

**Justification:** Entra, MI patterns, AOAI, Service Bus optional — **coherent** Azure story.

**Tradeoffs:** AWS/GCP shops **disqualified** or friction-heavy — intentional.

**Improvements:** Explicit **“why Azure-primary”** one-pager for hybrid enterprises.

**Fix horizon:** **v1** GTM.

---

### 2.42 Evolvability — Score **80**, Weight **1**, Weighted impact **+0.78%**

**Justification:** ADRs, migration discipline, strangler notes — good future evolution discipline.

**Tradeoffs:** Rename/terraform state migrations remain **expensive** (Phase 7 docs).

**Improvements:** Keep **BREAKING_CHANGES** hygiene ruthless.

**Fix horizon:** **v1–v1.1** platform cleanup when scheduled.

---

### 2.43 Supportability — Score **82**, Weight **1**, Weighted impact **+0.80%**

**Justification:** Correlation IDs, support bundle CLI, version endpoint, runbooks — **strong**.

**Tradeoffs:** Support quality still depends on **host telemetry** being enabled in customer envs.

**Improvements:** Bundle recipe includes **redaction checklist** inline confirmation.

**Fix horizon:** **v1**.

---

### 2.44 Observability — Score **84**, Weight **1**, Weighted impact **+0.82%**

**Justification:** Rich custom metrics, SLO rules, dashboards in repo — **strong** operational culture signal.

**Tradeoffs:** Customers must actually **wire** scraping/export for value.

**Improvements:** “Minimum viable monitoring” **10-line** Terraform snippet pointers.

**Fix horizon:** **v1** docs.

---

### 2.45 Documentation — Score **86**, Weight **1**, Weighted impact **+0.84%**

**Justification:** Spine docs, Trust Center, runbooks, scope contracts — among the best maturity areas.

**Tradeoffs:** Volume **can** stall contributors — persona tables must stay curated.

**Improvements:** Quarterly **doc inventory** pass (script already exists in docs).

**Fix horizon:** **v1** housekeeping.

---

### 2.46 Modularity — Score **88**, Weight **1**, Weighted impact **+0.86%**

**Justification:** Many focused projects, clear test boundaries — excellent modularity.

**Tradeoffs:** Cross-cutting changes **touch** more files — needs strong conventions (present).

**Improvements:** Maintainer map refresh in [ARCHITECTURE_INDEX.md](../ARCHITECTURE_INDEX.md) when adding assemblies.

**Fix horizon:** **v1**.


---

## 3. Top 10 Most Important Weaknesses

1. **Independent proof gap** — market motion still relies on founder-led trust vs reference customers + third-party assurance.
2. **LLM variance vs buyer expectations** — correctness/trust tradeoff is managed but not “solved”; demos can over-promise if not scripted.
3. **ICP friction for non-Azure shops** — disqualifiers are real; expansion outside Azure-primary orgs will be painful in V1.
4. **Operate surface cognitive load** — powerful UI risks losing first-pilot users without ruthless Core Pilot steering.
5. **Persistence/branch test gaps** — highest regression risk area relative to stated coverage analysis.
6. **ITSM-native workflow absence (V1)** — deliberate scope, still an enterprise adoption headwind vs incumbents.
7. **Commercial PLG completeness** — engineering wiring exists; live marketplace/Stripe “un-hold” deferred — sales cycle stays longer for some segments.
8. **Audit parity nuances** — durable audit is strong; any remaining “log-only” paths become procurement talking points under scrutiny.
9. **Scalability story discipline** — docs include load baselines; multi-region promises are appropriately bounded but require careful sales messaging.
10. **Tier-hiding semantics (404)** — security-sound choice; can confuse integrators unless onboarding explains enumeration posture.

---

## 4. Top 5 Monetization Blockers

1. **No published reference customer flywheel** — lengthens enterprise cycles and keeps “trust discount” real in pricing narrative.
2. **Self-serve commercial unlock deferred (V1.1)** — limits fully automated **land** motion at list packaging for some buyers (per [V1_SCOPE.md](V1_SCOPE.md) — not scored as V1 defect, but **revenue timing** impact remains).
3. **Security assurance gap vs enterprise standard** — SOC 2 Type II / completed pen test artifact timing affects **budget release** in regulated buyers.
4. **Category education cost** — “AI Architecture Intelligence” requires **proof moments**; without them, deals stall in POC purgatory.
5. **Azure-primary positioning** — shrinks addressable market vs “any cloud” RFPs.

---

## 5. Top 5 Enterprise Adoption Blockers

1. **Third-party assurance timeline** (SOC 2 / pen test publication) — security reviewer checklist item.
2. **ITSM/work item integration gap at V1** — champions must build bridges (webhooks/API) vs buying packaged connectors (V1.1+ per deferral).
3. **Operational proof in *their* tenant** — ArchLucid is deployable, but buyers still fear **their specific** Entra/RLS/SQL footprint.
4. **Data residency / BAA-class conversations** — Trust Center sets expectations; healthcare/regulated buyers still need **legal** work ([trust-center.md](../trust-center.md) PHI guidance).
5. **Procurement paperwork novelty** — vendor onboarding friction for a young vendor regardless of product quality.

---

## 6. Top 5 Engineering Risks

1. **Regression in relational persistence hydration** — coverage weakest in Persistence per [COVERAGE_GAP_ANALYSIS.md](COVERAGE_GAP_ANALYSIS.md).
2. **Commit/export orchestration edge cases** — high business impact paths merit paranoid tests.
3. **LLM supply chain incidents** (provider outage, quota, prompt regression) — mitigated but still **availability** risk to “full truth” runs.
4. **Misconfigured auth in customer environments** — classic SaaS footguns; good docs reduce but don’t eliminate.
5. **Data consistency enforcement modes** — alerting/quarantine behaviors need operational maturity to avoid false-confidence or alert fatigue.

---

## 7. Most Important Truth

**ArchLucid’s engineering and governance depth are ahead of typical early SaaS, but enterprise purchase still hinges on independent trust artifacts and reference proof—not on feature breadth alone.**

---

## 8. Top Improvement Opportunities

Ranked by leverage. **DEFERRED** items include only title, reason, and required input (no full Cursor prompt).

### 1. DEFERRED — Production commercial unlock (Stripe live + Marketplace Published)

- **Why it matters:** Unblocks automated land/expand for segments that refuse sales-led quotes.
- **Expected impact:** Commercial Packaging (+15–25 pts), Decision Velocity (+8–12), Marketability (+5–8). **Weighted readiness impact:** ~**+0.9–1.4%** (approximate; depends on final weight interactions).
- **Affected qualities:** Commercial Packaging Readiness, Decision Velocity, Marketability, Stickiness.
- **Status:** **DEFERRED**
- **Reason:** Partner Center seller verification, tax/payout profile, live secret handling, DNS cutover — **owner-only** per [V1_SCOPE.md](V1_SCOPE.md) / [V1_DEFERRED.md](V1_DEFERRED.md).
- **Input needed later:** Go-live date window; chosen Stripe price IDs; confirmation Marketplace plan IDs match [PRICING_PHILOSOPHY.md](../go-to-market/PRICING_PHILOSOPHY.md); legal approval for public checkout wording.

---

### 2. DEFERRED — SOC 2 Type II + publishable pen-test executive summary

- **Why it matters:** Clears the largest **security/procurement** gate in regulated mid-market/enterprise.
- **Expected impact:** Compliance Readiness (+18–28), Procurement Readiness (+10–15), Trustworthiness (+8–12), Marketability (+6–10). **Weighted readiness impact:** ~**+1.0–1.6%**.
- **Affected qualities:** Compliance Readiness, Procurement Readiness, Trustworthiness, Marketability.
- **Status:** **DEFERRED**
- **Reason:** Auditor selection, evidence window, engagement funding, and publication policy are **out of repo automation** (tracked as V1.1+ in Trust Center / V1_DEFERRED).
- **Input needed later:** Auditor firm + timeline; allowed public summary fields; customer distribution policy (NDA-only vs public Trust Center row).

---

### 3. Close Persistence + commit/export correctness gap with targeted tests

- **Why it matters:** Largest objective blind spot in merged coverage reports; protects revenue-critical artifacts.
- **Expected impact:** Correctness (+6–10), Testability (+5–8), Reliability (+3–5), Cognitive Load (+2–4 operator confidence). **Weighted readiness impact:** ~**+0.45–0.75%**.
- **Affected qualities:** Correctness, Testability, Reliability, Data Consistency.
- **Status:** Fully actionable now.

**Cursor prompt (paste verbatim):**

```text
You are working in the ArchLucid repo. Goal: raise confidence in persistence hydration and commit/export correctness without broad refactors.

Scope:
- Add/adjust automated tests only (unit/integration using existing patterns) for:
  - ArchLucid.Persistence relational readers called out in docs/library/COVERAGE_GAP_ANALYSIS.md (GoldenManifestPhase1RelationalRead*, GraphSnapshotRelationalRead*, FindingsSnapshotRelationalRead* branches).
  - ArchLucid.Application Analysis export path around EndToEndReplayComparisonExportService and Runs orchestration around ArchitectureRunCommitOrchestrator (focus on uncovered branches / error mapping).
- Follow existing test project conventions (ArchLucid.Persistence.Tests SQL integration style, ArchLucid.Application.Tests Moq style where appropriate).

Constraints:
- Do not modify historical SQL migrations 001–028; if schema assumptions change, use NEW migration files only per repo rules.
- Do not weaken authorization or RLS tests; no production secret defaults.
- Keep each new test class in its own file; prefer LINQ over foreach per project rules; use `is null` / `is not null` in C# (Expression-tree lambdas: CS8122 exception with comment if needed).

Acceptance criteria:
- `dotnet test ArchLucid.sln --filter "FullyQualifiedName~<NewTests>"` passes locally.
- At least +3 meaningful branch assertions per new test class (not trivial smoke).
- Update docs/library/COVERAGE_GAP_ANALYSIS.md only if you refresh Cobertura (optional); otherwise add a short note in docs/CHANGELOG.md under a dated entry describing added test coverage areas.

Out of scope:
- UI changes, Terraform, pricing docs, OpenAPI breaking changes.
```

**Impact of running the prompt:** Directly improves Correctness (+6–10 pts), Testability (+5–8 pts), Reliability (+3–5 pts). Weighted readiness impact: **+0.45–0.75%**.

---

### 4. Buyer/admin playbook: tier-gated routes, 404 semantics, and integration path

- **Why it matters:** Reduces adoption friction and procurement churn caused by **security-conscious** API responses.
- **Expected impact:** Adoption Friction (+5–8), Usability (+4–6), Commercial Packaging Readiness (+3–5), Cognitive Load (+4–6). **Weighted readiness impact:** ~**+0.35–0.55%**.
- **Affected qualities:** Adoption Friction, Usability, Commercial Packaging, Customer Self-Sufficiency.
- **Status:** Fully actionable now.

**Cursor prompt:**

```text
Create a new buyer-facing doc under docs/library/ named TENANT_TIER_AND_ROUTE_ENUMERATION.md with the required `> **Scope:**` first line per CI doc rules.

Content requirements (ground in code/docs, no invented endpoints):
- Explain why some capabilities return 404 for lower tiers (anti-enumeration) citing ArchLucid.Api Filters/CommercialTenantTierFilter and docs/library/COMMERCIAL_ENFORCEMENT_DEBT.md.
- Provide a “what to do instead” table for Pilot vs Operate workflows (Core Pilot first), linking to docs/CORE_PILOT.md, docs/library/OPERATOR_DECISION_GUIDE.md, docs/library/V1_SCOPE.md.
- Include a short integrator section: use documented public routes; do not rely on probing undocumented URLs; tie to docs/library/API_CONTRACTS.md correlation id guidance.

Constraints:
- Do not change API behavior in this task.
- Link to Trust Center and billing docs where relevant; do not restate locked prices (link PRICING_PHILOSOPHY.md).
- Run: python scripts/ci/check_doc_scope_header.py

Acceptance criteria:
- Doc linked from docs/ARCHITECTURE_INDEX.md or docs/START_HERE.md “deep links” only if there is an existing appropriate subsection (prefer ARCHITECTURE_INDEX.md navigation).
- CHANGELOG.md entry: one line describing the new playbook.
```

**Impact:** Adoption Friction (+5–8), Usability (+4–6). Weighted readiness: **+0.35–0.55%**.

---

### 5. ITSM bridge “V1 honest path” — webhook + recipe consolidation

- **Why it matters:** Closes the **workflow embeddedness** gap without promising V1.1 connectors.
- **Expected impact:** Workflow Embeddedness (+8–12), Interoperability (+5–8), Adoption Friction (+3–5). **Weighted readiness impact:** ~**+0.35–0.55%**.
- **Affected qualities:** Workflow Embeddedness, Interoperability, Proof-of-ROI Readiness (time-to-first-ticket narrative).
- **Status:** Fully actionable now.

**Cursor prompt:**

```text
Add docs/library/ITSM_BRIDGE_V1_RECIPES.md (Scope header required).

Consolidate existing fragments into 3 end-to-end recipes (conceptual + exact doc links):
1) Azure DevOps PR comment/manifest delta task path (link integrations/azure-devops-* and docs/integrations/AZURE_DEVOPS_PIPELINE_TASK_MANIFEST_DELTA_PR_COMMENT.md if present).
2) Generic CloudEvents consumer outline using schemas/integration-events/catalog.json and docs/library/INTEGRATION_EVENTS_AND_WEBHOOKS.md.
3) Power Automate / Logic Apps pointer path using docs/integrations/recipes/* (JIRA recipe etc.) framed honestly as customer-owned automation.

Constraints:
- Explicitly state Jira/ServiceNow first-party connectors are V1.1 per docs/library/V1_SCOPE.md; do not imply they ship in V1.
- No new third-party services; only Azure/customer automation.

Acceptance criteria:
- Link added from docs/go-to-market/INTEGRATION_CATALOG.md to this new hub page (single paragraph + link).
- check_doc_scope_header passes.
```

**Impact:** Workflow Embeddedness (+8–12), Interoperability (+5–8). Weighted readiness: **+0.35–0.55%**.

---

### 6. Executive instantiator: “sponsor email kit” static template pack

- **Why it matters:** Improves executive value visibility **without** new backend risk.
- **Expected impact:** Executive Value Visibility (+6–10), Proof-of-ROI (+4–6), Time-to-Value (+3–5). **Weighted readiness impact:** ~**+0.25–0.45%**.
- **Affected qualities:** Executive Value Visibility, Proof-of-ROI Readiness, Marketability.
- **Status:** Fully actionable now.

**Cursor prompt:**

```text
Under docs/go-to-market/, add EXECUTIVE_ONE_EMAIL_KIT.md (Scope header) with three copy-paste blocks:
- Subject line options
- 120-word executive summary grounded only in V1 claims (link V1_SCOPE.md + POSITIONING.md)
- “Ask the vendor for these 4 artifacts” checklist linking trust-center.md + evidence pack endpoint + PILOT_ROI_MODEL.md + PROOF_OF_VALUE_SNAPSHOT.md

Constraints:
- No new product code.
- No numeric pricing beyond linking PRICING_PHILOSOPHY.md (single-source rule).

Acceptance criteria:
- Linked from docs/EXECUTIVE_SPONSOR_BRIEF.md in a short “Related” bullet.
- check_doc_scope_header passes; run scripts/ci/check_pricing_single_source.py if touching pricing-adjacent prose.
```

**Impact:** Executive Value Visibility (+6–10), Proof-of-ROI (+4–6). Weighted readiness: **+0.25–0.45%**.

---

### 7. Audit gap triage sprint — document + test the known deltas

- **Why it matters:** Procurement teams nitpick durable parity; closing or scoping gaps reduces stall risk.
- **Expected impact:** Auditability (+5–8), Procurement Readiness (+4–6), Trustworthiness (+3–5). **Weighted readiness impact:** ~**+0.2–0.35%**.
- **Affected qualities:** Auditability, Compliance Readiness (process), Trustworthiness.
- **Status:** Fully actionable now.

**Cursor prompt:**

```text
Update docs/library/AUDIT_COVERAGE_MATRIX.md Known gaps section ONLY with provable statements:
- For each open gap: either (a) add a PR that implements durable audit emission + tests, OR (b) reclassify with explicit owner + risk acceptance note referencing ADR/policy if no code change yet.
- Add ArchLucid.Api.Tests coverage where missing for the fixed paths (follow existing audit assertion patterns).

Constraints:
- Do not weaken append-only constraints.
- Do not edit historical migrations 001–028.

Acceptance criteria:
- `dotnet test ArchLucid.sln --filter "FullyQualifiedName~Audit"` passes (or narrower newly added tests).
- Matrix reflects reality; remove stale claims if fixed.
```

**Impact:** Auditability (+5–8), Procurement Readiness (+4–6). Weighted readiness: **+0.2–0.35%**.

---

### 8. Scalability buyer FAQ — single-region honesty + scale-up knobs

- **Why it matters:** Prevents enterprise mis-buying and later churn.
- **Expected impact:** Scalability (+8–12 as documentation clarity), Procurement Readiness (+3–5), Reliability (+2–4 messaging). **Weighted readiness impact:** ~**+0.15–0.30%**.
- **Affected qualities:** Scalability, Procurement Readiness, Availability.
- **Status:** Fully actionable now.

**Cursor prompt:**

```text
Create docs/library/BUYER_SCALABILITY_FAQ.md (Scope header) summarizing:
- V1 single-region posture vs explicit non-promises from docs/library/V1_SCOPE.md and any RTO/RPO docs under docs/library/.
- Practical scale-up levers: SQL tier, worker concurrency, cache/redis usage pointers (link REDIS_AND_MULTI_REGION.md, PER_TENANT_COST_MODEL if present).
- What load evidence exists: LOAD_TEST_BASELINE.md + k6 CI smoke scripts.

Constraints:
- No marketing hype; cite files, not aspirations.
- If multi-region active/active is referenced only as future/doc target, label it clearly as not a V1 guarantee.

Acceptance criteria:
- Link from docs/trust-center.md posture summary or go-to-market/TENANT_ISOLATION.md (pick the most natural single link).
- check_doc_scope_header passes.
```

**Impact:** Scalability (+8–12 clarity), Procurement (+3–5). Weighted readiness: **+0.15–0.30%**.

---

### 9. First reference slot — publication scaffold + CI path (no customer PII)

- **Why it matters:** Clears the **−15% reference discount** gate in pricing narrative without waiting on full case study prose.
- **Expected impact:** Marketability (+6–10), Proof-of-ROI (+4–6), Decision Velocity (+3–5). **Weighted readiness impact:** ~**+0.25–0.40%**.
- **Affected qualities:** Marketability, Proof-of-ROI Readiness, Commercial Packaging Readiness.
- **Status:** Fully actionable now (content/scaffold only; no fabricated customer).

**Cursor prompt:**

```text
Prepare the reference-customer publication path without adding a fabricated customer:

1) Edit docs/go-to-market/reference-customers/README.md only: add a clearly marked **DRAFT** row template (Status: Draft) with placeholder fields `[CUSTOMER]`, `[INDUSTRY]`, `[CONTACT]` — and a bold warning that Published status requires human approval per PRICING_PHILOSOPHY.md §4.1.
2) Add docs/go-to-market/reference-customers/PUBLICATION_CHECKLIST.md with Scope header: bullet list for logo permission, quote approval, case study legal review, and the strict CI step described in PRICING_PHILOSOPHY.md (link only; no number restatement).
3) Do not set Status: Published. Do not add real company names.

Constraints:
- Run python scripts/ci/check_doc_scope_header.py
- Do not edit locked prices.

Acceptance criteria:
- README links to the checklist.
- docs/CHANGELOG.md one-line note.
```

**Impact:** Marketability (+6–10), Decision Velocity (+3–5). Weighted readiness: **+0.25–0.40%**.

---

### 10. Decisioning merge regressions — one golden-corpus expansion tranche

- **Why it matters:** Protects manifest correctness where Decisioning meets Persistence (high business risk).
- **Expected impact:** Correctness (+4–7), Testability (+4–6), Architectural Integrity (+2–4). **Weighted readiness impact:** ~**+0.2–0.35%**.
- **Affected qualities:** Correctness, Testability, Evolvability.
- **Status:** Fully actionable now.

**Cursor prompt:**

```text
Expand automated decisioning coverage using the existing golden-corpus pattern:

1) Add ONE new case directory under tests/golden-corpus/decisioning/ (next free case id) with README.md (Scope line) describing the scenario in one paragraph: e.g. conflicting compliance severity + topology gap in same run payload — must be realistic and deterministic JSON fixtures only.
2) Wire the case into the existing test harness the repo uses for golden decisioning (follow case-30 or nearest similar pattern); `dotnet test` for the affected test project must pass.
3) If docs/library/DECISIONING_TYPED_FINDINGS.md or FINDINGS_TYPED_SCHEMA.md lists engine coverage, add one line cross-reference to the new case.

Constraints:
- No changes to production code unless a test exposes a real defect — if so, fix minimally with tests.
- One case only; avoid broad refactors.

Acceptance criteria:
- New case README + fixtures + tests merged.
- docs/CHANGELOG.md entry.
```

**Impact:** Correctness (+4–7), Testability (+4–6). Weighted readiness: **+0.2–0.35%**.

---

## 9. Pending Questions for Later

_Organized by improvement title; blocking / decision-shaping only._

- **DEFERRED — Production commercial unlock:** Which **primary** land motion for next 90 days — Marketplace vs Stripe direct vs quote-only? Do we ever expose **402** for known routes in partner integrations despite enumeration risk?
- **DEFERRED — SOC 2 / pen-test publication:** Is pen-test summary **public Trust Center** or **NDA-only**? What finding-category depth is allowed post-remediation?
- **Close Persistence + commit/export correctness gap:** Should data-hydration “whitespace JSON” behaviors remain **permanent** compatibility contracts — need product call if tightening is desired.
- **Tier-gated route playbook:** Any **partner** requires explicit route lists under NDA — do we maintain a **private** annex outside the repo?
- **ITSM bridge recipes:** Which **two** ecosystems beyond Azure DevOps should be pictured in diagrams given Atlassian is V1.1 (ServiceNow-only vs generic webhook)?
- **Audit gap triage:** Any mutating flows intentionally **log-only** for legal hold / performance — confirm before forcing durable audit everywhere.
- **Buyer scalability FAQ:** Target **maximum** supported tenants/workers for early **design partner** contracts — need a numeric guardrail for sales.

---

## Deferred Scope Uncertainty

Deferred items (MCP V1.1, Jira/Confluence/ServiceNow V1.1, Slack V2, Stripe/Marketplace un-hold V1.1, pen-test/PGP V1.1) are **explicitly documented** in [V1_SCOPE.md](V1_SCOPE.md) and [V1_DEFERRED.md](V1_DEFERRED.md). **No additional “mystery deferrals”** were identified beyond what could be located there and in [trust-center.md](../trust-center.md).

---

## Appendix: Weighted score calculation

- Sum of weights = **102**
- Sum of (score × weight) = **7400.0**
- Weighted readiness = **7400 / 102 = 72.5490…% → 72.55%** (rounded for title)

---

**Report generated:** 2026-04-29 (independent read of repository materials only).
