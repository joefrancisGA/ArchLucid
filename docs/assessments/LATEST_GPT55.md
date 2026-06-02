> **Scope:** Rolling weighted readiness pass — `(A)` headline V1 GA readiness per `Assessment-Scope-V1_1.mdc`. Committed assessment snapshot (GPT-5.5 rescore track); not a buyer-facing claim document.

# ArchLucid Assessment – (A) Headline Readiness: 81.06%

This score represents the `(A)` headline readiness per `Assessment-Scope-V1_1.mdc`, excluding items explicitly deferred to V1.1, V1.x, V2, owner-only commercial action, or `(B)` procurement realism.

Working copy with incremental batch rescales lives in gitignored `docs/assessments/LATEST.md`; this committed snapshot tracks the same headline as of 2026-06-02.

Rescore note: Through **80.93%** (5L); batch **5M TB-177** (adversarial Critic prompt + empty-findings quality gate signal) → **81.06%** (+1 AI/Agent Readiness, +1 Cutting-Edge AI Technology). G-REAL/TB-140 owner-blocked.

## Executive Summary

### `(A)` Overall headline readiness

ArchLucid is a credible controlled-pilot / service-led release candidate, not yet a low-friction self-service enterprise SaaS. The repo shows a substantial shipped product: API, SQL/DbUp persistence, operator UI, CLI, evidence ingest, committed review package, artifacts, explainability, governance, audit, release smoke, live UI gates, procurement pack, pricing, and sponsor-proof workflows.

The headline score is held down mostly by current-release issues inside high-weight qualities: agent/AI evidence is not yet strong enough across the full real-mode quad-agent path, several customer-visible KPI/ROI semantics can diverge across backend/UI/cache layers, identity/scope and production retrieval hardening still have security-relevant backlog, and the first-pilot path remains powerful but operationally dense.

### `(B)` Procurement / market-motion realism

Enterprise buyers will still feel friction around SOC 2 CPA attestation, third-party pen-test publication, public references, live Marketplace/Stripe transactability, and first-party connectors. Those are procurement and market-motion realities, not `(A)` deductions where the repo explicitly defers them.

Current trust posture is unusually honest for a young product: Trust Center, self-assessment, CAIQ/SIG/DPA/process material, owner-conducted security posture, access boundaries, and procurement pack machinery are present. The buyer risk is not "no security story"; it is that some security reviewers will still require formal external assurance before a broad enterprise rollout.

### Commercial picture

The strongest near-term commercial path is sales-led architecture review / evidence-pack services using ArchLucid as delivery infrastructure. The product has named offers, pricing philosophy, scorecards, ROI labels, quote-to-proof flow, sponsor packets, and proof-bundle mechanics.

The weakness is conversion discipline: the buyer must understand which proof is buyer-provided, defaulted, demo-derived, or not collected. Until real customer proof packets and public references exist, revenue is plausible through founder-led paid pilots and services, but expansion will depend on disciplined evidence collection and avoiding overclaims.

### Enterprise picture

Enterprise architecture buyers can see the shape of a serious product: tenant isolation, OIDC/SAML, policy packs, audit trail, SCIM, governance workflows, proof packs, and Azure-native deployment posture. Controlled pilots are reasonable.

Broad enterprise adoption is still constrained by integration maturity, procurement assurance friction, identity/scope hardening still in backlog, production IaC coverage gaps for several Azure services, and a UI/help experience that still leaks raw repo references in places where product-native guidance should exist.

### Engineering picture

The engineering base is deep and mostly coherent: modular projects, Dapper/SQL discipline, DbUp, OpenAPI snapshotting, CI gates, live UI tests, agent quality gates, RAG foundations, audit/event catalogs, and release smoke machinery.

The main engineering risk is not lack of architecture. It is complexity and drift: multiple read models, legacy authority/coordinator semantics, duplicated business calculations, optional real-mode gates, and many safety controls that exist but are not uniformly enforced as release blockers.

## Weighted Quality Assessment

Ordered from most urgent to least urgent by weighted deficiency signal.

| Quality | Score | Weight | Weighted impact | Weighted deficiency signal |
| --- | ---: | ---: | ---: | ---: |
| AI/Agent Readiness | 73 | 8 | 5.04% | 216 |
| Cutting-Edge AI Technology | 74 | 8 | 5.10% | 208 |
| Correctness | 82 | 8 | 5.66% | 144 |
| Adoption Friction | 70 | 6 | 3.62% | 180 |
| Stickiness | 73 | 6 | 3.78% | 162 |
| Time-to-Value | 80 | 7 | 4.83% | 140 |
| Marketability | 85 | 8 | 5.86% | 120 |
| Proof-of-ROI Readiness | 76 | 5 | 3.27% | 120 |
| Workflow Embeddedness | 66 | 3 | 1.71% | 102 |
| Executive Value Visibility | 78 | 4 | 2.69% | 88 |
| Usability | 72 | 3 | 1.86% | 84 |
| Differentiability | 82 | 4 | 2.83% | 72 |
| Trustworthiness | 81 | 3 | 2.08% | 57 |
| Interoperability | 66 | 2 | 1.14% | 68 |
| Architectural Integrity | 83 | 3 | 2.13% | 51 |
| Azure Compatibility and SaaS Deployment Readiness | 68 | 2 | 1.17% | 64 |
| Decision Velocity | 71 | 2 | 1.22% | 58 |
| Data Consistency | 70 | 2 | 1.21% | 60 |
| Maintainability | 74 | 2 | 1.28% | 52 |
| Traceability | 84 | 3 | 2.17% | 48 |
| Compliance Readiness | 73 | 2 | 1.26% | 54 |
| Procurement Readiness | 75 | 2 | 1.29% | 50 |
| Commercial Packaging Readiness | 79 | 2 | 1.35% | 42 |
| Reliability | 78 | 2 | 1.34% | 44 |
| Auditability | 77 | 2 | 1.32% | 46 |
| Policy and Governance Alignment | 81 | 2 | 1.39% | 38 |
| Explainability | 80 | 2 | 1.38% | 40 |
| Cognitive Load | 66 | 1 | 0.57% | 34 |
| Customer Self-Sufficiency | 68 | 1 | 0.59% | 32 |
| Deployability | 71 | 1 | 0.61% | 29 |
| Scalability | 70 | 1 | 0.60% | 30 |
| Manageability | 71 | 1 | 0.61% | 29 |
| Performance | 71 | 1 | 0.61% | 29 |
| Availability | 74 | 1 | 0.64% | 26 |
| Extensibility | 72 | 1 | 0.62% | 28 |
| Cost-Effectiveness | 73 | 1 | 0.63% | 27 |
| Testability | 77 | 1 | 0.66% | 23 |
| Supportability | 76 | 1 | 0.66% | 24 |
| Template and Accelerator Richness | 82 | 1 | 0.71% | 18 |
| Documentation | 78 | 1 | 0.67% | 22 |

### AI/Agent Readiness

Score: 73. Weight: 8. Weighted impact: 5.04%. Weighted deficiency signal: 216.

Justification: The repo has real agent infrastructure: structured `AgentResult` schema validation, PilotStrict quality gates, semantic and faithfulness scoring, RAG grounding, retrieval IR work, real-mode evidence capture, and golden-cohort mechanics. Batch **5M** closes **TB-177**: adversarial Critic prompt posture and a deterministic empty-findings quality signal so non-performative Critic output cannot pass default warn floors. The gap is that full real-mode confidence is not yet uniformly release-blocking across the complete Topology/Cost/Compliance/Critic path; current live evidence explicitly records topology-only acceptable evidence and says full quad-agent merge remains follow-up.

Tradeoffs: Keeping live LLM gates optional protects CI cost and flakiness. It also means release confidence still depends on disciplined operator evidence capture.

Improvement recommendations: make the full real-mode quad-agent evidence pack a release-candidate gate when real-mode is in scope; tighten real-mode score reporting; keep simulator-only releases clearly labeled.

Classification: Fixable in v1 for release-candidate evidence. Stronger unattended real-LLM scheduling can remain v1.1/operator-managed.

### Cutting-Edge AI Technology

Score: 74. Weight: 8. Weighted impact: 5.10%. Weighted deficiency signal: 208.

Justification: The system uses modern AI-adjacent patterns: Azure OpenAI, structured JSON/schema response, RAG, Azure AI Search path, faithfulness scoring, retrieval IR harness, semantic reranking, redaction, budgets, quality gates, and model drift guards. Batch **5M** adds adversarial Critic evaluation posture with empty-findings gate signaling. It is not merely a chat wrapper. The weakness is uneven productization: several high-end capabilities exist as gated, optional, or partially operator-driven controls rather than a single unavoidable production posture.

Tradeoffs: Conservative fail-open retrieval and optional judges keep runs resilient and affordable. They reduce confidence when the user needs formal "this answer is grounded" guarantees.

Improvement recommendations: promote production-like retrieval, real-mode evidence, and AI-readiness gate outputs into one simple release artifact; ensure every sponsor packet can show execution mode, quality, retrieval, and budget posture.

Classification: Mostly fixable in v1. Graph-RAG, agentic retrieval, fine-tuning, MCP, and ecosystem features are v1.1/v2 and should not affect this score.

### Correctness

Score: 82. Weight: 8. Weighted impact: 5.66%. Weighted deficiency signal: 144.

Justification: Correctness is supported by OpenAPI snapshot tests, SQL-backed full regression, contract tests, data consistency probes, golden fixtures, quality gates, and release smoke. Batch **5L** adds DB-level `UX_AgentResults_RunId_TaskId` with HTTP **409** on concurrent duplicate agent-result submits (**TB-201**). Prior batches closed reasoning cost, governance atomicity, ROI guards, and auth-boundary test gaps. Remaining backlog: **TB-202–204** coverage gaps.

Tradeoffs: The system has many read surfaces because it has grown into a broad product. That creates useful product depth but increases semantic drift risk.

Improvement recommendations: unify server-side calculation of executive KPIs and waiver/decision counts; remove UI heuristics; lock cache freshness semantics; add idempotency around recurring review triggers.

Classification: v1 must-fix for the highest-risk customer-visible values before a serious release candidate.

### Adoption Friction

Score: 70. Weight: 6. Weighted impact: 3.62%. Weighted deficiency signal: 180.

Justification: There is a strong first-pilot operator path, 20-minute first-value guide, proof packets, release smoke, and a clear Pilot vs Operate boundary. But the path still demands SQL/auth/API/worker/proof/quality/procurement awareness. Product help still exposes repo paths and GitHub links in user-visible places. Some local failure states are confusing, including API/proxy outage toasts framed as AI assistant failures.

Tradeoffs: A sophisticated enterprise product cannot hide all setup. But the first pilot should make the next step obvious and error causes precise.

Improvement recommendations: fix API/proxy diagnostics; move customer-facing docs into in-app help; reduce first-run branching; keep Operate surfaces hidden until after first commit.

Classification: Fixable in v1.

### Stickiness

Score: 73. Weight: 6. Weighted impact: 3.78%. Weighted deficiency signal: 162.

Justification: Stickiness is supported by repeat reviews, compare, replay, graph, governance, audit, policy packs, executive ROI summary, learning signals, and proof workflows. The gap is that recurring operating habits are not yet fully closed in the product UI: RAG grounding, tool calls, run-level remediation, and recurring review safety are still backlog items.

