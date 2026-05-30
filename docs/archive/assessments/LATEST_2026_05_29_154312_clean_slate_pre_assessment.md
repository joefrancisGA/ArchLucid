# ArchLucid Assessment - (A) Headline Readiness: 77.31%

This score represents the `(A)` headline readiness per `Assessment-Scope-V1_1.mdc`, excluding items explicitly deferred to V1.1, V1.x, V2, owner-only commercial action, or `(B)` procurement / market-motion realism.

Total weight: 119. Weighted score: 9200 / 119 = **77.31%**.

**Rescore update (2026-05-29 implementation pass):** support-bundle redaction evidence is now first-class through `redaction-manifest.json`, README/checklist guidance, manifest linkage, and scoped CLI tests. The identity provider settings UI now has a compact setup checklist backed by existing auth configuration diagnostics for discovery, audience/scope, role claim mapping, and SAML certificate health. Several sponsor-proof improvements were also verified as already present in the proof collector, including consolidated AI readiness, data consistency proof status, command center next action, retrieval IR proof, route/tier/policy/nav parity, production-like config lint, timing/scale proof, and custom handler sample coverage. The score moves only modestly because the largest remaining blockers still require live buyer/run evidence, broader UI first-run simplification, and real production-like environment proof.

## 2. Executive Summary

### `(A)` Overall Headline Readiness

ArchLucid is materially past prototype quality. The core product has a real architecture review path, SQL-backed persistence, typed APIs, audit trails, governance, first-pilot proof collection, pricing materials, trust-center posture, and a serious CI story. The headline readiness score is held back by high-weight risks: live AI evidence is not consistently present, first-pilot execution still has too much ceremony, and correctness depends on many gates that are strong in design but uneven in enforcement.

### `(B)` Procurement / Market-Motion Realism

Enterprise procurement friction remains real but is not included in the `(A)` score where the scope docs explicitly exclude it. SOC 2 CPA attestation, third-party pen-test publication, public reference customers, live Marketplace transactability, and some V1.1 connector demands will slow larger buyers. The repo is honest about these items and has procurement-pack scaffolding, but some buyers will still classify them as blockers.

### Commercial Picture

The commercial story is credible: clear category positioning, locked pricing, pilot scorecard, ROI model, sales-led quote path, proof packet, and buyer-job walkthroughs. The weakness is not the absence of a story; it is the lack of repeated, buyer-specific proof loops. Monetization depends on getting a real review package into a sponsor's hands quickly and making ROI basis labels impossible to misuse.

### Enterprise Picture

Enterprise posture is stronger than most early products: database-per-tenant topology, RBAC, API key/JWT/OIDC/SAML surfaces, SCIM, audit events, trust documents, policy packs, and governance workflow exist. The enterprise risk is operational burden. A buyer can understand the control posture, but implementation teams still need careful setup, proof collectors, configuration linting, and explicit caveats.

### Engineering Picture

Engineering is modular, heavily documented, test-rich, and aligned with Azure-native SaaS assumptions. The system uses Dapper/DbUp, OpenAPI snapshot discipline, merge-blocking UI/API tests, production config validation, OTel metrics, quality gates, and retrieval evaluation. The main engineering concern is complexity: many capabilities are present, but the product has a large surface area and some high-value gates remain warn-only, optional, or dependent on environment-specific evidence.

### Deferred Scope Uncertainty

No material deferred-scope uncertainty was found. The relevant V1, V1.1, V1.x, V2, and `(B)` boundaries were located in `Assessment-Scope-V1_1.mdc`, `docs/library/V1_SCOPE.md`, `docs/library/V1_DEFERRED.md`, `docs/go-to-market/TRUST_CENTER.md`, and related catalog/runbook material.

## 3. Weighted Quality Assessment

The table below is the authoritative urgency order by weighted deficiency signal: `(100 - score) * weight`. The notes after the table expand the same scoring decisions.

| Rank | Quality | Score | Weight | Weighted impact on readiness | Weighted deficiency signal | Short rationale | Fix window |
| ---: | --- | ---: | ---: | ---: | ---: | --- | --- |
| 1 | AI/Agent Readiness | 76 | 8 | 5.11% | 192 | Strong gates and evals, but live evidence is skipped in the current rollup and some baselines remain warn-only. | V1 |
| 2 | Adoption Friction | 71 | 6 | 3.58% | 174 | First-pilot path is clear but still setup- and proof-heavy; identity setup now has a clearer operator checklist. | V1 |
| 3 | Cutting-Edge AI Technology | 78 | 8 | 5.24% | 176 | Modern retrieval/eval/structured-output posture, limited by proof and operational enablement. | V1 / later for advanced RAG |
| 4 | Correctness | 79 | 8 | 5.31% | 168 | Strong contract/test/schema posture across a large buyer-visible surface. | V1 |
| 5 | Time-to-Value | 78 | 7 | 4.59% | 154 | Core review value exists, but setup and sponsor-proof ceremony slow first value. | V1 |
| 6 | Marketability | 82 | 8 | 5.51% | 144 | Clear category and proof-backed story; needs fast live proof in front of buyers. | V1 |
| 7 | Stickiness | 76 | 6 | 3.83% | 144 | Manifests, audit, policy packs, compare, and prior-manifest retrieval create data gravity; habit loops need strengthening. | V1 / V1.1 connectors |
| 8 | Proof-of-ROI Readiness | 75 | 5 | 3.15% | 125 | ROI model and endpoint exist; basis labels and unsupported cost claims need harder enforcement. | V1 |
| 9 | Workflow Embeddedness | 69 | 3 | 1.74% | 93 | V1 REST/CLI/UI/SCIM/CI surfaces are solid; ITSM/chat/docs embeddings are V1.1. | V1 / V1.1 |
| 10 | Executive Value Visibility | 80 | 4 | 2.69% | 80 | Sponsor reports and ROI summary exist; executive status needs stronger summarization. | V1 |
| 11 | Usability | 75 | 3 | 1.89% | 75 | Operator UI is capable and identity setup is clearer, but the product remains technical and route-heavy. | V1 |
| 12 | Differentiability | 82 | 4 | 2.76% | 72 | Evidence-linked governance/audit differentiates well from generic AI and EA repositories. | V1 |
| 13 | Trustworthiness | 77 | 3 | 1.94% | 69 | Strong trust controls plus clearer support-bundle redaction evidence, still weakened by skipped live LLM evidence in current artifacts. | V1 |
| 14 | Security | 80 | 3 | 2.02% | 60 | Good internal controls, explicit support-bundle redaction manifest, and clearer identity diagnostics; external assurance remains deferred / `(B)`. | V1 / `(B)` |
| 15 | Architectural Integrity | 80 | 3 | 2.02% | 60 | Coherent modular architecture, with residual complexity around authority vs coordinator semantics. | V1 |
| 16 | Decision Velocity | 70 | 2 | 1.18% | 60 | Sales-led quote path is credible but still proof/procurement dependent. | V1 / V1.1 commerce |
| 17 | Interoperability | 70 | 2 | 1.18% | 60 | Good V1 API/CLI/OpenAPI/SCIM posture; first-party enterprise connectors are V1.1. | V1 / V1.1 |
| 18 | Maintainability | 72 | 2 | 1.21% | 56 | Modular but very large; doc/script drift remains a real cost. | V1 |
| 19 | Procurement Readiness | 72 | 2 | 1.21% | 56 | Good self-attested pack; strict buyers may demand `(B)` assurances. | V1 / `(B)` |
| 20 | Compliance Readiness | 73 | 2 | 1.23% | 54 | Strong self-assessment and governance evidence, no formal certification claim. | V1 / `(B)` |
| 21 | Commercial Packaging Readiness | 74 | 2 | 1.24% | 52 | Sales-led packaging is usable; live commerce is deferred. | V1 / V1.1 |
| 22 | Reliability | 76 | 2 | 1.28% | 48 | Health, retries, idempotency, chaos, and smoke exist; degraded states need proof visibility. | V1 |
| 23 | Traceability | 86 | 3 | 2.17% | 42 | One of the strongest areas: traces, manifests, audit, retrieval grounding, and proof bundles. | V1 |
| 24 | Data Consistency | 80 | 2 | 1.34% | 40 | Strong matrix/probes, but sponsor handoff must enforce the signal. | V1 |
| 25 | Explainability | 82 | 2 | 1.38% | 36 | Strong traces and evidence-basis labels; low-support claims need prominent status. | V1 |
| 26 | Policy and Governance Alignment | 82 | 2 | 1.38% | 36 | Strong policy/gate/approval surfaces; starter packs must not be oversold as certification. | V1 |
| 27 | Azure Compatibility and SaaS Deployment Readiness | 83 | 2 | 1.39% | 34 | Azure-native SaaS posture is strong; multi-region active/active is deferred. | V1 |
| 28 | Cognitive Load | 66 | 1 | 0.55% | 34 | Lowest raw score: the product and repo are information-dense. | V1 |
| 29 | Customer Self-Sufficiency | 70 | 1 | 0.59% | 30 | Rich docs plus clearer support-bundle and identity setup guidance, but guided-operation burden remains for new evaluators. | V1 |
| 30 | Scalability | 70 | 1 | 0.59% | 30 | V1 envelope is explicit and modest, not broad-scale proof. | V1 / later |
| 31 | Auditability | 86 | 2 | 1.45% | 28 | Strong typed audit and export posture. | V1 |
| 32 | Availability | 72 | 1 | 0.61% | 28 | Targets and probes exist; production SLA proof is not claimed. | V1 / later |
| 33 | Performance | 73 | 1 | 0.61% | 27 | k6 smoke and docs exist; broad load proof is limited. | V1 |
| 34 | Extensibility | 73 | 1 | 0.61% | 27 | Code-level extension is documented; public ecosystem is deferred. | V1 |
| 35 | Manageability | 78 | 1 | 0.66% | 22 | Strong config/diagnostics surface with a clearer identity setup checklist, but the surface is large. | V1 |
| 36 | Testability | 77 | 1 | 0.65% | 23 | Very strong test taxonomy; 95% ratchet is V1.1. | V1 / V1.1 |
| 37 | Deployability | 78 | 1 | 0.66% | 22 | Docker/Terraform/DbUp/release smoke are solid; environment secrets remain operator-owned. | V1 |
| 38 | Cost-Effectiveness | 78 | 1 | 0.66% | 22 | Budgets, cache, and envelope are good; real-mode AI cost needs visibility. | V1 |
| 39 | Supportability | 83 | 1 | 0.70% | 17 | Correlation IDs, problem details, diagnostics, and support bundles are strong; redaction evidence is now explicit. | V1 |
| 40 | Template and Accelerator Richness | 84 | 1 | 0.71% | 16 | Strong buyer-job accelerators; keep optional before first Core value. | V1 |
| 41 | Documentation | 86 | 1 | 0.72% | 14 | Extensive and useful, with clearer support-bundle redaction instructions; volume and drift remain the risks. | V1 |

