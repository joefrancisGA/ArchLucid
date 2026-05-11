> **Scope:** Independent first-principles weighted readiness assessment for the current ArchLucid V1 solution using the user-provided quality model; not a roadmap commitment, sales forecast, or substitute for customer diligence.

# ArchLucid Assessment – Weighted Readiness 76.76%

## 2. Executive Summary

### Overall Readiness

ArchLucid is materially more than a prototype: it has a coherent V1 scope contract, a working product architecture, versioned APIs, SQL-backed persistence, RLS, audit, governance, observability, Terraform assets, test tiers, and buyer-facing documentation. The weighted readiness is **76.76%**. That means it is credible for carefully managed V1 pilots, but not yet frictionless enough for broad self-serve adoption or low-touch enterprise procurement.

The largest readiness drag is not raw engineering absence. It is the gap between the product's depth and a buyer's ability to understand, trust, and prove value quickly without founder or sales-engineer translation. The strongest areas are traceability, testability, Azure fit, observability, and documentation breadth. The weakest weighted areas are adoption friction, marketability, time-to-value, proof-of-ROI readiness, workflow embeddedness, and usability.

### Commercial Picture

The commercial story is strong in concept: architecture risk review, defensible findings, executive summaries, traceability, and governance evidence are real buyer problems. Pricing, packaging, ROI methodology, trial design, quote capture, and datasheet materials exist. However, the commercial surface still has too much internal language, placeholder contact/checkout material, heavy evaluation steps, and limited proof packaging from actual non-demo evidence. Items explicitly deferred to V1.1, such as live Stripe key un-hold, Marketplace publication, public references, and owner-gated assurance milestones, are not penalized here.

### Enterprise Picture

The enterprise posture is unusually developed for a V1 product: Entra/JWT, API keys, RBAC, RLS, append-only audit, policy packs, governance workflows, SCIM, DPA/subprocessor materials, CAIQ/SIG-style artifacts, incident communications, SLOs, and procurement pack automation are present. The practical blocker is confidence conversion: much of the evidence is self-attested, draft/template-based, or intentionally conservative. That is acceptable for V1 pilots but will slow procurement unless the product produces a crisp evidence pack per buyer.

### Engineering Picture

The engineering shape is solid: bounded .NET projects, lightweight Dapper persistence, DbUp migrations, OpenAPI snapshots, SQL integration tests, UI live E2E coverage, k6 smoke, ZAP/Schemathesis, Stryker infrastructure, OTel metrics, Grafana dashboards, and Terraform modules. The main engineering risk is **complexity**: many surfaces, many docs, several test modes, simulator-vs-real execution nuance, and keeping **Release** builds and the fast-core test filter green after every change. (A historical `CS9113` unread-parameter issue in `AuthorityDrivenArchitectureRunCommitOrchestrator` is **resolved** in tree; re-run the fast-core Release command after large merges for confidence.)

## 3. Weighted Quality Assessment

Qualities are ordered by weighted deficiency signal: `(100 - score) * weight`. Weighted impact on readiness is the quality's contribution to the final 76.76 percentage points.

### Adoption Friction

- **Score:** 70
- **Weight:** 6
- **Weighted impact on readiness:** 4.12 percentage points
- **Weighted deficiency signal:** 180
- **Justification:** The V1 happy path is documented and supported by UI/API/CLI, but the evaluator must navigate many concepts: Pilot vs Operate, runs, manifests, authority, governance, demo data, simulator vs real mode, and several release/test paths. The product can produce value, but the first human journey remains too explanation-heavy.
- **Tradeoffs:** The depth is useful for enterprise buyers, but it creates a steep first-session ramp. Hiding advanced surfaces too aggressively could weaken enterprise confidence.
- **Improvement recommendations:** Compress the buyer first-run path into one guided review narrative; reduce internal terms in the UI; make one proof route dominate the first 30 minutes.
- **Fixability:** Fixable in V1.

### Marketability

- **Score:** 78
- **Weight:** 8
- **Weighted impact on readiness:** 6.12 percentage points
- **Weighted deficiency signal:** 176
- **Justification:** The positioning is credible and differentiated: evidence-linked architecture risk reviews with executive summaries and audit trail. Datasheet, positioning, pricing, trust, and trial docs exist. The remaining issue is buyer clarity: some materials still expose internal mechanics or placeholders, and the story needs sharper proof from real/non-demo evidence.
- **Tradeoffs:** Honest scope labels protect trust, but too many caveats dilute urgency.
- **Improvement recommendations:** Make the public story outcome-first; remove placeholder contact/checkout residue from buyer surfaces; produce a single proof-of-value pack buyers can understand in five minutes.
- **Fixability:** Fixable in V1.

### Time-to-Value

- **Score:** 76
- **Weight:** 7
- **Weighted impact on readiness:** 5.22 percentage points
- **Weighted deficiency signal:** 168
- **Justification:** There are strong first-value mechanisms: `archlucid try`, demo seed, first-value report, sponsor PDF, trial bootstrap, and a V1 Core Pilot path. Time-to-value is constrained by deployment/auth choices and by the mental effort needed to know which path to use.
- **Tradeoffs:** Simulator mode creates a fast demo without LLM cost, while real mode proves production behavior but introduces latency, quota, and configuration variance.
- **Improvement recommendations:** Make the default evaluator journey one hosted path with a preloaded review and one next action; put real-mode proof behind a generated evidence snapshot.
- **Fixability:** Fixable in V1.

### Proof-of-ROI Readiness

- **Score:** 72
- **Weight:** 5
- **Weighted impact on readiness:** 3.53 percentage points
- **Weighted deficiency signal:** 140
- **Justification:** The ROI model is thoughtful and instrumented: baseline review-cycle capture, pilot deltas, first-value reports, LLM call counts, audit row counts, and proof-of-value snapshot assembly are defined. The weakness is that the method is stronger than the packaged evidence; buyers still need operator assembly to convert metrics into a purchase argument.
- **Tradeoffs:** Avoiding inflated ROI claims is correct, but conservative methodology must still produce a decisive sponsor artifact.
- **Improvement recommendations:** Automate a buyer-safe proof pack from a real tenant run, with demo-data warnings and redaction by default.
- **Fixability:** Fixable in V1.

### Workflow Embeddedness

- **Score:** 66
- **Weight:** 3
- **Weighted impact on readiness:** 1.94 percentage points
- **Weighted deficiency signal:** 102
- **Justification:** REST, CLI, webhooks, CloudEvents, Service Bus, API client, and Teams patterns exist. First-party Jira, ServiceNow, Confluence, and Slack are explicitly outside V1 or later-window items and are not penalized. Even so, V1 still requires customers to bridge the last mile into their architecture review, ITSM, or knowledge-management workflows.
- **Tradeoffs:** Keeping V1 integration paths generic reduces engineering scope, but enterprise adoption often depends on one concrete workflow landing cleanly.
- **Improvement recommendations:** Add copy-paste recipes for customer-owned webhook bridges to common enterprise systems without claiming first-party connector support.
- **Fixability:** Partly V1; deeper first-party connectors are V1.1/V2 per explicit scope.

### Usability

- **Score:** 68
- **Weight:** 3
- **Weighted impact on readiness:** 2.00 percentage points
- **Weighted deficiency signal:** 96
- **Justification:** The UI has many surfaces and tests, including accessibility coverage and live E2E paths. But recent UI feedback materials identify terminology leakage, route clutter, raw IDs/JSON in places, demo/admin surface confusion, and overloaded home/CTA patterns. These are practical adoption blockers.
- **Tradeoffs:** Exposing powerful operator controls helps advanced users, but V1 buyers need a calmer path.
- **Improvement recommendations:** Convert the first-session UI from system-operation language to review-outcome language; hide raw diagnostic details behind expandable advanced controls.
- **Fixability:** Fixable in V1.

### Differentiability

- **Score:** 78
- **Weight:** 4
- **Weighted impact on readiness:** 3.06 percentage points
- **Weighted deficiency signal:** 88
- **Justification:** The combination of agent pipeline, findings, explainability trace, provenance graph, governance, audit, and exportable artifacts is meaningfully differentiated from generic AI chat and traditional EA catalogs. The weakness is that buyers may not immediately see the difference unless the demo proves it.
- **Tradeoffs:** A new category can be powerful but requires clear education.
- **Improvement recommendations:** Center the demo on "finding → evidence → decision → sponsor artifact" rather than on internal pipeline vocabulary.
- **Fixability:** Fixable in V1.

