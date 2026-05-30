# ArchLucid Assessment – (A) Headline Readiness: 84.88%

This score represents the `(A)` headline readiness per `Assessment-Scope-V1_1.mdc`, excluding deferred items. It is a clean-slate, first-principles assessment of the current materials available in the repository. It does not use prior assessment scores or historical conclusions.

Deferred items explicitly excluded from the weighted `(A)` score include CPA SOC 2 attestation, ISO certification, signed design partner, owner-output GTM assets/cohorts, public third-party plugin SDK, MCP absence in V1, third-party plugin marketplace, participant assistive-technology user testing, third-party pen-test execution/publication, broad self-serve commerce un-hold, production availability evidence against contract-specific SLA terms, multi-region active/active guarantees, and other items documented as V1.1/V2 or owner/backlog scope.

Weighted calculation: total weighted points = `10,101 / 11,900 = 84.88%`.

**Batch A completed (2026-05-30):** Improvements **1, 2, 5, 7, 8, 16, 19** — in-app help routing, stale-claim reconciliation, claim-readiness checklist, procurement strict release gate, critical-docs drift guard, buyer/operator path chooser, accessibility disclosure sync.

**Batch B completed (2026-05-30):** Improvements **3, 4, 14, 15** — policy-pack retrieval safe defaults and Azure Search filter contract tests (verified in repo); tenant isolation verification pack generator; API auth behavior contract doc + tests + CI guard.

**Batch C completed (2026-05-30):** Improvements **9, 10, 11, 18, 24** — service-led SOW/quote template; execution-mode cross-surface invariant tests; ROI source consistency tests; policy-pack content quality harness + CI; repeat-review activation prompt on operator home.

**Batch D completed (2026-05-30):** Improvements **12, 13, 20, 21, 22, 25, 26** — hosted availability rollup CI tests; offline `auth sso-preflight`; LLM budget command-center test coverage; support incident-readiness drill CLI; maintainability boundary map generator; audit semantic invariants guard; capacity/performance evidence rollup.

**Batch E completed (2026-05-30):** Improvements **23, 27** — real-agent failure triage catalog/resolver with run metadata; CI guard and rollup without live AOAI; custom-handler extensibility readiness checklist and CI guard.

**Improvement #28 executed (2026-05-30, HOLD):** Credentialed local dev golden-cohort gate — topology smoke **PASS**, full pipeline merge **FAIL**; redacted metrics and gate artifacts archived under `artifacts/release/`; session record `docs/quality/REAL_LLM_SESSION_2026-05-30.md`. Multi-agent merge follow-up tracked separately (TB-138).

## 2. Executive Summary

### `(A)` Overall Headline Readiness

ArchLucid is a credible V1 pilot-ready architecture proof system. The current product boundary includes a hosted SaaS posture, a clear Pilot path, an Operate layer, committed manifests, artifacts, exports, governance workflows, policy packs, audit trails, tenant database topology, SCIM/SAML/OIDC posture, support bundles, and a broad automated test story. The weighted score is held down mostly by proof density, product/documentation consistency, AI correctness evidence, and buyer self-sufficiency, not by deferred attestation, contract-specific production availability evidence, or ecosystem scope.

### `(B)` Procurement / Market-Motion Realism

Procurement realism is materially harsher than the `(A)` product-readiness score. The trust center is honest about self-attested SOC 2 posture and third-party pen testing being planned/not scheduled, which is good, but many enterprise buyers still treat those as friction. That friction is informational here and does not reduce `(A)`. The practical buyer motion remains founder-led and service-led, with self-serve checkout, public reference assets, and broad GTM proof explicitly outside the weighted headline score.

### Commercial Picture

The commercial idea is strong: “Architecture Proof Engine” is clearer than generic AI governance, and the product has enough mechanics to support paid architecture reviews. The commercial weakness is that the offer is not yet frictionless or proof-dense enough to sell broadly without a human founder/operator translating the value, selecting the path, labeling evidence, and preventing over-claims.

### Enterprise Picture

The enterprise posture is serious for a small product: tenant database isolation, audit events, governance approvals, policy packs, SAML/OIDC/SCIM, procurement pack content, DPA/subprocessor/SLA/support material, and Azure-native deployment assumptions are all present. The enterprise gap is absorption. A reviewer can find evidence, but an implementation team still has to reconcile multiple docs, modes, caveats, duplicated trust pages, and configuration paths.

### Engineering Picture

The engineering system is broad and increasingly mature: Dapper/SQL, DbUp, API/UI/CLI, Worker/outbox patterns, live API E2E, k6, ZAP/Schemathesis, mutation testing, RAG quality work, and agent evaluation scaffolding. The biggest engineering risks are not missing breadth; they are correctness under real AI execution, retrieval isolation in production-like vector paths, auth/config/documentation drift, and maintainability pressure from a very large surface area.

## 3. Weighted Quality Assessment

Qualities are ordered by weighted deficiency signal: `weight * (100 - score)`. Weighted impact is the positive contribution to readiness: `score * weight / 11,900`.

