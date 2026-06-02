> **Scope:** Independent first-principles quality assessment — Cutting-Edge AI Technology only. Produced 2026-06-02. Not a buyer document. Scoring boundary follows `Assessment-Scope-V1_1.mdc`; items explicitly deferred to V1.1, V2, or owner-only action do **not** reduce `(A)` headline readiness.

# Cutting-Edge AI Technology — Quality Assessment
## Score: **75 / 100** | Weighted Share of Total: **17.78%** (Weight 8 of 45)

---

## 0. Scoring formula reference

| Field | Value |
|-------|-------|
| Quality | Cutting-Edge AI Technology |
| Weight | 8 |
| Total weight (all qualities) | 45 |
| Weighted share of total | 8 ÷ 45 = **17.78%** |
| Score | **75** |
| Weighted contribution to headline | 75 × 8 ÷ 45 = **13.33** |
| Maximum possible contribution | 100 × 8 ÷ 45 = **17.78** |
| Weighted deficiency signal | (100 − 75) × 8 = **200** |

**Definition (from `ASSESSMENT_QUALITY_MODEL.md`):** Modernity and technical strength of the AI substrate — model integration, retrieval design, structured outputs, context-window handling, redaction, evaluation hooks, and the degree to which the solution uses current AI techniques without compromising enterprise constraints.

---

## 1. Sub-dimension scores (inputs to overall score)

Assessed across six sub-dimensions with indicative internal weights.

| Sub-dimension | Score | Notes |
|---------------|------:|-------|
| Model integration | 74 | Azure OpenAI SDK; MI auth; structured outputs; rate-limit handling; streaming for completion but **not** for Ask (TB-178 pending P0); single-provider only; no model-tier differentiation (TB-179 pending P1) |
| Retrieval design | 76 | Multi-corpus RAG; Azure AI Search semantic ranker; tenant isolation; embedding drift guard; ContentHash skip; chunking fingerprint; grounding trace persistence; IR eval harness shipped; no HyDE/Graph-RAG (V2 deferred, not penalized) |
| Structured outputs | 84 | `json_schema` strict mode; `json_object` fallback; schema remediation retry loop with error feedback; full contract validation via `AgentResultParser`; remediation telemetry |
| Context-window handling | 78 | `TokenAwareContextBudget`; `ContextLengthGuardAgentCompletionClient` with threshold and audit event; token estimation discrepancy warnings; opt-in LLM evidence summarization before hard truncation (**TB-192** / batch 5V) |
| Redaction | 81 | Azure AI Content Safety on input and output; `AgentEvidenceUntrustedInputSanitizer`; `AzureResourceTagPromptSanitizer`; `IPromptRedactor` in executor; opt-in prompt/response span capture (default off) |
| Evaluation hooks | 70 | LLM-as-judge faithfulness (Critic only); `AgentOutputQualityGate` structural + semantic thresholds; citation coverage evaluator; IR eval harness (recall@5, MRR); **no** nightly cron (TB-181 pending P1); **no** calibrated confidence (TB-180 pending P1); judge not extended to Cost/Compliance (TB-190 pending P2) |

---

## 2. Areas needing most improvement (ranked by weighted deficiency impact)

Areas are ordered from highest impact gap to lowest. Weighting within this quality dimension is proportional to the definition: evaluation hooks and model integration carry the most weight for a system aiming to be "cutting-edge."

---

### 2.1 No streaming responses for Ask queries — HIGHEST IMPACT (P0)

**Gap:** Every Ask query blocks the user at a blank screen until the full LLM response is received. `IAgentStreamingCompletionClient` exists and is used in agent execution, but `AskService` calls `CompleteJsonAsync` (non-streaming). `POST /v1/ask/stream` and `useAskStream()` UI hook do not exist (TB-178).

**Why it matters for Cutting-Edge AI:** Real-time streaming is a baseline expectation for modern AI products. The absence makes the product feel a generation behind its peer set on the interaction that buyers observe most during pilots.

**Deficiency:** Large — affects the most visible AI interaction surface on every query.

**Tradeoffs:** Streaming requires accumulating JSON chunks and detecting complete parse boundaries. The existing `IAgentStreamingCompletionClient` interface already handles this for agent completions; the risk is low.

---

### 2.2 No multi-model tiered orchestration (P1)

**Gap:** All four agent handlers (Topology, Compliance, Cost, Critic) use the same `ModelTier`. Fast, low-complexity tasks (Topology initial draft, Cost extraction) use the same expensive reasoning model as Critic and Compliance. TB-179 is pending.

