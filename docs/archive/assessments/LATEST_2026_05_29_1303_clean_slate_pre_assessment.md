# ArchLucid Assessment – (A) Headline Readiness: 79.56%

This score is the `(A)` headline readiness per `Assessment-Scope-V1_1.mdc`, excluding deferred items. It is a clean-slate, first-principles assessment from current repository materials only. It does not reference, rely on, or compare against previous assessments, prior scores, or historical conclusions.

## 1. Executive Summary

### (A) Overall Headline Readiness

ArchLucid is beyond prototype maturity. The V1 product has a concrete request -> execute -> commit -> sponsor package spine, SQL-backed persistence, governance/audit surfaces, pricing and trust materials, and a large amount of CI and runbook discipline. The weighted score lands at **79.56%** because the core product is credible and first-pilot proof automation, AI quality dashboards, differentiation packets, commercial closeout artifacts, and operator doc consolidation now close the highest-weight gaps in AI evidence quality, buyer-facing differentiation, adoption friction, and proof automation. The score excludes deferred V1.1/V2 items such as SOC 2 CPA attestation, live commerce un-hold, MCP, first-party Jira/ServiceNow/Confluence/Slack/Teams commitments, multi-region active/active guarantees, AWS/GCP target analysis, automated tenant-erasure quarantine, and third-party pen-test publication.

### (B) Procurement / Market-Motion Realism

Procurement friction remains real even though it is not part of the `(A)` score. Enterprise buyers will ask for CPA SOC 2, a third-party pen-test report, named references, live Marketplace transactability, procurement-review evidence, support commitments, and customer-specific security answers. The repo handles this honestly with a Trust Center, SOC 2 self-assessment, SOC roadmap, DPA/subprocessor/CAIQ/SIG materials, and procurement-pack generation. That is credible for pilots and some early buyers, but many enterprise procurement teams will still classify the product as pre-attestation.

### Commercial Picture

The commercial wedge is clear: shorten architecture review cycles and package a defensible review artifact. Pricing is rational and tied to manual-review savings, with guided pilot, Team, Professional, Enterprise, and custom policy-pack services. Conversion proof improved with ROI baseline capture in the operator path, `commercial-closeout.md` generation, and deterministic Evidence Pack / ARB / order-form next actions from proof states. Self-serve commerce being deferred is not scored, but sales-led conversion now has a sharper operating system from first committed review to paid order discussion.

### Enterprise Picture

Enterprise posture is unusually well documented for a product at this stage: tenant isolation, audit events, SLO targets, DPA/subprocessors, SAML/OIDC, SCIM, policy packs, governance, alerting, and SIEM/export materials all exist. The remaining concern is buyer confidence under operational reality: not "are there docs?", but "can a security reviewer, operator, and implementation team verify them quickly against a live environment without a founder narrating the system?"

### Engineering Picture

The architecture is modular and disciplined: many projects, contract tests, Dapper/SQL persistence, OpenAPI snapshot control, retrieval/RAG infrastructure, outbox patterns, configuration validation, rate limits, CI security gates, and data-consistency probes. AI/agent quality evidence is now consolidated in `agent-quality-dashboard.md`, real-mode rollup generation, sponsor-handoff quality gates, and LLM cost envelope reporting. Remaining engineering risk is complexity density — many surfaces still require operators to trust the command center and closeout artifacts as the primary status vocabulary.

### Deferred Scope Uncertainty

No deferred-scope uncertainty was found. The repository contains explicit scope and deferral materials in `docs/library/V1_SCOPE.md`, `docs/library/V1_DEFERRED.md`, `docs/go-to-market/TRUST_CENTER.md`, and `Assessment-Scope-V1_1.mdc`. Deferred items were treated as out of scope for `(A)` scoring.

## 2. Weighted Quality Assessment

Total weight used: **119**. Weighted readiness = `sum(score * weight) / 119`. Weighted deficiency signal = `(100 - score) * weight`; higher signal means more urgent.

### 1. Cutting-Edge AI Technology

- **Score:** 78
- **Weight:** 8
- **Weighted impact on readiness:** 4.84 points
- **Weighted deficiency signal:** 224
- **Justification:** The system has modern pieces: real/simulator agent execution, Azure OpenAI configuration, JSON schema response mode, content safety, RAG corpora, retrieval grounding traces, embedding drift checks, token budgets, and faithfulness reporting. It is not yet convincingly cutting-edge as a product differentiator because the most advanced AI story is still mostly constrained retrieval + deterministic orchestration, not demonstrably superior reasoning, eval-led optimization, or adaptive review quality.
- **Tradeoffs:** Conservative enterprise constraints are appropriate; adding flashier AI would increase trust and cost risk. The current posture favors bounded usefulness over autonomy.
- **Improvement recommendations:** strengthen live real-mode eval evidence; publish a golden-cohort AI quality dashboard; deepen citation/faithfulness thresholds for sponsor handoff; show why ArchLucid's AI review is better than generic copilots.
- **Fixability:** Fixable in v1 through evidence, evals, and tighter proof surfaces; more advanced graph-RAG/agentic retrieval belongs to V1.1/V2 if explicitly promoted.

### 2. AI/Agent Readiness

- **Score:** 82
- **Weight:** 8
- **Weighted impact on readiness:** 5.18 points
- **Weighted deficiency signal:** 184
- **Justification:** Strong foundations exist: deterministic authority pipeline, simulator/real execution separation, schema validation, quality gates, content safety, LLM budgets, retrieval grounding, and run-level traces. The gap is operational assurance: real-mode quality is optional, not routinely merge-blocking, and current faithfulness evidence is small enough that a serious buyer would ask for broader cohorts and failure examples.
- **Tradeoffs:** Keeping live LLM gates optional avoids flaky CI and secret exposure; it also weakens proof of production AI quality.
- **Improvement recommendations:** expand golden-corpus coverage, produce recurring real-mode run evidence, gate sponsor packets on PilotStrict outcomes, and show agent failure diagnostics in proof bundles.
- **Fixability:** Fixable in v1.

### 3. Marketability

- **Score:** 81
- **Weight:** 8
- **Weighted impact on readiness:** 5.24 points
- **Weighted deficiency signal:** 176
- **Justification:** The product has a coherent category wedge: AI-assisted architecture reviews, governance, auditability, and sponsor-ready artifacts. Buyer-job pages and accelerator walkthroughs help. The weakness is that the repo still reads like a sophisticated internal platform unless the evaluator follows the curated path. The category claim needs sharper buyer proof and less surface-area sprawl.
- **Tradeoffs:** Broad capability inventory helps enterprise credibility but dilutes the first-message narrative.
- **Improvement recommendations:** strengthen the buyer one-screen, demo proof page, and differentiated "why not generic AI + docs?" argument.
- **Fixability:** Fixable in v1.

### 4. Adoption Friction

- **Score:** 77
- **Weight:** 6
- **Weighted impact on readiness:** 3.58 points
- **Weighted deficiency signal:** 174
- **Justification:** The first-pilot path is documented and concrete, but still requires SQL/auth/hosting understanding, evidence ZIP collection, proof scripts, quality-gate interpretation, and several runbooks. Hosted SaaS reduces some burden, but evaluator success still depends on disciplined navigation through many artifacts.
- **Tradeoffs:** Enterprise trust requires explicit controls; explicit controls increase setup and cognitive load.
- **Improvement recommendations:** compress first-pilot status into a single command center; add fewer, stronger "next action" decisions; make proof collection more self-explanatory.
- **Fixability:** Fixable in v1.

### 5. Correctness

- **Score:** 81
- **Weight:** 8
- **Weighted impact on readiness:** 5.31 points
- **Weighted deficiency signal:** 168
- **Justification:** Contract tests, OpenAPI snapshots, Dapper/SQL repository contracts, schema validation, idempotent commit semantics, data consistency checks, RAG evals, and coverage gates all support correctness. The concern is breadth: the product spans many controllers, modes, config options, and proof paths, so correctness is only as strong as the alignment checks across those seams.
- **Tradeoffs:** Rich capability increases product value but multiplies regression paths.
- **Improvement recommendations:** add more end-to-end proof fixtures across first-pilot, sponsor export, ROI, and quality-gate branches; keep route-tier-policy-nav and OpenAPI checks mandatory.
- **Fixability:** Fixable in v1.

### 6. Stickiness

- **Score:** 77
- **Weight:** 6
- **Weighted impact on readiness:** 3.68 points
- **Weighted deficiency signal:** 162
- **Justification:** Stickiness exists through committed manifests, audit history, policy packs, prior-manifest retrieval, comparison, replay, governance, product learning, and ROI summaries. But without currently scored V1.1 connectors or deeper workflow embedding, the product risks being a valuable review event rather than the daily system of record.
- **Tradeoffs:** Keeping V1 centered on the review artifact avoids integration overreach.
- **Improvement recommendations:** maximize V1 stickiness through repeat-review dashboards, prior-decision reuse, saved views, evidence chains, and handoff to GitHub/Azure DevOps without relying on deferred connectors.
- **Fixability:** Fixable in v1 within REST/CLI/UI/ADO/GitHub boundaries; broader first-party connectors are deferred.

### 7. Proof-of-ROI Readiness

- **Score:** 79
- **Weight:** 5
- **Weighted impact on readiness:** 3.11 points
- **Weighted deficiency signal:** 130
- **Justification:** The scorecard, ROI model, executive summary endpoint, pilot deltas, first-value reports, quote-to-proof packet, and cost grounding are strong. The remaining weakness is baseline integrity: ROI can be buyer-provided, defaulted, demo-derived, or not collected. That is honest, but revenue conversion depends on turning "not collected" into structured input earlier.
- **Tradeoffs:** Honest labels reduce overclaiming but can make the value story feel less automatic.
- **Improvement recommendations:** require ROI-baseline prompts during first-pilot setup and surface sponsor-safe ROI disposition everywhere proof is exported.
- **Fixability:** Fixable in v1.

### 8. Time-to-Value

- **Score:** 84
- **Weight:** 7
- **Weighted impact on readiness:** 4.82 points
- **Weighted deficiency signal:** 126
- **Justification:** The Core Pilot is intentionally narrow: create review, execute, commit, open package. Demo workspaces and accelerator walkthroughs help evaluators see value. The score is not higher because setup and proof collection still require a lot of operator judgment.
- **Tradeoffs:** The system favors real buyer evidence over shallow demo magic.
- **Improvement recommendations:** make the one-sitting path measurable in product, preflight missing prerequisites, and make demo-to-real transition obvious.
- **Fixability:** Fixable in v1.

### 9. Differentiability

- **Score:** 78
- **Weight:** 4
- **Weighted impact on readiness:** 2.35 points
- **Weighted deficiency signal:** 120
- **Justification:** ArchLucid is differentiated by architecture-review-specific manifests, governance, audit, policy packs, provenance, and sponsor exports. But the public proof still needs to prove why this is not "ChatGPT plus a checklist plus a consultant." The technical depth is real; the external differentiation story is less crisp than the system itself.
- **Tradeoffs:** Deep enterprise architecture value is harder to show quickly than generic AI demos.
- **Improvement recommendations:** publish a side-by-side "manual review vs generic AI vs ArchLucid" proof packet with concrete artifacts.
- **Fixability:** Fixable in v1.

### 10. Workflow Embeddedness

- **Score:** 71
- **Weight:** 3
- **Weighted impact on readiness:** 1.69 points
- **Weighted deficiency signal:** 99
- **Justification:** V1 has REST, CLI, operator UI, SCIM, Azure DevOps/GitHub handoff patterns, and proof exports. However, many high-friction workflow homes are deferred: Jira, ServiceNow, Confluence, Slack, Teams, and broad webhook commitments. Those are not scored as missing deferred items, but current V1 embeddedness remains lighter than the product's enterprise ambition.
- **Tradeoffs:** Avoiding premature connector commitments keeps V1 stable.
- **Improvement recommendations:** strengthen current GitHub/Azure DevOps handoff and API/CLI recipes; make webhook/event surfaces honest about current support.
- **Fixability:** Partially fixable in v1; first-party enterprise workflow connectors are deferred.

### 11. Executive Value Visibility

- **Score:** 82
- **Weight:** 4
- **Weighted impact on readiness:** 2.69 points
- **Weighted deficiency signal:** 80
- **Justification:** Executive ROI summaries, sponsor packets, first-value reports, architecture review exports, value reports, and proof bundles give sponsors useful artifacts. The weakness is that executive value still depends on operators collecting clean baselines and choosing the right report.
- **Tradeoffs:** Flexible evidence labels prevent false precision but require discipline.
- **Improvement recommendations:** create one sponsor-readiness gate and one executive packet index that hides internal proof complexity.
- **Fixability:** Fixable in v1.

### 12. Usability

- **Score:** 77
- **Weight:** 3
- **Weighted impact on readiness:** 1.87 points
- **Weighted deficiency signal:** 78
- **Justification:** The UI and docs use progressive disclosure, first-pilot checklists, layer headers, role-aware shaping, and next-action copy. Still, there are many routes, toggles, terms, and proofs. A new operator can complete tasks, but the product imposes a lot of reading and trust in the path.
- **Tradeoffs:** Progressive disclosure helps, but deep enterprise controls remain inherently complex.
- **Improvement recommendations:** reduce first-pilot route ambiguity; remove duplicate checklist entry points; emphasize one primary action after commit.
- **Fixability:** Fixable in v1.

### 13. Trustworthiness

- **Score:** 80
- **Weight:** 3
- **Weighted impact on readiness:** 1.92 points
- **Weighted deficiency signal:** 72
- **Justification:** Trust posture is strong for an early enterprise product: audit, traceability, self-assessment, DPA, subprocessors, tenant isolation, content safety, RLS, and explicit AI output limits. The score is limited because trust in AI findings needs broader live evidence and because procurement-grade third-party assurance is informationally absent, even though not scored as `(A)` debt.
- **Tradeoffs:** Honest caveats reduce marketing gloss but improve real trust.
- **Improvement recommendations:** tie every sponsor-facing AI assertion to evidence coverage, quality gate status, and retrievable trace IDs.
- **Fixability:** Fixable in v1 for product trust; CPA/third-party assurance remains deferred/procurement-only.

### 14. Decision Velocity

- **Score:** 74
- **Weight:** 2
- **Weighted impact on readiness:** 1.13 points
- **Weighted deficiency signal:** 66
- **Justification:** Pricing, order form, pilot scorecard, conversion checklist, quote request, and proof packet all exist. Decision velocity is still slowed by evidence collection, procurement caveats, sales-led quote paths, and the absence of one definitive "send this to buy" packet after first value.
- **Tradeoffs:** Sales-led enterprise motion is appropriate before live self-serve commerce.
- **Improvement recommendations:** produce a single conversion packet generated from proof outputs, with clear next commercial action.
- **Fixability:** Fixable in v1; live Marketplace/Stripe un-hold is deferred.

### 15. Procurement Readiness

- **Score:** 74
- **Weight:** 2
- **Weighted impact on readiness:** 1.18 points
- **Weighted deficiency signal:** 60
- **Justification:** Procurement pack generation, trust center, DPA template, subprocessors, SIG/CAIQ, SOC roadmap, SLOs, security docs, and objection playbooks are good. The score excludes CPA SOC 2 and third-party pen-test publication as deferred/informational, but the current buyer packet still needs clean live-environment evidence and freshness discipline to avoid founder-led explanation.
- **Tradeoffs:** Self-attestation is acceptable for some pilots but not for all enterprises.
- **Improvement recommendations:** make `--deal-ready` procurement pack output a first-class proof artifact and explain non-attestation caveats in one page.
- **Fixability:** Fixable in v1 for packet quality; external attestations deferred.

### 16. Security

