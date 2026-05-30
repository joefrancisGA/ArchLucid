# ArchLucid Assessment - (A) Headline Readiness: 76.47%

This score is the `(A)` headline readiness score per `Assessment-Scope-V1_1.mdc`. It excludes items explicitly deferred to V1.1, V1.x, V2, or procurement-only `(B)` realism: CPA SOC 2 attestation, third-party pen-test execution/publication, signed design partner, public plugin SDK/marketplace, MCP in V1, V1.1 first-party connectors, live Stripe/Marketplace un-hold, multi-region active/active, AWS/GCP target analysis, and other scope-deferred items documented in `V1_SCOPE.md` and `V1_DEFERRED.md`.

Method: clean-slate, first-principles assessment from current repository materials only. I did not use previous assessment scores or conclusions.

Total weight: 119. Weighted score: 9,100 / 11,900 = 76.47%.

## 2. Executive Summary

### `(A)` Overall Headline Readiness

ArchLucid is credible for controlled V1 pilots and service-led first-value reviews, not yet credible for broad self-serve or aggressive enterprise claims. The product has a coherent review lifecycle, proof-packet discipline, source-labeled ROI posture, auditability, tenant isolation narrative, configuration linting, and a clear "do not overpromise" boundary. The remaining headline risk is not missing roadmap scope; it is whether real-mode runs repeatedly produce buyer-verifiable, source-cited, mode-labeled proof without manual rescue.

Deferred scope uncertainty: none material for this pass. The repo contains `V1_SCOPE.md`, `V1_DEFERRED.md`, `Assessment-Scope-V1_1.mdc`, and the V1.1 assurance backlog rule. Some trust-center wording still has stale V2 language for third-party pen testing while the newer scope/backlog files place TB-136 on the V1.1 backlog; this is treated as documentation consistency risk, not a headline product deduction.

### `(B)` Procurement / Market-Motion Realism

Procurement friction remains real even though it is not scored into `(A)`. Security reviewers will ask for SOC 2 CPA reports, independent pen-test summaries, live customer references, published Marketplace availability, production availability evidence, and integration depth. The current trust pack is honest and useful, but the sales motion must remain founder-led or service-led until proof density, real-mode evidence, and claim discipline are stronger.

### Commercial Picture

The commercial wedge is sharp: sell a proof-backed architecture review outcome, not a generic AI platform. Pricing, quote paths, proof packets, ROI basis labels, and "what not to promise" guardrails exist. The blocker is conversion confidence: the repo shows many artifacts that help close a technical evaluation, but less evidence that the first buyer can reach a purchase decision quickly without founder interpretation.

### Enterprise Picture

Enterprise foundations are unusually strong for this stage: audit trail, RBAC, SCIM, OIDC/SAML posture, DPA/SIG/CAIQ material, tenant database isolation, Azure-first deployment, and governance workflows. The enterprise gap is operational proof: production-like profile enforcement, Azure AI Search isolation proof, repeatable support bundles, current trust-center wording, and usable workflows that do not require the buyer to understand the whole system.

### Engineering Picture

The engineering base is modular, test-aware, Azure-native, and heavily instrumented. The risk is breadth and complexity. Correctness now depends on a long chain: evidence ingest, retrieval, real or simulator agents, schema validation, quality gates, manifest commit, ROI/source classification, exports, UI display, and proof-packet scripts. That chain is architecturally sound, but the most important sections are still supported by narrow real-LLM evidence and several warn-only or optional gates.

## 3. Weighted Quality Assessment

Qualities are ordered by weighted deficiency signal, not by raw score. "Contribution" is score x weight / 119. "Deficiency signal" is (100 - score) x weight / 119.

### Cutting-Edge AI Technology

- Score: 67
- Weight: 8
- Weighted contribution: 4.50%
- Weighted deficiency signal: 2.22%
- Justification: The system has structured outputs, schema validation, optional JSON schema response format, deterministic semantic evaluation, LLM judge paths, faithfulness ratios, retrieval harnesses, and real-mode Azure OpenAI plumbing. That is solid engineering. It is not yet cutting-edge in the market sense: no broad real golden cohort, limited real-mode proof, no advanced retrieval/reranking evidence at scale, no agentic retrieval loop, and no proof that the AI layer outperforms a strong deterministic workflow across many scenarios.
- Tradeoffs: The conservative design reduces hallucination and cost risk. It also makes the AI story feel more like a controlled review pipeline than a frontier AI co-architect.
- Improvement recommendations: Expand golden cohorts, make real-mode evidence actionable and repeatable, add retrieval-quality coverage by corpus kind, and show exactly when the AI is adding judgment versus formatting deterministic evidence.
- Fixability: V1-fixable for evidence breadth and gates; deeper agentic/RAG advances are V1.1/V2.

### AI/Agent Readiness

- Score: 74
- Weight: 8
- Weighted contribution: 4.97%
- Weighted deficiency signal: 1.75%
- Justification: Agent execution has real/simulator mode disclosure, quality gates, schema validation, budget accounting, content safety hooks, prompt redaction, trace recording, and a small faithfulness report with mean support ratio 0.8571. A real Azure OpenAI smoke session exists, but it was topology-only and explicitly did not prove full quad-agent merge. The optional real-LLM workflow is `continue-on-error`, and the buyer-safe story still depends on gating discipline during sponsor handoff.
- Tradeoffs: Simulator mode gives deterministic demos and cheap CI. It cannot prove semantic quality under the hosted real-mode model.
- Improvement recommendations: Treat real-mode evidence as an RC artifact, expand the golden cohort, fail when configured real-mode evidence regresses, and expose quality disposition consistently in UI, CLI, PDFs, and proof packets.
- Fixability: V1-fixable for core proof. Broad autonomous or agentic workflows are deferred.

### Marketability

- Score: 74
- Weight: 8
- Weighted contribution: 4.97%
- Weighted deficiency signal: 1.75%
- Justification: The product has a clear wedge, pricing philosophy, commercial decision packet, proof packets, demo proof shapes, buyer-job pages, and explicit guardrails. Marketability is limited by proof density and simplicity: a prospect has to understand mode labels, evidence chains, ROI basis, V1 vs V1.1 surfaces, and procurement caveats before trusting the story.
- Tradeoffs: Honest caveats protect credibility but reduce punch in early marketing copy.
- Improvement recommendations: Lead with a single buyer outcome, attach one proof packet, keep deferred scope out of the first screen, and convert proof density into concise public-facing artifacts.
- Fixability: Mostly V1-fixable through packaging and evidence, with references/design partners intentionally out of `(A)`.

### Correctness

- Score: 78
- Weight: 8
- Weighted contribution: 5.24%
- Weighted deficiency signal: 1.48%
- Justification: The repo shows strong correctness posture: schema validation, tests, OpenAPI snapshot discipline, route/policy/nav checks, data consistency scripts, proof gates, and Dapper/SQL contract coverage. The risk is end-to-end semantic correctness. A correct answer requires evidence ingest, retrieval, agent output, merge, ROI source classification, audit, and export all to agree. Current real-mode proof is too narrow to justify a higher score.
- Tradeoffs: Modular correctness is high; cross-surface correctness remains expensive to prove.
- Improvement recommendations: Add end-to-end invariant tests around sponsor claims, run detail fields, ROI source labels, and proof-packet outputs.
- Fixability: V1-fixable.

### Adoption Friction

- Score: 72
- Weight: 6
- Weighted contribution: 3.63%
- Weighted deficiency signal: 1.41%
- Justification: The first-pilot path is well documented and now has a 20-minute narrative, but a real production-like pilot still requires SQL, auth, host roles, Azure OpenAI or simulator decisions, evidence ingestion, quality gates, optional Azure AI Search, and proof packet interpretation. That is acceptable for founder-led pilots, heavy for self-serve.
- Tradeoffs: The setup complexity buys auditability, tenant isolation, and procurement honesty.
- Improvement recommendations: Convert the first-pilot checklist into live readiness cards and a single CLI/UI status object that tells the operator exactly what blocks sponsor handoff.
- Fixability: V1-fixable for the pilot path; full self-serve is later.

### Stickiness

- Score: 77
- Weight: 6
- Weighted contribution: 3.88%
- Weighted deficiency signal: 1.16%
- Justification: Signed manifests, audit, governance, compare/replay, ROI summaries, policy packs, and evidence history create durable product value. Stickiness is not yet fully proven because repeated workflow use and first-party operational connectors are mostly V1.1 or later, and the first revenue motion is still service-led.
- Tradeoffs: Evidence-first stickiness is stronger than chat-first stickiness, but it takes longer for users to feel the habit loop.
- Improvement recommendations: Strengthen post-commit next actions, repeat review loops, and executive ROI trend surfaces.
- Fixability: V1-fixable for habit loops; connector-driven workflow lock-in is V1.1.

### Time-to-Value

- Score: 82
- Weight: 7
- Weighted contribution: 4.82%
- Weighted deficiency signal: 1.06%
- Justification: The repo now has a "first value in 20 minutes" path, operator checklist, proof-packet commands, demo workspaces, and a first-pilot command center. This is a strong V1 signal. The remaining deduction is for real environment setup and the gap between a demo-derived packet and a sponsor-safe buyer packet.
- Tradeoffs: Simulator speed is high; real-mode sponsor confidence is slower.
- Improvement recommendations: Make the fastest path produce an explicit PASS/WARN/HOLD status, not just a folder of artifacts.
- Fixability: V1-fixable.

### Proof-of-ROI Readiness

- Score: 76
- Weight: 5
- Weighted contribution: 3.19%
- Weighted deficiency signal: 1.01%
- Justification: ROI source classification, first-value reports, executive ROI summaries, cost evidence freshness, and "do not guarantee savings" guardrails exist. The weakness is realized-value proof: the system can label estimates and baselines, but it has not yet accumulated enough real committed runs to make ROI claims commercially forceful.
- Tradeoffs: Conservative ROI labels reduce close-rate drama but avoid unsupported savings claims.
- Improvement recommendations: Require source kinds for every dollar/time claim, create proof-density rollups over real pilot runs, and separate estimated savings from realized action closure.
- Fixability: V1-fixable for source integrity; realized outcomes require pilots.

### Workflow Embeddedness

- Score: 66
- Weight: 3
- Weighted contribution: 1.66%
- Weighted deficiency signal: 0.86%
- Justification: V1 has REST, CLI, UI, SCIM, GitHub/Azure DevOps surfaces, and Azure extractor upload. Day-to-day embedded workflows for Jira, ServiceNow, Confluence, Slack, Teams, webhooks, and MCP are V1.1 and therefore not a headline deduction. Still, the current V1 experience remains more "export and hand off" than "lives inside my work system."
- Tradeoffs: Holding connectors out of V1 keeps scope honest. It leaves more manual workflow stitching today.
- Improvement recommendations: Make GitHub/Azure DevOps handoff and proof attachments excellent, and avoid implying V1.1 connectors are GA.
- Fixability: V1-fixable for handoff polish; first-party connectors are V1.1.

### Usability

- Score: 73
- Weight: 3
- Weighted contribution: 1.84%
- Weighted deficiency signal: 0.68%
- Justification: The operator path is clearer than the product breadth. Home-page first-pilot strip, review detail alerts, and runbooks help. The system still exposes too much vocabulary and too many optional surfaces early: Pilot vs Operate, run vs review, proof packet vs first-value report, quality gate vs faithfulness, deferred scope vs procurement caveat.
- Tradeoffs: Precision helps enterprise trust but raises cognitive load.
- Improvement recommendations: Use live status cards and primary-next-action UI to hide advanced lanes until a committed review exists.
- Fixability: V1-fixable.

### Differentiability

- Score: 80
- Weight: 4
- Weighted contribution: 2.69%
- Weighted deficiency signal: 0.67%
- Justification: Evidence-backed architecture review, signed manifests, audit chain, governance gates, ROI source labels, and advisory-only Terraform are strong differentiators against generic AI chat. The weakness is proof: the differentiation is more obvious in docs and architecture than in a single undeniable buyer artifact.
- Tradeoffs: A disciplined system is less flashy than "AI magic," but more enterprise-sellable.
- Improvement recommendations: Ship one canonical proof packet that demonstrates why ArchLucid is not just ChatGPT plus templates.
- Fixability: V1-fixable.

### Trustworthiness

- Score: 75
- Weight: 3
- Weighted contribution: 1.89%
- Weighted deficiency signal: 0.63%
- Justification: Trustworthiness benefits from mode labels, faithfulness metrics, quality gates, provenance footers, audit events, redaction, and trust-center honesty. It is held back by narrow live evidence, optional/warn-only gates, stale or conflicting assurance wording, and dependence on operator discipline.
- Tradeoffs: Trust is built through caveats and gates, but buyers also need simple confidence.
- Improvement recommendations: Turn critical sponsor-safety checks into hard HOLDs and remove stale trust wording conflicts.
- Fixability: V1-fixable, excluding deferred assurance programs.

### Executive Value Visibility

- Score: 82
- Weight: 4
- Weighted contribution: 2.76%
- Weighted deficiency signal: 0.61%
- Justification: First-value reports, executive ROI dashboard cards, orphan candidate KPIs, systemic issue trends, and sponsor first-page status are strong. The deduction is that source strength and realized value still need more visible separation so executives do not confuse estimates with booked value.
- Tradeoffs: Rich dashboards can overwhelm a sponsor if the first page is not decisive.
- Improvement recommendations: Keep the first page focused on evidence source, quality disposition, ROI basis, top findings, and next action.
- Fixability: V1-fixable.

### Interoperability

- Score: 72
- Weight: 2
- Weighted contribution: 1.21%
- Weighted deficiency signal: 0.47%
- Justification: REST, OpenAPI, .NET client, CLI, SCIM, Azure DevOps/GitHub surfaces, and extractor ZIP make V1 interoperable enough for pilots. Native ecosystem integration depth is explicitly V1.1 or later.
- Tradeoffs: REST/CLI are universal but less sticky than native connectors.
- Improvement recommendations: Strengthen copy-paste recipes and contract tests around the V1 handoff paths.
- Fixability: V1 for REST/CLI handoff; V1.1 for committed connectors.

### Decision Velocity

- Score: 72
- Weight: 2
- Weighted contribution: 1.21%
- Weighted deficiency signal: 0.47%
- Justification: Pricing, quote request, commercial decision packet, and proof-packet guidance exist. Decision velocity is still slowed by caveats, deferred commerce un-hold, and the need for a founder to interpret proof artifacts.
- Tradeoffs: Sales-led motion is realistic now, but less scalable than self-serve.
- Improvement recommendations: Create a one-page "send this after the first review" artifact with PASS/HOLD, price path, and next meeting agenda.
- Fixability: V1-fixable, except live commerce un-hold.

### Security

- Score: 82
- Weight: 3
- Weighted contribution: 2.07%
- Weighted deficiency signal: 0.45%
- Justification: Security posture is strong: tenant catalog isolation, RLS support, RBAC, OIDC/SAML/SCIM, Key Vault, prompt redaction, content safety, ZAP/Schemathesis, gitleaks, billing replay guard, and advisory-only Terraform. Current risk is proof and drift: production-like Azure AI Search isolation and trust wording need clean validation.
- Tradeoffs: Security depth increases setup and operator burden.
- Improvement recommendations: Expand tenant isolation IDOR coverage and production-like vector-search linting.
- Fixability: V1-fixable.

### Procurement Readiness

- Score: 74
- Weight: 2
- Weighted contribution: 1.24%
- Weighted deficiency signal: 0.44%
- Justification: The procurement pack, DPA template, SIG/CAIQ, trust center, SOC self-assessment, security one-pagers, and objection playbooks are strong. The deduction is for stale/conflicting trust-center wording, optional strictness, and the absence of `(B)` artifacts buyers often demand.
- Tradeoffs: Honest "not attested yet" language protects the company but slows enterprise procurement.
- Improvement recommendations: Make procurement pack strict mode a release expectation and add a trust-center consistency guard.
- Fixability: V1-fixable for docs/artifacts; assurance programs are deferred and not scored.

### Architectural Integrity

- Score: 83
- Weight: 3
- Weighted contribution: 2.09%
- Weighted deficiency signal: 0.43%
- Justification: The system has clear layers: API, Application, Persistence, AgentRuntime, UI, and contracts. Dapper persistence, DbUp migrations, authority orchestration, domain dependency tests, and architecture invariants are coherent. The main concern is accumulated surface area and parallel vocabulary that can confuse future development.
- Tradeoffs: Modular breadth supports enterprise features; it also creates navigation and consistency costs.
- Improvement recommendations: Continue enforcing invariants and collapse duplicate vocabulary in buyer-facing paths.
- Fixability: V1-fixable.

### Commercial Packaging Readiness

- Score: 75
- Weight: 2
- Weighted contribution: 1.26%
- Weighted deficiency signal: 0.42%
- Justification: Packaging tiers, quote path, order-form basis, service-led offers, and pricing guardrails exist. It is less ready for self-serve packaging and broad public claims, which are intentionally not V1 headline gates.
- Tradeoffs: Sales-led packaging is enough for first revenue but not for low-touch scale.
- Improvement recommendations: Make the service-led pilot SKU the primary package and keep self-serve commerce secondary until proof gates pass.
- Fixability: V1-fixable for service-led packaging; live checkout is deferred.

### Compliance Readiness

- Score: 76
- Weight: 2
- Weighted contribution: 1.28%
- Weighted deficiency signal: 0.40%
- Justification: SOC self-assessment, CAIQ/SIG, DPA, privacy materials, audit coverage, and trust pack are meaningful. No CPA SOC 2 or third-party pen test is deducted from `(A)`. The deduction is for self-attested maturity, draft accessibility disclosures, stale assurance wording, and operational evidence gaps.
- Tradeoffs: Honest self-attestation is commercially weaker than certification but appropriate at this stage.
- Improvement recommendations: Keep self-assessment current, remove conflicting assurance dates/window labels, and build a release evidence index.
- Fixability: V1-fixable for documentation consistency; CPA/vendor programs deferred.

### Reliability

- Score: 77
- Weight: 2
- Weighted contribution: 1.29%
- Weighted deficiency signal: 0.39%
- Justification: Health checks, readiness, config linting, SQL resilience, budgets, quality gates, and runbooks exist. Scheduled reliability drills and failover/soak checks appear advisory or continue-on-error in places. Production-like reliability evidence is not yet strong enough for higher scoring.
- Tradeoffs: V1 does not promise active/active, and that should not be scored as a defect.
- Improvement recommendations: Promote the most relevant first-pilot reliability checks from advisory to release evidence.
- Fixability: V1-fixable for pilot reliability.

### Maintainability

- Score: 78
- Weight: 2
- Weighted contribution: 1.31%
- Weighted deficiency signal: 0.37%
- Justification: The repo has strong coding conventions, solution filters, modular services, code maps, and test discipline. Maintainability is limited by sheer size, many docs, generated clients, broad workflows, and occasional doc-code drift.
- Tradeoffs: High documentation density helps onboarding but can become a second system to maintain.
- Improvement recommendations: Add focused consistency guards for the claims that affect buyers and release gates.
- Fixability: V1-fixable.

### Traceability

- Score: 86
- Weight: 3
- Weighted contribution: 2.17%
- Weighted deficiency signal: 0.35%
- Justification: Evidence-to-finding-to-manifest-to-artifact-to-audit is a clear invariant. Audit coverage, provenance, run IDs, manifest versions, source labels, and proof manifests are strong. The remaining gap is cross-surface trace completeness under real-mode runs.
- Tradeoffs: Traceability adds ceremony but is a core differentiator.
- Improvement recommendations: Add tests that compare trace fields across API, UI, CLI, and export outputs.
- Fixability: V1-fixable.

### Azure Compatibility and SaaS Deployment Readiness

- Score: 79
- Weight: 2
- Weighted contribution: 1.33%
- Weighted deficiency signal: 0.35%
- Justification: Azure-native identity, SQL, Blob, Key Vault, Front Door/WAF, Azure OpenAI, Azure AI Search requirements, Terraform modules, and configuration profiles are strong. The gap is proving production-like readiness from Terraform plan/config artifacts without manual interpretation.
- Tradeoffs: Azure-native posture is aligned with likely buyers but narrows first-market fit outside Azure.
- Improvement recommendations: Add a production-like readiness fixture and CI check that exercises the exact config-lint and IaC posture.
- Fixability: V1-fixable for Azure pilots.

### Data Consistency

- Score: 81
- Weight: 2
- Weighted contribution: 1.36%
- Weighted deficiency signal: 0.32%
- Justification: SQL Server is canonical, Dapper repositories have contract tests, migrations are centralized, run/manifest/audit chains exist, and proof scripts inspect consistency. Risk remains around multi-surface projections, executive ROI aggregation, and real-mode trace/evidence consistency.
- Tradeoffs: SQL-first consistency is strong; projection breadth creates drift risk.
- Improvement recommendations: Extend invariant tests around ROI source catalog, run detail, and proof-packet fields.
- Fixability: V1-fixable.

### Policy and Governance Alignment

- Score: 82
- Weight: 2
- Weighted contribution: 1.38%
- Weighted deficiency signal: 0.30%
- Justification: Approval workflows, policy packs, pre-commit gate, governance dashboard, default bundles, and governance alerts are present. The deduction is for making governance understandable and actionable in the first pilot without turning it into a separate product tour.
- Tradeoffs: Governance depth is an enterprise strength but can overwhelm early users.
- Improvement recommendations: Keep governance optional until after first commit and surface only blocking exceptions in sponsor paths.
- Fixability: V1-fixable.

### Explainability

- Score: 82
- Weight: 2
- Weighted contribution: 1.38%
- Weighted deficiency signal: 0.30%
- Justification: Explanation basis labels, evidence refs, provenance footers, faithfulness metrics, sponsor status, and manual-review labels are strong. The gap is making all outputs equally clear about what is evidence-backed, estimated, demo-derived, or low support.
- Tradeoffs: More labels can reduce readability.
- Improvement recommendations: Normalize the same evidence-basis vocabulary across UI, CLI, Markdown, DOCX, and PDF.
- Fixability: V1-fixable.

### Cognitive Load

- Score: 68
- Weight: 1
- Weighted contribution: 0.57%
- Weighted deficiency signal: 0.27%
- Justification: The product is conceptually heavy. It asks users to understand reviews/runs, manifests, proof packets, quality gates, ROI basis, governance, deferred scope, and integration windows. Recent first-pilot strip work helps but does not fully hide the complexity.
- Tradeoffs: Enterprise correctness requires concepts; first-value UX must hide most of them.
- Improvement recommendations: Replace explanatory density with live status, next action, and "why blocked" cards.
- Fixability: V1-fixable.

### Scalability

- Score: 69
- Weight: 1
- Weighted contribution: 0.58%
- Weighted deficiency signal: 0.26%
- Justification: The system has Azure-friendly architecture, cache options, budgets, worker roles, and documented scale boundaries. V1 intentionally does not require multi-region active/active or Redis baselines for all deployments. Scalability proof for larger fleets and heavy tenants is still thin.
- Tradeoffs: Single-region pilot simplicity is right for V1.
- Improvement recommendations: Add load/soak evidence for the first-pilot and executive ROI hot paths.
- Fixability: V1-fixable for pilot scale; fleet-scale cache hardening is V2.

### Performance

- Score: 70
- Weight: 1
- Weighted contribution: 0.59%
- Weighted deficiency signal: 0.25%
- Justification: There are performance-related controls, cost estimates, cache settings, and SLO targets. Fresh measured performance evidence for the actual first-pilot path is not prominent.
- Tradeoffs: Premature load testing would be lower leverage than proof correctness, but basic latency budgets matter.
- Improvement recommendations: Add a small performance budget smoke for proof generation, run detail, and executive ROI summary.
- Fixability: V1-fixable.

### Availability

- Score: 72
- Weight: 1
- Weighted contribution: 0.61%
- Weighted deficiency signal: 0.24%
- Justification: Health endpoints, SLO docs, hosted probe rollups, and DR targets exist. The trust center correctly warns not to treat staging probes as production SLA evidence. That honesty limits the score until production-like evidence accumulates.
- Tradeoffs: V1 avoids overpromising availability.
- Improvement recommendations: Keep availability language target-based and collect production-like probe rollups when environments exist.
- Fixability: V1-fixable for staging/pilot evidence; enterprise SLA proof is later.

### Customer Self-Sufficiency

- Score: 73
- Weight: 1
- Weighted contribution: 0.61%
- Weighted deficiency signal: 0.23%
- Justification: Docs, CLI commands, config checks, proof-packet commands, and troubleshooting are strong. Self-sufficiency is constrained by product complexity and the need for founder/sales-engineer interpretation in production-like pilots.
- Tradeoffs: Guided adoption is more reliable now than self-serve autonomy.
- Improvement recommendations: Make CLI and UI blockers prescriptive enough that an operator can fix the next issue without reading five docs.
- Fixability: V1-fixable for controlled pilots.

### Auditability

- Score: 87
- Weight: 2
- Weighted contribution: 1.46%
- Weighted deficiency signal: 0.22%
- Justification: Append-only audit, typed events, CSV export, audit search, durable governance audit, and procurement narratives are strong. The remaining risk is coverage drift as new routes and integrations are added.
- Tradeoffs: Audit breadth increases maintenance cost.
- Improvement recommendations: Keep route and audit matrices synchronized with new mutating surfaces.
- Fixability: V1-fixable.

### Extensibility

- Score: 76
- Weight: 1
- Weighted contribution: 0.64%
- Weighted deficiency signal: 0.20%
- Justification: Custom handler documentation, templates, REST/CLI surfaces, and modular agent handlers support extension. Public SDK/marketplace/MCP are not V1 headline gates. Extensibility is still mostly contributor-grade, not self-serve ecosystem-grade.
- Tradeoffs: Keeping extension in-code avoids premature platform commitments.
- Improvement recommendations: Improve pattern-level docs and tests for custom handlers without inventing a public plugin platform.
- Fixability: V1-fixable for docs; ecosystem surfaces deferred.

### Deployability

- Score: 77
- Weight: 1
- Weighted contribution: 0.65%
- Weighted deficiency signal: 0.19%
- Justification: Containers, Docker Compose, Terraform modules, health checks, SQL migrations, and config checks are present. The gap is a single, buyer-safe production-like deployment evidence path that proves secrets, auth, telemetry, Search, and SQL are wired.
- Tradeoffs: Deployment flexibility creates many valid configurations.
- Improvement recommendations: Add a canonical minimal Azure pilot deployment proof fixture and release checklist artifact.
- Fixability: V1-fixable.

