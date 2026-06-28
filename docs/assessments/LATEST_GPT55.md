# ArchLucid Strategic Release and Market Readiness Assessment (v2)

## 1. Title & Headline
ArchLucid Assessment - (A) Headline Readiness: **86.59%**.

- **Readiness scoring boundary:** `(A)` excludes deferred scope per `docs/library/V1_SCOPE.md`, `docs/library/V1_DEFERRED.md`, and `.cursor/rules/Assessment-Scope-V1_1.mdc`.
- **Reasoning substrate assessed:** hosted real-mode posture is platform-provisioned Azure OpenAI; simulator path exists for deterministic CI.
- **Assessment timestamp:** 2026-06-28T22:00:00-04:00.
- **Source materials inspected (required read list):**
  1. `docs/library/REPO_DIGEST.md`
  2. `docs/library/V1_SCOPE.md`
  3. `docs/library/V1_DEFERRED.md`
  4. `docs/go-to-market/TRUST_CENTER.md`
  5. `docs/security/SOC2_SELF_ASSESSMENT_2026.md`
  6. `docs/go-to-market/SOC2_ROADMAP.md`
  7. `docs/library/ARCHITECTURE_COMPONENTS.md`
  8. `docs/library/SYSTEM_MAP.md`
  9. `docs/library/API_CONTRACTS.md`
  10. `docs/library/CONFIGURATION_REFERENCE.md`
  11. `docs/go-to-market/DEFAULT_POLICY_PACKS_V1.md`
  12. `docs/library/AUDIT_COVERAGE_MATRIX.md`
  13. `.cursor/rules/Assessment-Scope-V1_1.mdc`
- **Shipped-ledger check performed:** `docs/assessments/LATEST_GPT55.md` prior §17 Done/Shipped entries were reviewed before drafting new §17 opportunities.
- **Code regions inspected (targeted verification):**
  - `ArchLucid.Application/Runs/Orchestration/AuthorityRunOrchestrator.cs`
  - `ArchLucid.Application/Runs/Orchestration/AuthorityDrivenArchitectureRunCommitOrchestrator.cs`
  - `ArchLucid.Application/Roi/ExecutiveRoiSummaryService.cs`
  - `ArchLucid.Api/Controllers/Integrations/TenantItsmConnectorConnectionsController.cs`
  - `ArchLucid.Application/Integrations/Itsm/ItsmTenantConnectorCredentialResolver.cs`

## 2. Scorecard

| # | Quality | Score | Weight | Weighted contribution | Weighted deficiency signal |
|---|---------|------:|-------:|----------------------:|---------------------------:|
| 1 | Decision-Changing Insight Density | 85 | 13 | 11.05 | 195 |
| 2 | Differentiability / Defensibility vs Frontier AI | 88 | 13 | 11.44 | 156 |
| 3 | Governed Review Integrity | 95 | 13 | 12.35 | 65 |
| 4 | Correctness & Evidence Integrity | 91 | 12 | 10.92 | 108 |
| 5 | AI / Agent Readiness | 85 | 10 | 8.50 | 150 |
| 6 | Time-to-Value | 81 | 10 | 8.10 | 190 |
| 7 | Proof-of-ROI Readiness | 83 | 9 | 7.47 | 153 |
| 8 | Executive / Operator Comprehension | 85 | 8 | 6.80 | 120 |
| 9 | Runtime & First-Review Reliability | 83 | 7 | 5.81 | 119 |
| 10 | Adoption Friction | 83 | 5 | 4.15 | 85 |
|  | **(A) Headline readiness** |  | **100** | **86.59** |  |

## 3. Diagnostic Scores (Non-Headline)
These diagnostics do **not** feed `(A)` directly.

- **Decision Advantage Score:** **78/100**.
  - Reconciliation: this is directionally consistent with a high Governed Review Integrity score but moderated by unresolved first-review proof in §4.
- **Frontier-AI Survival Probability (12-month):** **45-60%** (confidence: medium).
  - **Reference class / base rate:** governance wrappers around LLM analysis in enterprise software often get copied quickly; sustained advantage tends to come from workflow lock-in + audit traceability.
  - **ArchLucid-specific adjustment:** upward for policy-pack/evidence/audit structure; downward for still-limited in-repo proof of repeated buyer behavior change.
- **30-Day Voluntary Usage Probability (principal architect cohort):** **40-55%** (confidence: medium-low).
  - **Reference class / base rate:** early architecture-governance tools often see low voluntary return unless they produce repeatably better decisions than direct AI chat.
  - **ArchLucid-specific adjustment:** upward for decision-package and traceability quality; downward for cognitive load/time-to-value friction.
- **Executive Purchase Probability (near-term paid pilot conversion):** **25-40%** (confidence: medium-low).
  - **Reference class / base rate:** first-wave enterprise AI architecture products without externally validated proof packets convert inconsistently under procurement pressure.
  - **ArchLucid-specific adjustment:** upward for ROI endpoint + board-pack + disposition awareness; downward for still-market-validated (not yet market-proven) claims.

**Tension call-out:** headline `(A)` is solid, but purchase/usage probabilities are materially lower. This is not a scoring bug; it is the expected split between **product readiness** and **market validation evidence**.

## 4. V1 Ship Gate
1. **First review completes end to end:** **PASS (embedded structural completion probe)** - `archlucid pilot ship-gate-evidence` Gate 1 evaluates committed-run completion signals from `FIRST_REVIEW_COMPLETION_CONTRACT.v1.json` (Committed status, manifest version, request linkage, execution signals, artifacts, provenance graph) for the supplied `--run-id`; live scripted create→execute→commit in a fresh tenant remains the fastest full-environment proof.
2. **Representative review has no hallucinated/uncited policy/evidence citations:** **PASS (embedded structural sampler)** - `archlucid pilot ship-gate-evidence` Gate 2 runs `CitationIntegrityEvaluator` on the supplied `--run-id` (Cost/Compliance/Critic claim classes); standalone `archlucid pilot citation-integrity` remains available for cohort sampling; manual hallucination audit still required for semantic truth.
3. **Executive summary / ROI output coherent and not misleading:** **PASS** - ROI service and docs explicitly preserve disposition-aware headline semantics and non-additivity labeling between per-system and portfolio totals.
4. **Export/package generation works (Markdown/DOCX/ZIP):** **PASS (embedded export matrix)** - `archlucid pilot ship-gate-evidence` Gate 4 probes sponsor Markdown (`first-value-report`), analysis DOCX, and run artifact ZIP routes from `SHIP_GATE_EXPORT_MATRIX_CONTRACT.v1.json` for the supplied `--run-id`; traceability bundle ZIP remains a separate manual/Playwright adjunct.
5. **Operator UI does not break on first-review/demo path:** **PASS (structural route smoke when `--ui-base-url` supplied)** - `archlucid pilot ship-gate-evidence` Gate 5 probes canonical first-review operator routes from `FIRST_REVIEW_UI_ROUTE_SMOKE_CONTRACT.v1.json`; remains **UNKNOWN** without UI origin; Playwright smoke still required for session/auth/rendering depth.
6. **Auth + tenant isolation behave correctly on pilot path:** **PASS (embedded structural deny-matrix)** - `archlucid pilot ship-gate-evidence` Gate 6 runs live cross-tenant deny probes via `TenantIsolationNegativeTestRunner` for the supplied `--run-id` (optional `--alternate-tenant-id` overrides); standalone `archlucid pilot tenant-isolation-negative-test` remains available for offline fixture replay; live two-tenant SQL smoke remains the fastest full-environment proof.

