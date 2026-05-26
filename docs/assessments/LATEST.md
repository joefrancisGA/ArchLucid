# ArchLucid Assessment – (A) Headline Readiness: 80.62%

*Note: This score represents the `(A)` headline readiness per `Assessment-Scope-V1_1.mdc`, excluding explicitly deferred items (such as V1.1/V2 scope). Rescored 2026-05-26 after Batches A–C shipped on `master` and Batch B extractor enrichment landed.*

## Executive Summary

### (A) Overall Headline Readiness
The core architecture pipeline (Topology, Cost, Compliance, Critic) is solid, and the AI leverage program (Batches A–C) is now largely **on `master`**: streaming Ask, multi-model tier routing, adversarial Critic, calibrated confidence, operator workflow assistants (request draft, finding ask, governance-block explainer, policy-pack draft), narrative/artifact generators (IaC stubs, run one-pager, compare narrative, findings reranker), agent-curated evidence proposals, and LLM-assisted Azure extractor inventory enrichment. Headline readiness is **80.62%** — a strong engineering and operator-AI foundation with remaining gaps in eval hardening, FinOps token dimensions, self-serve wallet billing, and a few backlog refactors.

### (B) Procurement/Market-Motion Realism
Enterprise buyers will encounter friction due to the absence of a CPA-issued SOC 2 report and third-party penetration testing (both correctly deferred to post-V1.1/V2). While the self-assessment and Trust Center provide a good stopgap, RFP processes will require manual navigation. The lack of multi-region active/active guarantees and automated tenant erasure pipelines will also trigger scrutiny from tier-1 enterprise procurement teams.

### Commercial Picture
Executive summary one-pagers, compare-run narratives, and findings prioritization now ship. Remaining commercial friction: self-serve LLM wallet (TB-014) for expansion revenue without sales touch, and marketing attribution for paid acquisition honesty.

### Enterprise Picture
The blank-page tax is largely addressed (request draft, policy-pack draft, governance explainers, finding ask). Extractor enrichment is config-gated (`AgentRuntime:AzureExtractorEnrichment:Enabled`). RAG policy-pack corpus indexing (RAG-V1-001) remains open for compliance faithfulness at scale.

### Engineering Picture
Agent confidence calibration, tiered model routing, OTel agent-output alerts (TB-004), and partial RAG grounding traces are in place. Remaining engineering focus: real-mode eval corpus scenarios, templates-pack drift sentinel, per-agent token dimensions (TB-015), context ingestion Phases 3–4 polish, and TB-014 wallet tables/Stripe gateway. (Jira, ServiceNow, Confluence, Slack sandboxes deferred to V1.1.)

---

## Weighted Quality Assessment

### 1. Cutting-Edge AI Technology
- **Score:** 78
- **Weight:** 8
- **Weighted deficiency signal:** 176
- **Justification:** Streaming Ask (SSE), multi-model tier routing (`LlmModelTier` + `TieredAgentCompletionRouter`), and agent-curated evidence proposals ship. Remaining gap: broader cost-optimization telemetry and faster-model defaults not yet tuned per tenant.
- **Improvement recommendations:** Tune Economy-tier defaults per agent type once TB-015 token dimensions land.

### 2. AI/Agent Readiness
- **Score:** 82
- **Weight:** 8
- **Weighted deficiency signal:** 144
- **Justification:** Adversarial Critic prompt (v1.1.0), calibrated confidence (`AgentConfidenceCalibrator`), evidence proposals, and partial RAG grounding (`RetrievalGroundingTrace`, citation formatter) ship. RAG-V1-001 policy-pack corpus indexing remains open.
- **Improvement recommendations:** Complete RAG-V1-001 and add real-mode eval scenarios.

### 3. Adoption Friction
- **Score:** 80
- **Weight:** 6
- **Weighted deficiency signal:** 120
- **Justification:** Request draft, policy-pack draft, governance-block explainer, finding ask, and config-gated extractor enrichment address most blank-page and opaque-block friction. UI surfacing of inferred extractor fields is follow-on polish.
- **Improvement recommendations:** Surface `inferred.*` flags in archlucid-ui request review.

