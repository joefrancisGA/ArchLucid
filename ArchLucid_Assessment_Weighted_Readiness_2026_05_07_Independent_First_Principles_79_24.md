# ArchLucid Assessment – Weighted Readiness 79.24%

## 2. Executive Summary

### Overall readiness

ArchLucid is a real, unusually well-instrumented V1 architecture-review product, not just a concept repo. The weighted readiness score is **79.24%** across the requested 102 total weight points. The strongest evidence is the V1 scope contract, Core Pilot path, SQL-first persistence, API contract discipline, audit model, UI journey coverage, k6 smoke coverage, Terraform footprint, and trust/procurement materials. The main reason the score does not move into the mid/high 80s is that the riskiest part of the promise, real-mode AI output quality in buyer-relevant conditions, is still governed more by metrics, optional evidence, and operator posture than by hard release enforcement.

### Commercial picture

The commercial story is coherent: "Architecture Proof Engine" is a differentiated category, the Core Pilot motion is clear, pricing exists, first-value reports exist, and the buyer narrative is much sharper than average. The commercial weakness is proof. The product can show speed, artifacts, audit rows, and evidence chains, but the most persuasive buyer claims still depend on tenant baselines, sponsor interpretation, and sales-led packaging. Live commerce un-hold, published reference customers, and design-partner closure are explicitly deferred and are not scored as current readiness defects.

### Enterprise picture

Enterprise posture is better than the raw stage of the company would suggest. There is a Trust Center, procurement pack index, DPA/subprocessor material, CAIQ/SIG pre-fill, audit coverage matrix, SCIM, Entra/JWT posture, tenant isolation story, private endpoint bias, and a candid SOC 2 roadmap. I did not reduce the headline score for missing CPA SOC 2, ISO certification, a public third-party pen-test report, PGP publication, or design partner status because the scope materials explicitly place those outside the current scored boundary. The enterprise concern is practical buyer friction: some procurement teams will still slow or reject the purchase until third-party attestations or customer references exist.

### Engineering picture

Engineering quality is the strongest dimension overall. The solution has layered projects, architecture boundary tests, SQL/Dapper persistence, DbUp migrations, OpenAPI snapshots, live UI E2E, k6 gates, security scans, observability, and substantial audit/data-consistency work. The biggest engineering risks are real LLM correctness boundaries, warn-only quality gates, a few intentionally pending or partial surfaces, operational telemetry export verification, and the cognitive load created by a large product surface around a simple first-pilot motion.

## 3. Weighted Quality Assessment

Weighted readiness calculation: total weight = **102**. Weighted contribution is `score * weight / 102`. Weighted deficiency signal is `weight * (100 - score)`, used for urgency ordering.

### 1. Marketability

- **Score:** 77
- **Weight:** 8
- **Weighted impact on readiness:** 6.04 percentage points
- **Weighted deficiency signal:** 184
- **Justification:** The category narrative is credible and buyer-facing: architecture request to evidence-linked review package, not generic AI. The positioning, datasheet, sponsor brief, `/why` proof material, and pilot story are strong. The weakness is that market trust still relies on self-asserted proof, staged/demo artifacts, and sales explanation rather than enough external validation.
- **Tradeoffs:** The product wisely narrows the first sale to Core Pilot value, but the repo also exposes a broad Operate surface that can dilute the buyer's first impression.
- **Improvement recommendations:** Tighten the public proof path around one live buyer-safe sample, make "what you get in 30 minutes" obvious, and keep advanced governance language behind the first-value story.
- **Disposition:** Fixable in V1 through messaging, UI routing, and proof-pack hardening; external references are V1.1/informational.

### 2. Adoption Friction

- **Score:** 74
- **Weight:** 6
- **Weighted impact on readiness:** 4.35 percentage points
- **Weighted deficiency signal:** 156
- **Justification:** The Core Pilot path is well defined, but the product remains cognitively large. Buyers see runs, manifests, artifacts, graph, compare, replay, governance, alerts, policy packs, Ask, advisory, integrations, trust, and pricing. The docs explicitly warn against making Operate a Day-1 requirement, which is good evidence that the risk is understood.
- **Tradeoffs:** Breadth is valuable for expansion, but it increases first-session confusion unless the UI and docs keep the first proof path extremely narrow.
- **Improvement recommendations:** Make the default UI and first-run route aggressively four-step only: create review, execute, finalize, review package. Hide or defer anything not needed for that outcome.
- **Disposition:** Fixable in V1.

### 3. Time-to-Value

- **Score:** 82
- **Weight:** 7
- **Weighted impact on readiness:** 5.63 percentage points
- **Weighted deficiency signal:** 126
- **Justification:** The solution has a strong Core Pilot path, deterministic simulator mode, sample review package, first-value report, sponsor PDF, CLI support, and scripted smoke checks. The remaining gap is proving this path with real customer input and live-model quality without needing founder narration.
- **Tradeoffs:** Simulator mode accelerates demos and CI, but buyers ultimately care whether real-mode results are trustworthy on their own material.
- **Improvement recommendations:** Add a "first value complete" product gate that evaluates whether a tenant has a committed non-demo review, first-value report, evidence chain, sponsor PDF, and no buyer-safe blockers.
- **Disposition:** Fixable in V1.

### 4. Proof-of-ROI Readiness

- **Score:** 75
- **Weight:** 5
- **Weighted impact on readiness:** 3.68 percentage points
- **Weighted deficiency signal:** 125
- **Justification:** The ROI model is honest and useful. The product computes time to committed manifest, findings, LLM calls, audit rows, evidence-chain pointers, and first-value reports. But the most persuasive claims, manual prep reduction and review-cycle improvement, still depend on tenant-supplied baselines or operator judgment.
- **Tradeoffs:** The current approach avoids fake ROI precision, but it leaves sales without a strong quantified story when baseline fields are empty.
- **Improvement recommendations:** Treat baseline capture as a product workflow, not a doc afterthought. Make missing baseline evidence visible and route operators to collect it before sponsor sharing.
- **Disposition:** Fixable in V1.

### 5. Correctness

- **Score:** 77
- **Weight:** 4
- **Weighted impact on readiness:** 3.02 percentage points
- **Weighted deficiency signal:** 92
- **Justification:** Correctness has strong non-LLM coverage: unit tests, integration tests, SQL tests, OpenAPI snapshots, architecture tests, property tests, data-consistency probes, and live UI journeys. The main correctness risk is the AI boundary: real-mode quality gates are available, but default enforcement is warn-only and real-mode corpus evidence is optional/skipped unless explicitly supplied.
- **Tradeoffs:** Warn-only quality gates protect pilot continuity but allow weak model output to reach users unless operators enforce higher floors.
- **Improvement recommendations:** Create a release-grade real-mode evidence lane with explicit pass/fail criteria and a documented owner decision for enforcement behavior.
- **Disposition:** Partly fixable in V1; hard fail behavior is blocked on product input.

### 6. Executive Value Visibility

- **Score:** 80
- **Weight:** 4
- **Weighted impact on readiness:** 3.14 percentage points
- **Weighted deficiency signal:** 80
- **Justification:** Sponsor brief, first-value Markdown/PDF, value-report DOCX, pilot scorecard, and sponsor banner are strong. The weakness is that executive value can still become abstract if real tenant baselines are missing or demo banners are not respected.
- **Tradeoffs:** Conservative claims protect credibility, but executives need an obvious "why budget this now" page.
- **Improvement recommendations:** Strengthen the sponsor package readiness checklist and block sendable classification when required proof fields are missing.
- **Disposition:** Fixable in V1.