Tradeoffs: V1 can sell the first review without a complete operating loop. Retention and expansion need the product to become a weekly architecture habit, not just a report generator.

Improvement recommendations: fix recurring run idempotency, surface run-grounding and provenance in-place, and create a recurring review loop that operators trust.

Classification: Core reliability pieces are v1. Wider habit-loop polish is v1.1 after first release blockers.

### Time-to-Value

Score: 78. Weight: 7. Weighted impact: 4.71%. Weighted deficiency signal: 154.

Justification: First value is well documented: health, review creation, execute/commit, proof packet, sponsor ZIP. Demo workspaces and starter proof packs exist. The issue is not lack of path; it is path density and the need to choose the correct accelerator, evidence source, auth mode, and proof disposition.

Tradeoffs: The repo correctly avoids pretending that demo-derived output is buyer proof. That honesty adds steps but protects trust.

Improvement recommendations: add a buyer-job accelerator chooser, starter pack metadata, and static validation; make proof disposition first-screen visible and hard to misread.

Classification: Fixable in v1 for the starter-pack chooser and validation; broader template expansion can wait.

### Marketability

Score: 82. Weight: 8. Weighted impact: 5.66%. Weighted deficiency signal: 144.

Justification: Positioning is crisp: "Defensible architecture, on demand" and "Architecture Proof Engine." The service-led offer menu is commercially realistic, and the product has proof-centered demo/sponsor surfaces. Marketability is weakened by reliance on founder/service-led motion and limited external proof, but those external proof items are deferred and not headline-scored.

Tradeoffs: Service-led marketability is narrower but more credible than pretending mature PLG SaaS. It also means founder capacity can become a bottleneck.

Improvement recommendations: harden the service-led offer pack and overclaim guard; make the first public journey focus on evidence-backed review, not platform breadth.

Classification: v1 for copy/proof discipline; public references and market-facing demo assets are V1.1 owner-output and not scored here.

### Proof-of-ROI Readiness

Score: 74. Weight: 5. Weighted impact: 3.19%. Weighted deficiency signal: 130.

Justification: ROI model, scorecard, first-value reports, executive ROI summary, pilot deltas, and ROI basis labels exist. The main weakness is correctness and sponsor safety: ROI must not lead when baselines are defaulted or demo-derived, and multiple KPI/waiver/cost fields still need canonicalization.

Tradeoffs: ROI humility protects trust but weakens sales punch until actual pilot data is captured.

Improvement recommendations: unify KPI math and labels server-side; make commercial closeout artifacts consume canonical proof JSON; block sponsor send on unsafe ROI basis.

Classification: v1 must-fix where values are customer-visible.

### Workflow Embeddedness

Score: 66. Weight: 3. Weighted impact: 1.71%. Weighted deficiency signal: 102.

Justification: REST, CLI, UI, SCIM, GitHub/Azure DevOps-oriented handoff, proof packets, and audit exports exist. First-party Jira, ServiceNow, Confluence, Slack, Teams, CloudEvents, and broad webhook buyer-contract paths are explicitly V1.1, so they do not reduce `(A)`. Still, current V1 workflow embeddedness depends heavily on manual handoff and exported artifacts.

Tradeoffs: Avoiding premature connector breadth is the right V1 choice. The cost is more manual sales-engineer/operator motion.

Improvement recommendations: improve GitHub/Azure DevOps handoff docs and proof artifact packaging now; hold first-party connector work to V1.1.

Classification: v1 for manual handoff polish; V1.1 for first-party connectors.

### Executive Value Visibility

Score: 78. Weight: 4. Weighted impact: 2.69%. Weighted deficiency signal: 88.

Justification: Sponsor brief, first-value PDF, value report, executive ROI summary, dashboard sections, demo proof routes, and quote-to-proof packet are present. Risks remain around KPI correctness, stale cached values, and UI surfaces that require too much operator interpretation.

Tradeoffs: Executive summaries can oversell if generated from weak baselines. The current label discipline is valuable but needs stricter enforcement.

Improvement recommendations: canonicalize ROI/KPI data and make proof/sponsor status hard-gated.

Classification: v1.

### Usability

Score: 72. Weight: 3. Weighted impact: 1.86%. Weighted deficiency signal: 84.

Justification: The UI has many operator affordances: Home, review detail, proof status, compare, graph, audit, governance, value report, and first-pilot rails. Usability is held down by cognitive density, repo-link leakage, legacy run/review labels in some places, and confusing connectivity errors.

Tradeoffs: Feature-rich operator shells are inherently dense; progressive disclosure is already used but needs finishing.

Improvement recommendations: fix connectivity toasts, in-app docs, and run-detail evidence panels.

Classification: v1 for confusing failures and help links; v1.1 for deeper UX polish.

### Differentiability

Score: 82. Weight: 4. Weighted impact: 2.83%. Weighted deficiency signal: 72.

Justification: ArchLucid is well differentiated from generic AI: structured evidence, manifests, governance, audit, replay, comparison, policy packs, and proof outputs. Differentiability would be stronger with more buyer-visible proof packets from real environments, but those owner-output cohorts are deferred and not scored.

Tradeoffs: Deep architecture proof is harder to explain than generic "AI assistant" copy. The current category framing is good.

Improvement recommendations: make "why ArchLucid" proof pages and PDF packs fully in-product and evidence-linked; avoid feature-tour messaging.

Classification: v1 for proof-page/product-link polish; V1.1 for public reference assets.

### Trustworthiness

Score: 76. Weight: 3. Weighted impact: 1.97%. Weighted deficiency signal: 72.

Justification: Trustworthiness is supported by evidence labels, AI-output limits, schema validation, audit trail, tenant isolation docs, quality gates, and honest trust center wording. It is limited by optional/owner-run evidence for real LLMs, open security hardening around identity/scope and production search filtering, and external assurance friction under `(B)`.

Tradeoffs: The product is honest about uncertainty; that is better than false confidence. But buyers need visible guardrails, not just documentation.

Improvement recommendations: close identity/scope hardening and production retrieval filtering; expose AI readiness and grounding status in sponsor-visible proof.

Classification: v1 for technical trust boundaries; `(B)` for CPA SOC 2 and third-party pen-test friction.

### Interoperability

Score: 66. Weight: 2. Weighted impact: 1.14%. Weighted deficiency signal: 68.

Justification: V1 has REST, CLI, OpenAPI, SCIM, GitHub/Azure DevOps handoff, Azure extractor, exports, and procurement-pack workflows. Broad first-party business-system connectors are explicitly V1.1.

Tradeoffs: V1 interoperability is enough for controlled pilots but not yet enough for "drop into every enterprise workflow."

Improvement recommendations: keep V1 focused on API/CLI/export quality; do not pull first-party connectors forward unless they are required for a signed pilot.

Classification: v1 acceptable for controlled pilots; V1.1 for connector breadth.

### Architectural Integrity

Score: 79. Weight: 3. Weighted impact: 2.05%. Weighted deficiency signal: 63.

Justification: The solution has a coherent split across Contracts/Core/Application/Host/Persistence/UI, architecture invariants, ADRs, dependency tests, single SQL DDL discipline, composition root rules, and explicit scope documents. **TB-027** (`IAgentExecutor` port; no `AgentSimulator` in production assemblies) is Done with `DependencyConstraintTests`. Integrity is still weakened by legacy authority/coordinator coexistence, duplicated calculation paths, and optional Application→Persistence namespace references tracked separately from the simulator coupling fix.

Tradeoffs: The legacy/coordinator bridge supports compatibility but adds conceptual load.

Improvement recommendations: complete the remaining invariant waves after release blockers; remove duplicated business logic first.

Classification: v1 for duplicates affecting correctness; v1.1 for broader architectural cleanup.

### Decision Velocity

Score: 67. Weight: 2. Weighted impact: 1.16%. Weighted deficiency signal: 66.

Justification: Quote requests, quote aging, proof packets, conversion checklist, pricing philosophy, and order-form templates exist. The path is still sales-led and requires careful manual qualification.

Tradeoffs: Manual qualification is acceptable for early revenue. It slows PLG conversion.

Improvement recommendations: harden quote-to-proof closeout and commercial overclaim guard.

Classification: v1.

### Azure Compatibility and SaaS Deployment Readiness

Score: 68. Weight: 2. Weighted impact: 1.17%. Weighted deficiency signal: 64.

Justification: The product is Azure-native with Terraform modules, Container Apps, SQL, Key Vault, Front Door/WAF, private endpoints, Azure OpenAI, Azure AI Search posture, diagnostics, and deployment docs. The backlog still identifies IaC parity gaps for Azure OpenAI, Azure AI Search, Key Vault private endpoint/RBAC, Redis, ACR, Monitor workspace, and diagnostics.

Tradeoffs: Some services can be provisioned out-of-band for pilots. That is less acceptable for repeatable SaaS operations.

Improvement recommendations: compose AOAI, AI Search, Key Vault private endpoint/RBAC, and core diagnostics into the hosted Terraform path first.

Classification: v1 for production-like pilot reproducibility; V2 for scale-only services such as mandatory Redis.

### Data Consistency

Score: 70. Weight: 2. Weighted impact: 1.21%. Weighted deficiency signal: 60.

Justification: There are data consistency probes, orphan remediation, SQL constraints, migrations, and tests. But the backlog shows current risks in executive KPIs, waiver state, recurring review idempotency, and cached ROI fields.

Tradeoffs: Eventual cache and rollup patterns are useful for performance but dangerous if visible business values diverge.

Improvement recommendations: make the server the only source of truth for visible KPIs and state windows; add invariant tests.

Classification: v1.

### Procurement Readiness

Score: 70. Weight: 2. Weighted impact: 1.21%. Weighted deficiency signal: 60.

Justification: Procurement pack, trust center, CAIQ/SIG, DPA, subprocessors, SOC roadmap, support policy, SLA targets, and objection playbook are present. External assurance and public references remain friction under `(B)`.

Tradeoffs: A strong self-assessment pack can support pilots and smaller deals; some enterprises will still require third-party assurance.

Improvement recommendations: ensure procurement pack strict/deal-ready checks are tied to commercial closeout; do not imply CPA or third-party pen test.

Classification: v1 for packet correctness; `(B)` / V1.1 backlog for external programs.

### Commercial Packaging Readiness

Score: 72. Weight: 2. Weighted impact: 1.24%. Weighted deficiency signal: 56.

Justification: Pricing, tiers, guided pilot, service-led SKUs, order form, quote request, and conversion checklist exist. Packaging still needs stronger one-page service-led offer material, tier-fit validation, and overclaim guards.

Tradeoffs: Early-stage pricing can work without self-serve live checkout; packaging must make the sales-led path obvious.

Improvement recommendations: build one service-led offer pack aligned to pricing and proof outputs; harden commercial closeout.

Classification: v1.

### Compliance Readiness

Score: 72. Weight: 2. Weighted impact: 1.24%. Weighted deficiency signal: 56.

Justification: Compliance materials are unusually mature for V1: SOC self-assessment, compliance matrix, DPA, CAIQ/SIG, VPAT draft, audit matrix, policy packs, trust center. No CPA SOC 2 or ISO claim is made. Formal third-party assurance remains procurement friction only.