**Why it matters:** Multi-model tiering (e.g., gpt-4o-mini for fast drafts, GPT-4o for compliance/critic) is a current-generation architecture pattern. A uniform model assignment is technically correct but wastes budget and underutilizes the fast model's strengths. The model tier selection was resolved 2026-06-01 (PQ-AI-04): `Fast=gpt-4o-mini`, `Reasoning=GPT-4o`.

**Estimated impact:** 30–50% run cost reduction without quality regression on well-defined extraction tasks.

---

### 2.3 Critic posture is consensus-leaning (P0)

**Gap:** `CriticSystemPromptTemplate.cs` rule 8 (as of audit) instructs the Critic to accept the prior agents' consensus as a baseline rather than adopting a challenge-first posture. TB-177 calls this out as "Critic is currently consensus-leaning."

**Why it matters:** The Critic's sole job is to surface gaps and contradictions. A consensus-leaning Critic produces validation theater rather than adversarial review. This is the highest-impact single-file prompt change in the entire pipeline.

**Deficiency:** High — affects the quality ceiling of every run that includes Critic.

**Tradeoffs:** A more adversarial Critic may increase false positives (findings that conflict with correct outputs). Calibrate via golden-case eval (RAG-V1-011 harness, already shipped).

---

### 2.4 LLM-as-judge evaluation does not cover Cost and Compliance agents (P2)

**Gap:** `AgentOutputFaithfulnessEvaluator` is wired for the agent result but the LLM judge client (`AgentOutputLlmJudgeCompletionServiceKey`) is only guaranteed available for runs that include Critic. Cost and Compliance findings — which are the most commercially sensitive (dollar figures, regulatory claims) — have no independent faithfulness check. TB-190 is pending.

**Prerequisite:** TB-190 requires a `LlmJudgeBudget` sub-cap (~200k tokens/day, isolated from run-execution quota) to be implemented first. PQ-AI-02 resolved the sub-cap design on 2026-06-01.

**Deficiency:** Moderate — cost and compliance claims go to buyers without LLM-level scrutiny.

---

### 2.5 Quality gate confidence thresholds are ungrounded (P1)

**Gap:** `AgentOutputQualityGate` applies reject/warn thresholds for `StructuralCompletenessRatio` and `OverallSemanticScore`, but `CalibratedConfidence` is an optional override without a systematic calibrator. TB-180 proposes `IAgentConfidenceCalibrator` with piecewise-linear calibration from observed score distributions, falling back to raw score when fewer than 20 data points exist.

**Why it matters:** Without calibration, thresholds are engineering estimates rather than empirically grounded cutoffs. A finding rejected at 0.42 structural score may be high-quality; one accepted at 0.51 may be garbage. This undermines the claim that the quality gate is meaningful.

**Deficiency:** Moderate — affects trust in every gate decision.

---

### 2.6 No nightly eval harness cron (P1)

**Gap:** The template eval harness (`.github/workflows/template-eval-harness.yml`) runs on demand and on PR but has no scheduled `cron: '0 3 * * *'` trigger. A prompt regression introduced in a Friday merge may not be detected until the following week's PR cycle. TB-181 is an XS change — add one `cron:` line to the workflow YAML and add `--output json` summary artifact.

**Deficiency:** Low-medium — creates a multi-day regression blind spot.

---

### 2.7 Static context truncation loses evidence structure (TB-192 — new)

**Gap:** When an evidence package exceeds the context-window threshold, `ContextLengthGuardAgentCompletionClient.TruncateUserPromptOnExceeded` performs hard string truncation at the token budget boundary. This can bisect JSON structures, cut evidence notes mid-sentence, or drop the most relevant tail content.

**Better approach:** Route oversized evidence through a lightweight fast-model summarization call before the primary agent call. The summarization output preserves semantic structure at a fraction of the original tokens. This is distinct from `ManifestChunkSummarizer` (which operates on manifests, not evidence bundles).

**Deficiency:** Low-medium — affects runs with large evidence packages; currently silent to the operator (only an audit event is emitted).

---

### 2.8 No prompt template content-hash pinning on runs (TB-191 — new)

**Gap:** `AgentExecutionTrace` records the template ID (e.g., `topology_v1`) but not the content hash of the actual system prompt used. If a prompt is edited without a template ID change, prior runs cannot be distinguished from post-change runs. This prevents honest prompt A/B comparison and forensic root-cause analysis of quality changes.

**Fix:** Compute a stable SHA-256 of the rendered system prompt at execution time; store on `AgentExecutionTrace` as `SystemPromptContentHash` (first 16 hex chars is sufficient for identity).

**Deficiency:** Low — quality and forensics debt; does not affect current run correctness.

---

### 2.9 No LLM provider abstraction layer (TB-193 — new)