### Manageability

- Score: 78
- Weight: 1
- Weighted contribution: 0.66%
- Weighted deficiency signal: 0.18%
- Justification: Configuration catalog, config-summary APIs, lint, support bundles, health, budgets, and operational runbooks are strong. The gap is reducing the number of manual choices in production-like setup.
- Tradeoffs: Explicit configuration supports enterprise control but slows operators.
- Improvement recommendations: Add opinionated profiles and live status output for each profile.
- Fixability: V1-fixable.

### Cost-Effectiveness

- Score: 78
- Weight: 1
- Weighted contribution: 0.66%
- Weighted deficiency signal: 0.18%
- Justification: Simulator mode, LLM budgets, cost estimation, monthly caps, Azure Retail price evidence, and pricing philosophy are good. Invoice-accurate COGS is explicitly not promised. The risk is real-mode cost variance under richer cohorts.
- Tradeoffs: Strong caps may reject runs that would otherwise produce value.
- Improvement recommendations: Add real cohort cost rollups and show cost bands in proof evidence.
- Fixability: V1-fixable.

### Testability

- Score: 80
- Weight: 1
- Weighted contribution: 0.67%
- Weighted deficiency signal: 0.17%
- Justification: The repo has many focused tests, SQL contract tests, solution filters, coverage gates, UI tests, and CI workflows. Testability is held back by expensive integration dependencies and optional real-LLM tests.
- Tradeoffs: Deterministic CI is cheaper; live AI proof is harder to automate.
- Improvement recommendations: Keep deterministic gates for PRs and add credentialed real-mode release evidence.
- Fixability: V1-fixable.

### Supportability

- Score: 82
- Weight: 1
- Weighted contribution: 0.69%
- Weighted deficiency signal: 0.15%
- Justification: Correlation IDs, support bundles, diagnostics, troubleshooting runbooks, config lint, and proof artifacts are strong. The gap is converting raw diagnostics into a short support diagnosis for first-pilot failures.
- Tradeoffs: Rich bundles help engineers but may overwhelm customer operators.
- Improvement recommendations: Add first-failure summarization to support bundles and proof command centers.
- Fixability: V1-fixable.

### Template and Accelerator Richness

- Score: 84
- Weight: 1
- Weighted contribution: 0.71%
- Weighted deficiency signal: 0.13%
- Justification: Azure SaaS, AI governance, healthcare claims, policy packs, demo proof packets, and buyer-job pages provide strong accelerators. The weakness is not quantity; it is making the first one unmistakably canonical.
- Tradeoffs: More templates can dilute the first-pilot story.
- Improvement recommendations: Keep specialty accelerators secondary until after the first committed review.
- Fixability: V1-fixable.

### Documentation

- Score: 88
- Weight: 1
- Weighted contribution: 0.74%
- Weighted deficiency signal: 0.10%
- Justification: Documentation is extensive, routed, and generally honest. The main problem is not absence; it is volume, occasional staleness, and conflicting scope wording across trust docs.
- Tradeoffs: Documentation depth supports enterprise review but can create buyer and contributor cognitive load.
- Improvement recommendations: Add consistency checks for scope, assurance, and first-pilot links.
- Fixability: V1-fixable.

## 4. Top 12 Most Important Weaknesses

1. Real-mode proof is too narrow to support broad AI quality claims.
2. Several important quality signals are optional, warn-only, or not release-blocking when they matter commercially.
3. The first-pilot journey is documented but still operationally complex.
4. The product story is strong but too easy to over-explain.
5. ROI claims are source-labeled but not yet backed by enough real pilot repetitions.
6. Trust-center and scope wording can drift, especially around assurance windows.
7. Production-like tenant isolation proof depends on configuration discipline and needs stronger automated evidence.
8. Workflow adoption is still export/handoff-heavy until V1.1 integrations ship.
9. Performance, availability, and scale claims are mostly target/runbook-based rather than measured on representative hosted environments.
10. The UI and docs expose too much internal vocabulary before the user has one committed review.
11. Many safeguards exist in separate scripts, docs, and workflows rather than one undeniable release evidence packet.
12. Commercial readiness is service-led; self-serve conversion remains intentionally immature.

## 5. Top 6 Monetization Blockers

1. Insufficient repeatable real-mode proof packets for buyer-safe sales conversations.
2. Decision path still relies on founder interpretation instead of a short close-ready artifact.
3. ROI source labels exist, but realized buyer outcomes are not yet strong enough for quantified public claims.
4. Self-serve commerce is deferred, so first revenue must come through quote/order-form/service-led motion.
5. Trust caveats are honest but slow procurement-heavy buyers.
6. Market-facing assets are less compelling than the underlying technical proof.

## 6. Top 6 Enterprise Adoption Blockers

1. Security reviewers will ask for assurance artifacts that are procurement-only or deferred, so sales must handle those objections carefully.
2. Production-like configuration is powerful but has many moving parts: auth, SQL, telemetry, Azure AI Search, content safety, budgets, redaction, and billing posture.
3. Tenant isolation and vector-search requirements need automated, demonstrable evidence for every production-like profile.
4. Native work-system embedding is not a V1 promise; buyers needing Jira/ServiceNow/Confluence/Slack/Teams as day-one blockers are V1.1 fits.
5. Operators face high cognitive load before the first committed review.
6. Availability/reliability evidence is not yet production-contract grade.

## 7. Top 6 Engineering Risks

1. Semantic correctness can fail even when JSON shape, merge, and exports all succeed.
2. Quality gates may be configured too softly outside production-like profiles.
3. Documentation and code can diverge across the many proof, trust, and scope artifacts.
4. Cross-surface data consistency can drift between API, generated client, UI, CLI, PDF/DOCX, and proof packet outputs.
5. Production-like retrieval isolation is a high-impact security risk if Azure AI Search filters or config are wrong.
6. Broad workflow surface area increases maintenance burden and makes regressions harder to diagnose.

## 8. Most Important Truth

ArchLucid is ready to run controlled, honest, proof-backed pilots; it is not yet ready to be sold as a broadly self-serve, procurement-frictionless, real-AI enterprise platform without more repeated real-mode evidence.

## 9. Top Improvement Opportunities

### 1. Make Real-Mode Evidence Gating Fail When Configured

- Why it matters: The most important commercial claim is that real AI can produce structured, faithful review evidence. A `continue-on-error` real-LLM workflow weakens that claim.
- Expected impact: Converts real-mode evidence from "nice artifact" into release evidence when credentials are present.
- Affected qualities: AI/Agent Readiness, Cutting-Edge AI Technology, Correctness, Trustworthiness.
- Actionability: Fully actionable now.
- Impact of running the prompt: Directly improves AI/Agent Readiness (+5-8 pts), Correctness (+2-3 pts), Trustworthiness (+3-5 pts). Weighted readiness impact: +0.6-1.0%.

Cursor prompt:

```text
Implement a focused hardening pass for real-mode Azure OpenAI evidence gating.

Scope:
- `.github/workflows/real-llm-golden-cohort.yml`
- `scripts/ci/Invoke-RealLlmGoldenCohort.ps1`
- `scripts/Invoke-RealLlmEvidenceGate.ps1`
- `docs/go-to-market/AI_EVIDENCE_APPENDIX.md`
- `docs/engineering/BUILD.md`
- tests under `scripts/ci/tests/` if script behavior can be unit-tested

Requirements:
- Preserve skip-graceful behavior when no real Azure OpenAI credentials are configured.
- Remove unconditional `continue-on-error` from the real-LLM golden cohort job.
- Make the scripts distinguish:
  1. no credentials configured -> exit 0 with an explicit `SKIPPED_NO_CREDENTIALS` artifact;
  2. credentials configured but live run fails -> non-zero exit;
  3. live run succeeds but quality fields are incomplete -> non-zero exit;
  4. live run succeeds and evidence is complete -> exit 0.
- Update docs so they say exactly what blocks, what skips, and what artifacts are produced.
- Do not add new cloud services or new secrets.
- Do not make PR CI require live credentials.

Acceptance criteria:
- The workflow is no longer globally `continue-on-error`.
- A no-credential run still succeeds and uploads/records skip evidence.
- A configured-but-bad run fails.
- Docs explain how to interpret skip vs failure.
- Existing deterministic CI behavior remains unchanged for pull requests without secrets.
```

### 2. Expand the Faithfulness Golden Cohort to 25 Buyer-Relevant Cases

- Why it matters: Seven cases with one intentional zero-support fixture are too small to support confidence in broad AI output quality.
- Expected impact: Increases confidence that evidence-backed language holds across buyer jobs and ROI scenarios.
- Affected qualities: AI/Agent Readiness, Correctness, Trustworthiness, Explainability.
- Actionability: Fully actionable now.
- Impact of running the prompt: Directly improves AI/Agent Readiness (+4-7 pts), Correctness (+2-4 pts), Explainability (+2-3 pts). Weighted readiness impact: +0.5-0.9%.

Cursor prompt:

```text
Expand the deterministic RAG/agent faithfulness golden cohort from the current small set to at least 25 cases.

Scope:
- `tests/eval-datasets/faithfulness-golden/`
- `scripts/ci/eval_agent_faithfulness.py`
- `scripts/ci/tests/test_eval_agent_faithfulness.py`
- `docs/quality/faithfulness-report.md`
- `docs/go-to-market/AI_EVIDENCE_APPENDIX.md`

Requirements:
- Add cases across at least these categories:
  - Azure SaaS readiness findings
  - AI governance findings
  - healthcare/regulatory policy findings
  - ROI/cost claims with supported and unsupported variants
  - wrong-corpus retrieval
  - missing citation
  - demo-derived versus customer-provided evidence
- Keep fixtures non-sensitive and deterministic.
- Preserve explicit negative cases; do not game the mean by removing hard cases.
- Emit a report with per-category counts and support ratios.
- Keep the default floor conservative and documented.

Acceptance criteria:
- At least 25 cases run deterministically.
- Report includes category rollups.
- Tests cover supported, unsupported, wrong-corpus, and missing-citation behavior.
- `AI_EVIDENCE_APPENDIX.md` explains the expanded evidence without claiming live-model validation.
```

### 3. Enforce Sponsor Claim Source Labels Across Every Export Surface

- Why it matters: Unsupported savings, real-AI, and quality claims are the highest commercial credibility risk.
- Expected impact: Prevents a buyer from seeing a dollar/time/AI claim without source, mode, or caveat.
- Affected qualities: Proof-of-ROI Readiness, Trustworthiness, Correctness, Executive Value Visibility.
- Actionability: Fully actionable now.
- Impact of running the prompt: Directly improves Proof-of-ROI Readiness (+6-9 pts), Trustworthiness (+3-5 pts), Correctness (+2-3 pts). Weighted readiness impact: +0.5-0.8%.

Cursor prompt:

```text
Add a cross-surface sponsor-claim source-label enforcement test.

Scope:
- `ArchLucid.Application/Pilots/FirstValueReportBuilder.cs`
- sponsor PDF/DOCX builders if separate
- `ArchLucid.Cli/Commands/PilotProofPacketCommand.cs`
- `archlucid-ui/src/app/(operator)/reviews/[runId]/_sections/RunDetailPageView.tsx`
- relevant tests in `ArchLucid.Application.Tests`, `ArchLucid.Cli.Tests`, and `archlucid-ui`

Requirements:
- Identify all sponsor-facing fields that can contain:
  - dollar amounts
  - time savings
  - AI execution mode
  - quality-gate disposition
  - demo-derived statements
- Add tests proving each surface includes the required labels:
  - `CustomerProvided`, `BenchmarkAssumption`, `DemoDerived`, `NotEstimated`, or equivalent ROI source label
  - `Real`, `Simulator`, `Fallback`, or `Mixed` execution mode
  - quality disposition where sponsor handoff is possible
- Reuse existing source-label DTOs and formatters.
- Do not invent a parallel vocabulary.

Acceptance criteria:
- A test fails if a sponsor-facing dollar/time claim is emitted without source classification.
- A test fails if sponsor-facing AI output lacks execution-mode labeling.
- Existing generated API clients stay aligned if DTOs change.
```

### 4. Add Production-Like Azure AI Search Tenant Isolation Tests

- Why it matters: Production-like profiles now require Azure AI Search; search/delete filters must be tenant-scoped every time.
- Expected impact: Reduces the highest-impact data isolation risk in production-like hosted pilots.
- Affected qualities: Security, Data Consistency, Trustworthiness, Azure Compatibility.
- Actionability: Fully actionable now.
- Impact of running the prompt: Directly improves Security (+4-6 pts), Trustworthiness (+2-4 pts), Azure Compatibility (+2-4 pts). Weighted readiness impact: +0.3-0.5%.

Cursor prompt:

```text
Add tenant isolation tests and config-lint coverage for production-like Azure AI Search retrieval.

Scope:
- retrieval Azure Search implementation classes
- `ArchLucid.Core/Hosting/*ConfigurationLint*`
- `ArchLucid.Core.Tests/Hosting/*`
- `ArchLucid.Retrieval.Tests/` if available
- `docs/library/CONFIGURATION_REFERENCE.md`

Requirements:
- Add tests proving every Azure Search query/delete path includes tenant/workspace/project scope filters as applicable.
- Add tests proving production-like config blocks `Retrieval:VectorIndex=InMemory`.
- Add tests proving production-like config blocks missing `Retrieval:AzureSearch:Endpoint`.
- Prefer test doubles over live Azure Search.
- Do not add live cloud test dependencies.

Acceptance criteria:
- Production-like config lint emits stable blocking IDs for missing Azure AI Search posture.
- Retrieval tests fail if a query path omits tenant isolation filters.
- Docs match the exact blocking IDs and required keys.
```

### 5. Build a Proof-Density Rollup for Real Pilot Runs

- Why it matters: The product needs a measurable "proof factory" signal before broad sales claims.
- Expected impact: Gives the owner a simple PASS/HOLD view over repeated real runs.
- Affected qualities: Marketability, Proof-of-ROI Readiness, AI/Agent Readiness, Decision Velocity.
- Actionability: Fully actionable now for the tracker; actual pilot data comes later.
- Impact of running the prompt: Directly improves Marketability (+3-5 pts), Proof-of-ROI Readiness (+3-5 pts), Decision Velocity (+2-4 pts). Weighted readiness impact: +0.3-0.6%.

Cursor prompt:

```text
Create a repo-local proof-density rollup artifact for real pilot runs.

Scope:
- `scripts/collect-first-pilot-proof.ps1`
- `ArchLucid.Cli/Commands/PilotProofPacketCommand.cs`
- `docs/runbooks/FIRST_PILOT_OPERATOR_PATH.md`
- `docs/go-to-market/GTM_BACKLOG.md`
- tests in `ArchLucid.Cli.Tests` and script tests if present

Requirements:
- Define a small JSON schema for a proof-density record:
  - runId
  - committed manifest id/version
  - execution mode
  - quality disposition
  - ROI basis status
  - redaction status
  - data consistency status
  - proof packet generated yes/no
  - sponsor handoff disposition
- Add a command or script mode that appends or aggregates these records into a Markdown + JSON rollup.
- Mark the rollup PASS only when the configured minimum number of distinct real runs pass all required gates.
- Do not require any customer names or sensitive data.

Acceptance criteria:
- The rollup can be generated from local proof artifacts without live service calls.
- The Markdown clearly shows PASS/HOLD per gate.
- Docs explain how this supports sales-stage expansion without becoming a public claim by itself.
```

### 6. Normalize Trust-Center Deferred-Scope Wording

- Why it matters: Conflicting V1.1/V2 language around third-party pen testing can confuse procurement and future assessments.
- Expected impact: Prevents accidental overpromising or underscoring in security narratives.
- Affected qualities: Procurement Readiness, Compliance Readiness, Trustworthiness, Documentation.
- Actionability: Fully actionable now.
- Impact of running the prompt: Directly improves Procurement Readiness (+3-5 pts), Compliance Readiness (+2-4 pts), Documentation (+2 pts). Weighted readiness impact: +0.2-0.4%.

Cursor prompt:

```text
Align trust-center and assurance wording with the current scope rules.

Scope:
- `docs/go-to-market/TRUST_CENTER.md`
- `docs/go-to-market/ASSURANCE_STATUS_CANONICAL.md`
- `docs/go-to-market/WHAT_NOT_TO_PROMISE.md`
- `docs/library/V1_SCOPE.md`
- `docs/library/V1_DEFERRED.md`
- `.cursor/rules/V1_1-assurance-backlog.mdc`
- any tests/scripts that lint promise language

Requirements:
- Treat CPA SOC 2 as procurement realism only, not an `(A)` headline defect.
- Treat third-party pen-test program as V1.1 backlog TB-136 where the newest scope files say so.
- Preserve the statement that V1 relies on owner-conducted penetration-style testing and templates.
- Do not create implementation prompts for SOC 2 CPA or third-party pen test.
- Add or update a lightweight doc consistency check if an existing promise-language checker can be extended.

Acceptance criteria:
- No buyer-facing trust doc says a third-party pen test is both V2 and V1.1 without explanation.
- Assurance wording matches `Assessment-Scope-V1_1.mdc`.
- Tests or scripts catch future drift for SOC 2 / third-party pen-test wording.
```

### 7. Turn Procurement Pack Strictness Into Release Evidence

- Why it matters: The procurement pack is the enterprise artifact buyers will actually forward.
- Expected impact: Reduces embarrassing stale placeholders, unsafe stubs, and missing evidence files.
- Affected qualities: Procurement Readiness, Trustworthiness, Supportability, Documentation.
- Actionability: Fully actionable now.
- Impact of running the prompt: Directly improves Procurement Readiness (+4-6 pts), Trustworthiness (+2-3 pts). Weighted readiness impact: +0.2-0.4%.

Cursor prompt:

```text
Make procurement-pack strict validation a release-readiness artifact.

Scope:
- `scripts/build_procurement_pack.py`
- `scripts/procurement_pack_canonical.json`
- `.github/workflows/ci.yml`
- `docs/go-to-market/TRUST_CENTER.md`
- `docs/go-to-market/HOW_TO_REQUEST_PROCUREMENT_PACK.md`
- script tests under `scripts/ci/tests/`

Requirements:
- Keep normal PR checks reasonable.
- Add a release or workflow-dispatch path that runs procurement pack build in strict mode.
- Ensure strict mode fails on buyer-unsafe placeholders in Evidence and Self-assessment files.
- Upload the manifest, redaction report, and versions file as artifacts.
- Do not include buyer-specific names or secrets.

Acceptance criteria:
- Strict build can be run locally and in CI.
- Failure messages identify the exact source file and marker.
- Docs explain when strict mode is required before sending a buyer pack.
```

### 8. Add a First-Pilot Live Readiness Status Object

- Why it matters: Operators need one status, not a web of runbooks.
- Expected impact: Lowers cognitive load and adoption friction.
- Affected qualities: Usability, Adoption Friction, Customer Self-Sufficiency, Supportability.
- Actionability: Fully actionable now.
- Impact of running the prompt: Directly improves Usability (+5-8 pts), Adoption Friction (+3-5 pts), Cognitive Load (+6-10 pts). Weighted readiness impact: +0.4-0.7%.

Cursor prompt:

```text
Create a single first-pilot readiness status object shared by CLI and UI.

Scope:
- `ArchLucid.Cli/Commands/*`
- `ArchLucid.Contracts/Pilots/` or an existing pilot DTO location
- `archlucid-ui/src/components/operator-home/PilotStartHereStrip.tsx`
- `archlucid-ui/src/app/(operator)/_sections/OperatorHomePageView.tsx`
- `docs/runbooks/FIRST_PILOT_OPERATOR_PATH.md`
- tests in `ArchLucid.Cli.Tests` and `archlucid-ui`

Requirements:
- Reuse existing proof/check outputs where possible.
- Status rows should use existing vocabulary: READY, WARN, HOLD, DEFERRED, NEXT ACTION.
- Include at minimum:
  - platform/config readiness
  - evidence readiness
  - committed review presence
  - sponsor packet readiness
  - data consistency status
  - quality/AI readiness status
- UI should show one primary next action and secondary links.
- Do not create a competing checklist.

Acceptance criteria:
- CLI can emit JSON for the readiness status.
- Operator Home renders the same conceptual status.
- Tests cover READY/WARN/HOLD mapping.
- Docs continue pointing to `FIRST_PILOT_OPERATOR_PATH.md` as canonical depth.
```

### 9. Add Cross-Surface Run Detail Contract Tests

- Why it matters: Run detail is the anchor for sponsor proof, governance alerts, ROI, and UI confidence.
- Expected impact: Prevents API/UI/export drift around the most commercially important review fields.
- Affected qualities: Correctness, Data Consistency, Usability, Traceability.
- Actionability: Fully actionable now.
- Impact of running the prompt: Directly improves Correctness (+2-4 pts), Data Consistency (+3-5 pts), Traceability (+2 pts). Weighted readiness impact: +0.3-0.5%.

Cursor prompt:

```text
Add cross-surface contract tests for review/run detail fields used in sponsor handoff.

Scope:
- `ArchLucid.Core/Persistence/ApplicationPorts/Queries/RunDetailDto.cs`
- `ArchLucid.Api/Controllers/Authority/AuthorityQueryController.cs`
- generated client update path if OpenAPI changes
- `archlucid-ui/src/types/authority.ts`
- `archlucid-ui/src/app/(operator)/reviews/[runId]/_sections/RunDetailPageView.tsx`
- backend and UI tests

Requirements:
- Identify sponsor-critical fields:
  - execution mode / fallback state
  - quality gate disposition
  - governance warnings / last failure reason
  - ROI basis fields
  - LLM cost/token fields
  - manifest/artifact status
- Add tests that fail when backend fields are not exposed through OpenAPI/generated client/UI type usage.
- Do not add parallel UI-only DTOs if generated types can be reused.

Acceptance criteria:
- Backend API tests prove fields are serialized.
- UI tests prove key warnings/statuses render.
- OpenAPI/client generation remains deterministic.
```

### 10. Add Claim-Language Linting for Buyer-Facing Docs

- Why it matters: The repo has many docs; accidental "guaranteed savings" or "certified" language is high-risk.
- Expected impact: Keeps GTM copy aligned with proof and deferred scope.
- Affected qualities: Marketability, Trustworthiness, Compliance Readiness, Documentation.
- Actionability: Fully actionable now.
- Impact of running the prompt: Directly improves Trustworthiness (+2-4 pts), Marketability (+2-3 pts), Documentation (+2 pts). Weighted readiness impact: +0.2-0.4%.

Cursor prompt:

```text
Extend buyer-facing claim-language linting.

Scope:
- `scripts/ci/check_proof_summary_promise_language.py`
- `scripts/ci/tests/test_check_proof_summary_promise_language.py`
- buyer-facing docs under `docs/go-to-market/`, `docs/runbooks/`, and marketing UI copy if included by existing script patterns

Requirements:
- Detect unsafe claims including:
  - SOC 2 certified / Type II issued
  - independent pen test available
  - guaranteed savings
  - invoice-accurate COGS
  - Marketplace available today
  - native V1 Jira/Teams/Slack/ServiceNow/Confluence
  - active/active SLA
- Allow safe wording from `WHAT_NOT_TO_PROMISE.md`.
- Keep false positives low by using phrase lists and path allowlists.
- Do not block internal backlog files unless they are buyer-facing.

Acceptance criteria:
- Unit tests cover unsafe and safe variants.
- CI has a clear step name and failure message.
- The script explains the safe replacement wording.
```

### 11. Add Retrieval Corpus-Kind Quality Gates

- Why it matters: Retrieval quality is now central to faithfulness, policy pack value, and proof integrity.
- Expected impact: Makes RAG quality measurable by corpus class instead of one blended average.
- Affected qualities: AI/Agent Readiness, Cutting-Edge AI Technology, Correctness, Explainability.
- Actionability: Fully actionable now.
- Impact of running the prompt: Directly improves AI/Agent Readiness (+3-5 pts), Cutting-Edge AI Technology (+2-4 pts), Correctness (+2 pts). Weighted readiness impact: +0.4-0.7%.

Cursor prompt:

```text
Add retrieval quality gates segmented by corpus kind.

Scope:
- `ArchLucid.Retrieval/`
- `ArchLucid.Retrieval.Tests/`
- `scripts/ci/eval_retrieval_ir.py`
- retrieval fixture datasets under `tests/`
- `docs/library/RAG_QUALITY_TECHNICAL_BACKLOG.md`
- `docs/go-to-market/AI_EVIDENCE_APPENDIX.md`

Requirements:
- Segment retrieval evaluation by corpus kind, such as policy pack, uploaded evidence, manifest/review, platform docs, and pricing/cost sources where supported.
- Emit recall/MRR by corpus kind.
- Fail or warn per corpus kind rather than only on a blended score.
- Keep test fixtures non-sensitive.
- Do not add a new vector database.

Acceptance criteria:
- Reports show per-corpus metrics.
- Tests prove wrong-corpus retrieval is detected.
- Docs explain which corpus kinds are currently covered and which are future scope.
```

### 12. Add First-Pilot Performance Budget Smoke

- Why it matters: Time-to-value depends on proof generation staying fast enough under realistic pilot data.
- Expected impact: Gives a concrete performance floor without overbuilding load tests.
- Affected qualities: Time-to-Value, Performance, Reliability, Supportability.
- Actionability: Fully actionable now.
- Impact of running the prompt: Directly improves Performance (+5-8 pts), Time-to-Value (+1-2 pts), Supportability (+1-2 pts). Weighted readiness impact: +0.1-0.3%.

Cursor prompt:

```text
Add a lightweight first-pilot performance budget smoke test.

Scope:
- `scripts/collect-first-pilot-proof.ps1`
- `ArchLucid.Cli/Commands/PilotProofPacketCommand.cs`
- `ArchLucid.Application/Roi/ExecutiveRoiSummaryService.cs`
- tests in `ArchLucid.Cli.Tests` and `ArchLucid.Application.Tests`
- `docs/runbooks/FIRST_VALUE_20_MINUTES.md`

Requirements:
- Measure or assert elapsed time for:
  - proof packet generation from fixture data
  - executive ROI summary over a representative multi-system fixture
  - first-pilot command center generation
- Use deterministic local fixtures; no live cloud dependency.
- Set conservative budgets and clear failure messages.
- If timing tests are too flaky for CI, emit a structured perf artifact and keep hard assertions around algorithmic caps.

Acceptance criteria:
- A local command produces elapsed-time metrics.
- Tests cover cap behavior where deterministic.
- Docs say this is a smoke budget, not a production SLA.
```

### 13. Add Support Bundle First-Failure Summaries

- Why it matters: First pilots will fail; the product needs to tell the operator what failed first and what to do next.
- Expected impact: Improves rescue speed and customer self-sufficiency.
- Affected qualities: Supportability, Reliability, Adoption Friction, Customer Self-Sufficiency.
- Actionability: Fully actionable now.
- Impact of running the prompt: Directly improves Supportability (+4-6 pts), Adoption Friction (+2-3 pts), Reliability (+2 pts). Weighted readiness impact: +0.2-0.4%.

Cursor prompt:

```text
Add first-failure summaries to support bundles and pilot proof command centers.

Scope:
- `ArchLucid.Cli/Support/SupportBundleTriageIndexBuilder.cs`
- `ArchLucid.Cli/Support/SupportBundleTriageIndexDocument.cs`
- `ArchLucid.Cli/Commands/SupportBundleCommand.cs`
- `scripts/collect-first-pilot-proof.ps1`
- `docs/runbooks/FIRST_PILOT_SUPPORT_TRIAGE.md`
- `ArchLucid.Cli.Tests`

Requirements:
- Summarize the first blocking failure by phase:
  - platform/config
  - auth
  - SQL/migrations
  - evidence ingest
  - execute/quality gate
  - commit
  - export/proof packet
- Include correlation id/run id when available.
- Include one next action and one doc link.
- Do not include secrets or raw connection strings.

Acceptance criteria:
- Support bundle output includes a concise first-failure section.
- Tests verify redaction and next-action mapping.
- Existing support bundle manifest format remains backward-compatible unless versioned.
```

### 14. Add Production-Like IaC/Config Evidence Fixture

- Why it matters: Azure readiness is strong in docs, but buyers and operators need one concrete proof artifact.
- Expected impact: Reduces deployment uncertainty and procurement friction for hosted pilots.
- Affected qualities: Azure Compatibility, Deployability, Manageability, Security.
- Actionability: Fully actionable now.
- Impact of running the prompt: Directly improves Azure Compatibility (+3-5 pts), Deployability (+3-5 pts), Manageability (+2-3 pts). Weighted readiness impact: +0.2-0.4%.

Cursor prompt:

```text
Create a production-like Azure pilot readiness evidence fixture.

Scope:
- `infra/terraform-*`
- `scripts/ci/`
- `docs/runbooks/MINIMAL_AZURE_PILOT_DEPLOYMENT.md`
- `docs/library/IAC_RUNTIME_PARITY.md`
- `docs/library/CONFIGURATION_REFERENCE.md`

Requirements:
- Define a sanitized fixture showing the expected production-like evidence:
  - Terraform validate/plan summary
  - private endpoint/WAF posture where applicable
  - SQL/Blob/Key Vault/Search resources represented
  - config-lint production-like profile output
  - telemetry exporter configured or explicitly held
- No secrets, subscription IDs, or tenant-identifying values.
- Add a CI/script check that the fixture schema stays valid.
- Do not require live Azure deployment.

Acceptance criteria:
- A reviewer can inspect one Markdown/JSON fixture to understand production-like readiness.
- The fixture is generated or validated by a script.
- Docs link the fixture from the minimal deployment runbook.
```

### 15. Extend IDOR and Scope Tests Across Read Endpoints

- Why it matters: Tenant isolation must be provable beyond one route family.
- Expected impact: Broadens security confidence for enterprise reviewers.
- Affected qualities: Security, Trustworthiness, Correctness, Data Consistency.
- Actionability: Fully actionable now.
- Impact of running the prompt: Directly improves Security (+3-5 pts), Trustworthiness (+2-3 pts). Weighted readiness impact: +0.2-0.4%.

Cursor prompt:

```text
Extend scoped-read IDOR integration coverage across the highest-value read endpoints.

Scope:
- `ArchLucid.Api.Tests/Security/`
- authority/run detail controllers
- manifest/artifact/audit/ROI/proof endpoints
- existing test support for tenant/workspace/project scope

Requirements:
- Build a route matrix for read endpoints that return tenant-scoped data.
- Add integration tests for at least:
  - run detail
  - manifest summary
  - artifacts list/download metadata
  - executive ROI summary
  - audit slice/search where feasible
- Use existing API factory and scope helpers.
- Do not weaken existing auth bypass safeguards.

Acceptance criteria:
- Tests fail when a tenant can read another tenant's data.
- Matrix documents covered and intentionally excluded routes.
- New helpers are reusable and do not duplicate setup excessively.
```

### 16. Make Executive ROI Basis More Visibly Conservative

- Why it matters: Executive dashboards can accidentally look more certain than the underlying data.
- Expected impact: Improves sponsor confidence without overstating ROI.
- Affected qualities: Executive Value Visibility, Proof-of-ROI Readiness, Trustworthiness.
- Actionability: Fully actionable now.
- Impact of running the prompt: Directly improves Executive Value Visibility (+2-4 pts), Proof-of-ROI Readiness (+2-4 pts). Weighted readiness impact: +0.2-0.3%.

Cursor prompt:

```text
Tighten executive ROI basis visibility across API and UI.

Scope:
- `ArchLucid.Application/Roi/ExecutiveRoiSummaryService.cs`
- `ArchLucid.Contracts/Roi/`
- `archlucid-ui/src/app/(operator)/dashboard/_sections/ExecutiveRoiDashboardLiveKpiCards.tsx`
- `archlucid-ui/src/app/(operator)/dashboard/_sections/ExecutiveOrphanCandidatesCard.tsx`
- backend and UI tests

Requirements:
- Ensure every executive ROI total is visibly split into:
  - customer-provided / strong basis
  - benchmark assumption / needs evidence
  - not estimated
- Add stale-cost-evidence labeling where cost data drives the number.
- Keep realized value separate from estimated savings.
- Do not change underlying ROI math unless tests reveal a bug.

Acceptance criteria:
- API response exposes enough basis fields for UI rendering.
- UI cards display conservative labels without hiding the headline.
- Tests cover mixed-basis portfolios.
```

### 17. Add a Single "Send to Sponsor" Close-Ready Artifact

- Why it matters: Decision velocity depends on one artifact a founder can send, not a directory tree.
- Expected impact: Compresses the handoff from technical proof into a commercial next step.
- Affected qualities: Decision Velocity, Marketability, Commercial Packaging Readiness, Executive Value Visibility.
- Actionability: Fully actionable now.
- Impact of running the prompt: Directly improves Decision Velocity (+5-8 pts), Marketability (+2-4 pts), Commercial Packaging Readiness (+2-4 pts). Weighted readiness impact: +0.3-0.5%.

Cursor prompt:

```text
Create a close-ready sponsor handoff artifact generated from an existing proof packet.

Scope:
- `ArchLucid.Cli/Commands/PilotProofPacketCommand.cs`
- `ArchLucid.Cli/Commands/PilotProofPacketRoiArtifacts.cs`
- `docs/go-to-market/COMMERCIAL_DECISION_PACKET.md`
- `docs/go-to-market/QUOTE_TO_PROOF_PACKET.md`
- `ArchLucid.Cli.Tests`

Requirements:
- Generate a concise `sponsor-send.md` or equivalent with:
  - PASS/WARN/HOLD status
  - review id / manifest id
  - evidence source and execution mode
  - ROI basis
  - top 3 findings
  - explicit limitations
  - recommended next commercial action
- Reuse existing proof fields and source labels.
- Do not add new claims or customer names.

Acceptance criteria:
- Artifact is generated by the proof-packet command.
- HOLD status prevents "send" wording and says what to fix.
- Tests cover PASS and HOLD variants.
```

### 18. Add Workflow Handoff Quality Tests for GitHub/Azure DevOps

- Why it matters: V1 workflow embeddedness depends on excellent CI/PR handoff while first-party connectors are V1.1.
- Expected impact: Makes V1 integration story stronger without scope creep.
- Affected qualities: Workflow Embeddedness, Interoperability, Stickiness.
- Actionability: Fully actionable now.
- Impact of running the prompt: Directly improves Workflow Embeddedness (+3-5 pts), Interoperability (+2-3 pts), Stickiness (+1-2 pts). Weighted readiness impact: +0.2-0.4%.

Cursor prompt:

```text
Strengthen GitHub and Azure DevOps proof handoff tests.

Scope:
- `docs/runbooks/V1_WORKFLOW_HANDOFF_GITHUB_AZDO.md`
- `integrations/azure-devops-task-*`
- GitHub Action examples under `.github/` or docs
- Node tests under `integrations/`
- related script tests

Requirements:
- Verify that generated PR/work-item comments include:
  - review/run id
  - manifest id/version
  - sponsor proof link or artifact reference
  - execution mode
  - quality disposition
  - limitations/deferred scope when relevant
- Keep V1 wording to REST/CLI/UI/CI handoff; do not imply native V1 Jira/ServiceNow/Teams.

Acceptance criteria:
- Fixture tests fail if key proof fields disappear from handoff comments.
- Docs include one copy-paste GitHub and one Azure DevOps example.
```

### 19. Add Release Evidence Index Generation

- Why it matters: The release story is scattered across CI artifacts, proof outputs, docs, and scripts.
- Expected impact: Gives reviewers one current evidence map for what passed and what is deferred.
- Affected qualities: Correctness, Testability, Procurement Readiness, Supportability.
- Actionability: Fully actionable now.
- Impact of running the prompt: Directly improves Testability (+3-5 pts), Procurement Readiness (+2-3 pts), Supportability (+2 pts). Weighted readiness impact: +0.2-0.3%.

Cursor prompt:

```text
Generate a release evidence index from existing CI/proof artifacts.

Scope:
- `scripts/ci/`
- `.github/workflows/ci.yml`
- `docs/engineering/BUILD.md`
- `docs/library/V1_RELEASE_CHECKLIST.md`
- `docs/quality/`

Requirements:
- Create a script that writes Markdown and JSON listing:
  - build/test/coverage status inputs
  - OpenAPI/client drift status
  - route/tier/policy/nav parity
  - agent quality/faithfulness report paths
  - procurement pack strict status when available
  - real-LLM evidence status: pass/fail/skipped
  - explicitly deferred non-gates
- The script should not require live services.
- Do not duplicate generated artifacts; link or record paths/hashes.

Acceptance criteria:
- A reviewer can inspect one release-evidence Markdown file.
- JSON is machine-readable for future CI use.
- Docs explain which rows are release-blocking versus informational.
```

### 20. Improve In-Product Deferred-Scope Display

- Why it matters: Buyers ask for V1.1/V2 items during pilots; operators need safe answers at the point of confusion.
- Expected impact: Reduces overpromising and support load.
- Affected qualities: Usability, Trustworthiness, Adoption Friction, Commercial Packaging Readiness.
- Actionability: Fully actionable now.
- Impact of running the prompt: Directly improves Usability (+2-4 pts), Trustworthiness (+2-3 pts), Adoption Friction (+1-2 pts). Weighted readiness impact: +0.2-0.3%.

Cursor prompt:

```text
Surface deferred-scope guidance in operator proof and review contexts.

Scope:
- `archlucid-ui/src/components/OperatorApiProblem.tsx`
- review detail and proof-packet UI components
- `ArchLucid.Application/Pilots/FirstValueReportBuilder.cs`
- `docs/go-to-market/WHAT_NOT_TO_PROMISE.md`
- UI and application tests

Requirements:
- Reuse existing deferred-scope vocabulary.
- When a buyer requirement is outside V1, show:
  - DEFERRED_SCOPE disposition
  - safe wording
  - link to the relevant scope doc
- Do not present deferred items as defects in the current proof.
- Keep the UI compact.

Acceptance criteria:
- Tests cover at least SOC 2 CPA, third-party pen test, native Jira/ServiceNow, MCP, and live commerce wording.
- Sponsor-facing exports do not imply the deferred item is implemented.
```

### 21. Add Real-Mode Cost Evidence Rollup

- Why it matters: Cost-effectiveness is credible only if real-mode runs have token and estimated dollar evidence.
- Expected impact: Helps price pilots and avoid unexpected hosted AOAI spend.
- Affected qualities: Cost-Effectiveness, AI/Agent Readiness, Manageability.
- Actionability: Fully actionable now.
- Impact of running the prompt: Directly improves Cost-Effectiveness (+3-5 pts), Manageability (+1-2 pts), AI/Agent Readiness (+1-2 pts). Weighted readiness impact: +0.1-0.3%.

Cursor prompt:

```text
Add a real-mode LLM cost evidence rollup.

Scope:
- `ArchLucid.AgentRuntime/`
- `ArchLucid.Cli/Commands/`
- `docs/runbooks/LLM_COST_ESTIMATION.md`
- `docs/quality/REAL_LLM_RUN_EVIDENCE_TEMPLATE.md`
- tests in `ArchLucid.AgentRuntime.Tests` and `ArchLucid.Cli.Tests`

Requirements:
- Summarize per-run:
  - prompt tokens
  - completion tokens
  - estimated USD input/output/total
  - budget disposition
  - model/deployment
  - execution mode
- Support reading from existing metrics/export JSON where available.
- Label values as estimates, not invoice-accurate costs.

Acceptance criteria:
- CLI summary exits non-zero when required fields are missing for real-mode evidence.
- Docs warn that cost is estimate-based.
- Tests cover complete and incomplete evidence.
```

### 22. Add Golden Fixture for Staged Critic Behavior

- Why it matters: The staged critic path is a differentiator, but it must be bounded and explainable.
- Expected impact: Reduces risk that critic behavior silently changes or becomes unbounded.
- Affected qualities: AI/Agent Readiness, Correctness, Explainability, Cost-Effectiveness.
- Actionability: Fully actionable now.
- Impact of running the prompt: Directly improves AI/Agent Readiness (+2-3 pts), Correctness (+1-2 pts), Explainability (+1-2 pts). Weighted readiness impact: +0.2-0.4%.

Cursor prompt:

```text
Add deterministic tests and docs for staged critic behavior in the real agent executor.

Scope:
- `ArchLucid.AgentRuntime/RealAgentExecutor.cs`
- staged critic option classes
- `ArchLucid.AgentRuntime.Tests/`
- `docs/library/AGENT_OUTPUT_EVALUATION.md`

Requirements:
- Test that non-Critic agents run first when staged critic is enabled.
- Test that the critic receives only the bounded summary note, not unbounded raw results.
- Test max claim/finding/character limits.
- Test behavior when critic times out or fails according to configured options.
- Do not call a live LLM.

Acceptance criteria:
- Tests fail if summary bounds are ignored.
- Docs explain staged critic limits and cost implications.
```

### 23. Add UI Cognitive-Load Snapshot Tests for the First Review Path

- Why it matters: The first user experience must feel like one path, not a control panel.
- Expected impact: Keeps the UI from regressing into too many primary actions before value is delivered.
- Affected qualities: Usability, Cognitive Load, Time-to-Value.
- Actionability: Fully actionable now.
- Impact of running the prompt: Directly improves Cognitive Load (+4-7 pts), Usability (+2-4 pts), Time-to-Value (+1-2 pts). Weighted readiness impact: +0.2-0.4%.

Cursor prompt:

```text
Add UI tests that protect the first-review progressive disclosure path.

Scope:
- `archlucid-ui/src/components/operator-home/PilotStartHereStrip.tsx`
- `archlucid-ui/src/app/(operator)/_sections/OperatorHomePageView.tsx`
- review detail page sections
- `archlucid-ui/src/app/(operator)/**/*.test.tsx`

Requirements:
- Test that before a committed review, the UI highlights one primary first-pilot path.
- Test that advanced Operate links/connectors/MCP are secondary or hidden according to existing UX rules.
- Test that after commit, the primary action shifts to sponsor proof / next action.
- Keep selectors stable via existing data-testid conventions.
- Do not remove advanced features; only protect disclosure order.

Acceptance criteria:
- Tests fail if more than one primary CTA appears in the first-pilot entry state.
- Tests confirm help links point to canonical runbooks.
```

### 24. DEFERRED Run Three Distinct Real Pilot Proof Packets

- Why it matters: This is the fastest way to move from "technically credible" to "commercially believable."
- Expected impact: Would validate proof packet repeatability, real-mode quality, ROI source integrity, and supportability.
- Affected qualities: Marketability, Proof-of-ROI Readiness, AI/Agent Readiness, Decision Velocity, Trustworthiness.
- Actionability: DEFERRED.
- Reason it is deferred: Meaningful execution requires real pilot scenarios, owner-approved Azure OpenAI credentials/environment, and permission to store or summarize the resulting proof artifacts.
- Specific information needed from you later:
  - Which three pilot scenarios to use.
  - Whether they are internal demos, prospect pilots, or customer data.
  - Which environment/base URL and credential profile to use.
  - Whether outputs may be committed, redacted, or stored only as local artifacts.
- Impact if completed later: Directly improves Marketability (+5-8 pts), Proof-of-ROI Readiness (+5-8 pts), Trustworthiness (+4-6 pts). Weighted readiness impact: +0.7-1.2%.

### 25. DEFERRED Publish / Capture Market-Facing Demo Assets

- Why it matters: The product is easier to understand when prospects can see one polished proof-backed review without reading repo docs.
- Expected impact: Improves top-of-funnel comprehension and founder-led outreach conversion.
- Affected qualities: Marketability, Decision Velocity, Commercial Packaging Readiness, Usability.
- Actionability: DEFERRED.
- Reason it is deferred: Recording, publishing, brand review, and external channel choices require owner input and likely manual capture.
- Specific information needed from you later:
  - Preferred scenario: self-demo, Azure SaaS readiness, AI governance, or healthcare.
  - Whether the asset is public, NDA-only, or internal sales-only.
  - Brand constraints, voiceover preference, and target length.
  - Where the asset should be published or linked.
- Impact if completed later: Directly improves Marketability (+4-7 pts), Decision Velocity (+3-5 pts), Commercial Packaging Readiness (+2-4 pts). Weighted readiness impact: +0.4-0.7%.

## 10. Prompt Batching Guidance

Batch 1 - AI proof and correctness:
- 1. Make Real-Mode Evidence Gating Fail When Configured
- 2. Expand the Faithfulness Golden Cohort to 25 Buyer-Relevant Cases
- 11. Add Retrieval Corpus-Kind Quality Gates
- 22. Add Golden Fixture for Staged Critic Behavior

Batch 2 - Sponsor proof and commercial close:
- 3. Enforce Sponsor Claim Source Labels Across Every Export Surface
- 5. Build a Proof-Density Rollup for Real Pilot Runs
- 16. Make Executive ROI Basis More Visibly Conservative
- 17. Add a Single "Send to Sponsor" Close-Ready Artifact
- 21. Add Real-Mode Cost Evidence Rollup

Batch 3 - Enterprise/security readiness:
- 4. Add Production-Like Azure AI Search Tenant Isolation Tests
- 6. Normalize Trust-Center Deferred-Scope Wording
- 7. Turn Procurement Pack Strictness Into Release Evidence
- 14. Add Production-Like IaC/Config Evidence Fixture
- 15. Extend IDOR and Scope Tests Across Read Endpoints

Batch 4 - Operator usability and supportability:
- 8. Add a First-Pilot Live Readiness Status Object
- 9. Add Cross-Surface Run Detail Contract Tests
- 13. Add Support Bundle First-Failure Summaries
- 20. Improve In-Product Deferred-Scope Display
- 23. Add UI Cognitive-Load Snapshot Tests for the First Review Path

Batch 5 - Workflow and release hygiene:
- 10. Add Claim-Language Linting for Buyer-Facing Docs
- 12. Add First-Pilot Performance Budget Smoke
- 18. Add Workflow Handoff Quality Tests for GitHub/Azure DevOps
- 19. Add Release Evidence Index Generation

Deferred owner/manual batch:
- 24. DEFERRED Run Three Distinct Real Pilot Proof Packets
- 25. DEFERRED Publish / Capture Market-Facing Demo Assets

Recommended order: Batch 1, Batch 2, Batch 3, Batch 4, Batch 5. The first two batches create the proof needed to decide which later improvements matter most. Avoid mixing Batch 1 with UI work unless context budget is large, because AI evidence touches scripts, tests, runtime docs, and CI.

## 11. Pending Questions for Later

### Make Real-Mode Evidence Gating Fail When Configured

- Which GitHub secrets/variables are canonical for the hosted real-LLM cohort?
- Should the scheduled real-LLM cohort notify on failure, or only fail the workflow?

### Build a Proof-Density Rollup for Real Pilot Runs

- What minimum count should unlock stronger sales claims: three runs, five runs, or another threshold?
- Should proof-density records be committed, stored as release artifacts, or kept local/private?

### Production-Like Azure AI Search Tenant Isolation Tests

- Is managed identity the required production authentication path for Azure AI Search, or are API keys acceptable for early hosted pilots?
- Are tenant/workspace/project filters all mandatory for every retrieval path, or are some tenant-only by design?

### Procurement Pack Strictness

- Which procurement pack strict markers are allowed in internal-only drafts?
- Should strict mode become branch-protection required for release branches?

### First-Pilot Live Readiness Status Object

- Should the readiness object be API-backed, CLI-only, or generated by the proof script first?
- What is the exact owner-approved mapping from WARN to sponsor-send allowed versus HOLD?

### Run Three Distinct Real Pilot Proof Packets

- Which scenarios and environments should be used?
- What data may be committed, redacted, or retained locally?

### Publish / Capture Market-Facing Demo Assets

- Which demo scenario is the public flagship?
- Should the first asset be a screenshot set, short video, or guided script?
# ArchLucid Assessment - (A) Headline Readiness: 81.26%

This score represents the `(A)` headline readiness per `Assessment-Scope-V1_1.mdc`, excluding items explicitly deferred to V1.1, V1.x, V2, owner-only commercial action, or `(B)` procurement realism.

**Scoring basis:** post-implementation rescore after executing the top-25 improvement batch (2026-05-29). Prior clean-slate baseline: **79.36%** (`9603 / 121`). Total weight: **121**. Weighted score sum: **9832**. Weighted readiness: **9832 / 121 = 81.26%**.

**Implementation note:** Twenty-four of twenty-five ranked improvements were implemented or materially closed in-repo; **#25 (live commerce un-hold)** remains **DEFERRED** (owner-only, TB-137). See **§9a** for per-item status.

---

## 2. Executive Summary

### `(A)` Overall Headline Readiness

ArchLucid is materially beyond prototype stage and **closer to a repeatable first-pilot motion** after the 2026-05-29 improvement batch: real-LLM JSON rollups, tenant/retrieval boundary proof, starter-pack validation, quote-to-proof readiness JSON, first-pilot home strip, support triage one-pager, IaC parity scan, and OpenAPI run-detail forensics guards. The headline score is still held down by **live AI proof density under credentialed schedules**, **OpenAPI snapshot drift on RunDetailDto forensics fields**, and **workflow embedding** (V1.1 connectors remain out of `(A)` scope).

### `(B)` Procurement / Market-Motion Realism

Rigid enterprise procurement will still ask for CPA-issued SOC 2, third-party pen-test reports, live Marketplace transactability, public references, and deep first-party workflow connectors. Those items are explicitly outside the weighted `(A)` score where the scope docs say so. They remain real buyer friction, but they are market-motion and assurance-program friction rather than current product-readiness deductions.

### Commercial Picture

The commercial story is credible when anchored on a sponsor-safe proof packet: "one architecture review, committed findings, evidence labels, ROI/source classification, and next action." The risk is that the repo contains more product than the first buyer motion can absorb. Revenue depends less on adding features and more on making the first proof packet impossible to misread, fast to produce, and directly tied to quote/follow-up workflow.

### Enterprise Picture

Enterprise foundations are unusually strong for this stage: database-per-tenant posture, SAML/OIDC/SCIM story, append-only audit, policy packs, trust center, no vendor write-role requirement for Azure evidence, support bundles, and procurement pack discipline. Enterprise adoption will still slow on workflow embedding, assurance artifacts, and environment-specific PASS/HOLD evidence.

### Engineering Picture

Engineering quality is high but broad. The repo shows warnings-as-errors, OpenAPI snapshots, SQL Server integration discipline, architecture invariants, RAG/faithfulness harnesses, and explicit backlog hygiene. The most important risks are not lack of code volume; they are correctness and trust closure across tenant scope, retrieval grounding, real-LLM evidence, proof artifact consistency, run-detail operator visibility, and IaC parity.

---

## 3. Weighted Quality Assessment

Qualities are ordered by **weighted deficiency signal**: `(100 - score) x weight`.

### Cutting-Edge AI Technology

- **Score:** 82
- **Weight:** 8
- **Weighted impact on readiness:** 656 / 121
- **Weighted deficiency signal:** 144
- **Justification:** Azure OpenAI, structured agent outputs, RAG infrastructure, faithfulness reports, cost/budget hooks, real-mode smoke evidence, and **machine-readable real-LLM gate JSON** are present. Remaining gap: credentialed golden-cohort schedule density and always-on live proof in normal CI.
- **Tradeoffs:** This restraint improves enterprise safety but makes ArchLucid look less advanced next to generic copilot demos.
- **Improvement recommendations:** Expand the real-LLM golden cohort, strengthen retrieval tenant/filter proof, publish AI evidence rollups, and keep unsupported ROI/cost claims visibly blocked.
- **Disposition:** V1-fixable for evidence and retrieval quality; graph-RAG and agentic retrieval are better suited for V2 unless explicitly promoted.

### Correctness

- **Score:** 86
- **Weight:** 8
- **Weighted impact on readiness:** 688 / 121
- **Weighted deficiency signal:** 112
- **Justification:** Cross-surface proof consistency tests, starter-pack validation, quote-to-proof readiness JSON, run-detail OpenAPI forensics test, and expanded proof collector gates reduce drift. **OpenAPI snapshot still lags live RunDetailDto forensics fields** until regen.
- **Tradeoffs:** Multiple buyer surfaces are valuable, but each new surface multiplies drift risk.
- **Improvement recommendations:** Add cross-surface proof consistency gates, run-detail contract drift tests, and template/proof dry-run validation.
- **Disposition:** V1-fixable.

### AI/Agent Readiness

- **Score:** 85
- **Weight:** 8
- **Weighted impact on readiness:** 680 / 121
- **Weighted deficiency signal:** 120
- **Justification:** Real-LLM gate JSON rollup, allowed-tool dispatch guard, faithfulness harness, and cost accounting are wired. Weakness remains credentialed multi-agent live evidence on a recurring schedule.
- **Tradeoffs:** Deterministic simulator-heavy CI is cheaper and stable, but it cannot prove model behavior under production-like inference.
- **Improvement recommendations:** Turn live evidence into a scheduled optional gate with clear SKIPPED/PASS/HOLD states and attach model/deployment metadata to sponsor artifacts.
- **Disposition:** Partly V1-fixable; live credentials and scheduling require owner environment decisions.

