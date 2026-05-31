> **Scope:** ArchLucid Assessment – (A) Headline Readiness: 87.18% - full detail, tables, and links in the sections below.

# ArchLucid Assessment – (A) Headline Readiness: 87.18%

This score represents the `(A)` headline readiness per `Assessment-Scope-V1_1.mdc`, excluding deferred items. Prior scores were revised after Tier 2 closure (87.00%), then post-Tier 2 run-detail server-authoritative savings (TB-103 run-level parity, 2026-05-31).

Deferred items explicitly excluded from the weighted `(A)` score: CPA SOC 2 attestation, ISO certification, signed design partner, owner-output GTM assets/cohorts, public third-party plugin SDK, MCP absence in V1 (V1.1 scoped), third-party plugin marketplace, participant assistive-technology user testing, third-party pen-test execution/publication, broad self-serve commerce un-hold (Stripe live keys/Marketplace Published), production availability evidence against contract-specific SLA terms, multi-region active/active guarantees, first-party ITSM/Confluence/Teams/Slack connectors (V1.1), and other items documented as V1.1/V2 or owner/backlog scope in `V1_DEFERRED.md`.

Weighted calculation: total weighted points = `10,375 / 11,900 = 87.18%`.

**Previous session context (recorded for continuity, not used for scoring):**
- Batches A–E completed (2026-05-30): Improvements 1–2, 3–4, 5–7, 8–11, 12–13, 14–16, 17–21, 22–26, 27.
- Improvement #28 executed with HOLD: topology smoke PASS, full pipeline merge FAIL. Archived under `artifacts/release/`. Multi-agent merge follow-up tracked as TB-138.
- **Tier 1 closure (2026-05-30/31):** Improvements **1–5** shipped to `master`.
- **Tier 2 closure (2026-05-31):** Improvements **6–12** shipped on `ci/fix-terraform-prod-outputs` — TB-073 (SQL/in-memory/Cosmos), TB-074, TB-082, TB-075, TB-033, TB-114, TB-079, TB-091–092, TB-115–117.

---

## 2. Executive Summary

### `(A)` Overall Headline Readiness

ArchLucid is a credible V1 pilot-ready architecture proof system. Tier 2 is closed; post-Tier 2 work aligned run-detail savings with the executive ROI resolver (server-authoritative on `RunDetailDto`). Remaining gaps: proof density for broadest GTM claims, IaC remainder (TB-093–102), and backlog clusters (layering, explainability, recurring review).

### `(B)` Procurement / Market-Motion Realism

Procurement realism remains materially harsher than the `(A)` product-readiness score. The trust center is honest about self-attested SOC 2 posture and third-party pen testing being planned but not scheduled, which is appropriate, but most enterprise procurement teams still treat absent CPA reports as friction. That friction is `(B)` informational and does not reduce `(A)`. The practical buyer motion remains founder-led and service-led, with self-serve checkout, public reference customers, and broad GTM proof explicitly outside the weighted headline score.

### Commercial Picture

The commercial idea — "Architecture Proof Engine" — is clearer than generic AI governance. The product has enough mechanics to support paid architecture reviews. Run detail visibility and executive KPI authority improvements reduce demo embarrassment risk on the highest-stakes operator and sponsor surfaces. The commercial weakness remains frictionless self-serve proof density for the broadest claims without founder translation.

### Enterprise Picture

The enterprise posture is serious for a small product: tenant database isolation (catalog-per-tenant), typed audit events (78), governance approvals, policy packs, SAML/OIDC/SCIM, procurement pack content, DPA/subprocessor/SLA templates, and Azure-native deployment assumptions are all present. Tier 1 P0 items for retrieval tenant OData filtering and API-key scope binding are closed. Tier 2 closed retrieval write-path validation (TB-074), graph-reuse snapshot scope (TB-073 SQL/in-memory), AllowedTools dispatch guard (TB-082), ADO PR markdown escaping (TB-079), and production-like UI proxy scope (TB-075 partial). Remaining enterprise absorption work is Cosmos snapshot tenant metadata (TB-073 remainder), `terraform-private` Key Vault reachability (TB-091–092), and session-authoritative SSR scope (TB-075 remainder).

### Engineering Picture

The engineering system is broad and increasingly mature. Tier 1 batches closed run detail enricher/UI gaps, Azure Search scoped query enforcement, auth scope binding middleware, executive KPI server authority, and credentialed multi-agent merge validation. Tier 2 closed retrieval index write-path tenant validation (TB-074), scoped graph snapshot reuse reads (TB-073), AllowedTools runtime enforcer (TB-082), ADO PR sanitizer (TB-079), and proxy scope resolution (TB-075 partial). The biggest remaining engineering risks are: (1) Cosmos graph snapshot tenant metadata (TB-073 remainder), (2) `terraform-private` Key Vault private endpoint + workload RBAC (TB-091–092), (3) LLM trace sampling params persistence (TB-033), and (4) run-level savings heuristics still parsed client-side outside the executive rollup.

---

## 3. Weighted Quality Assessment

Qualities are ordered by weighted deficiency signal: `weight × (100 − score)`. Weighted impact is the positive contribution to readiness: `score × weight / 11,900`.

