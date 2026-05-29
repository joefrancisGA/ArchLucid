# ArchLucid Assessment – (A) Headline Readiness: 80.32%

This score represents the `(A)` headline readiness per `Assessment-Scope-V1_1.mdc`, excluding explicitly deferred V1.1, V1.x, V2, owner-only commercial actions, and `(B)` procurement/market-motion realism.

This assessment reflects the repository after implementing improvement opportunities **1–25** (proof pipeline rollups, gates, tests, and operator routing). Formula: `sum(score * weight) / sum(weight) = 9558 / 11900 = 80.32%`. Weighted impact on readiness is `score * weight / 119`. Weighted deficiency signal is `(100 - score) * weight`.

## 2. Executive Summary

### (A) Overall Headline Readiness

ArchLucid is a real V1-shaped product, not a prototype: API, SQL persistence, operator UI, CLI, evidence ingest, governance, audit, proof packages, tests, Terraform, trust materials, and release drills are all present. After the improvement pass, first-pilot proof collection emits consolidated AI readiness, retrieval quality, commercial next-step, procurement deal-ready, idempotency posture, Terraform validation matrix, and cost-envelope artifacts — but frictionless enterprise buying still depends on guided execution and `(B)` assurance items remain deferred.

### (B) Procurement / Market-Motion Realism

The procurement picture is weaker than the headline product score, but it is not charged into `(A)`. SOC 2 CPA attestation, external pen-test publication, public reference customers, live marketplace commerce, and several first-party connectors are explicitly deferred or informational. Real enterprise buyers will still ask for them, so ArchLucid is most credible today for guided, founder-led, or security-tolerant pilots rather than frictionless strict-procurement buying.

### Commercial Picture

The commercial thesis is strong: manual architecture review is slow, expensive, and hard to defend; ArchLucid turns that process into an evidence-linked review package with ROI and sponsor artifacts. The gap is conversion reliability. Pricing, quote paths, pilot scorecards, and ROI copy exist, but the buyer still needs a clearer path from first proof to paid next action.

### Enterprise Picture

The enterprise foundation is substantive: tenant isolation, OIDC/SAML/API-key auth, SCIM, audit trails, governance workflows, policy packs, data-consistency checks, trust center, DPA/SIG/CAIQ-style material, and Azure-native deployment docs. The main blocker is confidence assembly: buyers and operators must still connect many artifacts to understand what is ready, what is deferred, and what evidence proves a specific environment.

### Engineering Picture

The engineering system is ambitious and generally coherent, with modular .NET projects, Dapper/DbUp discipline, OpenAPI snapshot controls, live UI/API E2E gates, quality gates, RAG grounding work, observability, and Terraform. The biggest engineering risk is broad-surface correctness drift across AI outputs, route contracts, authority gates, packaging, docs, and deployment profiles.

## 3. Weighted Quality Assessment