Tradeoffs: Honest self-assessment is useful but not a substitute for external attestation in large enterprise RFPs.

Improvement recommendations: keep compliance language exact; tie proof packs to current evidence and caveats.

Classification: v1 for evidence/copy precision; `(B)` for formal assurance.

### Maintainability

Score: 74. Weight: 2. Weighted impact: 1.28%. Weighted deficiency signal: 52.

Justification: The repo is modular and heavily documented, with tests, scripts, invariants, DDL discipline, and central package management. Batch **5I** closes **TB-012** Wave C architecture guards (**INV-007/008/009**), reducing invariant drift risk. Maintainability is still pressured by breadth: many projects, many docs, duplicate read models, legacy terminology, and a large backlog.

Tradeoffs: Modularity and explicit docs are good. Too many surfaces make change impact harder.

Improvement recommendations: prioritize removal of duplicated business rules over cosmetic refactors.

Classification: v1 for correctness-impacting duplication; v1.1 for broader cleanup.

### Traceability

Score: 84. Weight: 3. Weighted impact: 2.17%. Weighted deficiency signal: 48.

Justification: The product’s traceability story is strong: manifests, evidence refs, explainability traces, provenance graph, audit events, correlation IDs, export bundles, and requirement-test traceability. Run detail now includes structured tool-invocation forensics with execute-gated redacted raw preview (TB-110). Remaining gaps are inline provenance summary (TB-111) and consistent retrieval grounding surfacing when records are sparse.

Tradeoffs: Traceability can overwhelm operators if not summarized.

Improvement recommendations: surface retrieval hits, tool calls, and provenance summary in the review detail page.

Classification: v1.1 if not needed for first release; v1 if sponsor trust depends on it.

### Reliability

Score: 78. Weight: 2. Weighted impact: 1.34%. Weighted deficiency signal: 44.

Justification: Reliability foundations include health checks, SQL retries, outbox, data consistency probes, release smoke, k6 smoke, chaos tests, and readiness scripts. Batch **5L** hardens multi-replica agent-result idempotency with a unique `(RunId, TaskId)` index and conflict mapping on submit. Batch **5I** added mutating HTTP idempotency and cancellation-forwarding guards. Remaining risks include optional live gates, staging-specific validation, and IaC parity.

Tradeoffs: V1 intentionally does not require multi-region active/active. Single-region reliability plus clear drills is acceptable.

Improvement recommendations: close idempotency and release-evidence gates before broad rollout.

Classification: v1 for duplicate run prevention; V1.1/V2 for multi-region guarantees.

### Auditability

Score: 75. Weight: 2. Weighted impact: 1.29%. Weighted deficiency signal: 50.

Justification: Typed audit event catalog and append-only SQL audit store are strong. Audit proof could be easier to consume: buyer-safe audit summaries, metadata, proof-generation audit tests, and support/audit triage remain backlog items.

Tradeoffs: Exhaustive audit coverage can slow delivery; critical proof/commercial actions should not be ambiguous.

Improvement recommendations: add audit coverage drift gates and proof-bundle summaries for critical workflows.

Classification: v1/v1.1 depending on pilot compliance demands.

### Policy and Governance Alignment

Score: 79. Weight: 2. Weighted impact: 1.36%. Weighted deficiency signal: 42.

Justification: Policy packs, governance approvals, pre-commit gate, segregation of duties, compliance drift, and starter bundles are shipped. The gap is buyer-safe metadata and freshness reporting around packs.

Tradeoffs: Starter packs should not be marketed as certification automation.

Improvement recommendations: add policy-pack metadata validation, dry-run index, and stale-pack warnings.

Classification: v1.1 unless governance-heavy pilot requires it now.

### Explainability

Score: 80. Weight: 2. Weighted impact: 1.38%. Weighted deficiency signal: 40.

Justification: Explainability is central: finding traces, aggregate explanations, evidence labels, provenance, and decision support limitations. Some per-agent retrieval/tool context is not yet visible enough to operators.

Tradeoffs: Too much explanation can create cognitive load.

Improvement recommendations: expose concise evidence-basis and grounding summaries first; keep raw details collapsible.

Classification: v1/v1.1 depending on sponsor scrutiny.

### Cognitive Load

Score: 66. Weight: 1. Weighted impact: 0.57%. Weighted deficiency signal: 34.

Justification: The product is rich but mentally heavy. Operator docs distinguish Pilot from Operate, but the UI and docs still expose many concepts: reviews/runs, manifests, artifacts, policies, proof packets, quality gates, procurement pack, route/tier/nav parity, and more.

Tradeoffs: Enterprise architecture review is inherently complex. The product must still make the first action obvious.

Improvement recommendations: in-app help, first-pilot cockpit simplification, and clearer error labels.

Classification: v1 for first-run blockers; v1.1 for broader simplification.

### Customer Self-Sufficiency

Score: 68. Weight: 1. Weighted impact: 0.59%. Weighted deficiency signal: 32.

Justification: The repo contains operator docs, quickstarts, runbooks, troubleshooting, config lint, CLI, and proof scripts. The remaining weakness is that several instructions still assume a capable operator or sales engineer.

Tradeoffs: Expert-led pilots are valid near-term. Self-sufficiency can mature after proof of value.

Improvement recommendations: in-app docs and safer startup/proxy checks.

Classification: v1 for confusing diagnostics; v1.1 for broad self-service.

### Deployability

Score: 69. Weight: 1. Weighted impact: 0.59%. Weighted deficiency signal: 31.

Justification: Docker, compose, Terraform, release smoke, CD smoke, and package scripts exist. But hosted SaaS IaC parity is incomplete for several services and some deployment validation remains environment-specific.

Tradeoffs: Manual provisioning is acceptable for early pilots; it is not a repeatable SaaS release posture.

Improvement recommendations: close core Terraform composition for production-like pilots.

Classification: v1 for core hosted pilot stack; later for full fleet polish.

### Scalability

Score: 70. Weight: 1. Weighted impact: 0.60%. Weighted deficiency signal: 30.

Justification: There are scale-aware elements: SQL, caches, queue/workers, k6 smoke, budgets, batch caps, rate limits, and optional Redis. Single-region and memory-backed defaults are intentional V1 choices.

Tradeoffs: V1 does not need hyperscale. It does need not to break under normal pilot load.

Improvement recommendations: focus on idempotency, hot-path metrics, and production-like Azure AI Search before scale-out architecture changes.

Classification: v1 for normal pilot load; V2 for Redis/active-active expansions.

### Manageability

Score: 71. Weight: 1. Weighted impact: 0.61%. Weighted deficiency signal: 29.

Justification: Manageability is supported by config summary/lint, health checks, diagnostics, runbooks, and role/tier/policy/nav guards. Gaps remain around in-app docs, operator triage, and IaC-managed service configuration.

Tradeoffs: Many knobs are useful for enterprise operators but can overwhelm.

Improvement recommendations: reduce operator-facing drift by making config and proof status the main entry points.

Classification: v1/v1.1.

### Performance

Score: 71. Weight: 1. Weighted impact: 0.61%. Weighted deficiency signal: 29.

Justification: k6 smoke, performance docs, batching, cache controls, and cost budgets exist. No evidence found that performance is a release blocker for controlled pilots, but broad performance baselines are not complete.

Tradeoffs: Full performance testing is expensive and should follow real usage patterns.

Improvement recommendations: keep k6 operator smoke merge-blocking and add targeted budgets only around hot paths.

Classification: v1 acceptable; broader tuning after pilot telemetry.

### Availability

Score: 72. Weight: 1. Weighted impact: 0.62%. Weighted deficiency signal: 28.

Justification: Health endpoints, SLO targets, probes, backup/DR docs, and staging chaos posture exist. Multi-region active/active is explicitly not a V1 score deduction.

Tradeoffs: Early pilots can run on single-region with honest targets. Enterprise contracts may ask for more under `(B)`.

Improvement recommendations: run staging readiness and recovery drills per release checklist before handoff.

Classification: v1 for drills; V1.1/V2 for stronger topology.

### Extensibility

Score: 72. Weight: 1. Weighted impact: 0.62%. Weighted deficiency signal: 28.

Justification: Custom agent handler documentation is V1 scope; modular agent/runtime architecture exists. Public plugin SDK, MCP membrane, and marketplace are deferred and not scored.

Tradeoffs: Code-level extensibility is enough for advanced customers; ecosystem extensibility is not V1.

Improvement recommendations: keep custom handler guide accurate and avoid promising public SDKs.

Classification: v1 for docs; V1.1/V2 for ecosystem.

### Cost-Effectiveness

Score: 73. Weight: 1. Weighted impact: 0.63%. Weighted deficiency signal: 27.

Justification: LLM budgets, token accounting, cost estimation, kill-switches, Azure cost evidence, and pricing guardrails exist. Some cloud services remain out-of-band in IaC, which weakens cost predictability.

Tradeoffs: AI quality gates cost money; the repo correctly adds kill-switches and budget controls.

Improvement recommendations: maintain budget probes and include AOAI/Search costs in hosted Terraform cost assumptions.

Classification: v1/v1.1.

### Testability

Score: 77. Weight: 1. Weighted impact: 0.66%. Weighted deficiency signal: 23.

Justification: Testability is strong: solution filters, core suite, full SQL regression, API snapshots, UI unit/live E2E, k6, chaos, golden fixtures, and coverage gates. Batch **5I/5K** extend architecture and correctness drift guards in CI. Current coverage analysis still shows low-coverage hotspots in some production assemblies and a deferred 95% ratchet.

Tradeoffs: Raising coverage indiscriminately would be expensive. The right move is targeted tests for correctness/security hot paths.

Improvement recommendations: target CostConstraintFindingEngine, Host.Core auth/health/worker paths, and Decisioning explainability/idempotency risk areas.

Classification: v1 for critical hot paths only.

### Supportability

Score: 76. Weight: 1. Weighted impact: 0.66%. Weighted deficiency signal: 24.

Justification: Support bundle, doctor, correlation IDs, problem details, runbooks, health, metrics, and triage scripts exist. Supportability is weakened by scattered operator surfaces and misleading connectivity errors.

Tradeoffs: Detailed support tooling is useful, but first-line errors must be plain.

Improvement recommendations: fix API/proxy outage messaging and add support/audit triage one-pager.

Classification: v1.

### Template and Accelerator Richness

Score: 76. Weight: 1. Weighted impact: 0.66%. Weighted deficiency signal: 24.

Justification: Starter proof packs and walkthroughs exist, but the issue is chooser/metadata/validation, not volume. The repo correctly avoids adding templates just to inflate count.

Tradeoffs: Fewer validated accelerators are better than many fragile demos.

Improvement recommendations: add buyer-job chooser, metadata contract, static validation, then one golden walkthrough.

Classification: v1/v1.1.

### Documentation

Score: 78. Weight: 1. Weighted impact: 0.67%. Weighted deficiency signal: 22.

Justification: Documentation is extensive and generally high quality. The weakness is product presentation: buyers/operators should not be routed into raw GitHub/document paths for primary help, and duplicated/historical docs increase cognitive load.

Tradeoffs: Deep repo docs help contributors. Product users need curated in-app help.

Improvement recommendations: finish customer-facing in-app documentation registry and remove primary GitHub blob links from product UI.

Classification: v1 for primary product help links.

## Top 12 Most Important Weaknesses