| Urgency | Quality | Score | Weight | Weighted impact on readiness | Weighted deficiency signal | Assessment |
|---:|---|---:|---:|---:|---:|---|
| 1 | Marketability | 81 | 8 | 5.44% | 152 | Strong category framing plus proof-gated claim checklist; service-led motion still needs proof density. |
| 2 | Cutting-Edge AI Technology | 80 | 8 | 5.38% | 160 | Multi-agent execution, RAG, grounding traces, eval harnesses, and Azure OpenAI support are real; it is not yet an advanced autonomous/agentic or continuously validated AI platform. Deferred Graph-RAG/agentic retrieval is excluded. |
| 3 | Adoption Friction | 81 | 6 | 4.09% | 114 | Hosted SaaS and a Pilot path help; in-app help now routes to `/help/{topic}` instead of GitHub blobs; path chooser reduces wrong-doc detours. |
| 4 | AI/Agent Readiness | 87 | 8 | 5.78% | 112 | Agent orchestration, RAG safe defaults, real-agent failure triage, credentialed topology live-AOAI smoke (HOLD gate); full merge PASS pending TB-138. |
| 5 | Correctness | 86 | 8 | 5.71% | 120 | Real-agent failure classification and credentialed topology live-AOAI smoke archived; full multi-agent merge remains HOLD (TB-138). |
| 6 | Stickiness | 83 | 6 | 4.18% | 102 | Repeat-review activation prompt on operator home plus compare/replay/value-report links after first commit; stickiness still depends on adoption beyond proof packet. |
| 7 | Time-to-Value | 85 | 7 | 5.00% | 105 | The Pilot path is clear: request, execute, commit, review artifacts. Repeat-review prompts shorten the second-review path. |
| 8 | Proof-of-ROI Readiness | 85 | 5 | 3.57% | 75 | Cross-surface ROI source and freshness consistency tests align pilot deltas, value report markdown, and proof-packet JSON. |
| 9 | Workflow Embeddedness | 79 | 3 | 1.99% | 63 | Repeat-review activation surfaces compare/replay/value-report next steps without blocking first-pilot flow. |
| 10 | Differentiability | 87 | 4 | 2.92% | 52 | Execution-mode label invariants across first-value report, trust card, and provenance footer reduce ambiguous sponsor claims. |
| 11 | Usability | 82 | 3 | 2.07% | 54 | Progressive Pilot/Operate framing plus in-app help and path chooser; cognitive load from product breadth remains. |
| 12 | Executive Value Visibility | 84 | 4 | 2.82% | 64 | Sponsor brief, first-value report, ROI summary, board/sponsor outputs, and value report improve executive visibility. The gap is confidence in quantified claims outside curated pilots. |
| 13 | Trustworthiness | 85 | 3 | 2.14% | 45 | Honest trust posture, reconciled bulk-upload caps, claim checklist, and synchronized accessibility disclosure. |
| 14 | Commercial Packaging Readiness | 82 | 2 | 1.38% | 36 | Private service-led SOW/quote template maps default SKU to deliverables, exclusions, and proof boundaries. |
| 15 | Security | 88 | 3 | 2.22% | 36 | Tenant isolation pack, retrieval safe defaults, Azure Search filter builder tests, and auth contract reduce isolation ambiguity. |
| 16 | Maintainability | 80 | 2 | 1.34% | 40 | Drift guards for critical docs and in-app help registry reduce source-of-truth drift pressure. |
| 17 | Interoperability | 78 | 2 | 1.31% | 44 | REST, CLI, SCIM, Azure/GitHub style surfaces, Service Bus/events, and export formats provide useful integration. Deferred first-party connectors are excluded, but current integration use still takes engineering help. |
| 18 | Architectural Integrity | 86 | 3 | 2.17% | 42 | The architecture is coherent: API/Application/Persistence/Worker/UI boundaries, Dapper/DbUp, outbox, Azure-first hosting, tenant catalogs. The main drag is accumulated breadth and mode complexity. |
| 19 | Procurement Readiness | 83 | 2 | 1.39% | 34 | Strict `--deal-ready` procurement validation is a CI release gate; trust center accessibility row is canonical. |
| 20 | Compliance Readiness | 82 | 2 | 1.38% | 36 | VPAT 2.5 canonical path and honest automated-evidence disclosure; formal attestations remain excluded. |
| 21 | Decision Velocity | 81 | 2 | 1.36% | 38 | Architecture reviews can produce committed artifacts and sponsor packages quickly. Decision velocity is slowed by onboarding choices and reviewer trust-building. |
| 22 | Traceability | 90 | 3 | 2.27% | 30 | Run IDs, manifests, provenance, audit rows, correlation IDs, exports, and trace bundles are strong; isolation verification pack adds reviewer shortcuts. |
| 23 | Reliability | 84 | 2 | 1.41% | 32 | Health checks, outboxes, retry paths, live E2E, k6 smoke, and release drills are good. Contract-specific production availability evidence is V1.1 scope, so the remaining `(A)` reliability concern is environment-specific validation discipline. |
| 24 | Cognitive Load | 76 | 1 | 0.64% | 24 | Repeat-review prompt and path chooser reduce wrong next-step detours; product breadth remains high. |
| 25 | Data Consistency | 88 | 2 | 1.48% | 24 | ROI source rows and freshness disposition now tested across pilot deltas, value report, and proof-packet JSON. |
| 26 | Explainability | 89 | 2 | 1.50% | 22 | Execution-mode labels plus real-agent triage scenario ids on failure metadata and runbook matrix. |
| 27 | Azure Compatibility and SaaS Deployment Readiness | 87 | 2 | 1.46% | 26 | Azure-first architecture plus auditable Azure Search tenant filter contract in-repo. |
| 28 | Policy and Governance Alignment | 89 | 2 | 1.50% | 22 | Policy-pack content quality harness validates disclaimers, rule IDs, and manifest/doc counts in CI. |
| 29 | Documentation | 82 | 1 | 0.69% | 18 | Custom-handler extensibility checklist and failure triage runbook reduce integrator/on-call guesswork. |
| 30 | Customer Self-Sufficiency | 80 | 1 | 0.67% | 20 | Path chooser and `/help/{topic}` improve self-service; advanced config still needs operator judgment. |
| 31 | Extensibility | 83 | 1 | 0.70% | 17 | Custom-handler guide readiness checklist and registration proof tests; still advanced-integrator work, not a public SDK. |
| 32 | Scalability | 78 | 1 | 0.66% | 22 | SQL, outbox, optional Redis, k6 smoke, and Azure-native deployment support scale beyond toy use. Production fleet scale proof is still early. |
| 33 | Manageability | 78 | 1 | 0.66% | 22 | Config references, health, support bundle, admin settings, budgets, and runbooks exist. The number of knobs is high. |
| 34 | Performance | 79 | 1 | 0.66% | 21 | k6 smoke and performance baselines exist, but broad production latency/capacity evidence is limited. |
| 35 | Deployability | 82 | 1 | 0.69% | 18 | Auth behavior contract and config-reference alignment reduce deployment ambiguity. |
| 36 | Cost-Effectiveness | 80 | 1 | 0.67% | 20 | Cost controls, LLM budgets, cache work, and Azure cost modeling exist. Real unit economics depend on actual usage and model spend. |
| 37 | Auditability | 90 | 2 | 1.51% | 20 | Auditability is one of the strongest areas: typed event catalog, append-only SQL design, matrix, exports, and CI guards. Remaining concern is semantic drift as routes grow. |
| 38 | Template and Accelerator Richness | 85 | 1 | 0.71% | 15 | Policy-pack harness and SOW template strengthen curated accelerator quality over raw volume. |
| 39 | Supportability | 84 | 1 | 0.71% | 16 | Real-agent failure triage matrix and CI catalog align operator next steps without live secrets. |
| 40 | Availability | 86 | 1 | 0.72% | 14 | Health checks, probes, readiness endpoints, and operational targets exist for the current scope. Contractual production availability evidence and multi-region active/active guarantees are excluded from `(A)` and treated as V1.1/procurement-realism scope. |
| 41 | Testability | 86 | 1 | 0.72% | 14 | Test tiers, SQL integration, live UI E2E, mutation testing, k6, ZAP, Schemathesis, and contract snapshots are strong. Real AI coverage remains more expensive and environment-gated. |

## 4. Top 12 Most Important Weaknesses

1. **Proof density lags product breadth.** The system has many credible surfaces, but broad claims need repeated real-mode, source-labeled, buyer-safe proof packets.
2. **Commercial execution remains founder-led.** The product can support paid reviews, but the path is not yet repeatable enough for low-touch sales.
3. **Documentation has source-of-truth drift.** Examples include stale bulk-upload limits, duplicated trust-center pages, prior-assessment references inside GTM backlog, and auth wording inconsistencies.
4. **Product help leaks internal repository context.** Some help/documentation links still route to GitHub blob URLs, which increases buyer confusion and exposes internal workbench shape.
5. **AI correctness evidence is not yet fully buyer-grade.** Simulator and exemplar paths are useful, but live AOAI evidence requires credentialed runs and strict faithfulness evidence.
6. **Production-like retrieval isolation needs stricter proof.** Current RAG work is strong, but Azure Search tenant-filter and policy-pack safe-default enforcement should be locked down before broader claims.
7. **First-pilot UX competes with product breadth.** Pilot/Operate framing exists, but the user can still be pulled into advanced surfaces before first value is proven.
8. **Procurement pack strictness is not yet treated like a release gate.** Buyer-drop artifacts need stronger freshness, marker, and source consistency automation.
9. **Availability claims need sharper scope boundaries.** Health checks and staging probes exist; production availability rollups against contract terms are V1.1/procurement-realism scope and should not reduce `(A)`.
10. **Enterprise configuration has too many modes.** OIDC/SAML/SCIM/API key, SQL topology, hosted/self-hosted/dev, simulator/real, and retrieval providers create implementation ambiguity.
11. **Maintainability risk grows with surface area.** The architecture is modular, but the number of modules, docs, generated clients, policies, and test tiers creates drift pressure.
12. **Differentiation depends on proof discipline.** “Architecture Proof Engine” is compelling only if every sponsor-facing artifact consistently shows evidence, source, mode, confidence, and caveats.

## 5. Top 6 Monetization Blockers