- **Score:** 82
- **Weight:** 3
- **Weighted impact on readiness:** 2.04 points
- **Weighted deficiency signal:** 57
- **Justification:** Security posture includes OIDC/SAML, API key modes, RBAC, rate limits, private endpoints, Key Vault, content safety, ZAP, Schemathesis, gitleaks, CodeQL, tenant catalogs, RLS options, prompt redaction, and startup fail-fast rules. Weakness remains in assurance evidence and complex configuration safety, not in lack of controls.
- **Tradeoffs:** Multiple auth modes help adoption but increase misconfiguration risk.
- **Improvement recommendations:** strengthen production-like config linting and publish security reviewer proof from a live staged environment.
- **Fixability:** Fixable in v1.

### 17. Compliance Readiness

- **Score:** 74
- **Weight:** 2
- **Weighted impact on readiness:** 1.21 points
- **Weighted deficiency signal:** 56
- **Justification:** Strong compliance scaffolding exists: SOC self-assessment, trust center, CAIQ/SIG, DPA, subprocessors, audit matrix, policy packs, VPAT draft, DSAR process. This score is not reduced for missing CPA SOC 2. It is reduced for process maturity gaps that are not solved by code: evidence room, owner review cadence, policy operations, and buyer-specific legal completion.
- **Tradeoffs:** Repository evidence is not the same as operating control evidence.
- **Improvement recommendations:** produce a compliance evidence-room index with owner, freshness, and customer-shareability fields.
- **Fixability:** Partially fixable in v1; formal attestations deferred.

### 18. Commercial Packaging Readiness

- **Score:** 76
- **Weight:** 2
- **Weighted impact on readiness:** 1.21 points
- **Weighted deficiency signal:** 56
- **Justification:** Team/Professional/Enterprise pricing, guided pilot, custom pack PS SKUs, order templates, quote request, and commercial tier gates are present. The gap is operational packaging: features, entitlement, quote path, proof path, and purchase next step need a cleaner end-to-end package.
- **Tradeoffs:** Avoiding hard SKU enforcement in V1 keeps product simpler but weakens packaging clarity.
- **Improvement recommendations:** align pricing tier copy, route gating, quote-to-proof packet, and order-form next steps into one commercial closeout artifact.
- **Fixability:** Fixable in v1.

### 19. Architectural Integrity

- **Score:** 82
- **Weight:** 3
- **Weighted impact on readiness:** 2.07 points
- **Weighted deficiency signal:** 54
- **Justification:** The system has clear bounded projects, authority pipeline, persistence contracts, component maps, invariants, architecture tests, and docs explaining the coordinator/authority split. Integrity is strong. The main issue is legacy/coexistence complexity: old run terminology, coordinator paths, and many config seams require careful documentation.
- **Tradeoffs:** Strangler-style coexistence reduces migration risk but increases conceptual load.
- **Improvement recommendations:** continue reducing legacy ambiguity without breaking v1 API contracts.
- **Fixability:** Fixable in v1 incrementally.

### 20. Interoperability

- **Score:** 76
- **Weight:** 2
- **Weighted impact on readiness:** 1.24 points
- **Weighted deficiency signal:** 52
- **Justification:** REST, OpenAPI, CLI, generated clients, SCIM, Azure DevOps/GitHub handoff, ZIP ingest, and export formats are solid. The score reflects current V1 surfaces only; deferred first-party connectors are not deducted. Interoperability can still be smoother through recipes, contract examples, and fewer endpoint-shape surprises.
- **Tradeoffs:** Stable REST/CLI is more reliable than rushed connectors.
- **Improvement recommendations:** add practical integration recipes around the current supported surfaces and verify them in smoke scripts.
- **Fixability:** Fixable in v1 for REST/CLI/CI paths; connector breadth deferred.

### 21. Traceability

- **Score:** 84
- **Weight:** 3
- **Weighted impact on readiness:** 2.12 points
- **Weighted deficiency signal:** 48
- **Justification:** Manifest, audit, decision traces, provenance graph, retrieval grounding traces, correlation IDs, traceability bundle, and evidence refs make the system highly traceable. It is not perfect because some trace comprehensiveness depends on which agent/handler path produced the output and whether live retrieval/quality evidence is populated.
- **Tradeoffs:** Trace detail increases storage and cognitive overhead.
- **Improvement recommendations:** ensure every sponsor-facing finding has a consistent evidence-chain view.
- **Fixability:** Fixable in v1.

### 22. Maintainability

- **Score:** 78
- **Weight:** 2
- **Weighted impact on readiness:** 1.28 points
- **Weighted deficiency signal:** 48
- **Justification:** Project structure, tests, docs, DDL discipline, config catalogs, and architecture constraints are strong. The weakness is sheer volume: many docs, many controllers, many modes, many proof scripts. Drift risk is real despite guards.
- **Tradeoffs:** Modularity and explicit docs improve maintainability but can create sprawl.
- **Improvement recommendations:** strengthen doc freshness/indexing checks and continue consolidating operator entry points.
- **Fixability:** Fixable in v1.

### 23. Reliability

- **Score:** 80
- **Weight:** 2
- **Weighted impact on readiness:** 1.31 points
- **Weighted deficiency signal:** 44
- **Justification:** Health probes, retries, outbox, idempotent commit, data consistency probes, budget cutoffs, cache controls, runbooks, and SLO docs are good. Remaining risk is production fleet evidence: targets and runbooks exist, but live availability and failure-mode evidence are still immature relative to enterprise expectations.
- **Tradeoffs:** V1 single-region posture is intentional and not penalized for active/active absence.
- **Improvement recommendations:** publish staged operational drill artifacts and attach reliability rows to proof bundles.
- **Fixability:** Fixable in v1 for staged/early-production evidence; active/active deferred.

### 24. Azure Compatibility and SaaS Deployment Readiness

- **Score:** 79
- **Weight:** 2
- **Weighted impact on readiness:** 1.31 points
- **Weighted deficiency signal:** 44
- **Justification:** Azure-first architecture, Container Apps/SQL/Blob/Front Door/WAF/private endpoint/Terraform posture, Azure OpenAI, Key Vault, and extractor flows are coherent. Gaps are around live production proof, operator-selected subscription/naming choices, and production commerce readiness, not Azure design direction.
- **Tradeoffs:** Azure-native focus improves coherence but narrows multi-cloud buyer fit; AWS/GCP analysis is deferred and not scored.
- **Improvement recommendations:** make minimal hosted pilot deployment proof repeatable and buyer-safe.
- **Fixability:** Fixable in v1 for Azure path.

### 25. Explainability

- **Score:** 82
- **Weight:** 2
- **Weighted impact on readiness:** 1.33 points
- **Weighted deficiency signal:** 42
- **Justification:** Explanation endpoints, aggregate narratives, provenance, retrieval citations, evidence chains, and AI output decision-support docs are strong. The remaining weakness is proof that explanations are always faithful rather than merely present.
- **Tradeoffs:** Faithfulness gates can reject useful but under-cited narratives.
- **Improvement recommendations:** raise output-side faithfulness eval coverage and show missing-citation examples in operator diagnostics.
- **Fixability:** Fixable in v1.

### 26. Data Consistency

- **Score:** 84
- **Weight:** 2
- **Weighted impact on readiness:** 1.34 points
- **Weighted deficiency signal:** 40
- **Justification:** SQL persistence, DbUp migrations, one DDL source, data consistency probes, orphan detection, idempotency, and readiness collectors are strong. The score is limited by the number of persisted aggregates and the need for proof that the readiness checks are run before sponsor handoff.
- **Tradeoffs:** Strict consistency checks add operational work but protect trust.
- **Improvement recommendations:** make data-consistency readiness mandatory in sponsor proof flows.
- **Fixability:** Fixable in v1.

### 27. Policy and Governance Alignment

- **Score:** 84
- **Weight:** 2
- **Weighted impact on readiness:** 1.38 points
- **Weighted deficiency signal:** 36
- **Justification:** Approval workflow, segregation of duties, pre-commit gate, policy packs, governance dashboard, policy resolution, and seeded bundles are compelling. The main weakness is usability and calibration, not capability.
- **Tradeoffs:** Enforcement improves trust but may block pilot momentum if policy packs are noisy.
- **Improvement recommendations:** improve governance dry-run interpretation and default pack calibration evidence.
- **Fixability:** Fixable in v1.

### 28. Cognitive Load

- **Score:** 76
- **Weight:** 1
- **Weighted impact on readiness:** 0.57 points
- **Weighted deficiency signal:** 32
- **Justification:** The product and docs are dense. Even with progressive disclosure, a user must understand Pilot vs Operate, run vs review, authority vs coordinator, evidence vs proof, sponsor-safe vs internal, and many deferred-scope boundaries.
- **Tradeoffs:** Enterprise-grade honesty is cognitively heavier than simple demo software.
- **Improvement recommendations:** reduce first-session choices and consolidate status vocabulary into the UI.
- **Fixability:** Fixable in v1.

### 29. Auditability

- **Score:** 85
- **Weight:** 2
- **Weighted impact on readiness:** 1.43 points
- **Weighted deficiency signal:** 30
- **Justification:** Append-only audit events, typed event catalog, CSV export, audit search, correlation IDs, audit matrix, SIEM export docs, and traceability bundles make auditability a strength.
- **Tradeoffs:** Audit breadth adds schema and support burden.
- **Improvement recommendations:** keep audit coverage matrix generated/checked against event types as routes evolve.
- **Fixability:** Fixable in v1.

### 30. Availability

- **Score:** 76
- **Weight:** 1
- **Weighted impact on readiness:** 0.61 points
- **Weighted deficiency signal:** 28
- **Justification:** Health endpoints, SLO targets, synthetic probes, and runbooks exist. V1 intentionally avoids active/active guarantees. The gap is live production history and contractual SLA evidence.
- **Tradeoffs:** Single-region V1 is cost-effective and appropriate for early deployments.
- **Improvement recommendations:** publish hosted probe rollups and make staging-vs-production evidence explicit.
- **Fixability:** Fixable in v1 for evidence; active/active deferred.

### 31. Scalability

- **Score:** 74
- **Weight:** 1
- **Weighted impact on readiness:** 0.61 points
- **Weighted deficiency signal:** 28
- **Justification:** The system has async pipeline options, worker role, cache options, SQL read-replica hooks, budget controls, and vector index abstractions. The scaled-fleet posture is plausible, but distributed cache hardening and graph cache distribution are deferred and not scored.
- **Tradeoffs:** Avoiding premature scale infra reduces cost and complexity.
- **Improvement recommendations:** document capacity envelopes and add workload-shape load evidence for core paths.
- **Fixability:** Fixable in v1 for capacity proof; some hardening deferred.

### 32. Extensibility

- **Score:** 76
- **Weight:** 1
- **Weighted impact on readiness:** 0.61 points
- **Weighted deficiency signal:** 28
- **Justification:** Custom agent handler docs, modular handlers, REST/CLI/API, policy packs, and OpenAPI support extensibility. Lack of public plugin SDK/marketplace is deferred and not penalized. Current extensibility is best for advanced integrators, not low-touch third parties.
- **Tradeoffs:** Code-level extension is safer than exposing a premature public ecosystem.
- **Improvement recommendations:** improve handler examples and test harnesses for self-hosted custom extensions.
- **Fixability:** Fixable in v1.

### 33. Customer Self-Sufficiency

- **Score:** 75
- **Weight:** 1
- **Weighted impact on readiness:** 0.61 points
- **Weighted deficiency signal:** 28
- **Justification:** There are onboarding docs, operator paths, troubleshooting, CLI diagnostics, support bundles, procurement packs, and hosted paths. Still, many successful outcomes require knowing which doc to trust and when a warning is acceptable.
- **Tradeoffs:** Deep self-service docs can become a maze.
- **Improvement recommendations:** create a "self-sufficient first pilot" score with one command and one UI page.
- **Fixability:** Fixable in v1.

### 34. Deployability

- **Score:** 78
- **Weight:** 1
- **Weighted impact on readiness:** 0.64 points
- **Weighted deficiency signal:** 24
- **Justification:** Containers, docker compose, Terraform, config validation, health checks, release smoke, and Azure deployment docs exist. The gap is not deployability in principle; it is proving a production-like hosted environment repeatedly.
- **Tradeoffs:** Supporting both local/dev and hosted profiles adds config burden.
- **Improvement recommendations:** tighten minimal hosted pilot deployment smoke and proof output.
- **Fixability:** Fixable in v1.

### 35. Cost-Effectiveness

- **Score:** 79
- **Weight:** 1
- **Weighted impact on readiness:** 0.64 points
- **Weighted deficiency signal:** 24
- **Justification:** LLM budget caps, cost estimation, Azure Retail grounding, cache strategy, hosted AOAI spend guard, and pricing rationale are present. The gap is real-world cost telemetry across pilots and fewer expensive eval/proof paths.
- **Tradeoffs:** Stronger AI quality and live evals cost money.
- **Improvement recommendations:** add COGS-per-review reporting to sponsor/internal proof bundles.
- **Fixability:** Fixable in v1.

### 36. Testability

- **Score:** 79
- **Weight:** 1
- **Weighted impact on readiness:** 0.65 points
- **Weighted deficiency signal:** 23
- **Justification:** The repo has strong test structure, contract tests, SQL tests, UI tests, Playwright, OpenAPI snapshots, and coverage gates. Some live LLM and production-like paths remain optional, which is reasonable but limits proof.
- **Tradeoffs:** Making every live path merge-blocking would be flaky and expensive.
- **Improvement recommendations:** add scheduled evidence artifacts rather than mandatory PR gates for live-mode validation.
- **Fixability:** Fixable in v1.

### 37. Manageability

- **Score:** 80
- **Weight:** 1
- **Weighted impact on readiness:** 0.66 points
- **Weighted deficiency signal:** 22
- **Justification:** Admin config summaries, config lint, auth diagnostics, alert tuning, governance settings, policy packs, and runbooks support manageability. Complexity remains high across many configuration domains.
- **Tradeoffs:** More manageability controls mean more operator choices.
- **Improvement recommendations:** group admin diagnostics by operator intent: auth, evidence, AI, billing, governance, reliability.
- **Fixability:** Fixable in v1.

### 38. Template and Accelerator Richness

- **Score:** 81
- **Weight:** 1
- **Weighted impact on readiness:** 0.68 points
- **Weighted deficiency signal:** 19
- **Justification:** Azure SaaS, AI governance, healthcare claims, policy packs, demo proof packets, custom pack docs, and buyer-job pages provide strong accelerator richness. More vertical depth can wait until customer pull proves demand.
- **Tradeoffs:** Too many accelerators could distract from the core pilot.
- **Improvement recommendations:** keep three strongest accelerators and tie each to proof packet acceptance criteria.
- **Fixability:** Fixable in v1.

### 39. Documentation

- **Score:** 85
- **Weight:** 1
- **Weighted impact on readiness:** 0.70 points
- **Weighted deficiency signal:** 17
- **Justification:** Documentation volume and specificity are high. The weakness is navigation and freshness, not absence.
- **Tradeoffs:** Detailed docs help operators but can overwhelm evaluators.
- **Improvement recommendations:** enforce canonical entry points and archive/redirect duplicate routes.
- **Fixability:** Fixable in v1.

### 40. Supportability

- **Score:** 87
- **Weight:** 1
- **Weighted impact on readiness:** 0.71 points
- **Weighted deficiency signal:** 16
- **Justification:** Correlation IDs, support bundles, diagnostics, troubleshooting, config lint, health checks, audit rows, OpenTelemetry, and runbooks make supportability strong.
- **Tradeoffs:** Support evidence needs to stay easy to collect, not just available.
- **Improvement recommendations:** integrate support bundle links into failed proof and sponsor HOLD outputs.
- **Fixability:** Fixable in v1.

