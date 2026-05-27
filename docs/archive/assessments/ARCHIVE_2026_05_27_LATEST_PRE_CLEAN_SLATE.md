<!-- **Scope:** Internal clean-slate solution-quality assessment; not a public compliance attestation. -->

# ArchLucid Assessment – (A) Headline Readiness: 82.70%

**Assessment date:** 2026-05-27

This score represents the `(A)` headline readiness per `Assessment-Scope-V1_1.mdc`, excluding deferred items. Explicit V1.1, V1.x, V2, owner-only, and `(B)` procurement-realism items are discussed where relevant but are not deducted from the `(A)` score.

**Method:** Clean-slate, first-principles assessment using the 47-quality model supplied in the request. Total weight = **125**. Formula: `sum(score * weight) / 125`.

## Executive Summary

### `(A)` Overall Headline Readiness
ArchLucid is a credible V1/V1.1-headline product for guarded enterprise pilots and early sales-led production conversations. Its strongest assets are the end-to-end review loop, committed manifests, evidence packages, policy packs, audit trails, explainability, Azure-native deployment posture, and buyer-facing pilot runbooks. The score is held back by correctness confidence semantics, workflow stickiness, operator cognitive load, and the need to turn many strong primitives into one obvious recurring operating loop.

### `(B)` Procurement / Market-Motion Realism
Procurement friction remains real but outside `(A)`: no CPA SOC 2 report, no third-party pen-test report, sales-led quote-to-cash, and external proof that still depends on customer/owner action. The trust center, DPA, CAIQ/SIG, SOC 2 self-assessment, procurement pack, security posture, and roadmap are strong for early diligence. They are not yet frictionless for strict enterprise RFPs.

### Commercial Picture
The commercial thesis is strong: reduce architecture-review labor, create governed evidence, make architecture decisions explainable, and improve compliance posture before implementation. The commercial weakness is packaging and habit formation. Buyers can see value, but the recurring "why I open this every week" loop is not yet as crisp as the technical capability set.

### Enterprise Picture
The enterprise foundation is materially above average for this stage: database-per-tenant isolation, OIDC/SAML/SCIM, audit, policy packs, approvals, procurement artifacts, least-privilege Azure ingestion, private endpoint/WAF IaC, and SLO/runbook material. Adoption still requires skilled operators for identity, extractor flow, governance setup, and production observability.

### Engineering Picture
The engineering base is serious: modular .NET, Dapper/SQL, DbUp, OpenAPI snapshots, contract tests, observability, RAG infrastructure, quality gates, data-consistency probes, and Azure-native IaC. The biggest engineering risks are not "missing platform basics"; they are confidence propagation, degraded-run visibility, retrieval freshness, provenance materialization, and controlling architectural complexity as the surface grows.

## Deferred Scope Uncertainty

No material uncertainty. I located the deferral sources needed for this assessment in `docs/library/V1_SCOPE.md`, `docs/library/V1_DEFERRED.md`, `docs/go-to-market/TRUST_CENTER.md`, `docs/security/SOC2_SELF_ASSESSMENT_2026.md`, and `docs/go-to-market/SOC2_ROADMAP.md`. I did not deduct `(A)` readiness for items explicitly deferred there.

## Weighted Quality Assessment

Qualities are ordered by weighted deficiency signal: `(100 - score) * weight`.