1. **Insufficient repeatable proof for broad claims.** Buyers may understand the product but hesitate unless real-mode outputs, ROI sources, and proof packets are consistently defensible.
2. **Service-led offer execution is incomplete.** Named SKUs exist, but docs and SOW/quote assets still need consistency and buyer-ready packaging.
3. **ROI claims remain fragile.** Savings/time estimates can sell the product, but any stale, fallback, or synthetic-source confusion will damage trust.
4. **Self-serve commerce is intentionally out of scope.** This does not reduce `(A)`, but it means revenue depends on quote-to-cash and founder-led services for now.
5. **Buyer-facing documentation friction.** GitHub links, stale limits, and duplicated trust pages make the product feel less finished than the underlying engineering.
6. **Procurement confidence is self-attested.** SOC 2 CPA and third-party pen test are excluded from `(A)`, but they still slow enterprise revenue in `(B)`.

## 6. Top 6 Enterprise Adoption Blockers

1. **Assurance is honest but not externally attested.** This is `(B)` friction, not an `(A)` penalty.
2. **Tenant isolation proof must be easy to verify.** Database-per-tenant posture is strong, but retrieval filters and production-like configuration evidence must be obvious to reviewers.
3. **Onboarding has too many decision branches.** Enterprise implementers need fewer ambiguous paths across auth, storage, execution mode, retrieval, and deployment.
4. **Availability and DR posture is target-based.** Single-region V1 is acceptable by scope; measured production uptime against contract terms belongs to V1.1/procurement-realism, while current buyers still need clear backup, restore, and incident-process evidence.
5. **Product documentation surfaces internal repo details.** GitHub blob links and multiple trust-center files undermine polished buyer self-service.
6. **Support model is founder-operated.** Support policy exists, but larger enterprise adoption will require evidence that triage, escalation, and incident comms work without heroic founder involvement.

## 7. Top 6 Engineering Risks

1. **Auth/config documentation drift could cause insecure or broken deployments.** Conflicting fail-closed versus bypass language needs a single tested contract.
2. **Retrieval isolation mistakes could leak or mis-ground policy evidence.** Null assignment defaults and Azure Search filter enforcement deserve high priority.
3. **Real LLM output may fail differently from simulator/exemplar paths.** Strict schema, grounding, budget, and fallback labels must stay enforced.
4. **Docs and code can diverge faster than reviewers can detect.** The product has enough docs that stale claims are now an engineering risk, not just copy debt.
5. **Availability claims can outrun scope.** Health checks are not the same as contract-specific production SLA proof, which is now treated as V1.1/procurement-realism scope rather than a current `(A)` defect.
6. **Broad modularity increases coordination cost.** Many one-purpose services are good, but generated clients, DTOs, tests, docs, and UI contracts need better drift automation.

## 8. Most Important Truth

ArchLucid is pilot-ready, but it is not yet oversell-ready: the core product can produce defensible architecture proof packages, but the next readiness gains come from making every commercial and enterprise claim impossible to overstate, mislabel, or misunderstand.

## 9. Top Improvement Opportunities

### 1. Route Customer-Facing Help Away From GitHub Blob URLs

**Why it matters:** Product users should not be dropped into internal repository pages during evaluation. That creates cognitive load and weakens buyer confidence.

**Expected impact:** Cleaner onboarding, lower adoption friction, better customer self-sufficiency.

**Affected qualities:** Adoption Friction, Usability, Cognitive Load, Documentation, Marketability.

**Status:** Fully actionable now.

**Cursor prompt:** Replace customer-facing GitHub blob documentation links with ArchLucid-rendered in-app help routes. Start with `docs/library/PRODUCT_DOCUMENTATION_PRESENTATION.md`, `archlucid-ui/src/components/HelpPanel.tsx`, `archlucid-ui/src/lib/contextual-help-content.ts`, `archlucid-ui/public/doc-index.json`, `archlucid-ui/src/lib/product-documentation-registry.ts`, and the `/help` route implementation. Acceptance criteria: operator help links route to `/help` or `/help/{topic}`; `doc-index.json` no longer contains GitHub blob URLs for customer-facing topics; product UI contains no “View source on GitHub” affordance, including developer/admin diagnostics; tests or lint fail if new customer-facing `github.com/.../blob/` links are introduced. Constraints: do not remove source links from contributor-only docs; do not rewrite large documentation content; keep route names stable where existing UI uses them.

**Impact of running the prompt:** Directly improves Adoption Friction (+4-6 pts), Usability (+3-5 pts), Documentation (+5-8 pts), Cognitive Load (+3-5 pts). Weighted readiness impact: +0.35-0.55%.

### 2. Reconcile Stale Buyer-Facing Current-State Claims

**Why it matters:** Stale details like obsolete upload caps or contradictory audit/auth posture make a buyer doubt stronger claims.

**Expected impact:** Less procurement confusion and fewer avoidable support escalations.

**Affected qualities:** Trustworthiness, Documentation, Procurement Readiness, Correctness, Maintainability.

**Status:** Fully actionable now.

**Cursor prompt:** Perform a focused current-state reconciliation pass on buyer-facing docs. Start with `docs/go-to-market/SERVICE_LED_OFFERS.md`, `docs/library/V1_READINESS_SUMMARY.md`, `docs/go-to-market/TRUST_CENTER.md`, `docs/go-to-market/trust-center.md`, `docs/REPOSITORY_README.md`, `docs/library/V1_DEFERRED.md`, and `docs/library/AUDIT_COVERAGE_MATRIX.md`. Correct stale statements about evidence bulk upload limits, audit gaps, PGP/trust posture, and API key fail-closed behavior. Acceptance criteria: bulk upload docs reflect 200 multipart files and ZIP expansion where current scope says so; audit-gap docs align with the audit matrix’s current “0 open catalogued-only items” posture; API key docs state one authoritative production/development behavior; duplicated trust center pages do not conflict. Constraints: do not change product code; do not claim SOC 2 CPA or third-party pen-test completion; do not remove deferred-scope caveats.

**Impact of running the prompt:** Directly improves Trustworthiness (+3-5 pts), Documentation (+6-10 pts), Procurement Readiness (+3-5 pts), Correctness (+1-2 pts). Weighted readiness impact: +0.30-0.50%.

### 3. Enforce Retrieval Policy-Pack Safe Defaults

**Why it matters:** Retrieval must never accidentally broaden policy-pack evidence when assignment context is missing.

**Expected impact:** Stronger tenant isolation and AI grounding safety.

**Affected qualities:** Security, Correctness, AI/Agent Readiness, Reliability, Trustworthiness.

**Status:** Fully actionable now.

**Cursor prompt:** Close the policy-pack retrieval safe-default gap documented in `docs/library/RAG_QUALITY_TECHNICAL_BACKLOG.md` under `RAG-V1-010`. Start with `ArchLucid.Retrieval`, `InMemoryVectorIndex`, `RetrievalQueryService`, retrieval query DTOs, and existing tenant-bound retrieval tests. Change null or missing policy-pack assignment lists so policy-pack chunks are excluded by default, while non-policy corpora keep their current scoped behavior. Acceptance criteria: direct vector-index search with null policy assignment returns no policy-pack chunks; tenant/workspace/project anti-leak tests pass; assigned policy packs still retrieve expected chunks; docs update the RAG backlog status if shipped. Constraints: do not weaken tenant filters; do not add cross-tenant text retrieval; keep fail-open behavior for retrieval service errors.

**Impact of running the prompt:** Directly improves Security (+3-5 pts), AI/Agent Readiness (+2-4 pts), Correctness (+2-3 pts), Reliability (+1-2 pts). Weighted readiness impact: +0.25-0.45%.

### 4. Add Azure Search Tenant-Filter Contract Tests

**Why it matters:** Production-like retrieval safety depends on filters in the real vector provider, not only in the in-memory index.

**Expected impact:** Better enterprise trust and safer production retrieval configuration.

**Affected qualities:** Security, Reliability, AI/Agent Readiness, Azure Compatibility, Trustworthiness.

**Status:** Fully actionable now.

