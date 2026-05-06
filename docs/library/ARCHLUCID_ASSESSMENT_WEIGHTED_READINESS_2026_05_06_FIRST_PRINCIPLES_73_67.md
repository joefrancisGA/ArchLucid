> **Scope:** Independent first-principles weighted readiness assessment for ArchLucid using the supplied quality model; not a roadmap, release certification, or implementation plan.

# ArchLucid Assessment – Weighted Readiness 73.67%

## Executive Summary

### Overall Readiness

**(A) V1/V1.1 headline readiness: 73.67%.** ArchLucid is a credible V1-shaped solution: it has a coherent architecture-review workflow, SQL-backed persistence, an operator UI, CLI support, governance/audit surfaces, Azure-oriented deployment material, meaningful CI gates, and a disciplined scope boundary. The score is not higher because the current surface is still heavy for a first buyer, embedded workflow integrations are uneven, live-environment proof must be produced per deployment, and some commercial proof is more scaffolded than independently persuasive.

**(B) Procurement / market-motion realism: informational only, weight 0 in the score.** The absence of CPA-issued SOC 2, ISO certification, a public reference customer, live Marketplace publication, and a signed design partner is explicitly outside the headline score where the repo marks those items as deferred or non-gates. They still create real buyer friction with conservative enterprise procurement teams.

### Commercial Picture

The commercial story is strongest when sold as "faster architecture review with evidence-linked outputs." Pricing, ROI logic, sponsor artifacts, public demo surfaces, quote request flow, trial material, and buyer-safe trust packaging exist. The weak point is buyer proof density: the product can describe ROI and generate first-value reports, but it still depends heavily on a controlled pilot to produce customer-specific proof.

**Azure spend positioning:** Expect many buyers to rationalize adoption around **measurable Azure savings** (right-sizing, waste removal, preventable drift). The **default commercial bar** remains **exact** monetary figures—not hand-wavy totals—and **citation-backed** proof where a dollar is asserted as **customer bill truth** (billing export line, Retail price sheet with SKU + region + effective date, in-product meter or token ledger with frozen rate-table version and formula, finding or manifest excerpt tying the recommendation to billed scope, etc.). **Exceptions** are acceptable when **justified**: for example labeled **estimate** or **scenario** modes with stated inputs, formulae, and what evidence is missing; qualitative FinOps outcomes without asserting a reconciliation-grade total; sensitivity or bound tables that do not impersonate invoice precision; or an explicit **blocked / evidence gap** panel that explains why invoice-grade citation is unavailable. Omitting content is optional; misrepresenting an uncited estimate as exact savings is not.

### Enterprise Picture

Enterprise posture is materially better than a typical early product: Entra/JWT/API-key auth modes, RBAC, per-tenant SQL topology, optional RLS, durable audit, governance workflows, trust-center documentation, DPA/subprocessor material, CAIQ/SIG-style artifacts, private endpoint guidance, and Terraform roots are present. Enterprise adoption is held back mainly by workflow integration completeness, deployment-specific validation burden, procurement assurance friction, and operator cognitive load.

### Engineering Picture

Engineering depth is real: modular .NET projects, Dapper/DbUp persistence, extensive test tiers, OpenAPI snapshot checks, live UI/API E2E lanes, k6 smoke, chaos tests, security scans, audit matrix guards, and Azure IaC material. The main risks are not "missing basic engineering"; they are system complexity, duplicated persistence seams, live deployment variability, first-party connector maturity, the correctness challenge of AI-assisted recommendations, and—when positioning on **Azure spend**—building **exact citation-backed proof** pipelines FinOps reviewers expect.

## Weighted Quality Assessment

Weighted deficiency signal is `Weight x (100 - Score)`. Weighted impact on readiness is the quality's contribution to the 73.67% overall score.

### 1. Marketability

- **Score:** 76
- **Weight:** 8
- **Weighted deficiency signal:** 192
- **Weighted impact on readiness:** 5.96%
- **Justification:** The buyer narrative is clear, the category is plausible, pricing exists, and the sponsor story is grounded in V1 capabilities. Marketability is limited by the need to prove value in a real pilot rather than leaning on public customer proof.
- **Tradeoffs:** Honest positioning reduces over-claim risk, but it also makes the top-of-funnel story less explosive than broader "AI transformation" messaging.
- **Improvement recommendations:** Sharpen public proof around one canonical buyer path, make the demo-to-pilot conversion path more guided, and strengthen proof-pack artifacts that require no custom sales narration.
- **Disposition:** Fixable in V1.

### 2. Adoption Friction

- **Score:** 70
- **Weight:** 6
- **Weighted deficiency signal:** 180
- **Weighted impact on readiness:** 4.12%
- **Justification:** The product has quickstarts, a default Pilot layer, a CLI, and operator UI guidance, but the number of concepts remains high: runs, manifests, artifacts, authority, governance, policy packs, audit, alerts, tiers, and multiple auth modes.
- **Tradeoffs:** Enterprise controls add trust but make first use heavier.
- **Improvement recommendations:** Collapse Day-1 guidance further, add in-product "one path only" cues, and produce a single first-pilot operator script/report bundle.
- **Disposition:** Fixable in V1.

### 3. Time-to-Value

- **Score:** 78
- **Weight:** 7
- **Weighted deficiency signal:** 154
- **Weighted impact on readiness:** 5.35%
- **Justification:** The Core Pilot path is explicit: create request, execute, commit, review artifacts. Simulator mode and smoke tooling support quick first value. Time-to-value still depends on environment setup, SQL readiness, and user understanding of the architecture-review object model.
- **Tradeoffs:** SQL-first durability is the right enterprise choice, but it slows the absolute first run compared with a pure hosted toy demo.
- **Improvement recommendations:** Make the first committed review path more self-validating and publish a short "first value evidence" checklist generated by the system.
- **Disposition:** Fixable in V1.

### 4. Proof-of-ROI Readiness

- **Score:** 74
- **Weight:** 5
- **Weighted deficiency signal:** 130
- **Weighted impact on readiness:** 3.63%
- **Justification:** ROI model, pilot scorecard, computed deltas, value report, first-value reports, and sponsor pack concepts exist. The gap is that some proof still depends on customer-supplied baselines or illustrative defaults.
- **Tradeoffs:** Avoiding fake ROI claims is correct, but weaker baseline capture lowers executive persuasiveness.
- **Improvement recommendations:** Strengthen baseline capture, show confidence levels prominently, and add buyer-safe acceptance checks for each proof artifact.
- **Disposition:** Fixable in V1.

### 5. Workflow Embeddedness

- **Score:** 62
- **Weight:** 3
- **Weighted deficiency signal:** 114
- **Weighted impact on readiness:** 1.82%
- **Justification:** REST, CLI, webhooks, Service Bus events, Slack/Teams patterns, Confluence publishing, SCIM, and ITSM inbound status sync are present or documented. Evidence for complete first-party Jira and ServiceNow outbound issue creation is weaker than the V1 scope commitment.
- **Tradeoffs:** Keeping connectors thin avoids schema sprawl, but customers buy workflow fit, not just API availability.
- **Improvement recommendations:** Complete and test first-party ITSM outbound issue creation, status correlation, and operator-visible connector health.
- **Disposition:** Fixable in V1 for the committed connector slice; broader integration catalog belongs to later releases.

### 6. Differentiability

- **Score:** 73
- **Weight:** 4
- **Weighted deficiency signal:** 108
- **Weighted impact on readiness:** 2.86%
- **Justification:** The evidence-linked architecture review category is meaningfully differentiated from generic AI chat and classic EA repositories. The gap is external proof that buyers will recognize the difference quickly.
- **Tradeoffs:** A new category can command attention but requires more education.
- **Improvement recommendations:** Make "evidence-linked finding to executive action" the dominant demo, and reduce internal terminology in buyer-facing flows.
- **Disposition:** Fixable in V1.

### 7. Correctness