### 7. Differentiability

- **Score:** 81
- **Weight:** 4
- **Weighted impact on readiness:** 3.18 percentage points
- **Weighted deficiency signal:** 76
- **Justification:** The combination of AI findings, evidence traces, governance, audit, run manifests, comparison/replay, and Azure-first deployment is differentiated. The risk is that differentiation can sound like a feature inventory unless the product proves "evidence-linked decision package" faster than incumbents and ad-hoc AI.
- **Tradeoffs:** Broad proof surface helps defensibility; concise buyer framing helps conversion.
- **Improvement recommendations:** Collapse public messaging around three claims only: faster review package, evidence-linked findings, governed decision trail.
- **Disposition:** Fixable in V1.

### 8. Workflow Embeddedness

- **Score:** 75
- **Weight:** 3
- **Weighted impact on readiness:** 2.21 percentage points
- **Weighted deficiency signal:** 75
- **Justification:** REST, CLI, webhooks, Service Bus, SCIM, Teams, Slack, Confluence, Jira, ServiceNow, Azure DevOps, and recipes create a serious workflow story. The risk is uneven buyer confidence because some first-party connectors are recent/committed surfaces and still need clear smoke evidence by connector.
- **Tradeoffs:** Shipping thin, authority-shaped integrations is better than overbuilding store listings, but enterprises need proof each integration works in their workflow.
- **Improvement recommendations:** Add a connector readiness matrix that distinguishes implemented, smoke-tested, vendor-conformance-tested, and tenant-enabled states.
- **Disposition:** Fixable in V1.

### 9. Usability

- **Score:** 77
- **Weight:** 3
- **Weighted impact on readiness:** 2.26 percentage points
- **Weighted deficiency signal:** 69
- **Justification:** The UI has progressive disclosure, route guidance, wizard flows, samples, buyer-safe labels, and substantial UI test coverage. The main usability issue is terminology and surface area: "architecture review" versus "run", manifest, authority, Operate, governance, replay, and graph all appear around a simple buyer job.
- **Tradeoffs:** Technical names help operators and support; buyer names reduce friction.
- **Improvement recommendations:** Continue translating internal nouns into buyer nouns at the UI edge and sanitize error/support copy that leaks internal pipeline terms.
- **Disposition:** Fixable in V1.

### 10. Trustworthiness

- **Score:** 78
- **Weight:** 3
- **Weighted impact on readiness:** 2.29 percentage points
- **Weighted deficiency signal:** 66
- **Justification:** The trust model is much stronger than typical early SaaS: audit trails, explanation traces, citation discipline, security docs, data isolation, procurement pack, self-assessment, and scope honesty. The score is held below the 80s because real-model reliability and external assurance remain operationally weaker than the trust narrative.
- **Tradeoffs:** Honest self-attestation is preferable to false assurance, but some buyers will still want third-party proof.
- **Improvement recommendations:** Make every generated recommendation visibly show evidence, confidence, limits, and quality-gate status.
- **Disposition:** Fixable in V1 for product trust; formal third-party assurance is out-of-scope/informational.

### 11. Decision Velocity

- **Score:** 72
- **Weight:** 2
- **Weighted impact on readiness:** 1.41 percentage points
- **Weighted deficiency signal:** 56
- **Justification:** Pricing, order form, quote request, pilot pricing, procurement pack, and sponsor email kit exist. The weakness is that self-serve live checkout is intentionally not the V1 gate, and sales-led conversion still depends on human follow-up and buyer confidence.
- **Tradeoffs:** Sales-led motion is realistic for enterprise V1, but it slows small-team conversion.
- **Improvement recommendations:** Improve quote-request follow-up artifacts, buyer-safe proof package, and sales-led "next step" clarity while live commerce remains deferred.
- **Disposition:** Fixable in V1; live marketplace/Stripe un-hold is V1.1/owner-only.

### 12. Architectural Integrity

- **Score:** 83
- **Weight:** 3
- **Weighted impact on readiness:** 2.44 percentage points
- **Weighted deficiency signal:** 51
- **Justification:** The solution has a coherent API/Application/Domain/Persistence/Host/UI split and explicit architecture boundary tests. ADRs and scope docs are strong. Some complexity remains around persistence consolidation, legacy naming bridges, broad feature seams, and the AgentRuntime/Application explanation adapter exception.
- **Tradeoffs:** Consolidating persistence reduced assembly sprawl but increases need for intra-assembly discipline.
- **Improvement recommendations:** Continue reducing overlapping connection abstractions and enforce module boundaries inside consolidated persistence.
- **Disposition:** Fixable in V1/V1.1 refactoring.

### 13. Commercial Packaging Readiness

- **Score:** 75
- **Weight:** 2
- **Weighted impact on readiness:** 1.47 percentage points
- **Weighted deficiency signal:** 50
- **Justification:** Tier names, pricing, trial limits, quote path, Stripe/Marketplace wiring, and trial funnel tests are present. But the public checkout URL is intentionally placeholder/sales-led and commerce un-hold is deferred.
- **Tradeoffs:** Avoiding accidental live billing is the right production-safety choice; it creates conversion friction.
- **Improvement recommendations:** Make sales-led state unmistakable and ensure every placeholder is hidden or buyer-safe.
- **Disposition:** V1 can improve clarity; live un-hold is V1.1/owner-only.

### 14. AI/Agent Readiness

- **Score:** 75
- **Weight:** 2
- **Weighted impact on readiness:** 1.47 percentage points
- **Weighted deficiency signal:** 50
- **Justification:** There is simulator mode, real Azure OpenAI path, fallback client, trace persistence, output scoring, quality gates, eval corpus, and agent metrics. The readiness gap is enforcement: real-mode evidence can be skipped, quality rejection does not block by default, and model correctness remains the riskiest buyer-facing behavior.
- **Tradeoffs:** Simulator-first testing gives determinism and low cost; real-mode evidence is harder, slower, and costs money.
- **Improvement recommendations:** Separate simulator correctness, real-mode smoke evidence, and release-blocking evidence into three explicit lanes.
- **Disposition:** Partly fixable now; enforcement policy blocked on user/product decision.

### 15. Security

- **Score:** 84
- **Weight:** 3
- **Weighted impact on readiness:** 2.47 percentage points
- **Weighted deficiency signal:** 48
- **Justification:** Entra/JWT, API key mode, fail-closed auth defaults, RBAC, rate limiting, CORS denial by default, ZAP/Schemathesis/Gitleaks/Trivy/CodeQL, prompt redaction, Key Vault references, private endpoints, and no public SMB posture are strong. Remaining gaps are mostly assurance evidence and operational hardening rather than obvious design defects.
- **Tradeoffs:** Owner-conducted testing and self-assessment are valid for current scope but weaker than external validation for some buyers.
- **Improvement recommendations:** Complete owner pen-test tracker and keep security findings linked to PRs and retests.
- **Disposition:** Fixable in V1 for owner-led assurance; external third-party testing is V2/informational.

### 16. Maintainability