**Cursor prompt:** Add a production-like contract guard for Azure AI Search retrieval filters. Start with `ArchLucid.Retrieval`, `AzureAiSearchVectorIndex` or its current client abstraction, retrieval options/configuration, and tests around `RetrievalQueryService`. If the Azure Search implementation is still a stub, add an interface-level test/fake that asserts generated queries include tenant/workspace/project filters and policy-pack assignment constraints before dispatch. Acceptance criteria: every Azure Search query/delete path includes tenant scope in an OData filter or equivalent API parameter; tests fail if the filter is omitted; configuration docs state that production-like profiles must not run retrieval without scoped filters. Constraints: do not require live Azure Search credentials in normal CI; do not log raw query text containing secrets or customer content; do not broaden RAG scope.

**Impact of running the prompt:** Directly improves Security (+3-5 pts), Azure Compatibility (+2-4 pts), Trustworthiness (+2-3 pts), AI/Agent Readiness (+1-2 pts). Weighted readiness impact: +0.20-0.40%.

### 5. Create a Proof-Gated Claim Readiness Checklist

**Why it matters:** The product’s commercial risk is claims outrunning proof. A gate makes claim expansion deliberate.

**Expected impact:** Safer sales motion and fewer credibility failures.

**Affected qualities:** Marketability, Proof-of-ROI Readiness, Trustworthiness, Commercial Packaging Readiness.

**Status:** Fully actionable now.

**Cursor prompt:** Turn `docs/go-to-market/GTM_BACKLOG.md` proof gates G1-G6 into a reusable claim-readiness checklist artifact that can be attached to a pilot or release note. Start with `docs/go-to-market/GTM_BACKLOG.md`, `docs/go-to-market/WHAT_NOT_TO_PROMISE.md`, proof-packet docs, and any pilot notes/runbook locations. Create a concise markdown template and, if there is an existing CLI/report builder surface, add a generated checklist command or report section. Acceptance criteria: checklist records PASS/HOLD for G1-G6, points each HOLD to evidence or remediation, distinguishes `(A)` product readiness from `(B)` procurement realism, and blocks broad-claim language when proof is missing. Constraints: do not require public reference customers; do not add SOC 2 CPA or third-party pen-test prompts; do not create public marketing claims automatically.

**Impact of running the prompt:** Directly improves Marketability (+3-5 pts), Proof-of-ROI Readiness (+3-5 pts), Trustworthiness (+2-4 pts), Commercial Packaging Readiness (+2-3 pts). Weighted readiness impact: +0.30-0.55%.

### 6. Simplify the First-Pilot Next-Action UX

**Why it matters:** The product has many advanced surfaces. First value improves when the UI keeps users on the shortest path to a committed review package.

**Expected impact:** Faster first value and lower cognitive load.

**Affected qualities:** Time-to-Value, Adoption Friction, Usability, Cognitive Load, Customer Self-Sufficiency.

**Status:** Fully actionable now.

**Cursor prompt:** Add or tighten first-pilot next-action guidance in the operator UI so a new evaluator sees one primary action at a time until the first committed review exists. Start with `archlucid-ui` dashboard/home components, Pilot checklist components, route/nav shaping code, `docs/CORE_PILOT.md`, and `docs/runbooks/FIRST_PILOT_OPERATOR_PATH.md`. Acceptance criteria: before first commit, UI prioritizes configure/create review/execute/commit/review artifacts; Operate links remain available only through deliberate progressive disclosure; empty states explain the next action in one sentence; tests cover pre-first-commit and post-first-commit states. Constraints: do not remove Operate features; do not weaken API authorization; avoid adding new product terminology.

**Impact of running the prompt:** Directly improves Time-to-Value (+3-5 pts), Adoption Friction (+3-5 pts), Usability (+4-6 pts), Cognitive Load (+5-8 pts). Weighted readiness impact: +0.35-0.60%.

### 7. Make Procurement-Pack Strict Mode a Buyer-Drop Gate

**Why it matters:** Procurement evidence is only useful if buyer-facing packs never ship stale placeholders or unsafe assurance wording.

**Expected impact:** Stronger enterprise confidence and fewer manual legal/security corrections.

**Affected qualities:** Procurement Readiness, Compliance Readiness, Trustworthiness, Documentation.

**Status:** Fully actionable now.

**Cursor prompt:** Promote procurement-pack strict validation from optional/manual to a required buyer-drop check. Start with `scripts/build_procurement_pack.py`, `scripts/procurement_pack_canonical.json`, `docs/go-to-market/HOW_TO_REQUEST_PROCUREMENT_PACK.md`, `docs/go-to-market/TRUST_CENTER.md`, and CI workflow references. Acceptance criteria: strict mode detects placeholder tokens, stale required review dates, forbidden false-assurance wording, broken canonical paths, and missing redaction report; release/buyer-drop docs require strict mode; normal developer workflows remain able to run non-strict dry-run. Constraints: do not fail all PR CI unless current repo state is clean or a scoped CI job is appropriate; do not assert third-party attestation; do not include buyer-specific names in committed files.

**Impact of running the prompt:** Directly improves Procurement Readiness (+4-6 pts), Compliance Readiness (+3-5 pts), Trustworthiness (+2-4 pts), Documentation (+2-4 pts). Weighted readiness impact: +0.25-0.45%.

### 8. Add Critical-Docs Drift Guards

**Why it matters:** Documentation drift is now a product quality risk because buyers consume docs as part of the product.

**Expected impact:** Higher maintainability and fewer contradictory claims.

**Affected qualities:** Maintainability, Documentation, Trustworthiness, Correctness.

**Status:** Fully actionable now.

**Cursor prompt:** Add lightweight CI/doc lint guards for critical source-of-truth drift. Start with `docs/library/V1_SCOPE.md`, `docs/library/V1_DEFERRED.md`, `docs/go-to-market/TRUST_CENTER.md`, `docs/go-to-market/trust-center.md`, `docs/REPOSITORY_README.md`, `docs/library/PRODUCT_DOCUMENTATION_PRESENTATION.md`, and existing scripts under `scripts/ci`. Acceptance criteria: guard detects obsolete bulk-upload cap text, forbidden claims of SOC 2 CPA/third-party pen-test completion, GitHub blob links in customer-facing help indexes, and direct references from active GTM docs to `docs/assessments/LATEST.md` as a source of shipping truth. Constraints: keep rules focused to avoid noisy false positives; allow archive docs to retain historical text; do not rewrite broad docs beyond necessary fixes.

**Impact of running the prompt:** Directly improves Maintainability (+4-6 pts), Documentation (+5-8 pts), Trustworthiness (+2-4 pts), Correctness (+1-2 pts). Weighted readiness impact: +0.25-0.45%.

### 9. Build a Service-Led Quote/SOW Pack From SKU Docs

**Why it matters:** Founder-led revenue needs a repeatable quoting artifact, not just internal SKU notes.

**Expected impact:** Better monetization and decision velocity without waiting for self-serve checkout.

**Affected qualities:** Commercial Packaging Readiness, Decision Velocity, Marketability, Time-to-Value.

**Status:** Fully actionable now.

**Cursor prompt:** Create a buyer-safe service-led quote/SOW pack that maps named SKUs to deliverables, exclusions, assumptions, and acceptance criteria. Start with `docs/go-to-market/SERVICE_LED_OFFERS.md`, `docs/go-to-market/ORDER_FORM_TEMPLATE.md`, `docs/go-to-market/PRICING_PHILOSOPHY.md`, `docs/go-to-market/SUPPORT_POLICY.md`, and `docs/go-to-market/PROCUREMENT_OBJECTION_PLAYBOOK.md`. Acceptance criteria: add a reusable private SOW/quote template for the named offers; each offer lists inputs, outputs, timeline assumptions, exclusions, human signoff, evidence handling, and proof boundaries; stale upload limits are corrected; no public paid-pilot price band is added to landing-page copy. Constraints: do not flip Stripe live keys or Marketplace status; do not create customer-specific legal terms; do not imply guaranteed savings.

