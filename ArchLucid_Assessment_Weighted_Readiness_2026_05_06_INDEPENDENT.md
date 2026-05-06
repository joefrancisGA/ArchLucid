ArchLucid Assessment – Weighted Readiness 81.55%

## Executive Summary

### Overall Readiness

ArchLucid is a credible V1/V1.1-headline product, not a prototype. The repository contains a coherent SaaS-shaped architecture workflow system with API, SQL persistence, operator UI, CLI, release checks, live API E2E coverage, Terraform roots, trust documents, audit machinery, and a sharply defined Core Pilot path. The weighted readiness score is **81.55%** across the provided quality model, using the supplied weights exactly.

The score is not higher because the solution is still carrying complexity that will show up in adoption: a broad surface area, heavy documentation, partial real-world semantic validation of AI outputs, residual tenant-isolation/data-consistency risk on uncovered child tables, and first-party integration paths that are present but still look MVP-thin in places.

### Commercial Picture

Commercially, the wedge is strong: "request -> run -> commit -> review package" is simple, sponsor-safe, and backed by ROI-oriented artifacts. The product has enough pricing, order-form, trust-center, procurement, value-report, and pilot-scorecard material to support a sales-led V1 motion.

The blunt issue is that revenue will depend on whether buyers can see value quickly without drowning in the full platform. The product must keep forcing the first proof into a narrow package: one architecture request, one committed manifest, one evidence bundle, one sponsor narrative.

### Enterprise Picture

The enterprise story is unusually mature for this stage: Entra/JWT/API key auth, RBAC, RLS design, append-only audit, SCIM, procurement pack, DPA/subprocessor material, SLO/SLA targets, private endpoint guidance, and security self-assessment are all represented.

Procurement realism remains separate from the headline readiness score. CPA-issued SOC 2, ISO certification, public reference customers, third-party pen-test publication, live Stripe/Marketplace go-live, PGP publication, and design-partner execution are explicitly deferred or outside the current scoring boundary where documented. They will still slow some buyers, but they do not reduce the V1/V1.1 headline score here.

### Engineering Picture

Engineering depth is real: bounded contexts, Dapper/SQL Server persistence, DbUp migrations, live API + SQL Playwright, k6 smoke, mutation-testing posture, OpenAPI snapshots, ZAP/Schemathesis scheduled security checks, audit-event regression guards, Terraform roots, and observability instruments are all present.

The main engineering risk is not absence of code. It is system breadth. The product has many surfaces, several transitional seams, and a need to prove that AI-assisted outputs remain correct, explainable, tenant-safe, and operable under real customer data.

## Weighted Quality Assessment

Qualities are ordered by weighted deficiency signal: `(100 - score) * weight`. Weighted readiness contribution is `score * weight / 102`, because the supplied weights sum to 102.

### 1. Adoption Friction

- **Score:** 76
- **Weight:** 6
- **Weighted impact on readiness:** 4.47 percentage points
- **Weighted deficiency signal:** 144
- **Justification:** The four-step Core Pilot path is strong, and buyer docs explicitly say the evaluator should not install Docker, SQL, .NET, Node, Terraform, or a CLI. But the surrounding product and docs are huge. Operators can still get pulled into compare, replay, graph, governance, alerts, audit, policy packs, integrations, and multiple validation ladders before the first proof is complete.
- **Tradeoffs:** The breadth is part of the enterprise value story, but breadth is adoption tax if it appears before the first review package.
- **Improvement recommendations:** Keep hardening the default first-session UX so the product enforces the narrow path: sample review, real request, commit, review package, sponsor sendability. Hide or defer deep Operate paths until the first package is done.
- **Disposition:** Fixable in V1 through UX/copy/tests; deeper enterprise onboarding automation is better suited for V1.1.

### 2. Marketability

- **Score:** 86
- **Weight:** 8
- **Weighted impact on readiness:** 6.75 percentage points
- **Weighted deficiency signal:** 112
- **Justification:** The sponsor narrative is clear, conservative, and commercially useful: faster movement from architecture request to reviewable output, less manual packaging, stronger evidence trail. The pricing/order-form/procurement materials support sales-led pilots. The product avoids overclaiming.
- **Tradeoffs:** The story is credible but not yet backed by published public references or a self-serve transaction motion; those items are documented outside the current headline scoring boundary.
- **Improvement recommendations:** Convert the first-value artifacts into a tighter buyer-facing proof pack that can be generated, checked, and shared without manual curation.
- **Disposition:** Fixable in V1 for proof-pack clarity; public references remain V1.1/out-of-scope for this score.

### 3. Time-to-Value

- **Score:** 84
- **Weight:** 7
- **Weighted impact on readiness:** 5.76 percentage points
- **Weighted deficiency signal:** 112
- **Justification:** The Core Pilot path is intentionally narrow, the sample review gives a zero-config destination, and simulator mode enables fast first runs. The product has a direct route to committed manifest and artifacts.
- **Tradeoffs:** Simulator speed helps demos but can mask real LLM latency, quality, and cost variability. Real customer setup still needs identity, SQL, tenant, and deployment validation.
- **Improvement recommendations:** Add stronger evidence that the first 30 minutes works against the hosted or staging SaaS path, not only local/simulator paths.
- **Disposition:** Mostly fixable in V1; fully representative hosted proof depends on environment access and operating cadence.

### 4. Proof-of-ROI Readiness

- **Score:** 82
- **Weight:** 5
- **Weighted impact on readiness:** 4.02 percentage points
- **Weighted deficiency signal:** 90
- **Justification:** The ROI model is practical and conservative. It identifies measurable pilot outcomes and distinguishes computed metrics from operator-filled qualitative fields. First-value reports include completeness and demo-data warnings.
- **Tradeoffs:** Some of the most persuasive ROI claims still depend on buyer-provided baselines and real tenant data. That is appropriate, but it limits automated proof strength.
- **Improvement recommendations:** Strengthen baseline capture, proof completeness gating, and sponsor-sendability checks so a report cannot look stronger than its evidence.
- **Disposition:** Fixable in V1 for generated proof hygiene; customer-specific baselines remain externally dependent.

### 5. Differentiability

- **Score:** 78
- **Weight:** 4
- **Weighted impact on readiness:** 3.06 percentage points
- **Weighted deficiency signal:** 88
- **Justification:** The combination of architecture workflow, manifest commitment, traceable artifacts, governance evidence, and AI-assisted analysis is differentiated. The risk is that competitors can claim adjacent "AI architecture review" value unless ArchLucid makes the evidence-chain and sponsor package visibly superior.
- **Tradeoffs:** Deep enterprise evidence differentiates the product, but too much of it in the first conversation blurs the buyer message.
- **Improvement recommendations:** Make the highest-value differentiator explicit in the product: every finding should show why it exists, what evidence supports it, and how it changes the sponsor decision.
- **Disposition:** Fixable in V1 through product proof and copy; market proof from references is V1.1/out-of-scope.

### 6. Workflow Embeddedness

- **Score:** 76
- **Weight:** 3
- **Weighted impact on readiness:** 2.24 percentage points
- **Weighted deficiency signal:** 72
- **Justification:** REST, CLI, webhooks, Service Bus events, GitHub/Azure DevOps surfaces, Slack/Teams, Jira/ServiceNow inbound status sync, and Confluence publishing all point toward workflow integration. Several first-party connectors are still basic: Confluence publishing is minimal storage HTML, Slack webhook payloads are simple, and ITSM sync is status-focused.
- **Tradeoffs:** Thin connectors reduce V1 complexity and support burden, but enterprise stickiness depends on fitting into existing Jira/ServiceNow/Confluence/Slack routines.
- **Improvement recommendations:** Add dry-run, contract tests, and operator diagnostics around the committed connectors before deepening feature scope.
- **Disposition:** Fixable in V1 for MVP confidence; marketplace listings/OAuth install polish are later scope unless promoted.

