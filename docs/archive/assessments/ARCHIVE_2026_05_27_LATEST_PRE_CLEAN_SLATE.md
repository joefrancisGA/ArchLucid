<!-- **Scope:** Internal clean-slate solution-quality assessment; not a public compliance attestation. -->

# ArchLucid Assessment – (A) Headline Readiness: 80.23%

**Assessment date:** 2026-05-27

This score represents the `(A)` headline readiness per `Assessment-Scope-V1_1.mdc`, excluding deferred items. Explicit V1.1/V2/owner-only and `(B)` procurement realism items are discussed but not deducted from the `(A)` score.

**Method:** Clean-slate, first-principles assessment using the 47-quality model supplied in the request. Total weight = **125**. Formula: `Σ(score × weight) / 125`.

## Executive Summary

### `(A)` Overall Headline Readiness
ArchLucid is credible for guarded enterprise pilots and sales-led early production conversations. The strongest evidence is the signed review package loop: request, execution, committed manifest, artifacts, exports, governance, audit, explainability, ROI, and Azure-native deployment posture. The score is capped by correctness / confidence hardening, scattered sticky workflow surfaces, high operator cognitive load, and incomplete decision-led executive packaging.

### `(B)` Procurement / Market-Motion Realism
Procurement friction remains real but outside `(A)`: no CPA SOC 2 report, no third-party pen-test summary, sales-led quote-to-cash, and externally validated reference proof requiring owner/customer action. The trust center, CAIQ/SIG, DPA, SOC 2 self-assessment, and security roadmap are credible for early buyers under NDA; they are not enough for frictionless strict-enterprise procurement.

### Commercial Picture
The value premise is strong: reduce architecture review time, shift compliance left, produce evidence, and make governance decisions traceable. The commercial weakness is recurring value packaging. ArchLucid has the raw material for stickiness, but the customer operating loop is not yet obvious enough.

### Enterprise Picture
Enterprise posture is strong for this stage: database-per-tenant isolation, OIDC/SAML/SCIM, audit, policy packs, approvals, least-privilege Azure ingestion, and private-endpoint/WAF IaC. Adoption still requires competent customer operators for identity, evidence collection, cloud extraction, and governance setup.

### Engineering Picture
The engineering base is serious: modular .NET, Dapper/SQL, OpenAPI snapshots, DbUp, architecture invariants, health endpoints, OpenTelemetry, RAG, quality gates, and extensive tests. The main engineering risks are confidence semantics, partial-failure visibility, retrieval freshness, provenance materialization, and layer-boundary debt.

## Deferred Scope Uncertainty

I located the main deferral sources in `docs/library/V1_SCOPE.md`, `docs/library/V1_DEFERRED.md`, `docs/go-to-market/TRUST_CENTER.md`, `docs/security/SOC2_SELF_ASSESSMENT_2026.md`, and `docs/go-to-market/SOC2_ROADMAP.md`. I could not create the requested archive under `docs/archive/assessments/` because that path is blocked by the file access filter in this environment.

## Weighted Quality Assessment

Qualities are ordered by weighted deficiency signal: `(100 - score) × weight`.