### 4. Time-to-Value
- **Score:** 83
- **Weight:** 7
- **Weighted deficiency signal:** 119
- **Justification:** IaC stub generator, findings reranker, and request draft shorten path to actionable output.
- **Improvement recommendations:** Enable `AgentRuntime:GenerateIacStubs` by default for paid tiers after cost review.

### 5. Proof-of-ROI Readiness
- **Score:** 82
- **Weight:** 5
- **Weighted deficiency signal:** 90
- **Justification:** Compare-two-runs narrative and executive ROI summary ship; marketing attribution (TB-019) still open.
- **Improvement recommendations:** Implement TB-019 signup attribution.

### 6. Executive Value Visibility
- **Score:** 80
- **Weight:** 4
- **Weighted deficiency signal:** 80
- **Justification:** Run summary one-pager export ships via `RunSummaryOnePagerExportService`.
- **Improvement recommendations:** None blocking V1 pilot motion.

### 7. Maintainability
- **Score:** 80
- **Weight:** 4
- **Weighted deficiency signal:** 80
- **Justification:** Strong invariants; context ingestion Phases 3–4 and doc audience split remain.
- **Improvement recommendations:** Complete TB-008 Phases 3–4 and TB-013 Phase 2.

### 8. Reliability
- **Score:** 76
- **Weight:** 2
- **Weighted deficiency signal:** 48
- **Justification:** OTel agent-output alerts ship (TB-004); calibrated confidence improves gate honesty. Real-mode eval corpus and templates drift sentinel still open.
- **Improvement recommendations:** TB-007 Gap C real-mode scenarios; templates-pack nightly drift job.

### 9. Supportability
- **Score:** 85
- **Weight:** 1
- **Weighted deficiency signal:** 15
- **Justification:** CLI doctor, support bundles, correlation IDs, runbooks — excellent.
- **Improvement recommendations:** TB-015 per-agent token dimensions.

---

## Top 6 Most Important Weaknesses
1. Real-mode eval corpus scenarios still missing (TB-007 Gap C) — simulator-only CI does not prove live-model finding quality.
2. Templates-pack drift detection not yet a closed-loop nightly sentinel.
3. Per-agent/per-invoke-kind LLM token dimensions missing (TB-015) — FinOps envelopes remain estimated, not measured.
4. Self-serve LLM wallet (TB-014) not implemented — expansion revenue requires operator SQL bumps today.
5. RAG-V1-001 policy-pack rule-text corpus not fully indexed for compliance grounding.
6. Marketing attribution (TB-019) and public SEO structured data (TB-020) remain open for acquisition honesty.

---

## Top 3 Monetization Blockers
1. Self-serve LLM wallet (TB-014) not yet live for Stripe TEST/staging.
2. Marketing attribution (TB-019) not wired for paid acquisition ROI proof.
3. Economy-tier model defaults not tuned — run cost may exceed tier allowance at scale.

---

## Top 3 Enterprise Adoption Blockers
1. RAG-V1-001 policy-pack corpus indexing incomplete for compliance faithfulness at scale.
2. Inferred extractor fields not yet surfaced in UI (backend enrichment ships config-gated).
3. Real-mode eval gap reduces buyer trust in automated quality gates for tier-1 pilots.

---

## Top 4 Engineering Risks
1. Missing real-mode scenarios in the evaluation corpus.
2. Lack of automated templates-pack drift detection.
3. Missing token dimension telemetry for accurate FinOps (TB-015).
4. TB-014 wallet persistence/Stripe idempotency not yet implemented.

---

## Most Important Truth
The AI leverage roadmap (Batches A–C) is largely **shipped** — ArchLucid now behaves like a collaborative operator assistant, not only a background agent pipeline. The remaining readiness gap is **operational hardening** (real-mode eval, drift sentinel, FinOps dimensions) and **self-serve monetization** (wallet), not core agent UX.