### 41. Performance

- **Score:** 76
- **Weight:** 1
- **Weighted impact on readiness:** 0.59 points
- **Weighted deficiency signal:** 30
- **Justification:** There are rate limits, cache options, token budgets, capacity docs, and performance-related tests. There is less evidence of sustained load, latency under realistic AI workloads, and cost/latency tradeoff measurement.
- **Tradeoffs:** Early products should not over-optimize before pilot workloads are known.
- **Improvement recommendations:** add a small repeatable performance envelope for create/execute/commit/export and Ask.
- **Fixability:** Fixable in v1.

## 3. Top 12 Most Important Weaknesses

1. **AI quality proof is not yet broad enough for the product's claims.** The infrastructure is strong, but buyer trust needs larger real/simulator eval cohorts, failure examples, and recurring evidence.
2. **The first-pilot path is documented but still cognitively heavy.** Too many docs, statuses, scripts, and caveats can slow first value.
3. **Commercial conversion depends on disciplined ROI baseline collection.** The system labels missing/defaulted/demo ROI honestly, but that weakens closeout if not captured early.
4. **Differentiation is stronger in the codebase than in the buyer proof.** The product needs to show why ArchLucid beats generic AI and manual checklists.
5. **Workflow embeddedness is currently lighter than enterprise buying habits.** V1 surfaces are useful, but daily systems like Jira/ServiceNow/Confluence/Slack are deferred.
6. **Procurement readiness is credible but pre-attestation.** SOC 2 CPA and third-party pen test are deferred, so the trust packet must be exceptionally clean.
7. **Route/config/scope complexity creates drift risk.** The repo has many safeguards, but the product surface is large.
8. **Proof generation is powerful but fragmented.** Sponsor, procurement, data consistency, config lint, and commercial next-step artifacts need one owner-facing summary.
9. **Live hosted evidence is not as strong as repo evidence.** Docs and CI are strong; production-like repeated proof needs to be easier to inspect.
10. **Current stickiness can look event-based rather than system-of-record-based.** Repeat-review, prior-decision, and governance loops need stronger default visibility.
11. **Performance and capacity evidence is thinner than correctness evidence.** Capacity envelopes exist, but realistic workload benchmarks need more buyer-safe output.
12. **Documentation is abundant enough to become a liability.** The canonical path must stay aggressively curated.

## 4. Top 6 Monetization Blockers

1. **Sponsor-safe ROI is not guaranteed unless baselines are collected.** Without buyer-provided or clearly accepted baselines, the purchase story loses force.
2. **The closeout packet is not yet a single buyer decision artifact.** Proof, procurement, scorecard, and order-form paths exist but can feel separate.
3. **The differentiated value story is not sharp enough.** Buyers need a concrete artifact comparison against manual review and generic AI.
4. **Sales-led quote motion requires fast follow-up discipline.** Quote requests and pricing exist; CRM/owner routing remains a practical conversion risk.
5. **Trust discounts are still structurally embedded in pricing.** This is rational, but it signals pre-reference/pre-attestation maturity to sophisticated buyers.
6. **Deferred self-serve commerce limits low-touch conversion.** Not scored against `(A)`, but it still slows revenue capture.

## 5. Top 6 Enterprise Adoption Blockers

1. **Pre-attestation trust posture.** SOC 2 CPA and third-party pen test absence are `(B)` only, but they will stop some procurement teams.
2. **Implementation complexity.** SQL, auth, evidence ingestion, quality gates, proof scripts, and policy packs need a guided path to avoid buyer fatigue.
3. **Workflow-system gaps in the current scored surface.** REST/CLI/UI are solid, but some enterprises expect Jira/ServiceNow/Confluence/Slack flows.
4. **Security evidence must be generated, not explained verbally.** Procurement needs fresh pack output, config lint, data consistency, and route/policy/nav guard artifacts.
5. **AI trust must be demonstrable on the buyer's evidence.** Generic faithfulness reports will not replace pilot-specific traceability.
6. **Operator self-sufficiency is not yet effortless.** The product still benefits from a knowledgeable operator or sales engineer.

## 6. Top 6 Engineering Risks

1. **AI/agent output drift under real LLM mode.** Optional live gates mean real-mode quality can regress without blocking all PRs.
2. **Cross-surface drift.** API policy, commercial tier, UI nav, docs, OpenAPI clients, and proof scripts can diverge.
3. **Configuration missteps in production-like environments.** Many modes and keys create security/reliability risk if linting is skipped.
4. **Retrieval faithfulness and tenancy safety.** RAG is improving, but retrieval remains a high-trust path that must keep tenancy, citations, and model drift locked.
5. **Data consistency across many persisted aggregates.** The SQL model is broad; sponsor readiness depends on consistency probes being run.
6. **Operational evidence gaps.** Health/SLO docs are good, but live workload, availability, and failure-mode evidence need stronger recurring artifacts.

## 7. Most Important Truth

ArchLucid is not blocked by missing deferred roadmap items; it is blocked by **operating the proof system on real buyer evidence** — command center, quality dashboard, commercial closeout, and sponsor-safe ROI labels must be exercised on every design-partner handoff until SEND becomes routine without founder narration.

## 8. Top Improvement Opportunities

### 1. Sponsor-Safe First-Pilot Proof Command Center

**COMPLETED:** Consolidated command center (`first-pilot-command-center.md` / `.json`) with phased READY/WARN/HOLD/DEFERRED vocabulary, tests for SEND/HOLD/DEFERRED_SCOPE, and integration in `collect-first-pilot-proof.ps1`.

- **Why it matters:** The product already generates many artifacts; the buyer needs one decisive status.
- **Expected impact:** Faster sponsor handoff, lower adoption friction, clearer revenue motion.
- **Affected qualities:** Time-to-Value, Adoption Friction, Executive Value Visibility, Proof-of-ROI Readiness, Customer Self-Sufficiency.
- **Actionability:** Fully actionable now.
- **Cursor prompt:**

```text
Implement a sponsor-safe first-pilot proof command center that consolidates existing proof outputs without inventing new product scope.

Scope:
- Start from docs/runbooks/FIRST_PILOT_OPERATOR_PATH.md and scripts/collect-first-pilot-proof.ps1.
- Produce or update a single markdown artifact named first-pilot-command-center.md under the existing proof output directory.
- Include status rows for platform readiness, committed review, data consistency, PilotStrict/quality posture, sponsor packet disposition, ROI basis, procurement pack readiness, and commercial next step.
- Use only existing statuses READY/WARN/HOLD/DEFERRED/NEXT ACTION.
- Link to existing generated artifacts instead of duplicating their full content.
- Add tests or script-level assertions for at least SEND, HOLD, and DEFERRED_SCOPE scenarios.

Acceptance criteria:
- A sponsor-handoff run produces one command-center file that clearly says SEND, HOLD, or DEFERRED_SCOPE.
- Missing runId is WARN in readiness-only mode, not a crash.
- Data consistency HOLD blocks sponsor handoff.
- ROI demo-derived or not-collected state is visible and sponsor-safe.
- No V1.1/V2 deferred items are treated as V1 failures.

Constraints:
- Do not add new product commitments or connector requirements.
- Do not change existing proof artifact filenames except by linking to them.
- Do not remove existing detailed proof outputs.
```

- **Impact of running prompt:** Directly improves Adoption Friction (+5-7 pts), Time-to-Value (+3-5 pts), Executive Value Visibility (+4-6 pts), Customer Self-Sufficiency (+5-7 pts). Weighted readiness impact: **+0.8-1.2%**.

### 2. AI Quality Evidence Dashboard for Golden Cohorts

**COMPLETED:** `scripts/ci/generate_agent_quality_dashboard.py` emits `docs/quality/agent-quality-dashboard.md`; `generate_real_llm_run_evidence.py` emits `real-llm-run-evidence.md`; AGENT_QUALITY_STRICT_MODE_PILOT.md updated.

- **Why it matters:** The highest-weight weakness is proving AI quality, not adding more AI features.
- **Expected impact:** Stronger trust in agent output and fewer buyer objections around hallucination.
- **Affected qualities:** AI/Agent Readiness, Cutting-Edge AI Technology, Correctness, Trustworthiness, Explainability.
- **Actionability:** Fully actionable now.
- **Cursor prompt:**

```text
Create a repository-native AI quality evidence dashboard artifact for golden-cohort and faithfulness runs.

Scope:
- Use existing docs/library/AGENT_OUTPUT_EVALUATION.md, docs/quality/faithfulness-report.md, tests/eval-datasets, and scripts/ci eval tooling.
- Add or update a script that emits docs/quality/agent-quality-dashboard.md from the latest available local artifacts.
- Include case counts, support ratios, retrieval IR metrics when available, PilotStrict thresholds, unsupported ROI/cost claims, wrong-corpus detections, and skipped live-mode reasons.
- Add a buyer-safe summary section and an internal-only caveats section.
- Update docs/runbooks/AGENT_QUALITY_STRICT_MODE_PILOT.md to point to the dashboard.

Acceptance criteria:
- The dashboard can be regenerated locally from committed or generated quality artifacts.
- It clearly distinguishes simulator, deterministic, and real Azure OpenAI evidence.
- It never claims live LLM quality when live evidence was skipped.
- It flags unsupported ROI/cost claims separately from citation misses.

Constraints:
- Do not make live Azure OpenAI CI merge-blocking.
- Do not introduce a new eval framework unless existing scripts cannot support the output.
- Do not include secrets or raw prompts containing customer data.
```

- **Impact of running prompt:** Directly improves AI/Agent Readiness (+5-8 pts), Cutting-Edge AI Technology (+4-6 pts), Trustworthiness (+3-5 pts), Explainability (+3-4 pts). Weighted readiness impact: **+1.0-1.5%**.

### 3. ROI Baseline Capture Before First Sponsor Packet

**COMPLETED:** ROI basis labels in scorecard and operator path (Phase D2a); proof pipeline surfaces `roiBasisStatus`, sponsor-safe disposition, and demo-derived commercial gate.

- **Why it matters:** Monetization depends on credible buyer-specific ROI, not generic savings.
- **Expected impact:** More sponsor-safe closeouts and fewer weak conversion asks.
- **Affected qualities:** Proof-of-ROI Readiness, Commercial Packaging Readiness, Decision Velocity, Executive Value Visibility.
- **Actionability:** Fully actionable now.
- **Cursor prompt:**

```text
Add first-pilot ROI baseline capture to the existing operator/proof flow.

Scope:
- Update docs/go-to-market/PILOT_SUCCESS_SCORECARD.md and docs/runbooks/FIRST_PILOT_OPERATOR_PATH.md with a minimal baseline capture block.
- Extend the proof collection path to record review-cycle hours, architect prep hours, documentation effort, evidence assembly effort, and baseline source labels: Buyer-provided, Defaulted, Demo-derived, Not collected.
- Ensure generated proof artifacts include a sponsor-safe ROI disposition: SAFE, CAVEATED, or HOLD.
- If there is an existing JSON artifact for commercial next step, add these fields there rather than creating a parallel schema.

Acceptance criteria:
- Sponsor proof marks ROI as HOLD when dollar claims are present but basis is missing or unsafe.
- Demo-derived ROI is allowed only for demo walkthrough shape, not buyer outcome claims.
- Buyer-provided baseline is surfaced in the closeout summary.
- Existing scorecard language stays aligned with generated artifact names.

Constraints:
- Do not invent ROI numbers.
- Do not require buyers to provide all fields before a technical pilot can run.
- Do not change pricing numbers.
```

- **Impact of running prompt:** Directly improves Proof-of-ROI Readiness (+6-9 pts), Executive Value Visibility (+3-5 pts), Decision Velocity (+4-6 pts). Weighted readiness impact: **+0.6-1.0%**.

### 4. Buyer Differentiation Proof Packet

**COMPLETED:** `docs/go-to-market/DIFFERENTIATION_PROOF_PACKET.md` with evidence-linked matrix, walkthrough, and "not a fit yet" paragraph; linked from START_HERE and BUYER_ORIENTATION_ONE_SCREEN.

- **Why it matters:** The product needs a concrete answer to "why not generic AI or a consultant checklist?"
- **Expected impact:** Higher marketability and faster executive understanding.
- **Affected qualities:** Marketability, Differentiability, Executive Value Visibility, Decision Velocity.
- **Actionability:** Fully actionable now.
- **Cursor prompt:**

```text
Create a buyer-safe differentiation proof packet comparing manual review, generic AI assistance, and ArchLucid.

Scope:
- Add docs/go-to-market/DIFFERENTIATION_PROOF_PACKET.md.
- Use current V1 capabilities only: architecture review package, golden manifest, audit trail, evidence refs, policy packs, provenance/explain, ROI labels, exports.
- Include a concise comparison matrix, but make it evidence-linked rather than marketing-only.
- Add one walkthrough using the existing demo seed or proof packet structure.
- Link from docs/START_HERE.md buyer/evaluator path and docs/go-to-market/BUYER_ORIENTATION_ONE_SCREEN.md.

Acceptance criteria:
- The document explains exactly what ArchLucid produces that generic AI does not: committed manifest, audit trail, governance gate, evidence refs, repeatable export, and sponsor packet.
- It does not claim SOC 2 CPA, third-party pen test, V1.1 connectors, MCP, or live Marketplace checkout.
- It includes a "when ArchLucid is not a fit yet" paragraph.

Constraints:
- Do not add new product claims.
- Do not use vague best-practice language without evidence links.
- Do not repeat pricing numbers; link to canonical pricing docs.
```

- **Impact of running prompt:** Directly improves Marketability (+4-7 pts), Differentiability (+8-10 pts), Decision Velocity (+3-5 pts). Weighted readiness impact: **+0.7-1.1%**.

### 5. Route / Tier / Policy / Navigation Drift Gate Hardening

**COMPLETED:** Existing `assert_route_tier_policy_nav.py` registry + matrix coverage retained; first-pilot proof emits `route-tier-policy-nav-parity.md` and contract tests guard proof pipeline integration.

- **Why it matters:** Commercial and enterprise trust depend on API gates, UI visibility, and docs staying aligned.
- **Expected impact:** Lower risk of entitlement leaks and buyer confusion.
- **Affected qualities:** Correctness, Security, Commercial Packaging Readiness, Maintainability, Trustworthiness.
- **Actionability:** Fully actionable now.
- **Cursor prompt:**

```text
Harden route-tier-policy-navigation drift checks around all buyer-visible operator routes.

Scope:
- Start from docs/library/ROUTE_TIER_POLICY_NAV_MATRIX.md and scripts/ci/assert_route_tier_policy_nav.py.
- Ensure the assertion covers API controller policies, commercial tier attributes, archlucid-ui nav-config entries, and documented matrix rows.
- Add focused tests or fixtures for at least one Pilot route, one Operate analysis route, one Operate governance route, and one Enterprise-only audit export route.
- Update docs/library/PRODUCT_PACKAGING.md only where the matrix proves existing copy is stale.

Acceptance criteria:
- The drift script fails with an actionable message when a route is in UI nav but missing from the matrix.
- The drift script fails when an Operate mutation route lacks the expected authority/tier metadata.
- Enterprise audit export remains explicitly distinct from ordinary audit reads.
- The check can be run locally without secrets.

Constraints:
- Do not change route behavior unless a test proves existing behavior contradicts current docs.
- Do not widen commercial tier access.
- Do not add new pricing tiers.
```

- **Impact of running prompt:** Directly improves Correctness (+3-5 pts), Security (+2-4 pts), Maintainability (+3-5 pts), Commercial Packaging Readiness (+4-6 pts). Weighted readiness impact: **+0.5-0.8%**.

### 6. Real-Mode LLM Evidence Without Merge-Blocking Flake