| Rank | Quality | Score | Weight | Weighted impact | Deficiency signal | Justification / tradeoffs / recommendations / fixability |
| ---: | --- | ---: | ---: | ---: | ---: | --- |
| 1 | Correctness | 78 | 8 | 4.99 | 176 | Core review behavior is coherent, but decision confidence, finding confidence, partial failures, provenance snapshots, and retrieval freshness still create output-risk. Tradeoff: correctness work slows feature velocity but protects the product's central promise. Improve confidence source, typed unknown/failed confidence, partial-failure surfacing, retrieval freshness, and snapshot materialization. **V1-actionable.** |
| 2 | Stickiness | 73 | 6 | 3.50 | 162 | Manifests, audit, governance, digests, ROI, compare/replay, and policy packs exist, but they do not yet feel like one recurring operating loop. Tradeoff: workflow state adds complexity but prevents one-time assessment churn. Add risk register framing, dispositions, waivers, decision register, and decision-led digests. **Mostly V1-actionable; first-party ITSM is V1.1.** |
| 3 | Marketability | 82 | 8 | 5.25 | 144 | Strong category premise around evidence-backed architecture review; weaker proof density and buyer-job packaging. Tradeoff: Azure focus improves credibility but narrows audience. Package Azure SaaS readiness, AI governance, modernization risk, healthcare claims, and executive risk packets. **V1-actionable.** |
| 4 | AI/Agent Readiness | 82 | 8 | 5.25 | 144 | Real/simulator modes, schema validation, quality gates, budget controls, and redaction are present; degraded trace, reasoning propagation, real-mode cohort, and unified decision explainability remain. Tradeoff: strict controls add config cost. Improve degraded traces, reasoning trace propagation, and decision explainability. **V1-actionable.** |
| 5 | Adoption Friction | 78 | 6 | 3.74 | 132 | Trust-safe ingestion and enterprise identity are good but require skilled operators. Tradeoff: safer enterprise posture slows self-service. Create a single first-pilot operator path and stronger guided defaults. **V1-actionable.** |
| 6 | Cutting-Edge AI Technology | 84 | 8 | 5.38 | 128 | Azure OpenAI, structured outputs, RAG, summarization, faithfulness hooks, and redaction are modern enough; retrieval eval and advanced graph/rerank work remain. Tradeoff: Azure-native safety over experimental breadth. Add IR gates and chunking invalidation. **V1 hardening; advanced retrieval V2.** |
| 7 | Time-to-Value | 84 | 7 | 4.70 | 112 | Demo/prepared paths can reach committed review quickly; real customer value depends on evidence collection. Tradeoff: no shortcut through customer trust boundaries. Add first-value fixture and checklist. **V1-actionable.** |
| 8 | Proof-of-ROI Readiness | 80 | 5 | 3.20 | 100 | ROI model is concrete, but realized value tracking and assumptions visibility need work. Tradeoff: conservative estimates reduce overclaim risk but need buyer data. Connect closed risks/dispositions to value delivered. **V1-actionable.** |
| 9 | Differentiability | 78 | 4 | 2.50 | 88 | Evidence-backed architecture proof differentiates from generic copilots, but mature EA/GRC competitors have broader recurring workflows. Tradeoff: focused wedge vs platform breadth. Sharpen signed review package and policy-backed findings proof. **V1-actionable.** |
| 10 | Workflow Embeddedness | 74 | 3 | 1.78 | 78 | REST/CLI/UI/SCIM/CI/extractor exist; daily-work connectors are V1.1. Tradeoff: core correctness before connector breadth. Clarify V1 automation recipes. **V1 docs/CI; connectors V1.1.** |
| 11 | Executive Value Visibility | 81 | 4 | 2.59 | 76 | ROI, value reports, scorecards, drift, and dashboards exist; executives need fewer live decision cards. Tradeoff: analytics breadth can dilute decision narrative. Replace illustrative KPIs and add decision-needed views. **V1-actionable.** |
| 12 | Usability | 76 | 3 | 1.82 | 72 | Users can complete tasks, but many concepts/routes require orientation. Tradeoff: power-user depth vs first-session clarity. Strengthen Pilot defaults and guided empty states. **V1-actionable.** |
| 13 | Trustworthiness | 80 | 3 | 1.92 | 60 | Signed manifests, audit, governance, policy, and explainability are strong; confidence provenance and waiver/disposition workflows are weak. Tradeoff: honest uncertainty may look less impressive but improves reliance. Add confidence source and waiver evidence. **V1-actionable.** |
| 14 | Architectural Integrity | 80 | 3 | 1.92 | 60 | Layers, composition root, contracts, and invariants exist; known coupling debt remains. Tradeoff: pragmatic shipping created debt. Close remaining architecture invariant and port-extraction items. **V1-actionable.** |
| 15 | Decision Velocity | 75 | 2 | 1.20 | 50 | Governance workflows help architecture decisions, but purchase and executive decisions still require manual synthesis. Tradeoff: careful evidence can slow simple buyers. Add "decision needed now" sections. **V1-actionable.** |
| 16 | Security | 84 | 3 | 2.02 | 48 | Tenant isolation, Key Vault, identity, CI security checks, rate limiting, redaction, and least-privilege extractor are credible; retrieval filtering and fail-closed guards remain important. **V1-actionable.** |
| 17 | Commercial Packaging Readiness | 76 | 2 | 1.22 | 48 | Tiers, quote path, billing controllers, and marketplace docs exist; packaging still feels capability-led. Live commerce is V1.1/owner and excluded. Improve job-based bundles. **V1-actionable.** |
| 18 | Procurement Readiness | 78 | 2 | 1.25 | 44 | Trust center, DPA, CAIQ/SIG, SOC self-assessment, accessibility draft, and procurement pack are substantial; strict RFP attestation remains `(B)`. **V1 docs; CPA/pen-test owner/V2.** |
| 19 | Reliability | 79 | 2 | 1.26 | 42 | Health, retries, DbUp, outbox/DLQ, budget cutoffs exist; retry/partial-failure and snapshot behavior need hardening. **V1-actionable.** |
| 20 | Interoperability | 80 | 2 | 1.28 | 40 | OpenAPI, CLI, generated clients, SCIM, CI, and HTTP contracts are good; V1.1 connectors excluded. Clarify integration catalog boundaries. **V1-actionable.** |
| 21 | Explainability | 80 | 2 | 1.28 | 40 | Findings, provenance, aggregate explain routes, and traces exist; unified decision explainability and reasoning/confidence propagation need work. **V1-actionable.** |
| 22 | Data Consistency | 81 | 2 | 1.30 | 38 | SQL, migrations, transactions, and outbox concepts are solid; snapshot persistence/invalidation needs hardening. **V1-actionable.** |
| 23 | Compliance Readiness | 82 | 2 | 1.31 | 36 | Policy packs, audit, governance, drift, CAIQ/SIG, DPA, and SOC self-assessment are good; external attestation excluded. **V1 product/docs.** |
| 24 | Maintainability | 82 | 2 | 1.31 | 36 | Modular repo and strong docs; doc volume and boundary backlog create maintenance drag. Continue architecture tests and audience split. **V1-actionable.** |
| 25 | Template and Accelerator Richness | 70 | 1 | 0.56 | 30 | Good raw templates, but fewer buyer-recognizable vertical accelerators. Add Azure SaaS, AI governance, and healthcare/claims walkthroughs. **V1-actionable.** |
| 26 | Cognitive Load | 70 | 1 | 0.56 | 30 | Too many concepts: run/review, manifest, governance, policy packs, evidence, digests, ROI, compare, replay, graph, Ask. Reduce first-session surface area. **V1-actionable.** |
| 27 | Policy and Governance Alignment | 86 | 2 | 1.38 | 28 | Policy packs, governance resolution, pre-commit gates, approvals, audit, and drift tracking fit enterprise governance. Add waivers/dispositions. **V1-actionable.** |
| 28 | Customer Self-Sufficiency | 74 | 1 | 0.59 | 26 | CLI doctor, support bundles, and runbooks help; identity/extractor/policy setup still needs skill. Add a truly sequential pilot quickstart. **V1-actionable.** |
| 29 | Scalability | 75 | 1 | 0.60 | 25 | Database-per-tenant scales trust, not operational simplicity; optional Redis/fleet paths exist. Document thresholds. **V1 docs/ops; some V2.** |
| 30 | Accessibility | 76 | 1 | 0.61 | 24 | Automated axe and VPAT material exist; manual/AT studies excluded but route hygiene still matters. Keep top-route evidence current. **V1-actionable.** |
| 31 | Extensibility | 76 | 1 | 0.61 | 24 | Custom handler guidance exists; public SDK/marketplace and MCP-as-V1 are excluded. Finish docs and links. **V1 docs; MCP V1.1.** |
| 32 | Performance | 76 | 1 | 0.61 | 24 | Caches and p95 thinking exist; graph/provenance rebuilds and rich evidence can affect latency. Materialize snapshots and benchmark critical APIs. **V1-actionable.** |
| 33 | Azure Compatibility and SaaS Deployment Readiness | 88 | 2 | 1.41 | 24 | Azure-native story is coherent across Entra, AOAI, SQL, Blob, Key Vault, Container Apps, WAF, Terraform, and Marketplace alignment. **V1 maintenance.** |
| 34 | Availability | 78 | 1 | 0.62 | 22 | Health/SLO/probe/failover docs exist; staging evidence is not production SLA evidence. Clarify production-vs-staging availability evidence. **V1 docs/ops.** |
| 35 | Observability | 80 | 1 | 0.64 | 20 | OpenTelemetry, metrics, Prometheus/Grafana assets, and degradation counters exist; environment binding takes work. Finish dashboard binding runbook. **V1-actionable.** |
| 36 | Modularity | 80 | 1 | 0.64 | 20 | Many projects and contracts, but known coupling debt remains. Close port extraction and architecture-test backlog. **V1-actionable.** |
| 37 | Cost-Effectiveness | 80 | 1 | 0.64 | 20 | LLM budgets, cost estimator, wallet, and FinOps docs are good; duplicate work and estimate labeling must stay tight. **V1-actionable.** |
| 38 | Auditability | 90 | 2 | 1.44 | 20 | Append-only audit, typed events, CSV export, and correlation are strong. Add disposition/waiver audit events. **V1-actionable.** |
| 39 | Supportability | 82 | 1 | 0.66 | 18 | Support bundle, health, config lint, problem details, runbooks are good; trace gaps and dashboard binding remain. **V1-actionable.** |
| 40 | Manageability | 82 | 1 | 0.66 | 18 | Config catalog, admin summaries, lint routes, tenant settings, governance controls exist; breadth risks misconfiguration. **V1-actionable.** |
| 41 | Testability | 82 | 1 | 0.66 | 18 | Many tests and snapshots; real-mode cohort and retrieval IR gaps remain. Add deterministic retrieval eval. **V1; 95% ratchet V1.1.** |
| 42 | Evolvability | 82 | 1 | 0.66 | 18 | Versioning, flags, migrations, scope docs are present; large surface needs discipline. **V1 process.** |
| 43 | Change Impact Clarity | 83 | 1 | 0.66 | 17 | Compare/replay/drift/deltas/provenance are good; package "what changed and what decision is needed." **V1-actionable.** |
| 44 | Deployability | 84 | 1 | 0.67 | 16 | Docker, compose, Terraform, health, and stack docs exist; deployment still requires Azure competence. **V1 docs/ops.** |
| 45 | Documentation | 86 | 1 | 0.69 | 14 | Documentation is deep and useful; volume hurts findability. Improve audience routing. **V1-actionable.** |
| 46 | Azure Ecosystem Fit | 90 | 1 | 0.72 | 10 | Azure fit is excellent and coherent. Keep claims Azure-first and do not imply AWS/GCP hosting. **V1 maintenance.** |