### 7. Correctness

- **Score:** 82
- **Weight:** 4
- **Weighted impact on readiness:** 3.22 percentage points
- **Weighted deficiency signal:** 72
- **Justification:** Correctness is supported by substantial unit/integration/live E2E/property/performance/security testing and by the committed manifest model. However, CI does not prove real LLM semantic quality, and some specs intentionally skip optional surfaces when HTTP paths are absent.
- **Tradeoffs:** Simulator-first tests are deterministic and cheap; real-model correctness is more expensive, noisier, and harder to gate.
- **Improvement recommendations:** Strengthen golden-corpus and real-output evaluation so correctness covers not only HTTP status and structure, but finding quality, evidence links, and recommendation faithfulness.
- **Disposition:** Fixable in V1 for deterministic/fixture-backed checks; broader live-model evaluation belongs in V1.1 operating cadence.

### 8. Usability

- **Score:** 78
- **Weight:** 3
- **Weighted impact on readiness:** 2.29 percentage points
- **Weighted deficiency signal:** 66
- **Justification:** The product explicitly uses progressive disclosure and has a focused Core Pilot. The operator shell has route guidance and role-aware shaping. Still, the mental model includes architecture reviews, runs, manifests, artifacts, governance, alerts, graph, compare, replay, and Ask, which is a lot for first-time users.
- **Tradeoffs:** Hiding complexity too aggressively can make enterprise buyers doubt depth; revealing it too early slows first value.
- **Improvement recommendations:** Make the first-session rail the dominant UI object until a successful commit, then introduce Operate actions contextually.
- **Disposition:** Fixable in V1.

### 9. Architectural Integrity

- **Score:** 80
- **Weight:** 3
- **Weighted impact on readiness:** 2.35 percentage points
- **Weighted deficiency signal:** 60
- **Justification:** The bounded-context map is coherent: API/worker/host, application orchestration, decisioning, knowledge graph, artifact synthesis, retrieval, provenance, and Dapper persistence are separated. Remaining architectural drag comes from transitional seams, especially coordinator/authority duality and legacy naming/config bridges.
- **Tradeoffs:** Keeping old paths reduces migration risk but increases cognitive load and test burden.
- **Improvement recommendations:** Continue converging public behavior onto Authority semantics and retire coordinator-only public surfaces only behind ADR-backed review.
- **Disposition:** Partly fixable in V1; full seam retirement is V1.1/v2 hygiene.

### 10. Executive Value Visibility

- **Score:** 86
- **Weight:** 4
- **Weighted impact on readiness:** 3.37 percentage points
- **Weighted deficiency signal:** 56
- **Justification:** Sponsor brief, first-value reports, value-report DOCX, ROI model, and buyer-safe proof contract give executives a clear view of what the pilot proves.
- **Tradeoffs:** The executive story is intentionally conservative, which avoids overclaiming but may feel less dramatic than AI competitors.
- **Improvement recommendations:** Make the sponsor-sendability gate stricter and more visible in the UI.
- **Disposition:** Fixable in V1.

### 11. Trustworthiness

- **Score:** 82
- **Weight:** 3
- **Weighted impact on readiness:** 2.41 percentage points
- **Weighted deficiency signal:** 54
- **Justification:** Trustworthiness is supported by citations, manifests, findings, decision traces, audit events, self-assessment, and buyer honesty. It is limited by AI-output semantic validation, residual RLS coverage gaps, and reliance on owner-conducted assurance rather than third-party evidence.
- **Tradeoffs:** The current stance is honest and affordable; procurement-grade assurance is slower and more expensive.
- **Improvement recommendations:** Increase product-native evidence chains and model-output quality gates before spending effort on cosmetic trust polish.
- **Disposition:** Fixable in V1 for product trust; CPA SOC 2 and third-party pen testing are out-of-scope for headline scoring.

### 12. Security

- **Score:** 84
- **Weight:** 3
- **Weighted impact on readiness:** 2.47 percentage points
- **Weighted deficiency signal:** 48
- **Justification:** The system has strong security posture: Entra/JWT/API key modes, fail-closed API key defaults, RBAC policies, RLS design, private endpoint guidance, Key Vault references, ZAP/Schemathesis, prompt redaction, tenant isolation docs, and no public SMB/445 posture. The main weaknesses are operational: RLS session context defaults off in base config, some child tables are uncovered, and production hardening depends on correct deployment choices.
- **Tradeoffs:** Security is designed as defense in depth; turning every control on by default can break local/dev and migration workflows.
- **Improvement recommendations:** Add an environment readiness guard/report that makes RLS, private endpoints, Key Vault, auth mode, and telemetry exporter posture explicit before production handoff.
- **Disposition:** Fixable in V1.

### 13. Decision Velocity

- **Score:** 78
- **Weight:** 2
- **Weighted impact on readiness:** 1.53 percentage points
- **Weighted deficiency signal:** 44
- **Justification:** The product accelerates architecture-review decisions by producing committed manifests and artifacts. Decision velocity is dampened by buyer setup, proof-pack completeness, and possible confusion between Pilot and Operate.
- **Tradeoffs:** Governance depth improves defensibility but can slow fast-cycle pilot decisions.
- **Improvement recommendations:** Add a "decision-ready" indicator on committed runs that checks artifacts, findings, evidence chain, audit rows, and sponsor package status.
- **Disposition:** Fixable in V1.

### 14. Maintainability

- **Score:** 78
- **Weight:** 2
- **Weighted impact on readiness:** 1.53 percentage points
- **Weighted deficiency signal:** 44
- **Justification:** Project boundaries are modular and tests are broad. Maintainability is reduced by breadth, extensive documentation cross-links, transitional architecture, many route/policy/nav seams, and some code patterns that are easy to drift.
- **Tradeoffs:** Heavy seam tests prevent regressions but also make changes slower.
- **Improvement recommendations:** Keep adding small seam maps and regression tests when surfaces cross API, UI, tier, and authority boundaries; retire deprecated shims when safe.
- **Disposition:** Partly fixable in V1; broad simplification is V1.1/v2.

### 15. AI/Agent Readiness

- **Score:** 78
- **Weight:** 2
- **Weighted impact on readiness:** 1.53 percentage points
- **Weighted deficiency signal:** 44
- **Justification:** The system has agent runtime, simulator, traces, structural validation, quality metrics, prompt redaction, token/cost instrumentation, and optional Azure OpenAI. The gap is real-output confidence: CI is mostly simulator/structure-first, and MCP is explicitly V1.1.
- **Tradeoffs:** Simulator-first development keeps costs down and tests stable; real-model gates are slower and less deterministic.
- **Improvement recommendations:** Add a small, budget-bounded real-output evidence gate that validates semantic quality against a golden corpus and records results.
- **Disposition:** Fixable in V1 for small gated evidence; MCP remains V1.1.

### 16. Procurement Readiness