- **Score:** 73
- **Weight:** 4
- **Weighted deficiency signal:** 108
- **Weighted impact on readiness:** 2.86%
- **Justification:** The system has schema validation, deterministic simulator mode, contract tests, OpenAPI snapshots, persistence contract tests, and decisioning tests. AI-generated findings remain inherently probabilistic, and correctness depends on evidence quality, prompt behavior, and review discipline.
- **Tradeoffs:** Strong traceability makes errors reviewable; it does not eliminate errors.
- **Improvement recommendations:** Expand golden-corpus expectations, add per-finding evidence sufficiency gates, and surface confidence/grounding failures more aggressively.
- **Disposition:** Fixable in V1 for bounded review correctness; broad domain correctness evolves over time.

### 8. Executive Value Visibility

- **Score:** 76
- **Weight:** 4
- **Weighted deficiency signal:** 96
- **Weighted impact on readiness:** 2.98%
- **Justification:** Sponsor brief, first-value reports, sponsor PDFs, value reports, and ROI narratives exist. The executive story is understandable. It still risks being buried behind operator concepts unless the product keeps the executive artifact front and center.
- **Tradeoffs:** Detailed evidence helps reviewers but can dilute executive clarity.
- **Improvement recommendations:** Promote one executive outcome artifact after each committed run and make missing proof fields visible.
- **Disposition:** Fixable in V1.

### 9. Usability

- **Score:** 70
- **Weight:** 3
- **Weighted deficiency signal:** 90
- **Weighted impact on readiness:** 2.06%
- **Justification:** The UI has progressive disclosure, a two-layer model, authority-aware shaping, tests, and route guidance. The breadth of Operate capabilities creates a substantial learning curve.
- **Tradeoffs:** Progressive disclosure hides complexity but cannot erase the complexity of governance, alerts, audit, and replay.
- **Improvement recommendations:** Add task-completion checklists, reduce first-session choices, and make "what to do next" explicit after commit.
- **Disposition:** Fixable in V1.

### 10. Trustworthiness

- **Score:** 73
- **Weight:** 3
- **Weighted deficiency signal:** 81
- **Weighted impact on readiness:** 2.15%
- **Justification:** Trust is supported by durable evidence, audit, explainability traces, policy checks, self-assessment, and honest trust-center posture. Trust is capped by AI fallibility, deployment-specific validation, and procurement-grade assurance items that are intentionally outside headline scoring.
- **Tradeoffs:** Honest limits lower marketing gloss but increase credibility with serious buyers.
- **Improvement recommendations:** Make confidence, evidence completeness, and demo-data warnings impossible to miss.
- **Disposition:** Fixable in V1 for operator reliance; procurement assurance friction is informational.

### 11. Architectural Integrity

- **Score:** 75
- **Weight:** 3
- **Weighted deficiency signal:** 75
- **Weighted impact on readiness:** 2.21%
- **Justification:** The system is bounded into API, application, persistence, worker, UI, CLI, contracts, decisioning, graph, and integration modules. The main architectural concern is accumulated seams: dual repository families, historical naming bridges, and broad feature surface.
- **Tradeoffs:** Evolutionary architecture preserved delivery speed but left some conceptual debt.
- **Improvement recommendations:** Continue reducing coordinator/authority duplication and document ownership of persistence boundaries.
- **Disposition:** Mostly V1.1/backlog, with narrow V1 fixes where it affects shipped behavior.

### 12. Interoperability

- **Score:** 64
- **Weight:** 2
- **Weighted deficiency signal:** 72
- **Weighted impact on readiness:** 1.25%
- **Justification:** API, CLI, CloudEvents, Service Bus, webhooks, Teams/Slack patterns, Confluence, SCIM, and ITSM inbound handling give a solid base. The gap is complete, customer-ready first-party connectors and broad enterprise system fit.
- **Tradeoffs:** A narrow integration surface is supportable; enterprise buyers expect their tools to be first-class.
- **Improvement recommendations:** Finish the committed Jira/ServiceNow/Confluence/Slack minimum slices and add connector contract tests.
- **Disposition:** Fixable in V1 for committed connectors; broad catalog is later.

### 13. Decision Velocity

- **Score:** 68
- **Weight:** 2
- **Weighted deficiency signal:** 64
- **Weighted impact on readiness:** 1.33%
- **Justification:** Pricing, quote forms, procurement pack, trust materials, and buyer briefs improve decision speed. Decisions still slow when buyers need assurance proof, live environment evidence, or integration fit.
- **Tradeoffs:** Sales-led motion is appropriate while self-serve commerce un-hold is deferred, but it slows impulse purchase.
- **Improvement recommendations:** Produce a concise buyer decision packet that combines value, trust, pilot plan, and order-form next step.
- **Disposition:** Fixable in V1.

### 14. Security

- **Score:** 80
- **Weight:** 3
- **Weighted deficiency signal:** 60
- **Weighted impact on readiness:** 2.35%
- **Justification:** Security posture is above average: fail-closed API key behavior, production config validation, Entra/JWT, RBAC, tenant SQL topology, Key Vault references, private endpoint guidance, no public SMB stance, ZAP/Schemathesis/Gitleaks, and threat model material.
- **Tradeoffs:** Optional modes and local bypasses require strict environment discipline.
- **Improvement recommendations:** Keep production safety rules strict and add environment-specific preflight reports for hosted deployments.
- **Disposition:** Fixable in V1.

### 15. Maintainability

- **Score:** 70
- **Weight:** 2
- **Weighted deficiency signal:** 60
- **Weighted impact on readiness:** 1.37%
- **Justification:** The codebase is modular and heavily tested, but broad scope and historical seams increase maintenance burden.
- **Tradeoffs:** Fine-grained modules improve ownership but can increase navigation cost.
- **Improvement recommendations:** Reduce duplicate abstractions, keep route/tier/policy/nav matrices generated or guarded, and continue active refactoring of connection factories.
- **Disposition:** Better suited for V1.1/backlog except defects that affect V1 flows.

### 16. Commercial Packaging Readiness

- **Score:** 71
- **Weight:** 2
- **Weighted deficiency signal:** 58
- **Weighted impact on readiness:** 1.39%
- **Justification:** Tiers, prices, trial limits, quote flow, order form, checkout wiring, and commercial tier gates exist. Live commerce un-hold is explicitly deferred, and hard entitlement boundaries are still a foundation rather than a complete billing system.
- **Tradeoffs:** Sales-led V1 is realistic; self-serve growth waits.
- **Improvement recommendations:** Harden the quote-to-paid handoff, clarify Team/Professional/Enterprise boundary enforcement, and keep checkout disabled until safe live configuration exists.
- **Disposition:** Fixable in V1 for sales-led packaging; live marketplace/Stripe publication is deferred.

### 17. Compliance Readiness

- **Score:** 72
- **Weight:** 2
- **Weighted deficiency signal:** 56
- **Weighted impact on readiness:** 1.41%
- **Justification:** The repo contains SOC self-assessment, CAIQ/SIG material, DPA template, DSAR process, subprocessors, compliance matrix, audit matrix, and trust center. CPA SOC 2 is not scored as a headline defect.
- **Tradeoffs:** Self-attested compliance is credible for pilots but insufficient for some procurement teams.
- **Improvement recommendations:** Keep procurement artifacts fresh, add packaged evidence manifests, and make control ownership explicit.
- **Disposition:** Fixable in V1 for self-assessment quality; CPA assurance is post-V1.1/informational.

### 18. Procurement Readiness

- **Score:** 72
- **Weight:** 2
- **Weighted deficiency signal:** 56
- **Weighted impact on readiness:** 1.41%
- **Justification:** Procurement pack tooling, trust center, objection playbook, DPA/subprocessors, SOC roadmap, and incident comms are strong. Some buyers will still require external attestations or signed customer references outside the V1 score.
- **Tradeoffs:** Honesty avoids false assurance but leaves friction in rigid RFPs.
- **Improvement recommendations:** Improve the generated procurement pack manifest and add a buyer-facing "what is self-attested vs externally attested" summary.
- **Disposition:** Fixable in V1 for documentation; external attestations are informational/deferred.

### 19. Reliability

- **Score:** 72
- **Weight:** 2
- **Weighted deficiency signal:** 56
- **Weighted impact on readiness:** 1.41%
- **Justification:** Health checks, readiness probes, retry/circuit-breaker patterns, outbox convergence, release smoke, k6 smoke, chaos tests, and SLO docs exist. Reliability still depends on each hosted environment and target deployment discipline.
- **Tradeoffs:** Many checks improve resilience but increase configuration surface.
- **Improvement recommendations:** Produce a deployment-specific reliability evidence bundle after staging/prod smoke and add runbook links to failure outputs.
- **Disposition:** Fixable in V1.

