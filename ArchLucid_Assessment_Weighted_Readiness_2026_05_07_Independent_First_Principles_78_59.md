# ArchLucid Assessment – Weighted Readiness 78.59%

## Executive Summary

### Overall Readiness

**(A) Current headline readiness: 78.59%.** ArchLucid is materially beyond prototype state: the core Pilot path is defined, implemented across API/CLI/UI concepts, protected by a broad CI and contract suite, and supported by unusually strong documentation, procurement, trust, and Azure deployment material. The score is not higher because the product still carries commercial proof gaps, some internally inconsistent scope language, and limited production-operated evidence compared with the breadth of the claims.

**Deferred Scope Uncertainty:** None. I located the current V1 scope and deferred-scope source material in `docs/library/V1_SCOPE.md` and `docs/library/V1_DEFERRED.md`, including explicit deferrals for live commerce un-hold, public reference customers, signed design partner, CPA SOC 2, third-party pen test, PGP key drop, MCP, Redis elevation, and Durable Task / Container Apps Jobs.

### Commercial Picture

The commercial story is credible but not yet frictionless. The clearest sellable claim is narrow and strong: move from architecture request to reviewable package faster, with better evidence. Pricing, packaging, quote intake, ROI model, first-value report, sponsor brief, and procurement pack are present. The weak point is buyer proof: the product can show computed run deltas, but still relies on a guided sales motion, self-attested proof surfaces, placeholders in some commerce paths, and limited production-market evidence. Absence of signed design partner, public reference customer, or live Stripe / Marketplace publication is explicitly out of current headline scoring, but it remains real market-motion friction.

### Enterprise Picture

**(B) Procurement / market-motion realism: 66/100 informational, weight 0 in the headline score.** Enterprise review will like the Azure-native posture, private endpoint story, append-only audit catalog, DPA / CAIQ / SIG / subprocessor material, SCIM, RBAC, and procurement pack automation. Procurement will still press on CPA SOC 2, third-party pen-test evidence, exact support/SLA commitments, and whether the hosted SaaS has enough production operating history. Those are not deducted from the headline readiness where explicitly deferred, but they are real buying-cycle drag.

### Engineering Picture

The engineering base is relatively strong: .NET 10, SQL Server with DbUp/Dapper, OpenAPI snapshot discipline, extensive xUnit/Vitest/Playwright/k6 coverage, Terraform roots, startup validation, health/readiness, correlation IDs, audit, metrics, and runbooks. The main engineering risks are consistency and proof, not absence of architecture. Several docs describe capabilities with slightly different commitments, some CI checks remain warn-only, load/soak evidence is mostly CI/staging-shaped, and real LLM execution evidence is optional rather than a hard release artifact.

## Weighted Quality Assessment

### 1. Marketability

- **Score:** 75
- **Weight:** 8
- **Weighted impact on readiness:** 6.00 / 102 weighted points
- **Weighted deficiency signal:** 2.00 weighted points missing
- **Justification:** The sponsor story is crisp, buyer-safe, and grounded in a concrete Pilot outcome. Pricing and packaging exist. The weakness is external proof: market claims are still mostly internally evidenced, not reference-backed or production-demand-backed.
- **Tradeoffs:** The narrow Pilot claim avoids over-promising, but also makes the product look like a specialist architecture-review accelerator rather than a broad platform.
- **Improvement recommendations:** Tighten buyer-facing proof artifacts around one repeatable first-value package; remove or gate placeholder commercial surfaces; keep public claims tied to generated evidence.
- **Disposition:** Fixable in V1 for messaging and evidence; reference/customer proof is deferred or owner-driven.

### 2. Adoption Friction

- **Score:** 76
- **Weight:** 6
- **Weighted impact on readiness:** 4.56 / 102 weighted points
- **Weighted deficiency signal:** 1.44 weighted points missing
- **Justification:** The Core Pilot path is intentionally simple, with a four-step buyer journey and sample review. Friction remains because the repo and docs expose a large surface area, and several buyer/operator paths still require careful routing to avoid overload.
- **Tradeoffs:** Breadth helps enterprise evaluators, but too much visible depth can slow a first pilot.
- **Improvement recommendations:** Make the first-value path even more dominant in UI copy, docs, and generated artifacts; keep Operate paths secondary until a committed review exists.
- **Disposition:** Fixable in V1.

### 3. Proof-of-ROI Readiness

- **Score:** 73
- **Weight:** 5
- **Weighted impact on readiness:** 3.65 / 102 weighted points
- **Weighted deficiency signal:** 1.35 weighted points missing
- **Justification:** The ROI model is thoughtful and several metrics are computed from persisted data: time to commit, findings, LLM calls, audit rows, and evidence-chain pointers. But some of the most commercially important metrics remain operator-filled or qualitative.
- **Tradeoffs:** Honest partial automation is better than fake precision, but buyers want quantified before/after deltas.
- **Improvement recommendations:** Convert proof sendability into a generated pass/fail artifact with explicit missing fields and evidence links.
- **Disposition:** Partially fixable in V1; customer-specific baselines require buyer/operator input.

### 4. Time-to-Value

- **Score:** 83
- **Weight:** 7
- **Weighted impact on readiness:** 5.81 / 102 weighted points
- **Weighted deficiency signal:** 1.19 weighted points missing
- **Justification:** The product has a well-defined first-session path, simulator mode, sample review, CLI shortcuts, health checks, and artifact outputs. This is one of the stronger areas.
- **Tradeoffs:** Simulator-first proves shape quickly, but real customer trust depends on a second run with actual inputs.
- **Improvement recommendations:** Strengthen the second-run path and make the “replace demo before publishing” gate unavoidable in generated sponsor artifacts.
- **Disposition:** Fixable in V1.

### 5. Differentiability

- **Score:** 72
- **Weight:** 4
- **Weighted impact on readiness:** 2.88 / 102 weighted points
- **Weighted deficiency signal:** 1.12 weighted points missing
- **Justification:** The authority chain, manifest, traceability, governance evidence, and Azure extractor posture are differentiated. The story still risks sounding like “AI documentation generator plus governance” unless evidence chains and workflow deltas are shown aggressively.
- **Tradeoffs:** The product’s strongest differentiation is operational evidence, not generic AI narrative.
- **Improvement recommendations:** Reposition demos around evidence-chain walkthroughs, not just generated reports.
- **Disposition:** Fixable in V1.

### 6. Workflow Embeddedness

- **Score:** 72
- **Weight:** 3
- **Weighted impact on readiness:** 2.16 / 102 weighted points
- **Weighted deficiency signal:** 0.84 weighted points missing
- **Justification:** REST, CLI, webhooks, Service Bus, SCIM, Teams, Slack, Jira, ServiceNow, Confluence, Azure DevOps patterns, and procurement packs show strong integration intent. The blocker is consistency and maturity of connector commitments.
- **Tradeoffs:** First-party connectors increase embeddedness but also create support obligations.
- **Improvement recommendations:** Align connector scope docs, smoke tests, API contracts, and conformance tests around one canonical status.
- **Disposition:** Fixable in V1 for committed connectors.

### 7. Executive Value Visibility