| Rank | Quality | Score | Weight | Weighted impact | Weighted deficiency signal | Justification / tradeoffs / recommendations / fixability |
| ---: | --- | ---: | ---: | ---: | ---: | --- |
| 1 | Correctness | 80 | 8 | 5.12 | 160 | The core review path is coherent and well-tested, but decision confidence, degraded finding coverage, trace completeness, retrieval freshness, and stable provenance snapshots still cap reliance on outputs. Tradeoff: stricter correctness evidence slows feature velocity. Improve confidence semantics, partial-failure surfacing, retrieval freshness, and provenance materialization. **V1-actionable.** |
| 2 | Stickiness | 77 | 6 | 3.70 | 138 | Manifests, digests, compare/replay, policy packs, audit, and ROI exist, but they are not yet one unmistakable recurring operating system for architecture risk. Tradeoff: workflow memory adds product complexity. Add risk-register framing, dispositions, waivers, decision register, and decision-led digests. **Mostly V1-actionable; some connector depth is V1.1.** |
| 3 | AI/Agent Readiness | 84 | 8 | 5.38 | 128 | Real/simulator modes, schema validation, redaction, budgets, grounding, and evaluation hooks are strong. Remaining gaps are degraded trace propagation, agent reasoning visibility, and real-mode operational evidence. Tradeoff: strict AI governance creates configuration burden. **V1-actionable.** |
| 4 | Marketability | 85 | 8 | 5.44 | 120 | The wedge is credible: evidence-backed AI architecture review with governance and sponsor artifacts. The gap is proof density and buyer-job packaging, not concept quality. Tradeoff: Azure-first focus increases credibility but narrows the initial market. **V1-actionable.** |
| 5 | Cutting-Edge AI Technology | 85 | 8 | 5.44 | 120 | Azure OpenAI, structured outputs, RAG, faithfulness checks, summarization, retrieval corpus work, and content safety are modern. It is intentionally enterprise-safe rather than experimental. Advanced graph-RAG/agentic retrieval are later-scope. **V1 hardening; advanced retrieval V2.** |
| 6 | Adoption Friction | 81 | 6 | 3.89 | 114 | The first-pilot path and accelerators help, but identity, SQL, extractor upload, policy choices, and operator routing still require competence. Tradeoff: safer customer-controlled ingestion slows self-service. Improve guided defaults and in-product setup sequencing. **V1-actionable.** |
| 7 | Time-to-Value | 87 | 7 | 4.87 | 91 | The Core Pilot and first-pilot path can reach committed manifest and sponsor export quickly. Real customer value still depends on evidence collection and environment setup. Tradeoff: trust-safe ingestion is slower than vendor-held credentials. **V1-actionable.** |
| 8 | Proof-of-ROI Readiness | 84 | 5 | 3.36 | 80 | ROI model, executive summary, cost evidence labels, and sponsor packets are solid. The gap is realized-value tracking from risk disposition to business outcome. Tradeoff: conservative assumptions reduce overclaim risk. **V1-actionable.** |
| 9 | Differentiability | 80 | 4 | 2.56 | 80 | Evidence-backed AI architecture review is differentiated from generic copilots, but incumbents may own broader EA/GRC habits. Sharpen signed review-package proof and recurring risk governance. **V1-actionable.** |
| 10 | Workflow Embeddedness | 78 | 3 | 1.87 | 66 | REST, CLI, UI, SCIM, CI, Azure extractor, and some integration surfaces exist. Daily-work connectors are partly V1.1, so V1 needs clearer "use this today" automation recipes. **V1 docs/actionable; first-party connector breadth V1.1.** |
| 11 | Executive Value Visibility | 84 | 4 | 2.69 | 64 | ROI, value reports, scorecards, drift, and sponsor exports are strong. Executives still need fewer, sharper live decision cards. **V1-actionable.** |
| 12 | Usability | 79 | 3 | 1.90 | 63 | Users can complete core tasks, but the surface area is dense: reviews/runs, manifests, governance, policy packs, evidence, digests, graph, replay, Ask. Tradeoff: power-user depth raises first-week load. **V1-actionable.** |
| 13 | Architectural Integrity | 82 | 3 | 1.97 | 54 | The layers and composition roots are coherent, with explicit architecture maps. Some coupling and legacy coordinator/authority duality remain expensive to reason about. **V1-actionable.** |
| 14 | Trustworthiness | 83 | 3 | 1.99 | 51 | Signed manifests, audit, policy packs, approvals, explainability, and trust docs are strong. Confidence provenance and human disposition/waiver history need to be first-class. **V1-actionable.** |
| 15 | Decision Velocity | 77 | 2 | 1.23 | 46 | Governance helps architecture decisions, but purchase and executive decisions still require synthesis. Add explicit "decision needed now" views and packets. **V1-actionable.** |
| 16 | Commercial Packaging Readiness | 78 | 2 | 1.25 | 44 | Pricing, tiers, quote path, billing safety, and order form material exist. Packaging still reads capability-led more than job-led. Live commerce cutover is owner/V1.1 and excluded from `(A)`. **V1-actionable.** |
| 17 | Traceability | 86 | 3 | 2.06 | 42 | Run IDs, manifests, audit events, provenance, decision traces, and trace IDs are strong. Unifying decision/finding/provenance lineage would make it easier to trust quickly. **V1-actionable.** |
| 18 | Security | 86 | 3 | 2.06 | 42 | Tenant isolation, Key Vault, RBAC, rate limits, content safety, redaction, audit, and least-privilege extractor posture are credible. Keep retrieval fail-closed isolation and production linting tight. **V1-actionable.** |
| 19 | Procurement Readiness | 80 | 2 | 1.28 | 40 | Procurement pack, trust center, DPA, CAIQ/SIG, SOC self-assessment, and evidence freshness are strong. CPA SOC 2 and third-party pen test remain `(B)` friction only. **V1 docs; attestation owner/V2.** |
| 20 | Reliability | 81 | 2 | 1.30 | 38 | Health, retries, circuit breakers, DbUp, outbox, and data-consistency probes exist. Partial-run and retrieval/index staleness visibility still matter. **V1-actionable.** |
| 21 | Interoperability | 82 | 2 | 1.31 | 36 | OpenAPI, generated clients, CLI, SCIM, API contracts, and Azure extractor upload are solid. Keep V1 vs V1.1 integration boundaries obvious. **V1-actionable.** |
| 22 | Explainability | 82 | 2 | 1.31 | 36 | Aggregate explain, provenance, findings, reasoning traces, and citations exist. Finding-level confidence and reasoning should be more directly visible. **V1-actionable.** |
| 23 | Data Consistency | 83 | 2 | 1.33 | 34 | SQL, migrations, single DDL discipline, idempotency, probes, and orphan remediation are strong. Snapshot invalidation and retrieval chunk metadata remain hardening areas. **V1-actionable.** |
| 24 | Maintainability | 83 | 2 | 1.33 | 34 | Modular projects, tests, and docs are strong, but volume and dual paths add maintenance cost. Continue boundary tests and code-map simplification. **V1-actionable.** |
| 25 | Compliance Readiness | 84 | 2 | 1.34 | 32 | Policy packs, governance, audit, drift, CAIQ/SIG, DPA, and self-assessment are good. External attestation is excluded from `(A)`. **V1 product/docs.** |
| 26 | Cognitive Load | 73 | 1 | 0.58 | 27 | The product asks users to learn many concepts. Progressive disclosure helps, but first-week mental load is still high. **V1-actionable.** |
| 27 | Policy and Governance Alignment | 87 | 2 | 1.39 | 26 | Policy packs, approval workflow, pre-commit gate, conflict resolution, audit, and drift fit enterprise governance. Add dispositions and waivers. **V1-actionable.** |
| 28 | Scalability | 77 | 1 | 0.62 | 23 | Database-per-tenant scales isolation, not operational simplicity. Optional caches and read-scale docs exist, but scale thresholds need crisp operator guidance. **V1 docs/ops; some V2.** |
| 29 | Accessibility | 78 | 1 | 0.62 | 22 | Automated accessibility coverage and VPAT material are credible. Manual assistive-technology studies are out of `(A)`, but route hygiene must stay current. **V1-actionable.** |
| 30 | Azure Compatibility and SaaS Deployment Readiness | 89 | 2 | 1.42 | 22 | Azure-native architecture is coherent across Entra, AOAI, SQL, Blob, Key Vault, Container Apps, WAF, Terraform, and Marketplace alignment. **V1 maintenance.** |
| 31 | Performance | 78 | 1 | 0.62 | 22 | Caches and p95 thinking exist, but graph/provenance rebuilds and rich explanation paths can become costly. Materialize snapshots and benchmark critical reads. **V1-actionable.** |
| 32 | Availability | 79 | 1 | 0.63 | 21 | Health/SLO/probe/failover docs are good, but staging evidence is not production SLA proof. **V1 docs/ops.** |
| 33 | Extensibility | 79 | 1 | 0.63 | 21 | Custom handler documentation exists, while public SDK/marketplace/MCP-as-V1 are excluded. Make extension boundaries easier to find. **V1 docs; MCP V1.1.** |
| 34 | Customer Self-Sufficiency | 80 | 1 | 0.64 | 20 | CLI doctor, support bundle, first-pilot path, and runbooks help. Identity/extractor/governance setup still benefits from operator guidance. **V1-actionable.** |
| 35 | Auditability | 91 | 2 | 1.46 | 18 | Append-only audit, typed event catalog, CI matrix guard, CSV export, and correlation are strong. Add disposition/waiver events. **V1-actionable.** |
| 36 | Observability | 82 | 1 | 0.66 | 18 | OpenTelemetry, metrics, dashboards, alerts, and health diagnostics are strong. Environment binding and exported evidence still require operator work. **V1-actionable.** |
| 37 | Modularity | 82 | 1 | 0.66 | 18 | Project boundaries and interfaces are generally good; remaining coupling debt should be closed before more surfaces are added. **V1-actionable.** |
| 38 | Cost-Effectiveness | 82 | 1 | 0.66 | 18 | LLM budgets, cost labels, wallet, estimator, and Azure cost evidence are credible. Keep duplicate embedding and stale cost estimates under control. **V1-actionable.** |
| 39 | Evolvability | 83 | 1 | 0.66 | 17 | Versioning, migrations, flags, docs, and changelogs support evolution. Surface breadth raises change-management cost. **V1 process.** |
| 40 | Template and Accelerator Richness | 84 | 1 | 0.67 | 16 | Azure SaaS, AI governance, and healthcare claims walkthroughs now make the product more concrete. More buyer-specific accelerators would help, but not before seeing which sell. **V1-actionable.** |
| 41 | Change Impact Clarity | 84 | 1 | 0.67 | 16 | Compare, replay, deltas, provenance, and drift are useful. Package "what changed, why it matters, and who must decide" more explicitly. **V1-actionable.** |
| 42 | Supportability | 84 | 1 | 0.67 | 16 | Support bundle, problem details, health, config lint, trace IDs, and runbooks are strong. Complete environment dashboard binding. **V1-actionable.** |
| 43 | Manageability | 84 | 1 | 0.67 | 16 | Config catalog, admin diagnostics, tenant settings, governance controls, and linting are good. Breadth risks misconfiguration. **V1-actionable.** |
| 44 | Testability | 84 | 1 | 0.67 | 16 | Contract, persistence, UI, RAG, and smoke coverage are strong. Keep real-mode and retrieval regressions visible. **V1; 95% ratchet V1.1.** |
| 45 | Deployability | 85 | 1 | 0.68 | 15 | Docker, compose, Terraform, health, and release scripts exist. Deployment still requires Azure skill. **V1 docs/ops.** |
| 46 | Documentation | 87 | 1 | 0.70 | 13 | Documentation is deep and increasingly well-routed. Volume remains the main defect. **V1-actionable.** |
| 47 | Azure Ecosystem Fit | 91 | 1 | 0.73 | 9 | Azure alignment is excellent and honest. Maintain Azure-first claims and avoid implying AWS/GCP hosting. **V1 maintenance.** |