**Gap:** `AzureOpenAiCompletionClient` is the only non-fake, non-echo production completion client. The `IAgentCompletionClient` / `ILlmProvider` interfaces are abstractable, but no factory or provider-routing layer exists. If a future decision requires Anthropic Claude (for compliance reasoning quality), Google Gemini (for cost analysis), or a locally-hosted model (for data-residency constraints), the wiring would be bespoke.

**Note (owner input needed):** Which alternative providers to support is an owner decision (see §7). The abstraction layer itself is engineering scope; the routing logic requires owner guidance on which providers to certify.

**Deficiency:** Low currently; becomes a blocker if provider diversification is needed for quality or commercial reasons.

---

### 2.10 No RAG corpus operator monitoring panel (TB-194 — new)

**Gap:** Index freshness health check (`retrieval_index_freshness`) ships in the health endpoint, but operators have no in-app panel to inspect per-corpus-kind chunk counts, last-indexed-at timestamps, embedding drift alerts, or indexer failure history. The `RetrievalCorpusFreshnessSummary` type exists but is only surfaced in health checks, not in the operator UI.

**Fix:** Expose a `GET /v1/admin/rag-health` endpoint returning per-`CorpusKind` freshness summaries, and add a collapsible panel to the operator admin section.

**Deficiency:** Low — ops and supportability gap; does not affect run quality.

---

### 2.11 No multi-turn Ask conversation context compression (TB-195 — new)

**Gap:** When an Ask conversation grows across many turns, the full conversation history is appended to the user prompt. No compression step exists for older turns. A 20-turn conversation can consume a significant fraction of the context window before the current question is even appended, reducing the space available for retrieval-augmented evidence.

**Fix:** Implement a rolling `ConversationContextCompressor` that condenses turns older than a configurable depth into a dense summary using the fast model tier, preserving key decisions and referenced finding IDs.

**Deficiency:** Low currently (most pilot conversations are short); becomes significant in heavy analyst workflows.

---

### 2.12 Findings priority re-ranker not implemented (TB-183, already tracked)

**Gap:** Operators receive an undifferentiated list of High severity findings with no business-impact ordering. TB-183 proposes `IFindingPriorityReranker` + `PriorityRank` column + `?orderBy=priority` param.

**Deficiency:** Low for AI quality specifically; higher for operator experience.

---

## 3. Scoring justification (strengths)

| Strength | Evidence |
|----------|----------|
| Azure OpenAI structured outputs with schema remediation loop | `LlmAgentSchemaCompletion` retries with schema error feedback; `json_schema` strict mode with `json_object` fallback; remediation telemetry |
| Semantic reranking | `AzureAiSearchSemanticRetrievalReranker` with lexical-overlap fallback; `archlucid.rerank.latency_ms` histogram |
| Multi-corpus RAG with strong tenant isolation | Six corpus kinds; tenant/workspace/project filters enforced at index and query; architecture guard on every `RetrievalQuery` call site |
| LLM faithfulness judge | `AgentOutputFaithfulnessEvaluator` with evidence grounding index, timeout isolation, and fail-open |
| Content safety integration | `ContentSafetyEnforcingAgentCompletionClient` on input and output; OTel metrics on block events |
| Prompt injection mitigation | `AgentEvidenceUntrustedInputSanitizer` + `AzureResourceTagPromptSanitizer` on all user-controlled string fields |
| Token budget enforcement with audit | `ContextLengthGuardAgentCompletionClient` with threshold ratio, truncation audit event, and token estimation discrepancy logging |
| IR eval harness | `eval_retrieval_ir.py` with recall@5 and MRR; golden dataset shipped (TB-049 done) |
| Embedding drift detection | `RetrievalEmbeddingDriftGuard`; dimension mismatch metric; startup validator; ContentHash skip to avoid redundant re-embeds |
| Reasoning token capture | `AzureOpenAiCompletionClient` records `ReasoningTokenCount`; o-series models compatible |
| Managed identity auth for Azure OpenAI | TB-080 done 2026-05-31; `DefaultAzureCredential` path available |

---

## 4. Trade-off summary

| Trade-off | Position taken | Consequence |
|-----------|---------------|-------------|
| Single LLM provider (Azure OpenAI) | Intentional for V1 (enterprise Azure alignment, MI auth, private endpoints) | Reduces benchmark flexibility; no model routing to Anthropic/Gemini without engineering work |
| Static evidence truncation over LLM summarization | Simpler, deterministic, lower cost | Loses evidence structure on large packages |
| Consensus-leaning Critic | Reduces false-positive noise | Reduces adversarial quality ceiling on every run |
| No streaming Ask | Simpler server-side implementation | Blank-screen latency visible in every pilot demo |
| Eval judge limited to Critic | Cost isolation | Cost and Compliance findings lack independent quality validation |
| No agentic retrieval (HyDE, multi-hop) | V2 deferred by design | Single-hop retrieval sufficient for V1 corpus sizes |