- **Score:** 80
- **Weight:** 4
- **Weighted impact on readiness:** 3.20 / 102 weighted points
- **Weighted deficiency signal:** 0.80 weighted points missing
- **Justification:** Sponsor brief, first-value report, PDF endpoint, ROI model, and value-report concepts give executives something to consume. The missing piece is hard proof quality under real tenant data.
- **Tradeoffs:** Keeping claims conservative improves trust but can soften urgency.
- **Improvement recommendations:** Make every sponsor artifact show evidence completeness and confidence tier.
- **Disposition:** Fixable in V1.

### 8. Correctness

- **Score:** 80
- **Weight:** 4
- **Weighted impact on readiness:** 3.20 / 102 weighted points
- **Weighted deficiency signal:** 0.80 weighted points missing
- **Justification:** OpenAPI snapshots, schema validation, tests, idempotent commit behavior, conflict contracts, data consistency probes, and generated API types are strong signals. Remaining risk is correctness of AI-generated recommendations and connector/status-sync behavior in real production data.
- **Tradeoffs:** Simulator determinism improves testability but does not prove real model behavior.
- **Improvement recommendations:** Add release evidence for real LLM runs and connector fake-provider conformance at the API edge.
- **Disposition:** Fixable in V1 for harnesses; real-world validation continues post-release.

### 9. Usability

- **Score:** 77
- **Weight:** 3
- **Weighted impact on readiness:** 2.31 / 102 weighted points
- **Weighted deficiency signal:** 0.69 weighted points missing
- **Justification:** The product has a guided Core Pilot, progressive disclosure, sample review, and operator quick starts. The cognitive burden remains high because users must understand runs, manifests, artifacts, evidence, governance, and tiers.
- **Tradeoffs:** Progressive disclosure helps, but terminology still leaks implementation concepts.
- **Improvement recommendations:** Audit first-run screens and docs for “architecture review package” language before exposing deeper “run” semantics.
- **Disposition:** Fixable in V1.

### 10. Trustworthiness

- **Score:** 78
- **Weight:** 3
- **Weighted impact on readiness:** 2.34 / 102 weighted points
- **Weighted deficiency signal:** 0.66 weighted points missing
- **Justification:** Trust improves through audit, evidence chains, citations, self-assessment, security docs, and conservative AI claims. It is weakened by self-attested assurance, optional real-LLM evidence, and some scope inconsistencies.
- **Tradeoffs:** Honest disclaimers reduce legal risk but expose maturity gaps.
- **Improvement recommendations:** Make evidence completeness and generated-output confidence visible in every export.
- **Disposition:** Fixable in V1 for product trust; CPA SOC 2 and external pen test are not headline-scored.

### 11. Decision Velocity

- **Score:** 72
- **Weight:** 2
- **Weighted impact on readiness:** 1.44 / 102 weighted points
- **Weighted deficiency signal:** 0.56 weighted points missing
- **Justification:** Pricing and order-form materials exist, but self-serve transactability is deferred and enterprise decisions still need sales/legal handling.
- **Tradeoffs:** Sales-led pilots are credible for V1, but slower than product-led conversion.
- **Improvement recommendations:** Strengthen quote-request follow-up artifacts and buyer-safe proof bundles.
- **Disposition:** Partially fixable in V1; live commerce un-hold is deferred.

### 12. Architectural Integrity

- **Score:** 82
- **Weight:** 3
- **Weighted impact on readiness:** 2.46 / 102 weighted points
- **Weighted deficiency signal:** 0.54 weighted points missing
- **Justification:** Boundaries are coherent: API, application, persistence, worker, UI, CLI, SQL, optional Azure services. The architecture is strongly documented and test-indexed. The main issue is breadth and the possibility of doc/code commitment drift.
- **Tradeoffs:** Modular breadth supports enterprise use cases but increases maintenance cost.
- **Improvement recommendations:** Keep V1 scope and integration catalog synchronized by CI.
- **Disposition:** Fixable in V1.

### 13. Commercial Packaging Readiness

- **Score:** 76
- **Weight:** 2
- **Weighted impact on readiness:** 1.52 / 102 weighted points
- **Weighted deficiency signal:** 0.48 weighted points missing
- **Justification:** Tiers, pricing, quote path, order form, trial rules, and billing safety rules are present. Placeholder Stripe checkout URL and deferred live commerce keep it from being fully ready.
- **Tradeoffs:** Sales-led quote flow is enough for V1 but less scalable.
- **Improvement recommendations:** Add a hard public-pricing placeholder guard and make quote-request routing evidence auditable.
- **Disposition:** Fixable in V1 except owner-only live commerce.

### 14. Security

- **Score:** 84
- **Weight:** 3
- **Weighted impact on readiness:** 2.52 / 102 weighted points
- **Weighted deficiency signal:** 0.48 weighted points missing
- **Justification:** Entra/JWT, API keys fail-closed, RBAC, private endpoint posture, Key Vault, gitleaks, ZAP, Schemathesis, RLS/database-per-tenant material, prompt redaction, and threat docs are strong. Gaps are mostly assurance maturity and production proof.
- **Tradeoffs:** Strong controls increase setup burden.
- **Improvement recommendations:** Tighten production evidence collection and keep assurance claims self-attested until external reports exist.
- **Disposition:** Fixable in V1 for product controls; external attestations deferred.

### 15. AI/Agent Readiness

- **Score:** 76
- **Weight:** 2
- **Weighted impact on readiness:** 1.52 / 102 weighted points
- **Weighted deficiency signal:** 0.48 weighted points missing
- **Justification:** The system has simulator mode, real Azure OpenAI mode, prompt versions, schema validation, quality metrics, token/cost accounting, trace capture, and faithfulness fallback. Default rejection thresholds are warn-first, and reference evaluation is off by default.
- **Tradeoffs:** Warn-first keeps pilots moving but tolerates weak model output unless configured stricter.
- **Improvement recommendations:** Add a release evidence artifact that captures real-LLM quality, parse failures, token cost, and evidence completeness.
- **Disposition:** Fixable in V1 for evidence and gates.

### 16. Procurement Readiness

- **Score:** 77
- **Weight:** 2
- **Weighted impact on readiness:** 1.54 / 102 weighted points
- **Weighted deficiency signal:** 0.46 weighted points missing
- **Justification:** Procurement pack, DPA, subprocessors, trust center, CAIQ/SIG, incident comms, SOC roadmap, and pack build validation are strong. CPA SOC 2, ISO, and third-party pen test are not headline gates, but procurement will ask.
- **Tradeoffs:** Honest self-attestation avoids false claims but increases buyer diligence.
- **Improvement recommendations:** Keep procurement response accelerator precise and add “what is self-attested vs externally attested” checks.
- **Disposition:** V1 fixable for artifacts; external assurance deferred/informational.

### 17. Interoperability

- **Score:** 78
- **Weight:** 2
- **Weighted impact on readiness:** 1.56 / 102 weighted points
- **Weighted deficiency signal:** 0.44 weighted points missing
- **Justification:** REST, OpenAPI, AsyncAPI, .NET client, CLI, webhooks, Service Bus, SCIM, Teams/Slack/ITSM/Confluence concepts, Azure extractor, and Terraform export are strong. Planned/import surfaces remain uneven.
- **Tradeoffs:** A broad integration catalog can overstate readiness if statuses drift.
- **Improvement recommendations:** Enforce one canonical integration status matrix.
- **Disposition:** Fixable in V1 for committed surfaces.

### 18. Reliability

