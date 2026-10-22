> **Scope:** Architecture review of an externally proposed (OpenAI-drafted) plan for an AI model chooser / provider-neutral AI execution layer, assessed against the actual state of the ArchLucid repository.
> **Review date:** 2026-07-18
> **Method:** Repository-wide evidence survey (AgentRuntime, Retrieval, Host.Composition, Core audit/metering, docs/library backlogs, ADRs). No code was modified during this pass.
> **Related:** [`adrs/0020-azure-primary-platform-permanent.md`](adrs/0020-azure-primary-platform-permanent.md); **TB-193** (done), **TB-689** (open V2 decision gate) in [`TECH_BACKLOG.md`](../library/TECH_BACKLOG.md).
> **Follow-through (2026-07-18):** ADR [`adrs/0060-ai-model-chooser-provider-scope.md`](adrs/0060-ai-model-chooser-provider-scope.md) (**Accepted** 2026-07-18) resolves the TB-689 gate (**TB-689** closed); backlog cluster **TB-869**–**TB-873** implements §7 (**TB-872** ADR gate cleared, still depends on **TB-869**–**TB-871**; **TB-873** remaining gates: capability probe + per-alias faithfulness pass).

# AI model chooser — review of proposed plan (2026-07-18)

## 1. Verdict

The proposed plan's architecture is **sound in principle, but roughly half of it already exists** in ArchLucid, and the plan was drafted without knowledge of the repository. Taken at face value it would re-build shipped infrastructure (provider abstraction, provenance, metering, resilience, evaluation harness) and would walk through two existing governance artifacts (**TB-689** multi-vendor decision gate and **ADR 0020** Azure-primary posture) without acknowledging them.

The genuinely new work collapses to a bounded effort: a model alias/capability registry, a customer-facing governance surface (workspace default + per-review override + audit visibility), and — behind an owner ADR — customer-provided connections and a second adapter.

## 2. The proposed plan (summary)

The external plan proposed:

- **Three customer operating modes** under a "Settings → AI and Model Governance" surface: (1) ArchLucid-managed AI, (2) customer-provided AI connection (BYO endpoint + credentials), (3) customer-controlled routing policy (enterprise).
- **An AI Provider Gateway**: features invoke normalized task types (`ExtractEvidence`, `RunArchitectureReview`, …) with provider-neutral requests; the gateway resolves to an approved provider/model via adapters (`AzureOpenAiAdapter`, `OpenAiCompatibleAdapter`, `AnthropicAdapter`, …). No `if (provider == …)` branches in application services.
- **A model and capability registry** separating customer-facing model aliases (e.g. `economy-general`, `high-assurance-review`) from provider deployment names, with capability tags and approved-task lists.
- **Three governed execution profiles** (Economy / Balanced / High assurance) mapped to approved models by workspace administrators; V1 simplification: workspace default + optional per-review override + model shown on output + audit-trail record.
- **Provenance** on every execution: provider, connection ID, model/deployment, alias, profile, prompt-pack and policy-pack versions, evidence snapshot, schema version, sampling settings, timing, token usage, cost, fallbacks, status, correlation ID.
- **Deterministic platform behavior excluded from model control**: authorization, tenant isolation, evidence identifiers, citation linkage, finalization/approval state, audit history, policy-gate calculations, scoring, retention, export completeness, provenance, billing enforcement.
- **Provider direction (examples, not commitments):** Qwen for economy tier; GLM as open-model/long-context option; DeepSeek economically attractive but hosted-service caution for regulated evidence; Azure OpenAI/OpenAI retained as managed/high-assurance path; customer-owned OpenAI-compatible endpoints as highest-leverage first BYO integration.
- **Sixteen work units**, sequenced: (1) audit current coupling → (2–4) domain model, gateway boundary, adapter around current implementation → (5) provenance → (6) registry → (7) workspace governance policy → (8) secure connection management → (9) OpenAI-compatible endpoints → (10) admin UI → (11) defaults/overrides → (12) metering/quotas/cost → (13) evaluation harness → (14) second real adapter → (15) resilience → (16) neutrality/release assessment.
- **Immediate priority** (given ongoing runtime instability): first abstraction + provenance + adapter; second small chooser + audit visibility; third customer-owned OpenAI-compatible endpoints; fourth broad provider choice/routing/open-weight deployment.