**COMPLETED:** `generate_real_llm_run_evidence.py` + template linkage; skipped-reason path when secrets unavailable; not PR merge-blocking.

- **Why it matters:** Buyers need real-mode confidence, but PR gates should not depend on secret-backed LLM calls.
- **Expected impact:** Better AI trust and stronger engineering evidence.
- **Affected qualities:** AI/Agent Readiness, Cutting-Edge AI Technology, Reliability, Testability, Cost-Effectiveness.
- **Actionability:** Fully actionable now.
- **Cursor prompt:**

```text
Add a scheduled or manually triggered real-mode LLM evidence artifact path that does not block ordinary PRs.

Scope:
- Use existing golden-cohort and real Azure OpenAI prereq scripts documented in docs/engineering/BUILD.md and docs/runbooks/GOLDEN_COHORT_REAL_LLM_GATE.md.
- Emit a markdown summary under docs/quality/real-llm-run-evidence.md or a generated artifact path referenced by docs/quality/REAL_LLM_RUN_EVIDENCE_TEMPLATE.md.
- Include run date, model deployment alias, scenario count, pass/fail, faithfulness ratio, token/cost estimate, skipped reason, and known caveats.
- Add documentation for how to interpret skipped runs.

Acceptance criteria:
- The workflow can be skipped safely when secrets are unavailable and reports why.
- The artifact distinguishes deterministic simulator quality from real LLM behavior.
- Cost estimate and token totals are included when available.
- No raw secret, endpoint key, or customer prompt is printed.

Constraints:
- Do not make live LLM checks mandatory on pull_request.
- Do not require changing Azure resources.
- Do not weaken existing simulator or schema gates.
```

- **Impact of running prompt:** Directly improves AI/Agent Readiness (+4-7 pts), Cutting-Edge AI Technology (+3-5 pts), Testability (+3-5 pts), Cost-Effectiveness (+2-3 pts). Weighted readiness impact: **+0.8-1.2%**.

### 7. Procurement Pack Deal-Ready One-Pager

**COMPLETED:** `docs/go-to-market/PROCUREMENT_DEAL_READY_ONE_PAGER.md` with `(B)` labels, `--deal-ready` scope, and accessibility honesty cross-links.

- **Why it matters:** Procurement reviewers need a quick, honest index before the full evidence ZIP.
- **Expected impact:** Lower enterprise buyer friction without pretending deferred attestations exist.
- **Affected qualities:** Procurement Readiness, Compliance Readiness, Trustworthiness, Customer Self-Sufficiency.
- **Actionability:** Fully actionable now.
- **Cursor prompt:**

```text
Create a procurement deal-ready one-pager generated or assembled from existing procurement pack evidence.

Scope:
- Use scripts/build_procurement_pack.py, docs/go-to-market/HOW_TO_REQUEST_PROCUREMENT_PACK.md, docs/go-to-market/TRUST_CENTER.md, and docs/go-to-market/PROCUREMENT_OBJECTION_PLAYBOOK.md.
- Add docs/go-to-market/PROCUREMENT_DEAL_READY_ONE_PAGER.md or update the existing procurement deal-ready doc if present.
- Include: what is available now, what is self-assessment, what is deferred, what requires legal review, and how to request the full pack.
- Include explicit `(B)` labels for SOC 2 CPA and third-party pen-test friction.

Acceptance criteria:
- The one-pager never implies SOC 2 Type I/II is issued.
- It links to CAIQ, SIG, DPA template, subprocessors, SOC roadmap, SLOs, tenant isolation, and security architecture.
- It explains what the `--deal-ready` check proves and what it does not prove.

Constraints:
- Do not create new assurance claims.
- Do not duplicate long compliance tables.
- Do not place buyer-specific legal names in repo.
```

- **Impact of running prompt:** Directly improves Procurement Readiness (+5-7 pts), Compliance Readiness (+3-5 pts), Trustworthiness (+2-4 pts). Weighted readiness impact: **+0.3-0.6%**.

### 8. First-Pilot Cognitive Load Reduction Pass

**COMPLETED:** START_HERE "do not read yet" list, canonical checklist demotion, REPEAT_REVIEW and differentiation links; operator path remains single checklist.

- **Why it matters:** The first-pilot path is the buyer's first experience of product quality.
- **Expected impact:** Faster onboarding and fewer support interventions.
- **Affected qualities:** Adoption Friction, Time-to-Value, Usability, Cognitive Load, Customer Self-Sufficiency.
- **Actionability:** Fully actionable now.
- **Cursor prompt:**

```text
Perform a focused cognitive-load reduction pass on the first-pilot documentation path.

Scope:
- Edit only docs/START_HERE.md, docs/CORE_PILOT.md, docs/runbooks/FIRST_PILOT_OPERATOR_PATH.md, docs/onboarding/EVALUATOR_WORKBOOK.md, and links needed to preserve navigation.
- Ensure there is one canonical operational checklist and one short narrative.
- Remove or demote duplicate "start here" language.
- Add a short "do not read yet" list for docs that are depth or recovery only.

Acceptance criteria:
- A new evaluator can identify the next document to open in under one screen.
- CORE_PILOT remains the narrative; FIRST_PILOT_OPERATOR_PATH remains the checklist.
- V1.1 connectors, MCP, live commerce, and Operate depth remain optional/deferred until after first commit.
- No product claims change.

Constraints:
- Do not delete deep docs.
- Do not rename API paths or DTOs.
- Do not touch code.
```

- **Impact of running prompt:** Directly improves Adoption Friction (+5-7 pts), Cognitive Load (+8-12 pts), Usability (+4-6 pts), Time-to-Value (+2-4 pts). Weighted readiness impact: **+0.6-0.9%**.

### 9. V1 Workflow Handoff Hardening for GitHub and Azure DevOps

**COMPLETED:** `FirstPilotWorkflowHandoff.ps1` + fixtures/tests; proof emits paste-ready comments with runId, disposition, and artifact links.

- **Why it matters:** Current V1 workflow embeddedness should be maximized without waiting for deferred connectors.
- **Expected impact:** Better stickiness and implementation fit using supported surfaces.
- **Affected qualities:** Workflow Embeddedness, Stickiness, Interoperability, Adoption Friction.
- **Actionability:** Fully actionable now.
- **Cursor prompt:**

```text
Harden the V1 workflow handoff path for GitHub and Azure DevOps using existing supported surfaces.

Scope:
- Start from docs/runbooks/V1_WORKFLOW_HANDOFF_GITHUB_AZDO.md and fixtures under docs/runbooks/fixtures/.
- Ensure the handoff includes runId, manifest id, sponsor packet link/path, evidence manifest checksum, go/no-go disposition, and next action.
- Add or update sample comments for GitHub and Azure DevOps.
- If scripts already generate these comments, add tests or fixture assertions; otherwise, keep this docs/fixture-only.

Acceptance criteria:
- A reviewer can paste or generate a work-item/PR comment that links all first-pilot proof artifacts.
- The handoff does not require Jira, ServiceNow, Confluence, Slack, Teams, or V1.1 webhooks.
- Deferred integration needs are labeled as DEFERRED_SCOPE, not failures.

Constraints:
- Do not implement new first-party connectors.
- Do not add external service dependencies.
- Do not expose customer secrets or raw evidence contents.
```

- **Impact of running prompt:** Directly improves Workflow Embeddedness (+5-7 pts), Stickiness (+3-5 pts), Interoperability (+3-4 pts). Weighted readiness impact: **+0.4-0.7%**.

### 10. Sponsor Packet Quality Gate Integration

**COMPLETED:** `FirstPilotAiQualityProof.ps1`, consolidated AI readiness gate, and sponsor-handoff HOLD rules integrated into go-no-go and command center outputs.

- **Why it matters:** AI trust must be enforced at the exact moment outputs leave the team.
- **Expected impact:** Fewer unsafe sponsor sends and clearer caveats.
- **Affected qualities:** Trustworthiness, AI/Agent Readiness, Correctness, Explainability, Proof-of-ROI Readiness.
- **Actionability:** Fully actionable now.
- **Cursor prompt:**

```text
Integrate existing PilotStrict and faithfulness quality signals into sponsor packet generation.

Scope:
- Locate sponsor packet / first-value report / proof bundle generation paths.
- Add a quality posture block that includes PilotStrict mode, structural score, semantic score, faithfulness support ratio, citation coverage, and any caveats.
- If a required quality signal is missing, mark sponsor disposition WARN or HOLD according to existing proof rules.
- Update docs/runbooks/AGENT_QUALITY_STRICT_MODE_PILOT.md and docs/runbooks/FIRST_PILOT_OPERATOR_PATH.md to describe the output.

Acceptance criteria:
- Sponsor packet clearly states whether AI quality evidence is PASS, WARN, or HOLD.
- Unsupported ROI/cost claims block or caveat sponsor send.
- Missing quality data is not silently treated as passing.
- Existing internal-only trace details are not dumped into buyer-facing summaries.

Constraints:
- Reuse existing quality evaluators and proof statuses.
- Do not invent new quality metrics if existing metrics cover the need.
- Do not make all local/dev runs require real LLM evidence.
```

- **Impact of running prompt:** Directly improves Trustworthiness (+4-6 pts), AI/Agent Readiness (+3-5 pts), Correctness (+2-4 pts), Explainability (+3-5 pts). Weighted readiness impact: **+0.6-1.0%**.

### 11. Capacity Envelope Proof for Core Pilot

**COMPLETED:** `scale-envelope-evidence.md` / timing budget artifacts in first-pilot proof pipeline; capacity docs linked from proof findings.

- **Why it matters:** Performance and scalability are weaker than correctness evidence.
- **Expected impact:** More credible enterprise and operator expectations.
- **Affected qualities:** Performance, Scalability, Reliability, Cost-Effectiveness, Azure Compatibility and SaaS Deployment Readiness.
- **Actionability:** Fully actionable now.
- **Cursor prompt:**

```text
Add a core-pilot capacity envelope proof artifact.

Scope:
- Start from docs/library/V1_CAPACITY_ENVELOPE.md and docs/library/CAPACITY_AND_COST_PLAYBOOK.md.
- Define a minimal repeatable measurement set for create review, execute/authority pipeline, commit, artifact export, Ask retrieval, and sponsor packet generation.
- Add a script or documented command sequence only if existing scripts can produce the data; otherwise create a clear manual evidence template.
- Include latency, throughput assumptions, LLM token/cost assumptions, SQL dependency, and known non-goals.

Acceptance criteria:
- The artifact states a realistic V1 envelope without claiming untested active/active or hyperscale behavior.
- It separates simulator, real LLM, local, staging, and hosted evidence.
- It includes what operators should monitor when envelope limits are approached.

Constraints:
- Do not add new infrastructure.
- Do not claim production SLA measurements from staging.
- Do not penalize absence of V2 distributed cache enhancements.
```

- **Impact of running prompt:** Directly improves Performance (+6-10 pts), Scalability (+4-6 pts), Reliability (+2-4 pts), Cost-Effectiveness (+2-4 pts). Weighted readiness impact: **+0.2-0.4%**.

### 12. Evidence Chain View for Every Sponsor-Facing Finding

**COMPLETED:** `FindingEvidenceChainService` + API/application tests; trace chain summary in proof bundle (`committed-review-trace-chain-summary.md`).

- **Why it matters:** Findings are only trusted when evidence is visible and reviewable.
- **Expected impact:** Better correctness, trust, explainability, and enterprise adoption.
- **Affected qualities:** Traceability, Trustworthiness, Explainability, Correctness, Auditability.
- **Actionability:** Fully actionable now.
- **Cursor prompt:**

```text
Ensure every sponsor-facing finding has a consistent evidence-chain view.

Scope:
- Start from ArchLucid.Application/Explanation/FindingEvidenceChainService.cs and related tests.
- Verify sponsor exports, first-value reports, and review detail output all use the same evidence-chain source where practical.
- Add missing fields or links only if the data already exists: evidence refs, retrieval grounding ids, manifest id, run id, audit/correlation id.
- Add tests for at least one finding with complete evidence and one finding with missing evidence.

Acceptance criteria:
- Sponsor-facing outputs show complete evidence-chain metadata when available.
- Missing evidence is visible as a caveat, not hidden.
- No output exposes secrets or raw internal prompts.
- Tests prove consistent behavior across at least two output surfaces.

Constraints:
- Do not change manifest canonical hashes.
- Do not require new RAG features.
- Do not duplicate evidence-chain logic in multiple services.
```

- **Impact of running prompt:** Directly improves Traceability (+3-5 pts), Explainability (+4-6 pts), Trustworthiness (+3-5 pts), Correctness (+2-4 pts). Weighted readiness impact: **+0.4-0.7%**.

### 13. Config Lint Profile for Buyer-Safe Hosted Pilot

**COMPLETED:** Production-like hosted pilot config lint in proof pipeline with BLOCK/WARN grouping; sponsor handoff can HOLD on blocking findings.

- **Why it matters:** Production-like misconfiguration is a major security and reliability risk.
- **Expected impact:** Cleaner hosted pilots and less manual review.
- **Affected qualities:** Security, Reliability, Deployability, Manageability, Procurement Readiness.
- **Actionability:** Fully actionable now.
- **Cursor prompt:**

```text
Strengthen the production-like hosted pilot config lint profile.

Scope:
- Start from docs/library/CONFIGURATION_REFERENCE.md, ArchLucid.Core configuration validators, and admin config lint routes.
- Ensure the production-like-hosted-pilot profile covers auth bypass, CORS, telemetry export, LLM redaction, Content Safety, SQL connection posture, billing safety, and Key Vault/secret provider expectations.
- Update generated markdown output to group findings as BLOCKING vs ADVISORY with exact remediation.
- Add unit tests for at least three blocking misconfigurations and two advisory warnings.

Acceptance criteria:
- Sponsor handoff can block on HOLD when production-like config lint has blocking findings.
- No secret values are printed.
- Development defaults are not mislabeled as production-safe.
- Docs and CLI/API outputs use the same profile names.

Constraints:
- Do not require all optional enterprise features for every pilot.
- Do not make V1.1/V2 items blocking.
- Do not loosen existing production fail-fast rules.
```

- **Impact of running prompt:** Directly improves Security (+3-5 pts), Deployability (+3-5 pts), Manageability (+3-5 pts), Procurement Readiness (+2-4 pts). Weighted readiness impact: **+0.4-0.7%**.

### 14. Documentation Freshness and Canonical Entry Guard

**COMPLETED:** `scripts/ci/check_canonical_doc_entry.py` + existing `check_doc_freshness.py`; START_HERE canonical entry preserved.

- **Why it matters:** Documentation is strong but at risk of overwhelming or drifting.
- **Expected impact:** Better maintainability and evaluator self-sufficiency.
- **Affected qualities:** Documentation, Maintainability, Customer Self-Sufficiency, Cognitive Load.
- **Actionability:** Fully actionable now.
- **Cursor prompt:**

```text
Add a documentation freshness and canonical-entry guard for the buyer/operator path.

Scope:
- Check docs/START_HERE.md, docs/CORE_PILOT.md, docs/runbooks/FIRST_PILOT_OPERATOR_PATH.md, docs/go-to-market/TRUST_CENTER.md, and docs/library/V1_SCOPE.md.
- Add or update a lightweight script that verifies required "Last reviewed" metadata where the repo already expects it and verifies canonical links are present.
- Fail or warn on duplicate "canonical checklist" claims outside FIRST_PILOT_OPERATOR_PATH.
- Document how to run the guard locally.

Acceptance criteria:
- The guard detects if another doc claims to be the canonical first-pilot checklist.
- Trust/procurement docs without freshness metadata are reported.
- Existing deep docs remain allowed as depth/recovery references.

Constraints:
- Do not rewrite all docs.
- Do not require every markdown file in the repo to have metadata.
- Do not scan docs/archive as current evidence.
```