### 1. AI/Agent Readiness

- **Score:** 76
- **Weight:** 8
- **Weighted impact on readiness:** 5.11 percentage points
- **Weighted deficiency signal:** 192
- **Justification:** The agent system has deterministic orchestration, real/simulator separation, schema validation, PilotStrict quality gates, faithfulness checks, retrieval IR evaluation, LLM accounting, and OTel metrics. The weak point is proof enforcement: the latest real-mode evidence rollup skipped live Azure OpenAI collection, the offline dashboard passed faithfulness and retrieval IR but flagged an unsupported ROI/cost claim, and some quality baselines are still warn-only.
- **Tradeoffs:** Simulator-first quality keeps CI affordable and deterministic, but it cannot prove live model behavior on buyer corpora.
- **Improvement recommendations:** make sponsor packets require an explicit AI evidence disposition; block unsupported ROI/cost claims in proof outputs; add a repeatable real-mode cohort path when credentials are available.
- **Fix window:** Mostly V1; live cohort execution depends on environment credentials and can be deferred operationally.

### 2. Adoption Friction

- **Score:** 71
- **Weight:** 6
- **Weighted impact on readiness:** 3.58 percentage points
- **Weighted deficiency signal:** 174
- **Justification:** The first-pilot path is well documented, and identity setup now has a compact operator checklist for discovery, audience/scope, role mapping, and SAML certificate health. It still requires SQL/auth setup, extractor or demo acceptance, proof collectors, config lint, data consistency checks, and procurement pack interpretation. The product has reduced ambiguity, not effort.
- **Tradeoffs:** Strong evidence discipline creates more steps, but skipping those steps would make the sponsor packet unsafe.
- **Improvement recommendations:** collapse first-pilot actions into a smaller command center, keep one next action visible in the UI, and make proof collection self-explanatory.
- **Fix window:** V1.

### 3. Cutting-Edge AI Technology

- **Score:** 78
- **Weight:** 8
- **Weighted impact on readiness:** 5.24 percentage points
- **Weighted deficiency signal:** 176
- **Justification:** The AI substrate includes structured outputs, optional Azure OpenAI JSON schema mode, staged critic, retrieval corpora, policy-pack/prior-manifest/platform-doc indexing, embedding drift guards, faithfulness scoring, and semantic ranker planning. It is modern enough. The gap is that advanced behavior is constrained by budget, optional enablement, and uneven live evidence rather than absent technology.
- **Tradeoffs:** The repo avoids speculative agent autonomy and keeps decisioning deterministic, which is correct for enterprise trust but less flashy than agentic multi-hop systems.
- **Improvement recommendations:** strengthen real-mode evidence, expose model/evidence basis clearly, and continue improving retrieval quality before adding advanced agentic retrieval.
- **Fix window:** V1 for evidence and quality; advanced graph-RAG/agentic retrieval remains V2.

### 4. Correctness

- **Score:** 79
- **Weight:** 8
- **Weighted impact on readiness:** 5.31 percentage points
- **Weighted deficiency signal:** 168
- **Justification:** Correctness is supported by schema validation, OpenAPI snapshots, idempotent create/commit behavior, SQL integration tests, Dapper repository contracts, data consistency probes, and API/UI live e2e. Risk remains because architecture request, authority pipeline, legacy coordinator semantics, retrieval, ROI, governance, and proof outputs form a large correctness surface.
- **Tradeoffs:** Maintaining compatibility across authority and coordinator paths increases integration complexity, but it protects shipped behavior.
- **Improvement recommendations:** focus correctness tests on high-risk buyer outputs: sponsor packet, ROI basis, commit semantics, quality-gate rejection, and retrieval-backed claims.
- **Fix window:** V1.

### 5. Time-to-Value

- **Score:** 78
- **Weight:** 7
- **Weighted impact on readiness:** 4.59 percentage points
- **Weighted deficiency signal:** 154
- **Justification:** A first review can be created, executed, committed, and packaged through UI/API/CLI, and the repo provides a concise operator path. The remaining drag is setup and proof ceremony before a sponsor-safe package exists.
- **Tradeoffs:** Demo workspaces accelerate evaluation but cannot replace buyer evidence for purchase proof.
- **Improvement recommendations:** make the product default to a "first credible review in one sitting" flow with automatic proof status, not a sequence of scripts the operator remembers.
- **Fix window:** V1.

### 6. Marketability

- **Score:** 82
- **Weight:** 8
- **Weighted impact on readiness:** 5.51 percentage points
- **Weighted deficiency signal:** 144
- **Justification:** The category, buyer promise, proof points, pricing, and buyer-job packaging are clear. The product is differentiated from generic AI by evidence linkage, governance, and auditability. Marketability still depends on showing live proof quickly.
- **Tradeoffs:** "Architecture Proof Engine" is sharper than generic AI positioning but requires buyer education.
- **Improvement recommendations:** make demo proof packets and buyer-specific proof packets visually and narratively identical except for evidence source labels.
- **Fix window:** V1.

### 7. Stickiness

- **Score:** 76
- **Weight:** 6
- **Weighted impact on readiness:** 3.83 percentage points
- **Weighted deficiency signal:** 144
- **Justification:** Stickiness comes from accumulated manifests, audit trails, policy packs, governance approvals, comparisons, prior-manifest retrieval, and executive ROI summaries. The risk is that integrations and habit loops beyond first review are not yet as automatic as the core pilot.
- **Tradeoffs:** The product has strong data gravity once adopted, but first adoption must cross a meaningful setup threshold.
- **Improvement recommendations:** promote post-commit next actions, repeat-review loops, saved views, and governance/compare prompts that naturally pull teams back after the first review.
- **Fix window:** V1 for habit loops; first-party connectors are V1.1.

### 8. Proof-of-ROI Readiness

- **Score:** 75
- **Weight:** 5
- **Weighted impact on readiness:** 3.15 percentage points
- **Weighted deficiency signal:** 125
- **Justification:** The ROI model, scorecard, executive summary endpoint, cost evidence freshness labels, and pricing basis controls are good. The gap is proof hygiene: ROI numbers are powerful only when buyer-provided/defaulted/demo-derived labels are enforced and unsupported cost claims cannot leak into sponsor-facing material.
- **Tradeoffs:** Conservative labeling weakens the sales headline but protects trust.
- **Improvement recommendations:** make ROI basis labels required in every sponsor/export path and fail proof collection on unsupported cost/ROI claims.
- **Fix window:** V1.

### 9. Workflow Embeddedness

- **Score:** 69
- **Weight:** 3
- **Weighted impact on readiness:** 1.74 percentage points
- **Weighted deficiency signal:** 93
- **Justification:** REST, CLI, UI, SCIM, GitHub/Azure DevOps surfaces, Azure extractor ZIP, and API clients support V1 workflows. The product is not yet deeply embedded into Jira, ServiceNow, Confluence, Slack, Teams, or MCP because those are V1.1 scope.
- **Tradeoffs:** Keeping V1 focused avoids overcommitting connectors, but buyers with ITSM-first operating models will feel friction.
- **Improvement recommendations:** strengthen V1 REST/CLI handoff recipes and proof export into common systems while V1.1 connectors mature.
- **Fix window:** V1 for recipes/handoffs; first-party connectors V1.1.

### 10. Usability

- **Score:** 75
- **Weight:** 3
- **Weighted impact on readiness:** 1.89 percentage points
- **Weighted deficiency signal:** 75
- **Justification:** The operator shell has layer hints, role-aware navigation, empty/error states, keyboard affordances, buyer vocabulary mapping, and now a clearer identity setup checklist. It remains a technical operator dashboard with IDs, hashes, and many routes.
- **Tradeoffs:** Technical transparency supports operators but increases cognitive load for buyers and sponsors.
- **Improvement recommendations:** reduce the default path to one primary next action per state and keep advanced Operate links visually secondary.
- **Fix window:** V1.