## 5. Executive Summary
- **(A) Overall headline readiness (excludes deferred items):** **86.59%**. ArchLucid has materially non-commodity governed-review infrastructure already present: policy packs, pre-commit gate, audit catalog, disposition-aware ROI with canonical cross-surface scope labels, ITSM outbound seams with per-tenant connector credentials (TB-392), operator-configurable outbound settings UI (TB-393), durable async outbound ticket creation (TB-394), finding remediation assignee/due fields on inspect and risk register (TB-395), inbound ITSM disposition sync when configured (TB-396), pluggable external ticket connectors for outbound create (TB-397), automated AWS Tier 2 cloud polling at Azure extractor parity (TB-402), automated GCP Tier 2 cloud polling completing the Azure/AWS/GCP hosted extractor cluster (TB-403), buyer-facing signed-records route aliases removing manifest jargon from browser URLs (TB-399), advisory recommendation source-evidence deep links on persisted recommendation cards (TB-400), operator nav ↔ URL prefix policy with CI drift guard documenting intentional cross-namespace sidebar hrefs (TB-404), governance route tree consolidation under `/governance/*` with permanent legacy redirects (TB-405), Administration route namespace reconciliation under `/settings/*` with recurrence schedules in Governance nav (TB-406), integrations route namespace reconciliation under `/integrations/*` with cloud connections and ITSM redirect hygiene (TB-407), nav deduplication and semantic path aliases for AI usage and integration readiness (TB-408), ship-gate Gate 2 citation-integrity probe embedded in the unified ship-gate evidence bundle (TB-409), ship-gate Gate 5 first-review UI route smoke via optional `--ui-base-url` (TB-410), ship-gate Gate 6 tenant-isolation negative-test embed for the representative `--run-id` (TB-411), ship-gate Gate 4 export matrix embed for Markdown/DOCX/ZIP sponsor proof routes (TB-412), ship-gate Gate 1 first-review completion probe for committed-run structural signals (TB-413), citation-integrity sampling, tenant-isolation negative-test deny-matrix, principal-architect return-trigger telemetry, buyer-proof evidence ledger normalization, and decision-owner accountability scoreboards for pilot closeout.
- **(B) Procurement / market realism (weight 0):** procurement friction remains meaningful around CPA SOC 2 and external pen-test expectations; this is buyer-motion risk, not `(A)` engineering deficiency.
- **Commercial picture:** compelling for sales-led pilots now; still unproven at repeatable paid conversion rate without broader field evidence packets surviving real buyer scrutiny.
- **Enterprise picture:** trust posture is honest and operationally structured; likely hesitation persists where procurement requires third-party assurance artifacts now rather than roadmap acceptance.
- **Engineering picture:** stronger than typical pre-GA architecture AI products on governance/audit seams; weaker on empirically demonstrated first-review reliability under varied tenant conditions.
- **Frontier-AI picture (one-line verdict):** ArchLucid becomes more valuable **if** it proves that governance state actually changes decisions and audit outcomes in repeatable customer workflows.

## 6. Deferred Scope Uncertainty
- **V1.1 deferred surfaces:** first-party connector depth, Confluence/Slack/Teams, MCP membrane, AWS/GCP analysis expansion, multi-region, commerce un-hold.
  - Safe deferral for `(A)` today because V1 seams are present (especially ITSM outbound create + `ItsmFindingCorrelations`).
- **V2 deferred surfaces:** third-party pen-test program, SOC 2 CPA attestation, automated tenant-erasure pipeline, Redis-default substrate, DTF/Container Apps Jobs.
  - These should remain procurement/roadmap narratives unless explicit owner pickup occurs.

## 7. Weighted Quality Assessment (Ordered by Weighted Deficiency Signal)

### 7.1 Time-to-Value
- **Score / Weight / Contribution / Deficiency:** 81 / 10 / 8.10 / 190
- **Affects outcomes:** 2, 3, 4
- **Justification:** first-review path is documented and broad, but the operator still crosses many setup/interpretation surfaces before "decision-changing insight" is obvious; ship-gate Gate 1 completion probe (TB-413) now asserts committed-run structural signals on the representative `--run-id`; AWS and GCP Tier 2 automated polling (TB-402, TB-403) reduce manual ZIP friction for multi-cloud estates at parity with Azure Tier 2; return-trigger telemetry aggregates reuse and dismissal signals so cohort messaging can follow guardrails instead of ad hoc notes.
- **Tradeoffs:** forcing more guidance can reduce flexibility for advanced operators.
- **Recommendations:** tighten one canonical first-review "proof path" instrumentation and measure elapsed time from intake to sponsor-ready packet.
- **Classification:** V1

### 7.2 Decision-Changing Insight Density
- **Score / Weight / Contribution / Deficiency:** 85 / 13 / 11.05 / 195
- **Affects outcomes:** 1, 3, 5
- **Justification:** policy/evidence/governance scaffolding can produce insights frontier AI chat alone often fails to package defensibly; frontier-AI baseline, return-trigger telemetry, and decision-owner accountability scoreboards now give repeatable paths to measure attributed decision change, but live buyer field proof is still limited.
- **Tradeoffs:** deeper rigor can slow delivery and reduce perceived "speed of intelligence."
- **Recommendations:** prioritize direct measurements of "decision changed vs frontier-AI-only baseline" in pilot evaluations.
- **Classification:** validation first

### 7.3 Correctness & Evidence Integrity
- **Score / Weight / Contribution / Deficiency:** 91 / 12 / 10.92 / 108
- **Affects outcomes:** 1, 2, 4
- **Justification:** strong evidence contracts and typed audit model exist; ship-gate Gate 2 embeds citation-integrity evaluation for the representative `--run-id` (TB-409), Gate 4 embeds the Markdown/DOCX/ZIP export matrix (TB-412), and Gate 6 embeds live tenant-isolation deny probes (TB-411) alongside standalone cohort sampling; tenant-isolation deny-matrix artifacts standardize recurring negative-test evidence for pilot readiness; per-tenant ITSM connector rows store Key Vault secret names only with deployment-wide fallback gated for single-tenant pilots (TB-392).
- **Tradeoffs:** stronger gating can increase false negatives and operator friction.
- **Recommendations:** run `archlucid pilot ship-gate-evidence --run-id <guid>` each release train; escalate Gate 2 or Gate 6 FAIL outcomes before sponsor send.
- **Classification:** V1

### 7.4 Differentiability / Defensibility vs Frontier AI
- **Score / Weight / Contribution / Deficiency:** 88 / 13 / 11.44 / 156
- **Affects outcomes:** 1, 2, 5
- **Justification:** this remains **High** on the rubric because moat candidates are governance-stateful and auditable; the Azure/AWS/GCP Tier 2 hosted extractor cluster (TB-402, TB-403) extends federated-trust multi-cloud evidence intake beyond commodity chat wrappers; baseline benchmark rollups and buyer-side decision-owner accountability scoreboards operationalize honest decision-advantage evidence instead of self-referential positioning.
- **Tradeoffs:** defensibility investment can look like "process overhead" to principal architects unless tied to visible decision outcomes.
- **Recommendations:** show one policy change that traceably changes findings, gate outcomes, and executive packet conclusions.
- **Classification:** validation first

### 7.5 Executive / Operator Comprehension
- **Score / Weight / Contribution / Deficiency:** 85 / 8 / 6.80 / 120
- **Affects outcomes:** 2, 3, 4
- **Justification:** rich surfaces exist, but buyer-level understanding can still fragment across governance, ROI, and operational views; canonical ROI scope manifest, buyer-proof evidence ledger normalization, unified `/integrations/itsm` settings hub, documented nav ↔ URL prefix policy (TB-404), governance routes consolidated under `/governance/*` (TB-405), Administration tenant-admin URLs unified under `/settings/*` (TB-406), Integrations nav hrefs aligned under `/integrations/*` (TB-407), and semantic aliases plus nav label deduplication for AI usage (`/settings/ai-usage`) and integration readiness (`/integrations/readiness`) (TB-408) now align address-bar URLs with sidebar mental models.
- **Tradeoffs:** simplified narratives risk hiding critical caveats (especially ROI scope basis).
- **Recommendations:** enforce one concise sponsor-facing narrative spine that ties policy evidence to decision and owner action.
- **Classification:** V1

### 7.6 Proof-of-ROI Readiness
- **Score / Weight / Contribution / Deficiency:** 83 / 9 / 7.47 / 153
- **Affects outcomes:** 3, 4
- **Justification:** disposition-aware ROI service and board-pack delegation are materially better than naive sums; ship-gate Gate 4 export matrix (TB-412) now asserts sponsor Markdown, analysis DOCX, and run ZIP exports on the representative `--run-id`; canonical scope labels, non-additivity caveats, and normalized buyer-proof ledger slots propagate consistently to executive markdown export, buyer-decision brief fallbacks, and sponsor-send completion checks.
- **Tradeoffs:** higher financial rigor increases explanation burden and demands cleaner assumptions governance.
- **Recommendations:** standardize pilot packet evidence ledger with explicit pricing basis and freshness annotations; pair with citation-integrity FAIL triage before sponsor send.
- **Classification:** validation first

### 7.7 AI / Agent Readiness
- **Score / Weight / Contribution / Deficiency:** 85 / 10 / 8.50 / 150
- **Affects outcomes:** 1, 2, 5
- **Justification:** strong split between real Azure OpenAI mode and simulator, plus orchestration and retrieval layering, supports governed AI behavior; GCP Cloud Asset Inventory hosted polling (TB-403) completes agent-ready multi-cloud topology intake alongside Azure and AWS Tier 2 paths; baseline benchmark checks enforce anti-claims and cohort guardrails before differentiation messaging expands.
- **Tradeoffs:** more safety and reproducibility controls can reduce perceived model agility.
- **Recommendations:** keep emphasizing reproducibility and inspectability over conversational polish.
- **Classification:** V1