---

## 5. Cursor prompts for improvements

---

### PROMPT 1 — Streaming Ask SSE (TB-178, P0)

```
Implement streaming Ask SSE for ArchLucid following these specs:

Backend:
1. Add `AskStreamAsync(AskRequest, CancellationToken) : IAsyncEnumerable<string>` to `IAskService` and implement in `AskService` by calling `IAgentCompletionClient.StreamJsonAsync` instead of `CompleteJsonAsync`.
2. Add `POST /v1/ask/stream` endpoint in `AskController` that uses `Response.WriteAsync` with `text/event-stream` content type; emit `data: <chunk>\n\n` for each token chunk; emit `data: [DONE]\n\n` at completion.
3. Apply existing `[EnableRateLimiting("expensive")]` and `[RequiresTenantScope]` policies from the non-streaming endpoint.
4. Handle `OperationCanceledException` (client disconnect) gracefully — do not log as error.
5. Add `AskStreamIntegrationTests` using `HttpClient` with `HttpCompletionOption.ResponseHeadersRead` to verify SSE format.

Frontend (archlucid-ui):
6. Add `useAskStream(request: AskRequest)` hook: `fetch("/api/proxy/v1/ask/stream", { method: "POST", body: JSON.stringify(request) })` with `ReadableStream` parsing; expose `{ tokens: string[], isStreaming: boolean, error: Error | null }`.
7. Wire into `AskPanel`: replace the current loading spinner with incremental token rendering using a `<pre>` or `<div>` with monospace wrap; preserve the existing non-streaming fallback path under a `NEXT_PUBLIC_ARCHLUCID_ASK_STREAM_ENABLED` feature flag.
8. Add Vitest test for the hook; add Playwright test verifying tokens appear before completion.

OpenAPI and contract: Do NOT add `POST /v1/ask/stream` to the OpenAPI spec — SSE endpoints are documented separately in `API_CONTRACTS.md`.

Follow existing patterns: `ContentSafetyEnforcingAgentCompletionClient.StreamJsonAsync`, `AgentCompletionStreamingBridge`, `IAgentStreamingCompletionClient`.
```

---

### PROMPT 2 — Multi-model tiered orchestration (TB-179, P1)

```
Implement multi-model tiered orchestration for ArchLucid agent handlers:

1. Add `ModelTier` enum to `ArchLucid.Core.Configuration`: `Fast` (maps to gpt-4o-mini deployment), `Reasoning` (maps to GPT-4o deployment). Default is `Reasoning`.
2. Add config keys under `AzureOpenAI:Deployments:Fast` and `AzureOpenAI:Deployments:Reasoning` (both default to existing `AzureOpenAI:DeploymentName` for backward compat).
3. Add `IAgentTierCompletionRouter` interface with `GetClient(ModelTier) : IAgentCompletionClient` method and wire implementation in `ArchLucid.AgentRuntime`.
4. Update `AgentHandlerLlmResolution` or add `AgentTierResolution` to map:
   - `AgentType.Topology` → `ModelTier.Fast` (initial draft extraction)
   - `AgentType.Cost` → `ModelTier.Fast` (structured extraction from retail prices)
   - `AgentType.Compliance` → `ModelTier.Reasoning` (policy rule matching)
   - `AgentType.Critic` → `ModelTier.Reasoning` (adversarial review)
5. Inject `IAgentTierCompletionRouter` into each handler; replace direct `IAgentCompletionClient` injection with tier-resolved client.
6. Persist resolved `ModelTier` on `AgentExecutionTrace` as `ResolvedModelTier` (nullable string) via `AgentExecutionTraceRecorder`.
7. Update `AzureOpenAiOptionsValidator` to validate both `Fast` and `Reasoning` deployment names when configured; emit startup warning (not error) when either is missing and both map to the same deployment.
8. Add unit tests for tier resolution mapping; add `AgentTierCompletionRouterTests` for client dispatch.

Do NOT change the simulator path — `SimulatorExecutionTraceRecordingExecutor` is tier-agnostic.
Config backward compat: when `AzureOpenAI:Deployments:Fast` is absent, resolve `Fast` to the existing `AzureOpenAI:DeploymentName`.
```

---

### PROMPT 3 — Adversarial Critic prompt posture (TB-177, P0)