### Correctness

- **Score:** 78
- **Weight:** 4
- **Weighted impact on readiness:** 3.06 percentage points
- **Weighted deficiency signal:** 88
- **Justification:** There is broad unit, integration, contract, property, SQL, and UI test coverage. Correctness is still limited by real-LLM variability, quality-gate configuration, and the need to **re-verify** broad changes against the Release fast-core filter. Simulator correctness is stronger than real-world architecture judgment correctness.
- **Tradeoffs:** Determinism supports CI and demos; real mode needs ongoing evals and tolerance bands.
- **Improvement recommendations:** Fix the build warning/error; expand real-mode and golden-corpus scoring around customer-like briefs; make quality gates visible in proof packs.
- **Fixability:** Fixable in V1 for build and eval expansion; continuous model-quality work remains ongoing.

### Executive Value Visibility

- **Score:** 80
- **Weight:** 4
- **Weighted impact on readiness:** 3.14 percentage points
- **Weighted deficiency signal:** 80
- **Justification:** Sponsor brief, datasheet, first-value report, sponsor PDF, value reports, pricing philosophy, and ROI model are present. The value is visible, but it is spread across many artifacts and sometimes mixed with implementation detail.
- **Tradeoffs:** Executive artifacts must be concise, while technical proof must remain available for diligence.
- **Improvement recommendations:** Create one executive proof packet per pilot that includes before/after delta, top risks, evidence chain, confidence, and next commercial step.
- **Fixability:** Fixable in V1.

### Trustworthiness

- **Score:** 76
- **Weight:** 3
- **Weighted impact on readiness:** 2.24 percentage points
- **Weighted deficiency signal:** 72
- **Justification:** Trust infrastructure is strong: traceability, audit, RLS, threat model, security scans, content safety, prompt redaction, and procurement evidence. The trust story remains partly self-attested and real-output quality still needs buyer-visible validation. Third-party pen test publication and PGP key drop are explicitly V1.1 and not penalized.
- **Tradeoffs:** Honest self-attestation is better than overclaiming; some buyers will still require external evidence.
- **Improvement recommendations:** Strengthen V1 trust by making every generated claim traceable to evidence and by packaging current controls without implying certifications.
- **Fixability:** V1 for packaging and claim discipline; external attestations are later/owner-gated.

### Decision Velocity

- **Score:** 68
- **Weight:** 2
- **Weighted impact on readiness:** 1.33 percentage points
- **Weighted deficiency signal:** 64
- **Justification:** Pricing, quote forms, order form, trial design, and ROI model exist. Decisions will still slow because buyer proof, procurement evidence, and next-step CTA are not yet one clean motion. Live commerce un-hold is V1.1 and not penalized.
- **Tradeoffs:** Sales-led V1 is realistic for enterprise architecture software, but it raises founder/sales dependency.
- **Improvement recommendations:** Make the sales-led path crisp: quote request, proof pack, order form, procurement pack, and pilot success scorecard should connect without manual explanation.
- **Fixability:** Fixable in V1.

### Procurement Readiness

- **Score:** 70
- **Weight:** 2
- **Weighted impact on readiness:** 1.37 percentage points
- **Weighted deficiency signal:** 60
- **Justification:** Procurement pack, DPA, MSA, trust center, CAIQ/SIG, SOC2 roadmap, subprocessors, incident policy, and SLO docs exist. Several artifacts are explicitly templates, self-assessments, placeholders, or legal-review-required drafts. That is acceptable for pilots, but enterprise procurement will ask for final answers.
- **Tradeoffs:** Drafting early is valuable; sending draft-like artifacts without clear labeling can damage credibility.
- **Improvement recommendations:** Add strict artifact classification and buyer-safe redaction checks to the procurement pack.
- **Fixability:** V1 for pack hardening; legal/attestation completion may require user/external input.

### Compliance Readiness

- **Score:** 72
- **Weight:** 2
- **Weighted impact on readiness:** 1.41 percentage points
- **Weighted deficiency signal:** 56
- **Justification:** Compliance evidence is structured and transparent: self-assessment, CAIQ/SIG, DPA, DSAR, retention, audit, SOC2 roadmap, and control matrices. Formal certifications are not claimed and are not V1 requirements. Readiness is limited by self-assessed status and open G-001 SOC2 funding questions.
- **Tradeoffs:** The current posture is honest but not enough for high-control buyers without exceptions.
- **Improvement recommendations:** Make the compliance pack explicitly tiered: available now, under NDA, later attestation, and customer-required inputs.
- **Fixability:** V1 for clarity; formal attestation is later/owner-gated.

### Architectural Integrity

- **Score:** 82
- **Weight:** 3
- **Weighted impact on readiness:** 2.41 percentage points
- **Weighted deficiency signal:** 54
- **Justification:** The architecture is internally coherent: API, application, decisioning, persistence, worker, UI, CLI, and infra have clear boundaries. ADRs and C4 docs support this. Complexity and historical seams remain, but the V1 boundary is now explicit.
- **Tradeoffs:** Rich bounded contexts reduce monolith risk but increase navigation cost.
- **Improvement recommendations:** Keep tightening the Core Pilot path and avoid adding externally visible coordinator-only surfaces.
- **Fixability:** Mostly V1 maintenance.

### Security

- **Score:** 82
- **Weight:** 3
- **Weighted impact on readiness:** 2.41 percentage points
- **Weighted deficiency signal:** 54
- **Justification:** Fail-closed auth defaults, DevelopmentBypass guards, RBAC, API keys, JWT, RLS, private endpoint posture, ZAP, Schemathesis, Gitleaks, CodeQL, content safety, redaction, and log-injection guidance are all present. The main risks are configuration drift, self-attested assurance, and sensitive trace retention controls.
- **Tradeoffs:** Persisting prompts and traces supports forensics but increases privacy and access-control burden.
- **Improvement recommendations:** Ensure buyer-safe defaults for trace persistence and make production-like configuration validation impossible to miss.
- **Fixability:** V1.

### Interoperability

- **Score:** 74
- **Weight:** 2
- **Weighted impact on readiness:** 1.45 percentage points
- **Weighted deficiency signal:** 52
- **Justification:** Versioned REST, OpenAPI, AsyncAPI, CloudEvents, webhooks, Service Bus, CLI, and .NET client exist. V1 lacks first-party connectors to several systems by explicit design, so the score reflects generic interoperability rather than turnkey enterprise embedding.
- **Tradeoffs:** Generic integration primitives are durable but require customer implementation.
- **Improvement recommendations:** Publish tested recipes for common webhook consumers and make the .NET client path obvious.
- **Fixability:** V1 for recipes; first-party connectors later.

### Maintainability

- **Score:** 74
- **Weight:** 2
- **Weighted impact on readiness:** 1.45 percentage points
- **Weighted deficiency signal:** 52
- **Justification:** The system is modular and well documented, but the repo is large, documentation-heavy, and has many guard scripts, scopes, and modes. Strict rules (e.g. **CS9113** on unread primary-constructor parameters) catch small hygiene breaks early — they are good guardrails if fixed quickly.
- **Tradeoffs:** Strict rules improve long-term quality but increase contributor burden.
- **Improvement recommendations:** Fix build hygiene quickly; reduce duplicate concept maps; keep "where to change X" docs short and authoritative.
- **Fixability:** V1.

### Commercial Packaging Readiness

- **Score:** 75
- **Weight:** 2
- **Weighted impact on readiness:** 1.47 percentage points
- **Weighted deficiency signal:** 50
- **Justification:** Tiers, prices, pilot pricing, order form, quote path, and feature gates are documented. The score is constrained by placeholder checkout URL and the split between list pricing, interim Stripe bundled SKU, quote path, and deferred live-commerce activation.
- **Tradeoffs:** Having both sales-led and self-serve language is realistic but can confuse buyers.
- **Improvement recommendations:** Make sales-led V1 the primary path and hide or label self-serve checkout affordances until production-ready.
- **Fixability:** V1.

### AI/Agent Readiness