---

## Shipped Improvements (Batches A–C, 2026-05-26)

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
| 12 | Azure extractor enrichment | `AzureExtractorResultEnricher` (this commit) |
| 13 | Agent-curated evidence proposals | `AgentCuratedEvidenceProposer`, `EvidenceProposalsController` |
| — | Streaming Ask (SSE) | `AskStreamAsync` (shipped prior) |
| — | OTel agent-output alerts | TB-004 / Improvement #22 |

---

## Top Improvement Opportunities

### 1. Templates-pack drift detection
- **Why it matters:** Converts the inform-only harness into a real regression sentinel, closing the quality loop.
- **Expected impact:** Improves AI/Agent Readiness (+4) and Reliability (+3). Weighted readiness impact: +0.08%.
- **Affected qualities:** AI/Agent Readiness, Reliability.
- **Actionable now:** Yes.
- **Prompt:**
```text
Update .github/workflows/template-eval-harness.yml to add a scheduled trigger (cron: '0 3 * * *') that runs python scripts/ci/eval_template_harness.py --mode score --report artifacts/eval-harness-nightly.md. Add a step that reads the report and emits a GitHub Actions warning annotation (::warning::) for each scenario that fails recall or trips an unexpected hit. Update scripts/ci/eval_template_harness.py to emit a machine-readable JSON summary (eval-harness-summary.json) alongside the markdown report, containing per-scenario pass/fail, recall percentage, and unexpected hit count.
```

### 2. Promote cohort-real-llm-gate to a required PR status check (TB-007 Gap A)
- **Why it matters:** Ensures real-mode LLM correctness is enforced in CI.
- **Expected impact:** Improves Reliability (+3). Weighted readiness impact: +0.03%.
- **Affected qualities:** Reliability.
- **Actionable now:** Yes.
- **Prompt:**
```text
Address TB-007 Gap A. The Azure OpenAI deployment (`archlucid-golden-cohort` in `eastus` deployed as `gpt-4o`) is now provisioned. Add `cohort-real-llm-gate` to the required status checks in the main branch protection rule (if managed via Terraform in `infra/`) or document the exact GitHub UI steps required to enforce it. Update `docs/runbooks/GOLDEN_COHORT_REAL_LLM_GATE.md` to reflect that the gate is now active and enforced.
```

### 3. LLM correctness boundary: Eval corpus real-mode scenarios (TB-007 Gap C)
- **Why it matters:** CI checks currently only assert on simulator agent results, leaving real-mode finding quality untested.
- **Expected impact:** Improves Reliability (+4) and AI/Agent Readiness (+2). Weighted readiness impact: +0.05%.
- **Affected qualities:** Reliability, AI/Agent Readiness.
- **Actionable now:** Yes.
- **Prompt:**
```text
Address TB-007 Gap C. Add at least one eval-corpus scenario in `tests/eval-corpus/` with `"mode": "real"` and expectedFindings keyword checks meaningful for real model output. Wire a nightly or post-deploy job in `.github/workflows/golden-cohort-nightly.yml` that runs `eval_agent_corpus.py` against the real-mode API. Gate this on the `ARCHLUCID_GOLDEN_COHORT_REAL_LLM` variable and budget probe. Ensure the script correctly parses and asserts against the real LLM output.
```

### 4. Context ingestion connectors: Phase 3 (TB-008)
- **Why it matters:** Improves architecture maintainability by introducing meaningful deltas and typed enrichers.
- **Expected impact:** Improves Maintainability (+4). Weighted readiness impact: +0.04%.
- **Affected qualities:** Maintainability.
- **Actionable now:** Yes.
- **Prompt:**
```text
Implement Phase 3 of TB-008. Introduce `IConnectorDeltaComputer` (shared default + optional per-connector overrides) in `ArchLucid.ContextIngestion`. Replace literal-string deltas with set-diff on `SourceId`. Split `CanonicalInfrastructureEnricher` into per-`ObjectType` enrichers behind a composite pattern. Ensure all existing connector tests pass and update `docs/library/SYSTEM_MAP.md` to reflect the new enricher architecture.
```