- **Impact of running prompt:** Directly improves Documentation (+4-6 pts), Maintainability (+3-5 pts), Cognitive Load (+3-5 pts). Weighted readiness impact: **+0.2-0.4%**.

### 15. Default Policy Pack Calibration Evidence

**COMPLETED:** `docs/go-to-market/DEFAULT_POLICY_PACK_CALIBRATION.md` with severity, dry-run, and false-positive guidance.

- **Why it matters:** Policy packs are a core enterprise differentiator but can backfire if noisy.
- **Expected impact:** Better governance trust and fewer false positives.
- **Affected qualities:** Policy and Governance Alignment, Trustworthiness, Correctness, Usability.
- **Actionability:** Fully actionable now.
- **Cursor prompt:**

```text
Create calibration evidence for bundled default policy packs.

Scope:
- Start from docs/go-to-market/DEFAULT_POLICY_PACKS_V1.md, bundled policy pack manifests, and policy-pack tests.
- Add a buyer/operator calibration note explaining expected severity, false-positive handling, dry-run interpretation, and when to enforce BlockCommitOnCritical.
- Add tests or fixtures for at least one Azure WAF/security baseline pack and one AI governance pack if existing test infrastructure supports it.

Acceptance criteria:
- Operators can distinguish advisory, warning, and blocking policy findings.
- Default packs are not described as statutory certification.
- Dry-run output has clear next steps before enforcement.

Constraints:
- Do not add new policy packs unless necessary for tests.
- Do not claim compliance certification.
- Do not change default enforcement behavior without explicit tests and docs.
```

- **Impact of running prompt:** Directly improves Policy and Governance Alignment (+4-6 pts), Trustworthiness (+2-4 pts), Usability (+2-4 pts). Weighted readiness impact: **+0.3-0.5%**.

### 16. Commercial Closeout Packet Generator

**COMPLETED:** `FirstPilotCommercialCloseout.ps1` emits `commercial-closeout.md` / `.json` from proof states with deterministic next action.

- **Why it matters:** The product needs to turn proof into a purchase decision quickly.
- **Expected impact:** Better decision velocity and monetization.
- **Affected qualities:** Decision Velocity, Commercial Packaging Readiness, Proof-of-ROI Readiness, Executive Value Visibility.
- **Actionability:** Fully actionable now.
- **Cursor prompt:**

```text
Create a commercial closeout packet generator or generated artifact using existing proof outputs.

Scope:
- Start from docs/go-to-market/COMMERCIAL_CONVERSION_CHECKLIST.md, QUOTE_TO_PROOF_PACKET.md, QUOTE_TO_PILOT_PACK.md, ORDER_FORM_TEMPLATE.md, and first-pilot proof artifacts.
- Generate or document a single commercial-closeout.md artifact that states recommended next action: Evidence Pack, ARB Report, Annual Order Form, HOLD, or DEFERRED_SCOPE.
- Include ROI basis, sponsor packet disposition, procurement status, tier recommendation, and caveats.

Acceptance criteria:
- The artifact never asks for annual conversion from a vague demo.
- The next action is deterministic from existing proof states.
- Deferred buyer requirements are labeled DEFERRED_SCOPE and not treated as V1 failures.
- Pricing numbers are linked to canonical sources, not duplicated unless already required.

Constraints:
- Do not create CRM integration.
- Do not change legal terms.
- Do not enable live Stripe or Marketplace.
```

- **Impact of running prompt:** Directly improves Decision Velocity (+7-10 pts), Commercial Packaging Readiness (+5-8 pts), Proof-of-ROI Readiness (+3-5 pts). Weighted readiness impact: **+0.5-0.8%**.

### 17. OpenAPI / Client / UI Type Drift Quick Fix Loop

**COMPLETED:** `OPENAPI_CONTRACT_DRIFT.md` one-sequence section for snapshot + .NET client + UI type regeneration.

- **Why it matters:** API contract drift breaks integrators and reduces correctness confidence.
- **Expected impact:** Stronger interoperability and maintainability.
- **Affected qualities:** Correctness, Interoperability, Maintainability, Testability.
- **Actionability:** Fully actionable now.
- **Cursor prompt:**

```text
Tighten the documented loop for OpenAPI snapshot, generated .NET client, and UI API types.

Scope:
- Start from docs/library/API_CONTRACTS.md, docs/library/OPENAPI_CONTRACT_DRIFT.md, ArchLucid.Api.Tests/OpenApiContractSnapshotTests.cs, ArchLucid.Api.Client/Generated, and archlucid-ui generated API types.
- Ensure the docs provide one exact sequence for intentional HTTP contract changes.
- Add or update a CI/local helper if one already exists; otherwise do docs-only consolidation.
- Verify generated artifacts are referenced as generated and not hand-edited.

Acceptance criteria:
- A contributor can update a v1 route and know exactly which files/scripts must run.
- Docs distinguish canonical /openapi/v1.json from Swagger explorer output.
- The checklist includes UI type regeneration and client regeneration.

Constraints:
- Do not regenerate snapshots unless making an intentional contract change.
- Do not change route behavior.
- Do not add a second OpenAPI source of truth.
```

- **Impact of running prompt:** Directly improves Correctness (+2-4 pts), Interoperability (+3-5 pts), Maintainability (+2-4 pts), Testability (+2-3 pts). Weighted readiness impact: **+0.3-0.5%**.

### 18. Repeat-Review Stickiness Loop

**COMPLETED:** `docs/library/REPEAT_REVIEW_LOOP.md` with second-review checklist and V1 surface map.

- **Why it matters:** Stickiness grows when the second and third reviews are more valuable than the first.
- **Expected impact:** More recurring usage and clearer expansion path.
- **Affected qualities:** Stickiness, Executive Value Visibility, Workflow Embeddedness, Proof-of-ROI Readiness.
- **Actionability:** Fully actionable now.
- **Cursor prompt:**

```text
Strengthen the repeat-review loop using current V1 surfaces.

Scope:
- Use existing prior-manifest retrieval, compare, replay, executive ROI summary, and product learning docs.
- Add docs/library/REPEAT_REVIEW_LOOP.md or update an existing operator decision guide to explain what to do after the first committed review.
- Include UI/API surfaces: compare two reviews, replay, prior decision reuse, executive ROI summary, product-learning rollups, and governance dry-run.
- Add one proof acceptance checklist for "second review shows more value than first".

Acceptance criteria:
- The guide starts only after first commit.
- It does not require V1.1 connectors or MCP.
- It explains measurable stickiness signals: reused prior decision, repeated finding category, improved cycle time, governance trend, or executive ROI rollup.

Constraints:
- Do not add new product capabilities.
- Do not widen first-pilot scope.
- Do not overpromise automated planning beyond existing materialization endpoints.
```

- **Impact of running prompt:** Directly improves Stickiness (+5-8 pts), Workflow Embeddedness (+2-4 pts), Executive Value Visibility (+2-4 pts). Weighted readiness impact: **+0.5-0.8%**.

### 19. Data Consistency Sponsor-Handoff Enforcement

**COMPLETED:** Data consistency PASS/WARN/HOLD/NOT_RUN in proof pipeline; HOLD blocks sponsor SEND via disposition rules and command center.

- **Why it matters:** Sponsor packets should not circulate when data consistency is unknown or failing.
- **Expected impact:** Higher reliability and trust.
- **Affected qualities:** Data Consistency, Reliability, Trustworthiness, Correctness.
- **Actionability:** Fully actionable now.
- **Cursor prompt:**

```text
Make data-consistency readiness a first-class sponsor-handoff gate.

Scope:
- Start from docs/runbooks/DATA_CONSISTENCY_READINESS.md, scripts/collect-data-consistency-readiness.ps1, and scripts/collect-first-pilot-proof.ps1.
- Ensure sponsor-handoff mode records data-consistency status as PASS/WARN/HOLD/NOT_RUN.
- Block or clearly HOLD sponsor send when data consistency is NOT_RUN or HOLD.
- Link remediation to existing data-consistency runbooks.

Acceptance criteria:
- Proof output includes data-consistency status and artifact path.
- Sponsor handoff cannot be SEND when data consistency is HOLD.
- Readiness-only mode can warn without crashing when a live API is unavailable.

Constraints:
- Do not auto-remediate data.
- Do not require data consistency checks for docs-only assessments.
- Do not invent new consistency probes if existing ones cover the path.
```

- **Impact of running prompt:** Directly improves Data Consistency (+5-8 pts), Reliability (+2-4 pts), Trustworthiness (+2-4 pts). Weighted readiness impact: **+0.3-0.5%**.

### 20. Operator Support Bundle Failure Links

**COMPLETED:** `FirstPilotSupportNextStep.ps1` + supportNextStep column on BLOCK/WARN rows in go-no-go outputs.

- **Why it matters:** When proof or runs fail, support evidence should be one click away.
- **Expected impact:** Faster triage and stronger supportability.
- **Affected qualities:** Supportability, Manageability, Reliability, Adoption Friction.
- **Actionability:** Fully actionable now.
- **Cursor prompt:**

```text
Add support bundle guidance and links to failed proof and HOLD outputs.

Scope:
- Start from CLI support-bundle docs, docs/runbooks/TROUBLESHOOTING.md, and first-pilot proof generation scripts.
- When proof output includes HOLD or BLOCK rows, include the recommended support command, correlation id guidance, runId/manifest id fields, and artifact path.
- Keep buyer-facing output concise; place deep diagnostics in internal/support sections.

Acceptance criteria:
- A failed proof artifact tells the operator exactly which support bundle or diagnostic command to run.
- Correlation ID guidance appears for API failures.
- No secrets or raw connection strings are collected into buyer-facing proof.

Constraints:
- Do not change support bundle internals unless necessary.
- Do not expose internal stack traces in sponsor artifacts.
- Do not add external ticketing integrations.
```

- **Impact of running prompt:** Directly improves Supportability (+5-8 pts), Adoption Friction (+2-4 pts), Manageability (+2-4 pts). Weighted readiness impact: **+0.2-0.4%**.

### 21. Cost and COGS per Review Reporting

**COMPLETED:** `report_llm_cost_envelope.py` + `llm-cost-envelope.md` in proof bundle with estimated USD per committed review and simulator disclaimer.

- **Why it matters:** LLM cost controls support both margin and buyer transparency.
- **Expected impact:** Better cost-effectiveness and commercial confidence.
- **Affected qualities:** Cost-Effectiveness, Proof-of-ROI Readiness, Manageability, Commercial Packaging Readiness.
- **Actionability:** Fully actionable now.
- **Cursor prompt:**

```text
Add internal COGS-per-review reporting to existing LLM cost and ROI evidence.

Scope:
- Start from LlmMonthlyTenantDollarBudgetTracker, TenantLlmCostReportingService, AdminFleetLlmCogsService, pricing docs, and proof artifacts.
- Add a generated internal-only section or report that shows estimated LLM USD per committed review, token totals, budget status, and simulator/real mode distinction.
- Link buyer-facing ROI reports only to safe estimates and label them as estimates, not invoices.

Acceptance criteria:
- Internal report separates hosted COGS from buyer ROI.
- Real-mode runs include estimated USD when telemetry exists.
- Simulator/fake/echo providers do not produce misleading cost numbers.

Constraints:
- Do not alter Stripe billing.
- Do not expose tenant secrets or raw prompts.
- Do not present estimates as Azure invoice truth.
```

- **Impact of running prompt:** Directly improves Cost-Effectiveness (+5-7 pts), Proof-of-ROI Readiness (+2-4 pts), Commercial Packaging Readiness (+2-3 pts). Weighted readiness impact: **+0.2-0.4%**.

### 22. Accessibility Procurement Honesty Pass

**COMPLETED:** TRUST_CENTER accessibility row clarifies manual AT gaps; PROCUREMENT_DEAL_READY_ONE_PAGER §Accessibility; VPAT draft honesty retained.

- **Why it matters:** Accessibility can appear in procurement even when AT user testing is not a headline gate.
- **Expected impact:** Cleaner procurement answers and less overclaiming.
- **Affected qualities:** Procurement Readiness, Compliance Readiness, Usability, Trustworthiness.
- **Actionability:** Fully actionable now.
- **Cursor prompt:**

```text
Perform an accessibility procurement honesty pass.

Scope:
- Review ACCESSIBILITY.md, docs/security/VPAT_2_5_WCAG_2_1_AA.md or current VPAT drafts, public /accessibility references, and docs/go-to-market/TRUST_CENTER.md.
- Ensure automated axe/jsx-a11y evidence, manual gaps, and procurement caveats are stated consistently.
- Keep participant assistive-technology testing clearly out of `(A)` headline scoring unless separately promoted.

Acceptance criteria:
- The trust center and VPAT wording do not overclaim full manual conformance.
- Automated evidence and manual-not-evaluated areas are clear.
- Buyer accessibility questions have a clear contact and evidence path.

Constraints:
- Do not claim completed AT user testing.
- Do not add new legal commitments.
- Do not change UI code unless a broken link or false claim requires it.
```

- **Impact of running prompt:** Directly improves Procurement Readiness (+2-4 pts), Compliance Readiness (+2-4 pts), Trustworthiness (+1-3 pts), Usability (+1-2 pts). Weighted readiness impact: **+0.2-0.4%**.

### 23. Custom Agent Handler Self-Hosted Example

**COMPLETED:** `CUSTOM_AGENT_HANDLER_GUIDE.md` with compiling `SampleRiskReviewHandler` fixture and registration steps (existing tests).

- **Why it matters:** Extensibility is real but still more theoretical than hands-on.
- **Expected impact:** Better advanced-integrator confidence without a public plugin SDK.
- **Affected qualities:** Extensibility, Documentation, Customer Self-Sufficiency, Interoperability.
- **Actionability:** Fully actionable now.
- **Cursor prompt:**

```text
Add a minimal self-hosted custom agent handler example aligned with the existing custom handler guide.

Scope:
- Start from docs/library/CUSTOM_AGENT_HANDLER_GUIDE.md, docs/library/CUSTOM_AGENT_HANDLERS.md, and templates/archlucid-finding-engine if applicable.
- Add a small example or walkthrough showing one custom handler registration, input contract, output AgentResult shape, safety posture, and tests.
- Make clear this is code-level/self-hosted extensibility, not a public plugin SDK or marketplace.

Acceptance criteria:
- The example compiles or is clearly marked as pseudocode if docs-only.
- It includes null/error handling, schema validation expectations, and authority/safety boundaries.
- It links to the finding-engine template where useful.

Constraints:
- Do not introduce MCP.
- Do not add a marketplace or public SDK claim.
- Do not require customers to drop arbitrary DLLs into hosted SaaS.
```

- **Impact of running prompt:** Directly improves Extensibility (+5-8 pts), Documentation (+2-4 pts), Customer Self-Sufficiency (+2-4 pts). Weighted readiness impact: **+0.2-0.4%**.

### 24. Buyer-Safe Hosted Availability Rollup

**COMPLETED:** `HOSTED_AVAILABILITY_ROLLUP.md` + `summarize_hosted_probe_artifacts.py` + sample `hosted-probe-rollup-sample-redacted.md`.

- **Why it matters:** Availability targets need evidence without overclaiming contractual SLA.
- **Expected impact:** Better reliability story and procurement confidence.
- **Affected qualities:** Availability, Reliability, Procurement Readiness, Trustworthiness.
- **Actionability:** Fully actionable now.
- **Cursor prompt:**