- **Score:** 76
- **Weight:** 2
- **Weighted impact on readiness:** 1.49 percentage points
- **Weighted deficiency signal:** 48
- **Justification:** Modularity, tests, docs, and boundary checks are strong, but the codebase is large and still carries active refactoring items: persistence unification, connection factory alignment, magic number cleanup, error sanitization, and configuration boilerplate.
- **Tradeoffs:** Shipping broad product capability quickly created real surface area; aggressive reuse and consolidation now matter.
- **Improvement recommendations:** Finish the highest-value consolidation items before adding net-new surfaces.
- **Disposition:** Fixable in V1/V1.1.

### 17. Interoperability

- **Score:** 78
- **Weight:** 2
- **Weighted impact on readiness:** 1.53 percentage points
- **Weighted deficiency signal:** 44
- **Justification:** OpenAPI, AsyncAPI, .NET client, CLI, CloudEvents, Service Bus, SCIM, and first-party connector code exist. The weakness is that not every ecosystem path has the same maturity or published smoke evidence.
- **Tradeoffs:** REST/CLI/webhooks give universal coverage; first-party connectors reduce adoption friction but increase maintenance burden.
- **Improvement recommendations:** Publish connector-specific smoke status and contract tests in one machine-readable index.
- **Disposition:** Fixable in V1.

### 18. Reliability

- **Score:** 78
- **Weight:** 2
- **Weighted impact on readiness:** 1.53 percentage points
- **Weighted deficiency signal:** 44
- **Justification:** Health checks, readiness, rollback runbook, startup validation, data consistency probes, outbox patterns, circuit breakers, retry discipline, and chaos tests are good. The weak point is operational proof in deployed environments and real-model tail behavior.
- **Tradeoffs:** CI/staging evidence is valuable but not the same as production reliability history.
- **Improvement recommendations:** Require production-profile preflight and observability export readiness before hosted release handoff.
- **Disposition:** Fixable in V1.

### 19. Procurement Readiness

- **Score:** 79
- **Weight:** 2
- **Weighted impact on readiness:** 1.55 percentage points
- **Weighted deficiency signal:** 42
- **Justification:** The procurement pack, Trust Center, DPA, subprocessors, CAIQ, SIG, SOC self-assessment, and honest status labels are strong. Missing CPA SOC 2, ISO, third-party pen-test publication, and PGP are explicitly out of scored scope, but they remain buyer-friction facts.
- **Tradeoffs:** Honest posture reduces legal risk but may slow rigid RFPs.
- **Improvement recommendations:** Improve the objection playbook and automate evidence pack freshness checks as release gates.
- **Disposition:** V1 can improve readiness; formal attestations remain informational/out of scored scope.

### 20. Traceability

- **Score:** 88
- **Weight:** 3
- **Weighted impact on readiness:** 2.59 percentage points
- **Weighted deficiency signal:** 36
- **Justification:** Traceability is a standout: explainability traces, provenance graph, manifest/artifact linkage, audit rows, correlation IDs, trace IDs, support bundles, and evidence-chain services are deeply represented.
- **Tradeoffs:** The system can produce a lot of trace material, which can overwhelm users unless surfaced selectively.
- **Improvement recommendations:** Use progressive disclosure for traces: summary first, evidence chain next, raw forensic detail last.
- **Disposition:** Fixable polish in V1.

### 21. Compliance Readiness

- **Score:** 82
- **Weight:** 2
- **Weighted impact on readiness:** 1.61 percentage points
- **Weighted deficiency signal:** 36
- **Justification:** Compliance docs, policy packs, governance gates, audit events, CAIQ/SIG mappings, and trust materials are credible. The gap is that compliance posture is mostly self-attested and product/process-oriented rather than certified.
- **Tradeoffs:** Self-attested compliance is enough for many pilots; regulated enterprises may need more.
- **Improvement recommendations:** Keep compliance claims tied to exact repo evidence and avoid certification language.
- **Disposition:** Fixable in V1 for evidence hygiene; certifications are informational/out-of-scope.

### 22. Data Consistency

- **Score:** 82
- **Weight:** 2
- **Weighted impact on readiness:** 1.61 percentage points
- **Weighted deficiency signal:** 36
- **Justification:** SQL authority, DbUp migrations, FK parity, orphan probes, quarantine modes, data consistency metrics, and remediation endpoints are strong. Some historical orphan handling and not-trusted FK posture correctly acknowledge brownfield realities.
- **Tradeoffs:** `WITH NOCHECK` enables brownfield survival but requires operational monitoring and eventual reconciliation.
- **Improvement recommendations:** Surface data-consistency mode and orphan counts in deployment readiness and admin health reports.
- **Disposition:** Fixable in V1.

### 23. Explainability

- **Score:** 83
- **Weight:** 2
- **Weighted impact on readiness:** 1.63 percentage points
- **Weighted deficiency signal:** 34
- **Justification:** Explanation traces, aggregate explanations, citation metrics, faithfulness fallback, provenance graph, and finding inspect views are strong. A notable blemish is at least one provenance node explanation endpoint that intentionally returns 501 pending behavior.
- **Tradeoffs:** Aggregate explanations are more valuable than per-node explanation stubs, but exposed pending endpoints create confidence drag.
- **Improvement recommendations:** Hide, deprecate, or implement pending explanation endpoints so every visible explainability route has a useful response.
- **Disposition:** Fixable in V1.

### 24. Stickiness

- **Score:** 70
- **Weight:** 1
- **Weighted impact on readiness:** 0.69 percentage points
- **Weighted deficiency signal:** 30
- **Justification:** Stickiness could become high through governance workflows, audit history, comparison/replay, policy packs, and integrations. Today it is not yet proven by usage history, expansion signals, or customer references.
- **Tradeoffs:** Building deep governance features before proving repeat use can overfit the second sale.
- **Improvement recommendations:** Instrument repeat-run behavior and second-review value, not just first-run completion.
- **Disposition:** Fixable over V1/V1.1 with telemetry and adoption evidence.

### 25. Policy and Governance Alignment

- **Score:** 85
- **Weight:** 2
- **Weighted impact on readiness:** 1.67 percentage points
- **Weighted deficiency signal:** 30
- **Justification:** Policy packs, pre-commit gate, governance workflows, segregation of duties, SLA escalation, dry-run, audit events, and UI governance surfaces are mature for V1.
- **Tradeoffs:** Governance is a powerful expansion path but should not burden the first pilot.
- **Improvement recommendations:** Keep governance discoverable but out of the default first-session path.
- **Disposition:** Fixable polish in V1.

### 26. Azure Compatibility and SaaS Deployment Readiness

- **Score:** 85
- **Weight:** 2
- **Weighted impact on readiness:** 1.67 percentage points
- **Weighted deficiency signal:** 30
- **Justification:** The product is strongly Azure-native: Container Apps, Azure SQL, Key Vault, Front Door/WAF, private endpoints, Service Bus, Entra, App Insights/OTel, Terraform roots, and explicit production profile. Remaining gaps are operational validation and environment-specific owner setup.
- **Tradeoffs:** Azure focus sharpens security/IaC assumptions but narrows broader cloud marketability.
- **Improvement recommendations:** Keep Azure production-profile preflight as a required release artifact.
- **Disposition:** Fixable in V1.

### 27. Cognitive Load