### 11. Executive Value Visibility

- **Score:** 80
- **Weight:** 4
- **Weighted impact on readiness:** 2.69 percentage points
- **Weighted deficiency signal:** 80
- **Justification:** Sponsor reports, first-value reports, executive ROI summary, proof packets, demo preview, and exports give executives usable outputs. The risk is evidence-label clarity, not absence of executive artifacts.
- **Tradeoffs:** Detailed proof strengthens credibility but can obscure the executive narrative if not summarized.
- **Improvement recommendations:** add a short sponsor-safe executive status block to every proof packet: value, evidence basis, quality posture, and next commercial action.
- **Fix window:** V1.

### 12. Differentiability

- **Score:** 82
- **Weight:** 4
- **Weighted impact on readiness:** 2.76 percentage points
- **Weighted deficiency signal:** 72
- **Justification:** Evidence-linked findings, provenance, governance, policy packs, audit, and architecture-specific ROI differentiate ArchLucid from generic AI assistants and classic EA repositories.
- **Tradeoffs:** Differentiation depends on buyers valuing defensibility over broad autonomous design claims.
- **Improvement recommendations:** keep proof pages grounded in live product outputs and avoid broad "AI platform" language.
- **Fix window:** V1.

### 13. Trustworthiness

- **Score:** 77
- **Weight:** 3
- **Weighted impact on readiness:** 1.94 percentage points
- **Weighted deficiency signal:** 69
- **Justification:** Trust is supported by scoped persistence, auditability, quality gates, evidence labels, tenant isolation, honest trust docs, and now an explicit support-bundle redaction manifest. It is still weakened by skipped live LLM evidence and offline-only quality proof in current generated artifacts.
- **Tradeoffs:** Honest caveats lower short-term sales sparkle but prevent overclaiming.
- **Improvement recommendations:** keep proof packets explicit about simulator/offline/live AI evidence and require redaction-manifest review before support bundles leave the operator/support boundary.
- **Fix window:** V1.

### 14. Security

- **Score:** 80
- **Weight:** 3
- **Weighted impact on readiness:** 2.02 percentage points
- **Weighted deficiency signal:** 60
- **Justification:** The system has RBAC, auth safety guards, rate limiting, tenant isolation, Key Vault posture, prompt redaction, content safety, gitleaks, ZAP/Schemathesis scheduling, startup validation, a machine-readable support-bundle redaction manifest, and clearer identity diagnostics. Procurement-grade external assurance is deferred and not included in `(A)`.
- **Tradeoffs:** Database-per-tenant isolation is strong but increases operational complexity.
- **Improvement recommendations:** keep improving production-like config lint, tenant isolation probes, redaction rule coverage, and security evidence freshness.
- **Fix window:** V1 for internal controls; external assurance V2/`(B)`.

### 15. Architectural Integrity

- **Score:** 80
- **Weight:** 3
- **Weighted impact on readiness:** 2.02 percentage points
- **Weighted deficiency signal:** 60
- **Justification:** The architecture is coherent: API/Application/Persistence/Worker/UI are separately bounded; Dapper/DbUp is consistent; ADRs and invariants exist; dependency constraints prevent silent cycles. Complexity remains around authority pipeline vs legacy coordinator semantics.
- **Tradeoffs:** Preserving existing public behavior keeps compatibility but leaves conceptual load.
- **Improvement recommendations:** keep converging docs, UI language, and integration guidance on authority semantics.
- **Fix window:** V1.

### 16. Decision Velocity

- **Score:** 70
- **Weight:** 2
- **Weighted impact on readiness:** 1.18 percentage points
- **Weighted deficiency signal:** 60
- **Justification:** Pricing and quote path exist, but annual conversion still depends on proof status, procurement pack, sponsor packet, ROI labels, and sales follow-up. This is appropriate for enterprise, but not fast.
- **Tradeoffs:** Sales-led conversion is safer before live commerce but slows small-team purchasing.
- **Improvement recommendations:** make commercial-next-step output more prescriptive and connect quote requests to a measurable follow-up SLA.
- **Fix window:** V1; live self-serve commerce is V1.1 / owner-only.

### 17. Interoperability

- **Score:** 70
- **Weight:** 2
- **Weighted impact on readiness:** 1.18 percentage points
- **Weighted deficiency signal:** 60
- **Justification:** V1 interoperability through REST, CLI, OpenAPI, SCIM, Azure DevOps/GitHub, and ZIP ingest is adequate. Buyers expecting first-party ITSM/docs/chat integrations must wait for V1.1.
- **Tradeoffs:** API-first keeps scope sane, but field adoption often wants native tool presence.
- **Improvement recommendations:** improve V1 recipes and connector smoke indexes without treating V1.1 connectors as V1 defects.
- **Fix window:** V1 for recipes; V1.1 for first-party connectors.

### 18. Maintainability

- **Score:** 72
- **Weight:** 2
- **Weighted impact on readiness:** 1.21 percentage points
- **Weighted deficiency signal:** 56
- **Justification:** The repo is modular and documented, but it is large, with many generated docs, scripts, gates, and config surfaces. Long-term maintainability depends on enforcing source-of-truth files and not letting assessment/proof docs drift.
- **Tradeoffs:** Heavy documentation helps agents and operators but can become operational debt.
- **Improvement recommendations:** add drift checks for critical proof docs and keep generated status files obviously generated.
- **Fix window:** V1.

### 19. Procurement Readiness

- **Score:** 72
- **Weight:** 2
- **Weighted impact on readiness:** 1.21 percentage points
- **Weighted deficiency signal:** 56
- **Justification:** Procurement pack, DPA template, CAIQ/SIG, trust center, subprocessors, incident comms, and deal-ready checks exist. Larger buyers may still require SOC 2 CPA, third-party pen test, reference customer, or Marketplace transactability, but those are `(B)` or deferred.
- **Tradeoffs:** Self-attested procurement artifacts are useful for pilots, less decisive for strict enterprise RFPs.
- **Improvement recommendations:** make deal-ready output binary and buyer-safe; keep deferred procurement asks explicitly labeled.
- **Fix window:** V1 for pack strictness; `(B)` for formal attestations.

### 20. Compliance Readiness

- **Score:** 73
- **Weight:** 2
- **Weighted impact on readiness:** 1.23 percentage points
- **Weighted deficiency signal:** 54
- **Justification:** Compliance readiness includes policy packs, audit logs, DPA template, SOC 2 self-assessment, SIG/CAIQ, DSAR docs, and trust center honesty. Formal certification is not part of the headline scope.
- **Tradeoffs:** Self-assessment is valuable for early buyers but weaker than attestation.
- **Improvement recommendations:** improve compliance evidence freshness checks and map default policy packs to exact buyer claims.
- **Fix window:** V1 for evidence quality; external certification out of scope.

### 21. Scalability

- **Score:** 70
- **Weight:** 1
- **Weighted impact on readiness:** 0.59 percentage points
- **Weighted deficiency signal:** 30
- **Justification:** The V1 capacity envelope is explicit and modest: up to 5 active pilot tenants, 25 committed reviews per tenant per month, and single API/worker starting point. That is enough for first-pilot and early production, not proof of broad scale.
- **Tradeoffs:** A modest envelope keeps cost and complexity sane.
- **Improvement recommendations:** keep scale triggers measurable and add proof artifacts for queue, SQL, LLM, and worker saturation.
- **Fix window:** V1 for measurement; larger scale hardening later.

### 22. Data Consistency

- **Score:** 80
- **Weight:** 2
- **Weighted impact on readiness:** 1.34 percentage points
- **Weighted deficiency signal:** 40
- **Justification:** The data consistency matrix is explicit about transactions, outbox behavior, idempotency, read-replica lag, cache invalidation, archival cascades, and orphan probes. Remaining risk is best-effort idempotency under extreme parallel duplicate-key races and operational gaps when probes are not run.
- **Tradeoffs:** Eventual indexing and read replicas are appropriate, but operators need clear expectations.
- **Improvement recommendations:** make sponsor handoff block on data consistency status and expose orphan probe state in proof artifacts.
- **Fix window:** V1.

### 23. Reliability

- **Score:** 76
- **Weight:** 2
- **Weighted impact on readiness:** 1.28 percentage points
- **Weighted deficiency signal:** 48
- **Justification:** Reliability benefits from health checks, retries, outbox-style indexing, idempotent commit, config validation, data consistency probes, quality-gate rejection paths, chaos tests, and smoke tests. It is still early-production reliability, not long-proven SaaS reliability.
- **Tradeoffs:** Fail-open retrieval protects commit flow but can weaken evidence quality if not surfaced.
- **Improvement recommendations:** surface degraded retrieval/indexing/quality states in proof and readiness outputs.
- **Fix window:** V1.

### 24. Explainability

- **Score:** 82
- **Weight:** 2
- **Weighted impact on readiness:** 1.38 percentage points
- **Weighted deficiency signal:** 36
- **Justification:** Explainability is a strength: traces, provenance graph, aggregate explanations, confidence, evidence-basis labels, and demo explain routes exist. The main gap is making unsupported or low-support claims impossible to overlook.
- **Tradeoffs:** Rich explanations increase cognitive load unless summarized.
- **Improvement recommendations:** add a compact evidence-basis block to every sponsor-facing explanation.
- **Fix window:** V1.

### 25. Azure Compatibility and SaaS Deployment Readiness