## Top 12 Most Important Weaknesses

1. The review package is powerful but not yet a recurring operating habit.
2. Correctness risk is concentrated in confidence semantics, retrieval freshness, partial failures, and provenance materialization.
3. Operator cognitive load is too high for broad self-service adoption.
4. ROI proof exists, but realized-value tracking is not strong enough.
5. Executive views need fewer, sharper, live decision cards.
6. Finding disposition and waiver workflows are not first-class enough for enterprise governance.
7. Architecture boundary debt remains visible in the technical backlog.
8. Traceability is strong but not unified enough across decisions, findings, agent traces, and provenance.
9. Workflow integration expectations need strict scope control because several first-party connectors are V1.1.
10. The product depends on skilled customer operators for identity, evidence, and cloud extraction.
11. Procurement artifacts are good for pilots but not enough for strict attestation-driven buyers.
12. Commercial packaging needs buyer-recognizable accelerators, not only broad capability inventory.

## Top 6 Monetization Blockers

1. Unclear recurring value loop: customers may treat ArchLucid as a one-time assessment.
2. ROI proof needs realized-value tracking for renewals and expansion.
3. Executive decision narrative is distributed across too many surfaces.
4. Packaging is capability-led instead of job/accelerator-led.
5. Sales-led quote-to-cash slows conversion; live checkout/Marketplace is excluded from `(A)` but still affects revenue speed.
6. External proof is limited; deferred reference/customer proof still affects close rates.

## Top 6 Enterprise Adoption Blockers

1. Identity and tenant setup require precise customer configuration.
2. Evidence ingestion requires customer script execution and upload discipline.
3. Waiver / exception workflow is not first-class enough.
4. SOC 2 CPA and third-party pen-test gaps remain `(B)` procurement friction.
5. ITSM/chat/document connectors are V1.1, so V1 needs clearer automation recipes.
6. Cognitive load is high for first-week operators.

