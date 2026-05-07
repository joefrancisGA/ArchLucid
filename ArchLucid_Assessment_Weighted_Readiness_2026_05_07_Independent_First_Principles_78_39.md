# ArchLucid Assessment – Weighted Readiness 78.39%

## Executive Summary

### Overall readiness

ArchLucid is materially past prototype status. The solution has a coherent V1 contract, a default Core Pilot path, real API/UI/CLI surfaces, SQL-backed persistence, durable audit, governance workflows, release smoke discipline, OpenAPI snapshot protection, live-API UI tests, k6 smoke, and strong Azure/IaC alignment. Weighted readiness is **78.39%** across the supplied model.

The score is not higher because the highest-weight commercial qualities still depend on proof clarity, buyer comprehension, and repeatable first-value evidence. Engineering maturity is real, but the AI correctness boundary, real-LLM release signal, context-evidence fidelity, observability export posture, and operational proof are not yet as strong as the surrounding architecture and documentation.

### Commercial picture

The commercial story is credible but still founder-led and proof-heavy. The strongest V1 claim is narrow and defensible: move from architecture request to reviewable package faster, with stronger evidence. Pricing, quote request, sponsor brief, first-value reports, ROI model, and packaging are present. The blocker is not "does the product exist"; it is whether a buyer can quickly believe the output, connect it to their own baseline, and move from curiosity to paid pilot without the founder explaining the whole system.

Explicitly deferred commercial items were not charged against the readiness score: live Stripe/Marketplace un-hold, signed design partner, and public reference-customer publication are out of V1 headline scope.

### Enterprise picture

Enterprise posture is unusually strong for this stage: Entra/JWT direction, API keys for automation where appropriate, private endpoint posture, no public SMB/445, tenant database topology, RLS documentation, durable audit catalog, procurement pack, DPA/subprocessor templates, CAIQ/SIG material, SOC 2 self-assessment, and trust-center honesty are all present. The enterprise gap is procurement realism, not V1 product scope: large buyers will still ask for CPA SOC 2, third-party pen-test evidence, named references, VPAT, measured uptime, and mature support ownership.

Those procurement frictions are informational only in this score. SOC 2 CPA attestation, ISO certification, third-party pen-test summary, and PGP publication are explicitly deferred or out of headline scope and were not treated as V1 readiness defects.

### Engineering picture

The engineering base is strong: modular .NET projects, Dapper/SQL persistence, DbUp migrations, OpenAPI contract tests, integration tests, property tests, UI live E2E, k6, security scans, Terraform roots, and documented runbooks. The most serious engineering risk is that the deterministic skeleton is stronger than the live AI quality proof. The product can explain and audit what it did, but the release bar still needs more real-mode agent output evidence, stricter quality-gate posture, and better dynamic evidence hydration before the highest-trust enterprise use cases feel safe.

## Deferred Scope Uncertainty

No deferred-scope uncertainty found. I located the current scope and deferral materials in `docs/library/V1_SCOPE.md`, `docs/library/V1_DEFERRED.md`, `docs/PENDING_QUESTIONS.md`, and `docs/go-to-market/TRUST_CENTER.md`. The assessment treats explicitly deferred V1.1/V2 items as out of headline scoring scope.

## Scoring Method

Total weight: **102**.

Weighted readiness calculation:

`sum(score * weight) / 102 = 78.39%`

Weighted deficiency signal:

`weight * (100 - score) / 102`

The quality order below is ranked by weighted deficiency signal, not by raw score alone.

## Weighted Quality Assessment

### 1. Marketability

Score: **76**  
Weight: **8**  
Weighted impact on readiness: **5.96 percentage points**  
Weighted deficiency signal: **1.88 percentage points**

Justification: The market story is narrow, understandable, and aligned around architecture request to reviewable package. The sponsor brief, pricing narrative, trust center, ROI model, public pricing posture, and pilot path give the product a credible outward shape. The weakness is buyer proof density: the story still needs more self-evident proof artifacts, fewer explanation-heavy docs, and more immediate evidence that a real customer can get value without founder interpretation.

Tradeoffs: Keeping V1 focused on Core Pilot avoids over-claiming, but the breadth of Operate, governance, integrations, trust, and AI claims can dilute the simple buyer message.

Improvement recommendations: tighten public first-session proof, improve demo-to-real proof transition, make buyer-safe evidence gates more visible, and reduce marketing reliance on internal documentation depth.

Fixability: **V1 fixable** for proof packaging and first-session clarity; broader brand/category proof is **better suited for V1.1/V2**.

### 2. Adoption Friction

Score: **77**  
Weight: **6**  
Weighted impact on readiness: **4.53 percentage points**  
Weighted deficiency signal: **1.35 percentage points**

Justification: The buyer path is intentionally no-install SaaS, and the Core Pilot path is only four steps. That is strong. Friction remains because the product has a large conceptual surface, separate Pilot and Operate layers, multiple auth/deployment modes, sample-vs-real proof boundaries, and many documents that are useful but intimidating.

Tradeoffs: Progressive disclosure protects first-time buyers, while deep enterprise capability creates necessary complexity behind the curtain.

Improvement recommendations: add a stricter first-run proof rail, reduce wording drift between "run", "architecture review", "manifest", and "package", and make the second real run the dominant next action after sample review.

Fixability: **V1 fixable**.

### 3. Time-to-Value

Score: **82**  
Weight: **7**  
Weighted impact on readiness: **5.63 percentage points**  
Weighted deficiency signal: **1.24 percentage points**

Justification: The Core Pilot path is a strong time-to-value design: create request, execute, commit/finalize, review package. The sample review and simulator mode help first value appear quickly. The score is capped because proof with the buyer's real architecture still requires careful setup, baseline capture, and interpretation.

Tradeoffs: Simulator mode accelerates first value, but it cannot carry the same credibility as real architecture context and real model execution.

Improvement recommendations: make "sample first, then your one-page second run" impossible to miss; improve first-value report readiness warnings; make real-input import more forgiving.

Fixability: **V1 fixable**.

### 4. Proof-of-ROI Readiness

Score: **75**  
Weight: **5**  
Weighted impact on readiness: **3.68 percentage points**  
Weighted deficiency signal: **1.23 percentage points**

Justification: The ROI model, pilot metrics, first-value Markdown/PDF, computed deltas, LLM-call count, audit-row count, and evidence-chain pointers are strong. The weakness is that several important ROI claims remain qualitative or baseline-dependent. The product can show speed and evidence shape, but "manual prep reduced" and "review cycle improved" still need disciplined tenant input or operator judgment.

Tradeoffs: Conservative ROI avoids false precision, but conservative proof slows conversion unless the product makes incomplete evidence obvious and actionable.

Improvement recommendations: strengthen ROI evidence completeness, add clearer baseline capture nudges, and make the first-value report visibly fail or warn when proof is not sponsor-safe.

Fixability: **V1 fixable** for evidence completeness and gates; measured multi-customer ROI trends are **V1.1/V2**.

### 5. Differentiability

Score: **74**  
Weight: **4**  
Weighted impact on readiness: **2.90 percentage points**  
Weighted deficiency signal: **1.02 percentage points**

Justification: ArchLucid is differentiated by combining AI-assisted architecture review, committed manifests, traceability, governance evidence, audit, and Azure-oriented SaaS posture. The issue is that a skeptical buyer may still see "AI architecture assistant plus docs" unless the product makes evidence, replayability, governance, and buyer-safe proof unmistakably visible early.

Tradeoffs: Differentiation through evidence is durable but harder to explain than a narrower single-feature product.

Improvement recommendations: turn the first-value package into the differentiator, not just an export; highlight manifest/evidence/audit provenance in the UI and sponsor artifacts.

Fixability: **V1 fixable** for presentation; market category defensibility is **V1.1/V2**.

### 6. Correctness

Score: **75**  
Weight: **4**  
Weighted impact on readiness: **2.94 percentage points**  
Weighted deficiency signal: **0.98 percentage points**

Justification: Correctness has substantial test support: OpenAPI snapshots, API integration tests, property tests, SQL integration, live UI E2E, k6, schema validation, and data consistency checks. The score is held down by the AI correctness boundary: real-mode agent quality is not yet a required PR/release gate, default evidence building still uses deterministic stub catalogs in places, and prior manifest hydration is intentionally absent in the default evidence builder.

