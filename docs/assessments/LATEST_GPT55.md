> **Scope:** Evaluator — canonical strategic release and market readiness assessment prompt (v2).
> **Generated:** 2026-06-26 22:19 EDT (GPT-5.5) — clean-slate weighted readiness pass; product-state grounding per `V1_SCOPE.md`, `V1_DEFERRED.md`, `TRUST_CENTER.md`, and current code inspection.

# 1. Title & Headline

`ArchLucid Assessment – (A) Headline Readiness: 91.63%`

Readiness excludes deferred items: CPA SOC 2 attestation, ISO certification, external pen-test publication, MCP membrane, live commerce un-hold, signed design partner, owner-output GTM cohorts, public plugin marketplace, multi-region active/active, AWS/GCP target analysis, and other items explicitly outside `(A)`. Hosted real mode uses platform-provisioned Azure OpenAI; simulator mode remains the deterministic CI and local pilot execution substrate.

**Source materials inspected:**
- `docs/library/REPO_DIGEST.md`
- `docs/library/V1_SCOPE.md`
- `docs/library/V1_DEFERRED.md`
- `docs/go-to-market/TRUST_CENTER.md`
- `docs/security/SOC2_SELF_ASSESSMENT_2026.md`
- `docs/go-to-market/SOC2_ROADMAP.md`
- `docs/library/ARCHITECTURE_COMPONENTS.md`
- `docs/library/SYSTEM_MAP.md`
- `docs/library/API_CONTRACTS.md`
- `docs/library/CONFIGURATION_REFERENCE.md`
- `docs/go-to-market/DEFAULT_POLICY_PACKS_V1.md`
- `docs/library/AUDIT_COVERAGE_MATRIX.md`
- `.cursor/rules/Assessment-Scope-V1_1.mdc`
- `docs/assessments/LATEST_GPT55.md` §17 shipped ledger only, to avoid duplicate improvement proposals

**Code regions inspected:**
- `ArchLucid.Persistence/Coordination/Compliance/PolicyFilteredComplianceRulePackProvider.cs`
- `ArchLucid.Decisioning/Services/ComplianceFindingEngine.cs`
- `ArchLucid.Application/Governance/PreCommitGovernanceGate.cs`
- `ArchLucid.Application/Roi/ExecutiveRoiSummaryService.cs`
- `ArchLucid.Application/Runs/Orchestration/Pipeline/AuthorityPipelineStagesExecutor.cs`
- `ArchLucid.Application/Integrations/Itsm/Outbound/ItsmOutboundIssueCreationService.cs`
- `ArchLucid.Application/Governance/DefaultPolicyPacks/Bundled/bundled-policy-packs-v1.manifest.json`
- UI/CLI shipped-ledger surfaces found by symbol search: `PolicyPackImpactPreviewPanel`, `AiOutputGovernanceLabel`, `RunDetailDecisionDeltaPanel`, `CompareGovernanceDiffPanel`, `ExecutiveRoiProofStatusStrip`, `ProofPacketCommand`

---

# 2. Scorecard

| # | Quality | Score | Weight | Weighted contribution | Weighted deficiency signal |
|---|---------|------:|-------:|----------------------:|---------------------------:|
| 1 | Decision-Changing Insight Density | 86 | 13 | 11.18 | 1.82 |
| 2 | Differentiability / Defensibility vs Frontier AI | 92 | 13 | 11.96 | 1.04 |
| 3 | Governed Review Integrity | 97 | 13 | 12.61 | 0.39 |
| 4 | Correctness & Evidence Integrity | 94 | 12 | 11.28 | 0.72 |
| 5 | AI / Agent Readiness | 89 | 10 | 8.90 | 1.10 |
| 6 | Time-to-Value | 90 | 10 | 9.00 | 1.00 |
| 7 | Proof-of-ROI Readiness | 94 | 9 | 8.46 | 0.54 |
| 8 | Executive / Operator Comprehension | 91 | 8 | 7.28 | 0.72 |
| 9 | Runtime & First-Review Reliability | 93 | 7 | 6.51 | 0.49 |
| 10 | Adoption Friction | 89 | 5 | 4.45 | 0.55 |
| **Total** |  |  | **100** | **91.63%** | **8.37** |

*(A) Headline Readiness: 91.63%*