### 20. AI/Agent Readiness

- **Score:** 72
- **Weight:** 2
- **Weighted deficiency signal:** 56
- **Weighted impact on readiness:** 1.41%
- **Justification:** Agent types, simulator mode, prompt versioning, LLM budgets, fallback, traces, schema validation, and quality gates exist. Readiness is capped by live-model variability and the need for broader golden-corpus validation.
- **Tradeoffs:** Simulator mode enables deterministic CI but does not fully prove real LLM behavior.
- **Improvement recommendations:** Expand live-model evidence capture, golden-corpus replay, and confidence calibration around generated findings.
- **Disposition:** Fixable in V1 for bounded evidence; broader agent maturity continues later.

### 21. Traceability

- **Score:** 82
- **Weight:** 3
- **Weighted deficiency signal:** 54
- **Weighted impact on readiness:** 2.41%
- **Justification:** Traceability is one of the solution's strongest qualities: manifests, decision traces, provenance graph, evidence chains, audit rows, correlation IDs, OpenAPI contracts, and requirement-to-test traceability exist.
- **Tradeoffs:** Rich traceability increases data volume and UI complexity.
- **Improvement recommendations:** Make the top-severity evidence chain easier to inspect and export in every first-value artifact.
- **Disposition:** Fixable in V1.

### 22. Data Consistency

- **Score:** 73
- **Weight:** 2
- **Weighted deficiency signal:** 54
- **Weighted impact on readiness:** 1.43%
- **Justification:** SQL persistence, DbUp, greenfield boot, orphan probes, remediation APIs, RLS/session context, and consistency runbooks exist. Risk remains around complex FK chains, archival, dual repository paths, and tenant topology configuration.
- **Tradeoffs:** Rich relational guarantees increase migration and boot complexity.
- **Improvement recommendations:** Add automated staging dry-run checks for orphan probes and tenant topology bindings.
- **Disposition:** Fixable in V1.

### 23. Policy and Governance Alignment

- **Score:** 78
- **Weight:** 2
- **Weighted deficiency signal:** 44
- **Weighted impact on readiness:** 1.53%
- **Justification:** Policy packs, governance workflow, segregation of duties, pre-commit gate, SLA breach, governance dashboard, and durable audit exist. The limitation is adoption and operator clarity, not missing conceptual machinery.
- **Tradeoffs:** Strong governance can feel heavy during first pilot.
- **Improvement recommendations:** Keep governance optional until after first value and add "when to enable" guidance inside the UI.
- **Disposition:** Fixable in V1.

### 24. Explainability

- **Score:** 78
- **Weight:** 2
- **Weighted deficiency signal:** 44
- **Weighted impact on readiness:** 1.53%
- **Justification:** Explainability traces, provenance graph, citations, aggregate explanation faithfulness checks, and demo explain routes are strong. The cap is that explanations remain decision support, not proof of correctness.
- **Tradeoffs:** More explanation can increase cognitive load.
- **Improvement recommendations:** Surface evidence completeness and explanation confidence next to every high-severity finding.
- **Disposition:** Fixable in V1.

### 25. Azure Compatibility and SaaS Deployment Readiness

- **Score:** 79
- **Weight:** 2
- **Weighted deficiency signal:** 42
- **Weighted impact on readiness:** 1.55%
- **Justification:** Azure-native posture is clear: Container Apps, Front Door/WAF, Azure SQL, Key Vault, private endpoints, Terraform roots, Entra, Service Bus, monitoring, and cost docs. Live production readiness still depends on actual subscription wiring and smoke evidence.
- **Tradeoffs:** Azure focus improves coherence but narrows non-Azure portability.
- **Improvement recommendations:** Create a single deployment evidence report that summarizes Terraform outputs, health, version, smoke, and rollback posture.
- **Disposition:** Fixable in V1.

### 26. Auditability

- **Score:** 80
- **Weight:** 2
- **Weighted deficiency signal:** 40
- **Weighted impact on readiness:** 1.57%
- **Justification:** Durable SQL audit, typed event catalog, append-only DENY guidance, CSV export, CI audit matrix guard, and broad mutating workflow coverage are strong. Only two catalogued-only gaps are currently called out.
- **Tradeoffs:** Audit durability must not break hot paths, so some audit failures are logged rather than blocking.
- **Improvement recommendations:** Add an operator-facing audit completeness health summary and close catalogued-only items when their write paths exist.
- **Disposition:** Fixable in V1 for current paths; lifecycle events wait for feature writers.

### 27. Cognitive Load

- **Score:** 63
- **Weight:** 1
- **Weighted deficiency signal:** 37
- **Weighted impact on readiness:** 0.62%
- **Justification:** The product asks users to understand many layers and artifacts. The docs try to mitigate this with Pilot/Operate and progressive disclosure, but the mental model is still dense.
- **Tradeoffs:** Enterprise capability breadth creates unavoidable vocabulary.
- **Improvement recommendations:** Position the product as **"your AI co-architect"** above two intent-shaped front doors — **"describe what you want"** (generative authoring → architecture documents and diagrams) for non-technical users and **"review an existing architecture"** for business analysts, developers, and IT managers — both converging on the same evidence/deliverable bundle. Keep run/manifest vocabulary as metadata, not primary copy.
- **Disposition:** Fixable in V1.

### 28. Stickiness

- **Score:** 67
- **Weight:** 1
- **Weighted deficiency signal:** 33
- **Weighted impact on readiness:** 0.66%
- **Justification:** Stickiness can emerge from audit history, governance workflows, manifests, comparisons, and evidence chains. It is not yet proven by customer behavior or deep workflow lock-in.
- **Tradeoffs:** Early stickiness should come from value, not artificial lock-in.
- **Improvement recommendations:** Improve recurring value loops: drift reviews, recurring digests, governance dashboards, and value reports.
- **Disposition:** Fixable in V1/V1.1.

### 29. Customer Self-Sufficiency

- **Score:** 67
- **Weight:** 1
- **Weighted deficiency signal:** 33
- **Weighted impact on readiness:** 0.66%
- **Justification:** Docs, quickstarts, support bundles, doctor, troubleshooting, and runbooks exist. Real customer self-sufficiency still depends on hosted onboarding quality and environment-specific failures.
- **Tradeoffs:** More docs help experts but overwhelm new operators.
- **Improvement recommendations:** Add a single self-service operator health checklist and reduce the number of first-run documents.
- **Disposition:** Fixable in V1.

### 30. Performance

- **Score:** 68
- **Weight:** 1
- **Weighted deficiency signal:** 32
- **Weighted impact on readiness:** 0.67%
- **Justification:** k6 smoke, SLO latency tiers, caching, rate limiting, and performance docs exist. Broad route-level performance proof is limited, and AI-augmented paths have naturally wider latency variance.
- **Tradeoffs:** Strict performance gates on AI paths could reject useful work.
- **Improvement recommendations:** Add route-class dashboards and tighten p95/p99 thresholds where synchronous expectations are clear.
- **Disposition:** Better suited for V1.1 beyond smoke gates.

### 31. Availability

- **Score:** 70
- **Weight:** 1
- **Weighted deficiency signal:** 30
- **Weighted impact on readiness:** 0.69%
- **Justification:** Availability targets, health checks, synthetic probe workflow, rollback smoke, and SQL failover docs exist. Multi-region active/active guarantees are explicitly out of scope.
- **Tradeoffs:** A realistic 99.9% target is credible; stronger availability needs operational proof and cost.
- **Improvement recommendations:** Automate monthly availability rollups from production telemetry once production is live.
- **Disposition:** Fixable in V1 for single-region posture; multi-region is deferred.

### 32. Cost-Effectiveness