1. Full real-mode AI confidence is not yet proven as a release-blocking quad-agent path; current local evidence proves topology-only live output and shape, not the complete sponsor-grade run.
2. Customer-visible KPI/ROI and governance counts can diverge because related values are computed in multiple backend/UI/cache paths.
3. API identity/scope binding and production retrieval tenant filtering still have security-relevant backlog, which directly affects enterprise trust.
4. The first-pilot path is powerful but operationally dense; a controlled expert-led pilot is realistic, a low-touch buyer self-serve path is not.
5. Hosted Azure deployment repeatability is weakened by IaC gaps for AOAI, AI Search, Key Vault private endpoint/RBAC, monitoring, and related services.
6. Sponsor-safe ROI depends heavily on labels and proof gates; if those gates are skipped, the product can overstate value from defaulted or demo-derived data.
7. Product UI/help still leaks raw repo/document paths in places where buyer/operator help should be in-product.
8. Run detail still lacks inline provenance summary (TB-111) and can hide retrieval grounding when records are sparse; tool-call forensics and execute-gated raw preview shipped (TB-110).
9. Enterprise workflow embedding is still mostly REST/CLI/export/manual handoff; first-party ITSM/docs/chat connectors are V1.1.
10. Coverage and test gates are strong overall but still have known low-coverage production hotspots in decisioning, host/core, notifications, and cost logic.
11. Commercial conversion assets exist but need stricter quote-to-proof closeout and overclaim prevention before sales-led scaling.
12. Cognitive load remains high because the product spans architecture review, AI quality, governance, audit, procurement, pricing, and deployment in one operator flow.

## Top 6 Monetization Blockers

1. Sponsor conversion can fail if proof packets include defaulted/demo-derived ROI without unmistakable labels and SEND/HOLD disposition.
2. The service-led offer path is viable but still needs a hardened one-page offer pack aligned to pricing, proof outputs, exclusions, and buyer prerequisites.
3. Decision velocity is slowed by manual quote/proof/procurement handoff; quote-to-proof closeout must be crisp enough for founder-led selling.
4. Buyer trust in AI output depends on full real-mode evidence, not just simulator or topology-only proof.
5. Large enterprise buyers may defer purchase pending SOC 2 CPA, third-party pen-test, public references, or Marketplace transactability; this is `(B)` friction, not a V1 product blocker.
6. Starter accelerators are useful but need chooser/metadata/validation so paid-pilot scoping does not require founder narration.

## Top 6 Enterprise Adoption Blockers

1. Actual v1 blocker for broad deployment: identity/scope binding and production retrieval tenant-filter hardening must be closed or explicitly bounded before serious multi-tenant enterprise use.
2. Actual v1 blocker for sponsor handoff: real-mode quality and proof disposition must be captured when the buyer is evaluating AI output.
3. Actual v1 blocker for production-like SaaS repeatability: core Azure services must be representable and validated through Terraform or documented as explicitly out-of-band.
4. Acceptable for controlled pilot but not broad rollout: first-party Jira/ServiceNow/Confluence/Slack/Teams connectors are V1.1.
5. Acceptable for controlled pilot but procurement friction: no CPA SOC 2 report or external pen-test publication yet.
6. Acceptable for controlled pilot but adoption friction: product help and run-detail diagnostics still require too much operator/repo knowledge.

## Top 6 Engineering Risks

1. Customer-visible financial/governance values diverge across duplicated computation paths.
2. Scope/identity weakness creates potential tenant-boundary or IDOR-style risks in production-like configurations.
3. Real-mode agent quality gates exist but are not uniformly enforced as release blockers across full live output.
4. Recurring architecture review trigger idempotency can duplicate runs on restart.
5. IaC parity gaps allow portal/manual configuration drift in security- and cost-relevant Azure services.
6. Coverage gaps cluster around important production code, especially host/core, decisioning, notifications, and cost paths.

## Most Important Truth

ArchLucid is close enough to sell controlled, expert-led architecture review pilots, but it is not yet trustworthy enough to present as a broadly self-service, enterprise-grade SaaS without first closing AI evidence, scope/security, KPI correctness, and deployment-repeatability gaps.

## Top Improvement Opportunities

I stopped at 18 improvements because additional items would either be deferred scope, speculative polish, or likely to change after the first blocker pass. The list favors release-critical correctness, trust, buyer value, and operational safety.

### Tier 1 — Release blockers / must-fix now

#### 1. Full real-mode quad-agent release evidence gate

Tier: Tier 1. Status: Partially actionable now.

Why it matters: The highest-weight readiness risk is whether real AI output is good enough across the full Topology, Cost, Compliance, and Critic path. Current evidence proves topology-only live output; a release candidate needs full-path evidence when real-mode is part of the claim.

Expected impact: Directly improves AI/Agent Readiness (+8-12 pts), Cutting-Edge AI Technology (+4-6 pts), Trustworthiness (+3-5 pts), Correctness (+2-4 pts). Weighted readiness impact: +1.0-1.6%.

Affected qualities: AI/Agent Readiness, Cutting-Edge AI Technology, Correctness, Trustworthiness, Proof-of-ROI Readiness.

Why ranked here: It targets the largest weighted deficiency and the core buyer promise.

Evidence: `docs/quality/REAL_LLM_SESSION_2026-05-29.md` records topology-only real-mode evidence and says full quad-agent merge remains follow-up. `docs/library/AGENT_OUTPUT_EVALUATION.md` and `docs/runbooks/GOLDEN_COHORT_REAL_LLM_GATE.md` define the intended quality posture.

Cursor prompt:

```text
Implement a release-candidate real-mode quad-agent evidence gate for ArchLucid.

Goal:
Make it straightforward to prove that a real Azure OpenAI run can produce valid, quality-gated AgentResult output for Topology, Cost, Compliance, and Critic, with a clear PASS/WARN/HOLD artifact suitable for release evidence.

Likely files/modules:
- scripts/Invoke-RealLlmEvidenceGate.ps1
- scripts/ci/eval_agent_corpus.py
- ArchLucid.AgentRuntime.Tests/RealAzureOpenAIEndToEndTests.cs
- ArchLucid.Core/GoldenCorpus/RealLlmOutputStructuralValidator.cs
- ArchLucid.Cli commands related to real-llm-evidence summarize, if present
- docs/quality/REAL_LLM_RUN_EVIDENCE_TEMPLATE.md
- docs/quality/REAL_LLM_SESSION_2026-05-29.md or a new dated session doc template
- docs/library/AGENT_OUTPUT_EVALUATION.md

Scope:
1. Extend the existing real-LLM evidence workflow so it can evaluate all four agent types against a small non-sensitive fixture scenario.
2. Emit one JSON artifact and one Markdown artifact containing: execution mode, model/deployment, agent result counts, parse failures, structural validity, semantic score, faithfulness/support ratio when available, quality-gate outcome, and PASS/WARN/HOLD.
3. Keep real Azure OpenAI credentials owner-provided through existing environment/secrets patterns. Do not commit secrets.
4. If not all four real outputs can be produced in automation, make the gap explicit in the report and fail the evidence gate as HOLD, not PASS.
5. Add focused tests around the summarizer/report builder using local fixture JSON so normal PR CI remains deterministic.

Acceptance criteria:
- A maintainer can run one documented command and get `artifacts/release/real-llm-evidence-gate.json` plus `.md`.
- The Markdown distinguishes topology-only, partial, simulator, and full quad-agent evidence.
- The gate cannot report PASS unless all required real-mode agent outputs are present, parsed, structurally valid, and quality-gate accepted.
- Existing simulator-only CI continues to pass without Azure OpenAI credentials.
- Documentation states how to attach this artifact to an RC and what it does not prove.

Constraints:
- Do not make live Azure OpenAI calls mandatory for every PR.
- Do not weaken the golden-cohort kill switch.
- Do not compare raw LLM strings for exact match.
- Do not add new vendors or libraries.
- Do not change model choice from the documented canonical baseline unless configuration already supports it.

What not to change:
- Do not promote MCP, multi-cloud, public SDK, SOC 2 CPA, or third-party pen-test work.
- Do not alter pricing, public claims, or deferred scope docs except for real-mode evidence wording.

Verification:
- Run focused unit tests for the evidence summarizer/report builder.
- Run the existing deterministic agent-eval corpus path.
- If credentials are available, run the real evidence command and inspect the JSON/Markdown output.
```

#### 2. Scope-to-identity binding at API ingress

Tier: Tier 1. Status: Fully actionable now.

Why it matters: Tenant and scope identity must not depend on client-controlled headers in production-like paths. This is core to enterprise trust and data isolation.

Expected impact: Directly improves Trustworthiness (+6-8 pts), Correctness (+2-4 pts), Compliance Readiness (+2-3 pts), Azure SaaS Readiness (+2-4 pts). Weighted readiness impact: +0.5-0.9%.

Affected qualities: Trustworthiness, Correctness, Compliance Readiness, Procurement Readiness, Azure Compatibility and SaaS Deployment Readiness.

Why ranked here: A tenant-boundary flaw is a release-stopping class of risk even if its weight is spread across multiple qualities.

Evidence: `docs/library/TECH_BACKLOG.md` lists TB-072 as security P0: ApiKey and DevBypass carry zero tenant claims; `x-tenant-id` alone resolves scope.

Cursor prompt:

```text
Implement TB-072: bind API ingress scope to authenticated identity for ApiKey, JwtBearer/SAML/OIDC, and DevelopmentBypass modes.

Goal:
Prevent production-like requests from relying solely on client-supplied scope headers for tenant/workspace/project identity. The API should reconcile scope headers against authenticated identity/configured bindings and fail closed when a mismatch or missing binding would create tenant ambiguity.

Likely files/modules:
- ArchLucid.Host.Core/Auth/Services/HttpScopeContextProvider.cs
- ArchLucid.Host.Core/Auth or Authorization services
- ArchLucid.Api authentication setup
- ArchLucid.Host.Composition startup registrations
- ArchLucid.Api.Tests auth/scope tests
- docs/library/CONFIGURATION_REFERENCE.md
- docs/library/contributor-reference/SECURITY.md

Scope:
1. Audit how tenantId/workspaceId/projectId are resolved from headers, claims, API keys, and dev bypass.
2. Add an explicit scope binding policy:
   - JwtBearer/SAML/OIDC: scope must come from claims or tenant claim mapping, with headers allowed only when explicitly reconciled.
   - ApiKey: require configured scope binding for production-like environments, or reject ambiguous scoped requests.
   - DevelopmentBypass: keep dev ergonomics but fail closed outside Development/explicit test hosts.
3. Add tests for accepted and rejected combinations, including header/claim mismatch and missing tenant binding.
4. Preserve existing local dev/test behavior where already guarded by Development environment checks.

Acceptance criteria:
- Production-like ApiKey mode cannot accept arbitrary `x-tenant-id` without a configured binding.
- Jwt/OIDC/SAML requests reject mismatched scope headers.
- DevelopmentBypass remains usable only in allowed environments.
- Problem Details include a safe support hint and correlation id.
- Tests cover all auth modes touched.

Constraints:
- Do not store secrets in tests.
- Do not break existing test factories without adding explicit test-mode configuration.
- Keep code modular; avoid duplicating claim parsing.

What not to change:
- Do not redesign RBAC roles.
- Do not change public API route shapes unless unavoidable.
- Do not alter V1.1 connector scope.

Verification:
- Run focused auth/scope API tests.
- Run fast core if feasible.
- Inspect config docs for accurate production-like guidance.
```