- **Score:** 76
- **Weight:** 2
- **Weighted impact on readiness:** 1.49 percentage points
- **Weighted deficiency signal:** 48
- **Justification:** Agent simulation, real mode, fallback client, agent output quality scoring, eval corpus, prompt regression, content safety, and trace persistence exist. The gap is proof that real model outputs are consistently useful across non-demo customer-like briefs.
- **Tradeoffs:** Real evals cost time/tokens and create data-handling concerns, but they are necessary for buyer trust.
- **Improvement recommendations:** Expand real-mode benchmark/eval artifacts and report quality trends by agent type.
- **Fixability:** V1 for initial expansion; ongoing after launch.

### Reliability

- **Score:** 78
- **Weight:** 2
- **Weighted impact on readiness:** 1.53 percentage points
- **Weighted deficiency signal:** 44
- **Justification:** Health checks, circuit breakers, outbox, retry guidance, SLO docs, synthetic probes, k6, and runbooks exist. Reliability is limited by optional/skipped external probes when variables are unset and by the need for deployed environment evidence.
- **Tradeoffs:** Making probes optional keeps forks green but weakens production assurance unless required by policy.
- **Improvement recommendations:** Make staging probe status a release-readiness input and archive synthetic results in proof packs.
- **Fixability:** V1.

### Data Consistency

- **Score:** 80
- **Weight:** 2
- **Weighted impact on readiness:** 1.57 percentage points
- **Weighted deficiency signal:** 40
- **Justification:** SQL is authoritative, migrations are managed, idempotency exists for create, commit is retry-safe after success, orphan probes and remediation APIs exist, and RLS is documented. Some list paths use `NOLOCK` intentionally for dashboard-grade reads, which is acceptable but must remain clearly bounded.
- **Tradeoffs:** Stale reads improve responsiveness under contention but should not leak into authoritative reads.
- **Improvement recommendations:** Keep consistency matrix tied to endpoint classes and add buyer-safe language for stale dashboard reads.
- **Fixability:** V1.

### Cognitive Load

- **Score:** 62
- **Weight:** 1
- **Weighted impact on readiness:** 0.61 percentage points
- **Weighted deficiency signal:** 38
- **Justification:** This is the weakest raw score. The product and repo require understanding many abstractions before value feels simple. Documentation is abundant, but abundance itself becomes load.
- **Tradeoffs:** Enterprise systems need precision; early evaluators need less vocabulary.
- **Improvement recommendations:** Create a "review package" vocabulary layer above runs/manifests/authority for buyer-facing surfaces.
- **Fixability:** V1.

### Traceability

- **Score:** 88
- **Weight:** 3
- **Weighted impact on readiness:** 2.59 percentage points
- **Weighted deficiency signal:** 36
- **Justification:** Traceability is a core strength: explainability traces, provenance graph, audit correlation, OpenAPI snapshots, requirements-to-tests traceability, trace IDs, and artifact bundles are well developed.
- **Tradeoffs:** Traceability depth can expose internal concepts if not translated.
- **Improvement recommendations:** Keep trace depth, but render buyer-facing evidence as concise chains.
- **Fixability:** Mostly strong now; incremental V1 polish.

### Policy and Governance Alignment

- **Score:** 82
- **Weight:** 2
- **Weighted impact on readiness:** 1.61 percentage points
- **Weighted deficiency signal:** 36
- **Justification:** Policy packs, effective governance resolution, pre-commit gate, approval workflows, segregation of duties, SLA escalation, audit events, and dashboards are in scope. This is a strong V1 differentiator.
- **Tradeoffs:** Governance can overwhelm first-time users if presented too early.
- **Improvement recommendations:** Keep governance as Operate layer until the pilot has produced a review artifact.
- **Fixability:** V1.

### Explainability

- **Score:** 84
- **Weight:** 2
- **Weighted impact on readiness:** 1.65 percentage points
- **Weighted deficiency signal:** 32
- **Justification:** Explainability traces, aggregate explanations, citations, faithfulness checks, fallback counters, and provenance graph support strong explainability. The main limitation is that faithfulness checks remain heuristic and must be presented as decision support, not truth guarantees.
- **Tradeoffs:** Deterministic fallback protects users from weak LLM narratives but may feel less fluent.
- **Improvement recommendations:** Show explanation completeness/faithfulness indicators in sponsor proof artifacts.
- **Fixability:** V1.

### Customer Self-Sufficiency

- **Score:** 69
- **Weight:** 1
- **Weighted impact on readiness:** 0.68 percentage points
- **Weighted deficiency signal:** 31
- **Justification:** There are strong docs, support bundles, quickstarts, troubleshooting, and CLI diagnostics. Self-sufficiency is weakened by the number of paths and by the need to distinguish local demo, hosted SaaS, pilot, staging, simulator, real mode, and procurement flows.
- **Tradeoffs:** Precise docs reduce support tickets for experts but can overwhelm buyers.
- **Improvement recommendations:** Add a short "when stuck during pilot" rescue playbook linked from the UI and CLI output.
- **Fixability:** V1.

### Template and Accelerator Richness

- **Score:** 70
- **Weight:** 1
- **Weighted impact on readiness:** 0.69 percentage points
- **Weighted deficiency signal:** 30
- **Justification:** Architecture request templates, integration recipes, procurement templates, ROI models, and finding-engine templates exist. The gap is polished, buyer-ready accelerators for common enterprise evaluation scenarios.
- **Tradeoffs:** More templates can worsen doc sprawl if not curated.
- **Improvement recommendations:** Publish a small set of canonical accelerators: Azure web app review, regulated data flow, cost-risk review, and governance approval package.
- **Fixability:** V1.

### Azure Compatibility and SaaS Deployment Readiness

- **Score:** 85
- **Weight:** 2
- **Weighted impact on readiness:** 1.67 percentage points
- **Weighted deficiency signal:** 30
- **Justification:** Azure-native posture is strong: Entra, Azure SQL, Blob, Key Vault, Service Bus, Front Door/WAF, Container Apps, OpenAI, Terraform modules, private endpoints, and cost docs. Some hosted probes are optional and live commerce activation is deferred.
- **Tradeoffs:** Azure focus improves implementation clarity but narrows buyer fit.
- **Improvement recommendations:** Keep Azure as the explicit V1 lane and avoid implying multi-cloud parity.
- **Fixability:** Strong now; V1 polish.

### Auditability

- **Score:** 86
- **Weight:** 2
- **Weighted impact on readiness:** 1.69 percentage points
- **Weighted deficiency signal:** 28
- **Justification:** Append-only audit store, typed event catalog, event-count guard, CSV export, correlation IDs, audit coverage matrix, and durable governance events provide strong auditability.
- **Tradeoffs:** Audit depth must be paired with retention and PII discipline.
- **Improvement recommendations:** Keep audit matrix updated with every mutating route and highlight audit examples in procurement pack.
- **Fixability:** Strong now; continuous.

### Scalability

- **Score:** 72
- **Weight:** 1
- **Weighted impact on readiness:** 0.71 percentage points
- **Weighted deficiency signal:** 28
- **Justification:** Container Apps, SQL indexes, k6, outbox, worker separation, and scaling docs exist. There is limited evidence of larger production-like sustained usage, and multi-region active/active is explicitly out of V1.
- **Tradeoffs:** V1 pilot scale does not need enterprise-wide scale, but buyers will ask for the path.
- **Improvement recommendations:** Add a concise scaling envelope based on measured k6 and cost profiles.
- **Fixability:** V1 for pilot-scale evidence; larger scale later.

### Performance

- **Score:** 73
- **Weight:** 1
- **Weighted impact on readiness:** 0.72 percentage points
- **Weighted deficiency signal:** 27
- **Justification:** k6 CI smoke, manual hotpath baseline, BenchmarkDotNet, SLO tiers, and real-mode benchmark script exist. The weakness is limited current measured evidence across realistic datasets and real AOAI.
- **Tradeoffs:** Tight thresholds can create CI noise; loose thresholds reduce confidence.
- **Improvement recommendations:** Archive current k6 and real-mode measurements with each release candidate.
- **Fixability:** V1.

### Stickiness

- **Score:** 74
- **Weight:** 1
- **Weighted impact on readiness:** 0.73 percentage points
- **Weighted deficiency signal:** 26
- **Justification:** Golden manifests, comparisons, audit, governance, policy packs, alerts, and learning signals can create stickiness. Stickiness depends on repeated workflow embedding, which is not yet turnkey.
- **Tradeoffs:** Governance stickiness is powerful but usually follows initial value proof.
- **Improvement recommendations:** Make "second review" and "compare to prior review" central after first success.
- **Fixability:** V1.