### Stickiness

- **Score:** 77
- **Weight:** 6
- **Weighted impact on readiness:** 462 / 121
- **Weighted deficiency signal:** 138
- **Justification:** Compare, replay, graph, governance, audit, policy packs, ROI rollups, and proof packets create reasons to return after a first review. Stickiness is weaker than feature count suggests because recurring operating rituals are not yet as obvious as the first-review path.
- **Tradeoffs:** A narrow first-value motion is good, but it must evolve into a review cadence without overwhelming buyers.
- **Improvement recommendations:** Make post-commit next actions opinionated: second review, governance dry-run, executive ROI rollup, or proof-to-quote follow-up.
- **Disposition:** V1-fixable for workflow packaging; first-party ITSM/chat embedding is V1.1.

### Marketability

- **Score:** 83
- **Weight:** 8
- **Weighted impact on readiness:** 664 / 121
- **Weighted deficiency signal:** 136
- **Justification:** The wedge is strong: evidence-backed architecture reviews for Azure-heavy, governance-sensitive buyers. The trust center, proof packets, buyer job pages, executive sponsor brief, and commercial decision packet support a real sales-led motion. The product still needs sharper "why this instead of a generic AI assistant" proof in the first 10 minutes.
- **Tradeoffs:** Precise enterprise positioning is less viral than broad AI messaging, but it is more credible.
- **Improvement recommendations:** Lead with proof packet output, one golden accelerator walkthrough, and differentiation evidence tied to live artifacts.
- **Disposition:** V1-fixable.

### Time-to-Value

- **Score:** 85
- **Weight:** 7
- **Weighted impact on readiness:** 595 / 121
- **Weighted deficiency signal:** 105
- **Justification:** Home **First-pilot path** strip, canonical operator path cross-links, 20-minute runbook, and proof PASS/HOLD language in collector reduce first-session friction.
- **Tradeoffs:** Enterprise-grade controls add setup steps that a consumer-style AI tool does not have.
- **Improvement recommendations:** Collapse first-session guidance into one command center and make proof PASS/WARN/HOLD the primary operator language.
- **Disposition:** V1-fixable.

### Adoption Friction

- **Score:** 80
- **Weight:** 6
- **Weighted impact on readiness:** 480 / 121
- **Weighted deficiency signal:** 120
- **Justification:** ArchLucid avoids invasive customer access through Tier 1 Azure extractor ZIPs and supports REST/CLI/UI/SCIM. Still, buyer operators must understand pilot vs operate, evidence source labels, auth modes, and deferred integration boundaries.
- **Tradeoffs:** Low-access posture reduces security objections but shifts work to customer-side evidence collection.
- **Improvement recommendations:** Strengthen preflight, guided evidence collection, and first-pilot command center sequencing.
- **Disposition:** V1-fixable.

### Proof-of-ROI Readiness

- **Score:** 87
- **Weight:** 5
- **Weighted impact on readiness:** 435 / 121
- **Weighted deficiency signal:** 65
- **Justification:** ROI source catalog, cross-surface consistency tests, executive orphan KPIs, and **quote-to-proof-readiness.json** in proof packets strengthen sponsor-safe ROI narrative.
- **Tradeoffs:** Honest ROI labeling may reduce headline numbers, but it increases trust.
- **Improvement recommendations:** Add a cross-surface ROI/proof consistency gate and make weak ROI basis block sponsor-send or force caveats.
- **Disposition:** V1-fixable.

### Differentiability

- **Score:** 80
- **Weight:** 4
- **Weighted impact on readiness:** 320 / 121
- **Weighted deficiency signal:** 80
- **Justification:** ArchLucid differentiates on committed architecture reviews, evidence chains, governance, policy packs, ROI/source labeling, and advisory-only Terraform posture. The differentiation is real but still needs sharper buyer-facing proof against "we can ask ChatGPT/Copilot for this."
- **Tradeoffs:** Deep defensibility is harder to explain quickly.
- **Improvement recommendations:** Make the differentiation proof packet artifact-first: show traceability, commit state, policy outcome, audit evidence, and source labels in one narrative.
- **Disposition:** V1-fixable.

### Workflow Embeddedness

- **Score:** 75
- **Weight:** 3
- **Weighted impact on readiness:** 225 / 121
- **Weighted deficiency signal:** 75
- **Justification:** REST, CLI, UI, SCIM, GitHub/Azure DevOps handoff, exports, and proof bundles are in scope. First-party ITSM/chat/docs connectors are V1.1 and excluded from headline scoring, but the V1 workflow still feels adjacent to daily systems rather than fully inside them.
- **Tradeoffs:** Avoiding premature connector sprawl protects focus.
- **Improvement recommendations:** Improve V1 handoff artifacts and make GitHub/Azure DevOps proof links first-class.
- **Disposition:** V1-fixable for handoff; native connectors are V1.1.

### Executive Value Visibility

- **Score:** 82
- **Weight:** 4
- **Weighted impact on readiness:** 328 / 121
- **Weighted deficiency signal:** 72
- **Justification:** Executive ROI summary, first-value report, sponsor brief, commercial closeout, and quote-to-proof packet exist. The weakness is not missing executive content; it is ensuring every executive view carries the same caveats, source basis, and next commercial action.
- **Tradeoffs:** More caveats reduce punchiness but prevent overclaiming.
- **Improvement recommendations:** Harden executive sponsor proof with one status table: value, source basis, risk, deferred asks, and decision CTA.
- **Disposition:** V1-fixable.

### Usability

- **Score:** 79
- **Weight:** 3
- **Weighted impact on readiness:** 237 / 121
- **Weighted deficiency signal:** 63
- **Justification:** Operator Home, review detail, identity-provider checklist, first-run wizard, and runbooks provide many guided paths. The cognitive issue is density: users can complete tasks, but they may not always know which of many routes is primary.
- **Tradeoffs:** Exposing power-user depth helps operators, but confuses first-time evaluators.
- **Improvement recommendations:** Push progressive disclosure harder and keep one primary CTA per phase.
- **Disposition:** V1-fixable.

### Trustworthiness

- **Score:** 84
- **Weight:** 3
- **Weighted impact on readiness:** 252 / 121
- **Weighted deficiency signal:** 48
- **Justification:** Tenant/retrieval boundary proof artifact, scope binding tests, and retrieval filter tests are now first-pilot proof outputs. CPA SOC 2 and third-party pen test remain out of weighted scope.
- **Tradeoffs:** Honest limitations create procurement friction but avoid later credibility damage.
- **Improvement recommendations:** Add buyer-safe trust evidence summaries to proof bundles and close tenant/retrieval scope tests with explicit PASS/HOLD output.
- **Disposition:** V1-fixable for product evidence; CPA SOC 2 and third-party pen testing are out of weighted scope.

### Architectural Integrity

- **Score:** 83
- **Weight:** 3
- **Weighted impact on readiness:** 249 / 121
- **Weighted deficiency signal:** 51
- **Justification:** The architecture is decomposed into contracts, core/application, persistence, host composition, UI, CLI, and integration layers. Architecture invariants and solution filters help. Risk comes from breadth: legacy coordinator/authority vocabulary, many DTO surfaces, and UI/API projection duplication.
- **Tradeoffs:** Maintaining old surfaces reduces migration risk but increases mental model cost.
- **Improvement recommendations:** Continue invariant enforcement and eliminate duplicate business logic in UI/proof generators.
- **Disposition:** V1-fixable.

### Interoperability

- **Score:** 76
- **Weight:** 2
- **Weighted impact on readiness:** 152 / 121
- **Weighted deficiency signal:** 48
- **Justification:** REST, CLI, OpenAPI client, SCIM, Azure extractor upload, GitHub/Azure DevOps handoff, and exports provide usable interoperability. First-party Jira, ServiceNow, Confluence, Slack, Teams, broad webhooks, and MCP are outside current headline scope where deferred, but buyers will still compare against them.
- **Tradeoffs:** V1 chooses stable primitives over broad connector surface.
- **Improvement recommendations:** Make the current primitives easier to operationalize through examples and proof links.
- **Disposition:** V1-fixable for REST/CLI/export recipes; first-party connectors are V1.1.

### Security

- **Score:** 87
- **Weight:** 3
- **Weighted impact on readiness:** 261 / 121
- **Weighted deficiency signal:** 39
- **Justification:** Scope identity binding, IDOR integration tests, retrieval OData filters, production-like search lint, and **tenant-retrieval-boundary-proof** in first-pilot rollup.
- **Tradeoffs:** Strong tenant isolation makes local/dev ergonomics harder.
- **Improvement recommendations:** Treat tenant-boundary and retrieval-boundary tests as release blockers for hosted sponsor handoff.
- **Disposition:** V1-fixable.

### Decision Velocity

- **Score:** 82
- **Weight:** 2
- **Weighted impact on readiness:** 164 / 121
- **Weighted deficiency signal:** 36
- **Justification:** **quote-to-proof-readiness.json** and commercial next-step fields in proof packets operationalize quote follow-up; live commerce remains deferred.
- **Tradeoffs:** Founder-led selling can compensate manually, but does not scale cleanly.
- **Improvement recommendations:** Add quote-to-proof readiness and follow-up SLA artifacts.
- **Disposition:** V1-fixable.

### Commercial Packaging Readiness

- **Score:** 78
- **Weight:** 2
- **Weighted impact on readiness:** 156 / 121
- **Weighted deficiency signal:** 44
- **Justification:** Pricing philosophy, order-form template, commercial packet, WHAT_NOT_TO_PROMISE, and trust center provide a credible sales-led package. Packaging still needs stronger guards tying proof state to offer state, tier fit, and deferred ask language.
- **Tradeoffs:** Sales-led packaging is appropriate before live commerce un-hold.
- **Improvement recommendations:** Add tier-fit matrix and commercial copy overclaim guard.
- **Disposition:** V1-fixable; live commerce flip is owner/V1.1.

### Procurement Readiness

- **Score:** 78
- **Weight:** 2
- **Weighted impact on readiness:** 156 / 121
- **Weighted deficiency signal:** 44
- **Justification:** The procurement pack, trust center, DPA template, CAIQ/SIG, SOC self-assessment, security docs, and objection playbook are strong. Procurement blockers remain where buyers demand external attestations or named references, but those are not weighted into `(A)`.
- **Tradeoffs:** Templates and self-assessment get conversations started but do not satisfy rigid RFP checkboxes.
- **Improvement recommendations:** Strengthen strict marker checks, procurement-pack freshness, and buyer-safe omissions report.
- **Disposition:** V1-fixable for pack quality; external attestations are outside weighted scope.

### Traceability

- **Score:** 86
- **Weight:** 3
- **Weighted impact on readiness:** 258 / 121
- **Weighted deficiency signal:** 42
- **Justification:** Runs, manifests, artifacts, audit events, pipeline timelines, correlation IDs, provenance, and evidence labels are strongly represented. Remaining risk is fragmented presentation across detail pages, proof bundles, and exported artifacts.
- **Tradeoffs:** Deep traceability can create UI density.
- **Improvement recommendations:** Add buyer-safe traceability summaries to proof packets and support triage docs.
- **Disposition:** V1-fixable.

### Compliance Readiness

- **Score:** 80
- **Weight:** 2
- **Weighted impact on readiness:** 160 / 121
- **Weighted deficiency signal:** 40
- **Justification:** Compliance docs, SOC self-assessment, CAIQ/SIG, DPA, subprocessor register, audit matrix, VPAT draft, and trust center are present. The score does not penalize missing CPA SOC 2 or ISO certification; procurement realism covers that separately.
- **Tradeoffs:** Self-attestation is honest but weaker than independent assurance.
- **Improvement recommendations:** Keep trust claims freshness-gated and prevent accidental certification language.
- **Disposition:** V1-fixable for documentation and claim safety.

### Reliability

- **Score:** 80
- **Weight:** 2
- **Weighted impact on readiness:** 160 / 121
- **Weighted deficiency signal:** 40
- **Justification:** Health endpoints, worker orchestration, retry/state transitions, support bundles, SLO targets, staging chaos docs, and readiness scripts exist. The gap is operational evidence under hosted, production-like conditions.
- **Tradeoffs:** V1 intentionally avoids multi-region active/active as a headline gate.
- **Improvement recommendations:** Produce availability/probe rollups with explicit non-SLA wording and require readiness proof for sponsor handoff.
- **Disposition:** V1-fixable for evidence; multi-region guarantees are deferred.

### Maintainability

- **Score:** 80
- **Weight:** 2
- **Weighted impact on readiness:** 160 / 121
- **Weighted deficiency signal:** 40
- **Justification:** The repo has strict build settings, central package management, solution filters, architecture docs, and detailed backlog hygiene. Breadth and duplicated projection logic still create maintenance load.
- **Tradeoffs:** Extensive docs help agents and humans, but also require freshness gates.
- **Improvement recommendations:** Add drift gates around generated clients, docs, policy packs, templates, and DDL.
- **Disposition:** V1-fixable.

### Explainability

- **Score:** 82
- **Weight:** 2
- **Weighted impact on readiness:** 164 / 121
- **Weighted deficiency signal:** 36
- **Justification:** Rationale endpoints, explanation summaries, evidence refs, provenance, trace payloads, and source classification support explainability. Weakness remains in how quickly an operator can connect an output to retrieved chunks, tool calls, policy inputs, and cost/ROI basis.
- **Tradeoffs:** Full forensic visibility can expose sensitive or noisy implementation detail.
- **Improvement recommendations:** Add redaction-safe retrieval/tool-call panels and proof summaries.
- **Disposition:** V1-fixable.

### Azure Compatibility and SaaS Deployment Readiness

- **Score:** 85
- **Weight:** 2
- **Weighted impact on readiness:** 170 / 121
- **Weighted deficiency signal:** 30
- **Justification:** IaC parity scan in first-pilot proof, production-like config lint, and Terraform pilot validation matrix close Azure deploy parity gaps for essential services.
- **Tradeoffs:** Azure-native posture improves enterprise fit but narrows multi-cloud deployment appeal, which is out of current hosting scope.
- **Improvement recommendations:** Close IaC parity for active runtime services and add production-like config lint evidence.
- **Disposition:** V1-fixable for Azure parity; AWS/GCP target analysis is V1.1 and re-hosting is out of scope.

### Data Consistency

- **Score:** 83
- **Weight:** 2
- **Weighted impact on readiness:** 166 / 121
- **Weighted deficiency signal:** 34
- **Justification:** SQL persistence, DbUp migrations, manifests, append-only audit, source classification, and server-side KPI improvements support consistency. Risk remains around DDL/migration drift, proof artifact consistency, and UI/server projection duplication.
- **Tradeoffs:** Multiple materialized views improve performance and UX but require consistency gates.
- **Improvement recommendations:** Expand data-consistency proof gates and DDL drift verification.
- **Disposition:** V1-fixable.

### Policy and Governance Alignment

- **Score:** 84
- **Weight:** 2
- **Weighted impact on readiness:** 168 / 121
- **Weighted deficiency signal:** 32
- **Justification:** Policy packs, pre-commit governance, approval workflows, policy assignment, governance dashboard, and buyer-safe caveats are present. Main risk is stale or overclaiming policy-pack metadata.
- **Tradeoffs:** Starter policy packs are useful, but must not imply certification.
- **Improvement recommendations:** Add policy-pack freshness and caveat validation to proof/procurement artifacts.
- **Disposition:** V1-fixable.

### Cognitive Load

- **Score:** 78
- **Weight:** 1
- **Weighted impact on readiness:** 78 / 121
- **Weighted deficiency signal:** 22
- **Justification:** Single Home strip, chooser doc, and explicit deferred-scope links reduce first-session overload; product surface remains dense for power users.
- **Tradeoffs:** Enterprise products need depth; first-value UX needs restraint.
- **Improvement recommendations:** Keep first-run guidance to one primary path and move depth behind explicit "after first commit" affordances.
- **Disposition:** V1-fixable.

### Template and Accelerator Richness

- **Score:** 82
- **Weight:** 1
- **Weighted impact on readiness:** 82 / 121
- **Weighted deficiency signal:** 18
- **Justification:** Chooser, per-pack `starter-pack.json`, CI validation, golden walkthrough, and proof-collector gate complete the accelerator story.
- **Tradeoffs:** More templates without validation would increase risk.
- **Improvement recommendations:** Build a chooser, metadata contract, static validation, and one golden walkthrough.
- **Disposition:** V1-fixable.

### Performance

- **Score:** 74
- **Weight:** 1
- **Weighted impact on readiness:** 74 / 121
- **Weighted deficiency signal:** 26
- **Justification:** SLO targets, metrics, query p95 work, caching options, and health probes exist. There is limited buyer-visible performance evidence for the first-pilot path.
- **Tradeoffs:** Deep performance work is less important than correctness at this stage, but slow proof generation harms conversion.
- **Improvement recommendations:** Add a first-pilot performance smoke report with thresholded PASS/WARN/HOLD.
- **Disposition:** V1-fixable.

### Scalability

- **Score:** 74
- **Weight:** 1
- **Weighted impact on readiness:** 74 / 121
- **Weighted deficiency signal:** 26
- **Justification:** Container Apps, worker separation, optional Redis, SQL topology, and queue/event patterns support scale. Distributed cache hardening and multi-region active/active are intentionally outside V1 headline scope.
- **Tradeoffs:** Single-region early production is simpler and cheaper.
- **Improvement recommendations:** Document scale tiers and add config lint for multi-replica cache consistency assumptions.
- **Disposition:** V1-fixable for clarity; deeper scale-out is V2.

### Availability

- **Score:** 75
- **Weight:** 1
- **Weighted impact on readiness:** 75 / 121
- **Weighted deficiency signal:** 25
- **Justification:** Health endpoints, SLO targets, backup/DR docs, staging probes, and hosted availability rollup tooling exist. The score is capped by limited production availability evidence.
- **Tradeoffs:** Avoiding premature SLA claims protects trust.
- **Improvement recommendations:** Keep availability evidence buyer-safe and distinguish target vs observed uptime.
- **Disposition:** V1-fixable for evidence.

### Auditability

- **Score:** 88
- **Weight:** 2
- **Weighted impact on readiness:** 176 / 121
- **Weighted deficiency signal:** 24
- **Justification:** Append-only audit, typed event catalog, audit search, CSV export, pipeline timeline, correlation IDs, and audit matrix are strong. Remaining risk is drift when new mutating/proof actions land.
- **Tradeoffs:** Detailed audit can be noisy without buyer-safe summaries.
- **Improvement recommendations:** Add audit coverage drift gates and proof-bundle audit summaries.
- **Disposition:** V1-fixable.

### Customer Self-Sufficiency

- **Score:** 78
- **Weight:** 1
- **Weighted impact on readiness:** 78 / 121
- **Weighted deficiency signal:** 22
- **Justification:** First-pilot docs, operator UI, CLI, troubleshooting, procurement pack, and demo workspaces support self-sufficiency. Hosted SaaS LLM setup is not a customer prerequisite, but operators still need help choosing the right path.
- **Tradeoffs:** Sales-led pilots are acceptable, but self-serve trials need stronger rails.
- **Improvement recommendations:** Strengthen guided preflight, first-pilot command center, and "when not to use this accelerator" docs.
- **Disposition:** V1-fixable.

### Extensibility

- **Score:** 78
- **Weight:** 1
- **Weighted impact on readiness:** 78 / 121
- **Weighted deficiency signal:** 22
- **Justification:** Custom agent handler documentation is in scope and REST/CLI/OpenAPI provide extension points. Public plugin SDK, marketplace, MCP transport, and outbound MCP are excluded where deferred.
- **Tradeoffs:** Code-level extensibility is enough for advanced integrators, but not a platform ecosystem.
- **Improvement recommendations:** Keep custom handler docs concrete and avoid implying a public plugin platform.
- **Disposition:** V1-fixable for docs; ecosystem features are deferred.

### Cost-Effectiveness

- **Score:** 79
- **Weight:** 1
- **Weighted impact on readiness:** 79 / 121
- **Weighted deficiency signal:** 21
- **Justification:** Simulator mode, LLM budget controls, cost estimators, source classification, Azure cost extractor, and optional cache providers support cost discipline. Real-LLM proof and hosted probes need bounded schedules to avoid runaway spend.
- **Tradeoffs:** More live AI evidence costs money.
- **Improvement recommendations:** Add budgeted live-evidence schedules and cost summaries in proof artifacts.
- **Disposition:** V1-fixable.

### Deployability

- **Score:** 84
- **Weight:** 1
- **Weighted impact on readiness:** 84 / 121
- **Weighted deficiency signal:** 16
- **Justification:** IaC parity scan + existing Terraform roots and config lint; optional services may still WARN when TF root absent.
- **Tradeoffs:** Supporting many deployment roots creates drift risk.
- **Improvement recommendations:** Add an IaC parity scanner and production-like config evidence.
- **Disposition:** V1-fixable.

### Manageability

- **Score:** 82
- **Weight:** 1
- **Weighted impact on readiness:** 82 / 121
- **Weighted deficiency signal:** 18
- **Justification:** Configuration references, doctor, support bundles, config lint, operator dashboards, policy/governance controls, and health endpoints support manageability. The remaining weakness is scattered operational proof.
- **Tradeoffs:** Rich configuration needs better guardrails.
- **Improvement recommendations:** Promote production-like config lint and support triage artifacts into first-pilot proof.
- **Disposition:** V1-fixable.

### Supportability

- **Score:** 87
- **Weight:** 1
- **Weighted impact on readiness:** 87 / 121
- **Weighted deficiency signal:** 13
- **Justification:** Support triage one-pager, backfill `--output-json`, and expanded proof collector JSON artifacts improve support handoff.
- **Tradeoffs:** More diagnostics can overwhelm support unless ordered.
- **Improvement recommendations:** Add support/audit triage one-pager and CLI JSON for key proof/support commands.
- **Disposition:** V1-fixable.

### Testability

- **Score:** 84
- **Weight:** 1
- **Weighted impact on readiness:** 84 / 121
- **Weighted deficiency signal:** 16
- **Justification:** Test structure is strong: unit, SQL integration, API integration, UI Vitest/Playwright, OpenAPI snapshots, coverage gates, RAG/faithfulness harnesses, and release smoke docs. Gaps remain around live-model and environment-specific evidence.
- **Tradeoffs:** Full live coverage would be slow and costly.
- **Improvement recommendations:** Keep live gates optional but explicit, and add deterministic template/proof/policy validators.
- **Disposition:** V1-fixable.

### Documentation

- **Score:** 86
- **Weight:** 1
- **Weighted impact on readiness:** 86 / 121
- **Weighted deficiency signal:** 14
- **Justification:** Documentation is extensive and often excellent: START_HERE, V1 scope, deferred inventory, trust center, runbooks, build guide, API docs, and buyer materials. Weakness is volume and freshness risk, not absence.
- **Tradeoffs:** Comprehensive docs help enterprise review but can slow first-time readers.
- **Improvement recommendations:** Keep role-based routing and add freshness/overclaim guards.
- **Disposition:** V1-fixable.

---

## 4. Top 12 Most Important Weaknesses

1. **Live AI proof is still too episodic.** Real-mode evidence exists, but the buyer-safe story needs scheduled, bounded, repeatable live-model proof.
2. **The first-pilot path is still cognitively dense.** The product has a canonical path, but there are too many adjacent docs and optional surfaces.
3. **Proof artifacts need stronger cross-surface consistency.** UI, CLI, exports, sponsor packets, and commercial closeout must agree on ROI basis, execution mode, governance status, and deferred scope.
4. **Workflow embedding is shallow in V1.** REST/CLI/export paths work, but native daily-tool embedding is deferred.
5. **AI differentiation is real but not instantly obvious.** The product needs artifact-first proof against generic AI assistant comparisons.
6. **Environment-specific trust evidence is not yet strong enough.** Buyers need PASS/HOLD snapshots tied to their deployment, not only docs.
7. **IaC parity appears behind the Azure-native ambition.** Active runtime services and private connectivity should be fully representable and validated.
8. **Run-detail/operator forensics remain too fragmented.** Operators need quick access to retrieval, tool calls, cost, trust, governance, and provenance in one review context.
9. **Policy-pack and starter-pack quality depends too much on discipline.** Metadata, caveats, and validation should be automated.
10. **Commercial operations lag product proof.** Quote status, follow-up SLA, and tier fit are less structured than technical evidence.
11. **Performance and availability evidence are targets more than lived proof.** The repo is honest, but buyers will ask for observed rollups.
12. **Documentation volume creates its own risk.** A lot is documented; the challenge is keeping the first path decisive and all claims current.

---

## 5. Top 6 Monetization Blockers

1. **Unclear proof-to-quote transition.** After a strong review, the next commercial action must be unambiguous.
2. **ROI basis skepticism.** Buyers will not pay on defaulted or demo-derived savings without sharp labels and caveats.
3. **Generic AI substitution risk.** If the buyer does not see committed evidence, auditability, and governance, they may default to a cheaper assistant.
4. **Sales-led commerce dependency.** Live self-serve transactability is deferred, so founder/sales follow-up quality matters.
5. **No public reference or case-study proof in the current weighted scope.** This is not an `(A)` defect, but it affects conversion confidence.
6. **Template chooser weakness.** Buyers with different jobs need to see the right accelerator immediately.

---

## 6. Top 6 Enterprise Adoption Blockers

1. **Procurement assurance friction.** SOC 2 CPA and third-party pen-test reports are not headline-scored, but many security reviewers will still ask.
2. **Native workflow connector expectations.** Jira, ServiceNow, Confluence, Slack, Teams, broad webhooks, and MCP are V1.1/deferred where documented.
3. **Tenant and retrieval boundary proof.** Enterprise reviewers need hard evidence that scope cannot bleed across tenants.
4. **Deployment/IaC parity.** Azure-native buyers will expect active resources, private endpoints, RBAC, diagnostics, and configuration to be represented as code.
5. **Operational evidence maturity.** Availability, backup/DR, probe rollups, and support triage need environment-specific proof.
6. **Self-sufficiency of first pilot.** Enterprise operators can run the path, but may still need guidance to avoid wrong docs, wrong scope, or wrong proof labels.

---

## 7. Top 6 Engineering Risks

