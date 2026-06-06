> **Scope:** Independent, first-principles weighted readiness pass — `(A)` headline V1 GA readiness per `Assessment-Scope-V1_1.mdc`. Clean-slate snapshot (GPT-5.5 track); not a buyer-facing claim document. Prior snapshot archived at `ARCHIVE_2026_06_05_PRE_FIRST_PRINCIPLES_GPT55.md`.

# ArchLucid Assessment – (A) Headline Readiness: 82.13%

This score represents the `(A)` headline readiness per `Assessment-Scope-V1_1.mdc`, excluding items explicitly deferred to V1.1, V1.x, V2, owner-only commercial action, or `(B)` procurement realism.

**Method note (per request):** This is a clean-slate, first-principles assessment. It does not reference, anchor to, or compare against any prior assessment scores or conclusions. It uses the **user-supplied 47-quality / total-weight-120 model** (an explicit replacement for the repo's default `ASSESSMENT_QUALITY_MODEL.md`). The referenced `Assessment-Read-First.mdc` does **not exist** in the repo (`.cursor/rules/` contains only `Assessment-Scope-V1_1.mdc`), so there was no historical-comparison behavior to override — the clean-slate posture is applied regardless. Scores are grounded in the current repo state: scope contract (`V1_SCOPE.md`), deferred inventory (`V1_DEFERRED.md`), 59 projects / 25 test projects, 36 CI workflows, ~192 API controllers, ~113 UI pages, and the CI gate configuration.

**Engineering delta (2026-06-05, no `(A)` headline change):** Batch **5DU-route-tenant-p1** (**TB-279–282**, **TB-281**) — scope-only value-report/admin routes, retired legacy `api/authority/executive-summary/{tenantId}`, operator-only cross-tenant usage rollup — strengthens **Trustworthiness** / **Architectural integrity** narrative under route-based tenant addressing; headline **82.13%** unchanged per `Assessment-Scope-V1_1.mdc`.

---

## Executive Summary

### `(A)` Overall headline readiness — **82.13%**

ArchLucid is a deep, genuinely engineered product that is a credible **controlled-pilot / service-led release candidate**. The shipped surface is large and coherent: the full review lifecycle (request → execute → commit → golden manifest + artifacts), real/simulator agent execution, exports, compare, replay, provenance graph, governance (approvals with SoD, pre-commit gate, 23 bundled policy packs), 78-event append-only audit with RLS, alerts, identity (Entra + generic OIDC + SAML SP + SCIM + API key + RBAC), the customer-controlled Azure extractor, advisory-only Terraform emit, executive ROI rollups, value reports, CLI diagnostics, containerization, and Terraform IaC.

The headline is held below the high-80s primarily by **high-weight engineering and AI qualities**: the AI substrate is competent but not frontier (graph-RAG, agentic retrieval, and faithfulness gating are backlog/deferred); real-mode quad-agent output quality is owner-gated and under-evidenced in CI; and the first-pilot path, while powerful, is operationally dense. A few concrete current-release hygiene items (a failing operator golden-path mock-smoke artifact, generated-client drift, stray solution projects, and scope-doc drift on the coverage gate) are cheap to fix and disproportionately affect trust in the release.

### `(B)` Procurement / market-motion realism (no `(A)` penalty)

Enterprise buyers will still feel friction around **CPA-issued SOC 2**, **third-party pen-test publication**, **public reference customers**, **live Marketplace/Stripe transactability**, and **first-party ITSM/chat connectors**. Per `V1_SCOPE.md` §3 and `V1_DEFERRED.md` §6b/§6c/§6, these are explicitly deferred (V1.1/V2/owner-only) and are **not** deducted from `(A)`. The trust posture is unusually honest for an early product (Trust Center, SOC 2 self-assessment, CAIQ/SIG/DPA, owner-conducted pen test, least-privilege Azure access doctrine). The buyer risk is not "no security story" — it is that some security reviewers will require **formal external assurance** before a broad rollout. Procurement realism is the gating factor on market motion, not product capability.

### Commercial picture

The strongest near-term motion is **sales-led / founder-led architecture-review and evidence-pack services** using ArchLucid as delivery infrastructure. The product has named offers, pricing philosophy, scorecards, ROI labels with citation discipline, quote-to-proof flow, sponsor packets, and proof-bundle mechanics. The weakness is **conversion discipline**: buyers must clearly understand which proof is buyer-provided vs defaulted vs demo-derived. Until real customer proof packets and references exist (deferred), expansion depends on disciplined evidence collection and avoiding overclaim.

### Enterprise picture

Enterprise architecture buyers can see a serious product: per-tenant database isolation, OIDC/SAML/SCIM, policy packs, append-only audit, governance workflows, provenance, and Azure-native deployment. Controlled pilots are reasonable today. Broad adoption remains constrained by **integration maturity** (first-party connectors deferred), **procurement assurance friction** (B), **operator density / cognitive load**, and residual **documentation drift** in a very large doc corpus.

### Engineering picture

The base is deep and mostly coherent: modular projects, Dapper + DbUp discipline, OpenAPI contract snapshotting with buyer-audience tiers, route-tenant scope binding with CI drift guards, DTO-boundary architecture tests, and an unusually strong CI estate (Stryker mutation, Schemathesis, ZAP DAST, k6 load/soak/burst, Simmy chaos, failover/reliability drills, real-LLM golden cohort, **95% merged-line coverage with the ratchet enabled**). The main engineering risk is **not lack of architecture — it is complexity and drift**: multiple read models, legacy authority/coordinator semantics still being strangled, duplicated business calculations that can diverge across layers, and a large number of safety controls that exist but must stay uniformly enforced.

---

## Deferred Scope Uncertainty

Not applicable in the strict sense — the deferred-scope source material **was located and is authoritative**: `docs/library/V1_SCOPE.md` §3 and `docs/library/V1_DEFERRED.md` §1–§7 (with §6b/§6c/§6d/§6l/§6m/§6n covering commerce, SOC 2 / pen test, MCP, multi-region, tenant erasure automation, and multi-cloud). The only adjacent uncertainty worth flagging factually: `V1_DEFERRED.md` §4 still describes "raise merged line to 95% + re-enable the ratchet" as a **V1.1** task, but `.github/workflows/ci.yml` already enforces merged-line **95% with the ratchet enabled**. That is doc drift (current state is *ahead* of the deferred doc), not missing scope material. It is captured as an actionable improvement below.

---

## Weighted Quality Assessment

Ordered from **most urgent to least urgent** by weighted deficiency signal `(100 − score) × weight`. Weighted impact = `score × weight / 120`. Total weight = **120**. Classification key: **v1** = fixable in current release; **v1.1/v2** = deferred scope (no `(A)` penalty); **blocked** = needs owner input.

| # | Quality | Score | Weight | Wtd impact | Deficiency | Class |
|---:|---|---:|---:|---:|---:|---|
| 1 | Cutting-Edge AI Technology | 78 | 8 | 5.20% | 176 | v1 (partial) / v2 |
| 2 | AI/Agent Readiness | 83 | 8 | 5.53% | 136 | v1 (partial) / blocked |
| 3 | Adoption Friction | 78 | 6 | 3.90% | 132 | v1 |
| 4 | Correctness | 84 | 8 | 5.60% | 128 | v1 |
| 5 | Marketability | 85 | 8 | 5.67% | 120 | v1 / (B) |
| 6 | Time-to-Value | 84 | 7 | 4.90% | 112 | v1 |
| 7 | Proof-of-ROI Readiness | 83 | 5 | 3.46% | 85 | v1 / (B) |
| 8 | Usability | 74 | 3 | 1.85% | 78 | v1 |
| 9 | Workflow Embeddedness | 76 | 3 | 1.90% | 72 | v1 / v1.1 |
| 10 | Differentiability | 84 | 4 | 2.80% | 64 | v1 |
| 11 | Architectural Integrity | 80 | 3 | 2.00% | 60 | v1 (partial) |
| 12 | Executive Value Visibility | 85 | 4 | 2.83% | 60 | v1 |
| 13 | Traceability | 84 | 3 | 2.10% | 48 | v1 |
| 14 | Trustworthiness | 84 | 3 | 2.10% | 48 | v1 / (B) |
| 15 | Security | 85 | 3 | 2.13% | 45 | v1 / (B) |
| 16 | Maintainability | 78 | 2 | 1.30% | 44 | v1 |
| 17 | Interoperability | 78 | 2 | 1.30% | 44 | v1 / v1.1 |
| 18 | Compliance Readiness | 80 | 2 | 1.33% | 40 | v1 / (B) |
| 19 | Procurement Readiness | 80 | 2 | 1.33% | 40 | v1 / (B) |
| 20 | Data Consistency | 82 | 2 | 1.37% | 36 | v1 |
| 21 | Azure Compatibility & SaaS Deployment | 82 | 2 | 1.37% | 36 | v1 |
| 22 | Decision Velocity | 82 | 2 | 1.37% | 36 | v1 |
| 23 | Commercial Packaging Readiness | 83 | 2 | 1.38% | 34 | v1 / (B) |
| 24 | Policy & Governance Alignment | 84 | 2 | 1.40% | 32 | v1 |
| 25 | Reliability | 84 | 2 | 1.40% | 32 | v1 |
| 26 | Explainability | 85 | 2 | 1.42% | 30 | v1 |
| 27 | Cognitive Load | 70 | 1 | 0.58% | 30 | v1 |
| 28 | Auditability | 86 | 2 | 1.43% | 28 | v1 |
| 29 | Customer Self-Sufficiency | 79 | 1 | 0.66% | 21 | v1 |
| 30 | Documentation | 80 | 1 | 0.67% | 20 | v1 |
| 31 | Scalability | 80 | 1 | 0.67% | 20 | v1 / v2 |
| 32 | Availability | 82 | 1 | 0.68% | 18 | v1 / v1.1 |
| 33 | Extensibility | 82 | 1 | 0.68% | 18 | v1 |
| 34 | Evolvability | 82 | 1 | 0.68% | 18 | v1 |
| 35 | Cost-Effectiveness | 82 | 1 | 0.68% | 18 | v1 |
| 36 | Stickiness | 82 | 1 | 0.68% | 18 | v1 |
| 37 | Change Impact Clarity | 82 | 1 | 0.68% | 18 | v1 |
| 38 | Performance | 83 | 1 | 0.69% | 17 | v1 |
| 39 | Manageability | 83 | 1 | 0.69% | 17 | v1 |
| 40 | Observability | 84 | 1 | 0.70% | 16 | v1 |
| 41 | Template & Accelerator Richness | 84 | 1 | 0.70% | 16 | v1 |
| 42 | Deployability | 85 | 1 | 0.71% | 15 | v1 |
| 43 | Azure Ecosystem Fit | 85 | 1 | 0.71% | 15 | v1 |
| 44 | Accessibility | 85 | 1 | 0.71% | 15 | v1 |
| 45 | Supportability | 86 | 1 | 0.72% | 14 | v1 |
| 46 | Modularity | 87 | 1 | 0.73% | 13 | v1 |
| 47 | Testability | 88 | 1 | 0.73% | 12 | v1 |

**Weighted overall = 9855 / 120 = 82.13%.**

### Per-quality detail (most urgent first)

**1. Cutting-Edge AI Technology — 78 / w8 / impact 5.20% / deficiency 176.**
*Justification:* Solid current-generation substrate — Azure OpenAI integration, structured outputs, redaction, retrieval (`ArchLucid.Retrieval`, ADR 0004 outbox), exemplar retrieval, evaluation hooks (agent-eval-datasets nightly, golden cohort). But for a 2026 AI product it is **competent-conventional, not frontier**: graph-RAG, agentic retrieval (HyDE/rerank/query-rewrite), and online learning are explicitly V2 (`V1_DEFERRED.md` §6q); MCP membrane is V1.1; faithfulness eval is backlog (TB-021). *Tradeoffs:* Conservative substrate buys enterprise determinism and cost control at the expense of "wow" differentiation. *Recommendations:* Land the faithfulness/grounding eval seam (TB-021) and surface a citation-faithfulness metric in CI; this is the highest-leverage in-scope AI move. *Class:* v1 (faithfulness eval, retrieval quality seams) / v2 (graph-RAG, agentic retrieval — no `(A)` penalty).

**2. AI/Agent Readiness — 83 / w8 / impact 5.53% / deficiency 136.**
*Justification:* Strong operational scaffolding — deterministic orchestration, real/simulator separation (`ArchLucid.AgentRuntime` / `AgentSimulator`), schema enforcement, prompt-injection regression gate, offline agent regression, budget controls, golden cohort (sim + real). *Gap:* real-mode quad-agent end-to-end output quality is **owner-gated** (real AOAI creds/budget; G-REAL / TB-140 owner-blocked) and therefore under-evidenced as a merge-blocking signal; faithfulness gating absent. *Tradeoffs:* Owner-gating real LLM CI controls cost but weakens release confidence in the real path. *Recommendations:* Add faithfulness eval (partial, actionable); stand up the real-mode evidence run when creds are provided (blocked). *Class:* v1 (eval seam) / blocked (real-mode CI evidence).

**3. Adoption Friction — 78 / w6 / impact 3.90% / deficiency 132.**
*Justification:* Many friction reducers exist — dev-bypass auth, simulator mode for instant value, extractor needs **no vendor credentials**, OIDC/SAML/SCIM, docker compose, Core Pilot 4-step. *Gap:* the operative path is **dense** — numerous enablement toggles ("Show more links", extended/advanced governance), legacy labels, and a large concept surface before first value feels effortless. *Tradeoffs:* Progressive disclosure protects new operators but hides value and raises setup burden. *Recommendations:* Tighten the first-run guided path; reduce toggle density on the golden path; verify first-run checklist end-to-end. *Class:* v1.

**4. Correctness — 84 / w8 / impact 5.60% / deficiency 128.**
*Justification:* Outputs are well-guarded — deterministic orchestration, OpenAPI contract snapshot, route-tenant scope binding + drift guards, DTO-boundary architecture tests, golden cohort, SQL audit-integrity tests. *Gap:* duplicated business calculations (ROI/KPI) across backend/UI/cache can diverge; real-mode output correctness under-evidenced. *Tradeoffs:* Multiple read models improve performance but increase divergence surface. *Recommendations:* Converge ROI/KPI math on a single service; verify golden-path mock smoke fixtures match current buyer DTO shape. *Class:* v1.

**5. Marketability — 85 / w8 / impact 5.67% / deficiency 120.**
*Justification:* Substantive marketing surface — `/pricing`, `/why`, `/see-it`, `/showcase`, example ROI bulletin, trust pages, proof packs, claim-language lint. *Gap (B):* no published reference customers or final market-facing assets (deferred V1.1, no `(A)` penalty). *Tradeoffs:* Honest claim discipline limits punchy marketing but protects trust. *Recommendations:* Keep claim-lint enforced; nothing in-scope blocks `(A)`. *Class:* v1 (claim discipline) / (B) (references, assets).

**6. Time-to-Value — 84 / w7 / impact 4.90% / deficiency 112.**
*Justification:* Fast paths exist — quickstart, simulator mode, demo seed, extractor-ZIP-first baseline, Core Pilot. *Gap:* the operator golden-path mock-smoke artifact shows a **review-detail render failure** ("Review detail response is missing a 'run' object"), which — if live — breaks the first credible outcome step. *Tradeoffs:* Rich first-run experience vs. fragility under contract drift. *Recommendations:* Verify/fix the golden-path render and its fixtures (Tier 1). *Class:* v1.

**7. Proof-of-ROI Readiness — 83 / w5 / impact 3.46% / deficiency 85.**
*Justification:* Strong mechanics — `GET /v1/roi/executive-summary` (cross-run dedup by `FindingId`), per-run ROI, value reports, pilot scorecard, board pack, cost-citation doctrine tied to extractor `manifest.json`. *Gap (B):* real customer ROI deltas await real proof packets (deferred). *Recommendations:* Ensure all ROI surfaces share one calculation source; keep citation contract enforced. *Class:* v1 (consistency) / (B) (real deltas).

**8. Usability — 74 / w3 / impact 1.85% / deficiency 78.**
*Justification:* Good bones — operator shell, wizards, help system, empty/loading states, 403 page, accessibility. *Gap:* density and **legacy label leakage** (UI still says "Runs" where domain says "Reviews"), plus the review-detail error state. *Recommendations:* Mechanical terminology reconciliation; verify golden-path; audit in-app help for raw repo references. *Class:* v1.

**9. Workflow Embeddedness — 76 / w3 / impact 1.90% / deficiency 72.**
*Justification:* Embeds via REST/OpenAPI, CLI, SCIM, Azure DevOps/GitHub PR + manifest decoration, CI compare surfaces. *Gap:* first-party ITSM/Teams/Slack/Confluence deferred to V1.1 (no `(A)` penalty). *Recommendations:* Strengthen ADO/GitHub CI decoration docs as the V1 embedded story. *Class:* v1 (CI/CLI surfaces) / v1.1 (connectors).

**10. Differentiability — 84 / w4 / impact 2.80% / deficiency 64.** *Justification:* Distinctive "AI co-architect" framing, advisory-only never-apply Terraform, evidence/citation doctrine, governance+audit+provenance depth. *Gap:* substrate not frontier (see #1). *Recommendations:* Lean differentiation on governance/evidence rigor, not raw model novelty. *Class:* v1.

**11. Architectural Integrity — 80 / w3 / impact 2.00% / deficiency 60.** *Justification:* Modular, ADR-governed, strangler plan for coordinator (ADR 0021), bounded contracts. *Gap:* acknowledged dual authority/coordinator semantics mid-strangle; stray solution projects (`temp_sqlerror`, codemod/brace tools) pollute the solution. *Recommendations:* Remove stray projects (Tier 1); continue coordinator convergence (Tier 3, depends on direction). *Class:* v1 (hygiene) / partial (strangle).

**12. Executive Value Visibility — 85 / w4 / impact 2.83% / deficiency 60.** *Justification:* Executive dashboard, ROI summary, board pack, value reports, exec digests, trend charts. *Recommendations:* Maintain single ROI source feeding exec surfaces. *Class:* v1.

**13. Traceability — 84 / w3 / impact 2.10% / deficiency 48.** *Justification:* Provenance graph, decision register, authority chain, `V1_REQUIREMENTS_TEST_TRACEABILITY.md`, audit correlation IDs. *Recommendations:* Keep requirements-test map current as routes evolve. *Class:* v1.

**14. Trustworthiness — 84 / w3 / impact 2.10% / deficiency 48.** *Justification:* Honest Trust Center, audit integrity tests, RLS, route-tenant guards, owner pen test, self-assessment. *Gap (B):* external assurance pending. *Recommendations:* Reconcile scope-doc drift so the contract stays trustworthy (Tier 1). *Class:* v1 / (B).

**15. Security — 85 / w3 / impact 2.13% / deficiency 45.** *Justification:* RLS + `SESSION_CONTEXT`, route-tenant binding filter, recently completed IDOR/SSRF/idempotency hardening, gitleaks, CodeQL, ZAP, Trivy, prompt-injection gate, least-privilege Azure doctrine, private endpoints/WAF. *Gap (B):* CPA SOC 2 / third-party pen test deferred. *Recommendations:* Keep the IDOR/route-tenant CI drift guards green; no new `(A)` blocker found. *Class:* v1 / (B).

**16. Maintainability — 78 / w2 / impact 1.30% / deficiency 44.** *Justification:* Modular, contract discipline, DDL discipline, config catalogs. *Gap:* doc drift (coverage gate), stray projects, 301-item backlog, very large doc corpus. *Recommendations:* Hygiene pass + scope-doc reconciliation. *Class:* v1.

**17. Interoperability — 78 / w2 / impact 1.30% / deficiency 44.** *Justification:* REST/OpenAPI, CLI, SCIM, OIDC/SAML, ADO/GitHub, optional webhooks. *Gap:* first-party connectors V1.1. *Class:* v1 / v1.1.

**18. Compliance Readiness — 80 / w2 / impact 1.33% / deficiency 40.** *Justification:* SOC 2 self-assessment, CAIQ/SIG/DPA, drift trend, 23 policy packs. *Gap (B):* CPA SOC 2. *Class:* v1 / (B).

**19. Procurement Readiness — 80 / w2 / impact 1.33% / deficiency 40.** *Justification:* Procurement FAQ, DPA, subprocessors, order form, pricing, trust center. *Gap (B):* references, live commerce. *Class:* v1 / (B).

**20. Data Consistency — 82 / w2 / impact 1.37% / deficiency 36.** *Justification:* DDL parity, atomic unit-of-work promote, unique constraints, RLS, audit-export isolation tests. *Gap:* cross-layer KPI/ROI divergence risk. *Recommendations:* Single ROI source. *Class:* v1.

**21. Azure Compatibility & SaaS Deployment — 82 / w2 / impact 1.37% / deficiency 36.** *Justification:* Terraform modules, private endpoints, WAF, Entra, Key Vault, container images, DbUp auto-migrate, greenfield SQL boot CI. *Gap:* ACR push not in CI (deferred §5); some service IaC depth org-dependent. *Class:* v1.

**22. Decision Velocity — 82 / w2 / impact 1.37% / deficiency 36.** *Justification:* Scorecards, exec summary, quick-scan, decision register accelerate buyer/operator decisions. *Class:* v1.

**23. Commercial Packaging Readiness — 83 / w2 / impact 1.38% / deficiency 34.** *Justification:* Two-layer Pilot/Operate packaging, pricing tiers, order form, `[RequiresCommercialTenantTier]` 402 filter. *Gap (B):* commerce un-hold. *Class:* v1 / (B).

**24. Policy & Governance Alignment — 84 / w2 / impact 1.40% / deficiency 32.** *Justification:* 23 bundled packs, pre-commit gate, approval SoD, governance dashboard. *Class:* v1.

**25. Reliability — 84 / w2 / impact 1.40% / deficiency 32.** *Justification:* Health checks, outbox, retries, idempotency posture register complete, Simmy chaos, failover/reliability drills, k6 soak, budget cutoffs. *Gap:* single-region intentional (V1). *Class:* v1.

**26. Explainability — 85 / w2 / impact 1.42% / deficiency 30.** *Justification:* Provenance graph, decision synopses, authority chain, finding/compare explanations. *Class:* v1.

**27. Cognitive Load — 70 / w1 / impact 0.58% / deficiency 30.** *Justification:* Very large surface (~192 controllers, ~113 UI pages, 301 backlog items, massive docs) imposes high mental effort. *Recommendations:* Reduce golden-path density; reconcile labels; trim doc surface. *Class:* v1.

**28. Auditability — 86 / w2 / impact 1.43% / deficiency 28.** *Justification:* 78 typed events, append-only, CSV export, tenant-isolated audit export tests. *Class:* v1.

**29. Customer Self-Sufficiency — 79 / w1 / deficiency 21.** In-app help, runbooks, quickstart, doctor; offset by density. *Class:* v1.
**30. Documentation — 80 / w1 / deficiency 20.** Massive corpus; drift (coverage gate) and density are the cost. *Class:* v1.
**31. Scalability — 80 / w1 / deficiency 20.** Replica-aware cache, per-tenant DB; distributed graph cache V2. *Class:* v1 / v2.
**32. Availability — 82 / w1 / deficiency 18.** Single-region intentional; failover drills; multi-region V1.1. *Class:* v1 / v1.1.
**33. Extensibility — 82 / w1 / deficiency 18.** Custom agent handler guide (V1 GA), policy packs. *Class:* v1.
**34. Evolvability — 82 / w1 / deficiency 18.** ADRs, changelog/breaking-changes discipline, strangler plan. *Class:* v1.
**35. Cost-Effectiveness — 82 / w1 / deficiency 18.** LLM budget controls, COGS dashboard, caching, simulator. *Class:* v1.
**36. Stickiness — 82 / w1 / deficiency 18.** Governance, recurrence schedules, saved views, audit history, portfolio. *Class:* v1.
**37. Change Impact Clarity — 82 / w1 / deficiency 18.** Changelog, breaking-changes, compare/delta, ADRs. *Class:* v1.
**38. Performance — 83 / w1 / deficiency 17.** k6 load/soak/burst, hot-path cache, benchmarks. *Class:* v1.
**39. Manageability — 83 / w1 / deficiency 17.** Config catalog, admin config UI, governance. *Class:* v1.
**40. Observability — 84 / w1 / deficiency 16.** Logs/traces/metrics, correlation IDs, RAG/tenant-health + fleet COGS dashboards. *Class:* v1.
**41. Template & Accelerator Richness — 84 / w1 / deficiency 16.** 23 policy packs, finding-engine template, recipes, extractor script. *Class:* v1.
**42. Deployability — 85 / w1 / deficiency 15.** Compose, images, DbUp auto-migrate, greenfield boot CI, cd workflows. *Class:* v1.
**43. Azure Ecosystem Fit — 85 / w1 / deficiency 15.** Entra, Key Vault, Service Bus (optional), Blob, AI Search, AOAI, Cost Mgmt. *Class:* v1.
**44. Accessibility — 85 / w1 / deficiency 15.** axe WCAG 2.1 A/AA merge-blocking, skip-to-content, color mode. *Class:* v1.
**45. Supportability — 86 / w1 / deficiency 14.** doctor, support-bundle, correlation IDs, runbooks, version. *Class:* v1.
**46. Modularity — 87 / w1 / deficiency 13.** 59 projects, clean seams. *Class:* v1.
**47. Testability — 88 / w1 / deficiency 12.** 25 test projects, 95% merged-line + ratchet, mutation, schemathesis, contract snapshot, live E2E. *Class:* v1.

---

## Top 12 Most Important Weaknesses (cross-cutting, most→least serious)

1. **AI substrate is competent but not frontier, and real-mode quality is under-evidenced.** The three highest-weight engineering qualities (Cutting-Edge AI, AI/Agent Readiness, Correctness = 24 of 120 weight) are all dragged by the same root: no faithfulness/grounding gate and owner-gated real-mode CI evidence.
2. **Operator density / cognitive load.** A powerful but dense first-run path with many enablement toggles and legacy labels raises Adoption Friction, Usability, Time-to-Value, and Cognitive Load simultaneously.
3. **Golden-path fragility under contract drift.** The operator review-detail mock-smoke artifact shows a "missing run object" error — a single demo-path break has outsized impact on Time-to-Value and Trustworthiness.
4. **Cross-layer business-math divergence.** Duplicated ROI/KPI calculations across backend/UI/cache threaten Correctness, Data Consistency, and Proof-of-ROI credibility.
5. **Scope-contract drift.** Current CI (95% coverage + ratchet) is *ahead* of `V1_DEFERRED.md`; drift erodes the trustworthiness of the scope contract that assessments and buyers rely on.
6. **Repo/solution hygiene.** Stray projects (`temp_sqlerror`, codemod/brace tools) and uncommitted generated-client drift signal release-discipline gaps.
7. **Integration breadth deferred.** First-party ITSM/chat/docs connectors are V1.1 — embeddedness rests on REST/CLI/UI/SCIM/ADO/GitHub for V1 (acceptable for pilot, friction for broad adoption).
8. **Procurement assurance gap (B).** CPA SOC 2 and third-party pen-test publication are deferred — real but not `(A)` deductions.
9. **Documentation surface is large and drift-prone.** Volume is a strength for depth and a liability for maintainability and self-sufficiency.
10. **Mid-strangle architecture.** Dual authority/coordinator semantics (ADR 0021 in progress) is coherent but a maintainability tax until convergence.
11. **Conversion-evidence discipline.** Buyers must distinguish buyer-provided vs defaulted vs demo proof; mislabeling risks overclaim.
12. **Single-region V1 posture.** Intentional and documented; a `(B)` DR conversation for tier-1 buyers, not an `(A)` defect.

---

## Top 6 Monetization Blockers

1. **No real customer proof packets / published references** (B, V1.1) — limits expansion beyond founder-led pilots.
2. **Live commerce un-hold deferred** (Stripe live keys + Marketplace `Published` + DNS) — self-serve transactability is owner-only/V1.1; V1 motion is sales-led.
3. **Conversion-evidence ambiguity** — without crisp proof-source labeling on sponsor surfaces, deals stall on "is this number real?".
4. **Operator density slows pilot-to-paid** — time from access to "obvious value" is longer than ideal; tighten the golden path.
5. **Procurement assurance friction (SOC 2 CPA)** (B) — gates larger enterprise purchases; pilots are fine.
6. **First-party connector absence** (V1.1) — buyers wanting Jira/ServiceNow/Teams in-loop see a roadmap, not a today.

---

## Top 6 Enterprise Adoption Blockers

**Actual V1 (pilot-affecting, in-scope):**
1. **Golden-path reliability** — the review-detail render error must be verified/fixed; security reviewers and operators judge the demo path harshly.
2. **Operator onboarding density** — reduce toggle/label friction so implementation teams reach value fast.

**Acceptable for a controlled pilot (deferred / B):**
3. **CPA SOC 2 / external pen-test** (B) — required by some security reviewers for broad rollout; fine for scoped pilots with self-attestation + Trust Center.
4. **First-party ITSM/chat connectors** (V1.1) — acceptable via REST/CLI/SCIM/ADO/GitHub for pilots.
5. **Multi-region active/active** (V1.1) — single-region documented; answer tier-1 DR RFPs with V1.1 commitment + RTO/RPO targets.
6. **Production IaC depth / ACR push** (deferred §5) — organizational follow-ups; controlled deployments are supported.

---

## Top 6 Engineering Risks

1. **Cross-layer ROI/KPI divergence** — duplicated calculations can produce inconsistent buyer-facing numbers (Correctness + Data Consistency + Proof-of-ROI).
2. **Golden-path contract drift** — DTO-boundary changes outrunning UI fixtures (review-detail "missing run object").
3. **Real-mode agent quality blind spot** — real LLM path not merge-blocking-evidenced; regressions could ship unseen (blocked on owner creds/budget).
4. **Mid-strangle authority/coordinator duality** — two semantics increase defect and review surface until ADR 0021 converges.
5. **Safety-control enforcement entropy** — many guards (route-tenant, IDOR, SSRF, idempotency) exist; risk is uniform enforcement drifting as routes grow. CI drift guards mitigate but must stay green.
6. **Release-hygiene leakage** — stray solution projects and uncommitted generated-client drift indicate the build/regen pipeline can emit noise into releases.

---

## Most Important Truth

**ArchLucid is over-built in breadth and slightly under-proven in depth where it matters most.** The product can run a credible controlled pilot today, but the headline is capped — and the sale is gated — not by missing features but by (a) **unproven real-mode AI quality with no faithfulness gate**, and (b) **operational/evidence density that makes the value harder to feel and harder to trust than it should be**. The fastest path to a higher score and a faster sale is to make the golden path bulletproof, prove AI output faithfulness, and unify the numbers buyers see — not to add capability.

---

## Top Improvement Opportunities

I produced **14** improvements and **stopped before 25 deliberately** (per your cost-control rule): the remaining real items are either deferred scope (V1.1/V2, no `(A)` impact) or depend materially on the Tier 1 outcomes (golden-path/ROI-source decisions), so producing full prompts now would be speculative and likely re-cut after the first release-blocker pass. Those are listed as Tier 3 holds.

### Tier 1 — Release blockers / must-fix now

---

**T1-1. Verify and fix the operator golden-path review-detail render ("missing run object").**
*Tier:* 1. *Why it matters:* This is the final, value-delivering step of the Pilot happy path; a broken render destroys Time-to-Value and Trustworthiness in demos. *Expected impact:* Directly improves Time-to-Value (+2–3 pts), Usability (+2–3 pts), Correctness (+1–2 pts). Weighted readiness impact: +0.2–0.4%. *Affected qualities:* Time-to-Value, Usability, Correctness, Trustworthiness. *Actionable:* Fully actionable now. *Why ranked here:* Cheap, high-trust-impact, on the golden path. *Evidence:* `.ci-artifacts/mock-smoke/e2e-run-manifest-journey-...chromium/error-context.md` renders the alert "Review detail response is missing a 'run' object"; guard in `archlucid-ui/src/lib/operator-response-guards.ts`.

> **Cursor prompt:**
> Reproduce and fix the operator review-detail golden-path failure. (1) Run the UI mock smoke locally: `cd archlucid-ui && npx playwright test --config playwright.mock.config.ts` and find the spec that drives the manifest/review-detail journey. (2) The review-detail page renders the error path in `src/lib/operator-response-guards.ts` ("Review detail response is missing a 'run' object") because the mock fixture / proxy response shape no longer matches the buyer/operator review-detail DTO (recent `BuyerRunDetailSummaryDto` boundary work). Identify the canonical response contract the page expects (the `run` object) and reconcile the mock fixture(s) and any `/api/proxy` mapping so the success path renders. (3) Add or update a Vitest/Playwright assertion that the review-detail success state renders a manifest summary (not the error alert). **Acceptance:** mock smoke for the review/manifest journey passes; review-detail success path asserted; no change to the API contract unless the contract itself is wrong (if so, update the OpenAPI snapshot and note it). **Constraints:** do not weaken `operator-response-guards.ts` to mask the error; fix the data shape. **Do not change:** unrelated routes, auth, or the buyer-contract OpenAPI snapshot without explicit justification. **Verify:** `npm run test` and the mock Playwright journey are green; delete the stale `.ci-artifacts/mock-smoke/*` trace artifacts afterward. **Impact:** Time-to-Value +2–3, Usability +2–3, Correctness +1–2; weighted +0.2–0.4%.

---

**T1-2. Regenerate the API client and add/confirm a CI drift guard.**
*Tier:* 1. *Why it matters:* `ArchLucid.Api.Client/Generated/ArchLucidApiClient.g.cs` is modified in the working tree — generated artifacts drifting from source erode build reproducibility and downstream consumer trust. *Expected impact:* Maintainability (+2–3), Correctness (+1), Deployability (+1). Weighted: +0.05–0.1%. *Affected:* Maintainability, Correctness, Reliability. *Actionable:* Fully actionable now. *Evidence:* git status shows `M ArchLucid.Api.Client/Generated/ArchLucidApiClient.g.cs`.

> **Cursor prompt:**
> Make the generated API client deterministic and drift-guarded. (1) Locate the client generation script/target (search for the NSwag/OpenAPI generation invocation that emits `ArchLucid.Api.Client/Generated/ArchLucidApiClient.g.cs`). (2) Regenerate from the current committed OpenAPI snapshot and commit the result so the working tree is clean. (3) Confirm CI fails on drift: ensure a job regenerates the client and runs `git diff --exit-code` on the generated path (add it to `.github/workflows/ci.yml` near the OpenAPI snapshot job if absent). **Acceptance:** clean `git diff` on the generated client after regeneration; a CI step fails if the generated client is stale. **Constraints:** do not hand-edit generated files. **Do not change:** the public API surface. **Verify:** run the generation locally, `git status` clean; CI drift job green. **Impact:** Maintainability +2–3; weighted +0.05–0.1%.

---

**T1-3. Remove stray solution/work-tree projects and CI artifact noise.**
*Tier:* 1. *Why it matters:* `temp_sqlerror/temp_sqlerror.csproj`, `scripts/RemoveEmbeddedStatementBraces`, `tools/ApplicationThrowIfNullCodemod`, and committed/untracked `.ci-artifacts/` reduce architectural integrity and signal weak release hygiene. *Expected impact:* Architectural Integrity (+2–3), Maintainability (+2). Weighted: +0.07–0.1%. *Affected:* Architectural Integrity, Maintainability, Cognitive Load. *Actionable:* Fully actionable now (confirm each is truly disposable first). *Evidence:* `*.csproj` glob lists these; git status lists `.ci-artifacts/mock-smoke/...`.

> **Cursor prompt:**
> Clean up release hygiene. (1) Confirm `temp_sqlerror/` is a throwaway repro project (no references from the solution or other projects); if so, remove it from the `.sln` and delete the folder. (2) Evaluate `scripts/RemoveEmbeddedStatementBraces` and `tools/ApplicationThrowIfNullCodemod`: if they are one-shot codemods already applied, move them out of the main solution build (keep under `tools/` excluded from the solution, or delete if obsolete) and document in a short README. (3) Add `.ci-artifacts/` to `.gitignore` (if not present) and delete the stray `.ci-artifacts/mock-smoke/*` traces. **Acceptance:** solution builds without the removed projects; `.ci-artifacts/` ignored; no dangling `.sln` references. **Constraints:** do not delete anything still referenced — search for references first. **Do not change:** production projects. **Verify:** `dotnet build` of the solution succeeds; `git status` clean of `.ci-artifacts`. **Impact:** Architectural Integrity +2–3, Maintainability +2; weighted +0.07–0.1%.

---

**T1-4. Reconcile scope-doc drift on the coverage gate (and audit for other CI/doc mismatches).**
*Tier:* 1. *Why it matters:* `V1_DEFERRED.md` §4 still calls the 95% merged-line coverage + ratchet a V1.1 task, but `ci.yml` already enforces it. The scope contract must match reality or assessments and buyers lose trust in it. *Expected impact:* Documentation (+2), Maintainability (+2), Trustworthiness (+1). Weighted: +0.05–0.1%. *Affected:* Documentation, Maintainability, Trustworthiness. *Actionable:* Fully actionable now. *Evidence:* `ci.yml` ~L2170 (`assert_merged_line_coverage_min.py ... 95`, "full ratchet enabled") vs `V1_DEFERRED.md` §4 "raise merged line to 95%, re-enable the ratchet (V1.1)".

> **Cursor prompt:**
> Reconcile coverage-gate documentation with the actual CI configuration. (1) Confirm in `.github/workflows/ci.yml` the enforced merged-line minimum (currently 95) and whether `assert_coverage_floor_ratchet.py` / `.coverage-floor` are invoked. (2) Update `docs/library/V1_DEFERRED.md` §4 and any sibling docs (`docs/engineering/BUILD.md`, `docs/library/coverage-exclusions.md`, `docs/library/COVERAGE_GAP_ANALYSIS.md`) to state the *current* gate (95% + ratchet enabled), removing the stale "raise to 95% in V1.1" wording. (3) Grep the docs corpus for other "V1.1 will raise/enable" coverage claims and fix mismatches. **Acceptance:** no doc claims the coverage gate is still 75%/deferred when CI enforces 95%; statements cite the actual `ci.yml` values. **Constraints:** do not change CI thresholds — only the docs to match CI. **Do not change:** the gate itself. **Verify:** `rg -n "75%|ratchet|merged line" docs/` shows only accurate statements. **Impact:** Documentation +2, Maintainability +2, Trustworthiness +1; weighted +0.05–0.1%.

---

### Tier 2 — High-leverage next wave

---

**T2-5. Add an AI faithfulness / grounding evaluation seam (TB-021) and surface it in CI (non-blocking → gate).**
*Tier:* 2. *Why it matters:* This is the single highest-leverage in-scope AI move — it directly raises the three highest-weight engineering qualities and is the foundation of Trustworthiness for AI outputs. *Expected impact:* Cutting-Edge AI (+4–6), AI/Agent Readiness (+3–4), Correctness (+1–2), Trustworthiness (+1). Weighted: +0.5–0.8%. *Affected:* Cutting-Edge AI, AI/Agent Readiness, Correctness, Trustworthiness. *Actionable:* Partially actionable now (the eval harness + metric in simulator/offline mode); the real-mode run is blocked (see DEFERRED T2-6). *Why ranked here:* Highest weighted upside of any in-scope item, but larger than a Tier 1 hygiene fix. *Evidence:* `V1_DEFERRED.md` §6q (TB-021, faithfulness eval listed as in-scope quality work); `agent-eval-datasets-nightly.yml`, `real-llm-golden-cohort.yml` exist as the integration points.

> **Cursor prompt:**
> Implement a citation-faithfulness / grounding evaluation for agent outputs (TB-021), runnable in simulator/offline mode. (1) Find the agent eval harness used by `.github/workflows/agent-eval-datasets-nightly.yml` and the golden cohort. (2) Add a faithfulness metric: for findings/recommendations that cite evidence, score whether the cited source supports the claim (start with a deterministic check that every claim-with-citation references an existing, in-context evidence id; optionally add an LLM-graded faithfulness score gated behind simulator/offline fixtures so it runs without live AOAI). (3) Emit the metric to the eval report and the job summary; wire a **non-blocking** CI threshold first (warn), with a TODO to promote to merge-blocking once a baseline exists. (4) Document the metric in the RAG/agent eval docs. **Acceptance:** the eval run outputs a faithfulness score on the existing offline corpus; CI surfaces it as a warning annotation; no live AOAI dependency for the deterministic path. **Constraints:** must run in CI without real AOAI creds (use simulator/offline fixtures); do not make it merge-blocking in this PR. **Do not change:** the orchestration contracts or prompt baselines. **Verify:** nightly eval workflow (or its local equivalent) prints the faithfulness metric; unit tests cover the deterministic citation check. **Impact:** Cutting-Edge AI +4–6, AI/Agent Readiness +3–4, Correctness +1–2; weighted +0.5–0.8%.

---

**T2-6. DEFERRED — Real-mode quad-agent end-to-end quality evidence in CI.**
*Tier:* 2 (DEFERRED). *Why it matters:* Real-mode output quality is the largest confidence gap behind AI/Agent Readiness and Correctness. *Reason it is deferred:* It is **blocked on owner-provided input** — real Azure OpenAI endpoint + key + budget approval (the `ARCHLUCID_CI_REAL_AOAI_*` repo var/secrets and G-REAL / TB-140 owner-blocked status). No meaningful merge-blocking real-mode evidence can be produced without live credentials and a spend ceiling. *Specific information needed from you:* (a) approval to enable `ARCHLUCID_CI_REAL_AOAI_ENABLED` and the endpoint/key secrets, (b) a per-run and monthly budget ceiling for the real cohort, (c) the acceptance bar (which scenarios/metrics must pass to call real-mode "release-evidenced"). *Partial work that can proceed without you:* the deterministic faithfulness seam in **T2-5** (already separated out). *No Cursor prompt provided (per DEFERRED rule).*

---

**T2-7. Unify ROI/KPI calculation onto a single source of truth.**
*Tier:* 2. *Why it matters:* Buyer-facing numbers that differ between the per-run ROI, executive summary, value report, and cached/UI views directly undermine Proof-of-ROI and Correctness. *Expected impact:* Data Consistency (+3–4), Correctness (+1–2), Proof-of-ROI (+2), Executive Value Visibility (+1). Weighted: +0.2–0.35%. *Affected:* Data Consistency, Correctness, Proof-of-ROI, Executive Value Visibility. *Actionable:* Partially actionable now (audit + consolidation of clearly-duplicated math); some UI surfaces may depend on T1-1 outcome. *Evidence:* `ExecutiveRoiSummaryService` (`ArchLucid.Application/Roi/`), per-run `GET /v1/architecture/run/{runId}/roi`, value report controllers, and UI ROI sections (`value-report`, `executive/dashboard`) compute/format value independently per `V1_SCOPE.md` §2.8.

> **Cursor prompt:**
> Audit and consolidate ROI/savings calculation so every surface derives from one service. (1) Inventory all places that compute estimated USD savings / ROI deltas / top-systemic-issue counts: `ExecutiveRoiSummaryService`, the per-run ROI endpoint handler, the value-report generator, and any UI-side recomputation in `archlucid-ui/.../value-report` and `executive/dashboard`. (2) Identify divergences (rounding, dedup-by-`FindingId`, latest-committed-run-per-system selection) and define the canonical algorithm per `V1_SCOPE.md` §2.8 / §6o (dedup by stable `FindingId`, latest committed run per system, sum savings). (3) Refactor so per-run, executive-summary, and value-report all call the same calculation component; the UI formats but does not recompute. (4) Add tests asserting the three surfaces return consistent numbers for a fixed fixture. **Acceptance:** one calculation component; UI does no independent ROI math; consistency test passes across surfaces. **Constraints:** preserve the documented aggregation semantics (dedup, latest-per-system); do not change citation contracts. **Do not change:** the extractor cost-citation doctrine. **Verify:** new cross-surface consistency tests green; manual check that exec dashboard and value report show identical totals for one run set. **Impact:** Data Consistency +3–4, Correctness +1–2, Proof-of-ROI +2; weighted +0.2–0.35%.

---

**T2-8. Reconcile legacy "Runs" labels to the "Reviews" domain language across the operator UI.**
*Tier:* 2. *Why it matters:* Mixed terminology raises cognitive load and makes the product feel unfinished to operators and buyers. *Expected impact:* Usability (+2–3), Cognitive Load (+3–4), Adoption Friction (+1). Weighted: +0.1–0.15%. *Affected:* Usability, Cognitive Load, Adoption Friction. *Actionable:* Fully actionable now (mechanical, Composer-safe). *Evidence:* `V1_SCOPE.md` notes "legacy labels may still say *Runs*"; UI route group still includes legacy labels (`reviews` routes vs "Run replay"/"Runs" copy).

> **Cursor prompt:**
> Reconcile user-facing terminology in the operator UI from legacy "Run/Runs" to the canonical "Review/Reviews" where the domain term is Reviews (keep `runId` as the technical identifier and keep API routes unchanged). (1) Grep `archlucid-ui/src` for user-visible strings containing "Run"/"Runs"/"Run replay" and classify each as user-facing copy vs technical identifier. (2) Update user-facing copy/labels/aria-labels/headings to "Review(s)" consistent with `V1_SCOPE.md`; leave variable names, route params (`[runId]`), and API paths untouched. (3) Update any snapshot/Vitest tests that assert the old copy. **Acceptance:** no user-visible "Run" label remains where the domain term is Review; tests updated; build green. **Constraints:** do not rename API routes, `runId` params, or DTO fields. **Do not change:** backend contracts. **Verify:** `npm run test` and typecheck/lint green; spot-check reviews list/detail, replay, compare pages. **Impact:** Usability +2–3, Cognitive Load +3–4; weighted +0.1–0.15%.

---

**T2-9. Audit in-app help for leaked raw repo/engineering references.**
*Tier:* 2. *Why it matters:* `PRODUCT_DOCUMENTATION_PRESENTATION.md` mandates product-native help for users and GitHub for engineering source only; leaks make the product feel internal and raise self-sufficiency friction. *Expected impact:* Usability (+1–2), Customer Self-Sufficiency (+2), Documentation (+1). Weighted: +0.05–0.1%. *Affected:* Usability, Customer Self-Sufficiency, Documentation. *Actionable:* Fully actionable now. *Evidence:* operator `help` routes exist (`(operator)/help`, `/help/[topic]`); prior snapshots note raw repo references leaking into help surfaces.

> **Cursor prompt:**
> Ensure in-app help contains no raw repository/engineering references. (1) Search the operator help content sources (the `(operator)/help` and `/help/[topic]` page data, plus any help JSON/MDX) for links/paths pointing at GitHub source files, `docs/…` engineering paths, or `*.cs`/`*.csproj` references. (2) Replace user-facing help with product-native guidance; move any genuinely engineering content out of the user help surface per `PRODUCT_DOCUMENTATION_PRESENTATION.md`. (3) Add a lightweight test/lint that fails if help content references forbidden engineering paths. **Acceptance:** no raw repo/source references in user help; guard test added. **Constraints:** keep help accurate to current features. **Do not change:** engineering docs under `docs/`. **Verify:** the new guard passes; manual review of help pages. **Impact:** Usability +1–2, Customer Self-Sufficiency +2; weighted +0.05–0.1%.

---

**T2-10. Tighten the first-run golden path: reduce toggle density and verify end-to-end.**
*Tier:* 2. *Why it matters:* Adoption Friction and Time-to-Value are high-weight; the dense enablement model ("Show more links", extended/advanced) delays first value. *Expected impact:* Adoption Friction (+2–3), Time-to-Value (+1–2), Cognitive Load (+1). Weighted: +0.15–0.25%. *Affected:* Adoption Friction, Time-to-Value, Cognitive Load. *Actionable:* Partially actionable now (the guided first-run flow + checklist verification); deeper IA changes are product direction (Tier 3). *Evidence:* `V1_SCOPE.md` §4 happy path + Core Pilot checklist; operator sidebar progressive-disclosure model.

> **Cursor prompt:**
> Make the Pilot golden path the path of least resistance on first run. (1) Review the operator Home Core Pilot checklist and the sidebar disclosure model; ensure the four-step Pilot path (create review → execute → commit → review manifest/artifacts) is reachable without enabling "Show more"/extended links. (2) For a brand-new tenant with the demo seed, walk the path and remove or defer any toggle that is not required for the four steps; surface the next action inline. (3) Add/strengthen a Playwright mock journey that completes the four-step Pilot path with default (non-expanded) navigation. **Acceptance:** the four Pilot steps are completable with default navigation; a mock journey proves it. **Constraints:** do not remove Operate-layer features — only ensure they are not in the Pilot critical path. **Do not change:** API contracts. **Verify:** the new/updated mock journey is green; manual first-run walkthrough. **Impact:** Adoption Friction +2–3, Time-to-Value +1–2; weighted +0.15–0.25%.

---

### Tier 3 — Hold for reassessment (no prompts unless clearly independent)

**T3-11. Coordinator/authority strangler convergence (ADR 0021).** Real maintainability/architectural-integrity upside, but it is **mid-flight and direction-dependent**; producing an implementation prompt now risks conflicting with the strangler sequencing. *Revisit after:* T1-3 (hygiene) and a confirmed next ADR step. *No prompt.*

**T3-12. Graph-RAG / agentic retrieval (RAG-V2-001/002).** Genuinely raises Cutting-Edge AI, but explicitly **V2** (`V1_DEFERRED.md` §6q) and should follow the faithfulness seam (T2-5) so quality is measurable first. No `(A)` penalty for absence. *No prompt.*

**T3-13. First-party ITSM/Teams/Slack/Confluence connectors.** **V1.1** scope (`V1_SCOPE.md` §2.13–§2.15); raises Workflow Embeddedness/Interoperability but is deferred and sequenced (ServiceNow → Confluence → Jira). No `(A)` penalty. *No prompt.*

**T3-14. Multi-cloud AWS/GCP target analysis.** **V1.1** (`V1_SCOPE.md` §2.19); parsers partially handle non-Azure HCL but classification/cost are Azure-skewed. Revisit when the V1.1 window opens. No `(A)` penalty. *No prompt.*

---

## Prompt Batching Guidance

- **Batch 1 (release hygiene, low-risk, can run together):** T1-2 (client regen + drift guard), T1-3 (stray project cleanup), T1-4 (coverage-doc reconciliation). These touch disjoint areas (generated client, solution/.gitignore, docs) and are safe to combine. **Run T1-1 ALONE** — it changes UI data-shape/fixtures on the golden path and deserves isolated verification.
- **Batch 2 (correctness/trust, related — sequence, do not parallelize against each other):** T2-7 (ROI single-source) first, then T1-1 verification re-run, since both touch the review/ROI data surfaces. Keep T2-5 (faithfulness eval) **alone** — it touches the eval harness and CI and should not be entangled with UI/ROI changes.
- **Batch 3 (UX polish, low-risk, can run together):** T2-8 (label reconciliation), T2-9 (help audit), T2-10 (first-run path). All UI/docs, low blast radius; T2-8 and T2-9 are mechanical and parallel-safe; T2-10 should land after T2-8 so the journey test asserts the new labels.
- **Do not batch:** any AI/eval change (T2-5) with UI changes; any ROI-math change (T2-7) with the golden-path render fix (T1-1) in the same commit.
- **Re-review by a stronger model before release:** T2-7 (financial correctness), T2-5 (AI faithfulness metric design), and the T2-6 acceptance bar.

## Model-Usage Guidance

- **Composer-safe (mechanical, low-risk):** T1-3 (project/artifact cleanup once disposability confirmed), T1-4 (doc reconciliation), T2-8 (label reconciliation), T2-9 (help reference audit).
- **Sonnet-safe (implementation, moderate reasoning):** T1-1 (golden-path fixture/DTO reconciliation), T1-2 (client regen + CI guard), T2-10 (first-run path tightening), and the deterministic portion of T2-5 (citation-faithfulness check + CI wiring).
- **Strong-model recommended (correctness/architecture/AI judgment):** T2-7 (ROI single-source — financial correctness across surfaces), the **LLM-graded faithfulness metric design** within T2-5, the **T2-6 acceptance-bar and budget** decision, and the overall **release go/no-go**. T3-11 (strangler direction) is also strong-model territory when revisited.

## Pending Questions for Later

- **T2-6 (Real-mode AI evidence):** Will you enable `ARCHLUCID_CI_REAL_AOAI_*` (endpoint/key) and approve a per-run + monthly spend ceiling? What is the acceptance bar (scenarios + metrics) that defines "real-mode release-evidenced"? Blocking for any real-mode confidence gain.
- **T2-5 (Faithfulness gate):** Do you want the LLM-graded faithfulness score to eventually become **merge-blocking**, and at what baseline threshold? Decision-shaping for CI gating.
- **T2-7 (ROI source):** Is the documented aggregation (dedup by `FindingId`, latest committed run per system, sum savings) the single authoritative algorithm for *all* surfaces including value reports and the board pack? Confirm before consolidation.
- **T1-3 (cleanup):** Confirm `temp_sqlerror/`, `scripts/RemoveEmbeddedStatementBraces`, and `tools/ApplicationThrowIfNullCodemod` are disposable (already-applied one-shots) and may be removed from the solution.
- **T3-11 (strangler):** What is the next intended ADR step for coordinator/authority convergence? Determines whether/when to produce an implementation prompt.