- **Score:** 70
- **Weight:** 1
- **Weighted deficiency signal:** 30
- **Weighted impact on readiness:** 0.69%
- **Justification:** Cost model, LLM budget controls, k6/perf material, Azure budgets, and FinOps tags exist. GTM ambition to sell **Azure spend reduction** raises the bar: when asserting **bill truth**, buyer-facing totals should be **exact** and **citation-backed**; controlled **exceptions** (labeled scenarios, partial Retail math, qualitative waste, explicit evidence gaps) remain acceptable when justified and not misrepresented as reconciliation-grade savings.
- **Tradeoffs:** Azure-native enterprise posture costs more than a minimal app; paradoxically, credible FinOps ROI requires disciplined proof and honest presentation modes, not bolder rounding.
- **Improvement recommendations:** Add per-run and per-finding economics to operator and sponsor outputs; pair **invoice-backed** dollars with **proof points** (meter id or usage row, Retail page URL + effective date + SKU, rate table checksum, correlating citation from findings/graph/manifest); for other modes, require visible **mode labels** and methodology text per improvement #8.
- **Disposition:** Fixable in V1/V1.1.

### 33. Scalability

- **Score:** 71
- **Weight:** 1
- **Weighted deficiency signal:** 29
- **Weighted impact on readiness:** 0.70%
- **Justification:** Container Apps, SQL topology, background workers, outbox, rate limits, caches, and optional Service Bus support scale beyond a toy system. Tenant and high-volume scaling need real production telemetry.
- **Tradeoffs:** Database-per-tenant improves isolation but increases management overhead.
- **Improvement recommendations:** Add tenant-scale rehearsal scripts and capacity thresholds for run volume, audit growth, and outbox depth.
- **Disposition:** Better suited for V1.1 after pilot telemetry.

### 34. Template and Accelerator Richness

- **Score:** 72
- **Weight:** 1
- **Weighted deficiency signal:** 28
- **Weighted impact on readiness:** 0.71%
- **Justification:** The repo includes templates for procurement, security, integrations, reference customers, order forms, runbooks, and a finding engine template. More customer-specific accelerators would improve adoption.
- **Tradeoffs:** Too many templates can become stale.
- **Improvement recommendations:** Prioritize a few high-leverage pilot templates over a broad template library.
- **Disposition:** Fixable in V1.

### 35. Manageability

- **Score:** 72
- **Weight:** 1
- **Weighted deficiency signal:** 28
- **Weighted impact on readiness:** 0.71%
- **Justification:** Configuration, health, startup validation, docs, and Terraform roots support manageability. The broad config surface makes mistakes possible.
- **Tradeoffs:** Flexible deployment modes increase operator burden.
- **Improvement recommendations:** Add a generated configuration posture report for staging/prod.
- **Disposition:** Fixable in V1.

### 36. Evolvability

- **Score:** 72
- **Weight:** 1
- **Weighted deficiency signal:** 28
- **Weighted impact on readiness:** 0.71%
- **Justification:** ADRs, scope docs, modular projects, test guards, and route/tier matrices make evolution possible. Historical seams and naming bridges slow change.
- **Tradeoffs:** Compatibility with existing code/doc surfaces preserves stability but delays cleanup.
- **Improvement recommendations:** Continue planned cleanup only when it reduces active delivery risk.
- **Disposition:** Mostly V1.1/backlog.

### 37. Deployability

- **Score:** 73
- **Weight:** 1
- **Weighted deficiency signal:** 27
- **Weighted impact on readiness:** 0.72%
- **Justification:** Docker, compose, Terraform, release smoke, CD smoke, health/version, SQL boot, and deployment docs exist. Actual deployability depends on subscription choices and environment variables.
- **Tradeoffs:** Terraform multi-root flexibility helps teams but requires operator sequencing.
- **Improvement recommendations:** Produce a one-command staging readiness summary after apply/deploy.
- **Disposition:** Fixable in V1.

### 38. Accessibility

- **Score:** 74
- **Weight:** 1
- **Weighted deficiency signal:** 26
- **Weighted impact on readiness:** 0.73%
- **Justification:** Accessibility docs, marketing page sync, axe component tests, and accessibility review posture exist. Full manual assistive-technology validation is not evident as a broad shipped gate.
- **Tradeoffs:** Automated accessibility checks catch many issues but not all usability barriers.
- **Improvement recommendations:** Add a short manual keyboard/screen-reader checklist for top operator paths.
- **Disposition:** Fixable in V1/V1.1.

### 39. Documentation

- **Score:** 74
- **Weight:** 1
- **Weighted deficiency signal:** 26
- **Weighted impact on readiness:** 0.73%
- **Justification:** Documentation depth is exceptional, with scope, runbooks, architecture, security, deployment, and buyer material. The weakness is volume and navigation burden.
- **Tradeoffs:** More documentation improves evidence but can obscure the path.
- **Improvement recommendations:** Keep the first-five-doc spine strict and move depth docs behind persona routing.
- **Disposition:** Fixable in V1.

### 40. Extensibility

- **Score:** 75
- **Weight:** 1
- **Weighted deficiency signal:** 25
- **Weighted impact on readiness:** 0.74%
- **Justification:** Connectors, events, finding engine template, policy packs, API/CLI, and modular services support extension. Some extension seams are not yet as clean as the documentation implies.
- **Tradeoffs:** Extensibility can increase support burden if exposed too early.
- **Improvement recommendations:** Clearly label stable vs internal extension points and add contract tests for connector adapters.
- **Disposition:** Fixable in V1/V1.1.

### 41. Change Impact Clarity

- **Score:** 76
- **Weight:** 1
- **Weighted deficiency signal:** 24
- **Weighted impact on readiness:** 0.75%
- **Justification:** Compare, replay, drift, manifests, provenance, changelog, ADRs, and route matrices make change impact visible. UI clarity for non-expert users can still improve.
- **Tradeoffs:** Detailed diffs help architects but may overwhelm executives.
- **Improvement recommendations:** Add a simple "what changed, why it matters, what to do" summary to comparison outputs.
- **Disposition:** Fixable in V1.

### 42. Supportability

- **Score:** 76
- **Weight:** 1
- **Weighted deficiency signal:** 24
- **Weighted impact on readiness:** 0.75%
- **Justification:** Health endpoints, version endpoint, correlation IDs, support bundle, doctor command, troubleshooting docs, and diagnostics are strong. Live incident playbooks need deployment-specific evidence.
- **Tradeoffs:** Rich support bundles can contain sensitive data and require redaction discipline.
- **Improvement recommendations:** Add support-bundle redaction checks and a standardized handoff artifact for pilot issues.
- **Disposition:** Fixable in V1.

### 43. Observability

- **Score:** 78
- **Weight:** 1
- **Weighted deficiency signal:** 22
- **Weighted impact on readiness:** 0.76%
- **Justification:** Serilog, OpenTelemetry, metrics, Grafana/Prometheus material, replay diagnostics, audit, health, SLO rules, outbox metrics, and budget metrics exist. Production visibility must still be wired per environment.
- **Tradeoffs:** Instrumentation volume must be curated to avoid noisy operations.
- **Improvement recommendations:** Add dashboard smoke validation that confirms expected metric names appear after a synthetic run.
- **Disposition:** Fixable in V1/V1.1.

### 44. Modularity

- **Score:** 78
- **Weight:** 1
- **Weighted deficiency signal:** 22
- **Weighted impact on readiness:** 0.76%
- **Justification:** The solution is split into dedicated projects and services with many narrow interfaces. Some historical boundaries overlap, especially persistence and authority/coordinator seams.
- **Tradeoffs:** High modularity can increase wiring complexity.
- **Improvement recommendations:** Consolidate only where seams create defects or repeated mapping work.
- **Disposition:** Mostly V1.1/backlog.

### 45. Azure Ecosystem Fit

- **Score:** 80
- **Weight:** 1
- **Weighted deficiency signal:** 20
- **Weighted impact on readiness:** 0.78%
- **Justification:** Azure fit is strong: Entra, Azure SQL, Key Vault, Container Apps, Front Door/WAF, Service Bus, Azure OpenAI, Terraform, private endpoints, and Azure cost/security posture are first-class.
- **Tradeoffs:** Azure-first posture makes non-Azure deployments secondary by design.
- **Improvement recommendations:** Keep Azure as the reference platform and avoid broadening cloud claims before evidence exists.
- **Disposition:** Fixable in V1 where gaps are documentation or validation.

### 46. Testability