## 3. What the plan gets right

The core principles match how the codebase is already built and are not in dispute:

- A single provider-neutral seam with vendor translation confined to adapters.
- Provenance recorded on every meaningful execution.
- Deterministic/authoritative platform behavior kept out of the model's hands.
- Stabilize-first sequencing: abstraction and provenance around the existing provider before broad provider choice.

## 4. Reality check: what already exists

Repository survey (2026-07-18) against the plan's sixteen work units:

| Plan work unit | Actual state in repo |
|---|---|
| 1: audit current coupling | Effectively done by this review. SDK surface is two files: `ArchLucid.AgentRuntime\AzureOpenAiCompletionClient.cs` (chat) and `ArchLucid.Retrieval\Embedding\AzureOpenAiEmbeddingClient.cs` (embeddings), via `Azure.AI.OpenAI` 2.1.0. |
| 2–4: provider-neutral interface + adapter around existing provider | **Done.** `ILlmProvider` / `IAgentCompletionClient` (`CompleteJsonAsync`) is the seam; `AzureOpenAiCompletionClient` is the single live vendor adapter; `FakeAgentCompletionClient`, `EchoAgentCompletionClient`, and the deterministic simulator provide non-live modes. `DefaultLlmProviderFactory` + `LlmProviderType` (AzureOpenAi / Anthropic / GoogleGemini / LocalOllama) exist as scaffold (**TB-193** done); non-Azure types throw `NotSupportedException`. |
| 5: execution provenance | **Done.** `AgentExecutionTrace` records deployment name, model version, prompt template ID/version/SHA-256, prompt release label, sampling parameters, token counts (input/output/reasoning), estimated cost USD, optional full prompt/response blob keys. OTel tags include `llm_provider` / `llm_deployment`. |
| 6: model/capability registry | **Partial.** `IFineTunedModelRegistry` and `AgentModelTierOptions` (tier → deployment mapping, per-agent-type tiers) exist; no customer-facing alias/capability registry. |
| 7: workspace model-governance policy | **Not present** as a customer surface. Per-tenant AI budgets exist (`TenantAiBudgetPolicy*`), but no vendor/model selection policy per workspace. |
| 8: secure provider-connection management | **Boundary exists** (`ISecretProvider` — Key Vault or environment variables; `IIntegrationSecretWriter`); no per-tenant AI provider connection entity. |
| 9: customer OpenAI-compatible endpoints | Not present. Gated by **TB-689**. |
| 10–11: admin UI, defaults, per-review overrides | Not present. |
| 12: metering, quotas, cost controls | **Done.** `LlmCompletionAccountingClient`, `UsageMeterKind.LlmPromptTokens`/`LlmCompletionTokens`, daily/monthly tenant budgets, `IAiBudgetPreCallGuard`, Stripe-linked `ILlmTenantWalletService`, golden-cohort usage-MTD ledger. |
| 13: evaluation harness | **Exists.** Faithfulness harness runs in CI: offline golden cases (`scripts/ci/eval_agent_faithfulness.py`), live-model Phase B signal, runtime LLM faithfulness judge, deterministic evidence-overlap checker, embedding-based scorer. |
| 14: second real adapter | Not present (scaffold enum only). Gated by **TB-689**. |
| 15: health, timeouts, retry, fallback, circuit-breaking | **Done** as a decorator stack around `IAgentCompletionClient`: circuit breaker, fallback client (secondary Azure OpenAI), caching, content safety enforcement, context-length guard, cost guardrails. |
| 16: neutrality/release assessment | Standard assessment process exists; run when the above ships. |
| "Execution profiles" | **Embryonic form exists:** Economy / Standard / Premium tiers via `AgentModelTierOptions` + `TieredAgentCompletionRouter`, including per-agent-type tier mapping. The plan's Economy/Balanced/High-assurance profiles are a customer-facing rename plus governance layer on this. |