### Availability

- **Score:** 74
- **Weight:** 1
- **Weighted impact on readiness:** 0.73 percentage points
- **Weighted deficiency signal:** 26
- **Justification:** 99.9% SLO docs, health endpoints, Prometheus rules, Grafana, and synthetic probe workflows exist. Availability confidence is limited by optional probe configuration and lack of long-running production evidence.
- **Tradeoffs:** Pre-contractual targets are appropriate for V1; contractual SLAs need operational history.
- **Improvement recommendations:** Require staging hosted probe configuration for release readiness and store probe history.
- **Fixability:** V1.

### Manageability

- **Score:** 76
- **Weight:** 1
- **Weighted impact on readiness:** 0.75 percentage points
- **Weighted deficiency signal:** 24
- **Justification:** Configuration, health, support bundles, version endpoint, runbooks, dashboards, and admin APIs support manageability. The number of configuration switches raises operator risk.
- **Tradeoffs:** Configurability supports pilots but requires guardrails.
- **Improvement recommendations:** Add one production configuration summary command/report that highlights unsafe defaults.
- **Fixability:** V1.

### Cost-Effectiveness

- **Score:** 76
- **Weight:** 1
- **Weighted impact on readiness:** 0.75 percentage points
- **Weighted deficiency signal:** 24
- **Justification:** Cost model, LLM call metrics, token usage, Azure cost docs, and pilot pricing exist. Cost-effectiveness depends on real run volumes and model choices; current proof is modelled more than observed.
- **Tradeoffs:** Simulator keeps demo cost low; real mode proves value but consumes LLM budget.
- **Improvement recommendations:** Include per-run LLM cost envelope in proof packs.
- **Fixability:** V1.

### Accessibility

- **Score:** 78
- **Weight:** 1
- **Weighted impact on readiness:** 0.76 percentage points
- **Weighted deficiency signal:** 22
- **Justification:** Accessibility docs, public accessibility route, axe tests, jsx-a11y posture, and annual review cadence exist. Full end-user validation remains limited.
- **Tradeoffs:** Automated checks catch many issues but not all usability barriers.
- **Improvement recommendations:** Include a short accessibility smoke checklist in release readiness.
- **Fixability:** V1.

### Deployability

- **Score:** 78
- **Weight:** 1
- **Weighted impact on readiness:** 0.76 percentage points
- **Weighted deficiency signal:** 22
- **Justification:** Docker Compose, Container Apps, Terraform, DbUp, readiness checks, release scripts, and CI/CD workflows exist. Deployability is reduced by optional/customer-specific roots and the **operational** need to validate each target environment explicitly.
- **Tradeoffs:** Multiple deployment profiles aid development and pilots but complicate the standard path.
- **Improvement recommendations:** Keep one reference SaaS stack order as the canonical deploy path and make all others clearly optional.
- **Fixability:** V1.

### Evolvability

- **Score:** 78
- **Weight:** 1
- **Weighted impact on readiness:** 0.76 percentage points
- **Weighted deficiency signal:** 22
- **Justification:** ADRs, modular projects, versioned APIs, policy packs, integration events, and deferred-scope docs support evolution. The risk is the number of seams and maintenance maps.
- **Tradeoffs:** Designed extension points help future growth but can feel heavy in V1.
- **Improvement recommendations:** Keep future membranes, such as MCP, outside core compile-time dependencies as documented.
- **Fixability:** Strong direction; continuous.

### Extensibility

- **Score:** 80
- **Weight:** 1
- **Weighted impact on readiness:** 0.78 percentage points
- **Weighted deficiency signal:** 20
- **Justification:** Finding engines, policy packs, integrations, webhooks, CLI, API clients, and Terraform modules provide extension paths. Some extension stories are deliberately deferred.
- **Tradeoffs:** Extensibility without governance can become support burden.
- **Improvement recommendations:** Document the supported extension ladder: config, policy pack, webhook, API client, custom engine.
- **Fixability:** V1.

### Change Impact Clarity

- **Score:** 82
- **Weight:** 1
- **Weighted impact on readiness:** 0.80 percentage points
- **Weighted deficiency signal:** 18
- **Justification:** Comparison, replay, manifest deltas, OpenAPI drift checks, changelog, ADRs, and test traceability provide strong change clarity. Raw IDs and internal terminology can weaken buyer comprehension.
- **Tradeoffs:** Exact IDs matter to operators; sponsors need impact summaries.
- **Improvement recommendations:** Pair every technical delta with a human-readable business/review impact line.
- **Fixability:** V1.

### Supportability

- **Score:** 82
- **Weight:** 1
- **Weighted impact on readiness:** 0.80 percentage points
- **Weighted deficiency signal:** 18
- **Justification:** Correlation IDs, support bundles, health, version, logs, runbooks, trace IDs, and diagnostics are strong. Supportability is weakened by broad surface area and optional telemetry setup.
- **Tradeoffs:** Deep diagnostics can expose sensitive data if bundled carelessly.
- **Improvement recommendations:** Keep support bundles redacted by default and document triage order per symptom.
- **Fixability:** V1.

### Modularity

- **Score:** 84
- **Weight:** 1
- **Weighted impact on readiness:** 0.82 percentage points
- **Weighted deficiency signal:** 16
- **Justification:** The solution is decomposed across API, application, decisioning, context ingestion, knowledge graph, persistence, retrieval, provenance, CLI, UI, worker, and test support projects. Modularity is a strength.
- **Tradeoffs:** Many small modules increase navigation overhead.
- **Improvement recommendations:** Maintain ownership maps and avoid cross-layer shortcuts.
- **Fixability:** Strong now.

### Observability

- **Score:** 86
- **Weight:** 1
- **Weighted impact on readiness:** 0.84 percentage points
- **Weighted deficiency signal:** 14
- **Justification:** OTel meters, activity sources, business KPIs, trace IDs, Grafana dashboards, Prometheus rules, SLO docs, and runbooks are strong.
- **Tradeoffs:** Metrics are only useful if exporters are configured in deployed environments.
- **Improvement recommendations:** Add an observability readiness checklist to release handoff.
- **Fixability:** Strong now; deployment-dependent.

### Documentation

- **Score:** 86
- **Weight:** 1
- **Weighted impact on readiness:** 0.84 percentage points
- **Weighted deficiency signal:** 14
- **Justification:** Documentation breadth and discipline are excellent, including scope headers, indexes, runbooks, ADRs, buyer materials, and test maps. The downside is volume and occasional placeholder/draft residue.
- **Tradeoffs:** More docs improve traceability but can reduce clarity.
- **Improvement recommendations:** Curate the five-doc spine ruthlessly and keep depth docs out of first-session paths.
- **Fixability:** V1.

### Testability

- **Score:** 88
- **Weight:** 1
- **Weighted impact on readiness:** 0.86 percentage points
- **Weighted deficiency signal:** 12
- **Justification:** Testability is a major strength: fast core, full regression, SQL integration, live UI E2E, OpenAPI snapshots, property tests, mutation testing, k6, ZAP, Schemathesis, and benchmark jobs. Keep the **Release** fast-core command in routine use so regressions are caught before narrative readiness claims drift from CI.
- **Tradeoffs:** Many tiers require clear operator discipline.
- **Improvement recommendations:** Keep Release fast-core green after substantive changes; keep release-readiness commands short and documented.
- **Fixability:** V1.

### Azure Ecosystem Fit

- **Score:** 88
- **Weight:** 1
- **Weighted impact on readiness:** 0.86 percentage points
- **Weighted deficiency signal:** 12
- **Justification:** The product fits Azure well: Entra, Azure SQL, Azure OpenAI, Key Vault, Service Bus, Container Apps, Front Door/WAF, private endpoints, Azure-native Terraform, and Azure Marketplace planning.
- **Tradeoffs:** Azure-native focus may reduce appeal for non-Azure enterprises but improves V1 coherence.
- **Improvement recommendations:** Keep Azure positioning explicit and avoid multi-cloud implication.
- **Fixability:** Strong now.

## 4. Top 10 Most Important Weaknesses