```
Harden the Critic agent system prompt to an adversarial challenge-first posture:

File: ArchLucid.AgentRuntime/Prompts/CriticSystemPromptTemplate.cs

1. Find the rule (approximately rule 8) that instructs the Critic to accept prior agents' outputs as a baseline or consensus. Replace it with a challenge-first posture: "Your role is to identify gaps, contradictions, and unsupported claims in the proposed architecture. Do NOT treat prior agent outputs as correct by default. Assume each claim requires independent justification."
2. Add an explicit instruction: "For each architecture decision, ask: Is there a missing failure mode, alternative that was not considered, or a claim not grounded in the supplied evidence? If so, emit a finding."
3. Keep existing JSON output schema contract unchanged — the Critic still emits `AgentResult` with `Findings[]`.
4. Add a test to `CriticAgentHandlerTests.cs` that verifies: given a mock completion that returns zero findings, the Critic is NOT scoring above the `AgentOutputQualityGate` warn threshold (i.e., an empty Critic output is treated as suspicious, not accepted). Use `AgentOutputQualityGate` + `AgentOutputEvaluationScore` directly.
5. Update `AGENT_OUTPUT_EVALUATION.md` §Critic to describe the adversarial posture and add a note that empty Critic results trigger a quality gate warning.

Do NOT change `AgentResult` schema, `CriticAgentHandler.ExecuteAsync`, or any non-prompt logic.
```

---

### PROMPT 4 — LLM judge sub-cap then extension to Cost/Compliance (TB-190, P2)

```
Extend LLM-as-judge evaluation to Cost and Compliance agents, with a dedicated budget sub-cap:

Prerequisites (implement first):
1. Add `LlmJudgeBudget` configuration section under `AgentExecution:QualityGate:Judge:DailyTokenBudget` (default: 200_000) separate from the run-execution quota.
2. Add `LlmJudgeDailyTokenTracker` implementing `ILlmJudgeBudgetTracker` — same pattern as `LlmDailyTenantBudgetTracker` but keyed on the judge client key. Register as singleton.
3. In `AgentOutputFaithfulnessEvaluator.TryEvaluateAsync`: after resolving the judge client, check `ILlmJudgeBudgetTracker.IsWithinBudget()`; if exhausted, return `null` (fail-open, emit metric `archlucid.llm.judge.budget_exhausted_total`).

Extension (implement after sub-cap):
4. Wire `AgentOutputFaithfulnessEvaluator` into `CostAgentHandler` and `ComplianceAgentHandler` execution paths — same injection pattern as the existing faithfulness call in `RealAgentExecutorSingleHandlerExecution`.
5. Add a unit test per handler verifying: faithfulness evaluator is called with the agent result JSON and evidence package; evaluator returning `null` does not fail the run.
6. Update `AGENT_OUTPUT_EVALUATION.md` to document the sub-cap and the extended judge coverage.

Telemetry: add `archlucid.llm.judge.agent_type` tag to existing judge call metrics.
Do NOT share the judge budget with run-execution budgets (`LlmDailyTenantBudgetTracker`).
```

---

### PROMPT 5 — Calibrated agent confidence (TB-180, P1)

```
Implement calibrated agent confidence for AgentOutputQualityGate:

1. Add interface `IAgentConfidenceCalibrator` to `ArchLucid.Core.AgentEvaluation`:
   - `CalibrateAsync(AgentType, double rawStructuralScore, double rawSemanticScore, CancellationToken) : Task<double?>`
   - Returns null when fewer than `MinDataPoints` (default: 20) observations exist for this agent type.

2. Add `SqlAgentConfidenceCalibrator` implementing `IAgentConfidenceCalibrator`:
   - Reads the last N accepted/rejected outcomes per `AgentType` from `dbo.AgentExecutionTraces` (where `QualityGateOutcome` is not null).
   - Fits a piecewise-linear calibration map from (raw composite score) → (empirical pass rate). "Composite" = 0.5 × structural + 0.5 × semantic.
   - Returns calibrated score clamped to [0, 1].
   - Results are cached in `IMemoryCache` for 15 minutes per agent type (cache key: `confidence_calibrator:{agentType}`).

3. Add `CalibratedConfidence` nullable double column to `dbo.AgentResults` (DbUp migration + `Scripts/ArchLucid.sql` update).

4. In `RealAgentExecutorSingleHandlerExecution`, after `AgentOutputQualityGate.Evaluate`:
   - Call `IAgentConfidenceCalibrator.CalibrateAsync` with raw scores.
   - If non-null, store `CalibratedConfidence` on the persisted `AgentResult`.
   - Pass `calibratedConfidence` to `AgentOutputQualityGate.Evaluate` override that accepts it.

5. Fail-open: if calibrator throws or returns null, use raw scores unchanged. Never fail the run.

6. Add unit tests: calibrator with < 20 data points → returns null; with ≥ 20 data points → returns calibrated score within [0, 1]; cache hit avoids DB call.

7. Add architecture test: `AgentConfidenceCalibratorDependencyTests` — calibrator must not take a dependency on `IAgentCompletionClient` (avoid circular judge-calibrator LLM calls).
```