- **Score:** 83
- **Weight:** 2
- **Weighted impact on readiness:** 1.39 percentage points
- **Weighted deficiency signal:** 34
- **Justification:** Azure-native deployment, Key Vault, Azure SQL, Container Apps, Front Door/WAF, private endpoints, Azure OpenAI, Application Insights/OTel, Terraform modules, and Azure extractor posture are all aligned. Multi-region active/active is deferred and not penalized.
- **Tradeoffs:** Azure-first posture is commercially coherent but narrows non-Azure buyer fit until V1.1 multi-cloud analysis.
- **Improvement recommendations:** keep minimal Azure pilot deployment and config-lint evidence first-class.
- **Fix window:** V1.

### 26. Customer Self-Sufficiency

- **Score:** 70
- **Weight:** 1
- **Weighted impact on readiness:** 0.59 percentage points
- **Weighted deficiency signal:** 30
- **Justification:** Docs and scripts are rich, support-bundle sharing now has a clearer redaction-manifest review path, and identity setup has a first-screen checklist. A buyer still benefits from guided operation, and the number of runbooks can overwhelm a new evaluator.
- **Tradeoffs:** Deep self-service docs reduce support dependence once understood, but discovery burden is high.
- **Improvement recommendations:** make the evaluator workbook and in-product Home the only default entry points.
- **Fix window:** V1.

### 27. Performance

- **Score:** 73
- **Weight:** 1
- **Weighted impact on readiness:** 0.61 percentage points
- **Weighted deficiency signal:** 27
- **Justification:** k6 API smoke, performance docs, cache controls, and capacity envelope exist. The performance proof is appropriate for early production but not broad load certification.
- **Tradeoffs:** More performance testing would cost CI time and infrastructure.
- **Improvement recommendations:** add performance proof artifacts to first-pilot evidence for run duration, API p95, and queue latency.
- **Fix window:** V1.

### 28. Extensibility

- **Score:** 73
- **Weight:** 1
- **Weighted impact on readiness:** 0.61 percentage points
- **Weighted deficiency signal:** 27
- **Justification:** Custom handler docs, finding-engine template, API, CLI, and extension boundaries exist. Public SDK/marketplace and MCP are deferred or V1.1 and not penalized.
- **Tradeoffs:** Code-level extensibility is useful for advanced customers but not the same as a productized ecosystem.
- **Improvement recommendations:** add a minimal, tested custom handler sample and keep extension docs explicit about non-goals.
- **Fix window:** V1.

### 29. Availability

- **Score:** 72
- **Weight:** 1
- **Weighted impact on readiness:** 0.61 percentage points
- **Weighted deficiency signal:** 28
- **Justification:** Health endpoints, SLO targets, hosted probe rollups, and Azure deployment patterns exist. Current posture is target-based and staging/probe-oriented rather than production SLA proof.
- **Tradeoffs:** Avoiding contractual SLA claims is honest at this stage.
- **Improvement recommendations:** keep probe rollups buyer-safe and separate staging evidence from production commitments.
- **Fix window:** V1 for evidence labeling; contractual SLA later.

### 30. Manageability

- **Score:** 78
- **Weight:** 1
- **Weighted impact on readiness:** 0.66 percentage points
- **Weighted deficiency signal:** 22
- **Justification:** Configuration catalog, admin config summary, config lint, auth diagnostics, health checks, support bundles, runbooks, and the identity setup checklist help manageability. The configuration surface is large.
- **Tradeoffs:** Powerful configuration increases misconfiguration risk.
- **Improvement recommendations:** make production-like profile linting mandatory for sponsor handoff and keep identity diagnostics aligned with the setup checklist.
- **Fix window:** V1.

### 31. Deployability

- **Score:** 78
- **Weight:** 1
- **Weighted impact on readiness:** 0.66 percentage points
- **Weighted deficiency signal:** 22
- **Justification:** Docker, Terraform, DbUp, build scripts, release smoke, greenfield SQL boot, and CI gates support deployment. Live production readiness still depends on environment-specific secret and identity setup.
- **Tradeoffs:** Terraform/IaC discipline is strong but needs operator knowledge.
- **Improvement recommendations:** keep minimal Azure pilot deployment as the default deploy path and validate it in proof.
- **Fix window:** V1.

### 32. Testability

- **Score:** 77
- **Weight:** 1
- **Weighted impact on readiness:** 0.65 percentage points
- **Weighted deficiency signal:** 23
- **Justification:** Unit, integration, SQL, UI, Playwright, OpenAPI, chaos, k6, and scheduled security tests are well organized. Merged line coverage is 75% now, with 95% and ratchet deferred to V1.1.
- **Tradeoffs:** Broad test coverage increases CI cost, but protects a wide surface.
- **Improvement recommendations:** target uncovered high-risk modules rather than chasing vanity percentages.
- **Fix window:** V1 for targeted tests; 95% ratchet V1.1.

### 33. Cost-Effectiveness

- **Score:** 78
- **Weight:** 1
- **Weighted impact on readiness:** 0.66 percentage points
- **Weighted deficiency signal:** 22
- **Justification:** The product includes LLM cost estimation, tenant budgets, caching, modest capacity envelope, and pricing model. Cost risk is mostly from real-mode AI and broad proof generation.
- **Tradeoffs:** Strict budgets can block useful work; loose budgets can surprise operators.
- **Improvement recommendations:** make budget posture visible in sponsor proof and operator dashboards.
- **Fix window:** V1.

### 34. Commercial Packaging Readiness

- **Score:** 74
- **Weight:** 2
- **Weighted impact on readiness:** 1.24 percentage points
- **Weighted deficiency signal:** 52
- **Justification:** Tiers, pricing, quote path, order form, pilot pricing, and professional services SKU materials exist. Live self-serve commerce is explicitly deferred, but sales-led packaging is usable.
- **Tradeoffs:** Sales-led packaging is slower but appropriate until buyer proof and payment rails are mature.
- **Improvement recommendations:** keep quote-to-proof packet and commercial next step generated from proof evidence.
- **Fix window:** V1 for sales-led packaging; live commerce V1.1/owner-only.

### 35. Auditability

- **Score:** 86
- **Weight:** 2
- **Weighted impact on readiness:** 1.45 percentage points
- **Weighted deficiency signal:** 28
- **Justification:** Auditability is one of the strongest areas: typed events, append-only SQL, correlation IDs, CSV/export paths, audit coverage matrix, governance audit, and traceability bundles exist.
- **Tradeoffs:** Maintaining audit coverage across a large route surface requires ongoing discipline.
- **Improvement recommendations:** keep audit coverage generated or checked against event type growth.
- **Fix window:** V1.

### 36. Policy and Governance Alignment

- **Score:** 82
- **Weight:** 2
- **Weighted impact on readiness:** 1.38 percentage points
- **Weighted deficiency signal:** 36
- **Justification:** Policy packs, scope assignments, effective governance resolution, pre-commit gate, approval workflow, and governance dashboard are strong. Default packs must not be oversold as certification.
- **Tradeoffs:** Governance depth is a second-sale strength, not always first-pilot necessity.
- **Improvement recommendations:** keep starter packs framed as architecture-review inputs, not compliance certification.
- **Fix window:** V1.

### 37. Traceability

- **Score:** 86
- **Weight:** 3
- **Weighted impact on readiness:** 2.17 percentage points
- **Weighted deficiency signal:** 42
- **Justification:** Traceability is strong through provenance graph, explainability trace, audit rows, artifacts, manifests, retrieval grounding trace, and proof bundles.
- **Tradeoffs:** More trace data can overwhelm unless summarized.
- **Improvement recommendations:** expose trace completeness and evidence-basis labels in sponsor summaries.
- **Fix window:** V1.

### 38. Supportability

- **Score:** 83
- **Weight:** 1
- **Weighted impact on readiness:** 0.70 percentage points
- **Weighted deficiency signal:** 17
- **Justification:** Correlation IDs, problem details, support bundles, diagnostics, health checks, config summaries, runbooks, and OTel metrics are strong. Support bundles now include `redaction-manifest.json`, README guidance, manifest linkage, covered-file inventory, omitted secret-bearing categories, and tested redaction behavior. The support surface is still large, so routing matters.
- **Tradeoffs:** More diagnostics can create more places to look.
- **Improvement recommendations:** keep the redaction manifest synchronized with bundle inventory and add a one-page "what support needs" block to proof and error outputs.
- **Fix window:** V1.

### 39. Documentation

- **Score:** 86
- **Weight:** 1
- **Weighted impact on readiness:** 0.72 percentage points
- **Weighted deficiency signal:** 14
- **Justification:** Documentation is extensive, structured, and often source-of-truth driven. `CLI_USAGE.md` and troubleshooting now explicitly point operators to `redaction-manifest.json` before external sharing. The risk is still volume and drift, not absence.
- **Tradeoffs:** Rich docs help agents and operators but can burden buyers.
- **Improvement recommendations:** keep `START_HERE.md`, evaluator workbook, and first-pilot path as the only front doors.
- **Fix window:** V1.

### 40. Template and Accelerator Richness

- **Score:** 84
- **Weight:** 1
- **Weighted impact on readiness:** 0.71 percentage points
- **Weighted deficiency signal:** 16
- **Justification:** Azure SaaS, AI governance, healthcare claims, demo proof packets, policy packs, and buyer-job walkthroughs are strong.
- **Tradeoffs:** Too many accelerators can distract before first Core value.
- **Improvement recommendations:** keep accelerators explicitly optional until after first commit.
- **Fix window:** V1.