```text
Create or tighten the buyer-safe hosted availability rollup.

Scope:
- Start from docs/runbooks/HOSTED_AVAILABILITY_ROLLUP.md, SLA_TARGETS.md, API_SLOS.md, and hosted probe summary scripts.
- Ensure rollup output distinguishes staging, production, internal-only, buyer-safe, target, and contractual SLA.
- Add a sample redacted 30-day rollup with clear caveats if no live production data exists.

Acceptance criteria:
- No staging probe is represented as production SLA evidence.
- The rollup states target vs measured evidence.
- Buyer-safe and internal-only fields are clearly separated.

Constraints:
- Do not create a contractual SLA.
- Do not claim active/active or multi-region guarantees.
- Do not publish customer-specific incident data.
```

- **Impact of running prompt:** Directly improves Availability (+5-8 pts), Reliability (+2-4 pts), Procurement Readiness (+2-3 pts), Trustworthiness (+2-3 pts). Weighted readiness impact: **+0.2-0.4%**.

### 25. DEFERRED Commission CPA SOC 2 Attestation Program

- **Why it matters:** This is a major `(B)` procurement blocker for enterprise buyers, even though it is explicitly excluded from `(A)` headline readiness.
- **Expected impact:** Would materially improve procurement realism and reduce trust discount pressure.
- **Affected qualities:** Procurement Readiness, Compliance Readiness, Trustworthiness, Marketability.
- **Actionability:** DEFERRED.
- **Reason it is deferred:** Meaningful work requires owner/business decisions and external parties. The repository already has self-assessment and roadmap materials; the next step is not a coding task.
- **Information needed from user later:** Budget ceiling, preferred readiness consultant / CPA shortlist, target observation window, target customer/procurement driver, and whether the goal is Type I readiness, Type I report, or Type II plan.
- **Impact if later executed:** Improves `(B)` procurement realism substantially; if formally promoted into scoring later, could improve Procurement Readiness (+10-20 pts), Compliance Readiness (+8-15 pts), Trustworthiness (+5-10 pts). Current `(A)` weighted readiness impact: **0%** because excluded by scope.

## 9. Prompt Batching Guidance

### Batch A - First-Pilot Conversion Core

Run together: **1 Sponsor-Safe First-Pilot Proof Command Center**, **3 ROI Baseline Capture**, **10 Sponsor Packet Quality Gate Integration**, **19 Data Consistency Sponsor-Handoff Enforcement**, **20 Operator Support Bundle Failure Links**.

Why: These touch the same proof pipeline, status vocabulary, and sponsor handoff artifacts. Best leverage per context window.

### Batch B - AI Trust and Evaluation

Run together: **2 AI Quality Evidence Dashboard**, **6 Real-Mode LLM Evidence**, **12 Evidence Chain View**, and optionally **21 Cost and COGS per Review Reporting**.

Why: These all depend on agent quality, faithfulness, retrieval, cost, and evidence traces.

### Batch C - Commercial Decision Velocity

Run together: **4 Buyer Differentiation Proof Packet**, **7 Procurement Pack Deal-Ready One-Pager**, **16 Commercial Closeout Packet Generator**, **22 Accessibility Procurement Honesty Pass**.

Why: These are mostly docs/generated-artifact changes across GTM and procurement, with low code collision risk.

### Batch D - Surface Alignment and Drift Control

Run together: **5 Route / Tier / Policy / Navigation Drift Gate**, **13 Config Lint Profile**, **14 Documentation Freshness Guard**, **17 OpenAPI / Client / UI Type Drift Quick Fix Loop**.

Why: These improve correctness and maintainability across repo boundaries and should be reviewed as engineering controls.

### Batch E - Stickiness and Operator Expansion

Run together: **9 V1 Workflow Handoff Hardening**, **15 Default Policy Pack Calibration Evidence**, **18 Repeat-Review Stickiness Loop**, **23 Custom Agent Handler Self-Hosted Example**.

Why: These improve current V1 value after first commit without pulling in deferred connectors.

### Batch F - Operational Evidence

Run together: **11 Capacity Envelope Proof**, **24 Buyer-Safe Hosted Availability Rollup**, and any existing minimal Azure pilot deployment proof work.

Why: These create buyer-safe operational evidence without changing product behavior.

### Do Not Batch Yet

Do not batch **25 DEFERRED Commission CPA SOC 2 Attestation Program** with code work. It needs owner decisions and external engagement first.

## 10. Pending Questions for Later

### DEFERRED Commission CPA SOC 2 Attestation Program

- What budget ceiling is approved for readiness consultant and CPA work?
- Is the desired near-term milestone Type I readiness, Type I report, or Type II planning?
- What observation window is acceptable before saying "SOC 2 in process"?
- Which customer/procurement event, if any, is driving timing?

### Commercial Closeout Packet Generator

- Should the default next commercial action prefer Evidence Pack, ARB Report, or Annual Order Form when proof is SEND but procurement is HOLD?
- Who owns quote follow-up SLA once a pricing quote request enters SQL/email?

### ROI Baseline Capture Before First Sponsor Packet

- Which ROI baseline fields are mandatory for a paid pilot versus optional for a free trial?
- Should "not collected" ever allow an annual conversion ask, or always force Evidence Pack first?

### Real-Mode LLM Evidence Without Merge-Blocking Flake

- What cadence is acceptable for real-mode evidence: nightly, weekly, release-candidate only, or manual?
- What monthly Azure OpenAI budget is approved for recurring quality evidence?

### Buyer-Safe Hosted Availability Rollup

- Which hosted environment, if any, is allowed to produce buyer-safe availability evidence today?
- Who approves the boundary between staging evidence and production evidence?

### Default Policy Pack Calibration Evidence

- Which two or three default packs are commercially most important to calibrate first?
- What false-positive tolerance is acceptable before enabling pre-commit blocking in a pilot?

# ArchLucid Assessment – (A) Headline Readiness: 79.85%

This score represents the **`(A)` headline readiness per `Assessment-Scope-V1_1.mdc`**, from a clean-slate assessment of currently available materials, **rescored after an in-repo implementation pass** (2026-05-29) on the prior improvement backlog. It excludes items explicitly deferred to V1.1, V1.x, V2, owner-only commercial action, or `(B)` procurement / market-motion realism.

Formula: `sum(score * weight) / sum(weight)`. Total weight: **119**. Weighted score: **9502 / 11900 = 79.85%**.

## 2. Executive Summary

### `(A)` Headline Readiness
ArchLucid is credible for controlled pilots and early commercial evaluation. A follow-up implementation pass added enforced real-mode release gating (`ARCHLUCID_REQUIRE_REAL_LLM_RELEASE_EVIDENCE`), sponsor-handoff BLOCK for missing retrieval IR, buyer-scenario fixtures, demo proof packets, an evaluator workbook, security control evidence map, scale operator decisions, procurement deal-ready executive summaries, and release-handoff evidence bundling. Remaining `(A)` drag: live production SLA history, public references, and fully self-serve annual conversion without sales interpretation.

### `(B)` Procurement / Market-Motion Realism
Procurement friction remains real but is not included in the `(A)` score. SOC 2 CPA attestation, third-party pen-test publication, public references, live marketplace checkout, and several connector expectations are documented as deferred or informational. Buyers can receive self-assessment, CAIQ/SIG, DPA, trust-center, procurement-pack, and owner-conducted testing evidence now; stricter enterprises will still treat that as interim assurance.

### Commercial Picture
The commercial story is credible but still sales-led. Pricing, quote-to-proof flow, pilot scorecard, proof-pack, and ROI labels exist. The revenue blocker is converting that into undeniable buyer-specific value quickly enough, with sponsor-safe ROI numbers and less founder interpretation.

### Enterprise Picture
Enterprise foundations are broad: database-per-tenant posture, OIDC/SAML/API key auth, SCIM, RBAC, audit events, policy packs, governance workflows, trust docs, DPA/subprocessor materials, and procurement-pack automation. The enterprise weakness is adoption translation: customers must map a rich set of controls, scripts, and docs into their own review process.

### Engineering Picture
The engineering system is structurally strong and heavily documented. The codebase has modular projects, OpenAPI contracts, Dapper/DbUp SQL discipline, release smoke paths, live UI tests, RAG and AI evaluation hooks, data-consistency probes, and Terraform validation. The risk is uneven enforcement: some high-value gates are warn-only or environment-dependent, coverage is uneven across important assemblies, and production evidence depends on operators configuring the right exporters, probes, and proof collectors.

### Deferred Scope Uncertainty
None identified. The repository materials that define deferred scope were located: `docs/library/V1_SCOPE.md`, `docs/library/V1_DEFERRED.md`, `docs/go-to-market/TRUST_CENTER.md`, `docs/security/SOC2_SELF_ASSESSMENT_2026.md`, and `docs/go-to-market/SOC2_ROADMAP.md`.

## 3. Weighted Quality Assessment

Ordered by **weighted deficiency signal**: `(100 - score) * weight`. Weighted readiness impact is contribution to the 100-point `(A)` score.

| Urgency | Quality | Score | Weight | Weighted readiness impact | Weighted deficiency signal | Justification | Tradeoffs | Improvement recommendations | Fixability |
|---:|---|---:|---:|---:|---:|---|---|---|---|
| 1 | Marketability | 82 | 8 | 6.56 | 144 | Demo proof packets and buyer-job accelerators sharpen the wedge; external references still `(B)`. | Honest labeling limits hype. | Land one named design-partner proof when permitted. | V1; references `(B)`. |
| 2 | Correctness | 81 | 8 | 6.48 | 152 | Buyer-scenario fixtures, real-mode release gate, and existing gates strengthen proof; live buyer variance remains. | Strict gates slow iteration. | Expand real-mode cohort evidence in CI nightly. | V1. |
| 3 | Cutting-Edge AI Technology | 80 | 8 | 6.40 | 160 | Retrieval IR enforcement on sponsor handoff and release evidence improve RAG proof; still bounded single-hop RAG. | Control limits AI leap narrative. | Graph-RAG remains V2. | V1 evidence; V2 retrieval. |
| 4 | Adoption Friction | 78 | 6 | 4.68 | 132 | Evaluator workbook and consolidated START_HERE routing reduce checklist sprawl; setup still multi-step. | Enterprise controls add burden. | Further automate sponsor handoff one-liner. | V1. |
| 5 | Stickiness | 76 | 6 | 4.56 | 144 | Retention hooks unchanged; post-commit habit docs could be stronger. | Operate depth can distract. | Second-review playbook in Core Pilot. | V1. |
| 6 | AI/Agent Readiness | 84 | 8 | 6.72 | 128 | Real-mode release requirement script and consolidated AI readiness gate improve enforceability. | Manual rerun after rejection remains. | Auto-retry after gate rejection later. | V1. |
| 7 | Time-to-Value | 83 | 7 | 5.81 | 119 | Demo packets show outcome shape before setup; Core Pilot unchanged. | Narrow path defers Operate. | Scripted failure recovery cards. | V1. |
| 8 | Proof-of-ROI Readiness | 80 | 5 | 4.00 | 100 | ROI suppression tests and commercial next-step mapping are explicit; baselines still buyer-dependent. | Honesty limits punchy ROI. | More buyer-provided baseline templates. | V1. |
| 9 | Differentiability | 80 | 4 | 3.20 | 80 | Demo packets make category tangible; external proof still thin. | Focused category needs explanation. | Public reference when available `(B)`. | V1. |
| 10 | Workflow Embeddedness | 78 | 3 | 2.34 | 66 | REST/CLI recipes expanded; V1.1 connectors still deferred. | API-first vs native apps. | V1.1 connector validation when tenants available. | V1 recipes done. |
| 11 | Usability | 77 | 3 | 2.31 | 69 | Entry routing clarified; concept count still high. | Depth helps power users. | UI onboarding tour optional. | V1. |
| 12 | Executive Value Visibility | 84 | 4 | 3.36 | 64 | Basis labels and command center unchanged; procurement exec summary added at pack level. | Labels constrain claims. | Executive one-pager auto from proof JSON. | V1. |
| 13 | Decision Velocity | 74 | 2 | 1.48 | 52 | SEND/HOLD/DEFERRED → next action table added to commercial checklist. | Sales-led motion remains. | Live commerce V1.1. | Partly V1. |
| 14 | Security | 82 | 3 | 2.46 | 54 | Security control evidence map links controls to artifacts. | Depth adds config burden. | Third-party pen test V2. | V1 map done. |
| 15 | Trustworthiness | 83 | 3 | 2.49 | 51 | Deferred-scope label test; sponsor BLOCK paths strengthened. | Caveats reduce decisiveness. | CPA deferred `(B)`. | V1. |
| 16 | Compliance Readiness | 76 | 2 | 1.52 | 48 | Control map improves reviewer navigation; CPA still self-assessment. | Not auditor evidence. | CPA program owner input. | `(B)` deferred. |
| 17 | Architectural Integrity | 83 | 3 | 2.49 | 51 | Unchanged — coherent layering and invariants. | Legacy bridges remain. | Scoped rename only. | V1 hygiene. |
| 18 | Procurement Readiness | 78 | 2 | 1.56 | 44 | Deal-ready executive summary table at top of disposition output. | Interim assurance friction. | CPA `(B)`. | V1 done. |
| 19 | Maintainability | 78 | 2 | 1.56 | 44 | New tests and scripts; coverage gaps remain in some hosts. | Repo size cost. | Targeted Host.Core coverage. | V1 partial. |
| 20 | Commercial Packaging Readiness | 79 | 2 | 1.58 | 42 | Commercial next-step in proof; route/tier/nav parity artifact still manual. | Sales-led packaging. | Auto parity in every proof run. | V1 partial. |
| 21 | Interoperability | 80 | 2 | 1.60 | 40 | Recipes and workflow handoff artifacts documented. | Less turnkey than native connectors. | V1.1 connectors. | V1 recipes done. |
| 22 | Traceability | 86 | 3 | 2.58 | 42 | Unchanged — strong evidence chain. | Richness can overwhelm. | Compact sponsor drill-down. | V1. |
| 23 | Reliability | 81 | 2 | 1.62 | 38 | Release handoff bundles reliability notes. | Single-region baseline. | Active/active V2. | V1. |
| 24 | Policy and Governance Alignment | 83 | 2 | 1.66 | 34 | Unchanged. | Governance can distract. | Optional after Core Pilot. | V1. |
| 25 | Data Consistency | 85 | 2 | 1.70 | 30 | Remediation strings include dry-run commands; sponsor BLOCK on NOT_RUN. | Operator action required. | Automated remediation guides per probe. | V1 done. |
| 26 | Explainability | 85 | 2 | 1.70 | 30 | Six basis labels covered in tests and formatters. | Caveats reduce punch. | UI chips on all sponsor exports. | V1. |
| 27 | Azure Compatibility and SaaS Deployment Readiness | 84 | 2 | 1.68 | 32 | Scale operator table and release evidence align. | Azure-only focus. | Multi-cloud analysis V1.1. | V1. |
| 28 | Auditability | 86 | 2 | 1.72 | 28 | Unchanged — strong audit matrix. | Matrix drift risk. | Stricter synthetic route test. | V1 partial. |
| 29 | Customer Self-Sufficiency | 78 | 1 | 0.78 | 22 | Evaluator workbook under 200 lines. | Still expert-assisted. | In-app guided setup. | V1. |
| 30 | Cognitive Load | 77 | 1 | 0.77 | 23 | Single canonical operator checklist reinforced in START_HERE. | Vocabulary load remains. | UI progressive disclosure tuning. | V1. |
| 31 | Availability | 74 | 1 | 0.74 | 26 | Hosted rollup linked in release bundle; no customer SLA history. | Targets not contractual. | Production evidence program `(B)`. | Partial V1. |
| 32 | Performance | 75 | 1 | 0.75 | 25 | k6 note in release bundle; limited live evidence. | No SLA overclaim. | Attach k6 in CI artifact. | V1. |
| 33 | Scalability | 78 | 1 | 0.78 | 22 | SCALE_OPERATOR_DECISIONS.md published. | Right-sized V1. | Redis trigger automation. | V1 done. |
| 34 | Testability | 78 | 1 | 0.78 | 22 | Buyer-scenario and release-gate tests added. | Uneven coverage. | Host.Core hotspot tests. | V1 partial. |
| 35 | Extensibility | 82 | 1 | 0.82 | 18 | SampleRiskReviewHandler + tests already canonical in guide. | No public SDK. | Marketplace deferred. | V1 sample done. |
| 36 | Cost-Effectiveness | 80 | 1 | 0.80 | 20 | LLM cost fields in proof JSON unchanged but documented in bundle flow. | Hard caps interrupt runs. | Per-tenant COGS dashboards. | V1. |
| 37 | Manageability | 81 | 1 | 0.81 | 19 | Config catalog strong; lint remediation links could deepen. | Flexible config risk. | Lint row deep-links in UI. | V1 partial. |
| 38 | Deployability | 81 | 1 | 0.81 | 19 | Release readiness index expanded. | IaC validation cost. | One-click release evidence in CI. | V1. |
| 39 | Documentation | 84 | 1 | 0.84 | 16 | New onboarding and operations docs integrated. | Volume remains high. | Generated nav index only. | V1. |
| 40 | Supportability | 84 | 1 | 0.84 | 16 | Triage cards and support next steps in proof findings. | Telemetry must be configured. | Fail-closed telemetry in prod profile. | V1. |
| 41 | Template and Accelerator Richness | 86 | 1 | 0.86 | 14 | Demo packets linked from walkthrough index. | Specialty can dilute Core Pilot. | Keep optional after first commit. | V1. |