- **Score:** 78
- **Weight:** 2
- **Weighted impact on readiness:** 1.56 / 102 weighted points
- **Weighted deficiency signal:** 0.44 weighted points missing
- **Justification:** Health/readiness, idempotent commit, outbox concepts, retries, startup validation, SQL boot tests, k6 smoke, and runbooks are positive. Production history and failure-mode drills are still limited.
- **Tradeoffs:** CI reliability evidence is not the same as multi-tenant SaaS operating evidence.
- **Improvement recommendations:** Build a release evidence bundle that separates local, CI, staging, and production signals.
- **Disposition:** Fixable in V1 for evidence capture.

### 19. Traceability

- **Score:** 86
- **Weight:** 3
- **Weighted impact on readiness:** 2.58 / 102 weighted points
- **Weighted deficiency signal:** 0.42 weighted points missing
- **Justification:** Traceability is a core strength: committed manifests, audit rows, correlation IDs, evidence chains, OpenTelemetry trace IDs, and downloadable bundles are first-class.
- **Tradeoffs:** Rich traces can increase storage/privacy responsibilities.
- **Improvement recommendations:** Make trace completeness visible in the sponsor and support flows.
- **Disposition:** Fixable in V1 for UI/report exposure.

### 20. Compliance Readiness

- **Score:** 79
- **Weight:** 2
- **Weighted impact on readiness:** 1.58 / 102 weighted points
- **Weighted deficiency signal:** 0.42 weighted points missing
- **Justification:** Good internal compliance evidence exists, but the posture is self-attested and template-based. That is acceptable for current scope but not enough for all enterprise buyers.
- **Tradeoffs:** Deferring CPA SOC 2 is reasonable at this maturity, but it costs sales cycles.
- **Improvement recommendations:** Strengthen current-control evidence maps and keep every claim dated and owner-labeled.
- **Disposition:** V1 fixable for evidence; external attestation deferred/informational.

### 21. Explainability

- **Score:** 79
- **Weight:** 2
- **Weighted impact on readiness:** 1.58 / 102 weighted points
- **Weighted deficiency signal:** 0.42 weighted points missing
- **Justification:** Explanation endpoints, aggregate summaries, citation counters, faithfulness fallback, and evidence-chain pointers are strong. The issue is confidence calibration for real LLM narratives.
- **Tradeoffs:** More deterministic fallback improves trust but may reduce narrative richness.
- **Improvement recommendations:** Expose explanation faithfulness and citation completeness in generated reports.
- **Disposition:** Fixable in V1.

### 22. Azure Compatibility and SaaS Deployment Readiness

- **Score:** 79
- **Weight:** 2
- **Weighted impact on readiness:** 1.58 / 102 weighted points
- **Weighted deficiency signal:** 0.42 weighted points missing
- **Justification:** The SaaS posture is Azure-native, Terraform-heavy, private-endpoint-aware, and aligned to Container Apps, SQL, Key Vault, Front Door/WAF, monitoring, Service Bus, and Entra. Some roots are still optional or warn-only.
- **Tradeoffs:** Complete Azure production posture is more complex than a small pilot needs.
- **Improvement recommendations:** Promote production-profile validation from documentation to a release evidence artifact.
- **Disposition:** Fixable in V1 for validation.

### 23. Data Consistency

- **Score:** 80
- **Weight:** 2
- **Weighted impact on readiness:** 1.60 / 102 weighted points
- **Weighted deficiency signal:** 0.40 weighted points missing
- **Justification:** The repository has explicit orphan probes, FK parity work, quarantine, metrics, runbooks, and SQL authority-store discipline. Some constraints are intentionally not fully trusted for brownfield compatibility.
- **Tradeoffs:** `WITH NOCHECK` supports brownfield adoption but weakens the simplicity of “database guarantees all history.”
- **Improvement recommendations:** Add a production-readiness checklist for moving from detect/alert to quarantine and eventually trusted constraints where possible.
- **Disposition:** Fixable in V1 for new-write prevention and evidence.

### 24. Policy and Governance Alignment

- **Score:** 83
- **Weight:** 2
- **Weighted impact on readiness:** 1.66 / 102 weighted points
- **Weighted deficiency signal:** 0.34 weighted points missing
- **Justification:** Governance workflows, policy packs, pre-commit gates, segregation of duties, audit coverage, and dashboards are strong.
- **Tradeoffs:** Governance breadth can overwhelm first-pilot users.
- **Improvement recommendations:** Keep governance off the default path but make it easy to activate after first commit.
- **Disposition:** Fixable in V1.

### 25. Maintainability

- **Score:** 84
- **Weight:** 2
- **Weighted impact on readiness:** 1.68 / 102 weighted points
- **Weighted deficiency signal:** 0.32 weighted points missing
- **Justification:** Project boundaries, central package management, warning-as-error, tests, generated clients, ADRs, and docs are strong. The doc surface is large and needs automated coherence checks.
- **Tradeoffs:** Modularity creates more seams to guard.
- **Improvement recommendations:** Add CI guards for the highest-risk cross-doc contradictions.
- **Disposition:** Fixable in V1.

### 26. Stickiness

- **Score:** 69
- **Weight:** 1
- **Weighted impact on readiness:** 0.69 / 102 weighted points
- **Weighted deficiency signal:** 0.31 weighted points missing
- **Justification:** Stickiness depends on repeated architecture reviews, governance workflows, and integrations. The product has the ingredients, but not enough evidence yet that teams will habitually return after one pilot.
- **Tradeoffs:** A narrow first pilot is easier to adopt but less inherently sticky than embedded governance.
- **Improvement recommendations:** Add repeat-run and second-run success artifacts.
- **Disposition:** Fixable in V1 for instrumentation; market proof comes later.

### 27. Cognitive Load

- **Score:** 72
- **Weight:** 1
- **Weighted impact on readiness:** 0.72 / 102 weighted points
- **Weighted deficiency signal:** 0.28 weighted points missing
- **Justification:** The product deliberately narrows first use, but the surrounding system is concept-heavy.
- **Tradeoffs:** Enterprise-grade evidence necessarily introduces concepts.
- **Improvement recommendations:** Reduce first-run terminology to request, pipeline, finalize, review package.
- **Disposition:** Fixable in V1.

### 28. Customer Self-Sufficiency

- **Score:** 74
- **Weight:** 1
- **Weighted impact on readiness:** 0.74 / 102 weighted points
- **Weighted deficiency signal:** 0.26 weighted points missing
- **Justification:** Docs, quickstarts, troubleshooting, support bundle, and operator guides are strong. Production setup still expects technical operators and some sales/support assistance.
- **Tradeoffs:** A guided pilot is safer but less self-serve.
- **Improvement recommendations:** Add a self-checking “pilot rescue” flow tied to support bundle output.
- **Disposition:** Fixable in V1.

### 29. Scalability

- **Score:** 74
- **Weight:** 1
- **Weighted impact on readiness:** 0.74 / 102 weighted points
- **Weighted deficiency signal:** 0.26 weighted points missing
- **Justification:** Container Apps, SQL, optional Redis, k6 smoke, and scaling docs exist. The default V1 posture is still pilot-scale, not proven high-scale SaaS.
- **Tradeoffs:** Not overbuilding Redis/DTF is sensible for V1.
- **Improvement recommendations:** Make scale assumptions explicit in release evidence and dashboards.
- **Disposition:** V1 pilot-scale fixable; larger scale deferred.