- **Score:** 82
- **Weight:** 1
- **Weighted deficiency signal:** 18
- **Weighted impact on readiness:** 0.80%
- **Justification:** Testability is a strength: unit, integration, SQL, live UI/API, auth parity, OpenAPI, k6, chaos, ZAP/Schemathesis, mutation testing, and coverage discipline are documented and wired.
- **Tradeoffs:** The suite is heavy and may be costly to run fully.
- **Improvement recommendations:** Keep tiered test commands clear and add targeted tests with each connector/commercial hardening change.
- **Disposition:** Fixable in V1.

## Top 12 Most Important Weaknesses

1. **Workflow integration gap:** committed enterprise workflow surfaces are not uniformly as complete as the core ArchLucid workflow.
2. **First-use cognitive load:** the product is understandable after study, but still asks a new buyer/operator to learn too much too soon.
3. **Pilot proof dependency:** ROI and trust become most persuasive only after a real tenant run supplies baseline and outcome evidence.
4. **Live-environment readiness burden:** the repo has strong gates, but every deployment still needs its own smoke, auth, SQL, and observability proof.
5. **AI correctness burden:** findings are traceable, but correctness still depends on input quality, model behavior, validation gates, and human review.
6. **Commercial self-serve incompleteness:** quote-to-cash works as a sales-led motion; live self-serve commerce and Marketplace publication are deferred.
7. **Connector maturity unevenness:** inbound sync, events, and publishing surfaces exist, but complete first-party ITSM workflows need hardening.
8. **Procurement assurance friction:** self-assessment is honest, but strict buyers may still ask for CPA SOC 2, ISO, external pen-test, or public references.
9. **Maintenance complexity:** historical seams and many modules increase the cost of change.
10. **Route/tier/policy/nav drift risk:** the product already has guards, but any new operator surface has multiple alignment points.
11. **Performance proof breadth:** k6 smoke and SLOs exist, but route-class production performance proof is still thin.
12. **Exact citation-backed Azure cost proof:** Selling **Azure spend reduction** loses credibility if sponsor or FinOps outputs imply **invoice-grade** totals from **ranges**, **silent estimates**, or **dollars that cannot trace to metering, Retail rates, billing exports, or finding-level evidence**—unless the output is explicitly in a **justified non-invoice mode** (scenario, labeled estimate, qualitative) per improvement #8.

## Top 6 Monetization Blockers

1. **Insufficient buyer-specific ROI proof before a pilot completes.**
2. **Sales-led conversion dependency while live self-serve commerce is deferred.**
3. **Complex first-session story that can slow champion creation.**
4. **Workflow fit questions when Jira/ServiceNow/Confluence/Slack expectations arise.**
5. **Procurement friction from self-attested assurance posture.**
6. **Potential mismatch between value pricing and buyer confidence without external references,** compounded when **Azure spend / savings narratives** claim **exact bill reconciliation** without **citations**—or lack an explicit **justified exception** framing when citations are incomplete.

## Top 6 Enterprise Adoption Blockers

1. **Enterprise toolchain embedding is not yet uniformly first-class.**
2. **Deployment validation remains environment-specific and operator-owned.**
3. **Security/procurement teams may require evidence outside the current V1 contract.**
4. **Operator cognitive load is high for teams that only want one review package.**
5. **Tenant topology and RLS/private endpoint choices require disciplined configuration.**
6. **Governance depth may feel like a second implementation project if introduced too early.**

## Top 6 Engineering Risks

1. **AI recommendation correctness risk:** wrong or weak findings may still be well-formatted and traceable.
2. **Integration state consistency risk:** outbound issue creation, inbound status sync, and correlation must not drift across tools.
3. **Persistence seam risk:** dual repository families and connection factory alignment can create subtle behavior differences.
4. **Tenant isolation misconfiguration risk:** strong controls exist, but production posture depends on correct topology and session context.
5. **Operational telemetry gap risk:** dashboards and metrics exist, but production must prove they are wired and actionable.
6. **Release confidence fragmentation:** local smoke, CI live E2E, scheduled scans, and staging drills can be confused unless evidence is bundled.

## Most Important Truth

ArchLucid is not a toy; it is a serious V1 architecture-review product. Revenue readiness depends on proving one buyer workflow end-to-end with low friction, defensible evidence, and real enterprise tool fit—and **Azure spend-reduction** stories succeed when **invoice-backed dollars are exact with citation-backed proof points**, while **exceptions** remain sales-safe only if **labeled and justified** (methodology, assumptions, partial evidence)—not when uncited totals masquerade as FinOps reconciliation.

## Top Improvement Opportunities

### 1. Complete first-party ITSM outbound issue creation

- **Why it matters:** V1 scope names Jira and ServiceNow as first-party obligations. Enterprise buyers will expect findings to flow into their existing work queues, not just remain inside ArchLucid.
- **Expected impact:** Directly improves Workflow Embeddedness (+10-14 pts), Interoperability (+8-12 pts), Adoption Friction (+3-5 pts), Enterprise Adoption. Weighted readiness impact: +0.7-1.1%.
- **Affected qualities:** Workflow Embeddedness, Interoperability, Adoption Friction, Trustworthiness, Correctness.
- **Status:** Fully actionable now.
- **Cursor prompt:**

```text
Implement the minimum V1 first-party outbound ITSM issue creation slice for Jira and ServiceNow.

Scope:
- Search the existing integration code before editing. Reuse the existing ITSM correlation model, inbound sync service, audit event types, HTTP client patterns, configuration options, and Authority-shaped finding payloads.
- Add outbound issue/incident creation services for:
  - **Jira:** create an issue from an ArchLucid finding with summary, description, severity, run/finding correlation back-link, and tenant-configured project/issue type. Apply the following resolved defaults:
    - **Project key:** two-level config — deployment-wide admin fallback + per-tenant override. If neither is set, refuse and write audit event `"Jira connector not configured: project key required."` Do not create a partial issue.
    - **Issue type:** default `Task`; per-tenant override allowed per-severity.
    - **Priority mapping:** Critical → `Blocker`, High → `High`, Medium → `Medium`, Low → `Low`. **Info severity: drop by default** (do not create a Jira issue); a per-tenant boolean `sendInfoSeverity` (default `false`) enables creation at `Low`.
  - **ServiceNow:** create an incident from an ArchLucid finding with short_description, description, severity/impact mapping, correlation back-link, and optional cmdb_ci behavior consistent with V1 scope.
- Persist a correlation record after successful creation so the existing inbound status sync can update the correct finding.
- Emit durable audit events for successful create, failed create, and skipped/unconfigured connector attempts. Do not log secrets or full external URLs with query strings.
- Add unit tests with fake HttpMessageHandler responses for success, 401/403, 404, 429, 5xx, malformed success response, and correlation persistence failure. Include cases for: unconfigured project key (audit event written, no HTTP call made), Info-severity drop when `sendInfoSeverity` is false (no issue created), Info-severity creation when `sendInfoSeverity` is true (creates at `Low` priority), and full priority-mapping coverage (Critical→Blocker, High→High, Medium→Medium, Low→Low).
- Add API/controller or application entry points only if an existing surface does not already exist. Keep the API authoritative for role checks.
- Update docs that describe the V1 connector behavior, especially V1 scope/integration docs if behavior changes.

Acceptance criteria:
- Jira and ServiceNow outbound create flows can be exercised without real vendor credentials through deterministic tests.
- Successful external creation stores enough correlation for inbound status sync to work.
- Failure cases return actionable, non-secret errors and write durable audit where appropriate.
- No new connector-specific finding projection schema is introduced; use the existing Authority-shaped payload semantics.
- Existing tests pass for the touched projects.

Constraints:
- Do not add a heavy SDK dependency unless the repo already uses it. Prefer HttpClient and simple DTOs.
- Do not implement OAuth unless the current repo scope already requires it for V1 behavior.
- Do not widen the connector catalog beyond Jira and ServiceNow.
- Do not change existing inbound webhook contracts except where required to consume the new correlation records.
```

### 2. Add a one-page first-pilot evidence bundle