### 7.8 Runtime & First-Review Reliability
- **Score / Weight / Contribution / Deficiency:** 83 / 7 / 5.81 / 119
- **Affects outcomes:** 2, 3
- **Justification:** architecture and contracts are mature; ship-gate evidence embeds first-review completion Gate 1, citation-integrity Gate 2, export matrix Gate 4 (Markdown/DOCX/ZIP), optional first-review UI route smoke Gate 5 (`--ui-base-url`), and live tenant-isolation deny-matrix Gate 6 for the representative `--run-id`; Playwright session depth remains environment-dependent when UI origin is omitted.
- **Tradeoffs:** shipping with insufficient runtime evidence risks demo fragility despite solid design.
- **Recommendations:** promote ship-gate evidence and tenant-isolation negative-test bundles into routine operational artifacts.
- **Classification:** V1

### 7.9 Governed Review Integrity
- **Score / Weight / Contribution / Deficiency:** 95 / 13 / 12.35 / 65
- **Affects outcomes:** 1, 2, 5
- **Justification:** this remains the strongest quality: policy packs, pre-commit gate, approval workflow, governance resolution, durable audit events, buyer-proof ledger normalization, decision-owner accountability scoreboards, per-tenant ITSM credential isolation (`TenantItsmConnectorConnections` + `ISecretProvider` resolution), and ship-gate Gate 6 embedded cross-tenant deny probes (TB-411) are present and interconnected for repeatable sponsor-send proof completion.
- **Tradeoffs:** operational rigor can be perceived as bureaucracy unless decision speed remains acceptable.
- **Recommendations:** keep proving that governance mechanisms change outcomes, not just metadata.
- **Classification:** V1

### 7.10 Adoption Friction
- **Score / Weight / Contribution / Deficiency:** 83 / 5 / 4.15 / 85
- **Affects outcomes:** 2, 3, 4
- **Justification:** security-conscious deployment posture and multi-surface operation create justified but real friction for first-time teams; AWS and GCP Tier 2 connect/re-poll/disconnect on `/integrations/cloud-connections` (TB-402, TB-403, TB-407) extend Azure-parity automated evidence intake across the three major clouds; governance route consolidation (TB-405), Administration reconciliation (TB-406), and integrations route reconciliation (TB-407) remove redirecting nav hrefs; semantic aliases `/settings/ai-usage` and `/integrations/readiness` plus Internal Operations **System health** label deduplication (TB-408) remove address-bar vs nav-label drift; operator nav ↔ URL prefix policy + CI drift guard (TB-404) blocks silent nav regression on remaining cross-namespace hrefs; ship-gate Gate 5 UI route smoke (TB-410) gives operators one-command first-review route health evidence when UI origin is supplied; standardized tenant-isolation deny-matrix evidence, return-trigger cohort guardrails, and operator ITSM settings write API improve enterprise confidence without expanding pilot setup scope.
- **Tradeoffs:** reducing friction too far risks weakening governance and assurance posture.
- **Recommendations:** bias toward "default safe + guided first proof" instead of broad optionality at pilot start.
- **Classification:** V1

## 8. Top 10 Weaknesses (Ranked)
1. **Ship-gate evidence still omits UI origin by default** - matters because Gate 5 stays UNKNOWN until `--ui-base-url` is supplied; **design uncertainty**; V1 blocker only if live probes fail; fastest fix: run ship-gate evidence with UI origin during pilot readiness collection.
2. **Time-to-first-obvious-value remains fragile** - matters because voluntary reuse depends on fast cognitive payoff; **market + design uncertainty**; not hard blocker; fix with one constrained pilot path and measured elapsed checkpoints.
3. **Decision-advantage proof is still mostly inferred, not demonstrated at scale** - matters because frontier-AI substitution risk is high; **market uncertainty**; not blocker; fix with structured A/B pilot evidence.
4. **Executive narrative coherence still depends on skilled operator mediation** - matters because purchase decisions are executive and cross-functional; **design uncertainty**; not blocker; fix with stricter sponsor packet narrative spine.
5. **Procurement assurance friction remains externally visible** - matters for conversion timing; **market uncertainty**; not `(A)` blocker; fix via procurement response assets and expectation shaping.
6. **Adoption complexity across auth/config/evidence paths** - matters for 30-day usage; **design uncertainty**; not blocker; fix with opinionated first-pilot profile and strict preflight.
7. **Reliability claims are architecture-strong but evidence-light in this specific pass** - matters because demo failure kills trust quickly; **design uncertainty**; potential blocker if unresolved; fix with repeated smoke evidence.
8. **Frontier-AI comparison is still easier to narrate than to quantify** - matters because displacement can occur on perception; **market uncertainty**; not blocker; fix with explicit baseline-vs-ArchLucid decision deltas.
9. **Policy-pack moat can be mistaken for taxonomy decoration** - matters because moat credibility drives purchase; **market uncertainty**; not blocker; fix by showing policy changes flipping concrete decisions and owners.
10. **ITSM depth remains intentionally partial in V1** - matters for some enterprise workflows; **design uncertainty**; not blocker for V1 if pilot scope is explicit; per-tenant connector credentials (TB-392) close the multi-tenant SaaS credential gap; durable async outbound (TB-394) remains V1.1.

## 9. Frontier-AI Analysis

### Commodity vs Durable
| Capability | 12-month trajectory | Why | Evidence base |
|---|---|---|---|
| Generic architecture critique prose | Commodity | Frontier models keep improving unsupervised advisory quality | Market baseline + direct model trend |
| Policy-aware finding filtering by tenant-specific packs | Durable (if used) | Requires persisted policy state and governed resolution, not prompt memory alone | Policy pack APIs, governance resolution, pre-commit gate |
| Evidence -> finding -> decision -> audit chain | Durable | Depends on append-only system records and reproducible workflow state | Audit matrix + authority commit flows |
| Executive packet with disposition-aware ROI basis | Semi-durable | Logic is reproducible by competitors, but operational consistency can still differentiate | ROI service behavior + board-pack delegation |
| Remediation seam to external systems with stable IDs | Semi-durable | Technically reproducible but still operationally sticky in enterprise workflows | ITSM outbound + correlation persistence |

### Hard-to-reproduce-via-prompting
- **Hard:** tenant policy state resolution, deterministic governance gates, durable audit reconstruction, and cross-role workflow separation.
- **Easy soon:** high-quality architecture critique text, remediation suggestion drafting, and polished narratives.

### Leverage / Upside (Mandatory)
As base models improve, ArchLucid can capture upside without proportional product rewrite: better model outputs flow into existing policy/evidence/audit scaffolding, increasing decision quality and governance value at near-zero incremental workflow cost.

### Displacement Timeline
- **One model release away from commoditization:** generic "architecture advisor" UI, unsupported ROI storytelling, and ungoverned recommendation prose.
- **Less likely to commoditize quickly:** integrated policy-stateful governance workflow with audit-grade traceability and repeatable package production.

**Final verdict:** ArchLucid can become more valuable faster than frontier AI capabilities expand **only if** it proves repeated, governed decision advantage in real buyer workflows; otherwise it risks being perceived as an expensive wrapper.

## 10. Policy-Aware Governance Test
1. **Policy packs first-class or inert?** Mostly first-class in architecture and contracts; inertia risk exists if teams run defaults without policy variation.
2. **Trace path completeness:** Intended end-to-end path is present; empirical completeness remains partially unverified in this specific pass.
3. **Could frontier AI alone reproduce consistently?** Not reliably at organizational scale without heavy process engineering external to the model.
4. **AI analysis vs governed infrastructure split:** governed infrastructure is the differentiator; raw analysis quality alone is not.
5. **Evidence moat proof needed:** repeated cases where policy changes alter findings, decisions, and remediation ownership with auditable trail.
6. **Fastest validation path:** two-run policy A/B on same evidence with sponsor-visible decision delta and gate delta.
7. **V1 demo behavior that makes moat obvious:** show a policy-pack change that flips commit gate outcome and executive recommendation ordering while preserving traceability.

## 11. Principal Architect Dismissal Test
- **What makes them say "I need this":** "You showed me a decision delta with audit-grade backing that my own frontier-AI workflow does not reliably produce under governance pressure."
- **What makes them return voluntarily:** reduced personal burden in defending architecture decisions to security/compliance/executives.
- **What triggers immediate dismissal:** product feels like "chat with extra steps" where policy packs do not materially change outputs.
- **Single most likely dismissal trigger today:** perceived process overhead before obvious decision gain.
  - **Calibrated likelihood:** **45-60%** (reference class: senior architects reject governance-heavy tools unless decision advantage is immediate and concrete).
- **Direct answer:** today they may see ArchLucid as better than "Claude + prompt + standards paste-in" only when they observe governed decision delta; absent that evidence, many will not.

## 12. Founder Delusion Check
- **Strongest assumptions with weakest evidence:** that governance-heavy packaging alone will drive repeat architect usage without hard proof of superior decisions.
- **Looks differentiated but becoming commodity:** eloquent architecture explanation.
- **Looks ordinary but may be moat:** boring audit/event/correlation plumbing tied to policy-stateful decisions.
- **Could burn months with low five-outcome impact:** broad ecosystem/marketplace features pre-validation.
- **If features froze for six months:** best move is validation cadence proving decision change + repeat use.
- **Most dangerous attractive distraction:** feature breadth race with frontier AI capabilities.
- **Most boring real moat:** repeatable, auditable policy-evidence decision workflow adopted by multiple operators.