---

### PROMPT 6 — Nightly eval harness cron (TB-181, P1)

```
Add nightly schedule trigger to the template eval harness CI workflow:

File: .github/workflows/template-eval-harness.yml

1. Add `schedule: - cron: '0 3 * * *'` trigger alongside existing `workflow_dispatch` and `pull_request` triggers.
2. Add an `--output-json results/nightly-eval-summary.json` flag to the harness invocation step (or use `--output json` if the script already supports it).
3. Upload the summary artifact: `uses: actions/upload-artifact@v4` with `name: nightly-eval-summary`, `path: results/nightly-eval-summary.json`, `retention-days: 30`.
4. Add a Slack notification step (use existing Slack webhook secret reference `secrets.SLACK_WEBHOOK_URL`) that fires on failure only (`if: failure()`), posting the failed scenario count from the JSON summary.
5. Document in `docs/engineering/BUILD.md` §Scheduled CI: "Nightly eval harness runs at 03:00 UTC on main. Artifacts retained 30 days."

Do NOT change the harness script logic or scoring thresholds.
```

---

### PROMPT 7 — Dynamic evidence summarization before context overflow (TB-192, new)

```
Implement LLM-based evidence summarization when evidence exceeds context budget:

New file: ArchLucid.AgentRuntime/EvidenceSummarizationService.cs

1. Define `IEvidenceSummarizationService` interface:
   - `SummarizeAsync(AgentEvidencePackage, int targetMaxTokens, AgentType, CancellationToken) : Task<string>`
   - Returns a compressed evidence text string that fits within `targetMaxTokens`.

2. Implement `EvidenceSummarizationService`:
   - Use the `ModelTier.Fast` client (via `IAgentTierCompletionRouter`).
   - System prompt: "You are a lossless evidence compressor for architecture analysis. Preserve all named services, cost figures, policy rule IDs, finding IDs, and constraint labels. Remove duplicate sentences and boilerplate. Output dense plain text."
   - User prompt: evidence package serialized as text (use `AgentEvidenceGroundingIndex.Build(evidence).FullBlob`).
   - Cap summarization at `SummarizationOptions.MaxInputCharacters` (default: 128_000).
   - Return original evidence string if fast-model call fails (fail-open).

3. In `ContextLengthGuardAgentCompletionClient`: when `TruncateUserPromptOnExceeded=true` and `SummarizationOptions.Enabled=true`, attempt `IEvidenceSummarizationService.SummarizeAsync` before falling back to hard truncation. Emit `AuditEventTypes.LlmEvidenceSummarized` (add to audit catalog).

4. Add `SummarizationOptions` configuration class (`AgentExecution:EvidenceSummarization:Enabled`, `MaxInputCharacters`). Default `Enabled=false` (opt-in).

5. Add unit tests: summarization service called when evidence exceeds threshold; fail-open on service exception; audit event emitted.

6. Add architecture test: `EvidenceSummarizationServiceDependencyTests` — summarization service must only depend on `IAgentTierCompletionRouter` (no circular dependencies via quality gate or faithfulness evaluator).
```

---

### PROMPT 8 — Prompt template content-hash pinning on runs (TB-191, new)

```
Add system prompt content-hash to AgentExecutionTrace for prompt forensics:

1. Add `SystemPromptContentHash` (string, nullable, max 32 chars) column to `dbo.AgentExecutionTraces` (DbUp migration + `Scripts/ArchLucid.sql` update).

2. In `AgentExecutionTraceRecorder.RecordAsync` (or wherever the trace is built), compute SHA-256 of the rendered system prompt string; store the first 16 hex characters as `SystemPromptContentHash`. Use `System.Security.Cryptography.SHA256.HashData(Encoding.UTF8.GetBytes(systemPrompt))`.

3. Surface `SystemPromptContentHash` in `AgentExecutionTraceDto` (API response for the trace endpoint). Add to OpenAPI snapshot + codegen.

4. Add unit test: two identical system prompts produce the same hash; one-character difference produces a different hash.

5. Document in `AGENT_TRACE_FORENSICS.md` §Prompt identity: "SystemPromptContentHash allows operators to verify whether a prompt template change occurred between two runs. Match on hash + TemplateId for exact reproducibility."

Do NOT store the full system prompt in the trace row — content-hash only.
```