- **Why it matters:** Commercial proof is strongest when the product produces a buyer-safe artifact immediately after the first committed review.
- **Expected impact:** Directly improves Proof-of-ROI Readiness (+8-10 pts), Executive Value Visibility (+5-7 pts), Time-to-Value (+3-5 pts), Marketability (+2-4 pts). Weighted readiness impact: +0.7-1.0%.
- **Affected qualities:** Proof-of-ROI Readiness, Executive Value Visibility, Time-to-Value, Marketability, Trustworthiness.
- **Status:** Fully actionable now.
- **Cursor prompt:**

```text
Create a first-pilot evidence bundle artifact that summarizes one committed architecture review for a sponsor and evaluator.

Scope:
- Reuse existing first-value report, sponsor one-pager, ROI evidence completeness, audit-row count, LLM-call count, top-severity finding evidence chain, and demo-data warning logic where available.
- Add a Markdown and PDF/DOCX-capable summary if the existing export pipeline supports the format; otherwise start with Markdown and wire it into the current artifact/export surfaces.
- Include:
  - run id / architecture review identifier
  - committed manifest timestamp
  - time to committed manifest
  - findings by severity
  - top-severity finding evidence-chain pointer
  - audit row count or lower-bound marker
  - LLM call count and **exact** LLM / ArchLucid-incurred USD (or billed currency), each **citation-backed** (token tally + rate-table version identifier + arithmetic line, or exporter reference)
  - ROI evidence confidence
  - explicit missing-proof checklist
  - demo-data warning when applicable
- Add tests for strong, partial, and low-confidence evidence states.
- Add a short doc entry explaining when field teams may send the bundle externally.

Acceptance criteria:
- A committed run can produce a single buyer-safe evidence summary without manual stitching.
- Missing fields are shown as missing, not silently replaced by optimistic defaults.
- Demo/seed data is clearly marked.
- Existing first-value report behavior is reused rather than duplicated.
- **Cost discipline:** When a dollar is presented as **reconciled bill truth**, it is **exact** and each line includes **proof points** (sources as above). If invoice-grade citation is missing, either show an explicit **blocked** state **or** a **justified exception** presentation (labeled estimate/scenario, methodology, assumptions, and what remains uncited)—never implying audit-grade certainty.

Constraints:
- Do not invent new ROI calculations if existing model values already exist.
- Do not pass off banded, inferred, or uncited totals as exact customer invoice savings; prefer **exact + citations**, or **explicitly justified** non-citation modes per improvement #8.
- Do not remove or weaken demo-data warnings.
- Do not add customer names or reference claims.
```

### 3. Create a deployment evidence report for staging/prod

- **Why it matters:** The repo has many readiness gates, but enterprise buyers and operators need one environment-specific proof artifact.
- **Expected impact:** Directly improves Reliability (+6-8 pts), Deployability (+6-8 pts), Azure Compatibility and SaaS Deployment Readiness (+4-6 pts), Procurement Readiness (+2-4 pts). Weighted readiness impact: +0.4-0.7%.
- **Affected qualities:** Reliability, Deployability, Azure Compatibility and SaaS Deployment Readiness, Procurement Readiness, Supportability.
- **Status:** Fully actionable now.
- **Cursor prompt:**

```text
Add a deployment evidence report generator for an ArchLucid hosted environment.

Scope:
- Implement a script or CLI command that collects non-secret evidence from a target base URL and local repo state. **Official V1 posture:** capture evidence for **both staging and production** by running against each configured base URL and emitting **one Markdown report per environment** (filename or header must name the environment, e.g. staging / production, and echo the probe target URL).
- Include:
  - target base URL
  - UTC timestamp
  - git commit / version endpoint response
  - health/live and health/ready status
  - OpenAPI reachability
  - optional synthetic path status
  - current configured smoke command guidance
  - Terraform root list and expected apply order from docs
  - redacted configuration posture summary if available
  - next-step triage text on failure
- Output Markdown under an operator-selected path.
- Add tests for formatting and redaction logic.
- Document the command in deployment/runbook docs.

Acceptance criteria:
- The report can be generated without printing secrets.
- Failed probes include actionable next steps.
- The report explicitly says it is environment evidence, not a global product certification.
- When documenting the V1 rollout, **staging and production** each have at least one generated report on file (or documented command invocation) with matching environment naming.

Constraints:
- Do not require Azure credentials for the first version.
- Do not call destructive endpoints.
- Do not include raw connection strings, API keys, bearer tokens, or Key Vault secret values.
```

### 4. Reduce first-session cognitive load in the operator UI (co-architect, dual front-door)

- **Why it matters:** Adoption friction and cognitive load are among the largest current readiness drag factors. The product is positioned as **"your AI co-architect"** above **two distinct entry intents** — non-technical users want to **describe what they want** and have ArchLucid co-author architecture documents and diagrams through a guided question/answer loop, while technical users (business analysts, developers, IT managers) want to **review an existing architecture** for issues, gaps, and improvements. A single dominant label (e.g. only "architecture review") will mis-frame the product for half its audience.
- **Expected impact:** Directly improves Adoption Friction (+5-8 pts), Usability (+6-8 pts), Cognitive Load (+10-15 pts), Time-to-Value (+2-4 pts), Marketability (+2-3 pts). Weighted readiness impact: +0.5-0.8%.
- **Affected qualities:** Adoption Friction, Usability, Cognitive Load, Time-to-Value, Customer Self-Sufficiency, Marketability.
- **Status:** Fully actionable now.
- **Cursor prompt:**

```text
Tighten the first-session operator UI around the "AI co-architect" umbrella with two coherent entry intents that converge on the same evidence-bundle review.

Umbrella positioning (use consistently in copy, hero, and onboarding):
- Brand line: **"ArchLucid — your AI co-architect."**
- Role noun: **"co-architect"** (do not call the product a co-pilot, co-author, assistant, or generic AI in primary buyer copy).
- Surface noun (optional internal naming): **"Workspace"** for the room; "co-architect" is the role inside it.

Scope:
- Inspect the operator home, onboarding, new-object creation, list views, detail view, and post-commit surfaces.
- Recognize **two front doors** above the **same refinement → coherent deliverables → review** loop:
  1. **"Describe what you want"** — generative authoring intent for non-technical users (loose notes / goals → conversational Q&A with the co-architect → coherent architecture documents and diagrams → review).
  2. **"Review an existing architecture"** — analytical intent for business analysts, developers, and IT managers (existing system → conversational refinement of inputs with the co-architect → findings, evidence, and improvement recommendations → review).
- Keep "run", "manifest", "artifact", and similar engineering terms as **metadata/support language**, not primary buyer copy on either front door.
- For the generative front door, prefer language like "describe", "draft", "co-architect with you", "diagrams and documents", "questions and answers", "coherent set of deliverables".
- For the analytical front door, prefer language like "architecture review", "findings", "evidence", "recommendations", "your co-architect's assessment".
- **V1 sequencing (product decision):** Operator home and welcome **lead with the architecture review door** (primary CTA and copy). The describe door is a **secondary CTA**; both may target the same `/reviews/new` entry (optional `?intent=describe` for future wizard branching). Persist last-clicked intent in `localStorage` when helpful.
- On home, ship an **always-visible co-architect strip** plus welcome-banner copy aligned with the umbrella (avoid duplicating the full brand line twice in competing heroes—one primary surface owns the umbrella line).
- Add a single first-session **intent strip or equivalent** so both paths are visible without a blocking modal; both intents reach the same review surface for the final deliverable bundle.
- De-emphasize Operate/governance/replay/graph concepts until after the first committed deliverable bundle.
- Reuse existing LayerHeader, useNavSurface, layer-guidance, nav-config, and authority-shaped UI patterns; do not fork the navigation tree.
- Add/adjust Vitest tests for the first-session guidance, intent affordances, copy variants, umbrella role-noun consistency, and nav behavior.

Acceptance criteria:
- A non-technical user can start from "describe what you want" and reach a coherent deliverable bundle without learning the words "run" or "manifest".
- A technical user starts from **architecture review** as the **primary** home CTA (V1 lead) and reaches the deliverable/evidence bundle without being forced through generative-only prompts.
- The phrase "co-architect" appears on home and in at least one in-product checklist moment; the words "co-pilot", "assistant", and "AI helper" do not appear in primary buyer copy.
- Existing authority/tier/nav invariants remain intact.
- No API authorization behavior changes.

Constraints:
- Do not rename REST routes, DTOs, database entities, or support identifiers.
- Do not remove advanced capabilities; only change first-session hierarchy and copy.
- Do not bypass existing nav/authority helper modules.
- Do not collapse the two intents into a single label that erases the generative authoring story for non-technical users.
- Do not introduce competing role-nouns (co-pilot, co-author, assistant) in primary buyer copy.
```

