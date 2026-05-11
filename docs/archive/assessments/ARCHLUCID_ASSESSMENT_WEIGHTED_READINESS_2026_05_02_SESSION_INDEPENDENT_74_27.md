> **Scope:** Independent first-principles weighted readiness assessment emitted 2026-05-02 in a single session — scoring only; not an update or merge of [`ARCHLUCID_ASSESSMENT_WEIGHTED_READINESS_2026_05_02.md`](ARCHLUCID_ASSESSMENT_WEIGHTED_READINESS_2026_05_02.md). Excludes capability explicitly deferred to V1.1/V2 per [`V1_DEFERRED.md`](V1_DEFERRED.md). Evidence: repository materials available at authoring time (`README`, spine docs, `V1_SCOPE`, `trust-center`, `TEST_STRUCTURE`, `LIVE_E2E_HAPPY_PATH`, `OBSERVABILITY`, `API_CONTRACTS`, `PRODUCT_PACKAGING`, `infra/`, workflows).

# ArchLucid Assessment – Weighted Readiness 74.27%

## 2. Executive Summary

### Overall readiness

ArchLucid reads as **credible for a disciplined V1 pilot**, not yet a low-friction, self-serve enterprise platform without sales or operator support. Core Pilot (request → pipeline → committed manifest → review package), SQL-backed API, tiered Operator UI with progressive disclosure, audit trail, OpenAPI snapshots, merge-blocking CI (including SQL-backed Playwright lanes and k6), Terraform roots, and rich observability instrumentation are materially real—not a hollow demo. Weighted readiness **74.27%** reflects stronger engineering posture than raw commercial/market readiness; the largest drag comes from **market proof, differentiation, cognitive load**, and **LLM-assisted output confidence**, not from missing scaffolding.

### Commercial picture

The **Pilot vs Operate** wedge is coherent ([`PRODUCT_PACKAGING.md`](PRODUCT_PACKAGING.md), [`CORE_PILOT.md`](../CORE_PILOT.md), [`EXECUTIVE_SPONSOR_BRIEF.md`](../EXECUTIVE_SPONSOR_BRIEF.md)). **Time-to-value** is supported by hosted funnel copy ([`BUYER_FIRST_30_MINUTES.md`](../BUYER_FIRST_30_MINUTES.md)), demo previews, CLI `try`, and sponsor-facing reports. Weak spots: **category noise**, **fewer hardened external proofs** than the depth of docs implies, **decision velocity** for buyers who cannot run a facilitated pilot, and **stickiness** that depends on repeat architecture workflows. Per [`V1_DEFERRED.md`](V1_DEFERRED.md), **Stripe/Marketplace live cutover**, **published reference customer**, and similar items are **not scored as V1 gaps**.

### Enterprise picture

**Traceability, auditability, governance, policy packs, RLS, procurement index, Trust Center honesty** punch above typical early SaaS depth ([`trust-center.md`](../trust-center.md), [`go-to-market/PROCUREMENT_PACK_INDEX.md`](../go-to-market/PROCUREMENT_PACK_INDEX.md), [`security/MULTI_TENANT_RLS.md`](../security/MULTI_TENANT_RLS.md)). **Trust** is bounded by intentional honesty: SOC 2 attestation and third-party pen-test publication are **not claimed for V1**; owner-conducted testing and questionnaires fill the interim. **Workflow embeddedness** leans REST, CLI, webhooks, GitHub/Azure DevOps, Teams; **ServiceNow/Jira/Confluence first-party connectors** sit in **V1.1**, **Slack** in **V2** ([`V1_SCOPE.md`](V1_SCOPE.md) §3)—not deducted here.

### Engineering picture

**Modular bounded contexts**, versioned **`/v1`** API with canonical OpenAPI **`/openapi/v1.json`** ([`API_CONTRACTS.md`](API_CONTRACTS.md)), DbUp migrations, Dapper persistence, **`TEST_STRUCTURE.md`** tiers, live E2E matrix ([`LIVE_E2E_HAPPY_PATH.md`](LIVE_E2E_HAPPY_PATH.md)), k6 gates ([`LOAD_TEST_BASELINE.md`](LOAD_TEST_BASELINE.md)), and documented OTel/custom metrics ([`OBSERVABILITY.md`](OBSERVABILITY.md)) demonstrate serious **correctness**, **deployability**, and **supportability** intent. Risks remain: **authority/coordinator convergence** debt referenced in governance of new surfaces (`V1_SCOPE` §3, ADR family), **real-LLM semantic quality** weaker than deterministic simulator/regression confidence, **head-based trace sampling** with authority-run tails preferring collector rules ([`OBSERVABILITY.md`](OBSERVABILITY.md)), and **operational longevity** proof (historical uptime rollups called out elsewhere as aspirational pending evidence).

