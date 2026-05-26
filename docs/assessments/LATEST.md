> **Scope:** Canonical engineering assessment for internal leads and reviewers tracking V1 GA readiness; not a public-facing status report or compliance attestation.

# ArchLucid Assessment – (A) Headline Readiness: 83.36%

*Note: This score represents the `(A)` headline readiness per `Assessment-Scope-V1_1.mdc`, excluding explicitly deferred items (such as V1.1/V2 scope). Rescored 2026-05-26 after Batch E (engineering backlog: TB-008, TB-013 Phase 2, TB-015 Phase A, TB-019, TB-020 remainder) shipped on `master`.*

## Executive Summary

### (A) Overall Headline Readiness
The core architecture pipeline (Topology, Cost, Compliance, Critic) is solid, and the AI leverage program (Batches A–E) is now largely **on `master`**: streaming Ask, multi-model tier routing, adversarial Critic, calibrated confidence, operator workflow assistants, narrative/artifact generators, agent-curated evidence proposals, LLM-assisted Azure extractor enrichment, templates-pack nightly drift sentinel, golden-cohort real-LLM gate + real-mode eval corpus wiring, RAG policy-pack grounding with citation traces, context ingestion delta/enricher refactor, per-agent LLM token dimensions, signup marketing attribution, and consent-gated marketing analytics kill-switch. Headline readiness is **83.36%** — a strong engineering and operator-AI foundation with remaining gaps in self-serve wallet billing (TB-014) and economy-tier tuning.

### (B) Procurement/Market-Motion Realism
Enterprise buyers will encounter friction due to the absence of a CPA-issued SOC 2 report and third-party penetration testing (both correctly deferred to post-V1.1/V2). While the self-assessment and Trust Center provide a good stopgap, RFP processes will require manual navigation. The lack of multi-region active/active guarantees and automated tenant erasure pipelines will also trigger scrutiny from tier-1 enterprise procurement teams.

### Commercial Picture
Executive summary one-pagers, compare-run narratives, and findings prioritization now ship. Signup marketing attribution (TB-019) wires first-touch cookie → signup header → SQL + low-cardinality counters. Remaining commercial friction: self-serve LLM wallet (TB-014) for expansion revenue without sales touch.

### Enterprise Picture
The blank-page tax is largely addressed (request draft, policy-pack draft, governance explainers, finding ask). Extractor enrichment is config-gated (`AgentRuntime:AzureExtractorEnrichment:Enabled`). RAG policy-pack corpus indexing and compliance `groundingMissing` honesty now ship (RAG-V1-000/001).

### Engineering Picture
Agent confidence calibration, tiered model routing, OTel agent-output alerts (TB-004), RAG grounding traces, templates-pack drift JSON + nightly annotations, real-mode eval corpus in `golden-cohort-nightly.yml`, meaningful connector deltas, composite canonical enrichers, shared policy/topology overlap resolver, and per-agent/per-invoke-kind LLM token histograms are in place. Remaining engineering focus: TB-014 wallet tables/Stripe gateway and doc audience Phase 3. (Jira, ServiceNow, Confluence, Slack sandboxes deferred to V1.1.)

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
1. Self-serve LLM wallet (TB-014) not implemented — expansion revenue requires operator SQL bumps today.
2. Economy-tier model defaults not tuned — run cost may exceed tier allowance at scale.
3. Inferred extractor fields not yet surfaced in archlucid-ui (backend enrichment ships config-gated).
4. TB-013 Phase 3 — contributor-only contract docs still mixed at `library/` root.
5. Branch protection for `cohort-real-llm-gate` requires one-time GitHub UI step (documented, not yet enforced org-wide).
6. SOC 2 / pen-test artifacts deferred (correct for V1 scope).

---

## Top 3 Monetization Blockers
1. Self-serve LLM wallet (TB-014) not yet live for Stripe TEST/staging.
2. Economy-tier model defaults not tuned — run cost may exceed tier allowance at scale.
3. Sales-led checkout remains default until TB-014 wallet ships.

---

## Top 3 Enterprise Adoption Blockers
1. Inferred extractor fields not yet surfaced in UI (backend enrichment ships config-gated).
2. SOC 2 / pen-test artifacts deferred (correct for V1 scope).
3. Multi-region active/active not guaranteed in V1 topology defaults.