### 5. Context ingestion connectors: Phase 4 (TB-008)
- **Why it matters:** Resolves duplication between policy and topology stages.
- **Expected impact:** Improves Maintainability (+3). Weighted readiness impact: +0.03%.
- **Affected qualities:** Maintainability.
- **Actionable now:** Yes.
- **Prompt:**
```text
Implement Phase 4 of TB-008. Resolve `PolicyReferenceConnector` / topology stable-ID duplication by creating a shared resolver service in `ArchLucid.ContextIngestion`. Consume this service from both policy and topology stages so overlap logic is not replicated. Add unit tests for the shared resolver and ensure cross-connector coupling is cleanly managed via dependency injection.
```

### 6. Documentation library audience reorganisation Phase 2 (TB-013)
- **Why it matters:** Lowers onboarding cognitive load by separating buyer-visible docs from contributor internals.
- **Expected impact:** Improves Supportability (+2) and Maintainability (+2). Weighted readiness impact: +0.02%.
- **Affected qualities:** Supportability, Maintainability.
- **Actionable now:** Yes.
- **Prompt:**
```text
Execute Phase 2 of TB-013. Batch-move lightly cross-linked evaluator docs (`CONCEPTS_IN_5_MINUTES`, `FAQ`, pilot-adjacent scaffolds) into `docs/library/customer-facing/` using temporary stubs matching Phase 1. Ensure `scripts/ci/assert_start_here_links_valid.py` stays green. Add a `grep` gate in CI forbidding new `library/` root drops without audience tagging. Do not modify `GOVERNANCE` or `SECURITY` operator sections yet.
```

### 7. Per-agent/per-invoke-kind LLM token dimensions (TB-015 Phase A)
- **Why it matters:** Provides truthful token envelopes for cost-preview and cohort budgeting.
- **Expected impact:** Improves Maintainability (+3) and Supportability (+3). Weighted readiness impact: +0.03%.
- **Affected qualities:** Maintainability, Supportability.
- **Actionable now:** Yes.
- **Prompt:**
```text
Implement Phase A of TB-015. Create an `AsyncLocal<LlmAccountingInvocationScope>` struct to track `AgentKind` and `InvokeKind`. Scope it with `using` in `RealAgentExecutor` around the handler body. Update `LlmCompletionAccountingClient` to read this scope and feed bounded labels (`archlucid.llm.consume_role`, `archlucid.llm.invoke_kind`) to `RecordLlmTokenUsage`. Add a new `Histogram<long>` (`archlucid.llm.completion_tokens`) with these tags, while keeping the existing additive counters for backward compatibility.
```

### 8. Signup marketing attribution + server-side conversion (TB-019)
- **Why it matters:** Provides measurable outcomes for paid and organic acquisition without raw-UTM cardinality explosions.
- **Expected impact:** Improves Proof-of-ROI Readiness (+2). Weighted readiness impact: +0.02%.
- **Affected qualities:** Proof-of-ROI Readiness.
- **Actionable now:** Yes.
- **Prompt:**
```text
Implement TB-019. Capture normalized first-touch attribution (`utm_source`, `utm_medium`, `utm_campaign`, `utm_content`) in a `SameSite=Lax` cookie. Propagate this into the signup API boundary via an `x-archlucid-first-touch` header. Persist it immutably in `dbo.TenantMarketingAttribution` keyed by `TenantId` + `CapturedUtc`. Increment low-cardinality counters (`attribution.medium`, `attribution.platform`) after provision succeeds end-to-end. Do not attach raw `utm_campaign` strings to Prometheus metrics.
```