| Urgency | Quality | Score | Weight | Weighted impact on readiness | Weighted deficiency signal | Assessment |
|---:|---|---:|---:|---:|---:|---|
| 1 | Marketability | 84 | 8 | 5.65% | 128 | Service-led motion, policy packs, claim checklist, and SOW template are in place. Accelerator chooser + wizard deep-links reduce evaluator friction; proof density for broadest claims remains the binding constraint. |
| 2 | Cutting-Edge AI Technology | 85 | 8 | 5.71% | 120 | Multi-agent execution, RAG, grounding traces, eval harnesses, and Azure OpenAI support are real; credentialed full-pipeline gate PASS (TB-138). Not yet an advanced autonomous/agentic or continuously validated AI platform at production scale. |
| 3 | Adoption Friction | 86 | 6 | 4.34% | 84 | Hosted SaaS path, platform-provisioned AOAI, in-app help, path chooser, and accelerator chooser with pack deep-links reduce first-10-minute friction (TB-114 **Done**). Configuration branching still creates enterprise ambiguity. |
| 4 | AI/Agent Readiness | 93 | 8 | 6.25% | 56 | Multi-agent pipeline handles live LLM field aliases; quad-agent schema merge tested; TB-138 full-pipeline validation **Done** (`real-llm-evidence-gate.md` PASS). Azure Search production client registers `AzureSearchSdkClient` with mandatory OData scope (TB-071 **Done**). |
| 5 | Correctness | 93 | 8 | 6.25% | 56 | Run detail enricher + UI close TB-106–108; merge normalizer/converter closes improvement #28 gaps; TB-138 PASS. Run-level savings parser heuristics remain on run detail (outside executive rollup). |
| 6 | Stickiness | 83 | 6 | 4.19% | 102 | Compare/replay/drift/knowledge graph drive second-review usage. Repeat-review activation on operator home. Recurring review workflow (TB-057–063) is in backlog. |
| 7 | Time-to-Value | 89 | 7 | 5.24% | 77 | Pilot path is clear. Accelerator chooser maps buyer jobs to starter packs with `?accelerator=` wizard prefill (TB-114 **Done**). Repeat-review prompt shortens second-review path. |
| 8 | Proof-of-ROI Readiness | 87 | 5 | 3.66% | 65 | Cross-surface ROI source/freshness consistency tests exist. Executive orphan, expiring-waiver, and business-impact buckets are server-authoritative (TB-103–105 **Done**). |
| 9 | Workflow Embeddedness | 79 | 3 | 1.99% | 63 | Repeat-review activation surfaces compare/replay/value-report. Azure DevOps/GitHub CI integration. First-party ITSM connectors are V1.1. |
| 10 | Differentiability | 87 | 4 | 2.92% | 52 | Execution-mode label invariants, trust card, provenance footer, and "Architecture Proof Engine" framing are distinct. |
| 11 | Usability | 87 | 3 | 2.19% | 39 | Progressive Pilot/Operate framing, in-app help, path chooser. Run detail page now surfaces cost, trust, agent results, governance warnings, and commit-blocking coverage (TB-106–108 **Done**). |
| 12 | Executive Value Visibility | 88 | 4 | 2.96% | 48 | Cross-run ROI summary, sponsor brief, board export, business impact widget reads server bucket counts (TB-105 **Done**). |
| 13 | Trustworthiness | 92 | 3 | 2.32% | 24 | Honest trust posture, claim checklist, accessibility disclosure. Retrieval OData scope, auth scope binding, ADO PR escaping, and production-like proxy scope (TB-075 **Done**) reduce latent trust risk. |
| 14 | Commercial Packaging Readiness | 82 | 2 | 1.38% | 36 | SOW template, order form, service-led offer docs. Stripe wiring is done; live-keys flip is V1.1 owner-gated. |
| 15 | Security | 98 | 3 | 2.47% | 6 | Strong baseline plus TB-071–074, TB-073 Cosmos graph scope, TB-082, TB-079, TB-075, TB-091–092 Key Vault PE + workload RBAC in Terraform (**Done**). |
| 16 | Maintainability | 80 | 2 | 1.34% | 40 | Drift guards for critical docs exist. The surface area (41+ csproj, 100+ doc files, multiple generated clients) creates drift pressure. TB-027–032 (dependency graph violations) are backlog. |
| 17 | Interoperability | 79 | 2 | 1.33% | 42 | REST, CLI, SCIM, Azure/GitHub CI surfaces, Service Bus, and export formats. ADO PR markdown escaping closes integration hygiene gap (TB-079 **Done**). First-party ITSM/Confluence connectors are V1.1. |
| 18 | Architectural Integrity | 86 | 3 | 2.17% | 42 | API/Application/Persistence/Worker/UI boundaries are coherent. Dapper/DbUp. Outbox. Azure-first. Tenant catalogs. New normalizer/serializer follow the correct seam pattern. TB-027–032 (layering violations) are backlog. |
| 19 | Procurement Readiness | 83 | 2 | 1.39% | 34 | Strict `--deal-ready` procurement validation is a CI release gate. Trust center is honest. DPA/SLA/subprocessor templates exist. |
| 20 | Compliance Readiness | 82 | 2 | 1.38% | 36 | VPAT 2.5, CAIQ/SIG/DPA templates, SOC 2 self-assessment and roadmap. Formal attestations are deferred and excluded from `(A)`. |
| 21 | Decision Velocity | 81 | 2 | 1.36% | 38 | Reviews produce committed artifacts quickly. Trust-building and onboarding choice branching slow enterprise decision cycles. |
| 22 | Traceability | 92 | 3 | 2.32% | 24 | Run IDs, manifests, provenance, audit events, correlation IDs, trace bundles. TB-033 persists LLM sampling params + reasoning tokens on traces (**Done**). |
| 23 | Reliability | 84 | 2 | 1.41% | 32 | Health checks, outboxes, retry paths, live E2E, k6 smoke, release drills. Contract-specific production availability evidence is V1.1 scope. |
| 24 | Cognitive Load | 76 | 1 | 0.64% | 24 | Path chooser and in-app help reduce wrong next-step detours. Product breadth — 40+ capabilities across Pilot/Operate layers — is structurally high. |
| 25 | Data Consistency | 92 | 2 | 1.55% | 16 | ROI source rows and freshness disposition tested. Executive dashboard orphan, waiver, and category buckets are server-authoritative (TB-103–105 **Done**). |
| 26 | Explainability | 90 | 2 | 1.51% | 20 | Execution-mode labels, provenance, decision traces. Trace rows now include completion temperature/max tokens for forensic replay (TB-033 **Done**). |
| 27 | Azure Compatibility and SaaS Deployment Readiness | 91 | 2 | 1.53% | 18 | Azure-first architecture, container images, Terraform modules. Key Vault private endpoint + workload RBAC codified in `terraform-private` and `terraform-keyvault` (TB-091–092 **Done**). TB-093–102 (remaining IaC coverage) are backlog. |
| 28 | Policy and Governance Alignment | 89 | 2 | 1.50% | 22 | 23 policy packs, governance gate, governance dashboard, policy CI harness. |
| 29 | Documentation | 82 | 1 | 0.69% | 18 | Custom-handler extensibility checklist, failure triage runbook. Some drift risk as surface area grows. |
| 30 | Customer Self-Sufficiency | 83 | 1 | 0.70% | 17 | Path chooser and `/help/{topic}` improve self-service. Run detail visibility gaps closed (TB-106–108 **Done**). |
| 31 | Extensibility | 83 | 1 | 0.70% | 17 | Custom-handler guide, registration proof tests. Not a public SDK — advanced-integrator work only. |
| 32 | Scalability | 78 | 1 | 0.66% | 22 | SQL, outbox, optional Redis, k6 smoke, Azure-native deployment. Production fleet scale proof is early. |
| 33 | Manageability | 78 | 1 | 0.66% | 22 | Config references, health, support bundle, admin settings, budgets, runbooks. High number of configuration knobs. |
| 34 | Performance | 79 | 1 | 0.66% | 21 | k6 smoke and performance baselines. Production latency/capacity evidence at scale is limited. |
| 35 | Deployability | 85 | 1 | 0.71% | 15 | Auth behavior contract, Dockerfiles, compose profiles, Terraform modules including KV PE/RBAC. Deployment ambiguity remains for auth mode selection. |
| 36 | Cost-Effectiveness | 80 | 1 | 0.67% | 20 | LLM cost controls, budgets, caching, Azure cost modeling. Real unit economics depend on actual model spend under production conditions. |
| 37 | Auditability | 91 | 2 | 1.53% | 18 | Typed audit events, append-only SQL, matrix export. TB-033 strengthens LLM call reconstructability for compliance reviewers. |
| 38 | Template and Accelerator Richness | 90 | 1 | 0.76% | 10 | Policy-pack harness, SOW template, `ACCELERATOR_CHOOSER.md`, operator-home chooser, `?accelerator=` wizard prefill, CI pack validation + dry-run tests (TB-114–117 **Done**). |
| 39 | Supportability | 85 | 1 | 0.71% | 15 | Failure triage matrix, CLI doctor, support bundle. TB-033 trace params aid support forensics (**Done**). |
| 40 | Availability | 86 | 1 | 0.72% | 14 | Health checks, probes, readiness endpoints. Contractual production availability evidence and multi-region active/active are excluded from `(A)`. |
| 41 | Testability | 90 | 1 | 0.76% | 10 | Strong test tiers, SQL integration, live UI E2E, mutation testing, k6, ZAP, Schemathesis. Tier 2 added scope-binding, ADO escaper, proxy scope, pack dry-run, and accelerator wizard tests. Real AI E2E coverage remains environment-gated. |

---

## 4. Top 12 Most Important Weaknesses

1. **Run-level savings heuristics remain client-side outside the executive rollup.** Executive KPIs are server-authoritative (TB-103–105 **Done**); run detail may still parse savings locally.

2. **Proof density still lags product breadth.** TB-138 closed merge validation; GTM proof packaging for broadest claims remains a commercial risk.

3. **Documentation drift risk grows with surface area.** The product has enough docs that stale claims are now an engineering risk. Bulk-upload cap text, audit-gap wording, auth-mode descriptions, and trust-center posture can drift faster than manual review catches.

4. **Onboarding has too many decision branches.** Enterprise implementers face ambiguous choices across auth (Entra/OIDC/SAML/API key), storage (SQL topology mode), execution mode (simulator/real), retrieval provider (in-memory/Azure Search), and deployment profile.

5. **Decisioning explainability gaps (TB-050–056).** Operators cannot fully trace manifest decisions from inputs through rules/prompts to confident outputs on every surface; run detail visibility is fixed but deeper explainability fields remain backlog.

6. **Recurring review workflow is not shipped (TB-057–063).** Compare/replay/drift exist, but the monitored-risk / digest cadence that drives stickiness is still backlog.

7. **Remaining IaC coverage gaps (TB-093–102).** Azure OpenAI, Redis, Cosmos provisioning, ACR, and diagnostic settings remain partially out-of-band in some deployment roots.

8. **Dependency graph / layering violations (TB-027–032).** Documented architectural debt; non-blocking for pilot but increases maintainability drift pressure.

---

## 5. Top 6 Monetization Blockers

1. **Insufficient repeatable proof for broad claims.** Buyers may understand the product but hesitate unless real-mode outputs, ROI sources, and proof packets are consistently defensible. TB-138 PASS strengthens the AI story; GTM proof packaging remains the binding commercial constraint.

2. **Self-serve commerce is intentionally out of scope.** This does not reduce `(A)`, but it means every revenue requires quote-to-cash and founder-led services for the foreseeable future.

3. **Buyer-facing documentation friction.** Some help links, stale limits, and duplicated trust pages make the product feel less finished than the underlying engineering warrants.

4. **Procurement confidence is self-attested.** SOC 2 CPA and third-party pen test are excluded from `(A)`, but they still slow enterprise revenue in `(B)` for organizations with rigid procurement gatekeepers.

5. **Run-level savings display may still diverge from executive rollup heuristics.** Executive dashboard KPIs are server-authoritative; per-run savings cards outside that rollup can still confuse sponsors if heuristics differ.

6. **UI proxy scope (TB-075) remains a demo/review talking point.** API auth binding is fixed, but security reviewers may still ask about browser-controlled scope headers until the Next.js proxy is hardened.

---

## 6. Top 6 Enterprise Adoption Blockers

1. **P1 snapshot IDOR hardening incomplete (TB-073).** API route guards and scoped primary reads exist, but graph reuse (`GetLatestByContextSnapshotIdAsync`) and some child loads remain partially unscoped in SingleCatalog mode.