**Impact of running the prompt:** Directly improves Commercial Packaging Readiness (+5-8 pts), Decision Velocity (+3-5 pts), Marketability (+2-4 pts), Time-to-Value (+1-2 pts). Weighted readiness impact: +0.25-0.45%.

### 10. Lock Execution-Mode Labels Across Sponsor Surfaces

**Why it matters:** Simulator, real, fallback, and mixed execution must never be ambiguous in sponsor-facing artifacts.

**Expected impact:** Stronger trust and safer commercial claims.

**Affected qualities:** Trustworthiness, Proof-of-ROI Readiness, Explainability, AI/Agent Readiness.

**Status:** Fully actionable now.

**Cursor prompt:** Add a cross-surface invariant test for execution-mode labels. Start with run detail DTOs, first-value report builder, proof-packet builder, export/document factories, UI review detail components, and existing agent execution trace models. Acceptance criteria: every sponsor-facing surface that includes AI output or ROI evidence shows `Real`, `Simulator`, `Fallback`, or `Mixed`; fallback cannot render as unqualified real output; tests cover simulator-only, real-only, fallback, and mixed agent runs. Constraints: do not require live AOAI in tests; do not change execution semantics; keep labels concise and buyer-safe.

**Impact of running the prompt:** Directly improves Trustworthiness (+3-5 pts), Proof-of-ROI Readiness (+2-4 pts), Explainability (+2-4 pts), AI/Agent Readiness (+1-3 pts). Weighted readiness impact: +0.25-0.45%.

### 11. Add Cross-Surface ROI Source Consistency Tests

**Why it matters:** ROI is monetization-critical and must mean the same thing in API, UI, exports, and proof packets.

**Expected impact:** Safer revenue claims and better executive confidence.

**Affected qualities:** Proof-of-ROI Readiness, Executive Value Visibility, Correctness, Data Consistency.

**Status:** Fully actionable now.

**Cursor prompt:** Add focused consistency tests for ROI source labels and freshness across executive summary, first-value report, pilot deltas, value report, and proof-packet outputs. Start with `ArchLucid.Application/Roi`, `ArchLucid.Application/Pilots`, `ArchLucid.Cli/Commands/PilotProofPacket*`, `ArchLucid.Contracts/Roi`, and related tests. Acceptance criteria: customer-provided, extractor-derived, benchmark-assumption, demo/synthetic, missing, and stale sources render consistently across surfaces; stale or demo-only values cannot appear as unqualified savings; duplicate finding dedupe remains intact. Constraints: do not invent ROI when data is absent; do not change pricing; do not require real Azure Cost Management credentials in tests.

**Impact of running the prompt:** Directly improves Proof-of-ROI Readiness (+4-6 pts), Executive Value Visibility (+2-4 pts), Correctness (+1-3 pts), Data Consistency (+1-2 pts). Weighted readiness impact: +0.30-0.50%.

### 12. Produce Buyer-Safe Availability Rollups With INCONCLUSIVE Defaults

**Why it matters:** Availability claims need measured evidence and explicit caveats, especially before enterprise procurement.

**Expected impact:** Stronger reliability narrative without over-claiming SLA performance.

**Affected qualities:** Availability, Reliability, Procurement Readiness, Trustworthiness.

**Status:** Fully actionable now.

**Cursor prompt:** Implement or tighten hosted availability rollup generation so missing production data renders `INCONCLUSIVE`, not green. Start with `docs/runbooks/HOSTED_AVAILABILITY_ROLLUP.md`, `scripts/ops/summarize_hosted_probe_artifacts.py`, `docs/go-to-market/TRUST_CENTER.md`, `docs/go-to-market/SLA_SUMMARY.md`, and `docs/library/API_SLOS.md`. Acceptance criteria: rollup includes target URL class, probe window, uptime calculation, exclusions, incidents, data gaps, and contractual caveat; staging and production are never mixed; tests cover empty, partial, staging-only, and production-success inputs. Constraints: do not claim SLA compliance without production probe data and owner-approved contract terms; do not expose internal hostnames or secrets.

**Impact of running the prompt:** Directly improves Availability (+6-10 pts), Reliability (+2-4 pts), Procurement Readiness (+2-3 pts), Trustworthiness (+1-2 pts). Weighted readiness impact: +0.15-0.30%.

### 13. Add SSO Configuration Preflight Diagnostics

**Why it matters:** OIDC/SAML/SCIM breadth is enterprise-friendly only if operators can verify configuration quickly.

**Expected impact:** Lower implementation friction and better supportability.

**Affected qualities:** Adoption Friction, Manageability, Supportability, Security, Customer Self-Sufficiency.

**Status:** Fully actionable now.

**Cursor prompt:** Add a non-secret SSO preflight diagnostic to the CLI or admin diagnostics surface. Start with auth configuration options, OIDC/SAML/SCIM docs, `ArchLucid.Cli`, admin diagnostics APIs, and existing config lint patterns. Acceptance criteria: diagnostic reports configured auth mode, issuer/metadata reachability, audience/app-role mapping presence, SAML metadata parse status, SCIM token configuration presence, and redacted Key Vault reference status; it never prints secrets or raw assertions; docs show how to run it before enterprise handoff. Constraints: do not perform real user login; do not require external IdP credentials in unit tests; keep Entra as default documented hosted path while supporting generic OIDC/SAML.

**Impact of running the prompt:** Directly improves Adoption Friction (+2-4 pts), Manageability (+4-6 pts), Supportability (+3-5 pts), Security (+1-2 pts). Weighted readiness impact: +0.20-0.40%.

### 14. Create a Tenant Isolation Verification Pack

**Why it matters:** Enterprise reviewers need a concise answer to “prove my data is isolated.”

**Expected impact:** Better security review velocity and trust.

**Affected qualities:** Security, Procurement Readiness, Trustworthiness, Traceability.

**Status:** Fully actionable now.

**Cursor prompt:** Add a tenant isolation verification pack that summarizes SQL topology, tenant binding, app scope, RLS/session-context posture, retrieval scope, and audit evidence without exposing tenant data. Start with `docs/go-to-market/TENANT_ISOLATION.md`, `docs/library/TENANT_DATABASE_TOPOLOGY.md`, `docs/security/MULTI_TENANT_RLS.md`, retrieval isolation tests, support bundle builders, and procurement pack generation. Acceptance criteria: generated markdown/JSON includes topology mode, tenant database binding evidence, RLS/session status where applicable, retrieval provider and scope-filter status, audit event sample metadata, and redaction notes; pack can be included in support/procurement bundle; tests cover redaction and missing-data cases. Constraints: do not include connection strings, secrets, raw customer content, or cross-tenant identifiers beyond redacted metadata.

**Impact of running the prompt:** Directly improves Security (+3-5 pts), Procurement Readiness (+3-5 pts), Trustworthiness (+2-4 pts), Traceability (+1-2 pts). Weighted readiness impact: +0.20-0.40%.

### 15. Make API Auth Behavior a Tested Documentation Contract

**Why it matters:** Auth mode ambiguity can create broken demos or unsafe assumptions.

**Expected impact:** Safer deployability and clearer operator setup.

**Affected qualities:** Security, Correctness, Deployability, Documentation.

**Status:** Fully actionable now.

**Cursor prompt:** Define and test the authoritative API auth behavior for `ApiKey`, `DevelopmentBypass`, and `JwtBearer`. Start with `docs/REPOSITORY_README.md`, `docs/library/CONFIGURATION_REFERENCE.md`, auth options/classes in `ArchLucid.Api`/host composition, and API auth integration tests. Acceptance criteria: docs and tests agree on default behavior in base JSON, development JSON, production-like configuration, disabled API keys, read-only key, and admin key; misconfiguration fails closed where intended; README contains no contradictory bypass language. Constraints: do not weaken local development ergonomics; do not print API keys in logs; do not change public auth routes unless tests and OpenAPI docs are updated.