- **Score:** 72
- **Weight:** 1
- **Weighted impact on readiness:** 0.71 percentage points
- **Weighted deficiency signal:** 28
- **Justification:** Documentation is extensive and routed, but the product and repo are heavy. The first-pilot docs explicitly fight feature creep, which is the right instinct.
- **Tradeoffs:** Deep enterprise systems need deep docs; buyers need a short path.
- **Improvement recommendations:** Audit the UI and docs for every first-session noun that is not required to produce a review package.
- **Disposition:** Fixable in V1.

### 28. Scalability

- **Score:** 73
- **Weight:** 1
- **Weighted impact on readiness:** 0.72 percentage points
- **Weighted deficiency signal:** 27
- **Justification:** There are horizontal scaling levers, k6 smoke, per-tenant burst, cache options, SQL tuning, and Container Apps. Evidence supports pilot-scale usage, not large production throughput or active/active scale.
- **Tradeoffs:** It is reasonable not to overbuild V1 scale, but enterprise buyers will ask about growth ceilings.
- **Improvement recommendations:** Publish one measured hosted scale envelope after staging/production traffic exists.
- **Disposition:** Better suited for V1.1/V2 after real usage.

### 29. Availability

- **Score:** 74
- **Weight:** 1
- **Weighted impact on readiness:** 0.73 percentage points
- **Weighted deficiency signal:** 26
- **Justification:** SLO targets, hosted probes, health endpoints, rollback, failover options, and runbooks exist. The gap is that contractual availability evidence and production probe history are not yet mature.
- **Tradeoffs:** Engineering targets are appropriate now; contractual SLAs should wait for operating history.
- **Improvement recommendations:** Build a buyer-safe 30-day production availability rollup once production probes are live.
- **Disposition:** V1.1 after production operation; not a V1 score defect beyond evidence maturity.

### 30. Template and Accelerator Richness

- **Score:** 76
- **Weight:** 1
- **Weighted impact on readiness:** 0.75 percentage points
- **Weighted deficiency signal:** 24
- **Justification:** Starter proof packs, policy packs, integration recipes, templates, and samples exist. They are useful, but the value will depend on whether they map to buyer-specific workflows without setup friction.
- **Tradeoffs:** More templates help adoption but can increase maintenance and choice overload.
- **Improvement recommendations:** Promote only the highest-converting starter packs in the default buyer journey.
- **Disposition:** Fixable in V1/V1.1.

### 31. Customer Self-Sufficiency

- **Score:** 76
- **Weight:** 1
- **Weighted impact on readiness:** 0.75 percentage points
- **Weighted deficiency signal:** 24
- **Justification:** Docs, troubleshooting, support bundles, health endpoints, CLI doctor, onboarding, and pilot rescue materials are strong. Self-sufficiency is held down by the number of moving parts and the need for operator judgment on proof sendability.
- **Tradeoffs:** Enterprise controls require some operational literacy.
- **Improvement recommendations:** Convert common failure modes into guided in-product recovery cards.
- **Disposition:** Fixable in V1.

### 32. Performance

- **Score:** 78
- **Weight:** 1
- **Weighted impact on readiness:** 0.76 percentage points
- **Weighted deficiency signal:** 22
- **Justification:** k6 gates, manual baseline, named-query telemetry, SQL indexes, caching, and performance docs exist. Real LLM tail latency and production-data soak are the less proven parts.
- **Tradeoffs:** Simulator performance is necessary but not enough for real-mode buyer experience.
- **Improvement recommendations:** Add a small real-mode latency/cost smoke report for release candidates.
- **Disposition:** Partly V1; larger production tuning V1.1/V2.

### 33. Manageability

- **Score:** 78
- **Weight:** 1
- **Weighted impact on readiness:** 0.76 percentage points
- **Weighted deficiency signal:** 22
- **Justification:** Configuration reference, startup validation, config linting, feature gates, tenant settings, admin APIs, and runbooks are good. Configuration remains broad and can overwhelm operators.
- **Tradeoffs:** Rich configuration enables enterprise fit; too much boilerplate causes setup mistakes.
- **Improvement recommendations:** Reduce pilot-visible config to the minimum and keep advanced keys in generated references.
- **Disposition:** Fixable in V1.

### 34. Evolvability

- **Score:** 78
- **Weight:** 1
- **Weighted impact on readiness:** 0.76 percentage points
- **Weighted deficiency signal:** 22
- **Justification:** ADRs, scope docs, module boundaries, templates, and backlog discipline help evolution. The feature surface is broad enough that unmanaged additions could create drift.
- **Tradeoffs:** Extensibility and breadth increase future-change load.
- **Improvement recommendations:** Require scope and route-tier updates for every new visible surface.
- **Disposition:** Fixable in V1 process.

### 35. Cost-Effectiveness

- **Score:** 78
- **Weight:** 1
- **Weighted impact on readiness:** 0.76 percentage points
- **Weighted deficiency signal:** 22
- **Justification:** Simulator mode, LLM cost accounting, monthly tenant budget guardrails, pricing model, Azure cost extractor, and Terraform cost knobs are good. Real-mode cost evidence and production unit economics still need operating history.
- **Tradeoffs:** Hard LLM budget stops protect margin but can affect user experience if not explained.
- **Improvement recommendations:** Show per-run LLM cost, budget state, and fallback behavior clearly in first-value reports.
- **Disposition:** Fixable in V1.

### 36. Observability

- **Score:** 79
- **Weight:** 1
- **Weighted impact on readiness:** 0.77 percentage points
- **Weighted deficiency signal:** 21
- **Justification:** OTel metrics, activity sources, Grafana dashboards, trace IDs, correlation IDs, health detail, agent output metrics, trial funnel metrics, and alert rules are strong. The main gap is exporter readiness and proof that metrics reach the chosen backend per environment.
- **Tradeoffs:** Instrumenting code is not the same as operating a telemetry pipeline.
- **Improvement recommendations:** Make observability export readiness a release checklist item and add alert examples for agent quality.
- **Disposition:** Fixable in V1.

### 37. Supportability

- **Score:** 80
- **Weight:** 1
- **Weighted impact on readiness:** 0.78 percentage points
- **Weighted deficiency signal:** 20
- **Justification:** Health checks, `/version`, correlation IDs, support bundles, troubleshooting docs, deployment evidence, and runbooks create a solid support base.
- **Tradeoffs:** Supportability will still depend on real deployment telemetry and disciplined incident practice.
- **Improvement recommendations:** Ensure support bundles include proof-readiness and data-consistency status without leaking secrets.
- **Disposition:** Fixable in V1.

### 38. Deployability

- **Score:** 80
- **Weight:** 1
- **Weighted impact on readiness:** 0.78 percentage points
- **Weighted deficiency signal:** 20
- **Justification:** Docker Compose, Container Apps, Terraform, CD, preflight, health, rollback, and release-smoke docs are solid. Some Terraform roots and hosted setup remain environment/owner dependent.
- **Tradeoffs:** IaC breadth is valuable but must be kept validated.
- **Improvement recommendations:** Tighten non-blocking Terraform validations once all roots are clean.
- **Disposition:** Fixable in V1/V1.1.

### 39. Auditability

- **Score:** 91
- **Weight:** 2
- **Weighted impact on readiness:** 1.78 percentage points
- **Weighted deficiency signal:** 18
- **Justification:** This is one of the strongest areas: append-only audit table, typed event catalog, durable audit coverage matrix, CSV/JSON export, correlation IDs, CI count guards, and known-gap discipline. The remaining known gaps are narrow and documented.
- **Tradeoffs:** Auditing every read can add noise; current approach focuses on meaningful lifecycle and mutation paths.
- **Improvement recommendations:** Keep the matrix updated whenever event constants or routes change.
- **Disposition:** Mostly V1-ready.