### 30. Availability

- **Score:** 75
- **Weight:** 1
- **Weighted impact on readiness:** 0.75 / 102 weighted points
- **Weighted deficiency signal:** 0.25 weighted points missing
- **Justification:** Health checks, SLO docs, staging probes, and Azure topology exist. Production availability history is not yet the center of evidence.
- **Tradeoffs:** Published targets without history are weaker than observed service metrics.
- **Improvement recommendations:** Add 30-day hosted rollup automation with clear staging vs production labeling.
- **Disposition:** Fixable in V1 for evidence collection.

### 31. Auditability

- **Score:** 88
- **Weight:** 2
- **Weighted impact on readiness:** 1.76 / 102 weighted points
- **Weighted deficiency signal:** 0.24 weighted points missing
- **Justification:** Durable typed audit, append-only SQL store, CSV export, matrix guard, correlation IDs, and traceability bundles are excellent.
- **Tradeoffs:** Append-only evidence creates retention/DSAR complexity.
- **Improvement recommendations:** Keep audit event matrix synchronized and extend it for every new mutation route.
- **Disposition:** Fixable in V1.

### 32. Performance

- **Score:** 76
- **Weight:** 1
- **Weighted impact on readiness:** 0.76 / 102 weighted points
- **Weighted deficiency signal:** 0.24 weighted points missing
- **Justification:** k6 CI gates, load baseline, BenchmarkDotNet, pagination audits, and performance docs exist. Numeric baseline coverage is still relatively narrow.
- **Tradeoffs:** CI-safe thresholds catch regressions but are not customer SLO proof.
- **Improvement recommendations:** Refresh full-stack baseline after major changes and separate CI smoke from production SLO evidence.
- **Disposition:** Fixable in V1.

### 33. Cost-Effectiveness

- **Score:** 77
- **Weight:** 1
- **Weighted impact on readiness:** 0.77 / 102 weighted points
- **Weighted deficiency signal:** 0.23 weighted points missing
- **Justification:** Simulator-first mode, LLM cost estimates, monthly budget guard, Azure cost posture, and pricing rationale exist. Real hosted cost evidence is still limited.
- **Tradeoffs:** Conservative token budgets may cap model quality or large-input usage.
- **Improvement recommendations:** Add per-run cost evidence to release and sponsor artifacts.
- **Disposition:** Fixable in V1.

### 34. Manageability

- **Score:** 78
- **Weight:** 1
- **Weighted impact on readiness:** 0.78 / 102 weighted points
- **Weighted deficiency signal:** 0.22 weighted points missing
- **Justification:** Config validation, health endpoints, runbooks, dashboards, and support bundles help operators. The breadth of configuration remains significant.
- **Tradeoffs:** Flexible deployment creates more knobs.
- **Improvement recommendations:** Add a production configuration diff / readiness report.
- **Disposition:** Fixable in V1.

### 35. Deployability

- **Score:** 79
- **Weight:** 1
- **Weighted impact on readiness:** 0.79 / 102 weighted points
- **Weighted deficiency signal:** 0.21 weighted points missing
- **Justification:** Docker, Terraform, Azure profile, DbUp, readiness scripts, and release smoke exist. Some SaaS infrastructure validation is still warn-only or optional.
- **Tradeoffs:** Supporting many roots helps modular IaC but makes deployment sequencing harder.
- **Improvement recommendations:** Make the Azure production profile produce one deterministic preflight report.
- **Disposition:** Fixable in V1.

### 36. Evolvability

- **Score:** 80
- **Weight:** 1
- **Weighted impact on readiness:** 0.80 / 102 weighted points
- **Weighted deficiency signal:** 0.20 weighted points missing
- **Justification:** ADRs, versioned contracts, modular bounded contexts, Terraform modules, and explicit deferrals support evolution.
- **Tradeoffs:** More deferred scope requires more discipline to prevent roadmap creep.
- **Improvement recommendations:** Keep deferred-scope rules enforceable and visible in PRs.
- **Disposition:** Fixable in V1.

### 37. Supportability

- **Score:** 81
- **Weight:** 1
- **Weighted impact on readiness:** 0.81 / 102 weighted points
- **Weighted deficiency signal:** 0.19 weighted points missing
- **Justification:** Correlation IDs, support bundle, health/version, diagnostics docs, and runbooks are good. Support loops need more evidence from real hosted incidents.
- **Tradeoffs:** Rich support data must be redacted before sharing.
- **Improvement recommendations:** Add support-bundle redaction and completeness checks for first-pilot failures.
- **Disposition:** Fixable in V1.

### 38. Template and Accelerator Richness

- **Score:** 82
- **Weight:** 1
- **Weighted impact on readiness:** 0.82 / 102 weighted points
- **Weighted deficiency signal:** 0.18 weighted points missing
- **Justification:** Starter proof packs, policy packs, connector recipes, procurement pack, templates, and finding-engine scaffold are strong.
- **Tradeoffs:** Too many templates can blur the default path.
- **Improvement recommendations:** Rank templates by buyer scenario and connect them to first-value report outputs.
- **Disposition:** Fixable in V1.

### 39. Accessibility

- **Score:** 82
- **Weight:** 1
- **Weighted impact on readiness:** 0.82 / 102 weighted points
- **Weighted deficiency signal:** 0.18 weighted points missing
- **Justification:** Accessibility self-attestation, axe tests, jsx-a11y, public route, and annual cadence are present. It is not an external certification.
- **Tradeoffs:** Self-attestation is practical but less persuasive for strict enterprise accessibility review.
- **Improvement recommendations:** Keep top-route axe coverage current and publish known limitations clearly.
- **Disposition:** Fixable in V1.

### 40. Observability

- **Score:** 82
- **Weight:** 1
- **Weighted impact on readiness:** 0.82 / 102 weighted points
- **Weighted deficiency signal:** 0.18 weighted points missing
- **Justification:** Metrics, traces, correlation IDs, dashboards, Prometheus, Application Insights/OTLP paths, and domain metrics are substantial.
- **Tradeoffs:** Export paths require configuration; in-process metrics alone do not help production operations.
- **Improvement recommendations:** Add an observability readiness check that confirms at least one export path in production-like environments.
- **Disposition:** Fixable in V1.

### 41. Extensibility

- **Score:** 82
- **Weight:** 1
- **Weighted impact on readiness:** 0.82 / 102 weighted points
- **Weighted deficiency signal:** 0.18 weighted points missing
- **Justification:** Context connectors, webhook consumers, Service Bus, API client, finding-engine template, and integration recipes support extension.
- **Tradeoffs:** Extension points need governance to avoid schema fragmentation.
- **Improvement recommendations:** Require contract tests for new connector recipes and payload projections.
- **Disposition:** Fixable in V1.

### 42. Change Impact Clarity

- **Score:** 84
- **Weight:** 1
- **Weighted impact on readiness:** 0.84 / 102 weighted points
- **Weighted deficiency signal:** 0.16 weighted points missing
- **Justification:** Compare, replay, manifest deltas, decision traces, and changelog discipline are strong.
- **Tradeoffs:** Change clarity depends on clean input and complete artifacts.
- **Improvement recommendations:** Put change-impact examples directly in first-value and second-run materials.
- **Disposition:** Fixable in V1.

### 43. Modularity