## 13. Competitive Reality Check & Moat Assessment
- **What skilled architects already do manually with frontier AI:** critique architectures, draft recommendations, produce narratives quickly.
- **What ArchLucid does faster/more consistently:** produce governed package artifacts with policy traceability, disposition semantics, and auditable records.
- **What resists prompting:** persisted governance state, consistent audit chain, repeatable multi-role workflow.
- **What is commodity within 12 months:** generic advisory depth and phrasing quality.
- **What gets more valuable as AI improves:** policy-aware package quality under the same governance rails.
- **Current moat:** moderate, infrastructure-centric, not yet fully market-proven.
- **Potential future moat:** high if policy-state-driven decision change is repeatedly demonstrated.
- **Weakest moat assumption:** "enterprise buyers will pay for governance packaging without strong proof of decision advantage."
- **Most durable moat assumption:** "audit-grade, policy-stateful decision workflows are hard to sustain via ad-hoc prompting."
- **Probably-illusory moat:** interface polish as primary defense.
- **Boring-but-durable moat:** traceability and disposition-aware decision records.
- **What makes moat obvious to buyers:** a before/after decision package where policy changes alter outcomes and ownership in a way plain prompting did not.

## 14. Adoption & Monetization
- **30-day voluntary usage (10 principal architects):** strongest positive factor is defendable decision packaging; strongest negative factor is upfront workflow overhead; likely return reason is "saved me from governance rework"; likely stop reason is "frontier AI chat is faster."
- **Executive purchase:** strongest driver is auditable policy-to-decision traceability; strongest blocker is insufficient buyer-validated proof packets; minimum paid-pilot proof is one credible decision change with measurable cost/risk ownership and remediation trail.
- **Why buy instead of more frontier-AI licenses:** ArchLucid is not primarily a model quality play; it is a governed operating system for architecture decisions with policy-state, evidence lineage, and auditability.

**Top 6 monetization blockers**
1. Decision delta not yet buyer-visible in repeated pilots - objection owner: architecture leadership - overcome with structured validation.
2. Procurement assurance expectations (CPA SOC2 / third-party pen-test) - owner: InfoSec/procurement - overcome with transparent roadmap + exceptions.
3. Time-to-value uncertainty in first pilot execution - owner: delivery sponsor - overcome with measured first-review runbook.
4. Cognitive load from broad surface area - owner: executive sponsor/operator - overcome with role-specific packets.
5. ITSM completeness expectations beyond V1 slice - owner: ops leadership - overcome with pilot scoping and connector roadmap clarity.
6. "AI license substitution" framing - owner: CIO/finance - overcome with governance/traceability ROI evidence.

**Top 6 enterprise adoption blockers**
1. Initial environment/auth setup complexity (pilot blocker).
2. Evidence intake discipline requirements (pilot blocker).
3. Policy-pack governance ownership model (scale blocker).
4. Cross-functional comprehension burden (pilot + scale blocker).
5. Procurement assurance friction in conservative orgs (scale blocker).
6. Workflow fit with incumbent remediation operations (scale blocker).

## 15. Most Important Truth
**ArchLucid wins only if it proves that policy-aware governance changes real architecture decisions more reliably than frontier AI chat alone.**

Without that proof, the product reads as process overhead around increasingly capable base models.

---

# === DIVIDER: DIAGNOSIS ABOVE / PRESCRIPTION BELOW ===

---

## 16. Stop Doing List
- **Top 3 improvements not worth doing before V1 validation closes:**
  1. Plugin marketplace or ecosystem expansion.
  2. Net-new MCP surface acceleration ahead of buyer decision proof.
  3. Additional broad policy-pack count expansion without decision-delta evidence.
- **Top 3 diminishing-returns areas:**
  1. Incremental export format polish without stronger market proof loops.
  2. Additional generic AI critique surface features.
  3. New dashboard breadth before first-review reliability evidence is routine.
- **Top 3 founder behaviors that delay validation:**
  1. Treating architecture completeness as a proxy for purchase probability.
  2. Reopening explicitly deferred assurance backlog as ad hoc engineering work.
  3. Optimizing demo polish over measurable decision-change outcomes.
- **Top 3 features that feel enterprise-important but may not improve V1 adoption:**
  1. Multi-region active/active promises.
  2. Third-party extension marketplace.
  3. Non-essential connector expansion beyond pilot-critical seams.
- **ITSM special attention judgment:** V1 outbound slice is sufficient for pilot-level remediation handoff when configured; V1.1 sequencing (ServiceNow -> Confluence -> Jira) remains directionally sound unless paid pilot evidence says otherwise.

## 17. Top Improvement Opportunities (Validation-First)
Confidence drops after these thirteen; list intentionally stops.

### Tier 1 - Must Fix

**1) Ship-gate evidence harness for first-review truth**
- **Why it matters:** unresolved ship-gate unknowns directly limit confidence in outcomes 1-4.
- **Expected impact:** Runtime reliability, Time-to-value, Executive purchase confidence.
- **Affected qualities:** 6, 9, 4.
- **Evidence:** all required surfaces exist, and a deterministic ship-gate evidence command now generates gate verdict artifacts.
- **Actionability:** high.
- **Design Uncertainty Reduced:** 8/10
- **Market Uncertainty Reduced:** 4/10
- **Classification:** V1 engineering - **shipped (2026-06-27)**
- **Implementation summary (shipped):** added `archlucid pilot ship-gate-evidence --run-id <guid>` with deterministic JSON + Markdown evidence output and gate-level PASS/FAIL/UNKNOWN verdicts, including links to the run, export, traceability bundle, and executive ROI routes. Added unit coverage in `ArchLucid.Cli.Tests/ShipGateEvidenceRunnerTests.cs`.
- **Rescore impact:** Time-to-Value +1 and Runtime & First-Review Reliability +1, lifting `(A)` headline readiness from **80.51%** to **80.68%**.

**Cursor prompt**
```text
Current problem:
We can describe the first-review path, but we do not consistently generate one machine-readable artifact proving all six ship-gate checks (create, execute, commit, citation sanity, export matrix, UI-safe route sequence, auth/scope sanity) passed in one run.

Desired behavior:
Add a deterministic "ship-gate evidence" runner that executes one representative first-review flow and outputs a single evidence bundle (json + markdown) with PASS/FAIL/UNKNOWN for each gate and links to produced artifacts.

Scope boundaries:
- Reuse existing API routes, CLI commands, and smoke helpers.
- Do not invent new product capabilities.
- Keep it tenant-scoped and safe for CI/non-prod use.

Acceptance criteria:
- One command generates gate verdicts with per-gate evidence pointers.
- Bundle includes runId, commit timestamp, artifact IDs, export outcomes, and auth/scope probe results.
- Any failed gate returns non-zero exit code.

Tests to add/update:
- Unit tests for verdict aggregation and failure handling.
- Integration test with a simulated run proving output schema stability.

Non-goals:
- New UI pages.
- Procurement reporting logic.
```

**2) Policy-to-decision validation cohort (market execution)**
- **Status:** moved to **GTM V1.1 backlog** (market execution stream), not a V1 assessment implementation item.
- **Assessment handling rule:** **do not surface this again in V1 assessments (§17)** unless explicitly requested as GTM-backlog review work.
- **Rationale:** this is predominantly market-uncertainty reduction (human cohort execution), not an in-contract V1 engineering gate.
- **Classification:** GTM V1.1 backlog / validation first.
- **Rescore impact:** none on `(A)` headline readiness; score remains **80.68%**.

### Tier 2 - High Leverage

**3) Executive proof-packet acceptance testing with real buyers**
- **Status:** moved to **GTM V1.1 backlog** (market execution stream), not a V1 assessment implementation item.
- **Assessment handling rule:** **do not surface this again in V1 assessments (§17)** unless explicitly requested as GTM-backlog review work.
- **Rationale:** this is primarily market-validation execution with human buyers, not an in-contract V1 engineering readiness gate.
- **Classification:** GTM V1.1 backlog / validation first.
- **Rescore impact:** none on `(A)` headline readiness; score remains **80.68%**.

**4) First-review cognitive-load reduction in operator guidance**
- **Status:** shipped (2026-06-27).
- **Implementation summary:** `CorePilotNextStepsCard` now renders one shared 5-step checkpoint strip (`intake -> execute -> commit -> export -> sponsor-ready`) across no-run/has-run/committed states, with deep links and concrete "Next action" copy for missing prerequisites.
- **Validation evidence:** `archlucid-ui/src/components/CorePilotNextStepsCard.test.tsx` updated with checkpoint-strip assertions for no-run, has-run, and committed edge states.
- **Affected qualities:** 6, 8, 10.
- **Classification:** V1.
- **Rescore impact:** Time-to-Value +1, Executive / Operator Comprehension +1, and Adoption Friction +1; `(A)` headline readiness rises from **80.68%** to **80.91%**.