## Top 6 Engineering Risks

1. Decision confidence ambiguity.
2. Finding confidence unknown/failed semantics.
3. Partial-failure invisibility.
4. Provenance snapshot rebuild / materialization gaps.
5. Retrieval freshness and invalidation gaps.
6. Layer-boundary coupling debt.

## Most Important Truth

ArchLucid is not weak because it lacks enterprise primitives; it is weak where those primitives have not yet been turned into a simple, recurring, decision-driven operating loop.

## Top Improvement Opportunities

### 1. Add Decision Confidence to Manifest Decisions
- **Why it matters:** Buyers need to know whether a decision is measured, inferred, calibrated, or unknown.
- **Expected impact:** Correctness (+5-7 pts), Trustworthiness (+3-5 pts), Explainability (+3-4 pts). Weighted readiness impact: +0.5-0.8%.
- **Affected qualities:** Correctness, Trustworthiness, Explainability, Executive Value Visibility.
- **Actionability:** Fully actionable now.
- **Cursor prompt:**
  ```text
  Implement decision confidence projection for manifest decisions.
  Follow docs/library/TECH_BACKLOG.md TB-050. Reuse existing finding confidence fields and manifest decision models. Do not create a parallel decision table.
  Scope: add nullable confidence and confidence source to ResolvedArchitectureDecision and exposed DTOs; populate in DefaultGoldenManifestBuilder from EvaluationConfidenceScore first, then ConfidenceScore, otherwise Unknown; add tests for scored and unknown paths; update OpenAPI snapshot and generated clients/types if HTTP changes.
  Acceptance: decisions show confidence only when computed; Unknown is explicit and never 0; manifest commit behavior is unchanged.
  Constraints: keep classes in separate files; use concrete types over var; no ConfigureAwait(false) in tests.
  ```

### 2. Implement Typed Finding Confidence Outcomes
- **Why it matters:** The product must distinguish unknown, failed, and computed confidence.
- **Expected impact:** Correctness (+4-6 pts), Trustworthiness (+3-4 pts), AI/Agent Readiness (+2-3 pts). Weighted readiness impact: +0.4-0.7%.
- **Affected qualities:** Correctness, Trustworthiness, Explainability.
- **Actionability:** Fully actionable now.
- **Cursor prompt:**
  ```text
  Implement typed finding confidence outcomes per docs/library/TECH_BACKLOG.md TB-053.
  Scope: introduce FindingConfidenceResult with Score, Status, and optional FailureReason; replace bare catch behavior in FindingConfidenceCalculator with logged Failed status; treat missing trace completeness as Unknown, not 0; update FindingFactory so ConfidenceScore is set only when computed; add unit tests for Computed, Unknown, and Failed.
  Acceptance: no path silently converts unknown confidence to 0; failures are observable without leaking sensitive details; manifest projection can consume the new semantics.
  Constraints: preserve public behavior except confidence metadata; check nulls explicitly.
  ```

### 3. Surface Finding Engine Partial Failures
- **Why it matters:** Operators must know when a run is complete but degraded.
- **Expected impact:** Correctness (+3-5 pts), Reliability (+3-4 pts), Supportability (+3-4 pts). Weighted readiness impact: +0.3-0.6%.
- **Affected qualities:** Correctness, Reliability, Supportability, Trustworthiness.
- **Actionability:** Fully actionable now.
- **Cursor prompt:**
  ```text
  Surface finding engine partial failures per docs/library/TECH_BACKLOG.md TB-056.
  Scope: record a run-level or manifest-level FindingEngineFailures summary when a finding engine fails and the orchestrator continues; emit a metric for partial failures; add a manifest warning when DefaultGoldenManifestBuilder skips a finding payload; exclude deterministic sentinel trace placeholders from completeness scoring; add tests for partial failure visibility.
  Acceptance: operators can see that a run completed with degraded finding coverage; failures are logged, metered, and exposed; no silent omission of a finding from manifest output.
  Constraints: do not change the product decision to continue after a single engine failure; do not broaden exception swallowing.
  ```

### 4. Reframe Governance Findings as Architecture Risk Register
- **Why it matters:** This is the fastest path to higher stickiness without building a new GRC product.
- **Expected impact:** Stickiness (+8-12 pts), Workflow Embeddedness (+3-5 pts), Executive Value Visibility (+2-4 pts). Weighted readiness impact: +0.6-1.0%.
- **Affected qualities:** Stickiness, Workflow Embeddedness, Usability, Executive Value Visibility.
- **Actionability:** Fully actionable now.
- **Cursor prompt:**
  ```text
  Reframe /governance/findings as an Architecture Risk Register per docs/library/TECH_BACKLOG.md TB-057.
  Reuse existing findings, monitored risks, manifest decisions, and governance data. Do not create a parallel RiskRegister aggregate unless necessary.
  Scope: update operator copy, headings, empty states, filters, and column labels; expose owner, disposition, due date, review cadence, last reviewed, aging, severity, linked review, linked manifest, and evidence links where data exists; use explicit placeholders for missing fields prepared for TB-058/TB-059.
  Acceptance: an operator can answer "what architecture risks do we currently own?" from the page; findings and manifest risks are linked, not duplicated; missing fields are explicit.
  Constraints: avoid broad redesign; do not implement first-party ITSM.
  ```