Tradeoffs: Simulator and deterministic fixtures give reliable regression safety, but they cannot fully prove real AI output quality.

Improvement recommendations: add real-mode eval corpus coverage, harden quality-gate release semantics, hydrate prior manifests where requested, and keep simulator fixtures as deterministic guardrails.

Fixability: **Partly V1 fixable**. Some real-LLM gate promotion is **blocked on user/operator input**.

### 7. Workflow Embeddedness

Score: **72**  
Weight: **3**  
Weighted impact on readiness: **2.12 percentage points**  
Weighted deficiency signal: **0.82 percentage points**

Justification: REST, CLI, webhooks, Service Bus, SIEM export, Jira, ServiceNow, Slack, Confluence, Azure extractor, and SCIM are represented in the product/story. The issue is operational embeddedness: V1 has many integration surfaces, but buyer workflows still rely on configuration, connector enablement, and sales/operator guidance.

Tradeoffs: Keeping integrations Authority-shaped and scoped avoids schema sprawl, but first-party workflow depth takes longer.

Improvement recommendations: ensure V1 connector docs and smoke evidence are uniform; make "from finding to external workflow item and back to status" a visible proof path.

Fixability: **V1 fixable** for committed connectors and smoke artifacts; deeper Microsoft-native breadth is **V1.1/V2**.

### 8. Executive Value Visibility

Score: **80**  
Weight: **4**  
Weighted impact on readiness: **3.14 percentage points**  
Weighted deficiency signal: **0.78 percentage points**

Justification: Sponsor brief, first-value PDF, value report, ROI model, sponsor banner, and proof package concepts are strong. The score is not higher because sponsor value still depends on evidence completeness and on replacing demo/sample numbers with real tenant context.

Tradeoffs: The product correctly avoids over-claiming enterprise-wide transformation, but that restraint means the sponsor artifact must be exceptionally crisp.

Improvement recommendations: make the first-value PDF the canonical executive artifact and add explicit incomplete-proof warnings.

Fixability: **V1 fixable**.

### 9. Trustworthiness

Score: **76**  
Weight: **3**  
Weighted impact on readiness: **2.24 percentage points**  
Weighted deficiency signal: **0.71 percentage points**

Justification: Trustworthiness is supported by traceability, audit, Problem Details, correlation IDs, security docs, trust center honesty, and self-assessment. The cap is the same core risk: LLM outputs are decision support, not attestation, and the real-output release bar is not fully enforced.

Tradeoffs: Transparent caveats build buyer trust, but too many caveats can make the product feel less ready.

Improvement recommendations: reinforce "evidence over prose", improve real-output evaluation, and expose trust evidence cards consistently in review artifacts.

Fixability: **V1 fixable** for evidence display and quality checks; formal external assurance is **out of scope**.

### 10. Usability

Score: **78**  
Weight: **3**  
Weighted impact on readiness: **2.29 percentage points**  
Weighted deficiency signal: **0.65 percentage points**

Justification: The four-step pilot, sample review, progressive navigation, role-aware UI shaping, and operator docs show strong usability intent. Usability is weakened by naming complexity, wide feature surface, and the difference between what buyers see and what internal operators/developers read.

Tradeoffs: Enterprise-grade controls increase surface area; progressive disclosure mitigates but does not eliminate cognitive burden.

Improvement recommendations: polish the first-session UI and reduce language ambiguity around run/review/package/finalize/commit.

Fixability: **V1 fixable**.

### 11. Decision Velocity

Score: **72**  
Weight: **2**  
Weighted impact on readiness: **1.41 percentage points**  
Weighted deficiency signal: **0.55 percentage points**

Justification: Pricing, quote request, order form, and pilot paths exist. Decision velocity is still limited by sales-led motion, owner-solo follow-up, deferred live commerce un-hold, and evidence that still requires explanation. The deferred commerce flip is not scored as a V1 defect, but the current buyer journey is still slower than a fully self-serve motion.

Tradeoffs: Sales-led enterprise motion is appropriate for trust-heavy architecture tooling, but it slows small-team conversion.

Improvement recommendations: tighten quote follow-up artifacts, add stronger pricing CTA clarity, and improve buyer-safe proof readiness before sales contact.

Fixability: **V1 fixable** for quote and proof flow; live commerce cutover is **V1.1/owner-only**.

### 12. AI/Agent Readiness

Score: **72**  
Weight: **2**  
Weighted impact on readiness: **1.41 percentage points**  
Weighted deficiency signal: **0.55 percentage points**

Justification: The agent runtime has schemas, parsing, trace evaluation, structural and semantic scoring, golden fixtures, CLI rollups, and OTel metric emission. The weakness is release enforcement: defaults are warn-oriented, real-mode eval corpus coverage is missing, and real-Azure-OpenAI gate promotion depends on external provisioning/secret work.

Tradeoffs: Warn-only mode protects user runs from false blocks, but it weakens release credibility for AI-generated architecture decisions.

Improvement recommendations: add real-mode corpus scenarios, define hard-fail semantics for reject outcomes, and wire metrics to an operational backend.

Fixability: **Partly V1 fixable**; branch-protection promotion is **blocked on user/operator input**.

### 13. Security

Score: **82**  
Weight: **3**  
Weighted impact on readiness: **2.41 percentage points**  
Weighted deficiency signal: **0.53 percentage points**

Justification: Security posture is strong for V1: Entra/JWT production direction, API key rules, private endpoint posture, no public SMB/445, Key Vault, rate limiting, security headers, ZAP/Schemathesis, RLS/database-per-tenant story, tenant scoping, prompt redaction, and trust documentation. The score is capped by owner-conducted rather than third-party pen testing and by enterprise procurement expectations, though those are not headline V1 defects.

Tradeoffs: Azure-native controls reduce bespoke security risk but require disciplined deployment configuration.

Improvement recommendations: finish owner-conducted test evidence, keep negative auth/scope tests growing, and ensure production config warnings alert visibly.

Fixability: **V1 fixable** for owner-conducted evidence and controls; third-party pen test is **V2**.

### 14. Procurement Readiness

Score: **74**  
Weight: **2**  
Weighted impact on readiness: **1.45 percentage points**  
Weighted deficiency signal: **0.51 percentage points**

Justification: Procurement pack, trust center, DPA, subprocessors, CAIQ/SIG, SOC 2 roadmap, incident policy, SLA summaries, and objection playbook are strong. The score is constrained by procurement realism: no CPA SOC 2, no ISO claim, no third-party pen-test summary, owner-solo legal/commercial flow, and limited achieved uptime history.

Tradeoffs: Honest self-assessment is better than false assurance, but some enterprise buyers will still block.

Improvement recommendations: improve procurement pack sendability, add clearer "what is self-attested vs externally attested" labeling, and make achieved operational evidence easier to gather.

Fixability: **V1 fixable** for pack clarity; formal assurance is **out of scope / procurement-only realism**.

### 15. Architectural Integrity

Score: **83**  
Weight: **3**  
Weighted impact on readiness: **2.44 percentage points**  
Weighted deficiency signal: **0.50 percentage points**

Justification: The architecture is internally coherent: API, UI, CLI, worker, SQL, application services, persistence, decisioning, context ingestion, knowledge graph, and Azure infrastructure are well-bounded. ADRs and docs show active architectural control. The score is capped by breadth and some transitional seams, especially around coordinator-to-authority convergence and context ingestion phases.

Tradeoffs: More bounded contexts improve modularity but increase integration discipline requirements.

Improvement recommendations: continue converging authority semantics, simplify context ingestion internals, and avoid new parallel schemas for connectors.

Fixability: **V1/V1.1**, depending on seam.

### 16. Traceability

Score: **84**  
Weight: **3**  
Weighted impact on readiness: **2.47 percentage points**  
Weighted deficiency signal: **0.47 percentage points**

Justification: Traceability is a core strength: manifests, run IDs, audit rows, decision traces, evidence chains, correlation IDs, provenance graph, comparison/replay, and support bundles are all present. The gap is less about raw trace existence and more about turning traces into simple buyer confidence.

Tradeoffs: Deep traceability can increase cognitive load unless summarized well.

Improvement recommendations: surface trace completeness and evidence-chain health in review package summaries.

Fixability: **V1 fixable**.

### 17. Compliance Readiness