1. **Scope enforcement regressions.** Tenant, workspace, project, retrieval, and API-key/JWT scope binding must remain release-blocking invariants.
2. **Semantic drift in AI outputs.** Without recurring live golden cohorts and faithfulness trend enforcement, model behavior can regress silently.
3. **Cross-surface data divergence.** Backend KPIs, UI summaries, exports, proof packets, and generated clients can drift.
4. **IaC/configuration drift.** Portal-only or partially codified Azure resources can break deployability, security, and support.
5. **Evidence overclaiming.** Marketing, sponsor packets, policy packs, and trust docs can imply unsupported assurance or ROI unless guarded.
6. **Operational blind spots.** Missing or scattered tool-call, retrieval, audit, and cost views slow incident triage.

---

## 8. Most Important Truth

ArchLucid's core product is credible; the fastest path to higher readiness is not more feature breadth, but making the first real proof packet, trust evidence, and commercial next step impossible to misunderstand.

---

## 9. Top Improvement Opportunities

## 9a. Improvement Implementation Status (2026-05-29 rescore)

| # | Improvement | Status | Evidence |
| --- | --- | --- | --- |
| 1 | Real-LLM JSON rollup + tests | **Done** | `scripts/Invoke-RealLlmEvidenceGate.ps1` writes `.json`; golden cohort workflow |
| 2 | Tenant/retrieval boundary gate | **Done** | `report_tenant_retrieval_boundary_proof.py`; wired in `collect-first-pilot-proof.ps1` |
| 3 | Cross-surface proof consistency | **Done** | `SponsorArtifactCrossSurfaceConsistencyTests.cs`; proof collector gates |
| 4 | First-pilot command center | **Done** | `PilotStartHereStrip.tsx`; operator path + 20-minute runbook links |
| 5 | Run detail forensics | **Partial** | Enricher + UI panels; live OpenAPI forensics test — **regenerate OpenAPI snapshot** |
| 6 | Quote-to-proof readiness | **Done** | `quote-to-proof-readiness.json` in `pilot proof-packet` |
| 7 | Starter pack chooser | **Done** | `STARTER_PROOF_PACK_CHOOSER.md` |
| 8 | Starter pack metadata validation | **Done** | `starter-pack.json` per pack; `check_starter_proof_packs.py` + CI tests |
| 9 | Policy pack freshness gate | **Done** | `report_governance_policy_pack_proof.py` in proof collector |
| 10 | Audit coverage drift gate | **Done** | mutating-route audit matrix in collector |
| 11 | IaC parity scanner | **Done** | `report_iac_parity_scan.py`; wired in proof collector |
| 12 | Azure OpenAI managed identity | **Partial** | Production-like config lint; **Entra auth for AOAI (TB-080) not implemented** |
| 13 | Production secret safety | **Partial** | Existing auth rules + config lint |
| 14 | Performance smoke rollup | **Done** | performance baseline + scale envelope in collector |
| 15 | Availability rollup | **Done** | `report_hosted_availability_proof.py` |
| 16 | Procurement strictness | **Done** | procurement/deal-ready gates |
| 17 | Overclaim guard | **Done** | `check_proof_summary_promise_language.py` |
| 18 | Golden walkthrough | **Done** | `GOLDEN_ACCELERATOR_WALKTHROUGH.md` |
| 19 | OpenAPI RunDetailDto drift test | **Done** | `RunDetailDtoOpenApiContractTests.cs` |
| 20 | DDL/migration drift | **Done** | `check_archlucid_unified_schema_snapshot.py` |
| 21 | Backfill `--output-json` | **Done** | `ArchLucid.Backfill.Cli/Program.cs` |
| 22 | Support triage one-pager | **Done** | `FIRST_PILOT_SUPPORT_TRIAGE.md` |
| 23 | Accessibility freshness | **Done** | `assert_accessibility_route_evidence_freshness.py` |
| 24 | Scale tier cache guide | **Done** | `SCALE_TIER_CACHE_GUIDE.md` |
| 25 | Live commerce un-hold | **DEFERRED** | Owner-only (TB-137) |

**Remaining `(A)` drag:** credentialed real-LLM schedule density, OpenAPI snapshot regen for RunDetailDto forensics, Azure OpenAI Entra auth (TB-080).

---

### 1. Scheduled Real-LLM Evidence Gate With Buyer-Safe Rollup

- **Why it matters:** AI credibility is the highest-weighted readiness drag.
- **Expected impact:** Converts real-mode proof from ad hoc evidence into repeatable release evidence.
- **Affected qualities:** AI/Agent Readiness, Cutting-Edge AI Technology, Correctness, Trustworthiness, Proof-of-ROI Readiness.
- **Actionability:** Fully actionable now for code/docs/reporting; owner credentials remain optional inputs.
- **Impact of running the prompt:** Directly improves AI/Agent Readiness (+5-8 pts), Cutting-Edge AI Technology (+4-6 pts), Trustworthiness (+2-3 pts). Weighted readiness impact: +0.6-1.0%.

**Cursor prompt:**

```text
Implement a scheduled real-LLM evidence gate rollup without requiring secrets to be present.

Scope:
- Work in docs/go-to-market/AI_EVIDENCE_APPENDIX.md, docs/quality/REAL_LLM_RUN_EVIDENCE_TEMPLATE.md, docs/runbooks/GOLDEN_COHORT_REAL_LLM_GATE.md, scripts/Invoke-RealLlmEvidenceGate.ps1, scripts/ci/Invoke-FaithfulnessTrendReport.ps1, and any existing real-LLM test support under ArchLucid.AgentRuntime.Tests.
- Preserve the current behavior where missing credentials produce an explicit skipped/no-credentials outcome rather than a failure.
- Add or update a machine-readable and Markdown rollup artifact that records PASS / HOLD / SKIPPED_NO_CREDENTIALS, model/deployment metadata when available, test count, parse failures, unsupported ROI/cost claims, and budget/cost summary.

Acceptance criteria:
- Running the evidence script with no credentials exits successfully and writes a buyer-safe SKIPPED_NO_CREDENTIALS rollup.
- Running with credentials preserves current live smoke behavior and writes model/deployment metadata.
- Documentation clearly distinguishes deterministic simulator evidence from live Azure OpenAI evidence.
- Tests cover the rollup formatter for PASS, HOLD, and SKIPPED_NO_CREDENTIALS.

Constraints:
- Do not commit secrets or sample secret values.
- Do not make live LLM calls merge-blocking by default.
- Do not change model pricing assumptions unless existing tests require it.
```

### 2. Tenant and Retrieval Boundary Release Gate

- **Why it matters:** Enterprise trust collapses if retrieval or run data can bleed across tenant boundaries.
- **Expected impact:** Turns a critical security claim into regression-tested evidence.
- **Affected qualities:** Security, Trustworthiness, Correctness, Compliance Readiness, Enterprise Adoption.
- **Actionability:** Fully actionable now.
- **Impact of running the prompt:** Directly improves Security (+4-6 pts), Trustworthiness (+3-4 pts), Correctness (+2-3 pts). Weighted readiness impact: +0.3-0.5%.

**Cursor prompt:**

```text
Create a release-blocking tenant/retrieval boundary test and proof artifact.

Scope:
- Inspect existing scope binding and retrieval code: ArchLucid.Api/Middleware/ScopeIdentityBindingMiddleware.cs, ArchLucid.Host.Core/Auth/Services/ScopeIdentityBindingValidator.cs, ArchLucid.Retrieval/Indexing/AzureSearchSdkClient.cs, ArchLucid.Core/Hosting/AzureAiSearchProductionLikeConfigurationLint.cs, and related tests.
- Add focused tests that prove:
  1. JWT/API-key scope claims cannot be contradicted by x-tenant/workspace/project headers.
  2. Retrieval search/delete applies tenant scope filters in production client paths.
  3. Missing tenant filter in production-like search config produces HOLD/BLOCK config lint output.
- Add a small Markdown proof output or update an existing config-lint/proof artifact to summarize PASS/HOLD for tenant and retrieval scope.

Acceptance criteria:
- Tests fail if the production retrieval client performs search without tenant filter composition.
- Tests fail if conflicting scope headers are accepted.
- Proof artifact names the checked controls and does not expose tenant secrets.

Constraints:
- Do not relax development bypass fail-fast behavior.
- Do not add a new auth mode.
- Do not rely on live Azure Search credentials.
```

### 3. Cross-Surface Proof Consistency Gate

- **Why it matters:** Buyers will not trust proof if UI, PDF, Markdown, CLI, and JSON disagree.
- **Expected impact:** Hardens sponsor handoff and ROI credibility.
- **Affected qualities:** Correctness, Proof-of-ROI Readiness, Executive Value Visibility, Trustworthiness.
- **Actionability:** Fully actionable now.
- **Impact of running the prompt:** Directly improves Correctness (+3-5 pts), Proof-of-ROI Readiness (+4-6 pts), Executive Value Visibility (+3-4 pts). Weighted readiness impact: +0.4-0.7%.

**Cursor prompt:**

```text
Add cross-surface consistency tests for first-pilot proof artifacts.

Scope:
- Use existing proof generation paths: scripts/collect-first-pilot-proof.ps1, ArchLucid.Application/Pilots/FirstValueReportBuilder.cs, ArchLucid.Application/Pilots/PilotRunDeltasResponseMapper.cs, docs/runbooks/FIRST_PILOT_OPERATOR_PATH.md, and relevant tests under ArchLucid.Application.Tests and ArchLucid.Cli.Tests.
- Validate that execution mode, PilotStrict status, ROI source kind, sponsor disposition, manifest id, run id, governance status, and deferred-scope labels agree across JSON, Markdown, CLI/proof packet, and exported sponsor artifacts where those surfaces exist.

Acceptance criteria:
- A fixture with demo-derived ROI cannot produce sponsor-safe PASS without the expected caveat.
- A fixture with HOLD disposition is reflected consistently in all generated proof artifacts.
- Tests cover at least one PASS, one WARN, and one HOLD case.

Constraints:
- Do not change buyer copy unrelated to proof status.
- Do not add live cloud dependencies.
- Do not remove existing proof outputs.
```

### 4. First-Pilot Command Center Simplification

- **Why it matters:** Time-to-value and adoption friction are constrained by operator cognitive load.
- **Expected impact:** Makes the first review path easier to complete without sales-engineer narration.
- **Affected qualities:** Time-to-Value, Adoption Friction, Usability, Cognitive Load, Customer Self-Sufficiency.
- **Actionability:** Fully actionable now.
- **Impact of running the prompt:** Directly improves Time-to-Value (+3-5 pts), Adoption Friction (+3-4 pts), Usability (+2-3 pts). Weighted readiness impact: +0.4-0.6%.

**Cursor prompt:**

```text
Simplify first-pilot command center language and route priority.

Scope:
- Review docs/START_HERE.md, docs/CORE_PILOT.md, docs/runbooks/FIRST_PILOT_OPERATOR_PATH.md, docs/runbooks/FIRST_VALUE_20_MINUTES.md, archlucid-ui/src/app/(operator)/_sections/OperatorHomePageView.tsx, and archlucid-ui/src/components/operator-home/PilotStartHereStrip.tsx.
- Make the first-pilot path use one primary sequence: platform ready -> evidence -> create/execute/commit -> sponsor proof -> next commercial action.
- Keep optional Operate, connectors, MCP, live commerce, and deep docs explicitly secondary or after-first-commit.

Acceptance criteria:
- A first-time evaluator can identify the single primary CTA from Home and the single canonical checklist from docs.
- No required V1 step points to a V1.1/deferred capability.
- Existing deep docs remain linked but are clearly labeled as depth or recovery.

Constraints:
- Do not remove advanced Operate documentation.
- Do not claim self-serve live commerce.
- Do not add new UI dependencies.
```

### 5. Run Detail Forensics Completion

- **Why it matters:** Operators need to approve, reject, or escalate based on one coherent run-detail view.
- **Expected impact:** Reduces hidden failure modes and support time.
- **Affected qualities:** Explainability, Supportability, Traceability, Correctness, Usability.
- **Actionability:** Fully actionable now.
- **Impact of running the prompt:** Directly improves Explainability (+4-6 pts), Supportability (+3-4 pts), Traceability (+2-3 pts). Weighted readiness impact: +0.2-0.4%.

**Cursor prompt:**

```text
Complete redaction-safe run-detail forensics in the operator UI.

Scope:
- Inspect current run-detail components under archlucid-ui/src/app/(operator)/reviews/[runId]/_sections and shared components such as RunAgentForensicsSection, RunDetailGovernanceAlerts, RunEstimatedLlmCostCard, and RunTrustEvidenceCardSection.
- Ensure a non-buyer operator view can see, in context: LLM cost estimate, trust evidence card, retrieval grounding availability, tool/function invocation summary, governance warnings, last failure reason, commit-blocking finding coverage, provenance link/summary, and audit/pipeline timeline.
- Reuse existing endpoints before adding new ones. If generated API types are stale, update generation/tests rather than hand-writing parallel DTOs.

Acceptance criteria:
- The UI renders explicit empty states when data is unavailable rather than silently omitting critical panels.
- Unit tests or page tests cover governance warning, commit-blocking coverage, and missing retrieval/tool-call data.
- Buyer-polished mode remains redaction-safe and does not expose raw prompts or sensitive traces.

Constraints:
- Do not expose raw LLM prompts/responses in buyer mode.
- Do not create duplicate business logic in React when a backend field exists.
- Do not change the authority route shape without OpenAPI/client updates.
```

### 6. Quote-to-Proof Readiness Checklist

- **Why it matters:** Monetization depends on turning proof into a specific commercial decision.
- **Expected impact:** Reduces founder-led follow-up ambiguity and improves decision velocity.
- **Affected qualities:** Decision Velocity, Commercial Packaging Readiness, Executive Value Visibility, Marketability.
- **Actionability:** Fully actionable now.
- **Impact of running the prompt:** Directly improves Decision Velocity (+5-8 pts), Commercial Packaging Readiness (+4-6 pts). Weighted readiness impact: +0.2-0.4%.

**Cursor prompt:**

```text
Implement a quote-to-proof readiness checklist artifact.

Scope:
- Work in docs/go-to-market/COMMERCIAL_DECISION_PACKET.md, docs/go-to-market/QUOTE_TO_PROOF_PACKET.md, docs/go-to-market/ORDER_FORM_TEMPLATE.md if referenced, ArchLucid.Cli/Commands/PilotProofPacketCommand.cs, and proof packet tests.
- Generate or update a proof artifact that summarizes: proof PASS/WARN/HOLD, ROI basis, deferred buyer requirements, recommended offer/tier, quote owner, follow-up SLA, and next customer ask.

Acceptance criteria:
- Proof packet output includes a concise commercial readiness section.
- HOLD/DEFERRED_SCOPE cannot be rendered as "ready to close" without caveat.
- Tests cover PASS and HOLD commercial closeout cases.

Constraints:
- Do not claim live Stripe or Marketplace transactability.
- Do not introduce CRM/vendor dependencies.
- Do not change list pricing.
```

### 7. Starter Proof Pack Chooser and Metadata Contract

- **Why it matters:** Templates only help if buyers can pick the right one quickly and safely.
- **Expected impact:** Improves first-session clarity without adding template sprawl.
- **Affected qualities:** Template and Accelerator Richness, Time-to-Value, Marketability, Adoption Friction.
- **Actionability:** Fully actionable now.
- **Impact of running the prompt:** Directly improves Template and Accelerator Richness (+10-15 pts), Time-to-Value (+2-3 pts). Weighted readiness impact: +0.2-0.3%.

**Cursor prompt:**

```text
Create a starter proof pack chooser and metadata contract.

Scope:
- Work in templates/starter-proof-packs/, templates/README.md, docs/onboarding/EVALUATOR_WORKBOOK.md, and docs/runbooks/FIRST_PILOT_OPERATOR_PATH.md if it should link to the chooser.
- Add a chooser document mapping buyer job -> existing starter proof pack -> required inputs -> expected proof outputs -> when not to use.
- Define starter-pack metadata fields: id, title, targetBuyer, buyerJob, owner, lastReviewedUtc, requiredInputs, expectedOutputs, scopeLabel, doNotUseWhen, deferredScopeNotes.
- Add metadata for existing packs only.

Acceptance criteria:
- A first-time evaluator can choose one existing pack without reading every README.
- Every referenced pack has metadata.
- Deferred capabilities are explicitly labeled and no V1-ready pack implies live commerce, SOC 2 CPA, public references, or V1.1 connectors.

Constraints:
- Do not add new starter packs.
- Do not duplicate V1/V1.1 scope tables.
- Do not use external services.
```

### 8. Starter Proof Pack Static Validation

- **Why it matters:** Buyer-facing templates can silently rot or overclaim.
- **Expected impact:** Prevents unsafe placeholders and broken examples from entering release artifacts.
- **Affected qualities:** Correctness, Template and Accelerator Richness, Trustworthiness, Testability.
- **Actionability:** Fully actionable now.
- **Impact of running the prompt:** Directly improves Correctness (+1-2 pts), Template and Accelerator Richness (+5-8 pts), Trustworthiness (+1-2 pts). Weighted readiness impact: +0.1-0.3%.

**Cursor prompt:**

```text
Add static validation for starter proof packs.

Scope:
- Add or extend a script under scripts/ci/ that validates templates/starter-proof-packs/*.
- Reuse existing placeholder, secret, Markdown, and JSON validation helpers where possible.
- Add tests for one valid fixture and one invalid fixture.

Acceptance criteria:
- Validation fails on missing metadata, malformed JSON, missing required pack artifacts, buyer-unsafe placeholders, obvious secret-shaped values, or invalid scope labels.
- The script requires no network or cloud credentials.
- Documentation names the validation command.

Constraints:
- Do not create a second inconsistent secret scanner if a reusable helper exists.
- Do not require live ArchLucid API execution.
- Do not broaden V1 scope.
```

### 9. Policy Pack Freshness and Caveat Gate

- **Why it matters:** Governance packs must not be mistaken for certification or stale compliance automation.
- **Expected impact:** Makes policy/governance evidence safer for procurement.
- **Affected qualities:** Policy and Governance Alignment, Compliance Readiness, Trustworthiness, Auditability.
- **Actionability:** Fully actionable now.
- **Impact of running the prompt:** Directly improves Policy and Governance Alignment (+4-6 pts), Compliance Readiness (+2-3 pts). Weighted readiness impact: +0.2-0.3%.

**Cursor prompt:**

```text
Add policy-pack metadata, freshness, and buyer-safe caveat validation.

Scope:
- Inspect ArchLucid.Application/Governance/DefaultPolicyPacks/Bundled/, docs/go-to-market/DEFAULT_POLICY_PACKS_V1.md, docs/library/POLICY_PACK_APPENDIX_AI_GOVERNANCE_V1.md, docs/library/POLICY_PACK_APPENDIX_SECURITY_BASELINE_V1.md, and policy-pack tests.
- Add required metadata checks for owner, last reviewed, scope, sample finding, and "not certification" caveat.
- Add proof/procurement summary output showing stale packs and buyer-safe caveats.

Acceptance criteria:
- Missing or stale required metadata fails a deterministic test or CI script.
- Buyer-facing docs do not imply statutory certification.
- Proof packet can include a policy freshness summary without exposing internal-only details.

Constraints:
- Do not change seeded pack semantics silently.
- Do not add new compliance framework claims.
- Do not mutate historical policy versions without versioning.
```

### 10. Audit Coverage Drift Gate

- **Why it matters:** Auditability is strong but can regress as routes and proof actions grow.
- **Expected impact:** Keeps mutating workflows and sponsor/procurement actions traceable.
- **Affected qualities:** Auditability, Trustworthiness, Supportability, Compliance Readiness.
- **Actionability:** Fully actionable now.
- **Impact of running the prompt:** Directly improves Auditability (+3-5 pts), Supportability (+2-3 pts). Weighted readiness impact: +0.1-0.2%.

**Cursor prompt:**

```text
Implement an audit coverage drift gate for critical workflows.

Scope:
- Inspect ArchLucid.Core/Audit, ArchLucid.Application.Audit, docs/library/AUDIT_COVERAGE_MATRIX.md, mutating controllers under ArchLucid.Api/Controllers, and proof/procurement generation paths.
- Add a test or CI script that maps critical mutating routes and proof actions to expected audit event types or an explicit allowlisted rationale.
- Add buyer-safe audit evidence summary fields for proof bundles: event categories, correlation IDs, run/manifest traceability, and omitted-sensitive-field notes.

Acceptance criteria:
- Adding a new critical mutating route without audit mapping fails the gate.
- Sponsor/procurement proof actions either emit audit rows or document why they are informational only.
- Docs matrix updates are part of the same change.

Constraints:
- Do not log sensitive payloads.
- Do not turn best-effort informational audit into transactional failure unless existing semantics require it.
- Do not duplicate the audit event catalog.
```

### 11. IaC Parity Scanner for Active Azure Services

- **Why it matters:** Azure-native SaaS claims require infrastructure to be representable and drift-detectable.
- **Expected impact:** Converts IaC concerns into a concrete manifest instead of tribal knowledge.
- **Affected qualities:** Azure Compatibility and SaaS Deployment Readiness, Deployability, Security, Manageability.
- **Actionability:** Fully actionable now.
- **Impact of running the prompt:** Directly improves Azure Compatibility (+3-5 pts), Deployability (+3-4 pts), Security (+1-2 pts). Weighted readiness impact: +0.2-0.3%.

**Cursor prompt:**

```text
Add an IaC parity scanner for active runtime Azure services.

Scope:
- Inspect appsettings*.json, ArchLucid.Host.Composition configuration registration, docs/library/CONFIGURATION_REFERENCE.md, infra/terraform*/, and docs/library/TECH_BACKLOG.md IaC parity items.
- Create a script or test that reports configured runtime services and whether Terraform coverage exists for resource, private connectivity, RBAC, diagnostics, and secret handling.
- Start with Azure OpenAI, Azure AI Search, Key Vault, Redis, ACR, Azure Monitor workspace, Service Bus, Blob, SQL, and Container Apps.

Acceptance criteria:
- The scanner outputs PASS/WARN/HOLD per service with file references.
- Missing coverage for production-like required services is visible in a Markdown/JSON artifact.
- Existing docs explain how to interpret warnings vs blockers.

Constraints:
- Do not provision resources.
- Do not require Azure credentials.
- Do not mark explicitly deferred optional services as V1 blockers.
```

### 12. Azure OpenAI Managed Identity Migration Design Slice

- **Why it matters:** Symmetric API keys are less enterprise-friendly than Entra/managed identity.
- **Expected impact:** Improves security posture and Azure-native credibility.
- **Affected qualities:** Security, Azure Compatibility and SaaS Deployment Readiness, Manageability, Procurement Readiness.
- **Actionability:** Fully actionable now as design plus non-breaking implementation.
- **Impact of running the prompt:** Directly improves Security (+2-3 pts), Azure Compatibility (+2-3 pts). Weighted readiness impact: +0.1-0.2%.

**Cursor prompt:**

```text
Add a non-breaking Azure OpenAI managed identity authentication path.

Scope:
- Inspect ArchLucid.AgentRuntime/AzureOpenAiCompletionClient.cs, configuration docs, host composition registration, tests around real AOAI configuration, and scripts/Import-LocalRealAoaiEnv.ps1.
- Add configuration that allows Azure OpenAI auth via managed identity / DefaultAzureCredential where supported, while retaining existing key-based local/dev path.
- Update production-like config lint to prefer managed identity and warn on symmetric key use where appropriate.

Acceptance criteria:
- Existing key-based tests continue passing.
- New tests cover managed-identity configuration selection without making live calls.
- Docs explain when to use key vs managed identity and how Key Vault fits.

Constraints:
- Do not remove key-based local development support.
- Do not introduce unverified SDK APIs; use commonly available Azure Identity patterns.
- Do not commit credentials.
```

### 13. Production Secret Configuration Safety Rules

- **Why it matters:** Enterprise deployments need fail-fast or loud warnings for unsafe secret handling.
- **Expected impact:** Reduces security review and operations risk.
- **Affected qualities:** Security, Manageability, Procurement Readiness, Deployability.
- **Actionability:** Fully actionable now.
- **Impact of running the prompt:** Directly improves Security (+2-4 pts), Manageability (+1-2 pts). Weighted readiness impact: +0.1-0.2%.

**Cursor prompt:**

```text
Harden production-like safety rules for API keys and Service Bus secrets.

Scope:
- Inspect ArchLucid.Host.Core/Startup/Validation/Rules, ArchLucid.Core/Hosting/OperatorConfigurationLintEvaluator.cs, docs/library/CONFIGURATION_REFERENCE.md, and related tests.
- Add rules that warn or fail in production-like environments when ArchLucidApiKey or Service Bus credentials are configured as raw secrets instead of approved Key Vault or identity-backed references.
- Align CLI config-lint output with startup validation language.

Acceptance criteria:
- Production-like config with raw long-lived API key is flagged.
- Production-like Service Bus raw connection string is flagged unless explicitly documented as a dev/test exception.
- Tests cover Development vs Staging/Production-like behavior.

Constraints:
- Do not break documented local dev paths.
- Do not require Azure connectivity for tests.
- Do not change auth mode semantics.
```

### 14. First-Pilot Performance Smoke

- **Why it matters:** Slow proof generation damages time-to-value and perceived quality.
- **Expected impact:** Gives operators thresholded evidence for the first-review path.
- **Affected qualities:** Performance, Time-to-Value, Reliability, Supportability.
- **Actionability:** Fully actionable now.
- **Impact of running the prompt:** Directly improves Performance (+6-10 pts), Time-to-Value (+1-2 pts). Weighted readiness impact: +0.1-0.2%.

**Cursor prompt:**

```text
Add a first-pilot performance smoke report.

Scope:
- Extend existing readiness/proof scripts rather than creating a separate runner: scripts/collect-first-pilot-proof.ps1, release-smoke docs, or CLI proof-packet command as appropriate.
- Record elapsed time for preflight, evidence validation, run status fetch, proof generation, export discovery, and sponsor packet assembly.
- Emit PASS/WARN/HOLD thresholds in Markdown and JSON.

Acceptance criteria:
- Performance output appears in first-pilot proof artifacts.
- Thresholds are documented as guidance, not contractual SLA.
- Tests cover formatter behavior without requiring a live API.

Constraints:
- Do not add load testing infrastructure.
- Do not claim production latency from local smoke runs.
- Do not make timing flaky in normal unit tests.
```

### 15. Availability and Probe Evidence Rollup