---

## Top 4 Engineering Risks
1. TB-014 wallet persistence/Stripe idempotency not yet implemented.
2. TB-013 Phase 3 — guarded moves for `API_CONTRACTS.md` and contributor maps remain.
3. Branch protection for `cohort-real-llm-gate` requires one-time GitHub UI step (documented, not yet enforced org-wide).
4. Inferred extractor UI surfacing lag vs config-gated backend enrichment.

---

## Most Important Truth
The AI leverage roadmap (Batches A–E) is largely **shipped** — ArchLucid now behaves like a collaborative operator assistant with closed-loop eval hardening, measurable LLM dimensions, and acquisition attribution. The remaining readiness gap is **self-serve monetization** (wallet) and **economy-tier tuning** — not core agent UX, RAG foundation, or context ingestion architecture.

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

## Top Improvement Opportunities

### 1. LLM token wallet — non-expiring auto-replenish (TB-014)
- **Why it matters:** Lets tenants self-serve more LLM headroom without waiting for UTC month-roll or contacting sales, and eliminates the financial-perception trap of "use it or lose it" prepay. A non-expiring wallet with customer-set monthly cap is the industry-standard pattern (Cursor, OpenAI API, Anthropic API, AWS) and bounds ArchLucid's settlement exposure to a single refill increment per tenant (~$50) rather than a full month of accrued overage.
- **Expected impact:** Improves Adoption Friction (+3) and Supportability (+2). Weighted readiness impact: +0.04%.
- **Affected qualities:** Adoption Friction, Supportability.
- **Actionable now:** Yes — Stripe TEST keys ready for staging; Azure OpenAI golden-cohort deployment in place; existing `LlmMonthlyTenantBudgetState.PurchasedCapBumpUsd` column and test hook remain for operator-grant scenarios.
- **Billing model:** Non-expiring prepaid wallet. Refill increment **$50**, refill trigger when balance **< $10**, default monthly auto-replenish cap **$0 (opt-in)** with a max of **$500/month** before sales engagement. Card is charged in real time (via Stripe PaymentIntent) at each refill, so ArchLucid never carries more than one increment of unbilled exposure. Balance carries forward indefinitely; on tenant cancellation, balance is non-refundable credit only.
- **Prompt:**
```text
Implement TB-014 as a non-expiring auto-replenishing wallet. Create dbo.LlmTenantWalletState via a DbUp migration with columns: TenantId UNIQUEIDENTIFIER PRIMARY KEY, BalanceUsd DECIMAL(10,2) NOT NULL DEFAULT 0, AutoReplenishEnabled BIT NOT NULL DEFAULT 0, RefillIncrementUsd DECIMAL(10,2) NOT NULL DEFAULT 50.00, RefillTriggerThresholdUsd DECIMAL(10,2) NOT NULL DEFAULT 10.00, MonthlyCapUsd DECIMAL(10,2) NOT NULL DEFAULT 0, AutoRefillsThisUtcMonthCount INT NOT NULL DEFAULT 0, AutoRefillsThisUtcMonthYearMonth INT NOT NULL DEFAULT 0, LastRefillUtc DATETIME2 NULL, StripeCustomerId NVARCHAR(255) NULL, StripePaymentMethodId NVARCHAR(255) NULL, RowVersion ROWVERSION. Create dbo.LlmTenantWalletLedger (LedgerId IDENTITY PK, TenantId, EntryType NVARCHAR(32) — 'Refill'|'Consume'|'OperatorAdjustment', AmountUsd DECIMAL(10,2), BalanceAfterUsd DECIMAL(10,2), StripePaymentIntentId NVARCHAR(255) NULL, CorrelationId UNIQUEIDENTIFIER, CreatedUtc DATETIME2). Add ILlmTenantWalletRepository in ArchLucid.Application/Budgeting/. Add IStripeWalletGateway in ArchLucid.Application/Billing/ with a StripeWalletGateway implementation in ArchLucid.Infrastructure/Billing/ using Stripe.net PaymentIntents and the staging TEST key from configuration block Billing:Stripe:SecretKey. Create LlmTenantWalletService with methods: GetBalanceAsync(TenantId), TryAutoRefillAsync(TenantId, CorrelationId) — checks Balance < RefillTriggerThresholdUsd AND (AutoRefillsThisUtcMonthCount * RefillIncrementUsd) < MonthlyCapUsd AND AutoReplenishEnabled, calls Stripe PaymentIntent, on success credits balance, increments month counter (resetting if YearMonth changed), writes ledger entry, raises 'LlmWalletRefillSucceeded' audit event; on failure raises 'LlmWalletRefillFailed'; ConsumeAsync(TenantId, UsdAmount, CorrelationId) — debits wallet for overage consumption after monthly cap exhausted, ledger entry, returns success/insufficient-funds. Update LlmCompletionAccountingClient: after the existing month-cap check fails (would exceed effective cap), check wallet balance; if BalanceUsd >= estimated cost, allow the call and queue wallet.ConsumeAsync via an IBackgroundTaskQueue post-call; otherwise reject with the existing LlmTokenQuotaExceeded path. After each ConsumeAsync, if balance < RefillTriggerThresholdUsd queue TryAutoRefillAsync. Add controller endpoints in ArchLucid.Api/Controllers/Billing/WalletController.cs: GET /v1/billing/wallet (returns balance, monthly cap, auto-replenish state, last refill), PUT /v1/billing/wallet (toggles AutoReplenishEnabled, sets MonthlyCapUsd in $50 increments 0–500, attaches StripePaymentMethodId), POST /v1/billing/stripe/webhook (verifies Stripe-Signature header, idempotent handling of payment_intent.succeeded and payment_intent.payment_failed using a new dbo.StripeWebhookIdempotency table). In archlucid-ui, add a Wallet Settings page at /settings/billing showing: current balance, last refill timestamp, MonthlyCapUsd slider ($0–$500 step $50), AutoReplenishEnabled toggle, and a Stripe Elements card-collection form. Add metrics archlucid_llm_wallet_balance_usd (gauge, tagged tenant_id), archlucid_llm_wallet_refill_usd_total (counter), archlucid_llm_wallet_refill_failures_total (counter, tagged stripe_decline_code). Update docs/library/LLM_BUDGET_TOP_UP.md and docs/go-to-market/PRICING_PHILOSOPHY.md to document the non-expiring wallet model, the $50 increment, the $500 default cap ceiling, and non-refundability on cancellation. Keep the existing PurchasedCapBumpUsd column and InMemoryLlmTenantBudgetRepository.ApplyMonthlyPurchasedCapBumpAsync test hook intact for operator-grant scenarios. Add unit tests for LlmTenantWalletService (refill threshold, cap enforcement, ledger writes, idempotency) and an integration test that simulates the full flow against Stripe TEST keys using a fixture customer.
```