### 5. Add Finding Disposition Workflow
- **Why it matters:** A sticky governance product must remember human decisions.
- **Expected impact:** Stickiness (+6-10 pts), Auditability (+2-3 pts), Trustworthiness (+3-4 pts). Weighted readiness impact: +0.5-0.9%.
- **Affected qualities:** Stickiness, Auditability, Trustworthiness, Workflow Embeddedness.
- **Actionability:** Fully actionable now.
- **Cursor prompt:**
  ```text
  Add a finding disposition workflow over existing finding review events per docs/library/TECH_BACKLOG.md TB-058.
  Scope: add API endpoints for Accepted, Deferred, NeedsEvidence, Remediated, and RejectedAsNotApplicable; require rationale for Accepted/Deferred/RejectedAsNotApplicable; require revisit date for Deferred and evidence request text for NeedsEvidence; add UI actions on finding detail and governance findings/risk register list; emit durable audit events; add persistence, validation, authorization, and UI tests.
  Acceptance: latest disposition and full history are visible; deferred findings can be filtered when revisit date arrives; dispositions do not falsely count as ROI unless they represent real work or accepted risk.
  Constraints: all SQL DDL must be in the single database DDL file plus migration; keep status names stable and documented.
  ```

### 6. Add First-Class Waiver / Exception Records
- **Why it matters:** Enterprise governance requires controlled risk acceptance, expiration, and evidence.
- **Expected impact:** Stickiness (+5-8 pts), Governance Alignment (+3-4 pts), Compliance Readiness (+2-3 pts). Weighted readiness impact: +0.4-0.7%.
- **Affected qualities:** Stickiness, Governance, Compliance, Trustworthiness.
- **Actionability:** Fully actionable now.
- **Cursor prompt:**
  ```text
  Implement first-class waiver / risk exception records per docs/library/TECH_BACKLOG.md TB-059.
  Scope: add Waiver or RiskException model linked to finding, run, manifest, policy rule when available, tenant, owner, expiration, rationale, and evidence; add persistence with DbUp migration and consolidated ArchLucid.sql update; add create, renew, revoke, and expire paths; require owner, rationale, evidence, and expiration; surface expiring/expired waivers in governance findings and digests; add audit events and tests.
  Acceptance: no indefinite waiver without explicit owner decision; expired waivers reopen decision-needed state; audit export proves who accepted risk, why, and until when.
  Constraints: waived is not fixed; do not bypass existing governance approval posture.
  ```

### 7. Consolidate Manifest Decisions into Decision Register
- **Why it matters:** The decision history already exists but is not obvious enough.
- **Expected impact:** Executive Value Visibility (+4-6 pts), Decision Velocity (+4-5 pts), Traceability (+2-3 pts). Weighted readiness impact: +0.3-0.5%.
- **Affected qualities:** Executive Value Visibility, Decision Velocity, Traceability, Stickiness.
- **Actionability:** Fully actionable now.
- **Cursor prompt:**
  ```text
  Add a Decision Register view over signed manifest decisions and governance lineage per docs/library/TECH_BACKLOG.md TB-060.
  Treat ResolvedArchitectureDecision plus approval lineage as the source of truth. Do not build a separate ADR database.
  Scope: add an operator view listing durable decisions across reviews; link decisions to manifest, review, findings, rationale, approval request, audit events, and environment activation when available; add filters for category, status, environment, date, owner/approver, and confidence source; use executive copy: decision made, evidence, risk if ignored, owner, next review.
  Acceptance: operators can browse decisions without opening each manifest; every decision links back to evidence and lineage; there is no duplicate decision lifecycle.
  Constraints: query/view work preferred over new persistence.
  ```

### 8. Make Governance Digests Decision-Led
- **Why it matters:** Recurrence creates stickiness and executive habit.
- **Expected impact:** Stickiness (+5-8 pts), Executive Value Visibility (+3-4 pts), Change Impact Clarity (+3-4 pts). Weighted readiness impact: +0.4-0.7%.
- **Affected qualities:** Stickiness, Executive Value Visibility, Change Impact Clarity, Workflow Embeddedness.
- **Actionability:** Fully actionable now.
- **Cursor prompt:**
  ```text
  Extend governance digests with a decision-needed section per docs/library/TECH_BACKLOG.md TB-061.
  Scope: add approvals pending, stale risks, deferred findings due, expiring waivers, high-severity unowned findings, and evidence requests; add "what changed since last digest" using compare/recent deltas/compliance drift; add "value delivered" from live ROI and completed dispositions; keep role-aware variants concise.
  Acceptance: a weekly digest can run a governance meeting; FYI is separated from decision-needed; every item links to source evidence; no mock values appear in customer-facing digests.
  Constraints: do not add delivery channels; Teams/Slack remains V1.1 if not already in scope.
  ```

### 9. Replace Mock Executive KPIs with Live Data
- **Why it matters:** Mock-looking executive numbers damage trust.
- **Expected impact:** Trustworthiness (+3-5 pts), Executive Value Visibility (+4-6 pts), ROI Readiness (+2-3 pts). Weighted readiness impact: +0.3-0.6%.
- **Affected qualities:** Executive Value Visibility, Trustworthiness, Proof-of-ROI Readiness.
- **Actionability:** Fully actionable now.
- **Cursor prompt:**
  ```text
  Replace production executive dashboard mock KPIs with live data or explicit empty states per docs/library/TECH_BACKLOG.md TB-062.
  Scope: inventory executive cards and identify mock/illustrative/simulator/live sources; replace production mock KPI imports with ExecutiveRoiSummary, compliance drift trend, disposition counts, waiver expiry counts, and completed review counts where live APIs exist; label demo-only values; add tests preventing production executive routes from importing mock KPI modules.
  Acceptance: production executive dashboard has no unlabeled mock numbers; empty states are explicit; ROI assumptions remain inspectable.
  Constraints: do not remove demo route behavior; fewer live cards are preferred over broad illustrative cards.
  ```