Score: **78**  
Weight: **2**  
Weighted impact on readiness: **1.53 percentage points**  
Weighted deficiency signal: **0.43 percentage points**

Justification: Compliance readiness has a strong evidence library, self-assessment, matrices, DPA, subprocessors, DSAR process, RLS docs, audit coverage, and governance controls. It is not scored down for missing SOC 2 CPA. The remaining score gap is operational proof and buyer confidence in self-attested controls.

Tradeoffs: Internal compliance evidence is fast and honest; external assurance is expensive and deferred.

Improvement recommendations: keep the compliance matrix current with code evidence and add clearer procurement-pack validation.

Fixability: **V1 fixable** for documentation/evidence; formal reports are **out of scope**.

### 18. Interoperability

Score: **78**  
Weight: **2**  
Weighted impact on readiness: **1.53 percentage points**  
Weighted deficiency signal: **0.43 percentage points**

Justification: Versioned REST, canonical OpenAPI, AsyncAPI, CLI, webhooks, Service Bus, SCIM, ITSM connectors, Confluence, Slack, SIEM export, and Azure extractor provide broad interoperability. The gap is depth and operational proof across every connector path.

Tradeoffs: Broad interoperability improves adoption but increases testing and documentation burden.

Improvement recommendations: standardize connector smoke docs and conformance tests around Authority-shaped payloads.

Fixability: **V1 fixable** for committed connectors; broader ecosystem is **V1.1/V2**.

### 19. Reliability

Score: **78**  
Weight: **2**  
Weighted impact on readiness: **1.53 percentage points**  
Weighted deficiency signal: **0.43 percentage points**

Justification: Health/readiness endpoints, retries, outbox patterns, startup validation, SQL migration behavior, release smoke, k6, and runbooks support reliability. Weaknesses include limited achieved hosted uptime evidence, real backend observability wiring, and some long-running pipeline complexity still owned by custom orchestrators.

Tradeoffs: The current orchestrator is intentional and tested; adopting Durable/ACA Jobs now would be costly and is deferred.

Improvement recommendations: capture 30-day availability rollups, wire operational metrics to alerts, and keep retry/idempotency tests expanding.

Fixability: **V1 fixable** for measurement/alerts; Durable/ACA Jobs are **V2** and not scored.

### 20. Maintainability

Score: **78**  
Weight: **2**  
Weighted impact on readiness: **1.53 percentage points**  
Weighted deficiency signal: **0.43 percentage points**

Justification: The repo is modular, heavily documented, and test-rich. Maintainability is reduced by breadth, dense documentation, multiple historical transitions, and many seams that require contributor discipline.

Tradeoffs: Aggressive modularity helps ownership but can make simple changes touch many projects.

Improvement recommendations: continue seam maps, add route-to-test links where missing, and reduce duplicated terminology.

Fixability: **V1/V1.1**.

### 21. Explainability

Score: **80**  
Weight: **2**  
Weighted impact on readiness: **1.57 percentage points**  
Weighted deficiency signal: **0.39 percentage points**

Justification: Explain endpoints, aggregate explanations, provenance, trace completeness, evidence references, and structured artifacts support explainability. The cap is that LLM explanation quality is only as trustworthy as the evidence and quality gates beneath it.

Tradeoffs: More explanation can improve confidence or create false confidence if not tied to artifacts.

Improvement recommendations: strengthen "citation vs proof" labeling and attach evidence-health indicators to explanations.

Fixability: **V1 fixable**.

### 22. Commercial Packaging Readiness

Score: **82**  
Weight: **2**  
Weighted impact on readiness: **1.61 percentage points**  
Weighted deficiency signal: **0.35 percentage points**

Justification: Team/Professional/Enterprise tiers, locked list prices, quote path, order form, marketplace alignment, CI pricing guards, and trial limits form a strong packaging base. The deferred live commerce flip is out of V1 scoring scope.

Tradeoffs: Sales-led packaging is safer before broad proof, but slower than self-serve checkout.

Improvement recommendations: make quote CTA and sales-led placeholder behavior unmistakable.

Fixability: **V1 fixable** for clarity; live un-hold is **V1.1/owner-only**.

### 23. Policy and Governance Alignment

Score: **82**  
Weight: **2**  
Weighted impact on readiness: **1.61 percentage points**  
Weighted deficiency signal: **0.35 percentage points**

Justification: Governance workflows, policy packs, pre-commit gates, segregation of duties, audit matrix, and dashboards show strong alignment. Residual risk exists around organization-level SoD and operational adoption.

Tradeoffs: Strong governance increases enterprise value but can intimidate first-session buyers.

Improvement recommendations: keep governance optional for Core Pilot and improve explainability when a gate blocks commit.

Fixability: **V1 fixable**.

### 24. Data Consistency

Score: **82**  
Weight: **2**  
Weighted impact on readiness: **1.61 percentage points**  
Weighted deficiency signal: **0.35 percentage points**

Justification: SQL Server, DbUp, greenfield boot tests, data consistency enforcement docs, RLS/topology work, and repository tests give a credible consistency posture. Remaining concerns are mostly around complex cross-table invariants and ensuring every new connector/status path updates the same Authority-shaped truth.

Tradeoffs: Relational consistency improves correctness but raises migration discipline demands.

Improvement recommendations: add connector status-sync consistency tests and keep migration verification strict.

Fixability: **V1 fixable**.

### 25. Azure Compatibility and SaaS Deployment Readiness

Score: **83**  
Weight: **2**  
Weighted impact on readiness: **1.63 percentage points**  
Weighted deficiency signal: **0.33 percentage points**

Justification: The Azure production profile is clear: Terraform, private foundation, Key Vault, SQL failover, storage, Service Bus, Entra, Container Apps, Front Door/WAF, monitoring. This is strong. The gap is live operational proof and per-environment applied evidence.

Tradeoffs: Many Terraform roots give modularity but require careful sequencing.

Improvement recommendations: keep the production preflight report current and add environment evidence snapshots.

Fixability: **V1 fixable**.

### 26. Cognitive Load

Score: **70**  
Weight: **1**  
Weighted impact on readiness: **0.69 percentage points**  
Weighted deficiency signal: **0.29 percentage points**

Justification: This is the weakest raw score. The product and repo ask users to understand runs, reviews, manifests, authority, coordinator legacy, Pilot, Operate, governance, evidence, traces, and many docs. The Core Pilot path helps, but cognitive load remains high.

Tradeoffs: Enterprise architecture tooling is inherently complex; hiding too much would reduce trust and debuggability.

Improvement recommendations: simplify first-session language and keep advanced docs out of buyer paths.

Fixability: **V1 fixable**.

### 27. Customer Self-Sufficiency

Score: **73**  
Weight: **1**  
Weighted impact on readiness: **0.72 percentage points**  
Weighted deficiency signal: **0.26 percentage points**

Justification: Docs, quickstarts, runbooks, support bundles, and troubleshooting are strong, but the breadth of the product means many buyers will still need guided help. Owner-solo sales/support flow is realistic but not yet scalable.

Tradeoffs: Guided enterprise pilots are appropriate early; self-sufficiency can grow after the proof loop is simpler.

Improvement recommendations: add symptom-first rescue flows and reduce docs required for second real run.

Fixability: **V1 fixable**.

### 28. Auditability

Score: **87**  
Weight: **2**  
Weighted impact on readiness: **1.71 percentage points**  
Weighted deficiency signal: **0.25 percentage points**

Justification: Auditability is one of the strongest areas: durable append-only audit, typed event catalog, CSV export, audit search, correlation IDs, coverage matrix, and governance/audit UI. Remaining gaps are mainly operational and future-route discipline.

Tradeoffs: Best-effort async audit avoids harming users, but missed audit writes need visible metrics.

Improvement recommendations: keep audit coverage matrix mandatory when event types grow and alert on audit write failures.

Fixability: **V1 fixable**.

### 29. Availability

Score: **74**  
Weight: **1**  
Weighted impact on readiness: **0.73 percentage points**  
Weighted deficiency signal: **0.25 percentage points**

Justification: Availability has targets, probes, health endpoints, Terraform monitoring, and hosted probe workflow. It lacks a mature achieved 30-day production availability record.

Tradeoffs: Publishing a target before achieved evidence is honest, but weaker for enterprise review.

Improvement recommendations: generate internal 30-day availability rollups and label them correctly as staging/production.

Fixability: **V1 fixable**.