1. **The product is deeper than the first buyer journey can absorb.** The first session still asks evaluators to understand too much internal vocabulary before value becomes obvious.
2. **Proof-of-value is instrumented but not fully packaged.** Metrics exist, but a buyer-ready evidence bundle still requires too much manual assembly.
3. **The sales-led V1 path is not clean enough.** Quote path, pricing, trial, proof pack, order form, and procurement pack exist but do not yet feel like one decision lane.
4. **First-line pilot triage benefits from a single rescue playbook.** Shipped: **`docs/runbooks/PILOT_RESCUE_PLAYBOOK.md`**, **`doctor`** output, support-bundle **`references.json`**, and runbooks index — remaining gap is **operator habit**, not missing files (see §9 plan log).
5. **Trust materials are transparent but still heavily self-attested.** That is acceptable for V1 pilots, but it slows serious enterprise procurement.
6. **The UI leaks internal operating concepts.** Terms such as runs, manifests, raw IDs, raw JSON, and admin/demo surfaces can distract from architecture review value.
7. **Workflow embedding is generic rather than turnkey.** REST/webhooks/Service Bus are solid, but customers must still wire common enterprise systems themselves.
8. **Documentation volume creates its own friction.** The docs are strong, but the evaluator can get lost in depth material.
9. **Real-mode AI quality proof is not yet as visible as simulator proof.** Agent scoring exists, but buyers need clear confidence across realistic briefs.
10. **Operational readiness depends on environment configuration.** Probes, telemetry export, real AOAI, and hosted stack checks must be explicitly enabled to become evidence.

## 5. Top 5 Monetization Blockers

1. **Unclear first commercial next step.** The buyer can read a lot, but the flow from "I see value" to quote/order/pilot is still too manual.
2. **Insufficient packaged ROI evidence.** The methodology is credible, but customers need a generated proof artifact from their run.
3. **Placeholder/self-serve checkout residue.** Even though live commerce un-hold is deferred, visible placeholder checkout material weakens confidence.
4. **No sharp low-touch buyer demo narrative.** The demo must show evidence-linked risk review, not the system's internal pipeline.
5. **Procurement confidence discounts remain necessary.** Self-attested trust and no formal SOC2 opinion mean pricing must carry trust discount logic for now.

## 6. Top 5 Enterprise Adoption Blockers

1. **Procurement artifacts are not all final-form.** DPA/MSA/SOC2/pen-test materials are available, but several are templates, self-assessments, or deferred attestations.
2. **Workflow integration requires customer implementation.** First-party ITSM and knowledge-base connectors are outside V1.
3. **Operator cognitive load is high.** Enterprise implementation teams need a simpler operating model for first rollout.
4. **Real-mode assurance needs more evidence.** Security reviewers and architecture leaders will ask whether outputs remain reliable beyond demo data.
5. **Operational proof is environment-dependent.** Synthetic probes, telemetry, and production-like validation must be enabled and retained per deployment.

## 7. Top 5 Engineering Risks

1. **Build and fast-core regression hygiene.** Small compile or analyzer regressions can block the Release fast-core filter; treat **green fast-core** as a routine merge bar (historical **`CS9113`** in commit orchestration is resolved in tree as of **2026-05-01**).
2. **Simulator confidence may exceed real-mode confidence.** Deterministic tests are strong; real LLM quality needs visible, repeated eval evidence.
3. **Sensitive trace retention can become a privacy hazard.** Full prompts/responses are valuable for forensics but need strict access, retention, and buyer-safe defaults.
4. **Dashboard-grade stale reads must stay bounded.** Intentional `NOLOCK` use is acceptable only where freshness is not authoritative.
5. **Surface-area complexity raises regression risk.** API, UI, CLI, worker, governance, alerts, billing, trial, audit, and integrations all need disciplined boundaries.

## 8. Most Important Truth

ArchLucid is technically credible for V1 pilots, but its next readiness jump depends on making the buyer's first proof of value simpler, faster, and more trustworthy without requiring someone to explain the system by hand.

## 9. Top Improvement Opportunities

The **plan revision log** below reflects a **2026-05-01** cross-check of this section against the repository. **Original Cursor prompts** remain underneath as specifications; treat the log as **execution precedence** when the two differ.

### Plan revision log (2026-05-01)

| # | Working title | Plan status | What to do next |
|---|----------------|------------|-----------------|
| 1 | Buyer first-run / review package | **Largely complete (2026-05-02)** | **`docs/START_HERE.md`** + **`docs/CORE_PILOT.md`** § first-session checklist + UI hybrid copy; contributor guardrail **`archlucid-ui/src/lib/core-pilot-first-review-copy.test.ts`**. Re-audit if first-session headings regress. |
| 2 | Proof-of-value pack | **Superseded shape + alias (2026-05-02)** | Canonical path remains **`archlucid reference-evidence`**. **`archlucid proof-pack`** is now a **CLI alias** (same handler — no duplicate export logic). |
| 3 | Sales-led CTAs | **Largely complete** | §10 + changelog decisions; keep regression tests for placeholder Stripe suppression vs real URLs. |
| 4 | Procurement pack classification | **Largely complete (2026-05-02)** | Generated ZIP includes **`README.md`** (entry doc) + **`ARTIFACT_STATUS_INDEX.md`** / **`artifact_status_index.json`**. **Optional:** richer per-row machine fields if buyers still confuse template vs attestation; **`--strict`** remains for release drops. |
| 5 | CS9113 / fast-core | **Build addressed** | Historical **`manifestHashService` / CS9113** on commit orchestrator **no longer applies** in current sources. **Remaining:** optional **hygiene** — add or document an analyzer/CI expectation so unread primary-constructor parameters do not recur; **re-run** Release fast-core filter after large merges. |
| 6 | Real-mode agent evidence | **Partial** | **`tests/eval-corpus`** + **`eval_agent_quality.py`** + CI exist. **Stub:** **`docs/quality/REAL_MODE_EVIDENCE_RELEASE_CHECKIN.md`** (release check-in steps). **Remaining:** name §10 **reference AOAI** deployment, optional committed summary artifact path, and any brief-archetype gaps vs the prompt. |
| 7 | Workflow recipes | **Largely complete** | **`docs/integrations/recipes/`** includes ServiceNow, Jira, Confluence, ADO (Logic Apps), Event Grid hardening. **Optional polish:** add or retitle **Logic Apps–first** variants for ServiceNow/Jira to match owner **Azure Logic Apps** preference (recipes index still lists **Power Automate** for some rows). |
| 8 | Pilot rescue + CLI | **Done (2026-05-02)** | **`docs/runbooks/PILOT_RESCUE_PLAYBOOK.md`**, **`doctor`** + **`references.json`** + operator hints; runbooks index row. |

### 1. Compress the Buyer First-Run Journey Around One Review Package

- **Why it matters:** Adoption friction and time-to-value are the largest weighted deficits. The first user should see "architecture review package" before "run/manifest/authority."
- **Expected impact:** A clearer first session should improve trial completion, sponsor comprehension, and demo conversion.
- **Affected qualities:** Adoption Friction, Time-to-Value, Usability, Cognitive Load, Marketability, Executive Value Visibility.
- **Status:** Largely complete — see **Plan revision log (2026-05-02)**; **`core-pilot-first-review-copy.test.ts`** locks buyer-first headings; audit `START_HERE` path when copy changes.
- **Impact of running the prompt:** Directly improves Adoption Friction (+6-9 pts), Time-to-Value (+4-6 pts), Usability (+4-6 pts), Cognitive Load (+8-12 pts). Weighted readiness impact: +0.9-1.4%.
- **Plan revision (2026-05-01):** §10 captures the **dominant noun** and **hybrid** framing. Before closing this item, **audit** `START_HERE` → first review path and **tests** against the acceptance criteria in the prompt below.

**Cursor prompt:**

