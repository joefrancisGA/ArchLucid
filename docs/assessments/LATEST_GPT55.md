> **Scope:** Evaluator — canonical strategic release and market readiness assessment (v2). Clean-slate weighted readiness pass. Product-state grounding aligns with `docs/library/V1_SCOPE.md` and `docs/library/V1_DEFERRED.md` as of 2026-06-24.

# 1. Title & Headline

**ArchLucid Assessment – (A) Headline Readiness: 84.23%**

Readiness excludes deferred V1.1/V2 items per `V1_DEFERRED.md` and `(B)` procurement realism. Reasoning substrate: **platform-provisioned Azure OpenAI** in real mode (hosted SaaS) and **deterministic simulator** in CI (`AgentExecution:Mode=Simulator` per `LIVE_E2E_HAPPY_PATH.md`). **Rescore note (2026-06-25, improvement #2 shipped):** [`POLICY_PACK_DELTA_DEMO_SCRIPT.md`](../go-to-market/POLICY_PACK_DELTA_DEMO_SCRIPT.md) + `scripts/demo-policy-pack-delta.ps1` + `/policy-packs` delta banner + `/help/policy-pack-delta-demo` — repeatable same-run / different-gate demo path for CS/sales. Prior rescoring (local pilot path complete): proof `first-pilot-proof-20260625T100122Z` — data consistency **PASS**; sponsor **HOLD** (33 block / 14 warn) expected on Simulator + `-SponsorHandoff`.

**Timestamp:** 2026-06-25 (UTC, policy-pack delta demo shipped)  
**Source materials inspected:** `REPO_DIGEST.md`, `V1_SCOPE.md`, `V1_DEFERRED.md`, `TRUST_CENTER.md`, `SOC2_SELF_ASSESSMENT_2026.md`, `SOC2_ROADMAP.md`, `ARCHITECTURE_COMPONENTS.md`, `SYSTEM_MAP.md`, `API_CONTRACTS.md`, `CONFIGURATION_REFERENCE.md`, `DEFAULT_POLICY_PACKS_V1.md`, `AUDIT_COVERAGE_MATRIX.md`, `.cursor/rules/Assessment-Scope-V1_1.mdc`, `FIRST_RUN_WALKTHROUGH.md`, `LIVE_E2E_HAPPY_PATH.md`, `V1_MAGIC_GUARDRAILS.md`, `CLAIM_READINESS_STATUS.md`, `FIRST_PILOT_OPERATOR_PATH.md`, `DEMO_WORKSPACES.md`, `TECH_BACKLOG.md` (TB-021, TB-141), **`POLICY_PACK_DELTA_DEMO_SCRIPT.md`**, **`DIFFERENTIATION_PROOF_PACKET.md`**.

**Operator-path evidence inspected:** `artifacts/first-pilot-proof/first-pilot-proof-20260625T100122Z/` (data consistency PASS, command center, go-no-go summary, evidence bundle); committed run `eb81dd4972ad429e8d4e214f9934bfc0` on Simulator @ `http://127.0.0.1:5128`.

**Code regions inspected:** `AuthorityDrivenArchitectureRunCommitOrchestrator.cs` (pre-commit gate + traceability), `PreCommitGovernanceGate.cs`, `QuestionSelectionEngine.cs`, `ExecutiveRoiSummaryService.cs` / `DispositionAwareRoiBasisCalculator.cs` (via `V1_SCOPE.md` citations), `RetrievalQueryService.cs` / `GraphRagNeighborExpander.cs` / `AgenticRetrievalQueryExpander.cs`, `RuleBasedDecisionEngine.cs`, `EffectiveGovernanceResolver.cs`.

# 2. Scorecard

| # | Quality | Score | Weight | Wtd Contribution | Wtd Deficiency |
|---|---------|---:|---:|---:|---:|
| 1 | Decision-Changing Insight Density | 81 | 13 | 10.53 | 247 |
| 2 | Differentiability / Defensibility vs Frontier AI | 86 | 13 | 11.18 | 182 |
| 3 | Governed Review Integrity | 90 | 13 | 11.70 | 130 |
| 4 | Correctness & Evidence Integrity | 85 | 12 | 10.20 | 180 |
| 5 | AI / Agent Readiness | 85 | 10 | 8.50 | 150 |
| 6 | Time-to-Value | 79 | 10 | 7.90 | 210 |
| 7 | Proof-of-ROI Readiness | 88 | 9 | 7.92 | 108 |
| 8 | Executive / Operator Comprehension | 80 | 8 | 6.40 | 160 |
| 9 | Runtime & First-Review Reliability | 90 | 7 | 6.30 | 70 |
| 10 | Adoption Friction | 72 | 5 | 3.60 | 140 |
| **Total** | | | **100** | **84.23%** | |

**Prior headline (local pilot path complete):** 83.89% · **Δ +0.34 pp** — policy-pack delta demo script, automation, in-app help, and `/policy-packs` banner make the governance moat repeatable in CS/sales demos (validation artifact; G4 cohort still HOLD).

# 3. Diagnostic Scores (non-headline)

These do **not** feed `(A)`. Tension with headline: headline is **high on engineering/governance** (84.23%) while **30-day voluntary usage** and **decision advantage** diagnostics are **materially lower** — the product is build-ready before market proof that principals change decisions and return without a sales motion.

| Diagnostic | Value | Calibration |
|------------|------:|-------------|
| **Decision Advantage Score** | **80 / 100** | Repeatable pack-delta demo script reduces "ChatGPT with steps" dismissal in live calls; cohort-scale decision deltas still unlogged. |
| **Frontier-AI Survival Probability (12-month)** | **68%** (range **55–78%**, medium confidence) | Unchanged reference class. |
| **30-Day Voluntary Usage Probability** (10 principal architects) | **36%** (range **25–47%**, low–medium confidence) | Proof path completes without `-SkipDemoWorkspaceValidation` on committed-run path (+); demo workspace run probes still need `AllowTestActorHeaders` on Development hosts. **G4 HOLD** (0/3 real runs) unchanged. |
| **Executive Purchase Probability** | **48%** (range **38–58%**, medium confidence) | Unchanged — `(B)` procurement gaps dominate. |

# 4. V1 Ship Gate

| # | Result | Evidence | Fastest resolution (FAIL/UNKNOWN only) |
|---|--------|----------|----------------------------------------|
| 1 | **PASS** | Merge-blocking live E2E + **local operator-path complete (2026-06-25):** run `eb81dd4972ad429e8d4e214f9934bfc0` committed; proof `first-pilot-proof-20260625T100122Z` with data consistency **PASS**, evidence bundle, no `-SkipDemoWorkspaceValidation`. Residual: demo run probes need `AllowTestActorHeaders`; k6/procurement/AI gates still HOLD on Simulator sponsor handoff. | Enable `ArchLucidAuth:AllowTestActorHeaders` for demo workspace probes; real-mode cohort for SEND. |
| 2 | **PASS** (scoped) | Cost/savings citation contract enforced (`V1_SCOPE.md` §2.16); commit traceability invariants in `AuthorityDrivenArchitectureRunCommitOrchestrator`; **G5 Live AI evidence PASS** in `CLAIM_READINESS_STATUS.md` (2026-06-25, v2 gate, four agent paths, `executionMode=real`). Residual: **TB-021** faithfulness CI soak not fully promoted to enforce — monitor, not ship-blocker today. | Re-run `.\scripts\Invoke-RealLlmEvidenceGate.ps1` before RC if artifact stale. |
| 3 | **PASS** | `ExecutiveRoiSummaryService` + `DispositionAwareRoiBasisCalculator`; explicit per-system vs headline labeling in `V1_SCOPE.md` §2.8; unit tests in `ExecutiveRoiSummaryInvariantTests`. | — |
| 4 | **PASS** | `live-api-replay-export.spec.ts` — run export ZIP + audit `RunExported`; Markdown/DOCX paths in `V1_SCOPE.md` §2.3. | — |
| 5 | **PASS** | Merge-blocking `ui-e2e-live` + accessibility baselines; first-review walkthrough in `FIRST_RUN_WALKTHROUGH.md`. | — |
| 6 | **PASS** | `SystemWithPerTenantCatalogs` (ADR 0037); JWT/OIDC/SAML SP/API key/SCIM documented §2.12; `live-api-apikey-auth` / `live-api-jwt-auth` CI lanes. | — |

**Ship gate verdict:** All six **PASS**. No FAIL cap on headline.

# 5. Executive Summary

**(A) Overall headline readiness:** **84.23%** (+0.34 pp from 83.89%) — **Policy-pack delta demo shipped:** documented CS/sales script, local automation, in-app help topic, and operator banner linking same-run / different-gate narrative. Local pilot path remains mechanically complete (data consistency **PASS**; sponsor **HOLD** on Simulator + `-SponsorHandoff`). Next validation seam: TB-141 cohort (G4) + real-mode repetition — not more demo doc surface.

**(B) Procurement / market realism (weight 0):** Honest interim posture (self-assessment, CAIQ/SIG, owner-conducted pen test, DPA template). **CPA SOC 2** and **third-party pen-test publication** remain buyer friction (`V1_DEFERRED.md` §6c — TB-135/TB-136, `(B)` only). No signed design partner, no published reference customer, no live commerce un-hold — all correctly deferred; sales-led motion with TEST-mode trial is coherent.

**Commercial picture:** Compelling **for controlled pilots and sponsor-led evaluations** — ROI board-pack and policy-aware packaging answer “why not another ChatGPT seat?” **Unproven at scale** without G4 proof-packet repetition (currently **HOLD**).

**Enterprise picture:** Strong trust **architecture** (DB-per-tenant, private endpoint story, audit export). Weaker on **assurance artifacts** buyers expect at scale (CPA report, external pen test) — narrated under `(B)`.

**Engineering picture:** Robust CI (OpenAPI snapshot, live SQL E2E, 95% coverage ratchet). Residual fragility: dual coordinator/authority paths, large Operate surface area, RAG quality program (TB-021) incomplete vs shipped retrieval code.

**Frontier-AI picture (one sentence):** ArchLucid **becomes more valuable** as base models improve **if** the team keeps investing in policy/evidence/workflow layers — **not** because raw critique quality is defensible alone.

# 6. Deferred Scope Uncertainty

| Bucket | Why deferred | Safe for V1? | V1 seam already present |
|--------|--------------|--------------|-------------------------|
| **V1.1 ITSM** (ServiceNow → Confluence → Jira, bidirectional sync) | Buyer-contract connectors scheduled post-GA | Yes — outbound REST/CLI + copy-as-work-item; **`Integrations:Itsm:NativeEnabled=false`** hides one-click create but correlations API remains | `POST /v1/integrations/itsm/outbound/issues`, `ItsmFindingCorrelations`, audit `Integration.*Create*` |
| **V1.1 MCP membrane** | Integrator transport not pilot gate | Yes — REST/CLI/UI | Non-GA `/v1/mcp/retrieval/*` |
| **V1.1 commerce un-hold** | Owner-only Stripe live + Marketplace Published | Yes — sales-led + TEST trial | `BillingProductionSafetyRules`, checkout webhooks wired |
| **V1.1 GTM** (TB-141/142 cohort, demo assets) | Owner-output deliverables | Yes — mechanics ship | Proof status, claim lint, starter packs |
| **V2 assurance** (CPA SOC 2 TB-135, external pen TB-136) | Organizational programs | Yes with honest trust center | Self-assessment + roadmap |

# 7. Weighted Quality Assessment (detail)

*Ordered by weighted deficiency signal (highest first).*

### 1. Decision-Changing Insight Density — 81 · 13 · 10.53 · 247

**Justification:** Azure extractor + cost findings with mandatory ZIP citations can surface orphan/spend patterns a prompt-only review misses **when** the ZIP is uploaded. Policy packs and pre-commit gate can block commits on severity. **Improvement #2 shipped (2026-06-25):** [`POLICY_PACK_DELTA_DEMO_SCRIPT.md`](../go-to-market/POLICY_PACK_DELTA_DEMO_SCRIPT.md) gives CS/sales a repeatable same-run / different-gate narrative. **However**, non-obvious insight density in **real** workloads is **not yet validated** at cohort scale (G4 HOLD).

**Tradeoffs:** Optimizing for “wow” narratives risks hallucination; strict citations reduce false confidence but can reduce perceived magic.

**Recommendations:** Run three real pilot proof packets (TB-141 scenarios) and measure **decision deltas** (approved architecture change, spend hold, exception filed) — not sentiment scores.

**Classification:** V1 engineering done; **market validation required** for insight claims.  
**Outcomes:** 1, 3, 5.

### 2. Time-to-Value — 78 · 10 · 7.80 · 220

**Justification:** Guided intake (`/reviews/new`, Socratic draft path), demo review, simulator CI path, and Tier-1 Azure extractor (no vendor Azure login) shorten first package. **Step 3 proof (2026-06-25)** confirms the documented operator path runs end-to-end on Windows with `-RunId` and produces command-center + evidence artifacts (~69s proof elapsed). **Counterweights:** `-SkipDemoWorkspaceValidation` required (demo validation hang), prerequisites/preflight CLI-config BLOCK on local lens, Operate-layer breadth, policy-pack vocabulary, identity topology setup.

**Tradeoffs:** Progressive disclosure helps pilots but hides governance value until expanded.

**Recommendations:** Pilot-mode shell preset: hide Operate links until first committed review + one-line “next best action” on dashboard.

**Classification:** V1 UX refinement + validation.  
**Outcomes:** 3, 4.

### 3. Correctness & Evidence Integrity — 84 · 12 · 10.08 · 192

**Justification:** Golden manifest traceability checks on commit; schema validation; cost citation contract; append-only audit with DB DENY UPDATE/DELETE. **G5** real-mode gate PASS documented. **Step 3:** evidence bundle + trace-chain summary + ai-readiness posture collected for committed run; data consistency readiness **WARN** (primary NEXT ACTION in command center). **TB-021** (faithfulness eval harness, grounding trace enrichment) still open — output-side enforcement not fully soaked.

**Tradeoffs:** Strict invariants reject bad commits (good) but can frustrate pilots if agent output is messy.

**Recommendations:** Complete **RAG-V1-005** faithfulness CI gate before broad real-mode marketing.

**Classification:** V1 (TB-021).  
**Outcomes:** 1, 2, 5.

### 4. Differentiability / Defensibility vs Frontier AI — 86 · 13 · 11.18 · 182

**Justification:** **Excellent** on governed workflow rubric — policy assignments change intake questions (`QuestionSelectionEngine`), pre-commit outcomes (`PreCommitGovernanceGate`), executive ROI basis, and audit reconstruction. **Improvement #2 shipped:** documented delta demo + `demo-policy-pack-delta.ps1` + `/help/policy-pack-delta-demo` makes the moat **demonstrable** in five minutes. **Medium** on raw analysis — frontier AI + company standards doc closes much of the gap for a solo architect.

**Tradeoffs:** Depth in governance vs speed of generic critique.

**Recommendations:** Run the delta demo in every first-review sales call; log prospect reaction (block/waive/exception filed).

**Classification:** V1 validation artifact shipped; market proof still required.  
**Outcomes:** 2, 5.

### 5. Executive / Operator Comprehension — 80 · 8 · 6.40 · 160

**Justification:** Executive ROI section + disposition labels + board-pack export are strong. **Policy-pack delta banner** on `/policy-packs` links operators to the in-app demo script. Operator shell still exposes large surface (governance, alerts, graph, compare) — Carbon migration helps but cognitive load remains high for first-time architects.

**Tradeoffs:** Enterprise completeness vs pilot simplicity.

**Recommendations:** Sponsor-mode dashboard default; defer Operate links until second session.

**Classification:** V1 UI / V1.1 IA (TB-399 URL cleanup).  
**Outcomes:** 4, 3.

### 6. Governed Review Integrity — 90 · 13 · 11.70 · 130

**Justification:** Policy packs are first-class (`EffectiveGovernanceResolver`, assignments, bundled manifest). Pre-commit gate blocks on severity with bypass audit. Approval workflow with self-approval block. 273 audit event constants with CI matrix guard.

**Tradeoffs:** Governance strictness vs velocity for teams without mature policy ops.

**Recommendations:** Ship governance dry-run + simulation controller in every pilot kickoff.

**Classification:** V1 — maintain; deepen trace UI from finding → rule key.

**Outcomes:** 2, 1, 5.

### 7. AI / Agent Readiness — 85 · 10 · 8.50 · 150

**Justification:** Real/simulator separation; `AuthorityRunOrchestrator` in Application (remediated); retrieval ships (`ArchLucid.Retrieval`, Ask, outbox ADR 0004). Agentic expander + Graph-RAG code exists. **TB-021** quality program and `V1_MAGIC_GUARDRAILS.md` (still listing Graph-RAG/HyDE as out-of-V1 magic) create documentation tension — treat **quality/enforcement** as the gap, not absence of retrieval.

**Tradeoffs:** Advanced retrieval increases cost/latency; simulator hides real-mode variance in CI.

**Recommendations:** Align guardrails doc with shipped retrieval; enforce TB-021 faithfulness gates.

**Classification:** V1 foundation + TB-021 backlog.  
**Outcomes:** 2, 5.

### 8. Adoption Friction — 71 · 5 · 3.55 · 145

**Justification:** Hosted Azure OpenAI removes LLM onboarding friction (correct V1 posture). **Step 3 surfaced new friction:** ~20 pilot scripts required UTF-8 BOM + strict-mode fixes on Windows PowerShell 5.1; CLI OpenAPI client deserialize failures on successful HTTP responses; demo workspace validation hangs on `/v1/pilots/runs/{runId}/pilot-run-deltas`; prerequisites/preflight BLOCK on CLI config lens locally. Friction also remains: tenant DB topology, IdP wiring, extractor ZIP manual step, optional Operate configuration, ITSM native create **off by default** (`Integrations:Itsm:NativeEnabled=false`).

**Tradeoffs:** Security/isolation vs speed of trial.

**Recommendations:** Single “pilot checklist” CLI (`archlucid doctor` + config lint) as mandatory pre-pilot artifact.

**Classification:** V1 ops + docs.  
**Outcomes:** 3, 4.

### 9. Proof-of-ROI Readiness — 88 · 9 · 7.92 · 108

**Justification:** Layered ROI model with explicit scopes (`V1_SCOPE.md` §2.8); disposition-aware headline; dedup by `FindingId`; board-pack delegates to same service — credible **if** dispositions maintained.

**Tradeoffs:** ROI credibility depends on operator discipline on dispositions and evidence quality.

**Recommendations:** Train pilots on disposition semantics; show headline vs per-system non-additivity in UI tooltip (already documented — ensure visible).

**Classification:** V1.  
**Outcomes:** 4, 1.

### 10. Runtime & First-Review Reliability — 89 · 7 · 6.23 · 77

**Justification:** Merge-blocking live E2E matrix; conflict/concurrency specs; health endpoints; coordinator durable audit retry on critical paths. **Step 3 local corroboration:** create → execute → commit → evidence bundle + go-no-go artifacts for run `eb81dd4972ad429e8d4e214f9934bfc0` on healthy Simulator+SQL stack. Residual: demo validation hang, CLI client drift, proof HOLD under sponsor handoff (expected on Simulator).

**Recommendations:** Keep hosted probe rollup internal-only until production baseUrl evidence exists (`TRUST_CENTER.md` staging disclaimer).

**Classification:** V1.  
**Outcomes:** 3.

# 8. Top 10 Weaknesses (ranked)

1. **Unproven decision-changing insight at cohort scale** — G4 HOLD; without repeated real proof packets, insight claims are design-confidence only. *Design vs market:* market. *V1 blocker:* no (pilot gate). *Fix:* execute TB-141 cohort + log decisions changed.

2. **Time-to-credible first package for skeptical principals** — Operate noise + manual ZIP. *Design:* mixed. *V1 blocker:* soft. *Fix:* pilot-mode UI + default extractor sample package.

3. **RAG/output faithfulness enforcement incomplete (TB-021)** — Retrieval ships; enforce gates soak pending. *Design:* design. *V1 blocker:* soft (G5 PASS). *Fix:* RAG-V1-005 Phase B promotion.

4. **Operator cognitive overload** — Too many surfaces before first commit value lands. *Design:* design. *V1 blocker:* no. *Fix:* progressive disclosure defaults.

5. **Policy-pack moat invisible in casual demo** — Findings look like smart AI unless pack change moves gate/ROI. *Market:* validation. *Fix:* mandatory two-pack demo script.

6. **Disposition-dependent ROI accuracy** — Garbage dispositions → sponsor distrust. *Design/market:* mixed. *Fix:* operator training + audit of disposition changes.

7. **ITSM native create disabled by default** — V1 seam exists but hidden; enterprises expect ticket button. *Design:* intentional (`CONFIGURATION_REFERENCE.md`). *V1 blocker:* no (V1.1 connectors). *Fix:* enable in pilot tenants when configured; do not rebuild connectors early.

8. **Mid-strangle coordinator/authority dual paths** — Maintenance/reliability risk. *Design:* design. *Fix:* ADR 0021 convergence (Tier 3).

9. **Procurement assurance gap (CPA SOC 2, external pen test)** — `(B)` only but blocks scale deals. *Market.* *Fix:* TB-135/TB-136 when owner directs.

10. **No repeatable public proof** — Reference customer / demo assets deferred (TB-141/142). *Market.* *Fix:* owner GTM backlog — not `(A)` defect.

# 9. Frontier-AI Analysis

### Commodity vs Durable (12-month horizon)

| Capability | Trajectory | Reason |
|------------|------------|--------|
| Generic architecture critique | **Commodity** | Frontier models + good prompts + pasted standards |
| Azure cost/orphan narrative from JSON exports | **Commodity → durable wrapper** | Extraction easy; **citation + manifest binding** is durable |
| Policy-pack mapped findings | **Durable** | Requires merged pack state + rule keys + assignments |
| Pre-commit gate + bypass audit | **Durable** | Enterprise enforcement, not model feature |
| Approval workflow + SoD | **Durable** | Process + audit types |
| Cross-run ROI with disposition basis | **Durable** | Portfolio state over time |
| Ask / retrieval over run corpus | **Commodity pressure** | RAG patterns generic; **tenant-scoped audit + policy corpus** helps |
| Board-pack / executive summary | **Durable** | Tied to persisted findings + dispositions |

### Hard-to-reproduce via prompting

Persisted golden manifest, stable `FindingId`, append-only audit with correlation IDs, governance bypass justification rows, disposition-aware ROI headline **≠** a chat transcript. Repeatability across operators with same policy assignment is the organizational bet.

### Leverage / upside (mandatory)

Better base models → richer findings **without** re-architecting orchestration → more policy rule hits → more audit value → stronger executive ROI narrative at **marginal** engineering cost. ArchLucid should **shorten** agent prompt investment and **lengthen** policy pack + evidence + workflow investment as models improve.

### Displacement timeline

**One model release away:** generic written architecture assessments and unstructured “review this diagram” chat.  
**Multi-release moat:** policy assignment changing commit gate + audit + ITSM correlation + portfolio ROI.

**Final verdict:** ArchLucid is **more valuable than frontier AI alone for organizational adoption**, but **not yet proven** that it wins the principal’s daily workflow against Claude+prompt **until** policy/evidence/demo scripts make the moat visible in under 30 minutes. Survival probability in §3.

# 10. Policy-Aware Governance Test

1. **First-class pack content?** **Yes** — bundled manifest, `EffectiveGovernanceResolver`, assignments; packs drive intake questions and compliance rule keys; pre-commit reads assignments + findings severity.
2. **Trace input → evidence → policy → decision → audit?** **Mostly yes** — extractor provenance merged in coordination; decision trace + rule audit; governance dispositions audited; some Ask/conversation paths intentionally omit durable audit (documented in matrix).
3. **Skilled architect + frontier AI reproduce consistently?** **No** for governed package + repeatability; **yes** for one-off critique quality.
4. **AI analysis vs enterprise infrastructure?** Critique/narrative = AI; gate, approvals, ROI basis, audit export = infrastructure.
5. **Evidence moat not decoration?** Side-by-side commit block when `PlatformDefault` priority floor tightened or assignment adds blocking severity.
6. **Fastest validation:** Policy dry-run + live pre-commit block demo on same run with two effective merges.
7. **V1 demo behavior:** Show commit **blocked**, bypass with justification **audited**, then peer approval on promotion path.

# 11. Principal Architect Dismissal Test

**“I need this”:** Pre-commit block saves them from shipping a manifest their security council would reject; board-pack saves half a day; extractor ZIP avoids fighting InfoSec for vendor Azure access.

**Voluntary return:** Only if the **next** review is faster **and** findings reference **their** packs/evidence — not generic wisdom.

**Immediate dismissal:** Uncited cost claim or policy violation with no rule key / evidence pointer.

**Most likely dismissal trigger today:** “This is ChatGPT with extra steps” when demo shows simulator-generic findings without pack delta — **calibrated likelihood ~44%** (range 34–54%, medium confidence) on cold principal evals without scripted pack comparison; unchanged dismissal mechanism, slight reduction from proven proof pipeline for repeat operators.

**Better than Claude + good prompt + pasted standards?** **Not on analysis alone.** **Yes on organizational record** — if buyer cares about audit, repeatability, and executive rollup. Many principals **do not** until a governance event forces them to.

# 12. Founder Delusion Check

- **Weakest-evidence strong assumption:** Principals will maintain dispositions and treat ArchLucid as system-of-record vs export-once-to-PPT.
- **Looks differentiated but commodity:** Eloquent holistic critic, unstructured Ask, generic WAF/security narratives.
- **Looks ordinary but strong moat:** Append-only audit + DB-per-tenant + pre-commit gate + stable finding IDs for ITSM/ROI.
- **Months-burning activities:** More agent personas, MCP before pilots prove REST path, polishing Operate surfaces unused in first 30 days.
- **If features froze six months:** Run real pilots, tighten faithfulness gates, simplify pilot shell — not new frameworks.
- **Dangerous distraction:** Autonomous multi-step “fix my architecture” agents (violates `V1_MAGIC_GUARDRAILS.md`).
- **Boring real moat:** Policy assignment → gate outcome → audit CSV export chain.

# 13. Competitive Reality Check & Moat Assessment

| Dimension | Frontier AI alone | ArchLucid |
|-----------|-------------------|-----------|
| Manual today | Export ARM/cost JSON, paste to LLM, write review doc | ZIP ingest + governed pipeline |
| Faster/consistency | Fast once; inconsistent across people | Slower setup; more consistent package |
| Resists prompting | N/A | Audit, SoD, commit gate, ROI basis |
| Commodity ≤12mo | Written reviews | Partial |
| More valuable as AI improves | N/A (baseline) | Yes — if workflow layer kept thin |
| Needs enterprise workflow | Optional | Core |
| Needs customer policy state | Ad hoc paste | Pack assignments |

**Current moat:** Governed review integrity (strongest **built** moat).  
**Potential moat:** Cross-run portfolio ROI + ITSM correlation at scale.  
**Weakest assumption:** Policy pack **content** depth matches buyer’s actual standards without customization labor.  
**Most durable:** Audit + tenant isolation + commit gate.  
**Probably illusory:** Secret agent prompts.  
**Buyer-obvious moat:** Live commit block + audit export in one screen share.

# 14. Adoption & Monetization

**30-day voluntary usage (10 PAs):** Best factor — credible cost/evidence line with citation. Stop factor — perceived process tax vs Cursor/Claude. Return if next review faster; stop if first review felt generic.

**Executive purchase:** Driver — disposition-aware portfolio ROI + auditability for committee questions. Blocker — no CPA SOC 2 (`(B)`). Minimum paid pilot proof — one committed review + board-pack + audit slice + extractor-backed cost line. Likely objection — “We already bought Copilot/ChatGPT Enterprise.”

**Why buy ArchLucid instead of more frontier-AI licenses?** Because licenses do not produce **policy-bound**, **evidence-cited**, **approval-gated**, **audit-exportable** review packages with executive ROI semantics — ArchLucid does, when configured and operated.

### Top 6 monetization blockers

| Blocker | Who objects | Overcome with | Type |
|---------|-------------|---------------|------|
| No CPA SOC 2 | Procurement | Self-assessment + roadmap honesty + pilot waiver | validation |
| No external pen test | InfoSec | Owner-conducted + TB-136 when funded | validation |
| No reference customer | Sponsor | TB-141/142 + design partner `(B)` | validation |
| Unproven ROI dispositions | CFO | Pilot with disposition training + sample board-pack | validation |
| Sales-led only (no live commerce) | Self-serve buyers | Accept V1 motion; V1.1 un-hold | owner |
| “AI tool fatigue” | Principals | Pack-delta demo + decision delta evidence | validation |

### Top 6 enterprise adoption blockers

| Blocker | Phase | Affects |
|---------|-------|---------|
| IdP/SAML setup | pilot | trust, friction |
| DB-per-tenant ops | scale | ops |
| Manual extractor ZIP | pilot | usability |
| Operate UI complexity | pilot | usability |
| ITSM bidirectional sync absent | scale | workflow (V1.1) |
| Assurance artifacts | procurement | trust `(B)` |

# 15. Most Important Truth

**ArchLucid is a real governed review system, not a chatbot skin — but it will lose to frontier AI in the principal’s laptop until pilots prove policy-and-evidence packaging changes decisions faster than prompting alone.**

The engineering moat is largely built; the **market moat is unproven**.

---
# === DIVIDER: DIAGNOSIS ABOVE / PRESCRIPTION BELOW ===
---

# 16. Stop Doing List

**Top 3 improvements not worth doing before V1**

1. Pulling forward full V1.1 Jira/ServiceNow bidirectional connectors — V1 outbound seam + correlations suffice for pilots; sequencing ServiceNow → Confluence → Jira stands.
2. MCP membrane / plugin SDK / marketplace — `(B)` ecosystem, not pilot gate.
3. Expanding bundled policy pack count before demonstrating **assignment changes behavior** in demos.

**Top 3 diminishing-returns areas**

1. Additional Operate-layer charts without pilot usage data.
2. More agent personas without faithfulness gate promotion (TB-021).
3. Marketing site polish before G4 proof packets (TB-141).

**Top 3 founder behaviors delaying validation**

1. Treating engineering completeness as proxy for voluntary architect reuse.
2. Demoing simulator output without pack/evidence delta narrative.
3. Deferring real pilot logging while tuning CI further.

**Top 3 enterprise-important features that may not improve V1 adoption**

1. Alert composite rules tuning before first commit path is effortless.
2. Knowledge graph UI depth before extractor ZIP path is default.
3. Cross-tenant portfolio ROI before single-tenant pilot success.

**ITSM special attention:** V1 outbound slice (`POST /v1/integrations/itsm/outbound/issues`, `ItsmFindingCorrelations`, per-tenant settings, audit events) is **sufficient for pilots** when `Integrations:Itsm:NativeEnabled=true` and credentials configured. **Do not rebuild** what exists. V1.1 sequencing **ServiceNow → Confluence → Jira** remains correct; pull-forward only if **buyer evidence** shows outbound-only blocked deals (validation, not assumption).

# 17. Top Improvement Opportunities

### Tier 1 – Must Fix

**1. Pilot proof-packet cohort execution (TB-141)**  
- **Why:** Closes market uncertainty on insight density and decision advantage — highest outcome priority.  
- **Impact:** Decision insight + voluntary usage + executive purchase narrative.  
- **Evidence:** G4 HOLD in `CLAIM_READINESS_STATUS.md`.  
- **Design uncertainty:** 2/10 · **Market uncertainty:** 9/10 · **Classification:** validation first (owner; TB-141).

**Cursor prompt — not applicable** (owner-selected environments; run `collect-first-pilot-proof.ps1` per runbook).

**2. Policy-pack delta demo script (product + CS) — SHIPPED 2026-06-25**  
- **Why:** Makes moat visible; reduces “ChatGPT with steps” dismissal (~45% trigger).  
- **Impact:** Differentiability, decision insight.  
- **Evidence:** [`POLICY_PACK_DELTA_DEMO_SCRIPT.md`](../go-to-market/POLICY_PACK_DELTA_DEMO_SCRIPT.md), `scripts/demo-policy-pack-delta.ps1`, `/help/policy-pack-delta-demo`, `/policy-packs` delta banner.  
- **Classification:** V1 validation artifact shipped; execute in live demos and log reactions.

```text
Shipped deliverables:
- docs/go-to-market/POLICY_PACK_DELTA_DEMO_SCRIPT.md (exact UI + API steps)
- scripts/demo-policy-pack-delta.ps1 (local DevelopmentBypass / bearer automation)
- In-app help topic policy-pack-delta-demo + operator banner on /policy-packs
- Cross-link from DIFFERENTIATION_PROOF_PACKET.md

Uses governance dry-run and pre-commit simulation endpoints; no pack content or gate logic changes.
Residual: market validation — run script in ≥5 prospect calls and note gate-flip comprehension.
```

**3. Promote TB-021 faithfulness gate (RAG-V1-005 Phase B soak → enforce)**  
- **Why:** Reduces hallucination-driven architect dismissal.  
- **Impact:** Correctness, AI readiness.  
- **Classification:** V1.

```text
Current problem: Phase A deterministic faithfulness checks run in CI; Phase B LLM-graded semantic faithfulness remains in soak and does not consistently flag or reject unfaithful finding narratives in production pipeline paths.

Desired behavior: After ≥5 consecutive green nightly golden-cohort runs, promote Phase B to enforce configured severity: unfaithful findings flagged/rejected with durable audit event; run continues for other findings.

Scope boundaries: ArchLucid.Application evaluation pipeline + TB-021 config; no prompt rewrites unless tests fail.

Acceptance criteria:
1. Phase B runs post-generation on real-mode paths when enabled
2. Audit event on failure (existing catalog type or documented new type with matrix update)
3. Unit tests with mocked grader returning unfaithful
4. Document promotion toggle in CONFIGURATION_REFERENCE.md

Tests: ArchLucid.Application.Tests faithfulness suite extended.

Non-goals: Online fine-tuning (RAG-V2-003); MCP exposure.
```

### Tier 2 – High Leverage

**4. Pilot-mode operator shell default** — Hide Operate nav until first commit; surface Executive ROI + next action. · V1 · UI · Design 7 / Market 6.

**5. Real-mode evidence cadence on RC cuts** — Re-run `Invoke-RealLlmEvidenceGate.ps1`; attach to release bundle per G5. · V1 ops · Design 3 / Market 4.

**6. Disposition training microcopy on ROI panel** — Tooltip explaining headline vs per-system non-additivity and disposition basis. · V1 · Design 5 / Market 5.

**7. Align `V1_MAGIC_GUARDRAILS.md` with shipped retrieval** — Note Graph-RAG/agentic code exists; guardrails apply to **buyer-facing magic claims**, not code deletion. · V1 docs · Design 4 / Market 2.

**8. Enable ITSM native create in configured pilot tenants only** — Document toggle `Integrations:Itsm:NativeEnabled=true`; do not expand connector scope. · V1 config · Design 3 / Market 5.

### Tier 3 – Hold For Reassessment

**9. ADR 0021 coordinator/authority convergence** — After pilot traction. · V1.1 engineering.

**10. AWS/GCP analysis (V1.1)** — After Azure pilot repeatability.

**11. Commerce un-hold** — Owner when buyer motion validates (GTM_BACKLOG).

# 18. Prompt Batching Guidance

| Batch | Focus | Safe for |
|-------|-------|----------|
| **First** | Pilot shell simplification + ROI/disposition microcopy + policy-delta demo doc | Composer / Sonnet |
| **Second** | TB-021 faithfulness promotion + config/doc alignment | Sonnet; **strong-model-recommended** for pipeline touchpoints |
| **Third** | ADR 0021 convergence, Operate IA (TB-399 URLs) | **Strong-model-recommended** |

Priority order: (1) first-review reliability messaging, (2) guided intake clarity, (3) evidence/policy traceability in UI, (4) review-package credibility, (5) demo reliability, (6) executive comprehension.

# 19. Model Usage Guidance

| Class | Use for |
|-------|---------|
| **Composer-safe** | ROI tooltips, demo scripts, doc alignment, snapshot updates |
| **Sonnet-safe** | Faithfulness test extensions, policy-pack demo checklist UI, config lint messages |
| **Strong-model-recommended** | Authority pipeline faithfulness promotion, pre-commit/gate edge cases, evidence-graph semantics |
| **Opus-or-Gemini-assessment-recommended** | Strategic reassessment, policy moat evaluation, cross-cutting security/auth |

# 20. Pending Questions For Later

| Question | Class |
|----------|-------|
| When will founder authorize Stage 0 → Stage 1 GTM (G4 ≥3 real runs)? | requires founder decision |
| When to flip `Integrations:Itsm:NativeEnabled` default for hosted SaaS? | requires customer validation |
| Phase B faithfulness promotion date after nightly soak | blocks V1 marketing claims scale-up, not GA code |
| Commerce un-hold timing | blocks V1.1; owner-only |
| ServiceNow dev instance for V1.1 connector QA | blocks V1.1 ServiceNow slice |

---

# Appendix A — Author Signal (NON-HEADLINE)

The repository reads as **principal-architect-led enterprise software**, not a hackathon wrapper: DB-per-tenant isolation chosen deliberately, audit append-only enforced in SQL, OpenAPI contract CI, honest trust-center deferrals, disposition-aware ROI documented with intentional non-additivity, and orchestration moved to Application layer. Product taste shows in bounded V1 magic guardrails and Carbon-oriented UI standards. The gap is not “can this team build?” — it is “will buyers and principals **operate** it repeatedly?” Author signal is **strong**; market proof is **early**.

---

## Central Question (direct answer)

> Does ArchLucid turn frontier AI into a governed, policy-aware, audit-ready enterprise architecture review system that changes decisions and earns repeat use?

**Conditionally yes on architecture; not yet proven on repeat use.** The governed system exists and ship gates pass. **Decision change and voluntary reuse** still require pilot evidence (G4 cohort, pack-delta demos, disposition discipline) — not more feature surface area.
