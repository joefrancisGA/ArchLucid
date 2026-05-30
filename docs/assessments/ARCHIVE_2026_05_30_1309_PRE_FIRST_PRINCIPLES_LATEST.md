> **Scope:** ArchLucid Assessment – (A) Headline Readiness: 78.8% - full detail, tables, and links in the sections below.

# ArchLucid Assessment – (A) Headline Readiness: 78.8%

This score is the `(A)` headline readiness per `Assessment-Scope-V1_1.mdc`, using the user-provided weights exactly and excluding explicitly deferred items. Deferred items excluded from the score include SOC 2 CPA attestation, signed design partner, owner-output GTM assets/cohorts, public plugin SDK, MCP as a V1 transport, third-party plugin marketplace, third-party pen-test publication, multi-region active/active guarantees, browser folder-recursive upload, and other items explicitly assigned to V1.1/V2/backlog in `docs/library/V1_SCOPE.md` and `docs/library/V1_DEFERRED.md`.

Weighted formula used: `sum(score * weight) / 119 = 9380 / 119 = 78.8%`.

**Rescore note (2026-05-30, batch 7):** Completed operator `HelpLink` purge (#9), Key Vault PE/RBAC + infra sync script (#8), INV-013 replay architecture guard (#19), OpenAPI-backed `RunExplanationSummary` TS types (#20), OpenAPI snapshot + TS regen (#5). Prior batch 6: budget command center, export callouts, core-pilot in-app help.

## 2. Executive Summary

### (A) Overall Headline Readiness

ArchLucid is a real, V1-shaped enterprise product, not a prototype. It has a coherent review lifecycle, SQL-backed persistence, operator UI, CLI, evidence bundles, audit trails, governance workflows, policy packs, OpenAPI discipline, Azure-first deployment posture, agent execution controls, LLM budgets, proof-of-ROI surfaces, and buyer-oriented trust materials. The headline weakness is not the absence of a single killer feature. It is that the product still asks too much trust and operational skill from the buyer before the AI-generated architecture judgment feels mechanically safe, repeatable, and easy to adopt.

### (B) Procurement / Market-Motion Realism

Procurement realism is materially harsher than the `(A)` product score. The trust center is honest and useful, with SOC 2 self-assessment, CAIQ/SIG/DPA materials, audit documentation, owner-conducted security testing, and a clear “planned, not yet scheduled” third-party pen-test posture. However, buyers with rigid SOC 2 Type II, ISO 27001, formal vendor pen-test, production SLA, or public-reference requirements will still slow down. Per scope rules, that friction is informational and is not weighted into `(A)`.

### Commercial Picture

The commercial story is promising but still founder-led. Pricing is specific, ROI math exists, pilot packaging is credible, and quote-request / trial / checkout plumbing is represented. The commercial gap is confidence conversion: a buyer can understand the offer, but the first proof moment still needs more guided framing, stronger source-confidence labeling, cleaner in-app documentation, and more obvious repeat-use loops before the product sells itself.

### Enterprise Picture

The enterprise architecture is serious: tenant database topology, RBAC, OIDC/SAML/SCIM posture, audit export, policy packs, governance approvals, support bundles, rate limits, problem details, and configuration linting are all present. The enterprise gap is operational absorption. A security reviewer can find evidence, but an implementation team still has to reconcile many modes, runbooks, configuration paths, and scope caveats.

### Engineering Picture

Engineering quality is above average for a young system. The codebase is modular, contract-heavy, test-heavy, and unusually explicit about deferred scope. The risks are concentrated in AI correctness, retrieval quality, real-mode regression evidence, IaC runtime parity, UI/API drift, and complexity. These are fixable with focused engineering passes; they are not signs of a broken architecture.

### Deferred Scope Uncertainty

The authoritative deferred-scope markdown was located in `docs/library/V1_DEFERRED.md`, `docs/library/V1_SCOPE.md`, and `.cursor/rules/Assessment-Scope-V1_1.mdc`. I did not locate a live `docs/security/PEN_TEST_PROGRAM.md` file referenced in pricing as future evidence, but that does not create scoring uncertainty because `V1_DEFERRED.md` and the trust center already identify third-party pen testing as planned/backlog, not a headline `(A)` gate.

## 3. Weighted Quality Assessment

| Rank | Quality | Score | Weight | Readiness Impact | Weighted Deficiency Signal | Justification | Tradeoffs | Improvement Recommendations | Disposition |
|---:|---|---:|---:|---:|---:|---|---|---|---|
| 1 | Marketability | 73 | 8 | 4.91% | 216 | The product has a concrete category, pricing, trust center, buyer orientation, demo/proof concepts, and ROI story, but the promise is still dense and proof-heavy. Buyers will need help understanding why ArchLucid is not just another AI architecture assistant. | Specificity improves credibility but makes the pitch harder to absorb quickly. | Build sharper pain-first landing paths, in-app proof walkthroughs, and source-labeled demo proof packets without adding unsupported claims. | Fixable in V1 for core message clarity; broader market proof remains `(B)`/V1.1. |
| 2 | Adoption Friction | 70 | 6 | 3.53% | 180 | First-pilot command center, config lint, and in-app help routing reduce setup friction, but production-like customers still reconcile SQL, auth, Azure OpenAI, Azure AI Search, and proof semantics. | Enterprise safety increases setup burden; simplifying too far would risk weak isolation or unsupported claims. | Continue command-center blocker surfacing and production-like preflight consolidation. | Fixable in V1. |
| 3 | Cutting-Edge AI Technology | 78 | 8 | 5.25% | 176 | Azure OpenAI real mode, retrieval grounding traces (Compliance, Cost, Topology), golden cohort gate, faithfulness scoring, and staged critic exist. Remaining edge is measured grounding ratio gates on all sponsor paths. | Conservative AI design reduces “magic” but improves enterprise control. | Wire grounding ratio into proof disposition when traces absent. | Fixable in V1 for quality gates; advanced RAG V1.1/V2. |
| 4 | AI/Agent Readiness | 81 | 8 | 5.45% | 152 | Agent orchestration has simulator/real separation, PilotStrict sponsor handoff, golden cohort evidence gate, schema validation, budgets, and trace telemetry. Remaining risk is broad agent-path retrieval grounding coverage. | Strict gates may reject usable outputs, but loose gates create buyer trust failures. | Extend retrieval grounding registry to all RAG agents and surface failure reasons on run detail. | Fixable in V1. |
| 5 | Stickiness | 75 | 6 | 3.78% | 150 | Governance, audit, compare/replay, policy packs, ROI summaries, executive digests, and learning signals can create repeat usage. The first review is clearer than the recurring operating loop. | Strong governance stickiness raises onboarding complexity. | Make repeat reviews, waiver tracking, policy drift, and recurring ROI deltas visible as the default post-commit next step. | Fixable in V1. |
| 6 | Correctness | 84 | 8 | 5.65% | 128 | OpenAPI contract tests, scope reconciliation, schema validation, and proof-surface regressions are strong. Correctness still depends on retrieval relevance across all agents and UI/API alignment on run detail. | Determinism and validation reduce flexibility but are necessary for trust. | Finish retrieval quality gates and run-detail decision surface. | Fixable in V1. |
| 7 | Time-to-Value | 80 | 7 | 4.71% | 140 | A buyer can reach a committed review and artifacts through the documented Pilot path, UI, API, or CLI. First-value docs exist, and the trial path is represented. The path is still too technical for a low-touch evaluator. | A guided pilot can succeed faster than a self-serve path, but it limits scale. | Create a 20-minute proof path with fewer choices, clearer inputs, and immediate sponsor-ready output. | Fixable in V1. |
| 8 | Proof-of-ROI Readiness | 81 | 5 | 3.40% | 95 | ROI source catalog, freshness HOLD rules (stale extractor / unsourced savings), and proof-packet enforcement exist. Uniform stale HOLD on every executive surface still needs API-level propagation. | ROI needs enough nuance to be honest, but too many caveats dilute sponsor impact. | Propagate freshness disposition on pilot-run-deltas and executive summary API. | Fixable in V1 — **#6 shipped 2026-05-30**. |
| 9 | Differentiability | 74 | 4 | 2.49% | 104 | ArchLucid differentiates through evidence-backed architecture review, manifest commitment, governance, audit, ROI, and Azure-safe posture. It still needs crisper contrast against generic copilots, cloud assessment tools, and consulting templates. | Narrow positioning may reduce total market but improves buyer comprehension. | Build comparison proof packets and product-page narratives grounded in actual artifacts, not broad AI claims. | Fixable in V1. |
| 10 | Usability | 74 | 3 | 1.86% | 78 | In-app help registry, doc-index in-app routes, and GitHub blob guard reduce repo leakage; run/review concept load remains high. | Richness helps expert operators but slows new evaluators. | Complete first-pilot command center blockers and run detail grounding panel. | Fixable in V1. |
| 11 | Executive Value Visibility | 78 | 4 | 2.62% | 88 | Executive ROI summary, sponsor reports, first-value report, PDF/shareable paths, and pricing narratives exist. The sponsor view still needs stronger “what changed, why it matters, what to do next” compression. | Executive compression can omit technical nuance; source drill-down must remain available. | Improve sponsor one-pagers, cross-run trend clarity, and remediation-to-value summaries. | Fixable in V1. |
| 12 | Workflow Embeddedness | 72 | 3 | 1.82% | 84 | REST, CLI, UI, SCIM, GitHub/Azure DevOps surfaces, Azure extractor ZIP, and some integration/webhook paths exist. First-party V1.1 connectors are intentionally out of score. Current workflow fit is good for guided operators, less good for customers wanting native ITSM/docs/chat depth now. | REST/CLI first keeps the core stable before committing many connector schemas. | Harden REST/CLI handoff, Azure DevOps/GitHub decoration, and exported evidence bundles; avoid adding parallel schemas. | V1 for current surfaces; first-party connectors V1.1. |
| 13 | Trustworthiness | 78 | 3 | 1.97% | 66 | Trust posture is unusually transparent: scope boundaries, tenant isolation, audit matrix, self-assessment, security docs, prompt redaction, and assurance caveats are clear. Trust still depends on real-mode AI grounding and production evidence. | Honest caveats may slow sales but prevent overpromising. | Strengthen AI output source backing, production-like evidence rollups, and trust-pack freshness guards. | Fixable in V1; CPA/third-party attestations excluded from `(A)`. |
| 14 | Procurement Readiness | 72 | 2 | 1.21% | 56 | DPA, subprocessors, trust center, strict procurement-pack mode, and **documented support/SLA terms** (`SUPPORT_POLICY.md`, updated `SLA_SUMMARY.md`) improve deal velocity. Rigid buyers will still object to no CPA SOC 2 or third-party pen test. | Conservative claims preserve legal safety but reduce procurement speed for checkbox buyers. | Keep strict mode in release pipeline; SOC/pen-test remain `(B)`. | V1 for pack quality; support/SLA **shipped 2026-05-30** (#24). |
| 15 | Architectural Integrity | 82 | 3 | 1.97% | 66 | The architecture is coherent: bounded projects, persistence split explained, Authority pipeline, dependency constraints, OpenAPI discipline, and invariants. **`LlmCostGuardrailArchitectureTests`** (INV-004) and **`ReplayReadOnlyScopeArchitectureTests`** (INV-013 wiring) enforce guardrails in CI. Complexity and compatibility surfaces remain meaningful. | Backward compatibility lowers migration risk but increases cognitive load. | Continue invariant enforcement wave (#19), shrink compatibility stubs, and keep new routes Authority-aligned. | Fixable in V1 — **#19 partial 2026-05-30**. |
| 16 | Decision Velocity | 74 | 2 | 1.24% | 52 | Pricing is concrete; quote-aging admin UI and proof disposition vocabulary accelerate sales-led follow-up. Buyers still need proof interpretation before committing. | Enterprise decision quality requires evidence; too much evidence slows action. | Sharpen buyer-specific decision packets and close-readiness automation. | Fixable in V1 for sales-led motion. |
| 17 | Security | 83 | 3 | 2.10% | 51 | Scope/identity reconciliation middleware, IDOR integration tests, RBAC, and tenant retrieval architecture tests strengthen the data plane. Remaining risks: IaC secret transport parity and full retrieval contract matrix. | Strong controls add configuration work. | Complete tenant-scoped contract tests (#23) and hosted Terraform composition (#8). | Fixable in V1. |
| 18 | Reliability | 76 | 2 | 1.28% | 48 | Health checks, dead-letter operator UI, data consistency probes, production readiness drill pack, and probe rollup tooling exist. Production LLM/worker evidence remains thinner than design. | Avoiding overbuilt orchestration is sensible until complexity demands more. | Wire availability rollup into default proof collection; expand authority-run queue view. | Fixable in V1; DTF/ACA Jobs are V2 only. |
| 19 | Azure Compatibility and SaaS Deployment Readiness | 80 | 2 | 1.28% | 48 | Azure-first design plus **`deploy/hosted-prod-terraform`** scaffold (OpenAI, Search, KV ref, diagnostics, private endpoints, KV PE/RBAC). **`sync-hosted-prod-terraform-to-infra.ps1`** mirrors into `infra/terraform/prod` when writable. | Azure-native depth improves enterprise fit but increases IaC surface area. | Compose full API/worker footprint into prod root; wire managed identity outputs end-to-end. | Fixable in V1/V1.1 — **#8 partial 2026-05-30**. |
| 20 | Interoperability | 78 | 2 | 1.24% | 52 | API, CLI, OpenAPI, SCIM, Azure extractor ZIP, GitHub/Azure DevOps surfaces, webhooks/AsyncAPI, and regenerated clients provide useful interoperability. **`RunDetailDto`** forensics fields and **`RunExplanationSummary`** faithfulness fields are snapshot-guarded. | Fewer native connectors reduce complexity but require customer scripting. | Harden current HTTP/CLI/OpenAPI contracts and recipe boundaries; do not invent target-specific schemas. | Fixable in V1 — **#5 partial 2026-05-30**. |
| 21 | Maintainability | 74 | 2 | 1.24% | 52 | The repo is modular and heavily documented, with tests and architecture constraints. It is also large, with many docs, compatibility stubs, multiple run/review shapes, and ongoing rename/terminology complexity. | Fine-grained modularity aids reuse but raises navigation cost. | Enforce invariants, reduce stubs, consolidate duplicated business classification, and maintain doc registries. | Fixable in V1. |
| 22 | Commercial Packaging Readiness | 76 | 2 | 1.28% | 48 | Pricing tiers, pilot price, order form, quote path, Stripe/Marketplace wiring posture, and packaging docs are clear. Live commerce un-hold is intentionally deferred and not scored. | Sales-led packaging is safer before demand validation, but slower than self-serve. | Improve quote follow-up, SKU evidence, package comparison, and sales-led close packets. | Fixable in V1 except live-commerce owner gates. |
| 23 | Traceability | 84 | 3 | 2.12% | 48 | Run IDs, manifest IDs, audit rows, correlation IDs, OpenAPI snapshots, evidence refs, traceability bundles, and proof artifacts are strong. The main gap is surfacing traceability in the most useful buyer/operator views. | Traceability creates artifact volume and can overwhelm users. | Add concise traceability cards in proof bundles and run detail. | Fixable in V1. |
| 24 | Compliance Readiness | 77 | 2 | 1.29% | 46 | Compliance self-assessment, CAIQ/SIG, DPA, audit matrix, policy packs, retention notes, and procurement documents exist. The score excludes CPA SOC 2 and third-party pen-test publication. The remaining product gap is evidence packaging and freshness discipline. | Honest compliance avoids false claims but does not satisfy strict checkbox buyers. | Strengthen procurement-pack strict mode, freshness checks, and control-to-evidence summaries. | V1 for pack quality; external attestations `(B)`/backlog. |
| 25 | Policy and Governance Alignment | 80 | 2 | 1.34% | 40 | Policy packs, governance approvals, pre-commit gate, dry-run/simulation, audit events, and starter bundles are meaningful. More buyer-friendly mapping from policy to outcome is needed. | Strong governance can intimidate smaller teams. | Add policy-pack chooser, simulation summaries, and waiver lifecycle views. | Fixable in V1. |
| 26 | Data Consistency | 84 | 2 | 1.41% | 32 | Proof-packet data-consistency summaries, orphan KPI classification, and collect-first-pilot probes promote HOLD on inconsistent sponsor exports. Full tenant orphan auto-quarantine remains off by design. | Strict consistency can slow hot paths; deferred remediation can preserve availability. | Wire full tenant probes into per-run proof-packet CLI when API exposes them. | Fixable in V1. |
| 27 | Explainability | 85 | 2 | 1.34% | 40 | Explanation endpoints, aggregate summaries, provenance links, structured confidence, review-detail banner, proof-packet limitations, DOCX/PDF export callouts, and **OpenAPI-backed TS types** exist. | Too much explanation can obscure the recommended action. | Keep unsupported/low-confidence states prominent across exports. | Fixable in V1 — **#20 partial 2026-05-30**. |
| 28 | Cognitive Load | 72 | 1 | 0.55% | 34 | Operator onboarding, review-new, audit, governance, and wizard surfaces now route help in-app instead of GitHub blobs. First-time evaluators still need guided path discipline. | Precision and enterprise controls create necessary complexity. | Collapse first-session choices and use one-screen pass/warn/hold language everywhere. | Fixable in V1 — **#9 partial 2026-05-30**. |
| 29 | Availability | 70 | 1 | 0.59% | 30 | SLO targets, probe rollup script, and **documented Enterprise 99.9% / credit posture** exist. Production probe evidence and contractual performance remain pre-contractual. | Avoiding premature SLA claims is honest. | Collect production probe artifacts and link rollups to trust center. | Partly V1; contractual SLA needs production evidence. |
| 30 | Performance | 68 | 1 | 0.57% | 32 | Caches, limits, profiling hooks, rate limits, and some load testing exist. Evidence is still thin for graph/proof/retrieval paths under realistic tenant scale. | Early deep optimization could distract from correctness. | Add p95 dashboards and load budgets for run detail, proof bundles, graph, retrieval, and PDF/DOCX generation. | Fixable in V1. |
| 31 | Scalability | 69 | 1 | 0.58% | 31 | Tenant database topology, background workers, optional caches, queue concepts, and Azure-native deployment posture support scale. Multi-region active/active and distributed graph cache are out of scope. | Single-region and optional cache are appropriate for current scale. | Validate multi-replica behavior, cache coherence, and tenant-scale query budgets. | Fixable for V1 scale; multi-region/dedicated cache expansion deferred. |
| 32 | Customer Self-Sufficiency | 76 | 1 | 0.59% | 30 | Operator quickstarts, first-pilot path, config lint, CLI doctor, support bundles, procurement pack, and in-app help across onboarding/review/audit surfaces exist. Buyers still need some repo/runbook concepts for advanced ops. | Guided pilots reduce risk while self-service matures. | Simplify preflight outputs; keep doc-index developer URLs out of primary UI. | Fixable in V1 — **#9 partial 2026-05-30**. |
| 33 | Deployability | 78 | 1 | 0.62% | 26 | Docker, compose, Terraform examples, production readiness drill pack, release scripts, and **hosted prod sync script** exist. Full container/API/worker composition in prod root remains incremental. | Modular IaC is flexible but can fragment operator paths. | Compose API/worker/SQL/storage into prod root (#8). | Fixable in V1/V1.1 engineering — **#8 partial 2026-05-30**. |
| 34 | Template and Accelerator Richness | 72 | 1 | 0.61% | 28 | Starter docs, proof packets, policy packs, runbooks, and demo concepts exist. The selector and dry-run validation need more structure. | Too many templates would create maintenance load. | Add metadata, chooser, and dry-run validation for a small number of high-value packs. | Fixable in V1. |
| 35 | Auditability | 88 | 2 | 1.48% | 24 | Typed audit catalog plus proof-packet **`audit-evidence-summary.md/json`** provide buyer-safe audit evidence without raw payloads. | Detailed audit trails create sensitive payload risk. | Extend audit summary event categories when audit read API exposes them. | Fixable in V1 — **#7 shipped 2026-05-30**. |
| 36 | Documentation | 90 | 1 | 0.65% | 23 | In-app help registry covers operator onboarding, review-new, audit, governance, core-pilot, and configuration reference; blob guard scans `src/components`; primary operator UI no longer imports `HelpLink`. Developer doc-index GitHub URLs remain for search index only. | Repo-authored docs are efficient but not a product UX. | Resolve doc-index redirect stubs for buyer-mapped titles only. | Fixable in V1 — **#9 partial 2026-05-30**. |
| 37 | Extensibility | 73 | 1 | 0.61% | 27 | Custom handler docs and modular handler architecture exist; public plugin SDK and marketplace are intentionally out of scope. Extensibility is good for advanced implementers, not turnkey for third parties. | Resisting a public SDK avoids premature platform commitments. | Improve handler registration examples and enforce handler safety/contracts. | V1 docs fixable; ecosystem surfaces deferred. |
| 38 | Manageability | 75 | 1 | 0.62% | 26 | Config catalog, admin diagnostics, linting, health checks, audit search, support bundles, operator runbooks, and LLM cost/budget command center exist. Manageability still depends on expert operators for edge cases. | Rich configuration is powerful but can overwhelm. | Add admin command-center summaries and environment readiness disposition. | Fixable in V1 — **#14 partial 2026-05-30**. |
| 39 | Cost-Effectiveness | 80 | 1 | 0.64% | 24 | LLM budgets, cost estimation, token telemetry, pricing model, cache options, hard cutoffs, top-run ranking, and **budget PASS/WARN/HOLD on command center** exist. Invoice reconciliation remains out of scope. | More evaluation improves quality but consumes LLM budget. | Add eval spend caps and cost-per-proof reporting. | Fixable in V1 — **#14 partial 2026-05-30**. |
| 40 | Supportability | 83 | 1 | 0.70% | 17 | Correlation IDs, support bundles, triage drill catalog, redaction manifests, and **SUPPORT_POLICY.md** improve diagnostics and commercial clarity. | Rich diagnostics reduce support load but expose more data to redact. | Expand triage drills and LLM cost command center. | V1 — **#24 shipped 2026-05-30**. |
| 41 | Testability | 85 | 1 | 0.71% | 15 | Broad test projects plus environment-gated golden cohort workflow and scoped IDOR/contract tests. Full real-mode coverage still costs secrets and budget. | Deterministic simulator tests are fast but not enough for AI behavior. | Expand golden cohort agent coverage and real-mode budget policy. | Fixable in V1 — **#3 shipped**. |

## 4. Top 12 Most Important Weaknesses

1. Real-mode AI correctness is not yet proven broadly enough across recurring, representative full-pipeline runs.
2. Adoption still requires too much operator knowledge before a buyer sees the first trustworthy outcome.
3. Retrieval quality, tenant filtering, and evidence faithfulness need stronger measurable gates.
4. The commercial story is credible but too dense; buyers need a sharper proof-first path.
5. Production-like hosted IaC needs stronger default composition for Azure OpenAI, Azure AI Search, Key Vault, private endpoints, diagnostics, and configuration outputs.
6. In-app documentation is not yet fully productized; some buyer/operator paths still leak repo/GitHub concepts.
7. ROI outputs are useful but need stricter source-confidence, stale-source, and demo/synthetic guardrails.
8. Repeat-use loops after the first review are less obvious than the initial pilot path.
9. Procurement packs are honest with strict mode; SOC 2 CPA and third-party pen-test publication remain `(B)`/backlog.
10. UI/API drift and multiple run/review DTO shapes still create correctness and cognitive-load risk.
11. Reliability evidence is stronger in design than in production-like proof, especially for LLM, retrieval, worker, and availability behavior.
12. The codebase is modular but large; compatibility stubs, overlapping docs, and many modes increase maintenance and onboarding cost.

## 5. Top 6 Monetization Blockers

1. The first value moment still needs guidance; low-touch buyers may not reach a sponsor-ready proof package unaided.
2. ROI claims are not yet mechanically constrained enough to prevent stale/demo/low-confidence evidence from weakening buyer trust.
3. The category narrative needs sharper contrast against generic AI assistants, cloud-native assessment tools, and consulting deliverables.
4. Sales-led quote flow is workable, but follow-up, buyer packet generation, and close-readiness automation need polish.
5. Procurement friction around SOC 2 CPA, third-party pen test, public references, and contractual support will slow some enterprise deals, even though excluded from `(A)`.
6. Repeat-use and expansion levers are less visible than initial review creation, weakening the path from pilot to paid expansion.

## 6. Top 6 Enterprise Adoption Blockers

1. Production-like setup remains too multi-step across auth, SQL, Azure OpenAI, Azure AI Search, Key Vault, telemetry, and evidence ingestion.
2. Security reviewers will demand clearer proof that tenant scope, retrieval results, audit exports, and generated artifacts cannot cross boundaries (IDOR tests expanded; full matrix still partial).
3. In-app documentation improved but buyer-facing GitHub links remain in some trust/admin footers by design.
4. Production availability evidence still needs live production probe windows — support/SLA terms are now documented.
5. Default hosted Terraform composition (`infra/terraform/prod`) for OpenAI/Search/Key Vault is not yet in repo.
6. Operators need clearer command-center disposition for all blockers (config lint, trial limits, governance holds) on the first screen.

## 7. Top 6 Engineering Risks

1. LLM output can appear authoritative before grounding, retrieval, and source-confidence checks are strong enough.
2. Scope/identity mismatches are high-impact because tenant isolation is central to the product promise.
3. IaC runtime dependencies can drift from production-like expectations if OpenAI/Search/Key Vault/diagnostics are not composed as one deployable path.
4. Multiple API/UI read shapes can hide blockers or create inconsistent operator decisions.
5. Long-running worker, queue, dead-letter, and partial-failure behavior needs more operator-visible evidence.
6. Documentation abundance can mask stale, conflicting, or buyer-unsafe paths unless registry and lint rules keep it controlled.

## 8. Most Important Truth

ArchLucid is strong enough for guided, evidence-backed V1 pilots, but not yet simple, proven, or trust-automated enough for broad low-touch enterprise adoption.

## 9. Top Improvement Opportunities

### COMPLETED: 1. Production-Like Scope and Identity Reconciliation

**Why it matters:** Tenant isolation is the core trust promise; any ambiguity between authenticated identity, API keys, client headers, and tenant/workspace/project scope is existential.

**Expected impact:** Reduces IDOR and cross-tenant evidence risk.

**Affected qualities:** Security, Trustworthiness, Correctness, Data Consistency, Procurement Readiness.

**Actionability:** Fully actionable now.

**Impact of running the prompt:** Directly improves Security (+6-8 pts), Trustworthiness (+4-6 pts), Correctness (+2-4 pts), Procurement Readiness (+2-3 pts). Weighted readiness impact: +0.4-0.7%.

**Cursor prompt:** Harden production-like scope resolution so `tenantId`, `workspaceId`, and `projectId` cannot be selected solely by client-controlled headers when authenticated identity or API key tenant binding exists. Inspect `ArchLucid.Api` authentication/scope middleware, `IScopeContextProvider`, API key auth, JWT/OIDC claim mapping, SAML claim mapping, development bypass, and tests under `ArchLucid.Api.Tests/Security`. Implement a reconciliation policy: authenticated claims/configured tenant bindings win; mismatched client scope headers return 403 Problem+JSON with correlation ID; development bypass remains explicit and documented for local/test only. Add integration tests for API key, JWT/OIDC, SAML-claim, and development bypass behavior, including rejected cross-tenant header attempts. Acceptance criteria: production-like modes reject header/identity mismatch; existing local developer flows still pass; error bodies include stable type, status, title, and correlation ID; no route shape or DTO change is required. Constraints: do not change tenant database topology, do not weaken dev/test ergonomics, and do not add a parallel scope model.

### COMPLETED: 2. Retrieval Grounding Quality Gate

**Why it matters:** AI correctness depends on retrieved evidence being tenant-scoped, relevant, and cited; weak RAG creates confident but untrustworthy findings.

**Expected impact:** Makes agent output safer and more measurable.

**Affected qualities:** AI/Agent Readiness, Cutting-Edge AI Technology, Correctness, Trustworthiness, Explainability.

**Actionability:** Fully actionable now.

**Impact of running the prompt:** Improves AI/Agent Readiness (+5-7 pts), Cutting-Edge AI Technology (+4-6 pts), Correctness (+3-5 pts), Trustworthiness (+3-4 pts). Weighted readiness impact: +0.8-1.2%.

**Cursor prompt:** Add a retrieval grounding quality gate for production-like and sponsor-handoff profiles. Start with `ArchLucid.Retrieval`, `ArchLucid.AgentRuntime`, `AgentRetrievalGroundingTraceCoverageRegistry`, `RetailPriceRetrievalGroundingTraceMapper`, `CONFIGURATION_REFERENCE.md`, and related tests. Define deterministic metrics for tenant-scoped retrieval coverage, cited evidence ratio, empty-result handling, stale/mismatched corpus kind, and forbidden cross-tenant leakage. Wire results into agent execution traces and sponsor-handoff proof disposition as PASS/WARN/HOLD. Acceptance criteria: tests prove tenant scope filters are applied, missing or low-confidence retrieval produces WARN/HOLD, cited evidence appears in trace output, and production-like config can require Azure AI Search without falling back silently to in-memory retrieval. Constraints: do not introduce V2 agentic retrieval, HyDE, fine-tuning, or cross-tenant text retrieval; keep the gate deterministic and cheap.

### COMPLETED: 3. Real-Mode Golden Cohort Evidence Gate

**Why it matters:** Simulator correctness is not enough for buyer trust in real AI output.

**Expected impact:** Creates recurring evidence that real Azure OpenAI execution remains stable, grounded, and budget-bounded.

**Affected qualities:** AI/Agent Readiness, Correctness, Testability, Trustworthiness, Cost-Effectiveness.

**Actionability:** Partially actionable now; use simulator-safe structure and environment-gated real execution without needing owner secrets.

**Impact of running the prompt:** Improves AI/Agent Readiness (+4-6 pts), Correctness (+3-5 pts), Testability (+4-5 pts), Cost-Effectiveness (+2-3 pts). Weighted readiness impact: +0.6-1.0%.

**Cursor prompt:** Build an environment-gated golden cohort evidence workflow that can run in simulator mode by default and real Azure OpenAI mode only when protected secrets are present. Start with `.github/workflows/real-llm-golden-cohort.yml`, `ArchLucid.AgentRuntime.Tests/DriftDetection`, `RealLiveAoaiTestConfiguration`, `GoldenCohortLiveAoaiExecutorFactory`, and docs under `docs/quality`. Capture per-run manifest hash, agent output schema validity, grounding ratio, token/cost estimate, failure reason, and artifact location. Acceptance criteria: simulator mode is deterministic and CI-safe; real mode skips with an explicit neutral status when secrets are absent; real mode enforces a token/dollar cap; evidence is written as buyer-safe markdown/JSON; failing schema/grounding breaks the gated job only when real mode is explicitly enabled. Constraints: do not require Azure credentials for normal CI; do not store prompts containing secrets; do not use prior assessment scores as baseline.

### PARTIAL (2026-05-30): 4. First-Pilot Command Center

**Delivered (batch 4):** `FirstPilotOperatingRail` header + step troubleshoot links route to `/help/*` via `InAppHelpLink`; `first-pilot-path` registry topic; config-lint readiness row on the cockpit (admin → `/admin/health`).

**Delivered (batch 5):** cockpit loads `GET /v1/admin/config-lint` for admins and maps blocking/advisory counts to ready/attention/blocked.

**Remaining:** none for static row wiring — future: surface top blocking rule names inline without opening admin health.

**Why it matters:** Time-to-value and adoption friction improve when the user sees one obvious path, not a map of the whole product.

**Expected impact:** Shortens first proof time and lowers support load.

**Affected qualities:** Time-to-Value, Adoption Friction, Usability, Cognitive Load, Customer Self-Sufficiency.

**Actionability:** Fully actionable now.

**Impact of running the prompt:** Improves Adoption Friction (+5-7 pts), Time-to-Value (+3-5 pts), Usability (+5-7 pts), Cognitive Load (+8-10 pts). Weighted readiness impact: +0.6-0.9%.

**Cursor prompt:** Create a first-pilot command center in the operator UI that shows the minimum path: configure/check environment, create review, attach evidence, execute, commit, review proof package, export/share. Start with `archlucid-ui/src/app/(operator)/dashboard`, run/review detail components, `docs/runbooks/FIRST_PILOT_OPERATOR_PATH.md`, and the existing trial/status endpoints. Render PASS/WARN/HOLD state, next action, blocking reason, and documentation links through in-app help routes. Acceptance criteria: a new evaluator can identify the next required action from the dashboard; hidden blockers such as failed config lint, missing evidence, failed execution, governance holds, or trial limits are visible; links open `/help/*` pages; tests cover each state. Constraints: do not remove advanced navigation; do not add new backend endpoints unless current DTOs lack required fields; do not expose GitHub blob links in primary product UI.

### PARTIAL (2026-05-30): 5. Run Detail Decision Surface Completion

**Delivered (batch 7):** OpenAPI snapshot refresh + `api-types.generated.ts` regen; `RunDetailDto` forensics fields on live schema; `ProofSurfaceContractRegistry` includes `RunExplanationSummary`.

**Remaining:** NSwag .NET client regen in CI workflows when intentionally bumped; legacy `/runs` route alias parity is N/A (reviews route is canonical).

**Why it matters:** Operators need to see blockers, trust evidence, cost/LLM signals, and governance warnings before making a decision.

**Expected impact:** Reduces false confidence and support escalations.

**Affected qualities:** Correctness, Usability, Explainability, Trustworthiness, Executive Value Visibility.

**Actionability:** Fully actionable now.

**Impact of running the prompt:** Improves Correctness (+3-4 pts), Usability (+4-6 pts), Explainability (+3-5 pts), Trustworthiness (+2-4 pts). Weighted readiness impact: +0.4-0.7%.

**Cursor prompt:** Complete the run/review detail API and UI decision surface so live cost estimate, trust evidence, agent result summary, last failure reason, governance warning state, finding coverage, retrieval grounding, and proof disposition are visible in one operator screen. Start with `ArchLucid.Core/Persistence/ApplicationPorts/Queries/RunDetailDto.cs`, `AuthorityRunDetailOperatorEnricher`, `ArchLucid.Api.Tests/Contracts/RunDetailDtoOpenApiContractTests.cs`, generated clients, and `archlucid-ui/src/app/(operator)/runs` / review detail components. Acceptance criteria: OpenAPI exposes required fields; generated .NET/TS clients update; UI renders warning/danger states for hidden blockers; tests prove fields populate when source data exists and degrade gracefully when absent. Constraints: do not create a parallel endpoint; do not duplicate backend business classification in the UI; preserve existing route compatibility.

### COMPLETED: 6. ROI Source-Confidence Enforcement

**Follow-up (2026-05-30):** `PilotRunDeltasResponse.RoiSourceFreshnessDisposition` populated server-side from `RoiMetricSourceFreshnessRules`; first-screen proof status UI consumes the field.

**Why it matters:** ROI claims are monetization-critical and easy to overstate if demo, stale, synthetic, or fallback data is not clearly labeled.

**Expected impact:** Makes sponsor-facing value claims more defensible.

**Affected qualities:** Proof-of-ROI Readiness, Executive Value Visibility, Trustworthiness, Marketability.

**Actionability:** Fully actionable now.

**Impact of running the prompt:** Improves Proof-of-ROI Readiness (+6-8 pts), Executive Value Visibility (+3-5 pts), Trustworthiness (+2-4 pts). Weighted readiness impact: +0.4-0.7%.

**Cursor prompt:** Add ROI source-confidence enforcement across executive summary, first-value report, pilot deltas, and proof packets. Start with `ArchLucid.Application/Roi`, `ExecutiveRoiSummaryService`, `FirstValueReportBuilder`, `PilotRunDeltasResponseMapper`, `ArchLucid.Contracts/Roi`, and related tests. Add structured source kinds, collection timestamps, demo/synthetic flags, stale-source thresholds, and confidence labels. Acceptance criteria: sponsor-facing ROI output labels source and confidence; stale or demo-only data cannot render as unqualified savings; tests cover real extractor data, retail-price fallback, demo tenant, missing costs, and duplicate finding dedupe. Constraints: do not change pricing figures; do not invent savings when source data is absent; keep labels concise.

### COMPLETED: 7. Proof Bundle Audit Evidence Summary

**Why it matters:** Enterprise buyers need audit evidence without receiving raw sensitive audit payloads.

**Expected impact:** Improves trust-pack usefulness and reduces security-review back-and-forth.

**Affected qualities:** Auditability, Procurement Readiness, Traceability, Trustworthiness, Supportability.

**Actionability:** Fully actionable now.

**Impact of running the prompt:** Improves Auditability (+4-5 pts), Procurement Readiness (+3-4 pts), Traceability (+2-3 pts), Supportability (+2-3 pts). Weighted readiness impact: +0.25-0.45%.

**Cursor prompt:** Extend proof bundle generation to include a buyer-safe audit evidence summary. Start with `ArchLucid.Cli/Commands/PilotProofPacketCommand.cs`, proof packet builders, audit read paths, `AUDIT_COVERAGE_MATRIX.md`, and CLI tests. Generate `audit-evidence-summary.md` and `audit-evidence-summary.json` with event categories, event ids, correlation ids, actor class, run/manifest linkage, omitted sensitive fields, retention posture, and export caveats. Acceptance criteria: proof bundles include the files; no raw payload secrets or PII are emitted; missing expected audit rows produce WARN/HOLD according to existing proof vocabulary; tests cover redaction and empty-audit cases. Constraints: do not expose full audit `DataJson`; do not weaken existing audit exports; keep output deterministic.

### PARTIAL (2026-05-30): 8. Hosted Terraform Runtime Parity

**Delivered (batch 5):** optional `enable_private_endpoints` + `private_endpoint_subnet_id` in `deploy/hosted-prod-terraform/` with OpenAI and Search private endpoint resources and outputs.

**Delivered (batch 7):** Key Vault private endpoint + optional `workload_identity_principal_id` Secrets User RBAC; `scripts/ci/sync-hosted-prod-terraform-to-infra.ps1` mirrors scaffold into `infra/terraform/prod`.

**Remaining:** full API/worker/SQL/storage composition in prod root; validate mirrored infra in CI when `infra/` tree is writable in agent sessions.

**Why it matters:** Production-like SaaS readiness requires IaC to provision the runtime dependencies the app assumes.

**Expected impact:** Reduces deployment errors and enterprise implementation risk.

**Affected qualities:** Azure Compatibility and SaaS Deployment Readiness, Deployability, Security, Reliability, Manageability.

**Actionability:** Fully actionable now.

**Impact of running the prompt:** Improves Azure Compatibility (+7-9 pts), Deployability (+6-8 pts), Security (+2-4 pts), Reliability (+2-3 pts). Weighted readiness impact: +0.35-0.6%.

**Cursor prompt:** Compose Azure OpenAI, Azure AI Search, Key Vault private endpoint/RBAC, diagnostics, and application settings outputs into the default hosted Terraform path. Start with `infra/terraform`, any existing `infra/terraform-openai` or Search-related modules, `docs/library/IAC_RUNTIME_PARITY.md` if present, `CONFIGURATION_REFERENCE.md`, and deployment docs. Acceptance criteria: a production-like hosted stack can declare OpenAI/Search dependencies in Terraform; outputs can populate API/worker config; private endpoint and managed identity options are documented; diagnostic settings are included; validation docs explain regional capacity and opt-out/bring-your-own cases. Constraints: do not hardcode unavailable model SKUs; do not require public network exposure; do not store secrets in state beyond normal provider constraints; keep modules reusable.

### PARTIAL (2026-05-30): 9. In-App Documentation Link Purge

**Delivered (batch 4):** `FirstPilotOperatingRail` no longer uses GitHub blob `HelpLink`; `first-pilot-path` added to `product-documentation-registry.ts`; blob guard scans the rail component.

**Delivered (batch 6):** Operator home, core-pilot checklist/cards, pilot baseline wizard, and pilot start strip use `InAppHelpLink` with registry slugs (`core-pilot`, `first-value-20-minutes`, `pilot-roi-model`, `cli-usage`); doc-index pilot guide → `/help/pilot-guide`; blob guard scans core-pilot components.

**Delivered (batch 7):** Onboarding, review-new, run detail header, audit, governance dashboard, core-pilot wizard, JWT callout, and wizard extractor field use `InAppHelpLink`; blob guard scans all `src/components` except `HelpLink.tsx`.

**Remaining:** doc-index retains developer GitHub URLs for full-text search (not linked from primary operator UI).

**Why it matters:** Raw GitHub links make the product feel unfinished to regulated buyers.

**Expected impact:** Lowers adoption friction and improves market polish.

**Affected qualities:** Usability, Documentation, Marketability, Cognitive Load, Customer Self-Sufficiency.

**Actionability:** Fully actionable now.

**Impact of running the prompt:** Improves Usability (+5-7 pts), Documentation (+6-8 pts), Marketability (+2-3 pts), Cognitive Load (+4-6 pts). Weighted readiness impact: +0.3-0.5%.

**Cursor prompt:** Complete the product documentation presentation standard by routing buyer/operator help links to in-app help pages instead of GitHub blob URLs. Start with `docs/library/PRODUCT_DOCUMENTATION_PRESENTATION.md`, `archlucid-ui/src/components/HelpPanel.tsx`, `archlucid-ui/src/lib/contextual-help-content.ts`, `archlucid-ui/public/doc-index.json`, `/help/{topic}` renderer, and `product-documentation-registry.ts`. Add a lint/test guard that fails new customer-facing GitHub blob links except optional developer/admin source footers. Acceptance criteria: pilot guide, getting started, evidence intake, review packages, executive summary, governance, audit trail, and troubleshooting open in-app; redirect stubs are resolved to canonical sources; broken source paths fail tests. Constraints: do not expose internal-only docs; do not remove GitHub as contributor source of truth.

### COMPLETED (2026-05-30): 10. Starter Proof Pack Metadata and Dry-Run Harness

**Delivered:** `check_starter_proof_packs.py` wired in CI; `StarterProofPackArchitectureRequestDryRunTests`; `sourceConfidence` + `acceptanceChecks` on all four packs.

**Why it matters:** Templates accelerate adoption only if users can choose the right one and prove it works safely.

**Expected impact:** Improves first-value speed and repeatability.

**Affected qualities:** Template and Accelerator Richness, Time-to-Value, Marketability, Correctness.

**Actionability:** Fully actionable now.

**Impact of running the prompt:** Improves Template and Accelerator Richness (+10-12 pts), Time-to-Value (+2-3 pts), Correctness (+2-3 pts). Weighted readiness impact: +0.2-0.35%.

**Cursor prompt:** Add metadata and a dry-run harness for starter proof packs. Start with `templates/starter-proof-packs`, `docs/runbooks/FIRST_PILOT_OPERATOR_PATH.md`, proof packet docs, and test projects that can run simulator-mode fixtures. Define metadata fields: buyer job, required inputs, expected outputs, source confidence, scope label, “do not use when,” deferred-boundary notes, and acceptance checks. Acceptance criteria: each starter pack has metadata; a chooser markdown/index is generated; CI/test validates broken links, placeholder tokens, unsafe claims, and deterministic dry-run output; non-runnable packs are explicitly marked with rationale. Constraints: do not create many new templates; improve selection and safety first; no Azure credentials or real LLM required.

### COMPLETED: 11. Agent Output Faithfulness Defaults for Sponsor Handoff

**Why it matters:** Sponsor-facing pilots should not rely on warn-only agent quality gates.

**Expected impact:** Reduces unsupported AI claims in buyer artifacts.

**Affected qualities:** AI/Agent Readiness, Correctness, Trustworthiness, Explainability.

**Actionability:** Fully actionable now.

**Impact of running the prompt:** Improves AI/Agent Readiness (+4-6 pts), Correctness (+2-4 pts), Trustworthiness (+3-4 pts). Weighted readiness impact: +0.5-0.8%.

**Cursor prompt:** Make sponsor-handoff profiles require pilot-strict agent output faithfulness thresholds and clear failure disposition. Start with `ArchLucid:AgentOutput:QualityGate` config, options validation, `AgentOutputEvaluationRecorder`, proof packet generation, `CONFIGURATION_REFERENCE.md`, and tests. Acceptance criteria: production-like sponsor handoff fails fast or emits HOLD when required faithfulness support ratio is unset or not met; simulator/dev defaults remain ergonomic; proof packets explain rejected/held outputs; tests cover config validation, low-support result, and pass case. Constraints: do not break local development; do not add LLM judge dependency to required CI; keep thresholds configurable.

### COMPLETED: 12. Procurement Pack Strictness and Freshness Gate

**Why it matters:** A procurement pack with stale metadata, placeholders, or unsafe caveats damages trust more than no pack.

**Expected impact:** Improves enterprise review readiness.

**Affected qualities:** Procurement Readiness, Compliance Readiness, Trustworthiness, Documentation.

**Actionability:** Fully actionable now.

**Impact of running the prompt:** Improves Procurement Readiness (+4-6 pts), Compliance Readiness (+3-4 pts), Trustworthiness (+2-3 pts). Weighted readiness impact: +0.25-0.4%.

**Cursor prompt:** Harden procurement-pack generation with strict freshness, placeholder, and buyer-safety checks. Start with `scripts/build_procurement_pack.py`, `scripts/procurement_pack_canonical.json`, `docs/go-to-market/TRUST_CENTER.md`, `HOW_TO_REQUEST_PROCUREMENT_PACK.md`, `ASSURANCE_STATUS_CANONICAL.md`, and CLI procurement-pack command/tests. Acceptance criteria: strict mode fails on unresolved placeholders, missing Last reviewed metadata, missing canonical files, unsafe “certified/attested” wording, or absent redaction report; default mode remains usable with warnings; output manifest includes SHA-256, bytes, git commit --trailer "Co-authored-by: Cursor <cursoragent@cursor.com>", UTC timestamp, and omissions. Constraints: do not claim SOC 2 CPA or third-party pen-test completion; do not include buyer-specific names from templates.

### COMPLETED: 13. Data Consistency Sponsor-Handoff Holds

**Why it matters:** Proof packets and sponsor exports should not proceed silently when orphaned or inconsistent persisted objects exist.

**Expected impact:** Prevents corrupted proof surfaces.

**Affected qualities:** Data Consistency, Correctness, Reliability, Trustworthiness.

**Actionability:** Fully actionable now.

**Impact of running the prompt:** Improves Data Consistency (+5-7 pts), Correctness (+2-4 pts), Reliability (+2-3 pts). Weighted readiness impact: +0.25-0.45%.

**Cursor prompt:** Promote data consistency findings into sponsor-handoff PASS/WARN/HOLD decisions. Start with `DataConsistency` options, orphan probes/remediation services, proof packet builders, run detail enrichment, and tests around golden manifests, comparison records, findings snapshots, artifacts, and audit links. Acceptance criteria: sponsor proof generation checks relevant consistency probes; known orphan conditions produce HOLD with remediation guidance; dry-run remediation remains available; production auto-quarantine stays off unless explicitly configured. Constraints: do not delete data automatically in default mode; do not block ordinary read-only inspection; preserve existing admin diagnostics.

### PARTIAL (2026-05-30): 14. LLM Cost and Budget Command Center

**Delivered:** `LlmCostCommandCenterSummaryCard` on Settings → Cost reporting (UTC month/today rollup, top workspace/project); existing budget meter retained.

**Delivered (batch 5):** `TenantLlmCostTopRunRanker` + `TopRuns` on reporting API; command center card shows top expensive review.

**Delivered (batch 6):** `buildLlmBudgetCommandCenterSummary` + PASS/WARN/HOLD banner on command center card (UTC-month hard cap / warn fraction).

**Remaining:** invoice reconciliation out of scope.

**Why it matters:** Hosted AI economics must be visible before cost surprises appear.

**Expected impact:** Improves SaaS margin control and buyer transparency.

**Affected qualities:** Cost-Effectiveness, Manageability, Supportability, AI/Agent Readiness.

**Actionability:** Fully actionable now.

**Impact of running the prompt:** Improves Cost-Effectiveness (+8-10 pts), Manageability (+2-3 pts), Supportability (+2-3 pts), AI/Agent Readiness (+1-2 pts). Weighted readiness impact: +0.15-0.3%.

**Cursor prompt:** Add an operator LLM cost/budget command center for tenant token usage, estimated spend, budget warnings, hard cutoff status, wallet/top-up state where enabled, and recent expensive operations. Start with LLM budget services, audit events, `RunAgentExecutionLlmCostEstimateAppender`, admin/operator UI routes, and tests. Acceptance criteria: UI/API show current UTC-day/month consumption, included/hard cutoff bands, recent warnings, and per-run estimates; no raw prompts or completions are exposed; simulator/echo providers are labeled excluded; tests cover budget approaching, cutoff, and no-data cases. Constraints: do not treat estimates as invoices; do not add Stripe charges unless existing wallet flows already support them.

### PARTIAL (2026-05-30): 15. Policy Pack Chooser and Simulation Summary

**Delivered:** `buildPolicyPackSimulationSummary` + operator summary block in `GovernanceDryRunModal`; catalog chooser pre-existing on policy-packs page.

**Why it matters:** Governance only creates value if operators can choose and understand policy packs without reading raw rule JSON.

**Expected impact:** Improves workflow embeddedness and stickiness.

**Affected qualities:** Policy and Governance Alignment, Stickiness, Usability, Executive Value Visibility.

**Actionability:** Fully actionable now.

**Impact of running the prompt:** Improves Policy/Governance (+4-6 pts), Stickiness (+2-4 pts), Usability (+2-4 pts). Weighted readiness impact: +0.25-0.45%.

**Cursor prompt:** Build a policy-pack chooser and simulation summary for default bundled packs. Start with default policy pack manifests, policy-pack APIs, dry-run endpoints, `DEFAULT_POLICY_PACKS_V1.md`, and operator UI governance pages. Acceptance criteria: operators can filter packs by buyer goal, risk domain, and required evidence; each pack shows what it checks, when not to use it, and expected impact; dry-run summary highlights would-block/would-warn findings in plain language; tests cover empty, incompatible, and successful simulation states. Constraints: do not claim statutory certification; do not mutate pack contents silently; preserve SemVer/versioning rules.

### PARTIAL (2026-05-30): 16. Queue, Dead-Letter, and Partial-Failure Operator View

**Delivered:** `OperatorOutboxDiagnosticsCard` on cost reporting (authority pipeline + integration DLQ depths with link to integration DLQ page).

**Why it matters:** Long-running analysis must be diagnosable when it fails halfway.

**Expected impact:** Improves reliability and supportability.

**Affected qualities:** Reliability, Supportability, Manageability, Correctness.

**Actionability:** Fully actionable now.

**Impact of running the prompt:** Improves Reliability (+4-6 pts), Supportability (+3-5 pts), Manageability (+2-4 pts). Weighted readiness impact: +0.2-0.35%.

**Cursor prompt:** Add an operator view and API summary for queued authority runs, failed stages, retryable dead letters, and partial-failure reasons. Start with authority orchestration state, integration outbox dead-letter diagnostics, background job/work-unit services, audit events, and admin diagnostics UI. Acceptance criteria: operators can see run id, stage, failure reason, retry/suppress eligibility, last attempt time, correlation id, and remediation link; actions are audited; read-only users cannot mutate; tests cover failed run, retryable outbox item, suppressed item, and no-issues state. Constraints: do not introduce Durable Task Framework or ACA Jobs; do not expose secrets from payloads.

### COMPLETED: 17. Production Availability Evidence Rollup

**Why it matters:** Availability targets are less persuasive without evidence windows.

**Expected impact:** Improves enterprise adoption and support readiness.

**Affected qualities:** Availability, Reliability, Procurement Readiness, Trustworthiness.

**Actionability:** Partially actionable now; produce tooling and buyer-safe format without promising contractual SLA terms.

**Impact of running the prompt:** Improves Availability (+6-8 pts), Reliability (+2-3 pts), Procurement Readiness (+2-3 pts). Weighted readiness impact: +0.15-0.3%.

**Cursor prompt:** Create a hosted availability evidence rollup that summarizes probe artifacts into buyer-safe monthly markdown/JSON without asserting contractual SLA performance. Start with `docs/runbooks/HOSTED_AVAILABILITY_ROLLUP.md`, `scripts/ops/summarize_hosted_probe_artifacts.py`, SLO docs, and trust center wording. Acceptance criteria: rollup includes probe window, target URL class, uptime calculation, exclusions, incidents, data gaps, and explicit non-contract caveat; missing production probe data renders INCONCLUSIVE rather than green; tests cover empty, partial, and successful probe sets. Constraints: do not claim production SLA compliance without production data and owner-approved contractual terms; do not expose internal hostnames or secrets.

### PARTIAL (2026-05-30): 18. Hot-Path Performance Budgets

**Delivered:** `docs/runbooks/HOT_PATH_PERFORMANCE_BUDGETS.md` + `scripts/ci/assert_hot_path_performance_budgets.py` in CI (registry check, not flaky timing gate).

**Why it matters:** Proof generation, graph views, run detail, and retrieval will shape perceived quality under real tenant use.

**Expected impact:** Prevents slow enterprise demos and hidden scaling regressions.

**Affected qualities:** Performance, Scalability, Reliability, Time-to-Value.

**Actionability:** Fully actionable now.

**Impact of running the prompt:** Improves Performance (+8-10 pts), Scalability (+3-5 pts), Time-to-Value (+1-2 pts). Weighted readiness impact: +0.15-0.3%.

**Cursor prompt:** Define and enforce hot-path performance budgets for run detail, proof bundle generation, graph projection, retrieval query, audit search, and PDF/DOCX export. Start with existing metrics, benchmark projects, k6/load scripts if present, OpenTelemetry instrumentation, and docs. Acceptance criteria: each path has p50/p95 budget, representative fixture, local/CI-friendly check or benchmark, and dashboard metric name; failures produce actionable output; tests avoid external cloud dependencies by default. Constraints: do not overfit to one machine; do not block broad CI on flaky timing unless thresholds are stable; keep cloud-dependent tests opt-in.

### PARTIAL (2026-05-30): 19. Architecture Invariant Enforcement Wave

**Delivered (batch 6):** `LlmCostGuardrailArchitectureTests` asserts INV-004 wiring (reporting service → budget repository + top-run ranker → trace repository).

**Delivered (batch 7):** `ReplayReadOnlyScopeArchitectureTests` asserts INV-013 replay wiring + integration guard file presence.

**Remaining:** additional INV-012 downstream consumer guards beyond options injection.

**Why it matters:** The repo’s modularity will decay unless architectural rules are executable.

**Expected impact:** Preserves maintainability as features grow.

**Affected qualities:** Architectural Integrity, Maintainability, Extensibility, Cognitive Load.

**Actionability:** Fully actionable now.

**Impact of running the prompt:** Improves Architectural Integrity (+3-5 pts), Maintainability (+4-6 pts), Extensibility (+2-3 pts). Weighted readiness impact: +0.25-0.45%.

**Cursor prompt:** Convert the highest-risk architecture invariants from `docs/library/ARCHITECTURE_INVARIANTS.md` into executable tests/analyzers. Start with dependency constraints, Authority-vs-coordinator routing, no coordinator-only public routes, audit/event matrix updates, SQL DDL discipline, and no inline/import rule equivalents where applicable. Acceptance criteria: tests fail with clear messages when invariant is violated; allowlists are explicit and shrinking; docs link each test to invariant ID; no product behavior changes. Constraints: do not create broad brittle text scans when semantic checks are available; keep enforcement scoped to high-risk invariants first.

### PARTIAL (2026-05-30): 20. Buyer-Safe Explanation Failure States

**Delivered (batch 4):** `RunExplanationConfidenceBanner` + `buildExplanationConfidenceSummary` on review detail (WARN/HOLD from faithfulness ratio, deterministic fallback, missing citations).

**Delivered (batch 5):** proof-packet `limitations.md` + `quote-to-proof-readiness.json` include `explanationConfidenceDisposition` from aggregate explain API.

**Delivered (batch 7):** `RunExplanationSummary` / nested explain DTOs re-exported from `api-types.generated.ts`; faithfulness ratio parsing accepts OpenAPI string/number wire forms.

**Remaining:** none for assessment #20 core scope.

**Why it matters:** Explanations are more trustworthy when they admit unsupported or low-confidence output.

**Expected impact:** Improves buyer confidence in AI-assisted decisions.

**Affected qualities:** Explainability, Trustworthiness, Correctness, Usability.

**Actionability:** Fully actionable now.

**Impact of running the prompt:** Improves Explainability (+4-6 pts), Trustworthiness (+2-4 pts), Correctness (+2-3 pts). Weighted readiness impact: +0.25-0.4%.

**Cursor prompt:** Add explicit low-confidence and unsupported-evidence states to explanation APIs, UI, and exports. Start with `/v1/explain` services, aggregate explanation summaries, provenance/evidence models, proof packet builders, and run detail UI. Acceptance criteria: low support ratio, missing evidence, stale source, and retrieval failure render as visible WARN/HOLD states; exports include concise caveats; tests cover supported, partial, and unsupported explanations. Constraints: do not suppress useful explanations entirely; do not expose raw prompt/response traces; keep legacy unsupported per-node explanation behavior unchanged.

### COMPLETED: 21. Commercial Quote Follow-Up Triage

**Why it matters:** Sales-led monetization needs fast response discipline while self-serve commerce remains intentionally held.

**Expected impact:** Improves decision velocity and revenue capture.

**Affected qualities:** Decision Velocity, Commercial Packaging Readiness, Marketability, Supportability.

**Actionability:** Fully actionable now.

**Impact of running the prompt:** Improves Decision Velocity (+5-7 pts), Commercial Packaging Readiness (+2-4 pts), Marketability (+1-2 pts). Weighted readiness impact: +0.15-0.25%.

**Cursor prompt:** Harden pricing quote request triage from public `/pricing` through admin follow-up. Start with marketing pricing quote request persistence, acknowledgment/close endpoints, aging response, operator UI admin page, notification docs, and tests. Acceptance criteria: quote rows show age, assigned owner, status, source tier, and next action; WARN/BREACH thresholds are visible; acknowledge/close actions are audited; no buyer PII leaks into logs; tests cover new, warned, breached, acknowledged, and closed states. Constraints: do not auto-provision tenants; do not require a CRM integration; do not change locked prices.

### PARTIAL (2026-05-30): 22. Review Terminology and DTO Drift Cleanup

**Delivered (batch 5):** expanded `review-terminology-guard.test.ts` for buyer-polished rail labels and buyer surface source scans.

**Remaining:** broader operator/marketing label snapshots; API route names unchanged by design.

**Why it matters:** Mixed “run/review/job” terminology increases user confusion and integration errors.

**Expected impact:** Lowers cognitive load and support cost.

**Affected qualities:** Cognitive Load, Usability, Documentation, Maintainability.

**Actionability:** Fully actionable now.

**Impact of running the prompt:** Improves Cognitive Load (+5-7 pts), Usability (+2-4 pts), Documentation (+3-4 pts). Weighted readiness impact: +0.15-0.3%.

**Cursor prompt:** Clean customer-facing terminology around review package vs run metadata without changing stable API route names. Start with `CONCEPT_VOCABULARY.md`, `GLOSSARY.md`, operator UI labels, marketing copy, in-app help, and generated docs. Acceptance criteria: buyer/operator UI uses “review” or “review package” as primary noun; technical IDs remain visible as metadata; route/API names are not changed; lint or snapshot tests guard key UI labels; docs explain `runId` as tracking metadata. Constraints: do not rename database columns or break API clients; do not churn internal developer docs unnecessarily.

### PARTIAL (2026-05-30): 23. Tenant-Scoped Retrieval and Audit Contract Tests

**Delivered:** TB-073 IDOR tests for `GET /v1/authority/runs/{id}/retrieval-grounding`, `GET /v1/authority/runs/{id}`, `GET /v1/explain/runs/{id}/aggregate`, and `GET /v1/explain/runs/{id}/findings/{findingId}/llm-audit`.

**Why it matters:** Retrieval and audit are powerful surfaces that must never leak cross-tenant data.

**Expected impact:** Strengthens enterprise trust and security review outcomes.

**Affected qualities:** Security, Traceability, Auditability, Correctness, Data Consistency.

**Actionability:** Fully actionable now.

**Impact of running the prompt:** Improves Security (+3-5 pts), Traceability (+2-3 pts), Auditability (+2-3 pts), Correctness (+1-2 pts). Weighted readiness impact: +0.25-0.45%.

**Cursor prompt:** Add tenant-scope contract tests for retrieval queries, audit search/export, traceability bundle generation, and proof packet reads. Start with retrieval tests, audit controller tests, scoped snapshot/read tests, RLS/session context helpers, and proof bundle tests. Acceptance criteria: tests seed two tenants and prove each surface only returns in-scope rows; cross-scope IDs return 404/403 as appropriate; correlation IDs remain visible; no broad admin-only bypass is used except where explicitly documented and tested. Constraints: do not rely on test ordering; keep SQL and in-memory parity where both modes exist; do not weaken admin diagnostics.

### COMPLETED: 24. Support and SLA Commercial Terms

**Why it matters:** Enterprise buyers need named support channels, response targets, escalation paths, maintenance windows, and credit posture before large purchases.

**Expected impact:** Improves procurement readiness and enterprise adoption now that owner terms are decided.

**Affected qualities:** Procurement Readiness, Supportability, Availability, Commercial Packaging Readiness.

**Actionability:** Fully actionable now (owner terms resolved 2026-05-30 — see decisions below).

**Owner-resolved terms (2026-05-30):**

- **Support tiers:**
  - `Team`: email support + documentation + **one** lightweight onboarding session or office-hours slot within the first 30 days (capacity permitting). Feature requests are non-committed product input only.
  - `Professional`: priority email support + **one** included onboarding call. Optional **paid** implementation/support add-ons and **paid** custom feature work (e.g., custom policy packs). Unpaid feature requests may go to backlog with no delivery commitment.
  - `Enterprise`: named support contact, **dedicated Microsoft Teams support channel** (support/onboarding channel, distinct from any first-party product Teams notification feature), priority escalation, and **negotiable deal-specific committed features** governed by deal economics (documented in the order form/SOW with scope, acceptance criteria, delivery window, reuse/IP terms, exclusions, and dependency fallback).
- **Coverage model (founder-operated phase):** support is defined by **business-day response targets measured from ticket receipt**, not fixed staffed hours, because the operator currently works a separate full-time role. Enterprise Severity 1 issues receive **best-effort immediate escalation**. Formal staffed coverage (likely a hired India-based rotation) is added as Enterprise demand requires. Do not publish a fixed staffed-hours promise.
- **Severity 1 (narrow definition):** hosted ArchLucid service broadly unavailable; customers blocked from committed review packages / evidence needed for an active procurement or governance deadline; or a suspected tenant data exposure / security incident. Everything else is lower severity.
- **Availability target (Enterprise):** **99.9% monthly** for the **hosted API + operator UI**, excluding planned maintenance, customer misconfiguration, preview/beta features, third-party cloud outages outside ArchLucid control, and force majeure. Published 99.9% remains an engineering target for Team/Professional (no credit).
- **Service credits (Enterprise only):** availability-based, **monthly capped**, the customer's **sole remedy**, with the exclusions above. Credits do not apply to support response-time targets.
- **Planned maintenance:** performed in a **published Sunday early-morning maintenance window** in the customer's primary region/time zone, with **≥72 hours' notice** for planned maintenance expected to affect availability, except emergency security maintenance.
- **Support intake:** email-first for Team/Professional; Enterprise also gets the dedicated Teams channel during onboarding.
- **Early-access posture:** during early access and initial enterprise pilots, ArchLucid includes **founder-led onboarding at no extra charge** (treated as product discovery and conversion work); this becomes a packaged guided pilot or implementation add-on as onboarding patterns stabilize. The existing **paid guided pilot credited on conversion** remains available for later enterprise sales.
- **Feature IP / reuse:** customer-funded or deal-included enhancements are **ArchLucid-owned and reusable by default**; customer-confidential data, configurations, and implementation details stay confidential; exclusivity requires a separate written, separately priced agreement. **Custom policy packs** offer **two options**: customer-exclusive (higher price, customer-confidential content) vs ArchLucid-owned reusable (lower price). Even for customer-exclusive packs, ArchLucid may reuse **generalized architecture lessons, non-confidential patterns, principles, and product improvements** (not proprietary rule text or confidential examples).
- **Professional services:** offered when they accelerate adoption — onboarding/first-review facilitation, evidence-intake setup, custom policy pack authoring, custom integration support, and architecture-review advisory. Default posture is **fixed-fee packages** for procurement; **ad-hoc day-rate/hourly** (≈$200/hr floor, billed in 30-minute or 1-hour increments, no hard minimum engagement) is the fallback for open-ended work. Bespoke work is billed; repeatable patterns are folded back into the product.

**Impact of running the prompt:** Improves Procurement Readiness (+4-6 pts), Supportability (+2-4 pts), Availability (+2-3 pts), Commercial Packaging Readiness (+2-4 pts). Weighted readiness impact: +0.2-0.35%.

**Cursor prompt:** Document the owner-resolved support, SLA, professional-services, and feature-commitment terms as buyer-facing commercial artifacts, without overpromising staffed hours or contractual claims the founder-operated phase cannot meet. Start with `docs/go-to-market/TRUST_CENTER.md`, `docs/go-to-market/SLA_SUMMARY.md`, `docs/library/SLA_TARGETS.md`, `docs/library/API_SLOS.md`, `docs/go-to-market/ORDER_FORM_TEMPLATE.md`, `docs/go-to-market/PROCUREMENT_OBJECTION_PLAYBOOK.md`, the support-bundle/runbook docs, and any support-policy doc (create `docs/go-to-market/SUPPORT_POLICY.md` if none exists). Encode: (1) per-tier support entitlements (Team / Professional / Enterprise) exactly as resolved; (2) business-day response-target model with best-effort Sev 1 escalation, explicitly stating staffed coverage scales with Enterprise demand; (3) the narrow Severity 1 definition; (4) Enterprise 99.9% monthly availability for hosted API + operator UI with stated exclusions; (5) Enterprise-only monthly-capped service credits as sole remedy; (6) Sunday early-morning maintenance window with ≥72h notice except emergency security maintenance; (7) Enterprise dedicated Teams support channel as a support commitment distinct from any first-party product Teams integration; (8) feature-commitment policy by tier and the ArchLucid-owned-reusable-by-default IP stance with the customer-exclusive vs reusable custom-policy-pack options; (9) professional-services menu with fixed-fee-default and ad-hoc hourly fallback. Acceptance criteria: each artifact states "available today vs planned" honestly; no SOC 2 CPA, ISO, or third-party pen-test completion is claimed; pricing figures continue to live only in the single-source pricing files and are linked, not restated; CI doc-freshness / pricing-single-source guards still pass; order-form/SOW language includes scope, acceptance criteria, delivery window, IP/reuse, exclusions, and dependency fallback for committed Enterprise features. Constraints: do not promise fixed staffed support hours; do not assert production SLA compliance without production evidence; do not duplicate price numbers outside the locked pricing source; do not change product code behavior.

### COMPLETED: 25. Production Readiness Drill Pack

**Why it matters:** A product can be well built but still fail a handoff if operators cannot rehearse deployment, rollback, recovery, and support evidence.

**Expected impact:** Turns deployment readiness from documentation into repeatable evidence.

**Affected qualities:** Deployability, Reliability, Availability, Supportability, Manageability.

**Actionability:** Fully actionable now.

**Impact of running the prompt:** Improves Deployability (+5-7 pts), Reliability (+2-4 pts), Availability (+2-4 pts), Supportability (+2-4 pts). Weighted readiness impact: +0.2-0.4%.

**Cursor prompt:** Create a production readiness drill pack that runs or documents the minimum repeatable rehearsal for deployment, health, config lint, smoke review, export, support bundle, backup/restore evidence, and rollback decision. Start with `V1_RELEASE_CHECKLIST.md`, `V1_RC_DRILL.md`, release-smoke scripts, support-bundle code, backup/DR docs, and Terraform deployment docs. Acceptance criteria: one markdown drill guide and one script or command sequence produce a timestamped evidence folder; each step emits PASS/WARN/HOLD; failures include next action; no secrets are written to artifacts; docs distinguish staging vs production evidence. Constraints: do not run destructive rollback automatically; do not require live Azure by default; keep cloud steps opt-in and clearly labeled.

## 10. Prompt Batching Guidance

### Batch 1 — Trust and Correctness Core

Run improvements 1, 2, 11, 20, and 23 together only if context allows. They share scope, retrieval, agent faithfulness, and explanation correctness. This is the highest-leverage engineering batch and should be kept separate from UI polish.

### Batch 2 — First-Value Product Experience

Run improvements 4, 5, 9, 10, and 22 together. They share operator UI, in-app docs, first-pilot flow, terminology, and proof pack selection. This batch improves adoption and marketability without touching deep AI internals.

### Batch 3 — ROI and Buyer Evidence

Run improvements 6, 7, 12, and 15 together. They share sponsor-facing proof, procurement evidence, ROI labeling, audit summaries, and governance packaging.

### Batch 4 — SaaS Operations and IaC

Run improvements 8, 13, 14, 16, 17, 18, and 25 in two sub-batches if needed. First do IaC/runtime parity plus production drill pack; then do budget, availability, performance, consistency, and dead-letter visibility.

### Batch 5 — Commercial Follow-Up

Run improvements 21 and 24 together because both are small, documentation-and-commercial focused, and share trust-center / order-form / procurement surfaces. Improvement 24 is now actionable (owner support/SLA terms resolved 2026-05-30).

## 11. Pending Questions for Later

### Support and SLA Commercial Terms — RESOLVED 2026-05-30

All blocking questions for this item were answered in the owner Q&A and are now encoded in Improvement #24 (no longer deferred). Remaining open detail is non-blocking: exact monthly service-credit percentages/schedule and the specific business-day response-target hours per severity can be finalized at first Enterprise contract.

### Hosted Terraform Runtime Parity

- Should the default hosted stack always create Azure OpenAI and Azure AI Search, or should it support a required bring-your-own existing resource mode for enterprise landing zones?
- Which Azure regions and model deployments should be documented as tested defaults without overpromising capacity?

### Production Availability Evidence Rollup

- Which URLs count as production probes for buyer-facing evidence?
- When, if ever, may a probe rollup be used as contractual SLA evidence rather than an internal/pre-contractual operating signal?

### Commercial Quote Follow-Up Triage

- Who is the default assigned owner for quote requests before a CRM exists?
- What are the WARN and BREACH thresholds for first response?

### Real-Mode Golden Cohort Evidence Gate

- Which protected GitHub Environment should hold real Azure OpenAI credentials?
- What monthly budget cap should be enforced for recurring real-mode cohort runs?

### Starter Proof Pack Metadata and Dry-Run Harness

- Which buyer jobs are the first three proof-pack scenarios to keep long term?
- Which synthetic/demo data labels are acceptable in public or prospect-facing packets?
