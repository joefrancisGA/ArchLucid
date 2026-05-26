> **Scope:** Canonical engineering assessment for internal leads and reviewers tracking V1 GA readiness; not a public-facing status report or compliance attestation.

# ArchLucid Assessment – (A) Headline Readiness: 83.40%

*Note: This score represents the `(A)` headline readiness per `Assessment-Scope-V1_1.mdc`, excluding explicitly deferred items (such as V1.1/V2 scope). Rescored 2026-05-26 after Batch F (TB-014 LLM prepaid wallet) shipped on `master`.*

## Executive Summary

### (A) Overall Headline Readiness
The core architecture pipeline (Topology, Cost, Compliance, Critic) is solid, and the AI leverage program (Batches A–F) is now largely **on `master`**: streaming Ask, multi-model tier routing, adversarial Critic, calibrated confidence, operator workflow assistants, narrative/artifact generators, agent-curated evidence proposals, LLM-assisted Azure extractor enrichment, templates-pack nightly drift sentinel, golden-cohort real-LLM gate + real-mode eval corpus wiring, RAG policy-pack grounding with citation traces, context ingestion delta/enricher refactor, per-agent LLM token dimensions, signup marketing attribution, consent-gated marketing analytics kill-switch, and **self-serve LLM prepaid wallet (TB-014)**. Headline readiness is **83.40%** — a strong engineering and operator-AI foundation with remaining gaps in economy-tier tuning and Stripe Elements UX polish.

### (B) Procurement/Market-Motion Realism
Enterprise buyers will encounter friction due to the absence of a CPA-issued SOC 2 report and third-party penetration testing (both correctly deferred to post-V1.1/V2). While the self-assessment and Trust Center provide a good stopgap, RFP processes will require manual navigation. The lack of multi-region active/active guarantees and automated tenant erasure pipelines will also trigger scrutiny from tier-1 enterprise procurement teams.

### Commercial Picture
Executive summary one-pagers, compare-run narratives, and findings prioritization now ship. Signup marketing attribution (TB-019) wires first-touch cookie → signup header → SQL + low-cardinality counters. Self-serve LLM wallet (TB-014) enables expansion revenue on Stripe TEST without operator SQL bumps.

### Enterprise Picture
The blank-page tax is largely addressed (request draft, policy-pack draft, governance explainers, finding ask). Extractor enrichment is config-gated (`AgentRuntime:AzureExtractorEnrichment:Enabled`). RAG policy-pack corpus indexing and compliance `groundingMissing` honesty now ship (RAG-V1-000/001).

### Engineering Picture
Agent confidence calibration, tiered model routing, OTel agent-output alerts (TB-004), RAG grounding traces, templates-pack drift JSON + nightly annotations, real-mode eval corpus in `golden-cohort-nightly.yml`, meaningful connector deltas, composite canonical enrichers, shared policy/topology overlap resolver, per-agent/per-invoke-kind LLM token histograms, and TB-014 wallet persistence/Stripe gateway are in place. Remaining engineering focus: doc audience Phase 3 and economy-tier defaults. (Jira, ServiceNow, Confluence, Slack sandboxes deferred to V1.1.)

---

## Weighted Quality Assessment

### 1. Cutting-Edge AI Technology
- **Score:** 80
- **Weight:** 8
- **Weighted deficiency signal:** 160
- **Justification:** Streaming Ask (SSE), multi-model tier routing, agent-curated evidence proposals, and templates-pack nightly drift sentinel ship. Remaining gap: Economy-tier defaults not yet tuned per tenant.

### 2. AI/Agent Readiness
- **Score:** 88
- **Weight:** 8
- **Weighted deficiency signal:** 96
- **Justification:** Adversarial Critic, calibrated confidence, evidence proposals, RAG grounding traces, policy-pack corpus retrieval with `groundingMissing` honesty, and real-mode eval corpus in golden-cohort nightly ship.
- **Improvement recommendations:** Expand real-mode exemplar capture cadence as live cohort runs accumulate.

### 3. Adoption Friction
- **Score:** 82
- **Weight:** 6
- **Weighted deficiency signal:** 108
- **Justification:** Request draft, policy-pack draft, governance-block explainer, finding ask, config-gated extractor enrichment, and marketing analytics consent + operator kill-switch address blank-page and privacy friction.
- **Improvement recommendations:** Surface `inferred.*` flags in archlucid-ui request review.

### 4. Time-to-Value
- **Score:** 83
- **Weight:** 7
- **Weighted deficiency signal:** 119
- **Justification:** IaC stub generator, findings reranker, and request draft shorten path to actionable output.
- **Improvement recommendations:** Enable `AgentRuntime:GenerateIacStubs` by default for paid tiers after cost review.