### 40. Extensibility

- **Score:** 82
- **Weight:** 1
- **Weighted impact on readiness:** 0.80 percentage points
- **Weighted deficiency signal:** 18
- **Justification:** APIs, connectors, templates, finding-engine template, context connectors, events, and modular services support extension. The issue is keeping extensions aligned with authority-shaped payloads and tenant scope.
- **Tradeoffs:** Extensible systems need stronger conformance tests.
- **Improvement recommendations:** Require conformance tests for each connector and extension point.
- **Disposition:** Fixable in V1.

### 41. Accessibility

- **Score:** 84
- **Weight:** 1
- **Weighted impact on readiness:** 0.82 percentage points
- **Weighted deficiency signal:** 16
- **Justification:** Accessibility review, axe component tests, live API accessibility specs, and public accessibility contact exist. The gap is broader proof across all advanced routes.
- **Tradeoffs:** Testing top routes first is pragmatic.
- **Improvement recommendations:** Expand axe coverage where governance and review flows carry buyer-critical tasks.
- **Disposition:** Fixable in V1/V1.1.

### 42. Change Impact Clarity

- **Score:** 84
- **Weight:** 1
- **Weighted impact on readiness:** 0.82 percentage points
- **Weighted deficiency signal:** 16
- **Justification:** Compare, replay, manifest deltas, drift detection, changelog discipline, and docs create good change clarity. The weakness is ensuring users understand changes without needing to know internal run/manifest language.
- **Tradeoffs:** Technical diffs are precise; buyer summaries must be curated.
- **Improvement recommendations:** Keep structured before/after summaries tied to buyer vocabulary.
- **Disposition:** Fixable in V1.

### 43. Modularity

- **Score:** 84
- **Weight:** 1
- **Weighted impact on readiness:** 0.82 percentage points
- **Weighted deficiency signal:** 16
- **Justification:** The project split and boundary tests are strong. Persistence consolidation and adapter exceptions mean modularity is good but not perfect.
- **Tradeoffs:** Too many assemblies had costs; fewer assemblies require internal package discipline.
- **Improvement recommendations:** Complete connection factory alignment and keep architecture tests current.
- **Disposition:** Fixable in V1/V1.1.

### 44. Testability

- **Score:** 86
- **Weight:** 1
- **Weighted impact on readiness:** 0.84 percentage points
- **Weighted deficiency signal:** 14
- **Justification:** Testability is strong: fast core, full regression, SQL integration, OpenAPI snapshots, property tests, live UI E2E, mock UI tests, k6, chaos, mutation testing, ZAP/Schemathesis scheduled checks, and architecture tests. Some checks are non-blocking or scheduled rather than per-PR.
- **Tradeoffs:** Not every expensive gate should block every PR, but release gates need stricter posture.
- **Improvement recommendations:** Promote release-only quality checks without burdening every PR.
- **Disposition:** Fixable in V1 process.

### 45. Documentation

- **Score:** 86
- **Weight:** 1
- **Weighted impact on readiness:** 0.84 percentage points
- **Weighted deficiency signal:** 14
- **Justification:** Documentation is deep, scoped, and buyer/operator aware. The risk is overabundance and occasional conflicting/stale backlog notes.
- **Tradeoffs:** Rich docs reduce hidden assumptions but increase navigation effort.
- **Improvement recommendations:** Keep the five-doc spine dominant and archive stale backlog contradictions quickly.
- **Disposition:** Fixable in V1.

### 46. Azure Ecosystem Fit

- **Score:** 86
- **Weight:** 1
- **Weighted impact on readiness:** 0.84 percentage points
- **Weighted deficiency signal:** 14
- **Justification:** Azure fit is excellent: Entra, Azure SQL, Key Vault, Service Bus, Container Apps, Front Door/WAF, App Insights/OTel, Azure extractor, Terraform, and Azure-native private networking assumptions.
- **Tradeoffs:** Azure-first strategy is a strength for ICP fit and a constraint for non-Azure buyers.
- **Improvement recommendations:** Keep multi-cloud claims out of default messaging.
- **Disposition:** V1-ready.

## 4. Top 12 Most Important Weaknesses

1. **Real-mode AI quality is not yet a hard release invariant.** The product can measure quality, but default reject floors and enforcement do not yet prevent weak real-model output from reaching a pilot.
2. **Proof-of-ROI depends on missing buyer baselines.** The system computes some proof, but manual effort and review-cycle improvement still need disciplined capture.
3. **First-session cognitive load is still too high.** The Core Pilot path is simple, but the surrounding product surface is large.
4. **Commercial proof is mostly self-generated.** There are strong artifacts but limited external validation, references, or production usage history.
5. **Connector readiness needs one visible truth source.** Code, docs, recipes, and scope commitments exist, but buyers need a simple connector status and smoke matrix.
6. **Telemetry export is documented but not inherently guaranteed per environment.** Metrics exist in code, but exporters and alert rules must be verified in deployment.
7. **Some visible surfaces are intentionally pending or partial.** A 501 provenance node explanation endpoint is a small but real confidence leak.
8. **Procurement posture is strong for self-attested V1, weak for rigid RFPs.** This is informational only for the headline score, but commercially real.
9. **Scalability evidence supports pilot scale, not enterprise-scale saturation.** k6 and burst profiles are good regression checks, not capacity proof.
10. **Configuration and setup breadth increase operational mistakes.** Startup validation helps, but the number of knobs is high.
11. **Documentation occasionally conflicts with current implementation state.** The eval-corpus docs show progress while some backlog notes still describe older gaps.
12. **Stickiness is designed but not proven.** Governance, audit, and replay can create stickiness, but repeat-use evidence is still early.

## 5. Top 6 Monetization Blockers

1. **Buyer proof is not yet undeniable.** Without a real tenant baseline and sponsor-safe first-value evidence, sales must persuade instead of letting the product prove value.
2. **Live commerce remains intentionally deferred.** The sales-led path is valid for V1, but it slows small-team conversion and self-serve decision velocity.
3. **No public reference proof inside current scored scope.** This is not a headline defect because it is deferred, but it affects conversion credibility.
4. **ROI quantification is incomplete when baseline fields are empty.** The product risks showing a plausible story instead of a hard business case.
5. **Advanced features can distract from the first sale.** Governance, graph, replay, and connectors are expansion hooks, but they can confuse first-time buyers.
6. **Enterprise assurance friction remains real.** Missing CPA SOC 2 and third-party pen-test report are out-of-scope for scoring, but still slow procurement.

## 6. Top 6 Enterprise Adoption Blockers

1. **Real-model output trust.** Enterprise architecture teams will not operationalize findings unless real-mode recommendations are consistently explainable, relevant, and gated.
2. **Rigid procurement evidence expectations.** Self-attestation, templates, and roadmaps may not satisfy buyers who require SOC 2, ISO, or third-party testing.
3. **Operational proof gap.** SLO targets, probes, and runbooks exist, but buyers may ask for production availability history and incident practice.
4. **Connector confidence.** Buyers need assurance that Jira, ServiceNow, Confluence, Slack, SCIM, and Azure extraction work in their process.
5. **Tenant isolation and data handling review.** The story is strong, but security reviewers will inspect implementation and operational setup carefully.
6. **Customer self-sufficiency.** First pilot success still depends on users understanding what to ignore and what to complete.