**Impact of running the prompt:** Directly improves Security (+3-5 pts), Correctness (+2-4 pts), Deployability (+2-4 pts), Documentation (+2-4 pts). Weighted readiness impact: +0.25-0.45%.

### 16. Add a Buyer/Operator Path Chooser

**Why it matters:** The repo has many useful paths. Users need a decision aid that keeps them out of irrelevant material.

**Expected impact:** Lower cognitive load and better self-sufficiency.

**Affected qualities:** Cognitive Load, Customer Self-Sufficiency, Adoption Friction, Usability.

**Status:** Fully actionable now.

**Cursor prompt:** Create a concise path chooser for buyers/operators that maps the user’s current state to the next document or UI action. Start with `docs/START_HERE.md`, `docs/BUYER_FIRST_30_MINUTES.md` if present, `docs/runbooks/FIRST_PILOT_OPERATOR_PATH.md`, `docs/runbooks/FIRST_PILOT_TROUBLESHOOTING.md`, `docs/go-to-market/BUYER_ORIENTATION_ONE_SCREEN.md`, and in-app help registry entries. Acceptance criteria: chooser covers “I want to evaluate,” “I am stuck mid-pilot,” “I need procurement/security,” “I need sponsor output,” and “I need engineering support”; each branch has one primary next action and one fallback; in-app help links to the chooser. Constraints: do not create another long onboarding guide; do not duplicate deep technical content; do not route buyers to contributor docs unless explicitly needed.

**Impact of running the prompt:** Directly improves Cognitive Load (+5-8 pts), Customer Self-Sufficiency (+4-6 pts), Adoption Friction (+2-4 pts), Usability (+2-4 pts). Weighted readiness impact: +0.20-0.40%.

### 17. Add Generated Client Drift Triage Notes

**Why it matters:** Generated clients are useful, but drift can confuse integrators when OpenAPI and client artifacts move independently.

**Expected impact:** Better interoperability and supportability.

**Affected qualities:** Interoperability, Maintainability, Supportability, Testability.

**Status:** Fully actionable now.

**Cursor prompt:** Add a concise generated-client drift triage note and CI artifact summary. Start with `ArchLucid.Api.Client/Generated/ArchLucidApiClient.g.cs`, OpenAPI snapshot tests, `docs/library/OPENAPI_CLIENT_DRIFT_OPERATOR_NOTE.md`, and CI scripts that regenerate/check OpenAPI clients. Acceptance criteria: when OpenAPI changes, contributors can see whether the generated client was refreshed; failure output points to the exact regeneration command; docs explain what changed at a high level for integrators; no generated client manual edits are required. Constraints: do not hand-edit generated code except through the existing generator; do not add broad git history requirements; keep output short.

**Impact of running the prompt:** Directly improves Interoperability (+2-4 pts), Maintainability (+2-4 pts), Supportability (+2-3 pts), Testability (+1-2 pts). Weighted readiness impact: +0.15-0.30%.

### 18. Add Policy-Pack Content Quality Harness

**Why it matters:** Policy packs are a differentiator only if curated content remains coherent, non-certification, and evidence-oriented.

**Expected impact:** Better governance trust and differentiability.

**Affected qualities:** Policy and Governance Alignment, Differentiability, Correctness, Template and Accelerator Richness.

**Status:** Fully actionable now.

**Cursor prompt:** Add a policy-pack content quality harness that validates seeded pack metadata, disclaimer language, rule IDs, severity consistency, and “not certification” wording. Start with `ArchLucid.Application/Governance/DefaultPolicyPacks`, `docs/go-to-market/DEFAULT_POLICY_PACKS_V1.md`, `docs/library/POLICY_PACK_APPENDIX_AI_GOVERNANCE_V1.md`, `docs/library/POLICY_PACK_APPENDIX_SECURITY_BASELINE_V1.md`, and policy-pack tests. Acceptance criteria: harness fails on duplicate rule IDs, missing rationale, missing disclaimer for framework mappings, unsupported certification language, or manifest/doc count mismatch; docs show how to add a new pack. Constraints: do not expand pack count unless required; do not claim statutory certification; keep tests deterministic.

**Impact of running the prompt:** Directly improves Policy and Governance Alignment (+3-5 pts), Differentiability (+2-4 pts), Correctness (+1-3 pts), Template and Accelerator Richness (+3-5 pts). Weighted readiness impact: +0.20-0.35%.

### 19. Synchronize Accessibility Disclosure With Automated Evidence

**Why it matters:** Accessibility claims should reflect automated and manual evidence without implying participant AT testing.

**Expected impact:** Stronger procurement honesty and less documentation drift.

**Affected qualities:** Compliance Readiness, Procurement Readiness, Trustworthiness, Documentation.

**Status:** Fully actionable now.

**Cursor prompt:** Synchronize accessibility disclosure docs and routes with current automated evidence. Start with `ACCESSIBILITY.md`, `docs/security/VPAT_2_5_WCAG_2_1_AA.md`, `docs/security/VPAT_2_4_WCAG_2_1_DRAFT.md` if still present, `docs/go-to-market/TRUST_CENTER.md`, marketing `/accessibility`, and UI axe test docs. Acceptance criteria: one current VPAT/ACR path is canonical; trust center links the canonical path; automated axe/jest evidence is described accurately; criteria not manually evaluated remain labeled; no statement implies assistive-technology participant testing is complete. Constraints: do not add AT user testing as a headline gate; do not claim legal conformance beyond evidence; preserve procurement honesty.

**Impact of running the prompt:** Directly improves Compliance Readiness (+2-4 pts), Procurement Readiness (+2-4 pts), Trustworthiness (+1-3 pts), Documentation (+2-4 pts). Weighted readiness impact: +0.15-0.30%.

### 20. Add an LLM Cost and Budget Operator View

**Why it matters:** AI cost is both a unit-economics issue and an enterprise manageability issue.

**Expected impact:** Better cost control and buyer/operator confidence.

**Affected qualities:** Cost-Effectiveness, Manageability, Supportability, AI/Agent Readiness.

**Status:** Fully actionable now.

**Cursor prompt:** Add or complete an operator-facing LLM usage and budget view that summarizes token usage, estimated spend, tenant budget warnings, hard cutoff state, and recent expensive operations. Start with LLM budget services, audit events, `RunAgentExecutionLlmCostEstimateAppender`, billing/cost reporting services, API DTOs, and operator UI admin/billing routes. Acceptance criteria: UI/API show current UTC-day/month consumption, included/hard cutoff thresholds, recent warnings, per-run estimates, and simulator exclusions; no raw prompts/completions are exposed; tests cover no data, budget approaching, cutoff, and wallet/top-up disabled states. Constraints: do not treat estimates as invoices; do not add new Stripe charges unless existing wallet flows already support them; redact tenant-sensitive detail.

**Impact of running the prompt:** Directly improves Cost-Effectiveness (+5-8 pts), Manageability (+2-4 pts), Supportability (+2-4 pts), AI/Agent Readiness (+1-2 pts). Weighted readiness impact: +0.15-0.30%.

### 21. Add a Support and Incident Readiness Drill

**Why it matters:** Support policy and support bundles are only credible if the team can rehearse a real incident path.

**Expected impact:** Better enterprise supportability and procurement confidence.

**Affected qualities:** Supportability, Reliability, Procurement Readiness, Trustworthiness.

**Status:** Fully actionable now.