| Urgency | Quality | Score | Weight | Weighted impact | Deficiency signal | Justification | Tradeoffs | Improvement recommendations | Fixability |
|---:|---|---:|---:|---:|---:|---|---|---|---|
| 1 | Cutting-Edge AI Technology | 81 | 8 | 5.45% | 152 | Strong AI substrate: Azure OpenAI real/simulator modes, structured output validation, optional JSON schema responses, RAG, embedding drift guards, faithfulness checks, judges, redaction, budgets, and telemetry. Not yet excellent because several mechanisms are optional, warn-only, or manually interpreted. | Enterprise determinism limits flashy agent autonomy, which is the right V1 tradeoff. | Promote real-mode quality and retrieval/citation evidence into release and sponsor-handoff gates. | V1 for quality evidence; deeper agentic RAG is V2. |
| 2 | Correctness | 82 | 8 | 5.51% | 144 | OpenAPI snapshots, SQL integration, live UI/API E2E, schema validation, data probes, and contract docs exist. The risk is correctness of AI-mediated findings, cost/ROI narratives, and sponsor artifacts. | Many focused checks are better than one brittle mega-test, but assurance is harder to audit. | Backfill tests on cost, decisioning, sponsor packets, authority/coordinator semantics, and faithfulness. | V1. |
| 3 | AI/Agent Readiness | 84 | 8 | 5.65% | 128 | Explicit execution modes, schema validation, quality gates, budget windows, traces, real/simulator labeling, PilotStrict production posture, and AI readiness artifacts are strong. The gap is operational inevitability. | Blocking weak output may slow demos but protects trust. | Make sponsor handoff fail closed on missing/low-quality AI evidence and attach model/prompt provenance. | V1. |
| 4 | Adoption Friction | 78 | 6 | 3.93% | 132 | The first-pilot path is documented and instrumented, but setup still spans SQL, auth, evidence ingest, LLM mode, proof collection, data consistency, and procurement readiness. | Defensible evidence requires explicit setup; hiding it would create false confidence. | Compress the operator journey into one dominant command and one UI next action. | V1. |
| 5 | Stickiness | 78 | 6 | 3.93% | 132 | Committed manifests, comparison, replay, graph, policy packs, audit, learning, ROI summaries, and governance create repeat-use potential. Post-pilot habit loops are less strong than first-review proof. | Narrow Pilot improves first value but postpones recurring-use proof. | Strengthen post-commit next actions, recurring review workflows, and quote-to-proof follow-up. | V1; connectors V1.1. |
| 6 | Marketability | 84 | 8 | 5.65% | 128 | Positioning is clear: "Defensible architecture, on demand" and "Architecture Proof Engine" are sharper than generic AI copy. Risk is breadth confusing buyers. | Proof/governance differentiation can sound heavy for quick-AI buyers. | Keep marketing centered on one buyer outcome: an evidence-backed architecture review package. | V1. |
| 7 | Time-to-Value | 82 | 7 | 4.82% | 126 | Core Pilot is intentionally narrow: create, execute, commit, open package. Setup, auth, evidence, and proof collection still slow first value. | Defensible evidence takes longer than synthetic demo output. | Improve one-sitting path and default readiness checks before real-mode sessions. | V1. |
| 8 | Proof-of-ROI Readiness | 80 | 5 | 3.36% | 100 | ROI docs, first-value reports, deltas, baseline fields, labels, pricing rationale, and executive summaries exist. Stronger ROI depends on buyer baselines or conservative defaults. | Conservative ROI is less exciting but more trustworthy. | Tighten baseline capture, evidence confidence labels, and projected-dollar gating. | V1. |
| 9 | Workflow Embeddedness | 73 | 3 | 1.84% | 81 | REST, CLI, UI, SCIM, Azure DevOps/GitHub handoff, and OpenAPI exist. V1.1 first-party connectors are not penalized, but V1 workflow embedding remains adjacent rather than native. | REST/CLI-first avoids overbuilding connectors too early. | Improve V1 handoff artifacts and API/CLI recipes. | V1 for handoff; V1.1 for connectors. |
| 10 | Usability | 76 | 3 | 1.92% | 72 | Progressive disclosure, layer guidance, role-aware shaping, and first-pilot rails exist. Usability is burdened by legacy run/review language and many optional surfaces. | Hiding too much would reduce operator trust. | Collapse duplicate paths and keep "architecture review" dominant in buyer-facing UI. | V1. |
| 11 | Executive Value Visibility | 82 | 4 | 2.76% | 72 | Sponsor reports, first-value Markdown/PDF, ROI summary, demo preview, explanations, and dashboards exist. Value still appears as many artifacts, not always one undeniable story. | Detailed evidence can dilute executive focus. | Make sponsor page one show outcome, evidence basis, ROI confidence, blockers, and next action. | V1. |
| 12 | Differentiability | 83 | 4 | 2.79% | 68 | Strong blend of AI analysis, governance, audit, evidence chains, policy packs, provenance, and sponsor artifacts. Category education remains hard. | New category can command value but requires demo proof. | Public demo should show evidence chain, not just generated prose. | V1. |
| 13 | Trustworthiness | 78 | 3 | 1.97% | 66 | Traceability, audit, quality gates, redaction, tenant isolation, and conservative scope docs support trust. AI uncertainty and self-assessed assurance limit score. | Honest labels may reduce sales gloss but improve real trust. | Consistent evidence-basis labels and fail-closed low-support sponsor packets. | V1; assurance is `(B)`/deferred. |
| 14 | Security | 80 | 3 | 2.02% | 60 | Strong controls: policy auth, JWT/OIDC, SAML SP docs, SCIM, SQL tenant isolation/RLS, Key Vault, private endpoints, WAF options, ZAP/Schemathesis, redaction, and production config validation. | Azure-private posture raises setup friction. | Backfill tenant-boundary/auth tests and support-bundle redaction checks. | V1; external assurance deferred. |
| 15 | Decision Velocity | 78 | 2 | 1.31% | 44 | Pricing, quote request, order form, scorecard, and sponsor briefs exist. Proof-to-paid action remains too manual. | Sales-led V1 avoids premature self-serve commerce but slows conversion. | Add quote-to-proof next-action artifacts. | V1; live commerce owner/V1.1. |
| 16 | Maintainability | 72 | 2 | 1.21% | 56 | Modular design and docs are strong, but the surface is very wide and invariant conformance is mixed. Coverage hotspots remain. | Many seams are modular but must be policed. | Promote invariant enforcement, drift guards, and hotspot tests. | V1. |
| 17 | Architectural Integrity | 82 | 3 | 2.07% | 54 | Containers, components, boundaries, ADRs, and scope docs are coherent. Legacy coordinator/run terms and dual persistence namespaces add complexity. | Compatibility preserves users but increases cognitive load. | Enforce high-risk invariants while simplifying docs. | V1. |
| 18 | Procurement Readiness | 74 | 2 | 1.24% | 52 | Procurement pack, trust center, DPA, CAIQ/SIG, SOC roadmap, subprocessors, and security reviewer material exist. Strict procurement will still push on deferred assurance and references. | Honest posture may lose rigid RFPs. | Single deal-ready index with blocker/deferred/informational classification. | V1 for clarity; owner/external for assurance. |
| 19 | Reliability | 80 | 2 | 1.34% | 40 | Health/readiness, outbox patterns, retries, data probes, chaos tests, k6 smoke, failover docs, and alerts exist. Broad idempotency and audit semantics need more enforcement. | Single-region V1 is cost-effective and in scope. | Enforce mutating-route idempotency classification and staging evidence capture. | V1. |
| 20 | Compliance Readiness | 76 | 2 | 1.28% | 48 | SOC self-assessment, roadmap, CAIQ/SIG, DPA, incident policy, DSAR, VPAT draft, audit matrix, and control mappings exist. Process maturity is partial. | Code-backed controls are stronger than operating evidence. | Tie every procurement claim to a current evidence artifact. | V1 for evidence; CPA deferred. |
| 21 | Interoperability | 76 | 2 | 1.28% | 48 | REST, CLI, OpenAPI, AsyncAPI, SCIM, Azure DevOps/GitHub handoff, Azure extractor ZIP, and auth config exist. Native enterprise systems integration is later. | REST/CLI-first is safer than premature connectors. | Improve recipes, handoff attachments, and client contract checks. | V1; connectors V1.1. |
| 22 | Traceability | 86 | 3 | 2.17% | 42 | Core strength: manifests, decision traces, evidence refs, provenance graph, audit events, trace IDs, correlation IDs, and evidence chains. | Rich traceability increases artifact volume. | Ensure top findings always show input-to-finding-to-manifest-to-artifact chain. | V1. |
| 23 | Data Consistency | 79 | 2 | 1.33% | 42 | Probes, orphan detection, quarantine concepts, health checks, migrations, and proof rollups exist. The risk is still running and interpreting collectors correctly. | Detection-first avoids dangerous auto-remediation. | Improve dry-run remediation evidence and block sponsor handoff on integrity HOLD. | V1. |
| 24 | Policy and Governance Alignment | 82 | 2 | 1.38% | 36 | Governance workflows, segregation of duties, pre-commit gates, packs, resolution, dashboards, and role shaping are mature. Drift between policy/tier/nav/docs remains possible. | Governance depth can overwhelm first-pilot users. | Keep governance optional before first value and maintain route/tier/policy/nav checks. | V1. |
| 25 | Azure Compatibility and SaaS Deployment Readiness | 82 | 2 | 1.38% | 36 | Azure-native architecture, Terraform roots, Container Apps/App Service, SQL, Key Vault, Blob, Front Door/WAF, private endpoints, AOAI, and monitoring docs are strong. | Azure-first narrows fit for non-Azure estates until V1.1 multi-cloud analysis. | Standardize production-like Azure pilot proof. | V1. |
| 26 | Auditability | 84 | 2 | 1.41% | 32 | Append-only audit, typed events, CSV export, SIEM docs, correlation IDs, and coverage matrix are strong. Audit failure semantics need clearer classification. | Best-effort async audit is practical but must be labeled. | Classify transactional vs informational audit paths and test high-value transactional flows. | V1. |
| 27 | Explainability | 84 | 2 | 1.41% | 32 | Explanations, provenance, aggregate summaries, citation chips, evidence labels, fallback, and trace metrics are strong. Not every surface is equally simple. | Rich explanations can become too technical for sponsors. | Add a concise "why trust this?" block to sponsor artifacts. | V1. |
| 28 | Cognitive Load | 74 | 1 | 0.62% | 26 | Weak raw score. The repo has many docs, paths, legacy terms, proof scripts, and status vocabularies. | Enterprise precision creates mental overhead. | Collapse entry points and move next actions into product/proof outputs. | V1. |
| 29 | Customer Self-Sufficiency | 70 | 1 | 0.59% | 30 | Quickstarts, operator paths, troubleshooting, support bundles, diagnostics, and demos exist. Real buyers still likely need guided production-like setup. | Guided pilots are reasonable for V1 but limit PLG. | Focus self-sufficiency on the Core Pilot path with clear escalation thresholds. | V1. |
| 30 | Availability | 72 | 1 | 0.61% | 28 | SLO targets, health checks, staging probes, failover docs, and alerts exist. Production availability evidence is environment-dependent. | Multi-region active/active is out of scope, appropriately. | Capture hosted probe summaries and distinguish target from measured availability. | V1 for evidence; multi-region deferred. |
| 31 | Scalability | 72 | 1 | 0.61% | 28 | Optional Redis/cache, worker roles, outboxes, read replicas, budgets, k6 smoke, and capacity docs exist. Large-fleet behavior is not deeply proven. | Avoiding mandatory Redis keeps V1 lean. | Document measured scale envelopes and unsupported assumptions. | V1 for evidence; deeper scale later. |
| 32 | Performance | 73 | 1 | 0.61% | 27 | k6 smoke, performance docs, query allowlists, and dashboards exist. LLM latency and deployment variability remain. | Quality and traceability add latency but are core value. | Attach timing budgets to pilot proof. | V1. |
| 33 | Extensibility | 74 | 1 | 0.62% | 26 | Custom agent handler docs and modular components support advanced extension. Public SDK/MCP/marketplace are out of V1 `(A)`. | In-repo extension is safer before public ecosystem work. | Add tested sample custom handler path and conservative claims. | V1 for docs/sample; SDK later. |
| 34 | Testability | 75 | 1 | 0.63% | 25 | Test tiers, SQL integration, live UI/API E2E, coverage gates, chaos, security scans, and snapshots are strong. Coverage remains uneven. | Full regression is expensive but necessary. | Backfill behavior tests on correctness-critical hotspots. | V1. |
| 35 | Deployability | 77 | 1 | 0.65% | 23 | Docker, compose, Terraform, package scripts, smoke scripts, and health endpoints exist. Real readiness depends on environment variables, secrets, identity, registry, and root selection. | Terraform flexibility increases setup decisions. | Add minimal pilot deployment preflight matrix. | V1. |
| 36 | Manageability | 78 | 1 | 0.66% | 22 | Config catalog, admin summaries/lint, diagnostics, runbooks, feature flags, and tier/role shaping exist. There are many knobs. | Configurability supports enterprise pilots but can weaken confidence. | Use profile-based config lint for production-like handoff. | V1. |
| 37 | Cost-Effectiveness | 82 | 1 | 0.69% | 18 | LLM budgets, cost estimates, AOAI spend bands, pricing rationale, Azure budgets, and optional caches exist. Real LLM variability remains. | Trustworthy checks and trace storage cost more. | Attach LLM spend envelope evidence to first-pilot proof. | V1. |
| 38 | Template and Accelerator Richness | 84 | 1 | 0.71% | 16 | Azure SaaS, AI governance, healthcare claims, policy packs, and walkthroughs exist. Repeatability proof matters more than more templates. | Too many accelerators can distract from Core Pilot. | Add accelerator acceptance checks. | V1. |
| 39 | Documentation | 83 | 1 | 0.70% | 17 | Docs are extensive, candid, and cover architecture, scope, deferrals, trust, deployment, tests, pilot paths, and operations. Volume is the issue. | Thorough docs help experts but slow beginners. | Keep `START_HERE`, `V1_SCOPE`, and `FIRST_PILOT_OPERATOR_PATH` as the routing spine. | V1. |
| 40 | Supportability | 85 | 1 | 0.71% | 15 | Health/version, support bundle, correlation IDs, diagnostics, config lint, traces, runbooks, and troubleshooting are strong. Redaction/completeness still matter. | Rich bundles can expose sensitive context if redaction slips. | Strengthen support-bundle redaction and completeness tests. | V1. |