```text
Implement a V1 buyer-first journey cleanup that presents the Core Pilot as one "architecture review package" flow rather than a collection of internal system operations.

Scope:
- Review docs/START_HERE.md, docs/CORE_PILOT.md, docs/library/PILOT_GUIDE.md, docs/library/OPERATOR_DECISION_GUIDE.md, docs/go-to-market/PRODUCT_DATASHEET.md, and archlucid-ui first-session/home/run-detail surfaces.
- Keep the existing V1 scope intact: create request -> execute -> commit -> review artifacts.
- Update buyer-facing copy so the primary noun is "architecture review" or "review package"; keep "run", "manifest", and "authority" available in developer/operator detail but not as first-impression language.
- Add or update a short first-session checklist that answers: what to do first, what output proves value, what to send to a sponsor, and what to ignore until later.

Acceptance criteria:
- A buyer/evaluator can find one path from docs/START_HERE.md to first review package without reading deep architecture docs.
- The first-session UI/docs explain the output in business terms before internal implementation terms.
- No V1.1/V2 scope is promoted into V1.
- Existing API routes, auth, pricing, and governance behavior are unchanged.
- Add or update focused tests for any UI copy/state changes.

Constraints:
- Do not remove technical docs; move depth behind links.
- Do not rename persisted API concepts or database objects.
- Do not imply first-party Jira/ServiceNow/Confluence/Slack support.
- Do not change authorization or commercial entitlement behavior.
```

### 2. Generate a Buyer-Safe Proof-of-Value Pack From a Real Tenant Run

- **Why it matters:** ROI and executive value are instrumented but not packaged tightly enough for purchase decisions.
- **Expected impact:** Gives sponsors a concrete artifact they can forward without assembling metrics manually.
- **Affected qualities:** Proof-of-ROI Readiness, Executive Value Visibility, Trustworthiness, Decision Velocity, Marketability.
- **Status:** Execution path revised — see **Plan revision log (2026-05-01)**; extend **`reference-evidence`** / exports; optional CLI alias only.
- **Impact of running the prompt:** Directly improves Proof-of-ROI Readiness (+8-12 pts), Executive Value Visibility (+4-6 pts), Decision Velocity (+3-5 pts), Trustworthiness (+2-4 pts). Weighted readiness impact: +0.7-1.1%.
- **Plan revision (2026-05-01):** Align execution with **`reference-evidence`**, PDF/export services, and **`PROOF_PACK_REDACTION_PROFILES.md`** (§10); treat this prompt as **gap-fill** (manifest of sources, doc links, tests) rather than a greenfield command.

**Cursor prompt:**

```text
Add a V1 proof-of-value pack generator that assembles existing run evidence into a buyer-safe Markdown artifact, without inventing new ROI claims.

Scope:
- Use existing pilot/run data sources already documented in docs/library/PILOT_ROI_MODEL.md, docs/library/PROOF_OF_VALUE_SNAPSHOT.md, and docs/library/API_CONTRACTS.md.
- Prefer extending the CLI if an appropriate command exists; the **canonical** path in-repo is **`archlucid reference-evidence`** (and admin export endpoints) assembling ZIP + first-value artifacts — extend/document that path first. Only add `archlucid proof-pack` as a **thin alias** if naming consistency with buyers matters.
- Include: run metadata, time to committed manifest, findings by severity, audit row count, LLM call count when available, top-severity evidence chain, explanation completeness/faithfulness indicators when available, and a demo-data warning when applicable.
- Output Markdown plus a JSON manifest of source endpoints/fields used.

Acceptance criteria:
- The command works against an API base URL using existing auth conventions.
- Demo/seeded runs are clearly marked "demo tenant - replace before publishing."
- Missing optional signals render as "not available" with a reason, not as zero.
- Unit tests cover formatting, demo warning, missing optional fields, and endpoint failure handling.
- Documentation links the command from docs/library/PILOT_ROI_MODEL.md and docs/library/CLI_USAGE.md.

Constraints:
- Do not add new financial assumptions or guaranteed ROI claims.
- Do not expose secrets, raw prompts, or tenant-sensitive free text beyond existing run evidence.
- Do not require Stripe, Marketplace, SOC2, or V1.1 items.
```

### 3. Harden Sales-Led V1 Commercial CTAs and Remove Placeholder Buyer Residue

- **Why it matters:** V1 can be sales-led, but visible placeholder checkout/contact artifacts reduce buyer confidence.
- **Expected impact:** Improves decision velocity without depending on deferred live commerce un-hold.
- **Affected qualities:** Commercial Packaging Readiness, Decision Velocity, Marketability, Adoption Friction.
- **Status:** Largely complete — see **Plan revision log (2026-05-01)**; keep prompt for regression verification.
- **Impact of running the prompt:** Directly improves Commercial Packaging Readiness (+6-8 pts), Decision Velocity (+4-6 pts), Marketability (+2-4 pts). Weighted readiness impact: +0.4-0.7%.
- **Plan revision (2026-05-01):** **Largely executed** per §10 and pricing/trial changelog work; keep as **regression playbook** only.

**Cursor prompt:**

```text
Clean up V1 commercial CTAs so buyer-facing surfaces consistently use the sales-led quote path unless a real Stripe checkout URL is configured.

Scope:
- Inspect docs/go-to-market/PRICING_PHILOSOPHY.md, docs/go-to-market/TRIAL_AND_SIGNUP.md, archlucid-ui/public/pricing.json, pricing page components, TrialBanner, and billing checkout UI copy.
- Preserve the explicitly deferred V1.1 live Stripe/Marketplace un-hold boundary.
- Remove or hide visible placeholder checkout URLs such as `placeholder-replace-before-launch` from buyer-facing rendered UI.
- Make the **primary** V1 CTA **Request quote** (owner decision 2026-05-01); **Start guided pilot** may appear as a **secondary** CTA where checkout is not production-configured.

Acceptance criteria:
- No buyer-facing page renders a fake Stripe checkout URL or placeholder sales contact.
- If `teamStripeCheckoutUrl` is absent or placeholder-like, the UI hides the Stripe button and shows the **Request quote** path (secondary: guided pilot copy where present). When a **non-placeholder** URL is configured (including Stripe **test** checkout), the Team Stripe button **may** show even if production-live checkout is not yet declared (owner decision 2026-05-01).
- Pricing single-source rules still pass.
- Tests cover placeholder URL suppression and real URL rendering.
- Docs clearly state that V1 sales-led purchase is supported while live checkout publication is V1.1.

Constraints:
- Do not flip live Stripe keys.
- Do not publish Marketplace claims.
- Do not change locked list prices.
- Do not remove backend billing safety rules.
```

### 4. Make the Procurement Pack Buyer-Safe by Classifying Drafts, Templates, and Evidence

- **Why it matters:** Procurement readiness is adequate for pilots but risky if draft artifacts are sent without clear status.
- **Expected impact:** Reduces enterprise review confusion and prevents overclaiming.
- **Affected qualities:** Procurement Readiness, Compliance Readiness, Trustworthiness, Auditability, Customer Self-Sufficiency.
- **Status:** Fully actionable now.
- **Impact of running the prompt:** Directly improves Procurement Readiness (+6-9 pts), Compliance Readiness (+3-5 pts), Trustworthiness (+2-4 pts). Weighted readiness impact: +0.4-0.8%.
- **Plan revision (2026-05-01):** Canonical manifest entries describe artifact **status** in prose. **Remaining:** machine-readable **artifact-status index** in generated pack output (if still needed for buyer confusion); keep release-only placeholder strictness per §10.

**Cursor prompt:**

```text
Harden the procurement evidence pack so every included artifact is classified as Evidence, Template, Self-assessment, NDA-only, or Deferred, and buyer-facing output cannot accidentally imply third-party attestation.

Scope:
- Review docs/go-to-market/PROCUREMENT_EVIDENCE_PACK_INDEX.md, docs/go-to-market/TRUST_CENTER.md, docs/security/SOC2_SELF_ASSESSMENT_2026.md, docs/go-to-market/DPA_TEMPLATE.md, docs/go-to-market/MSA_TEMPLATE.md, scripts/build_procurement_pack.py, and scripts/procurement_pack_canonical.json.
- Add a classification field to the procurement pack manifest or generated README.
- Ensure SOC2 and pen-test materials are labeled accurately as self-assessment, awarded/in-flight, template, or deferred as applicable.
- Add a script-level or workflow-level guard that fails **release/procurement** procurement-pack builds (not default merge CI) if unapproved placeholder language appears in buyer-facing packaged artifacts — see `docs/go-to-market/HOW_TO_REQUEST_PROCUREMENT_PACK.md` § *Placeholder strictness*.

Acceptance criteria:
- Generated procurement pack includes an artifact-status index.
- Templates and self-assessments cannot be mistaken for executed legal agreements or third-party attestations.
- Placeholder detection has an allowlist for intentional template fields.
- Unit tests cover classification and placeholder guard behavior.
- The strict placeholder gate is wired to **release/procurement** builds only so routine CI can still verify the pack **assembles**.

Constraints:
- Do not claim SOC2 Type I/II, ISO 27001, or completed external pen-test results.
- Do not remove V1.1 deferred scope notes.
- Do not insert buyer-specific legal names or terms.
```