### 30. Scalability

Score: **75**  
Weight: **1**  
Weighted impact on readiness: **0.74 percentage points**  
Weighted deficiency signal: **0.25 percentage points**

Justification: Container Apps, SQL scaling, optional Redis/hot-path cache, Service Bus, keyset pagination, k6, and cost controls support scalability. Redis as mandatory scaled-fleet baseline and distributed graph cache are explicitly V2 and not scored. The remaining V1 gap is proof under realistic tenant volumes.

Tradeoffs: Avoiding premature distributed cache complexity is right for V1, but horizontal scale needs more operational evidence.

Improvement recommendations: expand load baselines around critical reads and authority execution paths.

Fixability: **V1/V1.1**.

### 31. Stickiness

Score: **76**  
Weight: **1**  
Weighted impact on readiness: **0.75 percentage points**  
Weighted deficiency signal: **0.24 percentage points**

Justification: Governance, audit, policy packs, comparison, replay, graph, integrations, and tenant evidence create stickiness after first value. The weakness is getting users to return after the first package and embed the tool in recurring workflows.

Tradeoffs: Stickiness through governance is durable but slower than quick collaboration features.

Improvement recommendations: strengthen second-run prompts, workflow exports, and external ticket/documentation loops.

Fixability: **V1/V1.1**.

### 32. Performance

Score: **76**  
Weight: **1**  
Weighted impact on readiness: **0.75 percentage points**  
Weighted deficiency signal: **0.24 percentage points**

Justification: k6 smoke, named-query telemetry, performance baselines, and query allowlists exist. More proof is needed for real production tenants and large artifacts.

Tradeoffs: CI smoke protects regressions without overfitting to premature scale claims.

Improvement recommendations: add real-environment performance snapshots and grow the named-query allowlist deliberately.

Fixability: **V1 fixable**.

### 33. Observability

Score: **76**  
Weight: **1**  
Weighted impact on readiness: **0.75 percentage points**  
Weighted deficiency signal: **0.24 percentage points**

Justification: Logs, metrics, traces, agent-output metrics, startup warning counters, query metrics, health, and support bundles are present. The gap is export-path and alert verification in staging/production, especially for agent-output quality.

Tradeoffs: Emitting metrics in code is necessary but insufficient until a backend and alert paths are verified.

Improvement recommendations: wire App Insights/OTLP/Prometheus per environment and add smoke verification docs.

Fixability: **V1 fixable**.

### 34. Template and Accelerator Richness

Score: **78**  
Weight: **1**  
Weighted impact on readiness: **0.76 percentage points**  
Weighted deficiency signal: **0.22 percentage points**

Justification: Starter packs, recipes, procurement templates, pilot kits, Terraform advisory snippets, Azure extractor, and workflow recipes are good. The score is capped by uneven depth across verticals and integrations.

Tradeoffs: More templates help adoption but can become stale.

Improvement recommendations: expand only templates that support Core Pilot proof or committed integrations.

Fixability: **V1/V1.1**.

### 35. Deployability

Score: **78**  
Weight: **1**  
Weighted impact on readiness: **0.76 percentage points**  
Weighted deficiency signal: **0.22 percentage points**

Justification: Docker, release scripts, readiness checks, Terraform roots, Azure profile, migrations, and health checks support deployability. The gap is applied environment evidence and operator repetition.

Tradeoffs: Modular Terraform is IaC-friendly but not one-button simple.

Improvement recommendations: keep production profile preflight executable and publish environment-specific deployment evidence internally.

Fixability: **V1 fixable**.

### 36. Cost-Effectiveness

Score: **78**  
Weight: **1**  
Weighted impact on readiness: **0.76 percentage points**  
Weighted deficiency signal: **0.22 percentage points**

Justification: Simulator-first pilots, LLM cost estimation, monthly budget stop, FinOps Terraform knobs, and pricing/ROI logic are strong. Missing proof is mostly actual hosted COGS over time and budget alert validation.

Tradeoffs: Conservative cost controls protect margins but can constrain real-mode AI experimentation.

Improvement recommendations: add cost rollup evidence for staging/production and prove LLM budget guard behavior.

Fixability: **V1 fixable**.

### 37. Manageability

Score: **79**  
Weight: **1**  
Weighted impact on readiness: **0.77 percentage points**  
Weighted deficiency signal: **0.21 percentage points**

Justification: Configuration references, startup validation, admin endpoints, tenant topology, feature gates, support bundles, and runbooks give manageability. Complexity and owner-solo operations keep it below the top tier.

Tradeoffs: Rich configuration enables enterprise fit but raises operator burden.

Improvement recommendations: consolidate production configuration validation outputs into one operator artifact.

Fixability: **V1 fixable**.

### 38. Evolvability

Score: **80**  
Weight: **1**  
Weighted impact on readiness: **0.78 percentage points**  
Weighted deficiency signal: **0.20 percentage points**

Justification: ADRs, modular projects, interfaces, migration discipline, API versioning, and documented deferred scope support evolution. The wide surface increases change coordination risk.

Tradeoffs: Evolvability through modularity requires ongoing architecture tests and seam discipline.

Improvement recommendations: maintain dependency constraints and add more cross-seam regression tests where new integrations land.

Fixability: **V1/V1.1**.

### 39. Change Impact Clarity

Score: **81**  
Weight: **1**  
Weighted impact on readiness: **0.79 percentage points**  
Weighted deficiency signal: **0.19 percentage points**

Justification: Comparison, replay, graph, manifest deltas, audit, ADRs, and changelog support change clarity. The gap is making impact clear to non-technical sponsors.

Tradeoffs: Technical precision can obscure executive meaning.

Improvement recommendations: improve change summaries in first-value and sponsor artifacts.

Fixability: **V1 fixable**.

### 40. Accessibility

Score: **82**  
Weight: **1**  
Weighted impact on readiness: **0.80 percentage points**  
Weighted deficiency signal: **0.18 percentage points**

Justification: WCAG self-attestation, public accessibility route, axe/live E2E coverage, and mailbox routing are present. Formal VPAT is not required for now and not scored as a defect.

Tradeoffs: Self-attestation is sufficient for many early buyers but may not satisfy public-sector procurement.

Improvement recommendations: keep axe coverage current and add targeted keyboard/focus tests for new operator workflows.

Fixability: **V1 fixable**.

### 41. Supportability

Score: **82**  
Weight: **1**  
Weighted impact on readiness: **0.80 percentage points**  
Weighted deficiency signal: **0.18 percentage points**

Justification: Correlation IDs, Problem Details, support bundles, health/version endpoints, diagnostics docs, and runbooks give strong supportability. Owner-solo support and breadth keep it short of enterprise maturity.

Tradeoffs: Rich diagnostics help technical support but can overwhelm customers if exposed too early.

Improvement recommendations: improve symptom-first support flows and customer-safe support packet boundaries.

Fixability: **V1 fixable**.

### 42. Extensibility

Score: **82**  
Weight: **1**  
Weighted impact on readiness: **0.80 percentage points**  
Weighted deficiency signal: **0.18 percentage points**

Justification: Interfaces, connectors, OpenAPI, AsyncAPI, policy packs, webhooks, and modular projects support extension. Avoiding MCP in V1 core is the right boundary.

Tradeoffs: Extensibility can become sprawl unless Authority-shaped contracts remain canonical.

Improvement recommendations: keep new connectors mapped to existing payloads and application services.

Fixability: **V1/V1.1**.

### 43. Modularity

Score: **84**  
Weight: **1**  
Weighted impact on readiness: **0.82 percentage points**  
Weighted deficiency signal: **0.16 percentage points**

Justification: The codebase is strongly decomposed into API, application, persistence, decisioning, agent runtime, context ingestion, graph, retrieval, UI, worker, CLI, and test support. The gap is complexity, not lack of modularity.

Tradeoffs: High modularity can increase navigation cost.

Improvement recommendations: keep one-class-per-file and seam docs current.

Fixability: **Ongoing V1 discipline**.

### 44. Testability

Score: **86**  
Weight: **1**  
Weighted impact on readiness: **0.84 percentage points**  
Weighted deficiency signal: **0.14 percentage points**

Justification: Testability is very strong: unit, integration, SQL, property, OpenAPI snapshot, live E2E, mock E2E, k6, mutation testing, security scans, and release scripts. The main testability weakness is real-mode LLM evaluation.