**Net-new work:** the customer-facing governance surface (settings UI, per-review override, "which model produced this" visibility), per-tenant provider connections with credentials, the alias/capability registry, and any second real adapter — roughly 6 of the 16 units.

### Naming trap

The plan proposed `IReviewEngine` as the boundary. That alias was **removed** (EK-01). `DeterministicReviewEngine` in `ArchLucid.AgentSimulator` implements `IAgentExecutor` only — it is a test/simulator double, not an LLM gateway and not the review evaluation kernel (`AuthorityPipelineStagesExecutor`). The real seam is `IAgentCompletionClient` / `ILlmProvider`. Do not reintroduce `IReviewEngine`.

## 5. Governance conflicts the plan ignores

1. **TB-689 is an open V2 decision gate.** Multi-vendor routing explicitly requires an owner ADR before adding Anthropic/Gemini/Ollama adapters. Plan steps 9 and 14 (OpenAI-compatible endpoints, second vendor adapter) walk through that gate. The first real action item is the ADR, not code.
2. **ADR 0020 declares Azure-primary as permanent.** Customer-provided *Azure OpenAI* connections fit that posture cleanly. A generic OpenAI-compatible adapter pointed at Qwen/DeepSeek hosted services is a larger posture change and touches the data-boundary claims made in security and procurement documentation. The plan's own DeepSeek caution hints at this but does not resolve it.

## 6. Technical gaps in the plan

- **Embeddings are ignored.** The plan covers only completions, but `AzureOpenAiEmbeddingClient` exists and retrieval indices are bound to a specific embedding model. A customer switching providers either keeps ArchLucid-managed embeddings (splitting the "customer-provided AI" story) or triggers a re-embedding migration the plan never mentions. This needs an explicit decision in the ADR.
- **"OpenAI-compatible" is weaker than it sounds.** ArchLucid relies on strict JSON-schema response format (`UseJsonSchemaResponseFormat`) and JSON completions. Structured-output support across compatible endpoints (Qwen, self-hosted gateways, LiteLLM-style proxies) is uneven; the adapter needs capability probing and a degraded JSON-parsing path — real work the plan underestimates.
- **The decorator stack assumes one economic model.** Budgets, wallet settlement, and cost estimation assume ArchLucid pays for tokens. Customer-provided connections require a product decision on whether to meter customer-owned spend, and content-safety enforcement (currently Azure Content Safety) needs a stance for non-Azure paths.
- **Evaluation gating is sequenced too late.** The plan puts the evaluation harness at step 13, after customer endpoints at step 9. Since the harness already exists, invert this: no new model alias becomes approvable for a task until it passes the faithfulness floors. That is the actual defense against an economy model quietly degrading findings quality.

## 7. Recommended sequence (revised for the actual baseline)

1. **Write the TB-689 ADR** — provider scope, BYO-Azure-OpenAI vs. generic OpenAI-compatible, embedding stance, metering stance for customer-paid tokens, content-safety stance for non-Azure paths. This unlocks everything else.
2. **Model alias registry** decoupling customer-visible aliases from deployment names, layered on the existing `AgentModelTierOptions` tiers, with capability tags and approved-task lists.
3. **Small chooser + audit visibility** (the plan's V1 simplification): workspace default profile, optional per-review override, model shown on output, selection recorded in the audit trail. Rides on existing tiers and `AgentExecutionTrace` provenance — cheap, and the visible customer win.
4. **Customer-provided Azure OpenAI connection** as the first BYO path — least new adapter code, consistent with ADR 0020, credentials via the existing `ISecretProvider` / Key Vault boundary.
5. **Generic OpenAI-compatible adapter**, gated per-alias by the faithfulness harness, only after the ADR blesses it.

## 8. Implication for near-term planning

Because the plan's "First" phase (abstraction + provenance + adapter) is already built, the near-term deliverable collapses to items 2–3 above — a bounded, mostly UI-plus-registry effort rather than a new subsystem. The expensive and risky parts (items 4–5) can wait behind runtime stability and the ADR, exactly in the spirit the external plan intended, but starting from a far more advanced baseline than it assumed.