### 5. Proof-of-ROI Readiness
- **Score:** 84
- **Weight:** 5
- **Weighted deficiency signal:** 80
- **Justification:** Compare-two-runs narrative, executive ROI summary, and signup marketing attribution (TB-019) ship for acquisition ROI proof.
- **Improvement recommendations:** None blocking V1 pilot motion.

### 6. Executive Value Visibility
- **Score:** 80
- **Weight:** 4
- **Weighted deficiency signal:** 80
- **Justification:** Run summary one-pager export ships via `RunSummaryOnePagerExportService`.
- **Improvement recommendations:** None blocking V1 pilot motion.

### 7. Maintainability
- **Score:** 87
- **Weight:** 4
- **Weighted deficiency signal:** 52
- **Justification:** TB-008 Phases 3–4 (set-diff deltas, composite enrichers, shared policy/topology resolver) and TB-013 Phase 2 customer-facing doc split ship.
- **Improvement recommendations:** TB-013 Phase 3 guarded moves for contributor-only contracts.

### 8. Reliability
- **Score:** 84
- **Weight:** 2
- **Weighted deficiency signal:** 32
- **Justification:** OTel agent-output alerts, calibrated confidence, templates-pack drift JSON + nightly warnings, `cohort-real-llm-gate` branch-protection docs, and real-mode eval corpus job ship.
- **Improvement recommendations:** Promote `cohort-real-llm-gate` to required in GitHub UI once one green run exists on default branch.

### 9. Supportability
- **Score:** 88
- **Weight:** 1
- **Weighted deficiency signal:** 12
- **Justification:** CLI doctor, support bundles, correlation IDs, runbooks, and TB-015 Phase A per-agent/per-invoke-kind LLM token histograms.
- **Improvement recommendations:** None blocking V1 pilot motion.

---

## Top 6 Most Important Weaknesses
1. Economy-tier model defaults not tuned — run cost may exceed tier allowance at scale.
2. Inferred extractor fields not yet surfaced in archlucid-ui (backend enrichment ships config-gated).
3. TB-013 Phase 3 — contributor-only contract docs still mixed at `library/` root.
4. Stripe Elements card collection not yet in wallet UI (TEST uses manual customer/payment-method ids).
5. Branch protection for `cohort-real-llm-gate` requires one-time GitHub UI step (documented, not yet enforced org-wide).
6. SOC 2 / pen-test artifacts deferred (correct for V1 scope).

---

## Top 3 Monetization Blockers
1. Economy-tier model defaults not tuned — run cost may exceed tier allowance at scale.
2. Sales-led checkout remains default for Team tier unless `NEXT_PUBLIC_STRIPE_TEAM_CHECKOUT_ENABLED` is set.
3. Stripe live-key commerce flip still gated per V1_DEFERRED §6b (TEST wallet path ships).

---

## Top 3 Enterprise Adoption Blockers
1. Inferred extractor fields not yet surfaced in UI (backend enrichment ships config-gated).
2. SOC 2 / pen-test artifacts deferred (correct for V1 scope).
3. Multi-region active/active not guaranteed in V1 topology defaults.

---

## Top 4 Engineering Risks
1. TB-013 Phase 3 — guarded moves for `API_CONTRACTS.md` and contributor maps remain.
2. Branch protection for `cohort-real-llm-gate` requires one-time GitHub UI step (documented, not yet enforced org-wide).
3. Inferred extractor UI surfacing lag vs config-gated backend enrichment.
4. Economy-tier model defaults may understate run cost at scale until tuned.

---

## Most Important Truth
The AI leverage roadmap (Batches A–F) is largely **shipped** — ArchLucid now behaves like a collaborative operator assistant with closed-loop eval hardening, measurable LLM dimensions, acquisition attribution, and self-serve LLM overage wallet. The remaining readiness gap is **economy-tier tuning** and **doc/UI polish** — not core agent UX, RAG foundation, or context ingestion architecture.

---

## Shipped Improvements (Batches A–D, 2026-05-26)