- **Score:** 80
- **Weight:** 2
- **Weighted impact on readiness:** 1.57 percentage points
- **Weighted deficiency signal:** 40
- **Justification:** The procurement pack, Trust Center, DPA, subprocessors, SIG/CAIQ, SOC 2 roadmap, SLA targets, and FAQs are strong. The current headline score does not penalize missing CPA SOC 2, ISO, public reference customers, third-party pen-test publication, or signed design partner because they are documented outside the current scoring boundary.
- **Tradeoffs:** Honesty avoids bad claims, but some enterprise procurement teams will still require formal reports before production use.
- **Improvement recommendations:** Tighten procurement-pack build validation and objection-response coverage for the top buyer questions that do not require new certifications.
- **Disposition:** Fixable in V1 for self-serve diligence; formal assurance remains deferred/out-of-scope.

### 17. Interoperability

- **Score:** 80
- **Weight:** 2
- **Weighted impact on readiness:** 1.57 percentage points
- **Weighted deficiency signal:** 40
- **Justification:** Interoperability is broad: REST, CLI, OpenAPI, AsyncAPI/event schemas, Service Bus, webhooks, GitHub/Azure DevOps, SCIM, and first-party Slack/ITSM/Confluence surfaces. Some surfaces are basic and require environment-specific configuration.
- **Tradeoffs:** Broad interoperability increases support and documentation load.
- **Improvement recommendations:** Prefer contract tests, schema examples, and dry-run diagnostics before adding new connector families.
- **Disposition:** Fixable in V1 for committed connectors; broad integration catalog is out-of-scope.

### 18. Reliability

- **Score:** 80
- **Weight:** 2
- **Weighted impact on readiness:** 1.57 percentage points
- **Weighted deficiency signal:** 40
- **Justification:** Reliability is supported by health/readiness, release smoke, RC drill, outboxes, circuit breakers, k6 smoke, CD post-deploy checks, runbooks, and failover docs. Weaknesses remain around environment-specific validation, staging vs production evidence, and absence of active/active guarantees.
- **Tradeoffs:** V1 correctly avoids promising multi-region active/active; that keeps cost and complexity controlled.
- **Improvement recommendations:** Add a production-readiness evidence manifest that records which reliability drills and checks were run for a specific environment.
- **Disposition:** Fixable in V1 for single-region production confidence; multi-region guarantees are later scope.

### 19. Traceability

- **Score:** 88
- **Weight:** 3
- **Weighted impact on readiness:** 2.59 percentage points
- **Weighted deficiency signal:** 36
- **Justification:** Traceability is one of the strongest areas: manifests, audit rows, correlation IDs, run IDs, artifact records, decision traces, provenance/graph surfaces, OpenTelemetry trace IDs, and requirements-test traceability all exist.
- **Tradeoffs:** Strong traceability creates data volume and UI complexity.
- **Improvement recommendations:** Surface a single trace bundle link per run that joins manifest, audit, evidence chain, artifacts, and trace ID.
- **Disposition:** Fixable in V1.

### 20. Compliance Readiness

- **Score:** 82
- **Weight:** 2
- **Weighted impact on readiness:** 1.61 percentage points
- **Weighted deficiency signal:** 36
- **Justification:** Compliance materials are strong for self-attested readiness: control mappings, CAIQ/SIG, DPA, subprocessors, audit, RLS, incident policies, retention and DSAR docs. Formal CPA/ISO evidence is not included in the current headline scoring boundary.
- **Tradeoffs:** Self-attestation is enough for many pilots but not for the strictest regulated procurement.
- **Improvement recommendations:** Keep improving evidence freshness, procurement-pack redaction, and product-native audit export clarity.
- **Disposition:** Fixable in V1 for documentation/evidence; formal certification is deferred/out-of-scope.

### 21. Data Consistency

- **Score:** 82
- **Weight:** 2
- **Weighted impact on readiness:** 1.61 percentage points
- **Weighted deficiency signal:** 36
- **Justification:** The solution has SQL authority, migrations, orphan probes, optional quarantine, remediation endpoints, data-consistency metrics, and audit around remediation. Remaining risk is that only some orphan classes have quarantine/remediation depth, and uncovered child tables still rely on application discipline.
- **Tradeoffs:** Automated remediation can destroy forensic evidence if overused; quarantine-first is safer but operationally slower.
- **Improvement recommendations:** Expand orphan detection/quarantine/remediation to the remaining high-value child references and make production mode explicit.
- **Disposition:** Fixable in V1.

### 22. Explainability

- **Score:** 82
- **Weight:** 2
- **Weighted impact on readiness:** 1.61 percentage points
- **Weighted deficiency signal:** 36
- **Justification:** Explainability is supported by citations, evidence chains, traces, graph/provenance, aggregate faithfulness metrics, and deterministic fallback for low-faithfulness explanations. The gap is proving explanation quality with real LLM output under customer-like inputs.
- **Tradeoffs:** More explanation controls can make the UI heavier.
- **Improvement recommendations:** Strengthen explanation quality gates and show explanation confidence/evidence completeness where sponsors review outputs.
- **Disposition:** Fixable in V1 for deterministic gates; broader real-model evaluation is V1.1.

### 23. Azure Compatibility and SaaS Deployment Readiness

- **Score:** 82
- **Weight:** 2
- **Weighted impact on readiness:** 1.61 percentage points
- **Weighted deficiency signal:** 36
- **Justification:** The repo is Azure-native: Container Apps, SQL, storage, Key Vault, Front Door/WAF, Service Bus, monitoring, optional APIM, private networking, Terraform roots, Entra/JWT, and Azure OpenAI are documented. The deployment still requires operator-controlled subscription, DNS, secrets, images, and staged validation.
- **Tradeoffs:** Multi-root Terraform gives ownership and blast-radius isolation but is harder than a single-click deploy.
- **Improvement recommendations:** Add one production-readiness checklist artifact generated from Terraform outputs and app config.
- **Disposition:** Fixable in V1 for evidence and guardrails; live DNS/commerce unhold is deferred.

### 24. Commercial Packaging Readiness

- **Score:** 84
- **Weight:** 2
- **Weighted impact on readiness:** 1.65 percentage points
- **Weighted deficiency signal:** 32
- **Justification:** Pricing philosophy, order form, tiers, run overage, trial limits, 402 filters, tier-gated Operate surfaces, and procurement material exist. The current V1 commercial motion is sales-led, which is explicitly allowed.
- **Tradeoffs:** Sales-led motion reduces self-serve conversion speed but avoids premature billing/marketplace operational risk.
- **Improvement recommendations:** Keep packaging tables and route-tier-policy-nav matrix synchronized with API and UI gates.
- **Disposition:** Fixable in V1 for sales-led packaging; live Stripe/Marketplace publication is V1.1/out-of-scope.

### 25. Policy and Governance Alignment

- **Score:** 85
- **Weight:** 2
- **Weighted impact on readiness:** 1.67 percentage points
- **Weighted deficiency signal:** 30
- **Justification:** Governance approvals, segregation of duties, policy packs, pre-commit gate, governance dashboard, audit events, and tier/authority policy alignment are present.
- **Tradeoffs:** Governance features add enterprise credibility but should not enter the first-pilot path by default.
- **Improvement recommendations:** Keep governance behind progressive disclosure until after first proof; strengthen policy-pack dry-run examples for operators.
- **Disposition:** Fixable in V1.

### 26. Auditability