## 7. Top 6 Engineering Risks

1. **AI correctness boundary.** Weak or hallucinated real-mode findings are the highest-impact failure mode because they damage trust in the core value proposition.
2. **Quality gates without enforcement.** Metrics-only rejection can hide serious model-quality failures until a human notices.
3. **Deployment telemetry gaps.** If OTel/App Insights/Prometheus are not configured, the product can be richly instrumented but operationally blind.
4. **Brownfield data-consistency drift.** Not-trusted FKs and historical orphan handling are pragmatic, but require monitoring and reconciliation.
5. **Broad route/config surface.** More routes, feature flags, and integration options increase authorization, support, and documentation drift risk.
6. **Pending explainability endpoints.** Any route returning "not implemented" undercuts the trust story even if the aggregate explanation path is strong.

## 8. Most Important Truth

ArchLucid is strongest when it is sold and operated as a fast, evidence-linked architecture review package, not as a broad autonomous AI architecture platform; the fastest path to a materially higher readiness score is to harden real-mode output quality and buyer-safe proof, not to add more features.

## 9. Top Improvement Opportunities

### 1. Make Real-Mode AI Evidence a Release-Grade Artifact

- **Why it matters:** The core product promise depends on trustworthy AI findings. Simulator quality is not enough.
- **Expected impact:** Raises confidence in correctness, trustworthiness, AI readiness, and proof quality.
- **Affected qualities:** Correctness, AI/Agent Readiness, Trustworthiness, Proof-of-ROI Readiness, Differentiability.
- **Status:** Fully actionable now for the evidence/reporting portion.
- **Impact of running the prompt:** Directly improves Correctness (+4-6 pts), AI/Agent Readiness (+5-7 pts), Trustworthiness (+2-4 pts). Weighted readiness impact: +0.35-0.60%.

**Cursor prompt:**

```text
Implement a release-grade real-mode AI evidence artifact without requiring Azure OpenAI credentials in normal PR CI.

Scope:
- Work in tests/eval-corpus/, scripts/ci/eval_agent_corpus.py, docs/library/AGENT_OUTPUT_EVALUATION.md, docs/library/AGENT_EVAL_CORPUS.md, and any existing tests for eval_agent_corpus.py.
- Preserve PR-safe behavior: real-mode rows must skip when their environment variable is not set.
- Add or improve a Markdown release report section that clearly separates simulator fixture quality, skipped real-mode evidence, captured real-mode evidence, quality gate outcomes, and instructions for attaching REAL_LLM_RUN_EVIDENCE_TEMPLATE.md output.
- Add tests that prove:
  - unset real-mode env vars produce an explicit skipped count, not silent success;
  - captured real-mode JSON is scored and summarized;
  - --enforce-quality-gate still only gates simulator rows unless a separate explicit real-mode enforcement flag is introduced;
  - report copy cannot imply real Azure OpenAI evidence was captured when it was skipped.

Acceptance criteria:
- Running python scripts/ci/eval_agent_corpus.py --markdown-report <path> produces a report with explicit simulator vs real-mode sections.
- Existing CI behavior remains credential-free.
- Documentation tells release operators exactly what evidence is deterministic, what is optional real-mode, and what must be attached for a real-model release claim.

Constraints:
- Do not commit prompts, customer data, Azure OpenAI responses, or secrets.
- Do not make real Azure OpenAI required for normal PR CI.
- Do not change scoring thresholds unless an existing test proves the current behavior is wrong.
```

### 2. DEFERRED Decide Whether Rejected Agent Quality Blocks User Runs

- **Reason it is deferred:** The code supports `EnforceOnReject`, but enabling it changes user-visible behavior. A rejected quality gate could block pilot completion, which is a product decision, not just an engineering change.
- **Specific information needed from you later:** Should `AgentOutputQualityGateRejectedException` block pilot/user runs, or should rejected outcomes remain operator-only telemetry? If blocking, what user-facing error text and retry/fallback behavior should users see?
- **Affected qualities:** Correctness, AI/Agent Readiness, Reliability, Trustworthiness.

### 3. Build a Sponsor-Proof Readiness Gate for First-Value Reports

- **Why it matters:** Monetization depends on sponsor-safe proof that does not need hand-editing.
- **Expected impact:** Converts the ROI story from plausible to operationally repeatable.
- **Affected qualities:** Proof-of-ROI Readiness, Executive Value Visibility, Marketability, Decision Velocity.
- **Status:** Fully actionable now.
- **Impact of running the prompt:** Directly improves Proof-of-ROI Readiness (+6-8 pts), Executive Value Visibility (+3-5 pts), Decision Velocity (+2-3 pts). Weighted readiness impact: +0.40-0.65%.

**Cursor prompt:**

```text
Add a sponsor-proof readiness check for first-value reports.

Scope:
- Find the existing first-value report and pilot proof readiness code in ArchLucid.Application/Pilots, ArchLucid.Api pilot endpoints, archlucid-ui components that show sponsor/report CTAs, and related tests.
- Add a reusable "proof readiness" model that classifies a run as Sendable, NeedsBaseline, DemoOnly, or Incomplete.
- The check should evaluate at minimum:
  - committed golden manifest exists;
  - findings counts are present;
  - audit row count is present or explicitly lower-bound/capped;
  - top-severity evidence-chain pointer is present when findings exist;
  - LLM call count is present;
  - ROI evidence completeness is Strong/Partial/Low;
  - demo tenant warning is present when applicable;
  - tenant baseline review-cycle/manual-prep values are present or the report clearly states what is missing.
- Surface this status in the first-value Markdown/PDF and in the UI sponsor CTA.
- Add tests for each classification.

Acceptance criteria:
- A sponsor report never appears silently "ready" when key computed proof fields are missing.
- Demo runs are visibly DemoOnly and cannot be mistaken for customer ROI proof.
- Missing baseline fields produce clear next-step copy rather than invented numbers.

Constraints:
- Do not fabricate ROI or customer outcomes.
- Do not remove existing first-value report fields unless tests prove they are obsolete.
- Do not change pricing or commercial terms.
```

### 4. Reduce First-Session Cognitive Load to the Four-Step Core Pilot

- **Why it matters:** The first sale depends on fast completion of one architecture review package, not feature exploration.
- **Expected impact:** Improves adoption, usability, time-to-value, and decision velocity.
- **Affected qualities:** Adoption Friction, Time-to-Value, Usability, Cognitive Load, Customer Self-Sufficiency.
- **Status:** Fully actionable now.
- **Impact of running the prompt:** Directly improves Adoption Friction (+5-7 pts), Usability (+3-4 pts), Time-to-Value (+2-3 pts), Cognitive Load (+6-8 pts). Weighted readiness impact: +0.55-0.85%.

**Cursor prompt:**