2. **Operator UI proxy scope (TB-075).** Enterprise security reviewers may flag client-controlled `x-tenant-id` through the Next.js proxy even when the API rejects mismatched auth scope.

3. **Onboarding has too many decision branches.** Enterprise implementers face ambiguous choices across auth (Entra/OIDC/SAML/API key), storage (SQL topology mode), execution mode (simulator/real), retrieval provider (in-memory/Azure Search), and deployment profile. This is acceptable for controlled pilots but blocks self-directed enterprise onboarding.

4. **IaC parity gaps create audit failures.** An enterprise InfoSec team that audits the Terraform state will find Key Vault private endpoint, Key Vault role assignments, AOAI, Redis, and AI Search managed outside IaC. This contradicts the IaC-first posture documented in V1_SCOPE.md. (TB-091–092, 093–096)

5. **Support model is founder-operated.** Support policy exists, but larger enterprise adoption will require evidence that triage, escalation, and incident communication work without heroic founder involvement.

6. **Procurement attestations deferred (V1.1 backlog).** CPA SOC 2 and third-party pen test are honestly disclosed and excluded from `(A)`, but remain `(B)` friction for rigid gatekeepers.

---

## 7. Top 6 Engineering Risks

1. **TB-073 (P1): Residual snapshot repository scoping.** Primary scoped reads and API IDOR tests exist; **`GetLatestByContextSnapshotIdAsync` and some child relational loads** remain the highest-risk persistence gaps in SingleCatalog mode.

2. **TB-075 (P1): UI proxy scope.** Browser-forwarded tenant headers create a client-controlled resolution path until the Next.js proxy strips or server-binds scope.

3. **Docs/code drift under surface area pressure.** The system is large enough that a new route, a new agent type, or a new configuration option can appear in code without being reflected in the audit matrix, the route-tier-policy-nav matrix, the configuration reference, or the trust center. CI guards exist but cover only declared anchor points.

4. **IaC parity (TB-091–102).** Key Vault reachability, workload RBAC, and out-of-Terraform AI/storage resources create deploy-audit mismatches.

5. **TB-082 (P2): Agent tool allowlist is prompt-only.** Runtime dispatch does not enforce `AllowedTools`.

6. **Run-level client savings heuristics.** Executive rollup is server-authoritative; run-detail savings parsing outside that path can still diverge silently.

---

## 8. Most Important Truth

ArchLucid has a functioning multi-agent architecture proof pipeline, strong compliance and governance mechanics, and a clear V1 pilot path. **Tier 1 improvements (1–5) closed the four highest-leverage gaps from the prior assessment:** operator run detail visibility, Azure Search tenant OData scope, API-key/DevBypass scope binding, executive KPI server authority, and credentialed four-agent real-LLM merge validation (TB-138 PASS). The weighted `(A)` score moved from **84.17% to 85.87%**. The product's most serious **remaining** risks are P1 hardening (snapshot graph-reuse reads TB-073, UI proxy scope TB-075), IaC parity (TB-091–092), and commercial proof density — not fundamental architecture or concept gaps.

---

## 9. Top Improvement Opportunities

### Tier 1 — Release Blockers / Must-Fix Now

---

#### Improvement 1 — Fix Run Detail Page P0 Operator Visibility Gaps ✅

**Tier:** 1 — **Done**

**Why it matters:** Operators cannot safely approve or reject a run when cost estimate, trust evidence, governance warnings, failure reasons, and commit-blocking findings are all suppressed. This is the most impactful single operator UX gap because it occurs at the highest-stakes decision point in every review cycle.

**Expected impact:** Operators can see cost, trust posture, governance warnings, and commit-blocking failures before approving. Removes a key demo embarrassment risk.

**Affected qualities:** Correctness (+3–4 pts), Usability (+4–6 pts), Trustworthiness (+2–3 pts), Executive Value Visibility (+2–3 pts), Customer Self-Sufficiency (+2–3 pts).

**Status:** **Done** (2026-05-30/31, merged to `master`). Evidence: `AuthorityRunDetailOperatorEnricher`, `RunAgentResultsSummaryCard`, `RunDetailPageHeader` governance badge, `AuthorityRunDetailOperatorEnricherTests`, UI tests.

**Why ranked #1:** P0 issues on the most-visited page in the operator shell; affects every live review; highest-leverage UX correctness fix available.

**Evidence from repo:** TB-106 confirms `agentExecutionLlmCostEstimate`, `trustEvidenceCard`, and `results[]` are null on every live run because the authority `RunDetailDto` is not enriched from the architecture endpoint. TB-107 confirms `lastFailureReason` and `hasGovernanceWarnings` are fetched but never rendered. TB-108 confirms `hasCommitBlockingFailures` and `dispositionCoverage` are computed in `GetRunDetailAsync` but dropped before render.

**Cursor prompt:**

```
Enrich the operator run detail page with the three P0 visibility gaps documented in TB-106, TB-107, and TB-108.

FILES TO MODIFY:
- `ArchLucid.Application/Runs/RunDetailQueryService.cs` or the relevant GetRunDetailAsync implementation
- `ArchLucid.Api/Models/RunDetailDto.cs` (or equivalent response DTO)
- `archlucid-ui/src/app/(operator)/reviews/[runId]/page.tsx` (or equivalent run detail page/component)
- `archlucid-ui/src/components/RunDetail*` components
- OpenAPI snapshot: `ArchLucid.Api.Tests/Contracts/openapi-v1.contract.snapshot.json`

WHAT TO DO:
1. TB-106: Enrich `RunDetailDto` with `agentExecutionLlmCostEstimate`, `trustEvidenceCard`, and `results[]`. These fields exist on the architecture-endpoint response but are not present on the authority endpoint response. Either: (a) add a secondary architecture-layer fetch inside `GetRunDetailAsync` to populate these fields, or (b) merge the two endpoint responses at the query service level. Choose the approach that avoids duplicating SQL queries unnecessarily.

2. TB-107: Surface `lastFailureReason` and `hasGovernanceWarnings` from `RunRecord` in the run detail UI. Both fields are already fetched in `GetRunDetailAsync` (or accessible on `RunRecord`) but not mapped to the DTO or rendered. Add them to the DTO and render them on the run detail page — failure reason as a dismissible alert when non-null; governance warnings as a warning badge near the commit button.

3. TB-108: Surface `hasCommitBlockingFailures` and `dispositionCoverage` from `findingCoverageSummary` in the run detail UI. These are computed in `GetRunDetailAsync` but dropped. Expose them on the DTO and render: `hasCommitBlockingFailures` as a blocking indicator near the commit button; `dispositionCoverage` as a coverage summary card.

ACCEPTANCE CRITERIA:
- A live run with governance warnings shows the warning count near the commit action.
- A live run with a failure reason shows the failure reason text on the detail page.
- `hasCommitBlockingFailures=true` visually blocks or warns before commit; `false` does not.
- `dispositionCoverage` renders as a summary (e.g., "14/16 findings dispositioned").
- `agentExecutionLlmCostEstimate` renders when non-null (cost estimate card or section).
- `trustEvidenceCard` renders when non-null.
- `results[]` renders agent result summaries when present.
- OpenAPI snapshot is updated to reflect new DTO fields.
- Existing run-detail tests are updated or new tests added for the new fields.

CONSTRAINTS:
- Do not change the authority-run commit API contract.
- Do not add a new public HTTP endpoint; use existing query service patterns.
- Do not break existing run detail rendering for runs that have null values for new fields (render gracefully).
- Do not expose internal-only debug data to the Auditor role.

VERIFY: After changes, mock a run detail response that includes cost estimate, trust evidence, governance warnings, failure reasons, and commit-blocking findings; confirm all render correctly in Vitest/component tests.

EXPECTED IMPACT: Directly improves Correctness (+3–4 pts), Usability (+4–6 pts), Customer Self-Sufficiency (+2–3 pts), Trustworthiness (+2–3 pts), Executive Value Visibility (+2–3 pts). Weighted readiness impact: +0.45–0.65%.
```

---

#### Improvement 2 — Wire Azure Search Production Tenant OData Filter (P0 Security) ✅

**Tier:** 1 — **Done**

**Why it matters:** The production Azure Search client is a stub (`NotConfiguredAzureSearchClient`). When a real Azure AI Search client is wired, every search and delete call must include a tenant-scoped OData filter. Without it, cross-tenant retrieval is unverifiable. This is both a P0 security gap and a correctness gap in the AI/Agent pipeline.

**Expected impact:** Production-like retrieval becomes tenant-safe. Enterprise security reviewers can verify isolation.

**Affected qualities:** Security (+3–5 pts), AI/Agent Readiness (+2–3 pts), Correctness (+2–3 pts), Azure Compatibility (+2–3 pts), Trustworthiness (+1–2 pts).

**Status:** **Done** (2026-05-30/31). Evidence: `AzureSearchSdkClient`, `AzureSearchTenantScopeFilterBuilder.EnsureQueryableScope` / `BuildRequiredScopeFilter`, unit tests, `CONFIGURATION_REFERENCE.md` note.