## 4. Top 12 Most Important Weaknesses

1. AI correctness evidence is not yet unavoidable enough for every real-mode sponsor handoff.
2. The first-pilot path still requires too many configuration, evidence, and proof-collection decisions.
3. Weighted engineering risk is concentrated in correctness, AI readiness, and AI technology.
4. Buyer proof is spread across many artifacts instead of one dominant, self-explanatory proof package.
5. ROI credibility depends on buyer baselines and careful estimate-vs-measured labeling.
6. Route, tier, policy, navigation, and documentation drift remain persistent risks.
7. Coverage is uneven in correctness-critical areas despite strong CI structure.
8. Procurement materials are strong but still require guided interpretation.
9. Workflow embedding is usable through REST/CLI/UI but not native enough inside common enterprise systems.
10. Production-like deployment confidence depends on environment-specific collectors.
11. Cognitive load is high for new operators.
12. Scale, availability, and performance evidence are credible as targets and smoke tests, but not mature production-history proof.

## 5. Top 6 Monetization Blockers

1. Proof-to-paid next action is still too manual and sales-led.
2. ROI proof can look illustrative unless baselines and evidence-basis labels are captured cleanly.
3. Strict buyers will ask for SOC 2, third-party pen test, public references, and live marketplace commerce even though they are outside `(A)`.
4. The strongest commercial story still depends on guided first-pilot execution.
5. Pricing and packaging are thoughtful, but quote-to-cash needs operational follow-through.
6. Differentiation is strong only when the demo shows evidence chains; generic AI architecture review language is not enough.

## 6. Top 6 Enterprise Adoption Blockers

1. Buyers must assemble confidence across trust center, SOC self-assessment, DPA, runbooks, proof bundles, and scope docs.
2. Production-like setup requires disciplined auth, SQL, telemetry, secrets, and proof collection.
3. First-party enterprise connectors are V1.1, so V1 adoption relies on REST/CLI/UI and manual handoff.
4. Assurance is self-assessed for V1; strict procurement may require third-party artifacts later.
5. Role/tier/navigation complexity can confuse operators unless shell and docs stay aligned.
6. Availability and DR posture are target/runbook-driven, not backed by long production operating history.

## 7. Top 6 Engineering Risks

1. AI output quality or faithfulness can regress unless release gates move beyond warn-only artifacts.
2. Broad surface drift can break consistency between API contracts, UI types, nav, pricing tiers, docs, and proof scripts.
3. Low-coverage hotspots in host, decisioning, notifications, application, and cost paths may hide edge-case failures.
4. Mutating route idempotency and audit transactionality are not uniformly enforced as architecture invariants.
5. Environment-specific deployment failures can pass repo-local checks unless staging evidence is captured.
6. Retrieval and explanation quality depend on correct corpus indexing, embedding model identity, and citation coverage.

## 8. Most Important Truth

ArchLucid is credible for a guided, evidence-backed V1 pilot today with automated proof rollups and fail-closed sponsor gates; the next leap is closing the idempotency posture backlog, maturing `(B)` assurance, and reducing remaining operator assembly for strict-procurement buyers.

## 9. Top Improvement Opportunities

> **Status (2026-05-29):** Items **1–25** are **COMPLETED** in the repository (see `scripts/collect-first-pilot-proof.ps1`, related CI reports, and tests). Items **26–28** remain **DEFERRED** (owner/external). Headline `(A)` rescore above reflects shipped automation and evidence gates.

### COMPLETED: 1. Make Real-Mode AI Quality Evidence a Sponsor-Handoff Gate

Why it matters: The highest-weight risk is whether AI-generated recommendations are trustworthy enough for buyer use.

Expected impact: Fewer sponsor packets with weak or missing AI evidence.

Affected qualities: Correctness, AI/Agent Readiness, Cutting-Edge AI Technology, Trustworthiness.

Status: Fully actionable now.

Cursor prompt:

```text
Implement a V1 sponsor-handoff gate that fails closed when real-mode AI quality evidence is missing or below configured PilotStrict thresholds.

Start from docs/library/AGENT_OUTPUT_EVALUATION.md, scripts/collect-first-pilot-proof.ps1, ArchLucid.Cli pilot proof handling, and existing AI readiness artifacts.

Scope:
- Classify missing quality-gate mode, missing execution-mode label, missing faithfulness floor, missing citation/grounding evidence, or rejected PilotStrict output as HOLD/BLOCK for sponsor handoff.
- Preserve simulator/demo behavior, but label it as simulator/demo-derived rather than sponsor-ready real-mode evidence.
- Update generated Markdown/JSON proof artifacts and tests.

Acceptance criteria:
- Real-mode sponsor handoff cannot show READY when required AI quality evidence is absent.
- Deferred V1.1/V2 items are DEFERRED_SCOPE, not BLOCK.
- Each HOLD row has one remediation action.

Constraints:
- Do not require Azure OpenAI credentials in unit tests.
- Do not weaken PilotStrict startup validation.
```

Impact of running the prompt: Directly improves Correctness (+4-6 pts), AI/Agent Readiness (+4-6 pts), Trustworthiness (+2-4 pts). Weighted readiness impact: +0.6-0.9%.

### COMPLETED: 2. Promote Retrieval and Citation Evaluation into Release Evidence

Why it matters: RAG quality must be measured, not assumed.

Expected impact: Better faithfulness proof and fewer unsupported recommendation narratives.

