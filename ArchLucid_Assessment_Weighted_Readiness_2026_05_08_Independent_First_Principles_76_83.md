# ArchLucid Assessment – Weighted Readiness 76.83%

**Date:** 2026-05-08  
**Method:** Independent first-principles assessment from repository materials  
**Basis:** Code, docs, CI workflows, infrastructure, test structure, and product scope artifacts  

---

## Executive Summary

### Overall Readiness

ArchLucid achieves a **76.83%** weighted readiness score. The product is a working, architecturally coherent platform that delivers on its core promise: shortening the path from architecture request to reviewable, defensible output. The system is structurally sound and surprisingly deep for a solo-founder codebase (~4,180 C# source files, ~1,229 test files, 511 UI components, 114 Terraform files, 27 CI workflows). However, several high-weight qualities (Marketability, Time-to-Value, Correctness, AI/Agent Readiness) are constrained by the gap between what is *architecturally wired* and what is *validated against real buyer workloads at scale*.

### Commercial Picture

The commercial posture is strong on *paper infrastructure* (pricing pages, order form templates, packaging docs, trial funnel wiring, executive sponsor briefs, ROI models) but lacks the critical feedback loop of real buyer interaction. Marketability suffers from messaging density—the product explanation requires too much context before value clicks. Time-to-Value is acceptable for the Pilot path but the sheer documentation weight and configuration surface could slow evaluators who expect a 5-minute "aha" moment.

### Enterprise Picture

Enterprise trust artifacts are impressive for a pre-revenue product: SOC 2 self-assessment, CAIQ/SIG pre-fills, STRIDE threat model, SCIM 2.0 provisioning, RLS, RBAC with four roles, 78 typed audit events, DPA templates, and comprehensive connector coverage (Teams, Slack, Jira, ServiceNow, Confluence, Azure DevOps). The gap is operational proof—no production tenant has exercised these controls under real load with real data classification.

### Engineering Picture

Engineering quality is the strongest pillar. Architectural integrity is high: clean separation (Core → Application → Api), Dapper over EF (justified), DbUp migrations, structured agent execution with concurrency gates, circuit breakers, resilience pipelines, staged critic orchestration, quality gates, and comprehensive observability instrumentation. The main engineering risks are: (1) real LLM output quality under diverse customer inputs is unproven at scale, (2) the connector surface area committed for V1 GA is wide relative to the team size, and (3) several critical paths (ITSM bidirectional sync, Confluence publish) are "Shipped + manual vendor" rather than CI-validated end-to-end.

---

## Weighted Quality Assessment

### Scoring Table (ordered by weighted deficiency — most urgent first)

| # | Quality | Score | Weight | Weighted Contribution | Weighted Deficiency | Horizon |
|---|---------|-------|--------|----------------------|--------------------:|---------|
| 1 | Marketability | 62 | 8 | 4.96 | 3.04 | v1 |
| 2 | AI/Agent Readiness | 72 | 8 | 5.76 | 2.24 | v1 |
| 3 | Correctness | 74 | 8 | 5.92 | 2.08 | v1 |
| 4 | Time-to-Value | 68 | 7 | 4.76 | 2.24 | v1 |
| 5 | Adoption Friction | 65 | 6 | 3.90 | 2.10 | v1 |
| 6 | Proof-of-ROI Readiness | 70 | 5 | 3.50 | 1.50 | v1 |
| 7 | Executive Value Visibility | 72 | 4 | 2.88 | 1.12 | v1 |
| 8 | Differentiability | 78 | 4 | 3.12 | 0.88 | v1 |
| 9 | Traceability | 82 | 3 | 2.46 | 0.54 | v1 |
| 10 | Usability | 72 | 3 | 2.16 | 0.84 | v1 |
| 11 | Workflow Embeddedness | 76 | 3 | 2.28 | 0.72 | v1 |
| 12 | Trustworthiness | 78 | 3 | 2.34 | 0.66 | v1 |
| 13 | Architectural Integrity | 85 | 3 | 2.55 | 0.45 | — |
| 14 | Security | 82 | 3 | 2.46 | 0.54 | v1 |
| 15 | Decision Velocity | 70 | 2 | 1.40 | 0.60 | v1 |
| 16 | Commercial Packaging Readiness | 72 | 2 | 1.44 | 0.56 | v1 |
| 17 | Auditability | 80 | 2 | 1.60 | 0.40 | — |
| 18 | Policy and Governance Alignment | 82 | 2 | 1.64 | 0.36 | — |
| 19 | Compliance Readiness | 76 | 2 | 1.52 | 0.48 | v1 |
| 20 | Procurement Readiness | 74 | 2 | 1.48 | 0.52 | v1.1 |
| 21 | Interoperability | 80 | 2 | 1.60 | 0.40 | — |
| 22 | Reliability | 78 | 2 | 1.56 | 0.44 | v1 |
| 23 | Data Consistency | 76 | 2 | 1.52 | 0.48 | v1 |
| 24 | Maintainability | 80 | 2 | 1.60 | 0.40 | — |
| 25 | Explainability | 77 | 2 | 1.54 | 0.46 | v1 |
| 26 | Azure Compatibility and SaaS Deployment Readiness | 82 | 2 | 1.64 | 0.36 | — |
| 27 | Stickiness | 74 | 1 | 0.74 | 0.26 | v1.1 |
| 28 | Template and Accelerator Richness | 68 | 1 | 0.68 | 0.32 | v1 |
| 29 | Accessibility | 76 | 1 | 0.76 | 0.24 | — |
| 30 | Customer Self-Sufficiency | 72 | 1 | 0.72 | 0.28 | v1 |
| 31 | Change Impact Clarity | 80 | 1 | 0.80 | 0.20 | — |
| 32 | Availability | 76 | 1 | 0.76 | 0.24 | v1 |
| 33 | Performance | 78 | 1 | 0.78 | 0.22 | — |
| 34 | Scalability | 74 | 1 | 0.74 | 0.26 | v1.1 |
| 35 | Supportability | 82 | 1 | 0.82 | 0.18 | — |
| 36 | Manageability | 80 | 1 | 0.80 | 0.20 | — |
| 37 | Deployability | 80 | 1 | 0.80 | 0.20 | — |
| 38 | Observability | 82 | 1 | 0.82 | 0.18 | — |
| 39 | Testability | 84 | 1 | 0.84 | 0.16 | — |
| 40 | Modularity | 85 | 1 | 0.85 | 0.15 | — |
| 41 | Extensibility | 80 | 1 | 0.80 | 0.20 | — |
| 42 | Evolvability | 78 | 1 | 0.78 | 0.22 | — |
| 43 | Documentation | 80 | 1 | 0.80 | 0.20 | — |
| 44 | Azure Ecosystem Fit | 84 | 1 | 0.84 | 0.16 | — |
| 45 | Cognitive Load | 64 | 1 | 0.64 | 0.36 | v1 |
| 46 | Cost-Effectiveness | 76 | 1 | 0.76 | 0.24 | — |

**Total Weights:** 100  
**Weighted Score:** 76.83 / 100

---

### Detailed Quality Justifications

#### 1. Marketability — 62/100 (Weight 8)

**Why this score:** The product does something genuinely valuable (architecture request → defensible package faster) but the messaging requires too much conceptual setup. "AI-assisted architecture workflow system" does not punch through noise for a VP of Engineering or CTO scanning 50 tools. The README is 400 lines long before value clicks. The executive sponsor brief exists but the path from "What does this do?" to "I need this" has too many intermediate concepts (runs, manifests, golden outputs, authority chains, governance packs). The trial funnel exists (Stripe test mode, Marketplace wiring, live E2E specs) but no production-live commerce flow.

**Key tradeoffs:** Documentation depth trades off against scanability. Completeness was prioritized over concision.

**Improvements:** Distill a 30-second value proposition that a buyer understands without domain context. Create a single-page "Why ArchLucid" that is competitor-aware. Produce a 2-minute video demo or animated walkthrough. Reduce concept count in first-touch materials.

#### 2. AI/Agent Readiness — 72/100 (Weight 8)

**Why this score:** The agent infrastructure is well-architected: `RealAgentExecutor` with staged critic orchestration, concurrent task dispatch with linked cancellation, configurable resilience pipelines (Polly), concurrency gates, model tier routing, cost guardrails (daily + monthly budget trackers), token quota tracking, LLM completion caching, circuit breakers, content safety guards, prompt redaction, and structured output validation (JSON schema enforcement). The `AgentOutputEvaluator` provides deterministic quality scoring without LLM calls. However, the system operates primarily in **simulator mode** for testing — real LLM quality under diverse customer briefs is validated by fixture golden files and optional live tests, not by a corpus of production runs. The staged critic pattern is sophisticated but untested against adversarial or degenerate inputs at scale. No autonomous multi-step planning (by design per V1 scope), which is appropriate.

**Key tradeoffs:** Simulator-first testing provides fast deterministic CI but masks real LLM variance. Quality gate enforcement exists but production calibration data is absent.

**Improvements:** Build a curated evaluation corpus of 20+ diverse architecture briefs spanning different domains, sizes, and constraint profiles. Run real LLM evaluation with quality scoring and publish pass rates. Implement agent output regression baselines for real model responses.

#### 3. Correctness — 74/100 (Weight 8)

**Why this score:** The system produces *structurally correct* outputs: manifests conform to schemas, agent results pass JSON validation, comparisons detect drift, and exports generate well-formed DOCX/Markdown. Governance workflows enforce segregation of duties and pre-commit gates work. However, "correctness" for an AI architecture tool ultimately means: do the topology suggestions, cost estimates, and compliance findings actually reflect the customer's infrastructure accurately? This depends entirely on input quality (brief, Azure extractor ZIP) and model output quality. The system validates *format* rigorously but validates *semantic accuracy* only through heuristic semantic scoring (claims with evidence refs, findings with non-empty descriptions). There is no ground-truth benchmark proving "ArchLucid's topology analysis for workload X produced recommendations that were correct."

**Key tradeoffs:** Format correctness is fully automated; semantic correctness requires domain expertise and real-world validation that a pre-revenue product cannot yet demonstrate at scale.

**Improvements:** Create 3-5 "golden run" reference architectures where the correct output is known, and measure semantic drift. Add confidence scoring that signals when agent output may be unreliable due to brief ambiguity or model uncertainty.

#### 4. Time-to-Value — 68/100 (Weight 7)

**Why this score:** The Pilot path (create run → execute → commit → review manifest) is clean and well-documented in `CORE_PILOT.md` with a 4-step checklist. The `archlucid run --quick` command gets a developer from zero to manifest in one CLI invocation. But this is the *development* quick path using fake results. For a real buyer: they must understand what an "architecture request" is, formulate a brief, configure storage (SQL), configure auth, run the API, create a project, craft an input brief that meets the 10-char minimum, and wait for agent execution. The SaaS trial funnel shortens this but is not commerce-live. Actual time-to-first-value for a real customer is estimated at 30-60 minutes assuming the SaaS is running, or 2-4 hours if self-hosted.

**Key tradeoffs:** Thorough configuration prevents misconfiguration but lengthens time-to-first-output. The product has many dials to turn before the first run delivers value.

**Improvements:** Ensure the hosted SaaS trial starts with a pre-loaded sample run so buyers see value before investing their own brief. Reduce mandatory configuration to zero for the trial path.

#### 5. Adoption Friction — 65/100 (Weight 6)

**Why this score:** The product imposes meaningful adoption friction: (1) the concept model requires learning (runs, manifests, authority chains, findings, governance packs, policy packs, artifacts, etc.), (2) the configuration surface is large (`ConfigurationKeyCatalog` references dozens of keys), (3) self-hosted pilots require .NET 10 SDK + Docker + SQL Server + Node 22, (4) the documentation volume is high (~32+ docs at root, 100+ under library/). The SaaS path removes infrastructure friction but not conceptual friction. The Core Pilot checklist and wizard help but the new-user information architecture could overwhelm.

**Key tradeoffs:** The product genuinely does complex things (multi-agent orchestration, governance, audit, comparison, replay) so some learning curve is inherent. The risk is that evaluators bounce before reaching the "aha."

**Improvements:** Progressive disclosure in UX (already partially implemented via Pilot/Operate layers). Create a "zero-config guided first run" in the trial experience. Reduce doc sprawl visible to new users — funnel them through exactly one path.

#### 6. Proof-of-ROI Readiness — 70/100 (Weight 5)

**Why this score:** The `PILOT_ROI_MODEL.md` is well-structured with baseline questions, measurement dimensions, and sponsor-level value stories. The measured ROI service (`TenantMeasuredRoiService`) exists in code. Value report generation exists (`PilotValueReportService`, `GenerateSponsorValueReportButton`). However, there is no *observed* ROI from a real customer. The model is theoretical. The before/after delta panel exists in UI but cannot display real deltas without real pilot data. The ROI story is credible but untested.

**Key tradeoffs:** A pre-revenue product cannot prove ROI empirically. The model exists for when pilots happen.

**Improvements:** Produce a synthetic but realistic case study using the demo seed data that shows concrete before/after metrics. Ensure the ROI report can be generated from the Contoso demo baseline.

#### 7. Executive Value Visibility — 72/100 (Weight 4)

**Why this score:** Executive-facing artifacts exist: sponsor brief, sponsor evidence pack, executive summary service, executive digest preferences, board pack controller, value report controller, executive review layouts. The "Why ArchLucid" showcase page exists. However, these are *infrastructure for* executive communication rather than *tested executive communication*. No executive has confirmed these artifacts resonate.

**Key tradeoffs:** Building executive artifacts early is strategically sound but they remain unvalidated.

**Improvements:** Test the executive sponsor brief with 3 non-technical executives and measure comprehension.

#### 8. Differentiability — 78/100 (Weight 4)

**Why this score:** ArchLucid's positioning is genuinely differentiated: it is not just another diagramming tool or architecture documentation repo. The combination of (AI agents producing architecture findings) + (governance workflows with segregation of duties) + (structured manifests with version comparison) + (customer-controlled Azure extraction without vendor access) is unique. The "never applies terraform" and "never requests Global Reader" trust commitments are strong differentiators for security-conscious buyers. The gap is that this differentiation is hard to *communicate quickly*.

**Key tradeoffs:** Depth of differentiation vs simplicity of explanation.

**Improvements:** Create a competitive positioning page that explicitly names what ArchLucid does that Backstage, Structurizr, LeanIX, etc. do not.

#### 9. Correctness (continued) — see above

#### 10. Usability — 72/100 (Weight 3)

**Why this score:** The operator UI is a Next.js 15 shell with Radix primitives, shadcn/ui patterns, keyboard shortcuts, color mode toggle, progressive disclosure (Pilot/Operate layers), a wizard for run creation, status pills, inspector panels, and accessibility testing (axe-core). The architecture is modern and well-structured. However, 511 TSX files means significant surface area for UX inconsistency. The manual QA checklist acknowledges subjective evaluation gaps. The cognitive load document (`MANUAL_QA_CHECKLIST.md` §1) explicitly calls out comprehension risks.

**Key tradeoffs:** Feature completeness vs polish. Many surfaces exist but coherent UX requires user testing.

**Improvements:** Conduct 3 task-based usability sessions with target-persona users (architects, 5-10 years experience). Identify and fix the top 5 friction points.

#### 11. Workflow Embeddedness — 76/100 (Weight 3)

**Why this score:** The product integrates with real workflows: Azure DevOps PR decoration, Jira/ServiceNow issue creation with bidirectional sync, Teams/Slack notifications, Confluence publishing, CLI for CI pipelines, integration events for custom consumers. The Azure extractor fits into existing Azure governance workflows. However, most integrations are "Shipped + manual vendor" — the live vendor validation is operator-dependent, not CI-proven end-to-end.

**Key tradeoffs:** Broad connector surface vs deep validation depth per connector.

**Improvements:** Automate at least one connector smoke test (e.g., Jira mock server) in CI to demonstrate integration contract stability without manual vendor intervention.

#### 12. Trustworthiness — 78/100 (Weight 3)

**Why this score:** Trust infrastructure is comprehensive: STRIDE threat model, SOC 2 self-assessment, CAIQ/SIG pre-fills, DPA template, penetration testing framework, Key Vault integration, private endpoints, fail-closed auth defaults, content safety guards, prompt redaction. The trust center is well-organized. However, all trust claims are self-assessed — no independent verification exists yet (appropriate per V1 scope but still a confidence limiter for buyers).

**Key tradeoffs:** Self-assessment honesty vs third-party attestation weight.

**Improvements:** Complete the owner-conducted pen test and publish the summary stub. Ensure the SOC 2 self-assessment is current with all V1 GA controls.

#### 13. Architectural Integrity — 85/100 (Weight 3)

**Why this score:** This is a standout quality. Clean project boundaries (Core → Application → Api pattern), interface-driven design, repository pattern with both SQL and in-memory implementations, proper DI composition via `ArchLucid.Host.Composition`, CQRS-light (separate read facades from write services), ADR discipline (32+ recorded decisions), event-driven optional paths, clear separation of agent runtime from business logic, and test architecture that mirrors production. The only deductions are: (1) some legacy naming survives from a rename, (2) the number of projects (30+) creates navigability challenges, (3) a few areas have parallel implementations (InMemory + SQL + Cosmos) that increase maintenance surface.

**Key tradeoffs:** Clean separation creates more projects to navigate; interface-per-service creates file count overhead.

**Improvements:** Continue the rename Phase 7 cleanup per existing checklist. Consider consolidating persistence implementations where the InMemory path is only used in tests.

#### 14. Security — 82/100 (Weight 3)

**Why this score:** Strong security posture: OWASP ZAP baseline (merge-blocking), Schemathesis API fuzzing, gitleaks secret scanning, Trivy image scanning, fail-closed auth defaults, DevelopmentBypass production guard, role-based rate limiting, content safety guards, prompt redaction, RLS, private endpoints, Key Vault references, and explicit "never request Global Reader/Owner/Contributor" commitments. CodeQL analysis is wired. The gap is the absence of an external pen test (V2 per scope — not penalized) and that some newer connector paths have not yet been security-tested as rigorously.

**Key tradeoffs:** Security-by-design is excellent; operational security validation is self-assessed.

**Improvements:** Ensure all ITSM connector paths (inbound webhooks especially) have explicit input validation and injection-resistance tests.

#### 15–46. Remaining Qualities (abbreviated justifications)

**Decision Velocity (70, w2):** The product helps architects decide faster (structured findings, recommendations, governance gates) but the decision-support UX could be more opinionated about what to do next.

**Commercial Packaging Readiness (72, w2):** Two-layer packaging (Pilot/Operate) is well-defined. Pricing philosophy exists. Order form template exists. But no live commerce and no tested packaging with real customers.

**Auditability (80, w2):** 78 typed audit events, append-only SQL store, CSV export, correlation IDs, and the audit coverage matrix tracking gaps. Strong.

**Policy and Governance Alignment (82, w2):** Pre-commit governance gate, policy packs with scope assignments, approval workflows with SoD, compliance drift tracking. Very good for V1.

**Compliance Readiness (76, w2):** Self-assessment framework covers SOC 2, CAIQ, SIG. Templates exist. No CPA attestation (deferred per scope — not penalized on headline).

**Procurement Readiness (74, w2):** DPA template, subprocessors register, trust center, order form. Missing: live commerce, signed customer references.

**Interoperability (80, w2):** OpenAPI snapshot, AsyncAPI spec, CloudEvents envelope, SCIM 2.0, integration events, TypeScript generated types. Well-covered.

**Reliability (78, w2):** Health checks (live/ready/full), circuit breakers, resilience pipelines, chaos testing framework (Simmy scheduled), hosted SaaS probe. Gap: no production SLA evidence.

**Data Consistency (76, w2):** Reconciliation service exists, DbUp migrations with versioning, data consistency runbooks. Gap: no observed production consistency under load.

**Maintainability (80, w2):** Clean code structure, established patterns, ADRs, NEXT_REFACTORINGS.md tracking known debt. Good.

**Explainability (77, w2):** Finding evidence chains, run rationale service, governance rationale, citation-bound rendering, LLM audit. The system can explain why findings were raised. Gap: explanation quality depends on LLM output quality.

**Azure Compatibility and SaaS Deployment Readiness (82, w2):** 114 Terraform files across 15+ roots, Container Apps jobs, SQL failover, Front Door, APIM, private endpoints, managed identity patterns, Key Vault integration. Strong Azure-native design.

**Stickiness (74, w1):** Tenant health scoring, operator stickiness models, digest subscriptions, next-best-action service. Infrastructure exists but no validated retention signal.

**Template and Accelerator Richness (68, w1):** Project templates (CLI `new`), integration recipe templates, bridge recipe contract tests. Could be richer with industry-specific starting points.

**Accessibility (76, w1):** WCAG 2.2 AA target, axe-core testing in CI (Vitest + live), jsx-a11y, accessibility self-attestation, dedicated accessibility page. Good baseline.

**Customer Self-Sufficiency (72, w1):** Extensive docs, troubleshooting guide, support bundle, doctor command. But doc volume itself can be overwhelming for self-service.

**Change Impact Clarity (80, w1):** Comparison view shows manifest deltas, diff rendering, drift detection on replay. Well-implemented.

**Availability (76, w1):** Health probes, Container Apps with scaling, optional multi-region Terraform (sql-failover, secondary_region). No production SLA commitment in V1.

**Performance (78, w1):** Performance baseline tests in CI, k6 load testing (smoke + soak + burst scheduled), in-process stopwatch gates for pilot path. Good for V1.

**Scalability (74, w1):** Single-tenant to database-per-tenant topology, HotPathCache auto-detection for multi-replica, Container Apps auto-scale. Redis distributed cache deferred to V2 (appropriate).

**Supportability (82, w1):** Support bundle, correlation IDs, version endpoint, doctor command, troubleshooting runbooks, pilot reporting guide. Strong.

**Manageability (80, w1):** Configuration catalog, health checks, operator atlas, extensive appsettings surface. Could benefit from configuration validation dashboard.

**Deployability (80, w1):** Docker images, compose profiles (dev, full-stack, demo), Terraform modules, CD workflows, package-release scripts. Well-covered.

**Observability (82, w1):** ArchLucidInstrumentation with histograms/counters, Application Insights Terraform, OTel collector module, Prometheus SLO rules, Grafana dashboards, agent output metrics. Strong.

**Testability (84, w1):** Multi-tier test structure (Core/Fast/Integration/Slow/Performance/E2E), property-based tests (FsCheck), mutation testing (Stryker), contract snapshot tests, golden corpus tests. Excellent infrastructure.

**Modularity (85, w1):** 30+ projects with clear boundaries, interface-driven composition, Host.Composition wiring. High.

**Extensibility (80, w1):** Agent handler registration by key, configurable agent types, policy pack framework, webhook/event extensibility, recipe templates for customer automation.

**Evolvability (78, w1):** ADR discipline, BREAKING_CHANGES tracking, V1_DEFERRED inventory, NEXT_REFACTORINGS backlog, rename checklist with staged phases.

**Documentation (80, w1):** 100+ docs, doc scope headers enforced by CI, architecture index, navigator, doc inventory scripts. Risk: volume itself creates maintenance burden.

**Azure Ecosystem Fit (84, w1):** Native Azure services throughout (Entra, Key Vault, Container Apps, Azure SQL, Front Door, Service Bus, Azure OpenAI, Application Insights, Content Safety, APIM). Deep alignment.

**Cognitive Load (64, w1):** This is a weak point. The concept model has: runs, manifests, artifacts, findings, evidence packages, authority chains, governance workflows, policy packs, approval cycles, agent types, comparison records, replay modes, and more. An architect using the tool must hold many concepts simultaneously. The Pilot/Operate split helps but doesn't fully resolve this for first-time users.

**Cost-Effectiveness (76, w1):** Pilot cost profile documented, per-tenant cost model exists, LLM budget trackers (daily + monthly), consumption budgets in Terraform, cost estimate service. Good awareness.

---

## Top 12 Most Important Weaknesses

1. **No real-customer validation loop exists.** All quality evidence is self-generated. The ROI model, usability, marketability, and correctness claims are untested against real buyer behavior.

2. **Messaging density makes the value proposition hard to grasp quickly.** The product does something genuinely valuable but explaining it takes too long. Buyers scanning tools will bounce before understanding.

3. **AI output quality is validated against fixtures, not diverse real-world inputs.** The agent evaluation infrastructure is strong but production-calibrated quality data does not exist. A degenerate brief could produce meaningless findings.

4. **Configuration surface area is large for Day-1 users.** Even the SaaS trial path requires understanding enough concepts to formulate an architecture brief. Self-hosted pilots face dozens of configuration keys.

5. **Connector breadth committed for V1 GA exceeds validation depth.** Jira, ServiceNow, Confluence, Slack, Azure DevOps all committed as "Shipped" but bidirectional sync paths are validated by mock-based tests and optional manual vendor smoke, not automated contract tests against live endpoints.

6. **The documentation volume, while individually excellent, creates information overload.** 100+ docs with cross-references make it hard for any single reader to know which docs are relevant to them and which to ignore.

7. **No production tenant has exercised the security model under real conditions.** RBAC, RLS, audit, and content safety are all architecturally sound but untested with real multi-tenant data classification and real threat actors.

8. **Cognitive load for the core workflow is higher than necessary.** The concept count (runs, manifests, findings, evidence, authority chains, governance) means new users must build a mental model before the tool becomes productive.

9. **Trial-to-paid conversion path is not live.** Commerce wiring exists (Stripe controllers, Marketplace webhook handling, production safety rules) but live keys are not flipped and no real transaction has occurred.

10. **Explainability depends on LLM output quality.** The finding evidence chains and rationale services are well-structured but the quality of explanations is bounded by the quality of agent completions, which varies.

11. **The "Operate" layer is wide but shallow in some areas.** Advisory scans, recommendation learning, and evolution/simulation are architecturally present but unclear how much real analytical depth they deliver today vs. being scaffolded for future intelligence.

12. **Single-founder concentration risk.** 4,180 source files maintained by what appears to be a solo effort means bus factor = 1. The codebase is well-structured and documented enough to onboard contributors, but today it hasn't happened.

---

## Top 6 Monetization Blockers

1. **Commerce is not live.** No Stripe live keys, no published Marketplace offer, no DNS cutover for signup. Revenue cannot occur until these are flipped (V1.1 per scope — acknowledged but still a revenue blocker).

2. **No validated buyer persona has confirmed willingness to pay.** The pricing philosophy and order form exist but no design partner or paying customer validates the price-value exchange.

3. **The value proposition requires too much explanation.** Buyers who don't immediately understand what they're buying won't schedule demos. The 30-second pitch needs work.

4. **Self-serve trial doesn't produce immediate "aha."** A buyer signing up via SaaS trial needs to formulate an architecture brief before seeing any output. The time between signup and value realization is too long for self-serve conversion.

5. **No public customer reference or case study exists.** Enterprise buyers want social proof. Even a synthetic but detailed case study showing measurable improvement would help.

6. **Packaging does not signal clear expansion path.** Pilot → Operate layering is well-designed internally but from a buyer's perspective, it's unclear what additional budget unlocks what additional value without reading extensive documentation.

---

## Top 6 Enterprise Adoption Blockers

1. **No CPA SOC 2 attestation** (explicitly deferred per scope — not penalized on headline but still creates procurement friction for enterprises with rigid questionnaire requirements).

2. **No production operational history.** Enterprise security reviewers ask "How long have you been in production? How many customers?" The answer today is zero, which is a significant trust barrier regardless of technical quality.

3. **SCIM provisioning and RLS are untested with real enterprise IdP configurations.** The code exists and passes mocked tests but no Entra External ID or workforce tenant has provisioned real users.

4. **Connector bidirectional sync is "Shipped + manual vendor."** Enterprise evaluators who require Jira↔ArchLucid status sync will want to see it working, not just read test coverage numbers.

5. **Data residency and sovereignty are not explicitly documented.** Enterprise buyers in regulated industries need to know exactly where their data lands. The Azure infrastructure supports this but the trust center doesn't have an explicit "data residency" section.

6. **No SLA commitment.** RTO/RPO targets are documented internally but no contractual SLA is published for customers. Enterprise procurement often requires explicit uptime guarantees.

---

## Top 6 Engineering Risks

1. **LLM output degeneration under adversarial or degenerate inputs.** The quality gate can reject bad outputs but cannot guarantee meaningful outputs. A customer with a vague or nonsensical brief could get structurally valid but semantically useless findings.

2. **DbUp migration ordering bugs in production.** Greenfield SQL boot tests exist but a live production database with 50 migrations, tenant data, and concurrent access has never been tested. Migration `050` referencing a column from `038` under load is an unexercised path.

3. **Connector inbound webhook security.** Jira and ServiceNow inbound webhooks (`ItsmInboundWebhooksController`) accept status sync payloads from external systems. Input validation depth and replay/forgery resistance are critical and tested by mock, not adversarially.

4. **Staged critic orchestration failure modes.** When phase-1 agents fail partially and phase-2 (critic) runs against incomplete evidence, the system behavior is defined but edge cases with concurrent cancellation + partial persist + budget exceeded are complex.

5. **Multi-tenant data isolation under SQL topology modes.** The system supports single-database, database-per-tenant, and control-plane routing. Misconfiguration between these modes (especially runtime switching or migration from one to another) could lead to cross-tenant data exposure.

6. **Single-person operational knowledge.** If the sole operator/developer is unavailable, incident response depends entirely on documentation quality. The support bundle and runbooks exist but have never been used by anyone else.

---

## Most Important Truth

**ArchLucid is a technically impressive, architecturally sound platform that has solved the engineering problems of building an AI-assisted architecture workflow system — but has not yet solved the commercial problem of proving that real buyers will pay for it and derive measurable value from it.** The gap between "built correctly" and "proven valuable" is the dominant risk, and closing it requires real customers, not more engineering.

---

## Top Improvement Opportunities

### 1. Create a 30-Second Value Proposition and Landing Experience

**Why it matters:** The single highest-leverage commercial action. If buyers can't understand what ArchLucid does in 30 seconds, nothing else matters.

**Expected impact:** Directly improves Marketability (+10-15 pts), Adoption Friction (+5-8 pts), Time-to-Value (+5-8 pts). Weighted readiness impact: +1.5-2.5%.

**Affected qualities:** Marketability, Adoption Friction, Time-to-Value, Executive Value Visibility

**Status:** Actionable now

**Cursor Prompt:**
```
Create a new file `archlucid-ui/src/app/(marketing)/page-hero-value-prop.tsx` that renders a hero section for the marketing landing page with:

1. A single headline (max 12 words) that communicates the core value: turning architecture requests into reviewable, defensible outputs faster
2. A subheadline (max 25 words) that names the buyer persona and their pain
3. A 3-panel visual showing: Brief → AI Analysis → Reviewable Package (use Lucide icons and simple illustrations)
4. A single CTA button "See it work in 60 seconds" linking to /showcase

Reference the existing `archlucid-ui/src/app/(marketing)` layout patterns and shadcn/ui components already in use. Do NOT change any existing page.tsx files — this is a new component to be composed into the landing page later.

The headline must NOT use the words "AI-assisted", "workflow", "system", or "platform". Use outcome language only.

Acceptance criteria:
- Component renders without errors
- Passes existing lint and typecheck
- Uses existing design system tokens (not hardcoded colors)
- Responsive (works at 320px and 1440px)
- No new dependencies

Constraints:
- Do not modify existing pages or components
- Do not add new npm dependencies
- Follow existing component patterns in the marketing folder
```

---

### 2. Build a Real LLM Evaluation Corpus with Diverse Architecture Briefs

**Why it matters:** Without evidence that agent outputs are correct and useful across diverse inputs, the core product claim is unvalidated.

**Expected impact:** Directly improves Correctness (+8-12 pts), AI/Agent Readiness (+8-10 pts), Trustworthiness (+3-5 pts). Weighted readiness impact: +1.5-2.0%.

**Affected qualities:** Correctness, AI/Agent Readiness, Trustworthiness, Proof-of-ROI Readiness

**Status:** Actionable now

**Cursor Prompt:**
```
Create a new evaluation corpus directory at `tests/eval-datasets/diverse-briefs/` with 10 architecture brief markdown files spanning different scenarios:

1. `brief-01-simple-crud-api.md` — Small team building a REST API with SQL backend
2. `brief-02-microservices-migration.md` — Enterprise monolith decomposition
3. `brief-03-event-driven-iot.md` — IoT platform with event streaming
4. `brief-04-data-pipeline-analytics.md` — Data warehouse with ETL
5. `brief-05-multi-region-saas.md` — SaaS with multi-region requirements
6. `brief-06-legacy-modernization.md` — Mainframe-to-cloud lift
7. `brief-07-mobile-backend.md` — Mobile app backend with offline sync
8. `brief-08-ml-platform.md` — ML training and inference platform
9. `brief-09-compliance-heavy-fintech.md` — PCI-DSS regulated payment system
10. `brief-10-minimal-startup-mvp.md` — Startup MVP with tight budget constraints

Each brief must:
- Be 150-400 words
- Include: system name, environment (prod/staging/dev), cloud provider, at least 2 constraints, and a clear ask
- Represent a realistic scenario an architect would actually encounter
- Cover different Azure service combinations

Also create `tests/eval-datasets/diverse-briefs/README.md` documenting the corpus purpose and how to run evaluation against it.

Also create `tests/eval-datasets/diverse-briefs/expected-categories.json` mapping each brief to the expected finding categories (e.g., brief-01 should produce topology + cost findings; brief-09 should produce heavy compliance findings).

Do NOT modify any existing files. Do NOT add test runner infrastructure yet — just the corpus.

Acceptance criteria:
- 10 briefs created with realistic, varied content
- README explains the evaluation methodology
- expected-categories.json provides scoring rubric
- Each brief validates against the existing ArchitectureRequest brief constraints (>10 chars, meaningful content)
```

---

### 3. Reduce Cognitive Load with an In-Product Glossary and Concept Progressions

**Why it matters:** Cognitive load (64/100) is the lowest-scoring quality and directly impacts adoption, usability, and time-to-value.

**Expected impact:** Directly improves Cognitive Load (+10-15 pts), Adoption Friction (+5-8 pts), Usability (+3-5 pts), Time-to-Value (+3-5 pts). Weighted readiness impact: +0.5-1.0%.

**Affected qualities:** Cognitive Load, Adoption Friction, Usability, Time-to-Value

**Status:** Actionable now

**Cursor Prompt:**
```
Extend the existing `archlucid-ui/src/components/GlossaryTerm.tsx` component to support a comprehensive in-product glossary system:

1. Create `archlucid-ui/src/lib/glossary-definitions.ts` with a typed record mapping term IDs to definitions. Include at minimum these terms with short (max 20 words) and long (max 60 words) definitions:
   - run
   - manifest (golden manifest)
   - finding
   - artifact
   - evidence package
   - authority chain
   - governance gate
   - policy pack
   - comparison
   - replay

2. Update `GlossaryTerm.tsx` to:
   - Accept a `termId` prop that looks up from the definitions file
   - Show the short definition in a Radix tooltip on hover
   - Support a "Learn more" link that expands to the long definition
   - Style consistently with existing tooltip patterns in the codebase

3. Create a test file `archlucid-ui/src/components/GlossaryTerm.test.tsx` that verifies:
   - All glossary IDs resolve to definitions
   - Tooltip renders on hover
   - Accessibility: tooltip content is announced to screen readers

Do NOT change any existing page files to add GlossaryTerm usage yet — that is a separate step.
Do NOT add new npm dependencies.
Follow existing test patterns (Vitest + testing-library).

Acceptance criteria:
- All 10 core terms defined with short and long versions
- GlossaryTerm component renders correctly with tooltip
- Tests pass
- Lint clean
- No new dependencies
```

---

### 4. Create a Pre-Loaded Demo Run in the Trial Experience

**Why it matters:** Self-serve trial conversion requires immediate value visibility. A pre-loaded run eliminates the "blank page" problem.

**Expected impact:** Directly improves Time-to-Value (+8-12 pts), Adoption Friction (+5-8 pts), Marketability (+3-5 pts). Weighted readiness impact: +1.0-1.5%.

**Affected qualities:** Time-to-Value, Adoption Friction, Marketability, Proof-of-ROI Readiness

**Status:** Actionable now

**Cursor Prompt:**
```
In `ArchLucid.Application/Bootstrap/DemoSeedService.cs`, add a new method `SeedTrialWelcomeRunAsync` that:

1. Creates a single completed run with:
   - System name: "Contoso Online Store" 
   - Brief: a realistic 200-word architecture brief for a typical e-commerce platform migrating to Azure
   - All agent results pre-populated (topology, cost, compliance)
   - A committed manifest with 3-5 meaningful findings
   - At least one artifact (analysis report)

2. This method should be callable from an existing or new endpoint that the trial bootstrap path can invoke.

3. The run should be marked with a metadata flag `IsDemoWelcomeRun = true` so the UI can identify and style it differently (e.g., "Sample run — see what ArchLucid produces").

Look at the existing `DemoSeedService.cs` patterns for how runs are seeded. Follow the same patterns (use `IArchitectureApplicationService`, existing repositories).

Do NOT modify the production startup path. This should only run when explicitly invoked (e.g., by `TrialTenantBootstrapService` or a demo endpoint).

Acceptance criteria:
- Method creates a valid, complete run with committed manifest
- Run has realistic findings (not placeholder text)
- Existing tests still pass
- Method is idempotent (safe to call multiple times)
- No new external dependencies

Constraints:
- Follow existing DemoSeedService patterns exactly
- Do not modify Program.cs or startup registration
- Do not add new NuGet packages
```

---

### 5. Automate One Connector Integration Test in CI

**Why it matters:** The gap between "Shipped + manual vendor" and "CI-validated" undermines trust claims about connector reliability.

**Expected impact:** Directly improves Workflow Embeddedness (+5-8 pts), Reliability (+3-5 pts), Trustworthiness (+2-3 pts). Weighted readiness impact: +0.4-0.7%.

**Affected qualities:** Workflow Embeddedness, Reliability, Trustworthiness, Correctness

**Status:** Actionable now

**Cursor Prompt:**
```
Create a new integration test class `ArchLucid.Application.Tests/Integrations/Itsm/Outbound/JiraOutboundMockServerIntegrationTests.cs` that:

1. Spins up a minimal HTTP mock server (use `Microsoft.AspNetCore.TestHost` or similar in-process approach) that mimics the Jira REST API v3 issue creation endpoint (`POST /rest/api/3/issue`)

2. Configures `ItsmOutboundIssueCreationService` to point at the mock server

3. Tests the following scenarios:
   - Successful issue creation returns a valid Jira issue key and persists correlation
   - 401 response from Jira is handled gracefully (audit event emitted, no crash)
   - 429 rate-limit response triggers appropriate retry/backoff behavior
   - Network timeout is handled without hanging the test

4. Verify that `Integration.JiraIssueCreateSucceeded` and `Integration.JiraIssueCreateFailed` audit events are emitted correctly

Add `[Trait("Suite", "Core")]` and `[Trait("Category", "Integration")]` to the test class.

Follow existing test patterns in `ArchLucid.Application.Tests/Integrations/Itsm/` — look at `ItsmOutboundJiraVendorHttpConformanceTests.cs` for the existing approach and extend it with the mock server pattern.

Do NOT modify any production source files.
Do NOT add new NuGet packages unless absolutely required (prefer existing test infrastructure).

Acceptance criteria:
- All 4 test scenarios pass
- Tests run in CI without external network access
- Mock server starts and stops cleanly per test
- Audit events are verified
- No flaky timing issues (use deterministic waits)
```

---

### 6. Add Data Residency Section to Trust Center

**Why it matters:** Enterprise buyers in regulated industries need explicit data residency documentation. Its absence creates procurement friction.

**Expected impact:** Directly improves Procurement Readiness (+5-8 pts), Compliance Readiness (+3-5 pts), Trustworthiness (+2-3 pts). Weighted readiness impact: +0.3-0.5%.

**Affected qualities:** Procurement Readiness, Compliance Readiness, Trustworthiness, Enterprise adoption

**Status:** Actionable now

**Cursor Prompt:**
```
Add a new section to `docs/go-to-market/TRUST_CENTER.md` titled "## Data residency and sovereignty" positioned after the "Azure connectivity (extractor posture)" section and before "Penetration testing and security assessments".

The section must include:

1. A statement that ArchLucid SaaS is deployed to a single Azure region (specify that the region is configurable per deployment but the current default is documented in infra Terraform variables)

2. A table listing data types and where they reside:
   - Architecture run data → Azure SQL in deployment region
   - Agent execution traces → Azure SQL in deployment region  
   - Audit events → Azure SQL in deployment region
   - Uploaded Azure extractor packages → Azure Blob Storage in deployment region
   - LLM completions → Processed by Azure OpenAI in configured region (no data stored by Azure OpenAI per Microsoft DPA)
   - Tenant configuration → Azure SQL in deployment region + Azure Key Vault in deployment region

3. A statement that ArchLucid does NOT replicate customer data outside the configured Azure region unless the operator explicitly enables geo-redundancy (SQL failover to a secondary region)

4. A note that customers requiring specific Azure region placement should confirm region availability with their account contact

5. A reference to the DPA template for contractual data processing commitments

Keep the same formatting style as the rest of the trust center. Include the `> **Scope:**` header line per workspace rules only if this were a standalone file (it's a section addition, so skip that).

Do NOT modify any other files.
Do NOT remove existing content.

Acceptance criteria:
- Section is accurately placed in document flow
- All data types are covered
- No claims that cannot be validated against the Terraform configuration
- Consistent formatting with rest of document
```

---

### 7. DEFERRED — Produce a Real Customer Case Study or Pilot Report

**Title:** DEFERRED — Produce a validated customer case study with before/after metrics

**Reason deferred:** Requires a real customer or design partner engagement that has not yet occurred. Cannot be synthesized credibly without actual pilot data.

**Specific information needed:** Access to at least one real pilot engagement (customer name, their architecture workflow, measured before/after metrics for time-to-manifest, effort reduction, and governance evidence quality).

---

### 8. Implement Quick-Start Configuration Validation

**Why it matters:** Reduces adoption friction by catching misconfiguration immediately rather than at first API call failure.

**Expected impact:** Directly improves Adoption Friction (+5-8 pts), Time-to-Value (+3-5 pts), Supportability (+2-3 pts). Weighted readiness impact: +0.5-0.8%.

**Affected qualities:** Adoption Friction, Time-to-Value, Supportability, Usability

**Status:** Actionable now

**Cursor Prompt:**
```
Extend the existing `ArchLucid.Cli` `doctor` command to include a "quick-start readiness" check that validates:

1. Connection string is set and reachable (existing behavior — confirm it works)
2. Auth mode is configured and valid for the current environment
3. If StorageProvider=Sql, database exists and schema version is current
4. If AgentExecution:Mode is not Simulator, Azure OpenAI endpoint is reachable
5. Minimum required configuration keys are present (reference ConfigurationKeyCatalog.cs for the list)

Output should be a clear pass/fail table with remediation hints for each failed check, similar to:

```
✓ Connection string    — reachable (ArchLucid, 50 migrations)
✓ Auth mode            — DevelopmentBypass (valid for Development)  
✗ OpenAI endpoint      — not configured (set AzureOpenAI:Endpoint for real agent mode)
✓ Storage provider     — Sql (schema current)
```

Look at the existing `doctor` command implementation in `ArchLucid.Cli/` and the health check implementations in `ArchLucid.Api/` for patterns.

Do NOT change the existing `doctor` command behavior — extend it with an additional check section.
Do NOT add new NuGet packages.

Acceptance criteria:
- `archlucid doctor` prints the extended readiness table
- Each check has a clear pass/fail indicator
- Failed checks include actionable remediation text
- Existing doctor tests still pass
- New checks have unit tests
```

---

### 9. Create a Competitive Positioning Document

**Why it matters:** Differentiability (78/100) is strong but invisible to buyers who can't find a comparison. Sales conversations and evaluators need a reference.

**Expected impact:** Directly improves Differentiability (+5-8 pts), Marketability (+3-5 pts), Executive Value Visibility (+2-3 pts). Weighted readiness impact: +0.4-0.7%.

**Affected qualities:** Differentiability, Marketability, Executive Value Visibility

**Status:** Actionable now

**Cursor Prompt:**
```
Create `docs/go-to-market/COMPETITIVE_POSITIONING.md` with:

1. A scope header: `> **Scope:** Competitive positioning for internal sales enablement and evaluator conversations — not for public publication without review.`

2. A positioning statement (3-4 sentences) articulating what ArchLucid does that existing tools cannot

3. A comparison table with these columns: Capability | ArchLucid | Backstage (Spotify) | LeanIX | Structurizr | Manual (Confluence + JIRA)
   
   Rows should include:
   - AI-generated architecture findings from brief
   - Structured governance workflow with SoD
   - Golden manifest with version comparison
   - Customer-controlled Azure cost/config extraction (no vendor access)
   - Advisory-only Terraform emit (never applies)
   - Bidirectional ITSM sync (Jira/ServiceNow)
   - Append-only audit trail with typed events
   - Compliance drift tracking

4. A "When ArchLucid is NOT the right tool" section (honesty builds trust) — e.g., if they just need a wiki, if they need real-time infrastructure monitoring, if they need a CMDB

5. A "Proof points" section referencing the trust center, demo, and pilot evidence artifacts

Do NOT reference competitor pricing or make claims that cannot be verified.
Do NOT use marketing superlatives ("best", "revolutionary", "groundbreaking").
Keep tone factual and specific.

Acceptance criteria:
- Document follows docs/go-to-market/ conventions
- Comparison table is accurate and verifiable
- "When NOT" section is honest
- No unverifiable claims about competitors
- Scope header present
```

---

### 10. Add Inbound Webhook Input Validation Hardening

**Why it matters:** ITSM inbound webhooks are an attack surface. Enterprise security reviewers will ask about input validation for external-origin payloads.

**Expected impact:** Directly improves Security (+3-5 pts), Correctness (+2-3 pts), Trustworthiness (+2-3 pts). Weighted readiness impact: +0.3-0.5%.

**Affected qualities:** Security, Correctness, Trustworthiness, Reliability

**Status:** Actionable now

**Cursor Prompt:**
```
In `ArchLucid.Application/Integrations/Itsm/ItsmInboundWebhookSyncService.cs`, add explicit input validation for inbound webhook payloads:

1. Validate that the `issueKey` (or `incident sys_id`) matches the expected format:
   - Jira: regex `^[A-Z][A-Z0-9_]+-\d+$` (project key + number)
   - ServiceNow: regex `^[a-f0-9]{32}$` (sys_id format)

2. Validate that the `status` value is within the configured mapping keys (reject unknown statuses with a warning log + audit event rather than silently ignoring)

3. Validate payload size (reject payloads > 64KB for webhook bodies — reasonable upper bound for a status sync)

4. Add a `[MaxLength]` or explicit length check on any string field that will be persisted to SQL (prevent oversized strings from causing SQL truncation)   

5. Ensure that `findingId` from the correlation table is validated (exists in the current tenant's findings) before updating finding state

Look at the existing `ItsmInboundWebhookSyncService.cs` and `ItsmInboundWebhooksController.cs` for current patterns.

Add corresponding tests in `ArchLucid.Application.Tests/Integrations/Itsm/ItsmInboundWebhookSyncServiceTests.cs`:
- Invalid Jira issue key format → rejected with specific error
- Invalid ServiceNow sys_id format → rejected
- Unknown status → warning logged, no state change
- Oversized payload → rejected
- Non-existent findingId → rejected with correlation audit

Do NOT change the happy-path behavior.
Do NOT modify controller routing or auth.

Acceptance criteria:
- All 5 validation rules implemented
- All 5 negative test cases pass
- Happy path still works unchanged
- Audit events emitted for rejected payloads
- No new NuGet dependencies
```

---

### 11. DEFERRED — Flip Commerce Live (Stripe + Marketplace)

**Title:** DEFERRED — Enable live Stripe keys and publish Azure Marketplace SaaS offer

**Reason deferred:** Requires Azure Partner Center seller verification, tax profile, payout account, and explicit owner decision to flip from test to production commerce. These are organizational/legal steps that cannot be performed by an engineering assistant.

**Specific information needed:** Confirmation that Partner Center seller verification is complete, tax profile submitted, payout account configured, and explicit go-ahead to flip `BillingProductionSafetyRules` from test to live mode.

---

### 12. DEFERRED — Conduct Usability Testing with Target Persona Users

**Title:** DEFERRED — Run 3-5 task-based usability sessions with practicing architects

**Reason deferred:** Requires access to real architects (5-10 years experience, enterprise context) willing to spend 45-60 minutes on a moderated usability session. Cannot be synthesized from code alone.

**Specific information needed:** Access to 3-5 target-persona participants (enterprise architects or technical leads), scheduling availability, and any constraints on compensation/NDA.

---

## Pending Questions for Later

**Improvement 2 (Evaluation Corpus):**
- What Azure OpenAI deployment and model should be used for corpus evaluation runs? (GPT-4o? GPT-4o-mini for cost?)
- Should evaluation runs be committed to the repo as golden baselines or treated as ephemeral CI artifacts?

**Improvement 4 (Trial Welcome Run):**
- Should the trial welcome run use a specific Azure region/service set for the demo brief, or be generic enough to apply anywhere?
- Is there a preferred industry vertical for the sample (e-commerce shown in demo seed currently)?

**Improvement 7 (DEFERRED — Case Study):**
- Is there a prospect or design-partner candidate in active conversation who might serve as the first case study?
- What level of detail can be disclosed publicly vs. under NDA?

**Improvement 8 (Doctor Command Extension):**
- Should `doctor --quick-start` be a separate subcommand or integrated into the existing `doctor` output?
- Are there configuration keys that should be explicitly excluded from validation (e.g., optional features)?

**General:**
- What is the expected timeline for the first real pilot engagement?
- Is there a budget/decision for the external pen test (V2) that would allow planning the SoW template usage?