Tradeoffs: Heavy test breadth increases CI cost but protects a wide product.

Improvement recommendations: add real-mode agent scenarios and avoid letting warn-only checks become permanent.

Fixability: **V1 fixable**, partly blocked on real-AOAI setup.

### 45. Azure Ecosystem Fit

Score: **86**  
Weight: **1**  
Weighted impact on readiness: **0.84 percentage points**  
Weighted deficiency signal: **0.14 percentage points**

Justification: The solution is strongly Azure-native: Entra, Azure SQL, Key Vault, Container Apps, Front Door/WAF, Service Bus, Azure OpenAI, Azure Monitor/App Insights, private endpoints, Terraform, Azure extractor, and advisory Terraform export.

Tradeoffs: Azure focus improves enterprise coherence but narrows cloud-neutral positioning.

Improvement recommendations: continue making Azure the default and document deviations explicitly.

Fixability: **Ongoing V1 discipline**.

### 46. Documentation

Score: **88**  
Weight: **1**  
Weighted impact on readiness: **0.86 percentage points**  
Weighted deficiency signal: **0.12 percentage points**

Justification: Documentation is very strong and unusually comprehensive. The weakness is volume and navigability, not absence.

Tradeoffs: Deep documentation helps operators and procurement, but it can increase cognitive load for first-time buyers and contributors.

Improvement recommendations: keep the five-doc spine strict and prune buyer paths aggressively.

Fixability: **V1 fixable**.

## Top 12 Most Important Weaknesses

1. **The product still asks buyers to believe AI output before real-output proof is operationally hard enough.** Agent schemas, traces, and metrics exist, but real-mode eval is not yet a required release signal.
2. **Commercial proof is still too explanation-dependent.** The buyer must understand manifests, evidence chains, audit rows, first-value reports, and ROI confidence instead of seeing the outcome instantly.
3. **The first-session path is good but cognitively fragile.** Run/review/manifest/package terminology and the Pilot/Operate split can still confuse new users.
4. **ROI readiness is only partly computed.** Speed, counts, and evidence chains can be computed; manual effort reduction and review-cycle improvement still depend on buyer/operator baseline capture.
5. **Default evidence construction is not yet fully dynamic.** Stub catalog evidence and absent prior-manifest hydration weaken correctness for non-greenfield real architecture work.
6. **Workflow embeddedness is broad but not uniformly proven.** Many connectors and integration paths exist or are in scope, but repeatable smoke evidence and status-sync proof need consistency.
7. **Enterprise procurement will still face assurance friction.** SOC 2 CPA, ISO, third-party pen test, and formal VPAT are not headline V1 defects, but they will block some large buyers.
8. **Operational observability emits more than it proves.** Metrics exist, but backend export and alert verification need environment evidence.
9. **Availability posture is target-heavy.** Health checks and probes exist, but achieved production/staging rollups are not yet mature enough for enterprise confidence.
10. **Documentation breadth creates cognitive drag.** The repo is well documented, but users need the product to hide most of that depth until they need it.
11. **Support and sales are still owner-centric.** This is acceptable early, but it limits enterprise concurrency and decision velocity.
12. **Scale proof is not as mature as scale architecture.** Container Apps, SQL, cache options, and k6 exist, but realistic multi-tenant load evidence remains limited.

## Top 6 Monetization Blockers

1. **Insufficient buyer-safe proof from a real tenant context.** A sponsor needs a defensible first-value package, not a demo-shaped explanation.
2. **ROI evidence incompleteness.** If baseline review-cycle hours and manual effort are missing, the value story becomes plausible but not compelling.
3. **High cognitive load before value is obvious.** If the buyer has to learn the whole system before seeing benefit, conversion slows.
4. **Sales-led quote path depends on owner follow-through.** Durable quote capture exists, but no mature CRM/team routing means decision velocity is fragile.
5. **Differentiation is not yet visually immediate.** The product's strongest moat is evidence-backed architecture workflow, but that needs to be obvious in the first package.
6. **Assurance discount remains commercially real.** Missing formal SOC 2 and third-party assurance should not reduce V1 readiness, but it pressures pricing and enterprise deal confidence.

## Top 6 Enterprise Adoption Blockers

1. **Formal assurance gaps for large buyers.** SOC 2 CPA, ISO, third-party pen-test summary, and VPAT are not V1 gates, but some reviewers will still require them.
2. **Real-output AI governance is not hard enough yet.** Warn-only quality gates and simulator-heavy corpora make risk reviewers cautious.
3. **Operational evidence is not yet enterprise-grade.** 30-day availability, alert verification, and telemetry backend proof need stronger artifacts.
4. **Workflow integration proof is uneven.** Buyers will expect Jira/ServiceNow/Confluence/Slack paths to be demonstrably reliable and supportable.
5. **Customer self-sufficiency is not yet high enough for broad rollout.** The product is learnable, but not yet low-touch at enterprise scale.
6. **Procurement pack is strong but still self-attested.** The honesty is good; the lack of external attestation remains a buying-process issue.

## Top 6 Engineering Risks

1. **LLM correctness and quality enforcement.** The highest-risk failure mode is a plausible but weak architecture recommendation passing through because real-mode gates are not enforced.
2. **Evidence fidelity for non-greenfield requests.** Prior manifest hydration and dynamic policy/catalog evidence need hardening to avoid greenfield-biased output.
3. **Connector state consistency.** Bidirectional status sync for ITSM providers must not create divergent truth between external tickets and Authority-shaped findings.
4. **Observability not reaching operators.** Metrics without backend export, dashboards, and alerts are code-level readiness, not operational readiness.
5. **Migration and tenant isolation complexity.** SQL topology, RLS optionality, database-per-tenant routing, and migrations are powerful but must stay tightly tested.
6. **Cognitive complexity causing misuse.** A user who misunderstands sample data, simulator mode, or proof completeness could overstate value or trust.

## Most Important Truth

ArchLucid is closest to being commercially ready when it behaves less like an impressive architecture platform and more like a proof machine: a buyer gives it a real architecture context, and it quickly returns a defensible package whose evidence, limits, and value are obvious without a founder narrating them.

## Top Improvement Opportunities

This list includes **2 deferred items**, **4 completed items**, and **6 fully actionable items** with Cursor prompts. Deferred items are included because they are high-leverage, but they require user/operator input before meaningful work can begin.

### 1. Harden Real-Mode Agent Output Evaluation Corpus

Status: **Completed** (2026-05-07)

**Completion summary:** Shipped `scenario-real-mode-smoke` (`tests/eval-corpus/`) with `qualityEvidence.mode: "real"` and env-based `AgentResult` JSON path (`ARCHLUCID_EVAL_CORPUS_REAL_MODE_SMOKE_AGENT_RESULT`); extended `scripts/ci/eval_agent_corpus.py` with real-mode rollup (`real_mode_quality` line + Markdown “Real-mode AgentResult slice”); `--enforce-quality-gate` unchanged for simulator-only; tests in `scripts/ci/tests/test_eval_agent_corpus_scoring.py` and `EvalCorpusQualityEvidenceShapeTests`; docs updated in `docs/library/AGENT_OUTPUT_EVALUATION.md` and `docs/library/AGENT_EVAL_CORPUS.md`.

Why it matters: AI correctness is the biggest engineering and trust risk. The current deterministic checks are valuable, but simulator-heavy evidence does not sufficiently prove live model behavior.

Expected impact: Directly improves Correctness (+4-7 pts), AI/Agent Readiness (+8-12 pts), Trustworthiness (+3-5 pts), Testability (+2-3 pts). Weighted readiness impact: **+0.4-0.8%**.

Affected qualities: Correctness, AI/Agent Readiness, Trustworthiness, Testability, Explainability.

Cursor prompt:

```text
Implement a focused real-mode agent-output evaluation corpus slice for ArchLucid.

Goal:
Add at least one real-mode scenario to the existing agent evaluation corpus so release operators can distinguish simulator-backed structural correctness from real Azure OpenAI output quality.

Start by inspecting:
- docs/library/AGENT_OUTPUT_EVALUATION.md
- docs/library/TECH_BACKLOG.md (TB-007 Gap C)
- scripts/ci/eval_agent_corpus.py
- tests/eval-corpus/
- ArchLucid.AgentRuntime.Tests/Fixtures/GoldenAgentResults/
- ArchLucid.AgentRuntime.Tests/Evaluation/

Implementation scope:
- Add a small non-sensitive real-mode scenario under tests/eval-corpus/ with qualityEvidence.mode = "real".
- Include expected finding/category/keyword checks that are meaningful for real model output without being brittle on exact wording.
- Extend scripts/ci/eval_agent_corpus.py only if needed to recognize and report real-mode scenarios separately from simulator scenarios.
- Add or update tests for the corpus script so it reports simulator and real-mode coverage distinctly.
- Update docs/library/AGENT_OUTPUT_EVALUATION.md with the exact command and interpretation rules.

Acceptance criteria:
- Existing simulator corpus behavior remains unchanged.
- The new real-mode scenario is skipped or marked not-runnable when required real-mode environment variables are absent; it must not break normal local fast tests.
- The generated markdown report clearly lists real-mode scenario count, pass/fail/skip status, and whether real-mode evidence was actually captured.
- No secrets, prompts containing customer data, or live credentials are committed.

Constraints:
- Do not add a new LLM provider or SDK.
- Do not make real Azure OpenAI required for the default PR build.
- Do not change production agent execution behavior.
- Do not weaken existing simulator fixture checks.
```
_(Prompt satisfied; Cursor implementation merged per completion summary above.)_

### 2. Add Sponsor-Safe Proof Completeness Gate to First-Value Report

Status: **Completed** (2026-05-07)

**Completion summary:** Shipped `SponsorSafeProofDisposition` and `SponsorSafeProofStatusMarkdownFormatter` in `ArchLucid.Application/Pilots/`, invoked from `FirstValueReportBuilder` immediately after the prose preface. Verdict (**Sendable** / **Needs operator review** / **Not sponsor-safe yet**) maps only from the existing buyer-safe gate and proof-package mapper; concrete gap bullets list demo scope, committed manifest/status/timing, evidence-chain pointer, audit rows, LLM-call attestation, PilotStrict posture, tenant ROI baseline posture, and simulator substitution. First-value PDF still renders the same Markdown from `BuildReportAsync`. Tests: `SponsorSafeProofStatusMarkdownFormatterTests` and extended `FirstValueReportBuilderTests` (complete proof, partial/LLM-unattested, defaulted baseline, demo tenant).

Why it matters: Monetization depends on the sponsor artifact being safe to send. If evidence is incomplete, the report should say so loudly and specifically.

Expected impact: Directly improves Proof-of-ROI Readiness (+7-10 pts), Executive Value Visibility (+4-6 pts), Trustworthiness (+3-5 pts), Marketability (+2-4 pts). Weighted readiness impact: **+0.5-0.9%**.

Affected qualities: Proof-of-ROI Readiness, Executive Value Visibility, Trustworthiness, Marketability, Decision Velocity.

Cursor prompt:

```text
Strengthen ArchLucid's first-value report so sponsor-safe proof completeness is explicit and hard to miss.

Start by inspecting:
- ArchLucid.Application/Pilots/FirstValueReportBuilder.cs
- ArchLucid.Application.Tests/Pilots/
- docs/library/PILOT_ROI_MODEL.md
- docs/EXECUTIVE_SPONSOR_BRIEF.md
- ArchLucid.Api/Controllers/Pilots/PilotsController.cs

Implementation scope:
- Add a concise "Sponsor-safe proof status" section near the top of the generated first-value Markdown.
- Reuse existing proof/evidence completeness services where possible; do not invent a parallel scoring model.
- The section should classify the report as Sendable, Needs operator review, or Not sponsor-safe yet.
- Include concrete missing items, such as tenant baseline missing, demo tenant warning, missing evidence-chain pointer, missing audit-row count, missing LLM-call count, or no committed manifest.
- Ensure the PDF projection receives the same proof-status content if it renders from the same Markdown source.

Acceptance criteria:
- Unit tests cover complete proof, partial proof, demo tenant, and missing baseline cases.
- Existing first-value report fields and API routes remain backward compatible.
- Demo/sample data is never presented as customer ROI proof.
- The language is blunt and buyer-safe, not optimistic.

Constraints:
- Do not change pricing, billing, or quote-request flow.
- Do not add external dependencies.
- Do not require operators to hand-edit reports.
```
_(Prompt satisfied; Cursor implementation merged per completion summary above.)_

### 3. Hydrate Prior Manifest Evidence for Follow-On Runs

Status: **Completed** (2026-05-07)

**Completion summary:** Shipped scoped prior-manifest hydration via `IUnifiedGoldenManifestReader` injected into `DefaultEvidenceBuilder`; bounded mapping in `PriorManifestEvidenceMapper` (version, summary, sorted service/datastore names, merged required controls — no full manifest dump). Missing-in-scope requests keep `PriorManifest` null with an updated `PriorManifestUnavailable` greenfield note. Tests: `DefaultEvidenceBuilderTests`; orchestrator audit tests updated with strict manifest-reader mocks.

Why it matters: Real architecture work is rarely greenfield. If a request references a prior manifest, treating it as unavailable weakens correctness, change clarity, and trust.

Expected impact: Directly improves Correctness (+5-8 pts), Change Impact Clarity (+5-7 pts), Traceability (+2-4 pts), Trustworthiness (+2-4 pts). Weighted readiness impact: **+0.4-0.7%**.

Affected qualities: Correctness, Traceability, Change Impact Clarity, Trustworthiness, Workflow Embeddedness.

Cursor prompt:

```text
Implement the executable first slice of prior-manifest hydration for ArchLucid evidence packages.

Start by inspecting:
- ArchLucid.Application/Evidence/DefaultEvidenceBuilder.cs
- ArchLucid.Application/Evidence/IEvidenceBuilder.cs
- ArchLucid.Contracts/Agents/*Evidence*
- ArchLucid.Application.Tests/
- manifest repository interfaces in ArchLucid.Application and ArchLucid.Persistence
- docs/library/API_CONTRACTS.md sections for create run and prior manifest fields

Implementation scope:
- Replace the hardcoded null prior-manifest path in DefaultEvidenceBuilder with a small injectable reader/adapter that can resolve a prior manifest by version when one is supplied.
- If the necessary repository is not available in this layer, create a narrow interface in the application layer and register the existing persistence implementation through composition.
- Populate PriorManifestEvidence with stable identifiers and summary fields only; do not dump entire manifest payloads into the agent evidence package.
- Preserve the existing explicit note when a requested prior manifest cannot be found.

Acceptance criteria:
- Unit tests prove that a request with PriorManifestVersion hydrates prior evidence when found.
- Unit tests prove that a missing prior manifest produces the existing "treat as greenfield" note.
- Existing greenfield behavior remains unchanged.
- No tenant/workspace/project scope bypass is introduced.

Constraints:
- Do not introduce EF or a new ORM.
- Do not add a new database table.
- Do not change public API request/response contracts unless a narrow optional field is already supported.
- Use existing repository and scope patterns.
```
_(Prompt satisfied; Cursor implementation merged per completion summary above.)_

### 4. Standardize Connector Smoke Evidence for Jira, ServiceNow, Confluence, and Slack

Status: **Completed**

Why it matters: Workflow embeddedness is a buyer adoption issue. The V1 connectors need one consistent proof pattern so buyers and operators can see what works.

Expected impact: Directly improves Workflow Embeddedness (+7-10 pts), Interoperability (+4-6 pts), Adoption Friction (+2-4 pts), Trustworthiness (+2-3 pts). Weighted readiness impact: **+0.4-0.7%**.

Affected qualities: Workflow Embeddedness, Interoperability, Adoption Friction, Customer Self-Sufficiency.

Cursor prompt:

```text
Create a consistent connector smoke evidence pattern for ArchLucid's V1 first-party connectors.

Start by inspecting:
- docs/integrations/smoke/
- docs/integrations/CONNECTOR_SMOKE_INDEX.md
- docs/library/V1_SCOPE.md sections 2.13-2.15
- docs/go-to-market/INTEGRATION_CATALOG.md
- ArchLucid.Application.Tests/Integrations/
- ArchLucid.Decisioning.Tests/Alerts/Delivery/
- ArchLucid.Api/Controllers/Integrations/

Implementation scope:
- Ensure Jira, ServiceNow, Confluence, and Slack each have a smoke document with the same structure: purpose, prerequisites, auth/secret pattern, test payload, expected ArchLucid audit events, expected external artifact, rollback/cleanup, and troubleshooting.
- Add or update a connector smoke index that maps each smoke document to the corresponding test class or conformance test.
- If a connector has tests but no smoke doc, add the doc.
- If a smoke doc exists but lacks audit/event expectations, update it.

Acceptance criteria:
- All four V1 connectors have comparable smoke docs.
- Each smoke doc references Authority-shaped payload expectations and avoids creating a connector-specific schema.
- The index clearly states which smoke checks are automated, manual, mocked, or live-provider dependent.
- No secrets, test credentials, or tenant-specific values are committed.

Constraints:
- Do not change connector runtime behavior unless a doc/test mismatch reveals an obvious bug.
- Do not add a new connector.
- Do not move deferred OAuth/App Directory/Marketplace listing work into V1.
```

_(Connector smoke docs aligned to a single section template; `CONNECTOR_SMOKE_INDEX.md` maps each recipe to conformance tests and labels automated vs live-provider evidence per the acceptance criteria.)_

### 5. Wire Agent-Output Metrics Export Verification

Status: **Completed** (2026-05-07)

**Completion summary:** Shipped `scripts/report_observability_export_readiness.py` (Markdown report; offline; optional process-env overlay with values never printed; `--no-process-environment` for committed JSON only; `--strict-exit-code` optional). Covers **ArchLucid.Api** (merge order matches `Program.cs`: base, environment, Advanced, SaaS) and **ArchLucid.Worker** (base, environment); evaluates Application Insights connection string, OTLP endpoint, and Prometheus; dedicated **agent-output** metric names section; post-deploy smoke and links to `infra/terraform-monitoring/README.md`, `infra/terraform-otel-collector/README.md`, and `infra/prometheus/archlucid-alerts.yml` (no new alert group). Docs: `docs/library/OBSERVABILITY.md`, `docs/library/AGENT_OUTPUT_EVALUATION.md`, `docs/library/TECH_BACKLOG.md` (TB-004). Tests: `scripts/ci/tests/test_report_observability_export_readiness.py`; CI step in `.github/workflows/ci.yml`.

Why it matters: Observability is only useful when operators can see it. The product emits agent-output metrics, but release confidence needs proof that metrics reach App Insights, OTLP, or Prometheus.

Expected impact: Directly improves Observability (+8-12 pts), AI/Agent Readiness (+3-5 pts), Reliability (+2-4 pts), Supportability (+2-3 pts). Weighted readiness impact: **+0.3-0.6%**.

Affected qualities: Observability, AI/Agent Readiness, Reliability, Supportability.

Cursor prompt:

```text
Add a repo-only verification path for ArchLucid agent-output metric export readiness.

Start by inspecting:
- docs/library/OBSERVABILITY.md
- docs/library/AGENT_OUTPUT_EVALUATION.md
- docs/library/TECH_BACKLOG.md (TB-004)
- ArchLucid.Core/Diagnostics/ArchLucidInstrumentation.cs
- ArchLucid.Host.Composition or Host.Core observability wiring
- infra/terraform-monitoring/
- infra/terraform-otel-collector/

Implementation scope:
- Add or update a script that emits a markdown readiness report for observability export configuration without requiring Azure login.
- The report should state whether the API and Worker have at least one configured export path: Application Insights connection string, OTLP endpoint, or Prometheus enabled.
- Include a specific section for agent-output metrics: structural completeness, semantic score, quality gate total, parse failures.
- Add documentation showing the post-deploy smoke: run one execute, then verify metric names in the selected backend.
- If Terraform alert stubs already exist, link them; if not, add minimal Terraform alert examples only if they fit existing module patterns.

Acceptance criteria:
- The readiness report can be run locally with no secrets and no network.
- Missing export config is reported as a warning with exact config keys to set.
- API and Worker paths are both considered.
- Existing observability behavior is unchanged.

Constraints:
- Do not require Azure CLI login.
- Do not create live Azure resources.
- Do not add a new telemetry vendor.
- Do not hardcode secrets or environment-specific resource names.
```
_(Prompt satisfied; Cursor implementation merged per completion summary above.)_

### 6. Reduce Core Pilot Cognitive Load in Product Copy

Status: **Fully actionable now**

Why it matters: High cognitive load is the lowest raw score. Buyers should not need to understand internal terms before seeing value.

Expected impact: Directly improves Cognitive Load (+8-12 pts), Adoption Friction (+3-5 pts), Usability (+3-5 pts), Time-to-Value (+2-3 pts). Weighted readiness impact: **+0.4-0.7%**.

Affected qualities: Cognitive Load, Adoption Friction, Usability, Time-to-Value.

Cursor prompt:

```text
Tighten ArchLucid Core Pilot wording so first-time buyers see one consistent mental model.

Start by inspecting:
- docs/START_HERE.md
- docs/CORE_PILOT.md
- docs/EXECUTIVE_SPONSOR_BRIEF.md
- archlucid-ui/src/lib/core-pilot-first-review-copy.test.ts
- archlucid-ui/src/components and pages that render Home/New Run/Run Detail/Core Pilot copy

Implementation scope:
- Preserve technical API terms where required, but make buyer-facing copy consistently lead with "architecture review" and "review package".
- Use "run" as support metadata only where necessary.
- Ensure the four-step path is consistently: create architecture review, let pipeline run, finalize, review package.
- Add/update tests that lock buyer-facing copy for the Core Pilot rail.
- Update docs only where they are part of the buyer/evaluator spine.

Acceptance criteria:
- First-session docs and UI copy use the same four-step phrasing.
- Tests protect against reverting to internal-only language in the buyer rail.
- API docs can still use run/manifest terms where technically necessary.
- No route names, API contracts, or stored model names are changed.

Constraints:
- Do not rename database tables, API routes, DTOs, or C# symbols.
- Do not edit archived assessments or old archived docs.
- Do not expand the first-session checklist with advanced Operate features.
```

### 7. Add Connector Status-Sync Consistency Tests

Status: **Fully actionable now**

Why it matters: Bidirectional ITSM sync is now a V1 obligation. Incorrect status mapping would create data consistency and trust failures.

Expected impact: Directly improves Data Consistency (+6-9 pts), Correctness (+3-5 pts), Workflow Embeddedness (+3-5 pts), Trustworthiness (+2-3 pts). Weighted readiness impact: **+0.3-0.6%**.

Affected qualities: Data Consistency, Correctness, Workflow Embeddedness, Trustworthiness.

Cursor prompt:

```text
Add focused consistency tests for Jira and ServiceNow inbound status sync to ArchLucid findings.

Start by inspecting:
- ArchLucid.Api/Controllers/Integrations/ItsmInboundWebhooksController.cs
- ArchLucid.Application/Integrations/Itsm/
- ArchLucid.Application.Tests/Integrations/Itsm/
- docs/library/V1_SCOPE.md section 2.13
- docs/PENDING_QUESTIONS.md resolved 2026-05-06 ITSM bidirectional sync

Implementation scope:
- Add tests for default Jira mappings: To Do -> Open, In Progress -> InProgress, Done -> Resolved.
- Add tests for default ServiceNow mappings: New/In Progress -> Open/InProgress, Resolved/Closed -> Resolved.
- Cover unknown status handling: it should be skipped, warned, or mapped according to existing implementation rules, but the behavior must be explicit and tested.
- Verify correlation rows are required before inbound status updates mutate ArchLucid state.
- Verify tenant scope is respected.

Acceptance criteria:
- Tests fail if an inbound webhook can update a finding without a valid persisted correlation.
- Tests fail if default mappings regress.
- Tests assert the durable audit event or log/metric behavior expected for success and skipped cases if already implemented.
- No live Jira or ServiceNow network calls are required.

Constraints:
- Do not add comments/attachments/custom-field sync.
- Do not introduce OAuth for V1.
- Do not widen the status-only V1 scope.
```

### 8. Add 30-Day Availability Rollup Artifact

Status: **Fully actionable now**

Why it matters: Availability has targets and probes but limited achieved evidence. Enterprise reviewers need labeled operational proof.

Expected impact: Directly improves Availability (+8-12 pts), Reliability (+3-5 pts), Procurement Readiness (+2-4 pts), Trustworthiness (+2-3 pts). Weighted readiness impact: **+0.2-0.5%**.