### Deferred Scope Uncertainty

**None.** Explicit V1.1/V2 deferrals are consolidated in [`V1_DEFERRED.md`](V1_DEFERRED.md)—for example §6 (MCP V1.1, ITSM V1.1, Slack V2, commerce un-hold V1.1, external pen test V2, PGP key V1.1, named reference customer V1.1). This assessment does not penalize those items against V1.

---

## 3. Weighted Quality Assessment

**Method:** Score 1–100 per quality. Weight exactly as specified; **Σ(weight) = 102**. Weighted readiness = Σ(score × weight) / **102**. **Weighted deficiency signal** = (100 − score) × weight (higher = more urgent remedially). **Weighted impact on readiness** = (score × weight) / 102 (percentage points toward the headline total).

**Order:** most urgent → least urgent by weighted deficiency signal (ties: higher weight first).

| Quality | Score | Weight | Weighted deficiency signal | Weighted impact on readiness |
|---------|------:|-------:|---------------------------:|-----------------------------:|
| Marketability | 74 | 8 | 208 | 5.80 |
| Adoption Friction | 72 | 6 | 168 | 4.24 |
| Proof-of-ROI Readiness | 70 | 5 | 150 | 3.43 |
| Differentiability | 68 | 4 | 128 | 2.67 |
| Time-to-Value | 82 | 7 | 126 | 5.63 |
| Workflow Embeddedness | 66 | 3 | 102 | 1.94 |
| Executive Value Visibility | 78 | 4 | 88 | 3.06 |
| Correctness | 78 | 4 | 88 | 3.06 |
| Trustworthiness | 73 | 3 | 81 | 2.15 |
| Usability | 74 | 3 | 78 | 2.18 |
| Architectural Integrity | 74 | 3 | 78 | 2.18 |
| Security | 76 | 3 | 72 | 2.24 |
| Decision Velocity | 65 | 2 | 70 | 1.27 |
| Interoperability | 68 | 2 | 64 | 1.33 |
| AI/Agent Readiness | 68 | 2 | 64 | 1.33 |
| Commercial Packaging Readiness | 70 | 2 | 60 | 1.37 |
| Compliance Readiness | 70 | 2 | 60 | 1.37 |
| Maintainability | 70 | 2 | 60 | 1.37 |
| Procurement Readiness | 72 | 2 | 56 | 1.41 |
| Reliability | 72 | 2 | 56 | 1.41 |
| Data Consistency | 74 | 2 | 52 | 1.45 |
| Azure Compatibility and SaaS Deployment Readiness | 75 | 2 | 50 | 1.47 |
| Traceability | 84 | 3 | 48 | 2.47 |
| Explainability | 76 | 2 | 48 | 1.49 |
| Stickiness | 63 | 1 | 37 | 0.62 |
| Policy and Governance Alignment | 82 | 2 | 36 | 1.61 |
| Cognitive Load | 66 | 1 | 34 | 0.65 |
| Availability | 68 | 1 | 32 | 0.67 |
| Auditability | 85 | 2 | 30 | 1.67 |
| Scalability | 70 | 1 | 30 | 0.69 |
| Evolvability | 70 | 1 | 30 | 0.69 |
| Performance | 72 | 1 | 28 | 0.71 |
| Extensibility | 72 | 1 | 28 | 0.71 |
| Cost-Effectiveness | 72 | 1 | 28 | 0.71 |
| Deployability | 73 | 1 | 27 | 0.72 |
| Modularity | 73 | 1 | 27 | 0.72 |
| Customer Self-Sufficiency | 74 | 1 | 26 | 0.73 |
| Manageability | 74 | 1 | 26 | 0.73 |
| Template and Accelerator Richness | 75 | 1 | 25 | 0.74 |
| Supportability | 79 | 1 | 21 | 0.77 |
| Change Impact Clarity | 80 | 1 | 20 | 0.78 |
| Accessibility | 82 | 1 | 18 | 0.80 |
| Observability | 82 | 1 | 18 | 0.80 |
| Azure Ecosystem Fit | 82 | 1 | 18 | 0.80 |
| Documentation | 84 | 1 | 16 | 0.82 |
| Testability | 86 | 1 | 14 | 0.84 |