- **Score:** 84
- **Weight:** 1
- **Weighted impact on readiness:** 0.84 / 102 weighted points
- **Weighted deficiency signal:** 0.16 weighted points missing
- **Justification:** Class/project boundaries and ports are generally clean, with separate API/application/persistence/worker/UI/CLI concerns.
- **Tradeoffs:** Many modules increase build/test complexity.
- **Improvement recommendations:** Keep new integrations as thin adapters over existing application services.
- **Disposition:** Fixable in V1.

### 44. Testability

- **Score:** 86
- **Weight:** 1
- **Weighted impact on readiness:** 0.86 / 102 weighted points
- **Weighted deficiency signal:** 0.14 weighted points missing
- **Justification:** Testability is a strength: xUnit tiers, SQL integration, property tests, OpenAPI snapshots, Vitest, Playwright, k6, mutation testing, coverage gates, and config tests.
- **Tradeoffs:** The test matrix is expensive and complex.
- **Improvement recommendations:** Keep release evidence focused on the few signals that matter for a buyer handoff.
- **Disposition:** Fixable in V1.

### 45. Azure Ecosystem Fit

- **Score:** 86
- **Weight:** 1
- **Weighted impact on readiness:** 0.86 / 102 weighted points
- **Weighted deficiency signal:** 0.14 weighted points missing
- **Justification:** Azure alignment is excellent: Entra, SQL, Key Vault, Front Door/WAF, Container Apps, Service Bus, Azure OpenAI, private endpoints, Terraform, and Azure extractor posture.
- **Tradeoffs:** Azure-first limits neutrality but matches the intended enterprise platform.
- **Improvement recommendations:** Keep Azure-native choices explicit and avoid adding non-Azure dependencies without a clear reason.
- **Disposition:** Fixable in V1.

### 46. Documentation

- **Score:** 88
- **Weight:** 1
- **Weighted impact on readiness:** 0.88 / 102 weighted points
- **Weighted deficiency signal:** 0.12 weighted points missing
- **Justification:** Documentation is unusually deep and well-indexed, with scope headers, trust center, runbooks, ADRs, buyer docs, and CI guards. The downside is volume and occasional contradiction.
- **Tradeoffs:** Depth helps due diligence but can overwhelm evaluators.
- **Improvement recommendations:** Add coherence guards for high-risk source-of-truth docs and keep the first five docs dominant.
- **Disposition:** Fixable in V1.

## Top 12 Most Important Weaknesses

1. **Buyer proof is still too internally evidenced.** The product can generate useful evidence, but a skeptical buyer will want stronger real-tenant, non-demo proof before trusting ROI or operational claims.
2. **Commercial motion depends on guided sales rather than live self-serve conversion.** This is explicitly not a current headline defect, but it slows revenue capture.
3. **Connector scope has contradictions.** ServiceNow/Jira status-sync language differs across current source docs, which weakens trust in integration commitments.
4. **First-run simplicity is fighting product breadth.** The default Pilot path is clear, but the wider repo/product surface can still overwhelm evaluators.
5. **Real LLM behavior is not as release-hard as simulator behavior.** Simulator mode is excellent for repeatability; real model quality, cost, and faithfulness need stronger routine evidence.
6. **Production operating evidence trails CI/staging evidence.** Health checks, k6, and CI are strong, but hosted SaaS proof is still maturing.
7. **Procurement pack is strong but mostly self-attested.** This is acceptable for current scope, but buyer friction remains.
8. **Pricing and ROI story include placeholder/self-serve seams.** Quote flow exists, but placeholder Stripe URLs and deferred live commerce can distract buyers.
9. **Data consistency posture is pragmatic but not fully clean.** Brownfield-compatible FK behavior and quarantine are reasonable, but harder to explain.
10. **Scope breadth increases maintenance risk.** The product has many modules, docs, workflows, and integration surfaces that need coherence automation.
11. **Customer self-sufficiency still leans on operator maturity.** A first pilot is guided well, but production deployment and troubleshooting still require technical depth.
12. **Stickiness is plausible but unproven.** Repeat-use loops exist, but evidence that teams habitually return after first pilot is not yet strong.

## Top 6 Monetization Blockers

1. **Insufficient buyer-safe proof from real tenant data.** Revenue depends on proving time savings and evidence quality without relying on demo numbers.
2. **Self-serve conversion is not live production motion.** Sales-led quote flow is workable, but slower than live checkout and marketplace activation.
3. **Reference/customer proof is deferred.** It should not reduce headline readiness, but it still weakens conversion confidence.
4. **Value story can sound generic unless evidence-chain demos lead.** “AI-assisted architecture workflow” needs concrete proof to beat generic AI tools.
5. **Pricing confidence depends on trust discount logic.** The pricing model is rational, but SOC/report/reference discounts telegraph maturity caveats.
6. **First-run success must be nearly foolproof.** Any onboarding friction undermines the core claim of faster review-package creation.

## Top 6 Enterprise Adoption Blockers

1. **SOC 2 CPA report and ISO certification are absent.** Not headline-scored, but enterprise procurement will still ask and may delay deals.
2. **Third-party pen-test evidence is deferred.** Owner-conducted testing and templates help, but strict security teams often expect external validation.
3. **Production SaaS operating history is limited.** Buyers will want uptime, incident, support, and scale evidence over time.
4. **Integration commitment clarity is uneven.** Enterprise implementation teams need exact connector behavior and status-sync guarantees.
5. **Complex configuration surface.** Azure, auth, SQL topology, observability, billing, connectors, and governance require careful setup.
6. **Support/SLA posture is target-heavy.** SLO/SLA docs exist, but contract-grade support expectations may need customer-specific terms.

## Top 6 Engineering Risks

1. **Doc/code commitment drift.** The current breadth makes contradictions likely unless high-risk docs are guarded.
2. **Real LLM output quality under varied inputs.** Schema validation and fallbacks exist, but recommendation correctness remains a core risk.
3. **Connector edge cases.** ITSM and documentation connectors touch external systems with messy auth, field mappings, rate limits, and status models.
4. **Production observability misconfiguration.** Metrics exist in-process, but export paths must be configured correctly to matter.
5. **Brownfield SQL consistency.** `WITH NOCHECK`, quarantine, and legacy orphans are pragmatic but operationally delicate.
6. **Scaling assumptions beyond pilot envelope.** Current evidence supports pilot-scale and CI smoke better than high-volume multi-tenant operation.

## Most Important Truth

ArchLucid is strongest when sold as a focused, evidence-producing architecture review workflow; it becomes weaker the moment it tries to sound like a fully proven enterprise governance platform with mature external assurance and production market proof.

## Top Improvement Opportunities

### 1. Align Connector Scope, Contracts, and Smoke Evidence

- **Why it matters:** Connector inconsistencies create avoidable enterprise distrust and implementation ambiguity.
- **Expected impact:** Directly improves Workflow Embeddedness (+6-8 pts), Interoperability (+4-6 pts), Trustworthiness (+2-4 pts), Marketability (+1-2 pts). Weighted readiness impact: +0.35-0.55%.
- **Affected qualities:** Workflow Embeddedness, Interoperability, Trustworthiness, Marketability, Documentation, Maintainability.
- **Actionability:** **Complete.**
- **Status:** **Complete (2026-05-07).** `V1_SCOPE.md`, `INTEGRATION_CATALOG.md` (including `dist/procurement-pack` copy), `API_CONTRACTS.md`, connector smoke recipes, Power Automate / webhook-bridge templates, and `PENDING_QUESTIONS.md` historical rows were reconciled on ServiceNow/Jira inbound **status-only** sync and CMDB wording; CI guard `scripts/ci/assert_v1_connector_catalog_alignment.py` now enforces catalog ↔ scope table wording plus forbidden denial phrases, validates the procurement-pack catalog when present, emits **warn-only** `DOC_CODE_NOTICE` for missing inbound-sync code markers (owner decision path), and has expanded tests under `scripts/ci/tests/test_assert_v1_connector_catalog_alignment.py`.

