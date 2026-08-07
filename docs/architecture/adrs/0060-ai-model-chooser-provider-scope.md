> **Scope:** ADR 0060 — AI model chooser: provider scope, customer-provided connections, and activation gates (resolves the **TB-689** decision gate).

> **Spine doc:** [`START_HERE.md`](../../START_HERE.md).

# ADR 0060: AI model chooser — provider scope, customer-provided connections, and activation gates

- **Status:** Accepted — **D1 superseded in part** by [ADR 0065](0065-curated-multi-engine-model-catalog.md) (2026-08-07). **D2, D5, D6, D7 remain operative**; **D3** (TB-872) and **D4** (TB-873) are re-sequenced by ADR 0065 D7′ with their evaluation gates retained.
- **Date:** 2026-07-18
- **Accepted:** 2026-07-18 (owner)
- **Superseded by:** [ADR 0065 — Curated multi-engine model catalog](0065-curated-multi-engine-model-catalog.md) for **D1 only** (2026-08-07). ADR 0065 records that **no D1 reassessment trigger had fired**; reopening was an owner strategic bet.

## Context

**TB-689** requires an explicit owner ADR before activating any multi-vendor LLM routing (`LlmProviderType` scaffolds Anthropic, Google Gemini, and Local Ollama with no production clients). An externally drafted "AI provider gateway / model chooser" plan was reviewed against the repository on 2026-07-18 ([`ai_model_chooser_plan_review_2026_07_18.md`](../ai_model_chooser_plan_review_2026_07_18.md)); the review found the provider-neutral seam (`IAgentCompletionClient` / `ILlmProvider`), execution provenance (`AgentExecutionTrace`), tiered routing (`AgentModelTierOptions` + `TieredAgentCompletionRouter`), metering/budget enforcement, resilience decorators, and the faithfulness evaluation harness **already shipped**, leaving the customer-facing governance surface, an alias/capability registry, and any customer-provided connections as net-new scope.

**Forces:** ADR 0020 fixes Azure as the primary and permanent platform. Retrieval indices are bound to the current Azure OpenAI embedding model. The completion path depends on strict JSON-schema structured output (`UseJsonSchemaResponseFormat`). Cost accounting (wallet, daily/monthly budgets) assumes ArchLucid pays for tokens. At current pilot scale (~5 tenants × 25 reviews/month) vendor arbitrage saves minimal dollars while forfeiting Azure structured output, Content Safety, and managed-identity integration. Buyers nonetheless ask for model choice and BYO endpoints as demo/trial/cost-control readiness criteria.

**Alternatives considered:**

1. **Stay Azure-only with no customer-facing choice** — lowest effort, but leaves the buyer-visible model-governance requirement unmet and blocks the chooser indefinitely.
2. **Full multi-vendor SDK adapters (Anthropic/Gemini/Ollama)** — maximum flexibility, but N-SDK maintenance, uneven structured-output semantics, new data-boundary claims, and a posture conflict with ADR 0020 at a scale where arbitrage savings are negligible.
3. **Governed alias layer atop Azure-native, with BYO Azure OpenAI first and a gated generic OpenAI-compatible adapter second** — the decision below.

## Decision

1. **D1 — Provider scope.** Azure OpenAI remains the **sole ArchLucid-managed provider** for V1.x. The `LlmProviderType` vendor SDK scaffolds (Anthropic, Gemini, Ollama) stay dormant; no third-party vendor SDK adapter is built under this ADR.
2. **D2 — Alias-based selection.** Customer-facing model selection is expressed through a **model alias and capability registry** (**TB-869**) and governed **execution profiles** (Economy / Balanced / High assurance) layered on the existing tier router — never through literal deployment names in prompts, policies, or UI.
3. **D3 — First BYO path: customer-provided Azure OpenAI connection** (**TB-872**). Per-tenant endpoint + deployment + credential stored via the existing `ISecretProvider` / Key Vault boundary, reusing the existing Azure OpenAI adapter with per-tenant client resolution. ADR-acceptance gate **cleared** (this ADR Accepted 2026-07-18); remaining dependency is **TB-869**–**TB-871**.
4. **D4 — Second BYO path: generic OpenAI-compatible endpoints** (**TB-873**). One adapter for OpenAI-compatible APIs (customer-hosted gateways, open-weight servers). ADR-acceptance gate **cleared**; remaining gates: **(b)** a capability probe confirming JSON-schema structured output or an approved degraded-parsing profile, and **(c)** a per-alias faithfulness-harness pass artifact before any task is approvable on that alias. Hosted third-party endpoints receiving regulated customer evidence additionally require an explicit workspace-administrator acknowledgment recorded in the audit trail.
5. **D5 — Embeddings stay ArchLucid-managed.** Retrieval embeddings remain on the ArchLucid-managed Azure OpenAI embedding deployment in **all** modes for V1.x; BYO embeddings and re-embedding migration are out of scope (index/vector binding).
6. **D6 — Metering and billing.** Token usage, cost estimation, and provenance are recorded for **every** execution regardless of who pays. Wallet settlement and dollar-budget **enforcement** apply only to ArchLucid-managed connections; customer-provided connections get usage visibility and optional workspace quotas, not ArchLucid wallet charges.
7. **D7 — Deterministic authority unchanged.** Content-safety enforcement and all deterministic platform behaviors (authorization, tenant isolation, evidence identifiers, citation linkage, finalization/approval state, audit history, policy-gate calculations, scoring, retention/deletion, export completeness, billing enforcement) remain ordinary ArchLucid code on every provider path. Model or profile selection can never alter authoritative records or governance outcomes.