### 5. Add connector contract tests for Slack, Confluence, Jira, and ServiceNow

- **Why it matters:** Connector maturity is a buyer-facing enterprise blocker, and contract drift will be expensive.
- **Expected impact:** Directly improves Interoperability (+6-8 pts), Correctness (+3-5 pts), Testability (+2-3 pts), Workflow Embeddedness (+4-6 pts). Weighted readiness impact: +0.4-0.7%.
- **Affected qualities:** Interoperability, Correctness, Workflow Embeddedness, Testability, Maintainability.
- **Status:** Fully actionable now.
- **Cursor prompt:**

```text
Create a focused connector contract test suite for committed V1 external workflow connectors.

Scope:
- Inventory existing Slack, Confluence, Jira, and ServiceNow integration code.
- Add tests around each connector's minimum V1 payload contract:
  - outbound payload contains correlation identifiers
  - severity/status mappings are deterministic
  - missing configuration skips safely
  - 401/403/404/429/5xx are mapped to explicit failure reasons
  - no secrets are logged or included in audit DataJson
  - retry/rate-limit behavior is documented or explicitly not retried
- Prefer shared test helpers for fake HTTP responses and captured requests.
- Update integration docs if tests reveal undocumented behavior.

Acceptance criteria:
- Each committed connector has at least one success-path and multiple failure-path tests.
- Tests do not require network access or vendor credentials.
- The test names document the expected contract.

Constraints:
- Do not add real vendor SDKs.
- Do not add live integration tests.
- Do not change connector behavior unless a test exposes a clear V1 contract bug.
```

### 6. Make AI finding evidence sufficiency visible and enforceable

- **Why it matters:** Correctness and trust depend on whether findings are grounded enough for human review.
- **Expected impact:** Directly improves Correctness (+5-7 pts), Trustworthiness (+4-6 pts), Explainability (+3-5 pts), Proof-of-ROI Readiness (+1-2 pts). Weighted readiness impact: +0.4-0.7%.
- **Affected qualities:** Correctness, Trustworthiness, Explainability, AI/Agent Readiness.
- **Status:** Fully actionable now.
- **Cursor prompt:**

```text
Add an evidence sufficiency signal for generated architecture findings.

Scope:
- Inspect existing finding, explainability trace, evidence chain, and quality gate models.
- Define a lightweight deterministic sufficiency result using existing fields, such as:
  - has supporting graph node ids
  - has rule(s) applied
  - has decisions taken
  - has evidence-chain pointer or citation
  - has confidence/severity populated
- Surface the result in the finding DTO/read model and in relevant first-value or evidence-bundle output.
- Add tests for sufficient, partial, and insufficient findings.
- If a hard rejection gate already exists, do not change default rejection thresholds unless the repo pattern supports it; start by warning/surfacing.

Acceptance criteria:
- Operators can tell when a high-severity finding lacks enough evidence support.
- The signal is deterministic and testable without an LLM.
- Existing findings remain backwards compatible unless codebase conventions say otherwise.

Constraints:
- Do not treat the sufficiency score as legal proof.
- Do not add another LLM call.
- Do not duplicate existing explainability trace models.
```

### 7. Add a configuration posture report for production-like hosts

- **Why it matters:** Production readiness depends on many config gates: auth, CORS, SQL topology, RLS/session context, webhooks, billing, Key Vault, and observability.
- **Expected impact:** Directly improves Manageability (+8-10 pts), Security (+2-4 pts), Deployability (+3-5 pts), Customer Self-Sufficiency (+4-6 pts). Weighted readiness impact: +0.3-0.6%.
- **Affected qualities:** Manageability, Security, Deployability, Customer Self-Sufficiency, Reliability.
- **Status:** Fully actionable now.
- **Cursor prompt:**

```text
Add a non-secret production-like configuration posture report.

Scope:
- Reuse ArchLucidConfigurationRules, StartupConfigurationFacts, and existing diagnostics formatters.
- Produce a report that categorizes posture as Pass, Warn, or Fail for:
  - auth mode and API key/JWT readiness
  - DevelopmentBypassAll status
  - SQL storage provider and topology
  - RLS/session context expectation
  - CORS origins
  - webhook HMAC configuration presence
  - billing/Marketplace safety gates
  - Key Vault provider/reference posture
  - observability exporters / Prometheus enablement
  - email provider posture
- Add CLI or admin-safe endpoint only if existing diagnostics patterns allow it; otherwise implement as a CLI/report formatter first.
- Add unit tests for redaction and representative pass/fail scenarios.

Acceptance criteria:
- Operators can generate the report without exposing secret values.
- Production-like unsafe states are clearly marked.
- The report links or points to the rule that failed.

Constraints:
- Do not print connection strings, API keys, token values, client secrets, or webhook secrets.
- Do not weaken fail-fast startup rules.
- Do not make the report a replacement for startup validation.
```

### 8. Add route-class performance and exact citation-backed cost visibility

- **Why it matters:** Operators need latency routing; FinOps-heavy buyers rationalize adoption with **measurable Azure workload savings.** That selling motion should lead with **citation-backed exact dollars** when claiming **invoice-level** certainty; otherwise use **labeled, justified** modes (scenario, Retail-calculated estimate, qualitative waste classes, bounded sensitivity) so sponsors see honesty under missing billing extracts. Procurement risk comes from implied precision—not from every bullet requiring omission.
- **Expected impact:** Directly improves Cost-Effectiveness (+8-11 pts), Trustworthiness (+3-5 pts), Performance (+6-8 pts), Proof-of-ROI Readiness (+4-6 pts), Observability (+2-4 pts). Weighted readiness impact: +0.5-0.8%.
- **Affected qualities:** Cost-Effectiveness, Trustworthiness, Performance, Proof-of-ROI Readiness, Observability, Executive Value Visibility.
- **Status:** Fully actionable now.
- **Cursor prompt:**

```text
Add route-class performance visibility and exact citation-backed cost reporting for customer- and sponsor-facing surfaces.

Product rule (customer-visible spend / savings):
- **Default:** **Exact** monetary amounts with **mandatory citations** on each asserted bill-truth line: link or pointer to the proof pack (meter id and export row, Azure Retail price page URL + SKU + region + currency + effective date, in-repo rate table id + version + SHA, token histogram row ids + formula, finding id + evidence chain that ties to the billed resource scope, etc.).
- **No impersonation:** Do not use "about", "~", or silent bands while claiming reconciliation-grade certainty.
- **Justified exceptions** when citations are incomplete: emit a labeled **presentation mode** (e.g. `Invoice-backed`, `Retail-rate scenario`, `ArchLucid-metered only`, `Qualitative`) plus methodology text, inputs, uncertainty, and the evidence gap—**or** a **blocked—missing citation** state. You may retain the narrative bullet; it must carry that justification rather than implying exact audited savings without proof.

Scope:
- Inspect existing OTel metrics, k6 scripts, LLM cost estimation (token counts x rates), first-value/value report outputs, and any Azure cost playbooks.
- Classify key routes into existing latency tiers: infrastructure, synchronous API, AI-augmented, async/polling.
- Extend run/sponsor/FinOps-oriented outputs with:
  - exact ArchLucid LLM run cost (derived from measured tokens x declared rate table version; show the arithmetic and cite the table row)
  - optional customer Azure delta lines **only** when upstream usage or billing extracts are attached as citations (do not infer customer Azure bills from ArchLucid alone without stated assumptions)
  - route-class latency notes from existing telemetry
- Extend k6 or reporting docs to map thresholds to route classes.
- Add tests that fail when a customer-facing total is emitted in **invoice-backed** (or equivalent) mode without a citation block; add tests that justified **scenario/estimate** lines include mode + methodology markers; tests for redaction and missing-input blocked states.

Acceptance criteria:
- Operators can distinguish product slowness from expected AI/async duration.
- Sponsor/FinOps exports: invoice-backed lines are **exact** with a **proof points** subsection; non-citation lines are **labeled** per exception rules and cannot default to implying bill truth.
- No silent banded cost or uncited savings pretending to be exact invoice reconciliation.

Constraints:
- Do not add a billing line item to Stripe or Marketplace.
- Optional: allow pulling public Azure Retail reference prices when documented and versioned; do not silently call unbounded external pricing APIs without caching version metadata.
- Do not fail existing tests when optional customer billing inputs are absent (blocked state is OK).
```