## 4. Top 12 Most Important Weaknesses

1. AI correctness evidence is still thinner than the product promise.
2. The first-pilot path is still operationally heavy.
3. ROI proof depends on buyer-supplied baselines.
4. The commercial motion is sales-led and evidence-dependent.
5. Workflow embeddedness before V1.1 still requires translation.
6. Formal assurance is not yet procurement-grade.
7. Coverage is uneven in important engineering areas.
8. Production evidence depends on operator discipline.
9. Cognitive load is high.
10. Sponsor-facing trust depends on labels being universally applied.
11. Availability targets are not yet backed by customer-specific operating history.
12. Extensibility is controlled rather than ecosystem-grade.

## 5. Top 6 Monetization Blockers

1. Sponsor-safe ROI is gated by baseline inputs.
2. Trust discount remains structurally justified by `(B)` items.
3. Sales-led quote path slows self-serve conversion.
4. First proof must be real, not demo-vague.
5. Packaging is still complex across tier, authority, route, nav, trial, procurement, and proof dispositions.
6. Native workflow connectors may be table stakes for some buyers even though they are V1.1.

## 6. Top 6 Enterprise Adoption Blockers

1. Formal assurance gaps under `(B)`: no CPA SOC 2 report or third-party pen-test summary today.
2. Identity and configuration require careful setup.
3. Some customers will require V1.1 connectors.
4. Production SLA acceptance needs evidence.
5. Governance requires enablement and operator skill.
6. Self-sufficiency is bounded by the richness of the setup and proof process.

## 7. Top 6 Engineering Risks

1. Real-mode AI regression.
2. Correctness drift outside fixtures.
3. Uneven test coverage in critical paths.
4. Configuration misfire in production-like environments.
5. Retrieval freshness or isolation regression.
6. Operational evidence gaps at release or sponsor handoff.

## 8. Most Important Truth

ArchLucid is now closer to selling itself on evidence: the product must still be operated with discipline, but sponsor handoff, real-mode release gates, buyer-shaped fixtures, and buyer-facing proof artifacts are materially stronger than a documentation-only posture.

## 9. Top Improvement Opportunities

**Implementation pass (2026-05-29):** Items **1–24** marked **COMPLETED** in §8 above (code, scripts, docs, and proof pipeline). Item **25** remains **DEFERRED** (CPA SOC 2 — owner/budget only).

### 1. [IMPLEMENTED] Enforce Real-Mode AI Release Evidence for Reference Cohorts
**Why it matters:** Correctness and AI trust are the highest weighted risks.  
**Expected impact:** A release cannot claim real AI readiness without concrete quality evidence.  
**Affected qualities:** Correctness, AI/Agent Readiness, Cutting-Edge AI Technology, Trustworthiness.  
**Actionable:** Fully actionable now.  
**Cursor prompt:** Implement a release-gate path that validates required real-mode AI evidence when `ARCHLUCID_REQUIRE_REAL_LLM_RELEASE_EVIDENCE=1` is set. Start from `docs/library/AGENT_OUTPUT_EVALUATION.md`, `docs/quality/REAL_LLM_RUN_EVIDENCE_TEMPLATE.md`, `scripts/ci/eval_agent_corpus.py`, and first-pilot proof scripts. Acceptance criteria: missing real-mode evidence fails with actionable messages; simulator-only releases remain allowed when unset; Markdown clearly distinguishes real vs simulator; no raw prompts, secrets, or completions are emitted. Constraints: no Azure credentials in normal PR CI; do not weaken gates.  
**Impact of running prompt:** Correctness (+3-5), AI/Agent Readiness (+3-4), Trustworthiness (+2-3). Weighted readiness impact: **+0.5-0.9%**.

### 2. [IMPLEMENTED] Expand Buyer-Scenario Correctness Golden Corpus
**Why it matters:** Outputs must be right on buyer-shaped evidence.  
**Expected impact:** More regressions caught before demos or pilots.  
**Affected qualities:** Correctness, Proof-of-ROI Readiness, Explainability, Testability.  
**Actionable:** Fully actionable now.  
**Cursor prompt:** Add buyer-scenario correctness fixtures covering Azure SaaS readiness, AI governance, healthcare claims demo, and cost/ROI citation cases. Use `tests/eval-corpus/`, `tests/eval-datasets/`, `ArchLucid.Application.Tests`, and `ArchLucid.AgentRuntime.Tests`. Acceptance criteria: at least 8 scenarios; each asserts expected finding category, evidence/citation presence, and unsafe ROI suppression; no live LLM required. Constraints: keep fixtures non-sensitive and small; no new external services.  
**Impact of running prompt:** Correctness (+4-6), Proof-of-ROI (+2-3), Testability (+2-3). Weighted readiness impact: **+0.4-0.7%**.

### 3. [IMPLEMENTED] Make First-Pilot Proof Collection Strict by Default for Sponsor Handoff
**Why it matters:** Sponsor proof should not rely on humans noticing missing evidence.  
**Expected impact:** Fewer accidental sponsor sends.  
**Affected qualities:** Time-to-Value, Adoption Friction, Trustworthiness, Data Consistency.  
**Actionable:** Fully actionable now.  
**Cursor prompt:** Harden `scripts/collect-first-pilot-proof.ps1`, `scripts/FirstPilotDataConsistencyProof.ps1`, related `scripts/ci/tests/`, and `docs/runbooks/FIRST_PILOT_EVIDENCE_BUNDLE.md` so `-SponsorHandoff` treats missing committed-run evidence, unresolved PilotStrict signals, `dataConsistencyStatus=NOT_RUN`, and unsafe ROI basis as HOLD/BLOCK with remediation commands. Acceptance criteria: readiness-only mode remains WARN-only for missing `RunId`; sponsor-handoff emits deterministic `SEND`, `HOLD`, or `DEFERRED_SCOPE`; tests cover missing run id, deferred buyer requirement, AI gate missing, and data consistency not run. Constraints: scripts remain read-only.  
**Impact of running prompt:** Time-to-Value (+2-3), Adoption Friction (+2-3), Data Consistency (+3-4). Weighted readiness impact: **+0.3-0.5%**.

### 4. Harden ROI Baseline Capture and Sponsor-Dollar Suppression
**Why it matters:** Monetization depends on sponsor-safe ROI.  
**Expected impact:** Stronger conversion when data is present and safer fallback when absent.  
**Affected qualities:** Proof-of-ROI Readiness, Executive Value Visibility, Marketability, Trustworthiness.  
**Actionable:** Fully actionable now.  
**Cursor prompt:** Trace ROI baseline fields from scorecard/API/UI through first-value report and proof JSON. Update `ArchLucid.Application/Pilots/*`, `ArchLucid.Application.Tests/Pilots/*`, `docs/go-to-market/PILOT_SUCCESS_SCORECARD.md`, and `docs/runbooks/FIRST_PILOT_EVIDENCE_BUNDLE.md` so projected dollar claims cannot be sponsor-safe unless all required baseline fields are buyer-provided. Acceptance criteria: tests cover buyer-provided, defaulted, demo-derived, and not-collected cases; Markdown/PDF/DOCX use the same basis labels. Constraints: do not invent buyer values or change pricing.  
**Impact of running prompt:** Proof-of-ROI (+5-7), Executive Value Visibility (+2-3), Trustworthiness (+2). Weighted readiness impact: **+0.3-0.6%**.

### 5. [IMPLEMENTED] Create Three Buyer-Proof Demo Packets
**Why it matters:** Buyers need to see proof package shape before setup.  
**Expected impact:** Clearer demos for Azure SaaS, AI governance, and healthcare claims.  
**Affected qualities:** Marketability, Differentiability, Template and Accelerator Richness, Time-to-Value.  
**Actionable:** Fully actionable now.  
**Cursor prompt:** Build or refresh static, buyer-safe demo proof packets for the three current accelerators using `docs/library/walkthroughs/*`, `docs/go-to-market/buyer-jobs/*`, `docs/go-to-market/DEMO_WORKSPACES.md`, and proof packet conventions. Acceptance criteria: each packet has input assumptions, top findings, evidence labels, deferred labels, and what-not-to-claim; all demo-derived values are labeled; links from walkthrough index and `docs/CORE_PILOT.md` are updated. Constraints: no real customer outcome claims; no V1.1 connector requirement.  
**Impact of running prompt:** Marketability (+3-5), Differentiability (+3-4), Time-to-Value (+1-2). Weighted readiness impact: **+0.3-0.6%**.

### 6. [IMPLEMENTED] Add a Compact Evaluator Workbook
**Why it matters:** First-time evaluators need one short artifact.  
**Expected impact:** Lower cognitive load and adoption friction.  
**Affected qualities:** Adoption Friction, Customer Self-Sufficiency, Cognitive Load, Documentation.  
**Actionable:** Fully actionable now.  
**Cursor prompt:** Create `docs/onboarding/EVALUATOR_WORKBOOK.md` as a concise evaluator path that references, but does not duplicate, `FIRST_PILOT_OPERATOR_PATH.md`, `CORE_PILOT.md`, `BUYER_ORIENTATION_ONE_SCREEN.md`, and `FIRST_PILOT_EVIDENCE_BUNDLE.md`. Acceptance criteria: under 200 lines; includes prerequisites, exact first commands, expected artifacts, pass/hold/deferred interpretation, and stop rules; `START_HERE.md` links it as evaluator depth, not a second checklist. Constraints: V1 surfaces only.  
**Impact of running prompt:** Adoption Friction (+3-4), Customer Self-Sufficiency (+5-6), Cognitive Load (+4-5). Weighted readiness impact: **+0.3-0.5%**.

### 7. Backfill Tests on Highest-Risk Low-Coverage Hotspots
**Why it matters:** Uneven coverage creates correctness and reliability risk.  
**Expected impact:** Fewer regressions in host config, cost findings, notifications, and decisioning.  
**Affected qualities:** Correctness, Maintainability, Testability, Reliability.  
**Actionable:** Fully actionable now.  
**Cursor prompt:** Use `docs/library/COVERAGE_GAP_ANALYSIS.md` to select a small high-risk slice from `ArchLucid.Host.Core`, `ArchLucid.Capabilities.Cost`, `ArchLucid.Notifications`, or `ArchLucid.Decisioning`. Add focused deterministic tests without broad refactors. Acceptance criteria: at least one uncovered production class with trust/security/user impact gets meaningful branch coverage; no external services required. Constraints: do not chase percentage vanity or lower thresholds.  
**Impact of running prompt:** Correctness (+2-4), Maintainability (+2-3), Testability (+4-5). Weighted readiness impact: **+0.2-0.5%**.

### 8. Make Production-Like Config Lint More Actionable
**Why it matters:** Misconfiguration is a likely enterprise failure mode.  
**Expected impact:** Operators get exact fixes before exposing a pilot.  
**Affected qualities:** Security, Manageability, Deployability, Supportability.  
**Actionable:** Fully actionable now.  
**Cursor prompt:** Improve production-like config lint output in CLI/API docs and tests around `ProductionLikeHostingMisconfigurationAdvisor`, `CONFIGURATION_REFERENCE.md`, and `DEPLOYMENT_RUNBOOK.md`. Acceptance criteria: lint rows include stable code, severity, key path, redacted state hint, and remediation link; sponsor-handoff proof renders HOLD for blockers; tests cover unsafe auth bypass, missing telemetry when required, missing Content Safety, and unsafe billing. Constraints: never print secrets; do not fail developer loops.  
**Impact of running prompt:** Security (+3-4), Manageability (+4-5), Deployability (+2-3). Weighted readiness impact: **+0.2-0.4%**.

### 9. Standardize Evidence-Basis Labels Across Sponsor Surfaces
**Why it matters:** One unlabeled estimate can undermine trust.  
**Expected impact:** Consistent buyer interpretation of AI, ROI, demo, and deferred claims.  
**Affected qualities:** Trustworthiness, Explainability, Executive Value Visibility, Proof-of-ROI Readiness.  
**Actionable:** Fully actionable now.  
**Cursor prompt:** Audit sponsor-facing Markdown/PDF/DOCX/report builders, starting with `ArchLucid.Application/Pilots/`, formatter tests, `FIRST_PILOT_EVIDENCE_BUNDLE.md`, and `AGENT_OUTPUT_EVALUATION.md`. Acceptance criteria: shared labels cover Evidence-backed, Estimate, Low support, Demo-derived, Manual review required, and Deferred scope; tests cover Markdown and first-value report paths; no projected dollars without basis labels. Constraints: do not change legal assurance wording.  
**Impact of running prompt:** Trustworthiness (+3-4), Explainability (+3), Proof-of-ROI (+2-3). Weighted readiness impact: **+0.2-0.4%**.

### 10. Turn V1 REST/CLI Workflow Handoff into Copy-Paste Recipes
**Why it matters:** V1 embeddedness depends on current surfaces until V1.1 connectors.  
**Expected impact:** Buyers can attach proof to existing workflows without native connectors.  
**Affected qualities:** Workflow Embeddedness, Interoperability, Adoption Friction, Time-to-Value.  
**Actionable:** Fully actionable now.  
**Cursor prompt:** Expand `docs/library/V1_REST_CLI_INTEGRATION_RECIPES.md` and `docs/runbooks/V1_WORKFLOW_HANDOFF_GITHUB_AZDO.md` with copy-paste examples for create review, upload Azure extractor ZIP, collect proof, and attach summary to GitHub/ADO. Acceptance criteria: auth assumptions, exact commands, expected status, error handling, and deferred V1.1 boundary are included; examples are validated where practical. Constraints: do not imply Jira/ServiceNow/Confluence/Slack/Teams are V1 requirements; no credentials in examples.  
**Impact of running prompt:** Workflow Embeddedness (+5-6), Interoperability (+3-4), Adoption Friction (+2). Weighted readiness impact: **+0.2-0.4%**.