- **Score:** 86
- **Weight:** 2
- **Weighted impact on readiness:** 1.69 percentage points
- **Weighted deficiency signal:** 28
- **Justification:** Auditability is strong: append-only SQL audit, typed catalog, CSV/JSON export, correlation IDs, keyset pagination, CI guards for catalog drift, durable echo patterns, and known-gap documentation. Two catalogued-only items remain.
- **Tradeoffs:** Audit writes are sometimes intentionally non-blocking to protect hot paths.
- **Improvement recommendations:** Close or explicitly suppress catalogued-only event types when stable product paths exist.
- **Disposition:** Fixable in V1.

### 27. Cognitive Load

- **Score:** 72
- **Weight:** 1
- **Weighted impact on readiness:** 0.71 percentage points
- **Weighted deficiency signal:** 28
- **Justification:** This is the weakest raw score. The product has a lot of concepts and an enormous documentation graph. The Core Pilot boundary mitigates this, but the overall repo and operator model still demand a lot from users and contributors.
- **Tradeoffs:** Reducing concepts too far would hide enterprise power and implementation truth.
- **Improvement recommendations:** Keep the buyer path ruthlessly small and add "you do not need this yet" cues on secondary surfaces.
- **Disposition:** Fixable in V1 for buyer/operator path; contributor complexity will remain higher.

### 28. Stickiness

- **Score:** 74
- **Weight:** 1
- **Weighted impact on readiness:** 0.73 percentage points
- **Weighted deficiency signal:** 26
- **Justification:** Stickiness can emerge from manifests, audit history, governance workflows, integrations, and artifact exports. It is not yet proven through deep recurring workflows or public customer evidence.
- **Tradeoffs:** Exportability helps buyer trust but can reduce lock-in.
- **Improvement recommendations:** Improve recurring workflows around second runs, compare, replay, and governance approvals after the first pilot.
- **Disposition:** V1 can improve product hooks; market proof is V1.1/out-of-scope.

### 29. Customer Self-Sufficiency

- **Score:** 76
- **Weight:** 1
- **Weighted impact on readiness:** 0.75 percentage points
- **Weighted deficiency signal:** 24
- **Justification:** There are many docs, runbooks, CLI diagnostics, support bundles, and checklists. The problem is discoverability and overload, not absence of help.
- **Tradeoffs:** Complete docs are useful for enterprise diligence but can slow self-serve users.
- **Improvement recommendations:** Add symptom-first rescue paths and product-embedded next steps for failed pilot stages.
- **Disposition:** Fixable in V1.

### 30. Performance

- **Score:** 76
- **Weight:** 1
- **Weighted impact on readiness:** 0.75 percentage points
- **Weighted deficiency signal:** 24
- **Justification:** k6 smoke and query performance tooling exist, but V1 does not prove broad production-scale performance, real LLM latency distribution, or high-concurrency enterprise load.
- **Tradeoffs:** Heavy performance testing before actual tenant shape is known can waste effort.
- **Improvement recommendations:** Add focused hot-path budgets for create/execute/commit/review and first-value report generation.
- **Disposition:** Fixable in V1 for hot paths; broad capacity modeling is V1.1.

### 31. Scalability

- **Score:** 76
- **Weight:** 1
- **Weighted impact on readiness:** 0.75 percentage points
- **Weighted deficiency signal:** 24
- **Justification:** SQL, Container Apps, background workers, outboxes, optional Service Bus, and per-tenant catalog topology support scale. The score is limited by intentionally absent multi-region active/active guarantees, real LLM bottlenecks, and operational complexity of multi-root SaaS.
- **Tradeoffs:** The chosen architecture is simpler and cheaper than multi-region active/active.
- **Improvement recommendations:** Define scale envelopes for pilot, professional, and enterprise tiers using existing k6 and cost docs.
- **Disposition:** V1 can define envelopes; advanced scale is later scope.

### 32. Availability

- **Score:** 78
- **Weight:** 1
- **Weighted impact on readiness:** 0.76 percentage points
- **Weighted deficiency signal:** 22
- **Justification:** Health checks, readiness, CD probes, hosted probes, SLO docs, failover docs, and monitoring exist. Actual availability depends on deployment topology and operational maturity.
- **Tradeoffs:** Publishing targets without overpromising is commercially safer.
- **Improvement recommendations:** Create environment-specific availability evidence per staging/production handoff.
- **Disposition:** Fixable in V1 for evidence; active/active guarantees are later scope.

### 33. Template and Accelerator Richness

- **Score:** 80
- **Weight:** 1
- **Weighted impact on readiness:** 0.78 percentage points
- **Weighted deficiency signal:** 20
- **Justification:** The repo contains templates, policy packs, integration recipes, reference architectures, procurement templates, and pilot materials. Richness is good but can become noise.
- **Tradeoffs:** More accelerators help sales engineering but increase maintenance.
- **Improvement recommendations:** Curate a small "first 5 accelerators" pack for pilots.
- **Disposition:** Fixable in V1.

### 34. Manageability

- **Score:** 80
- **Weight:** 1
- **Weighted impact on readiness:** 0.78 percentage points
- **Weighted deficiency signal:** 20
- **Justification:** Configuration, Terraform roots, health checks, diagnostics, runbooks, audit export, and support bundles make the system manageable. Manageability still depends on careful environment setup and clear ownership.
- **Tradeoffs:** Multi-root IaC and many feature flags give control but require discipline.
- **Improvement recommendations:** Add a single config posture report for operators.
- **Disposition:** Fixable in V1.

### 35. Evolvability

- **Score:** 80
- **Weight:** 1
- **Weighted impact on readiness:** 0.78 percentage points
- **Weighted deficiency signal:** 20
- **Justification:** ADRs, bounded contexts, modular projects, versioned APIs, event schemas, and explicit deferral docs support evolution. Legacy seams and large surface area slow evolution.
- **Tradeoffs:** Backward compatibility and transition plans are necessary for shipped behavior.
- **Improvement recommendations:** Keep future surfaces behind façades and ADR gates, especially MCP and connector expansion.
- **Disposition:** Mostly V1.1/v2 for major evolution; V1 can improve guardrails.

### 36. Accessibility

- **Score:** 82
- **Weight:** 1
- **Weighted impact on readiness:** 0.80 percentage points
- **Weighted deficiency signal:** 18
- **Justification:** Accessibility has self-attestation, axe component tests, live accessibility specs, focus tests, and a public accessibility posture. It is still self-attested rather than externally audited.
- **Tradeoffs:** Full external audit may not be justified before broader usage.
- **Improvement recommendations:** Keep live accessibility gates tied to primary operator routes and first-session flow.
- **Disposition:** Fixable in V1 for coverage; external audit later if needed.

### 37. Change Impact Clarity

- **Score:** 82
- **Weight:** 1
- **Weighted impact on readiness:** 0.80 percentage points
- **Weighted deficiency signal:** 18
- **Justification:** Compare, replay, graph, manifests, changelog, ADRs, and release notes all support change clarity. The gap is making this obvious to a non-technical sponsor.
- **Tradeoffs:** Rich technical diffs can overwhelm executives.
- **Improvement recommendations:** Add a sponsor-level change-impact summary to first-value and comparison exports.
- **Disposition:** Fixable in V1.

### 38. Deployability

- **Score:** 82
- **Weight:** 1
- **Weighted impact on readiness:** 0.80 percentage points
- **Weighted deficiency signal:** 18
- **Justification:** Docker, compose, release packaging, CD workflows, Terraform, health probes, and migrations are present. Real deployment still depends on Azure subscription setup, DNS, registry, secrets, and private networking choices.
- **Tradeoffs:** The repo supports multiple deployment paths rather than one rigid installer.
- **Improvement recommendations:** Generate a deployment evidence summary after release-smoke/CD validation.
- **Disposition:** Fixable in V1.