### 41. Cognitive Load

- **Score:** 66
- **Weight:** 1
- **Weighted impact on readiness:** 0.55 percentage points
- **Weighted deficiency signal:** 34
- **Justification:** This is the weakest raw score. The product and repo are information-dense, with many routes, scripts, proof files, statuses, and scope boundaries. Expert operators can navigate it; first-time evaluators can drown.
- **Tradeoffs:** The complexity exists because the product is serious and evidence-heavy.
- **Improvement recommendations:** narrow every first-session surface to one primary action, one status, and one proof folder.
- **Fix window:** V1.

## 4. Top 12 Most Important Weaknesses

1. **Live AI proof is not consistently available.** Offline evidence is useful, but current generated real-mode rollup skipped live Azure OpenAI collection.
2. **First-pilot value requires too much orchestration.** The checklist is clear, but still script-heavy and setup-heavy.
3. **Sponsor packet safety depends on multiple independent gates.** AI quality, ROI basis, data consistency, procurement, route parity, and config lint must all align.
4. **Unsupported ROI/cost claim detection is not yet treated as a hard commercial stop.**
5. **The product has high cognitive load.** There are many docs, routes, statuses, and proof artifacts for a first-time buyer.
6. **Workflow embedding is API/CLI-first.** That is acceptable for V1, but ITSM/chat/docs buyers will wait for V1.1 connectors.
7. **Correctness risk is spread across a broad surface.** Authority pipeline, legacy coordinator semantics, retrieval, governance, ROI, and exports all have buyer-visible failure modes.
8. **Procurement artifacts are strong but self-attested.** Strict enterprise buyers may still demand external assurance.
9. **Self-service conversion is not the default commercial motion.** Sales-led packaging works but slows decision velocity.
10. **Real-mode AI gates are partially operational, not uniformly merge-blocking.**
11. **Maintainability is challenged by documentation and script volume.**
12. **Capacity evidence is intentionally modest.** Good for first pilots, not yet strong proof for large-scale deployment.

## 5. Top 6 Monetization Blockers

1. **No buyer-specific proof packet means no annual conversion ask.**
2. **ROI labels that are defaulted, demo-derived, or unsupported will weaken sponsor confidence.**
3. **Sales-led quote path still needs disciplined follow-up and aging visibility.**
4. **Strict buyers may pause on SOC 2 CPA / third-party pen-test / reference customer gaps under `(B)`.**
5. **Live commerce and Marketplace transactability are deferred, so self-serve revenue is limited.**
6. **V1.1 connector demands can block expansion into operational teams even when the core review proves value.**

## 6. Top 6 Enterprise Adoption Blockers

1. **Procurement teams may require external assurance artifacts not in V1/V1.1 headline scope.**
2. **Implementation teams must configure identity, SQL, proof collection, observability, and governance correctly.**
3. **ITSM/docs/chat workflows are not V1 buyer-contract surfaces.**
4. **Operators need clear evidence-basis labels to trust AI outputs.**
5. **Customer self-sufficiency is limited by the number of required runbooks and scripts.**
6. **Production-like deployment evidence depends on environment-specific Azure configuration.**

## 7. Top 6 Engineering Risks

1. **AI output quality can degrade without live-mode evidence catching it.**
2. **Authority/coordinator semantic confusion can cause integration misuse around execute/result/commit.**
3. **Retrieval or ROI evidence gaps can produce persuasive but under-supported sponsor claims.**
4. **Configuration drift can leave production-like hosts in unsafe or unprovable posture.**
5. **Data consistency probes may be skipped even though sponsor handoff assumes their signal.**
6. **Large surface area increases regression probability despite strong tests.**

## 8. Most Important Truth

ArchLucid is credible enough to sell a guided, evidence-backed architecture review today, but not credible enough to let the proof chain be casual: revenue depends on making buyer-specific evidence, AI quality status, and ROI basis impossible to fake, skip, or misunderstand.

## 9. Top Improvement Opportunities

### 1. Make AI Evidence Disposition Mandatory in Sponsor Proof

- **Why it matters:** Buyers need to know whether the sponsor packet is backed by simulator fixtures, offline evals, or live Azure OpenAI.
- **Expected impact:** Prevents overclaiming and improves trust in AI outputs.
- **Affected qualities:** AI/Agent Readiness, Trustworthiness, Proof-of-ROI Readiness, Executive Value Visibility.
- **Actionability:** Fully actionable now.
- **Impact of running the prompt:** Directly improves AI/Agent Readiness (+4-6 pts), Trustworthiness (+3-5 pts), Proof-of-ROI Readiness (+2-3 pts). Weighted readiness impact: +0.5-0.8%.

```text
Implement a mandatory AI evidence disposition block in first-pilot sponsor proof outputs.

Scope:
- Update the first-pilot proof collection scripts and generated Markdown/JSON artifacts under scripts/ and docs/runbooks/FIRST_PILOT_EVIDENCE_BUNDLE.md as needed.
- Include fields for execution mode, quality gate mode, quality gate disposition, faithfulness support ratio presence/floor, real-mode evidence present/skipped, and unsupported ROI/cost claim status.
- Ensure sponsor-facing Markdown says clearly whether live Azure OpenAI evidence is present or skipped.

Acceptance criteria:
- A sponsor proof folder contains a machine-readable AI evidence disposition JSON and a concise Markdown section.
- If live Azure OpenAI evidence is skipped, the sponsor proof says not to claim live LLM quality.
- Existing simulator/offline eval evidence remains valid and labeled.
- Tests or script fixtures cover at least: live evidence present, live evidence skipped, quality gate HOLD.

Constraints:
- Do not require Azure OpenAI secrets in ordinary local or PR runs.
- Do not weaken existing PilotStrict or faithfulness gates.
- Do not change V1.1/V2 scope boundaries.
```

### 2. Turn Unsupported ROI/Cost Claims into Sponsor-Handoff HOLD

- **Why it matters:** A single unsupported cost claim can undermine the entire commercial case.
- **Expected impact:** Protects ROI credibility and reduces buyer distrust.
- **Affected qualities:** Proof-of-ROI Readiness, Correctness, Trustworthiness, Commercial Packaging Readiness.
- **Actionability:** Fully actionable now.
- **Impact of running the prompt:** Directly improves Proof-of-ROI Readiness (+5-7 pts), Correctness (+1-2 pts), Trustworthiness (+2-3 pts). Weighted readiness impact: +0.4-0.6%.

```text
Make unsupported ROI/cost claim detection block sponsor handoff.

Scope:
- Find the scripts that generate docs/quality/faithfulness-report.md, docs/quality/agent-quality-dashboard.md, and first-pilot proof outputs.
- When unsupported ROI/cost claims are detected, set sponsorPacketDisposition or equivalent proof status to HOLD unless the run is explicitly demo-only and labeled as such.
- Add remediation text pointing to the offending case/claim and the evidence expected.

Acceptance criteria:
- Existing fixture with unsupported ROI/cost claim produces a HOLD or equivalent blocking status in sponsor-handoff mode.
- Non-sponsor internal eval mode can still report WARN if that is the current behavior.
- Generated Markdown and JSON agree on the disposition.
- Tests or fixture assertions cover the blocking path.

Constraints:
- Do not remove conservative/default ROI model support.
- Do not invent missing buyer baselines.
- Do not alter pricing source-of-truth files except for links or clarification if necessary.
```

### 3. Collapse First-Pilot Status into One Command Center Contract

- **Why it matters:** The current checklist is clear but still mentally expensive.
- **Expected impact:** Faster first value and fewer operator mistakes.
- **Affected qualities:** Time-to-Value, Adoption Friction, Cognitive Load, Customer Self-Sufficiency.
- **Actionability:** Fully actionable now.
- **Impact of running the prompt:** Directly improves Adoption Friction (+4-6 pts), Time-to-Value (+3-5 pts), Cognitive Load (+5-8 pts). Weighted readiness impact: +0.6-0.9%.

```text
Make first-pilot-command-center.md the single authoritative first-pilot status artifact.

Scope:
- Review scripts that create first-pilot proof artifacts and ensure first-pilot-command-center.md links to every required proof output.
- Add a compact status model: READY, WARN, HOLD, DEFERRED, NEXT ACTION.
- Ensure the command center lists exactly one primary next action for the current state.
- Update docs/runbooks/FIRST_PILOT_OPERATOR_PATH.md and docs/onboarding/EVALUATOR_WORKBOOK.md only if needed to point readers to the command center.

Acceptance criteria:
- A proof run without RunId produces a command center with setup readiness and a clear next action.
- A proof run with RunId produces a command center with sponsor send/hold status and links to all proof artifacts.
- Missing data consistency, AI quality, procurement, or ROI evidence cannot be hidden in secondary files.

Constraints:
- Do not add a second checklist.
- Do not change V1.1 deferred scope.
- Keep wording buyer-safe and concise.
```

### 4. Add Sponsor-Safe Executive Status Block to Exports

- **Why it matters:** Executives need a short answer before details.
- **Expected impact:** Improves conversion and decision velocity.
- **Affected qualities:** Executive Value Visibility, Decision Velocity, Marketability, Proof-of-ROI Readiness.
- **Actionability:** Fully actionable now.
- **Impact of running the prompt:** Directly improves Executive Value Visibility (+4-5 pts), Decision Velocity (+3-4 pts), Marketability (+1-2 pts). Weighted readiness impact: +0.3-0.5%.