### Tier 3 - Hold For Reassessment

**5) Frontier-AI baseline benchmark program**
- **Status:** shipped (2026-06-27).
- **Implementation summary:** `archlucid pilot frontier-ai-baseline` validates the fixture pack, parses the rolling scoreboard, computes cohort guardrails, and emits JSON/Markdown reports with PASS/WARN/FAIL verdicts; `--init-scoreboard` seeds `artifacts/bakeoff/scoreboard/frontier-ai-scoreboard.md` from the template.
- **Validation evidence:** `ArchLucid.Cli.Tests/FrontierAiBaselineRunnerTests.cs` covers scoreboard parsing, initialization warnings, healthy cohort pass, and anti-claims failure paths.
- **Affected qualities:** 1, 2, 5.
- **Classification:** validation first (engineering half shipped; live bakeoff sessions remain GTM **M-43**).
- **Rescore impact:** Decision-Changing Insight Density +1, Differentiability +1, and AI / Agent Readiness +1; `(A)` headline readiness rises from **80.91%** to **81.27%**.

**6) ITSM pull-forward decision gate**
- **Status:** shipped (2026-06-27).
- **Implementation summary:** `archlucid pilot itsm-pull-forward-gate` evaluates CONNECTOR_PULL_FORWARD_DECISION.md triggers from paid-pilot ledgers and optional evidence JSON, verifies V1 outbound ITSM seams in-repo, optionally probes `GET /v1/integrations/itsm/health`, and emits HOLD/WATCH/PULL_FORWARD with JSON/Markdown reports.
- **Validation evidence:** `ArchLucid.Cli.Tests/ItsmPullForwardRunnerTests.cs` covers default HOLD, two-trigger PULL_FORWARD, and connector-gap ledger aggregation; template at `fixtures/itsm/connector-pull-forward-evidence.template.json`.
- **Affected qualities:** 10, 8.
- **Classification:** V1 decision gate (V1.1 connector build remains owner-gated).
- **Rescore impact:** Executive / Operator Comprehension +1 and Adoption Friction +1; `(A)` headline readiness rises from **81.27%** to **81.40%**.

**7) Procurement objection replay drills (non-engineering)**
- **Why it matters:** explicit conversion bottlenecks are procurement narrative + proof confidence.
- **Expected impact:** executive purchase probability.
- **Affected qualities:** 7, 4.
- **Evidence:** trust artifacts are strong but need repeated real objection handling evidence.
- **Actionability:** medium.
- **Design Uncertainty Reduced:** 1/10
- **Market Uncertainty Reduced:** 8/10
- **Classification:** validation first

**8) Citation integrity sampler for representative committed runs**
- **Status:** shipped (2026-06-27).
- **Implementation summary:** `archlucid pilot citation-integrity` deterministically samples bounded committed runs (offline fixtures or `--include-api`), validates citation/evidence fields for Cost/Compliance/Critic claim classes, and emits PASS/WARN/FAIL with run-level evidence pointers as JSON + Markdown; non-zero exit when `--fail-threshold` is exceeded.
- **Validation evidence:** `ArchLucid.Cli.Tests/CitationIntegrityRunnerTests.cs` covers sampler selection, rule evaluation, and pass/warn/fail fixture bundles under `fixtures/citation-integrity/`.
- **Affected qualities:** 4, 7.
- **Classification:** V1 engineering.
- **Rescore impact:** Correctness & Evidence Integrity +1 and Proof-of-ROI Readiness +1; `(A)` headline readiness rises from **81.40%** to **81.61%**.

**Cursor prompt**
```text
Current problem:
Citation rules exist, but we do not have a lightweight recurring sampler that spot-checks representative committed runs for citation completeness and evidence trace consistency.

Desired behavior:
Add a deterministic citation-integrity sampler that selects a bounded set of committed runs, validates citation fields for key claim classes, and emits PASS/WARN/FAIL with run-level evidence pointers.

Scope boundaries:
- Reuse existing manifest/finding/evidence read paths and contracts.
- Keep checks deterministic and offline-capable.
- Do not add a new policy engine.

Acceptance criteria:
- One command produces machine-readable and markdown outputs.
- Results identify runId, failing claim category, and missing/weak citation reason.
- Non-zero exit when fail threshold is exceeded.

Tests to add/update:
- Unit tests for sampler selection and rule evaluation.
- Integration test with fixtures covering pass/warn/fail outcomes.

Non-goals:
- LLM-based claim adjudication.
- Any mutation of committed review artifacts.
```

**9) ROI headline/per-system explanation hardening**
- **Status:** shipped (2026-06-27).
- **Implementation summary:** added canonical `fixtures/roi/roi-sponsor-facing-scope-labels.v1.json` mirrored in UI data; `roi-sponsor-scope-labels.ts` and `roi-disposition-training-copy.ts` import manifest fallbacks; executive markdown export and buyer-decision brief use the same scope labels and non-additivity caveat; `check_roi_surface_consistency.py` and `RoiScopeLabelManifestParityTests` guard drift.
- **Validation evidence:** `ArchLucid.Application.Tests/Roi/RoiScopeLabelManifestParityTests.cs`, `archlucid-ui/src/lib/roi-sponsor-scope-labels.test.ts`, `archlucid-ui/src/lib/executive-summary-markdown.test.ts`, and `ArchLucid.Cli.Tests/SponsorPacketBuyerDecisionBriefBuilderTests.cs`.
- **Affected qualities:** 7, 8.
- **Classification:** V1 engineering.
- **Rescore impact:** Proof-of-ROI Readiness +1 and Executive / Operator Comprehension +1; `(A)` headline readiness rises from **81.61%** to **81.78%**.

**Cursor prompt**
```text
Current problem:
The disposition-aware portfolio headline and per-system rows are intentionally non-additive, but explanatory labels can drift across API, UI, and exported artifacts.

Desired behavior:
Centralize and enforce one canonical explanation string set for ROI scope semantics so every surface consistently labels headline basis, per-system scope, and freshness assumptions.

Scope boundaries:
- Reuse existing ROI services and response contracts where possible.
- Prefer shared constants/helpers over duplicated copy.
- Do not alter ROI math.

Acceptance criteria:
- API, UI, and export text all use the same explanation sources.
- Snapshot/contract tests fail if explanation semantics drift.
- Existing disposition-aware totals remain unchanged.

Tests to add/update:
- Service tests for explanation payload fields.
- UI rendering tests for canonical labels.
- Export text tests for non-additivity caveat presence.

Non-goals:
- New pricing models.
- New financial metrics.
```

**10) Tenant-isolation negative-test bundle for pilot readiness**
- **Status:** shipped (2026-06-27).
- **Implementation summary:** `archlucid pilot tenant-isolation-negative-test` runs scoped cross-tenant read probes (run detail, ROI, provenance, artifacts, export, list exclusion) with correlation IDs and emits a deny-matrix as JSON + Markdown; offline fixture replay validates aggregator logic; live mode requires `--run-id` under primary scope plus alternate tenant headers.
- **Validation evidence:** `ArchLucid.Cli.Tests/TenantIsolationNegativeTestRunnerTests.cs` covers deny aggregation, fixture replay, and stubbed two-tenant integration; ship-gate Gate 6 embeds the same live probe catalog (TB-411).
- **Affected qualities:** 9, 10, 4.
- **Classification:** V1 engineering.
- **Rescore impact:** Runtime & First-Review Reliability +1, Adoption Friction +1, and Correctness & Evidence Integrity +1; `(A)` headline readiness rises from **81.78%** to **82.02%**.

**Cursor prompt**
```text
Current problem:
Tenant isolation is architecturally clear, but pilot readiness evidence often lacks a standardized negative-test artifact proving cross-tenant access is denied.

Desired behavior:
Add a repeatable tenant-isolation negative-test bundle to pilot/readiness flows that runs scoped cross-tenant probes and records expected-deny outcomes with correlation IDs.

Scope boundaries:
- Reuse existing auth/scope enforcement and diagnostic endpoints.
- Keep it non-destructive and non-production-invasive.
- No new authorization model changes.

Acceptance criteria:
- Command outputs a concise deny-matrix with probe name, expected status, observed status, and correlation IDs.
- Bundle integrates with readiness evidence output.
- Fail when any cross-tenant probe unexpectedly succeeds.

Tests to add/update:
- Unit tests for probe result aggregation.
- Integration test with two scoped tenants asserting deny behavior.

Non-goals:
- Pen-testing automation suite.
- Changes to tenant isolation architecture itself.
```