### 39. Extensibility

- **Score:** 82
- **Weight:** 1
- **Weighted impact on readiness:** 0.80 percentage points
- **Weighted deficiency signal:** 18
- **Justification:** Interfaces, bounded contexts, connector seams, event schemas, policy packs, and UI route seams support extension. Extensibility must be controlled to avoid widening V1 scope.
- **Tradeoffs:** Extension points can become support liabilities if too open.
- **Improvement recommendations:** Require contract tests and owner decisions before new connector families.
- **Disposition:** Fixable in V1 for guardrails; larger ecosystem surfaces are V1.1/v2.

### 40. Supportability

- **Score:** 84
- **Weight:** 1
- **Weighted impact on readiness:** 0.82 percentage points
- **Weighted deficiency signal:** 16
- **Justification:** Health/version, support bundle, correlation IDs, trace IDs, run IDs, audit search, runbooks, and triage output from scripts make supportability strong.
- **Tradeoffs:** The system offers many diagnostic identifiers; support needs a single triage path.
- **Improvement recommendations:** Add a "run support packet" view/command that collects the core identifiers and links.
- **Disposition:** Fixable in V1.

### 41. Observability

- **Score:** 84
- **Weight:** 1
- **Weighted impact on readiness:** 0.82 percentage points
- **Weighted deficiency signal:** 16
- **Justification:** Metrics, traces, custom instruments, Grafana dashboards, Prometheus rules, Application Insights/OTLP/Prometheus exporters, trace headers, and business metrics are well documented. Production sampling and exporter setup remain operator-dependent.
- **Tradeoffs:** Full-fidelity telemetry is expensive; sampling can hide rare failures.
- **Improvement recommendations:** Provide production telemetry posture checks and sample dashboard validation.
- **Disposition:** Fixable in V1.

### 42. Modularity

- **Score:** 84
- **Weight:** 1
- **Weighted impact on readiness:** 0.82 percentage points
- **Weighted deficiency signal:** 16
- **Justification:** The solution is split into many focused projects and test assemblies. This supports modularity but also creates coordination overhead.
- **Tradeoffs:** More modules mean cleaner boundaries and more references to manage.
- **Improvement recommendations:** Keep classes and seams small; avoid new shared abstractions unless they remove real duplication.
- **Disposition:** Fixable/maintainable in V1.

### 43. Cost-Effectiveness

- **Score:** 84
- **Weight:** 1
- **Weighted impact on readiness:** 0.82 percentage points
- **Weighted deficiency signal:** 16
- **Justification:** Simulator-first execution, LLM budget metrics, consumption budgets, FinOps tags, cost docs, Azure-native deployment, and optional roots keep cost visible. Real LLM and enterprise deployment costs still need tenant-specific modeling.
- **Tradeoffs:** Cheapest path is not always the most procurement-friendly or reliable.
- **Improvement recommendations:** Add tier-specific cost envelope examples tied to real telemetry and pilot assumptions.
- **Disposition:** Fixable in V1.

### 44. Testability

- **Score:** 86
- **Weight:** 1
- **Weighted impact on readiness:** 0.84 percentage points
- **Weighted deficiency signal:** 14
- **Justification:** Testability is strong: broad xUnit coverage, property tests, SQL integration tests, live API E2E, mocked UI tests, k6, ZAP, Schemathesis, OpenAPI snapshots, mutation testing, and release smoke.
- **Tradeoffs:** Test suites are layered and complex; developers need to pick the right gate.
- **Improvement recommendations:** Keep the fast path fast, and reserve expensive gates for changed surfaces and release confidence.
- **Disposition:** Fixable in V1 as incremental hygiene.

### 45. Documentation

- **Score:** 86
- **Weight:** 1
- **Weighted impact on readiness:** 0.84 percentage points
- **Weighted deficiency signal:** 14
- **Justification:** Documentation is extensive and unusually honest. The weakness is volume and navigation, not lack of content.
- **Tradeoffs:** Enterprise credibility benefits from depth; users benefit from fewer first-read documents.
- **Improvement recommendations:** Continue treating the five-document spine as the front door and archive or demote competing entry points.
- **Disposition:** Fixable in V1.

### 46. Azure Ecosystem Fit

- **Score:** 86
- **Weight:** 1
- **Weighted impact on readiness:** 0.84 percentage points
- **Weighted deficiency signal:** 14
- **Justification:** Azure fit is strong: Entra ID, Azure SQL, Container Apps, Front Door/WAF, Key Vault, Service Bus, Azure OpenAI, Application Insights/Azure Monitor, private endpoints, Terraform, and Azure Marketplace alignment are all represented.
- **Tradeoffs:** Azure-native focus may narrow some non-Azure buyers, but it improves enterprise realism and security coherence.
- **Improvement recommendations:** Keep non-Azure integration through REST/CLI/events rather than introducing duplicate cloud-native stacks.
- **Disposition:** Strong for V1.

## Top 10 Most Important Weaknesses

1. **The product surface is broader than the buyer's first proof.** The Core Pilot path is good, but the surrounding platform can still overwhelm users before value is proven.
2. **AI-output quality is not yet proven as strongly as HTTP/process correctness.** Simulator and structural checks are strong; real semantic quality needs more gated evidence.
3. **First-party workflow connectors are MVP-thin.** Jira/ServiceNow/Confluence/Slack exist, but need stronger dry-runs, contract tests, diagnostics, and operator proof before enterprise reliance.
4. **Tenant isolation still has documented residual risk.** RLS covers many scoped tables, but child/graph/operational tables remain application-enforced.
5. **Data-consistency enforcement is not uniformly mature across all high-value references.** Detection exists, but quarantine/remediation depth is uneven.
6. **Commercial proof still leans on buyer-provided baselines.** That is honest, but automated ROI confidence remains bounded until real tenant baselines are captured.
7. **Operational readiness is environment-specific.** The repo can define and test gates; it cannot certify a given Azure deployment until those gates run there.
8. **The documentation graph is too large for first-contact users.** The five-doc spine helps, but many docs compete for attention.
9. **Legacy/transitional seams increase maintenance cost.** Coordinator/Authority convergence and rename/state cleanup remain sources of drag.
10. **Procurement-grade assurance friction remains real.** It is intentionally out of headline score, but strict buyers may still demand CPA SOC 2, third-party pen tests, or public references before production.

## Top 5 Monetization Blockers

1. **First value must be visibly fast and sponsor-safe.** If the first review package does not feel compelling in one session, the rest of the platform will not matter.
2. **ROI proof depends on credible baselines.** Without captured customer baseline hours and evidence completeness, value reports can look illustrative rather than decision-grade.
3. **The self-serve commercial un-hold is deferred.** Sales-led V1 is viable, but live Stripe/Marketplace/DNS go-live will matter for lower-touch conversion later.
4. **Differentiation must be shown in the artifact, not just the docs.** Buyers need to see evidence chains, not just "AI architecture review" language.
5. **Public proof is not yet available.** Public references/design-partner case studies are out of current headline scope, but they will affect expansion and founder traction.

## Top 5 Enterprise Adoption Blockers