```text
Add a sponsor-safe executive status block to first-value and sponsor export artifacts.

Scope:
- Locate first-value report, sponsor packet, and quote-to-proof packet generators.
- Add a short block with: value summary, evidence basis, AI quality status, ROI basis status, procurement disposition, and recommended next commercial action.
- Reuse existing proof JSON fields; do not recompute separate business logic.

Acceptance criteria:
- Markdown/PDF/DOCX sponsor artifacts show the same status values as the proof JSON.
- If ROI is defaulted/demo-derived/not collected, the block says so plainly.
- If AI evidence is offline-only, the block says not to claim live LLM quality.

Constraints:
- Do not change pricing numbers.
- Do not claim SOC 2 CPA, third-party pen test, public reference, or Marketplace transactability.
```

### 5. Make Production-Like Config Lint a Sponsor-Handoff Gate

- **Why it matters:** A pilot can look ready while auth, telemetry, billing, or quality gates are misconfigured.
- **Expected impact:** Reduces deployment and trust failures.
- **Affected qualities:** Security, Manageability, Deployability, Trustworthiness.
- **Actionability:** Fully actionable now.
- **Impact of running the prompt:** Directly improves Security (+2-4 pts), Manageability (+4-6 pts), Deployability (+2-3 pts). Weighted readiness impact: +0.2-0.4%.

```text
Enforce production-like config lint in sponsor-handoff proof mode.

Scope:
- Find the first-pilot proof collector and config lint profile generation.
- In SponsorHandoff or production-like hosted pilot mode, treat blocking config lint findings as HOLD.
- Ensure generated proof includes both JSON/Markdown config lint artifacts and a short remediation summary.

Acceptance criteria:
- Missing required production-like auth, telemetry, quality gate, or billing safety posture yields HOLD in sponsor handoff mode.
- Non-sponsor readiness mode may report WARN where appropriate.
- Docs explain how to rerun the check.

Constraints:
- Do not print secrets or raw connection strings.
- Do not require live Stripe/Marketplace configuration for V1 sales-led pilots.
```

### 6. Expose Data Consistency Readiness in Proof Status

- **Why it matters:** Sponsor packets depend on committed manifests, artifacts, audit, and traces being internally consistent.
- **Expected impact:** Improves correctness, reliability, and supportability.
- **Affected qualities:** Data Consistency, Correctness, Reliability, Supportability.
- **Actionability:** Fully actionable now.
- **Impact of running the prompt:** Directly improves Data Consistency (+4-6 pts), Reliability (+2-4 pts), Correctness (+1-2 pts). Weighted readiness impact: +0.2-0.4%.

```text
Make data consistency readiness a first-class proof disposition.

Scope:
- Locate collect-data-consistency-readiness and first-pilot proof aggregation.
- Add a concise dataConsistencyStatus field to the proof JSON and command center.
- Treat NOT_RUN or HOLD as sponsor handoff blockers when SponsorHandoff is enabled.

Acceptance criteria:
- Proof output distinguishes PASS, WARN, HOLD, and NOT_RUN for data consistency.
- HOLD includes affected probes and remediation links.
- Sponsor-handoff mode cannot produce SEND while data consistency is NOT_RUN.

Constraints:
- Do not auto-delete or quarantine data as part of proof collection.
- Do not change database schema unless existing status output cannot represent the needed state.
```

### 7. Add Real-Mode Evidence Placeholder Guard to Marketing/Demo Copy

- **Why it matters:** Demo and marketing pages should not imply live LLM proof when the evidence rollup says skipped.
- **Expected impact:** Improves trust and procurement honesty.
- **Affected qualities:** Marketability, Trustworthiness, Executive Value Visibility.
- **Actionability:** Fully actionable now.
- **Impact of running the prompt:** Directly improves Trustworthiness (+2-3 pts), Marketability (+1-2 pts). Weighted readiness impact: +0.1-0.3%.

```text
Audit buyer-facing demo and proof copy for live-LLM claim safety.

Scope:
- Search docs/go-to-market, docs/quality, and archlucid-ui marketing/demo routes for claims that imply live LLM quality.
- Add or update copy so live Azure OpenAI quality is claimed only when a generated real-mode evidence artifact is present.
- Keep simulator/offline evidence described positively but accurately.

Acceptance criteria:
- No buyer-facing page claims live LLM quality without an evidence artifact link or caveat.
- Demo-derived outputs are labeled demo-derived or illustrative.
- Tests or snapshot checks cover at least one marketing/demo page if UI copy changes.

Constraints:
- Do not weaken the positioning statement.
- Do not reference internal assessment scores.
```

### 8. Reduce Operator UI First-Run Cognitive Load

- **Why it matters:** The UI currently serves technical operators well but can overwhelm new evaluators.
- **Expected impact:** Faster first review completion.
- **Affected qualities:** Usability, Cognitive Load, Time-to-Value, Adoption Friction.
- **Actionability:** Fully actionable now.
- **Impact of running the prompt:** Directly improves Cognitive Load (+5-7 pts), Usability (+3-4 pts), Time-to-Value (+1-2 pts). Weighted readiness impact: +0.3-0.5%.

```text
Simplify the operator Home and review detail first-run experience.

Scope:
- In archlucid-ui, identify Home first-pilot checklist and review-detail post-commit next action components.
- Ensure each state displays one primary CTA and moves optional Compare/Replay/Graph/Governance links into secondary UI.
- Preserve role-aware navigation and existing routes.

Acceptance criteria:
- New user path is: Home -> New review -> Review detail -> Finalize -> Sponsor packet.
- Review detail after commit has one primary sponsor/proof CTA.
- Existing advanced links remain discoverable but not visually dominant.
- Update component tests for the default state.

Constraints:
- Do not remove advanced Operate functionality.
- Do not change server authorization.
```

### 9. Add ROI Basis Required-Field Checks to Sponsor Exports

- **Why it matters:** ROI can drive purchase only when baselines are labeled.
- **Expected impact:** Better commercial credibility.
- **Affected qualities:** Proof-of-ROI Readiness, Executive Value Visibility, Trustworthiness.
- **Actionability:** Fully actionable now.
- **Impact of running the prompt:** Directly improves Proof-of-ROI Readiness (+4-6 pts), Trustworthiness (+1-2 pts). Weighted readiness impact: +0.2-0.4%.

```text
Require ROI basis labels in sponsor-facing exports.

Scope:
- Locate first-value report, pilot deltas, executive ROI summary, and sponsor packet generation.
- Ensure each ROI value has a basis label: buyer-provided, defaulted, demo-derived, not collected, or evidence-backed where applicable.
- Fail or HOLD sponsor export generation when projected dollars appear without a basis label.

Acceptance criteria:
- Tests cover at least one complete ROI case and one missing-label HOLD case.
- Generated Markdown explains defaulted/demo-derived values.
- Existing API response compatibility is preserved unless a new optional field is needed.

Constraints:
- Do not invent buyer baselines.
- Do not change locked pricing numbers.
```

### 10. Tighten Procurement Pack Strict Mode

- **Why it matters:** The procurement pack is useful only if buyer-unsafe stubs and hidden deferred scope cannot slip through.
- **Expected impact:** Better enterprise readiness.
- **Affected qualities:** Procurement Readiness, Compliance Readiness, Trustworthiness.
- **Actionability:** Fully actionable now.
- **Impact of running the prompt:** Directly improves Procurement Readiness (+4-6 pts), Compliance Readiness (+2-3 pts). Weighted readiness impact: +0.2-0.4%.

```text
Strengthen procurement pack strict/deal-ready checks.

Scope:
- Review scripts/build_procurement_pack.py and procurement-pack canonical configuration.
- Ensure --deal-ready fails or returns HOLD for buyer-unsafe placeholder tokens in required evidence files.
- Ensure deferred items are labeled DEFERRED_SCOPE rather than silently omitted.

Acceptance criteria:
- A fixture with a buyer-unsafe placeholder causes a blocking result under --deal-ready.
- Deferred SOC 2 CPA, third-party pen test, reference customer, and live commerce are reported as deferred/(B), not missing V1 evidence.
- Redaction report and manifest remain generated.

Constraints:
- Do not claim external attestations.
- Do not include buyer-specific legal names in committed files.
```

### 11. Add Quote Request Aging Export and Follow-Up SLA

- **Why it matters:** Sales-led packaging only works if quote requests are followed up quickly.
- **Expected impact:** Better monetization and decision velocity.
- **Affected qualities:** Decision Velocity, Commercial Packaging Readiness, Marketability.
- **Actionability:** Fully actionable now for in-product/export tracking.
- **Impact of running the prompt:** Directly improves Decision Velocity (+4-6 pts), Commercial Packaging Readiness (+2-3 pts). Weighted readiness impact: +0.1-0.3%.

```text
Add a quote-request aging export and SLA summary for sales follow-up.

Scope:
- Locate MarketingPricingQuoteRequests / quote aging API and admin UI.
- Add CSV or JSON export for open quote requests with age bucket, tier interest, source, and follow-up status when available.
- Add a small SLA summary to admin UI/docs: warn and breach counts.

Acceptance criteria:
- Admin users can download or inspect open quote aging rows.
- Documentation describes a recommended follow-up SLA.
- No PII is exposed outside AdminAuthority routes.

Constraints:
- Do not integrate with an external CRM unless already present.
- Do not auto-email buyers unless existing email paths already support it safely.
```