- **Why it matters:** Availability targets need observed evidence without overclaiming SLA compliance.
- **Expected impact:** Improves procurement and reliability conversations.
- **Affected qualities:** Availability, Reliability, Trustworthiness, Procurement Readiness.
- **Actionability:** Fully actionable now.
- **Impact of running the prompt:** Directly improves Availability (+5-8 pts), Reliability (+2-3 pts). Weighted readiness impact: +0.1-0.2%.

**Cursor prompt:**

```text
Create a buyer-safe hosted probe rollup artifact.

Scope:
- Inspect docs/runbooks/HOSTED_AVAILABILITY_ROLLUP.md, docs/go-to-market/TRUST_CENTER.md, docs/library/API_SLOS.md, docs/library/SLA_TARGETS.md, and scripts/ops/summarize_hosted_probe_artifacts.py.
- Ensure the rollup clearly distinguishes observed staging/hosted probe results from contractual production SLA.
- Add or update tests for Markdown summary generation.

Acceptance criteria:
- Rollup includes window, probe count, pass/fail/degraded counts, exclusions, and explicit non-SLA wording.
- Trust Center points to the methodology without implying a negotiated SLA was met.
- Missing probe artifacts produce INCONCLUSIVE, not PASS.

Constraints:
- Do not invent availability data.
- Do not claim production uptime unless input artifacts prove production base URLs and owner review.
- Do not add external monitoring dependencies.
```

### 16. Procurement Pack Strictness and Freshness Gate

- **Why it matters:** Procurement artifacts are valuable only if current and free of unsafe placeholders.
- **Expected impact:** Reduces buyer review embarrassment and trust risk.
- **Affected qualities:** Procurement Readiness, Compliance Readiness, Documentation, Trustworthiness.
- **Actionability:** Fully actionable now.
- **Impact of running the prompt:** Directly improves Procurement Readiness (+3-5 pts), Compliance Readiness (+1-2 pts). Weighted readiness impact: +0.1-0.2%.

**Cursor prompt:**

```text
Harden procurement pack strictness and freshness validation.

Scope:
- Inspect scripts/build_procurement_pack.py, scripts/procurement_pack_canonical.json, docs/go-to-market/HOW_TO_REQUEST_PROCUREMENT_PACK.md, docs/go-to-market/TRUST_CENTER.md, and freshness/strictness CI helpers.
- Ensure strict mode catches buyer-unsafe stub tokens, stale Last reviewed metadata, broken canonical paths, and missing redaction report entries.

Acceptance criteria:
- Strict mode fails on unsafe placeholder tokens in buyer-facing pack files.
- Missing required trust-pack source files fail loudly.
- Documentation explains normal vs strict mode and when to use each.

Constraints:
- Do not include buyer-specific names in committed docs.
- Do not require network access.
- Do not remove the redaction report.
```

### 17. Commercial Copy Overclaim Guard

- **Why it matters:** One unsupported claim can undermine trust and procurement.
- **Expected impact:** Prevents accidental claims about live commerce, SOC 2 CPA, public references, or unsupported ROI.
- **Affected qualities:** Trustworthiness, Commercial Packaging Readiness, Procurement Readiness, Marketability.
- **Actionability:** Fully actionable now.
- **Impact of running the prompt:** Directly improves Trustworthiness (+2-3 pts), Commercial Packaging Readiness (+2-4 pts). Weighted readiness impact: +0.1-0.2%.

**Cursor prompt:**

```text
Add a commercial and trust copy overclaim guard.

Scope:
- Add or extend a CI script that scans docs/go-to-market, docs/runbooks first-pilot docs, archlucid-ui marketing/trust pages, and proof packet templates.
- Flag phrases that imply CPA SOC 2 is issued, third-party pen test is complete, Marketplace/Stripe live transactability is available, public reference customers are published, unsupported ROI is guaranteed, or V1.1 connectors are V1 commitments.
- Provide an allowlist with rationale for scope docs that intentionally describe deferred items.

Acceptance criteria:
- The guard fails on unsafe fixture text and passes on approved deferred-scope wording.
- The output names file, line, claim class, and suggested remediation.
- Documentation explains how to add an allowlist entry with scope rationale.

Constraints:
- Do not scan docs/archive as current buyer copy.
- Do not ban honest deferred-scope explanations.
- Do not change product scope.
```

### 18. Golden Accelerator Walkthrough

- **Why it matters:** One excellent walkthrough is more valuable than many shallow templates.
- **Expected impact:** Improves marketability and evaluator success.
- **Affected qualities:** Marketability, Template and Accelerator Richness, Time-to-Value, Differentiability.
- **Actionability:** Fully actionable now.
- **Impact of running the prompt:** Directly improves Marketability (+2-3 pts), Template and Accelerator Richness (+5-8 pts). Weighted readiness impact: +0.1-0.2%.

**Cursor prompt:**

```text
Create one golden accelerator walkthrough from an existing starter proof pack.

Scope:
- Choose one existing pack based on current GTM focus, preferably regulated-saas-soc-procurement or ai-llm-workload.
- Work in templates/starter-proof-packs, docs/library/walkthroughs, docs/go-to-market/demo-proof-packets, and docs/onboarding/EVALUATOR_WORKBOOK.md.
- Show expected inputs, commands/UI path, generated proof artifacts, expected caveats, and commercial next step.

Acceptance criteria:
- Walkthrough uses only existing V1-safe capabilities.
- It includes expected outputs and "what good looks like" without claiming external assurance.
- It links back to Core Pilot rather than replacing it.

Constraints:
- Do not add a new pack.
- Do not include real customer names.
- Do not require live cloud credentials.
```

### 19. OpenAPI and Generated Client Drift Gate for Run Detail

- **Why it matters:** The UI cannot safely render operator evidence if generated contracts drift from backend DTOs.
- **Expected impact:** Reduces silent UI/API mismatch and operator blind spots.
- **Affected qualities:** Correctness, Maintainability, Testability, Usability.
- **Actionability:** Fully actionable now.
- **Impact of running the prompt:** Directly improves Correctness (+2-3 pts), Maintainability (+1-2 pts). Weighted readiness impact: +0.1-0.2%.

**Cursor prompt:**

```text
Harden OpenAPI/generated client drift detection for run detail fields.

Scope:
- Inspect ArchLucid.Core/Persistence/ApplicationPorts/Queries/RunDetailDto.cs, ArchLucid.Api.Tests OpenAPI snapshot tests, ArchLucid.Api.Client/Generated, and archlucid-ui generated API types.
- Ensure critical fields such as findingCoverageSummary, degradedFindingCoverage, agentExecutionLlmCostEstimate, trustEvidenceCard, results, governance warnings, and failure reason are present in OpenAPI and generated clients where expected.

Acceptance criteria:
- Tests fail if critical RunDetailDto fields disappear from OpenAPI.
- UI type generation is documented and, if feasible, checked by CI.
- No hand-written parallel DTO is introduced in the UI for fields available in the API contract.

Constraints:
- Do not change public route paths.
- Do not add fields without reviewing buyer redaction implications.
- Do not edit generated files manually if a generator exists.
```

### 20. DDL and Migration Drift Verification

- **Why it matters:** SQL is the product backbone; schema drift threatens correctness and deployability.
- **Expected impact:** Strengthens data consistency and release safety.
- **Affected qualities:** Data Consistency, Deployability, Reliability, Maintainability.
- **Actionability:** Fully actionable now.
- **Impact of running the prompt:** Directly improves Data Consistency (+3-5 pts), Deployability (+2-3 pts). Weighted readiness impact: +0.1-0.2%.

**Cursor prompt:**

```text
Add DDL and migration drift verification for product SQL catalogs.

Scope:
- Inspect ArchLucid.Persistence/Scripts/ArchLucid.sql, ArchLucid.Persistence/Migrations, ArchLucid.Persistence.MigrateVerify if present, docs/library/SQL_SCRIPTS.md, and related tests.
- Add verification that the canonical DDL file, embedded migrations, and greenfield database shape agree for supported catalogs.
- Include system catalog coverage if a separate supported database exists, while respecting the repo rule that all SQL DDL should be in a single file for each database.

Acceptance criteria:
- Drift between canonical DDL and migrations fails a test or verification script.
- Verification output names missing/extra tables, columns, indexes, constraints, and migration journal state.
- Docs explain how contributors update DDL when adding migrations.

Constraints:
- Do not split DDL for one database across multiple files.
- Do not require production SQL access.
- Do not rewrite historical migrations unless required by existing migration policy.
```

### 21. Backfill and Jobs Machine-Readable Reports

- **Why it matters:** Operational jobs need rerun safety and CI-friendly diagnostics.
- **Expected impact:** Improves supportability and reliability for maintenance operations.
- **Affected qualities:** Supportability, Reliability, Manageability, Testability.
- **Actionability:** Fully actionable now.
- **Impact of running the prompt:** Directly improves Supportability (+2-3 pts), Reliability (+1-2 pts). Weighted readiness impact: +0.05-0.15%.

**Cursor prompt:**

```text
Add machine-readable reports for backfill and jobs CLI operations.

Scope:
- Inspect Backfill.Cli, Jobs.Cli, related runbooks, and TECH_BACKLOG operational items.
- Add --output-json or equivalent report support with per-stage timing, counts, skipped/error rows, checkpoint/resume status where applicable, and final PASS/WARN/HOLD.

Acceptance criteria:
- CLI report can be consumed by CI without parsing console prose.
- One bad tenant/schedule can be represented as partial failure when the existing job semantics allow it.
- Tests cover success and partial-failure report formatting.

Constraints:
- Do not change destructive behavior or retry semantics without explicit tests.
- Do not add external queue dependencies.
- Do not hide failures behind exit code 0 unless documented as partial success.
```

### 22. Support and Audit Triage One-Pager

- **Why it matters:** Correlation IDs and audit rows are only useful if operators know the investigation order.
- **Expected impact:** Reduces time to diagnose pilot and sponsor proof issues.
- **Affected qualities:** Supportability, Auditability, Traceability, Customer Self-Sufficiency.
- **Actionability:** Fully actionable now.
- **Impact of running the prompt:** Directly improves Supportability (+3-4 pts), Customer Self-Sufficiency (+1-2 pts). Weighted readiness impact: +0.05-0.15%.

**Cursor prompt:**

```text
Create a support/audit triage one-pager for first-pilot issues.

Scope:
- Work in docs/runbooks/TROUBLESHOOTING.md, docs/runbooks/FIRST_PILOT_TROUBLESHOOTING.md, docs/library/AUDIT_COVERAGE_MATRIX.md, and support bundle docs.
- Add a one-page sequence for runId/correlationId investigation: health/version, run detail, pipeline timeline, audit search, support bundle, proof artifact, config lint, and escalation packet.

Acceptance criteria:
- Operator can follow the page without knowing internal service names first.
- The one-pager names buyer-safe vs internal-only artifacts.
- Existing troubleshooting pages link to it.

Constraints:
- Do not duplicate long troubleshooting matrices.
- Do not expose sensitive audit payload examples.
- Do not add new tooling unless existing docs reveal a true gap.
```

### 23. Accessibility Evidence Freshness Guard

- **Why it matters:** Accessibility procurement evidence should be honest and fresh without implying manual AT testing.
- **Expected impact:** Improves procurement confidence and documentation safety.
- **Affected qualities:** Compliance Readiness, Usability, Trustworthiness, Documentation.
- **Actionability:** Fully actionable now.
- **Impact of running the prompt:** Directly improves Compliance Readiness (+1-2 pts), Trustworthiness (+1 pt). Weighted readiness impact: +0.05-0.1%.

**Cursor prompt:**

```text
Add accessibility evidence freshness validation.

Scope:
- Inspect ACCESSIBILITY.md, docs/security/VPAT_2_5_WCAG_2_1_AA.md, docs/go-to-market/TRUST_CENTER.md, archlucid-ui accessibility tests, and relevant CI scripts.
- Validate that buyer-facing accessibility docs have current reviewed dates, distinguish automated axe/jsx-a11y evidence from manual AT testing, and link to the correct public contact path.

Acceptance criteria:
- Stale accessibility evidence produces a warning or failure according to existing freshness policy.
- Docs do not claim manual assistive-technology user testing if not completed.
- Tests/scripts do not require a browser unless an existing Playwright accessibility path already does.

Constraints:
- Do not reduce `(A)` for missing participant AT testing.
- Do not invent VPAT conformance claims.
- Do not alter unrelated UI behavior.
```

### 24. Scale Tier and Cache Consistency Guide

- **Why it matters:** Operators need to know when memory caches are acceptable and when Redis/private connectivity matters.
- **Expected impact:** Improves scalability, reliability, and cost clarity without forcing V2 Redis work into V1.
- **Affected qualities:** Scalability, Reliability, Cost-Effectiveness, Manageability.
- **Actionability:** Fully actionable now as docs/config lint.
- **Impact of running the prompt:** Directly improves Scalability (+3-5 pts), Manageability (+1-2 pts). Weighted readiness impact: +0.05-0.1%.

**Cursor prompt:**

```text
Document and lint scale-tier cache consistency assumptions.

Scope:
- Inspect docs/library/CONFIGURATION_REFERENCE.md, docs/library/V1_DEFERRED.md distributed cache section, host configuration rules for HotPathCache and LlmCompletionCache, and Terraform/cache docs.
- Add a scale-tier table: single-replica pilot, multi-replica early production, and larger fleet. Explain memory vs Redis assumptions, expected replica count, cache invalidation risk, and cost tradeoffs.
- Add config-lint warnings when multi-replica production-like settings use memory-only cache in paths where cross-replica consistency matters.

Acceptance criteria:
- Operators can tell when Redis is optional vs recommended.
- V1 docs do not imply mandatory Redis for single-replica pilots.
- Tests cover config-lint behavior for single vs multi-replica.

Constraints:
- Do not promote distributed graph cache to V1.
- Do not provision Redis.
- Do not make memory cache invalid for local/dev.
```

### 25. DEFERRED - Live Commerce Un-Hold

- **Why it matters:** Self-serve transactability improves conversion and decision velocity.
- **Expected impact:** Would reduce sales-led friction and make `/pricing` to paid tenant more direct.
- **Affected qualities:** Decision Velocity, Commercial Packaging Readiness, Adoption Friction.
- **Actionability:** **DEFERRED.**
- **Reason it is deferred:** The final flip requires owner-controlled Stripe live keys, Marketplace publication, seller verification, payout/tax setup, and DNS cutover. Those are not meaningful for the agent to execute independently.
- **Specific information needed later:** Confirmation that Stripe live credentials, Marketplace seller setup, payout/tax profile, production webhook secret, and `signup.archlucid.net` DNS are ready; owner approval to move from TEST/staging to live production commerce.
- **Impact if later executed:** Directly improves Decision Velocity (+6-10 pts), Commercial Packaging Readiness (+5-8 pts), Adoption Friction (+2-3 pts). Weighted readiness impact if promoted into scope: +0.3-0.5%.

---

## 10. Prompt Batching Guidance

### Batch A - AI Proof and Trust Evidence

Run improvements **1, 2, 3, and 5** together only if the agent has a large context window. They share run evidence, retrieval, trust, and proof consistency. Best normal split: **1** alone, then **2 + 3**, then **5**.

### Batch B - First-Pilot and Commercial Conversion

Run **4, 6, 17, and 18** together if the goal is a better founder-led sales motion. This batch improves the first evaluator path, commercial closeout, overclaim safety, and demo walkthrough.

### Batch C - Templates and Governance Proof

Run **7 + 8** together, then **9 + 10** together. Starter packs and policy packs are adjacent but should not be mixed with audit routes unless context is available.

### Batch D - Azure/Security Operations

Run **11, 12, 13, and 24** as an Azure/security configuration batch. They touch configuration, linting, IaC posture, managed identity, secret handling, and scale assumptions.

### Batch E - Reliability, Performance, and Support

Run **14, 15, 21, and 22** together if the focus is operator readiness. They produce timing, availability, machine-readable job output, and triage guidance.

### Batch F - Contract and Data Consistency

Run **19 and 20** together. They both protect backend/UI/data-contract integrity and should be verified with focused backend and generated-client checks.

### Deferred / Owner-Input Batch

Keep **25** separate. Do not ask an agent to execute it until the owner confirms live commerce prerequisites.

---

## 11. Pending Questions for Later

### Scheduled Real-LLM Evidence Gate With Buyer-Safe Rollup

- Which Azure OpenAI deployment should be treated as the canonical hosted proof deployment?
- Should live evidence run on a fixed schedule, release candidate branches only, or manual owner dispatch only?
- What maximum monthly budget is acceptable for live-model evidence?

### Tenant and Retrieval Boundary Release Gate

- Which hosted environments should treat retrieval scope proof as release-blocking versus advisory?
- Should SingleCatalog developer mode remain in any production-like configuration, or be blocked entirely?

### Cross-Surface Proof Consistency Gate

- Which artifact is the source of truth when UI, CLI, and exported sponsor packet disagree?
- Should demo-derived ROI always force HOLD, or WARN with explicit walkthrough-only language?

### Quote-to-Proof Readiness Checklist

- What quote follow-up SLA should be considered on time?
- Which commercial roles or names should appear in generated artifacts, if any?

### Starter Proof Pack Chooser and Metadata Contract

- Which existing starter proof pack should be the default recommended first walkthrough?
- Who owns freshness review for each pack?

### Policy Pack Freshness and Caveat Gate

- What review cadence should mark a policy pack stale?
- Are any policy packs allowed to use stronger buyer language than "starter" or "architecture-review prompt"?

### IaC Parity Scanner for Active Azure Services

- Which Azure services are mandatory in the hosted production baseline versus optional per tenant/environment?
- Should missing Terraform for optional-but-configured services be WARN or HOLD?

### Azure OpenAI Managed Identity Migration Design Slice

- Is managed identity required for hosted production, or preferred with key fallback?
- Which Azure SDK auth path is the approved long-term standard for Azure OpenAI in this repo?

### First-Pilot Performance Smoke

- What elapsed-time thresholds should be PASS, WARN, and HOLD for first-pilot proof generation?
- Should thresholds differ between local, staging, and hosted environments?

### Availability and Probe Evidence Rollup

- Which base URLs count as production evidence?
- Who approves a buyer-shareable availability rollup?

### Live Commerce Un-Hold

- Are Stripe live keys, Marketplace publication prerequisites, payout/tax profile, webhook secret, and DNS cutover ready?
- Should commerce un-hold wait for a validated paid pilot pattern, or proceed as soon as finance/Marketplace setup is complete?
# ArchLucid Assessment – (A) Headline Readiness: 80.73%

This score represents the `(A)` headline readiness per `Assessment-Scope-V1_1.mdc`, excluding items explicitly deferred to V1.1, V1.x, V2, owner-only commercial action, or `(B)` procurement realism.