Affected qualities: Cutting-Edge AI Technology, AI/Agent Readiness, Correctness, Explainability.

Status: Fully actionable now.

Cursor prompt:

```text
Promote V1 retrieval/citation quality checks into standard release and first-pilot proof evidence.

Use docs/library/RAG_QUALITY_TECHNICAL_BACKLOG.md, docs/library/AGENT_OUTPUT_EVALUATION.md, tests/eval-corpus, scripts/ci/eval_retrieval_ir.py, scripts/ci/eval_agent_faithfulness.py, and scripts/collect-first-pilot-proof.ps1.

Scope:
- Add a combined retrieval-quality Markdown/JSON artifact to proof collection.
- Include available IR metrics, citation coverage, and faithfulness summary.
- Classify missing evaluator output as WARN for simulator/internal builds and HOLD for sponsor handoff when retrieval-backed claims are present.

Acceptance criteria:
- Proof output clearly says whether retrieval quality was evaluated, skipped, or failed.
- Sponsor handoff cannot silently omit retrieval quality when explanation/citation claims are in the packet.

Constraints:
- Keep deterministic decisioning unchanged.
- Do not add agentic retrieval or new vector-store dependencies.
```

Impact of running the prompt: Directly improves Cutting-Edge AI Technology (+3-5 pts), AI/Agent Readiness (+3-5 pts), Explainability (+2-3 pts). Weighted readiness impact: +0.5-0.8%.

### COMPLETED: 3. Compress First-Pilot Execution into One Dominant Command Path

Why it matters: Adoption friction and time-to-value are high-weight factors.

Expected impact: New operators reach credible first value faster.

Affected qualities: Time-to-Value, Adoption Friction, Customer Self-Sufficiency, Cognitive Load, Usability.

Status: Fully actionable now.

Cursor prompt:

```text
Create a one-command first-pilot operator path that wraps preflight, readiness-only proof, optional run-specific proof, and next-action output.

Start from ArchLucid.Cli, scripts/collect-first-pilot-proof.ps1, docs/runbooks/FIRST_PILOT_OPERATOR_PATH.md, and docs/CORE_PILOT.md.

Scope:
- Enhance `archlucid pilot proof` or add a clear equivalent for readiness-only and run-specific modes.
- Emit exactly one primary next action based on READY/WARN/HOLD.
- Keep PowerShell script compatibility through a wrapper or delegation.
- Update docs so FIRST_PILOT_OPERATOR_PATH is the operational entry point.

Acceptance criteria:
- A new operator can follow one command plus one generated next action.
- Existing proof artifact names remain stable or documented.

Constraints:
- Do not remove existing scripts without compatibility wrappers.
- Do not require live Azure resources for tests.
```

Impact of running the prompt: Directly improves Time-to-Value (+4-6 pts), Adoption Friction (+5-7 pts), Cognitive Load (+5-8 pts). Weighted readiness impact: +0.5-0.8%.

### COMPLETED: 4. Make the Sponsor Packet First Page Unmissable

Why it matters: Sponsors need one page that says what happened, whether to trust it, what value appeared, and what to do next.

Expected impact: Higher executive clarity and faster commercial follow-up.

Affected qualities: Executive Value Visibility, Marketability, Proof-of-ROI Readiness, Decision Velocity.

Status: Fully actionable now.

Cursor prompt:

```text
Strengthen the first page of sponsor-facing artifacts so it always carries complete send/no-send posture.

Start from ArchLucid.Application/Pilots/FirstValueReportBuilder.cs, FirstValueReportPdfBuilder.cs, sponsor packet builders, docs/library/PILOT_ROI_MODEL.md, and review detail sponsor components.

Scope:
- Include review identity, run id, manifest id, evidence source, AI quality disposition, ROI evidence confidence, top findings, deferred buyer requirements, and next action.
- Use shared evidence-basis labels: Evidence-backed, Estimate, Low support, Demo-derived, Manual review required, Deferred scope.
- Add tests for label and blocked/allowed states.

Acceptance criteria:
- A sponsor can read page one without opening docs and understand whether the packet is ready.
- Demo-derived numbers cannot look like customer-measured ROI.

Constraints:
- Do not invent measured ROI when baselines are missing.
- Do not penalize explicitly deferred V1.1/V2 items.
```

Impact of running the prompt: Directly improves Executive Value Visibility (+4-6 pts), Proof-of-ROI Readiness (+4-6 pts), Decision Velocity (+3-5 pts). Weighted readiness impact: +0.4-0.7%.

### COMPLETED: 5. Backfill Correctness Tests on Cost, Decisioning, and Sponsor Output Hotspots

Why it matters: Correctness is high weight and buyer-visible output paths need more targeted protection.

Expected impact: Fewer silent regressions in important outputs.

Affected qualities: Correctness, Testability, Proof-of-ROI Readiness, Maintainability.

Status: Fully actionable now.

Cursor prompt:

```text
Add targeted tests for correctness-critical low-coverage areas rather than broad cosmetic coverage.

Use docs/library/COVERAGE_GAP_ANALYSIS.md to pick a small set around ArchLucid.Capabilities.Cost, ArchLucid.Decisioning, sponsor report builders, and run/manifest decision flows.

Scope:
- Add unit tests for CostConstraintFindingEngine and cost evidence/citation behavior.
- Add decisioning tests for malformed agent results, deterministic merge ordering, and missing evidence handling.
- Add sponsor report tests for ROI confidence labels, demo warnings, and top finding evidence chains.

Acceptance criteria:
- New tests fail against at least one plausible incorrect behavior.
- No external services are required.

Constraints:
- Do not chase 100% coverage mechanically.
- Do not alter production logic unless fixing a focused bug.
```

Impact of running the prompt: Directly improves Correctness (+3-5 pts), Testability (+3-5 pts), Maintainability (+2-3 pts). Weighted readiness impact: +0.3-0.6%.

### COMPLETED: 6. Add a Quote-to-Proof Commercial Follow-Up Index

Why it matters: Monetization depends on turning proof into a paid next action.

Expected impact: Stronger decision velocity and less founder narration.

Affected qualities: Decision Velocity, Commercial Packaging Readiness, Proof-of-ROI Readiness, Marketability.

Status: Fully actionable now.

Cursor prompt:

```text
Add a quote-to-proof index artifact that links a successful pilot proof package to the recommended commercial next step.

Start from docs/go-to-market/PRICING_PHILOSOPHY.md, ORDER_FORM_TEMPLATE.md, COMMERCIAL_CONVERSION_CHECKLIST.md, ArchLucid.Cli proof outputs, and operator UI sponsor components.

Scope:
- Generate Markdown/JSON with current tier fit, ROI evidence confidence, proof status, recommended next commercial action, and quote/order-form links.
- Keep live Stripe/Marketplace un-hold explicitly deferred when not configured.
- Add tests for tier recommendation labels and fallback copy.

Acceptance criteria:
- A successful proof packet has a clear commercial next action without implying live self-serve commerce.
- Missing buyer inputs are marked as open questions, not guessed.

Constraints:
- Do not add pricing numbers outside the pricing source of truth.
- Do not enable live checkout.
```

Impact of running the prompt: Directly improves Decision Velocity (+5-8 pts), Commercial Packaging Readiness (+4-6 pts), Marketability (+1-2 pts). Weighted readiness impact: +0.2-0.4%.

### COMPLETED: 7. Make Procurement Deal-Ready Output the Buyer-Safe Single Index

Why it matters: Enterprise buyers need one view of blockers, deferred scope, and informational procurement gaps.

Expected impact: Less confusion and fewer false blockers.

Affected qualities: Procurement Readiness, Compliance Readiness, Trustworthiness, Adoption Friction.

Status: Fully actionable now.