| # | Item | Evidence on `master` |
|---|------|----------------------|
| 1 | Critic adversarial second-pass | `CriticSystemPromptTemplate` v1.1.0 rules 8–9 |
| 2 | Multi-model tiered orchestration | `LlmModelTier`, `TieredAgentCompletionRouter` |
| 3 | AI-assisted request authoring | `ArchitectureRequestDraftService` |
| 4 | Findings-to-IaC stub generator | `FindingIacStubGenerator` |
| 5 | Per-finding conversational explainer | `ArchitectureFindingAskController` |
| 6 | Inline governance-block explainer | `PreCommitGovernanceBlockExplainer` |
| 7 | Findings priority re-ranker | `FindingPriorityReranker` |
| 8 | Run summary one-pager | `RunSummaryOnePagerExportService` |
| 9 | AI policy-pack drafting | `PolicyPackDraftService` |
| 10 | Compare-two-runs narrative | `AskService` `ComparisonNarrative` |
| 11 | Calibrated agent confidence | `AgentConfidenceCalibrator` |
| 12 | Azure extractor enrichment | `AzureExtractorResultEnricher` |
| 13 | Agent-curated evidence proposals | `AgentCuratedEvidenceProposer`, `EvidenceProposalsController` |
| 14 | Templates-pack drift sentinel | `template-eval-harness.yml` cron + `eval-harness-summary.json` |
| 15 | Golden cohort real-LLM gate | `cohort-real-llm-gate` job + `BRANCH_PROTECTION.md` |
| 16 | Real-mode eval corpus (TB-007 Gap C) | `cohort-real-mode-eval-corpus` in `golden-cohort-nightly.yml` |
| 17 | RAG-V1-000 remainder | `RetrievalGroundingTrace`, `TenantBoundRetrievalQueryArchitectureTests` |
| 18 | RAG-V1-001 policy-pack grounding | `PolicyPackCorpusIndexer`, `CompliancePolicyPackRetrievalPromptFormatter` |
| — | Streaming Ask (SSE) | `AskStreamAsync` (shipped prior) |
| — | OTel agent-output alerts | TB-004 / Improvement #22 |

---

## Shipped Improvements (Batch E, 2026-05-26)

| # | Item | Evidence on `master` |
|---|------|----------------------|
| 19 | TB-008 Phase 3 — connector set-diff deltas + composite enrichers | `ConnectorDeltaAsyncHelper`, `CompositeCanonicalEnricher`, per-type enrichers |
| 20 | TB-008 Phase 4 — shared policy/topology overlap resolver | `PolicyTopologyOverlapResolver`, `PolicyReferencePayloadNormalizer` DI |
| 21 | TB-013 Phase 2 — customer-facing doc split | `docs/library/customer-facing/*`, `assert_library_root_audience.py` |
| 22 | TB-015 Phase A — LLM token dimensions | `LlmAccountingInvocationScope`, `archlucid.llm.completion_tokens` histogram |
| 23 | TB-019 — signup marketing attribution | `TenantMarketingAttribution`, `x-archlucid-first-touch`, UI cookie + header |
| 24 | TB-020 remainder — Clarity kill-switch | `NEXT_PUBLIC_ARCHLUCID_MARKETING_ANALYTICS_DISABLED`, privacy policy §2.4 |

---

## Shipped Improvements (Batch F, 2026-05-26)

| # | Item | Evidence on `master` |
|---|------|----------------------|
| 25 | TB-014 — LLM prepaid wallet | `221_LlmTenantWallet.sql`, `LlmTenantWalletService`, `WalletController`, `StripeWalletGateway`, billing wallet UI panel |

---

## Top Improvement Opportunities

### 1. Economy-tier model defaults tuning
- **Why it matters:** Real-mode run cost may exceed tier review allowances at scale if economy-tier deployments stay on premium defaults.
- **Expected impact:** Improves FinOps honesty and reduces surprise overage/wallet usage.
- **Actionable now:** Yes — golden-cohort token histograms (TB-015 Phase A) provide baseline data.

### TB-014 — LLM token wallet **Shipped (Batch F, 2026-05-26)**

Non-expiring prepaid wallet with **$50** refill increment, **$10** trigger, **$0–$500** monthly auto-replenish cap, Stripe PaymentIntent + webhook idempotency, `GET/PUT /v1/billing/wallet`, operator billing panel. See [`docs/library/LLM_BUDGET_TOP_UP.md`](../library/LLM_BUDGET_TOP_UP.md).

---

## Prompt Batching Guidance

Batches A–F are **shipped** (see tables above). Remaining work:

- **Follow-on (not batched)**
  - TB-013 Phase 3 — guarded contributor doc moves
  - Economy-tier model defaults tuning
  - Inferred extractor UI surfacing
  - Stripe Elements card form in wallet UI

---

## Decisions Confirmed This Session

- **Batches A–F shipped on `master`** — assessment rescored to **83.40%** (2026-05-26).
- **Batch F landed:** TB-014 LLM prepaid wallet (persistence, Stripe gateway, API, UI panel, metrics, tests).
- **Batch E landed prior:** TB-008 Phases 3–4; TB-013 Phase 2; TB-015 Phase A; TB-019; TB-020 kill-switch.
- **Batch D landed prior:** templates-pack drift JSON + nightly cron; `cohort-real-llm-gate` job rename; `cohort-real-mode-eval-corpus`; compliance `groundingMissing` prompt honesty.
- **TB-014 billing model:** Non-expiring auto-replenishing wallet — **shipped**.
- **Golden cohort:** `archlucid-golden-cohort` in `eastus` as `gpt-4o`; `cohort-real-llm-gate` documented in branch protection — enable in GitHub UI after first green run.
- **V1.1 deferrals:** Jira, ServiceNow, Confluence, Slack sandboxes (TB-016).