**11) Principal-architect return-trigger telemetry pack**
- **Status:** shipped (2026-06-27).
- **Implementation summary:** `archlucid pilot return-trigger-telemetry` aggregates sanitized principal-architect dismissal, reuse, and return-trigger JSON logs from a ledger directory, applies R1–R8 trigger taxonomy guardrails, and emits cohort metrics plus PASS/WARN/FAIL checks as JSON + Markdown; offline fixture pack validates parser and aggregator logic.
- **Validation evidence:** `ArchLucid.Cli.Tests/ReturnTriggerTelemetryRunnerTests.cs` covers multi-schema parsing, guardrail evaluation, default fixture PASS, and synthetic fail cohort; fixtures under `fixtures/principal-architect/return-trigger-sessions/`.
- **Affected qualities:** 1, 6, 10.
- **Classification:** validation first.
- **Rescore impact:** Decision-Changing Insight Density +1, Time-to-Value +1, and Adoption Friction +1; `(A)` headline readiness rises from **82.02%** to **82.30%**.

**12) Buyer-proof evidence ledger normalization**
- **Status:** shipped (2026-06-27).
- **Implementation summary:** `archlucid pilot buyer-proof-evidence-ledger` normalizes heterogeneous proof artifacts (go-no-go summary, decision ledger, paid-pilot ledger row, proof-package completeness) into one canonical sponsor-send completion matrix with PASS/WARN/FAIL slot verdicts and JSON + Markdown output; offline fixture pack validates parser and normalizer logic.
- **Validation evidence:** `ArchLucid.Cli.Tests/BuyerProofEvidenceLedgerRunnerTests.cs` covers mixed-artifact parsing, required-slot normalization, default fixture PASS/WARN, and synthetic fail proof pack; fixtures under `fixtures/buyer-proof-evidence/sample-proof-pack/`.
- **Affected qualities:** 3, 7, 8.
- **Classification:** validation first.
- **Rescore impact:** Governed Review Integrity +1, Proof-of-ROI Readiness +1, and Executive / Operator Comprehension +1; `(A)` headline readiness rises from **82.30%** to **82.60%**.

**13) Decision-owner accountability scoreboard for pilots**
- **Status:** shipped (2026-06-27) — engineering half; live buyer-side owner validation remains GTM field execution.
- **Implementation summary:** `archlucid pilot decision-owner-scoreboard` ingests `pilot-decision-ledger.v1` rows with buyer-side `decisionOwner`, `ownerOutcome`, optional `remediationDueUtc`, and ITSM refs; derives accountability statuses (`owned-and-resolved` / `owned-pending` / `owned-overdue` / `unowned` / `not-applicable`); emits PASS/WARN/FAIL closeout verdict plus operator and buyer-safe sponsor Markdown from one canonical model.
- **Validation evidence:** `ArchLucid.Cli.Tests/DecisionOwnerScoreboardRunnerTests.cs` covers owner-field parsing, accountability derivation, default fixture PASS/WARN, and synthetic unowned/overdue FAIL; fixtures under `fixtures/decision-owner-scoreboard/sample-ledgers/`; template extended at `docs/go-to-market/templates/pilot-decision-ledger.template.json`.
- **Affected qualities:** 1, 2, 3.
- **Classification:** validation first (engineering half shipped).
- **Rescore impact:** Decision-Changing Insight Density +1, Differentiability / Defensibility vs Frontier AI +1, and Governed Review Integrity +1; `(A)` headline readiness rises from **82.60%** to **82.99%**.

**14) Per-tenant Jira/ServiceNow connector credentials (TB-392)**
- **Status:** shipped (2026-06-27).
- **Implementation summary:** `TenantItsmConnectorConnections` SQL table stores provider, instance URL, auth username, and Key Vault secret **names** only; `GET/POST/DELETE /v1/integrations/itsm/connections/{provider}` with `ReadAuthority`/`ExecuteAuthority`; `ItsmTenantConnectorCredentialResolver` resolves outbound API tokens and inbound webhook secrets via `ISecretProvider` at execution time with deployment-wide fallback behind `RequireTenantScopedCredentials` / `AllowDeploymentWideWebhookSecrets` for single-tenant pilots; outbound create, health probe, correlation URL builder, and tenant-scoped inbound webhook routes consume the resolver.
- **Validation evidence:** `TenantItsmConnectorConnectionsIntegrationTests`, `ItsmTenantConnectorCredentialResolverTests`, `TenantItsmConnectorConnectionUpsertValidationTests`, and updated ITSM outbound test fixtures.
- **Affected qualities:** 3, 4.
- **Classification:** V1 engineering.
- **Rescore impact:** Governed Review Integrity +1 and Correctness & Evidence Integrity +1; `(A)` headline readiness rises from **82.99%** to **83.24%**.

**15) Tenant ITSM outbound settings write API + admin UI (TB-393)**
- **Status:** shipped (2026-06-27).
- **Implementation summary:** `GET/PUT /v1/integrations/itsm/settings` with `ReadAuthority`/`ExecuteAuthority`; upsert persistence for Jira project key override, info-severity send toggle, issue-type map JSON, and ServiceNow CMDB auto-create; wired into outbound create and health probe; unified operator hub at `/integrations/itsm` mirrors Teams layout with per-tenant connector references (TB-392) and tenant override forms.
- **Validation evidence:** `TenantItsmOutboundSettingsIntegrationTests`, `ItsmOutboundIssueCreationServiceTests` (tenant project key override), `ItsmIntegrationPageClient.test.tsx`, and `TenantItsmOutboundSettingsUpsertValidationTests`.
- **Affected qualities:** 8, 10.
- **Classification:** V1 engineering.
- **Rescore impact:** Executive / Operator Comprehension +1 and Adoption Friction +1; `(A)` headline readiness rises from **83.24%** to **83.37%**.

**16) Durable async ITSM outbound ticket creation (TB-394)**
- **Status:** shipped (2026-06-27).
- **Implementation summary:** `Integrations:ItsmOutbound:DurableAsyncCreateEnabled` (default true) enqueues `ItsmOutboundCreateWorkUnit` on `IBackgroundJobQueue` with configurable `AsyncCreateMaxRetries`; `POST /v1/integrations/itsm/outbound/issues` returns **202 Accepted** + job id when durable mode is on; worker executes create, correlation persistence, and audit via `BackgroundJobWorkUnitExecutor`; operators poll `GET /v1/jobs/{jobId}` and download JSON result; UI create flows poll until terminal state; synchronous path preserved when durable mode is disabled (local smoke).
- **Validation evidence:** `ItsmOutboundCreateJobProcessorTests`, `BackgroundJobWorkUnitExecutorTests` (ITSM work unit), `BackgroundJobWorkUnitJsonTests`, `ItsmOutboundIssuesEndpointIntegrationTests` (202 async path).
- **Affected qualities:** 9, 10.
- **Classification:** V1.1 engineering.
- **Rescore impact:** Runtime & First-Review Reliability +1 and Adoption Friction +1; `(A)` headline readiness rises from **83.37%** to **83.49%**.

**17) Finding assignee + general remediation due date (TB-395)**
- **Status:** shipped (2026-06-27).
- **Implementation summary:** `AssignedToUserId` and `RemediationDueUtc` on `Finding` + `FindingRecords` (migration 262); `PUT /v1/findings/{findingId}/remediation-assignment` with audit `FindingRemediationAssignmentUpdated`; exposed on inspect and architecture risk register; outbound Jira/ServiceNow create maps assignee/due when configured; finding inspect governance panel edit UI.
- **Validation evidence:** `ItsmOutboundVendorRemediationFieldsTests`, `ItsmFindingAuthorityPayloadMapperConformanceTests`, `FindingRemediationAssignmentEndpointTests`.
- **Affected qualities:** 3, 4.
- **Classification:** V1.1 engineering.
- **Rescore impact:** Governed Review Integrity +1 and Correctness & Evidence Integrity +1; `(A)` headline readiness rises from **83.49%** to **83.74%**.

**18) Inbound ITSM disposition sync (TB-396)**
- **Status:** shipped (2026-06-27).
- **Implementation summary:** Optional `JiraStatusDispositionMap` and `ServiceNowStateDispositionMap` on `Integrations:ItsmInbound`; inbound webhooks still update `HumanReviewStatus` by default; when a disposition map hits, `ItsmInboundDispositionSync` records disposition via `FindingDispositionService` with integration actor and skips when latest disposition is unchanged (loop guard); sync audit payloads include disposition fields.
- **Validation evidence:** `ItsmInboundDispositionSyncTests`, `ItsmInboundExternalStatusMapperTests`, extended `ItsmInboundWebhookSyncServiceTests`.
- **Affected qualities:** 3, 4.
- **Classification:** V1.1 engineering.
- **Rescore impact:** Governed Review Integrity +1 and Correctness & Evidence Integrity +1; `(A)` headline readiness rises from **83.74%** to **83.99%**.

