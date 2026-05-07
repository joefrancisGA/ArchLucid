ArchLucid Assessment – Weighted Readiness 76.35%

## 2. Executive Summary

### Overall Readiness

ArchLucid is past prototype quality and looks like a serious V1/V1.1 product system, but it is not yet a low-friction commercial machine. The weighted score is **76.35%** across the supplied 102 total weight points. The strongest evidence is engineering depth: SQL-backed persistence, versioned APIs, operator UI, Core Pilot path, release smoke, OpenAPI snapshots, live E2E gates, k6 smoke, audit matrices, Terraform roots, and deployment runbooks. The weakest evidence is market proof and buyer immediacy: the product can produce value, but a buyer still has to work too hard to understand, trust, trial, and internally sell that value.

The scope boundary was located in `docs/library/V1_SCOPE.md` and `docs/library/V1_DEFERRED.md`. Items explicitly deferred to V1.1 or V2 were treated as out of scope and were not allowed to reduce the headline readiness score. In particular, absent CPA-issued SOC 2, a third-party pen test, live commerce un-hold, PGP key publication, public reference customer, design partner, and MCP server were not scored as current-scope defects.

### Commercial Picture

The commercial story is coherent but still too dependent on explanation. There is a credible buyer narrative around getting from architecture request to committed manifest and reviewable package faster, and the pricing model is unusually concrete. The problem is proof density: the ROI model is strong as a measurement framework, but much of the persuasive power still depends on a guided pilot, tenant-specific baseline input, and sponsor interpretation. Commercial readiness is viable for founder-led or sales-led pilots, weaker for self-serve or procurement-led conversion.

### Enterprise Picture

Enterprise posture is better than most products at this stage because trust, audit, RLS, DPA, questionnaires, subprocessors, API contracts, and operational runbooks exist and are linked into a buyer-facing trust center. The blunt enterprise reality is that many buyers will still treat self-attested SOC posture and owner-conducted security testing as procurement friction. That friction is informational, not a headline V1 readiness deduction, because the repo explicitly scopes CPA SOC 2 and external pen-test publication outside the current headline score.

### Engineering Picture

Engineering is the strongest area. The codebase is modular, test-heavy, CI-disciplined, Azure-oriented, and unusually observability-aware. The main risks are not "does software exist?" but "can operators and buyers reason about it without drowning?", "do real-mode AI outputs remain consistently trustworthy?", "does broad scope stay internally coherent?", and "can production-like deployments be operated without expert intervention?" The current architecture can support pilots; scaling into repeatable SaaS adoption needs sharper paths, stronger proof automation, and less cognitive overhead.

Weighted readiness math:

- Total weight: **102**
- Weighted points earned: **7,788 / 10,200**
- Weighted overall readiness: **76.35%**

## 3. Weighted Quality Assessment

Qualities are ordered by **weighted deficiency signal**: `(100 - score) × weight`. Higher signal means the weakness matters more to the overall model.

### 1. Marketability

- **Score:** 70
- **Weight:** 8
- **Weighted impact on readiness:** 5.49 / 7.84 possible points
- **Weighted deficiency signal:** 240
- **Justification:** The buyer narrative is clear: reduce architecture-review packaging effort and improve evidence trails. The repo has sponsor briefs, pricing, trust center, procurement pack, demo path, and Core Pilot. The gap is that the category still relies heavily on explanation and guided interpretation. The product is marketable to a warm sponsor, less obviously marketable to a cold buyer scanning for immediate proof.
- **Tradeoffs:** The restrained V1 claim is honest and lowers credibility risk, but it also makes the product feel less urgent than broader AI governance or platform-engineering tools.
- **Improvement recommendations:** tighten public proof path, make the first-value report the primary artifact, reduce buyer copy spread, and surface one "why buy now" proof page.
- **Fix timing:** Fixable in V1 for messaging and proof packaging; broader market proof belongs outside engineering and should not be treated as a code-only gate.

### 2. Adoption Friction

- **Score:** 71
- **Weight:** 6
- **Weighted impact on readiness:** 4.18 / 5.88 possible points
- **Weighted deficiency signal:** 174
- **Justification:** The Core Pilot path is intentionally narrow, and the UI uses progressive disclosure. That is good. But the overall repo and product surface are large: Pilot, Operate, governance, alerts, audit, graph, compare, replay, advisory, billing, trust, ITSM, Confluence, Slack, Azure extraction, Terraform emit, and many runbooks. A new customer can complete the happy path, but a buyer or operator can still feel they are entering a dense system.
- **Tradeoffs:** Broad capability creates expansion surface, but breadth hurts first-session clarity.
- **Improvement recommendations:** make the first-session rail harder to miss, collapse optional language behind "after first package", and add a self-check that verifies readiness for the single Core Pilot path.
- **Fix timing:** Fixable in V1.

### 3. Proof-of-ROI Readiness

- **Score:** 67
- **Weight:** 5
- **Weighted impact on readiness:** 3.28 / 4.90 possible points
- **Weighted deficiency signal:** 165
- **Justification:** The ROI model is thoughtful and distinguishes computed metrics from qualitative inputs. The first-value report, sponsor PDF, pilot deltas, audit counts, findings mix, and baseline confidence language are valuable. The weakness is that some of the most commercially important metrics remain operator-filled or dependent on buyer-provided baseline estimates.
- **Tradeoffs:** Honest ROI beats fake precision, but honest partial measurement closes fewer deals by itself.
- **Improvement recommendations:** automate a proof completeness score, flag weak ROI evidence before sponsor sharing, and make tenant baseline capture unavoidable but lightweight.
- **Fix timing:** Mostly fixable in V1; real customer outcome proof is outside current scope.

### 4. Time-to-Value

- **Score:** 82
- **Weight:** 7
- **Weighted impact on readiness:** 5.63 / 6.86 possible points
- **Weighted deficiency signal:** 126
- **Justification:** The product has a tight Core Pilot: create request, execute, commit/finalize, review outputs. Simulator mode, sample review, CLI `try`, second-run templates, and health/version endpoints all support fast first value. The remaining drag is setup/configuration and the distance between "demo completed" and "buyer-safe proof package."
- **Tradeoffs:** Simulator mode speeds evaluation but can weaken confidence if buyers think the value is demo-shaped.
- **Improvement recommendations:** add a "first real proof" readiness checklist and make the UI distinguish sample, simulator, and real tenant evidence sharply.
- **Fix timing:** Fixable in V1.

### 5. Differentiability

- **Score:** 73
- **Weight:** 4
- **Weighted impact on readiness:** 2.86 / 3.92 possible points
- **Weighted deficiency signal:** 108
- **Justification:** ArchLucid differentiates through committed manifests, authority traces, governance evidence, auditability, architecture-review packaging, and Azure-oriented enterprise posture. The risk is that many claims sound adjacent to generic AI architecture assistants unless the proof package foregrounds the durable manifest/evidence chain.
- **Tradeoffs:** Strong enterprise controls make the product less flashy but more defensible.
- **Improvement recommendations:** center the "committed manifest + evidence chain" as the moat; show how it differs from chat, docs generators, and one-off diagrams.
- **Fix timing:** Fixable in V1 messaging and UI artifacts.

### 6. Correctness

- **Score:** 78
- **Weight:** 4
- **Weighted impact on readiness:** 3.06 / 3.92 possible points
- **Weighted deficiency signal:** 88
- **Justification:** Correctness has strong support from schema validation, OpenAPI snapshots, SQL integration tests, full regression, live E2E, simulator tests, contract docs, and deterministic demo paths. The remaining correctness risk is real-mode AI output quality: quality gates are present but shipped reject floors are effectively warn-oriented unless configured stricter.
- **Tradeoffs:** Warn-first gates avoid blocking pilots on model variability but allow weak outputs to flow unless operators configure rejection.
- **Improvement recommendations:** introduce stricter pilot-safe quality gates for real runs, especially for evidence citation and finding completeness.
- **Fix timing:** Fixable in V1 for pilot-safe defaults; model benchmarking matures over time.

