> **Scope:** One-shot prompt pack for an external model (e.g., Claude Sonnet) to review ArchLucid’s **AI/agent path** from code and docs; **not** a buyer-facing product doc or a substitute for human release sign-off.

> **Spine doc:** [`START_HERE.md`](../START_HERE.md).

# Sonnet brief — ArchLucid AI functionality review

**Audience:** You are reviewing the **ArchLucid** repository. Ground every answer in **committed code and docs**. If something is unspecified, say so. Be skeptical of positioning language; treat **real-model output quality and enforcement** as the primary risk.

---

## How to use this brief

1. Open the **minimum first pass** paths below, then widen to the full **primary reading list** as needed.
2. Answer the **questions** in order, or produce a short executive summary plus a table: *Question → Finding → File evidence → Severity (blocker / gap / OK)*.
3. Call out **contradictions** between docs (for example `docs/library/AGENT_OUTPUT_EVALUATION.md` vs defaults in `ArchLucid.Api/appsettings*.json`).

---

## Context (from internal readiness assessment)

- Simulator and structural/semantic evaluation give **deterministic** offline signal; **buyer risk** is **real-mode** LLM correctness, explainability, and whether **quality gates** are **warn-only** vs **blocking**.
- **`EnforceOnReject` + `BlockRunOnReject`** on **Staging/Production** API profiles **do** abort execute with **`ExecutionCompletedQualityRejected`** and **HTTP 409**; refine **problem-details / support hints** and **release-grade real-mode evidence** expectations as needed.

---

## Minimum first pass

- `docs/library/AGENT_OUTPUT_EVALUATION.md`
- `ArchLucid.AgentRuntime/Evaluation/AgentOutputEvaluationRecorder.cs`
- `ArchLucid.AgentRuntime/RealAgentExecutor.cs`
- `ArchLucid.AgentRuntime/AzureOpenAiCompletionClient.cs`
- `scripts/ci/eval_agent_corpus.py`

## Primary reading list

**Core runtime and LLM path**

- `ArchLucid.AgentRuntime/RealAgentExecutor.cs`
- `ArchLucid.AgentRuntime/AzureOpenAiCompletionClient.cs`
- `ArchLucid.AgentRuntime/FallbackAgentCompletionClient.cs`
- `ArchLucid.AgentRuntime/CircuitBreakingAgentCompletionClient.cs`
- `ArchLucid.AgentRuntime/LlmCallResilienceDefaults.cs`
- `ArchLucid.AgentRuntime/AgentResultParser.cs`
- `ArchLucid.AgentRuntime/Evaluation/AgentOutputEvaluationRecorder.cs`
- `ArchLucid.AgentRuntime/Evaluation/AgentOutputSemanticEvaluator.cs`
- `ArchLucid.AgentRuntime/Evaluation/AgentOutputQualityGateRejectedException.cs`

**Prompts and trace**

- `ArchLucid.AgentRuntime/Prompts/` *(system prompt templates, canonical hasher, cached catalog)*
- `ArchLucid.AgentRuntime/AgentExecutionTraceRecorder.cs`
- `docs/library/AGENT_OUTPUT_EVALUATION.md`
- `docs/library/AGENT_TRACE_FORENSICS.md`

**Safety, cost, cache**

- `ArchLucid.AgentRuntime/Safety/*.cs`
- `ArchLucid.AgentRuntime/CostGuardrailInterceptor.cs`, `*BudgetTracker*.cs`, `*Quota*.cs`
- `ArchLucid.AgentRuntime/Caching/*.cs` *(LLM response cache keying)*

**Simulator and eval automation**

- `ArchLucid.AgentSimulator/Services/DeterministicAgentSimulator.cs`
- `scripts/ci/eval_agent_corpus.py`
- `tests/eval-corpus/` *(manifest, scenarios, recordings)*
- `docs/library/AGENT_EVAL_CORPUS.md`

**Release / operator evidence**

- `docs/quality/REAL_LLM_RUN_EVIDENCE_TEMPLATE.md`
- `docs/quality/MANUAL_QA_CHECKLIST.md` *(agent / real-mode sections)*
- `schemas/agentresult.schema.json`

**Orchestration hook (where enforcement would surface)**

- Search for `IAgentOutputTraceEvaluationHook`, `AfterSuccessfulExecuteAsync`, `ArchitectureRunExecuteOrchestrator`, and registrations of `AgentOutputEvaluationRecorder`.

---

## Known doc anchors (verify in code)