### 5. Fix Release Fast-Core Build Failure and Add a Hygiene Guard for Unused Primary-Constructor Dependencies

- **Why it matters:** Compile/analyzer regressions on the Release fast-core path undermine confidence in every other readiness claim — even when the underlying testing architecture is strong.
- **Expected impact:** Restores a clean validation signal and prevents recurrence.
- **Affected qualities:** Correctness, Testability, Maintainability, Deployability, Reliability.
- **Status:** Historical **`CS9113`** issue **resolved** in tree (2026-05-01); optional follow-up for **recurrence prevention** and routine fast-core runs.
- **Impact of running the prompt:** Directly improves Correctness (+2-4 pts), Testability (+1-2 pts), Deployability (+2-3 pts), Maintainability (+1-2 pts). Weighted readiness impact: +0.2-0.4%.
- **Plan revision (2026-05-01):** Use the prompt below for **verification + hygiene** only — the specific **`manifestHashService`** / **`AuthorityDrivenArchitectureRunCommitOrchestrator`** failure described was **fixed**; do not re-litigate removed parameters.

**Cursor prompt:**

```text
Verify Release fast-core health and optionally harden against recurrence of unread primary-constructor parameters (CS9113).

Historical note (resolved in tree as of 2026-05-01):
- A prior failure referenced an unread `manifestHashService` parameter in `AuthorityDrivenArchitectureRunCommitOrchestrator.cs`. Current sources should compile; confirm with build + tests.

Scope:
- Run: `dotnet test ArchLucid.sln --filter "Suite=Core&Category!=Slow&Category!=Integration&Category!=GoldenCorpusRecord" -c Release`
- If CS9113 or similar appears on **other** types, either use the dependency correctly or remove it from the primary constructor and DI wiring.
- Optionally document or automate the fast-core command in release checklists.

Acceptance criteria:
- The Release fast-core command completes successfully or reaches only unrelated pre-existing test failures that are documented.
- No new `ConfigureAwait(false)` is added in tests.
- Constructor dependencies remain explicit and minimal.
- Add or update a targeted unit test only if behavior changes.

Constraints:
- Do not suppress CS9113 globally.
- Do not loosen build warnings.
- Do not refactor unrelated orchestration behavior.
```

### 6. Expand Real-Mode Agent Quality Evidence Without Making It a V1.1 Feature

- **Why it matters:** The product's AI trust depends on showing quality across realistic briefs, not only deterministic demo behavior.
- **Expected impact:** Improves correctness, trustworthiness, AI readiness, and proof-of-value credibility.
- **Affected qualities:** Correctness, AI/Agent Readiness, Trustworthiness, Explainability, Proof-of-ROI Readiness.
- **Status:** Partial — offline corpus + scripts exist; extend per plan revision.
- **Impact of running the prompt:** Directly improves AI/Agent Readiness (+5-8 pts), Correctness (+3-5 pts), Trustworthiness (+2-4 pts), Explainability (+2-3 pts). Weighted readiness impact: +0.5-0.8%.
- **Plan revision (2026-05-01):** **`tests/eval-corpus`**, **`eval_agent_quality.py`**, **`AGENT_EVAL_CORPUS.md`**, and CI jobs already exist. **Remaining:** close gaps vs the prompt’s brief archetypes, add a **check-in Markdown** summary artifact for releases if missing, and name the §10 **reference AOAI** deployment for manual real-mode runs.

**Cursor prompt:**

```text
Add a V1-realistic agent quality evidence slice that reports existing quality metrics across a small curated corpus of customer-like architecture briefs.

Scope:
- Use existing eval infrastructure under tests/eval-corpus, tests/eval-datasets, docs/library/AGENT_EVAL_CORPUS.md, scripts/ci/eval_agent_quality.py, and agent output evaluation classes.
- Add 3-5 non-customer, synthetic but realistic briefs covering: Azure web app, regulated data workflow, cost-constrained modernization, and governance-heavy review.
- Generate a Markdown summary artifact with structural completeness, semantic score, parse failures, quality gate outcome, and explanation trace completeness where available.
- Keep simulator and real-mode paths clearly labeled.

Acceptance criteria:
- The corpus can run without customer data.
- The report distinguishes simulator evidence from real AOAI evidence.
- Failures are actionable: agent type, case id, failed metric, and remediation hint.
- CI can run a lightweight/offline subset without Azure OpenAI credentials.
- Docs explain how to run the real-mode slice manually when credentials are available.
- **Release policy (owner 2026-05-01):** Document how a **release candidate is blocked** when reference-path scores fall below **conservative** configured floors (not warn-only); align with **`AGENT_OUTPUT_EVALUATION.md`** quality gate and golden-cohort real-LLM when promoted to required.

Constraints:
- Do not require Azure OpenAI for normal PR CI.
- Do not add customer or proprietary data.
- Do not claim legal/compliance correctness from model output.
```

### 7. Add Customer-Owned Workflow Bridge Recipes for Common Enterprise Tools

- **Why it matters:** First-party connectors are deferred, but customers still need a practical path into their workflows during V1.
- **Expected impact:** Improves workflow embeddedness and adoption without violating deferred scope.
- **Affected qualities:** Workflow Embeddedness, Interoperability, Adoption Friction, Customer Self-Sufficiency, Stickiness.
- **Status:** Largely satisfied in docs; keep for **gap-fill** and Logic Apps alignment only.
- **Impact of running the prompt:** Directly improves Workflow Embeddedness (+6-9 pts), Interoperability (+3-5 pts), Adoption Friction (+2-4 pts). Weighted readiness impact: +0.4-0.7%.
- **Plan revision (2026-05-01):** **`docs/integrations/recipes/`** already satisfies ServiceNow + Jira + further samples. Use the prompt for **gap-fill** (links, accuracy, test steps) or **Logic Apps–first** variants per §10 owner preference — not a greenfield folder.

**Cursor prompt:**

```text
Create V1 customer-owned integration recipes that show how to bridge ArchLucid CloudEvents/webhooks into common enterprise workflows without implementing first-party connectors.

Scope:
- Add or update docs under docs/integrations/recipes/.
- Cover at least two recipes in this order: webhook -> ServiceNow incident via customer automation (first), then webhook -> Jira issue via customer automation.
- Use the existing CloudEvents/event catalog and HMAC guidance.
- Clearly state these are customer-owned recipes, not first-party V1 connectors.

Acceptance criteria:
- Each recipe includes prerequisites, event types used, payload fields, auth/secret handling, failure/retry considerations, and test steps.
- Recipes link to docs/library/INTEGRATION_EVENTS_AND_WEBHOOKS.md and docs/go-to-market/INTEGRATION_CATALOG.md.
- V1_DEFERRED.md remains accurate: first-party Jira/ServiceNow/Confluence connectors are still V1.1 candidates.
- No new product code is required unless an existing sample needs a small correction.

Constraints:
- Do not add first-party connector code.
- Do not imply marketplace listings or vendor-certified apps.
- Do not introduce non-verified third-party SDK dependencies.
```

### 8. Add a Pilot Rescue Playbook and Link It From CLI Support Output

- **Why it matters:** Self-sufficiency needs more than comprehensive docs; it needs quick triage when a pilot gets stuck.
- **Expected impact:** Reduces support burden and improves buyer/operator confidence.
- **Affected qualities:** Customer Self-Sufficiency, Supportability, Adoption Friction, Reliability, Manageability.
- **Status:** **Complete (2026-05-02)** — playbook + **`doctor`** + **`references.json`**; see **Plan revision log**.
- **Impact of running the prompt:** Directly improves Customer Self-Sufficiency (+7-10 pts), Supportability (+2-4 pts), Adoption Friction (+2-3 pts), Manageability (+2-3 pts). Weighted readiness impact: +0.3-0.6%.
- **Plan revision (2026-05-01):** Execute **`docs/runbooks/PILOT_RESCUE_PLAYBOOK.md`** + **`references.json`** / **`doctor`** pointers; do **not** duplicate the support-bundle next-steps work.

**Cursor prompt:**