---

## Prompt Batching Guidance

Batches A–E are **shipped** (see tables above). Remaining work:

- **Batch F: Monetization (Self-Serve Headroom)**
  - LLM token wallet — non-expiring auto-replenish (#1 in Top Improvement Opportunities)

- **Follow-on (not batched)**
  - TB-013 Phase 3 — guarded contributor doc moves
  - Economy-tier model defaults tuning
  - Inferred extractor UI surfacing

---

## Decisions Confirmed This Session

- **Batches A–E shipped on `master`** — assessment rescored to **83.36%** (2026-05-26).
- **Batch E landed this commit:** TB-008 Phases 3–4; TB-013 Phase 2; TB-015 Phase A; TB-019; TB-020 kill-switch.
- **Batch D landed prior:** templates-pack drift JSON + nightly cron; `cohort-real-llm-gate` job rename; `cohort-real-mode-eval-corpus`; compliance `groundingMissing` prompt honesty.
- **TB-014 billing model:** Non-expiring auto-replenishing wallet (Batch F #7 — not yet implemented).
- **Golden cohort:** `archlucid-golden-cohort` in `eastus` as `gpt-4o`; `cohort-real-llm-gate` documented in branch protection — enable in GitHub UI after first green run.
- **V1.1 deferrals:** Jira, ServiceNow, Confluence, Slack sandboxes (TB-016).