### Per-quality notes (abbreviated urgent → stable)

For each row: **Justification**, **Tradeoffs**, **Improvement recommendations**, **Fix horizon**.

1. **Marketability (74, w8)** — Strong docs and SaaS funnel; crowded “AI governance” positioning; facilitator often needed to crisply articulate wedge. Tradeoff: hype vs honesty. Recommend: sharper category claim tied to reproducible Pilot metrics; anonymized before/after. **v1** (content/evidence).

2. **Adoption Friction (72, w6)** — Core Pilot is narrow psychologically but the codebase and UI breadth remain high; progressive disclosure mitigates, does not erase training cost. Recommend: tighter default Pilot rail; fewer ambiguous entry paths. **v1**.

3. **Proof-of-ROI Readiness (70, w5)** — [`PILOT_ROI_MODEL.md`](PILOT_ROI_MODEL.md) and persisted deltas help; qualitative baselines remain operator-heavy. Recommend: completeness gate before sponsor-facing export/email. **v1**.

4. **Differentiability (68, w4)** — Replay, audit lineage, manifests differentiate technically; incumbent narrative overlap persists. Recommend: comparative proof emphasizing verification/replay—not generic assistants. **v1**.

5. **Time-to-Value (82, w7)** — Sample runs, demos, deterministic simulator path converge quickly. Recommend: preserve honest real-AOAI vs simulator labeling. **v1**.

6. **Workflow Embeddedness (66, w3)** — API/CLI/events/Teams/GitHub/Azure DevOps; deep ITSM is bridge or V1.1. Recommend: hardened recipe/schema contract tests per [`INTEGRATION_EVENTS_AND_WEBHOOKS.md`](INTEGRATION_EVENTS_AND_WEBHOOKS.md). **v1**.

7. **Executive Value Visibility (78, w4)** — Sponsor brief PDF/Markdown paths exist. Recommend: condensed executive view without drowning in technician detail. **v1**.

8. **Correctness (78, w4)** — Contracts, integration tests, schema validation mitigate structural errors; semantic LLM output remains probabilistic. Recommend: staged real-LLM eval rollups referencing existing instrumentation. **v1**.

9. **Trustworthiness (73, w3)** — Honest Trust Center lowers false confidence appropriately; lacks external attestations intentionally. Recommend: crisp owner-testing narrative; tighten demo-data watermarking discipline. **v1** narrative; attestations deferred per policy.

10. **Usability (74, w3)** — Authority/tier/UI shaping is sophisticated; onboarding load remains. Recommend: unify first-session checklist with server-visible milestone patterns already documented (`CORE_PILOT`). **v1**.

11. **Architectural Integrity (74, w3)** — Clear containers and docs; transitional coordinator/authority rules add cognitive load for contributors. Recommend: architecture/regression guards on new coordinator-only surfaces (policy in `V1_SCOPE`). **v1**.

12. **Security (76, w3)** — STRIDE framing, ZAP/Schemathesis schedules, RLS posture, JWT/API key splits. Recommend: reconcile any contributor README ambiguity with [`SECURITY.md`](SECURITY.md)—see improvement #8 below if executed. **v1**.

13. **Decision Velocity (65, w2)** — Procurement pack assists; questionnaires still chew calendar. Recommend: single-page procurement decision map linking only existing evidence (`PROCUREMENT_FAST_LANE`-style improvement). **v1**.

14. **Interoperability (68, w2)** — OpenAPI, AsyncAPI, events; connectors deferred partially. Recommend: canonical integration catalog cross-links kept hot. **v1** (+ V1.1 connectors explicitly out of scoring).

15. **AI/Agent Readiness (68, w2)** — Simulator + evaluations + circuits; MCP deferred V1.1. Recommend: explicit customer-facing “tool boundary” memo for agents in V1. **v1** doc posture.

16. **Commercial Packaging (70, w2)** — Pilot/Operate and tier gates coherent; Pilot simplicity vs Operate breadth can confuse. Recommend: Pilot-first messaging on pricing/onboarding hubs. **v1**.