- **Cursor prompt:**

```text
Audit and align ArchLucid's V1 connector scope across code, docs, and tests.

Scope:
- Use docs/library/V1_SCOPE.md as the source of truth for V1 connector commitments.
- Review docs/go-to-market/INTEGRATION_CATALOG.md, docs/integrations/CONNECTOR_SMOKE_INDEX.md, docs/library/API_CONTRACTS.md, and connector smoke docs under docs/integrations/smoke/.
- Reconcile Jira, ServiceNow, Slack, and Confluence status language, especially ServiceNow/Jira inbound status-sync commitments.
- Add or update a small CI guard script under scripts/ci/ that checks the canonical connector status terms are consistent between V1_SCOPE.md and INTEGRATION_CATALOG.md.
- If CI or review finds doc vs **code** disagreement, **do not** auto-change implementation to match docs or auto-change V1 scope: **open an owner decision** (e.g. `docs/PENDING_QUESTIONS.md` row) to either narrow scope or schedule implementation work.
- Add focused unit tests for the guard under scripts/ci/tests/.

Acceptance criteria:
- No current doc says ServiceNow status sync is both committed and not committed.
- The Integration Catalog clearly distinguishes first-party V1 commitments, optional customer-operated recipes, and non-V1 marketplace/OAuth/listing items.
- CI has a deterministic guard for the highest-risk connector status rows.
- Doc-to-doc drift fails the guard with a clear message; **doc-to-code drift** is reported for **owner decision** (not silently "fixed" to one side).
- Existing V1 deferrals remain intact and are not re-scored as current defects.

Constraints:
- Do not change product scope or shipping behavior without an **explicit owner decision** after doc-code drift is surfaced.
- Do not add new connectors.
- Do not remove optional customer-operated recipes.
- Do not reference prior assessments.
```

### 2. COMPLETE:  Generate a Buyer-Safe First-Value Evidence Gate

- **Why it matters:** Revenue depends on proof that can be sent to a sponsor without manual narrative invention.
- **Expected impact:** Directly improves Proof-of-ROI Readiness (+8-10 pts), Executive Value Visibility (+4-6 pts), Trustworthiness (+3-5 pts), Decision Velocity (+2-4 pts). Weighted readiness impact: +0.65-0.95%.
- **Affected qualities:** Proof-of-ROI Readiness, Executive Value Visibility, Decision Velocity, Marketability, Trustworthiness.
- **Actionability:** **Complete.**
- **Status:** **Complete (2026-05-07).** Buyer-safe gate hardens on missing run id and default manifest commit timestamps; proof package exposes `CommittedManifestTimestampResolved`, treats zero-findings severity rollup as present evidence, and adds an explicit committed-manifest timestamp row in the Markdown contract. Incomplete PDFs still return 200 with header/footer banner plus a diagonal `FirstValueReportPdfBuilder` foreground watermark. Tests: `FirstValueEvidenceCompletenessMarkdownFormatterTests`, extended Pilots unit tests, and `ArchitectureRunCommitPathParityIntegrationTests` now POST `first-value-report.pdf` on the same cohort client.
- **Cursor prompt:**

```text
Implement a buyer-safe first-value evidence gate for ArchLucid pilot reports.

Scope:
- Start from docs/library/PILOT_ROI_MODEL.md and the existing first-value report paths in ArchLucid.Application/Pilots and ArchLucid.Api /v1/pilots endpoints.
- Add a deterministic evidence-completeness model that classifies each generated first-value report as Strong, Partial, or Incomplete based on required fields: run id, committed manifest timestamp, findings by severity, top finding evidence-chain pointer, audit row count/lower bound, LLM call count, demo-tenant warning, and baseline confidence.
- Surface the classification in Markdown and PDF output.
- When classification is **Incomplete**, **still generate the PDF**; apply a clear **watermark** (and/or header/footer notice) on the PDF and equivalent visible notice in Markdown—**do not return 403 or omit the PDF solely for Incomplete**.
- Add tests in ArchLucid.Application.Tests/Pilots and relevant API tests.

Acceptance criteria:
- Demo runs are always visibly marked as demo-derived.
- Missing proof fields are rendered as missing, not silently omitted or backfilled with prose.
- Strong/Partial/Incomplete classification is deterministic and unit-tested.
- **Incomplete** gate: watermark (or banner) only; PDF and Markdown endpoints remain callable and succeed when auth and run scope allow.
- Existing report endpoints keep their routes and auth behavior.

Constraints:
- Do not invent customer baseline numbers.
- Do not change pricing.
- Do not require live LLM credentials.
- Do not use ConfigureAwait(false) in tests.
```

### 3. Add Real-LLM Release Evidence Capture Without Requiring Credentials

- **Why it matters:** Simulator proof is strong, but AI correctness and cost confidence require a repeatable real-mode evidence harness.
- **Expected impact:** Directly improves AI/Agent Readiness (+6-8 pts), Correctness (+3-5 pts), Explainability (+3-5 pts), Trustworthiness (+2-4 pts). Weighted readiness impact: +0.35-0.60%.
- **Affected qualities:** AI/Agent Readiness, Correctness, Explainability, Cost-Effectiveness, Trustworthiness.
- **Actionability:** Fully actionable now for the harness; actual live evidence remains environment-dependent.
- **Cursor prompt:**

```text
Create a real-LLM release evidence capture path that produces an explicit report even when credentials are absent.

Scope:
- Build on scripts/Invoke-RealLlmEvidenceGate.ps1, docs/quality/REAL_LLM_RUN_EVIDENCE_TEMPLATE.md, and the existing AgentExecution metrics/configuration.
- Ensure the script emits a Markdown report with status values Passed, Failed, Skipped, or Not captured for: credentials present, run executed, schema validation, structural completeness, semantic score, parse failures, token/cost estimate, trace persistence, and evidence-chain availability.
- When Azure OpenAI credentials are missing, the script must succeed only if it marks live execution as Skipped/Not captured with a clear reason.
- Add fixture tests or script tests if the repository has an existing PowerShell/Python test pattern for release evidence scripts.

Acceptance criteria:
- Running the script without live credentials generates an honest report and does not imply real LLM validation happened.
- Running with credentials captures enough metrics to compare real mode against simulator expectations.
- docs/library/RELEASE_EVIDENCE_SUMMARY.md links to the report output.

Constraints:
- Do not commit secrets.
- Do not make live LLM credentials required for normal CI.
- Do not change agent prompt content.
- Do not reference prior assessments.
```

### 4. Build a Production Profile Preflight Report