### 9. Public marketing structured data + consent-gated analytics (TB-020)
- **Why it matters:** Improves SERP visibility and ensures privacy compliance for EU traffic.
- **Expected impact:** Improves Adoption Friction (+2). Weighted readiness impact: +0.02%.
- **Affected qualities:** Adoption Friction.
- **Actionable now:** Yes.
- **Prompt:**
```text
Implement the remainder of TB-020. Ensure Microsoft Clarity (or chosen vendor) activates only when client consent UX exists (for jurisdictions requiring opt-in) and an optional server kill-switch is enabled. Extend `archlucid-ui/next.config.ts` `script-src` / `connect-src` minimally per vendor subdomain allowlist. Update `PRIVACY_POLICY.md` noting active vendors. Do not mint `aggregateRating` or `reviewCount` JSON-LD.
```

### 10. RAG-V1-000 remainder (Citation formatter, RetrievalGroundingTrace)
- **Why it matters:** Raises faithfulness and citation density using existing retrieval infrastructure.
- **Expected impact:** Improves AI/Agent Readiness (+3) and Reliability (+2). Weighted readiness impact: +0.06%.
- **Affected qualities:** AI/Agent Readiness, Reliability.
- **Actionable now:** Yes.
- **Prompt:**
```text
Complete the remainder of RAG-V1-000. Implement `IRetrievalCitationFormatter` for uniform citation shape `[corpus]/[id]@[version]`. Create `dbo.RetrievalGroundingTrace` via a DbUp migration with fields `runId`, `agentName`, `retrievedChunkIds`, `tokensIn`, `tokensOut`, `citationCoverage`. Update the `ComplianceAgentHandler` to populate this trace. Add an architecture test ensuring tenant-bound `RetrievalQuery` includes tenant scope.
```

### 11. RAG-V1-001 (Policy-pack rule-text corpus)
- **Why it matters:** Indexes natural-language rule text to improve compliance finding honesty.
- **Expected impact:** Improves AI/Agent Readiness (+4). Weighted readiness impact: +0.07%.
- **Affected qualities:** AI/Agent Readiness.
- **Actionable now:** Yes.
- **Prompt:**
```text
Implement RAG-V1-001. Index natural-language rule text + rationale from `templates/policy-packs/**` and `docs/templates/policy-packs/**`. Wire retrieval into `ComplianceAgentHandler` before LLM completion. When no rule hit occurs, attach `groundingMissing=true` on the typed payload but do not fail the run. Add a unit test verifying that a known compliance scenario produces a finding `reasoningSummary` quoting pack control text.
```

### 12. LLM token wallet — non-expiring auto-replenish (TB-014)
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

Batches A–C are **shipped** (see table above). Remaining work:

- **Batch D: AI Quality and RAG Foundation (Eval & Search)**
  - Templates-pack drift detection (#1)
  - Promote cohort-real-llm-gate (#2)
  - LLM correctness boundary: Eval corpus real-mode scenarios (#3)
  - RAG-V1-000 remainder (#10)
  - RAG-V1-001 (#11)

- **Batch E: Engineering Backlog (Ops & Refactors)**
  - Context ingestion connectors: Phase 3 & 4 (#4, #5)
  - Documentation library audience reorganisation Phase 2 (#6)
  - Per-agent/per-invoke-kind LLM token dimensions (#7)
  - Signup marketing attribution & Public marketing structured data (#8, #9)

- **Batch F: Monetization (Self-Serve Headroom)**
  - LLM token wallet — non-expiring auto-replenish (#12)

---

## Decisions Confirmed This Session

- **Batches A–C shipped on `master`** — assessment rescored to **80.62%** (2026-05-26).
- **Batch B #12 landed this commit:** `AzureExtractorResultEnricher` + config gate `AgentRuntime:AzureExtractorEnrichment:Enabled`.
- **TB-014 billing model:** Non-expiring auto-replenishing wallet (Batch F #12 — not yet implemented).
- **Golden cohort:** `archlucid-golden-cohort` in `eastus` as `gpt-4o`; promote `cohort-real-llm-gate` to required check (Batch D #2).
- **V1.1 deferrals:** Jira, ServiceNow, Confluence, Slack sandboxes (TB-016).