17. **Compliance (70, w2)** — Templates and matrices; attestations intentionally absent. Recommend: SOC2 roadmap transparency only—no inflated claims. **v1**/program.

18. **Maintainability (70, w2)** — Many seams and docs—maintainability taxed by breadth. Recommend: tighten drift guards already indexed in `PRODUCT_PACKAGING`. **v1**.

19. **Procurement (72, w2)** — Index + questionnaires strong; reviewer fatigue without short map. Recommend: procurement fast lane one-pager. **v1**.

20. **Reliability (72, w2)** — Health, rate limits, k6 probes; soak non-blocking appropriately. Recommend: staged published operational rollups separated from contractual SLA text. **v1** transparency.

21. **Data consistency (74, w2)** — SQL authority, probes, orphan metrics ([`OBSERVABILITY.md`](OBSERVABILITY.md)). Recommend: widen tested enforcement modes; document operator interpretation in runbooks. **v1**.

22. **Azure SaaS readiness (75, w2)** — Terraform + Container Apps posture documented. Recommend: CD narrative kept single-spine [`REFERENCE_SAAS_STACK_ORDER.md`](REFERENCE_SAAS_STACK_ORDER.md). **v1**.

23. **Traceability (84, w3)** — Run trace IDs on creation, audits, correlations—standout strength. Maintain discipline on audit matrix updates. **v1**.

24. **Explainability (76, w2)** — Explain endpoints + UI; faithfulness/trace completeness telemetry exists. Tune alerts with real workloads. **v1**.

Middle and lower tiers (Stickiness → Testability)—briefly: residual risks are incremental (scale proof, preset defaults, accessibility maintenance, Grafana alignment). No item is dismissed; scores reflect **weighted marginal benefit** versus **commercial/governance apex items above**.

---

## 4. Top 10 Cross-Cutting Weaknesses

1. **Buyer cognitive load exceeds ideal first-session comprehension** despite packaging docs.
2. **Category ambiguity**—“AI architecture” without immediate, repeatable differentiator demos.
3. **Trust velocity ceiling**: honest documentation does not accelerate infosec committees expecting external attestations.
4. **LLM semantic correctness** remains the hardest buyer objection to disprove quickly.
5. **Surface-area vs Pilot wedge mismatch**—Operate power can distract evaluators prematurely.
6. **Legacy/convergence seams** consume contributor attention ([`ADR 0029`](../adr/0029-coordinator-strangler-acceleration-2026-05-15.md)-family context).
7. **Performance / scale evidence buyer-facing**: engineering has baselines—buyer narratives still require careful framing.
8. **README vs SECURITY nuance drift risk** on auth defaults affecting misconfigured pilots.
9. **Self-sufficiency asymmetry**: power users excel; hurried buyers under-index long-form library.
10. **Integration expectations vs V1 connectors**: enterprise ITSM familiarity collides intentionally deferred roadmap.

---

## 5. Top 5 Monetization Blockers

1. **Executive champion formation** slows when wedge story + proof are not pre-digested.
2. **Absence (by policy) of published marquee customer logos** slows land deals—explicitly deferred, still market friction.
3. **Incomplete automated sponsor-proof gating** risks self-inflicted credibility loss on early sends.
4. **Category noise** delaying budget carve-out vs incumbent consulting patterns.
5. **Conversion instrumentation gaps** across trial → repeat runs if dashboards are under-exercised externally.

---

## 6. Top 5 Enterprise Adoption Blockers

1. **Independent assurance artefacts** absent or explicitly deferred (`trust-center`).
2. **ITSM-centric workflow expectations vs first-party connectors** deferred (V1.1/V2)—recipes must be flawless.
3. **LLM/data-handling questionnaires** spike review time—even with forensic docs.
4. **Multi-region / active-active misunderstandings vs honest V1 scope** (`V1_SCOPE` §3).
5. **Procurement reviewer fatigue** from volume of excellent but long documentation absent a ruthless index map.

---

## 7. Top 5 Engineering Risks

1. **Treat UI shaping / nav visibility as security**—regression catastrophic (documented invariant; vigilance ongoing).
2. **Contract drift**: canonical vs explorer OpenAPI (`API_CONTRACTS` cautions—must remain governance).
3. **DbUp startup failure semantics** (`README`)—rigorous but operationally sharp during broken deploys.
4. **Distributed trace sampling** hiding slow authority outliers without collector tail policy ([`OBSERVABILITY.md`](OBSERVABILITY.md)).
5. **Data consistency alerting vs remediation playbooks maturity** vary by operator maturity.