- **Why it matters:** Azure deployment readiness is well documented, but operators need one deterministic artifact showing what is configured, missing, skipped, or unsafe.
- **Expected impact:** Directly improves Deployability (+6-8 pts), Azure Compatibility and SaaS Deployment Readiness (+5-7 pts), Reliability (+2-4 pts), Manageability (+3-5 pts). Weighted readiness impact: +0.35-0.55%.
- **Affected qualities:** Deployability, Azure Compatibility and SaaS Deployment Readiness, Manageability, Reliability, Security.
- **Actionability:** Fully actionable now.
- **Cursor prompt:**

```text
Create a production profile preflight report for ArchLucid Azure SaaS deployment.

Scope:
- Use docs/library/AZURE_PRODUCTION_PROFILE.md and docs/library/REFERENCE_SAAS_STACK_ORDER.md as the narrative source.
- Add a script under scripts/ that checks local repo readiness without Azure credentials: Terraform root presence, terraform fmt/validate instructions, required appsettings keys, auth mode, private endpoint variables, Key Vault provider settings, observability export settings, and no public SMB assumptions.
- Output Markdown to artifacts/deployment/production-profile-preflight.md with Passed, Failed, Skipped, or Not captured rows.
- Link the script from docs/library/DEPLOYMENT_RUNBOOK.md or docs/library/RELEASE_EVIDENCE_SUMMARY.md.

Acceptance criteria:
- The report clearly distinguishes repo/IaC readiness from actual deployed Azure resource verification.
- Missing production observability export configuration is flagged.
- Private endpoint posture is checked against Terraform variables/docs without requiring cloud credentials.

Constraints:
- Do not run terraform apply.
- Do not require Azure login.
- Do not expose or print secret values.
- Keep all infrastructure representable in Terraform.
```

### 5. Add a Public Pricing Placeholder Hard Guard

- **Why it matters:** A placeholder checkout URL in public pricing assets is commercially embarrassing and can break buyer trust.
- **Expected impact:** Directly improves Commercial Packaging Readiness (+5-7 pts), Decision Velocity (+2-3 pts), Marketability (+1-2 pts), Trustworthiness (+1-2 pts). Weighted readiness impact: +0.20-0.35%.
- **Affected qualities:** Commercial Packaging Readiness, Decision Velocity, Marketability, Trustworthiness.
- **Actionability:** Fully actionable now.
- **Cursor prompt:**

```text
Add a guard that prevents public pricing assets from exposing placeholder checkout URLs unless self-serve checkout is intentionally hidden.

Scope:
- Review docs/go-to-market/PRICING_PHILOSOPHY.md, archlucid-ui/public/pricing.json, scripts/ci/generate_pricing_json.py, and existing pricing CI guards.
- Add or extend a CI script so a placeholder Stripe checkout URL cannot appear in generated public pricing JSON unless the UI hides the Subscribe CTA.
- Add tests for placeholder URL detection and hidden-CTA allowance.
- Update the pricing docs to state the exact allowed states: live checkout URL, no checkout URL/CTA hidden, or test-only staging path explicitly labeled.

Acceptance criteria:
- Placeholder checkout URLs fail CI when they would be visible to buyers.
- Quote-request flow remains available.
- V1.1 live commerce un-hold remains deferred and is not required for this guard.

Constraints:
- Do not add live Stripe keys.
- Do not change prices.
- Do not publish marketplace state.
- Do not modify owner-only commerce decisions.
```

### 6. Add a High-Risk Documentation Coherence Guard

- **Why it matters:** The repo’s documentation is strong but large; automated coherence is needed where contradictions carry sales, security, or implementation risk.
- **Expected impact:** Directly improves Documentation (+4-6 pts), Maintainability (+3-4 pts), Trustworthiness (+2-3 pts), Architectural Integrity (+2-3 pts). Weighted readiness impact: +0.25-0.40%.
- **Affected qualities:** Documentation, Maintainability, Architectural Integrity, Trustworthiness.
- **Actionability:** Fully actionable now.
- **Cursor prompt:**

```text
Implement a high-risk documentation coherence guard for ArchLucid scope and trust claims.

Scope:
- Add a script under scripts/ci/ that validates a small set of source-of-truth invariants:
  - V1_DEFERRED.md SOC 2 CPA and third-party pen-test deferrals are not contradicted by Trust Center certification claims.
  - V1_SCOPE.md connector commitment rows match INTEGRATION_CATALOG.md canonical statuses.
  - Pricing placeholder policy matches PRICING_PHILOSOPHY.md and generated pricing JSON.
  - MCP remains out of V1 unless V1_SCOPE.md and V1_DEFERRED.md are both updated.
- Add unit tests under scripts/ci/tests/.
- Wire the guard into .github/workflows/ci.yml near existing docs/procurement checks.

Acceptance criteria:
- The guard fails on deliberate contradiction fixtures.
- The guard is narrow and deterministic, not a broad markdown linter.
- It does not read archived assessments or archived superseded docs as current truth.

Constraints:
- Do not rewrite large docs wholesale.
- Do not change V1 scope.
- Do not use previous assessment files as input.
```

### 7. Add Connector Fake-Provider Conformance Tests

- **Why it matters:** External connector correctness fails at edge cases: auth, mapping, status normalization, retries, and audit. Fake-provider conformance tests catch this without needing live Jira/ServiceNow/Slack/Confluence tenants.
- **Expected impact:** Directly improves Correctness (+3-5 pts), Workflow Embeddedness (+4-6 pts), Interoperability (+3-4 pts), Reliability (+2-3 pts). Weighted readiness impact: +0.30-0.50%.
- **Affected qualities:** Correctness, Workflow Embeddedness, Interoperability, Reliability, Testability.
- **Actionability:** Fully actionable now.
- **Cursor prompt:**

```text
Add fake-provider conformance tests for committed V1 connectors.

Scope:
- Review existing tests under ArchLucid.Application.Tests/Integrations and connector code for Jira, ServiceNow, Slack, and Confluence.
- Add a shared fake HTTP handler or test helper that verifies request method, URL shape, auth header shape, payload fields, idempotency/correlation behavior, and audit outcome for each connector.
- Cover success, provider validation failure, network failure, and skipped-disabled configuration where applicable.
- Keep each class in its own file and reuse existing helpers aggressively.

Acceptance criteria:
- Tests do not call external SaaS APIs.
- Connector payloads use existing Authority-shaped finding/run data, not target-specific parallel schemas.
- Failed provider calls create the expected failure outcome/audit behavior.

Constraints:
- Do not add new libraries unless already present or clearly necessary.
- Do not introduce live credentials.
- Do not change public connector routes unless tests reveal a concrete bug.
- Do not use ConfigureAwait(false) in tests.
```

### 8. Make First-Run Cognitive Load Measurable

- **Why it matters:** The product’s first value depends on buyers completing the first review without drowning in architecture terminology.
- **Expected impact:** Directly improves Adoption Friction (+3-5 pts), Usability (+4-6 pts), Cognitive Load (+6-8 pts), Time-to-Value (+1-2 pts). Weighted readiness impact: +0.35-0.55%.
- **Affected qualities:** Adoption Friction, Usability, Cognitive Load, Time-to-Value, Customer Self-Sufficiency.
- **Actionability:** Fully actionable now.
- **Cursor prompt:**