1. **Procurement assurance friction.** SOC 2 CPA, ISO, and third-party pen-test publication are out of headline scope but remain buyer friction.
2. **Production environment proof.** Enterprises will need evidence that their Azure topology, auth, private endpoints, RLS, telemetry, backups, and CD gates are configured correctly.
3. **Workflow fit.** Jira/ServiceNow/Confluence/Slack must be boringly reliable in the customer's actual workflow.
4. **Operator self-sufficiency.** The docs are rich, but enterprise implementation teams need symptom-first runbooks and a clear support packet.
5. **Policy and data-boundary confidence.** RLS residual risk and uncovered child tables must be consciously accepted or closed before high-sensitivity workloads.

## Top 5 Engineering Risks

1. **Semantic correctness of AI-assisted findings.** Incorrect but plausible findings are the highest-risk failure mode because they can look authoritative.
2. **Tenant isolation mistakes on uncovered tables.** RLS is strong where applied, but uncovered child tables depend on application discipline.
3. **Data drift across manifests, findings, graph snapshots, and artifacts.** Orphan probes help, but partial remediation can leave confusing evidence trails.
4. **Connector reliability under real SaaS APIs.** Rate limits, auth failures, schema changes, and webhook retries can break workflow embeddedness.
5. **Operational configuration drift.** Terraform, app settings, auth modes, RLS state, Key Vault, telemetry exporters, and DNS must stay aligned per environment.

## Most Important Truth

ArchLucid is strong enough to sell as a focused architecture-review pilot, but it must keep proving value through a narrow, evidence-backed first workflow; the broad platform only helps after that first proof lands.

## Top Improvement Opportunities

### 1. DEFERRED Commerce Un-Hold: Stripe Live, Marketplace Publish, and Signup DNS

- **Why it matters:** This would materially improve lower-touch monetization and decision velocity.
- **Expected impact:** Improves Commercial Packaging Readiness, Decision Velocity, Adoption Friction, and Marketability in procurement-realism terms. It should not be counted as a current headline readiness defect because it is explicitly deferred.
- **Affected qualities:** Commercial Packaging Readiness, Decision Velocity, Adoption Friction, Marketability.
- **Status:** DEFERRED.
- **Reason it is deferred:** Requires owner-only actions: Stripe live keys, webhook secret rotation, Azure Marketplace seller/payout/tax verification and publication, and production DNS cutover for `signup.archlucid.net`.
- **Specific information needed later:** Confirmed Stripe live key/webhook secret availability, Marketplace offer status and Partner Center readiness, production Front Door hostname/DNS plan, and the target date/window for the un-hold.

### 2. DEFERRED Formal Assurance Package: CPA SOC 2 / ISO / Third-Party Pen Test

- **Why it matters:** This will reduce enterprise procurement friction for stricter buyers.
- **Expected impact:** Improves Procurement Readiness, Compliance Readiness, Trustworthiness, and Enterprise Adoption in procurement-realism terms. It should not be counted as a current headline readiness defect because CPA SOC 2 and third-party pen-test publication are explicitly deferred/out of scope.
- **Affected qualities:** Procurement Readiness, Compliance Readiness, Trustworthiness, Enterprise Adoption.
- **Status:** DEFERRED.
- **Reason it is deferred:** Requires budget, owner decision, external vendor/CPA selection, engagement timing, legal review, and possibly customer-triggered procurement requirements.
- **Specific information needed later:** Whether to begin SOC 2 Type I readiness, target audit firm or readiness consultant, budget range, desired certification scope, and whether a contracted customer has made this a binding requirement.

### 3. First-Session Proof Rail Hardening

- **Why it matters:** Adoption friction is the biggest weighted deficiency. The product must force the user to the first review package before exposing depth.
- **Expected impact:** Directly improves Adoption Friction (+6-9 pts), Usability (+4-6 pts), Time-to-Value (+3-5 pts), Cognitive Load (+6-8 pts). Weighted readiness impact: +0.7-1.1%.
- **Affected qualities:** Adoption Friction, Usability, Time-to-Value, Cognitive Load, Marketability.
- **Status:** Fully actionable now.
- **Cursor prompt:**

```text
Implement a focused first-session proof rail hardening pass for ArchLucid.

Goal:
Make the Core Pilot path dominate the first operator session until a committed review package exists. The user should be guided through exactly: create architecture review, run pipeline, finalize/commit, review outputs, then optionally send sponsor proof.

Start by reading:
- docs/CORE_PILOT.md
- docs/START_HERE.md
- docs/library/PRODUCT_PACKAGING.md
- archlucid-ui/README.md
- archlucid-ui/src/lib/nav-config.ts
- archlucid-ui/src/lib/layer-guidance.ts
- relevant operator Home / Onboarding / New Run / Run Detail components and tests

Implement:
1. Add or tighten UI copy that says deeper Operate surfaces are optional until the first review package is complete.
2. Ensure the default empty/first-run states emphasize only the four Core Pilot steps and do not visually compete with compare, replay, graph, governance, alerts, or policy packs.
3. Add a lightweight "review package complete" cue after commit that points to artifacts and sponsor/report actions.
4. Add or update Vitest tests that lock the first-session copy and default navigation expectations.
5. Update docs/CORE_PILOT.md only if behavior or wording changes.

Acceptance criteria:
- A fresh operator sees a narrow first-session path with no implication that Operate features are required.
- Existing authority/tier nav behavior remains unchanged.
- Tests cover first-session copy and default visibility.
- No API route, DTO, database, entitlement, or billing behavior changes.

Constraints:
- Do not rename persisted "run" identifiers, REST routes, DTO fields, or database entities.
- Do not weaken API authorization or commercial tier gates.
- Do not remove Operate surfaces; only make first-session guidance sharper.
```

### 4. Buyer-Safe Proof Package Completeness Gate

- **Why it matters:** Monetization depends on whether the sponsor artifact is credible without manual explanation.
- **Expected impact:** Directly improves Proof-of-ROI Readiness (+6-8 pts), Executive Value Visibility (+3-5 pts), Marketability (+2-4 pts), Trustworthiness (+2-3 pts). Weighted readiness impact: +0.5-0.8%.
- **Affected qualities:** Proof-of-ROI Readiness, Executive Value Visibility, Marketability, Trustworthiness, Decision Velocity.
- **Status:** Fully actionable now.
- **Cursor prompt:**

```text
Add a buyer-safe proof package completeness gate for first-value reports.

Goal:
Before a first-value Markdown/PDF/DOCX artifact is presented as sponsor-sendable, it should explicitly report whether required proof fields are complete, partial, or missing. Missing evidence must not be silently glossed over.

Start by reading:
- docs/library/PILOT_ROI_MODEL.md
- docs/EXECUTIVE_SPONSOR_BRIEF.md
- docs/go-to-market/PILOT_BUYER_SAFE_EVIDENCE_TEMPLATE.md
- ArchLucid.Application/Pilots/
- ArchLucid.Application.Tests/Pilots/
- ArchLucid.ArtifactSynthesis/ if PDF/DOCX rendering is involved

Implement:
1. Identify the existing first-value report composition path.
2. Add a structured proof-completeness model if one does not already exist, covering at least: run id, manifest id/version, time to committed manifest, findings by severity, top finding evidence-chain pointer, audit-row count/lower-bound, LLM-call count, ROI evidence confidence, and demo-data warning.
3. Render a clear "Sponsor sendability" section in Markdown and matching PDF/DOCX paths where applicable.
4. If demo data is detected, keep the warning prominent and non-removable.
5. Add unit tests for complete, partial, missing-baseline, missing-evidence-chain, and demo-run cases.
6. Update docs/library/PILOT_ROI_MODEL.md if the generated wording changes.

Acceptance criteria:
- Reports cannot imply strong ROI evidence when baseline or proof fields are missing.
- Demo runs always carry a sponsor-safe warning.
- Tests verify both data classification and rendered output.
- Existing report endpoints remain backward compatible.

Constraints:
- Do not invent customer ROI numbers.
- Do not require a customer baseline to generate a report; classify confidence instead.
- Do not change pricing or commercial terms.
```