## Top 12 Most Important Weaknesses

1. The product is stronger as a review engine than as a recurring architecture-risk operating loop.
2. Correctness confidence is not yet explicit enough for high-stakes decisions.
3. Degraded or partial finding coverage can still look too much like a cleanly completed review.
4. Operator cognitive load remains high despite improved first-pilot routing.
5. Executive surfaces need fewer, sharper live decision cards.
6. Finding disposition, waiver, and exception memory are not first-class enough.
7. ROI proof needs more realized-value tracking after findings are accepted, deferred, remediated, or waived.
8. Provenance and retrieval quality are good but need freshness, snapshot, and regression gates to stay trustworthy.
9. V1 vs V1.1 integration boundaries must stay very clear in sales and implementation conversations.
10. Deployment and identity setup still assume capable enterprise operators.
11. Procurement artifacts are strong for pilots but not enough for strict attestation-driven enterprises.
12. The codebase and docs are broad enough that architectural discipline must remain aggressive.

## Top 6 Monetization Blockers

1. Customers may treat ArchLucid as a one-time assessment unless the recurring governance loop becomes obvious.
2. Realized ROI is not yet tracked tightly enough from finding to action to value.
3. Commercial packaging is still too capability-led and not consistently job/accelerator-led.
4. Executive decision narrative is spread across several surfaces instead of one sponsor-ready view.
5. Sales-led quote-to-cash slows conversion; live checkout/Marketplace is deferred and excluded from `(A)` but still affects revenue speed.
6. External proof such as public references and CPA assurance remains owner/customer-dependent and affects close rates under `(B)`.

## Top 6 Enterprise Adoption Blockers

1. Identity, tenant, and scope setup require precision.
2. Azure evidence ingestion requires customer-controlled script execution and upload discipline.
3. Risk acceptance, finding disposition, and waiver workflows need to be more first-class.
4. SOC 2 CPA and third-party pen-test gaps remain procurement friction, even though they are excluded from `(A)`.
5. V1.1 first-party connectors mean V1 pilots need clear REST/CLI/UI automation recipes.
6. First-week operators face too many concepts unless the product keeps narrowing the default path.

## Top 6 Engineering Risks

1. Ambiguous decision confidence and confidence source.
2. Partial or degraded finding coverage not being visible enough.
3. Retrieval freshness, chunking versioning, and embedding drift over time.
4. Provenance snapshot rebuild cost and point-in-time stability.
5. Layer-boundary debt around authority/coordinator, decisioning, notifications, and integrations.
6. Production observability requiring environment-specific binding that can be missed.

## Most Important Truth

ArchLucid already has the enterprise primitives; its readiness now depends on turning those primitives into a simple, confidence-labeled, recurring decision workflow that buyers can trust and habitually use.

## Top Improvement Opportunities

### 1. Add Explicit Decision Confidence and Confidence Source
- **Why it matters:** Buyers need to know whether a decision is measured, inferred, heuristic, failed, or unknown.
- **Expected impact:** Correctness (+5-7 pts), Trustworthiness (+3-5 pts), Explainability (+3-4 pts). Weighted readiness impact: +0.5-0.8%.
- **Affected qualities:** Correctness, Trustworthiness, Explainability, Executive Value Visibility.
- **Actionability:** Fully actionable now.
- **Cursor prompt:**
  ```text
  Implement explicit decision confidence projection for manifest decisions.
  Scope: add nullable confidence score and confidence source/status to the manifest decision DTO/model used by the committed review package. Reuse existing finding/evaluation confidence data where available. Represent Unknown separately from 0. Populate from evaluation confidence first, then finding confidence, then Unknown. Update API contract snapshots and generated clients if public DTOs change.
  Acceptance criteria: decisions expose confidence only when computed; Unknown is explicit; no path silently maps missing confidence to 0; tests cover computed, inferred, and unknown decisions; manifest commit semantics are unchanged.
  Constraints: do not add a parallel decision table; preserve existing manifest identity/hash rules unless an existing test explicitly requires an update; keep classes in separate files; use concrete types over var; no ConfigureAwait(false) in tests.
  What not to change: pricing, governance approval semantics, external connector scope, or deferred V1.1 items.
  ```