```text
Tighten the operator first-session experience around the four Core Pilot steps.

Scope:
- Work in archlucid-ui first-session/home/onboarding/review components and tests, plus docs/CORE_PILOT.md only if copy changes require doc alignment.
- Identify default-visible first-session UI that points users toward graph, compare, replay, advisory, governance, alerts, policy packs, or advanced settings before a first committed review exists.
- Keep those features available through progressive disclosure, but ensure the default first-session path emphasizes only:
  1. Create architecture review
  2. Let pipeline runs complete
  3. Finalize
  4. Review package
- Add or update tests that lock default visible copy and nav behavior before first commit.

Acceptance criteria:
- A new evaluator can see the four-step path without understanding "manifest", "authority", or "Operate".
- Advanced links remain reachable through the existing progressive disclosure model.
- Existing authority/API authorization behavior is unchanged.

Constraints:
- Do not remove advanced routes.
- Do not weaken API authorization or UI authority shaping.
- Do not rename persisted API concepts; translate them at the UI edge.
```

### 5. Create a Connector Readiness Matrix Backed by Tests

- **Why it matters:** Integrations are commercially important, but buyers need a clear status per connector.
- **Expected impact:** Improves workflow embeddedness, interoperability, enterprise adoption, and procurement confidence.
- **Affected qualities:** Workflow Embeddedness, Interoperability, Enterprise Adoption, Procurement Readiness.
- **Status:** Fully actionable now.
- **Impact of running the prompt:** Directly improves Workflow Embeddedness (+4-6 pts), Interoperability (+4-6 pts), Procurement Readiness (+2-3 pts). Weighted readiness impact: +0.30-0.50%.

**Cursor prompt:**

```text
Add a single connector readiness matrix that is backed by existing tests and code paths.

Scope:
- Create or update a markdown artifact under docs/integrations/ or docs/library/ that lists REST API, CLI, webhooks, Service Bus, SCIM, Teams, Slack, Confluence, Jira, ServiceNow, Azure DevOps, and Azure extractor.
- For each connector, include: status, direction, auth method, tenant-secret handling, source code entry point, primary tests, smoke doc/runbook, and V1/V1.1/V2 scope.
- Add a CI/script guard if a similar doc-index pattern already exists; otherwise add a focused unit/script test that validates referenced files exist.
- Update docs/go-to-market/INTEGRATION_CATALOG.md to link to the matrix rather than duplicating detail.

Acceptance criteria:
- A buyer or implementer can tell which connectors are implemented, smoke-tested, vendor-conformance-tested, planned, or deferred.
- The matrix distinguishes customer-operated recipes from first-party product surfaces.
- Broken referenced paths fail a local script/test.

Constraints:
- Do not promote planned connectors to shipped.
- Do not add new connector code.
- Do not contradict docs/library/V1_SCOPE.md or docs/library/V1_DEFERRED.md.
```

### 6. Verify Observability Export Readiness and Add Agent-Quality Alert Examples

- **Why it matters:** The product emits strong metrics, but production value depends on exported metrics and alerts.
- **Expected impact:** Improves supportability, reliability, observability, AI readiness, and manageability.
- **Affected qualities:** Observability, Supportability, Reliability, AI/Agent Readiness, Manageability.
- **Status:** Fully actionable now.
- **Impact of running the prompt:** Directly improves Observability (+5-7 pts), Supportability (+2-3 pts), Reliability (+2-3 pts), AI/Agent Readiness (+2-4 pts). Weighted readiness impact: +0.20-0.40%.

**Cursor prompt:**

```text
Harden observability export readiness for release handoff.

Scope:
- Work in scripts/report_observability_export_readiness.py, docs/library/OBSERVABILITY.md, docs/library/RELEASE_EVIDENCE_SUMMARY.md, infra/terraform-monitoring or existing alert modules if applicable, and related tests.
- Ensure the readiness report clearly states whether API and Worker have at least one configured export path: Application Insights/Azure Monitor, OTLP, or Prometheus.
- Add example alert definitions or documented Terraform/Grafana patterns for:
  - archlucid_agent_output_quality_gate_total rejected rate;
  - archlucid_agent_output_semantic_score low p10/p50;
  - archlucid_agent_output_parse_failures_total non-zero;
  - archlucid_agent_trace_blob_upload_failures_total non-zero.
- Add tests for readiness report output and alert/path validation where existing patterns allow.

Acceptance criteria:
- Release operators get a clear pass/warn/fail answer for telemetry export readiness.
- Agent-quality metrics have documented alert paths.
- The report does not print secret values.

Constraints:
- Do not require Azure login.
- Do not hardcode subscription IDs or production URLs.
- Do not make Prometheus public or weaken scrape auth guidance.
```

### 7. Remove or Implement Pending Provenance Node Explanation Behavior

- **Why it matters:** A visible 501 explanation endpoint undermines the trust/explainability story.
- **Expected impact:** Improves explainability, trustworthiness, correctness, and usability.
- **Affected qualities:** Explainability, Trustworthiness, Usability, Correctness.
- **Status:** Fully actionable now.
- **Impact of running the prompt:** Directly improves Explainability (+3-5 pts), Trustworthiness (+1-2 pts), Usability (+1-2 pts). Weighted readiness impact: +0.10-0.25%.

**Cursor prompt:**

```text
Replace the pending provenance node explanation endpoint behavior with a buyer-safe supported behavior.

Scope:
- Start with ArchLucid.Api.Tests/ArchitectureProvenanceExplanationEndpointTests.cs and the controller/action that returns 501 "Explanation feature pending".
- Decide from existing application services whether the endpoint can return a useful aggregate or node-scoped explanation today.
- If a real implementation is practical, route to existing explanation/provenance services and add tests for scoped run lookup, missing run, and valid explanation payload.
- If implementation is not practical, hide or deprecate the route from public OpenAPI and return a stable ProblemDetails response that points clients to the supported aggregate explanation route.

Acceptance criteria:
- No public/buyer-visible explainability route returns a vague "pending" payload.
- OpenAPI and tests match the chosen behavior.
- Existing aggregate explanation routes remain unchanged.

Constraints:
- Do not invent unsupported LLM behavior.
- Do not weaken tenant scope checks.
- Do not break existing clients without documenting the contract change.
```

### 8. Turn Procurement Evidence Freshness into a Release Gate

- **Why it matters:** Enterprise trust depends on evidence freshness and placeholder discipline.
- **Expected impact:** Improves procurement readiness, compliance readiness, trustworthiness, and decision velocity.
- **Affected qualities:** Procurement Readiness, Compliance Readiness, Trustworthiness, Decision Velocity.
- **Status:** Fully actionable now.
- **Impact of running the prompt:** Directly improves Procurement Readiness (+3-5 pts), Compliance Readiness (+2-3 pts), Trustworthiness (+1-2 pts). Weighted readiness impact: +0.20-0.35%.

**Cursor prompt:**

```text
Make procurement evidence freshness and placeholder discipline part of release evidence.

Scope:
- Review scripts/ci/check_procurement_pack_index.py, scripts/build_procurement_pack.py, docs/go-to-market/PROCUREMENT_PACK_INDEX.md, docs/trust-center.md, docs/go-to-market/PROCUREMENT_FAST_LANE.md, and docs/library/RELEASE_EVIDENCE_SUMMARY.md.
- Add a release-oriented command or documented step that validates:
  - canonical procurement paths exist;
  - Implemented/Self-attested rows are within freshness budgets;
  - placeholder/draft markers are handled according to buyer-facing placeholder strictness;
  - SOC 2 and third-party pen-test statuses remain honest and do not imply issued attestations.
- Add tests for stale rows, broken paths, and forbidden attestation wording.

Acceptance criteria:
- A release operator can generate a procurement-pack readiness result before sending buyer materials.
- The check fails loud on broken paths or forbidden assurance wording.
- Deferred assurance rows remain allowed when accurately labeled.

Constraints:
- Do not claim SOC 2, ISO, or third-party pen-test completion.
- Do not move deferred assurance into current readiness gates.
- Do not require buyer-specific legal names in committed files.
```