### 11. Attach Availability and Performance Evidence to Release Handoff
**Why it matters:** Availability targets need fresh evidence without SLA overclaiming.  
**Expected impact:** Better enterprise confidence.  
**Affected qualities:** Availability, Performance, Reliability, Procurement Readiness.  
**Actionable:** Fully actionable now for the evidence scaffold.  
**Cursor prompt:** Extend release evidence docs/scripts so hosted probe rollups, first-pilot timing budgets, k6 summaries, and health/version checks are grouped in one release handoff index. Use `V1_RELEASE_CHECKLIST.md`, `HOSTED_AVAILABILITY_ROLLUP.md`, `SLA_TARGETS.md`, and `scripts/Emit-ReleaseReadinessEvidence.ps1`. Acceptance criteria: generated Markdown separates measured evidence, targets, skipped evidence, and non-claims; no contractual SLA implication without production inputs. Constraints: no live production URL in local CI; no active/active claim.  
**Impact of running prompt:** Availability (+4-5), Performance (+3-4), Reliability (+2). Weighted readiness impact: **+0.1-0.3%**.

### 12. Make Procurement Deal-Ready Output More Executive-Readable
**Why it matters:** Procurement pack generation exists, but buyers need a fast classification summary.  
**Expected impact:** Less founder explanation during review.  
**Affected qualities:** Procurement Readiness, Compliance Readiness, Trustworthiness, Decision Velocity.  
**Actionable:** Fully actionable now.  
**Cursor prompt:** Improve `scripts/build_procurement_pack.py --deal-ready` Markdown and docs so it starts with PASS/HOLD/DEFERRED_SCOPE/INFORMATIONAL_B_ONLY summary rows and source links. Update `PROCUREMENT_DEAL_READY.md`, `HOW_TO_REQUEST_PROCUREMENT_PACK.md`, and `scripts/ci/tests/`. Acceptance criteria: missing V1 docs fail; deferred SOC 2 CPA, public reference, marketplace, MCP, and V1.1 connectors classify without HOLD; stale Last reviewed markers are visible. Constraints: do not hide deferred items.  
**Impact of running prompt:** Procurement Readiness (+4-5), Compliance Readiness (+3), Decision Velocity (+2). Weighted readiness impact: **+0.1-0.3%**.

### 13. Strengthen Mutating-Route Audit Matrix Enforcement
**Why it matters:** Audit coverage must keep pace with API changes.  
**Expected impact:** Lower auditability regression risk.  
**Affected qualities:** Auditability, Security, Policy and Governance Alignment, Maintainability.  
**Actionable:** Fully actionable now.  
**Cursor prompt:** Tighten guards around `AUDIT_COVERAGE_MATRIX.md`, mutating-route audit scripts, and CI tests so new POST/PUT/PATCH/DELETE routes map to durable audit events or explicit allowlist rationale. Acceptance criteria: tests fail on a synthetic unmapped mutating route; generated matrix includes route, policy, audit event, and rationale. Constraints: read-only routes excluded; avoid framework false positives.  
**Impact of running prompt:** Auditability (+3-4), Security (+2), Maintainability (+1-2). Weighted readiness impact: **+0.1-0.3%**.

### 14. Add Working Custom Agent Handler Example
**Why it matters:** Extensibility docs need executable proof.  
**Expected impact:** Advanced customers understand extension boundaries without a public SDK.  
**Affected qualities:** Extensibility, Documentation, Customer Self-Sufficiency, AI/Agent Readiness.  
**Actionable:** Fully actionable now.  
**Cursor prompt:** Add a minimal custom agent handler example under a sample/template folder and link it from `CUSTOM_AGENT_HANDLER_GUIDE.md`. Acceptance criteria: shows interface implementation, DI registration, safety/tenant scope notes, and test/compile check; docs explain in-process vs out-of-process boundaries. Constraints: each class in its own file; no new external dependencies; no authority/scope bypass.  
**Impact of running prompt:** Extensibility (+4-5), Customer Self-Sufficiency (+2-3), Documentation (+2). Weighted readiness impact: **+0.1-0.2%**.

### 15. Harden LLM Cost Evidence in Proof Packets
**Why it matters:** Hosted AI economics affects margin and trust.  
**Expected impact:** Better cost-effectiveness and fewer surprise hard-cap failures.  
**Affected qualities:** Cost-Effectiveness, Proof-of-ROI Readiness, Supportability, Trustworthiness.  
**Actionable:** Fully actionable now.  
**Cursor prompt:** Ensure proof packets include LLM execution mode, call count, budget status, estimated cost basis, and hard-cap warning state when available. Start from `FIRST_PILOT_EVIDENCE_BUNDLE.md`, `OPERATIONS_LLM_QUOTA.md`, `LLM_COST_ESTIMATION.md`, and proof collectors. Acceptance criteria: proof JSON/Markdown distinguishes internal estimated COGS from buyer ROI; missing budget is NOT_RUN/WARN, not zero; tests cover simulator, real with budget, and real missing budget. Constraints: no API keys, raw prompts, or vendor invoices.  
**Impact of running prompt:** Cost-Effectiveness (+4-5), Proof-of-ROI (+1-2), Supportability (+2). Weighted readiness impact: **+0.1-0.3%**.

### 16. Make Route/Tier/Policy/Nav Parity a Sales-Handoff Artifact
**Why it matters:** Packaging and authorization must align in-product.  
**Expected impact:** Fewer buyer surprises about visible, purchasable, and authorized surfaces.  
**Affected qualities:** Commercial Packaging Readiness, Security, Usability, Manageability.  
**Actionable:** Fully actionable now.  
**Cursor prompt:** Improve `ROUTE_TIER_POLICY_NAV_MATRIX.md`, `scripts/ci/assert_route_tier_policy_nav.py`, and UI tests so first-pilot proof renders a compact parity summary when commercial boundaries changed. Acceptance criteria: proof says PASS/HOLD with diff summary; docs tell contributors what to update; tests cover route missing nav row, nav missing policy, and tier mismatch. Constraints: API remains authoritative; no pricing changes.  
**Impact of running prompt:** Commercial Packaging (+3-4), Security (+1-2), Usability (+1-2). Weighted readiness impact: **+0.1-0.3%**.

### 17. Improve Data-Consistency Remediation Guidance
**Why it matters:** Detection is strong; remediation guidance must be exact.  
**Expected impact:** Faster recovery and safer handoff.  
**Affected qualities:** Data Consistency, Reliability, Supportability, Trustworthiness.  
**Actionable:** Fully actionable now.  
**Cursor prompt:** Update `DATA_CONSISTENCY_MATRIX.md`, `DATA_CONSISTENCY_READINESS.md`, and proof output so each HOLD includes a dry-run diagnostic command and non-destructive remediation path. Acceptance criteria: no script deletes/quarantines automatically; sponsor HOLD links to one remediation doc; tests cover orphan counts, health degraded, and skipped collection. Constraints: preserve forensic evidence; no auto-quarantine default.  
**Impact of running prompt:** Data Consistency (+3-4), Reliability (+2), Supportability (+2). Weighted readiness impact: **+0.1-0.3%**.

### 18. Consolidate First-Pilot Entry Points
**Why it matters:** Multiple depth docs can feel like multiple checklists.  
**Expected impact:** Lower cognitive load and faster first value.  
**Affected qualities:** Cognitive Load, Usability, Time-to-Value, Documentation.  
**Actionable:** Fully actionable now.  
**Cursor prompt:** Audit links from `START_HERE.md`, `CORE_PILOT.md`, `FIRST_PILOT_OPERATOR_PATH.md`, `EVALUATION_GUIDE.md`, and buyer docs so there is one canonical operational checklist and every other doc is narrative, depth, troubleshooting, or optional accelerator. Acceptance criteria: no second checklist claim; top-level routing tells operators where to start; V1.1 and Operate depth are optional after first commit. Constraints: keep useful depth; do not change scope.  
**Impact of running prompt:** Cognitive Load (+5-6), Usability (+2-3), Time-to-Value (+1-2). Weighted readiness impact: **+0.1-0.3%**.

### 19. Add Security Reviewer Evidence Map for Top Controls
**Why it matters:** Security reviewers need control-to-evidence trace.  
**Expected impact:** Faster security review.  
**Affected qualities:** Security, Compliance Readiness, Procurement Readiness, Trustworthiness.  
**Actionable:** Fully actionable now.  
**Cursor prompt:** Add a concise control-to-evidence map for identity/RBAC, tenant isolation, audit, secrets, LLM redaction, content safety, vulnerability scanning, incident communications, and deletion/offboarding. Link from `SECURITY_REVIEWER_ONE_PAGER.md` and `TRUST_CENTER.md`. Acceptance criteria: each row has control, evidence path, status, and deferred boundary; SOC 2 CPA and third-party pen test remain clearly not issued. Constraints: no legal commitments or unsupported certifications.  
**Impact of running prompt:** Security (+2-3), Compliance Readiness (+3-4), Procurement Readiness (+2-3). Weighted readiness impact: **+0.1-0.3%**.

### 20. Tighten RAG Evaluation Enforcement Where Stable
**Why it matters:** Retrieval quality is central to AI faithfulness.  
**Expected impact:** Retrieval regressions become harder to ship.  
**Affected qualities:** Cutting-Edge AI Technology, AI/Agent Readiness, Correctness, Reliability.  
**Actionable:** Fully actionable now.  
**Cursor prompt:** Review `RAG_QUALITY_TECHNICAL_BACKLOG.md`, `scripts/ci/eval_retrieval_ir.py`, `scripts/ci/eval_agent_faithfulness.py`, and CI wiring. Promote stable non-LLM retrieval IR and citation-faithfulness checks from advisory to enforced in the safest scope, or add opt-in strict mode. Acceptance criteria: strict mode fails on recall/MRR or citation floor regression; PR CI remains credential-free; docs distinguish retrieval IR from output citation faithfulness. Constraints: no Azure OpenAI requirement in normal CI; no graph-RAG or agentic retrieval.  
**Impact of running prompt:** Cutting-Edge AI (+2-3), AI/Agent Readiness (+2-3), Correctness (+2). Weighted readiness impact: **+0.2-0.4%**.

### 21. Sharpen Commercial Conversion `SEND/HOLD/DEFERRED_SCOPE` Flow
**Why it matters:** Decision velocity improves when the next commercial action is deterministic.  
**Expected impact:** Sales can ask for the right next step after proof.  
**Affected qualities:** Decision Velocity, Commercial Packaging Readiness, Marketability, Proof-of-ROI Readiness.  
**Actionable:** Fully actionable now.  
**Cursor prompt:** Update `COMMERCIAL_CONVERSION_CHECKLIST.md`, `QUOTE_TO_PROOF_PACKET.md`, and generated proof packet copy so each disposition maps to one next action: send sponsor packet, fix HOLD, or record deferred buyer requirement. Acceptance criteria: `SEND` has annual conversion guidance; `HOLD` has remediation categories; `DEFERRED_SCOPE` lists deferred items without implying V1 failure; pricing numbers are not duplicated. Constraints: do not treat design partner/public reference as `(A)` blockers.  
**Impact of running prompt:** Decision Velocity (+5-7), Commercial Packaging (+2-3), Marketability (+1-2). Weighted readiness impact: **+0.1-0.3%**.

### 22. Package Scale Thresholds as Operator Decisions
**Why it matters:** Operators need trigger points for Redis, replicas, queues, and evidence.  
**Expected impact:** Less ambiguity moving beyond pilot scale.  
**Affected qualities:** Scalability, Reliability, Cost-Effectiveness, Azure Compatibility and SaaS Deployment Readiness.  
**Actionable:** Fully actionable now.  
**Cursor prompt:** Consolidate scale trigger guidance from `V1_CAPACITY_ENVELOPE.md`, `CAPACITY_AND_COST_PLAYBOOK.md`, scale runbooks if present, cache docs, and LLM budget docs into a short operator table. Acceptance criteria: table includes trigger, symptom, metric, action, cost implication, and deferred V2 boundary; link from release checklist and deployment runbook. Constraints: no Redis requirement for single-replica V1; no Terraform default change without evidence.  
**Impact of running prompt:** Scalability (+4-5), Reliability (+1-2), Cost-Effectiveness (+2). Weighted readiness impact: **+0.1-0.2%**.

### 23. DEFERRED Public Reference Customer Proof
**Reason it is deferred:** A real public reference requires customer permission, logo/case-study approval, and commercial/legal coordination outside the repository.  
**Specific information needed later:** Customer name, approval status, permitted logo/case-study language, measured ROI deltas allowed for publication, reference-call terms, and discount/re-rate decision.  
**Expected impact:** Improves Marketability, Differentiability, Proof-of-ROI Readiness, Decision Velocity. This remains `(B)` / V1.1 market-motion realism and is excluded from `(A)`.

### 24. DEFERRED SOC 2 CPA Attestation Program
**Reason it is deferred:** A CPA SOC 2 Type I/II report requires budget, auditor/readiness consultant selection, observation-window decisions, management process evidence, and external execution.  
**Specific information needed later:** Budget ceiling, readiness consultant shortlist, Type I vs Type II target, observation window length, system boundary, region scope, evidence-room owner, and target customer/RFP trigger.  
**Expected impact:** Improves Procurement Readiness, Compliance Readiness, Trustworthiness, Decision Velocity. This remains `(B)` procurement realism and is excluded from `(A)`.

### 25. DEFERRED Production Availability Evidence Program
**Reason it is deferred:** Meaningful production availability evidence requires an actual production or customer-specific hosted environment, approved probe URLs, measurement window, owner-approved SLA language, and operating-history artifacts.  
**Specific information needed later:** Production base URLs, probe locations, measurement window, expected maintenance windows, customer SLA terms if any, alert routing owner, and permission to publish or share uptime summaries.  
**Expected impact:** Improves Availability, Reliability, Procurement Readiness, Enterprise Adoption. Multi-region active/active remains deferred and should not affect `(A)`.

## 10. Prompt Batching Guidance

**Batch A — AI Correctness and Evidence Gates:** Improvements 1, 2, 9, and 20 share agent evaluation, real-mode evidence, faithfulness, retrieval IR, and evidence-label context.

**Batch B — First-Pilot Proof and ROI:** Improvements 3, 4, 15, 17, and 21 all touch proof collection, first-value reports, ROI basis, LLM budget status, and dispositions. This is the highest-leverage commercial-readiness batch.

**Batch C — Buyer UX and Market Packaging:** Improvements 5, 6, 18, and 19 can be batched as docs/product-surface work.

**Batch D — Enterprise Operations and Release Evidence:** Improvements 8, 11, 12, 13, 16, and 22 share release, config, procurement, audit, route/tier/nav, and scale evidence.

**Batch E — Extensibility and Workflow Embeddedness:** Improvements 10 and 14 can run together because both help advanced implementers use current V1 surfaces.

**Deferred Batch:** Improvements 23, 24, and 25 require owner/customer/external inputs. Do not generate implementation prompts for them until the requested information is supplied.

## 11. Pending Questions for Later

### DEFERRED Public Reference Customer Proof
- Which customer, if any, has approved public logo or case-study use?
- Are measured ROI deltas approved for publication or only for NDA use?
- Should reference discount terms be re-rated when a reference becomes public?

### DEFERRED SOC 2 CPA Attestation Program
- What is the budget ceiling for readiness consultant plus CPA engagement?
- Is the target Type I first, Type II first, or readiness-only for a period?
- What exact system boundary and region scope should appear in the auditor system description?

### DEFERRED Production Availability Evidence Program
- Which production or customer-specific base URLs should be probed?
- What measurement window is acceptable before sharing uptime evidence?
- Are customer-specific SLA credits or only internal availability targets in scope?

### V1.1 Connector Validation
- Which vendor tenants or developer instances are available for ServiceNow, Jira, Confluence, Slack, and Teams live validation?
- Which V1.1 connector order should be treated as binding if buyer demand conflicts with current sequencing?

### Commercial Conversion
- Which tier should be the default annual conversion ask after a successful guided pilot?
- Should founder-led services or custom policy-pack authoring be packaged as the default expansion path for early enterprise accounts?