### 2. Surface Degraded Finding Coverage as a First-Class Run Outcome
- **Why it matters:** A completed review with missing finding-engine coverage is materially different from a clean success.
- **Expected impact:** Correctness (+3-5 pts), Reliability (+3-4 pts), Supportability (+3-4 pts). Weighted readiness impact: +0.3-0.6%.
- **Affected qualities:** Correctness, Reliability, Trustworthiness, Supportability.
- **Actionability:** Fully actionable now.
- **Cursor prompt:**
  ```text
  Surface finding-engine partial failures and degraded coverage in run, manifest, and operator UI surfaces.
  Scope: add a run-level or manifest-level coverage summary for finding engines attempted, succeeded, skipped, and failed. Emit metrics and durable diagnostic/audit signals where existing patterns support it. Show a clear warning on review detail and exported sponsor artifacts when coverage is degraded.
  Acceptance criteria: an operator can see that a review completed with degraded finding coverage; missing engines are named without leaking sensitive exception data; tests cover success, partial failure, and exported warning behavior.
  Constraints: do not change the intentional continue-on-single-engine-failure behavior unless an existing invariant already requires it; do not broaden exception swallowing; keep warnings distinct from critical findings.
  What not to change: first-party ITSM scope, alert routing channels, or V1.1 connector commitments.
  ```

### 3. Add Finding Disposition Workflow
- **Why it matters:** Stickiness requires the product to remember human decisions, not only produce findings.
- **Expected impact:** Stickiness (+6-10 pts), Auditability (+2-3 pts), Trustworthiness (+3-4 pts). Weighted readiness impact: +0.5-0.9%.
- **Affected qualities:** Stickiness, Auditability, Workflow Embeddedness, Trustworthiness.
- **Actionability:** Fully actionable now.
- **Cursor prompt:**
  ```text
  Add a finding disposition workflow for architecture review findings.
  Scope: implement dispositions such as Accepted, Deferred, NeedsEvidence, Remediated, and RejectedAsNotApplicable over existing finding records. Require rationale for Accepted, Deferred, and RejectedAsNotApplicable. Require revisit date for Deferred and evidence request text for NeedsEvidence. Surface latest disposition and history on finding detail and governance findings/risk views.
  Acceptance criteria: disposition history is persisted, visible, filterable, and audited; deferred findings can be listed by due/revisit date; remediated findings do not count as ROI unless linked to actual work or accepted risk semantics; API/UI tests cover authorization and validation.
  Constraints: all SQL DDL must remain in the single database DDL file plus migration; do not treat waived/deferred as fixed; keep public status names stable and documented.
  What not to change: manifest commit correctness, pre-commit gate behavior, or connector roadmap.
  ```

### 4. Add First-Class Waiver / Risk Exception Records
- **Why it matters:** Enterprise governance needs controlled, expiring risk acceptance.
- **Expected impact:** Stickiness (+5-8 pts), Policy/Governance Alignment (+3-4 pts), Compliance Readiness (+2-3 pts). Weighted readiness impact: +0.4-0.7%.
- **Affected qualities:** Stickiness, Governance, Compliance, Trustworthiness, Auditability.
- **Actionability:** Fully actionable now.
- **Cursor prompt:**
  ```text
  Implement first-class waiver / risk exception records linked to findings, policy rules, runs, and manifests.
  Scope: add a Waiver or RiskException model with tenant scope, owner, rationale, evidence, expiration, status, and links to finding/run/manifest/policy rule when available. Add create, renew, revoke, and expire paths. Surface active, expiring, and expired waivers in governance findings and digests. Emit durable audit events.
  Acceptance criteria: no indefinite waiver is allowed without an explicit configured exception; expired waivers return the item to decision-needed state; audit export shows who accepted risk, why, and until when; tests cover validation, expiration, authorization, and audit.
  Constraints: waived does not mean remediated; do not bypass existing governance approval posture; use existing Dapper/SQL patterns.
  What not to change: pricing tiers, live commerce gates, or V1.1 connectors.
  ```

### 5. Reframe Governance Findings as an Architecture Risk Register
- **Why it matters:** This is the fastest way to make ArchLucid feel like a recurring operating system, not a one-time scanner.
- **Expected impact:** Stickiness (+8-12 pts), Workflow Embeddedness (+3-5 pts), Executive Value Visibility (+2-4 pts). Weighted readiness impact: +0.6-1.0%.
- **Affected qualities:** Stickiness, Workflow Embeddedness, Usability, Executive Value Visibility.
- **Actionability:** Fully actionable now.
- **Cursor prompt:**
  ```text
  Reframe the governance findings experience as an Architecture Risk Register using existing findings, manifests, policy packs, monitored risks, and governance data.
  Scope: update operator copy, headings, empty states, filters, and columns so an operator can answer "what architecture risks do we own right now?" Show owner, disposition, due/revisit date, severity, linked review, linked manifest, evidence links, last reviewed, and aging where data exists. Use explicit placeholders for data introduced by disposition/waiver work.
  Acceptance criteria: findings and manifest risks are linked, not duplicated; the page can be used in a governance meeting; missing fields are explicit; tests cover key rendering states.
  Constraints: avoid broad redesign; reuse current data and UI primitives; do not implement first-party ITSM as part of this task.
  What not to change: API route names unless necessary; V1.1 connector commitments.
  ```

### 6. Create a Decision Register Over Manifest Decisions
- **Why it matters:** Decision history exists, but executives and operators should not have to open each manifest to find it.
- **Expected impact:** Executive Value Visibility (+4-6 pts), Decision Velocity (+4-5 pts), Traceability (+2-3 pts). Weighted readiness impact: +0.3-0.5%.
- **Affected qualities:** Executive Value Visibility, Decision Velocity, Traceability, Stickiness.
- **Actionability:** Fully actionable now.
- **Cursor prompt:**
  ```text
  Add an operator Decision Register view over signed manifest decisions and governance lineage.
  Scope: treat committed manifest decisions plus approval lineage as source of truth. Add a read view listing durable decisions across reviews with links to manifest, review, findings, rationale, approval request, audit events, environment activation, and confidence source when available. Add filters for category, date, environment, confidence, owner/approver, and status.
  Acceptance criteria: operators can browse decisions without opening each review; every decision links back to source evidence; no duplicate decision lifecycle is created; tests cover empty state, filters, and links.
  Constraints: prefer query/read-model work over new persistence; do not create a separate ADR database.
  What not to change: manifest canonicalization, audit event semantics, or pricing.
  ```