### 5. Connector MVP Confidence Pack

- **Why it matters:** Workflow embeddedness is a major enterprise adoption factor, and committed first-party connectors must be boringly diagnosable.
- **Expected impact:** Directly improves Workflow Embeddedness (+6-8 pts), Interoperability (+4-6 pts), Adoption Friction (+2-4 pts), Supportability (+2-3 pts). Weighted readiness impact: +0.4-0.7%.
- **Affected qualities:** Workflow Embeddedness, Interoperability, Adoption Friction, Supportability, Trustworthiness.
- **Status:** Fully actionable now.
- **Cursor prompt:**

```text
Build a connector MVP confidence pack for the committed V1 connector surfaces.

Goal:
For Jira, ServiceNow, Confluence, and Slack/Teams-compatible webhook delivery, add dry-run or contract-test evidence that operators can use before enabling a customer workflow.

Start by reading:
- docs/library/V1_SCOPE.md sections 2.13, 2.14, 2.15
- docs/library/V1_DEFERRED.md sections 6, 6a
- ArchLucid.Application/Integrations/Itsm/
- ArchLucid.Api/Controllers/Integrations/
- ArchLucid.Application/Connectors/Publishing/ConfluenceCloudPublisherConnector.cs
- ArchLucid.Decisioning/Alerts/Delivery/
- ArchLucid.Decisioning.Tests/Alerts/Delivery/
- ArchLucid.Application.Tests/Integrations/Itsm/

Implement:
1. Add focused unit tests for Jira and ServiceNow inbound status mapping, including configured mappings, default mappings, unknown statuses, missing correlation, and audit event payload shape.
2. Add tests for Confluence publishing failure mapping and payload construction without calling the real Confluence API.
3. Add tests for Slack alert payload content, ensuring severity/category/trigger/description are present and no secrets are included.
4. If a dry-run endpoint already exists for related webhook diagnostics, document how these connector checks fit it; otherwise add a minimal documentation-only operator checklist rather than a new public endpoint.
5. Update the relevant integration docs with "before enabling in a customer tenant" checks.

Acceptance criteria:
- No test calls external Jira, ServiceNow, Confluence, Slack, or Teams services.
- Connector payloads and audit metadata are covered by deterministic tests.
- Documentation gives operators a pre-enable checklist.
- No new connector family is introduced.

Constraints:
- Do not add OAuth flows, marketplace listings, or Slack interactive actions.
- Do not widen V1 connector scope beyond the documented MVP.
- Do not persist secrets or full destination URLs in audit payloads.
```

### 6. Real-Output Semantic Quality Gate

- **Why it matters:** The most damaging failure mode is a plausible but wrong AI finding or explanation.
- **Expected impact:** Directly improves Correctness (+5-8 pts), AI/Agent Readiness (+5-7 pts), Explainability (+4-6 pts), Trustworthiness (+3-5 pts). Weighted readiness impact: +0.5-0.9%.
- **Affected qualities:** Correctness, AI/Agent Readiness, Explainability, Trustworthiness, Testability.
- **Status:** Fully actionable now.
- **Cursor prompt:**

```text
Add a small deterministic semantic quality gate for agent outputs.

Goal:
Extend existing structural agent-result checks so at least one CI-safe gate evaluates whether findings and explanations are evidence-backed, not only JSON-shaped.

Start by reading:
- docs/library/AGENT_OUTPUT_EVALUATION.md
- docs/library/EXPLAINABILITY_TRACE_COVERAGE.md
- docs/library/AGENT_EVAL_CORPUS.md
- ArchLucid.Core.Tests/GoldenCorpus/
- ArchLucid.Decisioning.Tests/GoldenCorpus/
- ArchLucid.Application.Tests/ where explanation/first-value report services live
- ArchLucid.Core/Diagnostics/ArchLucidInstrumentation.cs

Implement:
1. Use existing golden-corpus or fixture data; do not call live LLMs in the default test.
2. Add a semantic scoring helper if one does not already exist that checks: finding has claim, evidence reference, severity rationale, affected component, and recommendation/actionability.
3. Add tests that fail on unsupported claims, missing evidence references, empty severity rationale, and explanations that do not cite underlying findings.
4. Emit or verify existing quality metric labels where appropriate.
5. Document how to run the semantic gate locally and how it differs from optional real-LLM evidence runs.

Acceptance criteria:
- The default test path is deterministic and does not require Azure OpenAI credentials.
- Bad fixture output fails for semantic reasons, not only schema reasons.
- Existing simulator-first tests remain stable.
- Documentation clearly separates deterministic gate from optional live-model evidence.

Constraints:
- Do not make live LLM calls merge-blocking.
- Do not add new external dependencies unless already present in the repo.
- Do not tune thresholds to pass weak examples; prefer explicit fixture expectations.
```

### 7. RLS Residual-Risk Closure Plan and Tests

- **Why it matters:** Tenant isolation is enterprise-critical, and documented uncovered tables need either closure or explicit acceptance.
- **Expected impact:** Directly improves Security (+4-6 pts), Data Consistency (+3-5 pts), Trustworthiness (+3-4 pts), Compliance Readiness (+2-3 pts). Weighted readiness impact: +0.4-0.7%.
- **Affected qualities:** Security, Data Consistency, Trustworthiness, Compliance Readiness, Procurement Readiness.
- **Status:** Fully actionable now.
- **Cursor prompt:**

```text
Create an RLS residual-risk closure plan with targeted tests for the highest-risk uncovered tables.

Goal:
Turn the current documented RLS uncovered-table list into an actionable, tested risk register that separates "acceptable application-enforced" from "should denormalize scope and attach RLS predicate."

Start by reading:
- docs/security/MULTI_TENANT_RLS.md
- docs/security/RLS_RISK_ACCEPTANCE.md
- docs/library/TENANT_DATABASE_TOPOLOGY.md
- ArchLucid.Persistence/Migrations/036*, 046*, 096*, 097*, 108*
- ArchLucid.Persistence.Tests/RlsArchLucidScopeIntegrationTests.cs
- ArchLucid.Persistence.Tests/PoolRecyclingSqlConnectionIsolationTests.cs

Implement:
1. Add or update a markdown matrix listing each uncovered high-value child/operational table, why it is uncovered, current application enforcement, proposed disposition, and test coverage.
2. Add focused SQL integration tests for at least the top two high-risk read paths that traverse uncovered child tables through application services, proving cross-tenant data does not leak.
3. If a table can be safely covered by denormalized scope without broad schema churn, propose the migration in the doc but do not implement broad DDL unless the code impact is contained.
4. Cross-link the matrix from MULTI_TENANT_RLS.md.

Acceptance criteria:
- The residual-risk matrix is explicit and actionable.
- At least two high-risk uncovered-table paths gain regression tests.
- No historical migrations are edited.
- No security policy is turned on/off as part of tests without restoring state.

Constraints:
- Do not claim RLS covers tables it does not cover.
- Do not add broad DDL unless localized and fully tested.
- Preserve deny-by-default semantics where RLS is active.
```