Structural evaluation checks **AgentResult-shaped JSON**. Semantic evaluation is **deterministic** (no embedding LLM in the documented path): e.g., claims scored partly on **`evidenceRefs` / `evidence`**, findings on **severity/description/recommendation** length — see **`docs/library/AGENT_OUTPUT_EVALUATION.md`**. **Base `appsettings.json`** omits **`ArchLucid:AgentOutput:QualityGate`** (CLR defaults: **`EnforceOnReject` / `BlockRunOnReject` false**, **`Mode` WarnOnly**). **`appsettings.Staging.json` / `appsettings.Production.json`** use **`PilotStrict`** with **`EnforceOnReject` / `BlockRunOnReject` true**; **`appsettings.Development.json`** keeps blocking off.

---

## Questions for Sonnet

### A. Enforcement and buyer-visible behavior

1. When **`AgentOutputQualityGateOptions.EnforceOnReject`** is **`true`**, what is the end-to-end effect on **manifest commit**, **run status**, and **persisted traces/findings**? Who catches **`AgentOutputQualityGateRejectedException`**?
2. With **`EnforceOnReject` false**, can **weak or empty** semantic output still yield a **successful** pilot run while only emitting metrics/logs? Quote the exact persistence or UI surfaces that expose **warn vs reject**.
3. Should **reject thresholds** differ per **`agent_type`** (Topology vs Critic vs Compliance)? Does the implementation support that?

### B. Real mode vs simulator and degradation

4. Trace **`ModelDeploymentName` / simulator sentinels** — how does the product distinguish **simulator**, **real**, and **fallback** paths in persisted traces and in **buyer-visible** summaries?
5. Can a single run combine **real** completions for some agents and **fallback/simulator** for others **without** a clear degraded label? Prove or disprove from **`RealAgentExecutor`** / **`FallbackAgentCompletionClient`** / **`CircuitBreakingAgentCompletionClient`**.

### C. Parsing, schema, and “looks valid but wrong”

6. **`AgentResultParser`** and **`schemas/agentresult.schema.json`** — how are **MALFORMED_JSON** outcomes handled, remediation limits, and **audit** emission?
7. What failure modes bypass structural checks (e.g., **present keys**, **empty** `description`/`recommendation` that still satisfies length heuristics)?

### D. Semantic “quality” interpretability for buyers

8. What exactly does **`archlucid_agent_output_semantic_score`** measure? Would a **busy buyer** misunderstand it as embedding similarity or “truth”?
9. Is there automated **faithfulness-to-manifest** verification beyond **evidence refs** on claims?

### E. Corpus and CI gates

10. **`scripts/ci/eval_agent_corpus.py`** with **`--markdown-report`** and **`--enforce-quality-gate`** — what **exactly** is gated in **credential-free CI** vs what **requires** real Azure OpenAI env vars?
11. **`tests/eval-corpus`** — list **coverage gaps**: missing adversarial scenarios (hallucination, citation mismatch, contradictory manifest, oversized context).

### F. Tenant isolation and cache

12. **`LlmCompletionCacheKey`** / fingerprinting — tenant id, deployment id, prompt version: what prevents **wrong-tenant cache hits** after deploy or prompt change?
13. Where is **single source of truth** for **tenant scope** across agent execution vs trace persistence vs evaluation?

### G. Safety, abuse, secrets

14. **`AzureContentSafetyGuard`** / **unconfigured safety** — **fail-open** or **fail-closed**?
15. Where does **prompt / context redaction** run relative to **`AzureOpenAiCompletionClient`** persistence and logs?

### H. Cost and fairness

16. **`CostLimitExceededException`** — user-visible narrative, partial persistence, recovery?
17. Are budget trackers **per-process** only or durable? Implications for **multi-replica** workers.

### I. Observability and silent failure

18. **`archlucid_agent_output_parse_failures_total`**, **`archlucid_agent_trace_blob_upload_failures_total`**, **`archlucid_agent_output_quality_gate_total`** — when incremented, does evaluation still proceed on truncated data?
19. Any **explainability API** routes that still return **501**, **pending**, or **empty** payloads under **production OpenAPI**?

### J. One experiment before first customer real-mode pilot

20. Describe **one** minimal **stress test** (inputs, steps, metrics to capture) and **pass/fail** criteria that operationalize release posture from **`docs/library/AGENT_OUTPUT_EVALUATION.md`** without inventing thresholds the repo does not define.

---

## Deliverable shape (requested)

Prefer this output structure:

1. **Executive summary** (five bullets max): biggest AI risks and whether code mitigates them.
2. **Findings table** (*Severity | Area | Evidence (path:line or section) | Recommendation*).
3. **Unresolved / product-owned** decisions (anything that requires business policy, not code archaeology).