#### 3. Production Azure AI Search tenant filter and readiness proof

Tier: Tier 1. Status: Fully actionable now.

Why it matters: Retrieval is now part of AI trust. Production-like vector search must enforce tenant/workspace/project filters on every search and delete, and the readiness proof must show Azure AI Search is actually configured when required.

Expected impact: Directly improves Trustworthiness (+4-6 pts), AI/Agent Readiness (+3-5 pts), Azure SaaS Readiness (+4-6 pts), Correctness (+2-3 pts). Weighted readiness impact: +0.4-0.8%.

Affected qualities: AI/Agent Readiness, Trustworthiness, Correctness, Azure Compatibility and SaaS Deployment Readiness, Compliance Readiness.

Why ranked here: It closes a production data-isolation risk on a high-value AI path.

Evidence: `docs/library/TECH_BACKLOG.md` lists TB-071 as P0. `docs/library/CONFIGURATION_REFERENCE.md` requires `Retrieval:VectorIndex=AzureSearch` on production-like profiles. Current code contains `AzureSearchTenantScopeFilterBuilder`, `AzureSearchSdkClient`, and tests, but the backlog still calls out production wiring risk.

Cursor prompt:

```text
Complete TB-071: production Azure AI Search client tenant filtering and readiness proof.

Goal:
Ensure every production-like Azure AI Search retrieval and scoped delete includes tenant/workspace/project filters, and make production-like readiness fail or HOLD when Azure AI Search is required but not truly configured.

Likely files/modules:
- ArchLucid.Retrieval/Indexing/AzureSearchTenantScopeFilterBuilder.cs
- ArchLucid.Retrieval/Indexing/AzureSearchSdkClient.cs
- ArchLucid.Retrieval/Indexing/AzureAiSearchVectorIndex.cs
- ArchLucid.Host.Composition/Startup/ServiceCollectionExtensions.AgentsGovernanceRetrieval.cs
- ArchLucid.Host.Core/Startup/Validation/Rules/RetrievalRules.cs
- ArchLucid.Core/Hosting/AzureAiSearchProductionLikeConfigurationLint.cs
- ArchLucid.Retrieval.Tests/*
- ArchLucid.Api.Tests or Host.Core.Tests config lint/readiness tests
- docs/library/CONFIGURATION_REFERENCE.md

Scope:
1. Verify DI registers the real Azure Search client when `Retrieval:VectorIndex=AzureSearch` and endpoint/index/auth are configured.
2. Ensure every search/delete path builds and passes a tenant/workspace/project OData filter unless `IncludePlatformCorpora` is explicitly allowed for platform docs.
3. Add tests that inspect the generated filter for normal tenant corpora and platform corpora.
4. Ensure production-like config lint and first-pilot proof fail/HOLD when `VectorIndex` is not AzureSearch or endpoint/index/auth are missing.
5. Document exactly how operators prove Azure AI Search is active in a production-like pilot.

Acceptance criteria:
- No production search path can execute without a scope filter for tenant-bound corpora.
- Platform corpora remain available only through the documented sentinel/allow-list behavior.
- Production-like config lint emits blocking findings when Azure Search is absent.
- Tests cover filter construction and DI/config selection.

Constraints:
- Do not add network calls to normal unit tests.
- Do not weaken in-memory test behavior.
- Do not allow unscoped query escape hatches in production-like mode.

What not to change:
- Do not implement Graph-RAG or V2 retrieval.
- Do not add MCP tools.

Verification:
- Run focused Retrieval and Host.Core config lint tests.
- Run any existing Azure Search tenant-scope tests.
```

#### 4. Canonical executive KPI and ROI data consistency

Tier: Tier 1. Status: Fully actionable now.

Why it matters: Buyer-visible ROI and governance counts must be correct. Divergent orphan savings, waiver windows, decision counts, and cost-waste semantics can damage trust faster than missing features.

Expected impact: Directly improves Correctness (+6-10 pts), Data Consistency (+8-12 pts), Proof-of-ROI Readiness (+4-6 pts), Executive Value Visibility (+3-5 pts). Weighted readiness impact: +0.6-1.1%.

Affected qualities: Correctness, Data Consistency, Proof-of-ROI Readiness, Executive Value Visibility, Trustworthiness.

Why ranked here: It fixes customer-visible truth, not internal polish.

Evidence: `docs/library/TECH_BACKLOG.md` lists TB-103, TB-104, TB-105, TB-149, TB-150, TB-151, TB-152, and TB-155 as customer-visible correctness risks.

Cursor prompt:

```text
Unify executive KPI and ROI calculations so server responses are the single source of truth.

Goal:
Remove duplicated UI/backend/cache calculations for orphan savings, expiring waivers, decisions-needed counts, business-impact buckets, and ambiguous ROI fields.

Likely files/modules:
- ArchLucid.Application/Roi/ExecutiveRoiSummaryService.cs
- ArchLucid.Application/Roi/CachingExecutiveRoiSummaryService.cs
- ArchLucid.Contracts/Roi or related DTOs
- ArchLucid.Application.Tests/Roi/*
- archlucid-ui/src/app/(operator)/dashboard/_sections/*
- archlucid-ui/src/components/ExecutiveWorkspaceHealthDashboard.tsx
- archlucid-ui/src/components/BeforeAfterDelta*
- archlucid-ui/src/lib/run-potential-savings-parser.ts
- archlucid-ui/src/lib/executive-summary-markdown.ts
- docs/library/PILOT_SCORECARD_API.md

Scope:
1. Identify every UI-side heuristic or duplicate implementation for executive ROI/KPI values.
2. Add or rename DTO fields so the server returns:
   - canonical orphan candidate count and estimated savings,
   - canonical 14-day expiring waiver count,
   - decisions-needed union cardinality, not bucket sum,
   - business-impact category buckets,
   - distinct fields for risk-reduction score, pending-decision count, cost waste, and recoverable savings.
3. Update UI to display server values only; delete or quarantine heuristic parsers where possible.
4. Fix cache semantics so stale ROI cache cannot diverge from live decisions-needed values without an explicit freshness label.
5. Add tests for overlapping categories, waiver windows, stale cache behavior, and DTO serialization.

Acceptance criteria:
- The UI no longer computes visible executive KPI values from substring matching or local date rules.
- Tests prove overlapping finding categories do not double-count decision items.
- Tests prove expiring waiver count uses the canonical `[now, now+14d]` window.
- DTO field names no longer invert meaning or alias different concepts.
- Docs describe the canonical semantics.

Constraints:
- Preserve backwards compatibility where public DTO fields already exist; add new fields and deprecate ambiguous fields if removal would break clients.
- Do not change pricing or ROI model assumptions.

What not to change:
- Do not redesign the dashboard layout beyond necessary field replacement.
- Do not add new monetization claims.

Verification:
- Run focused Application ROI tests.
- Run affected UI unit tests.
- Regenerate API types if DTOs change.
```

#### 5. Recurring review idempotency before execution

Tier: Tier 1. Status: Fully actionable now.

Why it matters: Duplicate recurring review runs after restart can corrupt trust, inflate costs, and confuse operators.

Expected impact: Directly improves Reliability (+5-7 pts), Correctness (+3-5 pts), Cost-Effectiveness (+2-3 pts), Data Consistency (+2-4 pts). Weighted readiness impact: +0.25-0.45%.

Affected qualities: Reliability, Correctness, Data Consistency, Cost-Effectiveness, Manageability.

Why ranked here: It is a classic production reliability defect with direct cost and data impact.

Evidence: `docs/library/TECH_BACKLOG.md` lists TB-153: ACA restart after `CreateRunAsync` but before update can duplicate runs per schedule period.

Cursor prompt:

```text
Implement TB-153: recurring architecture review trigger idempotency before ExecuteRunAsync.

Goal:
Ensure a recurring review schedule cannot create duplicate runs for the same schedule period if the worker/API process restarts between create and state update.

Likely files/modules:
- ArchLucid.Application scheduling or recurring review services
- ArchLucid.Host.Core hosted services that trigger recurring reviews
- ArchLucid.Persistence repositories for scheduled reviews/runs
- ArchLucid.Persistence/Scripts/ArchLucid.sql and migrations if a uniqueness key is needed
- Relevant Application/Persistence tests
- docs/runbooks or library docs for recurring review behavior

Scope:
1. Locate recurring review trigger flow and identify the idempotency key: tenant/workspace/project/schedule id + scheduled period.
2. Persist or enforce a unique claim before calling `ExecuteRunAsync`.
3. Make reruns idempotently return the existing run or skip with a recorded reason.
4. Add tests for restart-like sequence: create succeeds, status update missing, trigger retries.
5. Emit logs/metrics/audit where consistent with existing scheduling patterns.

Acceptance criteria:
- Duplicate trigger attempts for the same schedule period do not create duplicate runs.
- Retry after partial failure either resumes/links to the existing run or records a safe skip.
- SQL migration follows the single DDL source-of-truth rule.
- Tests cover success, retry, and conflict paths.

Constraints:
- Prefer DB-level uniqueness or transactional claim over in-memory locks.
- Do not introduce a new scheduler framework.

What not to change:
- Do not redesign authority pipeline orchestration.
- Do not move to Durable Task or Container Apps Jobs.

Verification:
- Run focused Application/Persistence tests for recurring review trigger.
```

#### 6. Waiver and disposition state invariants

Tier: Tier 1. Status: Fully actionable now.

Why it matters: Governance signals must not show active waivers on remediated findings or stale risks after expiry. This affects trust, auditability, and executive counts.

Expected impact: Directly improves Data Consistency (+5-8 pts), Correctness (+3-5 pts), Auditability (+2-4 pts), Policy and Governance Alignment (+2-3 pts). Weighted readiness impact: +0.25-0.45%.

Affected qualities: Data Consistency, Correctness, Auditability, Policy and Governance Alignment, Trustworthiness.

Why ranked here: It protects governance truth used in proof and executive summaries.

Evidence: `docs/library/TECH_BACKLOG.md` lists TB-154 and TB-155 around waiver/disposition invariants and ROI cache divergence.

Cursor prompt:

```text
Implement waiver/disposition state invariants and cache freshness safeguards.

Goal:
Ensure findings, waivers, dispositions, and ROI/decision summaries cannot contradict each other in customer-visible governance views.

Likely files/modules:
- ArchLucid.Application governance/disposition services
- ArchLucid.Application/Roi/ExecutiveRoiSummaryService.cs
- ArchLucid.Application/Roi/CachingExecutiveRoiSummaryService.cs
- Persistence repositories/tables for findings, waivers, dispositions
- ArchLucid.Application.Tests governance and ROI tests
- docs/library/GOVERNANCE_WORKFLOW_UI.md or related docs

Scope:
1. Define allowed transitions between active waiver, expired waiver, remediated/resolved disposition, deferred disposition, and decisions-needed.
2. Enforce invariants in write services and summary builders.
3. Ensure cache consumers either use canonical live waiver counts or show freshness explicitly.
4. Add tests for active waiver + remediated finding, waiver expiry, deferred findings, and cache stale scenarios.

Acceptance criteria:
- Active waiver cannot coexist with a remediated state unless explicitly documented and hidden from "decision needed."
- Expired waivers re-enter decision-needed or an explicit expired-waiver bucket.
- ROI/executive summary uses the same canonical waiver state as governance views.
- Tests fail on the previously inconsistent states.

Constraints:
- Avoid broad schema redesign if service-level invariants suffice.
- Preserve existing audit event semantics or add typed events when state changes are material.

What not to change:
- Do not add new policy-pack content.
- Do not change commercial pricing logic.

Verification:
- Run focused governance/ROI tests.
```