**Scoring basis:** Clean-slate assessment (2026-05-29), **rescored 2026-05-29** after engineering batches A–C/F and **batch D/E/F (#9–#22)** (real-LLM golden cohort shell, faithfulness floor env, snapshot IDOR API tests, sponsor PDF cross-surface test, promise-language linter, Key Vault private endpoint in `infra/terraform-private`, nav drift CI documentation; `infra/terraform-openai` root already present). Prior headline **80.13%** (post batch A–C/F). Total weight **121**; weighted score sum **9768**; readiness **9768 ÷ 121 = 80.73%**.

---

## 2. Executive Summary

### `(A)` Overall Headline Readiness

ArchLucid is a real, shippable V1-shaped product—not a prototype repo with aspirational docs. The codebase shows a bounded pilot→commit→export path, SQL-backed persistence, API/UI/CLI parity, merge-blocking SQL regression, trust and procurement templates, governance and audit depth, Azure-first IaC, and meaningful AI hardening (schema validation, RAG faithfulness fixtures, PilotStrict gates, cost budgets, ROI source classification, `pilot proof-packet`, support-bundle redaction manifest). The headline drag is **buyer-verifiable proof under production-like conditions**: live Azure OpenAI golden-cohort evidence is documented as credential-dependent; several operator surfaces still hide authority-run fields; and first-pilot navigation remains cognitively heavy despite new 20-minute and proof-packet runbooks.

### `(B)` Procurement / Market-Motion Realism

Enterprise buyers will still ask for CPA-issued SOC 2, third-party pen-test reports, named public references, and live Marketplace/Stripe checkout. These are **explicitly deferred** per `docs/library/V1_DEFERRED.md` (§6b–§6c) and must not reduce `(A)`. The Trust Center and self-assessment materials are honest interim evidence; rigid RFPs will stall until organizational assurance programs run (TB-135/TB-136 on V1.1 backlog).

### Commercial Picture

GTM materials are unusually complete for a founder-led stage: pricing philosophy, commercial decision packet, executive sponsor brief, differentiation proof packet, ROI model, order-form path, and **WHAT_NOT_TO_PROMISE** guardrails. Revenue motion remains **sales-led** (quote + pilot proof) because commerce un-hold and published references are deferred. Monetization risk is proof density: buyers must see a fast, labeled, source-backed first review—not a feature tour.

### Enterprise Picture

Enterprise depth exceeds typical V1: database-per-tenant topology, SCIM, SAML/OIDC diagnostics, 78-type durable audit, policy packs, pre-commit governance gate, Azure extractor Tier 1 (no tenant login), support bundles with redaction manifest, and production-like config lint. Blockers are **confidence artifacts** (environment-specific PASS/HOLD snapshots, scoped security closure on documented P0 backlog items) and **workflow native embedding** (ITSM/chat connectors are V1.1 contract).

### Engineering Picture

Engineering is strong but wide: warnings-as-errors, architecture invariants, OpenAPI snapshots, property tests, live API+SQL E2E, faithfulness/retrieval eval harnesses, and extensive TECH_BACKLOG discipline. Top engineering risks are **documented security gaps** (TB-071–TB-075), **UI/API contract split on run detail** (TB-106–TB-108), **cross-layer KPI divergence** (TB-103–TB-105), and **semantic drift** without scheduled credentialed real-LLM runs.

---

## 3. Weighted Quality Assessment

Qualities are ordered by **weighted deficiency signal**: `(100 − score) × weight`.

### Cutting-Edge AI Technology

- **Score:** 79
- **Weight:** 8
- **Weighted impact on readiness:** 632 / 121
- **Weighted deficiency signal:** 168
- **Justification:** Modern substrate is present: Azure OpenAI integration, structured outputs, RAG corpora, policy-pack grounding, semantic reranking, embedding drift guards, content safety, faithfulness eval (mean support ratio 0.857 on golden cohort per `docs/quality/faithfulness-report.md`), and trend rollup script. Weakness: frontier autonomy/graph-RAG/copiloting is intentionally constrained; **live** hosted model proof is indexed as credential-deferred in `docs/go-to-market/AI_EVIDENCE_APPENDIX.md`.
- **Tradeoffs:** Enterprise safety and determinism trade away “bleeding edge” demos that buyers compare to generic copilots.
- **Improvement recommendations:** Close TB-071 production search client; schedule credentialed real-LLM golden cohort; keep faithfulness floors visible in release evidence.
- **Disposition:** Evidence and eval hardening fixable in V1; exotic retrieval graphs better suited to V2 unless promoted.

### AI/Agent Readiness

- **Score:** 83
- **Weight:** 8
- **Weighted impact on readiness:** 656 / 121
- **Weighted deficiency signal:** 144
- **Justification:** Simulator/real modes are explicit; PilotStrict gates, schema validation, quality corpus CI, RAG grounding traces, and budget limits are implemented. `FirstValueReportBuilder` and proof packet paths surface execution mode and PilotStrict posture. Gap: continuous **hosted real-mode** attestation is not merge-blocking.
- **Tradeoffs:** Simulator-first CI is correct for cost and determinism but cannot fully prove semantic quality.
- **Improvement recommendations:** Wire optional CI job when `AZURE_OPENAI_*` secrets exist; attach model/deployment metadata to sponsor artifacts by default.
- **Disposition:** Mostly V1-fixable; credential provisioning is owner input.

### Marketability

- **Score:** 82
- **Weight:** 8
- **Weighted impact on readiness:** 656 / 121
- **Weighted deficiency signal:** 144
- **Justification:** Clear wedge—evidence-backed architecture reviews with exportable sponsor artifacts, trust center, and service-led offers. Weakness: market proof still depends on founder-led pilots and static demo packets rather than a published reference logo (deferred).
- **Tradeoffs:** Narrow “review system” positioning is more credible than “AI governance platform” but sounds smaller.
- **Improvement recommendations:** Lead every motion with `pilot proof-packet` output; tighten demo-proof-packets README to one SKU story.
- **Disposition:** V1-fixable for packaging; public reference is deferred.

### Adoption Friction

- **Score:** 79
- **Weight:** 6
- **Weighted impact on readiness:** 462 / 121
- **Weighted deficiency signal:** 138
- **Justification:** `FIRST_VALUE_20_MINUTES.md`, `FIRST_PILOT_OPERATOR_PATH.md`, config lint, doctor, extractor ZIP path, and identity-provider setup checklist reduce friction. Meaningful pilots still require SQL, auth mode decisions, and scope literacy (Pilot vs Operate).
- **Tradeoffs:** Enterprise controls necessarily increase setup surface.
- **Improvement recommendations:** Single Home CTA; default progressive disclosure in operator shell; bind proof collection to production-like config lint profile.
- **Disposition:** V1-fixable.

### Correctness

- **Score:** 90
- **Weight:** 8
- **Weighted impact on readiness:** 696 / 121
- **Weighted deficiency signal:** 104
- **Justification:** Broad automated coverage, SQL E2E, contract snapshots, architecture/dependency tests, sponsor cross-surface consistency tests, and ROI source catalog. Risks: run-detail UI reads authority endpoint fields that are null on live runs (TB-106); orphan savings KPI computed twice (TB-103).
- **Tradeoffs:** More tests increase maintenance but reduce silent drift.
- **Improvement recommendations:** Close TB-106–TB-108 and TB-103 with focused API/UI tests.
- **Disposition:** V1-fixable.

### Time-to-Value

- **Score:** 82
- **Weight:** 7
- **Weighted impact on readiness:** 560 / 121
- **Weighted deficiency signal:** 140
- **Justification:** 20-minute path and proof-packet CLI materially shorten time-to-sponsor-artifact. Still requires API+SQL+auth prerequisites; not a “click demo only” product.
- **Tradeoffs:** Honest labeling of simulator vs real avoids false speed claims.
- **Improvement recommendations:** Automate proof-packet step in `collect-first-pilot-proof.ps1` default; surface PASS/HOLD on Home.
- **Disposition:** V1-fixable.

### Proof-of-ROI Readiness

- **Score:** 88
- **Weight:** 5
- **Weighted impact on readiness:** 425 / 121
- **Weighted deficiency signal:** 75
- **Justification:** `RoiMetricSourceCatalogBuilder`, first-value report classifications, executive ROI API, and WHAT_NOT_TO_PROMISE guardrails are strong. Weakness: many lines remain `BenchmarkAssumption` until tenants supply baselines.
- **Tradeoffs:** Labeled assumptions are honest but weaker than customer-attested savings.
- **Improvement recommendations:** Embed ROI source table in proof-packet; prompt baseline capture in pilot onboarding.
- **Disposition:** V1-fixable.

### Usability

- **Score:** 82
- **Weight:** 3
- **Weighted impact on readiness:** 234 / 121
- **Weighted deficiency signal:** 66
- **Justification:** Operator shell, planning bridge, governance dashboards, and improved API problem hints exist. Run detail still under-renders cost, trust evidence, disposition coverage, and failure reasons (TECH_BACKLOG TB-106–TB-108).
- **Tradeoffs:** Full Operate surface increases navigation cost for first pilots.
- **Improvement recommendations:** Progressive disclosure; enrich run detail DTO.
- **Disposition:** V1-fixable.

### Stickiness

- **Score:** 79
- **Weight:** 6
- **Weighted impact on readiness:** 474 / 121
- **Weighted deficiency signal:** 126
- **Justification:** Compare, replay, graph, governance, advisory, and executive ROI support repeat use. Native ITSM/Teams/Slack loops are V1.1—not scored as V1 gaps.
- **Tradeoffs:** Depth without daily-tool embedding limits habit formation until connectors ship.
- **Improvement recommendations:** TB-057–TB-063 recurring review loop (without inventing parallel GRC).
- **Disposition:** V1 workflow polish fixable; connectors V1.1.

### Trustworthiness

- **Score:** 85
- **Weight:** 3
- **Weighted impact on readiness:** 249 / 121
- **Weighted deficiency signal:** 51
- **Justification:** PilotStrict, sponsor-safe proof gates, execution-mode labeling, redaction manifest, and conservative trust copy. Trust still depends on operators not forwarding simulator output as live AI proof.
- **Tradeoffs:** More disclaimers reduce marketing punch but increase enterprise honesty.
- **Improvement recommendations:** Fail closed on proof-packet when PilotStrict unsatisfied for sponsor handoff profile.
- **Disposition:** V1-fixable.

### Workflow Embeddedness

- **Score:** 75
- **Weight:** 3
- **Weighted impact on readiness:** 225 / 121
- **Weighted deficiency signal:** 75
- **Justification:** REST, CLI, UI, SCIM, Azure DevOps/GitHub CI references, and export/ZIP handoffs cover V1 automation. Daily work in Jira/ServiceNow/Teams is explicitly V1.1.
- **Tradeoffs:** Recipe-grade bridges are safer than half-built first-party connectors.
- **Improvement recommendations:** Keep integration recipes prominent; do not promise V1.1 connectors in V1 copy.
- **Disposition:** V1 recipes now; connectors V1.1.

### Security

- **Score:** 84
- **Weight:** 3
- **Weighted impact on readiness:** 246 / 121
- **Weighted deficiency signal:** 54
- **Justification:** STRIDE docs, ZAP baseline, RLS option, tenant DB topology, auth safety guards, pen-test templates, and owner-conducted testing narrative. **Documented P0 backlog:** production Azure Search client without tenant filter (TB-071); scope-to-identity binding gaps (TB-072); scoped snapshot IDOR risk (TB-073).
- **Tradeoffs:** Shipping breadth before closing every backlog security item is common but must be tracked honestly.
- **Improvement recommendations:** Prioritize TB-071–TB-073; Entra auth for Azure OpenAI (TB-080).
- **Disposition:** V1-fixable for code gaps; third-party pen test deferred (TB-136).

### Executive Value Visibility

- **Score:** 84
- **Weight:** 4
- **Weighted impact on readiness:** 320 / 121
- **Weighted deficiency signal:** 80
- **Justification:** Executive ROI summary, board-pack exports, first-value report, dashboards, and Grafana business-value rows exist. Some dashboard KPIs still client-derived (TB-103–TB-104).
- **Tradeoffs:** Rich dashboards can disagree with server truth if not unified.
- **Improvement recommendations:** Server-authoritative orphan and waiver KPIs.
- **Disposition:** V1-fixable.

### Differentiability

- **Score:** 81
- **Weight:** 4
- **Weighted impact on readiness:** 324 / 121
- **Weighted deficiency signal:** 76
- **Justification:** Evidence-linked manifests, audit, policy packs, and differentiation proof packet beat generic “AI assistant” stories. Needs more **repeatable** buyer-visible proof packets from real pilots.
- **Tradeoffs:** Specialized positioning limits TAM in first conversations.
- **Improvement recommendations:** Package one vertical demo proof packet with explicit limitations.
- **Disposition:** V1-fixable.

### Maintainability

- **Score:** 78
- **Weight:** 2
- **Weighted impact on readiness:** 156 / 121
- **Weighted deficiency signal:** 44
- **Justification:** Modular boundaries, invariants, generated clients, single DDL discipline, and TECH_BACKLOG traceability. Cost: very large solution and legacy compatibility paths.
- **Tradeoffs:** Modularity helps teams but hurts solo navigation.
- **Improvement recommendations:** Continue dependency constraint tests; close TB-027–TB-032 layering items incrementally.
- **Disposition:** V1 incremental.

### Architectural Integrity

- **Score:** 86
- **Weight:** 3
- **Weighted impact on readiness:** 258 / 121
- **Weighted deficiency signal:** 42
- **Justification:** Coherent authority pipeline, composition root, INV catalog, ADRs, contract snapshots, and advisory-only IaC posture per `docs/ARCHITECTURE_ON_ONE_PAGE.md`.
- **Tradeoffs:** Legacy config bridges and dual endpoints increase reasoning cost.
- **Improvement recommendations:** Finish invariant Wave B; reduce UI re-derivation of business rules.
- **Disposition:** V1-fixable.

### Reliability

- **Score:** 84
- **Weight:** 2
- **Weighted impact on readiness:** 168 / 121
- **Weighted deficiency signal:** 32
- **Justification:** Health checks, outbox, data-consistency probes, smoke/RC drills, live trial E2E, and integration correctness drill docs.
- **Tradeoffs:** Single-region V1 is intentional—not an active/active penalty.
- **Improvement recommendations:** Default staging evidence capture in release checklist sign-off.
- **Disposition:** V1 operational.

### Data Consistency

- **Score:** 80
- **Weight:** 2
- **Weighted impact on readiness:** 160 / 121
- **Weighted deficiency signal:** 40
- **Justification:** DbUp, orphan probes, remediation endpoints, and consistency runbooks. UI/server KPI divergence is a consistency risk for executives.
- **Tradeoffs:** Dry-run remediation is safer but needs operator discipline.
- **Improvement recommendations:** TB-103 server-side orphan metrics; expand consistency proof in pilot rollup.
- **Disposition:** V1-fixable.

### Explainability

- **Score:** 82
- **Weight:** 2
- **Weighted impact on readiness:** 164 / 121
- **Weighted deficiency signal:** 36
- **Justification:** Explain endpoints, provenance graph, evidence chains, retrieval traces, and citation-oriented faithfulness tests.
- **Tradeoffs:** Rich traces can overwhelm sponsors without summarization.
- **Improvement recommendations:** Short sponsor trace summary in proof-packet.
- **Disposition:** V1-fixable.

### Compliance Readiness

- **Score:** 78
- **Weight:** 2
- **Weighted impact on readiness:** 156 / 121
- **Weighted deficiency signal:** 44
- **Justification:** SOC self-assessment, CAIQ/SIG templates, audit export, policy packs—strong internal pack, not CPA attestation (deferred, `(B)` only).
- **Tradeoffs:** Self-assessment helps early buyers, not rigid SOC buyers.
- **Improvement recommendations:** Keep ASSURANCE_STATUS_CANONICAL wording synchronized with trust center.
- **Disposition:** V1 pack polish; CPA deferred.

### Procurement Readiness

- **Score:** 76
- **Weight:** 2
- **Weighted impact on readiness:** 152 / 121
- **Weighted deficiency signal:** 48
- **Justification:** Procurement pack, DPA template, subprocessors, and trust index are substantial; interim assurance remains the buyer friction point (`(B)`).
- **Tradeoffs:** Templates ≠ signed legal review.
- **Improvement recommendations:** Attach latest proof-packet manifest to procurement pack strict mode output.
- **Disposition:** V1 pack; external assurance deferred.

### Interoperability

- **Score:** 74
- **Weight:** 2
- **Weighted impact on readiness:** 148 / 121
- **Weighted deficiency signal:** 52
- **Justification:** OpenAPI, CLI, SCIM, extractor upload, GitHub/Azure DevOps references. V1.1 ITSM/chat surfaces are out of `(A)` scope.
- **Tradeoffs:** Stable REST beats brittle connectors.
- **Improvement recommendations:** OpenAPI/client drift operator note in proof artifacts.
- **Disposition:** V1 recipes; connector breadth V1.1.

### Commercial Packaging Readiness

- **Score:** 74
- **Weight:** 2
- **Weighted impact on readiness:** 148 / 121
- **Weighted deficiency signal:** 52
- **Justification:** `COMMERCIAL_DECISION_PACKET.md`, pricing, tiers, order form exist; first purchasable SKU should stay visually obvious on `/pricing` and pilot docs.
- **Tradeoffs:** SaaS + services flexibility can confuse if not sequenced.
- **Improvement recommendations:** Link every SKU to one proof-packet outcome.
- **Disposition:** V1 docs/UX.

### Decision Velocity

- **Score:** 72
- **Weight:** 2
- **Weighted impact on readiness:** 144 / 121
- **Weighted deficiency signal:** 56
- **Justification:** Quote path and commercial packet help; live checkout/Marketplace deferred per V1_DEFERRED §6b.
- **Tradeoffs:** Sales-led motion is appropriate for V1 but slower than self-serve.
- **Improvement recommendations:** 30-minute decision review template tied to proof-packet first page.
- **Disposition:** V1 process; commerce un-hold deferred.

### Policy and Governance Alignment

- **Score:** 82
- **Weight:** 2
- **Weighted impact on readiness:** 164 / 121
- **Weighted deficiency signal:** 36
- **Justification:** Policy packs, pre-commit gate, SoD approvals, governance dashboard, and bundled defaults.
- **Tradeoffs:** Starter packs are review prompts, not certification engines.
- **Improvement recommendations:** Visible pack version on commit screen.
- **Disposition:** V1-fixable.

### Auditability

- **Score:** 84
- **Weight:** 2
- **Weighted impact on readiness:** 168 / 121
- **Weighted deficiency signal:** 32
- **Justification:** 78 typed durable events, CSV export, coverage matrix with zero open durable gaps listed for prior mutating areas.
- **Tradeoffs:** Volume of event types increases reviewer learning curve.
- **Improvement recommendations:** proof-packet audit sample stays representative, not exhaustive.
- **Disposition:** V1-fixable presentation.

### Azure Compatibility and SaaS Deployment Readiness

- **Score:** 84
- **Weight:** 2
- **Weighted impact on readiness:** 168 / 121
- **Weighted deficiency signal:** 32
- **Justification:** Container Apps, SQL, Blob, Key Vault, Front Door/WAF patterns, Terraform roots, hosted AOAI posture. IaC gaps for OpenAI/Redis/Search/ACR documented (TB-091–TB-099).
- **Tradeoffs:** Azure-native focus narrows multi-cloud buyers until V1.1 analysis.
- **Improvement recommendations:** TB-093 terraform-openai skeleton; TB-091 KV private endpoint.
- **Disposition:** V1 IaC incremental.

### Traceability

- **Score:** 84
- **Weight:** 3
- **Weighted impact on readiness:** 252 / 121
- **Weighted deficiency signal:** 48
- **Justification:** Manifests, artifacts, provenance, audit correlation, OpenAPI snapshots, requirements traceability—major strength.
- **Tradeoffs:** High traceability increases cognitive load without summaries.
- **Improvement recommendations:** Triage index links in proof-packet README.
- **Disposition:** V1-fixable.

### Cognitive Load

- **Score:** 72
- **Weight:** 1
- **Weighted impact on readiness:** 68 / 121
- **Weighted deficiency signal:** 32
- **Justification:** Lowest raw score: large repo, many docs, Pilot vs Operate, simulator vs real, V1 vs V1.1 labels. Mitigations exist but do not fully collapse choices for new evaluators.
- **Tradeoffs:** Hiding truth would create false confidence.
- **Improvement recommendations:** Home dashboard “start here” strip; demote depth links until first commit.
- **Disposition:** V1-fixable.

### Availability

- **Score:** 77
- **Weight:** 1
- **Weighted impact on readiness:** 77 / 121
- **Weighted deficiency signal:** 23
- **Justification:** Health/SLO docs and probes exist; production SLA proof not established from available materials.
- **Tradeoffs:** Honest non-SLA wording preferred over synthetic claims.
- **Improvement recommendations:** scale-envelope-evidence in pilot proof folder.
- **Disposition:** V1 operational evidence.

### Performance

- **Score:** 78
- **Weight:** 1
- **Weighted impact on readiness:** 78 / 121
- **Weighted deficiency signal:** 22
- **Justification:** In-process pilot baselines and performance docs; not production SQL load proof at scale.
- **Tradeoffs:** Baselines protect regressions, not capacity planning.
- **Improvement recommendations:** Record observed timings in proof rollup without inventing SLA numbers.
- **Disposition:** V1 evidence capture.

### Scalability

- **Score:** 74
- **Weight:** 1
- **Weighted impact on readiness:** 74 / 121
- **Weighted deficiency signal:** 26
- **Justification:** Single-region default, scale envelope doc required for honest buyer language; optional failover IaC exists but not default.
- **Tradeoffs:** Multi-region active/active correctly deferred.
- **Improvement recommendations:** Keep buyer copy aligned with measured envelope only.
- **Disposition:** V1 documentation.

### Supportability

- **Score:** 88
- **Weight:** 1
- **Weighted impact on readiness:** 87 / 121
- **Weighted deficiency signal:** 13
- **Justification:** doctor, support-bundle, redaction manifest, triage index, correlation IDs, runbooks—standout strength.
- **Tradeoffs:** Bundles must stay redacted before external share.
- **Improvement recommendations:** proof-packet cross-links support-bundle command.
- **Disposition:** V1-fixable.

### Manageability

- **Score:** 80
- **Weight:** 1
- **Weighted impact on readiness:** 79 / 121
- **Weighted deficiency signal:** 21
- **Justification:** Config catalog, admin diagnostics, identity checklist, config lint profiles.
- **Tradeoffs:** Many knobs for enterprise admins.
- **Improvement recommendations:** Opinionated `production-like-hosted-pilot` profile as default lint target.
- **Disposition:** V1-fixable.

### Deployability

- **Score:** 82
- **Weight:** 1
- **Weighted impact on readiness:** 82 / 121
- **Weighted deficiency signal:** 18
- **Justification:** Docker, compose, Terraform, release smoke, v1-rc-drill scripts.
- **Tradeoffs:** Enterprise pilots still need identity/SQL decisions.
- **Improvement recommendations:** Package HANDOFF + config lint in release evidence bundle.
- **Disposition:** V1-fixable.

### Testability

- **Score:** 81
- **Weight:** 1
- **Weighted impact on readiness:** 81 / 121
- **Weighted deficiency signal:** 19
- **Justification:** Tiered tests, eval harnesses, live E2E, architecture tests; merged line gate at 75% (95% deferred V1.1).
- **Tradeoffs:** Live LLM tests credential-dependent.
- **Improvement recommendations:** Property tests for tenant scope on new queries.
- **Disposition:** V1-fixable.

### Extensibility

- **Score:** 76
- **Weight:** 1
- **Weighted impact on readiness:** 76 / 121
- **Weighted deficiency signal:** 24
- **Justification:** Custom handler guide, policy packs, composition-root registration; public plugin SDK/MCP/marketplace not V1 gates.
- **Tradeoffs:** Code extensibility ≠ ecosystem marketplace.
- **Improvement recommendations:** Keep handler sample tested in CI.
- **Disposition:** V1 docs; ecosystem V1.1/V2.

### Documentation

- **Score:** 88
- **Weight:** 1
- **Weighted impact on readiness:** 88 / 121
- **Weighted deficiency signal:** 12
- **Justification:** Exceptional depth: V1_SCOPE, V1_DEFERRED, START_HERE, runbooks, trust, engineering BUILD model.
- **Tradeoffs:** Discoverability vs volume.
- **Improvement recommendations:** Maintain canonical path discipline in START_HERE.
- **Disposition:** V1-fixable routing.

### Cost-Effectiveness

- **Score:** 79
- **Weight:** 1
- **Weighted impact on readiness:** 79 / 121
- **Weighted deficiency signal:** 21
- **Justification:** LLM budgets, cost estimates, embedding skip, pricing model; invoiced AOAI COGS not claimed.
- **Tradeoffs:** Budget caps protect COGS but can truncate output.
- **Improvement recommendations:** Per-run cost lines in proof-packet when traces exist.
- **Disposition:** V1-fixable.

### Template and Accelerator Richness

- **Score:** 72
- **Weight:** 1
- **Weighted impact on readiness:** 72 / 121
- **Weighted deficiency signal:** 28
- **Justification:** Rich inventory (policy packs, demo workspaces, ROI models, proof shapes); weakness is **routing** which accelerator to use first (TB-114–TB-118 theme).
- **Tradeoffs:** Volume without routing feels like clutter.
- **Improvement recommendations:** TB-114 job-to-accelerator map in demo-proof-packets README.
- **Disposition:** V1-fixable.

### Customer Self-Sufficiency

- **Score:** 71
- **Weight:** 1
- **Weighted impact on readiness:** 71 / 121
- **Weighted deficiency signal:** 29
- **Justification:** Hosted AOAI reduces LLM setup burden per V1_SCOPE §2.4; self-sufficiency still limited by SQL/auth/tenant topology literacy.
- **Tradeoffs:** White-glove identity help remains realistic for enterprise pilots (`(B)`).
- **Improvement recommendations:** Identity checklist + auth diagnostics in proof limitations.md when HOLD.
- **Disposition:** V1-fixable.

---

## Deferred Scope Uncertainty

All major deferrals cited in this assessment were located in:

- `docs/library/V1_DEFERRED.md` (§6b commerce/reference/design partner; §6c SOC2/pen test; §6d MCP/extension marketplace; §6 ITSM/chat V1.1)
- `docs/library/V1_SCOPE.md` §3 (non-goals)
- `.cursor/rules/Assessment-Scope-V1_1.mdc` and `.cursor/rules/V1_1-assurance-backlog.mdc`

No referenced deferral lacked source material in-repo.

---

## 4. Top 12 Most Important Weaknesses

1. **Proof gap under real hosted LLM:** Faithfulness and quality gates are strong offline; live golden-cohort proof remains credential-dependent, so buyers cannot independently verify semantic quality from repo artifacts alone.
2. **Run-detail operator fidelity:** Authority run endpoint omits fields the UI expects (cost estimate, trust card, results), causing “unavailable” signals during live reviews (TB-106–TB-108).
3. **Documented security P0/P1 backlog:** Production Azure Search client and scope-to-identity binding gaps are tracked but not closed (TB-071–TB-075).
4. **Executive KPI divergence risk:** Orphan savings and waiver windows can be computed differently in UI vs backend (TB-103–TB-104).
5. **Cognitive overload for first evaluators:** Many equivalent doc entry points and product modes despite new 20-minute path.
6. **Procurement assurance friction (`(B)`):** Honest trust materials do not satisfy CPA SOC 2 or third-party pen-test demands—by design for `(A)`, still blocks some enterprises.
7. **Commerce motion is sales-led:** Live Stripe/Marketplace un-hold deferred; slows self-serve decision velocity without hurting headline scope.
8. **IaC/runtime parity gaps:** Azure OpenAI, Search, Redis, ACR roots incomplete in Terraform while code expects configured services (TB-091–TB-099).
9. **Workflow not embedded in daily ITSM/chat tools:** V1.1 connector contract; REST/CLI/export must carry integration story for V1.
10. **ROI narrative still assumption-heavy:** Source classification is excellent; customer-provided baselines remain optional in most pilots.
11. **Breadth-induced drift risk:** OpenAPI, UI types, CLI, and docs must stay synchronized across a very large surface.
12. **Owner-only proof milestones:** Published reference, design partner, and external assurance require customer/vendor decisions engineering cannot complete.

---

## 5. Top 6 Monetization Blockers

1. Buyers will not pay for “AI architecture review” without a **proof-packet** from their own committed run showing PilotStrict-safe, mode-labeled output.
2. **Assumption-classified ROI** is necessary but insufficient; pilots without tenant baselines feel like vendor math.
3. **No published reference customer** (deferred) increases discount pressure and extends founder-led selling cycles.
4. **No live self-serve checkout** (deferred) forces quote-to-cash, slowing impulse conversion.
5. **Simulator-only demos** without explicit labeling destroy trust and kill expansion conversations.
6. Competitive evaluations compare to copilots; ArchLucid must win on **auditability + manifest evidence**, not “more AI,” in the first 30 minutes.

---

## 6. Top 6 Enterprise Adoption Blockers

1. Security questionnaires demanding **CPA SOC 2 / third-party pen test** (deferred; address under `(B)` with self-assessment + roadmap).
2. **Production Azure Search tenancy** not provably enforced until TB-071 closes.
3. **Identity complexity** (Entra/SAML/API key/SCIM) requires careful handoff despite diagnostics and checklist.
4. **IaC gaps** for OpenAI/Search/Key Vault private endpoint undermine “everything in Terraform” buyer expectations.
5. **Operator training burden** for Pilot vs Operate and governance-heavy paths.
6. **Integration expectations** for ServiceNow/Jira/Teams—must be labeled V1.1 to avoid procurement bait-and-switch.

---

## 7. Top 6 Engineering Risks

1. **Semantic drift** in real LLM outputs without scheduled credentialed eval runs.
2. **Cross-tenant data paths** if TB-071–TB-075 slip behind feature velocity.
3. **API/UI contract split** on run detail causing wrong operator decisions pre-commit.
4. **Dual KPI pipelines** misleading executive dashboards (TB-103–TB-104).
5. **Configuration mistakes** (CORS, JWT, API key mode) in production-like hosts despite advisors.
6. **Legacy bridges and terminology** (review vs run, ArchLucid vs ArchiForge keys) confusing operators and automations.

---

## 8. Most Important Truth

**ArchLucid is ready to pilot but not ready to oversell:** the product can produce governed, exportable review evidence, yet revenue and enterprise trust depend on operators consistently generating **labeled, source-backed proof packets from real committed runs**—not on the size of the feature matrix.

---

## 9. Top Improvement Opportunities

*Already shipped in-repo (do not re-prompt):* `pilot proof-packet` CLI, `FIRST_VALUE_20_MINUTES.md`, `RoiMetricSourceCatalogBuilder`, support-bundle `redaction-manifest.json`, `AI_EVIDENCE_APPENDIX.md`, faithfulness trend script, sponsor cross-surface consistency tests (markdown path), identity-provider setup checklist, `COMMERCIAL_DECISION_PACKET.md`, `WHAT_NOT_TO_PROMISE.md`.

**Shipped 2026-05-29 (implementation batches — rescored above):** **#1** Azure Search SDK + production-like config lint HOLD; **#2** scope-to-identity binding middleware (existing + tests); **#3** authority run detail enrichment (cost/trust/results); **#4** run-detail governance/failure banners; **#5** disposition coverage on run detail (existing `RunDetailOutcomeCards`); **#6–#7** executive orphan + expiring-waiver KPIs on `GET /v1/roi/executive-summary`; **#8** `roi-metric-sources.md` via proof-packet + `roiMetricSources` on pilot-run-deltas; **#12** `AllowedTools` dispatch guard; **#14** home `PilotStartHereStrip`; **#15** `collect-first-pilot-proof.ps1` proof-packet + config lint when `-RunId`; **#18** demo-proof-packets job map; **#19** `docs/library/IAC_RUNTIME_PARITY.md`; **#21** PilotStrict HOLD in proof-packet `environment.json` + stderr warn; **#9** `Invoke-RealLlmGoldenCohort.ps1` + optional `real-llm-golden-cohort.yml`; **#10** existing `infra/terraform-openai` root (documented in parity map); **#11** Key Vault PE + `key_vault_id` in `infra/terraform-private/network.tf` (TB-091); **#13** `ScopedSnapshotReadIdorIntegrationTests` (TB-073); **#16** sponsor PDF cross-surface test; **#17** `ARCHLUCID_FAITHFULNESS_MIN_SUPPORT_RATIO` + trend `-EnforceFaithfulness`; **#20** `check_proof_summary_promise_language.py`; **#22** nav drift CI job names documented + pre-commit cross-ref.

**Still open (engineering):** none from the prior improvement list; remaining gaps are **backlog-sized** (TB-071–TB-073 full repository hardening beyond API guards, TB-093/TB-091 production apply, merge-blocking faithfulness when owner enables). **Deferred (owner):** **#23–#25**.

### 1. Wire Production Azure Search Client with Tenant OData Filter

- **Why it matters:** TB-071 is security-critical; without a real client, cross-tenant retrieval cannot be verified in production.
- **Expected impact:** Closes a documented P0; improves Security (+4–6), Correctness (+2–3), Cutting-Edge AI (+1–2).
- **Affected qualities:** Security, Correctness, Cutting-Edge AI Technology, Data Consistency.
- **Actionability:** Fully actionable now.
- **Impact of running the prompt:** Directly improves Security (+4–6 pts), Correctness (+2–3 pts). Weighted readiness impact: **+0.15–0.25%**.

```text
Implement production Azure AI Search client registration with mandatory tenant OData filter on every search and delete.

Scope:
- ArchLucid.Retrieval (Azure Search adapter) and Host.Composition DI registration.
- Use existing AzureSearchTenantScopeFilterBuilder; fail startup in Production when Search is configured but filter builder is not applied.
- Add integration tests with fake/search emulator or test double proving filter is always appended.

Files to inspect: Azure search client implementations under ArchLucid.Retrieval/, composition root, appsettings Production samples, TECH_BACKLOG TB-071.

Acceptance criteria:
- No code path calls search without tenant filter when Mode is production-like.
- Tests fail if filter omitted.
- docs/library/CONFIGURATION_REFERENCE.md notes required Search + filter configuration.
- Production-like config lint **HOLD** when `Retrieval:VectorIndex` is not `AzureSearch` or `Retrieval:AzureSearch:Endpoint` is missing — enforced via `AzureAiSearchProductionLikeConfigurationLint` (owner 2026-05-29).

Constraints:
- Do not change index schema without migration note.
- Do not weaken simulator-only dev paths.
- Do not claim TB-071 closed without tests.
```

### 2. Enforce Scope-to-Identity Binding at API Ingress

- **Why it matters:** TB-072 — ApiKey/DevBypass must not resolve tenant scope from headers alone.
- **Expected impact:** Security (+5–7), Trustworthiness (+2–3).
- **Affected qualities:** Security, Trustworthiness, Architectural Integrity.
- **Actionability:** Fully actionable now.
- **Impact of running the prompt:** Security (+5–7 pts), Trustworthiness (+2–3 pts). Weighted readiness impact: **+0.2–0.35%**.

```text
Harden API ingress so tenant/workspace/project scope is bound to authenticated identity, not client-supplied headers alone.

Scope:
- ArchLucid.Api middleware/filters for ApiKey, JwtBearer, and DevelopmentBypass paths.
- Reconcile x-tenant-id (and related headers) against claims or API key metadata; reject mismatches with 403 + ProblemDetails.
- Add ArchLucid.Api.Tests integration tests for mismatch scenarios.

Acceptance criteria:
- Documented matrix in docs/library/CUSTOMER_TRUST_AND_ACCESS.md matches behavior.
- Tests cover at least ApiKey wrong-tenant header and Jwt missing claim cases.
- Owner 2026-05-29: no existing pilots rely on header-only ApiKey tenant selection — enforce binding without legacy carve-out; add BREAKING_CHANGES.md only if wire contract changes for misconfigured clients.

Constraints:
- Do not disable DevelopmentBypass in Development.
- Do not log secrets or full tokens.
```

### 3. Enrich Authority RunDetail for Operator Cost, Trust, and Results

- **Why it matters:** TB-106 — live run detail shows null cost/trust/results while architecture endpoint has them.
- **Expected impact:** Usability (+5–7), Trustworthiness (+3–4), Correctness (+2–3).
- **Affected qualities:** Usability, Trustworthiness, Correctness, Executive Value Visibility.
- **Actionability:** Fully actionable now.
- **Impact of running the prompt:** Usability (+5–7 pts), Correctness (+2–3 pts). Weighted readiness impact: **+0.25–0.4%**.

```text
Unify operator run detail data: extend GET /v1/authority/runs/{runId} (or documented composite endpoint) so RunDetailDto includes agentExecutionLlmCostEstimate, trustEvidenceCard, and results[] currently only on architecture run detail.

Scope:
- ArchLucid.Application run detail projection, Authority controller, OpenAPI snapshot, ArchLucid.Api.Client regeneration, archlucid-ui run detail loader/types.
- Prefer single server projection reused by UI over a second client-side fetch unless performance requires otherwise.

Acceptance criteria:
- Live integration test proves non-null cost/trust/results for a committed simulator run fixture.
- OpenAPI snapshot updated; UI shows cost card without "unavailable" for fixture run.
- No duplicate business logic in UI parsers.

Constraints:
- Do not remove architecture endpoint fields.
- Do not change commit/execute semantics.
```

### 4. Surface Governance Warnings and Failure Reasons on Run Detail

- **Why it matters:** TB-107 — operators approve without seeing hasGovernanceWarnings / lastFailureReason.
- **Expected impact:** Usability (+3–5), Trustworthiness (+2–4).
- **Affected qualities:** Usability, Trustworthiness, Policy and Governance Alignment.
- **Actionability:** Fully actionable now.
- **Impact of running the prompt:** Usability (+3–5 pts). Weighted readiness impact: **+0.1–0.2%**.

```text
Render RunRecord.hasGovernanceWarnings and lastFailureReason on operator run detail with stable data-testid selectors.

Scope:
- archlucid-ui run detail sections; ensure DTO exposes fields from authority run detail after improvement 3 or parallel API change.
- Playwright or Vitest fixture asserting visible warning banner when fixture run has warnings.

Acceptance criteria:
- Warning/failure blocks appear above Commit CTA when data present.
- docs/library/operator-shell.md updated with screenshot-less description.

Constraints:
- No stack traces in UI.
- Use existing OperatorApiProblem patterns for errors.
```

### 5. Show Disposition Coverage and Commit-Blocking Failures Before Commit

- **Why it matters:** TB-108 — commit-blocking failures hidden until too late.
- **Expected impact:** Usability (+3–4), Correctness (+2–3), Policy and Governance Alignment (+1–2).
- **Affected qualities:** Usability, Correctness, Policy and Governance Alignment.
- **Actionability:** Fully actionable now.
- **Impact of running the prompt:** Usability (+3–4 pts), Correctness (+2–3 pts). Weighted readiness impact: **+0.1–0.2%**.

```text
Expose findingCoverageSummary.dispositionCoverage and hasCommitBlockingFailures on run detail and near CommitRunButton.

Scope:
- UI components on run detail; wire fields from GetRunDetailAsync projection already computed server-side.
- Disable or warn on Commit when hasCommitBlockingFailures true (match API pre-commit gate behavior).

Acceptance criteria:
- Vitest/Playwright test: fixture with blocking failure shows HOLD state on commit affordance.
- Align wording with docs/runbooks/QUALITY_GATE_REJECTION.md.

Constraints:
- Do not bypass server-side gate.
```

### 6. Server-Authoritative Orphan KPI for Executive Dashboard

- **Why it matters:** TB-103 — UI heuristic diverges from OrphanedResourceClassifier.
- **Expected impact:** Correctness (+4–6), Executive Value Visibility (+3–5), Data Consistency (+2–3).
- **Affected qualities:** Correctness, Executive Value Visibility, Data Consistency, Trustworthiness.
- **Actionability:** Fully actionable now.
- **Impact of running the prompt:** Correctness (+4–6 pts), Executive Value Visibility (+3–5 pts). Weighted readiness impact: **+0.2–0.35%**.

```text
Expose backend-computed orphan candidate count and estimated savings via API; remove client-side run-potential-savings-parser heuristic from executive dashboard.

Scope:
- ArchLucid.Application service + GET endpoint (or extend executive ROI summary), ArchLucid.Api controller, OpenAPI, UI ExecutiveRoiDashboardLiveKpiCards.tsx, delete or gate client parser.

Acceptance criteria:
- Unit tests on service match OrphanedResourceClassifier outputs for fixtures.
- UI displays API values only; test proves parser not used.
- docs/library/API_CONTRACTS.md updated.

Constraints:
- Do not change orphan classification algorithm without tests.
```

### 7. Server-Authoritative Expiring-Waiver KPI Window

- **Why it matters:** TB-104 — 14-day waiver window is UI-only.
- **Expected impact:** Correctness (+2–4), Executive Value Visibility (+2–3).
- **Affected qualities:** Correctness, Executive Value Visibility, Policy and Governance Alignment.
- **Actionability:** Fully actionable now.
- **Impact of running the prompt:** Correctness (+2–4 pts). Weighted readiness impact: **+0.1–0.15%**.

```text
Move expiring-waiver count into executive ROI or governance summary API with explicit window parameters (default 14 days UTC).

Scope:
- Backend query + DTO; UI removes client date math.
- Tests for boundary dates.

Acceptance criteria:
- Single source of truth documented in PILOT_SCORECARD_API.md or executive ROI doc.
- UI test uses mocked API counts.

Constraints:
- Window must be configurable via query param with documented default.
```

### 8. Embed ROI Metric Source Table in Pilot Proof-Packet

- **Why it matters:** Proof-packet exists but buyers need ROI source kinds in the same folder as run evidence.
- **Expected impact:** Proof-of-ROI Readiness (+3–5), Trustworthiness (+2–3), Procurement Readiness (+1–2).
- **Affected qualities:** Proof-of-ROI Readiness, Trustworthiness, Time-to-Value.
- **Actionability:** Fully actionable now.
- **Impact of running the prompt:** Proof-of-ROI (+3–5 pts). Weighted readiness impact: **+0.15–0.25%**.

```text
Extend `archlucid pilot proof-packet` to emit roi-metric-sources.md (and optional .json) using RoiMetricSourceCatalogBuilder / value report snapshot for the run window.

Scope:
- ArchLucid.Cli Commands/PilotProofPacketCommand.cs, reuse Application Value services, ArchLucid.Cli.Tests.

Acceptance criteria:
- proof-summary.md links to roi-metric-sources.md.
- No sponsor row without RoiMetricSourceKind.
- Tests assert BenchmarkAssumption labeling for default model rows.

Constraints:
- No new pricing numbers.
- Redact tenant secrets in JSON output.
```

### 9. Add Credentialed Real-LLM Eval Workflow (Skip-Graceful Without Secrets)

- **Why it matters:** Closes the highest AI proof gap when credentials exist; documents honest skip when not.
- **Expected impact:** AI/Agent Readiness (+4–6), Cutting-Edge AI (+3–5), Trustworthiness (+2–3).
- **Affected qualities:** AI/Agent Readiness, Cutting-Edge AI Technology, Testability, Trustworthiness.
- **Actionability:** Partially actionable now (workflow wiring); **credential values are DEFERRED** (see improvement 23).
- **Impact of running the prompt:** AI/Agent Readiness (+3–4 pts) once secrets exist. Weighted readiness impact: **+0.15–0.25%** after first green run.

```text
Add scripts/ci/Invoke-RealLlmGoldenCohort.ps1 and optional GitHub workflow job that:
- Runs only when AZURE_OPENAI_ENDPOINT and AZURE_OPENAI_API_KEY (or workload identity) are present.
- Writes docs/quality/REAL_LLM_SESSION_<date>.md from REAL_LLM_RUN_EVIDENCE_TEMPLATE.md.
- Exits 0 with "SKIPPED_NO_CREDENTIALS" message when secrets absent (non-blocking for PRs).
- Links from AI_EVIDENCE_APPENDIX.md.

Acceptance criteria:
- Local dry-run documented.
- collect-first-pilot-proof.ps1 -SponsorHandoff includes ai-readiness-gate.json when real-mode configured and evidence file exists.

Constraints:
- Never print secrets.
- Do not fail default CI when secrets missing.
```

### 10. Terraform OpenAI Root Skeleton (TB-093)

- **Why it matters:** Code expects Azure OpenAI; IaC parity gap blocks “all infra in Terraform” buyer narrative.
- **Expected impact:** Azure Compatibility (+4–6), Deployability (+2–4), Security (+1–2).
- **Affected qualities:** Azure Compatibility and SaaS Deployment Readiness, Deployability, Security.
- **Actionability:** Fully actionable now.
- **Impact of running the prompt:** Azure Compatibility (+4–6 pts). Weighted readiness impact: **+0.1–0.2%**.

```text
Create infra/terraform-openai/ with documented variables for account, deployment, private endpoint hooks, and content filter placeholders; wire README cross-links from terraform-container-apps.

Acceptance criteria:
- terraform validate passes for module.
- docs/library/CONTAINERIZATION.md or azure doc lists apply order.
- No secrets in tfvars examples.

Constraints:
- Do not apply to production subscriptions from agent.
- Align with TB-080 Entra auth direction in comments.
```

### 11. Key Vault Private Endpoint in terraform-private (TB-091)

- **Why it matters:** KV public access disabled without private endpoint breaks managed deployability story.
- **Expected impact:** Azure Compatibility (+3–5), Security (+2–4).
- **Affected qualities:** Azure Compatibility, Security, Deployability.
- **Actionability:** Fully actionable now.
- **Impact of running the prompt:** Security (+2–4 pts), Azure Compatibility (+3–5 pts). Weighted readiness impact: **+0.1–0.2%**.

```text
Add azurerm_private_endpoint + privatelink.vaultcore.azure.net DNS zone to infra/terraform-private for Key Vault when private stack enabled.

Acceptance criteria:
- Documented in terraform README and CONFIGURATION_KEY_VAULT.md.
- validate/plan instructions for operators.

Constraints:
- Feature-flag via existing private stack variables.
```

### 12. Runtime Agent AllowedTools Enforcement (TB-082)

- **Why it matters:** Advisory allowlists are not security boundaries for tool dispatch.
- **Expected impact:** Security (+3–5), AI/Agent Readiness (+2–3).
- **Affected qualities:** Security, AI/Agent Readiness, Correctness.
- **Actionability:** Fully actionable now.
- **Impact of running the prompt:** Security (+3–5 pts). Weighted readiness impact: **+0.1–0.2%**.

```text
Enforce AgentTask.AllowedTools at RealAgentExecutor (or handler dispatch facade): deny dispatch when tool not in allowlist; empty allowlist means no tools (document breaking change if previously unrestricted).

Acceptance criteria:
- Unit tests for allowed/denied tools.
- docs/library/CUSTOM_AGENT_HANDLER_GUIDE.md updated.

Constraints:
- Preserve simulator behavior explicitly.
```

### 13. Scoped Snapshot Read Integration Tests (TB-073)

- **Why it matters:** IDOR risk on GetByIdAsync patterns in SingleCatalog/dev modes.
- **Expected impact:** Security (+3–4), Correctness (+2–3), Testability (+1–2).
- **Affected qualities:** Security, Correctness, Testability.
- **Actionability:** Fully actionable now.
- **Impact of running the prompt:** Security (+3–4 pts). Weighted readiness impact: **+0.1–0.15%**.

```text
Add ArchLucid.Api.Tests integration tests proving tenant A cannot read tenant B snapshot/finding IDs across representative repositories.

Acceptance criteria:
- Tests run in SQL test lane with two tenants.
- Failures reference TB-073 in comment.

Constraints:
- Do not use ConfigureAwait(false) in tests.
```

### 14. Operator Home “Start Pilot” Progressive Disclosure Strip

- **Why it matters:** Reduces cognitive load and adoption friction for first session.
- **Expected impact:** Cognitive Load (+5–7), Usability (+3–4), Time-to-Value (+2–3).
- **Affected qualities:** Cognitive Load, Usability, Adoption Friction, Time-to-Value.
- **Actionability:** Fully actionable now.
- **Impact of running the prompt:** Cognitive Load (+5–7 pts), Adoption Friction (+2–3 pts). Weighted readiness impact: **+0.15–0.25%**.

```text
Add a Home dashboard strip with 4 steps: doctor → create/execute/commit → pilot proof-packet → optional buyer-proof-pack; hide Operate sidebar links until first commit or explicit "Show Operate".

Scope:
- archlucid-ui Home section component; Vitest + Playwright smoke.

Acceptance criteria:
- Links to FIRST_VALUE_20_MINUTES.md in help text.
- data-testid stable selectors per UI-Stable-Selectors rule.

Constraints:
- Do not remove Operate features.
- Do not auto-run destructive actions.
```

### 15. Default collect-first-pilot-proof to Include proof-packet + config lint

- **Why it matters:** Release checklist recommends both; automation reduces missed evidence.
- **Expected impact:** Supportability (+2–3), Deployability (+2–3), Procurement Readiness (+1–2).
- **Affected qualities:** Supportability, Deployability, Procurement Readiness, Time-to-Value.
- **Actionability:** Fully actionable now.
- **Impact of running the prompt:** Time-to-Value (+2–3 pts). Weighted readiness impact: **+0.05–0.1%**.

```text
Update scripts/collect-first-pilot-proof.ps1 to invoke `dotnet run --project ArchLucid.Cli -- pilot proof-packet` when -RunId provided, and config lint with production-like-hosted-pilot profile by default; document flags to skip.

Acceptance criteria:
- Generated first-pilot-command-center.md links proof-packet path.
- Tests or script analyzer for parameter validation.

Constraints:
- Never write secrets into artifacts folder.
```

### 16. Expand Cross-Surface Tests to Sponsor PDF Export Path

- **Why it matters:** Markdown consistency tests exist; PDF wrapper may drift.
- **Expected impact:** Correctness (+2–3), Executive Value Visibility (+1–2).
- **Affected qualities:** Correctness, Testability, Executive Value Visibility.
- **Actionability:** Fully actionable now.
- **Impact of running the prompt:** Correctness (+2–3 pts). Weighted readiness impact: **+0.05–0.1%**.

```text
Extend SponsorArtifactCrossSurfaceConsistencyTests (or sibling) to assert PilotRunDeltas and execution mode labels match in SponsorOnePagerPdfBuilder output for shared fixture.

Acceptance criteria:
- PDF text extraction or builder-level unit test without binary golden file churn.

Constraints:
- Simulator-only fixture.
```

### 17. Faithfulness Eval Warn Threshold → Optional CI Fail

- **Why it matters:** Prevents silent RAG regression when stable.
- **Expected impact:** AI/Agent Readiness (+2–4), Reliability (+1–2).
- **Affected qualities:** AI/Agent Readiness, Cutting-Edge AI Technology, Reliability.
- **Actionability:** Fully actionable now.
- **Impact of running the prompt:** AI/Agent Readiness (+2–4 pts). Weighted readiness impact: **+0.1–0.15%**.

```text
Add ARCHLUCID_FAITHFULNESS_MIN_SUPPORT_RATIO env override to eval_agent_faithfulness.py; default keep warn; document merge-blocking toggle in AGENT_OUTPUT_EVALUATION.md.

Acceptance criteria:
- Current mean 0.8571 passes default floor 0.80.
- Trend script surfaces failure in Markdown.

Constraints:
- Do not enable merge-blocking in CI without comment in workflow.
```

### 18. Demo-Proof-Packets Job-to-Accelerator Map (TB-114)

- **Why it matters:** Template richness without routing confuses first buyers.
- **Expected impact:** Template and Accelerator Richness (+4–6), Marketability (+1–2).
- **Affected qualities:** Template and Accelerator Richness, Marketability, Cognitive Load.
- **Actionability:** Fully actionable now.
- **Impact of running the prompt:** Template richness (+4–6 pts). Weighted readiness impact: **+0.05–0.1%**.

```text
Update docs/go-to-market/demo-proof-packets/README.md with a table: buyer job → existing accelerator/proof packet → prerequisites → limitations.

Acceptance criteria:
- No new ZIP templates required.
- Links to DIFFERENTIATION_PROOF_PACKET.md and FIRST_VALUE_20_MINUTES.md.

Constraints:
- Do not duplicate pricing numbers.
```

### 19. IaC Parity One-Pager for Missing Runtime Services

- **Why it matters:** Buyers and SREs need honest mapping of code config → Terraform roots.
- **Expected impact:** Azure Compatibility (+2–3), Documentation (+1), Manageability (+1).
- **Affected qualities:** Azure Compatibility, Documentation, Deployability.
- **Actionability:** Fully actionable now.
- **Impact of running the prompt:** Azure Compatibility (+2–3 pts). Weighted readiness impact: **+0.05%**.

```text
Add docs/library/IAC_RUNTIME_PARITY.md listing each appsettings dependency (OpenAI, Redis, Cosmos, Search, Service Bus, ACR) with Terraform root status TB-091–TB-099 and owner action.

Acceptance criteria:
- Linked from CONTAINERIZATION.md and TRUST_CENTER Azure section.

Constraints:
- Mark advisory vs required per environment profile.
```

### 20. Proof-Packet WHAT_NOT_TO_PROMISE Linter

- **Why it matters:** Sales artifacts must not overclaim deferred assurance/commerce.
- **Expected impact:** Marketability (+2–3), Trustworthiness (+2–3), Procurement Readiness (+1).
- **Affected qualities:** Marketability, Trustworthiness, Differentiability.
- **Actionability:** Fully actionable now.
- **Impact of running the prompt:** Trustworthiness (+2–3 pts). Weighted readiness impact: **+0.05%**.

```text
Add scripts/ci/check_proof_summary_promise_language.py scanning proof-summary.md templates and generated output for forbidden phrases from WHAT_NOT_TO_PROMISE.md (SOC certified, guaranteed savings, MCP GA, etc.); warn-only initially.

Acceptance criteria:
- Unit test with fixture strings.
- Document command in CLI_USAGE.md.

Constraints:
- Allow explicit negation phrases ("do not claim SOC certified").
```

### 21. PilotStrict HOLD Blocks proof-packet Sponsor-Safe Flag

- **Why it matters:** Prevents accidental forward of non-sponsor-grade real-mode claims.
- **Expected impact:** Trustworthiness (+3–5), AI/Agent Readiness (+2–3).
- **Affected qualities:** Trustworthiness, AI/Agent Readiness, Proof-of-ROI Readiness.
- **Actionability:** Fully actionable now.
- **Impact of running the prompt:** Trustworthiness (+3–5 pts). Weighted readiness impact: **+0.1–0.15%**.

```text
When PilotProofPacketCommand builds proof-summary.md, set sponsorHandoffRecommended=false and nextAction=HOLD when PilotBuyerSafeEvidenceGateEvaluator fails PilotStrict checks; exit 0 but print stderr warning.

Acceptance criteria:
- Cli test with fixture gate failure.
- limitations.md lists gate reasons.

Constraints:
- Do not block packet generation entirely (support/debug still need bundle).
```

### 22. Merge-Blocking Route/Tier/Policy Nav Drift Guard on Controller Edits

- **Why it matters:** Prevents operator/security doc drift when APIs change.
- **Expected impact:** Maintainability (+2–3), Security (+1–2), Documentation (+1).
- **Affected qualities:** Maintainability, Security, Testability.
- **Actionability:** Fully actionable now.
- **Impact of running the prompt:** Maintainability (+2–3 pts). Weighted readiness impact: **+0.05%**.

```text
Verify pre-commit hook runs route/tier/policy/nav registry sync when ArchLucid.Api/Controllers change; add CI job duplicate if hook skipped.

Acceptance criteria:
- CI fails when registry intentionally desynced in test branch.
- docs/library/ROUTE_TIER_POLICY_NAV_MATRIX.md mentions CI job name.

Constraints:
- Keep ARCHLUCID_PRE_COMMIT_FULL_AUDIT=1 optional for speed.
```

### 23. DEFERRED — Provide Azure OpenAI Credentials for Live Golden Cohort

- **Reason deferred:** Live eval requires owner-supplied `AZURE_OPENAI_*` (or workload identity) secrets not present in the assessment environment.
- **Specific information needed later:** Target deployment name, endpoint URL, whether to use API key vs Entra MI, approved CI secret names, and whether merge-blocking is desired after first green run.
- **Affected qualities:** AI/Agent Readiness, Cutting-Edge AI Technology, Trustworthiness, Marketability.
- **Expected impact:** +0.15–0.3% `(A)` once evidence file exists and is linked from proof rollups.

### 24. DEFERRED — Publish Named Reference Customer + Case Study

- **Reason deferred:** Requires customer permission, legal approval, and approved metrics/logo.
- **Specific information needed later:** Customer name, logo rights, quotable outcomes, publication date, discount re-rate decision.
- **Affected qualities:** Marketability, Proof-of-ROI, Differentiability, Decision Velocity (`(B)` primarily).

### 25. DEFERRED — Commerce Un-Hold and CPA SOC 2 / Third-Party Pen Test Programs

- **Reason deferred:** Stripe live keys, Marketplace `Published` state, CPA SOC 2, and vendor pen test require owner/vendor/legal/budget actions (V1_DEFERRED §6b–§6c; TB-135/TB-136).
- **Specific information needed later:** Stripe/Marketplace readiness checklist completion; auditor/vendor selection; target report window; NDA distribution model.
- **Affected qualities:** Decision Velocity, Commercial Packaging, Procurement Readiness, Compliance (`(B)` for assurance).

---

## 10. Prompt Batching Guidance

- **Batch A — Security & data plane (highest risk):** Improvements **1, 2, 12, 13** (Search tenant filter, scope binding, AllowedTools, snapshot IDOR tests). Shared context: Auth, Retrieval, Api ingress.
- **Batch B — Operator run fidelity:** Improvements **3, 4, 5, 14** (RunDetail enrichment, warnings, disposition UI, Home strip). Shared context: run detail UI + authority DTOs.
- **Batch C — Executive truth & ROI proof:** Improvements **6, 7, 8, 16, 21** (orphan KPI, waiver KPI, proof-packet ROI table, PDF consistency, PilotStrict HOLD).
- **Batch D — AI evidence & eval:** Improvements **9, 17** (real-LLM workflow shell, faithfulness fail threshold). Run after Batch A if Search/RAG implicated.
- **Batch E — IaC & deploy narrative:** Improvements **10, 11, 19, 15** (terraform-openai, KV PE, parity doc, collect-first-pilot-proof defaults).
- **Batch F — GTM guardrails & templates:** Improvements **18, 20, 22** (accelerator map, promise linter, nav drift CI).
- **Deferred (owner/customer):** Improvements **23, 24, 25** — no implementation prompt until inputs supplied.

---

## 11. Pending Questions for Later

### DEFERRED — Provide Azure OpenAI Credentials for Live Golden Cohort

- Which subscription/deployment is approved for eval writes?
- API key vs Entra workload identity for CI?
- Should the workflow be merge-blocking after the first green run?

### DEFERRED — Publish Named Reference Customer + Case Study

- Which customer approved public name, logo, and metrics?
- Who signs legal/marketing approval?

### DEFERRED — Commerce Un-Hold and CPA SOC 2 / Third-Party Pen Test Programs

- Is Stripe production + webhook secret ready?
- Is Marketplace offer ready to publish?
- Which CPA/pen-test vendor and budget window are approved?

### Enforce Scope-to-Identity Binding at API Ingress

- **Resolved 2026-05-29:** **No** legacy pilots use header-only tenant selection with API keys; TB-072 may ship without a grandfather carve-out. See [`PENDING_QUESTIONS.md`](../PENDING_QUESTIONS.md) *Resolved 2026-05-29 (API key scope binding — no legacy pilots)*.

### Wire Production Azure Search Client with Tenant OData Filter

- **Resolved 2026-05-29:** **All production-like profiles** — set `Retrieval:VectorIndex=AzureSearch` and configure `Retrieval:AzureSearch:*`; not limited to reranking-only paths. See [`PENDING_QUESTIONS.md`](../PENDING_QUESTIONS.md) *Resolved 2026-05-29 (Azure AI Search — production-like requirement)*.

---

*Assessment generated: 2026-05-29; rescored same day after implementation batch (+0.99% headline). Method: clean-slate first principles; materials limited to in-repo docs, code, scripts, and CI definitions. No subagents.*