### 7. Executive Value Visibility

- **Score:** 78
- **Weight:** 4
- **Weighted impact on readiness:** 3.06 / 3.92 possible points
- **Weighted deficiency signal:** 88
- **Justification:** The executive sponsor brief, first-value report, sponsor PDF, pricing model, and ROI model give leaders a clear story. The weakness is that value is spread across several artifacts and may require a sales engineer to assemble the exact narrative.
- **Tradeoffs:** Separate artifacts keep each audience honest, but they fragment the sponsor path.
- **Improvement recommendations:** make one sponsor packet the canonical handoff from a committed run.
- **Fix timing:** Fixable in V1.

### 8. Usability

- **Score:** 72
- **Weight:** 3
- **Weighted impact on readiness:** 2.12 / 2.94 possible points
- **Weighted deficiency signal:** 84
- **Justification:** The UI has a progressive shell, default Pilot path, and multiple seam tests. The docs acknowledge that advanced features should be hidden until needed. The weakness is the amount of terminology and feature surface a user can still encounter: run, architecture review, manifest, authority, artifacts, governance, advisory, graph, replay, alerts, and tiers.
- **Tradeoffs:** Precision helps operators and support teams but increases first-user cognitive load.
- **Improvement recommendations:** use outcome language first and technical nouns second; improve empty states and "what do I do next?" prompts.
- **Fix timing:** Fixable in V1.

### 9. Workflow Embeddedness

- **Score:** 74
- **Weight:** 3
- **Weighted impact on readiness:** 2.18 / 2.94 possible points
- **Weighted deficiency signal:** 78
- **Justification:** REST, CLI, operator UI, webhooks, Service Bus, Jira, ServiceNow, Confluence, Slack, Azure extractor, and CI integrations show serious embedding intent. The weakness is that embedded workflows still require configuration and buyer process alignment.
- **Tradeoffs:** Enterprise-native integration takes longer than generic exports but creates stronger expansion.
- **Improvement recommendations:** provide one default workflow recipe per persona: architect review, governance review, procurement evidence, CI manifest delta.
- **Fix timing:** Fixable in V1 for recipes and defaults; deeper workflow adoption matures in customer rollouts.

### 10. Trustworthiness

- **Score:** 76
- **Weight:** 3
- **Weighted impact on readiness:** 2.24 / 2.94 possible points
- **Weighted deficiency signal:** 72
- **Justification:** Trustworthiness benefits from append-only audit posture, RLS documentation, threat models, procurement artifacts, explicit AI explanation limits, and evidence citations. The gap is reliance on self-attested controls and configurable AI quality thresholds. Procurement friction from absent CPA SOC 2 is real but not scored as a V1/V1.1 headline defect.
- **Tradeoffs:** Honest trust posture is better than overclaiming, but it gives cautious buyers reasons to slow down.
- **Improvement recommendations:** make in-product trust evidence more directly tied to each run and expose a proof completeness gate.
- **Fix timing:** Fixable in V1 for product evidence; third-party assurance is deferred/out of scope.

### 11. Security

- **Score:** 78
- **Weight:** 3
- **Weighted impact on readiness:** 2.29 / 2.94 possible points
- **Weighted deficiency signal:** 66
- **Justification:** Security posture includes JWT/API key modes, development bypass guards, startup warnings, RLS, Key Vault-oriented secret references, deny-by-default guidance, gitleaks, CodeQL, Trivy, ZAP, Schemathesis, no public SMB posture, and documented threat models. The risk is that some production-like misconfiguration checks are advisory rather than fail-fast, especially where configuration must be set correctly by operators.
- **Tradeoffs:** Advisory warnings avoid blocking legitimate staged environments, but enterprises often prefer hard stops for dangerous production misconfigurations.
- **Improvement recommendations:** add stricter production-profile validation for authentication, CORS, redaction, RLS, and telemetry export.
- **Fix timing:** Fixable in V1.

### 12. Decision Velocity

- **Score:** 68
- **Weight:** 2
- **Weighted impact on readiness:** 1.33 / 1.96 possible points
- **Weighted deficiency signal:** 64
- **Justification:** Pricing, order form templates, quote request flow, and procurement pack all exist. Decision velocity remains constrained by the amount of review material, sales-led motion, and buyer confidence work. Live self-serve commerce un-hold is explicitly deferred and not scored as a current defect.
- **Tradeoffs:** Sales-led pilots can close higher-quality early customers but reduce velocity versus self-serve.
- **Improvement recommendations:** create a one-page buying path that maps pilot proof to purchase next steps.
- **Fix timing:** Fixable in V1 for content/process; live commerce activation is V1.1/owner-gated.

### 13. Architectural Integrity

- **Score:** 80
- **Weight:** 3
- **Weighted impact on readiness:** 2.35 / 2.94 possible points
- **Weighted deficiency signal:** 60
- **Justification:** The C4 docs, modular assemblies, persistence boundaries, application services, host composition, CLI, worker, and UI separation are coherent. ADRs and tests protect many seams. The weakness is surface-area sprawl: many subsystems now exist, and maintaining conceptual integrity will require continued discipline.
- **Tradeoffs:** The architecture is extensible but not small.
- **Improvement recommendations:** keep the Core Pilot path as the architectural spine and require new surfaces to map back to it or explicitly sit behind Operate.
- **Fix timing:** Fixable in V1 as governance over change.

### 14. Procurement Readiness

- **Score:** 72
- **Weight:** 2
- **Weighted impact on readiness:** 1.41 / 1.96 possible points
- **Weighted deficiency signal:** 56
- **Justification:** DPA, subprocessors, CAIQ/SIG-style materials, trust center, evidence pack, security docs, and pricing/order templates are strong. Procurement friction remains because many controls are self-asserted and because formal third-party assurance is outside current scope.
- **Tradeoffs:** The repo is honest, which helps credibility, but honesty does not eliminate RFP friction.
- **Improvement recommendations:** add a procurement answer map that distinguishes "implemented", "self-attested", "roadmap", and "not applicable" in one buyer-safe artifact.
- **Fix timing:** Fixable in V1 for clarity; CPA SOC 2 and external pen test are out of scope.

### 15. Compliance Readiness

- **Score:** 74
- **Weight:** 2
- **Weighted impact on readiness:** 1.45 / 1.96 possible points
- **Weighted deficiency signal:** 52
- **Justification:** Compliance readiness is supported by self-assessment, control mappings, audit exports, RLS, trust center, and procurement templates. It is not equivalent to formal certification, and the docs correctly avoid saying so.
- **Tradeoffs:** Strong internal mapping enables pilots, but not every regulated enterprise will accept it without additional contracting.
- **Improvement recommendations:** tie compliance evidence to run-level audit and governance records, not only static documents.
- **Fix timing:** Fixable in V1 for evidence linkage; formal attestation is out of scope.

### 16. Data Consistency

- **Score:** 74
- **Weight:** 2
- **Weighted impact on readiness:** 1.45 / 1.96 possible points
- **Weighted deficiency signal:** 52
- **Justification:** SQL is the authority store, DbUp migrations are central, greenfield boot is CI-gated, orphan probes exist, quarantine mode exists, and data consistency metrics are documented. The need for orphan probes and quarantine implies the domain has had enough relational drift risk to deserve continued scrutiny.
- **Tradeoffs:** Detection and quarantine are operationally honest; stronger FK enforcement everywhere may be harder with legacy tables and migration constraints.
- **Improvement recommendations:** move from detection-first to prevention-first where safe, especially for run/manifest/finding chains.
- **Fix timing:** Fixable in V1 in targeted paths.

### 17. Commercial Packaging Readiness

