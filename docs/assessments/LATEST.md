> **Scope:** Engineering assessment for internal leads and reviewers tracking V1 GA readiness; not a public-facing status report or compliance attestation.

# ArchLucid Assessment – (A) Headline Readiness: 93.28%

*This score represents the `(A)` headline readiness per `Assessment-Scope-V1_1.mdc`, explicitly excluding deferred V1.1/V2 items such as SOC 2 CPA attestation, third-party pen tests, MCP, the commerce un-hold, multi-cloud (AWS/GCP) analysis, multi-region active/active, automated tenant erasure, Graph-RAG / agentic retrieval, hosted Tier 2 continuous polling, **non-SCIM bulk-CSV user onboarding (V2)**, **self-hosted Enterprise commercial deals (V2)**, and related sub-milestones (capacity guide, private-endpoint reference architecture).*

**Score ledger:** Incremental history through legacy **archived #1–#57** and owner rescoring (**87.74% → 92.63%**) lives in [`ARCHIVE_2026_05_25.md`](ARCHIVE_2026_05_25.md).

**Rescore 2026-05-25 (post Improvements #1–#6):** Headline **93.28%** (+0.47% documented: #1 eval baseline CI +0.02%, #2 gate telemetry +0.02%, **#3 RAG follow-ons +0.19%**, **#4 USD savings gauge +0.09%**, **#5 Team expansion CTA +0.10%**, **#6 quote SLA visibility +0.05%**). Open **V1 GA gate #7** remains in pillar scores. **Post-GA ceiling when #7 ships:** **+0.08%** → **93.36%**. V1 quality-gate posture: **fail-fast** — no auto-retry on reject.

## Executive Summary

**`(A)` Overall Headline Readiness**
ArchLucid is well past the pilot-credible bar for V1 GA at **93.28%**. The core architecture, observability, audit, governance, and trial-funnel plumbing are production-ready. The agent-output evaluation harness (structural + semantic + faithfulness scoring, quality gate, golden cohort, `eval_agent_corpus.py`) **ships today** — prior assessments that treated “no evaluation harness” as a `(A)` gap were overstated. **Improvements #1–#6 shipped 2026-05-25** (eval baseline CI warn-soak, classified gate telemetry, RAG Batch 1 follow-ons, USD savings gauge, Team expansion CTA, quote SLA visibility). **Owner 2026-05-25:** V1 GA is contingent on Improvement **#7** — custom policy pack GTM publication. **No `(A)` items remain outside this gate set.**

**`(B)` Procurement / Market-Motion Realism (Informational — zero weight on `(A)`)**
Enterprise procurement teams will still ask for CPA-issued SOC 2 Type II, an external pen-test summary, automated GDPR erasure, multi-region active/active, AWS/GCP target analysis, and **self-hosted / on-premises deployment**. Every one of these items is **explicitly out of `(A)` scope** per `V1_DEFERRED.md` §6c, §6l, §6m, §6n, **§6t**, and the scope rule. The right posture is honest trust-center narrative — **V1 GA is hosted SaaS**; self-hosted Enterprise is **V2** — not score deductions.

**The Commercial Picture**
Pricing is locked and defensible (`PRICING_PHILOSOPHY.md` §5). The trial funnel is deeply instrumented with audit + Prometheus + Grafana. **Owner 2026-05-25:** V1 GA commercial gate is **custom policy pack authoring GTM publication** (**#7**). **Improvements #5–#6 shipped 2026-05-25** — paid Team expansion CTA and quote-request SLA operator/Grafana visibility. Executive ROI summary endpoint with cross-run deduplication is **shipped for V1 GA** per §2.8 / §6o. Stripe live keys + Marketplace `Published` are deliberately held to V1.1 (§6b) — a sales-led motion is the V1 contract, not a defect.

**The Enterprise Picture**
**V1 GA Enterprise is ArchLucid-hosted SaaS** — SCIM, SAML SP, OIDC, RLS, governance, and policy packs on the operated platform. V1 SAML posture: **metadata CLI (archived #4), startup validation (archived #18), and operator docs** — no interactive claim-mapping wizard (explicitly **out of V1 scope**, owner 2026-05-25). **Self-hosted Enterprise deals** (customer-operated deployments, private-endpoint reference architecture, consolidated capacity guide, deployment playbook) are **V2** per [`V1_DEFERRED.md` §6t](../library/V1_DEFERRED.md) — `(B)` procurement realism only, zero `(A)` penalty. Container / Terraform assets remain for engineering and evaluation, not as a V1 contracted buyer path.

**The Engineering Picture**
The foundation is genuinely strong: warnings-as-errors, strict CI, merged-line coverage gate, vulnerability scanning, SBOM publication, OpenTelemetry depth, circuit breakers, outbox + data-consistency probes, vector-store readiness probing, Ask RAG SQL fallback, policy-pack / prior-manifest corpora (Batch 1), LLM faithfulness enabled by default on hosted Staging/Production (owner 2026-05-25), RAG retrieval duration/chunk telemetry (Batch 2), committed Grafana dashboards for ROI, integration outbox, and LLM redactions, board-pack ROI Markdown/PDF export (archived #24), leader-elected agent-trace blob cleanup (archived #8), eval baseline CI + gate telemetry (**#1–#3 shipped 2026-05-25**), tenant-assigned policy-pack retrieval filter + cross-run prior-manifest indexing + grounding trace (**#3**), **`archlucid_tenant_estimated_savings_usd` background gauge (**#4**)**, quote-request aging operator dashboard + Grafana **Sales ops** row (**#6**), and a deliberate single-replica baseline with documented Redis upgrade path (§6e). **V1 GA engineering gate:** Improvement **#7** (see Most Important Truth).

---

## Weighted Quality Assessment

Qualities are ranked from most urgent to least urgent based on their **weighted deficiency** (Weight × (100 - Score)).

### 1. Cutting-Edge AI Technology
- **Score:** 90
- **Weight:** 8
- **Weighted Deficiency:** 80
- **Justification:** ArchLucid runs Azure OpenAI with structured-output JSON contracts, content-safety enforcement, prompt redaction with auditable bypass counters, circuit breakers, caching, embedding-faithfulness optional scorer, and a working retrieval seam (`ArchLucid.Retrieval`). Batch 1 (2026-05-24) shipped policy-pack and prior-manifest corpora. The **agent-output evaluation harness ships** — structural + semantic + faithfulness scorers, quality gate, golden cohort, `eval_agent_corpus.py`. **Improvement #1 shipped 2026-05-25** — committed baselines under `tests/golden-cohort/baselines/` and CI `--baseline` warn-soak. **Improvement #3 shipped 2026-05-25** — tenant-assigned pack query filter, cross-run prior-`GoldenManifest` indexing, `IRetrievalCitationFormatter`, and `RetrievalGroundingTrace`. **LLM faithfulness judge enabled by default** on hosted Staging/Production (`ArchLucid:Agents:LlmFaithfulness:Enabled=true`, owner 2026-05-25). Graph-RAG and agentic retrieval remain **V2** per §6q.
- **Tradeoffs:** Baseline regression enforcement may fail PRs on model drift — that is the point. Owner 2026-05-25: **warn-only soak first** (`continue-on-error: true`), publish scorecard on every run, flip merge-blocking only after **10 consecutive main-branch green runs** with **zero false-positive PR failures** attributable to LLM/judge noise — not a calendar deadline.
- **Recommendations:** Monitor `archlucid_agent_output_llm_faithfulness_score` and retrieval grounding traces after GA.
- **Status:** **#3 shipped 2026-05-25.** **#1 shipped 2026-05-25.**

### 2. AI/Agent Readiness
- **Score:** 96
- **Weight:** 8
- **Weighted Deficiency:** 32
- **Justification:** The agent runtime is production-grade — circuit breakers, content safety, prompt-redaction telemetry, four agent types, shipped evaluation + quality-gate stack, and **LLM faithfulness judge enabled by default on hosted Staging/Production** (owner 2026-05-25). **Improvements #1–#3 shipped 2026-05-25** — eval baseline CI warn-soak, **`reject_reason` / `execution_mode`** on `archlucid_agent_output_quality_gate_total`, and RAG grounding trace on `ComplianceAgentHandler`. **No automatic retry on quality-gate reject** for V1 (fail-fast; owner 2026-05-25). Optional post-gate polish: `AlternativePathsConsidered` on finding engines.
- **Tradeoffs:** LLM faithfulness adds token cost per real-mode agent trace; `SkipWhenSimulator: true` preserves CI/simulator economics. Auto-retry would compound token spend and mask systematic prompt/evidence failures — deferred to V1.1 pending production **`reject_reason`** data.
- **Recommendations:** Monitor `archlucid_agent_output_llm_faithfulness_score` and tenant LLM budget utilization after enablement.
- **Status:** **#3 shipped 2026-05-25.** **#1–#2 shipped 2026-05-25.**

### 3. Adoption Friction
- **Score:** 94
- **Weight:** 6
- **Weighted Deficiency:** 36
- **Justification:** Entra ID, generic OIDC, native SAML SP, SCIM, API-key automation, and `archlucid doctor` all land in V1 GA on **ArchLucid-hosted SaaS**. Tier 1 Azure Extractor is the V1 path by design. Hosted Tier 2 continuous polling is **V1.x per §6p** and not penalized. **Non-SCIM bulk-CSV** is **V2** per [`V1_DEFERRED.md` §6r](../library/V1_DEFERRED.md). **Self-hosted Enterprise deals** are **V2** per [`V1_DEFERRED.md` §6t](../library/V1_DEFERRED.md). SAML metadata CLI (archived #4) and SAML SP startup validation (archived #18, 2026-05-24) are the **V1 SAML contract**; an interactive claim-mapping wizard is **explicitly out of V1 scope** (owner 2026-05-25) and must not appear as an `(A)` defect. **No guided sandbox** (owner 2026-05-25). **Improvement #5 shipped 2026-05-25** — paid Team→Professional expansion CTA (`GET /v1/tenant/usage-status`, `TeamExpansionNudge`, separate Prometheus/audit telemetry). **Owner 2026-05-25:** custom policy pack authoring **public GTM publication** (#7) ships before GA.
- **Tradeoffs:** In-product upgrade nudges feel pushy if not carefully tuned; pace them against documented seat/workspace thresholds (mirror archived #14 dismissal cadence). Publishing PS SKUs on the public pricing page increases procurement scrutiny — ensure figures stay in canonical pricing docs only.
- **Recommendations:** Ship Improvement **#7** before GA; document SAML claim-mapping in hosted Enterprise onboarding checklist (archived #17).
- **Status:** V1 GA gated on **#7** (owner 2026-05-25). **#5 shipped 2026-05-25.**

### 4. Time-to-Value
- **Score:** 91
- **Weight:** 7
- **Weighted Deficiency:** 63
- **Justification:** Trial funnel is automated end-to-end with audit + Prometheus instrumentation; Tier 1 extractor ZIP is the customer-friendly default; Core Pilot four-step happy path is published; ROI surfaces (per-run and executive cross-run) are live; sample-seeded trial tenant works. **No separate guided sandbox** — owner decision 2026-05-25; not a `(A)` gap. Usage-based **trial** upgrade nudge shipped (archived #14, 2026-05-24). **Improvement #5 shipped 2026-05-25** — paid Team→Professional expansion CTA. **Improvement #6 shipped 2026-05-25** — operator **Pricing quote aging** dashboard (`/admin/pricing-quote-aging`), Grafana **Sales ops** row, and runbook verification steps on shipped **archived #11** backend. AWS/GCP target analysis is **V1.1 per §6n** and not penalized.
- **Tradeoffs:** In-product upgrade nudges feel pushy if not carefully tuned; pace them against documented seat/workspace thresholds. Quote SLA dashboards surface sales ops gaps — that is intentional hygiene, not a product defect.
- **Recommendations:** Monitor warn/breach counts after deploy; keep marketing quote copy aligned with 1-business-day acknowledgement SLA.
- **Status:** **#6 shipped 2026-05-25.** **#5 shipped 2026-05-25.**

### 5. Proof-of-ROI Readiness
- **Score:** 94
- **Weight:** 5
- **Weighted Deficiency:** 30
- **Justification:** Pilot Scorecard API and Executive ROI Summary are implemented with cross-run deduplication, systemic-issue aggregation, history endpoint, CSV export response shape (`ExecutiveRoiExportResponse`), CSV export CLI (archived #9, 2026-05-24), and board-pack Markdown/PDF export (archived #24, Batch 3, 2026-05-24). The aggregation rules in `ExecutiveRoiSummaryService` are documented (§2.8) and implement stable-`FindingId` dedup as committed. **`ExecutiveRoiSummaryServiceTests` / `ExecutiveRoiSummaryServiceExtendedTests`** now cover cross-tenant dedup, null/empty `FindingId` edge cases, snapshot savings aggregation, muted findings, and export rows (Improvement archived #3, 2026-05-24).
- **Tradeoffs:** Cross-tenant dedup logic is non-trivial; regression risk is reduced but new finding categories still warrant test updates when aggregation rules change.
- **Recommendations:** Keep board-pack export templates aligned with executive ROI schema changes.
- **Status:** Fixable in V1.

### 6. Executive Value Visibility
- **Score:** 97
- **Weight:** 4
- **Weighted Deficiency:** 12
- **Justification:** Executive ROI Summary endpoint, operator-shell `ExecutiveRoiSummarySection`, CSV export CLI (archived #9, 2026-05-24), board-pack Markdown/PDF export API + CLI (archived #24, Batch 3, 2026-05-24), leader-elected cache warmup hosted service (archived #16, 2026-05-24), Grafana **Business Value** row on `dashboard-archlucid-authority.json`, and **Improvement #4 shipped 2026-05-25** — **`archlucid_tenant_estimated_savings_usd`** platform aggregate refreshed by `ExecutiveRoiSavingsGaugeHostedService` (findings proxy retained as secondary panel).
- **Tradeoffs:** Pre-warming the cache costs background CPU but eliminates the cold-first-impression problem for the very people the dashboard is for. Per-tenant savings gauges add Prometheus cardinality — emit **platform aggregate only** unless **`ExecutiveRoi:SavingsGauge:RecordPerTenantSavings`** is enabled (mirrors `LlmTelemetry:RecordPerTenantTokens` gating).
- **Recommendations:** Monitor platform savings gauge vs Executive ROI API totals after deploy.
- **Status:** **#4 shipped 2026-05-25.**

### 7. Reliability
- **Score:** 99
- **Weight:** 2
- **Weighted Deficiency:** 2
- **Justification:** Outbox + data-consistency probes (`DataConsistencyOrphanProbeHostedService`), circuit breakers with health-check exposure, SQL transactions, RLS with `SESSION_CONTEXT`, quarantine paths, `VectorStoreHealthCheck` on `/health/ready` (archived #10, 2026-05-24), Ask RAG SQL fallback (archived #13, 2026-05-24), LLM faithfulness metrics on the agent-output evaluation hook (archived #2, Batch 1, opt-in), integration outbox delivery counters plus dedicated Grafana dashboard (archived #19, Batch 2, 2026-05-24), leader-elected agent-trace orphan blob cleanup with `archlucid_data_archival_blobs_deleted_total` (archived #8, Batch 4, 2026-05-24), and **relational integrity hardening (archived #26–#33, 2026-05-24)** — hot-path indexes, `RunId` `UNIQUEIDENTIFIER` migration, archive cascade TVP, trusted FK constraints, enumeration CHECK constraints, scope `NOT NULL`, and filtered `GoldenManifests` unique index — form a strong V1 baseline. Single-region active/passive is the **V1 contract per §6l** and not a `(A)` defect. Residual hygiene: register new tables with the orphan probe (**#12**, post-GA).
- **Tradeoffs:** A vector-store health check that fails `/health/ready` could keep an otherwise-healthy API node out of rotation; `Retrieval:VectorStoreHealthCheck:FailReadinessWhenUnavailable` defaults permissive (degraded, not failing).
- **Recommendations:** Monitor schema growth via **#12** (orphan-probe CI guard, post-GA).
- **Status:** Relational integrity **shipped** (archived #26–#33); post-GA **#12** optional.

### 8. Maintainability
- **Score:** 100
- **Weight:** 2
- **Weighted Deficiency:** 0
- **Justification:** Central Package Management, warnings-as-errors, `EnforceCodeStyleInBuild`, strict CI, dependency vulnerability scanning, SBOM publication, gitleaks, merged coverage gates, and a clear bounded-context layout make this codebase exceptionally maintainable. Batch 4 (archived #8, 2026-05-24) added leader-elected blob cleanup; **Batch 8 (archived #26–#28, 2026-05-24)** consolidated archive cascade to a TVP stored procedure; **archived #53–#55** (2026-05-24/25) closed lateral coupling policy and `DependencyConstraintTests` gaps; **archived #57** hardened OpenAPI ↔ client ↔ UI contract parity. Residual post-GA debt: hexagonal guards for `Persistence→Provenance` and `Persistence→Capabilities.Cost` (**#16**).
- **Tradeoffs:** Strict CI gates raise contributor friction; offset by good `*.slnf` filters and the dev container.
- **Recommendations:** Ship **#16** (hexagonal guards, post-GA) if port inversion is deferred further.
- **Status:** Shipped for relational integrity and architecture-test closure; post-GA **#16** optional.

### 9. Supportability
- **Score:** 99
- **Weight:** 1
- **Weighted Deficiency:** 1
- **Justification:** OpenTelemetry depth (custom `ArchLucid` meter with ~50 instruments), persisted W3C trace IDs on runs, Serilog + correlation IDs, `archlucid doctor`, CLI `support-bundle`, multiple committed Grafana dashboards, RAG retrieval duration/chunk histograms (archived #7), Prometheus alert rules, detailed `/health` with circuit-breaker introspection and vector-store readiness probing (archived #10). **Improvements #2, #4, and #6 shipped 2026-05-25** — **`reject_reason` / `execution_mode`** on `archlucid_agent_output_quality_gate_total`, **`archlucid_tenant_estimated_savings_usd`** observable gauge, and pricing-quote aging **Sales ops** Grafana row + operator triage dashboard.
- **Tradeoffs:** More telemetry costs ingest dollars in Azure Monitor / Prometheus; per-tenant cardinality is gated behind `LlmTelemetry:RecordPerTenantTokens` and `ExecutiveRoi:SavingsGauge:RecordPerTenantSavings`.
- **Recommendations:** Enable per-tenant RAG tags only for bounded tenant counts.
- **Status:** **#6 shipped 2026-05-25.** **#4 shipped 2026-05-25.** **#2 shipped 2026-05-25.**

**Headline check:** `(90×8 + 96×8 + 94×6 + 91×7 + 94×5 + 97×4 + 99×2 + 100×2 + 99×1) ÷ 43 = **93.28%** (documented +0.47% from shipped **#1–#6**). Total weighted deficiency **283** (informational; headline uses scores, not deficiency sum).

---

## Top 10 Most Important Weaknesses

All V1.1 / V2 items removed per `Assessment-Scope-V1_1.mdc`. Items **1–7** are **V1 GA gates**; **8–10** are **post-GA** `(A)`-actionable gaps (not headline blockers).

1. **RAG-V1 Batch 1 follow-ons — SHIPPED 2026-05-25 (Improvement #3):** Tenant-assigned pack query filter, cross-run prior-`GoldenManifest` indexing, and RAG-V1-000 citation formatter / grounding trace shipped before remaining GA gates.
2. **Eval corpus baseline regression — SHIPPED 2026-05-25 (Improvement #1):** Per-scenario baseline JSON, `--baseline`, and warn-only CI soak (flip merge-blocking after 10-run exit criterion).
3. **USD savings Prometheus gauge — SHIPPED 2026-05-25 (Improvement #4):** `archlucid_tenant_estimated_savings_usd` platform aggregate + Grafana Business Value primary panel.
4. **Custom policy pack authoring GTM — V1 GA gate (Improvement #7):** SKU matrix, SoW, and order-form template exist in repo (archived #6); owner 2026-05-25 requires **public pricing page publication + sales kit cross-links** before GA (option A).
5. **Team→Professional expansion CTA — SHIPPED 2026-05-25 (Improvement #5):** `GET /v1/tenant/usage-status`, `TeamExpansionNudge`, and separate Prometheus/audit telemetry for paid Team tenants at ≥80% seat or workspace usage.
6. **Pricing quote-request SLA visibility — SHIPPED 2026-05-25 (Improvement #6):** Operator **Pricing quote aging** dashboard, Grafana **Sales ops** row on `dashboard-archlucid-authority.json`, and runbook verification on shipped **archived #11** backend (aging API, histogram, `ArchLucidPricingQuoteAcknowledgementBreach`).
7. **Quality-gate reject telemetry — SHIPPED 2026-05-25 (Improvement #2):** Fail-fast on reject is the V1 contract; `reject_reason` / `execution_mode` labels shipped on `archlucid_agent_output_quality_gate_total`.
8. **Cost agent lacks Azure Retail row citation — post-GA (Improvement #8):** Cost findings can quote USD without deterministic Retail lookup (RAG-V1-003); weakens faithfulness and §2.16 citation contract until structured lookup ships.
9. **Tier-1 extractor ZIP upload errors opaque — post-GA (Improvement #18):** Ingestion failures surface generic errors in UI; prospects and trials cannot self-remediate without support — measurable adoption friction after GA.
10. **Executive ROI reflects Retail pricing only — post-GA (Improvement #23):** No EA discount multiplier; finance reviewers at Enterprise accounts discount savings claims that ignore contracted rates.

---

## Top 5 Monetization Blockers

V1.1-deferred commercial items (Stripe live-key flip, Marketplace publication, signed design partner, named reference customer, AWS/GCP analysis pricing) are removed per scope rule. The list below is V1-realistic friction that can be addressed inside the current contract.

1. **Trial→paid upgrade nudge:** Shipped (archived #14, 2026-05-24).
2. **Team→Professional expansion CTA:** Shipped (Improvement **#5**, 2026-05-25).
3. **Pricing quote-request SLA visibility:** Shipped (Improvement **#6**, 2026-05-25).
4. **Custom policy pack authoring GTM — V1 GA gate (Improvement #7):** Publish Starter / Standard / Program PS SKUs on public pricing surface with SoW + order-form cross-links (owner 2026-05-25, option A).
5. **Executive ROI Retail-only pricing — post-GA (Improvement #23):** Finance stakeholders at EA accounts treat undiscounted Retail savings as non-credible until configurable multiplier ships.

---

## Top 5 Enterprise Adoption Blockers

CPA SOC 2 Type II, third-party pen-test publication, automated GDPR tenant erasure, multi-region active/active, and AWS/GCP target analysis are all explicitly out of `(A)` scope per `Assessment-Scope-V1_1.mdc` and `V1_DEFERRED.md` §6c / §6l / §6m / §6n. Procurement realism for those items belongs under `(B)` (informational, zero weight). The list below is V1-realistic enterprise friction.

1. **Tier 2 Azure Extractor service-principal provisioning is customer-side manual:** The Tier 1 path is excellent; the Tier 2 opt-in still requires customers to author and review a service-principal setup script, which security reviewers will scrutinize line-by-line (**#17**, post-GA).
2. **Custom policy pack authoring GTM — V1 GA gate (Improvement #7):** Public pricing page + sales kit must surface PS SKUs before GA (owner 2026-05-25); repo docs (archived #6) alone are insufficient.
3. **Team→Professional expansion CTA:** Shipped (Improvement **#5**, 2026-05-25).
4. **SAML claim-mapping relies on docs, not in-product guidance — post-GA (Improvement #25):** Wizard is out of V1 scope (owner 2026-05-25); hosted Enterprise onboarding checklist (archived #17) still needs explicit IdP attribute → role mapping tables for top IdPs.
5. **Tier-1 extractor ZIP upload errors opaque — post-GA (Improvement #18):** Enterprise pilots hitting ingestion validation failures depend on support unless UI surfaces structured remediation.

---

## Engineering Risks

Open mitigations only — active Improvements **#1–#25**. Legacy shipped work uses **archived #1–#57** in the archive file.

1. **Cross-tenant ROI aggregation could leak data:** RLS or `SESSION_CONTEXT` failure during `ExecutiveRoiCacheWarmupHostedService` or background rollups — **#11** (post-GA).
2. **AgentResult blob storage lacks storage-account lifecycle policy:** Orphan cleanup runs in-app; Azure blob tiering and retention are not codified in Terraform — **#13** (post-GA).
3. **Integration outbox dead letters lack operator UI:** Sustained webhook failure still requires SQL or CLI for bulk DLQ triage — **#14** (post-GA).
5. **Azure OpenAI circuit breakers may trip too aggressively:** Latency brownouts can fail entire authority runs instead of degrading gracefully — **#15** (post-GA).
6. **`DataConsistencyOrphanProbe` may miss new tables:** Schema growth without probe registration or CI guard — **#12** (post-GA).
7. **Quality-gate rejects lack classified telemetry:** ~~Faithfulness enabled by default on hosted Staging/Production; without **`reject_reason` / `execution_mode`** on `archlucid_agent_output_quality_gate_total`, operators cannot triage reject causes — **#2** (V1 GA gate).~~ **Resolved 2026-05-25** — Improvement **#2** shipped.
8. **`LlmCostEstimator` overflow and negative-rate misconfig:** Token sums can wrap at ~2.1B; negative USD rates can produce invalid FinOps slices — **#19**, **#20** (post-GA; TB-022/024/026).
9. **Prometheus cardinality at tenant scale:** Ungated per-tenant labels on RAG and ROI metrics can explode ingest cost — **#24** (post-GA; especially after **#4** gauge ships).
10. **Boot-time architecture invariant gaps:** INV-005 startup validator parity and INV-006 composition-root scan — **#21** (post-GA; TB-010 Wave A remainder).
11. **Agent-output quality metrics lack production alert routing:** Faithfulness and gate-reject regressions may go unnoticed until customer impact — **#22** (post-GA; TB-004; after **#2**).
12. **Persistence hexagonal guard holes:** `Persistence→Provenance` and `Persistence→Capabilities.Cost` lack architecture-test guards — **#16** (post-GA).

---

## Most Important Truth

ArchLucid is ready to ship V1 GA **after Improvement #7 lands**. **Improvements #1–#6 shipped 2026-05-25**. The honest **V1 GA gate set** is **#7** (custom pack GTM). **Headline is 93.28%** until **#7** ships; **post-GA ceiling 93.36%** when **#7** lands (+0.08% documented). Post-GA **#8–#25** do not move headline.

---

## V1 Improvement Tasks (25 actionable)

Shipped improvements (**archived #1–#57**, 2026-05-24 – 2026-05-25) are documented in [`ARCHIVE_2026_05_25.md`](ARCHIVE_2026_05_25.md). **Active tasks in this file: #1–#25** (renumbered 2026-05-25; do not confuse with legacy archive IDs).

**V1 GA gates (ship before GA):** **#7** (1 item). **#1–#6 shipped 2026-05-25.**
**Additional V1 actionable (post-GA or parallel):** **#8–#25** (18 items).
**Total:** **25** actionable improvements in this assessment.

### 1. Wire Agent-Output Eval Corpus Baseline Regression — **SHIPPED 2026-05-25**
- **Why it matters:** The evaluation harness already ships (`AgentOutputEvaluator`, semantic/faithfulness scorers, quality gate, `tests/golden-cohort/cohort.json`, `tests/eval-corpus/`, `scripts/ci/eval_agent_corpus.py`). Without per-scenario baseline JSON and CI `--baseline` enforcement, prompt/model drift is detected only manually. Owner 2026-05-25: **#1 gates V1 GA** (option A — ship before GA with warn-soak exit criterion).
- **Expected impact:** Closes remaining eval-harness CI gap. Weighted readiness impact: **+0.02%** when shipped (harness rescoring already in headline). **Do not rescored until shipped.**
- **Affected qualities:** Cutting-Edge AI Technology, AI/Agent Readiness, Reliability.
- **Actionable now:** ~~Yes — **V1 GA gate**.~~ **Shipped 2026-05-25.**
- **Owner decision (2026-05-25):** Use existing four-metric stack — structural completeness, semantic score (0.4 claims + 0.6 findings), faithfulness support ratio, optional embedding mean cosine. Aggregate: **0.25×structural + 0.30×semantic + 0.30×faithfulness + 0.15×embedding**. Pass floor **0.70** aggregate; regression = **>5 pts** drop on any single dimension or **>3 pts** on aggregate vs committed baseline. **CI posture (option A):** Run `--baseline` in CI with **`continue-on-error: true`** (warn-only soak) and **always publish** `artifacts/agent-eval-scorecard.md` via `--markdown-report`. Flip to **merge-blocking** only after **10 consecutive main-branch green runs** with **zero false-positive PR failures** attributable to LLM/judge noise — not a calendar deadline. **Not** advisory-only (never fail PRs). **Gates V1 GA** — wire CI before GA; soak may complete post-GA only if baselines land pre-GA with warn-only enabled.
```cursor
Wire baseline regression for the agent-output evaluation corpus.

Context: Harness already exists — see docs/library/AGENT_OUTPUT_EVALUATION.md,
tests/golden-cohort/cohort.json, tests/eval-corpus/templates-pack/rubric.json,
scripts/ci/eval_agent_corpus.py, ArchLucid.AgentRuntime.Evaluation.*.

1. Add committed baseline files at tests/golden-cohort/baselines/<scenario-id>.baseline.json
   recording per-scenario scores: structuralCompleteness, semanticScore,
   faithfulnessSupportRatio, embeddingFaithfulnessMeanCosine (nullable), aggregateScore,
   capturedUtc, and rubricVersion.

2. Extend scripts/ci/eval_agent_corpus.py:
   - Add --write-baseline (maintainer-only) to regenerate baselines from current corpus.
   - Add --baseline (default in CI when baselines exist) to fail when:
     aggregateScore drops >3.0 points OR any single dimension drops >5.0 points vs baseline.
   - Emit a markdown scorecard table (scenario id, agent type, deltas) via --markdown-report.

3. Add a CI step in .github/workflows/ci.yml (or template-eval-harness.yml) invoking:
   python scripts/ci/eval_agent_corpus.py --markdown-report artifacts/agent-eval-scorecard.md --baseline
   Owner posture (2026-05-25): warn-only soak first — set continue-on-error: true on this step.
   Always upload artifacts/agent-eval-scorecard.md as a CI artifact (even during soak).
   Flip to merge-blocking (continue-on-error: false) only after 10 consecutive main-branch
   green runs with zero false-positive PR failures attributable to LLM/judge noise.
   Document the flip date and exit criterion in docs/library/AGENT_OUTPUT_EVALUATION.md.

4. Optional follow-on in same PR if small: populate AlternativePathsConsidered on the 10 finding
   engines where empty (FindingFactory / explainability builders) so semantic depth scoring
   can detect regressions — do not change finding severity logic.

Constraints:
- Do NOT rebuild AgentOutputEvaluator — reuse existing evaluators.
- Do NOT require Azure OpenAI credentials for simulator rows; real-mode rows stay skip-when-unset.
- Baseline files must contain scores only — no customer text or prompts.

Acceptance Criteria:
- Baseline JSON committed for all simulator scenarios in tests/eval-corpus/agent-results/*.simulator.json.
- --baseline fails when scores regress beyond thresholds; --write-baseline regenerates cleanly.
- Scorecard markdown artifact produced in CI.
- docs/library/AGENT_OUTPUT_EVALUATION.md updated with baseline workflow.
```

### 2. Classify Quality-Gate Rejects in Telemetry (no auto-retry for V1) — **SHIPPED 2026-05-25**
- **Why it matters:** Production/Staging use **`BlockRunOnReject: true`** with LLM faithfulness enabled by default. Automatic agent retry on reject is **explicitly out of V1 scope** (fail-fast; owner 2026-05-25) — operators re-run manually. Without **`reject_reason`** (`structural` / `semantic` / `faithfulness` / `none`) and **`execution_mode`** (`simulator` / `real`) on **`archlucid_agent_output_quality_gate_total`**, operators cannot classify production rejects before V1.1 retry decisions. Owner 2026-05-25: **#2 gates V1 GA** (option A).
- **Expected impact:** Directly improves Supportability (+1 pt) and AI/Agent Readiness polish. Weighted readiness impact: **+0.02%** when shipped. **Do not rescored until shipped.**
- **Affected qualities:** Supportability, AI/Agent Readiness, Reliability.
- **Actionable now:** ~~Yes — **V1 GA gate**.~~ **Shipped 2026-05-25.**
- **Owner decision (2026-05-25):** **No automatic retry** for V1. Ship **`reject_reason` + `execution_mode` telemetry before GA**; revisit single auto-retry in V1.1 if production **`reject_reason`** rates on **`execution_mode=real`** justify it.
```cursor
Add classified quality-gate reject telemetry without implementing automatic agent retry.

Owner posture: V1 stays fail-fast on quality-gate reject (BlockRunOnReject remains true in
appsettings.Staging.json / appsettings.Production.json). Do NOT add orchestrator auto-retry.

1. Extend archlucid_agent_output_quality_gate_total labels in AgentOutputEvaluationRecorder:
   - reject_reason: none | structural | semantic | faithfulness
     (use none when outcome != rejected)
   - execution_mode: simulator | real
     (from AgentExecution:Mode — Real vs Simulator)

2. Implement reject_reason classification on IAgentOutputQualityGate (or a small helper used by
   AgentOutputEvaluationRecorder) using EvaluationReason codes from AgentOutputTraceQualityEvaluator
   (e.g. agent_result_faithfulness_below_floor → faithfulness, pilot_semantic_* / citations → semantic,
   structural / unparsed / parse_failure → structural; threshold-only rejects use score dominance).

3. Update ArchLucidInstrumentation counter description and docs/library/OBSERVABILITY.md +
   docs/library/AGENT_OUTPUT_EVALUATION.md with the new labels and the explicit V1 no-auto-retry policy.

4. Add unit tests in ArchLucid.AgentRuntime.Tests/Evaluation/AgentOutputQualityGateTests.cs for
   ResolveRejectReasonCategory (or equivalent) covering faithfulness, semantic, structural, and none.

Constraints:
- Do NOT add automatic agent retry in AuthorityRunOrchestrator or AgentOutputEvaluationRecorder.
- Keep label cardinality bounded (exactly the four reject_reason values + two execution_mode values).
- Do not break existing gate_mode / outcome / agent_type labels.

Acceptance Criteria:
- archlucid_agent_output_quality_gate_total emits reject_reason and execution_mode on every increment.
- Unit tests cover classification for representative EvaluationReason strings.
- Docs state V1 fail-fast posture and that V1.1 auto-retry is a separate future decision.
```

### 3. Complete RAG-V1 Batch 1 Follow-Ons Before GA (actionable now — **SHIPPED 2026-05-25**)
- **Why it matters:** Batch 1 shipped platform policy-pack indexing and per-run prior-manifest corpora, but three TB-021 remainders blocked trustworthy grounded retrieval: tenants still saw **all platform packs** (not just assigned packs), prior-manifest chunks were **per-run only** (no cross-run `GoldenManifest` history), and there was **no uniform citation formatter** or `RetrievalGroundingTrace` for support bundles and eval. Owner 2026-05-25: **all three ship before V1 GA** (option A).
- **Expected impact:** Directly improves Cutting-Edge AI Technology (+2 pts when shipped) and AI/Agent Readiness (+1 pt). Weighted readiness impact: **+0.19%** when all three land. **Rescored 2026-05-25.**
- **Affected qualities:** Cutting-Edge AI Technology, AI/Agent Readiness, Proof-of-ROI Readiness, Reliability.
- **Actionable now:** **Shipped 2026-05-25.**
- **Owner decision (2026-05-25):** Ship **all three** before GA — not citation-only, not post-GA deferral.
- **Backlog refs:** [`RAG_QUALITY_TECHNICAL_BACKLOG.md`](../library/RAG_QUALITY_TECHNICAL_BACKLOG.md) **RAG-V1-000** (remainder), **RAG-V1-002**; Improvements **archived #1** / **archived #23** deferred slices.
```cursor
Complete the three RAG-V1 Batch 1 follow-ons as a single cohesive PR (or sequenced PRs merged before GA).

Owner posture (2026-05-25): ALL THREE are V1 GA gates — do not ship GA without them.

Context:
- docs/library/RAG_CORPUS_KIND_POLICY_PACK_DESIGN.md (Batch 1 partial shipped)
- docs/library/RAG_QUALITY_TECHNICAL_BACKLOG.md (RAG-V1-000 remainder, RAG-V1-002)
- Batch 1 already ships PolicyPackCorpusIndexer, PriorManifestChunker, CorpusKind seam

Deliverable 1 — Tenant-assigned pack query filter (Improvement archived #1 remainder):
- At query time, filter PolicyPack corpus hits to packs assigned to the tenant/workspace/project
  via dbo.PolicyPackAssignments (respect ScopeLevel).
- PlatformDefault packs remain visible when assigned; unassigned platform packs must NOT appear
  in tenant-bound retrieval even when IncludePlatformCorpora=true.
- Add integration test: tenant A assigned pack A only; tenant B assigned pack B only — no cross-leak.

Deliverable 2 — Cross-run prior-GoldenManifest history (RAG-V1-002 / archived #23 remainder):
- Extend RetrievalRunCompletionIndexer / PriorManifestRetrievalDocumentBuilder to index prior
  committed GoldenManifests for the same system (tenant/workspace/project), not only the current run.
- Tag chunks with decisionId / findingId / manifestId for citation back-links.
- Acceptance: second run on similar brief retrieves prior decision chunk in Ask top-K;
  two-tenant integration test proves no cross-tenant leakage.

Deliverable 3 — RAG-V1-000 citation formatter + grounding trace remainder:
- Implement IRetrievalCitationFormatter — uniform shape [corpus]/[id]@[version] for Ask metadata,
  finding narratives, and export hooks.
- Add dbo.RetrievalGroundingTrace (+ DbUp migration in consolidated Scripts/ArchLucid.sql):
  runId, agentName, retrievedChunkIds, tokensIn, tokensOut, citationCoverage.
- Wire grounding trace population on agent handlers that call retrieval (at minimum ComplianceAgentHandler).
- Architecture test: tenant-bound RetrievalQuery must include tenant scope (fail build on regression).

Constraints:
- Do NOT implement Graph-RAG, HyDE, rerank, or query rewrite (V2 per V1_DEFERRED §6q).
- Retrieval hits remain prompt context only — do not alter manifest canonical fingerprint without ADR.
- Reuse existing outbox indexing path (ADR 0004); no second vector pipeline.

Acceptance Criteria:
- All three deliverables ship with unit + integration tests.
- docs/library/RAG_QUALITY_TECHNICAL_BACKLOG.md statuses updated for RAG-V1-000 / RAG-V1-002 remainders.
- No cross-tenant policy-pack or prior-manifest leakage in new tests.
```

### 4. Emit Tenant Estimated USD Savings Prometheus Gauge (actionable now — **SHIPPED 2026-05-25**)
- **Why it matters:** Batch 2 (archived #12) shipped a severity-weighted **findings proxy** on Grafana, but economic buyers and operators need the **same USD rollup** the Executive ROI API computes — not a directional proxy. `ITenantEstimatedUsdSavingsResolver` and `ExecutiveRoiSummaryService` already compute `EstimatedUsdSavings` at request time; without a background gauge, Grafana cannot show true cumulative savings between API calls. Owner 2026-05-25: ship before V1 GA (option A).
- **Expected impact:** Directly improves Executive Value Visibility (+2 pts when shipped) and Supportability (+1 pt). Weighted readiness impact: **+0.09%** when shipped. **Rescored 2026-05-25.**
- **Affected qualities:** Executive Value Visibility, Supportability, Proof-of-ROI Readiness.
- **Actionable now:** **Shipped 2026-05-25.**
- **Owner decision (2026-05-25):** Ship **`archlucid_tenant_estimated_savings_usd`** background gauge before GA — not proxy-only, not post-GA deferral.
- **Backlog refs:** Improvement **archived #12** deferred slice; `ExecutiveRoiCacheWarmupHostedService` leader-election pattern.
```cursor
Emit archlucid_tenant_estimated_savings_usd as a background Prometheus gauge before V1 GA.

Owner posture (2026-05-25): V1 GA gate — true USD rollup, not findings-only proxy.

Context:
- archived #12 shipped Grafana Business Value row with severity-weighted findings proxy
- ITenantEstimatedUsdSavingsResolver + ExecutiveRoiSummaryService already compute EstimatedUsdSavings
- ExecutiveRoiCacheWarmupHostedService demonstrates leader-elected background ROI work

1. Register a new ObservableGauge (or UpDownCounter if deltas are clearer) on ArchLucid meter:
   archlucid_tenant_estimated_savings_usd
   Labels: scope (platform | tenant), tenant_id (omit or empty for platform aggregate).
   Default V1 posture: emit platform aggregate only to control cardinality; optional per-tenant
   emission behind a config flag mirroring LlmTelemetry:RecordPerTenantTokens gating.

2. Add a leader-elected hosted service (or extend ExecutiveRoiCacheWarmupHostedService if cohesive)
   that periodically calls the same rollup path as ExecutiveRoiSummaryService /
   ITenantEstimatedUsdSavingsResolver (cross-run dedup rules per §2.8 — do not double-count).
   Refresh interval configurable (e.g. ExecutiveRoi:SavingsGauge:RefreshIntervalMinutes, default 15).

3. Update infra/grafana/dashboard-archlucid-authority.json Business Value row:
   - Primary panel: archlucid_tenant_estimated_savings_usd (platform scope)
   - Keep existing findings-rate / severity-weighted proxy as secondary directional panel

4. Document metric in docs/library/OBSERVABILITY.md with label cardinality guidance.

5. Add unit tests for gauge recording logic (mock resolver / summary service); no live SQL in unit tests.

Constraints:
- Reuse existing ROI dedup logic — do NOT fork savings math in the hosted service.
- Do NOT expose customer-identifying data in metric labels beyond tenant_id UUID when gated on.
- Fail-open: gauge refresh errors log Warning; do not fail host startup.

Acceptance Criteria:
- archlucid_tenant_estimated_savings_usd visible in /metrics and Grafana Business Value row.
- Platform aggregate matches Executive ROI summary total within one refresh interval.
- docs/library/OBSERVABILITY.md updated; cardinality gating documented.
```

### 5. Implement Team→Professional In-Product Expansion CTA — **SHIPPED 2026-05-25**
- **Why it matters:** Improvement **archived #14** covers **trial** tenants only. Paid **Team** tenants approaching seat or workspace caps still depend entirely on CSM outreach — a measurable expansion-revenue leak. Owner 2026-05-25: ship an in-product expansion CTA before V1 GA (option A). Sales-led quote motion remains the V1 contract (no Stripe live-key flip per §6b).
- **Expected impact:** Directly improves Adoption Friction (+2 pts when shipped) and Time-to-Value (+1 pt). Weighted readiness impact: **+0.10%** when shipped.
- **Affected qualities:** Adoption Friction, Time-to-Value, Proof-of-ROI Readiness (expansion funnel).
- **Actionable now:** ~~Yes — **V1 GA gate**.~~ **Shipped 2026-05-25.**
- **Owner decision (2026-05-25):** Ship usage-threshold banner/modal in operator shell for **paid Team** tenants → quote or upgrade flow; not CSM-only, not V1.1 deferral.
- **Backlog refs:** Improvement **archived #14** (`TrialUsageUpgradeNudge`, telemetry endpoints, dismissal cadence).
```cursor
Implement an in-product expansion CTA for paid Team tenants approaching tier limits (Improvement #5).

Owner posture (2026-05-25): V1 GA gate — mirror archived #14 patterns; sales-led quote flow, not Stripe checkout.

Context:
- archlucid-ui/src/components/TrialUsageUpgradeNudge.tsx (trial-only, #14)
- POST /v1/diagnostics/trial-upgrade-nudge/{shown|clicked} + ArchLucidInstrumentation counters
- docs/library/AUDIT_COVERAGE_MATRIX.md trial nudge audit events
- PRICING_PHILOSOPHY.md §5 Team tier seat/workspace caps

1. API: expose paid-tenant usage headroom (extend an existing tenant status endpoint or add
   GET /v1/tenant/usage-status) returning:
   - commercialTier (Team | Professional | Enterprise)
   - seatsUsed / seatsLimit, workspacesUsed / workspacesLimit (nullable when unlimited)
   - isTrial=false discriminator so UI does not double-render with TrialUsageUpgradeNudge

2. UI: add TeamExpansionNudge (or extend nudge module with tier guard) in operator shell when:
   - commercialTier === Team AND
   - (seatsUsed / seatsLimit >= 0.80 OR workspacesUsed / workspacesLimit >= 0.80)
   Do NOT show for trial tenants (TrialUsageUpgradeNudge owns trials).

3. CTA links to /pricing?source=team-expansion&trigger={seats|workspaces} with quote-first
   preselection (same sales-led posture as #14).

4. Telemetry (parallel to #14, separate metric names to avoid conflating trial vs expansion funnel):
   - archlucid_team_expansion_nudge_shown_total{trigger}
   - archlucid_team_expansion_nudge_clicked_total{trigger}
   - Audit events TeamExpansionNudgeShown / TeamExpansionNudgeClicked
   - POST /v1/diagnostics/team-expansion-nudge/{shown|clicked} (or reuse pattern from trial endpoints)

5. UX constraints (match #14):
   - Max once per session per trigger; 24h dismiss; do not block core workflows
   - Hide in demo/polished showcase envs per isBuyerPolishedOperatorShellEnv

6. Tests:
   - archlucid-ui component tests for threshold rendering and CTA href
   - API contract tests if new endpoint added; OpenAPI snapshot regen if applicable

Constraints:
- Do NOT enable live Stripe checkout (V1.1 per V1_DEFERRED §6b).
- Do NOT show Professional/Enterprise tenants expansion nudges for Team SKU (tier guard required).
- Reuse existing registration-scope proxy patterns from TrialUsageUpgradeNudge.

Acceptance Criteria:
- Paid Team tenant at ≥80% seat or workspace usage sees nudge; trial tenant does not.
- CTA lands on /pricing with source=team-expansion and quote preselected.
- Prometheus counters and audit events emit on show/click.
- docs/library/AUDIT_COVERAGE_MATRIX.md updated.
```

### 6. Complete Pricing Quote-Request SLA Visibility — **SHIPPED 2026-05-25**
- **Why it matters:** Improvement **archived #11** shipped backend hygiene — aging SQL view, admin API, Prometheus histogram, alert rule, and runbook SLA targets (24h acknowledgement / 3-day full quote). Sales ops still lacked a **committed operator aging dashboard** and **Grafana visibility** to act on `warn at 18h` / `breach at 24h` without SQL or raw API calls. Owner 2026-05-25: formalize as V1 GA gate (option A) — measured SLA must be **operational**, not documentation-only.
- **Expected impact:** Directly improves Adoption Friction (+1 pt when shipped) and Time-to-Value (+1 pt). Weighted readiness impact: **+0.05%** when shipped. **Shipped 2026-05-25.**
- **Affected qualities:** Adoption Friction, Time-to-Value, Supportability.
- **Actionable now:** ~~Yes — **V1 GA gate** (visibility layer on shipped #11 backend).~~ **Shipped 2026-05-25.**
- **Owner decision (2026-05-25):** Ship **operator aging dashboard + Grafana panel + verified prod alert routing** before GA — not email-only, not post-GA ops sprint.
- **Backlog refs:** Improvement **archived #11**; [`docs/runbooks/MARKETING_PRICING_QUOTE_NOTIFICATIONS.md`](../runbooks/MARKETING_PRICING_QUOTE_NOTIFICATIONS.md) § Sales acknowledgement SLA.
```cursor
Complete pricing quote-request SLA visibility for V1 GA (Improvement #6).

Owner posture (2026-05-25): V1 GA gate — backend #11 ships; this task closes the operator/Grafana gap.

Context (already shipped — do NOT rebuild):
- dbo.MarketingPricingQuoteRequestsAging view + BreachStatus (ok / warn at 18h / breach at 24h)
- GET /v1/admin/marketing/pricing-quote-aging (AdminAuthority)
- MarketingPricingQuoteAgingMetricsHostedService → archlucid_pricing_quote_request_age_hours
- ArchLucidPricingQuoteAcknowledgementBreach in infra/prometheus/archlucid-alerts.yml
- Runbook SLA: docs/runbooks/MARKETING_PRICING_QUOTE_NOTIFICATIONS.md

Deliverable 1 — Operator aging dashboard (archlucid-ui):
- Admin-only panel (operator shell or admin route) calling GET /v1/admin/marketing/pricing-quote-aging
- Table: request id, CreatedUtc, AgeHours, BreachStatus, company/email (non-secret fields only)
- Sort by breach severity (breach → warn → ok); highlight rows in warn/breach states
- Link to runbook escalation steps; no auto-response to buyer

Deliverable 2 — Grafana panel:
- Add row/panels to a committed dashboard (authority or new sales-ops row) showing:
  - Histogram or stat from archlucid_pricing_quote_request_age_hours by breach_status
  - Count of open rows in warn/breach (query admin API snapshot or Prometheus labels)
- Document panel IDs in runbook § Verification

Deliverable 3 — Prod alert verification:
- Confirm ArchLucidPricingQuoteAcknowledgementBreach routes to the same P0/P1 action group
  as other sales-critical alerts (see archived #46 patterns)
- Add runbook step: synthetic stale row test in staging proves alert fires

Deliverable 4 — GTM alignment (docs only unless copy missing):
- Ensure /pricing or quote confirmation copy references human follow-up within 1 business day
  (align with runbook SLA — no buyer-facing auto-reply)

Constraints:
- Do NOT modify dbo.MarketingPricingQuoteRequests columns.
- Do NOT auto-respond to buyers on breach — human sales follow-up only.
- Reuse existing API contract — extend OpenAPI only if response shape needs operator fields.

Acceptance Criteria:
- Operator can see aging quote requests without SQL/API curl.
- Grafana shows quote-request age / breach posture.
- Staging synthetic breach triggers ArchLucidPricingQuoteAcknowledgementBreach.
- Runbook updated with dashboard links and verification steps.
```

### 7. Publish Custom Policy Pack Authoring GTM Before GA (actionable now — **V1 GA gate**)
- **Why it matters:** Improvement **archived #6** committed the SKU matrix, SoW template, and order-form addendum in repo docs — but sales and buyers still cannot discover the offer from the **public pricing surface**. Enterprise PS is the highest-margin V1 lever; leaving it docs-only forces internal escalations and weakens the sales-led motion. Owner 2026-05-25: publish all GTM assets before GA (option A).
- **Expected impact:** Directly improves Adoption Friction (+2 pts when shipped) and Proof-of-ROI Readiness (+1 pt). Weighted readiness impact: **+0.08%** when shipped. **Do not rescored until shipped.**
- **Affected qualities:** Adoption Friction, Proof-of-ROI Readiness, Time-to-Value.
- **Actionable now:** Yes — **V1 GA gate** (publication layer on shipped #6 docs).
- **Owner decision (2026-05-25):** Publish **pricing page + SoW + order-form cross-links** before GA — not internal/sales-ready only, not bespoke-quote-only.
- **Backlog refs:** Improvement **archived #6**; [`PRICING_PHILOSOPHY.md`](../go-to-market/PRICING_PHILOSOPHY.md) §4.2; [`CUSTOM_POLICY_PACK_AUTHORING_SOW_TEMPLATE.md`](../go-to-market/CUSTOM_POLICY_PACK_AUTHORING_SOW_TEMPLATE.md); [`ORDER_FORM_TEMPLATE.md`](../go-to-market/ORDER_FORM_TEMPLATE.md).
```cursor
Publish Custom Policy Pack Authoring GTM on the public pricing surface before V1 GA (Improvement #7).

Owner posture (2026-05-25): V1 GA gate — repo docs from #6 ship; this task is buyer/sales-visible publication.

Context (already in repo — verify, do NOT duplicate):
- docs/go-to-market/PRICING_PHILOSOPHY.md §4.2 SKU matrix (Starter / Standard / Program)
- docs/go-to-market/CUSTOM_POLICY_PACK_AUTHORING_SOW_TEMPLATE.md
- docs/go-to-market/ORDER_FORM_TEMPLATE.md Addendum C line items
- docs/go-to-market/CUSTOMER_ONBOARDING_PLAYBOOK.md positioning paragraph
- scripts/ci/check_pricing_single_source.py canonical price patterns

Deliverable 1 — Public pricing page (archlucid-ui):
- Add a "Custom Policy Pack Authoring (Professional Services)" section on /pricing
  (archlucid-ui/src/app/(marketing)/pricing/page.tsx or extracted component)
- Surface the three SKUs with scope/delivery window summaries — dollar figures MUST link to
  PRICING_PHILOSOPHY §4.2 / §5.2 (single source of truth) rather than hardcoding divergent prices
- Explain customer-exclusive vs ArchLucid-owned (shared-IP) tiers in buyer-friendly language
- CTA: anchor to #pricing-quote-request with suggested interest=custom-policy-pack (optional form field)

Deliverable 2 — Sales kit cross-links (docs):
- Ensure ORDER_FORM_TEMPLATE.md Addendum C is linked from pricing page footnote or procurement FAQ
- Ensure SoW template is linked from pricing section and CUSTOMER_ONBOARDING_PLAYBOOK.md
- Update docs/go-to-market/PROCUREMENT_FAQ.md if buyers ask "can we commission custom packs?"

Deliverable 3 — CI / tests:
- Extend or verify scripts/ci/check_pricing_single_source.py covers any new on-page price references
- Add archlucid-ui test asserting custom-pack section renders and links to quote form
- Run existing pricing page tests (pricing-brand-category.test.tsx) after layout change

Constraints:
- Do NOT add custom-pack authoring as a product feature flag — PS motion only (#6 constraint).
- Do NOT introduce SI/partner channel language (owner-delivered only for V1).
- Keep all canonical dollar amounts in PRICING_PHILOSOPHY.md only.

Acceptance Criteria:
- /pricing publicly surfaces Custom Pack Starter / Standard / Program with IP-tier explanation.
- SoW template and order-form addendum are one click away for sales/procurement readers.
- Pricing single-source CI passes; UI tests green.
```

### 8. Implement Azure Retail Prices Structured Lookup for Cost Agent (actionable now — post-GA)
- **Why it matters:** Cost findings and agent narratives can quote USD without a deterministic Retail row citation. **RAG-V1-003** closes the faithfulness gap using `AzureRetailPricesCatalogClient` — no embeddings, aligned with [`V1_SCOPE.md`](../library/V1_SCOPE.md) §2.16.
- **Expected impact:** Cutting-Edge AI Technology (+1 pt), Proof-of-ROI Readiness (+1 pt). Weighted readiness impact: **+0.04%** when shipped. **Do not rescored until shipped.**
- **Affected qualities:** Cutting-Edge AI Technology, Proof-of-ROI Readiness, AI/Agent Readiness.
- **Actionable now:** Yes — post-GA; schedule after **#3**.
- **Backlog refs:** [`RAG_QUALITY_TECHNICAL_BACKLOG.md`](../library/RAG_QUALITY_TECHNICAL_BACKLOG.md) **RAG-V1-003**; **TB-021**.
```cursor
Implement RAG-V1-003 Azure Retail Prices structured lookup (Improvement #8).

Context: ArchLucid.Retrieval, CostAgentHandler, AzureRetailPricesCatalogClient, V1_SCOPE §2.16 citation contract.

1. Add IRetailPriceLookupService (or extend existing catalog client seam) keyed by ServiceName, MeterName, Region, Sku — no embeddings.
2. Wire CostAgentHandler (and cost-related finding narrative paths) to require ≥1 retrieved Retail row before quoting USD, or mark estimate as non-cited / groundingMissing.
3. Guard: no false "Azure Retail" attribution when CloudProvider is not Azure.
4. Unit tests: catalog hit injects SKU row into agent prompt; miss path sets groundingMissing without failing the run.

Constraints: Do not add new vector store; reuse ADR 0005 quota/circuit-breaker pipeline for any LLM calls.

Acceptance Criteria: Golden/unit test for known SKU; no cross-provider mis-attribution; docs pointer in RAG_QUALITY_TECHNICAL_BACKLOG.md marked shipped for RAG-V1-003.
```

### 9. Index Platform Docs Corpus for Ask and Explanation (actionable now — post-GA)
- **Why it matters:** Ask and Explanation cannot cite ADRs or library reference docs today. **RAG-V1-004** raises supportability and reduces hallucinated platform-behavior answers.
- **Expected impact:** Adoption Friction (+1 pt), Supportability (+1 pt). Weighted readiness impact: **+0.03%** when shipped. **Do not rescored until shipped.**
- **Affected qualities:** Adoption Friction, Supportability, Cutting-Edge AI Technology.
- **Actionable now:** Yes — post-GA.
- **Backlog refs:** **RAG-V1-004**; deny-list `docs/go-to-market/**`, pen-test summaries, customer paths.
```cursor
Implement RAG-V1-004 platform docs corpus (Improvement #9).

1. Add PlatformDoc corpus source indexing allow-listed paths: docs/architecture/adrs/**, selected docs/library/** (contributor reference only).
2. Deny-list: docs/go-to-market/**, docs/security/pen-test-summaries/**, any tenant/customer data paths.
3. Partition as platform tenant (or dedicated index partition) so tenant RLS filters do not hide platform chunks incorrectly.
4. CI refresh hook on doc merge to main (or nightly indexer job).
5. Ask integration test: question about a documented ADR returns chunk citing ADR id in evidence block.

Constraints: No customer or GTM content in index; CorpusKind=PlatformDoc on RetrievalDocument.

Acceptance Criteria: Integration test green; architecture doc updated in RAG_CORPUS_KIND_POLICY_PACK_DESIGN or sibling design note.
```

### 10. Populate AlternativePathsConsidered on Finding Engines (actionable now — post-GA)
- **Why it matters:** Semantic eval depth scoring cannot detect regressions in explainability when `AlternativePathsConsidered` is empty on finding engines. Small change, high eval signal.
- **Expected impact:** AI/Agent Readiness (+1 pt). Weighted readiness impact: **+0.02%** when shipped. **Do not rescored until shipped.**
- **Affected qualities:** AI/Agent Readiness, Cutting-Edge AI Technology.
- **Actionable now:** Yes — can batch with **#1** eval baseline work.
```cursor
Populate AlternativePathsConsidered on finding engines where currently empty (Improvement #10).

Context: FindingFactory / explainability builders across the ~10 finding engines; AgentOutputEvaluator semantic scorer.

1. For each finding engine that emits empty AlternativePathsConsidered, add 1–3 concise alternative paths considered (not chosen) without changing severity logic or rule outcomes.
2. Keep text deterministic where possible (template + rule id references) for eval stability.
3. Extend AgentOutputQualityGateTests or semantic eval fixtures if needed to assert non-empty field on representative scenarios.

Constraints: Do NOT change finding severity, rule fire conditions, or governance outcomes — narrative enrichment only.

Acceptance Criteria: Semantic eval scenarios show improved depth scores; no behavior change in Decisioning rule engine tests.
```

### 11. Harden Cross-Tenant Executive ROI Background Aggregation for RLS (actionable now — post-GA)
- **Why it matters:** `ExecutiveRoiCacheWarmupHostedService` and background rollups aggregate across tenants. A scoping or `SESSION_CONTEXT` failure could leak cross-tenant savings totals — a high-severity correctness risk.
- **Expected impact:** Reliability (+1 pt), Proof-of-ROI Readiness (+1 pt). Weighted readiness impact: **+0.03%** when shipped. **Do not rescored until shipped.**
- **Affected qualities:** Reliability, Proof-of-ROI Readiness.
- **Actionable now:** Yes — post-GA; before scaling tenant count.
```cursor
Audit and harden cross-tenant Executive ROI background jobs for RLS isolation (Improvement #11).

1. Review ExecutiveRoiCacheWarmupHostedService, ITenantEstimatedUsdSavingsResolver, and ExecutiveRoiSummaryService background paths for explicit tenant scope on every SQL call.
2. Add integration tests with two tenants: tenant A data must never appear in tenant B rollup or cache warmup artifacts.
3. Document fail-closed behavior if SESSION_CONTEXT / RLS bypass is mis-set during background work.
4. Optional: emit archlucid_executive_roi_background_scope_violations_total counter on detected anomalies (should stay zero).

Acceptance Criteria: New integration tests pass; runbook note in OBSERVABILITY.md or ROI doc; code review checklist item for future background aggregators.
```

### 12. Extend DataConsistencyOrphanProbe Registration with CI Guard (actionable now — post-GA)
- **Why it matters:** New SQL tables can ship without registering orphan-probe coverage. `DataConsistencyOrphanProbeHostedService` misses edge cases as the schema grows.
- **Expected impact:** Reliability (+1 pt), Maintainability (+1 pt). Weighted readiness impact: **+0.02%** when shipped. **Do not rescored until shipped.**
- **Affected qualities:** Reliability, Maintainability.
- **Actionable now:** Yes — post-GA.
```cursor
Extend DataConsistencyOrphanProbe coverage with a CI guard (Improvement #12).

Context: DataConsistencyOrphanProbeHostedService, DATA_CONSISTENCY_MATRIX.md, DbUp migrations.

1. Audit DATA_CONSISTENCY_MATRIX.md vs probe registrations; register any missing child→parent orphan checks.
2. Add CI script or architecture test: new dbo.* tables with RunId/TenantId FK semantics must appear in matrix + probe registry (allow explicit opt-out list with rationale).
3. Unit test: probe detects injected orphan row in at least one newly registered path.

Acceptance Criteria: Matrix and probe in sync; CI fails on unregistered new tables; docs updated.
```

### 13. Codify AgentResult Blob Retention Lifecycle in Terraform (actionable now — post-GA)
- **Why it matters:** Leader-elected orphan cleanup (archived #8) runs in-app, but storage accounts lack explicit lifecycle tiering — AgentResult blobs can grow unbounded on cost and compliance dimensions.
- **Expected impact:** Reliability (+1 pt). Weighted readiness impact: **+0.02%** when shipped. **Do not rescored until shipped.**
- **Affected qualities:** Reliability, Cost considerations.
- **Actionable now:** Yes — post-GA; complements shipped **archived #8**.
```cursor
Codify AgentResult blob retention lifecycle in Terraform (Improvement #13).

1. Addazurerm_storage_management_policy (or equivalent) on production artifact storage for agent-result / trace blob prefixes: cool tier after N days, delete after M days aligned with DATA_ARCHIVAL runbook.
2. Wire variables in infra/terraform with Staging shorter retention than Production.
3. Document interaction with AgentResultBlobCleanupHostedService — app cleanup vs storage lifecycle (both may apply; no double-delete race).
4. Add terraform validate + docs in backup/restore runbook (archived #45).

Acceptance Criteria: Terraform plans cleanly; lifecycle rules visible in Azure portal; runbook updated.
```

### 14. Operator UI for Integration Outbox Dead-Letter Management (actionable now — post-GA)
- **Why it matters:** Dead-letter retry CLI (archived #5) and Grafana dashboard (archived #19) exist, but operators still need direct DB access for bulk DLQ triage under sustained webhook failure.
- **Expected impact:** Supportability (+1 pt), Reliability (+1 pt). Weighted readiness impact: **+0.02%** when shipped. **Do not rescored until shipped.**
- **Affected qualities:** Supportability, Reliability.
- **Actionable now:** Yes — post-GA; builds on **archived #5** / **archived #19**.
```cursor
Add operator UI for integration event outbox dead-letter management (Improvement #14).

1. Extend operator shell (or admin API + thin UI) to list dead-lettered integration events with tenant, event type, last error, age.
2. Actions: retry single, retry batch (respect idempotency), acknowledge/suppress with audit trail.
3. Reuse existing CLI retry logic — do not duplicate business rules.
4. Prometheus: ensure archlucid_integration_outbox_dead_letter_total visible on existing dashboard (archived #19).

Constraints: Admin-only; RLS-aware; audit every retry action.

Acceptance Criteria: Operator can clear DLQ without SQL; tests for retry path; runbook updated.
```

### 15. Tune Azure OpenAI Circuit Breaker for Latency Brownouts (actionable now — post-GA)
- **Why it matters:** During Azure OpenAI latency spikes, circuit breakers may trip too aggressively and fail entire authority runs instead of degrading gracefully.
- **Expected impact:** Reliability (+1 pt), AI/Agent Readiness (+1 pt). Weighted readiness impact: **+0.02%** when shipped. **Do not rescored until shipped.**
- **Affected qualities:** Reliability, AI/Agent Readiness.
- **Actionable now:** Yes — post-GA; coordinate with **archived #41** SqlConnection latency patterns.
```cursor
Tune Azure OpenAI circuit breaker half-open policy for latency brownouts (Improvement #15).

1. Review Polly/circuit-breaker settings on Azure OpenAI HTTP clients — failure ratio, sampling window, break duration, half-open probe count.
2. Add configurable thresholds in appsettings (Staging vs Production) with documented defaults from production p95 latency data.
3. Expose breaker state on /health (existing circuit-breaker introspection) with open/reason labels for OpenAI specifically.
4. Integration or load test: simulated latency spike should recover without manual pod restart.

Acceptance Criteria: Config documented; health endpoint shows OpenAI breaker state; no regression in simulator CI paths.
```

### 16. Close Hexagonal Architecture Guards for Provenance and Capabilities.Cost (actionable now — post-GA)
- **Why it matters:** `ArchLucid.Persistence` can still reference `Provenance` and `Capabilities.Cost` without architecture-test guards — backend swap and isolated domain testing get harder silently.
- **Expected impact:** Maintainability (+1 pt). Weighted readiness impact: **+0.01%** when shipped. **Do not rescored until shipped.**
- **Affected qualities:** Maintainability.
- **Actionable now:** Yes — post-GA; extends **archived #53** / **archived #55** closure.
```cursor
Close hexagonal architecture guard gaps for Provenance and Capabilities.Cost (Improvement #16).

1. In ArchLucid.Architecture.Tests.DependencyConstraintTests, add prohibiting or pinning facts for Persistence→Provenance and Persistence→Capabilities.Cost (match #55 _by_design policy where intentional).
2. If prohibiting: refactor to ports in ArchLucid.Contracts and inject via Application layer.
3. Document decision in ADR or architecture test comment block.

Acceptance Criteria: Architecture tests pass; no new Persistence→domain references without explicit fact.
```

### 17. Guided Tier-2 Azure Extractor Service-Principal Setup (actionable now — post-GA)
- **Why it matters:** Tier 2 continuous polling requires customers to author/review a service-principal script line-by-line — a top enterprise adoption friction point per assessment.
- **Expected impact:** Adoption Friction (+2 pts), Time-to-Value (+1 pt). Weighted readiness impact: **+0.05%** when shipped. **Do not rescored until shipped.**
- **Affected qualities:** Adoption Friction, Time-to-Value.
- **Actionable now:** Yes — post-GA; hosted Tier 2 remains **V1.x per §6p** (not `(A)` penalty) but this reduces friction for opt-in customers.
```cursor
Add guided Tier-2 Azure Extractor service-principal setup flow (Improvement #17).

1. In archlucid-ui workspace settings (or dedicated Tier-2 connection wizard), walk through SP creation steps with copy-paste commands, required RBAC roles, and validation checklist.
2. Wire to existing Tier2Connection API (ConnectionsPOSTAsync) with post-config validation call.
3. Link to hosted Enterprise onboarding checklist (archived #17) and PROCUREMENT_FAQ security review section.
4. UI tests: wizard renders steps; validation surfaces misconfigured client id/secret.

Constraints: Do not store customer secrets in ArchLucid logs; follow existing secret handling patterns.

Acceptance Criteria: Customer can complete Tier-2 setup without external runbook-only docs; security review checklist linked.
```

### 18. Parse Tier-1 Extractor ZIP Upload Errors in UI (actionable now — post-GA)
- **Why it matters:** Tier-1 upload failures return opaque errors — prospects cannot self-serve troubleshoot extractor ZIP issues without support intervention.
- **Expected impact:** Adoption Friction (+1 pt), Supportability (+1 pt). Weighted readiness impact: **+0.02%** when shipped. **Do not rescored until shipped.**
- **Affected qualities:** Adoption Friction, Supportability, Time-to-Value.
- **Actionable now:** Yes — post-GA.
```cursor
Add structured Tier-1 extractor ZIP upload error parsing in UI (Improvement #18).

1. Map API validation error codes from ingestion/upload endpoints to user-facing messages with remediation steps (wrong manifest version, missing required files, corrupt ZIP, tenant scope mismatch).
2. Surface error code + doc link in archlucid-ui upload component.
3. Add archlucid-ui tests for at least 3 error code → message mappings.

Acceptance Criteria: Upload failure shows actionable message, not generic 400; tests green.
```

### 19. Fix LlmCostEstimator Overflow and Negative-Rate Guards (actionable now — post-GA)
- **Why it matters:** **TB-022** / **TB-026** — token sums can wrap at ~2.1B and misconfigured negative USD rates bypass guards, producing negative cost slices in FinOps telemetry.
- **Expected impact:** Reliability (+1 pt), Proof-of-ROI Readiness (+1 pt). Weighted readiness impact: **+0.02%** when shipped. **Do not rescored until shipped.**
- **Affected qualities:** Reliability, Proof-of-ROI Readiness, Maintainability.
- **Actionable now:** Yes — post-GA; XS size per TECH_BACKLOG.
- **Backlog refs:** **TB-022**, **TB-026**.
```cursor
Fix LlmCostEstimator overflow and negative-rate guards (Improvement #19 — TB-022 + TB-026).

1. Use long or decimal-safe accumulation for promptSum/completionSum in AgentExecutionTraceRunLlmCostAggregator — no silent int wrap at ~2.1B tokens.
2. Reject negative rates in LlmDeploymentUsdRates at startup validation and in LlmCostEstimator (> 0m guard hardened).
3. Unit tests: overflow boundary, negative rate throws or clamps with config warning.

Acceptance Criteria: TB-022 and TB-026 marked done in TECH_BACKLOG.md; tests cover both paths.
```

### 20. Add Reasoning-Token Test Coverage for LlmCostEstimator (actionable now — post-GA)
- **Why it matters:** **TB-024** — `reasoningTokens > 0` path and per-deployment reasoning overrides are untested; FinOps envelopes for reasoning models are unverified.
- **Expected impact:** Maintainability (+1 pt). Weighted readiness impact: **+0.01%** when shipped. **Do not rescored until shipped.**
- **Affected qualities:** Maintainability, Proof-of-ROI Readiness.
- **Actionable now:** Yes — post-GA; XS size.
- **Backlog refs:** **TB-024**.
```cursor
Add reasoning-token test coverage for LlmCostEstimator (Improvement #20 — TB-024).

1. Extend LlmCostEstimatorTests with reasoningTokens > 0 cases, rate fallback, and per-deployment reasoning override.
2. Assert EstimatedCostUsd and OTel archlucid_llm_cost_usd_total increments match expected math.

Acceptance Criteria: TB-024 marked done; coverage on reasoning path ≥ existing prompt/completion cases.
```

### 21. Complete Architecture Invariant Wave A — INV-005 and INV-006 (actionable now — post-GA)
- **Why it matters:** **TB-010** remainder — startup validator parity and composition-root scan (INV-005, INV-006) close fail-closed boot safety gaps documented in ADR 0035.
- **Expected impact:** Reliability (+1 pt), Maintainability (+1 pt). Weighted readiness impact: **+0.03%** when shipped. **Do not rescored until shipped.**
- **Affected qualities:** Reliability, Maintainability.
- **Actionable now:** Yes — post-GA; S size per TECH_BACKLOG.
- **Backlog refs:** **TB-010**, ADR 0035, INV-005, INV-006.
```cursor
Complete architecture invariant Wave A remainder — INV-005 and INV-006 (Improvement #21 — TB-010).

1. Implement INV-005 startup validator parity (documented invariants enforced at boot — align with TB-002 warnings counter patterns).
2. Implement INV-006 composition-root scan — detect forbidden service registrations crossing bounded contexts.
3. Add ArchLucid.Architecture.Tests or analyzer coverage; link from docs/library/ARCHITECTURE_INVARIANTS.md.

Acceptance Criteria: INV-005 and INV-006 enforced in CI; TB-010 remainder closed or split with explicit follow-on.
```

### 22. Wire Azure Monitor Alerts for Agent-Output Quality Metrics (actionable now — post-GA)
- **Why it matters:** **TB-004** — agent-output metrics (`archlucid_agent_output_*`, faithfulness, quality gate) need visible production alerts, especially after LLM faithfulness default enablement (2026-05-25).
- **Expected impact:** Supportability (+1 pt), Reliability (+1 pt). Weighted readiness impact: **+0.02%** when shipped. **Do not rescored until shipped.**
- **Affected qualities:** Supportability, Reliability, AI/Agent Readiness.
- **Actionable now:** Yes — post-GA; schedule after **#2** telemetry lands.
- **Backlog refs:** **TB-004**; complements **#2**.
```cursor
Wire Azure Monitor / Prometheus alerts for agent-output quality metrics (Improvement #22 — TB-004).

1. Add alert rules for: quality_gate reject rate spike, llm_faithfulness_score p50 drop, eval baseline CI failure (when merge-blocking).
2. Terraform in infra/terraform alerting module — route P0 to existing action group (archived #46).
3. Document alert thresholds and runbook steps in OBSERVABILITY.md and AGENT_OUTPUT_EVALUATION.md.

Acceptance Criteria: Alerts deploy via Terraform; test notification in Staging; TB-004 marked done.
```

### 23. Add Configurable EA Discount Multiplier for Executive ROI (actionable now — post-GA)
- **Why it matters:** Executive ROI uses Retail pricing; Enterprise Agreement buyers see inflated savings vs their contracted rates — finance reviewers discount ArchLucid ROI claims.
- **Expected impact:** Proof-of-ROI Readiness (+2 pts), Executive Value Visibility (+1 pt). Weighted readiness impact: **+0.04%** when shipped. **Do not rescored until shipped.**
- **Affected qualities:** Proof-of-ROI Readiness, Executive Value Visibility.
- **Actionable now:** Yes — post-GA; tenant/workspace setting, not Stripe SKU.
```cursor
Add configurable EA discount multiplier for Executive ROI transparency (Improvement #23).

1. Add tenant/workspace-level EA discount multiplier (0–100%) in settings API + persistence — default 0 (Retail).
2. Apply multiplier in ExecutiveRoiSummaryService / savings resolver with audit log when non-default.
3. Surface multiplier + "Retail vs EA-adjusted" labels in executive ROI UI and board-pack export (archived #24).
4. Unit tests: multiplier 0 vs 15% changes rollup predictably; export rows document basis.

Constraints: Do not scrape EA billing APIs (V1); manual config only with transparency logging.

Acceptance Criteria: Settings persist; ROI summary reflects multiplier; tests and docs updated.
```

### 24. Gate Per-Tenant RAG Telemetry Behind Bounded Cardinality Flag (actionable now — post-GA)
- **Why it matters:** RAG retrieval telemetry (archived #7) and future per-tenant savings (#4) risk Prometheus cardinality explosions at scale. Supportability section recommends gating per-tenant RAG tags.
- **Expected impact:** Supportability (+1 pt), Reliability (+1 pt). Weighted readiness impact: **+0.01%** when shipped. **Do not rescored until shipped.**
- **Affected qualities:** Supportability, Reliability.
- **Actionable now:** Yes — post-GA; mirror `LlmTelemetry:RecordPerTenantTokens` pattern.
```cursor
Gate per-tenant RAG telemetry behind bounded cardinality flag (Improvement #24).

1. Add RetrievalTelemetry:RecordPerTenantTags (or extend LlmTelemetry pattern) — default false in Production.
2. When false: emit aggregate RAG histograms only; when true: allow tenantId label for bounded tenant counts (document max).
3. Update OBSERVABILITY.md and appsettings examples; add startup warning if enabled with high tenant count estimate.

Acceptance Criteria: Default prod config avoids per-tenant RAG labels; tests for both modes.
```

### 25. Expand Hosted Enterprise SAML Claim-Mapping Onboarding Checklist (actionable now — post-GA)
- **Why it matters:** SAML wizard is out of V1 scope (owner 2026-05-25), but Adoption Friction quality section still recommends documenting claim-mapping in hosted Enterprise onboarding (archived #17). Checklist exists; claim-mapping section needs explicit IdP attribute → ArchLucid role mapping tables.
- **Expected impact:** Adoption Friction (+1 pt). Weighted readiness impact: **+0.02%** when shipped. **Do not rescored until shipped.**
- **Affected qualities:** Adoption Friction.
- **Actionable now:** Yes — post-GA; docs-only + optional UI link from Enterprise settings.
- **Backlog refs:** Improvement **archived #17**; **archived #4** / **archived #18** SAML tooling.
```cursor
Expand hosted Enterprise SAML claim-mapping section in onboarding checklist (Improvement #25).

1. Update docs/go-to-market/CUSTOMER_ONBOARDING_PLAYBOOK.md (or archived #17 checklist) with IdP attribute → ArchLucid role/group mapping tables for Entra, Okta, Ping common patterns.
2. Cross-link validate-saml CLI (archived #4) and PROCUREMENT_FAQ claim-mapping guidance.
3. Optional: archlucid-ui Enterprise identity settings panel links to checklist anchor — no in-product wizard.

Constraints: Do NOT build interactive claim-mapping wizard (out of V1 scope).

Acceptance Criteria: Checklist covers top 3 IdPs; FAQ and playbook consistent; no wizard scope creep.
```

---

## Prompt Batching Guidance

Active batches for **25** actionable improvements (**#1–#25**). Legacy shipped work: **archived #1–#57**.

**Batch 9 — Agent eval baseline + gate telemetry (V1 GA gate — owner 2026-05-25)**
Run **#1** and **#2** together when possible — both touch `ArchLucid.AgentRuntime.Evaluation` and `scripts/ci/eval_agent_corpus.py`. **Do not** implement orchestrator auto-retry. For **#1**, wire CI with **`continue-on-error: true`** (warn-only soak) and scorecard artifact upload before GA; flip merge-blocking only after the **10-run / zero false-positive** exit criterion. Optional same PR: **#10** (`AlternativePathsConsidered`). **Status: #1–#2 shipped 2026-05-25.**

**Batch 1 follow-on — RAG and AI quality (V1 GA gate — owner 2026-05-25)**
Run **#3** before flipping eval baseline CI to merge-blocking: tenant-assigned pack filter, cross-run prior-`GoldenManifest` history, and RAG-V1-000 citation formatter / `RetrievalGroundingTrace`. Then schedule **#8** (Retail lookup) and **#9** (platform docs) as post-GA RAG tranche.

**Batch 2 follow-on — USD savings gauge (V1 GA gate — owner 2026-05-25)**
Run **#4** — reuse `ITenantEstimatedUsdSavingsResolver`, update Grafana Business Value row. Do not mix with **#3**. Follow with **#23** (EA multiplier) and **#24** (RAG telemetry cardinality gate).

**Batch 14 — Commercial expansion CTA (V1 GA gate — owner 2026-05-25)**
Run **#5** in `archlucid-ui` and thin API surface — mirror completed **archived #14** nudge patterns.

**Batch 15 — Quote-request SLA visibility (V1 GA gate — owner 2026-05-25)**
Run **#6** — operator UI + Grafana on shipped **archived #11** backend. Can batch with **#5**.

**Batch 16 — Custom policy pack GTM (V1 GA gate — owner 2026-05-25)**
Run **#7** — public `/pricing` PS section + sales kit links. Can batch with **#5** / **#6** if reviewable.

**Batch 17 — Reliability and ops hardening (post-GA)**
Run **#11** (ROI RLS audit), **#12** (orphan probe CI guard), **#13** (blob lifecycle Terraform), **#14** (outbox DLQ UI), **#15** (OpenAI circuit breaker tuning) — sequence by incident priority; **#22** (agent-output alerts) after **#2**.

**Batch 18 — Adoption and FinOps polish (post-GA)**
Run **#17** (Tier-2 SP wizard), **#18** (Tier-1 ZIP errors), **#25** (SAML claim-mapping checklist). FinOps cluster: **#19**, **#20** (LlmCostEstimator fixes + tests).

**Batch 19 — Architecture hygiene (post-GA)**
Run **#16** (hexagonal guards), **#21** (INV-005/006 Wave A remainder) — keep separate from feature batches.

## Deferred Scope (V2 — not penalized in `(A)`)

Canonical detail: [`V1_DEFERRED.md`](../library/V1_DEFERRED.md) §6r and §6t.

| Item | V1 posture | V2 commitment |
|------|------------|---------------|
| **Non-SCIM bulk-CSV user onboarding** | **Out of V1.** SCIM 2.0 is the committed V1 Enterprise identity path on **hosted SaaS** (`V1_SCOPE.md` §2.12). | **V2** — [`V1_DEFERRED.md` §6r](../library/V1_DEFERRED.md). |
| **Self-hosted Enterprise commercial deals** (deployment playbook, private-endpoint reference architecture, consolidated capacity guide, order-form / support posture for customer-operated installs) | **Out of V1.** **V1 GA Enterprise = ArchLucid-hosted SaaS.** Container / compose / Terraform remain engineering assets only. | **V2** — [`V1_DEFERRED.md` §6t](../library/V1_DEFERRED.md). |

---

## Pending Questions for Later

### Guided sandbox onboarding — **out of scope (owner 2026-05-25)**
- **Decision:** No guided sandbox. Prospects and trials use the **hosted trial funnel**, **Tier 1 extractor ZIP**, **sample-seeded trial tenant**, and **read-only marketing showcase** — not a separate mock/sandbox environment.
- Do not re-propose sandbox onboarding in future `(A)` assessments or improvement batches.

### Quality gate auto-retry — **out of V1 scope (owner 2026-05-25)**
- **Decision:** **No automatic agent retry** when the quality gate rejects a trace. Fail-fast with manual re-run remains the V1 contract.
- **V1 GA gate (owner 2026-05-25, option A):** Improvement **#2** — **`reject_reason` + `execution_mode`** labels on `archlucid_agent_output_quality_gate_total` ship **before GA**. Use production data before promoting single auto-retry to V1.1.
- **Score posture:** Do not rescored until **#2** ships (+0.02% weighted impact documented in improvement).

### LLM faithfulness default — **enabled Staging/Production (owner 2026-05-25)**
- **Decision:** **`ArchLucid:Agents:LlmFaithfulness:Enabled=true`** in `appsettings.Staging.json` and `appsettings.Production.json`. Development/base remain off. **`SkipWhenSimulator: true`** unchanged.
- Monitor tenant LLM budget and faithfulness histograms after deploy.

### SAML interactive claim-mapping wizard — **out of V1 scope (owner 2026-05-25)**
- **Decision:** No in-product SAML claim-mapping wizard for V1 GA. V1 Enterprise SAML = **`archlucid auth validate-saml`** CLI (archived #4) + startup validation (archived #18) + hosted Enterprise onboarding checklist (archived #17) + [`PROCUREMENT_FAQ.md`](../go-to-market/PROCUREMENT_FAQ.md) claim-mapping guidance.
- Do not list missing wizard as an `(A)` weakness, enterprise blocker, or improvement prerequisite. A future UI may land in V1.1+ only if separately promoted.

### Agent-output eval baseline (Improvement #1 — **owner decisions resolved 2026-05-25**)
- ~~Scoring rubric and golden cohort source~~ — **Owner: use judgement.** Reuse existing four-metric stack + aggregate weights documented in Improvement #1; golden cohort = `tests/golden-cohort/cohort.json` + `tests/eval-corpus/` committed outputs.
- **CI posture (option A):** Warn-only soak first — CI runs `--baseline` with **`continue-on-error: true`** and **always publishes** `artifacts/agent-eval-scorecard.md`. Flip to **merge-blocking** after **10 consecutive main-branch green runs** with **zero false-positive PR failures** attributable to LLM/judge noise. **Not** advisory-only (never fail PRs).
- **V1 GA gate (owner 2026-05-25, option A):** Wire baseline JSON + CI `--baseline` (warn-only) **before GA** — Improvement **#1**. Merge-blocking flip may follow the soak exit criterion after GA if warn-only is live pre-GA.
- **Score posture:** Do not rescored until **#1** ships (+0.02% weighted impact documented in improvement).

### RAG-V1 Batch 1 follow-ons — **all three before V1 GA (owner 2026-05-25, option A)**
- **Decision:** Ship **tenant-assigned pack query filter**, **cross-run prior-`GoldenManifest` history**, and **RAG-V1-000 citation formatter / grounding trace** **before V1 GA** — not citation-only, not post-GA deferral.
- **Engineering:** Improvement **#3** — single cohesive batch (or sequenced PRs merged before GA). See [`RAG_QUALITY_TECHNICAL_BACKLOG.md`](../library/RAG_QUALITY_TECHNICAL_BACKLOG.md) **RAG-V1-000** (remainder) and **RAG-V1-002**.
- **Score posture:** Do not rescored until **#3** ships (+0.19% weighted impact documented in improvement).

### USD savings Prometheus gauge — **before V1 GA (owner 2026-05-25, option A)**
- **Decision:** Ship **`archlucid_tenant_estimated_savings_usd`** background gauge before V1 GA — true USD rollup from existing ROI math, not findings-only Grafana proxy.
- **Engineering:** Improvement **#4** — leader-elected background refresh reusing `ITenantEstimatedUsdSavingsResolver` / `ExecutiveRoiSummaryService` dedup rules; update Grafana Business Value row.
- **Score posture:** Do not rescored until **#4** ships (+0.09% weighted impact documented in improvement).

### Team→Professional expansion CTA — **SHIPPED 2026-05-25**
- **Decision:** Ship **in-product expansion CTA** for **paid Team** tenants approaching seat/workspace caps before V1 GA — usage-threshold banner/modal → quote flow; not CSM-only, not V1.1 deferral.
- **Engineering:** Improvement **#5** — mirror **archived #14** (`TrialUsageUpgradeNudge`) patterns with separate telemetry and tier guard (Team only, not trial).
- **Score posture:** **Shipped 2026-05-25** (+0.10% weighted impact documented in improvement).

### Pricing quote-request SLA visibility — **SHIPPED 2026-05-25**
- **Decision:** Ship **measured SLA operational visibility** before V1 GA — operator aging dashboard, Grafana panel, and verified prod alert routing on top of shipped **archived #11** backend (aging view, metrics, alert rule, runbook SLA).
- **Engineering:** Improvement **#6** — not email-only follow-up, not post-GA ops sprint.
- **Score posture:** **Shipped 2026-05-25** (+0.05% weighted impact documented in improvement).

### Custom policy pack authoring GTM — **before V1 GA (owner 2026-05-25, option A)**
- **Decision:** Publish **all GTM assets** before V1 GA — public `/pricing` PS section, SoW template links, order-form addendum cross-links — not internal/sales-ready only.
- **Engineering:** Improvement **#7** — publication layer on shipped **archived #6** repo docs (SKU matrix, SoW, ORDER_FORM Addendum C).
- **Score posture:** Do not rescored until **#7** ships (+0.08% weighted impact documented in improvement).

No other open `(A)`-blocking owner questions — **V1 GA gate set is #7** (owner decisions recorded 2026-05-25). **#1–#6 shipped 2026-05-25.** Items below were removed because they pertain to V1.1 / V2 scope per `Assessment-Scope-V1_1.mdc` and therefore must not penalize `(A)` or appear as `(A)` pending questions:

- ~~Slack App Directory Listing Strategy~~ — V1.1 chat-ops follow-on per `V1_DEFERRED.md` §6a.
- ~~AWS/GCP Multi-Cloud Analysis Pricing~~ — V1.1 per §6n.
- ~~MCP Tool Allowlist Expansion~~ — V1.1 surface per §6d.
- ~~Third-Party Pen-Test Remediation SLAs~~ — V2 per §6c.
- ~~Support Tier SLAs for V1.1~~ — V1.1 commercial scope.
- ~~Non-SCIM bulk-CSV user onboarding~~ — **V2** per [`V1_DEFERRED.md` §6r](../library/V1_DEFERRED.md).
- ~~Self-hosted Enterprise commercial deals~~ — **V2** per [`V1_DEFERRED.md` §6t](../library/V1_DEFERRED.md) (includes capacity guide, private-endpoint reference architecture, deployment playbook).

These items will reappear naturally when a future assessment is scoped against V1.1 / V2 contracts. They do not belong in a V1 headline-readiness review.