### 10. Materialize Provenance Snapshots on Commit
- **Why it matters:** Stable point-in-time provenance improves performance and audit defensibility.
- **Expected impact:** Traceability (+3-5 pts), Performance (+3-4 pts), Data Consistency (+2-3 pts). Weighted readiness impact: +0.3-0.5%.
- **Affected qualities:** Traceability, Performance, Data Consistency, Supportability.
- **Actionability:** Fully actionable now.
- **Cursor prompt:**
  ```text
  Implement production write path for DecisionProvenanceSnapshot per docs/library/TECH_BACKLOG.md TB-037.
  Scope: after successful authority commit or terminal run state, build and save provenance snapshot once with idempotent upsert; read path uses snapshot when fresh and rebuilds only when missing/stale; add invalidation using manifest/findings revision or equivalent hash; add metrics; add tests for commit creates snapshot and read avoids rebuild.
  Acceptance: provenance reads are point-in-time stable; fallback is explicit and metered; no graph semantic change.
  Constraints: respect replay isolation rules.
  ```

### 11. Add Retrieval Freshness and Chunking Invalidation
- **Why it matters:** Stale or mixed-generation chunks silently degrade AI answers.
- **Expected impact:** Correctness (+3-5 pts), AI/Agent Readiness (+2-3 pts), Cutting-Edge AI Technology (+2-3 pts). Weighted readiness impact: +0.3-0.5%.
- **Affected qualities:** Correctness, AI/Agent Readiness, Reliability.
- **Actionability:** Fully actionable now.
- **Cursor prompt:**
  ```text
  Implement retrieval freshness and chunking invalidation per docs/library/TECH_BACKLOG.md TB-046 and TB-047.
  Scope: use ContentHash to skip unchanged documents during indexing; add last-indexed-at freshness signal and health/metric output; store chunking strategy fingerprint with chunks; invalidate or rebuild stale chunks when chunking parameters change; add tests for unchanged content skip and changed fingerprint invalidation.
  Acceptance: index staleness is observable; chunking changes cannot silently create mixed-generation retrieval results; startup/indexer failure behavior is documented.
  Constraints: coordinate with retrieval eval harness.
  ```

### 12. Add Retrieval IR Evaluation Gate
- **Why it matters:** Faithfulness checks do not prove retrieval recall.
- **Expected impact:** Cutting-Edge AI Technology (+3-5 pts), Correctness (+3-4 pts), Testability (+2-3 pts). Weighted readiness impact: +0.3-0.5%.
- **Affected qualities:** Cutting-Edge AI Technology, Correctness, Testability.
- **Actionability:** Fully actionable now.
- **Cursor prompt:**
  ```text
  Add deterministic retrieval IR evaluation per docs/library/TECH_BACKLOG.md TB-049 and docs/library/RAG_QUALITY_TECHNICAL_BACKLOG.md.
  Scope: create a small golden retrieval dataset with expected relevant documents/chunks; add recall@k and MRR calculation script or test helper; wire into CI in deterministic no-network path; document dataset maintenance.
  Acceptance: CI fails on intentional retrieval regression; dataset is small enough for normal developer runs; no real Azure OpenAI dependency in default CI.
  Constraints: keep real-mode evaluation behind existing gates.
  ```

### 13. Propagate Agent Reasoning Trace into Finding Explainability
- **Why it matters:** Finding-level explanation should not require manual trace hunting.
- **Expected impact:** Explainability (+4-6 pts), Traceability (+2-3 pts), Trustworthiness (+2-3 pts). Weighted readiness impact: +0.3-0.5%.
- **Affected qualities:** Explainability, Traceability, Trustworthiness.
- **Actionability:** Fully actionable now.
- **Cursor prompt:**
  ```text
  Persist bounded AgentResult.ReasoningTrace into finding explainability per docs/library/TECH_BACKLOG.md TB-055.
  Scope: add optional bounded reasoning trace or reference hash to Finding/ExplainabilityTrace; copy from AgentResult in FindingFactory for agent-backed findings; truncate safely and hash when over limit; include in provenance/explainability API payloads where appropriate; add tests for normal and over-limit paths.
  Acceptance: finding detail can explain model reasoning at a bounded level; no full prompt/response blob duplication; redaction rules are respected.
  Constraints: do not store sensitive unredacted prompt material.
  ```

### 14. Build First-Pilot Operator Path
- **Why it matters:** Reduces adoption friction and time-to-value.
- **Expected impact:** Adoption Friction (+4-6 pts), Time-to-Value (+3-5 pts), Customer Self-Sufficiency (+4-5 pts). Weighted readiness impact: +0.4-0.7%.
- **Affected qualities:** Adoption Friction, Time-to-Value, Usability, Customer Self-Sufficiency.
- **Actionability:** Fully actionable now.
- **Cursor prompt:**
  ```text
  Create a single first-pilot operator path.
  Scope: add or update a runbook/checklist sequencing storage/auth, health, extractor ZIP or demo evidence, create review, commit manifest, inspect findings, export sponsor packet, and decide next action. Link from START_HERE, CORE_PILOT, PRODUCT_PACKAGING, and operator home if a doc link surface exists. Keep V1.1 connectors out of required steps.
  Acceptance: a new operator can follow one path without jumping across unrelated docs; every step maps to shipped API/UI/CLI; failure recovery links are included.
  Constraints: docs-first; no broad UI redesign.
  ```