---

## 8. Most Important Truth

**ArchLucid already demonstrates engineering seriousness and Pilot-path viability; predictable revenue hinges less on filling missing features than on shortening trust acquisition and simplifying the buyer’s first defensible artifact story.**

---

## 9. Top Improvement Opportunities

### 1. Buyer-safe first-value evidence gate

Why it matters: Converts structured outputs into a sponsor-safe purchase dossier without inventing completeness.

Affected qualities: Proof-of-ROI Readiness, Decision Velocity, Marketability, Trustworthiness.

Actionable now.

Impact of execution: Proof-of-ROI (+8–10), Decision Velocity (+3–5), Marketability (+2–4). Weighted readiness impact: **+0.8–1.2%**.

**Cursor prompt**

```text
Implement a buyer-safe evidence completeness gate for ArchLucid first-value reports.

Scope:
- Inspect first-value report / pilot deltas builders (ArchLucid.Application, related controllers, UI sponsor actions).
- Add a completeness model covering: committed manifest timing, findings by severity counts, artifact/bundle feasibility checks, bounded audit sampling, optional LLM call counts, demo-data warning, ROI baseline confidence per PILOT_ROI_MODEL.
- Surface completeness in Markdown + PDF sibling outputs (no fabricated values).
- Add tests in ArchLucid.Application.Tests and ArchLucid.Api.Tests.

Acceptance criteria:
- States Complete vs Partial vs Demo-only with explicit gaps list.
- Demo runs flagged non-negotiable for external screenshots when applicable.
- API routes unchanged in contract-breaking ways.

Constraints:
- No Stripe/Marketplace live requirements.
- No schema change unless unavoidable (justify in PR notes).

Do not rename REST paths/DTO/database entities solely for wording.
```

### 2. Core Pilot cognitive load compression (operator UI rail)

Affected qualities: Adoption Friction, Cognitive Load, Usability, Time-to-Value.

Actionable now.

Impact: Adoption Friction (+5–7), Cognitive (+8–10), Usability (+4–6). Weighted: **+0.7–1.0%**.

**Cursor prompt**

```text
Tighten Core Pilot UX: four canonical steps aligned with CORE_PILOT.md inside archlucid-ui.

Scope:
- Home / onboarding / runs / run-detail surfaces referencing Core Pilot checklist.
- Use buyer hybrid vocabulary per PRODUCT_PACKAGING (architecture review primary; Run ID secondary).
- Add or refine compact milestone rail wired to observable run status (no entitlement changes).
- Extend Vitests (existing core pilot / authority seam families).

Acceptance criteria:
- New evaluator sees next actionable step without reading README.
- Execute/Operate authority seams unchanged API-side.
- Progressive disclosure untouched for deep routes.

Constraints: No API loosening; no pricing entitlements rework.
```

### 3. Real-agent quality evidence rollup (offline-friendly)

Affected qualities: Correctness, AI/Agent Readiness, Trustworthiness, Explainability.

Actionable now (no AOAI provisioning in-task).

Impact: Correctness (+4–6), AI (+8–10), Trust (+3–5). Weighted: **+0.6–0.9%**.

**Cursor prompt**

```text
Add a rollup summarizing persisted agent-output evaluation metrics without requiring AOAI secrets in CI.

Scope:
- Inspect AgentOutputEvaluationRecorder, ARCHLUCID agent eval tests/docs, OBSERVABILITY metrics archlucid_agent_output_* .
- Produce CLI or authenticated read-model summarizing structural completeness distributions, semantic score histogram stubs, parse failure counts, quality gate outcomes—all from stored artefacts / metrics counters testable with fixtures/simulator traces.
- Document interpretation in docs/library adjacent to AGENT_OUTPUT_EVALUATION.md or similar.

Acceptance metrics:
- Clear “no real-LLM evidence recorded” pathway.
- Simulator runs never mislabeled as real-mode.

Constraints:
- Don’t bump prompts/deployments here.
```

### 4. Workflow bridge schema contract harness

Affected qualities: Workflow Embeddedness, Interoperability.

Actionable now.

Impact: WF Embedded (+6–8), Interop (+5–7). Weighted **+0.4–0.7%**.

**Cursor prompt**