### 9. Surface Data-Consistency Posture in Health and Deployment Evidence

- **Why it matters:** Brownfield FK and orphan handling is safe only when operators can see it.
- **Expected impact:** Improves data consistency, reliability, supportability, and enterprise trust.
- **Affected qualities:** Data Consistency, Reliability, Supportability, Trustworthiness.
- **Status:** Fully actionable now.
- **Impact of running the prompt:** Directly improves Data Consistency (+4-6 pts), Reliability (+1-2 pts), Supportability (+2-3 pts). Weighted readiness impact: +0.15-0.30%.

**Cursor prompt:**

```text
Expose data-consistency enforcement posture in deployment evidence and operator diagnostics.

Scope:
- Work from docs/data-consistency/DATA_CONSISTENCY_ENFORCEMENT.md, docs/runbooks/DATA_CONSISTENCY_ENFORCEMENT.md, scripts/data_consistency_mode_readiness_report.py if present, health/readiness diagnostics, and AdminDiagnosticsService tests.
- Add or improve a report/check that states:
  - DataConsistency:OrphanProbeEnabled effective value;
  - DataConsistency:Enforcement:Mode;
  - AlertThreshold and MaxRowsPerBatch;
  - whether quarantine tables/migrations are present;
  - current known orphan counts when SQL is available, or "not captured" when offline.
- Link this result from RELEASE_EVIDENCE_SUMMARY.md or production-profile preflight.

Acceptance criteria:
- Operators can tell before handoff whether orphan detection is disabled, warn-only, alerting, or quarantine-capable.
- Offline mode does not pretend to query SQL.
- SQL mode does not delete or quarantine rows as part of a read-only readiness check.

Constraints:
- Do not auto-remediate data.
- Do not weaken RLS/tenant scoping.
- Do not edit historical migrations.
```

### 10. Align Pricing and Quote CTA Copy With Sales-Led V1 State

- **Why it matters:** Placeholder checkout behavior must not confuse buyers or look unfinished.
- **Expected impact:** Improves commercial packaging, decision velocity, marketability, and adoption friction.
- **Affected qualities:** Commercial Packaging Readiness, Decision Velocity, Marketability, Adoption Friction.
- **Status:** Fully actionable now.
- **Impact of running the prompt:** Directly improves Commercial Packaging Readiness (+4-6 pts), Decision Velocity (+2-4 pts), Marketability (+1-2 pts). Weighted readiness impact: +0.20-0.35%.

**Cursor prompt:**

```text
Audit and tighten the public pricing/quote CTA so the V1 sales-led state is unmistakable.

Scope:
- Work in docs/go-to-market/PRICING_PHILOSOPHY.md, archlucid-ui/public/pricing.json generation/guards, archlucid-ui pricing components, quote-request API/UI tests, and existing placeholder guard scripts.
- Ensure public UI copy does not expose placeholder checkout URLs or imply self-serve live checkout unless the existing opt-in guard is explicitly enabled.
- Make the quote-request path the dominant CTA when live checkout is not enabled.
- Add/adjust tests proving:
  - placeholder Stripe URLs keep Subscribe hidden;
  - test-mode Stripe URLs are labeled test-only;
  - live URLs require the existing live-mode flags;
  - quote CTA remains visible in sales-led state.

Acceptance criteria:
- Buyers see a polished sales-led purchase path, not placeholder billing plumbing.
- CI guards prevent unlabeled test/placeholder checkout links from becoming buyer-visible.

Constraints:
- Do not enable live Stripe or Marketplace.
- Do not change list prices.
- Do not remove production safety rules.
```

### 11. Consolidate High-Value Maintainability Refactors Before More Surface Area

- **Why it matters:** The product is large enough that future speed depends on simpler internals.
- **Expected impact:** Improves maintainability, modularity, architectural integrity, and cognitive load for contributors.
- **Affected qualities:** Maintainability, Modularity, Architectural Integrity, Evolvability.
- **Status:** Fully actionable now.
- **Impact of running the prompt:** Directly improves Maintainability (+4-6 pts), Modularity (+2-3 pts), Architectural Integrity (+1-2 pts). Weighted readiness impact: +0.20-0.35%.

**Cursor prompt:**

```text
Execute the next small maintainability refactor from docs/library/NEXT_REFACTORINGS.md without broad behavior change.

Scope:
- Start with connection factory alignment or configuration boilerplate reduction, whichever has the smallest blast radius after inspection.
- Reuse existing abstractions aggressively.
- Keep one class per file.
- Prefer concrete types over var.
- Add or update focused tests for the exact refactor.

Acceptance criteria:
- The chosen abstraction has one canonical path and no duplicated equivalent helper remains in the touched area.
- Existing public API behavior and persistence schema are unchanged.
- Tests document the intended replacement path.

Constraints:
- Do not combine unrelated refactors.
- Do not change migrations or database schema unless the selected refactor explicitly requires it and tests cover it.
- Do not touch pricing, trust, or product copy in the same change.
```

### 12. DEFERRED Execute Owner-Only Commerce Un-Hold

- **Reason it is deferred:** Live Stripe keys, Marketplace publication, seller verification, payout/tax profile, and DNS cutover require owner-controlled accounts and decisions. The current V1 scope explicitly treats this as V1.1/owner-only.
- **Specific information needed from you later:** Confirmation that Stripe live Price IDs/webhook secrets, Marketplace offer publication, seller/payout/tax setup, and `signup.archlucid.net` DNS are ready to activate.
- **Affected qualities:** Decision Velocity, Commercial Packaging Readiness, Marketability.

## 10. Pending Questions for Later

### DEFERRED Decide Whether Rejected Agent Quality Blocks User Runs

- Should `EnforceOnReject` block a pilot user's run, or remain telemetry-only?
- If blocking, should the product retry, fall back to simulator, fail the run, or produce a partial package?
- What exact user-facing error copy is acceptable when a model-quality gate fails?

### DEFERRED Execute Owner-Only Commerce Un-Hold

- Are Stripe live keys, live recurring Price IDs, and production webhook secrets available?
- Is the Azure Marketplace SaaS offer published and seller/payout/tax verification complete?
- Is `signup.archlucid.net` ready for production DNS cutover?

### Make Real-Mode AI Evidence a Release-Grade Artifact

- What Azure OpenAI deployment should be treated as the reference real-mode release evidence source?
- What minimum semantic/structural quality floors are acceptable for tagged release candidates?

### Build a Sponsor-Proof Readiness Gate for First-Value Reports

- Which baseline fields are mandatory before a report can be called sponsor-sendable?
- Should "Partial" ROI evidence be sendable with a warning, or blocked until baseline collection improves?

### Create a Connector Readiness Matrix Backed by Tests

- Which connectors must be shown as buyer-available versus tenant-enabled-by-request?
- Should marketplace/store listing status be shown separately from functional connector status?

### Verify Observability Export Readiness and Add Agent-Quality Alert Examples

- Which backend is the default production telemetry system: Application Insights, OTLP collector, Prometheus/Grafana, or a combination?
- Who receives agent-quality degradation alerts during pilots?