- **Score:** 76
- **Weight:** 2
- **Weighted impact on readiness:** 1.49 / 1.96 possible points
- **Weighted deficiency signal:** 48
- **Justification:** Tiers, prices, overages, quote path, order form, Stripe/Marketplace wiring, and tier naming guards are strong. The lack of live commerce flip is out of scope. Remaining weakness is that the packaging needs sharper buyer explanation and fewer internal caveats.
- **Tradeoffs:** Detailed pricing reduces ambiguity but exposes readiness caveats.
- **Improvement recommendations:** simplify the public packaging page and make sales-led versus self-serve paths explicit.
- **Fix timing:** Fixable in V1 for packaging clarity.

### 18. Reliability

- **Score:** 76
- **Weight:** 2
- **Weighted impact on readiness:** 1.49 / 1.96 possible points
- **Weighted deficiency signal:** 48
- **Justification:** Reliability is backed by health/readiness, retries, circuit breakers, chaos tests, DbUp startup behavior, CD rollback, and runbooks. V1 does not promise multi-region active/active, which is appropriately out of scope.
- **Tradeoffs:** Single-region readiness is sufficient for V1 pilots but not enough for high-availability enterprise claims.
- **Improvement recommendations:** tighten production readiness checks and make failure-mode runbooks easier to execute.
- **Fix timing:** Fixable in V1 for single-region reliability; multi-region guarantees are out of scope.

### 19. Maintainability

- **Score:** 76
- **Weight:** 2
- **Weighted impact on readiness:** 1.49 / 1.96 possible points
- **Weighted deficiency signal:** 48
- **Justification:** The project is modular, documented, and test-protected. The maintainability risk is volume: many assemblies, docs, workflows, feature flags, and buyer artifacts require synchronization.
- **Tradeoffs:** Aggressive modularity improves local ownership but increases cross-file coordination.
- **Improvement recommendations:** keep adding guard tests for cross-surface invariants and retire stale shims on schedule.
- **Fix timing:** Fixable in V1 and ongoing.

### 20. Interoperability

- **Score:** 78
- **Weight:** 2
- **Weighted impact on readiness:** 1.53 / 1.96 possible points
- **Weighted deficiency signal:** 44
- **Justification:** Versioned REST, OpenAPI, AsyncAPI, CLI, webhooks, Service Bus, ITSM, Confluence, Slack, Azure extractor, Terraform export, and CI integration assets create a strong interoperability base. MCP is explicitly V1.1 and not scored here.
- **Tradeoffs:** Many integration points raise support burden.
- **Improvement recommendations:** prioritize canonical payload contracts and conformance tests over per-target special cases.
- **Fix timing:** Fixable in V1.

### 21. Traceability

- **Score:** 86
- **Weight:** 3
- **Weighted impact on readiness:** 2.53 / 2.94 possible points
- **Weighted deficiency signal:** 42
- **Justification:** Traceability is a major strength: run IDs, manifests, evidence chains, audit rows, correlation IDs, OpenTelemetry trace IDs, traceability bundles, and run-level dashboards all exist. The remaining issue is making this traceability easy for non-engineers to consume.
- **Tradeoffs:** Detailed traceability can overwhelm if not summarized well.
- **Improvement recommendations:** expose a concise traceability health card on run detail.
- **Fix timing:** Fixable in V1.

### 22. AI/Agent Readiness

- **Score:** 79
- **Weight:** 2
- **Weighted impact on readiness:** 1.55 / 1.96 possible points
- **Weighted deficiency signal:** 42
- **Justification:** Simulator mode, real Azure OpenAI path, traces, prompt/version controls, quality metrics, circuit breakers, cost tracking, and schema remediation are strong. The main weakness is that real-mode trust still depends on configured thresholds and operator review.
- **Tradeoffs:** Human-in-the-loop posture is appropriate, but buyers may expect stronger automated rejection of weak outputs.
- **Improvement recommendations:** strengthen real-mode acceptance gates and expose per-run AI quality summaries.
- **Fix timing:** Fixable in V1.

### 23. Explainability

- **Score:** 80
- **Weight:** 2
- **Weighted impact on readiness:** 1.57 / 1.96 possible points
- **Weighted deficiency signal:** 40
- **Justification:** Explain endpoints, aggregate summaries, citations, faithfulness fallback, explainability metrics, and documentation of AI limits are substantial. The challenge is turning explainability from an API capability into a buyer-visible confidence signal.
- **Tradeoffs:** LLM explanations improve usability but need guardrails so they do not masquerade as proof.
- **Improvement recommendations:** make citation coverage and faithfulness fallback visible in the sponsor report.
- **Fix timing:** Fixable in V1.

### 24. Azure Compatibility and SaaS Deployment Readiness

- **Score:** 82
- **Weight:** 2
- **Weighted impact on readiness:** 1.61 / 1.96 possible points
- **Weighted deficiency signal:** 36
- **Justification:** The solution is strongly Azure-aligned: Container Apps, SQL, Service Bus, Front Door/WAF, Key Vault, Entra, Terraform roots, Azure Monitor/Application Insights, OIDC CD, and private endpoint posture. The remaining risk is operational setup complexity and environment-specific tfvars/secrets.
- **Tradeoffs:** Azure-native depth fits enterprise buyers but increases initial platform setup effort.
- **Improvement recommendations:** harden `terraform-pilot` as the single default SaaS readiness entry.
- **Fix timing:** Fixable in V1.

### 25. Cognitive Load

- **Score:** 65
- **Weight:** 1
- **Weighted impact on readiness:** 0.64 / 0.98 possible points
- **Weighted deficiency signal:** 35
- **Justification:** This is one of the raw weakest qualities. The product and repo contain a lot: many docs, subsystems, terms, gates, feature flags, and workflows. Progressive disclosure helps, but the user and contributor mental model is still heavy.
- **Tradeoffs:** Enterprise-grade evidence creates unavoidable complexity; the product must actively hide that complexity from first-time users.
- **Improvement recommendations:** simplify first-run copy, unify terminology, and route users through one artifact at a time.
- **Fix timing:** Fixable in V1.

### 26. Policy and Governance Alignment

- **Score:** 83
- **Weight:** 2
- **Weighted impact on readiness:** 1.63 / 1.96 possible points
- **Weighted deficiency signal:** 34
- **Justification:** Approval workflows, segregation of duties, policy packs, pre-commit gates, governance dashboard, audit events, SLA breach tracking, and dry-run semantics are strong. The risk is operational comprehension and rollout, not missing primitives.
- **Tradeoffs:** Governance power can intimidate first-pilot users if surfaced too early.
- **Improvement recommendations:** keep governance behind Operate until the first package is proven.
- **Fix timing:** Fixable in V1.

### 27. Customer Self-Sufficiency

- **Score:** 70
- **Weight:** 1
- **Weighted impact on readiness:** 0.69 / 0.98 possible points
- **Weighted deficiency signal:** 30
- **Justification:** Docs, quickstarts, runbooks, support bundles, CLI diagnostics, and troubleshooting materials are extensive. The weakness is findability and volume. Self-sufficiency is possible but not effortless.
- **Tradeoffs:** Comprehensive docs help support but can become a maze.
- **Improvement recommendations:** add a task-based "I am stuck at step X" resolver for Core Pilot.
- **Fix timing:** Fixable in V1.

### 28. Availability

- **Score:** 72
- **Weight:** 1
- **Weighted impact on readiness:** 0.71 / 0.98 possible points
- **Weighted deficiency signal:** 28
- **Justification:** Health probes, Container Apps deployment, rollback, readiness checks, and SQL failover docs support availability. V1 explicitly does not promise active/active multi-region SaaS.
- **Tradeoffs:** V1 availability is credible for pilots, not yet a premium enterprise SLA posture.
- **Improvement recommendations:** produce a concise single-region availability runbook and evidence checklist.
- **Fix timing:** V1 for single-region; multi-region out of scope.

### 29. Accessibility