### 9. Create a buyer decision packet generator

- **Why it matters:** Decision velocity improves when value, pilot plan, trust posture, pricing path, and next step are packaged together.
- **Expected impact:** Directly improves Decision Velocity (+8-10 pts), Marketability (+2-4 pts), Procurement Readiness (+2-4 pts), Commercial Packaging Readiness (+3-5 pts). Weighted readiness impact: +0.4-0.6%.
- **Affected qualities:** Decision Velocity, Marketability, Procurement Readiness, Commercial Packaging Readiness.
- **Status:** Fully actionable now.
- **Cursor prompt:**

```text
Add a buyer decision packet generator for sales-led V1 evaluation.

Scope:
- Reuse existing sponsor brief, pilot ROI model, pricing philosophy/order-form links, trust-center posture, procurement pack manifest, and pilot success scorecard.
- Generate a Markdown packet with:
  - one-paragraph value proposition
  - recommended pilot path
  - success criteria
  - proof artifacts the buyer will receive
  - trust/procurement evidence links
  - pricing/quote path summary
  - explicit exclusions/deferred items that must not be promised
- Add a script or CLI command if there is an existing procurement-pack pattern to reuse; otherwise add a docs template and build script.
- Add tests for required section presence and no forbidden over-claims.

Acceptance criteria:
- The packet can be generated from repo sources without manual copy/paste.
- It does not claim CPA SOC 2, ISO, third-party pen-test completion, public references, or live Marketplace publication.
- It links to canonical pricing rather than duplicating uncontrolled numbers unless existing single-source rules permit it.

Constraints:
- Do not add buyer-specific names to committed files.
- Do not weaken existing pricing single-source guards.
- Do not import external score baselines.
- If the packet mentions **Azure spend reduction** or customer workload dollars, figures follow improvement #8: **default** exact + citation proof points where bill truth is asserted; **exceptions** allowed if the bullet carries an explicit justification (mode label, assumptions, cited partial evidence, gaps)—never implying invoice-grade precision without the proof trail.
```

### 10. Add a first-value live-model evidence capture lane

- **Why it matters:** Simulator tests prove deterministic mechanics, but commercial confidence requires a controlled real-LLM evidence path.
- **Live model pin:** **gpt-4o** (Azure OpenAI deployment used for field real-model evidence runs).
- **Expected impact:** Directly improves AI/Agent Readiness (+5-7 pts), Correctness (+3-5 pts), Trustworthiness (+2-4 pts), Differentiability (+2-3 pts). Weighted readiness impact: +0.4-0.6%.
- **Affected qualities:** AI/Agent Readiness, Correctness, Trustworthiness, Differentiability.
- **Status:** Fully actionable now.
- **Cursor prompt:**

```text
Add a controlled first-value real-model evidence capture lane.

Canonical live-model target: **gpt-4o** (Azure OpenAI deployment name must match the configured deployment used for ArchLucid agent execution — document as the field-evidence standard in runbook text).

Scope:
- Inspect existing first-real-value docs, AgentExecution real mode configuration, LLM trace storage, budget controls, prompt redaction, and evidence templates.
- Add a script or documented command path that:
  - verifies real-mode prerequisites without printing secrets
  - assumes **gpt-4o** as the deployment for real-model evidence runs (fail closed or warn loudly if configuration points elsewhere)
  - runs one bounded architecture review
  - captures run id, deployment/model identity (must show **gpt-4o** when real path succeeded), prompt version catalog, LLM call count, **exact citation-backed** LLM cost (same proof discipline as improvement 8), trace persistence status, findings count, and evidence completeness
  - emits a Markdown evidence report
  - marks fallback-to-simulator clearly when fallback occurs
- Add tests for report formatting, fallback markers, and redaction.

Acceptance criteria:
- A field engineer can collect real-model evidence in a repeatable way.
- The report distinguishes simulator, fallback, and real-model execution and records **gpt-4o** as the live evidence target when the real path was used.
- No prompt/response secret or sensitive raw payload is printed unless an existing redacted trace policy allows it.

Constraints:
- Do not require live Azure OpenAI in normal CI.
- Do not increase default LLM budgets.
- Do not remove simulator-first test behavior.
```

## Pending Questions for Later

### Complete first-party ITSM outbound issue creation

- **Resolved (Jira project key):** Two-level config. No system-level default — a hosted-deployment admin sets a **deployment-wide fallback key** during onboarding; each tenant can override with their own key. If neither is set, the connector refuses silently and writes a durable audit event: `"Jira connector not configured: project key required."` No silent partial creation.
- **Resolved (Jira issue type):** Default `Task` for all severities. Tenants may override per-severity via config. `Task` is the safest universal type across all Jira project schemas.
- **Resolved (Jira priority mapping):** Critical → `Blocker`, High → `High`, Medium → `Medium`, Low → `Low`. **Info findings are dropped by default** (no Jira issue created); a per-tenant opt-in (`sendInfoSeverity: true`) enables them at `Low` priority. Rationale: Info findings are observational; sending them by default would flood customer backlogs and risk the integration being turned off.
- **Open:** Which ServiceNow table/custom fields beyond `incident` and optional `cmdb_ci_appl` are required by the first target buyer?

### Add a one-page first-pilot evidence bundle

- Which artifact format should be treated as the customer-default deliverable: Markdown, PDF, DOCX, or ZIP bundle?

### Create a deployment evidence report for staging/prod

- **Resolved (evidence targets):** The first official targets for captured deployment evidence are **both staging and production**. Operator or automation should produce **separate, explicitly labeled reports per environment** (base URL / host identity in the artifact); do not present a single undifferentiated bundle without naming which environment each probe refers to.
- Should this become a release artifact in CI/CD or remain an operator-run command?

### Reduce first-session cognitive load in the operator UI

- **Resolved (umbrella positioning):** Brand line is **"ArchLucid — your AI co-architect."** The role-noun **"co-architect"** is the umbrella above both front doors; it captures the conversational refinement loop, elevates the customer (who remains *the* architect), avoids the Microsoft Copilot collision, and earns enterprise credibility because IT staff—analysts, developers, IT managers—already self-identify with the architect title.
- **Resolved (front doors):** Two intent-shaped entry points share one back-end loop and converge on the same deliverable review:
  1. **"Describe what you want"** for non-technical users — they enter loose notes/goals; the co-architect asks clarifying questions and gives feedback until there is a coherent set of architecture documents and diagrams to review.
  2. **"Architecture review"** for business analysts, developers, and IT managers — they bring an existing architecture to be analyzed; the same conversational refinement loop converges on findings, evidence, and recommendations to review.
- **Resolved (surface naming):** Internal product surface may keep names like **"Workspace"** for the *room*; **"co-architect"** is the *role* the product plays inside it. Surface and role layer rather than compete.
- **Resolved (V1 marketing lead / sequencing):** Operator home and welcome surfaces **lead with the architecture review door** (primary CTA and copy). The **describe what you want** door remains a **secondary CTA** into the same new-review flow; FinOps/Azure-savings campaigns still land on the review path. **Implemented in product:** `OperatorCoArchitectHomeStrip` + welcome banner primary CTA copy in `archlucid-ui`.
- **Open (testing risk):** Validate that non-technical buyers (founders, product managers, business owners) do not bounce off the literal word "architect." If they do, keep "co-architect" for the technical persona and lead the non-technical hero with an outcome verb ("Turn your idea into a real architecture, conversationally."), surfacing "co-architect" once they are inside.

### Add route-class performance and exact citation-backed cost visibility

- **Resolved:** Follow improvement #8: **default** invoice-backed dollars are **exact** and citation-backed with **proof points**; **justified exceptions** (labeled scenario/estimate/qualitative/blocked-with-rationale) are allowed when citations are incomplete—do not silently present uncited totals as bill truth.