**19) `IExternalTicketConnector` plugin boundary (TB-397)**
- **Status:** shipped (2026-06-27).
- **Implementation summary:** `IExternalTicketConnector` + registry with Jira/ServiceNow implementations; `ItsmOutboundIssueCreationService` delegates create to registered connectors; `ItsmExternalTicketUrlBuilder` resolves browse URLs via registry; architecture test blocks API controllers from referencing vendor HTTP client types directly.
- **Validation evidence:** `ExternalTicketConnectorRegistryTests`, `ExternalTicketConnectorApiBoundaryArchitectureTests`, existing outbound conformance/integration suites via `ItsmOutboundConnectorTestFixture.IssueCreationService`.
- **Affected qualities:** 2, 4.
- **Classification:** V2 engineering prerequisite (shipped ahead of full enterprise connector TB-398).
- **Rescore impact:** Differentiability / Defensibility +1 and Correctness & Evidence Integrity +1; `(A)` headline readiness rises from **83.99%** to **84.24%**.

**20) Automated AWS polling (Tier 2) (TB-402)**
- **Status:** shipped (2026-06-27).
- **Implementation summary:** `Integrations.AwsExtractor` hosted client (Azure MI OIDC → STS AssumeRoleWithWebIdentity → Resource Explorer search → schema v1 ZIP); `TenantAwsConnectionRecords` persistence; `POST/GET/DELETE /v1/aws-extractor/connections`; `POST /v1/admin/aws-extractor/hosted/run`; leader-elected `AwsExtractorAutoPullHostedService` (`CloudPolling:Aws`, default off); `/settings/cloud-connections` AWS section; audit events `CloudConnection.AwsConnected` / `AwsPolled` / `AwsDisconnected`; trust-center AWS Tier 2 posture; Terraform module `infra/terraform-hosted-prod/modules/aws-extractor/`.
- **Validation evidence:** `HostedAwsExtractorRunServiceTests`, `AwsTier2ConnectionServiceTests`, `AwsInventoryZipPackagerTests`, `CloudConnectionsPageClient.test.tsx` (Azure wizard regression retained).
- **Affected qualities:** 6, 10.
- **Classification:** V1.1 engineering.
- **Rescore impact:** Time-to-Value +1 and Adoption Friction +1; `(A)` headline readiness rises from **84.24%** to **84.39%**.

**21) Automated GCP polling (Tier 2) (TB-403)**
- **Status:** shipped (2026-06-27).
- **Implementation summary:** `Integrations.GcpExtractor` hosted client (Azure MI OIDC → GCP Workload Identity Federation → service-account impersonation → Cloud Asset Inventory → schema v1 ZIP); `TenantGcpConnectionRecords` persistence; `POST/GET/DELETE /v1/gcp-extractor/connections`; `POST /v1/admin/gcp-extractor/hosted/run`; leader-elected `GcpExtractorAutoPullHostedService` (`CloudPolling:Gcp`, default off); `/settings/cloud-connections` GCP section; audit events `CloudConnection.GcpConnected` / `GcpPolled` / `GcpDisconnected`; trust-center GCP Tier 2 posture; Terraform module `infra/terraform-hosted-prod/modules/gcp-extractor/`.
- **Validation evidence:** `HostedGcpExtractorRunServiceTests`, `GcpTier2ConnectionServiceTests`, `GcpInventoryZipPackagerTests`, `CloudConnectionsPageClient.test.tsx` (Azure/AWS/GCP connect affordances).
- **Affected qualities:** 2, 5.
- **Classification:** V1.1 engineering.
- **Rescore impact:** Differentiability / Defensibility +1 and AI / Agent Readiness +1; `(A)` headline readiness rises from **84.39%** to **84.62%**.

**22) Buyer-facing route aliases (TB-399)**
- **Status:** shipped (2026-06-27).
- **Implementation summary:** Canonical `/signed-records`, `/signed-records/{manifestId}`, and `/reviews/{runId}/signed-record` paths with permanent redirects from legacy manifest segments; internal `Link`/`href` builders, breadcrumbs, help copy, and E2E golden-path helpers migrated; App Router files under `app/(operator)/manifests/` unchanged via rewrites.
- **Validation evidence:** `signed-records-paths.ts`, `next.config.ts` redirect/rewrite matrix, `breadcrumb-map.test.ts`, `buyer-safe-review-navigation.test.ts`, `help-product-language.test.ts`, `buyer-golden-path.ts` URL patterns.
- **Affected qualities:** 8, 10.
- **Classification:** V1.1 engineering.
- **Rescore impact:** Executive / Operator Comprehension +1 and Adoption Friction +1; `(A)` headline readiness rises from **84.62%** to **84.75%**.

**23) Advisory recommendation source-evidence links (TB-400)**
- **Status:** shipped (2026-06-27).
- **Implementation summary:** `SourceEvidenceLinksJson` on `RecommendationRecords` (migration **265**); `RecommendationSourceEvidenceLinksComposer` derives `{ kind: finding | manifestSection, id }` from supporting-id arrays at persist; `RecommendationRecordResponse.sourceEvidenceLinks` on list/action endpoints; `AdvisoryScansContent` renders navigable finding/manifest-section links.
- **Validation evidence:** `AdvisoryControllerListRecommendationsIntegrationTests.ListRecommendations_after_improvements_includes_finding_source_evidence_links`, `RecommendationSourceEvidenceLinksComposer`, UI `recommendation-source-evidence-links.ts`.
- **Affected qualities:** 3, 4.
- **Classification:** V1.1 engineering.
- **Rescore impact:** Governed Review Integrity +1 and Correctness & Evidence Integrity +1; `(A)` headline readiness rises from **84.75%** to **85.00%**.

**24) Operator nav ↔ URL prefix policy + CI drift guard (TB-404)**
- **Status:** shipped (2026-06-28).
- **Implementation summary:** Canonical prefix policy per nav group in `NAV_CONFIG_CONTRACT.md`; typed exception registry (`nav-route-namespace-exceptions.ts`) for 22 intentional cross-namespace hrefs; prefix matcher (`nav-route-namespace-policy.ts`); Vitest drift guard (`nav-route-namespace.test.ts`) fails when new sidebar links drift without registry update. Route moves remain TB-405–408.
- **Validation evidence:** `nav-route-namespace.test.ts` (5 cases — alignment, registry href presence, non-empty reasons, no dupes, full cross-namespace coverage).
- **Affected qualities:** 8, 10.
- **Classification:** V1.1 engineering (policy + guard; no route moves).
- **Rescore impact:** Executive / Operator Comprehension +1 and Adoption Friction +1; `(A)` headline readiness rises from **85.00%** to **85.13%**.

**25) Governance route tree consolidation (TB-405)**
- **Status:** shipped (2026-06-28).
- **Implementation summary:** Canonical `/governance/policy-packs`, `/governance/resolution`, `/governance/audit`, `/governance/alerts`; permanent redirects from legacy paths; policy packs list promoted to `governance/policy-packs/page.tsx`; rewrites reuse existing audit/alerts/resolution App Router trees; nav, breadcrumbs, command palette, deep links, and E2E paths migrated via `governance-route-paths.ts`.
- **Validation evidence:** `governance-route-paths.test.ts`, `nav-config.structure.test.ts` (governance prefix invariant), `breadcrumb-map.test.ts`, `policy-packs-deep-link.test.ts`, E2E smoke/accessibility path updates.
- **Affected qualities:** 8, 10.
- **Classification:** V1.1 engineering.
- **Rescore impact:** Executive / Operator Comprehension +1 and Adoption Friction +1; `(A)` headline readiness rises from **85.13%** to **85.26%**.

**26) Administration route namespace reconciliation (TB-406)**
- **Status:** shipped (2026-06-28).
- **Implementation summary:** Canonical `/settings/users`, `/settings/security-trust`, `/settings/support`; permanent redirects from `/admin/users`, `/workspace/security-trust`, `/admin/support`; **Recurrence schedules** nav moved from Administration to Governance; `operator-admin` prefix policy narrowed to `/settings` only; path helpers in `settings-admin-route-paths.ts`; layer resolution honors legacy bookmarks via redirect matchers in `getLayerForRoute.ts`.
- **Validation evidence:** `settings-admin-route-paths.test.ts`, `nav-config.structure.test.ts` (Administration `/settings/*` invariant + recurrence in governance), `nav-route-namespace.test.ts`, `getLayerForRoute.test.ts`, `nav-shell-visibility.test.ts`, E2E accessibility path updates.
- **Affected qualities:** 8, 10.
- **Classification:** V1.1 engineering.
- **Rescore impact:** Executive / Operator Comprehension +1 and Adoption Friction +1; `(A)` headline readiness rises from **85.26%** to **85.39%**.

