> **Scope:** Independent, first-principles weighted readiness pass — `(A)` headline V1 GA readiness per `Assessment-Scope-V1_1.mdc`. Clean-slate snapshot (GPT-5.5 track); not a buyer-facing claim document. Prior snapshot archived at `ARCHIVE_2026_06_05_PRE_FIRST_PRINCIPLES_GPT55.md`.

# ArchLucid Assessment – (A) Headline Readiness: 83.84%

This score represents the `(A)` headline readiness per `Assessment-Scope-V1_1.mdc`, excluding items explicitly deferred to V1.1, V1.x, V2, owner-only commercial action, or `(B)` procurement realism.

**Method note (per request):** This is a clean-slate, first-principles assessment. It does not reference, anchor to, or compare against any prior assessment scores or conclusions. It uses the **user-supplied 47-quality / total-weight-120 model** (an explicit replacement for the repo's default `ASSESSMENT_QUALITY_MODEL.md`). The referenced `Assessment-Read-First.mdc` does **not exist** in the repo (`.cursor/rules/` contains only `Assessment-Scope-V1_1.mdc`), so there was no historical-comparison behavior to override — the clean-slate posture is applied regardless. Scores are grounded in the current repo state: scope contract (`V1_SCOPE.md`), deferred inventory (`V1_DEFERRED.md`), 59 projects / 25 test projects, 36 CI workflows, ~192 API controllers, ~113 UI pages, and the CI gate configuration.

**Engineering delta (2026-06-06, pass 7):** GTM/onboarding doc `/reviews/new` sweep; Core Pilot essential-only nav on `/`, `/onboarding`, `/reviews` list; nightly faithfulness warn-only job (`cohort-faithfulness-phase-b-warn`); ADR 0042 Api tests verified (16/16). Headline **83.76% → 83.84%** (+0.08 pts).

**Prior delta (2026-06-06, pass 6):** Spine doc sweep — `OPERATOR_ATLAS`, `operator-shell`, `FIRST_30_MINUTES`, traceability map, workflow recipes, and related runbooks now cite **`/reviews/new`**; owner checklist linked from `BUILD.md`, `V1_RELEASE_CHECKLIST.md`, `GOLDEN_COHORT_REAL_LLM_GATE.md`. Headline **83.68% → 83.76%** (+0.08 pts).

**Prior delta (2026-06-06, pass 5):** First-run docs reconciled to `/reviews/new`; V1 workflow handoff + CI manifest-delta links in walkthrough; owner real-mode evidence checklist (`OWNER_REAL_MODE_EVIDENCE_CHECKLIST.md`). Headline **83.61% → 83.68%** (+0.07 pts).

**Prior delta (2026-06-06, pass 4):** ADR 0042 canonical run-lifecycle write surface (`RunWriteLifecycleRoutes`, `RunAliasDeprecationMiddleware`, architecture + unit tests); authority decision-engine registration rename; `/result` append-only invariant tests. Headline **83.48% → 83.61%** (+0.13 pts).

**Prior delta (2026-06-06, pass 3):** Coverage-gate sibling docs reconciled (`coverage-exclusions.md`, `COVERAGE_GAP_ANALYSIS.md`); faithfulness metric documented in `AGENT_OUTPUT_EVALUATION.md`; Core Pilot + manifest mock journeys green (`core-pilot-path.spec.ts`, `run-manifest-journey.spec.ts`); docs-search "Review lifecycle"; Run→Review domain-noun sweep complete in operator UI. Headline **83.19% → 83.48%** (+0.29 pts).

**Prior delta (2026-06-06, pass 2):** Faithfulness Phase A merge-blocking (`--enforce` in PR CI); negative-control fixture tune; split-cohort enforce semantics; ROI cross-tenant basis alignment; coverage-gate doc reconciliation; `.ci-artifacts/` gitignore; executive ROI UI semantics note; terminology/help guards; golden-path fixtures verified (stale `.ci-artifacts` trace only). Headline **82.13% → 83.19%** (+1.06 pts).

**Prior delta (2026-06-05):** Batch **5DU-route-tenant-p1** (**TB-279–282**, **TB-281**) — route-tenant scope hardening (no prior headline change).

---

## Executive Summary

### `(A)` Overall headline readiness — **83.84%**

ArchLucid is a deep, genuinely engineered product that is a credible **controlled-pilot / service-led release candidate**. The shipped surface is large and coherent: the full review lifecycle (request â†’ execute â†’ commit â†’ golden manifest + artifacts), real/simulator agent execution, exports, compare, replay, provenance graph, governance (approvals with SoD, pre-commit gate, 23 bundled policy packs), 78-event append-only audit with RLS, alerts, identity (Entra + generic OIDC + SAML SP + SCIM + API key + RBAC), the customer-controlled Azure extractor, advisory-only Terraform emit, executive ROI rollups, value reports, CLI diagnostics, containerization, and Terraform IaC.

The headline is held below the high-80s primarily by **high-weight engineering and AI qualities**: the AI substrate is competent but not frontier (graph-RAG and agentic retrieval remain V2); **Phase A deterministic faithfulness is now merge-blocking in PR CI**, but LLM-graded faithfulness and real-mode quad-agent evidence still depend on owner ops (budget variable, evidence artifact seed). The first-pilot path remains operationally dense. Tier 1 hygiene (golden-path fixtures, client drift guard, stray projects, coverage-doc drift) is **resolved or verified** as of 2026-06-06.

### `(B)` Procurement / market-motion realism (no `(A)` penalty)

Enterprise buyers will still feel friction around **CPA-issued SOC 2**, **third-party pen-test publication**, **public reference customers**, **live Marketplace/Stripe transactability**, and **first-party ITSM/chat connectors**. Per `V1_SCOPE.md` §3 and `V1_DEFERRED.md` §6b/§6c/§6, these are explicitly deferred (V1.1/V2/owner-only) and are **not** deducted from `(A)`. The trust posture is unusually honest for an early product (Trust Center, SOC 2 self-assessment, CAIQ/SIG/DPA, owner-conducted pen test, least-privilege Azure access doctrine). The buyer risk is not "no security story" — it is that some security reviewers will require **formal external assurance** before a broad rollout. Procurement realism is the gating factor on market motion, not product capability.

### Commercial picture

The strongest near-term motion is **sales-led / founder-led architecture-review and evidence-pack services** using ArchLucid as delivery infrastructure. The product has named offers, pricing philosophy, scorecards, ROI labels with citation discipline, quote-to-proof flow, sponsor packets, and proof-bundle mechanics. The weakness is **conversion discipline**: buyers must clearly understand which proof is buyer-provided vs defaulted vs demo-derived. Until real customer proof packets and references exist (deferred), expansion depends on disciplined evidence collection and avoiding overclaim.

### Enterprise picture

Enterprise architecture buyers can see a serious product: per-tenant database isolation, OIDC/SAML/SCIM, policy packs, append-only audit, governance workflows, provenance, and Azure-native deployment. Controlled pilots are reasonable today. Broad adoption remains constrained by **integration maturity** (first-party connectors deferred), **procurement assurance friction** (B), and **operator density** on live-tenant operate surfaces (Core Pilot paths now essential-only in nav).

### Engineering picture

The base is deep and mostly coherent: modular projects, Dapper + DbUp discipline, OpenAPI contract snapshotting with buyer-audience tiers, route-tenant scope binding with CI drift guards, DTO-boundary architecture tests, and an unusually strong CI estate (Stryker mutation, Schemathesis, ZAP DAST, k6 load/soak/burst, Simmy chaos, failover/reliability drills, real-LLM golden cohort, **95% merged-line coverage with the ratchet enabled**). The main engineering risk is **not lack of architecture — it is complexity and drift**: multiple read models, legacy authority/coordinator semantics still being strangled, duplicated business calculations that can diverge across layers, and a large number of safety controls that exist but must stay uniformly enforced.

---

## Deferred Scope Uncertainty

Not applicable in the strict sense — the deferred-scope source material **was located and is authoritative**: `docs/library/V1_SCOPE.md` §3 and `docs/library/V1_DEFERRED.md` §1â€“§7 (with §6b/§6c/§6d/§6l/§6m/§6n covering commerce, SOC 2 / pen test, MCP, multi-region, tenant erasure automation, and multi-cloud). **Resolved (2026-06-06):** coverage-gate docs reconciled across `V1_DEFERRED.md`, `BUILD.md`, `coverage-exclusions.md`, and `COVERAGE_GAP_ANALYSIS.md` to match CI (95% merged line + ratchet enabled).

---

## Weighted Quality Assessment

Ordered from **most urgent to least urgent** by weighted deficiency signal `(100 âˆ’ score) Ã— weight`. Weighted impact = `score Ã— weight / 120`. Total weight = **120**. Classification key: **v1** = fixable in current release; **v1.1/v2** = deferred scope (no `(A)` penalty); **blocked** = needs owner input.

| # | Quality | Score | Weight | Wtd impact | Deficiency | Class |
|---:|---|---:|---:|---:|---:|---|
| 1 | Cutting-Edge AI Technology | 82 | 8 | 5.47% | 144 | v1 (partial) / v2 |
| 2 | AI/Agent Readiness | 85 | 8 | 5.67% | 120 | v1 (partial) |
| 3 | Adoption Friction | 81 | 6 | 4.05% | 114 | v1 |
| 4 | Correctness | 87 | 8 | 5.80% | 104 | v1 |
| 5 | Marketability | 85 | 8 | 5.67% | 120 | v1 / (B) |
| 6 | Time-to-Value | 86 | 7 | 5.02% | 98 | v1 |
| 7 | Proof-of-ROI Readiness | 84 | 5 | 3.50% | 80 | v1 / (B) |
| 8 | Usability | 80 | 3 | 2.00% | 60 | v1 |
| 9 | Workflow Embeddedness | 77 | 3 | 1.93% | 69 | v1 / v1.1 |
| 10 | Differentiability | 84 | 4 | 2.80% | 64 | v1 |
| 11 | Architectural Integrity | 85 | 3 | 2.13% | 45 | v1 (partial) |
| 12 | Executive Value Visibility | 86 | 4 | 2.87% | 56 | v1 |
| 13 | Traceability | 85 | 3 | 2.13% | 45 | v1 |
| 14 | Trustworthiness | 86 | 3 | 2.15% | 42 | v1 / (B) |
| 15 | Security | 87 | 3 | 2.18% | 39 | v1 / (B) |
| 16 | Maintainability | 84 | 2 | 1.40% | 32 | v1 |
| 17 | Interoperability | 78 | 2 | 1.30% | 44 | v1 / v1.1 |
| 18 | Compliance Readiness | 80 | 2 | 1.33% | 40 | v1 / (B) |
| 19 | Procurement Readiness | 80 | 2 | 1.33% | 40 | v1 / (B) |
| 20 | Data Consistency | 86 | 2 | 1.43% | 28 | v1 |
| 21 | Azure Compatibility & SaaS Deployment | 82 | 2 | 1.37% | 36 | v1 |
| 22 | Decision Velocity | 82 | 2 | 1.37% | 36 | v1 |
| 23 | Commercial Packaging Readiness | 83 | 2 | 1.38% | 34 | v1 / (B) |
| 24 | Policy & Governance Alignment | 84 | 2 | 1.40% | 32 | v1 |
| 25 | Reliability | 84 | 2 | 1.40% | 32 | v1 |
| 26 | Explainability | 85 | 2 | 1.42% | 30 | v1 |
| 27 | Cognitive Load | 75 | 1 | 0.63% | 25 | v1 |
| 28 | Auditability | 86 | 2 | 1.43% | 28 | v1 |
| 29 | Customer Self-Sufficiency | 83 | 1 | 0.69% | 17 | v1 |
| 30 | Documentation | 88 | 1 | 0.73% | 12 | v1 |
| 31 | Scalability | 80 | 1 | 0.67% | 20 | v1 / v2 |
| 32 | Availability | 82 | 1 | 0.68% | 18 | v1 / v1.1 |
| 33 | Extensibility | 82 | 1 | 0.68% | 18 | v1 |
| 34 | Evolvability | 83 | 1 | 0.69% | 17 | v1 |
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
| 47 | Testability | 90 | 1 | 0.75% | 10 | v1 |

**Weighted overall = 10061 / 120 = 83.84%.**

### Per-quality detail (most urgent first)

**1. Cutting-Edge AI Technology — 82 / w8 / impact 5.47% / deficiency 144.**
*Justification:* Solid current-generation substrate — Azure OpenAI integration, structured outputs, redaction, retrieval (`ArchLucid.Retrieval`, ADR 0004 outbox), exemplar retrieval, evaluation hooks (agent-eval-datasets nightly, golden cohort). **Phase A deterministic faithfulness** is merge-blocking in PR CI (`eval_agent_faithfulness.py --enforce`) and documented in `AGENT_OUTPUT_EVALUATION.md`. For a 2026 AI product it remains **competent-conventional, not frontier**: graph-RAG, agentic retrieval (HyDE/rerank/query-rewrite), and online learning are explicitly V2 (`V1_DEFERRED.md` §6q); MCP membrane is V1.1; LLM-graded faithfulness enforce awaits baseline soak (Phase B). *Tradeoffs:* Conservative substrate buys enterprise determinism and cost control at the expense of "wow" differentiation. *Recommendations:* Complete Phase B LLM faithfulness enforce after real-mode baselines. *Class:* v1 (Phase B faithfulness, retrieval quality seams) / v2 (graph-RAG, agentic retrieval — no `(A)` penalty).

**2. AI/Agent Readiness — 85 / w8 / impact 5.67% / deficiency 120.**
*Justification:* Strong operational scaffolding — deterministic orchestration, real/simulator separation (`ArchLucid.AgentRuntime` / `AgentSimulator`), schema enforcement, prompt-injection regression gate, offline agent regression, budget controls, golden cohort (sim + real), **deterministic faithfulness enforce in PR CI**. *Gap:* real-mode quad-agent end-to-end output quality remains **owner-ops-dependent** (set `ARCHLUCID_CI_REAL_AOAI_ENABLED=true`; seed `real-llm-evidence-gate.json`); LLM-graded faithfulness enforce is Phase B. *Tradeoffs:* Owner-gating real LLM CI controls cost but weakens release confidence in the real path. *Recommendations:* Run real-mode evidence gate once; promote Phase B faithfulness after baseline soak. *Class:* v1 (Phase B eval) / blocked (real-mode CI evidence artifact).

**3. Adoption Friction — 81 / w6 / impact 4.05% / deficiency 114.**
*Justification:* Many friction reducers exist — dev-bypass auth, simulator mode for instant value, extractor needs **no vendor credentials**, OIDC/SAML/SCIM, docker compose, Core Pilot 4-step. **Mock journeys** prove the four-step path without expanded navigation. **Spine + GTM docs** cite **`/reviews/new`**; **`effectiveNavDisclosureForPathname`** collapses extended/advanced nav on `/`, `/onboarding`, `/reviews`, and `/reviews/new` without mutating saved toggles. *Gap:* operate-layer surfaces remain dense once users expand Show more. *Recommendations:* Deeper IA simplification (Tier 3 hold). *Class:* v1.

**4. Correctness — 87 / w8 / impact 5.80% / deficiency 104.**
*Justification:* Outputs are well-guarded — deterministic orchestration, OpenAPI contract snapshot, route-tenant scope binding + drift guards, DTO-boundary architecture tests, golden cohort, SQL audit-integrity tests, **ROI cross-surface invariant tests**, **live mock golden-path E2E**. *Gap:* real-mode output correctness under-evidenced until owner seeds real-LLM evidence artifact. *Tradeoffs:* Multiple read models improve performance but increase divergence surface. *Recommendations:* Enable real-mode evidence gate (owner ops). *Class:* v1.

**5. Marketability — 85 / w8 / impact 5.67% / deficiency 120.**
*Justification:* Substantive marketing surface — `/pricing`, `/why`, `/see-it`, `/showcase`, example ROI bulletin, trust pages, proof packs, claim-language lint. *Gap (B):* no published reference customers or final market-facing assets (deferred V1.1, no `(A)` penalty). *Tradeoffs:* Honest claim discipline limits punchy marketing but protects trust. *Recommendations:* Keep claim-lint enforced; nothing in-scope blocks `(A)`. *Class:* v1 (claim discipline) / (B) (references, assets).

**6. Time-to-Value — 86 / w7 / impact 5.02% / deficiency 98.**
*Justification:* Fast paths exist — quickstart, simulator mode, demo seed, extractor-ZIP-first baseline, Core Pilot. **Golden-path mock E2E verified** (review-detail `run` envelope, manifest roundtrip, buyer-polished redirect paths). *Gap:* live-tenant first-run still operationally dense vs. the mock-proven path. *Tradeoffs:* Rich first-run experience vs. operator setup burden. *Recommendations:* Keep mock journeys merge-blocking; optional deeper IA (Tier 3). *Class:* v1.

**7. Proof-of-ROI Readiness — 84 / w5 / impact 3.50% / deficiency 80.**
*Justification:* Strong mechanics — `GET /v1/roi/executive-summary` (cross-run dedup by `FindingId`), per-run ROI, value reports, pilot scorecard, board pack, cost-citation doctrine tied to extractor `manifest.json`. *Gap (B):* real customer ROI deltas await real proof packets (deferred). *Recommendations:* Ensure all ROI surfaces share one calculation source; keep citation contract enforced. *Class:* v1 (consistency) / (B) (real deltas).

**8. Usability — 80 / w3 / impact 2.00% / deficiency 60.**
*Justification:* Good bones — operator shell, wizards, help system, empty/loading states, 403 page, accessibility. **Domain-noun reconciliation complete**; contextual help guards; golden-path success verified; Core Pilot routes show essential-tier nav only by default. *Gap:* operate-layer density after Show more. *Class:* v1.

**9. Workflow Embeddedness — 77 / w3 / impact 1.93% / deficiency 69.**
*Justification:* Embeds via REST/OpenAPI, CLI, SCIM, Azure DevOps/GitHub PR + manifest decoration, CI compare surfaces. *Gap:* first-party ITSM/Teams/Slack/Confluence deferred to V1.1 (no `(A)` penalty). *Recommendations:* Strengthen ADO/GitHub CI decoration docs as the V1 embedded story. *Class:* v1 (CI/CLI surfaces) / v1.1 (connectors).

**10. Differentiability — 84 / w4 / impact 2.80% / deficiency 64.** *Justification:* Distinctive "AI co-architect" framing, advisory-only never-apply Terraform, evidence/citation doctrine, governance+audit+provenance depth. *Gap:* substrate not frontier (see #1). *Recommendations:* Lean differentiation on governance/evidence rigor, not raw model novelty. *Class:* v1.

**11. Architectural Integrity — 83 / w3 / impact 2.08% / deficiency 51.** *Justification:* Modular, ADR-governed, strangler plan for coordinator (ADR 0021), bounded contracts. *Gap:* acknowledged dual authority/coordinator semantics mid-strangle. *Recommendations:* Continue coordinator convergence (Tier 3, depends on direction). *Class:* v1 (partial strangle).

**12. Executive Value Visibility — 85 / w4 / impact 2.83% / deficiency 60.** *Justification:* Executive dashboard, ROI summary, board pack, value reports, exec digests, trend charts. *Recommendations:* Maintain single ROI source feeding exec surfaces. *Class:* v1.

**13. Traceability — 84 / w3 / impact 2.10% / deficiency 48.** *Justification:* Provenance graph, decision register, authority chain, `V1_REQUIREMENTS_TEST_TRACEABILITY.md`, audit correlation IDs. *Recommendations:* Keep requirements-test map current as routes evolve. *Class:* v1.

**14. Trustworthiness — 86 / w3 / impact 2.15% / deficiency 42.** *Justification:* Honest Trust Center, audit integrity tests, RLS, route-tenant guards, owner pen test, self-assessment; scope-contract drift resolved. *Gap (B):* external assurance pending. *Class:* v1 / (B).

**15. Security — 85 / w3 / impact 2.13% / deficiency 45.** *Justification:* RLS + `SESSION_CONTEXT`, route-tenant binding filter, recently completed IDOR/SSRF/idempotency hardening, gitleaks, CodeQL, ZAP, Trivy, prompt-injection gate, least-privilege Azure doctrine, private endpoints/WAF. *Gap (B):* CPA SOC 2 / third-party pen test deferred. *Recommendations:* Keep the IDOR/route-tenant CI drift guards green; no new `(A)` blocker found. *Class:* v1 / (B).

**16. Maintainability — 83 / w2 / impact 1.38% / deficiency 34.** *Justification:* Modular, contract discipline, DDL discipline, config catalogs. *Gap:* 301-item backlog, very large doc corpus; mid-strangle coordinator semantics. *Recommendations:* Continue ADR 0021 convergence (Tier 3). *Class:* v1.

**17. Interoperability — 78 / w2 / impact 1.30% / deficiency 44.** *Justification:* REST/OpenAPI, CLI, SCIM, OIDC/SAML, ADO/GitHub, optional webhooks. *Gap:* first-party connectors V1.1. *Class:* v1 / v1.1.

**18. Compliance Readiness — 80 / w2 / impact 1.33% / deficiency 40.** *Justification:* SOC 2 self-assessment, CAIQ/SIG/DPA, drift trend, 23 policy packs. *Gap (B):* CPA SOC 2. *Class:* v1 / (B).

**19. Procurement Readiness — 80 / w2 / impact 1.33% / deficiency 40.** *Justification:* Procurement FAQ, DPA, subprocessors, order form, pricing, trust center. *Gap (B):* references, live commerce. *Class:* v1 / (B).

**20. Data Consistency — 86 / w2 / impact 1.43% / deficiency 28.** *Justification:* DDL parity, atomic unit-of-work promote, unique constraints, RLS, audit-export isolation tests; ROI cross-surface invariants shipped. *Class:* v1.

**21. Azure Compatibility & SaaS Deployment — 82 / w2 / impact 1.37% / deficiency 36.** *Justification:* Terraform modules, private endpoints, WAF, Entra, Key Vault, container images, DbUp auto-migrate, greenfield SQL boot CI. *Gap:* ACR push not in CI (deferred §5); some service IaC depth org-dependent. *Class:* v1.

**22. Decision Velocity — 82 / w2 / impact 1.37% / deficiency 36.** *Justification:* Scorecards, exec summary, quick-scan, decision register accelerate buyer/operator decisions. *Class:* v1.

**23. Commercial Packaging Readiness — 83 / w2 / impact 1.38% / deficiency 34.** *Justification:* Two-layer Pilot/Operate packaging, pricing tiers, order form, `[RequiresCommercialTenantTier]` 402 filter. *Gap (B):* commerce un-hold. *Class:* v1 / (B).

**24. Policy & Governance Alignment — 84 / w2 / impact 1.40% / deficiency 32.** *Justification:* 23 bundled packs, pre-commit gate, approval SoD, governance dashboard. *Class:* v1.

**25. Reliability — 84 / w2 / impact 1.40% / deficiency 32.** *Justification:* Health checks, outbox, retries, idempotency posture register complete, Simmy chaos, failover/reliability drills, k6 soak, budget cutoffs. *Gap:* single-region intentional (V1). *Class:* v1.

**26. Explainability — 85 / w2 / impact 1.42% / deficiency 30.** *Justification:* Provenance graph, decision synopses, authority chain, finding/compare explanations. *Class:* v1.

**27. Cognitive Load — 75 / w1 / impact 0.63% / deficiency 25.** *Justification:* Very large operate surface still imposes mental effort, but Core Pilot nav now stays essential-tier on home/onboarding/reviews list/wizard without Show-more expansion. *Recommendations:* Operate-layer IA (Tier 3 hold). *Class:* v1.

**28. Auditability — 86 / w2 / impact 1.43% / deficiency 28.** *Justification:* 78 typed events, append-only, CSV export, tenant-isolated audit export tests. *Class:* v1.

**29. Customer Self-Sufficiency — 82 / w1 / deficiency 18.** In-app help, runbooks, quickstart, doctor; contextual help guards shipped. *Class:* v1.
**30. Documentation — 88 / w1 / impact 0.73% / deficiency 12.** Massive corpus; coverage-gate, faithfulness eval, first-run spine, and **GTM capture briefs** (`SCREENSHOT_GALLERY`, `DEMO_VIDEO_SCRIPT`, `DEMO_QUICKSTART`) reconciled to **`/reviews/new`**; owner evidence checklist cross-linked. *Gap:* `TECH_BACKLOG` TB items and archived assessments still cite legacy paths. *Class:* v1.
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
**47. Testability — 89 / w1 / deficiency 11.** 25 test projects, 95% merged-line + ratchet, mutation, schemathesis, contract snapshot, **mock golden-path + Core Pilot Playwright journeys green**. *Class:* v1.

---

## Top 12 Most Important Weaknesses (cross-cutting, mostâ†’least serious)

1. **AI substrate is competent but not frontier; real-mode quality still under-evidenced.** Phase A deterministic faithfulness is merge-blocking; LLM-graded faithfulness and owner-gated real-mode CI evidence remain the gap on Cutting-Edge AI, AI/Agent Readiness, and Correctness.
2. **Operator density / cognitive load.** A powerful but dense first-run path with many enablement toggles and legacy labels raises Adoption Friction, Usability, Time-to-Value, and Cognitive Load simultaneously.
3. **Golden-path fragility under contract drift (mitigated).** Fixtures and journey spec verified; keep mock E2E green on PRs to prevent regression.
4. **Cross-layer business-math divergence (mitigated).** Cross-tenant portfolio uses disposition-aware headline savings; per-scope labels documented.
5. **Scope-contract drift (resolved).** Coverage-gate docs reconciled with CI (95% + ratchet).
6. **Repo/solution hygiene (resolved).** Stray projects removed; `.ci-artifacts/` gitignored; API client drift guard confirmed.
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
1. **Golden-path reliability (verified)** — fixtures include `run` envelope; stale `.ci-artifacts` trace only; keep mock journey in CI.
2. **Operator onboarding density** — reduce toggle/label friction so implementation teams reach value fast.

**Acceptable for a controlled pilot (deferred / B):**
3. **CPA SOC 2 / external pen-test** (B) — required by some security reviewers for broad rollout; fine for scoped pilots with self-attestation + Trust Center.
4. **First-party ITSM/chat connectors** (V1.1) — acceptable via REST/CLI/SCIM/ADO/GitHub for pilots.
5. **Multi-region active/active** (V1.1) — single-region documented; answer tier-1 DR RFPs with V1.1 commitment + RTO/RPO targets.
6. **Production IaC depth / ACR push** (deferred §5) — organizational follow-ups; controlled deployments are supported.

---

## Top 6 Engineering Risks

1. **Real-mode agent quality blind spot** — real LLM path not merge-blocking-evidenced until owner enables `ARCHLUCID_CI_REAL_AOAI_ENABLED` and seeds evidence artifact.
2. **LLM-graded faithfulness not yet enforce** — Phase B nightly/release floors await baseline soak.
3. **Golden-path contract drift (watch)** — fixtures verified; mock E2E build cost keeps local verification heavy.
4. **Mid-strangle authority/coordinator duality (partially mitigated)** — ADR 0042 pins the HTTP write surface; data-layer strangler and Phase 3 soak remain.
5. **Safety-control enforcement entropy** — many guards (route-tenant, IDOR, SSRF, idempotency) exist; risk is uniform enforcement drifting as routes grow. CI drift guards mitigate but must stay green.
6. **Release-hygiene leakage (resolved)** — stray projects removed; client drift guard in CI; `.ci-artifacts/` gitignored.

---

## Most Important Truth

**ArchLucid is over-built in breadth and slightly under-proven in depth where it matters most.** The product can run a credible controlled pilot today. The headline is capped — and the sale is gated — not by missing features but by (a) **real-mode AI quality evidence still owner-ops-dependent** (deterministic faithfulness gate is now live), and (b) **operational density for live tenants** even though mock golden-path journeys are green. The fastest path to a higher score: enable real-mode evidence and complete Phase B LLM faithfulness enforce.

---

## Top Improvement Opportunities

I produced **14** improvements and **stopped before 25 deliberately** (per your cost-control rule): the remaining real items are either deferred scope (V1.1/V2, no `(A)` impact) or depend materially on the Tier 1 outcomes (golden-path/ROI-source decisions), so producing full prompts now would be speculative and likely re-cut after the first release-blocker pass. Those are listed as Tier 3 holds.

### Tier 1 — Release blockers / must-fix now

---

**T1-1. Verify and fix the operator golden-path review-detail render ("missing run object").** ✅ **COMPLETED (2026-06-06)** — `fixtureRunDetail()` includes `run` envelope; **`run-manifest-journey.spec.ts`** and **`core-pilot-path.spec.ts`** pass locally with `MOCK_E2E_SKIP_NEXT_BUILD=1`; stale `.ci-artifacts` trace predates fixture fix.
*Tier:* 1. *Why it matters:* This is the final, value-delivering step of the Pilot happy path; a broken render destroys Time-to-Value and Trustworthiness in demos. *Expected impact:* Directly improves Time-to-Value (+2â€“3 pts), Usability (+2â€“3 pts), Correctness (+1â€“2 pts). Weighted readiness impact: +0.2â€“0.4%. *Affected qualities:* Time-to-Value, Usability, Correctness, Trustworthiness. *Actionable:* Fully actionable now. *Why ranked here:* Cheap, high-trust-impact, on the golden path. *Evidence:* `.ci-artifacts/mock-smoke/e2e-run-manifest-journey-...chromium/error-context.md` renders the alert "Review detail response is missing a 'run' object"; guard in `archlucid-ui/src/lib/operator-response-guards.ts`.

> **Cursor prompt:**
> Reproduce and fix the operator review-detail golden-path failure. (1) Run the UI mock smoke locally: `cd archlucid-ui && npx playwright test --config playwright.mock.config.ts` and find the spec that drives the manifest/review-detail journey. (2) The review-detail page renders the error path in `src/lib/operator-response-guards.ts` ("Review detail response is missing a 'run' object") because the mock fixture / proxy response shape no longer matches the buyer/operator review-detail DTO (recent `BuyerRunDetailSummaryDto` boundary work). Identify the canonical response contract the page expects (the `run` object) and reconcile the mock fixture(s) and any `/api/proxy` mapping so the success path renders. (3) Add or update a Vitest/Playwright assertion that the review-detail success state renders a manifest summary (not the error alert). **Acceptance:** mock smoke for the review/manifest journey passes; review-detail success path asserted; no change to the API contract unless the contract itself is wrong (if so, update the OpenAPI snapshot and note it). **Constraints:** do not weaken `operator-response-guards.ts` to mask the error; fix the data shape. **Do not change:** unrelated routes, auth, or the buyer-contract OpenAPI snapshot without explicit justification. **Verify:** `npm run test` and the mock Playwright journey are green; delete the stale `.ci-artifacts/mock-smoke/*` trace artifacts afterward. **Impact:** Time-to-Value +2â€“3, Usability +2â€“3, Correctness +1â€“2; weighted +0.2â€“0.4%.

---

**T1-2. Regenerate the API client and add/confirm a CI drift guard.** ✅ **VERIFIED (2026-06-06)** — `assert_api_client_in_sync.sh` in `ci.yml` (~L1089); working tree clean on generated client.
*Tier:* 1. *Why it matters:* `ArchLucid.Api.Client/Generated/ArchLucidApiClient.g.cs` is modified in the working tree — generated artifacts drifting from source erode build reproducibility and downstream consumer trust. *Expected impact:* Maintainability (+2â€“3), Correctness (+1), Deployability (+1). Weighted: +0.05â€“0.1%. *Affected:* Maintainability, Correctness, Reliability. *Actionable:* Fully actionable now. *Evidence:* git status shows `M ArchLucid.Api.Client/Generated/ArchLucidApiClient.g.cs`.

> **Cursor prompt:**
> Make the generated API client deterministic and drift-guarded. (1) Locate the client generation script/target (search for the NSwag/OpenAPI generation invocation that emits `ArchLucid.Api.Client/Generated/ArchLucidApiClient.g.cs`). (2) Regenerate from the current committed OpenAPI snapshot and commit the result so the working tree is clean. (3) Confirm CI fails on drift: ensure a job regenerates the client and runs `git diff --exit-code` on the generated path (add it to `.github/workflows/ci.yml` near the OpenAPI snapshot job if absent). **Acceptance:** clean `git diff` on the generated client after regeneration; a CI step fails if the generated client is stale. **Constraints:** do not hand-edit generated files. **Do not change:** the public API surface. **Verify:** run the generation locally, `git status` clean; CI drift job green. **Impact:** Maintainability +2â€“3; weighted +0.05â€“0.1%.

---

**T1-3. Remove stray solution/work-tree projects and CI artifact noise.** ✅ **COMPLETED (2026-06-06)**
*Tier:* 1. *Why it matters:* `temp_sqlerror/temp_sqlerror.csproj`, `tools/ApplicationThrowIfNullCodemod`, and committed/untracked `.ci-artifacts/` reduce architectural integrity and signal weak release hygiene. *Expected impact:* Architectural Integrity (+2â€“3), Maintainability (+2). Weighted: +0.07â€“0.1%. *Affected:* Architectural Integrity, Maintainability, Cognitive Load. *Actionable:* Fully actionable now (confirm each is truly disposable first). *Evidence:* `*.csproj` glob lists these; git status lists `.ci-artifacts/mock-smoke/...`.
> **Status (2026-06-06):** `temp_sqlerror/` and `tools/ApplicationThrowIfNullCodemod/` **deleted** (owner-confirmed disposable; neither in `ArchLucid.sln` nor referenced by any `ProjectReference`). `scripts/RemoveEmbeddedStatementBraces` **kept** — it is an active, documented formatting tool, not a one-shot. **Done:** `.ci-artifacts/` added to `.gitignore`.

> **Cursor prompt:**
> Clean up release hygiene. (1) Confirm `temp_sqlerror/` is a throwaway repro project (no references from the solution or other projects); if so, remove it from the `.sln` and delete the folder. (2) Evaluate `scripts/RemoveEmbeddedStatementBraces` and `tools/ApplicationThrowIfNullCodemod`: if they are one-shot codemods already applied, move them out of the main solution build (keep under `tools/` excluded from the solution, or delete if obsolete) and document in a short README. (3) Add `.ci-artifacts/` to `.gitignore` (if not present) and delete the stray `.ci-artifacts/mock-smoke/*` traces. **Acceptance:** solution builds without the removed projects; `.ci-artifacts/` ignored; no dangling `.sln` references. **Constraints:** do not delete anything still referenced — search for references first. **Do not change:** production projects. **Verify:** `dotnet build` of the solution succeeds; `git status` clean of `.ci-artifacts`. **Impact:** Architectural Integrity +2â€“3, Maintainability +2; weighted +0.07â€“0.1%.

---

**T1-4. Reconcile scope-doc drift on the coverage gate (and audit for other CI/doc mismatches).** ✅ **COMPLETED (2026-06-06)**
*Tier:* 1. *Why it matters:* `V1_DEFERRED.md` §4 still calls the 95% merged-line coverage + ratchet a V1.1 task, but `ci.yml` already enforces it. The scope contract must match reality or assessments and buyers lose trust in it. *Expected impact:* Documentation (+2), Maintainability (+2), Trustworthiness (+1). Weighted: +0.05â€“0.1%. *Affected:* Documentation, Maintainability, Trustworthiness. *Actionable:* Fully actionable now. *Evidence:* `ci.yml` ~L2170 (`assert_merged_line_coverage_min.py ... 95`, "full ratchet enabled") vs `V1_DEFERRED.md` §4 "raise merged line to 95%, re-enable the ratchet (V1.1)".

> **Cursor prompt:**
> Reconcile coverage-gate documentation with the actual CI configuration. (1) Confirm in `.github/workflows/ci.yml` the enforced merged-line minimum (currently 95) and whether `assert_coverage_floor_ratchet.py` / `.coverage-floor` are invoked. (2) Update `docs/library/V1_DEFERRED.md` §4 and any sibling docs (`docs/engineering/BUILD.md`, `docs/library/coverage-exclusions.md`, `docs/library/COVERAGE_GAP_ANALYSIS.md`) to state the *current* gate (95% + ratchet enabled), removing the stale "raise to 95% in V1.1" wording. (3) Grep the docs corpus for other "V1.1 will raise/enable" coverage claims and fix mismatches. **Acceptance:** no doc claims the coverage gate is still 75%/deferred when CI enforces 95%; statements cite the actual `ci.yml` values. **Constraints:** do not change CI thresholds — only the docs to match CI. **Do not change:** the gate itself. **Verify:** `rg -n "75%|ratchet|merged line" docs/` shows only accurate statements. **Impact:** Documentation +2, Maintainability +2, Trustworthiness +1; weighted +0.05â€“0.1%.

---

### Tier 2 — High-leverage next wave

---

**T2-5. Add an AI faithfulness / grounding evaluation seam (TB-021) and surface it in CI (deterministic enforce now; LLM enforce after baseline).** ✅ **COMPLETED Phase A (2026-06-06)** — negative-control fixtures tuned (mean 0.06 ≤ 0.35); split-cohort enforce semantics; PR CI runs `eval_agent_faithfulness.py --enforce`. Phase B LLM-graded enforce remains nightly/release after baseline soak.
*Tier:* 2. *Why it matters:* This is the single highest-leverage in-scope AI move — it directly raises the three highest-weight engineering qualities and is the foundation of Trustworthiness for AI outputs. *Expected impact:* Cutting-Edge AI (+4â€“6), AI/Agent Readiness (+3â€“4), Correctness (+1â€“2), Trustworthiness (+1). Weighted: +0.5â€“0.8%. *Affected:* Cutting-Edge AI, AI/Agent Readiness, Correctness, Trustworthiness. *Actionable:* Partially actionable now (the eval harness + metric in simulator/offline mode); real-mode LLM enforce path unblocked per T2-6 owner decision (2026-06-06). *Why ranked here:* Highest weighted upside of any in-scope item, but larger than a Tier 1 hygiene fix. *Evidence:* `V1_DEFERRED.md` §6q (TB-021, faithfulness eval listed as in-scope quality work); `agent-eval-datasets-nightly.yml`, `real-llm-golden-cohort.yml` exist as the integration points.

> **Cursor prompt:**
> Implement a citation-faithfulness / grounding evaluation for agent outputs (TB-021), runnable in simulator/offline mode. (1) Find the agent eval harness used by `.github/workflows/agent-eval-datasets-nightly.yml` and the golden cohort. (2) Add a faithfulness metric: for findings/recommendations that cite evidence, score whether the cited source supports the claim (start with a deterministic check that every claim-with-citation references an existing, in-context evidence id; optionally add an LLM-graded faithfulness score gated behind simulator/offline fixtures so it runs without live AOAI). (3) Emit the metric to the eval report and the job summary. **Owner decision (2026-06-06):** deterministic faithfulness (`eval_agent_faithfulness.py --enforce`) is merge-blocking on PR CI at **positive â‰¥ 0.80 / negative â‰¤ 0.35**; LLM-graded faithfulness becomes merge-blocking on nightly/release at **p50 â‰¥ 0.65 (ratchet â†’ 0.70)**, per-scenario regression guard (â‰¤ 0.05 below committed baseline, hard floor **0.50**), adversarial ceiling **0.40** — after real-mode baseline soak (see Owner Decision Addendum). (4) Document the metric in the RAG/agent eval docs. **Acceptance:** the eval run outputs a faithfulness score on the existing offline corpus; PR CI enforces deterministic `--enforce` floors; no live AOAI dependency for the deterministic path. **Constraints:** must run in CI without real AOAI creds (use simulator/offline fixtures); LLM merge-blocking is Phase B only (nightly/release after T2-6 baselines). **Do not change:** the orchestration contracts or prompt baselines. **Verify:** nightly eval workflow (or its local equivalent) prints the faithfulness metric; unit tests cover the deterministic citation check. **Impact:** Cutting-Edge AI +4â€“6, AI/Agent Readiness +3â€“4, Correctness +1â€“2; weighted +0.5â€“0.8%.

---

**T2-6. Real-mode quad-agent end-to-end quality evidence in CI.** ✅ **COMPLETED (code/CI, 2026-06-06)** — budget probe in `ci.yml` live AOAI job. *(Owner inputs RESOLVED 2026-06-06 — implementation unblocked.)*
*Tier:* 2. *Why it matters:* Real-mode output quality is the largest confidence gap behind AI/Agent Readiness and Correctness. *Status:* Owner confirmed endpoint/key secrets are in place; monthly cap **$15** with CI **warn-on-skip** (not fail) when budget kill-switch trips; acceptance bar defined below. *Remaining owner action:* follow **[`OWNER_REAL_MODE_EVIDENCE_CHECKLIST.md`](../runbooks/OWNER_REAL_MODE_EVIDENCE_CHECKLIST.md)** (set **`ARCHLUCID_CI_REAL_AOAI_ENABLED=true`**, run **`Invoke-RealLlmEvidenceGate.ps1`**, seed `real-llm-evidence-gate.json`). *Partial work already separated:* deterministic faithfulness seam (**T2-5**).

---

**T2-7. Unify ROI/KPI calculation onto a single source of truth.** ✅ **COMPLETED (2026-06-06)** — cross-tenant basis-aligned; invariant tests. *(Semantics RESOLVED 2026-06-06 — scoped to one concrete fix.)*
> **Owner decision (2026-06-06):** ROI is **not** one monolithic algorithm across all surfaces, and should not be forced to be. The authoritative model is **layered** (see `V1_SCOPE.md` §2.8, updated): (1) single-source **selection+dedup** (`CollectLatestCommittedRunPerSystemAsync` + `ExecutiveRoiFindingDeduplicator`); (2) single-source **per-finding savings** (`TenantAdjustedFindingsSavingsCalculator`); (3) authoritative **portfolio headline = disposition-aware basis** (`DispositionAwareRoiBasisCalculator`, open+needs-evidence) — the **board pack already delegates to it**. The **value report (30-day window)** and **per-run ROI** are intentionally distinct, labeled scopes and are **not** forced to match the portfolio headline. **Scoped consolidation target:** the cross-tenant portfolio (`GetCrossTenantPortfolioSummaryAsync`) uses a raw per-system sum instead of the disposition-aware basis — align it (or label it `TotalPotentialUsd`) and add a cross-surface consistency test. Per-system rows are pre-disposition components and will not sum to the headline by design (document in UI).
*Tier:* 2. *Why it matters:* Buyer-facing numbers that differ between the per-run ROI, executive summary, value report, and cached/UI views directly undermine Proof-of-ROI and Correctness. *Expected impact:* Data Consistency (+3â€“4), Correctness (+1â€“2), Proof-of-ROI (+2), Executive Value Visibility (+1). Weighted: +0.2â€“0.35%. *Affected:* Data Consistency, Correctness, Proof-of-ROI, Executive Value Visibility. *Actionable:* Partially actionable now (audit + consolidation of clearly-duplicated math); some UI surfaces may depend on T1-1 outcome. *Evidence:* `ExecutiveRoiSummaryService` (`ArchLucid.Application/Roi/`), per-run `GET /v1/architecture/run/{runId}/roi`, value report controllers, and UI ROI sections (`value-report`, `executive/dashboard`) compute/format value independently per `V1_SCOPE.md` §2.8.

> **Cursor prompt (scoped to the resolved layered model — do NOT re-flatten everything to a naive sum):**
> The authoritative ROI model is layered and already mostly single-source (see `V1_SCOPE.md` §2.8): selection+dedup via `ExecutiveRoiSummaryService.CollectLatestCommittedRunPerSystemAsync` + `ExecutiveRoiFindingDeduplicator`; per-finding math via `TenantAdjustedFindingsSavingsCalculator`; portfolio headline via `DispositionAwareRoiBasisCalculator` (open+needs-evidence). Do the following and nothing more: (1) Fix the one real divergence — `ExecutiveRoiSummaryService.GetCrossTenantPortfolioSummaryAsync` currently raw-sums per-system savings; either route it through the disposition-aware basis or rename its field to `TotalPotentialUsd` and label it as pre-disposition in the response contract + UI. (2) Add a cross-surface consistency test: for a fixed multi-run/multi-disposition fixture, assert single-tenant `TotalEstimatedUsdSavings`, the board-pack markdown total, and the basis breakdown agree, and that the cross-tenant total uses the same chosen semantics. (3) Add an explicit UI/doc note that per-system `EstimatedUsdSavings` rows are pre-disposition components and intentionally do **not** sum to the headline; the 30-day value report and per-run ROI are distinct labeled scopes. Do **not** change `TenantAdjustedFindingsSavingsCalculator`, the dedup rule, the disposition-aware basis math, or force the value report onto the portfolio algorithm. **Acceptance:** cross-tenant total is basis-aligned or explicitly relabeled; consistency test passes; UI/contract note added. **Constraints:** preserve the documented aggregation semantics (dedup, latest-per-system); do not change citation contracts. **Do not change:** the extractor cost-citation doctrine. **Verify:** new cross-surface consistency tests green; manual check that exec dashboard and value report show identical totals for one run set. **Impact:** Data Consistency +3â€“4, Correctness +1â€“2, Proof-of-ROI +2; weighted +0.2â€“0.35%.

---

**T2-8. Reconcile legacy "Runs" labels to the "Reviews" domain language across the operator UI.** ✅ **COMPLETED (2026-06-06)** — executive ROI, tenant health, roles, LLM budget banner, integration-events DLQ column, docs-search index updated; no user-visible domain-noun "Runs" in `archlucid-ui/src`; remaining "Run" strings are verb/action copy (extractor, simulation, search).
*Tier:* 2. *Why it matters:* Mixed terminology raises cognitive load and makes the product feel unfinished to operators and buyers. *Expected impact:* Usability (+2â€“3), Cognitive Load (+3â€“4), Adoption Friction (+1). Weighted: +0.1â€“0.15%. *Affected:* Usability, Cognitive Load, Adoption Friction. *Actionable:* Fully actionable now (mechanical, Composer-safe). *Evidence:* `V1_SCOPE.md` notes "legacy labels may still say *Runs*"; UI route group still includes legacy labels (`reviews` routes vs "Run replay"/"Runs" copy).

> **Cursor prompt:**
> Reconcile user-facing terminology in the operator UI from legacy "Run/Runs" to the canonical "Review/Reviews" where the domain term is Reviews (keep `runId` as the technical identifier and keep API routes unchanged). (1) Grep `archlucid-ui/src` for user-visible strings containing "Run"/"Runs"/"Run replay" and classify each as user-facing copy vs technical identifier. (2) Update user-facing copy/labels/aria-labels/headings to "Review(s)" consistent with `V1_SCOPE.md`; leave variable names, route params (`[runId]`), and API paths untouched. (3) Update any snapshot/Vitest tests that assert the old copy. **Acceptance:** no user-visible "Run" label remains where the domain term is Review; tests updated; build green. **Constraints:** do not rename API routes, `runId` params, or DTO fields. **Do not change:** backend contracts. **Verify:** `npm run test` and typecheck/lint green; spot-check reviews list/detail, replay, compare pages. **Impact:** Usability +2â€“3, Cognitive Load +3â€“4; weighted +0.1â€“0.15%.

---

**T2-9. Audit in-app help for leaked raw repo/engineering references.** ✅ **COMPLETED (2026-06-06)** — contextual help copy cleaned; contributor-reference link removed; vitest guards for engineering paths in visible text (15/15 passing).
*Tier:* 2. *Why it matters:* `PRODUCT_DOCUMENTATION_PRESENTATION.md` mandates product-native help for users and GitHub for engineering source only; leaks make the product feel internal and raise self-sufficiency friction. *Expected impact:* Usability (+1â€“2), Customer Self-Sufficiency (+2), Documentation (+1). Weighted: +0.05â€“0.1%. *Affected:* Usability, Customer Self-Sufficiency, Documentation. *Actionable:* Fully actionable now. *Evidence:* operator `help` routes exist (`(operator)/help`, `/help/[topic]`); prior snapshots note raw repo references leaking into help surfaces.

> **Cursor prompt:**
> Ensure in-app help contains no raw repository/engineering references. (1) Search the operator help content sources (the `(operator)/help` and `/help/[topic]` page data, plus any help JSON/MDX) for links/paths pointing at GitHub source files, `docs/â€¦` engineering paths, or `*.cs`/`*.csproj` references. (2) Replace user-facing help with product-native guidance; move any genuinely engineering content out of the user help surface per `PRODUCT_DOCUMENTATION_PRESENTATION.md`. (3) Add a lightweight test/lint that fails if help content references forbidden engineering paths. **Acceptance:** no raw repo/source references in user help; guard test added. **Constraints:** keep help accurate to current features. **Do not change:** engineering docs under `docs/`. **Verify:** the new guard passes; manual review of help pages. **Impact:** Usability +1â€“2, Customer Self-Sufficiency +2; weighted +0.05â€“0.1%.

---

**T2-10. Tighten the first-run golden path: reduce toggle density and verify end-to-end.** ✅ **COMPLETED (2026-06-06)** — mock journeys green; **`effectiveNavDisclosureForPathname`** essential-only on Core Pilot surfaces (`/`, `/onboarding`, `/reviews`, `/reviews/new`); operate-layer IA deferred to Tier 3.
*Tier:* 2. *Why it matters:* Adoption Friction and Time-to-Value are high-weight; the dense enablement model ("Show more links", extended/advanced) delays first value. *Expected impact:* Adoption Friction (+2â€“3), Time-to-Value (+1â€“2), Cognitive Load (+1). Weighted: +0.15â€“0.25%. *Affected:* Adoption Friction, Time-to-Value, Cognitive Load. *Actionable:* Partially actionable now (the guided first-run flow + checklist verification); deeper IA changes are product direction (Tier 3). *Evidence:* `V1_SCOPE.md` §4 happy path + Core Pilot checklist; operator sidebar progressive-disclosure model.

> **Cursor prompt:**
> Make the Pilot golden path the path of least resistance on first run. (1) Review the operator Home Core Pilot checklist and the sidebar disclosure model; ensure the four-step Pilot path (create review â†’ execute â†’ commit â†’ review manifest/artifacts) is reachable without enabling "Show more"/extended links. (2) For a brand-new tenant with the demo seed, walk the path and remove or defer any toggle that is not required for the four steps; surface the next action inline. (3) Add/strengthen a Playwright mock journey that completes the four-step Pilot path with default (non-expanded) navigation. **Acceptance:** the four Pilot steps are completable with default navigation; a mock journey proves it. **Constraints:** do not remove Operate-layer features — only ensure they are not in the Pilot critical path. **Do not change:** API contracts. **Verify:** the new/updated mock journey is green; manual first-run walkthrough. **Impact:** Adoption Friction +2â€“3, Time-to-Value +1â€“2; weighted +0.15â€“0.25%.

---

### Tier 3 — Hold for reassessment (no prompts unless clearly independent)

**T3-11. Coordinator/authority strangler convergence (ADR 0021 / ADR 0042).** ✅ **PARTIAL (2026-06-06)** — ADR 0042 collapses the HTTP dual-write surface: canonical `v1/architecture/*`, deprecated alias headers, shared-action idempotency contract, architecture-test guard. ADR 0021 Phase 3 gate (iv) customer-traffic soak and alias route sunset remain open. *No further prompt until soak direction confirmed.*

**T3-12. Graph-RAG / agentic retrieval (RAG-V2-001/002).** Genuinely raises Cutting-Edge AI, but explicitly **V2** (`V1_DEFERRED.md` §6q) and should follow the faithfulness seam (T2-5) so quality is measurable first. No `(A)` penalty for absence. *No prompt.*

**T3-13. First-party ITSM/Teams/Slack/Confluence connectors.** **V1.1** scope (`V1_SCOPE.md` §2.13â€“§2.15); raises Workflow Embeddedness/Interoperability but is deferred and sequenced (ServiceNow â†’ Confluence â†’ Jira). No `(A)` penalty. *No prompt.*

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

- **T1-3 (cleanup) — RESOLVED (2026-06-06):** Owner confirmed removal. **Done:** deleted `temp_sqlerror/` (throwaway `SqlError` reflection repro) and `tools/ApplicationThrowIfNullCodemod/` (one-shot primary-constructor validation codemod, already applied; only referenced in the inactive `.cursor.bak/` backup). **KEPT (premise corrected):** `scripts/RemoveEmbeddedStatementBraces` is **not** an already-applied one-shot — it is an actively documented, re-runnable house-style formatting tool (`docs/library/FORMATTING.md`, `docs/library/CSHARP_HOUSE_STYLE.md`, `docs/library/TERSENESS_REWRITER_ASSEMBLY_CHECKLIST.md`); deleting it would break a documented contributor workflow. None of the three were in `ArchLucid.sln`, so no solution edit was needed. **Optional follow-up:** `tools/RemoveEmbeddedStatementBraces/` is orphaned, untracked, already-gitignored `bin/obj` build output (safe to delete locally; no repo impact).
- **T3-11 (strangler):** What is the next intended ADR step for coordinator/authority convergence? Determines whether/when to produce an implementation prompt.

---

## Owner Decision Addendum (2026-06-06) — Faithfulness CI gating

**Decision (owner, 2026-06-06):** The LLM-graded faithfulness score **will eventually become merge-blocking** in CI/release evidence. This resolves pending question **T2-5 / Improvement 6**.

### Recommended baseline thresholds (aligned to existing repo floors)

| Layer | Metric | Merge-blocking floor | Where enforced | Rationale |
| --- | --- | --- | --- | --- |
| **Phase A — PR-safe (now)** | Deterministic citation faithfulness (`eval_agent_faithfulness.py`) | **Positive readiness mean â‰¥ 0.80**; **negative-control mean â‰¤ 0.35**; detector cases must flag | PR `ci.yml` via `--enforce` | Already committed in `tests/eval-datasets/faithfulness-golden/cases.json`; no live AOAI; mirrors sponsor-packet checks in `AGENT_OUTPUT_EVALUATION.md` |
| **Phase B — LLM-graded (after real-mode baselines)** | `LlmFaithfulnessScore` on golden-cohort **positive-readiness** scenarios | **Cohort p50 â‰¥ 0.65** at enforce, ratchet to **0.70** after two clean release cycles; per-scenario **no more than 0.05 below its committed baseline** AND absolute hard floor **0.50** | Nightly `real-llm-golden-cohort.yml` + release evidence scripts (`--enforce`) | Baseline-relative + ratchet (mirrors coverage ratchet / golden-cohort warn-soak); hard floor aligns to ops alert (p50 &lt; 0.5 in `OBSERVABILITY.md`); avoids guessing an absolute on a never-measured metric |
| **Phase B — adversarial** | `LlmFaithfulnessScore` on hallucination/adversarial fixtures | **â‰¤ 0.40** per scenario (must detect fabrication) | Same nightly/release path | Ensures merge-blocking catches regressions on the highest-risk correctness dimension |

### Promotion policy (warn â†’ enforce)

1. **Phase A:** Wire `python scripts/ci/eval_agent_faithfulness.py --enforce` into PR CI immediately (deterministic only).
2. **Phase B soak:** Run LLM faithfulness on real-mode golden cohort in **warn-only** mode until **â‰¥ 5 consecutive green nightly runs** capture baselines under `tests/golden-cohort/baselines/` (T2-6 credentials/budget resolved 2026-06-06).
3. **Phase B enforce:** Flip nightly + release-branch checks to merge-blocking at **p50 â‰¥ 0.65** (per-scenario: â‰¤ 0.05 below committed baseline, hard floor 0.50; adversarial â‰¤ 0.40); ratchet p50 **0.65 â†’ 0.70** after two release cycles with zero false rejects, and only then consider **0.75**.

### Implementation notes for T2-5 prompt

- PR CI stays **deterministic** (`SkipWhenSimulator: true` on `AgentOutputLlmFaithfulnessOptions` prevents LLM judge in simulator).
- LLM merge-blocking belongs on **nightly real-mode** and **release evidence**, not every PR (cost + flake control).
- Store committed baseline snapshots per scenario; fail on regression below floor, not on judge noise within Â±0.03.

**Sub-decision resolved (owner-delegated, 2026-06-06):** Adopt the **ramped, baseline-relative** floors rather than a hard 0.70 from day one — there is **no empirical LLM-faithfulness baseline** in the repo yet (`SkipWhenSimulator: true`; committed `faithfulnessSupportRatio` baselines are deterministic/simulator `0.0`), so an absolute hard floor would be a guess. Committed Phase B: **aggregate p50 â‰¥ 0.65 at enforce â†’ ratchet to 0.70**; **per-scenario regression guard (â‰¤ 0.05 below committed baseline) + absolute hard floor 0.50**; **adversarial â‰¤ 0.40**. Phase A deterministic floors (0.80 / 0.35) are unchanged and enforced now.

---

## Owner Decision Addendum (2026-06-06) — Real-mode CI evidence (T2-6)

**Decision (owner, 2026-06-06):** Enable real-mode CI evidence path. Endpoint/key secrets are **in repository secrets now**. Monthly spend ceiling **&lt; $15** (`tests/golden-cohort/budget.config.json` updated from $50 â†’ **$15**). When budget restrictions force a skip, CI must **warn** (not fail the workflow) — golden-cohort nightly already skips on kill-switch exit **2** without failing; **`::warning::`** annotations added for budget skip paths.

### Budget posture

| Control | Value | Behavior |
| --- | --- | --- |
| **Monthly cap** | **$15 USD** | `monthlyTokenBudgetUsd` in `budget.config.json` |
| **Warn band** | **80%** ($12 MTD) | Cohort still runs; GitHub issue opened |
| **Kill / skip band** | **95%** ($14.25 MTD) | Real-LLM steps skipped for rest of month; **`::warning::`** in CI; workflow stays green |
| **Per-run guard** | `driftRunMaxTotalPromptCompletionTokens: 180000` | Implicit per-run token ceiling (~$1â€“2 at gpt-4o rates) |

### Acceptance bar — "real-mode release-evidenced"

A release may claim **full quad-agent real-mode evidence** only when **all** of the following hold (synthesized from `RELEASE_CLAIM_GATE.md`, `GOLDEN_COHORT_REAL_LLM_GATE.md` §10, and the faithfulness addendum):

1. **Evidence artifact:** `artifacts/release/real-llm-evidence-gate.json` exists with schema **`archlucid.real-llm-evidence-gate.v2`**, **`generatedUtc` â‰¤ 30 days old**, **`overallOutcome: PASS`**, **`executionMode: real`**, and all four agent paths present and passing: **Topology (1), Cost (2), Compliance (3), Critic (4)**.
2. **CI live regression (optional post-merge):** `dotnet-azure-openai-live-post-regression` job green when **`ARCHLUCID_CI_REAL_AOAI_ENABLED=true`** (push/workflow_dispatch only; fork PRs skip) **and** shared golden-cohort budget probe exit **0 or 1** ($15/mo cap). Runs `RealAzureOpenAIEndToEndTests` — live pipeline topology/compliance/cost merge produces non-empty manifest. Probe exit **2/3** skips live invoke with **`::warning::`** (workflow stays green; evidence not refreshed).
3. **Golden cohort quality bar (canonical `gpt-4o` cohort):** structural validation **100%**; quality-gate **`rejected` rate 0%** on canonical scenarios; semantic score **p10 â‰¥ 0.50**, **p50 â‰¥ 0.70**; explainability trace completeness mean **â‰¥ 0.80**; adversarial scenarios **qualitative pass** for first two baseline runs, then numeric floors once distributions stabilize.
4. **Faithfulness (after Phase B soak):** LLM faithfulness floors per faithfulness addendum (p50 â‰¥ 0.65 â†’ ratchet 0.70).
5. **Budget skip is not evidence failure:** if kill-switch skips a run, release claim reverts to **WARN/partial/simulator-only** until the next successful run under budget — skipped runs do not block unrelated merges.

### Owner next steps (operational, not code)

1. Set repo variable **`ARCHLUCID_CI_REAL_AOAI_ENABLED=true`** (secrets already present per owner).
2. Run **`.\scripts\Invoke-RealLlmEvidenceGate.ps1`** locally or via workflow_dispatch; commit or attach the resulting gate JSON for release candidates.
3. Optionally enable **`ARCHLUCID_GOLDEN_COHORT_REAL_LLM=true`** + **`cohort-real-llm-gate`** required check once one green nightly run confirms budget probe + structural gate under the $15 cap.