#### 7. API/proxy connectivity diagnostics and toasts

Tier: Tier 1. Status: Fully actionable now.

Why it matters: A product that says "AI assistant unavailable" when the API/proxy is down trains operators to debug the wrong system. This directly hurts first-pilot usability and supportability.

Expected impact: Directly improves Adoption Friction (+3-5 pts), Usability (+3-4 pts), Supportability (+3-5 pts), Cognitive Load (+4-6 pts). Weighted readiness impact: +0.25-0.45%.

Affected qualities: Adoption Friction, Usability, Supportability, Cognitive Load, Customer Self-Sufficiency.

Why ranked here: It is a P0 local/operator friction item and cheap relative to impact.

Evidence: `docs/library/TECH_BACKLOG.md` lists TB-156 and TB-157 as P0, and `archlucid-ui` contains proxy/API and toast surfaces.

Cursor prompt:

```text
Implement TB-156 and TB-157: strict local API/UI proxy preflight and accurate connectivity error copy.

Goal:
When the API or UI proxy is unreachable, operators should see "ArchLucid API unreachable" or equivalent, not "AI assistant unavailable." Local startup scripts should fail before opening a browser if the browser -> UI -> proxy -> API chain is broken.

Likely files/modules:
- scripts/start-local-api-and-ui.ps1
- scripts/env-readiness.ps1
- archlucid-ui/src/lib/api-error-toast-policy.ts
- archlucid-ui/src/api/proxy or proxy health route files
- archlucid-ui tests around toast/error policy
- docs/runbooks/TROUBLESHOOTING.md
- docs/library/customer-facing/OPERATOR_QUICKSTART.md

Scope:
1. Add or reuse a `/api/proxy/health/live` style check that exercises UI proxy to API reachability.
2. Update local startup script to fail closed with a clear message before opening the browser when API/proxy is unreachable.
3. Update toast/error policy so 502/fetch/proxy failures say API/proxy unreachable, reserving assistant wording for Ask/SSE-specific failures.
4. Add unit tests for error classification.
5. Update troubleshooting docs with the new messages.

Acceptance criteria:
- Startup script reports the exact failing link: API not running, UI proxy misconfigured, or browser route unavailable.
- Proxy/API failures no longer show "Review assistant unavailable" unless the failing feature is actually Ask/assistant.
- Tests lock the copy/classification.

Constraints:
- Do not start background long-running processes in tests.
- Keep copy concise and operator-friendly.

What not to change:
- Do not redesign Ask/SSE.
- Do not alter authentication behavior.

Verification:
- Run affected UI unit tests.
- Manually inspect script behavior if local prerequisites are available.
```

#### 8. Core hosted Azure Terraform parity: Key Vault, AOAI, AI Search, monitoring

Tier: Tier 1. Status: Partially actionable now.

Why it matters: The user’s infrastructure rule is that all infrastructure must be representable in Terraform. Current backlog identifies security and deployment gaps where core services are portal/out-of-band or incompletely composed.

Expected impact: Directly improves Azure SaaS Readiness (+8-12 pts), Deployability (+5-7 pts), Procurement Readiness (+2-4 pts), Reliability (+2-4 pts), Cost-Effectiveness (+2-3 pts). Weighted readiness impact: +0.4-0.8%.

Affected qualities: Azure Compatibility and SaaS Deployment Readiness, Deployability, Reliability, Procurement Readiness, Cost-Effectiveness.

Why ranked here: It affects repeatability, security review, and cost predictability for hosted pilots.

Evidence: `docs/library/TECH_BACKLOG.md` lists TB-091 through TB-099, with TB-091/TB-092 security-critical and TB-093/TB-096 core AI service coverage.

Cursor prompt:

```text
Implement a scoped Terraform parity pass for production-like hosted pilots: Key Vault private endpoint/RBAC, Azure OpenAI composition, Azure AI Search composition, and Azure Monitor workspace wiring.

Goal:
Make the core hosted pilot services representable and validateable in Terraform without requiring portal-only configuration for security-critical dependencies.

Likely files/modules:
- infra/terraform*
- infra/terraform-private
- infra/terraform-monitoring
- infra/modules if present
- docs/library/DEPLOYMENT_TERRAFORM.md
- docs/runbooks/MINIMAL_AZURE_PILOT_DEPLOYMENT.md
- docs/library/CONFIGURATION_REFERENCE.md

Scope:
1. Add Key Vault private endpoint + `privatelink.vaultcore.azure.net` private DNS wiring where the private stack disables public network access.
2. Add Key Vault Secrets User role assignments for API and Worker managed identities.
3. Compose Azure OpenAI account/deployment references into the hosted production-like stack or document a Terraform-managed module path if the root intentionally consumes an existing account.
4. Compose Azure AI Search service/index/private endpoint variables into the hosted production-like stack or document a Terraform-managed module path.
5. Add Azure Monitor workspace resource/wiring needed by managed Prometheus rule groups.
6. Update docs and examples so operators know which variables are required for a production-like pilot.

Acceptance criteria:
- `terraform validate` passes for touched roots.
- No new secret values are committed.
- Docs distinguish "create service" vs "consume existing service by ID" paths.
- The production-like pilot docs no longer require unstated portal-only setup for these core services.

Constraints:
- Keep changes scoped to core hosted pilot services. Do not implement Redis/Cosmos/ACR unless they are already required by the root touched.
- Use private endpoints over public exposure where the private stack intends it.
- Preserve existing variable names where practical.

What not to change:
- Do not deploy or run `terraform apply`.
- Do not add multi-region active/active.
- Do not change Azure primary-platform ADR.

Verification:
- Run Terraform formatting/validation for touched roots if available.
- Review docs for no raw secrets and no unsupported claims.
```

### Tier 2 — High-leverage next wave

#### 9. Run-detail grounding, tool-call, and inline provenance panels

Tier: Tier 2. Status: Fully actionable now.

Why it matters: Operators need to understand why a review is trustworthy without leaving the run detail page. Current backlog identifies no dedicated UI for retrieval hits, tool calls, or inline provenance summary.

Expected impact: Improves Traceability (+3-5 pts), Explainability (+3-5 pts), Trustworthiness (+2-4 pts), Usability (+2-4 pts). Weighted readiness impact: +0.2-0.4%.

Affected qualities: Traceability, Explainability, Usability, Trustworthiness, Supportability.

Why ranked here: It is not as release-blocking as correctness/security, but it materially improves operator confidence.

Evidence: TB-110 shipped (`RunToolInvocationForensicsPanel`, structured ledger, execute-gated raw preview). `docs/library/TECH_BACKLOG.md` still lists TB-109 (retrieval grounding panel) and TB-111 (inline provenance).

Cursor prompt:

```text
Add run-detail panels for retrieval grounding, tool-call history, and inline provenance summary.

Goal:
Make the review detail page show the key evidence that explains AI output quality and traceability without forcing operators to jump to separate routes or raw traces.

Likely files/modules:
- archlucid-ui/src/app/(operator)/reviews/[runId]/_sections/RunDetailPageView.tsx
- archlucid-ui/src/components/RunAgentForensicsSection.tsx
- archlucid-ui/src/components/ExplanationEvidenceBasisBadges.tsx
- ArchLucid.Api run detail or agent forensics endpoints if data is missing
- ArchLucid.Application retrieval/provenance read services if needed
- API types generated for UI
- UI tests around run detail

Scope:
1. Add a collapsed "Grounding" panel showing retrieved chunks/corpus kind/scores or an explicit "not available" state.
2. Add a collapsed "Tool calls" panel showing function/tool invocation summaries when present.
3. Add an inline provenance summary card on review detail that links to the full graph/provenance page.
4. Keep raw prompt/response content hidden unless existing permissions and redaction support it.
5. Add tests for empty, degraded, and populated states.

Acceptance criteria:
- Operators can see whether retrieval was used/degraded for a review.
- Missing grounding/tool-call data is labeled honestly, not hidden as success.
- The page remains usable for runs without those records.
- Tests cover rendering and labels.

Constraints:
- Do not expose secrets, raw prompts, or unredacted customer evidence.
- Do not create new unscoped read endpoints.

What not to change:
- Do not redesign the entire review detail page.
- Do not implement MCP or Graph-RAG.

Verification:
- Run affected UI tests.
- Regenerate API types if endpoint shape changes.
```

#### 10. In-app customer documentation and GitHub-link cleanup

Tier: Tier 2. Status: Fully actionable now.

Why it matters: Buyers and operators should not be pushed into raw repository browsing for primary help. Product-native help improves adoption, procurement credibility, and cognitive load.

Expected impact: Improves Adoption Friction (+3-5 pts), Documentation (+4-6 pts), Customer Self-Sufficiency (+4-6 pts), Usability (+2-4 pts). Weighted readiness impact: +0.25-0.45%.

Affected qualities: Adoption Friction, Documentation, Customer Self-Sufficiency, Usability, Cognitive Load.

Why ranked here: It is high leverage but less critical than correctness/security.

Evidence: `docs/library/TECH_BACKLOG.md` lists TB-143 through TB-148. `rg` found multiple `github.com/.../blob` and repo-doc links inside `archlucid-ui/src`.

Cursor prompt:

```text
Implement the first customer-facing in-app documentation cleanup: route primary product help links through the in-app documentation registry instead of GitHub blob URLs.

Goal:
Operators and buyers should open ArchLucid help routes for primary product documentation, with optional source links only where explicitly appropriate.

Likely files/modules:
- archlucid-ui/src/lib/product-documentation-registry.ts
- archlucid-ui/src/components/HelpPanel.tsx
- archlucid-ui/src/components/marketing/*
- archlucid-ui/src/app/(operator)/**/*
- archlucid-ui/src/app/(marketing)/**/*
- docs/library/PRODUCT_DOCUMENTATION_PRESENTATION.md
- tests/lint or scripts/ci for link guard

Scope:
1. Inventory user-facing GitHub blob links and raw `docs/...` help references in operator/marketing UI.
2. Add or extend in-app help route mappings for the highest-traffic buyer/operator topics.
3. Replace primary links with `inAppHelpHref` / registry-resolved routes.
4. Add a CI or unit guard that prevents new primary GitHub blob links in customer-facing UI paths, allowing explicit developer/source mode only.
5. Keep visible source file references only in developer/admin diagnostics contexts.

Acceptance criteria:
- Primary operator/buyer help links resolve inside the product shell.
- Tests or CI fail on new customer-facing GitHub blob links unless allowlisted.
- Help routes clearly distinguish buyer/operator/developer audience.

Constraints:
- Do not delete source docs.
- Do not build a large CMS.
- Keep first pass focused on high-value links already present in UI.

What not to change:
- Do not rewrite all documentation.
- Do not alter public pricing or trust claims.

Verification:
- Run affected UI unit tests.
- Run the new link guard if added.
```