- **Score:** 74
- **Weight:** 1
- **Weighted impact on readiness:** 0.73 / 0.98 possible points
- **Weighted deficiency signal:** 26
- **Justification:** The repo includes accessibility docs and axe component tests. The remaining gap is full confidence across all live UI flows and buyer-facing pages under realistic data.
- **Tradeoffs:** Component-level coverage is fast; full browser accessibility is slower and more brittle.
- **Improvement recommendations:** expand live accessibility smoke on Core Pilot pages.
- **Fix timing:** Fixable in V1.

### 30. Scalability

- **Score:** 74
- **Weight:** 1
- **Weighted impact on readiness:** 0.73 / 0.98 possible points
- **Weighted deficiency signal:** 26
- **Justification:** The system has pagination, caching, k6 smoke, per-tenant burst tests, SQL topology docs, background workers, queue/outbox patterns, and cost controls. It is not yet proven as a high-scale multi-region SaaS.
- **Tradeoffs:** Current scale evidence is pilot/CI-shaped, not broad production telemetry.
- **Improvement recommendations:** add a repeatable SaaS scale envelope document with measured ceilings and tested assumptions.
- **Fix timing:** Fixable in V1 for pilot envelope; large-scale proof evolves later.

### 31. Template and Accelerator Richness

- **Score:** 75
- **Weight:** 1
- **Weighted impact on readiness:** 0.74 / 0.98 possible points
- **Weighted deficiency signal:** 25
- **Justification:** There are starter proof packs, integration recipes, reference architectures, demo seeds, and pilot templates. The weakness is curation: customers need fewer, more obviously relevant starting points.
- **Tradeoffs:** More templates improve breadth but can dilute first-choice clarity.
- **Improvement recommendations:** curate the top three accelerators for the first buying motions.
- **Fix timing:** Fixable in V1.

### 32. Auditability

- **Score:** 88
- **Weight:** 2
- **Weighted impact on readiness:** 1.73 / 1.96 possible points
- **Weighted deficiency signal:** 24
- **Justification:** Auditability is a standout strength: append-only SQL audit, event catalog, CI matrix guard, export/search endpoints, correlation IDs, governance events, and known-gap tracking. The open catalog-only gaps are narrow and documented.
- **Tradeoffs:** Not every read path needs durable audit; over-auditing can create noise.
- **Improvement recommendations:** keep expanding durable audit when new mutation paths ship.
- **Fix timing:** V1/on-going.

### 33. Stickiness

- **Score:** 76
- **Weight:** 1
- **Weighted impact on readiness:** 0.75 / 0.98 possible points
- **Weighted deficiency signal:** 24
- **Justification:** Stickiness comes from manifests, audit history, governance workflows, policy packs, traceability, integrations, and sponsor value reports. The weakness is that stickiness requires repeated use; first-pilot proof alone may not make the product habit-forming.
- **Tradeoffs:** Governance stickiness is strong but only after adoption crosses a threshold.
- **Improvement recommendations:** add second-run prompts that naturally lead to compare/replay and governance adoption.
- **Fix timing:** Fixable in V1.

### 34. Performance

- **Score:** 76
- **Weight:** 1
- **Weighted impact on readiness:** 0.75 / 0.98 possible points
- **Weighted deficiency signal:** 24
- **Justification:** Performance has hot-path caching, k6 merge-blocking smoke, scheduled burst/soak assets, p95 budgets, and query allowlist patterns. Evidence is strongest for pilot-shaped paths, not wide production traffic.
- **Tradeoffs:** Simulator path performance is easier to prove than real LLM path latency.
- **Improvement recommendations:** publish separate budgets for simulator, real-LLM, and export-heavy paths.
- **Fix timing:** Fixable in V1.

### 35. Cost-Effectiveness

- **Score:** 77
- **Weight:** 1
- **Weighted impact on readiness:** 0.75 / 0.98 possible points
- **Weighted deficiency signal:** 23
- **Justification:** Simulator mode, LLM token budgeting, monthly hard stops, pilot cost docs, pricing assumptions, and Azure-native deployment choices support cost-effectiveness. The risk is that hosted SaaS with many Azure services can become expensive before utilization is high.
- **Tradeoffs:** Enterprise-ready Azure posture costs more than a minimal single-process app.
- **Improvement recommendations:** expose operator cost envelope and per-tenant unit economics in one runbook.
- **Fix timing:** Fixable in V1.

### 36. Manageability

- **Score:** 78
- **Weight:** 1
- **Weighted impact on readiness:** 0.76 / 0.98 possible points
- **Weighted deficiency signal:** 22
- **Justification:** Configuration catalogs, health endpoints, diagnostics, support bundles, runbooks, dashboards, and admin endpoints support manageability. Weakness is configuration breadth.
- **Tradeoffs:** Configurability supports enterprise deployment but raises misconfiguration risk.
- **Improvement recommendations:** add production-profile validation that produces a single pass/fail checklist.
- **Fix timing:** Fixable in V1.

### 37. Evolvability

- **Score:** 78
- **Weight:** 1
- **Weighted impact on readiness:** 0.76 / 0.98 possible points
- **Weighted deficiency signal:** 22
- **Justification:** Versioned APIs, ADRs, modular projects, OpenAPI snapshots, and documented deferred scopes support evolution. The main risk is broadening faster than the conceptual model can absorb.
- **Tradeoffs:** Feature breadth creates optionality but can slow future refactors.
- **Improvement recommendations:** require new features to declare their Pilot/Operate layer and owner-facing evidence path.
- **Fix timing:** Fixable in V1.

### 38. Deployability

- **Score:** 79
- **Weight:** 1
- **Weighted impact on readiness:** 0.77 / 0.98 possible points
- **Weighted deficiency signal:** 21
- **Justification:** Dockerfiles, compose profiles, Terraform roots, CI Docker smoke, manual CD, OIDC, Container Apps rollout, and smoke checks create deployability. The weak point is number of required environment secrets and optional roots.
- **Tradeoffs:** Flexible deployment supports many orgs but needs careful operator setup.
- **Improvement recommendations:** make `terraform-pilot` and `deployment-evidence` the default deployability proof.
- **Fix timing:** Fixable in V1.

### 39. Extensibility

- **Score:** 80
- **Weight:** 1
- **Weighted impact on readiness:** 0.78 / 0.98 possible points
- **Weighted deficiency signal:** 20
- **Justification:** Connectors, application services, contracts, publishing interfaces, webhook payloads, and optional integration events support extension. MCP is out of current V1 scope.
- **Tradeoffs:** Extensibility increases test and support matrix.
- **Improvement recommendations:** keep extension points thin and contract-tested.
- **Fix timing:** Fixable in V1/on-going.

### 40. Supportability

- **Score:** 82
- **Weight:** 1
- **Weighted impact on readiness:** 0.80 / 0.98 possible points
- **Weighted deficiency signal:** 18
- **Justification:** Correlation IDs, support bundles, `/version`, health endpoints, trace IDs, audit search, CLI doctor, and runbooks make supportability strong.
- **Tradeoffs:** Supportability depends on operators configuring telemetry exporters and preserving logs.
- **Improvement recommendations:** make support bundle completeness visible before handoff.
- **Fix timing:** Fixable in V1.

### 41. Observability

- **Score:** 83
- **Weight:** 1
- **Weighted impact on readiness:** 0.81 / 0.98 possible points
- **Weighted deficiency signal:** 17
- **Justification:** Custom metrics, traces, dashboards, alert rules, run lifecycle dashboards, business KPIs, and trace headers are strong. The main issue is sampling and exporter configuration: metrics exist but require environment setup to become operational evidence.
- **Tradeoffs:** Flexible exporter options avoid vendor lock-in but require operator discipline.
- **Improvement recommendations:** add a production observability readiness gate.
- **Fix timing:** Fixable in V1.

### 42. Change Impact Clarity