Cursor prompt:

```text
Strengthen procurement deal-ready output as the single buyer-safe index of V1-ready, blocking, deferred, owner-required, and informational-only items.

Start from docs/runbooks/PROCUREMENT_DEAL_READY.md, scripts/build_procurement_pack.py, ArchLucid.Cli procurement/proof commands, docs/go-to-market/TRUST_CENTER.md, docs/security/SOC2_SELF_ASSESSMENT_2026.md, and docs/library/V1_DEFERRED.md.

Scope:
- Ensure each row has one disposition: V1_READY, BLOCKING, DEFERRED_SCOPE, OWNER_REQUIRED, or INFORMATIONAL_B_ONLY.
- Include evidence path, freshness status, buyer-safe summary, and owner action when applicable.
- Test SOC 2 CPA, third-party pen test, live commerce, V1.1 connectors, DPA, CAIQ/SIG, and PGP/security-contact rows.

Acceptance criteria:
- Deferred and `(B)` items are not mixed with V1 blockers.
- Missing required V1 evidence fails clearly.

Constraints:
- Do not claim CPA SOC 2, ISO 27001, third-party pen test, or public reference status.
```

Impact of running the prompt: Directly improves Procurement Readiness (+5-7 pts), Compliance Readiness (+3-5 pts), Trustworthiness (+2-3 pts). Weighted readiness impact: +0.2-0.4%.

### COMPLETED: 8. Promote Route/Tier/Policy/Nav Drift Checks

Why it matters: Broad enterprise surfaces can drift between API authorization, tier gating, UI navigation, and docs.

Expected impact: Fewer enterprise trust and usability regressions.

Affected qualities: Maintainability, Architectural Integrity, Policy and Governance Alignment, Usability.

Status: Fully actionable now.

Cursor prompt:

```text
Promote route/tier/policy/navigation drift detection into a required verification path and proof artifact.

Start from docs/library/PRODUCT_PACKAGING.md, ROUTE_TIER_POLICY_NAV_MATRIX.md, archlucid-ui nav tests, ArchLucid.Api controller policies, and existing route/tier drift scripts.

Scope:
- Check controller route policy, commercial tier gate, UI nav entry, and matrix documentation alignment.
- Emit JSON and Markdown.
- Wire result into first-pilot proof as PASS/WARN/HOLD where buyer-visible routes are involved.

Acceptance criteria:
- Adding a new operator route without policy/nav/matrix alignment fails the drift check.
- Legacy compatibility routes are documented as intentional.

Constraints:
- Do not change authorization policies unless a mismatch is found.
```

Impact of running the prompt: Directly improves Maintainability (+4-6 pts), Policy and Governance Alignment (+3-5 pts), Usability (+1-2 pts). Weighted readiness impact: +0.2-0.4%.

### COMPLETED: 9. Standardize Staging Readiness Evidence Capture

Why it matters: Repo readiness does not prove a candidate deployment is ready.

Expected impact: Fewer environment-specific pilot failures.

Affected qualities: Deployability, Reliability, Availability, Azure Compatibility and SaaS Deployment Readiness.

Status: Fully actionable now.

Cursor prompt:

```text
Standardize staging readiness evidence capture into a single release artifact.

Start from docs/library/V1_RELEASE_CHECKLIST.md, scripts/capture-staging-readiness-evidence.ps1, scripts/collect-first-pilot-proof.ps1, docs/runbooks/MINIMAL_AZURE_PILOT_DEPLOYMENT.md, and docs/library/OBSERVABILITY.md.

Scope:
- Include health, ready, version, OpenAPI, auth posture, SQL migrations, telemetry export, data consistency, and first-pilot proof status.
- Emit JSON and Markdown with PASS/WARN/HOLD.
- Add fixtures/tests for missing telemetry, missing SQL readiness, and auth bypass in production-like config.

Acceptance criteria:
- A pilot release checklist can point to one staging readiness artifact.
- Missing production-like telemetry or auth posture is visible and classified.

Constraints:
- Do not require live Azure login in unit tests.
- Do not claim production SLA from staging evidence.
```

Impact of running the prompt: Directly improves Deployability (+4-6 pts), Reliability (+2-4 pts), Azure Compatibility (+2-4 pts). Weighted readiness impact: +0.2-0.4%.

### COMPLETED: 10. Strengthen Data Consistency Remediation Dry-Run Evidence

Why it matters: Data consistency failures undermine every proof package.

Expected impact: Better operator confidence and safer remediation.

Affected qualities: Data Consistency, Reliability, Trustworthiness, Supportability.

Status: Fully actionable now.

Cursor prompt:

```text
Improve data-consistency readiness output with dry-run remediation evidence and sponsor-handoff blocking semantics.

Start from docs/runbooks/DATA_CONSISTENCY_READINESS.md, docs/library/DATA_CONSISTENCY_MATRIX.md, data consistency health checks, and scripts/collect-data-consistency-readiness.ps1.

Scope:
- Add dry-run remediation summaries for known orphan classes where endpoints already exist.
- Ensure first-pilot proof maps integrity HOLD to sponsor BLOCK.
- Add tests for archived-run exemptions, orphan counts, missing diagnostics endpoint, and dry-run-only behavior.

Acceptance criteria:
- The collector never deletes or quarantines data directly.
- Sponsor handoff blocks on unresolved integrity HOLD.

Constraints:
- Do not introduce destructive automatic remediation.
```

Impact of running the prompt: Directly improves Data Consistency (+5-7 pts), Reliability (+2-3 pts), Trustworthiness (+1-2 pts). Weighted readiness impact: +0.2-0.4%.

### COMPLETED: 11. Require Observability Export for Production-Like Sponsor Handoffs

Why it matters: AI, reliability, and support claims need telemetry proof.

Expected impact: Better diagnosability and operational trust.

Affected qualities: Supportability, Manageability, Reliability, AI/Agent Readiness.

Status: Fully actionable now.

Cursor prompt:

```text
Make observability export readiness a blocking sponsor-handoff check for production-like profiles.

Start from docs/library/OBSERVABILITY.md, scripts/report_observability_export_readiness.py, ArchLucid configuration lint profiles, and first-pilot proof scripts.

Scope:
- Add observability export readiness to production-like hosted pilot proof output.
- Classify no exporter as HOLD when ProductionValidation:RequireTelemetryExport=true or sponsor handoff profile is selected.
- Include exact keys that satisfy the requirement: Application Insights, OTLP, or Prometheus.

Acceptance criteria:
- Sponsor handoff cannot claim production-like readiness with no telemetry export.
- Local/dev profiles remain warning-only unless explicitly strict.

Constraints:
- Do not print secrets or connection strings.
- Do not require network calls to telemetry backends.
```

Impact of running the prompt: Directly improves Supportability (+4-6 pts), Manageability (+3-4 pts), Reliability (+2-3 pts). Weighted readiness impact: +0.1-0.3%.

### COMPLETED: 12. Reduce Documentation Cognitive Load Around the First Pilot

Why it matters: Documentation is rich but too large for new operators.

Expected impact: Better self-sufficiency and fewer pilot stalls.

Affected qualities: Cognitive Load, Customer Self-Sufficiency, Adoption Friction, Documentation.

Status: Fully actionable now.

Cursor prompt:

```text
Reduce first-pilot documentation cognitive load without deleting useful depth docs.

Start from docs/START_HERE.md, docs/CORE_PILOT.md, docs/runbooks/FIRST_PILOT_OPERATOR_PATH.md, docs/onboarding/EVALUATION_GUIDE.md, and docs/library/V1_NAVIGATION_INDEX.json.

Scope:
- Make FIRST_PILOT_OPERATOR_PATH the only operational checklist.
- Keep CORE_PILOT as a short narrative and EVALUATION_GUIDE as optional depth.
- Add clear "read this next" and "do not read this yet" routing for first-time operators.
- Update cross-links so duplicate checklists do not compete.

Acceptance criteria:
- A new operator sees one canonical operational path from START_HERE.
- Optional depth docs are labeled as depth, not alternate paths.

Constraints:
- Do not remove detailed docs.
- Do not rewrite product scope.
```

Impact of running the prompt: Directly improves Cognitive Load (+6-9 pts), Adoption Friction (+2-4 pts), Documentation (+2-3 pts). Weighted readiness impact: +0.2-0.4%.

### COMPLETED: 13. Enforce Mutating Route Idempotency Classification

Why it matters: Retries and scripts can double-create or double-commit unless mutations are classified and protected.

Expected impact: Stronger reliability and correctness.

Affected qualities: Reliability, Correctness, Architectural Integrity, Auditability.

Status: Fully actionable now.

Cursor prompt:

```text
Implement or strengthen an architecture test that classifies mutating HTTP routes by idempotency posture.

Start from docs/library/ARCHITECTURE_INVARIANTS.md INV-009, ArchLucid.Api controllers, API_CONTRACTS.md, and integration correctness drill scripts.

Scope:
- Detect POST/PUT/PATCH/DELETE routes and require one of: naturally idempotent, explicit idempotency key, documented safe retry semantics, or intentional non-idempotent allowlist.
- Emit a Markdown/JSON report.
- Add fixtures for commit, outbound webhook, batch acknowledge, archive, and governance batch review routes.

Acceptance criteria:
- New mutating routes cannot be added without idempotency classification.
- Existing intentional exceptions are documented and narrow.

Constraints:
- Do not retrofit idempotency stores everywhere in one pass.
```

Impact of running the prompt: Directly improves Reliability (+4-6 pts), Correctness (+2-4 pts), Architectural Integrity (+1-2 pts). Weighted readiness impact: +0.2-0.4%.

### COMPLETED: 14. Add Parallel-Tenant Isolation Regression Tests

Why it matters: Tenant data leakage is the highest-trust failure mode.

Expected impact: Stronger security and trust confidence.

Affected qualities: Security, Trustworthiness, Correctness, Data Consistency.

Status: Fully actionable now.

Cursor prompt:

```text
Add focused parallel-tenant isolation regression tests for high-value read and write paths.

Start from docs/security/MULTI_TENANT_RLS.md, docs/go-to-market/TENANT_ISOLATION.md, ArchLucid.Api integration tests, and Persistence SQL test support.

Scope:
- Create two tenant/workspace/project scopes with distinct runs, manifests, artifacts, audit rows, and explanations.
- Assert each tenant cannot read or mutate the other's run detail, manifest summary, artifacts, audit slice, proof package, and ROI summary.
- Include one background/worker-read path if test support allows.

Acceptance criteria:
- Tests fail if tenant scope is missing from a query.
- SQL/RLS and application-scope enforcement are both exercised where feasible.

Constraints:
- Keep runtime scoped.
- Do not use external resources.
```

Impact of running the prompt: Directly improves Security (+3-5 pts), Trustworthiness (+2-4 pts), Correctness (+2-3 pts). Weighted readiness impact: +0.2-0.4%.

### COMPLETED: 15. Tighten ROI Basis Labels Across API, UI, CLI, and PDF

Why it matters: ROI can sell the product or damage trust if estimates look measured.

Expected impact: Better sponsor confidence and fewer over-claims.

Affected qualities: Proof-of-ROI Readiness, Executive Value Visibility, Trustworthiness, Decision Velocity.

Status: Fully actionable now.

Cursor prompt:

```text
Ensure ROI basis labels are consistent across API, UI, CLI, Markdown, and PDF outputs.

Start from docs/library/PILOT_ROI_MODEL.md, ArchLucid.Application/Pilots, ArchLucid.Contracts/Pilots, ArchLucid.Cli, and archlucid-ui sponsor/scorecard components.

Scope:
- Define one shared vocabulary for measured baseline, tenant-provided baseline, conservative default, demo-derived, and unavailable.
- Propagate that vocabulary through first-value report, pilot deltas JSON, PDF, CLI output, and UI.
- Add tests that prevent projected dollar figures from appearing without a basis label.

Acceptance criteria:
- Every ROI dollar/time claim has a basis label.
- Missing baselines produce low-confidence copy, not invented precision.

Constraints:
- Do not change pricing source-of-truth numbers.
```

Impact of running the prompt: Directly improves Proof-of-ROI Readiness (+5-7 pts), Trustworthiness (+2-3 pts), Executive Value Visibility (+2-3 pts). Weighted readiness impact: +0.3-0.5%.

### COMPLETED: 16. Add Demo-to-Real Conversion Guardrails

Why it matters: Demo proof is useful only if nobody mistakes it for customer evidence.

Expected impact: Better marketability without trust erosion.

Affected qualities: Marketability, Trustworthiness, Proof-of-ROI Readiness, Adoption Friction.

Status: Fully actionable now.

Cursor prompt:

```text
Strengthen demo-to-real conversion guardrails in public demo, operator demo, and sponsor artifacts.

Start from docs/go-to-market/DEMO_WORKSPACES.md, docs/library/DEMO_PREVIEW.md, API demo endpoints, archlucid-ui marketing demo pages, and first-value report demo detection.

Scope:
- Ensure demo pages and generated artifacts consistently label demo-derived evidence.
- Add a clear next step for replacing demo evidence with customer Azure extractor ZIP evidence.
- Add tests for demo warning presence in Markdown/PDF/UI where feasible.

Acceptance criteria:
- Demo numbers cannot be copied into sponsor-ready materials without a demo warning.
- UI and docs point to the real-evidence path.

Constraints:
- Do not remove demo routes.
```

Impact of running the prompt: Directly improves Marketability (+2-3 pts), Trustworthiness (+2-3 pts), Adoption Friction (+1-2 pts). Weighted readiness impact: +0.2-0.3%.

### COMPLETED: 17. Strengthen Support Bundle Redaction and Completeness Tests

Why it matters: Support artifacts are useful but can become a security risk if not redacted.

Expected impact: Safer external support and procurement sharing.

Affected qualities: Supportability, Security, Procurement Readiness, Trustworthiness.

Status: Fully actionable now.

Cursor prompt:

```text
Add support bundle redaction and completeness tests for buyer-shareable troubleshooting artifacts.

Start from ArchLucid.Cli support-bundle command, docs/library/CLI_USAGE.md, docs/runbooks/TROUBLESHOOTING.md, and support bundle docs.

Scope:
- Define expected sections: version, health, masked config summary, environment, recent errors, correlation guidance, and run metadata when supplied.
- Add tests that assert connection strings, API keys, SAML secrets, Key Vault secret values, and raw prompts are not emitted.
- Update docs with a buyer-safe sharing checklist.

Acceptance criteria:
- Tests fail on common secret patterns.
- Missing required sections are detected.

Constraints:
- Do not include raw customer evidence, full prompts, or secret values.
```

Impact of running the prompt: Directly improves Supportability (+3-4 pts), Security (+2-3 pts), Procurement Readiness (+1-2 pts). Weighted readiness impact: +0.1-0.3%.

### COMPLETED: 18. Attach Performance Timing Budget to First-Pilot Proof

Why it matters: Buyers need measured timing, not generic performance claims.

Expected impact: Better time-to-value and performance evidence.

Affected qualities: Performance, Time-to-Value, Availability, Executive Value Visibility.

Status: Fully actionable now.

Cursor prompt:

```text
Attach measured first-pilot timing budget evidence to proof artifacts.

Start from docs/library/PERFORMANCE.md, scripts/ci/report_first_pilot_timing_budget.py, k6 smoke outputs, and scripts/collect-first-pilot-proof.ps1.

Scope:
- Include create-to-commit, proof generation time, artifact export time where available, and measured-vs-target labels.
- Mark missing timing data as not measured rather than passing.
- Add tests for measured, missing, and threshold-exceeded cases.

Acceptance criteria:
- Proof separates measured timings, configured targets, and untested assumptions.
- Buyer copy does not imply SLA or multi-region performance from local/staging data.

Constraints:
- Do not invent timing targets.
```

Impact of running the prompt: Directly improves Performance (+4-6 pts), Time-to-Value (+1-2 pts), Executive Value Visibility (+1-2 pts). Weighted readiness impact: +0.1-0.3%.

### COMPLETED: 19. Add Terraform Pilot Plan Validation Matrix

Why it matters: Azure compatibility is strong on paper but deployment confidence needs repeatable proof.

Expected impact: Cleaner Azure pilot setup and fewer IaC surprises.

Affected qualities: Azure Compatibility and SaaS Deployment Readiness, Deployability, Security, Cost-Effectiveness.

Status: Fully actionable now.

Cursor prompt:

```text
Add a Terraform pilot plan validation matrix for the minimal Azure pilot footprint.

Start from docs/library/DEPLOYMENT_TERRAFORM.md, docs/runbooks/MINIMAL_AZURE_PILOT_DEPLOYMENT.md, infra/terraform-pilot, infra/terraform-container-apps, infra/terraform-private, infra/terraform-monitoring, and existing Terraform CI scripts.

Scope:
- Document required, optional, and explicitly out-of-first-pilot Terraform roots.
- Add a validation checklist or script for variables, private endpoint posture, Key Vault/secrets posture, monitoring export, and budget options without applying.
- Emit Markdown suitable for release evidence.

Acceptance criteria:
- Operators can see which Terraform roots to plan for a minimal pilot.
- Validation distinguishes required inputs from optional advanced roots.

Constraints:
- Do not run terraform apply.
- Do not add non-Terraform infrastructure representation.
```

Impact of running the prompt: Directly improves Azure Compatibility (+3-5 pts), Deployability (+3-5 pts), Security (+1-2 pts), Cost-Effectiveness (+1-2 pts). Weighted readiness impact: +0.1-0.3%.

### COMPLETED: 20. Classify Audit Paths as Transactional or Informational

Why it matters: Auditability is strong, but failure semantics must be explicit.

Expected impact: Better enterprise trust and fewer compliance misunderstandings.

Affected qualities: Auditability, Reliability, Compliance Readiness, Architectural Integrity.

Status: Fully actionable now.

Cursor prompt:

```text
Classify mutating audit paths as transactional or informational and add narrow enforcement tests.

Start from docs/library/ARCHITECTURE_INVARIANTS.md INV-003, docs/library/AUDIT_COVERAGE_MATRIX.md, ArchLucid.Core AuditEventTypes, and services/controllers that write audit events.

Scope:
- Add a table or generated report mapping high-value mutating flows to transactional audit, informational async audit, or not applicable.
- Add tests for transactional flows where audit failure must fail the operation.
- Explain best-effort async audit without over-claiming fail-closed behavior.

Acceptance criteria:
- Governance, commit, billing, and procurement-relevant mutations have explicit audit semantics.
- Informational paths are documented and observable.

Constraints:
- Do not convert all audit writes to fail-closed without evaluating user-visible impact.
```

Impact of running the prompt: Directly improves Auditability (+3-5 pts), Reliability (+2-3 pts), Compliance Readiness (+1-2 pts). Weighted readiness impact: +0.1-0.3%.

### COMPLETED: 21. Add AI Prompt and Model Version Manifest to Proof Outputs

Why it matters: AI outputs are more defensible when model/prompt provenance is attached.

Expected impact: Better auditability, supportability, and AI trust.

Affected qualities: AI/Agent Readiness, Cutting-Edge AI Technology, Traceability, Supportability.

Status: Fully actionable now.

Cursor prompt:

```text
Add prompt/model provenance summaries to proof outputs without exposing raw prompts.

Start from AgentExecutionTrace metadata, prompt versioning docs, docs/library/AGENT_OUTPUT_EVALUATION.md, ArchLucid.Cli proof output, and first-pilot proof scripts.

Scope:
- Include model deployment name/version when available, prompt pack versions, execution mode, schema validation mode, and quality-gate threshold basis.
- Do not include raw prompts, raw responses, or customer evidence text.
- Add tests for simulator, real-mode with model metadata, and missing metadata.

Acceptance criteria:
- Proof can identify which prompt/model posture produced the output.
- Sensitive prompt contents remain excluded.

Constraints:
- Do not alter agent execution behavior.
```

Impact of running the prompt: Directly improves AI/Agent Readiness (+2-4 pts), Traceability (+2-3 pts), Supportability (+1-2 pts). Weighted readiness impact: +0.2-0.4%.

### COMPLETED: 22. Add Accelerator Acceptance Tests for V1 Buyer Jobs

Why it matters: Templates and accelerators must be repeatable buyer paths, not just docs.

Expected impact: Better marketability and lower pilot risk for specialty narratives.

Affected qualities: Template and Accelerator Richness, Marketability, Time-to-Value, Correctness.

Status: Fully actionable now.

Cursor prompt:

```text
Add acceptance checks for the V1 specialty accelerator walkthroughs.

Start from docs/library/walkthroughs/README.md, Azure SaaS readiness, AI governance, healthcare claims walkthroughs, policy pack samples, and demo seed/test fixtures.

Scope:
- Add lightweight tests or scripts verifying each walkthrough references shipped V1 surfaces only.
- Verify required policy packs/sample inputs exist.
- Emit an accelerator acceptance Markdown report.
- Document that each accelerator is optional after Core Pilot first value.

Acceptance criteria:
- Broken links or references to deferred V1.1 connectors fail the check.
- Each accelerator has a clear buyer outcome and required evidence list.

Constraints:
- Do not require live external systems.
- Do not make specialty accelerators mandatory before first pilot.
```

Impact of running the prompt: Directly improves Template and Accelerator Richness (+5-8 pts), Marketability (+1-2 pts), Time-to-Value (+1-2 pts). Weighted readiness impact: +0.1-0.2%.

### COMPLETED: 23. Make Commercial Packaging Boundaries Machine-Checked

Why it matters: Tier, pricing, quote, trial, and entitlement copy can drift.

Expected impact: Clearer packaging and fewer buyer contradictions.

Affected qualities: Commercial Packaging Readiness, Decision Velocity, Maintainability.

Status: Fully actionable now.

Cursor prompt:

```text
Add or strengthen machine checks that keep pricing, public pricing JSON, order form, marketplace naming, trial copy, and commercial tier gates aligned.

Start from docs/go-to-market/PRICING_PHILOSOPHY.md, ORDER_FORM_TEMPLATE.md, archlucid-ui/public/pricing.json, scripts/ci/check_pricing_single_source.py, scripts/ci/assert_marketplace_pricing_alignment.py, and commercial tier gate tests.

Scope:
- Verify no price numbers appear outside approved sources.
- Verify Team/Professional/Enterprise naming alignment.
- Verify live checkout placeholders remain hidden or explicitly test-mode labeled.
- Emit a commercial-packaging readiness Markdown artifact.

Acceptance criteria:
- A drifted price/tier/checkout label fails CI or the local check.
- Sales-led V1 and deferred live commerce are clearly separated.

Constraints:
- Do not change actual prices.
- Do not enable live commerce.
```