### 8. Data-Consistency Quarantine Expansion

- **Why it matters:** Manifest, findings, graph, and artifact evidence must stay internally coherent for trust, support, and audit.
- **Expected impact:** Directly improves Data Consistency (+6-8 pts), Reliability (+3-5 pts), Auditability (+2-3 pts), Supportability (+2-3 pts). Weighted readiness impact: +0.4-0.7%.
- **Affected qualities:** Data Consistency, Reliability, Auditability, Supportability, Trustworthiness.
- **Status:** Fully actionable now.
- **Cursor prompt:**

```text
Expand data-consistency quarantine/remediation coverage for high-value orphan references.

Goal:
Move beyond detection-only posture for the most important run-linked evidence tables by adding safe quarantine or dry-run remediation where the repo already identifies orphan risk.

Start by reading:
- docs/data-consistency/DATA_CONSISTENCY_ENFORCEMENT.md
- docs/runbooks/DATA_CONSISTENCY_ENFORCEMENT.md
- docs/library/V1_REQUIREMENTS_TEST_TRACEABILITY.md data consistency section
- ArchLucid.Host.Core/Hosted/DataConsistency*
- ArchLucid.Persistence/Migrations/099_DataConsistencyQuarantine.sql
- AdminDiagnosticsService and related tests

Implement:
1. Identify the current orphan probes for GoldenManifests, FindingsSnapshots, ContextSnapshots, and GraphSnapshots.
2. Add quarantine support for the next safest high-value orphan class, preserving tenant id when available and never deleting rows automatically.
3. Add dry-run sample logging with capped row counts if not already present for that class.
4. Add metrics for quarantined rows using the existing data-consistency metric naming pattern.
5. Add unit/integration tests for no-op, detection, quarantine insert idempotency, cap behavior, and audit/remediation behavior where applicable.
6. Update docs and runbooks with the new mode and operator steps.

Acceptance criteria:
- Quarantine is idempotent and capped.
- No automatic destructive remediation is introduced.
- Metrics and logs identify table/column slices.
- Tests cover detection and quarantine behavior.

Constraints:
- Do not modify historical migrations.
- Do not delete production data automatically.
- Preserve tenant isolation and avoid logging sensitive payloads.
```

### 9. Environment Readiness Evidence Manifest

- **Why it matters:** The repo can be ready while a specific Azure environment is not. Enterprise buyers need environment-specific evidence.
- **Expected impact:** Directly improves Deployability (+4-6 pts), Reliability (+3-5 pts), Security (+2-4 pts), Manageability (+3-4 pts), Procurement Readiness (+2-3 pts). Weighted readiness impact: +0.3-0.6%.
- **Affected qualities:** Deployability, Reliability, Security, Manageability, Procurement Readiness, Availability.
- **Status:** Fully actionable now.
- **Cursor prompt:**

```text
Add an environment readiness evidence manifest for staging/production handoff.

Goal:
Generate or document a single evidence artifact that records whether the target environment has passed the checks that matter for a buyer or operator handoff.

Start by reading:
- docs/library/V1_RELEASE_CHECKLIST.md
- docs/library/RELEASE_SMOKE.md
- docs/library/REFERENCE_SAAS_STACK_ORDER.md
- docs/library/DEPLOYMENT_TERRAFORM.md
- docs/library/OBSERVABILITY.md
- scripts/ci/cd-post-deploy-verify.sh
- release-smoke.ps1
- run-readiness-check.ps1

Implement:
1. Add a script or documented command path that produces a markdown or JSON evidence manifest for one base URL/environment.
2. Include: timestamp, git commit/version, base URL, health/live result, health/ready result, openapi availability, /version payload, auth mode evidence when available, RLS/session-context posture where available, telemetry exporter posture if exposed, and release-smoke/CD-post-deploy check references.
3. If direct checks require secrets or environment variables, fail with clear missing-input messages.
4. Add docs explaining when to run this before a pilot, staging cut, or production handoff.
5. Add tests for manifest rendering/parsing if implemented in code.

Acceptance criteria:
- Operators can produce a shareable environment-specific readiness artifact.
- The artifact distinguishes "not checked" from "passed" and "failed."
- No secrets are written to the artifact.
- Existing release-smoke behavior is not broken.

Constraints:
- Do not call Azure APIs unless existing scripts already do so.
- Do not hard-code subscription IDs, tenant IDs, or production URLs.
- Do not claim a contractual SLA from these checks.
```

### 10. Run Support Packet

- **Why it matters:** Supportability is already good but spread across run IDs, trace IDs, audit rows, support bundles, and logs. A single packet reduces incident time.
- **Expected impact:** Directly improves Supportability (+5-7 pts), Observability (+3-4 pts), Customer Self-Sufficiency (+3-5 pts), Trustworthiness (+1-2 pts). Weighted readiness impact: +0.2-0.4%.
- **Affected qualities:** Supportability, Observability, Customer Self-Sufficiency, Trustworthiness, Manageability.
- **Status:** Fully actionable now.
- **Cursor prompt:**

```text
Add a run support packet command or endpoint that collects the minimum useful support facts for one run.

Goal:
Given a run id, produce a concise support packet that includes enough identifiers and links for first-line triage without dumping sensitive data.

Start by reading:
- docs/library/CLI_USAGE.md
- docs/library/OBSERVABILITY.md
- docs/library/API_CONTRACTS.md
- docs/library/PILOT_GUIDE.md support reporting section
- ArchLucid.Cli support-bundle and trace commands
- ArchLucid.Api run detail and audit search controllers
- ArchLucid.Application services that retrieve run detail, manifest id, artifacts, audit rows, and trace id

Implement:
1. Prefer extending the CLI if there is already a suitable command pattern; otherwise add an internal API/service only if consistent with existing support surfaces.
2. The packet should include: run id, tenant/workspace/project ids if authorized and non-sensitive, run status, goldenManifestId, manifestVersion, artifact count, latest audit event types for the run, first non-empty correlation id, persisted Otel trace id, version payload, and recommended next diagnostic command.
3. Redact or omit payload bodies, prompts, secrets, full destination URLs, and customer free text.
4. Add tests for normal run, missing run, committed run with artifacts, run with no trace id, and authorization failure where applicable.
5. Update support docs with the new command/output.

Acceptance criteria:
- A support engineer can ask for one command output and start triage.
- The packet is safe to share in a ticket by default.
- Missing fields are shown as missing, not silently omitted.
- Existing support-bundle behavior remains intact.

Constraints:
- Do not expose prompt/response blobs or customer content.
- Do not bypass tenant scope or authorization.
- Do not add broad new diagnostics that duplicate existing support-bundle ZIP content.
```

## Pending Questions for Later

### DEFERRED Commerce Un-Hold: Stripe Live, Marketplace Publish, and Signup DNS

- Are Stripe live keys and the production webhook secret available?
- Is Azure Marketplace seller verification, payout, and tax profile complete?
- What production DNS and Front Door hostname should `signup.archlucid.net` target?
- What target window should the un-hold use?

### DEFERRED Formal Assurance Package: CPA SOC 2 / ISO / Third-Party Pen Test

- Should SOC 2 Type I readiness begin before the documented ARR/customer trigger?
- What budget and timeline are acceptable for readiness consultant, CPA, or pen-test vendor work?
- Which assurance scope matters first: SOC 2, ISO 27001, third-party penetration test, or customer-specific security review?
- Has any contracted customer made formal assurance a binding procurement requirement?