**Cursor prompt:** Create a support/incident readiness drill that exercises correlation ID capture, health/version, support bundle generation, incident communication template, and customer-safe redaction. Start with `docs/go-to-market/SUPPORT_POLICY.md`, `docs/go-to-market/INCIDENT_COMMUNICATIONS_POLICY.md`, support bundle CLI/API code, support bundle tests, and troubleshooting runbooks. Acceptance criteria: drill has steps, expected artifacts, redaction checks, severity classification, and customer update template; support bundle output is buyer-safe by default; tests cover redaction of secrets and correlation ID inclusion. Constraints: do not promise staffed 24/7 support beyond current policy; do not include real customer data; do not require live production access.

**Impact of running the prompt:** Directly improves Supportability (+4-6 pts), Reliability (+2-3 pts), Procurement Readiness (+2-3 pts), Trustworthiness (+1-2 pts). Weighted readiness impact: +0.15-0.30%.

### 22. Generate a Maintainability Boundary Map

**Why it matters:** The product is now broad enough that contributors need automatic help finding the right module and test layer.

**Expected impact:** Lower maintenance cost and fewer cross-boundary regressions.

**Affected qualities:** Maintainability, Architectural Integrity, Testability, Cognitive Load.

**Status:** Fully actionable now.

**Cursor prompt:** Generate or update a maintainability boundary map that ties major API routes, application services, persistence repositories, UI routes, docs, and primary tests together. Start with `docs/library/CONTRIBUTOR_CODE_MAP.md`, `docs/library/CHANGE_IMPACT_CHECKLIST.md`, `docs/library/TEST_STRUCTURE.md`, `docs/library/OPERATOR_ATLAS.md`, and route/test maps. Acceptance criteria: common change types tell a developer which project, service, DTO, migration, UI component, docs, and tests to touch; map is short enough for day-one use; CI or doc lint catches broken referenced paths. Constraints: do not create a full architecture encyclopedia; reuse existing maps; do not move code.

**Impact of running the prompt:** Directly improves Maintainability (+4-6 pts), Architectural Integrity (+1-2 pts), Testability (+1-2 pts), Cognitive Load (+2-4 pts). Weighted readiness impact: +0.15-0.30%.

### 23. Add Real-Agent Failure Triage Artifacts Without Requiring Secrets

**Why it matters:** Even before live credentials are available, failures from real-agent paths need consistent classification and remediation guidance.

**Expected impact:** Better AI supportability and faster live validation once credentials are present.

**Affected qualities:** AI/Agent Readiness, Supportability, Explainability, Correctness.

**Status:** Fully actionable now.

**Cursor prompt:** Add real-agent failure triage artifacts that work without Azure OpenAI credentials. Start with real/simulator execution options, agent result parser/evaluation tests, `docs/library/FIRST_REAL_VALUE.md`, `docs/runbooks/GOLDEN_COHORT_REAL_LLM_GATE.md`, and agent runtime diagnostics. Acceptance criteria: docs and tests classify missing credentials, content-safety rejection, schema violation, grounding insufficiency, timeout, budget cutoff, and fallback-to-simulator; each class has operator next steps; no live secret is required for CI; real-mode runs attach failure reason metadata when available. Constraints: do not weaken strict gates; do not log prompts containing secrets; do not mark skipped real runs as passed buyer evidence.

**Impact of running the prompt:** Directly improves AI/Agent Readiness (+2-4 pts), Supportability (+2-4 pts), Explainability (+1-3 pts), Correctness (+1-2 pts). Weighted readiness impact: +0.20-0.35%.

### 24. Add Repeat-Review Activation Signals

**Why it matters:** Stickiness depends on buyers returning for a second and third review, not just completing the first proof package.

**Expected impact:** Makes repeat usage visible and gives operators a concrete reason to compare, replay, and govern follow-up reviews.

**Affected qualities:** Stickiness, Workflow Embeddedness, Time-to-Value, Executive Value Visibility.

**Status:** Fully actionable as a future task.

**Cursor prompt:** Add repeat-review activation signals that detect when a tenant has completed its first committed review and guide operators toward the next high-value follow-up: compare against a prior review, replay authority, review unresolved findings, or generate a sponsor update. Start with the operator dashboard/home route, review detail components, compare/replay entry points, `ExecutiveRoiSummaryService`, pilot/run metadata, and docs under `docs/library/REPEAT_REVIEW_LOOP.md` and `docs/library/OPERATOR_DECISION_GUIDE.md`. Acceptance criteria: after the first committed review, the UI shows a concise next-review prompt; after two or more committed reviews, the UI surfaces compare/replay/value-report prompts; tests cover zero, one, and multiple committed-review states; no prompt appears as a blocking gate. Constraints: do not require a public reference customer or design partner; do not change manifest semantics; keep first-pilot UX uncluttered.

**Impact of running the prompt:** Directly improves Stickiness (+4-6 pts), Workflow Embeddedness (+2-4 pts), Time-to-Value (+1-2 pts), Executive Value Visibility (+1-3 pts). Weighted readiness impact: +0.25-0.45%.

### 25. Add Audit Semantic-Drift Guardrails

**Why it matters:** Auditability is strong today, but route growth can create semantic drift where events exist but no longer answer the compliance question buyers ask.

**Expected impact:** Keeps audit coverage meaningful instead of merely present.

**Affected qualities:** Auditability, Traceability, Compliance Readiness, Trustworthiness, Maintainability.

**Status:** Fully actionable as a future task.

**Cursor prompt:** Add audit semantic-drift guardrails for critical mutating workflows. Start with `docs/library/AUDIT_COVERAGE_MATRIX.md`, `ArchLucid.Core/Audit/AuditEventTypes.cs`, controller mutation audit tests, OpenAPI mutation snapshot tests, and services that emit durable audit rows. Define a small set of semantic audit invariants for critical paths: actor, tenant/workspace/project scope, run/manifest/finding identifiers where applicable, event type, correlation ID, and redacted payload shape. Acceptance criteria: tests fail when a critical mutating route emits an audit row missing required semantic fields; audit matrix rows identify the semantic invariant class; dry-run/read-only endpoints remain explicitly excluded; existing audit count guards still pass. Constraints: do not add noisy audit rows for pure read paths; do not log secrets or free-form prompt content; do not break fire-and-forget audit behavior on hot paths.

**Impact of running the prompt:** Directly improves Auditability (+3-5 pts), Traceability (+2-3 pts), Compliance Readiness (+2-3 pts), Trustworthiness (+1-3 pts), Maintainability (+1-2 pts). Weighted readiness impact: +0.20-0.35%.

### 26. Add Capacity and Performance Evidence Rollup

**Why it matters:** Scalability and performance have smoke evidence, but buyers and operators need a compact view of what has actually been exercised.

**Expected impact:** Converts k6, live E2E, and performance baseline outputs into a buyer-safe engineering evidence artifact.

**Affected qualities:** Scalability, Performance, Reliability, Availability, Cost-Effectiveness.

**Status:** Fully actionable as a future task.

**Cursor prompt:** Add a capacity and performance evidence rollup that summarizes existing k6 smoke, performance baseline, live E2E, and any load-test artifacts into a concise markdown/JSON report. Start with `docs/library/TEST_STRUCTURE.md`, `docs/library/PERFORMANCE_BASELINES.md`, `docs/library/LOAD_TEST_BASELINE.md`, `.github/workflows/ci.yml`, k6 summary scripts, and performance test outputs. Acceptance criteria: rollup lists scenario, environment class, request mix, write/read paths, p95 latency where available, failure rate, known exclusions, and whether results are CI smoke or production evidence; missing artifacts render `INCONCLUSIVE`; docs explain that smoke evidence is not a contractual scale guarantee. Constraints: do not invent throughput claims; do not require production load tests; do not expose internal hostnames, secrets, or customer data.

**Impact of running the prompt:** Directly improves Scalability (+4-6 pts), Performance (+4-6 pts), Reliability (+1-3 pts), Availability (+1-2 pts), Cost-Effectiveness (+1-2 pts). Weighted readiness impact: +0.15-0.30%.