Affected qualities: Availability, Reliability, Procurement Readiness, Trustworthiness.

Cursor prompt:

```text
Create a labeled 30-day availability rollup artifact for ArchLucid hosted probes.

Start by inspecting:
- docs/runbooks/HOSTED_AVAILABILITY_ROLLUP.md
- docs/go-to-market/TRUST_CENTER.md
- docs/library/API_SLOS.md
- docs/library/SLA_TARGETS.md
- .github/workflows/hosted-saas-probe.yml
- any scripts that collect release or hosted probe evidence

Implementation scope:
- Add a script that can read hosted probe result artifacts or a simple input JSON/CSV and produce a markdown rollup.
- The rollup must clearly label environment: staging, production, or unknown.
- The rollup must distinguish target SLO from achieved probe result.
- Include uptime percentage, total probes, failed probes, time window, and caveats.
- Add docs showing where to store the generated artifact and when it is buyer-safe vs internal-only.

Acceptance criteria:
- The script works with a small fixture checked into tests/fixtures or scripts/fixtures.
- Tests cover all-green, partial-failure, and insufficient-data cases.
- Output never claims a contractual SLA.
- Trust Center docs link to the runbook without implying achieved production SLO unless data exists.

Constraints:
- Do not call GitHub APIs or Azure APIs from the default script path.
- Do not publish staging results as production evidence.
- Do not change SLA targets.
```

### 9. Build a Production Configuration Evidence Report

Status: **Fully actionable now**

Why it matters: Azure/SaaS readiness depends on deployment configuration. Startup rules are strong, but operators need one artifact showing production safety posture.

Expected impact: Directly improves Deployability (+5-7 pts), Manageability (+4-6 pts), Security (+2-4 pts), Azure Compatibility and SaaS Deployment Readiness (+2-4 pts). Weighted readiness impact: **+0.2-0.5%**.

Affected qualities: Deployability, Manageability, Security, Azure Compatibility and SaaS Deployment Readiness.

Cursor prompt:

```text
Create or strengthen ArchLucid's production configuration evidence report.

Start by inspecting:
- scripts/Emit-ProductionProfilePreflightMarkdown.ps1
- docs/library/AZURE_PRODUCTION_PROFILE.md
- ArchLucid.Host.Core/Startup/Validation/Rules/
- ArchLucid.Api/appsettings*.json
- ArchLucid.Worker/appsettings*.json
- infra/terraform-container-apps/
- infra/terraform-private/
- infra/terraform-keyvault/

Implementation scope:
- Ensure the preflight report covers API and Worker production-critical settings: auth mode, JWT requirement, API key posture, SQL connection presence, Key Vault references, prompt redaction warning, observability export path, storage/network posture, and billing production safety rules where relevant.
- Output a markdown report with Pass/Warning/Fail rows and exact config keys.
- Add tests or fixture validation for the report generator if it is scriptable.
- Link the report from release evidence docs.

Acceptance criteria:
- Running the script without secrets produces a useful report from repo configuration and environment variables.
- Production-dangerous settings are marked Fail, not Warning.
- Staging-only or deferred items are labeled correctly.
- The report does not print secret values.

Constraints:
- Do not weaken startup validation.
- Do not introduce live Azure dependencies.
- Do not add production API keys as an acceptable path.
```

### 10. Improve Context Ingestion Delta Semantics

Status: **Fully actionable now**

Why it matters: Better deltas make repeat reviews more trustworthy and reduce manual review effort.

Expected impact: Directly improves Correctness (+3-5 pts), Change Impact Clarity (+4-6 pts), Maintainability (+2-4 pts), Workflow Embeddedness (+2-3 pts). Weighted readiness impact: **+0.2-0.5%**.

Affected qualities: Correctness, Change Impact Clarity, Maintainability, Evolvability.

Cursor prompt:

```text
Implement the first focused slice of meaningful delta semantics in ArchLucid context ingestion.

Start by inspecting:
- docs/library/TECH_BACKLOG.md (TB-008)
- ArchLucid.ContextIngestion/Infrastructure/ContextConnectorPipeline.cs
- ArchLucid.ContextIngestion/Services/DefaultConnectorPipelineOrchestrator.cs
- ArchLucid.ContextIngestion/Services/ContextIngestionService.cs
- ArchLucid.ContextIngestion.Tests/

Implementation scope:
- Add an IConnectorDeltaComputer abstraction with a default implementation.
- Use set-diff by stable SourceId where connector outputs support it.
- Replace literal-string or shallow delta logic only for one or two high-value connector paths first.
- Add tests for added, removed, unchanged, and modified canonical items.
- Keep the orchestrator's existing fetch/normalize/delta ordering.

Acceptance criteria:
- Existing context ingestion tests continue to pass.
- New tests prove stable-ID deltas are deterministic.
- Delta summary output is more meaningful than raw string comparison for the selected connector path.
- No public API contract changes are required.

Constraints:
- Do not rewrite the entire ingestion pipeline.
- Do not add external diff libraries.
- Do not change connector fetch behavior or introduce parallel fault isolation unless already isolated in existing patterns.
```

### 11. DEFERRED Promote Real LLM Gate to Required Branch Protection

Reason it is deferred: This requires operational access and owner-controlled configuration outside the repo: Azure OpenAI deployment provisioning, protected GitHub environment secrets or federated identity, and branch-protection settings. Meaningful implementation cannot begin from repo-only materials.

Specific information needed later:

- Confirmation that the reference Azure OpenAI deployment exists.
- The intended protected GitHub environment name.
- Whether authentication will use a secret key or federated identity.
- Permission to update branch protection / required status checks.

Affected qualities: AI/Agent Readiness, Correctness, Trustworthiness, Testability.

Expected impact if completed later: AI/Agent Readiness (+6-10 pts), Correctness (+3-5 pts), Trustworthiness (+2-4 pts). Weighted readiness impact: **+0.3-0.6%**.

### 12. DEFERRED Decide Agent Quality Gate Hard-Fail Semantics

Reason it is deferred: The code can enforce reject outcomes, but the product decision is unresolved: should a rejected agent-output quality score block the user's run, block only release promotion, or remain telemetry-only? That decision changes user-facing behavior and error contracts.

Specific information needed later:

- Whether rejected agent quality should block pilot user runs.
- If blocking user runs, the desired API Problem Details type/title/support hint.
- Which environments should enforce the gate: local, staging, production, tagged release only, or all SaaS.
- Initial structural and semantic reject thresholds.

Affected qualities: AI/Agent Readiness, Correctness, Trustworthiness, Reliability.

Expected impact if completed later: AI/Agent Readiness (+5-8 pts), Correctness (+2-4 pts), Trustworthiness (+2-4 pts). Weighted readiness impact: **+0.2-0.5%**.

## Pending Questions for Later

### Promote Real LLM Gate to Required Branch Protection

- Has the reference Azure OpenAI deployment been provisioned?
- Which GitHub protected environment should hold the real-mode credential or federated identity?
- Should the real-LLM gate be required for all PRs, release branches only, or tagged release candidates?
- Who has permission to update branch protection?

### Decide Agent Quality Gate Hard-Fail Semantics

- Should low-quality agent output block the user run, block release promotion only, or remain telemetry-only?
- What user-facing Problem Details contract should appear if a run is blocked?
- What are the first conservative reject thresholds for structural and semantic scores?
- Should enforcement differ between simulator and real model execution?

### Live Commerce Cutover

- What date/window should be used for Stripe production un-hold?
- Who confirms production webhook secret rotation and rollback readiness?
- When should Marketplace publication follow Stripe validation?
- Should staging remain permanently Stripe TEST-mode after production un-hold?

### Procurement Assurance

- Has a buyer created a binding SOC 2 requirement before the ARR trigger?
- Is any named buyer requiring VPAT rather than WCAG self-attestation?
- Is any current buyer blocked on third-party pen-test evidence despite the V2 posture?

### Connector Live Smoke

- Which provider tenants are available for live Jira, ServiceNow, Confluence, and Slack smoke validation?
- Which smoke outputs can be stored as internal release evidence without exposing customer data?
- Who owns rotation of connector test credentials?

### Availability Evidence

- Which hosted endpoint is authoritative for production availability rollup?
- Should staging probe rollups remain internal-only?
- What minimum data window is acceptable before sharing achieved uptime externally?