---

### PROMPT 9 — LLM provider abstraction scaffold (TB-193, new)

> **PQ-CEAT-01 resolved (2026-06-02):** Build the scaffold only. No non-Azure provider certifications for V1 or V1.1. Concrete provider implementations (Anthropic, Gemini, Ollama) are V2 candidates requiring a separate owner ADR. The scaffold has standalone value as an interface decoupling layer.

```
(Scaffold only — implement provider factory after owner confirms provider list)

Introduce ILlmProviderFactory to ArchLucid.Core.Llm:

1. Define `ILlmProviderFactory` interface:
   - `CreateClient(LlmProviderDescriptor) : IAgentCompletionClient`
   - `SupportedProviders : IReadOnlyList<LlmProviderDescriptor>`

2. Register `DefaultLlmProviderFactory` (returns existing `AzureOpenAiCompletionClient`) as default.

3. Add `LlmProviderDescriptor.ProviderType` enum field: `AzureOpenAi`, `Anthropic`, `GoogleGemini`, `LocalOllama`, `Unknown`.

4. Architecture test: `LlmProviderFactoryDependencyTests` — factory must not take a direct dependency on `AzureOpenAiCompletionClient` (use interface); provider creation must be testable with fake descriptors.

5. Document in ADR 0005 addendum: provider factory is the extension point for future non-Azure providers; all new providers must pass content-safety and budget-gate requirements before registering.

(Concrete provider implementations — Anthropic, Gemini — require separate PRs after owner selects providers.)
```

---

### PROMPT 10 — RAG corpus operator monitoring panel (TB-194, new)

```
Add a RAG corpus health endpoint and operator UI panel:

Backend:
1. Add `GET /v1/admin/rag-health` endpoint in a new `RagHealthController` (Admin tier, `[RequiresAdminRole]`). Returns:
   {
     "corpora": [
       { "corpusKind": "PolicyPack", "chunkCount": 1240, "lastIndexedAt": "2026-06-01T03:00:00Z", "embeddingDimension": 1536, "isStale": false },
       ...
     ],
     "embeddingDriftAlert": false,
     "indexerLastFailure": null
   }
2. Implement `IRagCorpusHealthService` reading from `RetrievalCorpusFreshnessSummary` (already exists) and the in-memory or Azure AI Search catalog.
3. Add OpenAPI spec entry; add contract snapshot test.

Frontend (archlucid-ui):
4. Add `/admin/rag-health` page in the operator admin section.
5. Render a table: CorpusKind | Chunk Count | Last Indexed At | Embedding Dim | Stale? with color-coded Stale indicator (amber: > 24h; red: > 72h or drift alert).
6. Add a "Trigger reindex" button per corpus kind calling `POST /v1/admin/rag-health/{corpusKind}/reindex` (implement endpoint as a no-op stub returning 202 for now; wire to actual reindex in a follow-on PR).
7. Add Playwright smoke test for the page (verify table renders with at least one row).

Rate limiting: apply `"fixed"` rate limiter on the endpoint.
```

---

### PROMPT 11 — Multi-turn Ask conversation context compression (TB-195, new)

```
Implement conversation context compression for long Ask sessions:

New file: ArchLucid.Application/Ask/ConversationContextCompressor.cs

1. Define `IConversationContextCompressor` interface:
   - `CompressAsync(IReadOnlyList<ConversationMessage> history, int maxTurnsToKeepVerbatim, CancellationToken) : Task<CompressedConversationContext>`
   - `CompressedConversationContext` contains: `string CompressedSummary` + `IReadOnlyList<ConversationMessage> RecentVerbatim`

2. Implement `ConversationContextCompressor`:
   - Keep the last `maxTurnsToKeepVerbatim` (default: 4) turns verbatim.
   - Compress older turns: system prompt to fast-model: "Summarize this conversation history. Preserve all finding IDs, decision names, numeric values, and open questions. Output dense plain text < 500 words."
   - Fail-open: if compression fails, return all verbatim turns with a warning log.

3. In `AskService.AskAsync`: after loading conversation history, if `history.Count > ConversationContextOptions.MaxVerbatimTurns` (default: 6), call compressor; prepend compressed summary as a synthetic assistant context message.

4. Add `ConversationContextOptions` config class (`Ask:ConversationContext:MaxVerbatimTurns`, `CompressionEnabled`). Default `CompressionEnabled=false` (opt-in).

5. Add unit tests: compressor called when history exceeds threshold; summary is prepended to subsequent prompt; fail-open on compressor error.

6. Add integration test: 10-turn conversation with compression enabled; verify final prompt fits within token budget.
```