**Why ranked #2:** P0 security item; blocks production retrieval deployment and enterprise security review.

**Evidence from repo:** TB-071 documents that `AzureSearchTenantScopeFilterBuilder` exists and is tested but only `NotConfiguredAzureSearchClient` is registered. Cross-tenant retrieval is unverifiable in production.

**Cursor prompt:**

```
Close the Azure AI Search production tenant OData filter gap documented in TB-071.

FILES TO INVESTIGATE AND MODIFY:
- `ArchLucid.Retrieval/` — search for the Azure Search client registration and `IAzureSearchClient` implementation
- `AzureSearchTenantScopeFilterBuilder` — existing filter builder (already tested)
- `ArchLucid.Host.Composition/` — storage/retrieval service registration
- Retrieval tests in `ArchLucid.Retrieval.Tests/`

WHAT TO DO:
1. Register a real `IAzureSearchClient` implementation (or equivalent `AzureAiSearchVectorIndex`) when Azure AI Search is configured. The existing `NotConfiguredAzureSearchClient` should remain for unconfigured environments.

2. Ensure every search query path includes the tenant OData filter from `AzureSearchTenantScopeFilterBuilder` (or equivalent) before dispatching to Azure AI Search. The filter must include tenant + workspace + project scope constraints.

3. Ensure every delete path also includes the tenant scope filter before dispatching.

4. Add or extend tests that:
   - Assert that any Azure AI Search query call includes the tenant OData filter when tenant context is set.
   - Assert that omitting tenant context causes the call to fail fast (not silently proceed with an unscoped query).
   - Use a test double / mock for Azure AI Search — do not require live Azure AI Search credentials in normal CI.

ACCEPTANCE CRITERIA:
- Every Azure Search query path asserts tenant scope in an OData filter before dispatch.
- Tests fail if the tenant filter is omitted.
- Configuration docs state that production-like profiles must not run retrieval without scoped filters.
- The `NotConfiguredAzureSearchClient` remains the fallback when AI Search is not configured.

CONSTRAINTS:
- Do not log raw OData filter text containing customer data.
- Do not require live Azure AI Search credentials in CI; use a fake/mock.
- Do not weaken the in-memory index tenant filter that already works.
- Do not widen cross-tenant retrieval.

VERIFY: Run retrieval tests; confirm that a test that omits the tenant context fails or returns an empty result rather than all documents.

EXPECTED IMPACT: Directly improves Security (+3–5 pts), AI/Agent Readiness (+2–3 pts), Correctness (+2–3 pts), Azure Compatibility (+2–3 pts). Weighted readiness impact: +0.35–0.55%.
```

---

#### Improvement 3 — Fix API-Key and DevBypass Scope-to-Identity Binding (P0 Security) ✅

**Tier:** 1 — **Done**

**Why it matters:** API-key and DevBypass authentication paths carry no tenant claims. `x-tenant-id` header alone resolves scope for these paths, which means any holder of a valid API key can select any tenant's data by sending a header. This is a P0 security gap that would fail enterprise security review.

**Expected impact:** API-key-authenticated callers can only access the tenant associated with their key. DevBypass is restricted to non-production environments or developer-configured tenant scope.

**Affected qualities:** Security (+4–6 pts), Trustworthiness (+2–3 pts), Correctness (+1–2 pts).

**Status:** **Done** (2026-05-30/31). Evidence: `ScopeIdentityBindingMiddleware`, `ScopeIdentityBindingValidator`, `HttpScopeContextProvider` (claims over headers), ApiKey/DevBypass claim emission, `ScopeIdentityBindingIntegrationTests`, `docs/library/API_AUTH_BEHAVIOR_CONTRACT.md`.

**Why ranked #3:** P0 security; exploitable by any API-key holder in a multi-tenant deployment.

**Evidence from repo:** TB-072 documents that `ApiKey` and `DevBypass` auth handlers carry zero tenant claims and that `x-tenant-id` header is the sole scope resolver.

**Cursor prompt:**

```
Close the API-key and DevBypass scope-to-identity binding gap documented in TB-072.

FILES TO INVESTIGATE AND MODIFY:
- `ApiKeyAuthenticationHandler` (or equivalent API key auth middleware)
- `DevBypassAuthenticationHandler` (or equivalent)
- `IScopeContextProvider` / `ScopeContextProvider` — how `x-tenant-id` resolves to a `ScopeContext`
- Auth configuration and tests in `ArchLucid.Api.Tests/` and `ArchLucid.Api/`
- Auth behavior contract documentation in `docs/library/contributor-reference/SECURITY.md` or `docs/library/CONFIGURATION_REFERENCE.md`

WHAT TO DO:
1. API-key binding: When the API key is issued, associate it with a specific tenant ID. The `ApiKeyAuthenticationHandler` must set a tenant-identity claim from the stored key record, not from a client-supplied header. If the client sends `x-tenant-id`, validate that it matches the key's associated tenant; reject or log if it does not.

2. DevBypass binding: Restrict DevBypass to developer/CI environments only (non-Production `ASPNETCORE_ENVIRONMENT`). In developer mode, allow a configured default tenant scope rather than a client-controlled header. Add a `BillingProductionSafetyRules`-style startup gate that fails if DevBypass is enabled in Production.

3. Update `ScopeContextProvider` to distinguish between authenticated tenant identity (from claims) and unauthenticated header claims, and to prefer authenticated identity.

4. Update auth behavior contract tests to cover:
   - API key returns the correct tenant scope (not overridden by header).
   - API key with mismatched header returns 403 or logs a security warning.
   - DevBypass in Production fails startup or returns 403.

ACCEPTANCE CRITERIA:
- An API key associated with tenant A cannot access tenant B's data by sending `x-tenant-id: tenantB`.
- DevBypass is disabled in Production by startup rule.
- Auth contract tests cover these behaviors.
- Existing developer CI workflows that use DevBypass continue to work in non-Production environments.

CONSTRAINTS:
- Do not break existing JWT bearer / OIDC paths (they already carry tenant claims).
- Do not add a new HTTP header or auth scheme.
- Do not require database changes for the API key store unless the key record does not currently store tenant association.
- Existing integration tests that depend on DevBypass must be updated to run in non-Production configuration.

VERIFY: Run auth behavior contract tests; confirm an API key cannot select an arbitrary tenant via header.

EXPECTED IMPACT: Directly improves Security (+4–6 pts), Trustworthiness (+2–3 pts), Correctness (+1–2 pts). Weighted readiness impact: +0.35–0.55%.
```

---

#### Improvement 4 — Fix Client-Side KPI Divergence (Orphan Savings, Expiring Waivers, Category Buckets) ✅

**Tier:** 1 — **Done**

**Why it matters:** Three business-critical KPIs in the executive dashboard are computed with different inputs or logic than the server. Orphan-candidate savings use a different algorithm than `OrphanedResourceClassifier`. The 14-day expiring-waiver filter lives only in the browser. Category bucketing uses substring matching. Any of these can report wrong numbers to sponsors, which is a direct sales-trust risk.

**Expected impact:** Executive dashboard KPIs match server-computed truth. Sponsor briefings are not embarrassed by divergent numbers.

**Affected qualities:** Data Consistency (+4–6 pts), Correctness (+2–3 pts), Executive Value Visibility (+3–4 pts), Proof-of-ROI Readiness (+2–3 pts), Trustworthiness (+1–2 pts).

**Status:** **Done** (2026-05-30/31). Evidence: `ExecutiveRoiSummaryResponse` orphan/waiver/category fields, `ExecutiveBusinessImpactCategoryClassifier`, `BusinessImpactSummaryWidget` reads `businessImpactCategoryCounts`, classifier tests.

**Why ranked #4:** Client-side divergence from server truth is silent and will surface during buyer scrutiny of ROI claims.

**Evidence from repo:** TB-103 (orphan savings divergence), TB-104 (14-day filter), TB-105 (category bucketing in `BusinessImpactSummaryWidget`).

**Cursor prompt:**