#### 11. Starter proof pack chooser, metadata, and static validation

Tier: Tier 2. Status: Fully actionable now.

Why it matters: Existing accelerators can reduce time-to-value, but only if evaluators can choose the right one and trust its scope.

Expected impact: Improves Time-to-Value (+3-5 pts), Template and Accelerator Richness (+8-12 pts), Adoption Friction (+2-4 pts), Marketability (+2-3 pts). Weighted readiness impact: +0.25-0.45%.

Affected qualities: Time-to-Value, Template and Accelerator Richness, Adoption Friction, Marketability.

Why ranked here: It helps GTM and first pilots without expanding product scope.

Evidence: `docs/library/TECH_BACKLOG.md` lists TB-114 through TB-116, emphasizing chooser/metadata/validation over template count.

Cursor prompt:

```text
Create a starter proof pack chooser, metadata contract, and static validation gate.

Goal:
Make existing starter proof packs easy to select and safe to ship without adding new templates.

Likely files/modules:
- templates/starter-proof-packs/*
- templates/README.md
- docs/onboarding/EVALUATOR_WORKBOOK.md
- docs/runbooks/FIRST_PILOT_OPERATOR_PATH.md
- docs/library/ACCELERATOR_CHOOSER.md or create if referenced but missing
- scripts/ci/*
- tests for validation script if patterns exist

Scope:
1. Add a chooser mapping buyer jobs to existing packs, expected inputs, expected outputs, target persona, time-to-first-value, and "do not use when."
2. Define `starter-pack.json` metadata for each existing starter proof pack.
3. Add a static validation script that checks required metadata fields, JSON parseability, local links where practical, V1/V1.1/V2 scope labels, missing files, obvious placeholders, and secret-shaped values.
4. Link chooser from template and evaluator entry points.

Acceptance criteria:
- A first-time evaluator can pick a pack by buyer job in under 10 minutes.
- Every existing starter pack has complete metadata.
- Validation fails on missing metadata, malformed JSON, buyer-unsafe placeholders, or unsupported scope labels.
- No new starter pack is added.

Constraints:
- Reuse existing validation/secret-placeholder helpers where practical.
- Do not mark V1.1/V2 capabilities as V1-ready.

What not to change:
- Do not add new market-facing demo assets.
- Do not create public customer claims from synthetic packs.

Verification:
- Run the new validation script.
- Run tests for valid/invalid fixtures if added.
```

#### 12. Commercial closeout and overclaim guard

Tier: Tier 2. Status: Fully actionable now.

Why it matters: Sales-led revenue depends on asking for the right next step at the right time. The product must not imply live commerce, SOC 2 CPA, public references, or unsupported ROI claims.

Expected impact: Improves Commercial Packaging Readiness (+5-8 pts), Decision Velocity (+5-7 pts), Proof-of-ROI Readiness (+2-4 pts), Marketability (+2-3 pts). Weighted readiness impact: +0.25-0.45%.

Affected qualities: Commercial Packaging Readiness, Decision Velocity, Proof-of-ROI Readiness, Marketability, Trustworthiness.

Why ranked here: It directly affects monetization but can follow core correctness/security work.

Evidence: `docs/library/TECH_BACKLOG.md` lists TB-129 through TB-134. `docs/go-to-market/COMMERCIAL_CONVERSION_CHECKLIST.md` and `QUOTE_TO_PROOF_PACKET.md` already define the desired flow.

Cursor prompt:

```text
Harden commercial closeout artifacts and add a commercial overclaim guard.

Goal:
Make the quote-to-proof path produce consistent PASS/HOLD/DEFERRED_SCOPE commercial next steps, and prevent product/marketing copy from implying unsupported claims.

Likely files/modules:
- docs/go-to-market/COMMERCIAL_CONVERSION_CHECKLIST.md
- docs/go-to-market/QUOTE_TO_PROOF_PACKET.md
- docs/go-to-market/SERVICE_LED_OFFERS.md
- docs/go-to-market/PRICING_PHILOSOPHY.md
- scripts/collect-first-pilot-proof.ps1 and proof sub-scripts
- scripts/ci/*
- archlucid-ui marketing/pricing pages if copy is present there

Scope:
1. Ensure generated commercial closeout artifacts agree with `go-no-go-summary.json`, `commercial-next-step.json`, ROI sponsor-safe status, procurement PASS/HOLD, and deferred scope.
2. Add a lightweight copy guard and claim-boundary guide that flags unsupported claims: live commerce/Marketplace transactability, SOC 2 CPA issued, public reference customer, guaranteed ROI, unsupported self-serve maturity, or V1.1 connectors as V1.
3. Add or update the service-led offer pack for the AI & Cloud Architecture Readiness Review with owner-reviewable pricing bands, exact deliverables, buyer prerequisites, exclusions, acceptance criteria, and "what the buyer gets in week 1 / week 2" language.
4. Draft pilot success thresholds for owner review: minimum proof packet quality, ROI/savings confidence, time-to-first-value, false-positive tolerance, and sponsor acceptance criteria.
5. Add owner-reviewable public positioning language for what ArchLucid is, what it is not yet, which claims require proof, and what must be labeled simulator, local-owner-dev, prototype, V1.1, or V2.
6. Add a model-assisted drafting workflow or prompt fixture that can regenerate the offer packaging, pilot success thresholds, and public claim boundaries from current GTM docs without inventing unsupported claims.
7. Add tests/fixtures for SEND, HOLD, DEFERRED_SCOPE, and ROI-not-sponsor-safe scenarios.

Acceptance criteria:
- Commercial closeout cannot say "send" when proof JSON says HOLD.
- Deferred buyer requirements are named without implying V1 failure.
- Copy guard catches obvious unsupported phrases.
- Service-led offer pack has one clear buyer-facing path to next commercial action.
- AI & Cloud Architecture Readiness Review packaging names buyer outcomes, timeline, deliverables, exclusions, prerequisites, and acceptance criteria clearly enough for owner approval.
- Pilot success thresholds are concrete enough for a founder-led pilot to decide PASS/HOLD without renegotiating success after the fact.
- Public claim boundaries are explicit enough that a frontier model can draft buyer-facing copy without implying unsupported maturity, certifications, procurement paths, customer references, or production evidence.

Constraints:
- Do not change locked prices.
- Do not claim live Stripe/Marketplace unless already configured and explicitly enabled.
- Do not add public reference or SOC 2 claims.
- Treat pricing bands and final wording as owner-reviewable draft output, not automatically approved commercial commitments.
- Keep claim-boundary output as draft guidance requiring owner review before publication.

What not to change:
- Do not implement Stripe live-key flip or Marketplace publication.
- Do not create market-facing demo assets.
- Do not add new service offers beyond the AI & Cloud Architecture Readiness Review.

Verification:
- Run proof artifact tests/scripts.
- Run new copy guard.
```

#### 13. Audit and governance proof summaries

Tier: Tier 2. Status: Fully actionable now.

Why it matters: For enterprise pilots, buyers need to see what was audited, what policies applied, and what was omitted for safety. This turns existing audit/governance depth into buyer trust.

Expected impact: Improves Auditability (+5-7 pts), Trustworthiness (+2-4 pts), Policy and Governance Alignment (+3-5 pts), Procurement Readiness (+2-4 pts). Weighted readiness impact: +0.2-0.4%.

Affected qualities: Auditability, Trustworthiness, Policy and Governance Alignment, Procurement Readiness, Compliance Readiness.

Why ranked here: It supports enterprise closeout but is not as urgent as tenant/security correctness.

Evidence: `docs/library/TECH_BACKLOG.md` lists TB-122 through TB-128.

Cursor prompt:

```text
Add buyer-safe audit and governance summaries to proof/procurement artifacts.

Goal:
Make proof bundles explain which governance policies applied, what audit evidence exists, and which sensitive details are intentionally omitted.

Likely files/modules:
- scripts/collect-first-pilot-proof.ps1 and related proof scripts
- ArchLucid.Cli pilot proof / proof-packet commands
- ArchLucid.Application governance/audit read services
- docs/library/AUDIT_COVERAGE_MATRIX.md
- docs/go-to-market/PROCUREMENT_EVIDENCE_PACKET.md
- docs/runbooks/FIRST_PILOT_EVIDENCE_BUNDLE.md

Scope:
1. Add a governance outcome summary: applied policies, approvals, waivers, unresolved governance items, buyer-safe status.
2. Add a buyer-safe audit evidence summary: categories, correlation IDs, run/manifest traceability, omitted sensitive fields.
3. Add audit event catalog metadata where needed: owner, purpose, actor/scope fields, retention sensitivity, export posture.
4. Add tests for sponsor/procurement proof actions emitting audit rows or explicit informational-only rationale.

Acceptance criteria:
- Proof bundle includes governance and audit summary files.
- Sensitive fields are omitted or redacted by default.
- Critical proof generation actions either emit audit rows or document why they are informational only.
- Tests cover at least one proof-generation path.

Constraints:
- Do not expose raw secrets, prompts, or private customer data.
- Do not imply SOC 2 attestation.

What not to change:
- Do not broaden audit retention commitments.
- Do not add third-party assurance claims.

Verification:
- Run focused proof/audit tests and proof script dry-run.
```

#### 14. Critical test coverage backfill for correctness/security hotspots

Tier: Tier 2. Status: Fully actionable now.

Why it matters: Coverage gates exist, but known low-coverage hotspots include production code tied to cost, host/core behavior, decisioning, notifications, and health/configuration.

Expected impact: Improves Testability (+4-6 pts), Correctness (+2-4 pts), Reliability (+2-3 pts), Maintainability (+2-3 pts). Weighted readiness impact: +0.2-0.35%.

Affected qualities: Testability, Correctness, Reliability, Maintainability.

Why ranked here: It is risk-reducing, but targeted tests should follow the correctness fixes to avoid churn.

Evidence: `docs/library/COVERAGE_GAP_ANALYSIS.md` lists low-coverage assemblies and classes; CI enforces 75/63/63 while 95% ratchet is deferred.

Cursor prompt:

```text
Add targeted tests for current high-risk coverage hotspots without chasing arbitrary percentage gains.

Goal:
Increase confidence in correctness/security-sensitive production paths identified by the coverage gap analysis.

Likely files/modules:
- ArchLucid.Capabilities.Cost/CostConstraintFindingEngine.cs and tests
- ArchLucid.Host.Core auth/health/configuration classes and tests
- ArchLucid.Decisioning explainability/idempotency-relevant classes and tests
- ArchLucid.Notifications webhook/verifier classes if V1 surfaces depend on them
- docs/library/COVERAGE_GAP_ANALYSIS.md

Scope:
1. Choose 3-5 high-risk classes with low coverage where behavior is pure or testable with fakes.
2. Add focused unit tests for edge cases, null/invalid input, failure behavior, and security-relevant branches.
3. Avoid testing SDK passthroughs or classes already justified in coverage exclusions.
4. Update coverage docs only if the hotspot table or guidance changes.

Acceptance criteria:
- Tests cover meaningful branch behavior, not getters or DTOs.
- No new broad integration dependencies are introduced.
- Coverage improves in selected classes or justifies why not.

Constraints:
- Do not lower coverage gates.
- Do not add `[ExcludeFromCodeCoverage]` unless it meets the documented exclusion policy.

What not to change:
- Do not attempt the V1.1 95% ratchet.
- Do not refactor production code broadly just for tests.

Verification:
- Run focused test projects.
```