---

## 6. Items fully deferred (not scored against V1 headline)

| Item | Reason | Tracking |
|------|--------|----------|
| Graph-RAG over provenance graph | V2 by design; V1 RAG foundation must prove insufficient first | `V1_DEFERRED.md` §6q, RAG-V2-001 |
| Agentic retrieval (HyDE, query rewrite, multi-hop) | V2 by design; extra LLM hops require budget and eval gate | `V1_DEFERRED.md` §6q, RAG-V2-002 |
| Online fine-tuning on accepted manifests | V2; requires DPA + owner ADR | `V1_DEFERRED.md` §6q, RAG-V2-003 |
| MCP inbound server | V1.1 by design | `V1_DEFERRED.md` §6d |
| Cross-tenant pattern library (ADR 0031) | V1.1 | RAG-V1.1-004 |
| Pilot-feedback retrieval for planning materialize | V1.1 | RAG-V1.1-003 |

---

## 7. Pending questions — RESOLVED (2026-06-02, judgment applied)

All three questions are resolved by applying first-principles reasoning against the repo's Azure-native mandate, existing budget patterns, and CI philosophy.

| ID | Question | Decision | Reasoning |
|----|----------|----------|-----------|
| PQ-CEAT-01 | Which alternative LLM providers to certify for TB-193? | **Build scaffold only; no non-Azure provider certifications for V1 or V1.1.** Concrete provider implementations are V2 candidates requiring a separate owner ADR. | The repo's Azure-native mandate (ADR 0020, user rules) is unambiguous. Azure OpenAI already covers the required model portfolio (gpt-4o-mini, GPT-4o, o-series). The scaffold has standalone value as an interface decoupling layer regardless of whether a second provider is ever added. **TB-193 DEFERRED label removed — scaffold can proceed without owner input.** |
| PQ-CEAT-02 | Should `EvidenceSummarizationService` (TB-192) count against tenant quota or have its own sub-cap? | **Count against the tenant run-execution quota (`LlmDailyTenantBudgetTracker`).** No separate sub-cap. | Evidence summarization is pre-processing causally triggered by the run. It belongs to run economics, not to a parallel quality path. The LLM judge gets a separate sub-cap because it is POST-processing quality assurance that runs independently of run execution cost. Adding a third sub-cap for summarization adds accounting complexity without a clear benefit. Heavy evidence packages driving high summarization cost is a legitimate signal within the tenant's run budget. |
| PQ-CEAT-03 | Should nightly eval harness failure block releases or send notification only? | **Notification-only for V1.** Promote to a floor-ratchet blocking gate in V1.1 once baseline metrics are stable for two consecutive weeks. | Nightly runs depend on LLM responses with `temperature > 0`; false blocking on model variance would create unpredictable gates unlinked to code changes. The PR-time harness is the correct blocking gate. The V1.1 coverage ratchet pattern (`assert_coverage_floor_ratchet.py`) is the right model to follow — documented in `V1_DEFERRED.md` §4. |

---

## 8. Summary table

| Rank | Improvement | Tracked As | Priority | Size | Owner Input? |
|------|-------------|-----------|---------|------|-------------|
| 1 | Streaming Ask SSE | TB-178 | P0 | M | No |
| 2 | Multi-model tiered orchestration | TB-179 | P1 | M | No (resolved PQ-AI-04) |
| 3 | Adversarial Critic prompt posture | TB-177 | P0 | S | No |
| 4 | LLM judge sub-cap + Cost/Compliance extension | TB-190 | P2 | M | No (resolved PQ-AI-02) |
| 5 | Calibrated agent confidence | TB-180 | P1 | M | No |
| 6 | Nightly eval harness cron | TB-181 | P1 | XS | No (PQ-CEAT-03 resolved: notification-only V1) |
| 7 | Dynamic evidence summarization | TB-192 | P1 | M | No (PQ-CEAT-02 resolved: tenant quota) |
| 8 | Prompt template content-hash pinning | TB-191 | P2 | S | No |
| 9 | LLM provider abstraction scaffold | TB-193 | P2 | M | No (PQ-CEAT-01 resolved: scaffold only, V2 for providers) |
| 10 | RAG corpus operator monitoring panel | TB-194 | P2 | S–M | No |
| 11 | Multi-turn Ask context compression | TB-195 | P2 | M | No |
| 12 | Findings priority re-ranker | TB-183 | P2 | M | No |

---

*Assessment produced: 2026-06-02. Scoring boundary: `Assessment-Scope-V1_1.mdc`. Items deferred to V1.1, V2, or owner-only action do not reduce the headline score of 75.*