```text
Create a concise V1 Pilot Rescue Playbook and link it from support-bundle/doctor outputs where appropriate.

Scope:
- Add docs/runbooks/PILOT_RESCUE_PLAYBOOK.md with the required docs scope header.
- Cover the top stuck states: API unreachable, /health/ready unhealthy, auth 401/403, trial 402, run not ready to commit, governance pre-commit blocked, missing artifacts, real-mode AOAI failure/fallback, and support bundle redaction.
- Link existing runbooks instead of duplicating deep content.
- If CLI support-bundle or doctor output has a docs/reference list, add a pointer to the playbook.

Acceptance criteria:
- The playbook is under 200 lines and organized by symptom -> likely cause -> first command -> next doc.
- It includes correlation ID and support-bundle guidance.
- It does not expose secrets or recommend unsafe production bypasses.
- Any CLI text changes are covered by focused tests.

Constraints:
- Do not change runtime behavior unless only adding a documentation link.
- Do not recommend DevelopmentBypass outside development.
- Do not duplicate full runbooks; link to them.
```

## 10. Pending Questions for Later

### Owner responses (2026-05-01)

| # | Topic | Decision |
|---|--------|----------|
| 1 | Buyer-facing dominant noun | **Architecture review** |
| 3 | Default proof-pack format for sales | **PDF** |
| 7 | Counsel review before external sharing | **None required per owner** — distribution posture is owner-owned; redaction profiles in **`PROOF_PACK_REDACTION_PROFILES.md`** |
| 10 | V1 primary commercial CTA (sales-led) | **Request quote** |
| 12 | Preferred automation in integration recipes | **Azure Logic Apps** |
| 13 | V1 pilot support escalation | **E-mail and URL** (both) |
| 14 | First workflow-bridge recipe priority | **ServiceNow** (then Jira per two-recipe scope) |
| Commercial | Team Stripe “Subscribe” path pre–production-live checkout | **Visible** when `teamStripeCheckoutUrl` is a **real** Stripe link (including **test** mode); **placeholder** URLs remain hidden |
| Proof pack | Redaction standard | **`PROOF_PACK_REDACTION_PROFILES.md`** — three named profiles; mandatory removals + per-profile rules |
| UI framing | Pilot first-run vs "run" | **Explicit hybrid** — **architecture review** on Pilot chrome; **run** on technical spine; one-line bridge that each review is one run |
| Procurement pack | Placeholder detection in CI | **Strict only** when building **release / procurement** artifacts — **not** on every default CI job |
| Real-mode quality | Agent score posture for releases | **Conservative (high bar)** — **block** a release when reference-path evidence shows **insufficient** structural/semantic scores or **rejected** gate outcomes at configured floors; **warn-only is not enough** for credibility with Azure/AI practitioner buyers (numeric floors finalized after reference AOAI deployment is named) |

### Compress the Buyer First-Run Journey Around One Review Package

- **Resolved (2026-05-01):** Buyer-facing noun — use **architecture review** as the dominant phrase.
- **Resolved (2026-05-01):** **Explicit hybrid** — rename Pilot **primary** labels/CTAs/headings to architecture-review language; keep **run** for IDs, API-shaped copy, diagnostics, support; include **one explicit bridge sentence** on first session (each architecture review = one run in the system).

### Generate a Buyer-Safe Proof-of-Value Pack From a Real Tenant Run

- **Resolved (2026-05-01):** Default sales-facing artifact — **PDF**.
- **Resolved (2026-05-01):** Redaction standard — canonical profiles in **`docs/library/PROOF_PACK_REDACTION_PROFILES.md`** (`internal-pilot`, `customer-approved-external`, `anonymous-benchmark`); external share defaults to **`customer-approved-external`** with documented approver + attestation block.

### Harden Sales-Led V1 Commercial CTAs and Remove Placeholder Buyer Residue

- **Resolved (2026-05-01):** V1 **primary** buyer CTA — **Request quote** (async sales-led path).
- **Resolved (2026-05-01):** Interim **Team** Stripe **Subscribe with Stripe** path — **remain available** when `teamStripeCheckoutUrl` is a **real** checkout link (including **test** mode); **do not** require “production-live” checkout before showing. **Placeholder** URLs must still be suppressed in UI.

### Make the Procurement Pack Buyer-Safe by Classifying Drafts, Templates, and Evidence

- **Resolved (2026-05-01):** Per-share counsel gate — **not required** (owner decision).
- **Resolved (2026-05-01):** Buyer-facing **placeholder / TBD** detection — **strict** only in **release or procurement-pack artifact** builds (and equivalent manual “ship this ZIP” runs); **default CI** continues to **assemble** the pack without that gate so merge pipelines are not blocked by draft doc markers.

### Fix Release Fast-Core Build Failure and Add a Hygiene Guard for Unused Primary-Constructor Dependencies

- **Resolved in tree (2026-05-01):** The historical **`CS9113` / unread `manifestHashService`** issue on **`AuthorityDrivenArchitectureRunCommitOrchestrator`** no longer applies in current sources. **Ongoing:** run the Release **fast-core** filter after substantive merges; optional hygiene to prevent recurrence on **other** types (see §9.5 prompt).

### Expand Real-Mode Agent Quality Evidence Without Making It a V1.1 Feature

- **Resolved (2026-05-01):** Release posture — **conservative** structural/semantic expectations for credibility with Azure architects and AI-system builders: **block** a release when **reference** real-mode (or required golden-cohort real-LLM) evidence is **below** agreed floors or shows **rejected** quality-gate outcomes at material rates; **warn-only is insufficient** for GA perception. Implement by tightening **`ArchLucid:AgentOutput:QualityGate`** (see **`AGENT_OUTPUT_EVALUATION.md`**) and **required** CI/branch-protection checks once the reference model path exists.
- **Open:** Which Azure OpenAI deployment should be treated as the reference model for manual real-mode evidence?

### Add Customer-Owned Workflow Bridge Recipes for Common Enterprise Tools

- **Resolved (2026-05-01):** Prioritize **ServiceNow** for the first buyer-facing recipe; **Jira** second (matches the two-recipe Cursor prompt scope). Other targets (Confluence, Sentinel, Teams) remain later unless scope expands.
- **Resolved (2026-05-01):** Prefer **Azure Logic Apps** in example recipes (vs Power Automate-only or generic-only).

### Add a Pilot Rescue Playbook and Link It From CLI Support Output

- **Resolved (2026-05-01):** Support escalation — show **e-mail and URL** in V1 pilot artifacts.
- **Resolved (2026-05-01):** Support bundles include a generated **advisory** **`next-steps.json`** plus the same bullets in **`README.txt`**, built by **`SupportBundleNextStepsBuilder`** (CLI: probe-driven; API host: correlation/redaction guidance + light env hints). Operators must still confirm against **`health.json`** (CLI) and docs.
- **Open:** **`docs/runbooks/PILOT_RESCUE_PLAYBOOK.md`** and **`doctor`** output pointers to that playbook (§9.8).

## Verification Notes

- Static assessment used the current repository materials available during this run, including V1 scope/deferred docs, buyer docs, API/security/observability/test docs, workflow files, source search, and UI/source indicators.
- Explicit deferred items were located in `docs/library/V1_SCOPE.md` and `docs/library/V1_DEFERRED.md`; no deferred-scope uncertainty was found.
- **2026-05-01 engineering note:** **`dotnet build ArchLucid.Cli`** and **`dotnet build ArchLucid.Application`** succeed **`Release`** with **0 errors / 0 warnings**. The historical **`CS9113`** failure on **`AuthorityDrivenArchitectureRunCommitOrchestrator`** is **not** reproduced in current sources.
- **Recommended:** Re-run the fast-core filter after large changes: `dotnet test ArchLucid.sln --filter "Suite=Core&Category!=Slow&Category!=Integration&Category!=GoldenCorpusRecord" -c Release` (outcome may still fail on **tests** unrelated to the historical compile issue).

## Revision index (2026-05-01)

**Plan + narrative refreshed** to match repository reality: §2 engineering paragraph; §3 Correctness, Maintainability, Deployability, Testability; §4 weakness **#4**; §7 engineering risk **#1**; §9 **plan revision log** + per-opportunity **Plan revision** lines + updated §9.5 prompt; §10 fast-core subsection; §Verification Notes; this index.