### 15. Add Executive Decision Packet Fixture
- **Why it matters:** Proves the sponsor story does not regress.
- **Expected impact:** Executive Value Visibility (+3-5 pts), Proof-of-ROI Readiness (+2-3 pts), Marketability (+2 pts). Weighted readiness impact: +0.3-0.5%.
- **Affected qualities:** Executive Value Visibility, Proof-of-ROI Readiness, Marketability.
- **Actionability:** Fully actionable now.
- **Cursor prompt:**
  ```text
  Add a deterministic executive decision packet fixture.
  Scope: create a test fixture that generates an executive-ready packet from seeded/demo review data. Include top decisions, top risks, ROI assumptions, evidence links, confidence labels, and next actions. Snapshot stable sections and avoid volatile timestamps. Link expected packet structure from pilot success docs.
  Acceptance: test fails if decision, ROI assumption, or evidence sections disappear; packet contains no mock production KPI values; output is sponsor-readable.
  Constraints: no PII in fixtures; do not change pricing math.
  ```

### 16. Tighten Integration Catalog Boundaries
- **Why it matters:** Prevents sales and implementation confusion around V1 vs V1.1.
- **Expected impact:** Adoption Friction (+2-3 pts), Interoperability (+2-3 pts), Procurement Readiness (+1-2 pts). Weighted readiness impact: +0.2-0.3%.
- **Affected qualities:** Interoperability, Adoption Friction, Commercial Packaging Readiness.
- **Actionability:** Fully actionable now.
- **Cursor prompt:**
  ```text
  Tighten V1 vs V1.1 integration catalog boundaries.
  Scope: review docs/go-to-market/INTEGRATION_CATALOG.md and related integration docs; ensure V1 paths are clearly REST, CLI, operator UI, SCIM, Azure DevOps/GitHub, extractor upload, and documented HTTP surfaces; mark first-party Jira, ServiceNow, Confluence, Teams, Slack, and broad webhooks as V1.1 where applicable; add a "what to use today" table for V1 pilots.
  Acceptance: a buyer cannot mistake V1.1 connectors as V1 required capabilities; every V1 integration has a concrete entry point.
  Constraints: do not downgrade shipped APIs; do not add new connector promises.
  ```

### 17. Add Production Executive Mock-Data Guard
- **Why it matters:** Prevents trust regressions after live KPI cleanup.
- **Expected impact:** Trustworthiness (+2-3 pts), Executive Value Visibility (+2-3 pts). Weighted readiness impact: +0.2-0.3%.
- **Affected qualities:** Trustworthiness, Executive Value Visibility, Testability.
- **Actionability:** Fully actionable now.
- **Cursor prompt:**
  ```text
  Add a guard preventing production executive routes from importing mock KPI modules.
  Scope: add a static or unit test in archlucid-ui that fails if production executive/dashboard route files import known mock KPI modules; allow demo routes to import demo fixtures with explicit naming; document the rule near the mock data module.
  Acceptance: test catches an intentional bad import; demo-only mock usage remains allowed and labeled.
  Constraints: no new dependency unless already present in test tooling.
  ```

### 18. Close Architecture Boundary Debt: Decisioning to Notifications
- **Why it matters:** Domain analysis should not directly depend on notification infrastructure.
- **Expected impact:** Architectural Integrity (+3-4 pts), Maintainability (+2-3 pts), Evolvability (+2 pts). Weighted readiness impact: +0.2-0.4%.
- **Affected qualities:** Architectural Integrity, Maintainability, Modularity.
- **Actionability:** Fully actionable now.
- **Cursor prompt:**
  ```text
  Replace Decisioning to Notifications coupling with domain events per docs/library/TECH_BACKLOG.md TB-029.
  Scope: identify Decisioning references to Notifications; define domain event contracts in Core or Contracts; publish events from Decisioning through a port; register notification handlers in Host.Composition or Notifications adapter; update architecture tests to hard-fail direct Decisioning -> Notifications dependency.
  Acceptance: notification behavior is preserved; Decisioning no longer references Notifications; tests cover event publication.
  Constraints: do not introduce cycles; prefer existing outbox/event patterns if present.
  ```

### 19. Add Custom Handler Documentation Linkage
- **Why it matters:** Extensibility exists, but advanced users need one clear path.
- **Expected impact:** Extensibility (+3-5 pts), Documentation (+2 pts), Customer Self-Sufficiency (+2 pts). Weighted readiness impact: +0.2-0.3%.
- **Affected qualities:** Extensibility, Documentation, Customer Self-Sufficiency.
- **Actionability:** Fully actionable now.
- **Cursor prompt:**
  ```text
  Complete and link custom agent handler documentation.
  Scope: locate existing custom handler guidance or create a concise docs/library guide; cover prerequisites, registration, authority/safety posture, versioning, tests, and non-goals; link from START_HERE, V1_SCOPE §2.18 references, and contributor docs.
  Acceptance: advanced integrator can understand how to add/register a handler; guide does not imply public plugin SDK or marketplace.
  Constraints: docs only unless a code sample is already supported by existing public APIs.
  ```

### 20. Add Scale Threshold Runbook
- **Why it matters:** Buyers and operators need to know when single-replica assumptions stop being enough.
- **Expected impact:** Scalability (+4-5 pts), Manageability (+2-3 pts), Reliability (+1-2 pts). Weighted readiness impact: +0.2-0.3%.
- **Affected qualities:** Scalability, Manageability, Reliability, Cost-Effectiveness.
- **Actionability:** Fully actionable now.
- **Cursor prompt:**
  ```text
  Add a scale threshold runbook for hosted SaaS operations.
  Scope: document when to enable Redis/hot-path cache, read replicas, worker separation, warm tenant catalogs, and per-tenant metric cardinality controls; link relevant configuration keys from CONFIGURATION_REFERENCE.md; state which scale items are V1, V1.x, or V2 if documented.
  Acceptance: operator can decide when to move beyond single-replica/small-fleet posture; cost and reliability tradeoffs are explicit.
  Constraints: do not imply V2 Redis baseline is V1 required.
  ```