```
Move three client-side KPI computations server-side to close the divergence documented in TB-103, TB-104, and TB-105.

FILES TO INVESTIGATE AND MODIFY:
- `ArchLucid.Application/Roi/ExecutiveRoiSummaryService.cs` — add server-computed fields
- `ExecutiveRoiSummaryResponse` DTO (or equivalent) — add new fields
- `archlucid-ui/src/app/(operator)/dashboard/_sections/ExecutiveRoiSummarySection.tsx`
- `archlucid-ui/src/components/ExecutiveRoiDashboardLiveKpiCards.tsx` (or similar)
- `archlucid-ui/src/components/BusinessImpactSummaryWidget.tsx`
- `archlucid-ui/src/lib/run-potential-savings-parser.ts`
- OpenAPI snapshot: `ArchLucid.Api.Tests/Contracts/openapi-v1.contract.snapshot.json`

WHAT TO DO:
1. TB-103: Add `orphanCandidateCount` and `orphanCandidateEstimatedSavingsUsd` to `ExecutiveRoiSummaryResponse`, computed by `OrphanedResourceClassifier` (server side) using the same inputs as the authority pipeline. Remove or deprecate `run-potential-savings-parser.ts` orphan logic in the UI; replace with server-provided values.

2. TB-104: Add `expiringWaiverCount` (waivers expiring within 14 days) to `ExecutiveRoiSummaryResponse`, computed server-side using the same 14-day window. Remove the client-side date filter from `ExecutiveRoiDashboardLiveKpiCards.tsx`.

3. TB-105: Add `businessImpactCategoryCounts` (a map of category label to count) to `ExecutiveRoiSummaryResponse`, computed server-side using the same category classification as the authority pipeline finding records. Replace the `BusinessImpactSummaryWidget` substring matcher with a direct read of this server-provided map.

ACCEPTANCE CRITERIA:
- All three KPI values are present in the `ExecutiveRoiSummaryResponse` API response.
- The UI reads server-provided values for all three (no client-side computation remains for these metrics).
- OpenAPI snapshot is updated.
- Server-side unit tests cover orphan savings, expiring waiver count, and category counts.
- UI tests assert the display values come from the API response, not recomputed in the browser.

CONSTRAINTS:
- Do not change the existing `GET /v1/roi/executive-summary` URL path.
- Do not remove other existing fields from `ExecutiveRoiSummaryResponse`.
- Do not add cross-tenant SQL queries; all aggregation must stay within the authenticated tenant's data.
- Do not deprecate `run-potential-savings-parser.ts` other functions if used outside the three KPIs being moved.

VERIFY: Run unit tests for `ExecutiveRoiSummaryService` covering the three new fields; confirm UI tests read from API response.

EXPECTED IMPACT: Directly improves Data Consistency (+4–6 pts), Correctness (+2–3 pts), Executive Value Visibility (+3–4 pts), Proof-of-ROI Readiness (+2–3 pts). Weighted readiness impact: +0.45–0.65%.
```

---

#### Improvement 5 — Validate Full Multi-Agent Merge Pipeline with Real AOAI (TB-138 Follow-Up) ✅

**Tier:** 1 — **Done**