### 7. Replace or Label All Production Executive Mock KPIs
- **Why it matters:** Mock-looking executive numbers damage trust faster than missing cards.
- **Expected impact:** Trustworthiness (+3-5 pts), Executive Value Visibility (+4-6 pts), Proof-of-ROI Readiness (+2-3 pts). Weighted readiness impact: +0.3-0.6%.
- **Affected qualities:** Executive Value Visibility, Trustworthiness, Proof-of-ROI Readiness.
- **Actionability:** Fully actionable now.
- **Cursor prompt:**
  ```text
  Replace production executive dashboard mock KPIs with live data or explicit empty states.
  Scope: inventory executive/dashboard/value-report cards and identify mock, demo, illustrative, and live sources. Replace production mock KPI imports with live ExecutiveRoiSummary, compliance drift, disposition counts, waiver expiry counts, completed reviews, and cost evidence freshness where APIs exist. Label demo-only values clearly.
  Acceptance criteria: production executive routes have no unlabeled mock numbers; fewer live cards are acceptable; empty states explain the missing prerequisite; tests prevent production routes from importing known mock KPI modules.
  Constraints: do not remove demo route behavior; do not change pricing math or ROI formulas.
  What not to change: demo seed assets, marketing screenshots, or deferred reference-customer scope.
  ```

### 8. Make Governance Digests Decision-Led
- **Why it matters:** A weekly decision digest creates a habit and a meeting artifact.
- **Expected impact:** Stickiness (+5-8 pts), Executive Value Visibility (+3-4 pts), Change Impact Clarity (+3-4 pts). Weighted readiness impact: +0.4-0.7%.
- **Affected qualities:** Stickiness, Executive Value Visibility, Change Impact Clarity, Workflow Embeddedness.
- **Actionability:** Fully actionable now.
- **Cursor prompt:**
  ```text
  Extend governance digests with a decision-needed section.
  Scope: include pending approvals, stale risks, deferred findings due, expiring waivers, high-severity unowned findings, evidence requests, and "what changed since last digest" using compare/recent deltas/compliance drift. Include value delivered from live ROI and completed dispositions when available. Keep role-aware variants concise.
  Acceptance criteria: a weekly digest can run a governance meeting; FYI items are separated from decisions needed; every item links to source evidence; customer-facing digests contain no mock values.
  Constraints: do not add new delivery channels; Teams/Slack delivery remains V1.1 unless already shipped and documented as in scope.
  What not to change: digest subscription auth policy or V1.1 chat-ops commitments.
  ```

### 9. Materialize Provenance Snapshots on Commit
- **Why it matters:** Stable point-in-time provenance improves audit defensibility and performance.
- **Expected impact:** Traceability (+3-5 pts), Performance (+3-4 pts), Data Consistency (+2-3 pts). Weighted readiness impact: +0.3-0.5%.
- **Affected qualities:** Traceability, Performance, Data Consistency, Supportability.
- **Actionability:** Fully actionable now.
- **Cursor prompt:**
  ```text
  Materialize decision provenance snapshots after successful commit.
  Scope: after authority commit or terminal run state, build and save a provenance snapshot once using idempotent upsert. Prefer snapshot reads when fresh and rebuild only when missing or stale. Add invalidation using manifest/findings revision, content hash, or equivalent stable marker. Add metrics for snapshot read, rebuild, stale, and failure paths.
  Acceptance criteria: provenance reads are point-in-time stable; fallback rebuild is explicit and metered; tests cover commit-created snapshot, idempotent retry, stale invalidation, and read-path preference.
  Constraints: preserve replay isolation and existing graph semantics; do not include sensitive prompt text in snapshots.
  What not to change: manifest hash rules unless already established by existing tests.
  ```

### 10. Harden Retrieval Freshness, Embedding Drift, and Chunking Versioning
- **Why it matters:** Stale or mixed-generation chunks silently degrade AI output quality.
- **Expected impact:** Correctness (+3-5 pts), AI/Agent Readiness (+2-3 pts), Reliability (+2-3 pts). Weighted readiness impact: +0.3-0.6%.
- **Affected qualities:** Correctness, AI/Agent Readiness, Reliability, Cutting-Edge AI Technology.
- **Actionability:** Fully actionable now.
- **Cursor prompt:**
  ```text
  Harden retrieval freshness, embedding drift, and chunking versioning.
  Scope: ensure retrieval chunks carry embedding model identity, embedding dimension, content hash, and chunking fingerprint. Skip re-embedding unchanged content. Exclude or rebuild stale/mismatched chunks. Surface last-indexed-at and indexer failure metrics/health. Add tests for unchanged content skip, dimension mismatch, model switch, and chunking option change.
  Acceptance criteria: mixed-dimension chunks cannot be returned in top-K; chunking changes invalidate old chunks; index staleness is visible; startup/indexer failure behavior is documented.
  Constraints: do not add a new vector store; keep tenant-scope filters mandatory; real Azure dependencies must remain optional in default CI.
  What not to change: V1.1 graph-RAG or MCP scope.
  ```

### 11. Propagate Agent Reasoning Trace into Finding Explainability
- **Why it matters:** Finding-level trust should not require manual trace hunting.
- **Expected impact:** Explainability (+4-6 pts), Traceability (+2-3 pts), Trustworthiness (+2-3 pts). Weighted readiness impact: +0.3-0.5%.
- **Affected qualities:** Explainability, Traceability, Trustworthiness.
- **Actionability:** Fully actionable now.
- **Cursor prompt:**
  ```text
  Persist bounded agent reasoning context into finding explainability.
  Scope: copy a bounded, redacted reasoning summary or reference hash from agent result traces into finding explainability data for agent-backed findings. Truncate safely, hash over-limit values, and include the reference in provenance/explanation API payloads where appropriate.
  Acceptance criteria: finding detail can explain model reasoning at a bounded level; no full prompt/response duplication occurs; redaction rules are respected; tests cover normal, missing, over-limit, and redacted paths.
  Constraints: never persist unredacted prompt material in customer-facing payloads; preserve existing agent trace storage behavior.
  What not to change: raw trace forensic storage, blob persistence policy, or SOC wording.
  ```