### 21. Add Buyer-Recognizable Accelerator Packs
- **Why it matters:** Templates reduce sales friction and make value concrete.
- **Expected impact:** Template Richness (+8-12 pts), Marketability (+2-3 pts), Time-to-Value (+2-3 pts). Weighted readiness impact: +0.2-0.4%.
- **Affected qualities:** Template and Accelerator Richness, Marketability, Time-to-Value.
- **Actionability:** Fully actionable now.
- **Cursor prompt:**
  ```text
  Add two buyer-recognizable accelerator walkthroughs using existing capabilities.
  Scope: create docs/library/walkthroughs for Azure SaaS readiness review and AI governance review; each walkthrough should map request inputs, policy packs, findings, governance decision, ROI proof, and sponsor export; use shipped V1 capabilities only; link from PRODUCT_PACKAGING and relevant go-to-market docs.
  Acceptance: each accelerator has a concrete operator sequence and buyer outcome; no V1.1 connector is required; claims cite shipped surfaces.
  Constraints: docs/content only.
  ```

### 22. DEFERRED — First-Party ITSM Productization
- **Reason deferred:** First-party Jira/ServiceNow productization is documented as V1.1 scope, not current `(A)` V1 scoring scope.
- **Specific information needed later:** Target first tranche, ServiceNow/Jira tenant URLs, credential storage path, project/table mappings, status mapping approval, and whether UI one-click create should ship before bidirectional sync.

### 23. DEFERRED — Live Stripe / Marketplace Commercial Cutover
- **Reason deferred:** Requires owner-controlled Stripe live keys, Partner Center publication, tax/payout setup, DNS, and commercial approval.
- **Specific information needed later:** Live Stripe key vault path, webhook secret, Price IDs, Marketplace offer/plan IDs, production landing URL, seller verification status, and go-live approval.

### 24. DEFERRED — SOC 2 CPA Readiness Engagement
- **Reason deferred:** CPA attestation is excluded from `(A)` and requires budget/vendor decisions.
- **Specific information needed later:** Budget ceiling, auditor shortlist, Type I vs Type II target, observation window, system boundary, and executive owner.

### 25. DEFERRED — Published Reference Customer Case Study
- **Reason deferred:** Requires customer legal approval, measured customer ROI, logo rights, and reference-call commitment.
- **Specific information needed later:** Customer name, legal approver, publishable metrics, logo asset, case-study approval path, and permitted quote/reference language.

## Prompt Batching Guidance

| Batch | Improvements | Why |
| --- | --- | --- |
| Batch A — Correctness and trust core | 1, 2, 3 | Shared decision/finding confidence and partial-failure context; highest weighted leverage. |
| Batch B — Stickiness workflow | 4, 5, 6, 7, 8 | Same governance/findings/digests area; best context reuse. |
| Batch C — Executive and ROI proof | 9, 15, 17 | Executive dashboard, packet fixture, mock-data guard; low conflict and high buyer impact. |
| Batch D — Retrieval quality | 11, 12, 13 | Retrieval freshness, eval, and explainability propagation; shared AI-quality context. |
| Batch E — Architecture and operations | 10, 18, 20 | Provenance, boundary debt, scale runbook; engineering-heavy but separable. |
| Batch F — Adoption / docs / packaging | 14, 16, 19, 21 | Mostly docs and buyer-path improvements; efficient low-risk batch. |
| Deferred batch | 22, 23, 24, 25 | Wait for owner/customer inputs; do not start as engineering tasks. |

Recommended order: Batch A, then Batch B, then Batch C.

## Pending Questions for Later

### Add Decision Confidence to Manifest Decisions
- Which confidence-source labels should be externally visible versus internal-only?

### Implement Typed Finding Confidence Outcomes
- Should failed confidence calculation block commit at any severity, or only surface a warning?

### Surface Finding Engine Partial Failures
- Which finding engine failures should make a review non-committable versus degraded-but-committable?

### Reframe Governance Findings as Architecture Risk Register
- Should "risk owner" be a free-text user field initially or bound to tenant users/groups?

### Add Finding Disposition Workflow
- Are `Accepted`, `Deferred`, `NeedsEvidence`, `Remediated`, and `RejectedAsNotApplicable` the final status names for buyer-facing UI?

### Add First-Class Waiver / Exception Records
- What is the maximum allowed waiver duration before renewal is required?

### Consolidate Manifest Decisions into Decision Register
- Should decision owners be inferred from approval lineage or assigned independently?

### Make Governance Digests Decision-Led
- What default cadence should be enabled for new tenants: weekly, monthly, or manual-only?

### DEFERRED — First-Party ITSM Productization
- Target provider order, tenant credentials, status mappings, and whether one-click create precedes bidirectional sync.

### DEFERRED — Live Stripe / Marketplace Commercial Cutover
- Live keys, Price IDs, Marketplace offer IDs, seller verification, DNS, and production go-live approval.

### DEFERRED — SOC 2 CPA Readiness Engagement
- Budget, vendor shortlist, target report type, observation window, and executive owner.

### DEFERRED — Published Reference Customer Case Study
- Customer approval, metrics, logo rights, and permitted public language.