### 12. Harden Route/Tier/Policy/Nav Drift as Proof Evidence

- **Why it matters:** Enterprise buyers need assurance that UI promises match API authorization and packaging.
- **Expected impact:** Reduces enterprise implementation risk.
- **Affected qualities:** Policy and Governance Alignment, Usability, Security, Procurement Readiness.
- **Actionability:** Fully actionable now.
- **Impact of running the prompt:** Directly improves Policy/Governance Alignment (+2-3 pts), Usability (+1-2 pts), Security (+1-2 pts). Weighted readiness impact: +0.1-0.3%.

```text
Ensure route/tier/policy/nav parity is captured in sponsor proof.

Scope:
- Locate scripts/ci/assert_route_tier_policy_nav.py and first-pilot proof collector.
- Include the parity output in proof folders for sponsor handoff.
- If parity fails after route/nav changes, set sponsor handoff to HOLD.

Acceptance criteria:
- Proof folder includes route-tier-policy-nav-parity.md or equivalent.
- Failed parity changes sponsor disposition to HOLD.
- Docs mention the artifact in FIRST_PILOT_OPERATOR_PATH and commercial conversion checklist only if missing today.

Constraints:
- Do not change tier definitions.
- Do not hide routes instead of fixing parity.
```

### 13. Add Support Bundle Redaction Manifest

- **Why it matters:** Supportability is strong, but support bundles must prove what was redacted.
- **Expected impact:** Better security and enterprise confidence.
- **Affected qualities:** Supportability, Security, Trustworthiness.
- **Actionability:** Fully actionable now.
- **Impact of running the prompt:** Directly improves Supportability (+3-5 pts), Security (+1-2 pts). Weighted readiness impact: +0.1-0.2%.

```text
Add a redaction manifest to support bundle generation.

Scope:
- Locate CLI/API support-bundle generation.
- Add a machine-readable manifest listing included artifact names, omitted categories, redaction rules applied, and whether secrets were detected.
- Keep secret values out of the manifest.

Acceptance criteria:
- Generated support bundle includes redaction-manifest.json and a short README section.
- Tests cover at least one redacted field and one omitted secret-bearing category.
- Existing support bundle commands remain backward compatible.

Constraints:
- Do not log or persist raw secrets.
- Do not include customer prompt text unless existing support bundle policy permits it.
```

### 14. Add Production Observability Export Readiness to Proof

- **Why it matters:** Metrics exist, but operators need proof that they are exported somewhere.
- **Expected impact:** Better reliability and manageability.
- **Affected qualities:** Reliability, Manageability, Supportability, Availability.
- **Actionability:** Fully actionable now.
- **Impact of running the prompt:** Directly improves Manageability (+2-4 pts), Reliability (+1-3 pts), Supportability (+1-2 pts). Weighted readiness impact: +0.1-0.3%.

```text
Add observability export readiness to production-like proof collection.

Scope:
- Use existing report_observability_export_readiness.py or equivalent config checks.
- Include Api and Worker exporter state in sponsor/procurement proof when production-like mode is requested.
- Surface missing exporters as WARN or HOLD based on SponsorHandoff mode.

Acceptance criteria:
- Proof output states whether OTLP, Application Insights, or Prometheus export is configured for Api and Worker.
- Missing exporter in production-like SponsorHandoff mode is at least WARN, and HOLD when configured as required.
- No secrets or connection-string values are printed.

Constraints:
- Do not require an external telemetry backend in local dev.
- Do not make staging probes look like production SLA proof.
```

### 15. Add Focused Tests for High-Risk Proof Generators

- **Why it matters:** The proof chain is now as important as API behavior.
- **Expected impact:** Better correctness and maintainability.
- **Affected qualities:** Correctness, Testability, Maintainability, Proof-of-ROI Readiness.
- **Actionability:** Fully actionable now.
- **Impact of running the prompt:** Directly improves Correctness (+2-3 pts), Testability (+2-3 pts), Maintainability (+1-2 pts). Weighted readiness impact: +0.2-0.4%.

```text
Add focused deterministic tests for first-pilot proof generation.

Scope:
- Identify proof generation code for command center, go/no-go summary, commercial next step, AI quality, ROI basis, and procurement disposition.
- Add tests around JSON/Markdown consistency for at least three critical cases: SEND, HOLD due to AI/ROI, and DEFERRED_SCOPE buyer ask.

Acceptance criteria:
- Tests fail when Markdown and JSON dispositions diverge.
- Tests run without external services.
- Fixtures are small and non-sensitive.

Constraints:
- Do not chase broad coverage percentage.
- Do not use real Azure OpenAI or live network calls.
```

### 16. Add Integration Misuse Warnings for Authority vs Coordinator Paths

- **Why it matters:** API docs warn about execute/result/commit confusion; clients need stronger guardrails.
- **Expected impact:** Better correctness and time-to-value.
- **Affected qualities:** Correctness, Interoperability, Supportability.
- **Actionability:** Fully actionable now.
- **Impact of running the prompt:** Directly improves Correctness (+1-3 pts), Interoperability (+2-3 pts), Supportability (+1-2 pts). Weighted readiness impact: +0.1-0.3%.

```text
Improve client-facing guidance and diagnostics for authority pipeline versus legacy coordinator endpoints.

Scope:
- Review API_CONTRACTS.md and relevant controller ProblemDetails for execute/result/commit misuse.
- Add supportHint or documentation links when clients call execute/result on a run already completed by authority pipeline.
- Update CLI or client docs if they can surface the distinction better.

Acceptance criteria:
- Misuse returns or documents a clear next step: GET run detail before choosing endpoint.
- ProblemDetails supportHint avoids raw stack traces and includes correlation id.
- Tests cover at least one misuse path if controller behavior changes.

Constraints:
- Do not remove legacy endpoints.
- Do not change successful idempotent commit behavior.
```

### 17. Strengthen Retrieval Quality Artifact Enforcement

- **Why it matters:** Retrieval now underpins compliance, prior-manifest, and platform-doc faithfulness.
- **Expected impact:** Better AI correctness and trust.
- **Affected qualities:** AI/Agent Readiness, Correctness, Explainability.
- **Actionability:** Fully actionable now.
- **Impact of running the prompt:** Directly improves AI/Agent Readiness (+2-4 pts), Correctness (+1-2 pts), Explainability (+1-2 pts). Weighted readiness impact: +0.2-0.4%.

```text
Promote retrieval quality reports into first-pilot AI readiness proof.

Scope:
- Include faithfulness-report.md and retrieval-ir-report.md summaries in AI readiness proof.
- If retrieval IR or faithfulness reports are missing, mark AI readiness as WARN or HOLD in SponsorHandoff mode.
- Preserve distinction between retrieval correctness and output citation faithfulness.

Acceptance criteria:
- Proof output includes recall@5 / support ratio summary where artifacts exist.
- Missing artifacts are explicitly called out.
- Unsupported ROI/cost claim state is included.

Constraints:
- Do not require live Azure services for offline reports.
- Do not overstate fixture performance as buyer-corpus performance.
```

### 18. Improve SAML/OIDC Self-Test Operator Flow

- **Why it matters:** Identity setup is a major enterprise adoption friction point.
- **Expected impact:** Better self-sufficiency and enterprise adoption.
- **Affected qualities:** Adoption Friction, Security, Customer Self-Sufficiency, Manageability.
- **Actionability:** Fully actionable now.
- **Impact of running the prompt:** Directly improves Adoption Friction (+2-3 pts), Customer Self-Sufficiency (+3-4 pts), Security (+1-2 pts). Weighted readiness impact: +0.2-0.4%.

```text
Improve operator self-test flow for OIDC and SAML configuration.

Scope:
- Review admin auth diagnostics endpoints, CLI auth diagnostics, and UI identity provider settings.
- Add a concise checklist/status card that distinguishes discovery success, role claim mapping, scope claim mapping, and certificate health.
- Link to existing generic OIDC and SAML runbooks.

Acceptance criteria:
- Admin operator can see the next failing identity setup step without reading logs.
- No secret values are exposed.
- Tests cover diagnostics rendering or DTO mapping if UI changes.

Constraints:
- Do not introduce a new identity provider library.
- Do not change auth policy semantics.
```

### 19. Add Demo-to-Buyer Evidence Transition Guard

- **Why it matters:** Demo workspaces are useful but must not be mistaken for buyer proof.
- **Expected impact:** Better commercial honesty and conversion quality.
- **Affected qualities:** Marketability, Trustworthiness, Proof-of-ROI Readiness.
- **Actionability:** Fully actionable now.
- **Impact of running the prompt:** Directly improves Trustworthiness (+2-3 pts), Proof-of-ROI Readiness (+1-2 pts). Weighted readiness impact: +0.1-0.3%.

```text
Add a guard that distinguishes demo-derived proof from buyer evidence in sponsor outputs.

Scope:
- Locate demo workspace proof packets, first-value report generation, and go/no-go summary.
- Ensure demo-derived evidence sets roiSponsorSafe=false unless explicitly accepted for evaluator dry-run.
- Add text explaining what must be replaced with buyer evidence before annual conversion ask.

Acceptance criteria:
- Demo-only proof can produce a walkthrough packet but not an annual conversion-ready SEND without caveat.
- Buyer-accepted demo path is labeled accepted demo workspace, not buyer outcome.
- Tests or fixture outputs cover demo-only and buyer-evidence cases.

Constraints:
- Do not weaken demo marketing pages.
- Do not imply demos are invalid for evaluation.
```