- **Score:** 84
- **Weight:** 1
- **Weighted impact on readiness:** 0.82 / 0.98 possible points
- **Weighted deficiency signal:** 16
- **Justification:** Compare, replay, manifest deltas, OpenAPI snapshots, changelog discipline, audit trails, and ADRs support change clarity. The remaining gap is buyer-friendly summarization.
- **Tradeoffs:** Detailed diffs help engineers but may need executive translation.
- **Improvement recommendations:** add a business-impact summary to comparison outputs.
- **Fix timing:** Fixable in V1.

### 43. Modularity

- **Score:** 84
- **Weight:** 1
- **Weighted impact on readiness:** 0.82 / 0.98 possible points
- **Weighted deficiency signal:** 16
- **Justification:** The solution is split across API, application, core, persistence, contracts, decisioning, retrieval, provenance, knowledge graph, notifications, UI, CLI, worker, and integration projects. This is good modularity.
- **Tradeoffs:** Many modules increase onboarding overhead.
- **Improvement recommendations:** maintain module maps and keep dependency direction enforced.
- **Fix timing:** Ongoing.

### 44. Testability

- **Score:** 86
- **Weight:** 1
- **Weighted impact on readiness:** 0.84 / 0.98 possible points
- **Weighted deficiency signal:** 14
- **Justification:** Testability is strong: unit, integration, SQL container, full regression, UI Vitest, axe, live Playwright, auth parity, k6, chaos, OpenAPI snapshots, and scheduled security tests.
- **Tradeoffs:** Extensive test tiers increase CI time and maintenance.
- **Improvement recommendations:** keep tiering crisp and prevent flaky E2E from eroding trust.
- **Fix timing:** Ongoing.

### 45. Azure Ecosystem Fit

- **Score:** 86
- **Weight:** 1
- **Weighted impact on readiness:** 0.84 / 0.98 possible points
- **Weighted deficiency signal:** 14
- **Justification:** Azure fit is excellent: Entra, SQL, Container Apps, Service Bus, Key Vault, Front Door/WAF, Azure Monitor, Azure OpenAI, Terraform, OIDC, Azure extractor, and Marketplace wiring all align.
- **Tradeoffs:** Azure-first stance may narrow appeal to non-Azure buyers but strengthens target-market coherence.
- **Improvement recommendations:** keep Azure as the default and document non-Azure as secondary.
- **Fix timing:** Strong now.

### 46. Documentation

- **Score:** 88
- **Weight:** 1
- **Weighted impact on readiness:** 0.86 / 0.98 possible points
- **Weighted deficiency signal:** 12
- **Justification:** Documentation is extensive, scoped, indexed, and often CI-guarded. The problem is not absence; it is volume and repeated context.
- **Tradeoffs:** Deep docs support enterprise diligence but can slow first use.
- **Improvement recommendations:** continue separating spine docs from lookup docs and remove stale references aggressively.
- **Fix timing:** Ongoing.

## 4. Top 12 Most Important Weaknesses

1. **The product is more complete than it is easy to buy.** Engineering depth is ahead of commercial simplicity.
2. **ROI proof is credible but not yet automatic enough.** The product computes useful deltas, but high-conviction business proof still depends on baseline input and human interpretation.
3. **First-session clarity fights a large product surface.** Core Pilot is narrow, but the surrounding Operate/governance/integration vocabulary is heavy.
4. **Marketability depends on a guided narrative.** A strong sales engineer can explain ArchLucid; a cold buyer may not immediately see urgency.
5. **Trust evidence is broad but self-attested.** This is acceptable for scoped readiness but creates enterprise diligence friction.
6. **Real-mode AI output confidence still depends on configurable thresholds.** The system observes quality but should make pilot-safe acceptance stricter by default.
7. **Production readiness has too many advisory-only checks.** Some dangerous configuration states are warned rather than blocked.
8. **The sponsor handoff is spread across multiple artifacts.** Executive brief, ROI model, first-value report, value report, and proof package need one canonical run-level path.
9. **Customer self-sufficiency is possible but not effortless.** The docs are rich, but a stuck operator may still need a guide.
10. **Data consistency posture is detection-heavy.** Orphan probes and quarantine are good, but prevention should be strengthened in the highest-value chains.
11. **Workflow embedding is broad but needs clearer default recipes.** Integrations exist, but customers need one obvious recipe per adoption motion.
12. **Cognitive load is the hidden tax.** The product asks users to understand too many terms before they feel value.

## 5. Top 6 Monetization Blockers

1. **Insufficient automatic proof of value.** Buyers need a sponsor-ready artifact that says exactly what improved, how complete the evidence is, and what remains qualitative.
2. **Too much explanation before purchase confidence.** The current narrative is credible but long.
3. **Self-serve commerce un-hold is out of current scope.** This should not reduce current readiness, but it limits near-term monetization velocity.
4. **Reference and trust discounts remain commercially rational.** They are deferred/out of headline scope, but they keep pricing below full fair-value confidence.
5. **Packaging caveats can confuse buyers.** Team bundled Stripe SKU, list-price decomposition, sales-led quote path, and Marketplace alignment are understandable but need simpler presentation.
6. **Expansion path is conceptually strong but not yet usage-proven.** Governance and Operate can drive expansion, but buyers must first experience repeated value.

## 6. Top 6 Enterprise Adoption Blockers

1. **Formal assurance friction.** CPA SOC 2 and external pen-test publication are out of scope for the headline score, but enterprise reviewers will still ask.
2. **Configuration confidence.** Auth, CORS, RLS, telemetry, secrets, Key Vault, and deployment settings need a single production pass/fail gate.
3. **Operator cognitive load.** Enterprise implementation teams need fewer first-run decisions.
4. **AI trust posture.** Reviewers need visible evidence that AI outputs were grounded, cited, scored, and rejected or warned when weak.
5. **Procurement artifact status clarity.** Buyers need one status map that says implemented, self-attested, deferred, template-only, or not applicable.
6. **Workflow rollout burden.** Jira, ServiceNow, Confluence, Slack, Service Bus, and webhooks need opinionated recipes so implementation teams do not design every path from scratch.

## 7. Top 6 Engineering Risks

1. **Real-mode output quality drift.** Model, prompt, or schema drift could produce plausible but weak findings unless quality gates are made more visible and stricter for pilot-safe paths.
2. **Production misconfiguration.** Advisory-only warnings may be missed during manual deployments.
3. **Data consistency drift.** Existing orphan probe/quarantine machinery shows the need for continued prevention work around run/manifest/finding chains.
4. **Conceptual sprawl.** Many features can erode architectural integrity if new work does not map cleanly to Pilot or Operate.
5. **Telemetry gaps in production.** Observability depends on exporters, sampling, and dashboards being configured correctly.
6. **Test-suite maintenance drag.** The CI surface is strong but large; flaky live E2E, k6, or scheduled gates could become costly if not actively maintained.

## 8. Most Important Truth

ArchLucid is not failing because it lacks engineering; it is held back because the buyer has to assemble too much proof and understanding before the value feels obvious.

## 9. Top Improvement Opportunities

### 1. Build a Single Sponsor-Proof Packet From a Committed Run

- **Why it matters:** This directly attacks the largest commercial gap: fragmented value proof.
- **Expected impact:** Makes sales-led pilots easier to convert and reduces founder/sales-engineer explanation load.
- **Affected qualities:** Marketability, Proof-of-ROI Readiness, Executive Value Visibility, Decision Velocity, Trustworthiness.
- **Actionability:** Fully actionable now.
- **Impact of running the prompt:** Directly improves Marketability (+6-8 pts), Proof-of-ROI Readiness (+8-10 pts), Executive Value Visibility (+5-7 pts), Decision Velocity (+3-5 pts). Weighted readiness impact: **+1.0-1.4%**.

Cursor prompt:

```text
Implement a canonical sponsor-proof packet for a committed ArchLucid run.

Goal:
Create one run-level artifact that a sales engineer or operator can hand to an executive sponsor after the Core Pilot path completes. It should consolidate the existing first-value report, pilot deltas, evidence completeness, top finding evidence chain, audit count, LLM call count, artifact list, and buyer-safe warnings into one Markdown endpoint and one UI download/CTA.

Start by reusing existing code and docs:
- `ArchLucid.Application/Pilots/*`
- `ArchLucid.Api/Controllers/*Pilots*`
- `docs/library/PILOT_ROI_MODEL.md`
- `docs/EXECUTIVE_SPONSOR_BRIEF.md`
- `archlucid-ui/src/components/EmailRunToSponsorBanner*`
- Existing first-value Markdown/PDF code paths

Implementation scope:
- Add or extend an application service that produces a single "SponsorProofPacket" Markdown body from existing run, manifest, deltas, evidence-chain, audit, and artifact data.
- Add a versioned API route under `/v1/pilots/runs/{runId}/sponsor-proof-packet` returning `text/markdown`.
- Add a UI CTA on the run detail page after a committed manifest exists.
- Include a clear evidence completeness section:
  - Strong = tenant baseline present and computed deltas present
  - Partial = computed deltas present but baseline missing
  - Low = demo/simulator/sample-only or missing key proof fields
- Include demo-data and simulator warnings when applicable.
- Add focused unit/integration tests for service formatting, endpoint behavior, missing run, demo warning, and evidence completeness.

Acceptance criteria:
- Existing first-value report behavior remains unchanged.
- New endpoint returns 404 for unknown runs using existing ProblemDetails conventions.
- New Markdown includes run id, manifest id/version, time-to-committed-manifest when available, findings by severity, audit row count or lower-bound note, LLM calls, top finding evidence-chain pointer, artifact count/list, and buyer-safe status.
- UI displays the CTA only after commit/finalization.
- Tests cover strong, partial, low, and demo evidence states.

Constraints:
- Reuse existing pilot delta and report builders; do not duplicate computation logic.
- Do not introduce new packages.
- Do not change pricing, billing, or deferred scope docs.
- Do not claim guaranteed ROI or legal attestation.
- Do not alter existing first-value PDF output unless a small shared formatter extraction is necessary.
```

### 2. Add a Core Pilot Readiness Gate

- **Why it matters:** Reduces adoption friction by telling operators whether the one path that matters is ready.
- **Expected impact:** Converts setup uncertainty into a clear pass/fail checklist.
- **Affected qualities:** Adoption Friction, Time-to-Value, Customer Self-Sufficiency, Deployability, Manageability.
- **Actionability:** Fully actionable now.
- **Impact of running the prompt:** Directly improves Adoption Friction (+5-7 pts), Time-to-Value (+3-4 pts), Customer Self-Sufficiency (+6-8 pts), Deployability (+2-3 pts). Weighted readiness impact: **+0.7-1.0%**.

Cursor prompt:

```text
Create a Core Pilot readiness gate that verifies only the minimum path needed for first value.

Goal:
Add a concise API/CLI readiness check for the Core Pilot path: SQL connectivity, schema applied, auth mode sane for the environment, health/ready healthy, simulator or real agent mode configured, artifact storage writable, OpenAPI available, and commit/export prerequisites present.

Start by reusing:
- Existing `/health/live`, `/health/ready`, `/version`
- CLI `doctor` and `deployment-evidence` patterns in `ArchLucid.Cli`
- Startup configuration diagnostics in `ArchLucid.Host.Core`
- Core Pilot docs in `docs/CORE_PILOT.md`

Implementation scope:
- Add a CLI command such as `archlucid core-pilot-readiness`.
- The command should call the API where possible and inspect local config only when running in repo/local mode.
- Output Markdown and console summary with PASS/WARN/FAIL rows.
- Include remediation hints for each failed check.
- Add tests for formatting and failure classification.

Acceptance criteria:
- Command exits non-zero when any FAIL row exists.
- WARN rows do not fail the command.
- Checks are scoped to Core Pilot only; do not include governance, alerts, graph, compare, replay, billing, Marketplace, or deferred V1.1/V2 items.
- Output includes a final "Ready for Core Pilot: yes/no" line.
- Docs update references the new command from `docs/CORE_PILOT.md` and `README.md` without adding a new large doc.

Constraints:
- Do not make live Azure, live LLM, Playwright, Marketplace, Stripe live keys, SOC 2, public reference customers, or design partner checks part of this gate.
- Do not remove existing `doctor` or `deployment-evidence`.
- Reuse existing health/problem conventions and config diagnostics.
```

### 3. Make Real-Mode AI Quality Gates Pilot-Safe by Default

**Completed (threshold policy lock, 2026-05-07):** Buyer-facing PilotStrict numeric bars are locked in code and hosted configuration—`StructuralRejectBelow` **0.90**, `StructuralWarnBelow` **1.00**, `SemanticRejectBelow` **0.50**, `SemanticWarnBelow` **0.70**, `PilotStrictMinStructuralCompleteness` **0.90**, `PilotStrictMinSemanticScore` **0.50**, `PilotStrictMinEvidenceRefCount` **2** (`ArchLucid:AgentOutput:QualityGate` in `appsettings.Production.json` and `appsettings.Staging.json`; matching defaults on `AgentOutputQualityGateOptions` and `ConfigurationKeyCatalog`). Dev/base `appsettings` remain WarnOnly with reject floors at zero so local simulator flows stay unchanged; unit coverage includes PilotStrict citation and evidence-ref floor cases.

**Remainder:** Sponsor-proof packet ProblemDetails/blocking UX, broader “real-mode only” profiling, and end-to-end tests called out in the Cursor prompt below are not claimed done by this lock.

- **Why it matters:** Correctness and trust depend on rejecting weak AI outputs, not merely observing them.
- **Expected impact:** Gives operators confidence that real model runs will not quietly produce low-evidence artifacts.
- **Affected qualities:** Correctness, Trustworthiness, Explainability, AI/Agent Readiness, Security.
- **Actionability:** Fully actionable now.
- **Impact of running the prompt:** Directly improves Correctness (+4-6 pts), Trustworthiness (+4-6 pts), Explainability (+3-4 pts), AI/Agent Readiness (+4-5 pts). Weighted readiness impact: **+0.6-0.9%**.

Cursor prompt:

```text
Strengthen real-mode AI output quality gates for pilot-safe runs.

Goal:
Ensure real Azure OpenAI execution cannot silently proceed with materially weak agent outputs when the run is intended for buyer/sponsor evidence. Keep simulator and dev flows ergonomic, but make real-mode pilot evidence stricter and more visible.

Start by inspecting:
- `ArchLucid.Application` agent execution and result validation services
- `ArchLucid.Core.Diagnostics.ArchLucidInstrumentation`
- `AgentExecution:*` and `ArchLucid:AgentOutput:QualityGate:*` options in appsettings
- Existing tests around agent output structural/semantic scoring

Implementation scope:
- Add a named option/profile for pilot-safe real-mode quality gates.
- Require minimum structural completeness and evidence/citation support for real-mode sponsor-proof outputs.
- If an output fails the pilot-safe threshold, mark the run/report evidence completeness as low or block sponsor-proof packet generation with a clear ProblemDetails response, depending on existing patterns.
- Emit or reuse audit/metric signals for rejected/warned outputs.
- Add tests covering simulator path, real-mode warn path, real-mode reject path, and sponsor-proof packet interaction.

Acceptance criteria:
- Default local simulator behavior remains unchanged.
- Real-mode pilot/sponsor evidence path cannot present low-quality AI output as strong evidence.
- Rejection or downgrade messages are actionable and include correlation/run id where available.
- Existing schema validation tests continue to pass.

Constraints:
- Do not introduce a new model provider.
- Do not claim formal verification.
- Do not store additional sensitive prompt data beyond existing trace policy.
- Do not weaken existing redaction or trace controls.
```

### 4. Add Production Profile Fail-Fast Validation

- **Why it matters:** Enterprise buyers and operators need confidence that dangerous production misconfiguration is blocked, not just logged.
- **Expected impact:** Reduces security, reliability, and support risk during deployments.
- **Affected qualities:** Security, Reliability, Manageability, Deployability, Availability.
- **Actionability:** Fully actionable now.
- **Impact of running the prompt:** Directly improves Security (+4-6 pts), Reliability (+3-4 pts), Manageability (+5-7 pts), Deployability (+3-4 pts). Weighted readiness impact: **+0.6-0.9%**.

Cursor prompt:

```text
Add a production profile fail-fast validator for ArchLucid API/worker startup.

Goal:
Convert the most dangerous production-like misconfigurations from warning-only to startup-failing when `ARCHLUCID_ENVIRONMENT=Production` or ASP.NET environment is Production.

Start by reusing:
- `ArchLucid.Host.Core/Startup/AuthSafetyGuard.cs`
- `ArchLucid.Core/Hosting/ProductionLikeHostingMisconfigurationAdvisor.cs`
- Configuration health probes
- Existing startup configuration warning tests

Implementation scope:
- Add a production-only validator with stable rule names.
- Fail startup for:
  - `ArchLucidAuth:Mode=ApiKey` with `Authentication:ApiKey:Enabled=false`
  - `ArchLucidAuth:Mode=JwtBearer` without Authority or local public key
  - `Authentication:ApiKey:DevelopmentBypassAll=true`
  - `LlmPromptRedaction:Enabled=false` in production real-mode
  - `ArchLucid:Persistence:AllowRlsBypass=true`
  - Missing telemetry export path when production observability is required by config
- Keep staging as warning-only unless an explicit `ProductionValidation:Strict=true` flag is set.
- Add tests for production fail, staging warn, development allow, and strict staging fail.

Acceptance criteria:
- Production host fails fast with a clear message and rule name for each dangerous state.
- Existing development and test factories continue to work.
- CLI/config lint reports the same rule names.
- Docs mention the strict validation in deployment runbooks.

Constraints:
- Do not hard-code customer URLs or secrets.
- Do not require Prometheus specifically; allow Azure Monitor, OTLP, or Prometheus as valid telemetry exports.
- Do not change authentication semantics for non-production tests.
```

### 5. Add Run-Level Trust Evidence Card

- **Why it matters:** Trust needs to be attached to the output a buyer is reviewing, not only to static trust-center docs.
- **Expected impact:** Improves enterprise confidence and reduces security-review backtracking.
- **Affected qualities:** Trustworthiness, Compliance Readiness, Auditability, Traceability, Procurement Readiness.
- **Actionability:** Fully actionable now.
- **Impact of running the prompt:** Directly improves Trustworthiness (+4-6 pts), Compliance Readiness (+4-5 pts), Procurement Readiness (+3-4 pts), Traceability (+2-3 pts). Weighted readiness impact: **+0.5-0.8%**.

Cursor prompt:

```text
Implement a run-level Trust Evidence Card for committed runs.

Goal:
For each committed run, show a compact evidence card that tells reviewers what proof exists for this output: manifest id/version, audit event count, top finding evidence chain, trace id availability, artifact bundle availability, AI quality status, and whether the run uses demo/simulator/real execution.

Start by reusing:
- Run detail read models
- Audit repository filtered by run id
- First-value/pilot delta services
- Existing UI run detail components
- `docs/trust-center.md` language for self-attested vs proof boundaries

Implementation scope:
- Add or extend an API read model for run evidence status.
- Add a UI card on run detail after commit.
- Add a Markdown formatter section reusable by sponsor-proof packet.
- Include clear labels: Available, Missing, Not applicable, Demo-only, Low confidence.
- Add unit/integration/UI tests for card states.

Acceptance criteria:
- Card appears only for committed/finalized runs.
- Card does not claim SOC 2, external pen test, or legal attestation.
- Card links to existing artifact/evidence routes where available.
- Demo and simulator runs are labeled clearly.
- Missing audit or trace data is visible, not hidden.

Constraints:
- Do not add new persistence tables unless existing read models cannot supply required data.
- Do not duplicate audit counting logic.
- Do not expose secrets, prompt bodies, raw model responses, or private trace data.
```

### 6. Harden Data Consistency From Detection Toward Prevention

- **Why it matters:** Orphan probes are useful, but the strongest reliability story prevents high-value chain breaks.
- **Expected impact:** Improves trust in manifests, findings, artifacts, and audit handoff.
- **Affected qualities:** Data Consistency, Reliability, Correctness, Auditability, Supportability.
- **Actionability:** Fully actionable now for a targeted slice.
- **Impact of running the prompt:** Directly improves Data Consistency (+6-8 pts), Reliability (+2-3 pts), Correctness (+2-3 pts), Supportability (+2-3 pts). Weighted readiness impact: **+0.4-0.7%**.

Cursor prompt:

```text
Move one high-value ArchLucid data consistency path from orphan detection to prevention.

Goal:
For committed run outputs, ensure golden manifests, findings snapshots, artifact bundles, and decision traces cannot be written without a valid parent run in the normal SQL path. Keep existing orphan probes and quarantine for legacy and break-glass handling.

Start by inspecting:
- `docs/data-consistency/DATA_CONSISTENCY_ENFORCEMENT.md`
- `ArchLucid.Persistence/Migrations`
- `ArchLucid.Persistence/Scripts/ArchLucid.sql`
- Run commit/finalization repositories and services
- Existing data consistency tests

Implementation scope:
- Identify the highest-risk missing FK or application-level invariant in the run commit chain.
- Add the smallest safe migration or repository transaction guard to prevent new orphans.
- Add tests proving invalid writes fail and valid commit path still succeeds.
- Update the data consistency doc/runbook to state what is now prevented versus only detected.

Acceptance criteria:
- No historical numbered migration is edited.
- New migration is idempotent and reflected in the consolidated SQL script if that is the repo pattern.
- Greenfield migration path remains valid.
- Existing orphan probe behavior remains for legacy rows.
- Tests cover the new invariant.

Constraints:
- Do not delete or quarantine existing data as part of this change.
- Do not weaken tenant isolation or RLS posture.
- Do not widen admin remediation endpoints.
```

### 7. Create a Procurement Artifact Status Map

- **Why it matters:** Enterprise buyers need fast status classification, not a scavenger hunt through trust docs.
- **Expected impact:** Reduces procurement friction without pretending deferred assurance exists.
- **Affected qualities:** Procurement Readiness, Compliance Readiness, Trustworthiness, Marketability, Decision Velocity.
- **Actionability:** Fully actionable now.
- **Impact of running the prompt:** Directly improves Procurement Readiness (+5-7 pts), Compliance Readiness (+3-4 pts), Trustworthiness (+2-3 pts), Decision Velocity (+2-3 pts). Weighted readiness impact: **+0.4-0.7%**.

Cursor prompt:

```text
Create a buyer-safe procurement artifact status map.

Goal:
Add a concise status map that classifies every major procurement artifact as Implemented, Self-attested, Template, Deferred, Not applicable, or External/NDA-gated. It must be honest and must not imply SOC 2 or third-party pen-test completion.

Start by reusing:
- `docs/trust-center.md`
- `docs/go-to-market/PROCUREMENT_PACK_INDEX.md`
- `docs/go-to-market/PROCUREMENT_FAST_LANE.md`
- `docs/library/V1_SCOPE.md`
- `docs/library/V1_DEFERRED.md`
- Existing procurement pack CI validation scripts

Implementation scope:
- Add a new section to an existing procurement index or fast-lane doc rather than creating a new top-level docs file.
- Include at least: DPA, subprocessors, CAIQ, SIG, SOC 2 self-assessment, SOC 2 CPA report, owner-conducted pen-test, third-party pen-test, audit matrix, RLS, security.txt, SLA, evidence pack ZIP, PGP key.
- Add a CI validation update if an existing procurement index validator should enforce paths/status values.

Acceptance criteria:
- Status labels are consistent and machine-checkable if added to a table.
- Deferred items cite `V1_DEFERRED.md`.
- No score or marketing claim implies formal attestation where none exists.
- Links resolve under existing docs CI.

Constraints:
- Do not add a new root-level docs file.
- Do not change deferred scope.
- Do not mark placeholder or template artifacts as implemented.
```

### 8. Reduce First-Run Cognitive Load in UI Copy

- **Why it matters:** Cognitive load is the lowest raw score and directly affects adoption.
- **Expected impact:** Makes the product feel simpler without removing enterprise capability.
- **Affected qualities:** Cognitive Load, Usability, Adoption Friction, Time-to-Value.
- **Actionability:** Fully actionable now.
- **Impact of running the prompt:** Directly improves Cognitive Load (+8-12 pts), Usability (+4-6 pts), Adoption Friction (+3-5 pts), Time-to-Value (+2-3 pts). Weighted readiness impact: **+0.4-0.7%**.

Cursor prompt:

```text
Simplify ArchLucid first-run UI copy around the Core Pilot path.

Goal:
Make first-time operators understand the four-step outcome without needing to learn every technical noun. Outcome language should lead; technical run/manifest terms should appear as support metadata.

Start by inspecting:
- `archlucid-ui/src` run creation, home, onboarding, runs list, and run detail components
- Tests referenced by `docs/CORE_PILOT.md` for first-review copy
- `docs/CORE_PILOT.md` terminology

Implementation scope:
- Update UI copy on first-run surfaces to consistently use:
  - "architecture review" for buyer-facing outcome
  - "review package" for the output
  - "run id" and "manifest" as support/technical metadata
- Improve empty states and next-step prompts for:
  - no runs yet
  - run created but not executed
  - ready to commit/finalize
  - committed/finalized with artifacts ready
- Add or update tests that lock the wording and prevent regressions.

Acceptance criteria:
- First-run UI presents the four steps clearly.
- Advanced/Operate features are not presented as required for first value.
- Existing route names and API terms do not need to change.
- Tests pass for copy/seam expectations.

Constraints:
- Do not rename API routes, DTOs, database tables, or technical identifiers.
- Do not remove advanced navigation; keep progressive disclosure intact.
- Do not change pricing or trust claims.
```

### 9. Add Default Workflow Recipes by Persona

- **Why it matters:** Embeddedness improves when customers can copy one proven path instead of designing integrations.
- **Expected impact:** Helps architects, governance users, procurement reviewers, and platform engineers adopt with less consulting.
- **Affected qualities:** Workflow Embeddedness, Interoperability, Customer Self-Sufficiency, Adoption Friction, Template and Accelerator Richness.
- **Actionability:** Fully actionable now.
- **Impact of running the prompt:** Directly improves Workflow Embeddedness (+4-6 pts), Customer Self-Sufficiency (+4-5 pts), Template and Accelerator Richness (+5-7 pts), Adoption Friction (+2-3 pts). Weighted readiness impact: **+0.4-0.6%**.

Cursor prompt:

```text
Add four default ArchLucid workflow recipes by buyer/operator persona.

Goal:
Create concise, copy-paste workflow recipes that map existing product surfaces to common adoption motions without adding new product scope.

Use existing docs and code references:
- Core Pilot / architect review
- Governance approval and policy packs
- Procurement evidence pack / trust center
- CI manifest delta integrations
- Existing integration recipe docs

Implementation scope:
- Add recipes under the existing integration or library docs structure, not docs root.
- Recipes:
  1. Architect: request to committed review package
  2. Governance lead: critical finding to approval/policy gate
  3. Procurement/security reviewer: trust evidence pack and run-level proof
  4. Platform engineer: CI manifest delta and deployment evidence
- Each recipe should include goal, prerequisites, steps, expected outputs, failure hints, and links to exact APIs/CLI/UI routes.
- Update the navigator or relevant hub so recipes are discoverable.

Acceptance criteria:
- Recipes reuse existing capabilities only.
- Each recipe is under 120 lines.
- No recipe requires deferred V1.1/V2 items.
- Link checks pass.

Constraints:
- Do not add new code unless needed for link/index generation tests.
- Do not create a new top-level docs file.
- Do not imply live Marketplace, SOC 2 attestation, external pen test, MCP, or PGP availability.
```

### 10. Publish a Measured Pilot/SaaS Scale Envelope

- **Why it matters:** Scalability, performance, and cost need a bounded, honest claim buyers can understand.
- **Expected impact:** Converts k6 and load-test assets into a buyer/operator readiness statement.
- **Affected qualities:** Scalability, Performance, Cost-Effectiveness, Reliability, Azure Compatibility and SaaS Deployment Readiness.
- **Actionability:** Fully actionable now.
- **Impact of running the prompt:** Directly improves Scalability (+5-7 pts), Performance (+4-5 pts), Cost-Effectiveness (+3-4 pts), Reliability (+2-3 pts). Weighted readiness impact: **+0.3-0.5%**.

Cursor prompt:

```text
Create a measured ArchLucid pilot/SaaS scale envelope from existing performance assets.

Goal:
Document the supported V1 pilot-scale envelope using existing k6, load baseline, performance, and deployment docs. Keep claims narrow and evidence-backed.

Start by reusing:
- `docs/library/PERFORMANCE.md`
- `docs/library/PERFORMANCE_TESTING.md`
- `docs/library/LOAD_TEST_BASELINE.md`
- `tests/load/README.md`
- `.github/workflows/ci.yml` k6 jobs
- Azure deployment docs

Implementation scope:
- Add or update an existing performance doc with a "V1 pilot scale envelope" section.
- Separate:
  - merge-blocking CI smoke evidence
  - scheduled burst/soak evidence
  - local/operator load-test instructions
  - what is not claimed
- Include simulator versus real-LLM distinction.
- Include cost and telemetry prerequisites for interpreting results.

Acceptance criteria:
- Claims are measurable and cite exact scripts/workflows.
- The doc states that CI k6 smoke is not a contractual throughput SLA.
- The doc gives an operator command path to reproduce the envelope.
- No active/active or multi-region guarantee is implied.

Constraints:
- Do not change performance thresholds unless tests prove the new value.
- Do not add new infrastructure.
- Do not claim production scale without evidence.
```

## 10. Pending Questions for Later

### Build a Single Sponsor-Proof Packet From a Committed Run

- Should the sponsor-proof packet be Markdown-only at first, or should it also generate PDF/DOCX in the first implementation?
- Should low evidence completeness block packet generation, or generate the packet with a prominent warning?

### Add a Core Pilot Readiness Gate

- Should the readiness gate be primarily local CLI-driven, API-driven against hosted environments, or both with mode detection?

### Make Real-Mode AI Quality Gates Pilot-Safe by Default

- **Resolved:** Minimum structural / semantic thresholds and pilot evidence-ref floor for hosted PilotStrict (see Recommendation **3**, completed paragraph above).
- **Open:** Should failed real-mode quality gate outcomes block commit, block sponsor packet generation, or downgrade evidence confidence?

### Add Production Profile Fail-Fast Validation

- Should staging remain warning-only by default, or should staging adopt production strictness once deployment is stable?

### Add Run-Level Trust Evidence Card

- Which fields are safe to show to all readers versus admin/operator-only users?

### Harden Data Consistency From Detection Toward Prevention

- Which consistency chain should be hardened first if multiple missing FK/application invariants are found?

### Create a Procurement Artifact Status Map

- Should status labels align to procurement language (`Available under NDA`, `Self-attested`) or engineering language (`Implemented`, `Template`, `Deferred`) as the primary vocabulary?

### Reduce First-Run Cognitive Load in UI Copy

- Is "finalize" or "commit" the preferred buyer-facing verb in the operator UI for V1 copy?

### Add Default Workflow Recipes by Persona

- Which persona should be the first recipe in navigation: architect, governance lead, procurement reviewer, or platform engineer?

### Publish a Measured Pilot/SaaS Scale Envelope

- What is the intended public/private boundary for load-test numbers: buyer-facing doc, operator-only doc, or internal runbook?