### 12. Add Executive Decision Packet Fixture
- **Why it matters:** The sponsor story should be protected by tests, not only docs.
- **Expected impact:** Executive Value Visibility (+3-5 pts), Proof-of-ROI Readiness (+2-3 pts), Marketability (+2 pts). Weighted readiness impact: +0.3-0.5%.
- **Affected qualities:** Executive Value Visibility, Proof-of-ROI Readiness, Marketability.
- **Actionability:** Fully actionable now.
- **Cursor prompt:**
  ```text
  Add a deterministic executive decision packet fixture.
  Scope: create a test fixture that generates an executive-ready packet from seeded/demo review data. Include top decisions, top risks, ROI assumptions, evidence links, confidence labels, cost evidence freshness, and next actions. Snapshot stable sections and avoid volatile timestamps.
  Acceptance criteria: tests fail if decision, ROI assumption, confidence, or evidence sections disappear; output is sponsor-readable; no production mock KPI values appear.
  Constraints: no PII in fixtures; do not change pricing math; keep demo-only labels explicit.
  What not to change: live pricing, reference-customer claims, or SOC roadmap.
  ```

### 13. Tighten V1 Integration Catalog Boundaries
- **Why it matters:** Sales and implementation confusion around V1 vs V1.1 will create avoidable friction.
- **Expected impact:** Adoption Friction (+2-3 pts), Interoperability (+2-3 pts), Procurement Readiness (+1-2 pts). Weighted readiness impact: +0.2-0.3%.
- **Affected qualities:** Interoperability, Adoption Friction, Commercial Packaging Readiness.
- **Actionability:** Fully actionable now.
- **Cursor prompt:**
  ```text
  Tighten V1 vs V1.1 integration catalog boundaries.
  Scope: review docs/go-to-market/INTEGRATION_CATALOG.md and linked integration docs. Ensure V1 paths are clearly REST, CLI, operator UI, SCIM, Azure DevOps/GitHub surfaces, Azure extractor upload, OpenAPI, and other shipped HTTP surfaces. Mark Jira, ServiceNow, Confluence, Teams, Slack, broad webhooks, and MCP according to their documented V1.1/V2 posture. Add a "what to use today in V1 pilots" table.
  Acceptance criteria: a buyer cannot mistake V1.1 connectors as V1 requirements; every V1 integration has a concrete entry point; no new connector promises are added.
  Constraints: do not downgrade shipped APIs; do not make deferred items sound abandoned.
  What not to change: actual connector implementation.
  ```

### 14. Add Production Observability Binding Check
- **Why it matters:** Observability exists, but a misconfigured deployment can still run without useful exported telemetry.
- **Expected impact:** Supportability (+3-4 pts), Reliability (+2-3 pts), Manageability (+2 pts). Weighted readiness impact: +0.2-0.4%.
- **Affected qualities:** Observability, Supportability, Reliability, Manageability.
- **Actionability:** Fully actionable now.
- **Cursor prompt:**
  ```text
  Add or strengthen a production observability binding check.
  Scope: ensure production-like API and worker hosts warn or fail according to documented policy when no Application Insights, OTLP, or Prometheus export path is configured. Add a CI/report script path that produces a buyer-safe observability readiness artifact without printing secrets. Link from deployment and release docs.
  Acceptance criteria: operators get exact missing keys; no secret values are printed; tests cover API and Worker config layers; docs explain warn vs fail behavior.
  Constraints: avoid requiring Azure login in local CI; keep telemetry exporter choice flexible.
  What not to change: sampling strategy defaults or dashboard JSON unrelated to binding.
  ```

### 15. Add Scale Threshold Runbook for Hosted SaaS Operations
- **Why it matters:** Operators need to know when single-replica assumptions stop being enough.
- **Expected impact:** Scalability (+4-5 pts), Manageability (+2-3 pts), Reliability (+1-2 pts). Weighted readiness impact: +0.2-0.3%.
- **Affected qualities:** Scalability, Manageability, Reliability, Cost-Effectiveness.
- **Actionability:** Fully actionable now.
- **Cursor prompt:**
  ```text
  Add a scale threshold runbook for hosted SaaS operations.
  Scope: document when to enable Redis/hot-path cache, read replicas, Worker separation, warm tenant catalogs, per-tenant metric cardinality controls, outbox scaling, and query p95 checks. Link relevant keys from CONFIGURATION_REFERENCE.md and mark V1, V1.x, V1.1, or V2 posture where already documented.
  Acceptance criteria: an operator can decide when to move beyond small-fleet posture; reliability, cost, and complexity tradeoffs are explicit; no deferred Redis baseline is described as V1-required.
  Constraints: docs/runbook first; do not add infrastructure resources unless already represented in Terraform.
  What not to change: V2 distributed cache commitments.
  ```

### 16. Add Buyer-Job Packaging Pages for the Three Strongest Accelerators
- **Why it matters:** Buyers buy outcomes, not capability inventories.
- **Expected impact:** Marketability (+3-5 pts), Time-to-Value (+2-3 pts), Template Richness (+3-5 pts). Weighted readiness impact: +0.3-0.5%.
- **Affected qualities:** Marketability, Template and Accelerator Richness, Time-to-Value, Commercial Packaging Readiness.
- **Actionability:** Fully actionable now.
- **Cursor prompt:**
  ```text
  Add buyer-job packaging pages for the three strongest V1 accelerators.
  Scope: using existing Azure SaaS readiness, AI governance, and healthcare claims walkthroughs, create concise buyer-facing pages that state the buyer question, required inputs, shipped product steps, expected artifacts, evidence generated, and sponsor outcome. Link from PRODUCT_PACKAGING, CORE_PILOT, and relevant go-to-market docs.
  Acceptance criteria: each page is outcome-led; no V1.1 connector is required; every claim maps to shipped V1 surfaces; pages avoid generic marketing fluff.
  Constraints: docs/content only; do not add new prices or discount terms outside pricing source of truth.
  What not to change: V1 scope boundaries.
  ```

### 17. Add Live-Data Guard for Executive Routes
- **Why it matters:** Once mock KPI cleanup lands, regressions should be blocked.
- **Expected impact:** Trustworthiness (+2-3 pts), Executive Value Visibility (+2-3 pts), Testability (+1-2 pts). Weighted readiness impact: +0.2-0.3%.
- **Affected qualities:** Trustworthiness, Executive Value Visibility, Testability.
- **Actionability:** Fully actionable now.
- **Cursor prompt:**
  ```text
  Add a guard that prevents production executive routes from importing mock KPI modules.
  Scope: add a static or unit test in archlucid-ui that fails when production dashboard, executive summary, value report, or sponsor packet routes import known mock/demo KPI modules. Permit demo routes to import demo fixtures with explicit names.
  Acceptance criteria: the test catches an intentional bad import; demo-only usage remains allowed and labeled; docs near mock modules explain the rule.
  Constraints: use existing test tooling; no new dependency unless already standard in the UI project.
  What not to change: demo routes or screenshot fixtures unless tests require label updates.
  ```