**Why it matters:** The topology smoke PASS is archived but the full four-agent (topology + compliance + cost + critic) pipeline merge failed in the credentialed run (improvement #28 HOLD). The new `AgentResultMergeNormalizer`, `ArchitectureFindingJsonConverter`, and `AgentResultMergeSchemaSerializer` directly target the cause of that failure. This improvement validates that the fix works end-to-end.

**Expected impact:** Confirms the multi-agent merge pipeline produces a valid manifest from a credentialed real Azure OpenAI run with all four agent types.

**Affected qualities:** Correctness (+2–3 pts), AI/Agent Readiness (+2–3 pts), Cutting-Edge AI Technology (+2–3 pts), Trustworthiness (+1–2 pts).

**Status:** **Done** (2026-05-30). Evidence: `scripts/Invoke-RealLlmEvidenceGate.ps1` **PASS**; `artifacts/release/real-llm-evidence-gate.md`; `mergeSuccess=true`, `manifestServiceCount=2`, `decisionTraceCount=34`, `parseFailures=0`.

**Why ranked #5:** Closes the HOLD from improvement #28; the highest-value validation gap for the AI/Agent correctness story.

**Evidence from repo:** `ArchLucid.AgentRuntime.Tests/RealAzureOpenAIEndToEndTests.cs` is the live integration test. The new normalizer (`AgentResultMergeNormalizer`) and converter (`ArchitectureFindingJsonConverter`) are registered in `AgentResultParser.JsonOptions`. The `DecisionEngineServiceQuadAgentSchemaMergeTests` tests the merge path with synthetic payloads.

**Cursor prompt:**

```
Run and validate the full multi-agent real Azure OpenAI end-to-end merge test to close the TB-138 HOLD.

CONTEXT:
- `ArchLucid.AgentRuntime.Tests/RealAzureOpenAIEndToEndTests.cs` contains the live integration test.
- Improvement #28 HOLD: topology smoke PASS, full pipeline merge FAIL (archived).
- This session added `ArchitectureFindingJsonConverter`, `AgentResultMergeNormalizer`, `AgentResultMergeSchemaSerializer`, and updated `AgentTopologyProposalJsonConverter`. These target the merge failure.
- `scripts/Invoke-RealLlmEvidenceGate.ps1` is the gate script.

WHAT TO DO:
1. Run `RealAzureOpenAIEndToEndTests` with live credentials (`ARCHLUCID_REAL_AOAI_TEST_ENDPOINT`, `ARCHLUCID_REAL_AOAI_TEST_KEY`, optional `ARCHLUCID_REAL_AOAI_TEST_DEPLOYMENT`). 
   - If the test passes: capture the metrics JSON via `ARCHLUCID_REAL_LLM_RUN_METRICS_JSON` output. Archive metrics under `artifacts/release/` and update `docs/quality/REAL_LLM_SESSION_2026-05-30.md` (or a new dated session file) with the pass result and metrics.
   - If the test still fails: capture the failure mode (which agent, which merge step, what exception). Examine whether the `AgentResultMergeNormalizer` normalized the failing field. Extend the normalizer or converter to cover the additional case, add a unit test, and re-run.

2. Regardless of pass/fail: add a test in `ArchLucid.AgentRuntime.Tests/` that validates the full four-agent merge path using synthetic LLM-shaped JSON payloads (without live credentials), using the new normalizer and converter. This test should cover:
   - `description` field alias for `Message`
   - Numeric severity (e.g., `"severity": 2`)
   - `ProposedChanges: []` (empty array → null)
   - Missing `FindingId` (→ auto-generated GUID)
   - Missing `SourceAgent` (→ inferred from AgentType)

ACCEPTANCE CRITERIA:
- Either: live credential run produces a committed manifest with all four agent results represented, and metrics are archived; or: failure is documented with the specific root cause and a targeted fix is applied.
- Synthetic unit tests cover all five normalizer/converter edge cases listed above.
- `docs/quality/` session record is updated.

CONSTRAINTS:
- Do not commit live API keys or credentials.
- Do not make the live integration test mandatory in CI (keep `Skip.IfNot` pattern).
- Do not assume the test will pass without credentials available in the environment.

VERIFY: Run the synthetic unit tests without credentials; confirm they pass. With credentials: run the live test and confirm PASS or document the remaining failure mode.

EXPECTED IMPACT: Directly improves Correctness (+2–3 pts), AI/Agent Readiness (+2–3 pts), Cutting-Edge AI Technology (+2–3 pts). Weighted readiness impact: +0.40–0.65%.
```

---

### Tier 2 — High-Leverage Next Wave

---

#### Improvement 6 — Fix Snapshot Repository IDOR (TB-073) and Retrieval Write-Path Tenant Validation (TB-074)

**Tier:** 2

**Why it matters:** Two P1 security gaps allow tenant data to bleed across boundaries: ID-only snapshot reads (IDOR) and retrieval indexing that trusts document-supplied tenant metadata without validating against ambient scope. These create concrete data-leak paths in multi-tenant production.

**Expected impact:** Snapshot reads are tenant-bound at the query layer. Retrieval write path validates document tenant against ambient scope.

**Affected qualities:** Security (+3–5 pts), Trustworthiness (+2–3 pts), Architectural Integrity (+1–2 pts).

**Status:** **Done** (2026-05-31). TB-074 **Done**. TB-073 **Done** for SQL, in-memory, API IDOR tests, and **Cosmos** tenant metadata on `GraphSnapshotDocument` with scoped reads/writes.

**Why ranked #6:** P1 security items; completes retrieval/snapshot isolation after Tier 1 P0 closure.

**Evidence from repo:** TB-073 partial — `ScopedSnapshotReadIdorIntegrationTests`, scoped `GetByIdAsync` / list / update on findings; remaining gap on graph reuse path. TB-074 **Done** — `RetrievalIndexingScopeValidator`.

**Cursor prompt:**

```
Close the two P1 tenant-boundary enforcement gaps documented in TB-073 and TB-074.

PART A — TB-073: Snapshot repository IDOR prevention

FILES TO INVESTIGATE:
- `ArchLucid.Persistence/Repositories/` — snapshot repositories (findings, graph, context, manifest child loads)
- `IContextSnapshotRepository`, `IFindingSnapshotRepository`, or equivalent
- SQL queries for `GetByIdAsync(Guid)` and related child-load queries

WHAT TO DO:
1. Identify all `GetByIdAsync(Guid snapshotId)` implementations that do not join or filter on `TenantId`.
2. Add a `tenantId` parameter (from ambient `ScopeContext`) to each read query where missing, and join on `TenantId` in the SQL WHERE clause.
3. In `SingleCatalog` mode, assert that the tenant context is always present before executing snapshot reads; throw a security exception if not.
4. Add contract tests: request a snapshot ID from tenant A while authenticated as tenant B; assert the result is null or 403, not the tenant A snapshot.

PART B — TB-074: Retrieval write-path tenant validation

FILES TO INVESTIGATE:
- `ArchLucid.Retrieval/RetrievalIndexingService.cs` (or equivalent)
- Retrieval document models — where `TenantId` is sourced

WHAT TO DO:
1. In `RetrievalIndexingService` (or wherever retrieval documents are written to the index), validate that the `TenantId` in the document being indexed matches the ambient `ScopeContext.TenantId`.
2. If they do not match: log a security warning and reject the write (throw an exception or return an error).
3. Add a unit test: attempt to index a document whose tenant metadata does not match the ambient scope; assert rejection.

ACCEPTANCE CRITERIA:
- Snapshot reads in any repository include tenant scope in the SQL WHERE clause (or equivalent).
- A cross-tenant snapshot read (correct ID, wrong tenant) returns null or throws, not the actual snapshot.
- Retrieval write path rejects documents whose tenant metadata does not match ambient scope.
- Tests cover both enforcement points.

CONSTRAINTS:
- Do not break existing single-tenant or InMemory tests.
- Do not change the public API contracts or response shapes.
- Do not introduce cross-tenant SQL joins.

VERIFY: Run persistence contract tests and retrieval tests; confirm cross-tenant read and write are rejected.

EXPECTED IMPACT: Directly improves Security (+3–5 pts), Trustworthiness (+2–3 pts). Weighted readiness impact: +0.25–0.40%.
```

---

#### Improvement 7 — Add Agent AllowedTools Runtime Enforcer (TB-082)

**Tier:** 2

**Why it matters:** `AgentTask.AllowedTools` is advisory only. An agent can invoke any registered handler regardless of the task's allowlist. This undermines the authority/safety posture that ArchLucid documents as a key differentiator.

**Expected impact:** Agent tool invocations are bounded to the declared allowlist at dispatch time.

**Affected qualities:** Security (+2–3 pts), Correctness (+1–2 pts), Trustworthiness (+1–2 pts), AI/Agent Readiness (+1–2 pts).

**Status:** **Done** (2026-05-31). Evidence: `AgentTaskAllowedToolsDispatchGuard`, `AgentToolNotAllowedException`, `RealAgentExecutorSingleHandlerExecution` dispatch guard, unit tests.

**Cursor prompt:**

```
Add a runtime tool-dispatch enforcer for AgentTask.AllowedTools at the RealAgentExecutor level (TB-082).

FILES TO INVESTIGATE AND MODIFY:
- `ArchLucid.AgentRuntime/RealAgentExecutor.cs` (or equivalent handler dispatch)
- `AgentTask` model — `AllowedTools` property
- Agent handler registration / discovery

WHAT TO DO:
1. At handler dispatch time in `RealAgentExecutor` (or equivalent), check whether the requested tool/handler is in `AgentTask.AllowedTools`.
2. If `AllowedTools` is non-empty and the requested tool is not in it: throw an `AgentToolNotAllowedException` (or equivalent) with the tool name and task ID. Do not silently skip.
3. If `AllowedTools` is null or empty: allow all registered handlers (existing permissive behavior; document this as "unrestricted" in comments).
4. Add unit tests:
   - Tool in allowlist → dispatch succeeds.
   - Tool not in allowlist → `AgentToolNotAllowedException` thrown.
   - Empty allowlist → all tools allowed.

ACCEPTANCE CRITERIA:
- Runtime enforcement blocks disallowed tools with a named exception.
- Empty allowlist preserves existing unrestricted behavior.
- Tests cover all three cases above.
- No change to the prompt injection of allowed tools (that can stay as an additional layer).

CONSTRAINTS:
- Do not change the `AgentTask` wire contract.
- Do not break existing agent handler integration tests.
- Keep the exception type named and documented so callers can handle it distinctly.

VERIFY: Run agent runtime tests; confirm the enforcer blocks disallowed tools and allows listed ones.

EXPECTED IMPACT: Directly improves Security (+2–3 pts), Correctness (+1–2 pts), AI/Agent Readiness (+1–2 pts). Weighted readiness impact: +0.15–0.25%.
```

---

#### Improvement 8 — Add Key Vault Private Endpoint and Workload RBAC to Terraform (TB-091–092)

**Tier:** 2

**Why it matters:** Key Vault has `public_network_access_enabled=false` in code but no private endpoint or private DNS zone in Terraform — so the enforcement is portal-only and will drift on re-apply. Container Apps have no Key Vault Secrets User role assignment in Terraform. Both gaps create security and compliance audit failures.

**Expected impact:** Key Vault private reachability and workload identity access are IaC-managed and reproducible.

**Affected qualities:** Security (+2–3 pts), Azure Compatibility (+2–3 pts), Deployability (+1–2 pts), Maintainability (+1–2 pts).

**Status:** **Done** (2026-05-31). Evidence: `infra/terraform-private/network.tf` (TB-091 Key Vault PE + DNS), `infra/terraform-private/keyvault_rbac.tf` (TB-092 workload Secrets User), `infra/terraform-keyvault/workload_rbac.tf` (API/Worker principal variables), `deploy/hosted-prod-terraform/keyvault_private_endpoints.tf` (reference). Review separately before apply.

**Why ranked #8:** P0/P1 IaC security gap in private-network Terraform root; lowest-risk changes are additive only.

**Evidence from repo:** TB-091 (Key Vault private endpoint + DNS zone absent from `terraform-private`), TB-092 (Key Vault Secrets User RBAC for API + Worker managed identities absent from private-network TF roots). Hosted-prod root partially closed.

**Cursor prompt:**

```
Add Key Vault private endpoint, private DNS zone, and workload identity RBAC to Terraform (TB-091 and TB-092).

FILES TO INVESTIGATE AND MODIFY:
- `infra/terraform-private/` — Key Vault resource (`azurerm_key_vault`), VNet/subnet references
- `infra/terraform/` or `infra/terraform-container-apps/` — Container Apps managed identity references
- Existing private endpoint patterns (e.g., for SQL or Blob) to follow as a reference

WHAT TO DO:
1. TB-091: In `terraform-private`, add:
   - `azurerm_private_endpoint` for the Key Vault resource, using an existing private-endpoint subnet variable.
   - `azurerm_private_dns_zone` for `privatelink.vaultcore.azure.net` if not already present.
   - `azurerm_private_dns_zone_virtual_network_link` linking the DNS zone to the VNet.
   - Follow the same pattern used for existing private endpoints (SQL/Blob).

2. TB-092: In the appropriate Terraform root (where Container Apps managed identities are defined), add:
   - `azurerm_role_assignment` for Key Vault Secrets User (`4633458b-17de-408a-b874-0445c86b69e0`) for the API managed identity.
   - `azurerm_role_assignment` for Key Vault Secrets User for the Worker managed identity.

ACCEPTANCE CRITERIA:
- `terraform plan` on `terraform-private` shows the private endpoint and DNS zone as new resources (no destroy of existing).
- `terraform plan` on the container apps root shows two new `azurerm_role_assignment` resources.
- Existing resources are unchanged.
- Variables for subnet, VNet, and Key Vault resource ID are parameterized (not hardcoded).

CONSTRAINTS:
- Do not modify Key Vault access policies (use RBAC only, consistent with existing posture).
- Do not remove existing Key Vault configuration.
- Do not apply to production without operator review; this is IaC-only; let the operator control the apply window.
- Follow existing naming conventions in the TF root.

VERIFY: Run `terraform validate` and `terraform plan` against a dev environment or dry-run; confirm no unexpected destroy operations.

EXPECTED IMPACT: Directly improves Security (+2–3 pts), Azure Compatibility (+2–3 pts), Deployability (+1–2 pts). Weighted readiness impact: +0.20–0.35%.
```

---

#### Improvement 9 — Fix Operator UI Server-Side Scope (TB-075)

**Tier:** 2

**Why it matters:** The Next.js proxy does not strip client-set `x-tenant-id` headers. SSR code uses hardcoded dev GUIDs. Browser `localStorage` and forwarded headers can choose the tenant scope. This creates a client-controlled tenant-resolution path in the UI layer.

**Expected impact:** Tenant scope in the operator UI is derived server-side from the authenticated session, not from client-controlled headers.

**Affected qualities:** Security (+2–4 pts), Trustworthiness (+1–2 pts).

**Status:** **Done** (2026-05-31). Evidence: `proxy-scope-resolution.ts` (production ignores client scope; no dev GUID fallback without env), `proxy-bearer-scope.ts` (JWT claim scope), `archlucid-ui/.env.example` (`ARCHLUCID_PROXY_*` documentation), `proxy-scope-resolution.test.ts`, `proxy-bearer-scope.test.ts`.

**Why ranked #9:** P1 security; UI-layer tenant selection was a meaningful attack surface — production-like proxy now server-authoritative for scope headers.

**Evidence from repo:** TB-075 documents browser `localStorage` and forwarded `x-tenant-id` header as the tenant-resolution path; partial fix via `resolveProxyUpstreamScopeHeaders`.

**Cursor prompt:**

```
Fix the operator UI server-side scope to prevent client-controlled tenant selection (TB-075).

FILES TO INVESTIGATE AND MODIFY:
- `archlucid-ui/src/middleware.ts` (or Next.js middleware) — header forwarding
- `archlucid-ui/src/lib/api-proxy.ts` or equivalent API proxy layer
- `archlucid-ui/src/lib/session.ts` or equivalent session/auth context
- SSR components that hardcode tenant IDs

WHAT TO DO:
1. In the Next.js middleware or API proxy, strip or override the `x-tenant-id` header with the value from the server-side session (derived from the authenticated JWT or OIDC claims), not from `localStorage` or the incoming browser request.

2. Replace any SSR hardcoded dev GUIDs with a configured fallback that reads from server-side environment variables (not client-visible).

3. In `localStorage` usage: remove any tenant ID reads that are forwarded as request headers to the API. Tenant selection should be session-authoritative, not client-authoritative. If tenant switching is a product feature, it must be validated against the session's allowed tenant list server-side.

4. Add a test or middleware integration test: a request with a `x-tenant-id` header that differs from the session tenant should have the header overwritten with the session value before forwarding to the API.

ACCEPTANCE CRITERIA:
- Client-supplied `x-tenant-id` headers are stripped or replaced in the proxy before forwarding.
- SSR does not use hardcoded tenant GUIDs in non-development environments.
- Existing operator auth flows (Entra ID OIDC session) continue to work.
- A test confirms that the proxy rewrites the tenant header to the session value.

CONSTRAINTS:
- Do not break the existing login/auth flow.
- Do not remove tenant-switching UI features if they exist — redirect the selection through a server-side route that validates against the session allowed list.
- Do not expose session secrets to the browser.

VERIFY: Write a middleware test that simulates a browser request with a forged `x-tenant-id`; confirm the proxy rewrites it.

EXPECTED IMPACT: Directly improves Security (+2–4 pts), Trustworthiness (+1–2 pts). Weighted readiness impact: +0.15–0.25%.
```

---

#### Improvement 10 — Persist LLM Sampling Parameters and Reasoning Tokens on Agent Execution Trace (TB-033)

**Tier:** 2

**Why it matters:** Temperature, maxTokens, top_p, and reasoning token counts are not persisted on `AgentExecutionTrace`. Forensic replay of a run cannot fully reconstruct the LLM call parameters, weakening provenance and auditability for compliance reviewers.

**Expected impact:** Every LLM call is fully reconstructable from the trace; forensic replay and compliance reviews have complete parameter evidence.

**Affected qualities:** Traceability (+2–3 pts), Explainability (+2–3 pts), Supportability (+1–2 pts), Auditability (+1–2 pts).

**Status:** **Done** (2026-05-31). Evidence: `LlmCompletionRequestParamsAmbient`, trace contract fields, recorder persistence, `AgentExecutionTraceRecorderSamplingParamsTests`.

**Cursor prompt:**

```
Persist LLM sampling parameters and reasoning token count on AgentExecutionTrace (TB-033).

FILES TO INVESTIGATE AND MODIFY:
- `ArchLucid.AgentRuntime/AgentExecutionTrace.cs` (or equivalent model)
- `ArchLucid.AgentRuntime/AzureOpenAiCompletionClient.cs` (or equivalent LLM client)
- `ArchLucid.Persistence/Repositories/` — `AgentExecutionTrace` persistence
- `Scripts/ArchLucid.sql` — DDL for `AgentExecutionTraces` table (or equivalent migration)
- `ArchLucid.AgentRuntime.Tests/` — trace serialization/persistence tests

WHAT TO DO:
1. Add the following nullable fields to `AgentExecutionTrace` (model + DDL migration):
   - `TemperatureUsed` (double?)
   - `MaxTokensUsed` (int?)
   - `TopPUsed` (double?)
   - `ReasoningTokenCount` (int?) — from the `usage.completion_tokens_details.reasoning_tokens` field in the Azure OpenAI response if available.

2. Capture these values in the LLM completion client (e.g., `AzureOpenAiCompletionClient`) from the options/request and response, and populate them on the trace record.

3. Add a DbUp migration script that adds these columns to the DDL in `Scripts/ArchLucid.sql` as nullable columns (additive, no data loss).

4. Add or extend tests that assert trace records capture sampling parameters from a completion call.

ACCEPTANCE CRITERIA:
- A completed agent task trace includes temperature, maxTokens, top_p, and reasoning token count (all nullable; null when not provided).
- DbUp migration adds columns without disrupting existing rows.
- Tests cover trace capture for a completion with known parameters.

CONSTRAINTS:
- All new columns are nullable — do not break existing trace records that lack these values.
- Do not expose sampling parameters in the operator UI unless there is already a trace detail surface.
- Keep the DDL change in `Scripts/ArchLucid.sql` (single DDL file rule).

VERIFY: Run persistence contract tests for `AgentExecutionTrace`; confirm new fields are persisted and retrieved correctly.

EXPECTED IMPACT: Directly improves Traceability (+2–3 pts), Explainability (+2–3 pts), Auditability (+1–2 pts). Weighted readiness impact: +0.15–0.25%.
```

---

#### Improvement 11 — Add Accelerator Chooser: Map Buyer Job to Starter Proof Pack (TB-114)

**Tier:** 2

**Why it matters:** Existing starter proof packs and policy bundles are useful but not easy to choose in the first 10 minutes. A buyer-job-to-proof-pack map reduces time-to-value for evaluators who don't know which pack is appropriate for their architecture type or compliance goal.

**Expected impact:** Operators can identify the right starter pack in under 2 minutes. Time-to-value for new evaluators improves materially.

**Affected qualities:** Time-to-Value (+3–4 pts), Adoption Friction (+2–3 pts), Template and Accelerator Richness (+3–5 pts), Marketability (+1–2 pts).

**Status:** **Done** (2026-05-31). Evidence: `docs/library/ACCELERATOR_CHOOSER.md`, `AcceleratorChooserCard`, `accelerator-chooser.ts`, `accelerator-wizard-presets.ts`, `?accelerator=` on `/reviews/new`, help slug `accelerator-chooser`, `check_starter_proof_packs.py` in CI, `StarterProofPackArchitectureRequestDryRunTests`.

**Cursor prompt:**

```
Create an accelerator chooser that maps buyer jobs to starter proof packs (TB-114).

FILES TO CREATE/MODIFY:
- `docs/library/ACCELERATOR_CHOOSER.md` — new chooser reference doc
- `docs/samples/policy-packs/` — existing pack files (read-only; use as source for metadata)
- `archlucid-ui/src/app/(operator)/dashboard/` or operator home — add accelerator chooser surface
- `archlucid-ui/src/lib/product-documentation-registry.ts` — register chooser as a help topic

WHAT TO DO:
1. Create `docs/library/ACCELERATOR_CHOOSER.md` as a structured table that maps:
   - Buyer job (e.g., "Azure cost review", "Regulated SaaS compliance check", "AI workload governance", "Multi-tier web architecture review")
   - → Recommended starter pack(s) (from the 23 seeded bundles + existing accelerator templates)
   - → Expected proof outputs (what the operator will have after completion)
   - → Minimum required inputs (what the operator must provide)
   - → V1/V1.1/deferred scope label for each recommendation

2. Add a minimal chooser surface to the operator home page (or pilot checklist) that surfaces the top 3–5 buyer-job suggestions with a brief description and a "Start with this pack" link that pre-selects the recommended pack in the baseline wizard or policy assignment flow.

3. Register `ACCELERATOR_CHOOSER.md` as a help topic in the in-app help registry so operators can access it from the UI.

ACCEPTANCE CRITERIA:
- `ACCELERATOR_CHOOSER.md` exists and covers at least 5 distinct buyer jobs with recommended packs.
- Operator home page shows at least 3 buyer-job suggestions with pack links.
- Help registry includes the chooser as a navigable topic.
- No placeholder text or "TBD" in the shipped chooser.

CONSTRAINTS:
- Do not add new policy packs; reference existing seeded bundles only.
- Do not claim packs are statutory certifications.
- Do not require AWS/GCP support (V1 GA is Azure-only).
- Keep the UI surface minimal — a simple card grid or table; no multi-step wizard required.

VERIFY: Open operator home in the UI; confirm the chooser surface renders and links to the correct pack/policy page.

EXPECTED IMPACT: Directly improves Time-to-Value (+3–4 pts), Adoption Friction (+2–3 pts), Template and Accelerator Richness (+3–5 pts). Weighted readiness impact: +0.20–0.30%.
```

---

#### Improvement 12 — Sanitize ADO PR Markdown Body Before Write (TB-079)

**Tier:** 2

**Why it matters:** Unescaped compare data from `SummaryHighlights` and deep-link fields is echoed verbatim into Azure DevOps PR comment bodies. An architecture comparison that includes Markdown special characters or HTML injection vectors can corrupt the PR display or, in some ADO configurations, inject rendering artifacts.

**Expected impact:** PR comment bodies are safe to render in any ADO/GitHub markdown context.

**Affected qualities:** Security (+1–2 pts), Correctness (+1–2 pts), Trustworthiness (+1–2 pts).

**Status:** **Done** (2026-05-31). Evidence: `AdoPullRequestMarkdownEscaper`, `GoldenManifestCompareMarkdownFormatter` integration, unit tests.

**Cursor prompt:**

```
Sanitize markdown input before writing to ADO PR comment bodies (TB-079).

FILES TO INVESTIGATE AND MODIFY:
- `ArchLucid.Integrations.AzureDevOps/` — PR comment construction and ADO client call
- The method that constructs the PR body string from `SummaryHighlights` and deep-link fields

WHAT TO DO:
1. Identify the string concatenation or template that builds the ADO PR comment body.
2. Escape Markdown special characters in data-derived fields (`SummaryHighlights`, deep-link URLs, system names, run IDs) before interpolating them into the comment template. Use a minimal escaping function: escape `[`, `]`, `(`, `)`, `*`, `_`, `` ` ``, `<`, `>`, `#` when they appear in data values (not in structural Markdown elements).
3. Ensure deep-link URLs are URL-validated before being written (reject or sanitize non-HTTPS URLs with an unexpected scheme).
4. Add a unit test: construct a PR body with `SummaryHighlights` that contains Markdown special characters; assert the output is escaped correctly.

ACCEPTANCE CRITERIA:
- A `SummaryHighlights` value containing `*bold*`, `[link](url)`, or `<script>` does not render as Markdown formatting or HTML in the PR body.
- Deep-link URLs with unexpected schemes are rejected or have the scheme stripped.
- Unit test passes.

CONSTRAINTS:
- Do not change the structural Markdown formatting of the PR template (headers, bullet lists).
- Do not change the ADO API call itself.
- Do not escape data values that are already numeric IDs or GUIDs.

VERIFY: Run ADO integration tests; confirm the escaping test passes.

EXPECTED IMPACT: Directly improves Security (+1–2 pts), Correctness (+1–2 pts). Weighted readiness impact: +0.05–0.10%.
```

---

### Tier 3 — Hold for Reassessment

---

#### Improvement 13 — Decisioning Explainability Improvements (TB-050–056)

**Tier:** 3 — Hold for reassessment

**Why it matters:** Operators cannot fully trace manifest decisions from inputs through rules/prompts to confident outputs. TB-050–056 cover `RuleAuditTracePayload`, confidence provenance, authority rule labeling, and uncertainty quantification.

**Hold reason:** Improvement 1 (run detail visibility) **Done**. Reassess for Tier 2 — explainability fields can now render on the run detail surface.

---

#### Improvement 14 — DDL Hygiene and Migration Safety (TB-064–070)

**Tier:** 3 — Hold for reassessment

**Why it matters:** DbUp journal-only verification, IaC/generated-schema drift, and rolling-deploy risk from non-additive migrations are documented gaps. TB-065 and TB-068 are deploy-safety critical.

**Hold reason:** Requires coordination with a deploy window and Terraform state. Reassess after the IaC Terraform fixes (Improvement 8) are verified and a deploy drill is scheduled.

---

#### Improvement 15 — Commercial Stickiness: Recurring Review Workflow (TB-057–063)

**Tier:** 3 — Hold for reassessment

**Why it matters:** The recurring review workflow (findings as monitored risks, policy drift detection, digest cadence) would materially increase product stickiness and create a repeating value loop.

**Hold reason:** Improvements 1 and 4 **Done**. Reassess for Tier 2 — recurring review can ship without incorrect KPI or run-detail data.

---

**Note: Improvements stop at 15.** The 12 actionable improvements (Tier 1: 5, Tier 2: 7) and 3 hold items are the highest-confidence, highest-leverage actions available given the current state. Additional items (IaC parity for AOAI/Redis/AI Search, Backfill.Cli observability, UI design system conformance) are real backlog items but their impact on release readiness is lower than the above, and several depend on the outcome of security and operator-visibility fixes already listed. Expanding to 25 items would dilute focus on the P0/P1 items that most affect commercial and enterprise readiness.

---

## 10. Prompt Batching Guidance

### Tier 1 — **Complete** (Improvements 1–5, 2026-05-30/31)

All five Tier 1 items shipped to `master`. Do not re-run unless regressions appear.

### Recommended next batch (Tier 2 — start here)

- **Improvement 8** (`terraform-private` TB-091–092): Mirror hosted-prod Key Vault PE + workload RBAC.
- **Improvement 9 remainder** (TB-075): SSR `/api/auth/me` scope + env var documentation.
- **TB-115–117**: Starter pack metadata CI gate + offline dry-run harness.
- **Improvement 11 remainder**: Deep-link wizard presets to pack ids.

### Historical Tier 1 batching (archived)

Composer-safe: Improvement 12 (ADO PR sanitizer — simple string escaping), Improvement 11 doc portion (ACCELERATOR_CHOOSER.md content authoring), Improvement 10 DDL/migration addition only.

Sonnet-safe: Improvements 1, 4, 6, 7, 9, 10 (full), 11 (full).

### What should use a stronger reasoning model before release

Strong-model recommended: Improvement 2 (retrieval isolation correctness — security-critical design), Improvement 3 (auth scope binding — security-critical), Improvement 5 (real AOAI validation result interpretation), go/no-go review after all Tier 1 improvements ship.

---

## 11. Model-Usage Guidance

### Composer-safe (mechanical, low-risk, no security sensitivity)

- Improvement 12: ADO PR markdown escaping (simple string transform, unit test).
- Improvement 11 doc portion: Writing `ACCELERATOR_CHOOSER.md` table rows.
- Improvement 10 DDL portion: Adding nullable columns to `Scripts/ArchLucid.sql`.
- Improvement 8 Terraform portion: Adding `azurerm_private_endpoint` and `azurerm_role_assignment` blocks (additive, no destroy).

### Sonnet-safe (moderate implementation, correctness-sensitive but not security-critical)

- Improvement 1: Run detail page DTO enrichment and UI rendering.
- Improvement 4: Executive dashboard KPI server-side migration (DTO + service + UI).
- Improvement 6: Snapshot IDOR prevention and retrieval write-path validation.
- Improvement 7: Agent AllowedTools runtime enforcer.
- Improvement 9: UI proxy scope correction.
- Improvement 10 (full): Trace model + persistence + test.
- Improvement 11 (full): Chooser UI surface + help registry.
- Improvements 13–15 (when promoted from Hold): explainability, DDL hygiene, stickiness workflow.

### Strong-model recommended

- Improvement 2: Azure Search production client tenant filter — correctness and security co-design.
- Improvement 3: API-key scope binding — auth architecture correctness is security-critical.
- Improvement 5: Interpreting real AOAI validation results and extending the normalizer if needed — requires understanding of LLM output variance and merge-path semantics.
- Go/no-go review after all five Tier 1 items are complete: cross-cutting risk assessment before any public release claim.

---

## 12. Pending Questions for Later

### Improvement 6 (snapshot IDOR remainder)
- Should `GetLatestByContextSnapshotIdAsync` require non-empty tenant scope in SingleCatalog mode (fail-fast) or return null when scope is empty?
- Do Cosmos graph snapshot documents need tenant metadata on the document for cross-partition scope filtering?

### Improvement 9 (UI proxy scope)
- Does the product currently support tenant switching as an explicit UI feature (e.g., a tenant selector dropdown)? If yes, the server-side scope fix must preserve the switching flow while moving the authority server-side.

### Improvement 8 (Terraform Key Vault)
- Is a private DNS resolver already deployed in the VNet for `terraform-private`? If not, the private endpoint will resolve only within the VNet natively and may need DNS forwarder configuration.

### Closed (answered 2026-05-30/31)
- **Improvement 5:** Live AOAI credentials verified; `Invoke-RealLlmEvidenceGate.ps1` PASS; full pipeline merge succeeded.
- **Improvement 3:** API keys emit tenant claims from config; `ScopeIdentityBindingMiddleware` rejects header/claim mismatch.
- **Improvement 1:** Single authority run detail path enriched via `AuthorityRunDetailOperatorEnricher` (no dual HTTP fetch in UI).
- **Improvement 4 / TB-074:** Executive KPIs and retrieval index writes validated server-side (`ExecutiveBusinessImpactCategoryClassifier`, `RetrievalIndexingScopeValidator`).
- **Improvement 7 / TB-082:** `AgentTaskAllowedToolsDispatchGuard` enforces allowlist at handler dispatch.
- **Improvement 12 / TB-079:** `AdoPullRequestMarkdownEscaper` sanitizes compare highlights before ADO PR write.