```text
Validate integration recipe sample payloads vs schemas/integration-events + AsyncAPI.

Scope:
- Add tests ensuring representative ServiceNow/Jira recipe JSON (from docs/integrations/recipes) conforms to envelope + payload drafts.
- Fail CI when field names documenting correlation IDs drift from publisher code paths.

Constraints:
- No first-party connectors (V1.1 scope).
```

### 5. Coordinator/authority convergence guardrail test

Affected qualities: Architectural Integrity, Maintainability, Correctness (indirect).

Actionable now.

Impact: Architectural Integrity (+4–6). Weighted **+0.4–0.7%**.

**Cursor prompt**

```text
Add architecture/unit test guarding new MVC routes from depending on forbidden coordinator-only types without explicit allowlisted exception documented inline.

Scope:
- Read V1_SCOPE §3 net-new coordinator endpoint prohibition + relevant ADRs.
- Implement Reflection-based or analyzer-style test locating new controllers/registrations; tiny allowlist with comments referencing ADRs.

Constraints:
- No mass deletion/refactor beyond test harness + doc pointer.
```

### 6. Named query performance sentinel (TB backlog alignment)

Affected qualities: Performance, Scalability, Reliability.

Actionable now.

Impact: Perf (+5–7), Reliability (+2–4). Weighted **+0.3–0.5%**.

**Cursor prompt**

```text
Instrument + CI-guard named-query p95 thresholds per TECH_BACKLOG / OBSERVABILITY archlucid_query_p95_ms.

Scope:
- Add stable query_name tags for top lists (runs/audit/etc.) if missing tests.
- Wire scripts/ci/assert_query_performance.py thresholds with documented refresh process tests/performance/query-allowlist.json (create if absent per backlog).

Constraints:
- Bounded label cardinality only.
```

### 7. Data consistency enforcement breadth

Affected qualities: Data Consistency, Trustworthiness.

Actionable now.

Impact: Data Consistency (+6–8). Weighted **+0.4–0.6%**.

**Cursor prompt**

```text
Expand automated tests for DataConsistency enforcement modes Warn/Alert/Quarantine referencing existing probes + metrics increments; document operator playbook snippet in docs/runbooks (short).

Constraints:
- No auto-destructive remediation.
```

### 8. Procurement decision map (`PROCUREMENT_FAST_LANE`)

Affected qualities: Procurement Readiness, Decision Velocity, Compliance (clarity).

Actionable now.

Impact: Procurement (+4–6), Decision Velocity (+3–5). Weighted **+0.3–0.5%**.

**Cursor prompt**

```text
Add docs/go-to-market/PROCUREMENT_FAST_LANE.md (scoped blockquote header) linking each row ONLY to evidence files referenced in procurement index / trust-center; deferrals labeled V1.1/V2 explicitly—no attestations fabricated.

Cross-link minimally from procurement index if budget allows root count.

Run python scripts/ci/check_doc_scope_header.py before commit.

Constraints:
- Legal-only claims flagged template-only.
```

### **DEFERRED** Public named reference customer

Reason deferred: Requires customer permission, legal approval, logos/quotes.

Input needed later: Customer identity, permissible metrics/quotes/assets, publishing owner timeline.

(No Cursor prompt.)

### **DEFERRED** Commerce un-hold (Stripe live + Marketplace published + signup DNS)

Reason deferred: Owner-only Partner Center, banking/tax secrets, webhook + DNS sequencing.

Input needed later: Live key rotation plan, Marketplace offer identifiers, payout readiness, staged go-live date.

(No Cursor prompt.)

---

## 10. Pending Questions for Later

- **Buyer-safe gate:** Sponsor email/download—hard-stop vs advisory warning only?
- **Preset gating milestone:** Canonical persisted flag for first completed review package post-commit?
- **Real-LLM eval budget approval:** Maintain prior approved monthly ceiling vs freeze until revenue?
- **Procurement lane audience:** Optimize for SOC-heavy enterprise vs pragmatic mid-market wording?
- **Named queries allowlist curator:** Ownership for threshold adjustments post-perf regressions?

---

**Scoring trace (internal reproducibility)**

Commercial Σ(score×weight) = **2940** · Enterprise Σ = **1881** · Engineering Σ = **2755**.

**Σ(score×weight) = 7576** · Σ(weight)=**102** → weighted readiness **7576 ÷ 102 = 74.274509804%** rounded **74.27%**.