#### 15. Secret and tool-sandbox hardening

Tier: Tier 2. Status: Fully actionable now.

Why it matters: Production security posture improves if long-lived keys and tool allowlists are enforced rather than advisory.

Expected impact: Improves Trustworthiness (+2-4 pts), Compliance Readiness (+2-3 pts), Manageability (+2-3 pts), Azure SaaS Readiness (+2-3 pts). Weighted readiness impact: +0.15-0.3%.

Affected qualities: Trustworthiness, Compliance Readiness, Manageability, Azure Compatibility and SaaS Deployment Readiness.

Why ranked here: Important defense-in-depth after P0 tenant/scope work.

Evidence: `docs/library/TECH_BACKLOG.md` lists TB-080 through TB-083 and TB-082 around Azure OpenAI managed identity, Service Bus raw strings, API key Key Vault reference, and `AllowedTools` enforcement.

Cursor prompt:

```text
Implement a scoped security hardening pass for production secrets and agent tool allowlists.

Goal:
Reduce production reliance on raw secrets and ensure agent allowed-tools configuration is enforced at runtime.

Likely files/modules:
- ArchLucid.AgentRuntime/RealAgentExecutor.cs and related handler dispatch
- ArchLucid.Contracts/Agents/AgentTask.cs or AllowedTools model
- ArchLucid.Host.Core/Startup/Validation rules
- ArchLucid.Host.Composition Azure OpenAI/Service Bus registrations
- docs/library/CONFIGURATION_REFERENCE.md
- relevant Host.Core/AgentRuntime tests

Scope:
1. Enforce `AgentTask.AllowedTools` at handler/tool dispatch so empty/unset does not mean unrestricted in production-like real mode unless explicitly configured.
2. Add production-like validation warnings/errors for raw Service Bus connection strings where namespace FQDN/managed identity is expected.
3. Add production-like validation requiring ArchLucid API key material to come from Key Vault/reference patterns where applicable.
4. Prefer Azure OpenAI managed identity in production-like docs/config validation; keep ApiKey supported where explicitly allowed.

Acceptance criteria:
- Tests prove disallowed tools cannot execute.
- Production-like config lint flags unsafe secret patterns.
- Existing development/test paths remain usable.
- Docs explain the secure default and override conditions.

Constraints:
- Do not break current hosted deployments without an explicit compatibility path.
- Do not remove ApiKey support outright.

What not to change:
- Do not implement a new tool framework.
- Do not add external secret managers beyond Azure Key Vault/reference patterns.

Verification:
- Run focused AgentRuntime and config lint tests.
```

### Tier 3 — Hold for reassessment

#### 16. Run-level approve / reject / request-remediation actions

Tier: Tier 3. Status: Hold for reassessment.

Why it matters: A run-level action model could reduce workflow friction and improve governance adoption.

Expected impact: Would improve Workflow Embeddedness, Usability, Stickiness, and Policy/Governance Alignment.

Affected qualities: Workflow Embeddedness, Usability, Stickiness, Policy and Governance Alignment.

Why ranked here: It depends on run-detail grounding/provenance/tool panels and waiver/disposition invariants. Implementing new actions before the current evidence and state model is clean risks adding another inconsistent workflow layer.

Evidence: `docs/library/TECH_BACKLOG.md` lists TB-112 as P2 and adjacent TB-109 through TB-111 as prerequisite operator visibility work.

Hold for reassessment: Revisit after Improvements 6 and 9 are complete.

#### 17. Template-to-proof dry-run harness

Tier: Tier 3. Status: Hold for reassessment.

Why it matters: Dry-running every starter pack through a minimal request/policy/context path would improve template trust and regression safety.

Expected impact: Would improve Time-to-Value, Template and Accelerator Richness, Correctness, and Testability.

Affected qualities: Time-to-Value, Template and Accelerator Richness, Correctness, Testability.

Why ranked here: It should follow the pack chooser, metadata contract, and static validation. The dry-run shape may change after metadata fields and expected outputs are standardized.

Evidence: `docs/library/TECH_BACKLOG.md` lists TB-117 after TB-114 through TB-116.

Hold for reassessment: Revisit after Improvement 11.

#### 18. Broader UI visual design standard pass

Tier: Tier 3. Status: Hold for reassessment.

Why it matters: Enterprise visual polish affects buyer confidence, but it is secondary to correctness, trust, proof, and deployment readiness.

Expected impact: Would improve Usability, Marketability, Cognitive Load, and Enterprise Adoption.

Affected qualities: Usability, Marketability, Cognitive Load.

Why ranked here: The repo already has design-token work and a UI standard. A broad visual pass before fixing misleading data, AI evidence, and security hardening would consume cost without reducing release risk.

Evidence: `docs/library/TECH_BACKLOG.md` references UI design-standard work, while current release blockers are correctness/security/proof related.

Hold for reassessment: Revisit after Tier 1 is complete and one end-to-end pilot proof packet has been produced.

## Prompt Batching Guidance

Recommended first batch:

- Do alone with a strong reasoning model: Improvement 2 (scope-to-identity binding). Security-sensitive and cross-cutting.
- Do alone with a strong reasoning model: Improvement 4 (canonical KPI/ROI consistency). Customer-visible correctness with DTO/UI/API consequences.
- Do alone with Sonnet or stronger: Improvement 1 (real-mode quad-agent evidence gate). It touches scripts/tests/docs and needs careful release semantics.

Recommended second batch:

- Pair only if context allows: Improvements 5 and 6 (recurring idempotency + waiver/disposition invariants). Both are state/invariant work, but each should have its own PR if tests get large.
- Pair only if implementation is straightforward: Improvements 7 and 10 (connectivity diagnostics + in-app docs link cleanup). Both are UI/operator-friction oriented and safe for Sonnet/Composer split by file ownership.
- Do alone: Improvement 8 (Terraform parity). IaC/security and docs should not be batched with app code.

Recommended third batch:

- Combine in one UI/observability PR only if API shape is stable: Improvement 9.
- Combine in one GTM/proof PR: Improvements 11 and 12 if no codegen/API changes are needed.
- Pair in a supportability PR: Improvements 13 and 14 only if tests remain focused; otherwise split audit proof from test coverage.
- Do after security P0: Improvement 15.

Tasks suitable for cheaper models:

- Composer-safe: link cleanup, copy guard fixtures, starter-pack metadata fill-in, docs formatting, basic UI copy changes, static validation fixtures.
- Sonnet-safe: implementation prompts for proof pack chooser, commercial closeout, run-detail panels, connectivity toasts, targeted test additions.
- Strong-model recommended before release: scope-to-identity binding, Azure Search tenant filtering, KPI/ROI canonicalization, recurring review idempotency, waiver/disposition invariants, real-mode release evidence gate, Terraform security/IaC parity.

Review again with a stronger model before release:

- Improvements 1, 2, 3, 4, 5, 6, and 8.

## Model-Usage Guidance

Composer-safe:

- Improvement 10 for mechanical link migrations after registry targets are defined.
- Improvement 11 metadata fill-in and validation fixture expansion.
- Improvement 12 copy guard phrase lists and docs alignment after rules are defined.
- Improvement 14 simple test additions around pure functions.

Sonnet-safe:

- Improvement 7 connectivity toasts and startup preflight.
- Improvement 9 UI panels when API data already exists.
- Improvement 11 chooser, metadata contract, and static validation.
- Improvement 12 commercial closeout artifact hardening.
- Improvement 13 audit/proof summary generation.
- Improvement 15 targeted validation rules and allowed-tools enforcement if scoped tightly.

Strong-model recommended:

- Improvement 1 real-mode release evidence gate because it determines what ArchLucid may honestly claim.
- Improvement 2 scope-to-identity binding because it affects tenant boundaries.
- Improvement 3 Azure Search production filtering because retrieval can cross tenant boundaries if wrong.
- Improvement 4 KPI/ROI canonicalization because it changes customer-visible truth.
- Improvement 5 recurring review idempotency because partial failure recovery must be correct.
- Improvement 6 waiver/disposition invariants because governance state affects audit and executive reporting.
- Improvement 8 Terraform parity because it touches Azure security posture and deployability.
- Final release go/no-go after Tier 1 completion.

## Pending Questions for Later

None. The assessment follow-up questions raised in this section were resolved with owner input on 2026-06-01.

### Resolved Follow-Up Decisions

- **Full real-mode quad-agent release evidence gate:** canonical release-candidate real-mode evidence source is **local owner dev**. The gate should be **release-candidate required**, but **not branch-protection required** yet. If the evidence gate is not attached and passing, the release should explicitly narrow itself to simulator-only.
- **Core hosted Azure Terraform parity:** production-like hosted Terraform should **consume pre-existing Azure OpenAI and Azure AI Search resource IDs**, not create those services in the hosted root. The first production-like pilot region is **US East**.
- **Commercial closeout and overclaim guard:** the primary first service-led sales motion is **AI & Cloud Architecture Readiness Review**.
- **Final service-led offer packaging:** keep in current actionable scope. Add a task for model-assisted packaging of the **AI & Cloud Architecture Readiness Review**, including pricing bands, deliverables, acceptance criteria, exclusions, buyer prerequisites, and week 1 / week 2 buyer outcomes, with owner review before publication.
- **Public positioning and claim boundaries:** keep in current actionable scope. A frontier model can draft the claim-boundary guide and buyer-facing positioning language, with owner review before publication.
- **Pilot success thresholds and acceptance criteria:** keep in current actionable scope as model-assisted drafting plus owner review. Draft measurable PASS/HOLD criteria for proof packet quality, ROI/savings confidence, time-to-first-value, false-positive tolerance, and sponsor acceptance.
- **Starter proof pack chooser:** the canonical golden walkthrough starter pack should be **Azure cost / orphan / governance review** once metadata and validation land.
- **Run-level approve / reject / request-remediation actions:** run-level governance actions should be **shortcuts that create finding-level disposition records underneath**, with run summaries derived from finding-level state rather than becoming a separate authoritative state machine.

### Human-Input Score Limiter Decisions

- **Real pilot proof packet cohort:** promote to near-term GTM backlog priority. Requires owner-selected scenarios, approved data boundaries, and buyer-safe proof packet permission.
- **Market-facing demo asset production:** promote to near-term GTM backlog priority. Requires approved channel, screenshots/video/copy, and evidence-labeling rules.
- **First named public reference customer:** keep as V1.1 GTM backlog, not current release work.
- **SOC 2 CPA attestation program:** move to V2. Do not hold back current readiness or near-term GTM planning.
- **Third-party pen-test program:** move to V2. Do not hold back current readiness or near-term GTM planning.
- **Buyer security/procurement packet:** promote to near-term GTM/procurement backlog priority. Keep honest about not-yet-certified status.
- **Legal/procurement terms packet:** promote to near-term GTM/procurement backlog priority.
- **Design partner / pilot recruiting pipeline:** promote to near-term GTM backlog priority.
- **Support and pilot operating model:** promote to near-term GTM/operations backlog priority.
- **Transactable procurement path:** promote to near-term GTM/procurement backlog priority.