### 18. Close Architecture Boundary Debt Around Decisioning and Notifications
- **Why it matters:** Core decisioning should not depend directly on delivery infrastructure.
- **Expected impact:** Architectural Integrity (+3-4 pts), Maintainability (+2-3 pts), Modularity (+2 pts). Weighted readiness impact: +0.2-0.4%.
- **Affected qualities:** Architectural Integrity, Maintainability, Modularity, Evolvability.
- **Actionability:** Fully actionable now.
- **Cursor prompt:**
  ```text
  Close direct coupling from decisioning/domain analysis to notification infrastructure.
  Scope: identify any direct Decisioning-to-Notifications references. Define domain event contracts in Core or Contracts, publish through an existing port/outbox/event pattern, and register notification handlers in Host.Composition or the Notifications adapter. Add or update architecture tests to fail direct Decisioning -> Notifications dependencies.
  Acceptance criteria: behavior is preserved; Decisioning no longer references Notifications directly; tests cover event publication and dependency boundary.
  Constraints: do not introduce cycles; reuse existing outbox/event patterns before adding abstractions.
  What not to change: webhook payload schemas or V1.1 connector roadmap.
  ```

### 19. Reduce First-Week Cognitive Load in the Operator Shell
- **Why it matters:** The product is powerful but still mentally expensive for new operators.
- **Expected impact:** Usability (+3-5 pts), Adoption Friction (+2-4 pts), Cognitive Load (+5-8 pts). Weighted readiness impact: +0.3-0.5%.
- **Affected qualities:** Usability, Adoption Friction, Cognitive Load, Customer Self-Sufficiency.
- **Actionability:** Fully actionable now.
- **Cursor prompt:**
  ```text
  Reduce first-week cognitive load in the operator shell.
  Scope: review first-session routes Home, Onboarding, New review, Reviews, review detail, and first-pilot links. Ensure each route has one primary next action, plain-language run/review bridge copy, and short "use this when" guidance. Deemphasize Operate surfaces until after first committed review unless already intentionally visible.
  Acceptance criteria: a new operator can complete create -> execute -> commit -> sponsor export without learning graph/replay/governance concepts first; tests cover critical copy/links where existing UI tests support it.
  Constraints: avoid broad redesign; preserve progressive disclosure and authority shaping.
  What not to change: route names, API contracts, or screenshots unless copy changes require regeneration.
  ```

### 20. Add Realized-Value Tracking From Disposition to ROI
- **Why it matters:** Expansion and renewal need proof that findings turned into value.
- **Expected impact:** Proof-of-ROI Readiness (+4-6 pts), Stickiness (+3-4 pts), Executive Value Visibility (+2-3 pts). Weighted readiness impact: +0.3-0.6%.
- **Affected qualities:** Proof-of-ROI Readiness, Stickiness, Executive Value Visibility, Decision Velocity.
- **Actionability:** Fully actionable now.
- **Cursor prompt:**
  ```text
  Add realized-value tracking tied to finding dispositions and ROI summaries.
  Scope: when a finding is Remediated or Accepted as risk, allow operators to attach realized or estimated value notes using existing tenant cost settings and ROI basis labels. Surface completed/remediated value in executive summaries with explicit confidence/basis labels. Keep assumptions inspectable.
  Acceptance criteria: realized value is distinguishable from estimated potential savings; ROI totals do not inflate from waived/deferred findings; tests cover basis labels and summary aggregation.
  Constraints: do not change locked pricing math; avoid claiming customer-specific savings without operator-entered evidence.
  What not to change: default ROI model assumptions outside the single source documents.
  ```

### 21. Add Accessibility Route Evidence Refresh Guard
- **Why it matters:** Accessibility disclosure is only useful if top-route evidence stays current.
- **Expected impact:** Accessibility (+3-5 pts), Procurement Readiness (+1-2 pts), Usability (+1-2 pts). Weighted readiness impact: +0.1-0.2%.
- **Affected qualities:** Accessibility, Procurement Readiness, Usability.
- **Actionability:** Fully actionable now.
- **Cursor prompt:**
  ```text
  Add an accessibility evidence freshness guard for top operator and marketing routes.
  Scope: identify the canonical top-route axe/VPAT evidence files and add a lightweight freshness or route-list drift check. Ensure public accessibility docs distinguish automated evidence from manual review and do not imply participant AT testing unless separately performed.
  Acceptance criteria: stale or missing top-route evidence is visible in CI or a release checklist; route additions prompt evidence updates; buyer-facing wording stays honest.
  Constraints: do not require manual assistive-technology testing as a V1 headline gate; do not alter out-of-scope assessment rules.
  What not to change: VPAT claims beyond evidence-supported wording.
  ```

### 22. DEFERRED — First-Party ITSM Productization
- **Reason deferred:** Jira and ServiceNow first-party connector depth is documented as V1.1 scope, not a current `(A)` V1 headline gap.
- **Specific information needed later:** Provider order, tenant URLs, credential storage path, project/table mappings, status mapping approval, validation tenant availability, and whether one-click create should ship before bidirectional sync.

### 23. DEFERRED — Live Stripe / Marketplace Commercial Cutover
- **Reason deferred:** Requires owner-controlled Stripe live keys, Partner Center publication, tax/payout setup, DNS, and commercial go-live approval.
- **Specific information needed later:** Live Stripe Key Vault path, webhook secret, Price IDs, Marketplace offer/plan IDs, production landing URL, seller verification status, DNS target, and go-live approval.

### 24. DEFERRED — SOC 2 CPA Readiness Engagement
- **Reason deferred:** CPA SOC 2 attestation is excluded from `(A)` and requires budget/vendor decisions.
- **Specific information needed later:** Budget ceiling, auditor/readiness consultant shortlist, Type I vs Type II target, observation window, system boundary, executive owner, and desired customer-facing status wording.

### 25. DEFERRED — Published Reference Customer Case Study
- **Reason deferred:** Requires customer legal approval, measured customer ROI, logo rights, and reference-call commitment.
- **Specific information needed later:** Customer name, legal approver, publishable metrics, logo asset, case-study approval path, permitted quote/reference language, and reference-call commitment.

## Prompt Batching Guidance