### 20. Add Minimal Custom Agent Handler Sample

- **Why it matters:** Extensibility docs are stronger with a working sample.
- **Expected impact:** Better self-sufficiency and extensibility.
- **Affected qualities:** Extensibility, Documentation, AI/Agent Readiness.
- **Actionability:** Fully actionable now.
- **Impact of running the prompt:** Directly improves Extensibility (+3-4 pts), Documentation (+1-2 pts). Weighted readiness impact: +0.1-0.2%.

```text
Add a minimal custom agent handler sample aligned with existing extension docs.

Scope:
- Use docs/library/CUSTOM_AGENT_HANDLER_GUIDE.md and the finding-engine template as source material.
- Add a small sample handler or template fixture that compiles/tests without external services.
- Document registration, authority/safety posture, and non-goals.

Acceptance criteria:
- Sample has one class per file and focused unit tests.
- It does not require a public plugin SDK or marketplace.
- Guide links to the sample and explains what to change for a real handler.

Constraints:
- Do not add MCP dependency to core/application projects.
- Do not create new public HTTP contracts.
```

### 21. Add Performance and Capacity Snapshot to First-Pilot Proof

- **Why it matters:** Early buyers need to know whether timing and capacity were inside the V1 envelope.
- **Expected impact:** Better reliability and executive confidence.
- **Affected qualities:** Performance, Scalability, Reliability, Executive Value Visibility.
- **Actionability:** Fully actionable now.
- **Impact of running the prompt:** Directly improves Performance (+3-4 pts), Scalability (+2-3 pts), Reliability (+1-2 pts). Weighted readiness impact: +0.1-0.2%.

```text
Add a first-pilot performance and capacity snapshot artifact.

Scope:
- Use existing timing metrics, capacity envelope docs, and proof collector outputs.
- Generate a small Markdown/JSON artifact with run duration, API readiness status, queue/worker notes when available, and V1 capacity envelope comparison.

Acceptance criteria:
- Proof folder includes first-pilot-timing-budget or equivalent.
- Values are labeled observed, unavailable, or not applicable.
- The artifact does not claim contractual SLA.

Constraints:
- Do not run heavy load tests as part of normal proof collection.
- Do not treat single staging probes as production availability proof.
```

### 22. Improve Documentation Front-Door Discipline

- **Why it matters:** Documentation is rich but too easy to over-navigate.
- **Expected impact:** Lower cognitive load and support burden.
- **Affected qualities:** Documentation, Cognitive Load, Customer Self-Sufficiency.
- **Actionability:** Fully actionable now.
- **Impact of running the prompt:** Directly improves Cognitive Load (+3-5 pts), Customer Self-Sufficiency (+2-3 pts). Weighted readiness impact: +0.1-0.3%.

```text
Audit first-time evaluator documentation links for front-door discipline.

Scope:
- Review START_HERE.md, CORE_PILOT.md, FIRST_PILOT_OPERATOR_PATH.md, and EVALUATOR_WORKBOOK.md.
- Ensure they consistently say which doc is canonical and which docs are depth/recovery only.
- Remove or demote links that pull first-time evaluators into V1.1 or deep Operate scope before first commit.

Acceptance criteria:
- A first-time evaluator has one default path and one recovery path.
- V1.1 connectors/MCP/live commerce are labeled optional/deferred before first value.
- No duplicate checklist is introduced.

Constraints:
- Do not delete deep docs.
- Do not alter V1/V1.1 scope commitments.
```

### 23. DEFERRED Publish a Named Customer Reference Case Study

- **Reason it is deferred:** This requires customer permission, a real customer name/logo, legal/marketing approval, and a case-study narrative. It cannot be meaningfully completed from repo materials alone.
- **Specific information needed later:** Customer name, approved logo usage, approved quote/case-study text, allowed metrics, publication constraints, discount implications, and approver identity.
- **Affected qualities:** Marketability, Proof-of-ROI Readiness, Differentiability, Decision Velocity.
- **Expected impact:** Would improve `(B)` market-motion realism and future pricing re-rate posture, but should not affect current `(A)` headline score while explicitly deferred.

### 24. DEFERRED Execute Live Commerce / Marketplace Un-Hold

- **Reason it is deferred:** The live Stripe key flip, Marketplace publication, seller verification, payout/tax profile, and DNS cutover require owner-controlled accounts and business approvals.
- **Specific information needed later:** Live Stripe account readiness, production webhook secret, Marketplace offer state, seller verification status, payout/tax profile status, DNS ownership, and target cutover date.
- **Affected qualities:** Decision Velocity, Commercial Packaging Readiness, Adoption Friction.
- **Expected impact:** Would improve self-serve monetization and `(B)` commercial realism; not a current `(A)` deduction.

### 25. DEFERRED Run CPA SOC 2 / Third-Party Assurance Program

- **Reason it is deferred:** External attestation and third-party testing require budget, vendor selection, legal review, and evidence collection outside repository-only work.
- **Specific information needed later:** Auditor/assessor choice, budget, target control period, evidence owner, NDA distribution model, and committed customer requirement or ARR trigger.
- **Affected qualities:** Procurement Readiness, Compliance Readiness, Trustworthiness.
- **Expected impact:** Would materially improve enterprise procurement realism under `(B)`; not included in current `(A)` scoring.

## 10. Prompt Batching Guidance

- **Batch A - Sponsor proof safety:** Improvements 1, 2, 4, 6, 9, 17, and 19. These all touch proof disposition, AI/ROI evidence, and sponsor packet safety; batching reduces repeated context over the same scripts and generated artifacts.
- **Batch B - First-pilot usability:** Improvements 3, 8, 21, and 22. These focus on reducing first-session cognitive load across UI and docs.
- **Batch C - Enterprise proof and operations:** Improvements 5, 10, 12, 13, 14, and 18. These share config, procurement, identity, support, and operational readiness context.
- **Batch D - Engineering correctness hardening:** Improvements 15, 16, and 20. These are focused implementation/test tasks that can be done without broad GTM context.
- **Batch E - Commercial follow-up:** Improvement 11 can run alone or after Batch A, because it is mostly admin/sales workflow.
- **Deferred batch:** Improvements 23, 24, and 25 require owner/customer/vendor input and should not be started as Cursor implementation prompts until that input exists.

## 11. Pending Questions for Later

### DEFERRED Publish a Named Customer Reference Case Study

- Which customer has approved public use of name, logo, and case-study text?
- Which ROI or cycle-time metrics may be published?
- Who signs off on the final case study and discount implications?

### DEFERRED Execute Live Commerce / Marketplace Un-Hold

- Is the Stripe production account fully ready, including webhook secret rotation?
- Is the Azure Marketplace SaaS offer ready to publish?
- Who owns DNS cutover for `signup.archlucid.net`?
- What date, if any, is the owner targeting for live transactability?

### DEFERRED Run CPA SOC 2 / Third-Party Assurance Program

- Which trigger has been met: ARR threshold, binding customer requirement, or owner decision?
- Which CPA firm or penetration-test vendor is selected?
- What evidence window and report distribution model should be used?

## 12. Implementation Update and Rescore

### Completed in this pass

- **Improvement 13 - Add Support Bundle Redaction Manifest:** implemented. CLI support bundles now emit `redaction-manifest.json`, `manifest.json` records `redactionManifestPath`, `README.txt` points reviewers to the manifest, and `docs/library/CLI_USAGE.md` plus `docs/runbooks/TROUBLESHOOTING.md` include the external-sharing check. Scoped verification passed: `dotnet test ArchLucid.Cli.Tests/ArchLucid.Cli.Tests.csproj --no-restore` with 379 passed, 0 failed.
- **Improvement 18 - Improve SAML/OIDC Self-Test Operator Flow:** implemented in the operator identity settings surface. The page now fetches existing `GET /v1/admin/auth/configuration-diagnostics` output and renders one checklist for auth mode, discovery, audience/scope, role claim mapping, and SAML certificate health with a single next setup step. UI changes were not shell-verified in this pass because the turn already used its one allowed shell command.

### Verified already present before additional edits

- **Improvements 1, 3, 5, 6, 12, 14, 17, 20, and 21** have substantial existing implementation in the current repo: `ai-readiness-gate.*`, `first-pilot-command-center.*`, production-like config lint, data consistency proof, route/tier/policy/nav proof, observability export readiness, retrieval IR proof, custom handler sample/tests, and timing/scale proof are already wired into the proof or documentation surface.
- These existing capabilities remain scored conservatively because the assessment is buyer-outcome oriented: a gate existing in scripts is not the same as repeated live sponsor proof from real customer runs.

### Still open / not completed in this pass

- **Improvement 8:** operator UI first-run simplification still needs UI component changes and tests.
- **Improvement 11:** quote aging export/SLA needs admin/API/export review.
- **Improvement 15:** additional proof-generator tests would further harden the proof chain.
- **Improvement 16:** authority/coordinator misuse diagnostics need controller/API doc review.
- **Improvement 18:** follow-up polish can still add deeper IdP-specific copy, but the core setup checklist is now present.
- **Improvements 23-25:** remain deferred because they require customer, owner, vendor, legal, or account input.