## Trade-offs

**Gains:** one live vendor surface to operate, secure, and evaluate; the chooser ships as a bounded registry + governance layer instead of a new subsystem; BYO Azure OpenAI satisfies the strongest buyer ask (their tenancy, their spend) with almost no new adapter code; eval-gated alias approval prevents a cheap model from silently degrading findings quality; ADR 0020 posture and existing procurement/security claims stay intact.

**Gives up:** no vendor arbitrage or open-weight economy tier in V1.x — cost-optimization headroom from Qwen/GLM/DeepSeek-class models is deferred; customers who demand Anthropic/Gemini specifically are not served; the OpenAI-compatible adapter inherits whatever structured-output gaps a customer's endpoint has, so some endpoints will be rejected by the capability probe and that will be a sales friction; keeping embeddings ArchLucid-managed means "customer-provided AI" is a partial story (completions only), which must be stated honestly in buyer-facing copy; deferring re-embedding keeps a hard dependency on one embedding deployment.

## Constraints

- **ADR 0020** (Azure primary and permanent) bounds the managed path; this ADR must not create a de-facto multi-cloud hosting posture.
- **TB-689** required this ADR before live multi-vendor / BYO routing; with acceptance, **TB-689** is closed and implementation proceeds via **TB-869**–**TB-873** (TB-873 still gated on capability probe + per-alias eval pass).
- **Secret backends are Key Vault or environment variables only** (`ISecretProvider`); customer credentials must not appear in ordinary configuration or database columns.
- **Faithfulness-harness floors** (offline golden cases + Phase B live signal) are the non-negotiable quality bar for approving any alias/task pair.
- **Runtime stability priority (owner, 2026-07-18):** the platform is still producing frequent runtime errors; only the registry/governance/UI slice (TB-869–TB-871) may proceed near-term.
- **Pilot-scale economics:** ~5 tenants × 25 reviews/month — no budget for re-embedding migrations or per-vendor eval corpora.
- **JSON-schema structured output** is load-bearing across agent code paths; any provider path that cannot satisfy it needs an explicit degraded profile, not silent fallback.

## Expected impact

- **System:** application services keep a single seam (`IAgentCompletionClient`); new components are a registry, a per-tenant connection resolver, and one OpenAI-compatible adapter behind gates. Falsifiable: no `if (provider == …)` branch appears outside adapters; `AgentExecutionTrace` gains alias/connection fields and every live execution records them.
- **Security posture:** customer credentials enter only through `ISecretProvider`/`IIntegrationSecretWriter`; the regulated-evidence acknowledgment for hosted third-party endpoints creates an auditable consent record; content safety runs on all paths. Attack surface grows by exactly one outbound HTTP client shape.
- **Operations:** health probes and circuit-breaking extend to customer connections; a failing customer endpoint degrades that workspace only, with the existing fallback semantics disabled for BYO (no silent cross-connection failover — falls back to error surfacing, not to ArchLucid-paid capacity, unless the workspace opts in).
- **Cost:** ArchLucid-managed spend is unchanged; BYO shifts token spend to customers, which reduces COGS per enterprise tenant and is observable in the wallet/usage-MTD ledgers.
- **Teams:** near-term work is bounded to TB-869–TB-871 (registry, governance policy, admin UI); no new vendor SDK expertise required until a future ADR supersedes D1.

## Consequences

- **Positive:** TB-689's decision debt is retired; the model chooser becomes a deliverable buyer feature without destabilizing the AI runtime; eval gating institutionalizes quality floors for any future model.
- **Negative:** open-weight economy pricing is deferred; some prospects requiring specific non-OpenAI vendors are out of scope until a superseding ADR; partial BYO (completions-only) requires careful buyer-facing wording.
- **Follow-ups:** **TB-869** (alias/capability registry), **TB-870** (workspace model-governance policy + per-review override), **TB-871** (Settings → AI and Model Governance admin UI + output/audit visibility), **TB-872** (customer-provided Azure OpenAI connection — ADR gate cleared; depends on **TB-869**–**TB-871**), **TB-873** (OpenAI-compatible adapter — remaining gates: capability probe + per-alias eval pass). Reassessment triggers for D1: tenant count ≥ 20, or a signed enterprise deal contractually requiring a non-OpenAI provider, or $/review cost pressure that the Economy tier cannot meet.