| Batch | Improvements | Why |
| --- | --- | --- |
| Batch A — Correctness and trust core | 1, 2, 9, 10, 11 | Shared confidence, degraded-run, provenance, and retrieval context; highest weighted leverage. |
| Batch B — Stickiness workflow | 3, 4, 5, 6, 8, 20 | Same findings/governance/decision-loop surface; best context reuse. |
| Batch C — Executive proof | 7, 12, 17 | Executive cards, packet fixture, and mock-data guard are tightly related. |
| Batch D — Adoption and packaging | 13, 16, 19 | V1 integration clarity, buyer-job pages, and lower cognitive load reinforce the first-pilot sale. |
| Batch E — Operations hardening | 14, 15, 18, 21 | Observability binding, scale guidance, architecture boundary, and accessibility freshness are separable but low-conflict. |
| Deferred batch | 22, 23, 24, 25 | Wait for owner/customer inputs; do not start as engineering work. |

Recommended order: Batch A, then Batch B, then Batch C. Batch D can run in parallel with engineering-heavy Batch A if staffing permits.

## Resolved Decisions (operator-deferred to agent judgment, 2026-05-27)

The operator delegated all non-deferred pending questions to agent judgment so improvement work can proceed without further blocking. Decisions below are durable for V1 unless the operator overrides them in a later session. Each decision includes a one-line rationale so reviewers can challenge the call without re-deriving it.

### Add Explicit Decision Confidence and Confidence Source
- **Decision:** Collapse the seven internal `DecisionConfidenceSource` enum values into three buyer-facing labels and keep the raw enum on internal/audit surfaces only.
  - Buyer-facing: `Evidence-backed` (maps to `FindingEvaluation`, `FindingAggregate`, `RuleEngine`, `Calibrated`), `Model-assisted` (maps to `LlmAgent`), `Unknown` (maps to `Unknown`, `NotComputed`).
  - Internal-only: raw enum values exposed in logs, support tooling, manifest provenance, and `RunDecisionExplainabilityDto`.
- **Rationale:** Buyers need an honest signal that AI judgment was involved (SOC 2 / enterprise procurement disclosure); they do not need engine plumbing labels that change as engines evolve. Raw enum stays available where engineering and auditors need it.

### Surface Degraded Finding Coverage as a First-Class Run Outcome
- **Decision:** Two-tier classification at commit time.
  - **Non-committable (blocks commit):** Security engine failure, Compliance engine failure when a compliance pack is required by tenant policy, artifact schema validation failure, manifest signing failure.
  - **Degraded-but-committable (warns, recorded as `DegradedFindingCoverage` on the run):** Cost engine failure, Performance engine failure, Topology / Operational advisory engine failure, reference-case match unavailable, optional explainability trace incomplete.
- **Rationale:** Block only on safety-critical signals; advisory engines should never gate the review. Recording degradation on the run preserves honesty without blocking pilots when an optional engine is offline.

### Add Finding Disposition Workflow
- **Decision:** Final buyer-facing disposition set is seven values: `Open`, `Accepted`, `NeedsEvidence`, `Deferred`, `Waived`, `Remediated`, `RejectedAsNotApplicable`.
- **Rationale:** Matches enterprise GRC vocabulary; distinguishes `Waived` (formal exception with expiry, see waiver decision below) from `Accepted` (acknowledged risk, no action); distinguishes `Deferred` (timing) from `NeedsEvidence` (proof gap). `Open` is the initial state and is not selectable by reviewers.

### Add First-Class Waiver / Risk Exception Records
- **Decision:** Maximum waiver duration is **365 days**, default 90 days, no auto-renewal.
  - Waivers over 90 days require an explicit senior-owner approver (designated per tenant; defaults to the tenant security/risk lead).
  - Expiring waivers surface in the governance digest at **30**, **14**, and **7** days before expiry, and once on the day of expiry.
  - Expired waivers automatically transition the underlying finding from `Waived` back to `Open` and emit a governance audit event.
- **Rationale:** Aligns with typical SOC 2 exception-management practice. Forces periodic re-review which is required for any audit defensibility. Caps how long a known risk can hide behind a waiver.

### Reframe Governance Findings as an Architecture Risk Register
- **Decision:** Owner field is a tenant-user reference (FK to identity) with a display-name snapshot stored alongside for historical accuracy when users leave. No free-text owners and no group owners in V1.
- **Rationale:** Free-text rots fast and breaks reassignment, notifications, and audit. Group ownership diffuses accountability — bad for a risk register. Tenant-user references integrate cleanly with auth, SCIM, audit, and digest notifications. Group support can be added in V1.1 if enterprise customers request it.

### Create a Decision Register Over Manifest Decisions
- **Decision:** Default decision owner is inferred from approval lineage (last approver becomes owner). Operators may explicitly reassign, and reassignment is captured in the decision audit trail with original lineage preserved.
- **Rationale:** The last approver is the right accountable owner ~80% of the time; inference removes a field from every decision form. Explicit override preserves delegation (e.g., approver delegates to architect). Audit trail captures both the original lineage and any reassignment.

### Make Governance Digests Decision-Led
- **Decision:** Default cadence for new tenants is **weekly**, with per-recipient opt-out (not per-tenant disable). Tenant admins can change tenant default to monthly or manual-only; weekly is the bootstrap default.
- **Rationale:** Manual-only means no one looks. Monthly means risks and decisions go stale. Weekly matches typical architecture review and engineering ops review rhythms. Per-recipient opt-out preserves governance signal flow while respecting individual inbox preferences.

### Add Realized-Value Tracking From Disposition to ROI
- **Decision:** Hybrid: compute what the system can observe; require operator entry only for outcomes the system cannot observe.
  - **Computed from existing ROI / cost / audit / disposition evidence:** findings remediated count, average and median time-to-remediation (disposition timestamps), avoided-cost estimates (ROI model deltas), decisions activated in environments (environment activation events), waivers retired vs accepted, waiver-expiry reversion count.
  - **Operator-entered (attested):** actual incidents avoided, customer-attributable revenue or retention impact, reviewer time-saved (qualitative survey or sampled measurement).
- **Rationale:** Reduce operator burden where automation is reliable. Be honest where computation would fabricate. The mix gives buyers a credible ROI story without inflating numbers, and the computed fields can be cited against system evidence in procurement reviews.

## Pending Questions for Later (operator-only, still blocking)

### DEFERRED — First-Party ITSM Productization
- Provider order, validation tenant availability, credentials, status mappings, and one-click-create sequencing.

### DEFERRED — Live Stripe / Marketplace Commercial Cutover
- Live keys, Price IDs, Marketplace offer IDs, seller verification, DNS, and go-live approval.

### DEFERRED — SOC 2 CPA Readiness Engagement
- Budget, vendor shortlist, target report type, observation window, system boundary, and executive owner.

### DEFERRED — Published Reference Customer Case Study
- Customer approval, publishable metrics, logo rights, permitted public language, and reference-call commitment.
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