**Rescore (2026-06-27): 91.38% → 91.63%.** Effective governance snapshot at commit (#11) — `CommittedEffectiveGovernanceSnapshotCapturer` persists pack assignments, rule-set hash, compliance key count, and conflict count on golden manifests; run detail, compare governance diff, and export README distinguish **policy at commit** from current effective assignments. **Governed Review Integrity +1 (96→97)** and **Correctness & Evidence Integrity +1 (93→94)** — **+0.25%** headline move.

**Prior rescore (2026-06-27): 91.16% → 91.38%.** RAG quality follow-on shipped: (**1**) live-model faithfulness nightly signal (`run_rag_live_model_faithfulness_signal.py` + golden-cohort job) closes Phase B on committed real-mode exemplars; (**3**) golden datasets expanded to **47** retrieval IR cases (all major corpus kinds + tenant isolation) and **33** faithfulness cases (Ask-shaped citations). **AI / Agent Readiness +1 (88→89)** and **Correctness & Evidence Integrity +1 (92→93)** — **+0.22%** headline move.

**Prior rescore (2026-06-27): 91.06% → 91.16%.** Deeper RAG offline program (#10) — **AI / Agent Readiness +1 (87→88)**. Earlier: #8 repeat-pilot reuse (+0.15%); weight-0 GTM tooling for #3/#4/#7 design halves remains valid.

---

# 3. Diagnostic Scores (non-headline — must be reconciled with §2)

These diagnostics do **not** feed the headline.

| Diagnostic | Result | Calibration |
|------------|--------|-------------|
| Decision Advantage Score | **74 / 100** | Reference class: principal architects using frontier AI plus their own standards can produce a useful critique in most serious reviews, but usually lack persistent evidence, policy state, disposition math, and audit packaging. Base rate for "changes a decision AI alone would not" is ~40%. ArchLucid adjusts upward for policy-filtered compliance findings, extractor-backed cost citations, pre-commit block semantics, and ROI disposition. It adjusts downward because generic critic/Ask output remains prompt-replicable and field proof is still thin. |
| Frontier-AI Survival Probability (12-month) | **65%–78%, confidence medium** | Reference class: thin AI workflow wrappers have poor 12-month survival, often below 40%, as models absorb task skill. ArchLucid is not thin: tenant policy assignments, append-only audit, golden manifests, stable `FindingId`, ITSM correlations, and board-pack ROI are durable workflow state. Downward adjustment: if demos sell "better analysis paragraphs," frontier AI catches up quickly. |
| 30-Day Voluntary Usage Probability | **43%–62%, confidence medium-low** | Reference class: voluntary adoption by 10 principal architects for a new governance/review tool is often 25%–35% after 30 days. ArchLucid gets upward adjustment for Tier-1 no-vendor-credential extractor, policy impact preview, decision delta panel, proof-packet CLI, and pre-commit block explainer. It gets downward adjustment for intake/deployment friction, default-off native ITSM create, no public reference proof, and strong existing Claude/GPT/Cursor habits. |
| Executive Purchase Probability | **55%–72%, confidence medium** | Reference class: sales-led architecture governance pilots with plausible ROI and self-attested security convert only when the buyer has governance pain; base rate ~40%–50%. ArchLucid adjusts upward for database-per-tenant isolation, disposition-aware executive ROI, procurement pack, audit trail, SSO/SCIM, and advisory-only Azure ingestion. It adjusts downward for `(B)` procurement friction: no CPA SOC 2, no external pen-test report, and no published reference customer. |

**Reconciliation:** The headline is higher than the diagnostic adoption and purchase probabilities because `(A)` measures in-contract product readiness, not market proof. There is no contradiction: ArchLucid is technically ready for credible pilots while still needing field validation to prove voluntary repeat use and executive purchase.

---

# 4. V1 Ship Gate

| # | Gate | Status | One-line evidence | Fastest resolution path |
|---|------|--------|-------------------|-------------------------|
| 1 | First review completes end to end: create → execute → commit → golden manifest + artifact | **PASS** | `V1_SCOPE.md` defines the path; `SYSTEM_MAP.md` shows `AuthorityRunOrchestrator`; `AuthorityPipelineStagesExecutor` executes context ingestion, graph, findings, decisioning, and artifacts; release-smoke and live E2E are documented gates. | Not needed for this pass; freshest proof is one `scripts/release-smoke.ps1` run against the intended environment. |
| 2 | Representative review contains no hallucinated or uncited policy/evidence citations | **PASS with caveat** | Compliance findings carry rule pack/version/rule ID via `ComplianceFindingEngine`; extractor cost/savings must cite package manifest timestamp/schema; UI now labels governed vs advisory outputs. Caveat: advisory LLM surfaces are not as hard-cited as governed findings. | Run one real-mode ZIP-backed review and audit every cost/policy claim before a buyer demo. |
| 3 | Executive summary / ROI output coherent and not misleading | **PASS** | `ExecutiveRoiSummaryService` uses latest committed run per system, deduped active findings, disposition-aware basis, cost-evidence freshness, and scope labels. | Not needed unless DTO or board-pack copy changes. |
| 4 | Export/package generation works | **PASS** | `V1_SCOPE.md` includes Markdown/DOCX/ZIP export; audit matrix records `RunExported`, board-pack, traceability bundle, sponsor proof pack, and CLI proof-packet surfaces. | Run export smoke against target environment before external demo. |
| 5 | Operator UI does not break during first-review/demo path | **PASS** | Current ledger shows pilot nav profile, 90-minute playbook, decision delta, proof status strip, pre-commit explainer, and live-api/Playwright coverage. | Run the operator smoke on the deployed build selected for demo. |
| 6 | Auth + tenant isolation behave correctly on pilot path | **PASS** | `TRUST_CENTER.md` and `V1_SCOPE.md` document database-per-tenant catalogs, OIDC/SAML/API key/SCIM; API contract documents ambient scope and RBAC. | Run tenant-isolation and auth negative-path smoke on the pilot host. |

**Ship gate verdict:** no FAIL. The score is not capped. This assessment did not rerun the release smoke; the PASS calls are repo-evidenced and should be refreshed before external shipment.

---

# 5. Executive Summary

**(A) Overall headline readiness:** ArchLucid is ready for serious sales-led V1 pilots. The product is not merely an AI architecture chatbot: policy packs are scoped and merged, compliance rule evaluation is filtered by effective governance, findings preserve rule identity, pre-commit can block, audit is append-only and broad, ROI has explicit disposition semantics, and remediation can create Jira/ServiceNow tickets with durable correlation.

**(B) Procurement / market realism (weight 0):** Enterprise procurement remains materially harder than product readiness. The trust center is honest: SOC 2 is a self-assessment and roadmap, CPA attestation is not issued, and external pen testing is planned/backlog rather than complete. This should not reduce `(A)`, but it will reduce conversion probability in strict RFPs.

**Commercial picture:** The V1 motion is sales-led: pricing, order form, TEST-mode trial wiring, procurement pack, proof packet, and demo paths exist. The compelling story is strong for pilots; purchase proof is still unvalidated without reference packets from real or sanitized deployments. Live Stripe/Marketplace un-hold is V1.1 owner-only and is not a V1 blocker.

**Enterprise picture:** The enterprise story is credible for a pilot: database-per-tenant isolation, SSO/SCIM, Key Vault posture, advisory-only Terraform, no default vendor Azure access, correlation IDs, audit export, and DPA/procurement documents. Hesitation will concentrate on third-party assurance and operational proof, not core architecture.

**Engineering picture:** The core is robust. The authority pipeline is in Application, SQL remains authoritative, API contracts are documented, default policy packs are seeded, and audit coverage has CI anchors. The fragility risk is breadth: many surfaces exist, so demo discipline matters more than adding features.

**Frontier-AI picture:** ArchLucid becomes more valuable as base models improve only if it captures better model output into governed policy/evidence/audit records; if positioned as smarter prose, frontier AI commoditizes it.

---

# 6. Deferred Scope Uncertainty

| Deferred scope | Why deferred | Safe for V1? | Existing V1 seam / placeholder |
|----------------|--------------|--------------|--------------------------------|
| First-party Jira/ServiceNow bidirectional sync, Confluence, Slack/Teams, webhooks | Buyer-contract V1.1 sequencing and support surface | Yes | V1 outbound create, `ItsmFindingCorrelations`, ITSM health/inbound contracts, audit events, copy/export fallback |
| MCP membrane | V1.1 agent integration surface, not V1 pilot contract | Yes | REST, CLI, operator UI, non-GA retrieval HTTP bridge |
| SOC 2 CPA / ISO / third-party pen test | Organizational budget/vendor program | Yes for `(A)`; material for `(B)` | Self-assessment, roadmap, owner-conducted testing, CAIQ/SIG/DPA, templates |
| Live commerce un-hold | Owner-only Partner Center/Stripe/DNS activities | Yes | TEST-mode trial, pricing page, order form, production safety rules |
| AWS/GCP target analysis | V1.1 cloud analysis expansion | Yes for Azure-focused V1 | Terraform/inventory patterns and V1.1 contract |
| Multi-region active/active | V1.1 / later topology commitment | Yes | Single-region posture, RTO/RPO docs, optional failover IaC |
| Automated tenant-erasure pipeline | V2 privacy automation | Yes | Tenant deletion/offboarding and platform audit events |

---

# 7. Weighted Quality Assessment (detail)

Ordered by weighted deficiency signal.

### 1. Decision-Changing Insight Density
- **Score · Weight · Contribution · Deficiency:** 86 · 13 · 11.18 · **1.82**
- **Justification:** The highest-value insight path is not generic LLM critique; it is policy-scoped, evidence-backed findings that survive a governance workflow. `PolicyFilteredComplianceRulePackProvider` loads effective tenant/workspace/project governance content and filters the compliance rule pack; `ComplianceFindingEngine` emits findings with rule pack/version/rule ID and graph-node explainability. Extractor-backed cost/citation contracts and decision-delta UI strengthen "I did not think of that." The limitation is field proof: the repository shows the machinery, but not enough real buyer examples proving non-obvious decisions changed.
- **Tradeoffs:** More deterministic rules improve repeatability but can feel less magical than frontier AI prose. More LLM freedom may increase surprise but weakens evidence integrity.
- **Recommendations:** Lead pilots with one policy toggle or stricter pack that changes findings and pre-commit outcome on the same evidence set. Capture before/after decision records as proof, not just screenshots.
- **Classification:** V1, market validation required.
- **Outcomes affected:** Decision-changing insight, 30-day voluntary usage, executive purchase.

### 2. AI / Agent Readiness
- **Score · Weight · Contribution · Deficiency:** 89 · 10 · 8.90 · **1.10**
- **Justification:** Real vs simulator separation is clear; hosted real mode uses platform Azure OpenAI; simulator mode supports deterministic CI. The authority pipeline stages are explicit and inspectable. Agent output quality gates, schema validation, content safety, budget controls, and retrieval configuration are documented. Remaining risk is not "no AI substrate"; it is quality and faithfulness under real-model variability, especially advisory/Ask surfaces.
- **Tradeoffs:** Stronger gates reduce hallucination risk but may make useful early pilots noisier or slower to configure.
- **Recommendations:** Keep simulator as merge truth, but treat one budget-capped real-mode staging smoke with a golden cohort as required evidence before any executive demo.
- **Classification:** V1 with ongoing TB-021 quality validation.
- **Outcomes affected:** Decision-changing insight, survivability against frontier AI.

### 3. Time-to-Value
- **Score · Weight · Contribution · Deficiency:** 90 · 10 · 9.00 · **1.00**
- **Justification:** The first-review path is now shaped by a 90-minute playbook, pilot nav profile, demo review, extractor ZIP validation, decision-delta panel, proof packet, and **repeat-pilot answer reuse** (prior run-spawned elicitation answers pre-fill on the second draft in the same scope). That is materially better than a sprawling enterprise UI. Still, the actual value path involves configuration, evidence capture, request/draft, execution, commit, review, export, and possibly ITSM. A skilled architect can open Claude faster, so ArchLucid must reach "governed package" value quickly.
- **Tradeoffs:** Reducing intake too far weakens evidence quality and policy fit; asking too much makes architects abandon.
- **Recommendations:** Validate the 90-minute claim with three dry runs: one internal operator, one engineer not familiar with the codebase, one target-user proxy.
- **Classification:** V1, market validation required.
- **Outcomes affected:** 30-day voluntary usage, executive purchase.

### 4. Differentiability / Defensibility vs Frontier AI
- **Score · Weight · Contribution · Deficiency:** 92 · 13 · 11.96 · **1.04**
- **Justification:** Differentiability is high because ArchLucid owns durable workflow state: policy assignments, effective governance resolution, persisted findings, pre-commit gating, audit events, ROI disposition, ITSM correlations, and executive/operator packaging. A prompt can imitate the narrative; it cannot reliably reproduce organization-wide repeatability, scope enforcement, evidence lineage, audit exports, and ticket correlation without rebuilding the product.
- **Tradeoffs:** Governance workflow increases friction. If users perceive it as process theater, defensibility works against adoption.
- **Recommendations:** Make the first demo a governed workflow demo: policy impact preview → same evidence → different rule set/finding/gate → audit row/export.
- **Classification:** V1.
- **Outcomes affected:** Governed repeatability, long-term survivability.

### 5. Correctness & Evidence Integrity
- **Score · Weight · Contribution · Deficiency:** 94 · 12 · 11.28 · **0.72**
- **Justification:** Golden manifest, findings snapshots, decision traces, audit events, OpenAPI contracts, extractor citation requirements, and disposition-aware ROI all point in the right direction. Committed packages now carry **`EffectiveGovernanceAtCommit`** metadata so audit/export/compare surfaces can cite **policy at commit** without inferring from current assignments. The shipped governed/advisory labeling is important because it prevents exploratory LLM prose from being mistaken for evidence-backed review-package material. The main correctness risk is mixed-mode user interpretation: advisory Ask/critic output must not be allowed to look as authoritative as governed findings.
- **Tradeoffs:** Hard proof labels can make the product feel conservative, but that conservatism is necessary for enterprise trust.
- **Recommendations:** Keep all buyer-facing outputs visually explicit: governed finding, advisory narrative, illustrative ROI, extractor-backed ROI, disposition-aware headline.
- **Classification:** V1.
- **Outcomes affected:** Governed repeatability, executive purchase.

### 6. Executive / Operator Comprehension
- **Score · Weight · Contribution · Deficiency:** 91 · 8 · 7.28 · **0.72**
- **Justification:** The product now has better progressive disclosure, proof-status strips, decision delta, board-pack evidence labels, help-language cleanup, and first-review guidance. Executives can see ROI/disposition; operators can see findings/audit/export. Remaining cognitive load is inherent in the breadth of Operate: graph, replay, compare, governance, audit, alerts, Ask, ROI, integrations, and policy packs.
- **Tradeoffs:** Hiding advanced surfaces helps first value but may under-show the moat to sophisticated buyers.
- **Recommendations:** Use role-specific demo paths: principal architect gets decision delta + rule trace; executive gets ROI + proof status; governance gets audit + pre-commit.
- **Classification:** V1.
- **Outcomes affected:** Executive purchase, voluntary usage.

### 7. Adoption Friction
- **Score · Weight · Contribution · Deficiency:** 89 · 5 · 4.45 · **0.55**
- **Justification:** Tier-1 extractor avoids vendor credentials, which is a major trust win, but shifts work to the customer. Identity, Key Vault, Azure AI Search for production-like profiles, SQL, and optional ITSM setup remain real friction. Native ITSM create exists but is intentionally default-off in configuration, so remediation handoff may require admin work before it becomes magical. Repeat-pilot answer reuse now removes re-typing of prior MUST answers on subsequent drafts in the same scope.
- **Tradeoffs:** Low-friction vendor access would speed onboarding but violate the trust posture. The secure path is slower and more credible.
- **Recommendations:** Treat pre-pilot readiness as a checklist with named owner/time estimates, not an open-ended setup call.
- **Classification:** V1, validation required; V1.1 for deeper connectors.
- **Outcomes affected:** 30-day voluntary usage, executive purchase.

### 8. Proof-of-ROI Readiness
- **Score · Weight · Contribution · Deficiency:** 94 · 9 · 8.46 · **0.54**
- **Justification:** The ROI model is unusually credible for V1: latest committed run per system, deduped active findings, disposition-aware headline basis, cost-evidence freshness, board-pack parity, sponsor proof pack, and first-value reports. The risk is not implementation absence; it is evidence quality. Savings claims are only as credible as the uploaded cost/inventory package and the buyer's acceptance of assumptions.
- **Tradeoffs:** Conservative ROI labels reduce hype but protect trust.
- **Recommendations:** Do not lead with total dollars unless cost evidence is fresh and extractor-backed. Lead with "decision and remediation basis" when cost evidence is illustrative.
- **Classification:** V1, market validation required.
- **Outcomes affected:** Executive purchase.

### 9. Governed Review Integrity
- **Score · Weight · Contribution · Deficiency:** 97 · 13 · 12.61 · **0.39**
- **Justification:** Policy packs are first-class enough to matter: they are seeded, scoped, assigned, merged, validated, simulated, and used to filter compliance. `PreCommitGovernanceGate` evaluates persisted findings against enabled assignments and thresholds. Committed golden manifests now persist **`EffectiveGovernanceAtCommit`** (pack ids/versions/scope levels, rule-set hash, compliance key count, conflict count, generated UTC) via `CommittedEffectiveGovernanceSnapshotCapturer` at finalize — run detail, compare governance diff, and export README label **policy at commit** separately from current effective assignments. Audit coverage is broad and has no current catalogued core gaps.
- **Tradeoffs:** Re-evaluating old commits under new policies would be useful but must not mutate historical truth.
- **Recommendations:** Validate policy replay as a demo narrative first; build deeper historical replay only after a buyer asks for audit reconstruction beyond current artifacts.
- **Classification:** V1; possible V1.1 hardening only if demanded.
- **Outcomes affected:** Governed repeatability, survivability.

### 10. Runtime & First-Review Reliability
- **Score · Weight · Contribution · Deficiency:** 93 · 7 · 6.51 · **0.49**
- **Justification:** The pipeline is structured, audit has retry on critical paths, export and proof packet surfaces are documented, and live/API smoke coverage exists. Real-mode staging smoke and budget controls reduce hosted LLM risk. I did not rerun tests during this assessment, so the score reflects repo evidence and code inspection, not fresh runtime proof.
- **Tradeoffs:** More live E2E would increase cost/flakiness; too little live E2E risks demo-day surprises.
- **Recommendations:** Before any external demo, run one scoped release smoke plus UI first-review path on the exact deployed environment.
- **Classification:** V1.
- **Outcomes affected:** 30-day voluntary usage.

---

# 8. Top 10 Weaknesses (ranked, most serious first)

1. **Field proof lags engineering proof.** Why it matters: the product is ready, but purchase and repeat-use probabilities depend on observed pilot outcomes. Uncertainty: market. V1 blocker: no. Fastest path: run a proof-packet cohort using authorized sanitized/internal data and record before/after decisions.
2. **The moat is easy to demo badly.** If the first session leads with chat or generic critique, a principal architect will dismiss it as Claude with UI. Uncertainty: market/UX. V1 blocker: no. Fastest path: first five minutes must show policy pack impact, pre-commit outcome, audit, and ROI packaging.
3. **Advisory LLM output can still be mistaken for governed evidence.** Uncertainty: design. V1 blocker: no if labels remain clear. Fastest path: keep governed/advisory labels everywhere and audit buyer packets for unsupported claims.
4. **Time-to-value remains longer than direct frontier AI.** Uncertainty: market. V1 blocker: no. Fastest path: prove the 90-minute first review with three timed dry runs and remove only obstacles observed in those runs.
5. **Procurement assurance is honest but not enough for rigid RFPs.** Uncertainty: market/procurement. V1 blocker: no `(A)`, but deal blocker under `(B)`. Fastest path: use trust-center self-assessment and roadmap; do not start CPA/pen-test work unless buyer demand or owner direction triggers TB-135/TB-136.
6. **Native ITSM create is deployment-gated.** Uncertainty: design and support. V1 blocker: no. Fastest path: test and enable per pilot where Jira/ServiceNow handoff is central; keep copy/export fallback.
7. **Default policy packs may be perceived as decoration until A/B behavior is shown.** Uncertainty: market. V1 blocker: no. Fastest path: show the same review under different effective governance and capture changed findings/gate.
8. **Ask/RAG can be a commodity distraction.** Uncertainty: design. V1 blocker: no. Fastest path: position Ask as secondary exploration, not the product's proof of value.
9. **Enterprise setup requires careful operator choreography.** Uncertainty: implementation/process. V1 blocker: no. Fastest path: pre-pilot checklist with owners for SQL, auth, Key Vault, Azure OpenAI, Azure AI Search, and extractor path.
10. **Principal architect skepticism is rational.** Uncertainty: market. V1 blocker: no. Fastest path: give them a decision they would actually change, not a dashboard tour.

---

# 9. Frontier-AI Analysis

| Major capability | Commodity within 12 months, durable, or more valuable? | Reason | Evidence |
|------------------|---------------------------------------------------------|--------|----------|
| Generic architecture critique | Commodity | Frontier models already do this well from good prompts. | Holistic critic / narrative analysis surfaces are advisory. |
| Architecture Q&A / Ask | Commodity | Retrieval plus chat is widely available. | `AskService`/retrieval exists but is not the moat. |
| Policy-pack-filtered compliance findings | Durable | Requires persisted effective governance, rule keys, scope, and graph. | `PolicyFilteredComplianceRulePackProvider`, `ComplianceFindingEngine`. |
| Pre-commit governance gate | Durable | Requires product workflow and persisted findings/assignments, not one-off analysis. | `PreCommitGovernanceGate`, API conflict contract. |
| Append-only audit and CSV export | More valuable as AI improves | More AI-generated claims increase the need for reconstruction and accountability. | `AUDIT_COVERAGE_MATRIX.md`, `dbo.AuditEvents` append-only posture. |
| Golden manifest / authority chain | Durable | Review package has run-of-record semantics that chat lacks. | `AuthorityPipelineStagesExecutor`, manifest/artifact audit. |
| Disposition-aware executive ROI | Durable | Needs cross-run persisted state, dispositions, cost settings, and labels. | `ExecutiveRoiSummaryService`. |
| ITSM stable finding correlation | Durable | Ticket lifecycle creates organizational memory. | `ItsmOutboundIssueCreationService`, `ItsmFindingCorrelations`. |
| Default policy pack content | Mixed | Content can be generated by frontier AI; scoped assignment and enforcement are durable. | 24 bundled manifest files plus effective governance APIs. |
| Proof packets / board packs | Durable if evidence-backed | Packaging, source labels, and audit slices are workflow artifacts. | CLI proof-packet and board-pack surfaces in ledger/API. |

**Hard-to-reproduce via prompting:** customer-specific policy state; effective governance resolution; persisted findings and stable IDs; golden manifest; append-only audit; role-separated approval and pre-commit behavior; disposition-aware ROI; ITSM correlation; repeatable export package with source labels.

**Easy for frontier AI soon:** polished critique, remediation prose, architecture summaries, policy draft text, code-adjacent explanation, "compare these two docs" analysis, and generic best-practice prioritization.

**Leverage / upside:** stronger base models improve ArchLucid's finding quality, mapping accuracy, summarization, and draft policy creation while ArchLucid retains the enterprise wrapper: policy scoping, evidence capture, audit, decision records, and exports. Better AI makes the review engine sharper at near-zero incremental product engineering cost, while the value of governed records rises.

**Displacement timeline:** one major model release can commoditize much of the unstructured analysis. Reproducing ArchLucid's governed workflow, tenant policy state, audit, ROI, and ITSM memory is a software adoption problem, not a prompt-length problem.

**Final verdict:** ArchLucid is becoming more valuable faster than frontier AI only on governed enterprise workflow. It is losing relative value on generic analysis. The central bet is sound if GTM makes policy/evidence/audit the first-class product.

---

# 10. Policy-Aware Governance Test

1. **Are policy packs first-class objects whose content drives behavior?** Yes. They are seeded as `PlatformDefault`, assigned by scope, merged, validated, simulated, and used to filter compliance rule evaluation.
2. **Can each major finding trace input → evidence → policy/standard → recommendation → decision/disposition → audit?** Mostly. Compliance findings can trace to rule IDs and graph nodes; extractor cost findings can trace to package metadata; dispositions and ITSM correlations are durable. Advisory LLM surfaces are intentionally weaker and must remain labeled.
3. **Would a skilled architect using frontier AI alone reproduce this consistently?** No. They could reproduce the critique, not the repeatable policy state, commit gate, audit export, ROI disposition, and cross-operator workflow.
4. **What is merely AI-generated analysis vs governed enterprise infrastructure?** Critique/Ask/explanation are analysis. Policy assignment, rule-filtered findings, commit blocking, audit, export, ROI basis, and ITSM correlation are infrastructure.
5. **What evidence would prove policy packs are a real moat?** Same input evidence, two different effective policy configurations, materially different findings/priorities/gate outcome, with audit rows proving who changed policy and what package was committed.
6. **Fastest validation path:** run an A/B policy pack pilot on one canonical review: default pack vs stricter customer pack; measure changed findings, changed executive summary, changed pre-commit result, changed remediation owner.
7. **V1 behavior that makes the moat obvious in a demo:** pick a committed run, simulate stricter policy, show the blocked gate and rule-key delta, export the audit slice, and create one ITSM ticket from the persisted finding.

---

# 11. Principal Architect Dismissal Test

**What makes them say "I need this":** seeing a committed review block a risky change because their company's policy pack says so, with a traceable finding, evidence citation, audit row, and remediation ticket they did not have to manually assemble.

**What makes them voluntarily return:** second review comparison that shows a regression or improvement they would not manually track; pre-commit CI starter that prevents architecture drift; sponsor packet that saves a governance meeting.

**What causes immediate dismissal:** a generic AI critique, uncited cost savings, policy claims without rule keys, slow setup with no new decision, or UI that leads with process rather than decision delta.

**Single most likely dismissal trigger and likelihood today:** "This is Claude plus my standards pasted in." Reference class: skeptical principal architects dismiss roughly half of new governance platforms before proof. ArchLucid's governed infrastructure lowers that risk; chat-first demos raise it. Likelihood **32%–45%, confidence medium**.

**Would they believe ArchLucid is materially better than Claude + a good prompt + company standards pasted in?** Individually, not always. Organizationally, yes: Claude can help one architect think; ArchLucid can produce a governed package other operators, auditors, executives, and remediation owners can reuse.

---

# 12. Founder Delusion Check

- **Strongest assumptions with weakest evidence:** buyers will maintain customer-specific policy packs; architects will tolerate workflow in exchange for auditability; first pilots will produce measurable decision deltas.
- **Capabilities that look differentiated but are commodity:** fluent architecture critique, Ask, draft policies, high-level executive summaries.
- **Capabilities that look ordinary but may be the strongest moat:** stable `FindingId`, audit event catalog, database-per-tenant isolation, pre-commit gate, disposition-aware ROI labels.
- **Activities that could burn months without improving the five outcomes:** plugin marketplace, MCP before pilot proof, more default policy-pack categories, graph UI polish, broad integration catalog expansion.
- **If features froze for six months:** run pilots, collect proof packets, refine demo sequencing, prove policy pack A/B decision changes, and validate willingness to pay.
- **Most dangerous attractive distraction:** chasing ecosystem/platform narratives before repeatable buyer proof.
- **Most boring thing that may be the real moat:** audit-ready evidence-to-policy-to-decision records that survive procurement and governance meetings.

---

# 13. Competitive Reality Check & Moat Assessment

Against a skilled architect using frontier AI:

| Dimension | Frontier AI alone | ArchLucid |
|-----------|------------------|-----------|
| Manual critique | Strong and improving | Strong enough, not the main moat |
| Company standards | Can paste into prompt | Persistent scoped assignments |
| Evidence | User-managed files/chat | Ingested packages, manifests, graph, snapshots |
| Repeatability | Depends on operator discipline | Pipeline and package workflow |
| Audit | Chat logs at best | Typed append-only audit and CSV/export |
| Decision workflow | Human follow-up | Commit gate, disposition, approval, ITSM |
| Executive reporting | Prompt-generated deck | ROI service, board pack, proof labels |

**Current moat:** medium-strong workflow moat, medium policy-content moat, weak generic-analysis moat.

**Potential future moat:** strong if buyers adopt policy packs as their architecture control plane and wire pre-commit into CI.

**Weakest moat assumption:** customers will invest enough policy/state configuration to make the product enterprise-specific.

**Most durable moat assumption:** organizations need auditable review packages more than they need smarter one-off advice.

**Probably illusory moat:** "our AI architecture analysis is better."

**Boring-but-durable moat:** scoped policy state plus append-only audit plus stable remediation identity.

**What makes the moat obvious to a buyer:** a before/after policy simulation that changes a commit decision and creates a traceable remediation ticket.

---

# 14. Adoption & Monetization

**30-Day Voluntary Usage (10 principal architects):** strongest positive factor is seeing a decision delta tied to their own policy/evidence. Strongest negative factor is the belief they can get 80% of the insight in Claude faster. Most likely return reason: pre-commit/compare catches a drift. Most likely stop reason: first review feels like process without surprise.

**Executive Purchase:** strongest driver is auditable ROI and governance repeatability. Strongest blocker is assurance/proof: no CPA SOC 2, no external pen-test report, no published reference proof. Minimum proof for paid pilot: one buyer-safe proof packet showing committed review, evidence citations, audit slice, policy trace, disposition-aware ROI, and remediation handoff.

**Why buy ArchLucid instead of more frontier-AI licenses?** Because frontier-AI licenses do not enforce policy, produce a golden manifest, preserve audit records, dedupe portfolio ROI, separate operator/executive workflows, or track remediation across systems. ArchLucid sells governed organizational memory, not only intelligence.

**Top 6 monetization blockers:**

| Blocker | Why blocks payment | Who objects | Evidence that overcomes it | Implementation vs validation |
|---------|-------------------|-------------|-----------------------------|------------------------------|
| No external buyer proof packet | CFO/executive cannot trust ROI yet | Sponsor / finance | Sanitized pilot packet with before/after decision | Validation |
| No CPA SOC 2 | Strict RFP hard stop | Procurement / InfoSec | Self-assessment + roadmap, or buyer exception | Procurement validation |
| No third-party pen-test report | Security diligence friction | CISO / security | Owner-conducted testing + planned TB-136 | Procurement validation |
| "We already have AI" | Budget substitution | CIO / architects | Governance/audit/pre-commit demo | Validation |
| Setup effort | Pilot delay | Platform team | 90-minute proof run and readiness checklist | Validation/process |
| ITSM native create default-off | Remediation handoff friction | Ops / platform | Pre-pilot connector health and fallback export | Process/V1.1 later |

**Top 6 enterprise adoption blockers:**

| Blocker | Pilot vs scale | Affects |
|---------|----------------|---------|
| Identity and production-like config | Pilot | Trust, usability |
| Extractor ZIP execution and upload | Pilot | Time-to-value |
| Policy pack ownership | Scale | Policy alignment |
| Assurance gaps | Scale | Procurement |
| Bidirectional ITSM not V1 | Scale | Process integration |
| Operator surface breadth | Pilot and scale | Cognitive load |

---

# 15. Most Important Truth

**ArchLucid's product is ready enough; the unanswered question is whether buyers value governed architecture records more than faster AI conversations.**

The next decision should not be another broad engineering batch. It should be proof that one customer-like team changes a real decision, repeats the workflow, and can defend the package in front of architecture, security, finance, and procurement.

---

# === DIVIDER: DIAGNOSIS ABOVE / PRESCRIPTION BELOW ===

---

# 16. Stop Doing List

**Top 3 improvements not worth doing before V1:**
1. Building a public extension/plugin marketplace.
2. Pulling MCP membrane work forward before pilot proof.
3. Expanding policy pack count instead of proving policy packs change decisions.

**Top 3 diminishing-returns areas:**
1. More graph visualization polish for first-review demos.
2. More generic holistic-critic features.
3. More export variants before validating current proof packets.

**Top 3 founder behaviors that could delay validation:**
1. Treating a high readiness score as market proof.
2. Re-opening SOC 2 CPA or third-party pen-test as engineering tasks instead of owner/backlog programs.
3. Leading demos with chat or feature breadth instead of policy/evidence/commit/audit.

**Top 3 features that feel enterprise-important but may not improve V1 adoption:**
1. Multi-region active/active.
2. Plugin ecosystem.
3. Broad integration catalog beyond the existing V1 outbound slice.

**ITSM special attention:** The V1 outbound slice is sufficient for pilots if configured: stable `FindingId`, persisted `ItsmFindingCorrelations`, per-tenant settings, health/readiness surfaces, and durable audit events. V1.1 sequencing ServiceNow → Confluence → Jira remains rational. Do not rebuild seams that already exist. Pull forward only if a paying pilot names a specific provider as a purchase blocker.

---

# 17. Top Improvement Opportunities

All six ship gates are PASS and the shipped ledger shows the prior engineering improvement batch is done or held. This section therefore leads with market validation. New engineering should be avoided unless validation exposes a concrete blocker against the five ranked outcomes.

### Tier 1 – Must Fix

**1. Policy-to-decision proof pilot**
- **Tier:** 1
- **Why it matters:** This is the central moat test: does changing policy change findings, decisions, gate outcome, and package narrative?
- **Expected impact:** Moves Decision-Changing Insight Density, Differentiability, Governed Review Integrity, 30-Day Voluntary Usage.
- **Evidence:** Policy pack simulation, compliance rule filtering, decision delta, pre-commit gate, audit export exist.
- **Actionability:** High.
- **Design Uncertainty Reduced:** 3/10
- **Market Uncertainty Reduced:** 9/10
- **Classification:** Validation first.
- **Plan:** Use one canonical architecture review with authorized evidence. Run default pack, then stricter/customer-like pack. Record changed rule keys, finding set, gate outcome, executive summary deltas, and remediation owner. Package the result as a buyer-safe proof packet.
- **Design half (DONE 2026-06-27):** The A/B mechanism is now repeatable and drift-protected. Reusable run-sheet `docs/go-to-market/POLICY_TO_DECISION_PROOF_PILOT_RUNSHEET.md` sequences the shipped demo script (`scripts/demo-policy-pack-delta.ps1` + `POLICY_PACK_DELTA_DEMO_SCRIPT.md`), a deterministic synthetic fixture (`tests/fixtures/policy-ab-demo/policy-ab-demo-fixture.json`), and the proof-packet assembly into one pilot. New regression tests fail if a stricter pack stops adding a compliance rule key or stops flipping the pre-commit gate: backend `ArchLucid.Application.Tests/Governance/PolicyAbDemoRegressionTests.cs` (+ `PolicyAbDemoFixture.cs`) and UI `archlucid-ui/src/lib/policy-ab-demo-fixture.test.tsx`. Reuses the shipped dry-run/simulation endpoints, filter, and diff view; restates none of them.
- **Remainder → GTM V1.1 backlog:** running the pilot on a real/sanitized **authorized** committed run and having a buyer judge that the changed decision matters is the market-execution half. A coding agent cannot perform it; do not treat a green offline rehearsal as buyer validation.
- **(A) scoring impact:** none. The fixture/run-sheet are weight-0 validation tooling and CI drift guards; the headline stays 90.91% (see §2 rescore note). The score moves only when a real policy-to-decision delta changes a real buyer decision.

**Moved out of immediate V1 prescription:** Improvements **2**, **3**, **5**, and **6** are GTM V1.1 backlog work, not current V1 must-fix items — **do not list #5 or #6 in future assessment §17 passes** (track only in `docs/go-to-market/GTM_BACKLOG.md`). **#2** → **M-90**; **#3** → **M-44** (design half shipped 2026-06-27; live cohort remainder under **M-44**); **#5** → **M-91**; **#6** → **M-92**. No V1 engineering or `(A)` headline action remains for #3, #5, or #6.

**4. Executive paid-pilot proof packet — design half shipped; remainder → GTM V1.1 backlog**
- **Tier:** 1
- **Why it matters:** Executive purchase probability depends on a proof artifact, not another feature.
- **Expected impact:** Moves Proof-of-ROI Readiness, Executive Purchase, Comprehension.
- **Evidence:** ROI summary, board pack, proof-packet CLI, audit slice, source labels exist.
- **Actionability:** High.
- **Design Uncertainty Reduced:** 2/10
- **Market Uncertainty Reduced:** 9/10
- **Classification:** Validation first.
- **Design half (DONE 2026-06-27):** Reusable assembly + mock-review instrument `docs/go-to-market/EXECUTIVE_PAID_PILOT_PROOF_PACKET.md` maps all six required elements (ROI assumptions, freshness labels, cited evidence, disposition basis, audit timeline, and **one remediation ticket** via ITSM correlation — the one element the sponsor-packet CLI did not surface) and chains assembly → send gate → mock procurement review (`CONTROLLED_PILOT_OBJECTION_DRILL` / `PROCUREMENT_OBJECTION_PLAYBOOK`). Reuses the existing sponsor-packet CLI, send gates, evidence templates, and demo exemplars; restates none of them.
- **Remainder → GTM V1.1 backlog (`M-37`):** assembling a packet from a real/sanitized **authorized** committed run and running the mock review + real procurement call with human reviewers, then filing the outcome in `validation/PAID_PILOT_EVIDENCE_LEDGER.md`. A coding agent cannot perform it.
- **(A) scoring impact:** none. The assembly/mock-review instrument is weight-0 GTM tooling; the headline stays 90.91% (see §2 rescore note). The score moves only when a real packet survives a real procurement review.

### Tier 2 – High Leverage

**7. Proof-language claim audit — design half shipped (DONE 2026-06-27)**
- **Tier:** 2
- **Why it matters:** One unsupported claim can damage trust more than a missing feature.
- **Expected impact:** Moves Correctness & Evidence Integrity and Executive Purchase.
- **Evidence:** Governed/advisory labels and proof status strips exist.
- **Actionability:** High.
- **Design Uncertainty Reduced:** 3/10
- **Market Uncertainty Reduced:** 5/10
- **Classification:** Validation first.
- **Plan:** Review every buyer-facing proof packet and demo script. Mark each claim as extractor-backed, review-backed, illustrative, self-assessed, or roadmap. Remove unsupported superlatives.
- **Design half (DONE 2026-06-27):** `docs/go-to-market/PROOF_LANGUAGE_CLAIM_AUDIT.md` defines the canonical five-type taxonomy, classifies every buyer-facing proof packet + demo script by dominant claim type, and records a PASS. A new tight superlative regression guard `scripts/ci/check_proof_language_superlatives.py` (scope/terms in `scripts/ci/data/proof_language_audit_scope.v1.json`, tests in `scripts/ci/tests/test_check_proof_language_superlatives.py`) is wired into `run_buyer_surface_strict_guards.py`; it normalizes markdown emphasis and skips caveated lines, so honest "do not promise" rows pass while new unsupported superlatives fail CI. Reuses the existing `WHAT_NOT_TO_PROMISE.md`, sponsor-output audit, and buyer-surface guard bundle; restates none of them. The corpus was already clean (no copy changes needed).
- **Remainder (GTM half):** line-level sign-off on borderline comparative/ROI claims and live buyer reaction pair with the procurement objection rehearsal (**M-91**). 
- **(A) scoring impact:** none on the headline by itself; the guard hardens Correctness & Evidence Integrity against regression. Headline stays 90.91% (see §2 rescore note).

### Tier 3 – Hold For Reassessment

**2. 90-minute first-review dry-run cohort**
- **Tier:** 3
- **Why it matters:** Voluntary usage depends on time-to-first credible package, not feature count.
- **Expected impact:** Time-to-Value, Adoption Friction, Runtime Reliability.
- **Evidence:** First-review playbook, pilot nav profile, demo review, ZIP pre-validation, proof packet exist.
- **Actionability:** High when V1.1 GTM validation starts.
- **Design Uncertainty Reduced:** 4/10
- **Market Uncertainty Reduced:** 8/10
- **Classification:** **GTM V1.1 backlog** — tracked as `GTM_BACKLOG.md` **M-90**.

**3. Principal architect dismissal interview script — design half shipped; remainder moved to GTM V1.1 backlog**
- **Tier:** 3 (closed for V1 engineering)
- **Why it matters:** The principal architect is the most dangerous evaluator because they already use frontier AI well.
- **Expected impact:** Decision Advantage, Frontier-AI Survival, 30-Day Voluntary Usage.
- **Design Uncertainty Reduced:** 1/10
- **Market Uncertainty Reduced:** 10/10
- **Design half (DONE 2026-06-27):** Reusable interview instrument `docs/go-to-market/PRINCIPAL_ARCHITECT_DISMISSAL_INTERVIEW_SCRIPT.md` + capture template `docs/go-to-market/templates/principal-architect-dismissal-interview.template.json` (randomized two-arm demo: chat-style frontier AI vs governed package; "what would you reuse in 30 days" + "what would you pay to avoid doing manually").
- **Remainder → GTM V1.1 backlog (`M-44`):** the market-execution half — recruit daily frontier-AI principal architects and run the live 6–8-session randomized cohort, then file dismissal logs and weekly triage — is moved to the GTM V1.1 backlog. A coding agent cannot perform it.
- **(A) scoring impact:** none. Weight-0 market-validation work; the headline stays 90.91% (see §2 rescore note). The score moves only when the live cohort runs.
- **Classification:** **GTM V1.1 backlog** — tracked as `GTM_BACKLOG.md` **M-44**.

**8. Repeat-pilot answer reuse — DONE (2026-06-27)**
- **Tier:** 3 (closed for V1)
- **Why it matters:** Could reduce second-review friction, but only matters if pilots return.
- **Expected impact:** Time-to-Value, Adoption Friction.
- **Evidence:** Draft question engine skipped answered questions within a draft; cross-draft reuse now ships at admission.
- **Actionability:** Medium.
- **Design Uncertainty Reduced:** 6/10 → **shipped**
- **Market Uncertainty Reduced:** 3/10
- **Classification:** V1 engineering — **shipped**.
- **Shipped:** `DraftPriorAnswerReuseApplicator` pre-fills unanswered elicitation keys from up to five prior **RunSpawned** drafts in the same tenant/workspace/project scope at `RequestAdmissionAsync`, records `reused.answer.{questionKey}` provenance on the transparency trail, and lets the existing question-selection engine skip already-answered MUST keys. Repository: `ListRunSpawnedInScopeAsync` (uses existing `IX_DraftRequests_Scope_Status_UpdatedUtc`). Tests: `DraftPriorAnswerReuseApplicatorTests`, `DraftRequestServiceQuestionTests.RequestAdmissionAsync_ReusesAnswersFromPriorRunSpawnedDraft`. Cross-tenant reuse forbidden (ADR 0031).
- **(A) scoring impact:** Time-to-Value +1, Adoption Friction +1 → headline **91.06%** (see §2 rescore note).

**9. MCP membrane**
- **Tier:** 3
- **Why it matters:** Useful for agent ecosystem later, not for V1 proof.
- **Expected impact:** Long-term survivability only after pilot adoption.
- **Evidence:** Explicit V1.1 scope.
- **Actionability:** Medium.
- **Design Uncertainty Reduced:** 5/10
- **Market Uncertainty Reduced:** 2/10
- **Classification:** V1.1, hold.

**10. Deeper RAG quality program — shipped (DONE 2026-06-27; expanded same day)**
- **Tier:** 3 (closed for V1 program)
- **Why it matters:** Could improve Ask and finding quality, but risks optimizing commodity chat before proving governed workflow.
- **Expected impact:** AI readiness and insight density.
- **Evidence:** TB-021/RAG backlog; offline + live-model faithfulness signals; expanded golden datasets.
- **Actionability:** Medium.
- **Design Uncertainty Reduced:** 7/10 → **shipped**
- **Market Uncertainty Reduced:** 3/10
- **Classification:** V1 engineering — **shipped**.
- **Shipped (offline):** `DEEPER_RAG_QUALITY_PROGRAM.md`, `run_rag_quality_program.py` (faithfulness → IR → ratchet → rollup), tests.
- **Shipped (live-model Phase B):** `run_rag_live_model_faithfulness_signal.py` evaluates committed real-mode exemplars with p50/adversarial floors; golden-cohort nightly job `cohort-rag-live-model-faithfulness`; `--include-live-model` on program runner.
- **Shipped (golden expansion):** retrieval IR **47** cases (AzureRetail, DemoDerived, CustomerProvided, tenant isolation); faithfulness **33** cases (Ask-shaped citations); manifest `scripts/ci/data/rag_golden_dataset_manifest.v1.json`.
- **Remainder:** live OpenAI invoke under customer deployment model; graph RAG / reranker via **TB-021**.
- **(A) scoring impact:** offline program **91.16%**; live-model + golden expansion **91.38%** (see §2 rescore note).

### Cursor-Actionable Engineering Candidates

These five are deliberately smaller than new product surfaces. They are Cursor-suitable because they tighten proof, traceability, or first-review reliability without reopening deferred GTM, assurance, MCP, or connector programs.

**11. Persist effective governance snapshot metadata at commit — SHIPPED 2026-06-27**
- **Tier:** 2
- **Why it matters:** Buyers need to know which policy state governed a committed review, not only what the current effective assignment says later.
- **Expected impact:** Governed Review Integrity, Correctness & Evidence Integrity, Differentiability.
- **Evidence:** `CommittedEffectiveGovernanceSnapshotCapturer` + `ManifestDocument.EffectiveGovernanceAtCommit`; `CompareGovernanceDiffPanel` policy-at-commit rows; `RunDetailManifestSummarySection` policy-at-commit; export README **Policy at commit** line.
- **Actionability:** Medium.
- **Design Uncertainty Reduced:** 7/10
- **Market Uncertainty Reduced:** 4/10
- **Classification:** V1.1 engineering candidate — **shipped**.
- **(A) scoring impact:** **91.38% → 91.63%** (Governed Review Integrity +1, Correctness & Evidence Integrity +1).

**Cursor prompt (archived — shipped):**
```text
Problem: Committed review packages expose ruleSetId/ruleSetVersion, but compare/audit UX still has to disclaim that current effective policy assignments may differ from the policy state at commit time.

Desired behavior: When a review is committed, persist a compact effective-governance snapshot descriptor with the committed package: policy pack ids, versions, scope levels, rule-set hash, compliance rule key count, conflict count, and generated UTC. Surface that descriptor on run detail and compare governance diff so operators can distinguish "policy at commit" from "current policy."

Scope boundaries: Prefer extending existing manifest metadata / decision trace / run governance metadata patterns over adding a new broad subsystem. Do not re-evaluate old committed runs under new policies. Do not mutate historical manifests after commit.

Acceptance criteria: A committed review records governance snapshot metadata when effective policy content is available; run detail and compare governance diff show historical snapshot metadata; empty/no-policy cases render clearly; audit/export text says "policy at commit"; current-policy disclaimer remains only where current assignments are shown.

Tests to add/update: Application tests for snapshot descriptor creation; persistence/serialization tests for committed metadata; UI tests for compare governance diff historical-vs-current rendering; no cross-tenant scope bleed.

Non-goals: Full policy replay engine, policy pack content archival beyond descriptor/hash, changing pre-commit gate semantics.
```

**12. Add proof-packet claim lint to prevent unsupported buyer claims**
- **Tier:** 2
- **Why it matters:** One unsupported ROI, assurance, or AI-mode claim can erase trust faster than a missing feature.
- **Expected impact:** Correctness & Evidence Integrity, Executive Purchase, Procurement realism.
- **Evidence:** Proof packets, source labels, governed/advisory labels, and ROI freshness labels exist; claim audit is currently a human validation plan.
- **Actionability:** High.
- **Design Uncertainty Reduced:** 5/10
- **Market Uncertainty Reduced:** 5/10
- **Classification:** V1 engineering hardening.

**Cursor prompt:**
```text
Problem: Buyer-facing proof packets can still contain unsupported or over-broad language unless a human manually audits every claim.

Desired behavior: Add a lightweight proof-packet claim lint that scans generated proof-packet markdown/text artifacts for forbidden or evidence-required phrases (for example: "guaranteed savings", "SOC 2 certified", "third-party tested", "production SLA met", "AI is always real-mode") and fails or warns with actionable messages. The linter should recognize allowed labels such as self-assessed, roadmap, illustrative, extractor-backed, review-backed, and simulator/real-mode.

Scope boundaries: Keep this as deterministic string/rule lint over generated artifacts and docs. Do not introduce an LLM reviewer. Do not block normal internal debug bundles; apply to buyer-safe proof packet paths and any CI script that explicitly opts in.

Acceptance criteria: `archlucid proof-packet` can run claim lint before writing the final ZIP; violations list file, phrase, reason, and suggested safe wording; source-label and ROI sections pass; test fixtures cover both fail and pass cases.

Tests to add/update: CLI unit tests for lint pass/fail; proof-packet writer tests with forbidden assurance and ROI claims; documentation sample test if existing script infrastructure supports it.

Non-goals: Legal review automation, replacing `WHAT_NOT_TO_PROMISE.md`, changing ROI calculations.
```

**13. Create a one-command pilot readiness preflight summary**
- **Tier:** 2
- **Why it matters:** Time-to-value still depends on setup choreography across SQL, auth, LLM mode, Azure AI Search, proof packet, and optional ITSM.
- **Expected impact:** Time-to-Value, Adoption Friction, Runtime & First-Review Reliability.
- **Evidence:** `CONFIGURATION_REFERENCE.md` defines pilot profiles; config check/lint endpoints and CLI exist; ITSM health exists.
- **Actionability:** Medium-high.
- **Design Uncertainty Reduced:** 6/10
- **Market Uncertainty Reduced:** 4/10
- **Classification:** V1 engineering hardening.

**Cursor prompt:**
```text
Problem: Operators need several commands/docs to know whether an environment is ready for a first pilot, which increases first-review friction.

Desired behavior: Add `archlucid pilot preflight` that runs the existing config check/lint logic, verifies API health/version when `--api` is provided, reports execution mode, checks proof-packet prerequisites, checks Azure extractor upload limits/docs pointers, and optionally calls ITSM health. Output both human-readable markdown and JSON with PASS/HOLD rows.

Scope boundaries: Reuse existing config check/lint, health, and ITSM health clients. Do not add new server-side validation rules unless an existing API already exposes the data. Do not print secrets.

Acceptance criteria: Command returns non-zero only on blocking HOLD rows; JSON schema is stable enough for CI; markdown includes owner-friendly next steps; `--no-api` supports offline config-only mode; `--include-itsm` probes ITSM health only when requested.

Tests to add/update: CLI command option parsing tests; mocked API client tests for PASS/HOLD combinations; redaction test proving secrets are not emitted; docs update in pilot runbook.

Non-goals: Deploying infrastructure, running a full release smoke, creating a review.
```

**14. Add governed-finding coverage metric to executive/proof surfaces**
- **Tier:** 3
- **Why it matters:** The product's moat is strongest when findings are governed and traceable; executives should know whether a package is mostly governed findings or advisory narrative.
- **Expected impact:** Proof-of-ROI Readiness, Executive / Operator Comprehension, Differentiability.
- **Evidence:** Governed vs advisory labeling exists; findings carry policy/rule traces for compliance; proof status strips exist.
- **Actionability:** Medium.
- **Design Uncertainty Reduced:** 5/10
- **Market Uncertainty Reduced:** 4/10
- **Classification:** V1/V1.1 engineering candidate.

**Cursor prompt:**
```text
Problem: Buyer-facing summaries show evidence and ROI status, but do not give a compact percentage/count of findings that are governed by policy/rule trace versus advisory-only narrative.

Desired behavior: Compute and display a governed-finding coverage metric for committed review packages: total persisted findings, findings with policy/rule trace, findings with evidence references, and advisory-only outputs excluded from the package. Surface it on run detail proof/decision sections and in proof-packet metadata.

Scope boundaries: Use persisted findings and existing trace/payload fields. Do not invent policy mappings for findings that lack them. Do not count Ask/holistic critic output as governed.

Acceptance criteria: Metric is deterministic; empty findings render "not available"; proof packet includes a short explanation; UI uses the existing governed/advisory visual language.

Tests to add/update: Unit tests for coverage calculation; UI test for metric display; proof-packet snapshot/fixture test; no regressions for non-compliance findings.

Non-goals: Rewriting finding generation, requiring every finding to have a policy citation, changing ROI math.
```

**15. Add sample policy A/B demo fixture and regression test**
- **Tier:** 3
- **Why it matters:** The central demo depends on showing that policy changes behavior; a deterministic fixture protects that story from drift.
- **Expected impact:** Decision-Changing Insight Density, Differentiability, Demo Reliability.
- **Evidence:** Policy pack simulation, compliance filtering, and policy impact preview exist.
- **Actionability:** High.
- **Design Uncertainty Reduced:** 6/10
- **Market Uncertainty Reduced:** 3/10
- **Classification:** V1 engineering/demo hardening.

**Cursor prompt:**
```text
Problem: The policy-to-decision demo is strategically important, but there is no small deterministic fixture that proves a policy pack change alters compliance rule selection and gate outcome.

Desired behavior: Add a seeded/demo fixture or test fixture with one committed review and two policy pack contents: default allows or yields fewer findings; stricter pack selects at least one additional compliance rule and makes pre-commit simulation block on critical severity. Use it in tests for policy impact preview helpers and backend simulation where appropriate.

Scope boundaries: Keep the fixture synthetic and clearly demo-labeled. Do not add marketing claims or real customer data. Do not change default PlatformDefault packs solely for this fixture.

Acceptance criteria: A test fails if the stricter policy no longer changes rule-key diff and block outcome; UI helper tests can render the before/after delta; docs mention the fixture as internal demo validation only.

Tests to add/update: Decisioning/Application test for compliance filtering delta; UI test for `PolicyPackImpactPreviewPanel` against fixture-shaped data; optional CLI/demo docs test if demo seed references it.

Non-goals: New policy authoring UX, broad policy replay, buyer-facing benchmark claim.
```

---

# 18. Prompt Batching Guidance

**First batch — validation, no Composer needed:** policy-to-decision proof pilot and executive paid-pilot proof packet. Strong-model-recommended for synthesis of findings after pilot evidence.

**Second batch — buyer proof:** proof-language claim audit (#7). Safe for Sonnet/Composer for copy cleanup after strategic framing is decided.

**Third batch — GTM V1.1 / only if validation window opens:** 90-minute first-review dry-run cohort, principal architect dismissal interviews, live OpenAI invoke under customer deployment. RAG quality program (#10) is **shipped** — use `run_rag_quality_program.py --enforce --include-live-model` for RC. (Procurement objection rehearsal and ITSM pilot-readiness are **GTM V1.1 backlog only** — **M-91** / **M-92** — not assessment §17 items.) Strong-model-recommended for evidence semantics or governance changes; Sonnet-safe for isolated UI copy or tests.

Priorities remain: first-review reliability, guided intake clarity, evidence/policy traceability, package credibility, demo reliability, and executive/operator comprehension. Because the current ship gates pass, validation work should precede new engineering.

---

# 19. Model Usage Guidance

| Model tier | Use |
|------------|-----|
| Composer-safe | Help copy, proof-packet wording, runbook cleanup, UI label tweaks, snapshot-only copy changes |
| Sonnet-safe | Small UI wiring, Vitest updates, first-review checklist polish, proof status copy alignment |
| Strong-model-recommended | Strategic assessment, policy-aware moat evaluation, evidence semantics, review-generation refactors, security/auth/scope changes, ROI basis changes |
| Opus-or-Gemini-assessment-recommended | Clean-slate market readiness assessments, founder delusion checks, competitive moat analysis, post-pilot synthesis |

Do not use cheaper models to make product strategy calls from pilot evidence; do use them for mechanical docs/tests once strategy is clear.

---

# 20. Pending Questions For Later

| Question | Class |
|----------|-------|
| Does one policy-pack A/B review change a decision a principal architect would otherwise miss? | Requires customer validation |
| Will principal architects voluntarily run a second review within 30 days? | Requires customer validation |
| Which assurance gap blocks the first paid pilot: CPA SOC 2, external pen test, or neither? | Requires customer validation |
| Which ITSM system, if any, must be configured before payment? | Requires customer validation |
| When should TB-135 / TB-136 receive budget and owner direction? | Founder decision |
| When should live commerce / Marketplace un-hold happen? | Founder decision, V1.1 |
| Should repeat-pilot answer reuse be promoted? | **Shipped (2026-06-27)** — scope-level reuse at draft admission; market validation remains whether pilots actually return |

---

# Appendix A — Author Signal (qualitative, NON-HEADLINE)

The product demonstrates serious principal-architect judgment and enterprise realism. The strongest signal is not the amount of software; it is the choice to make policy state, audit, disposition, source labels, and deferrals explicit rather than pretending a chatbot is a governance system. The repo shows practical taste in database-per-tenant isolation, Dapper/SQL-centered persistence, OpenAPI/audit CI gates, advisory-only Terraform, honest trust-center wording, and scope discipline. This author signal is strong, but it is not market readiness by itself.

---

# Central Question — Direct Answer

> Does ArchLucid turn frontier AI into a governed, policy-aware, audit-ready enterprise architecture review system that changes decisions and earns repeat use?

**Yes on the system, not yet proven on the market.** ArchLucid has the infrastructure to turn frontier AI output into governed, policy-aware, audit-ready review packages. The remaining proof is whether buyers and principal architects experience that as decision-changing enough to return within 30 days and pay for it.