Impact of running the prompt: Directly improves Commercial Packaging Readiness (+4-6 pts), Decision Velocity (+2-3 pts), Maintainability (+1-2 pts). Weighted readiness impact: +0.1-0.2%.

### COMPLETED: 24. Add Architecture Invariant Enforcement Wave for P0/P1 Gaps

Why it matters: The invariant catalog admits mixed conformance, and high-risk invariants protect trust.

Expected impact: Lower drift and safer future development.

Affected qualities: Architectural Integrity, Maintainability, Correctness, Reliability.

Status: Fully actionable now.

Cursor prompt:

```text
Implement the next small enforcement wave for P0/P1 architecture invariants that are not already enforced.

Start from docs/library/ARCHITECTURE_INVARIANTS.md and existing Architecture.Tests.

Scope:
- Pick two high-risk unenforced invariants with clear static or integration-test checks.
- Prefer tenant identity boundary, quality-gate single source of truth, audit path contracts, or inbound webhook pipeline order.
- Add tests/analyzers with narrow allowlists.
- Update the invariant catalog with enforcement status.

Acceptance criteria:
- At least two invariants move from convention to automated enforcement.
- Tests fail on representative violation fixtures or synthetic examples.

Constraints:
- Do not rewrite broad architecture.
- Do not add noisy analyzers without allowlists.
```

Impact of running the prompt: Directly improves Architectural Integrity (+2-4 pts), Maintainability (+2-4 pts), Correctness (+1-2 pts). Weighted readiness impact: +0.2-0.4%.

### COMPLETED: 25. Add Cost Envelope Evidence to First-Pilot Proof

Why it matters: Unit economics and buyer comfort both depend on transparent LLM cost posture.

Expected impact: Better cost-effectiveness and buyer trust.

Affected qualities: Cost-Effectiveness, Proof-of-ROI Readiness, AI/Agent Readiness, Manageability.

Status: Fully actionable now.

Cursor prompt:

```text
Add LLM cost envelope evidence to first-pilot proof outputs.

Start from docs/go-to-market/PRICING_PHILOSOPHY.md hosted AOAI spend guard, docs/runbooks/LLM_COST_ESTIMATION.md, LlmMonthlyTenantDollarBudget options, ArchLucid.Cli proof outputs, and observability docs.

Scope:
- Report budget mode, configured monthly included/hard-cutoff USD, token-rate basis, run-level LLM call count where available, and whether budget enforcement is enabled.
- Label estimates as internal estimated USD, not invoiced Azure spend.
- Add tests for budget enabled, disabled, and missing-rate cases.

Acceptance criteria:
- Proof output makes LLM cost posture visible without exposing secrets.
- Missing cost telemetry is WARN or HOLD depending on sponsor-handoff profile.

Constraints:
- Do not change pricing.
- Do not query Azure Cost Management in unit tests.
```

Impact of running the prompt: Directly improves Cost-Effectiveness (+4-6 pts), AI/Agent Readiness (+1-2 pts), Proof-of-ROI Readiness (+1-2 pts). Weighted readiness impact: +0.1-0.3%.

### 26. DEFERRED SOC 2 CPA Engagement Planning

Why it matters: SOC 2 CPA attestation is not part of `(A)`, but it matters in strict procurement.

Expected impact: Improves `(B)` procurement realism, not headline `(A)` readiness.

Affected qualities: Procurement Readiness, Compliance Readiness, Trustworthiness.

Status: DEFERRED.

Reason it is deferred: Meaningful work requires business input and external-party decisions. The repo can maintain self-assessment and roadmap artifacts, but it cannot select a CPA, approve budget, or start an attestation engagement.

Specific information needed later: budget ceiling, readiness consultant/CPA preference or shortlist, desired observation window, target customer/regional scope, and whether a buyer has made SOC 2 a binding procurement requirement.

### 27. DEFERRED Commerce Live Un-Hold

Why it matters: Live Stripe/Marketplace commerce would reduce decision friction, but V1 is sales-led.

Expected impact: Improves `(B)` commercial velocity and future self-serve conversion; limited `(A)` effect because live commerce is explicitly deferred/owner-only.

Affected qualities: Decision Velocity, Commercial Packaging Readiness, Adoption Friction.

Status: DEFERRED.

Reason it is deferred: The final step requires owner-controlled Stripe live keys, production webhook secrets, Marketplace publication, seller verification, payout/tax setup, and DNS cutover.

Specific information needed later: confirmation that live Stripe keys are approved, Marketplace offer is ready for publication, seller/tax/payout profiles are complete, DNS/certificate plan for signup host is approved, and target launch environment.

### 28. DEFERRED V1.1 First-Party Connector Validation Tenants

Why it matters: Jira, ServiceNow, Confluence, Slack, and Teams will materially improve enterprise workflow embeddedness once V1.1 work is active.

Expected impact: Improves Workflow Embeddedness and Interoperability in the V1.1 window; not an `(A)` V1 penalty.

Affected qualities: Workflow Embeddedness, Interoperability, Adoption Friction, Stickiness.

Status: DEFERRED.

Reason it is deferred: Meaningful validation requires vendor tenants/workspaces, test credentials, and owner decisions about which connector tranche is active.

Specific information needed later: available ServiceNow developer instance, Jira/Confluence test site details, Slack/Teams workspace policy, allowed auth method for each, and confirmation of the V1.1 connector sequencing to validate.

## 10. Prompt Batching Guidance

Batch 1: AI proof and correctness. Run improvements 1, 2, 5, 15, 21, and 25 together only if the context window can hold AgentRuntime, Pilot report builders, proof scripts, and tests. This is the highest weighted batch.

Batch 2: First-pilot operator conversion. Run improvements 3, 4, 6, 12, 16, and 18 together. They share CLI/proof/UI/docs context and improve the first-pilot-to-sponsor path.

Batch 3: Enterprise trust and procurement. Run improvements 7, 10, 11, 17, and 20 together. They share proof, trust, support, audit, and handoff artifacts.

Batch 4: Architecture drift and safety. Run improvements 8, 13, 14, and 24 together. They are mostly architecture tests, route/policy matrices, and tenant-boundary safeguards.

Batch 5: Deployment and accelerator proof. Run improvements 9, 19, and 22 together. They are documentation/script-heavy and should not be mixed with deep AI work.

Batch 6: Commercial packaging. Run improvements 6, 23, and 25 together when working on proof-to-paid flow and cost posture. Keep live commerce un-hold deferred until owner inputs exist.

Do not batch the DEFERRED items 26-28 until the needed owner inputs exist. When those inputs arrive, treat each as its own planning session because each crosses business, external systems, or procurement boundaries.

## 11. Pending Questions for Later

### DEFERRED SOC 2 CPA Engagement Planning

- What budget ceiling is available for readiness consultant plus CPA firm?
- Should the target be Type I only first, or Type I with a Type II observation plan?
- Which customer/regional scope must the system description cover?
- Has any contracted customer made SOC 2 attestation a binding procurement requirement?

### DEFERRED Commerce Live Un-Hold

- Are Stripe live keys, webhook secret rotation, and production Price IDs approved?
- Is the Azure Marketplace offer ready for `Published` status?
- Are seller verification, payout account, and tax profile complete?
- What DNS and certificate plan should be used for `signup.archlucid.net` or successor signup host?

### DEFERRED V1.1 First-Party Connector Validation Tenants

- Which ServiceNow developer instance should engineering use?
- Which Jira and Confluence Cloud test site should be used?
- What Slack/Teams workspace policy and auth model are allowed for validation?
- Is the V1.1 connector sequencing still ServiceNow first, then Confluence before Jira?