```text
Audit and reduce first-run cognitive load across buyer-facing ArchLucid entry points.

Scope:
- Review docs/START_HERE.md, docs/CORE_PILOT.md, docs/EXECUTIVE_SPONSOR_BRIEF.md, archlucid-ui Home/onboarding/new-run copy, and tests that lock first-review copy.
- Standardize first-run language around four buyer concepts: create architecture review, pipeline runs, finalize, review package.
- Keep technical terms like run id, golden manifest, and artifacts visible only where they are support metadata or needed for API/CLI users.
- Add or update copy regression tests where current tests already protect Core Pilot language.

Acceptance criteria:
- Buyer-facing first path consistently describes the outcome as a review package.
- Technical run/manifest terms remain available for support and API docs.
- No advanced governance/Operate requirement is introduced into the first-session path.

Constraints:
- Do not remove API/CLI technical terminology from developer docs.
- Do not change routes or product behavior.
- Do not change V1 scope.
```

### 9. Add Data Consistency Mode Readiness Checks

- **Why it matters:** Data consistency is credible technically, but operators need clear readiness criteria before moving from detect to alert/quarantine modes.
- **Expected impact:** Directly improves Data Consistency (+6-8 pts), Reliability (+2-4 pts), Manageability (+2-3 pts), Trustworthiness (+1-2 pts). Weighted readiness impact: +0.25-0.45%.
- **Affected qualities:** Data Consistency, Reliability, Manageability, Trustworthiness.
- **Actionability:** Fully actionable now.
- **Cursor prompt:**

```text
Add a data consistency mode readiness check and operator checklist.

Scope:
- Use docs/data-consistency/DATA_CONSISTENCY_ENFORCEMENT.md and docs/runbooks/DATA_CONSISTENCY_ENFORCEMENT.md as source material.
- Add a small CLI or script check that reports current intended mode, required SQL objects/migrations, relevant metrics names, dashboard/runbook links, and whether quarantine mode is safe to enable.
- Output a Markdown readiness report with Passed, Failed, Skipped, or Not captured rows.
- Add tests for the report formatter and option validation where practical.

Acceptance criteria:
- Operators can tell whether they are in Warn, Alert, Quarantine, or AutoQuarantine posture.
- The report explains `WITH NOCHECK` implications without hiding brownfield risk.
- No destructive reconciliation is automated.

Constraints:
- Do not delete or mutate data.
- Do not change historical migrations.
- Do not require production database access for the default report path.
```

### 10. Add Support Bundle Completeness and Redaction Tests

- **Why it matters:** Supportability depends on getting enough diagnostic data without leaking secrets or buyer-sensitive content.
- **Expected impact:** Directly improves Supportability (+5-7 pts), Customer Self-Sufficiency (+2-4 pts), Security (+1-2 pts), Reliability (+1-2 pts). Weighted readiness impact: +0.20-0.35%.
- **Affected qualities:** Supportability, Customer Self-Sufficiency, Security, Reliability.
- **Actionability:** Fully actionable now.
- **Cursor prompt:**

```text
Strengthen ArchLucid support bundle completeness and redaction coverage.

Scope:
- Review ArchLucid.Cli support-bundle command/tests and docs that instruct operators to collect support data.
- Add tests that assert the support bundle includes version, health endpoints attempted, auth mode summary without key material, storage provider summary, correlation/trace guidance, and relevant config warning names.
- Add tests that assert secrets, connection strings, API keys, JWTs, and raw prompt bodies are redacted or excluded.
- Update the support docs with a short "before sending" checklist.

Acceptance criteria:
- Support bundle tests fail if obvious secret-shaped values appear.
- The bundle remains useful for first-pilot failures.
- Existing support-bundle command interface remains backward compatible.

Constraints:
- Do not include full LLM prompts by default.
- Do not print connection strings.
- Do not add external dependencies unless already used by the CLI/tests.
- Do not use ConfigureAwait(false) in tests.
```

### DEFERRED 11. Commerce Un-Hold: Live Stripe, Marketplace Publication, and Signup DNS

- **Reason it is deferred:** The current source explicitly places the live commerce un-hold in V1.1 and identifies owner-only dependencies: Stripe live keys, production webhook secret, Partner Center seller verification, payout/tax profile, Marketplace `Published` state, and `signup.archlucid.net` DNS cutover.
- **Specific information needed from you later:** Sequencing intent: Stripe self-serve first on 2026-06-09, then Marketplace SaaS offer on 2026-06-16. **Stripe live keys and the production webhook secret are not ready to configure yet; you will validate on Stripe test mode first.** **Partner Center seller verification, payout setup, and tax profile are not complete yet** (blocking Marketplace publication); **you asked to be reminded on this periodically** toward the 6/16 Marketplace target. Still needed when ready: Partner Center completion confirmation, Marketplace publication approval, production DNS/Front Door for `signup.archlucid.net`, and Stripe live key + production webhook secret after test-mode sign-off.

### DEFERRED 12. External Assurance Upgrade: CPA SOC 2 / Third-Party Pen Test

- **Reason it is deferred:** CPA SOC 2 and third-party penetration testing are explicitly outside the current headline scope. They require budget, vendor selection, legal/procurement engagement, and owner timing decisions.
- **Specific information needed from you later:** Target assurance milestone, budget approval, selected CPA or security assessor, NDA/public-summary policy, and target window. **Audience / driver:** not chosen for inherent security sensitivity of the workload; engagements are gated by **`$250K ARR`** (per trust-center SOC narrative) **or binding procurement requirement from a contracted enterprise customer**—whichever comes first—as the practical trigger alongside budget and vendor selection.

## Pending Questions for Later

### Commerce Un-Hold: Live Stripe, Marketplace Publication, and Signup DNS

- **Answered:** Stripe live keys and the production webhook secret are **not** ready to configure yet; you will exercise **test mode** first before live cutover.
- **Answered:** Partner Center seller verification, payout, and tax profile setup are **not** complete yet. **Reminder:** revisit before Marketplace target 2026-06-16 (and again after Stripe test-mode validation); you asked for ongoing nudges on this item.
- What exact production Front Door/custom-domain target should `signup.archlucid.net` use?
- **Answered:** Stripe self-serve goes live first on 2026-06-09; Marketplace SaaS offer follows on 2026-06-16.

### External Assurance Upgrade: CPA SOC 2 / Third-Party Pen Test

- Which external assurance milestone should come first: SOC 2 Type I, SOC 2 readiness review, or third-party penetration test?
- **Answered:** There is nothing inherently security-sensitive mandating CPA SOC / third-party pen as a default posture. The **driver** is economic and commercial: **`$250K ARR`** threshold and/or **binding demand from an enterprise customer** under contract procurement (alongside budget, vendor choice, NDA stance, and timeline).
- What NDA/public-summary policy should apply to resulting reports?
- What budget and calendar window are approved?

### Buyer-Safe First-Value Evidence Gate

- **Answered (delivery):** Shipped **2026-05-07** — deterministic Strong/Partial/Incomplete classification, proof contract + watermark/PDF behavior as in action-plan **§2 Status** (not pending build work).
- Which customer-specific baseline fields are mandatory for a guided pilot versus optional for self-serve?
- **Answered:** Incomplete evidence classification should **watermark** the artifact (PDF + visible Markdown notice); **do not block** PDF generation for Incomplete.

### Connector Scope, Contracts, and Smoke Evidence

- **Answered:** If docs and code disagree after the coherence pass, resolution is an **owner decision** only: either narrow/adjust scope (documented) or schedule implementation to match agreed scope—**do not** assume implementation must automatically match `V1_SCOPE.md` without that decision.