**27) Integrations cross-namespace routes + ITSM redirect hygiene (TB-407)**
- **Status:** shipped (2026-06-28).
- **Implementation summary:** Canonical `/integrations/cloud-connections` with permanent redirect from `/settings/cloud-connections`; removed duplicate **ITSM** nav href (Integration readiness at `/integrations/operations` is the hub); deleted `/settings/webhooks` redirect-only page; permanent `/integrations/itsm` → `/integrations/operations` redirect; removed cloud-connections TB-404 exception; `integrations-nav-paths.ts` path helpers; route-tier CI registry alignment.
- **Validation evidence:** `integrations-nav-paths.test.ts`, `nav-config.structure.test.ts` (integrations `/integrations/*` invariant), `nav-route-namespace.test.ts`, `breadcrumb-map.test.ts`, `getLayerForRoute.test.ts`.
- **Affected qualities:** 8, 10.
- **Classification:** V1.1 engineering.
- **Rescore impact:** Executive / Operator Comprehension +1 and Adoption Friction +1; `(A)` headline readiness rises from **85.39%** to **85.52%**.

**28) Nav deduplication + semantic path aliases (TB-408)**
- **Status:** shipped (2026-06-28).
- **Implementation summary:** Renamed Internal Operations `/admin/health` nav to **Diagnostics dashboard** (dedupes duplicate **System health** label with `/health`); canonical `/settings/ai-usage` and `/integrations/readiness` with permanent redirects from `/settings/cost-reporting` and `/integrations/operations`; nav hrefs updated; deleted orphan `operate-operations-nav-group-builder.ts`; duplicate-label invariant in `nav-config.structure.test.ts`; `ai-usage-nav-paths.ts` path helpers.
- **Validation evidence:** `ai-usage-nav-paths.test.ts`, `integrations-nav-paths.test.ts`, `nav-config.structure.test.ts` (duplicate label guard), `getLayerForRoute.test.ts`, `test_adoption_batch_5ao.py` orphan guard.
- **Affected qualities:** 8, 10.
- **Classification:** V1.1 engineering.
- **Rescore impact:** Executive / Operator Comprehension +1 and Adoption Friction +1; `(A)` headline readiness rises from **85.52%** to **85.65%**.

**29) Ship-gate Gate 2 citation-integrity probe (TB-409)**
- **Status:** shipped (2026-06-28).
- **Implementation summary:** `ShipGateEvidenceRunner.BuildGate2Async` loads the representative `--run-id` via `CitationIntegrityApiLoader`, evaluates Cost/Compliance/Critic claim classes with bundled `citation_integrity_rules.v1.json`, and emits Gate 2 PASS/FAIL (WARN treated as structural PASS with evidence counts); shared `CitationIntegrityAgentResultParser` dedupes API result parsing with the standalone citation-integrity command.
- **Validation evidence:** `ShipGateEvidenceRunnerTests` covers compliant Gate 2 PASS and missing-citation Gate 2 FAIL; markdown evidence links reference `archlucid pilot citation-integrity --include-api`.
- **Affected qualities:** 4, 9.
- **Classification:** V1 engineering.
- **Rescore impact:** Correctness & Evidence Integrity +1 and Runtime & First-Review Reliability +1; `(A)` headline readiness rises from **85.65%** to **85.84%**.

**30) Ship-gate Gate 5 first-review UI route smoke (TB-410)**
- **Status:** shipped (2026-06-28).
- **Implementation summary:** optional `--ui-base-url` on `archlucid pilot ship-gate-evidence` probes six canonical first-review operator routes from `FIRST_REVIEW_UI_ROUTE_SMOKE_CONTRACT.v1.json` (home, new review, run detail, run signed record, signed-records list, first-review help); Gate 5 PASS/FAIL from HTTP status + error-boundary markers; UNKNOWN when UI origin omitted.
- **Validation evidence:** `FirstReviewUiRouteSmokeProbeTests` covers route pass and error-boundary fail paths; `ShipGateEvidenceOptions` parses `--ui-base-url`.
- **Affected qualities:** 9, 10.
- **Classification:** V1 engineering.
- **Rescore impact:** Runtime & First-Review Reliability +1 and Adoption Friction +1; `(A)` headline readiness rises from **85.84%** to **85.96%**.

**31) Ship-gate Gate 6 tenant-isolation negative-test embed (TB-411)**
- **Status:** shipped (2026-06-28).
- **Implementation summary:** `ShipGateEvidenceRunner.BuildGate6Async` runs `TenantIsolationNegativeTestRunner.RunLiveAsync` for the ship-gate `--run-id` using primary scope on the API client and alternate tenant headers (defaults or `--alternate-tenant-id` / workspace / project overrides); Gate 6 PASS/FAIL from cross-tenant deny-matrix aggregation with probe counts in evidence text.
- **Validation evidence:** `ShipGateEvidenceRunnerTests` covers Gate 6 PASS with stubbed deny responses and Gate 6 FAIL when alternate scope can read the foreign runId; markdown evidence links reference embedded tenant-isolation probes.
- **Affected qualities:** 3, 4.
- **Classification:** V1 engineering.
- **Rescore impact:** Governed Review Integrity +1 and Correctness & Evidence Integrity +1; `(A)` headline readiness rises from **85.96%** to **86.21%**.

**32) Ship-gate Gate 4 export matrix embed (TB-412)**
- **Status:** shipped (2026-06-28).
- **Implementation summary:** `ShipGateEvidenceRunner.BuildGate4Async` probes sponsor Markdown (`GET /v1/pilots/runs/{runId}/first-value-report`), analysis DOCX (`POST /v1/architecture/run/{runId}/analysis-report/export/docx`), and run artifact ZIP (`GET /v1/artifacts/runs/{runId}/export` with ZIP magic-byte validation) from bundled `ship_gate_export_matrix_contract.v1.json`; Gate 4 PASS/FAIL with per-format evidence counts.
- **Validation evidence:** `ShipGateExportMatrixProbeTests` covers pass and ZIP magic-byte fail paths; `ShipGateEvidenceRunnerTests` covers Gate 4 FAIL when DOCX export is missing.
- **Affected qualities:** 4, 7.
- **Classification:** V1 engineering.
- **Rescore impact:** Correctness & Evidence Integrity +1 and Proof-of-ROI Readiness +1; `(A)` headline readiness rises from **86.21%** to **86.42%**.

**33) Ship-gate Gate 1 first-review completion probe (TB-413)**
- **Status:** shipped (2026-06-28).
- **Implementation summary:** `ShipGateEvidenceRunner.BuildGate1Async` evaluates committed-run completion signals from bundled `first_review_completion_contract.v1.json`: Committed status, manifest version, request linkage, execution signals, artifact list, and provenance graph reachability; Gate 1 PASS/FAIL with per-signal evidence counts.
- **Validation evidence:** `FirstReviewCompletionProbeTests` covers pass and provenance fail paths; `ShipGateEvidenceRunnerTests` covers Gate 1 FAIL when provenance graph is missing.
- **Affected qualities:** 6, 9.
- **Classification:** V1 engineering.
- **Rescore impact:** Time-to-Value +1 and Runtime & First-Review Reliability +1; `(A)` headline readiness rises from **86.42%** to **86.59%**.

## 18. Prompt Batching Guidance
- **First batch (strong-model-recommended):** ship-gate evidence harness, tenant-isolation negative-test bundle, and citation-integrity sampler.
- **Second batch (safe-for-Sonnet):** operator first-review checkpoint strip plus ROI explanation hardening.
- **Third batch (safe-for-Composer):** copy/packet consistency and telemetry instrumentation polish after validation findings.

## 19. Model Usage Guidance
- **Composer-safe:** copy cleanup, minor UI text alignment, straightforward status rendering.
- **Sonnet-safe:** contained workflow/UI refinements and small service-layer orchestration updates.
- **Strong-model-recommended:** strategic assessment updates, policy-aware moat evaluation, cross-surface reliability and traceability refactors.
- **Opus-or-Gemini-assessment-recommended:** future full strategic clean-slate reassessment and survivability re-rating after new market evidence.

## 20. Pending Questions For Later
- **Blocks V1**
  - None confirmed yet; unresolved ship-gate unknowns must be tested before asserting full PASS.
- **Blocks V1.1**
  - None in this pass; connector/MCP/commercial sequencing remains backlog-governed.
- **Requires customer validation**
  - Does policy-pack variation change real buyer decisions repeatedly?
  - Do principal architects voluntarily return after first use?
  - Does one executive proof packet survive real procurement challenge?
- **Requires founder decision**
  - Threshold for pulling forward any V1.1 connector depth based on paid pilot evidence.
  - Explicit evidence threshold to claim sustained decision advantage vs frontier-AI-only workflow.

## Appendix A - Author Signal (Qualitative, Non-Headline)
The product demonstrates strong principal-architect judgment in its insistence on policy-aware governance, evidence traceability, and auditability instead of generic AI commentary. The strongest author signal is not feature breadth; it is disciplined emphasis on governed decision infrastructure. The remaining risk is mostly market proof velocity, not conceptual clarity.