### 27. Add Custom-Handler Extensibility Readiness Pass

**Why it matters:** Extensibility is in scope as pattern-level custom handler documentation, but advanced integrators need proof that the extension path is understandable and regression-tested.

**Expected impact:** Makes extensibility credible without implying a public plugin SDK or marketplace.

**Affected qualities:** Extensibility, Documentation, Maintainability, AI/Agent Readiness, Customer Self-Sufficiency.

**Status:** Fully actionable as a future task.

**Cursor prompt:** Add a custom-handler extensibility readiness pass for the documented advanced-integrator path. Start with `docs/library/CUSTOM_AGENT_HANDLER_GUIDE.md`, `docs/library/CUSTOM_AGENT_HANDLERS.md`, handler registration in `ArchLucid.Host.Composition`, agent runtime handler interfaces, and existing custom handler registration tests. Acceptance criteria: guide includes a minimal compile-safe example, registration steps, authority/safety constraints, versioning boundaries, tests to add, and explicit non-goals; a test proves a custom handler can be registered without bypassing allowed-tools or quality gates; docs clearly state this is not a public plugin SDK, MCP surface, or marketplace. Constraints: do not add new public HTTP extension contracts; do not add MCP dependencies to core libraries; do not weaken agent dispatch guardrails.

**Impact of running the prompt:** Directly improves Extensibility (+5-8 pts), Documentation (+2-4 pts), Maintainability (+1-3 pts), AI/Agent Readiness (+1-2 pts), Customer Self-Sufficiency (+1-3 pts). Weighted readiness impact: +0.15-0.30%.

### 28. EXECUTED (HOLD) Capture Credentialed Real-AOAI Golden Cohort Evidence

**Why it matters:** The strongest remaining AI proof gap is not another simulator artifact; it is a fresh, credentialed real Azure OpenAI run with faithfulness, schema, cost, and grounding evidence.

**Expected impact:** Materially improves buyer confidence in AI/agent correctness and proof density.

**Affected qualities:** AI/Agent Readiness, Correctness, Cutting-Edge AI Technology, Trustworthiness.

**Status:** EXECUTED **HOLD** (2026-05-30).

**Outcome:** Local dev gate run with owner credentials. **Topology smoke PASS** (parseFailures=0, evidenceRefsObserved=true). **Full pipeline FAIL** on decision merge (`mergeSuccess=false`). Redacted artifacts: `artifacts/release/real-llm-evidence-gate.md`, `.json`, topology and full-pipeline metrics JSON. Session record: `docs/quality/REAL_LLM_SESSION_2026-05-30.md`. Follow-up: multi-agent merge reliability (TB-138) before claiming PASS.

**Impact applied:** Partial credit for archived live topology evidence (+16 weighted points: AI/Agent +1, Correctness +1). Full PASS credit (+0.45–0.80%) remains when multi-agent merge reaches PASS (TB-138).

### 29. DEFERRED V1.1 Validate Production Availability Evidence Against Contract Terms

**Why it matters:** Enterprise buyers will distinguish engineering targets from measured production availability.

**Expected impact:** Improves enterprise procurement confidence when production probe data and contract terms exist.

**Affected qualities:** Availability, Reliability, Procurement Readiness, Trustworthiness.

**Status:** DEFERRED — V1.1 / procurement-realism scope, excluded from `(A)` scoring.

**Reason it is deferred:** This is contract-specific production assurance work, not a current weighted `(A)` readiness gate. Meaningful validation requires production base URLs, probe history, incident/exclusion decisions, and owner-approved contractual SLA wording. Tooling can be prepared now, but the evidence claim cannot be completed without those inputs.

**Specific information needed from you later:** Production URL(s), measurement window, accepted exclusions, incident log source, whether the claim is pre-contractual or customer-contractual, and who approves buyer-visible SLA language.

**Impact of running later:** Directly improves Availability (+8-12 pts), Reliability (+2-4 pts), Procurement Readiness (+2-4 pts), Trustworthiness (+1-3 pts). Weighted readiness impact: +0.15-0.35%.

## 10. Prompt Batching Guidance

**Batch A — Buyer-facing documentation and claim hygiene:** Improvements 1, 2, 5, 7, 8, 16, and 19. This is the best first batch because it reduces commercial and procurement friction without needing secrets or production access.

**Batch B — Retrieval, isolation, and auth safety:** Improvements 3, 4, 14, and 15. Keep this batch focused on security/correctness because it touches retrieval, tenant isolation, and auth contracts.

**Batch C — Commercial packaging and proof discipline:** Improvements 9, 10, 11, 18, and 24. This turns current product capabilities into safer selling artifacts, keeps ROI/evidence claims aligned, and adds repeat-review activation.

**Batch D — Operations and enterprise readiness:** Improvements 12, 13, 20, 21, 22, 25, and 26. This batch improves manageability, supportability, availability narrative, SSO readiness, maintainer usability, audit semantics, and performance/scalability evidence.

**Batch E — AI evidence and extensibility readiness:** Improvements 23 and 27 completed. Improvement **28 executed (HOLD 2026-05-30)** — topology live evidence archived; full merge PASS remains follow-up.

**Batch F — V1.1 production SLA evidence:** Improvement 29 should wait until production probe sources and owner-approved contract posture are available. It is excluded from `(A)` scoring and should not be mixed with general docs cleanup because it can accidentally create unsupported public claims.

## 11. Pending Questions for Later

### DEFERRED Capture Credentialed Real-AOAI Golden Cohort Evidence

- Resolved: use endpoint `https://oai-archlucid-dev.openai.azure.com/` with deployment `gpt-4o`.
- Resolved: use API-key authentication from local gitignored config.
- Resolved: use a conservative **$10 maximum spend per golden-cohort evidence run** unless superseded.
- Resolved: run against **local dev** only; keep it manual and non-CI-gating so it does not disturb CI.
- Resolved: preserve/export run evidence and commit redacted metrics/evidence to the repo.
- Resolved: evidence-recording only for CI/deployment safety. Record **PASS / HOLD / FAIL** and keep working HOLD/FAIL outcomes, but do not fail CI or deployment.

### DEFERRED V1.1 Validate Production Availability Evidence Against Contract Terms

- Resolved: use `https://www.archlucid.net` as the production availability measurement URL. Current staging use must move to `https://staging.archlucid.net`, with restricted authentication and IP restrictions before treating `www.archlucid.net` as production evidence.
- Resolved: use a **30-day** probe window for the official V1.1 production availability rollup. Shorter 7-day or 14-day rollups may be used only as provisional internal readiness checks, not buyer-facing availability evidence.
- Resolved: exclude only scheduled maintenance announced in advance, customer/ISP/DNS issues outside ArchLucid control, Azure regional incidents confirmed by Azure status, and blocked/unauthorized traffic caused by the intended authentication/IP restrictions.
- Resolved: first availability statement should be **pre-contractual marketing/procurement evidence**, not a customer-specific contractual SLA representation. Customer-specific SLA language should be handled only in signed order forms or MSAs.
- Resolved: owner/founder approves final buyer-visible pre-contractual availability wording; legal review is required before using the wording as a customer-specific contractual SLA in an order form or MSA.

### Route Customer-Facing Help Away From GitHub Blob URLs

- Resolved: remove source links entirely from product UI, including any developer/admin “View source on GitHub” affordance. Contributor-only docs may keep source links.

### Service-Led Quote/SOW Pack

- Resolved: default first commercial push is **ArchLucid AI & Cloud Architecture Readiness Review**. It is broad enough for the current proof engine, concrete enough to sell, and avoids over-narrowing the wedge too early.

### Procurement-Pack Strict Mode

- Resolved: make strict procurement-pack validation a **release gate first**, then promote to a PR gate after the repo is clean and false positives are low.
