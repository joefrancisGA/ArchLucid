> **Scope:** Independent first-principles quality assessment — AI/Agent Readiness dimension only. No prior assessment referenced. Scored against the canonical quality model (`ASSESSMENT_QUALITY_MODEL.md`) with deferred items excluded per `Assessment-Scope-V1_1.mdc` and `V1_DEFERRED.md`.

# AI/Agent Readiness — Solution Quality Assessment
## Score: 72/100 — Weighted Contribution: 12.80%

**Assessment date:** 2026-06-01  
**Assessor:** Independent (Cursor agent)  
**Scope:** AI/Agent Readiness quality dimension only (weight 8 of 45 total)  
**Weighted contribution formula:** `score × weight / total weight = 72 × 8 / 45 = 12.80`

---

## Definition Under Assessment

> **AI/Agent Readiness (weight 8):** Operational readiness of the agent system: deterministic orchestration, real/simulator separation, schema enforcement, quality gates, budget controls, fallback behavior, and observability around agent output quality.

---

## Executive Summary

The ArchLucid agent pipeline has sophisticated infrastructure — circuit-breaker-wrapped LLM calls, per-agent-type quality gates with configurable blocking, JSON schema enforcement, RAG retrieval with IR eval harness, faithfulness evaluation, and a professional observability stack. The *architecture* of AI/Agent readiness is strong.

The commercial problem is narrower and more damaging: **the current pilot posture is SIMULATOR_ONLY**. The example `ai-readiness-posture.json` in the codebase shows all four agent paths (Topology, Cost, Compliance, Critic) in simulator mode, the real-mode CI quality gate is still `continue-on-error: true`, and four owner-credentialed backlog items (TB-137, TB-139, TB-140, and real-mode evidence gate) remain open. A buyer who asks "have you validated this against a real LLM?" gets an honest but uncomfortable answer.

The second material gap is that 15 operator-facing AI leverage items identified in `AI_LEVERAGE_ROADMAP.md` (batch A through D, written 2026-05-20) are design-documented but unimplemented. The Critic prompt is still consensus-leaning. Streaming Ask does not exist. There is no multi-model tiered routing. Agent confidence scores fed into quality gates are raw and uncalibrated. These do not violate the formal quality-model definition (which focuses on pipeline infrastructure), but they define the ceiling of real operational usefulness.

Score: **72/100**. Infrastructure is production-grade; execution evidence is pre-production.

---

## Sub-Dimension Scores

| Sub-dimension | Score | Weight (relative) | Notes |
|---|---:|---|---|
| Schema enforcement | 88 | Medium | JSON schema on parse, structured outputs optional, startup advisory when disabled, merge-blocking CI contract tests |
| Budget controls | 82 | Medium | Monthly dollar budget, token quotas, cost estimator, negative-rate guard (TB-026 shipped), circuit breaker |
| Fallback behavior | 79 | Medium | Retrieval fail-open, explanation fallback on low faithfulness, budget-exhausted graceful degradation |
| Deterministic orchestration | 76 | High | Pipeline well-architected; INV-002 / INV-004 / INV-012 / INV-013 (Invariant Wave B/C, TB-011/TB-012) open; provenance forensics gaps TB-034–038 open |
| Quality gates | 73 | High | Per-agent-type blocking floors excellent; judge covers only Topology + Critic; calibrated confidence not implemented; automatic retry V1.1-deferred |
| Observability around agent quality | 70 | High | Metric instrumentation solid (structural, semantic, faithfulness histograms, gate counter); real-mode metrics absent while simulator-only; AI quality dashboard deferred to V1.1; nightly eval harness cron not yet wired |
| Real/simulator separation | 55 | High | INV-002 partially enforced; real-mode CI gate `continue-on-error: true`; current release SIMULATOR_ONLY; quad-agent live evidence (TB-137) open |

**Composite: 72/100** (weighted average across sub-dimensions above, with "High" relative weight items dominating).

---

## What Is Working Well (Do Not Break)

1. **LLM completion pipeline (ADR 0005):** `CircuitBreaking(Caching(LlmCompletionAccounting(AzureOpenAi)))` ordering is correct and scoped. The `AsyncLocal` scope push on parallel agent batches is the right pattern for thread-pool accounting.

2. **Per-agent-type quality floors:** Topology 0.85/0.65, Compliance 0.80/0.60, Cost 0.75/0.55, Critic 0.65/0.50 structural/semantic floors in `appsettings.Staging.json` / `appsettings.Production.json` with `Mode: PilotStrict` and `BlockRunOnReject: true`. This is commercially defensible.

3. **RAG foundation (RAG-V1-000 through RAG-V1-011):** The retrieval corpus seam (`CorpusKind`), policy-pack indexer, prior-manifest retrieval, platform-doc corpus, retrieval grounding trace with forensic enrichment, embedding drift guard, content-hash skip, chunking fingerprints, tenancy isolation hardening, and IR eval harness (recall@5, MRR) — all shipped per `RAG_QUALITY_TECHNICAL_BACKLOG.md` status fields. This is a proper retrieval stack, not bolt-on.

4. **Prompt regression baselines:** Committed golden fixtures for all four agent types, merge-blocking Python assertion script, contract test suite. Regression surface is covered for structural and semantic dimensions.

5. **Explainability infrastructure:** `ExplainabilityTrace` with 5 fields, `ExplainabilityTraceCompletenessAnalyzer`, per-finding inspector API, citation-bound rendering, aggregate faithfulness checker with OTel metric and fallback budget alert. The OTel SLO rule `ArchLucidExplanationFaithfulnessFallbackBudgetExceeded` is a mature production pattern.

6. **Faithfulness report:** 25-case golden dataset, positive readiness support ratio 0.9688, with negative-control detector at 0.6667. The distinction between readiness cases and negative-control cases in the report is methodologically sound.

7. **Prompt injection mitigations:** `DefaultRequestContentSafetyPrecheck`, `PromptFieldRedactor`, deterministic regression tests under `tests/eval-datasets/prompt-injection/`. Retrieved content is data, not instructions — enforced in MCP planning (`MCP_AND_AGENT_ECOSYSTEM_BACKLOG.md` §3).

8. **`AgentTask.AllowedTools` runtime enforcement (TB-082):** `AgentTaskAllowedToolsDispatchGuard` at dispatch, shipped 2026-05-31. Previously advisory-only — this was a real gap that is now closed.

---

## Areas Requiring Improvement (Most Deficiency First)

### 1. Real/Simulator Separation — CI Gate Is Warn-Only (Deficiency: 45 pts × High weight)

**The problem:** The quality gate CI job runs with `continue-on-error: true`. The `eval_agent_corpus.py --baseline` step uploads a scorecard artifact but never fails a PR. Real-mode evidence (TB-137: quad-agent live pipeline, TB-139: token usage in gate metrics, TB-140: real-mode eval corpus) is entirely absent from current release artifacts. The pilot `ai-readiness-posture.json` example in the codebase uses `overallReadinessLevel: SIMULATOR_ONLY`. Sponsor materials from the current release "must use simulator-only claim language" per the document itself.

**Why it matters commercially:** A buyer who has reviewed an AI/Agent Readiness claim will ask for the real-mode evidence artifact. If the answer is "we have simulator-only validation," that is an honest but credibility-limiting position. For an AI architecture governance product specifically, buyers will hold the vendor to a higher AI quality bar than they would a general SaaS.

**What needs to happen:** The owner must run the quad-agent pipeline against a real Azure OpenAI deployment, commit the resulting `real-llm-evidence-gate.json`, then the CI gate step can be flipped from `continue-on-error: true` to enforcing. This is not a Cursor code task — it requires credentials and human judgment.

**Requires owner action.** See `PENDING_QUESTIONS.md` follow-up below.

---

### 2. Critic Prompt Is Consensus-Leaning — Output Quality Ceiling Is Capped (Deficiency: 35 pts × High weight)

**The problem:** `CriticSystemPromptTemplate.cs` rule 8 currently says: *"Prefer conservative, review-oriented findings."* This is the wrong posture for a Critic agent. The Critic should challenge, not affirm. The result is a Critic that rarely disagrees with Topology/Cost/Compliance agents, which means the four-agent pipeline effectively has three agreeing agents and one mildly skeptical one. The AI Leverage Roadmap (#6) identifies this and proposes a direct fix.

**Trade-off:** More adversarial Critic output increases the probability of false-positive disputed findings. Operators may initially distrust a Critic that flags disagreements more aggressively. This is a short-term friction cost with a long-term quality gain.

**Cursor prompt (implement now — single file change):**
```
Update CriticSystemPromptTemplate.cs. Replace rule 8 ("Prefer conservative, review-oriented findings") with:
"8. You MUST challenge the other agents' implied decisions. For each claim or proposed component you disagree with or find under-justified, emit a finding with category: 'Critic', severity: 'High' or 'Medium', and a message that states explicitly what you dispute and why. Do not emit a finding if you agree — silence is endorsement."
Add a new rule: "9. If any Topology, Cost, or Compliance proposal conflicts with the request's explicit constraints, emit a 'Critical' severity finding citing both the constraint and the conflicting proposal."
Update CriticAgentHandlerTests.cs to add a test case verifying that a scenario with an explicit constraint violation produces at least one High or Critical Critic finding.
```

---

### 3. No Streaming Ask (SSE) — Blank-Screen Latency Tax on Every Query (Deficiency: 28 pts × Medium weight)

**The problem:** Every Ask query blocks until the full LLM response is ready. For a product whose key differentiator is AI-assisted architecture review, this creates a "loading spinner" experience at the most trust-sensitive moment — when a pilot sponsor is watching. The LLM client already yields tokens; SSE is a controller-level addition with no new infrastructure.

**Trade-off:** SSE requires careful error propagation at the controller layer and a ReadableStream consumer in the UI. Token-by-token rendering in react-markdown with streaming can produce visual noise if markdown parsing is not handled incrementally. Use a buffered approach (flush every 20ms or per complete word) rather than per-raw-token.

**Cursor prompt:**
```
Add a new endpoint POST /v1/ask/stream to AskController.cs that returns a chunked SSE response (Content-Type: text/event-stream). In AskService.cs, add a new method AskStreamAsync(AskRequest, ScopeContext, CancellationToken) that yields IAsyncEnumerable<string> tokens by configuring IAgentCompletionClient to stream (pass stream: true in the AOAI request). Write each token as a SSE data: line directly to HttpResponse.Body. In archlucid-ui, add a useAskStream() hook that consumes the SSE stream using the Fetch API (ReadableStream) and appends tokens to state so they render incrementally in the Ask panel using the existing react-markdown component. Buffer partial tokens within a 20ms flush window to avoid per-character re-renders.
```

---

### 4. Multi-Model Tiered Orchestration Missing — Single Model for All Task Complexity Levels (Deficiency: 25 pts × Medium weight)

**The problem:** Every agent task — from complex Topology graph analysis to simple output formatting — uses the same Azure OpenAI deployment. This is both a cost inefficiency (formatting tasks cost the same as reasoning tasks) and a quality inefficiency (the fastest/cheapest model is perfectly adequate for non-reasoning work). The `DefaultAgentExecutorResolver` and `IAgentCompletionClient` are already the correct seams.

**Trade-off:** Adds configuration surface (two deployment names vs one). If `AgentRuntime:ModelTiers:Fast` is not set, it must fall back gracefully to `Reasoning` — backward compatibility is non-optional.

**Cursor prompt:**
```
Add a ModelTier enum (Reasoning, Fast) to ArchLucid.Contracts/Common/. Add a property ModelTier ModelTier to AgentTask (default Reasoning). In AgentTaskFactory, assign ModelTier.Fast to formatting, parsing, and schema-remediation tasks; ModelTier.Reasoning to Topology, Compliance, Cost, and Critic agent tasks. Update IAgentCompletionClient and its Azure OpenAI implementation to accept an optional ModelTier parameter and resolve the deployment name from a new config block AgentRuntime:ModelTiers:Reasoning (default: existing deployment) and AgentRuntime:ModelTiers:Fast (default: same as Reasoning so existing config is backward compatible). Log the resolved deployment name in the AgentExecutionTrace.
```

---

### 5. Uncalibrated Agent Confidence Feeding Quality Gates — Gate Is Partially Cosmetic (Deficiency: 22 pts × Medium weight)

**The problem:** `AgentOutputQualityGateOptions` uses raw LLM confidence scores in gate thresholds. Raw model confidence is systematically overconfident on categories where the model has surface-level plausibility but shallow grounding. The `AgentOutputEvaluator` and `AgentOutputSemanticEvaluator` already produce ground-truth structural/semantic scores that could calibrate the raw confidence. Without calibration, confidence thresholds in the gate configuration are guesses, not empirically grounded floors.

**Trade-off:** A calibration service requires historical `(rawConfidence, semanticScore)` pairs. In a new deployment with few runs, the calibrator has no data and must fall back to raw confidence. The implementation must be fail-open: if insufficient data, return raw confidence unchanged.

**Cursor prompt:**
```
Create a new service IAgentConfidenceCalibrator in ArchLucid.Application/Agents/. It should load the last N (configurable, default 200) (rawConfidence, semanticScore) pairs from dbo.AgentOutputEvaluations per AgentType. Fit a monotonic piecewise-linear approximation (no ML library required: sort pairs by rawConfidence, compute cumulative averages at quantile breakpoints). Expose a CalibrateAsync(AgentType, double rawConfidence) -> double method with a fallback to raw confidence when fewer than 20 data points exist. Call it in the post-execution path after AgentOutputEvaluator runs, writing the calibrated confidence to a new column CalibratedConfidence (float, nullable) on dbo.AgentResults via a DbUp migration. Surface CalibratedConfidence in the AgentResult API response and use it (when not null) in place of raw confidence in AgentOutputQualityGate threshold comparisons.
```

---

### 6. Template Eval Harness Has No Nightly Schedule — Regression Window Is Days, Not Hours (Deficiency: 20 pts × Medium weight)

**The problem:** The template eval harness exists and scores committed simulator `AgentResult` JSON. But per `AI_LEVERAGE_ROADMAP.md` #15, the nightly CI trigger has not been wired. A model drift or prompt-change regression sits undetected until the next PR that happens to run the harness manually. The "closed-loop quality flywheel" described in the roadmap is open.

**Trade-off:** Nightly CI costs (compute minutes). For simulator-mode jobs without external API calls, the cost is negligible.

**Cursor prompt:**
```
Update .github/workflows/template-eval-harness.yml to add a scheduled trigger (cron: '0 3 * * *') that runs python scripts/ci/eval_template_harness.py --mode score --report artifacts/eval-harness-nightly.md. Add a step that reads the report and emits a GitHub Actions warning annotation (::warning::) for each scenario that fails recall or trips an unexpected hit, so drift is visible in the Actions summary without blocking the build. Update scripts/ci/eval_template_harness.py to emit a machine-readable JSON summary (eval-harness-summary.json) alongside the markdown report, containing per-scenario pass/fail, recall percentage, and unexpected hit count.
```

---

### 7. Write-AiReadinessPosture.ps1 Does Not Exist — Sponsor Artifact Is Manual-Only (Deficiency: 18 pts × Low weight)

**The problem:** `AI_READINESS_POSTURE.md` §5.3 explicitly states: *"`scripts/Write-AiReadinessPosture.ps1` is planned for V1.1. For V1 pilots, use the manual path above."* The schema is defined and stable. Every sponsor proof packet must currently have a human fill in `ai-readiness-posture.json` manually by sourcing from three separate artifact paths. This is error-prone and adds friction to every pilot delivery.

**Trade-off:** Script adds a new PowerShell artifact. Risk is low since the JSON schema is already frozen.

**Cursor prompt:**
```
Create scripts/Write-AiReadinessPosture.ps1. The script should:
1. Accept parameters: -ReleaseOrRunId (required string), -RealLlmEvidenceGatePath (optional path), -RetrievalIrReportPath (optional path), -RealLlmCostRollupPath (optional path), -OutputDir (optional, default artifacts/release).
2. Read real-llm-evidence-gate.json when -RealLlmEvidenceGatePath is set and extract executionMode, qualityGate outcome/scores.
3. Read retrieval-ir-report.md when set and extract vectorIndexType and retrievalStatus.
4. Read real-llm-cost-rollup.json when set and extract budget posture fields.
5. Determine overallReadinessLevel from the rules in AI_READINESS_POSTURE.md §4.
6. Generate the sponsorSafeSummary paragraph from the template strings in §3 based on readiness level.
7. Write ai-readiness-posture.json and ai-readiness-posture.md to -OutputDir.
8. Exit non-zero when the determined readiness level is NOT_EVALUATED.
Reference AI_READINESS_POSTURE.md for schema, paragraph templates, and readiness level rules.
```

---

### 8. Findings Priority Re-Ranker Missing — Operators Get an Undifferentiated Findings List (Deficiency: 15 pts × Medium weight)

**The problem:** A typical ArchLucid run produces up to 30 "High" findings with no signal about which to address first. The product cannot currently distinguish between a High finding that costs $50K/month if ignored and a High finding that is primarily a hygiene issue. The result is decision fatigue and pilot stalls. `IndustryVertical` is already available in the tenant profile.

**Trade-off:** Re-ranking is a post-commit LLM call. It consumes additional tokens from the tenant quota. Must be feature-flagged to avoid surprising operators. The re-rank result should be advisory — it must not affect governance dispositions or the manifest hash.

**Cursor prompt:**
```
Create IFindingPriorityReranker in ArchLucid.Application/Findings/. After an architecture run commits, collect all ArchitectureFindings for the run. Group them by severity. For each severity tier, call IAgentCompletionClient with: "You are an enterprise risk advisor. Rank these {n} architecture findings from most to least urgent business impact for a {industryVertical} organisation. Return ONLY a JSON array of findingId strings in priority order." Persist the rank as a new int column PriorityRank (nullable) on dbo.Findings via a DbUp migration. Add an ?orderBy=priority query param to GET /v1/architecture/run/{runId} findings response. Guard with config key AgentRuntime:RerankFindings (default false). The re-rank must not affect finding severity, governance disposition, or the manifest hash.
```

---

### 9. Governance-Block Explainer Missing — Policy Rejections Are Opaque (Deficiency: 14 pts × Medium weight)

**The problem:** When `EffectiveGovernanceResolver` blocks a manifest commit, the operator receives a rule ID and a description. They do not receive an AI explanation of *which* architectural change triggered the rule or what the *minimum edit* is to unblock. For governance-heavy pilots, this is the most common "now what?" blocker.

**Trade-off:** This is a single LLM call per governance block. It consumes quota but is bounded — blocks are infrequent relative to run volume. The explanation must be clearly labeled as AI-generated and non-binding.

**Cursor prompt:**
```
In EffectiveGovernanceResolver.cs (or its caller in the commit path), when a governance rule blocks the commit, call IAgentCompletionClient with the prompt: "Policy rule '{rule.RuleId}' ({rule.Description}) blocked an architecture manifest commit. The manifest change that triggered it was: {serialized delta}. In two sentences: (1) explain why this rule exists, (2) describe the minimum manifest change that would satisfy it." Return this explanation as a new string property BlockExplanation (nullable) on GovernanceBlockResult, guarded by config key AgentRuntime:ExplainGovernanceBlocks (default false). Surface it in the commit API error response (HTTP 409 Problem Details body) under a field blockExplanation. Display it prominently in the archlucid-ui commit rejection toast with an AI-generated label.
```

---

### 10. Per-Finding Conversational Explainer Missing — Operators Cannot Ask "Why?" Inline (Deficiency: 12 pts × Low weight)

**The problem:** Operators can use the general Ask endpoint but cannot ask a finding-scoped question ("why is this a finding?", "what's the smallest fix?") without manually copying finding context into the Ask box. `IAskService` already exists; the addition is a constrained variant with pre-loaded finding context.

**Trade-off:** Re-uses existing Ask infrastructure. Risk is minimal. The tighter system prompt should prevent the finding-Ask from leaking into cross-tenant or cross-run discussions.

**Cursor prompt:**
```
Add a new method AskAboutFindingAsync(FindingAskRequest, ScopeContext, CancellationToken) to AskService.cs. FindingAskRequest contains FindingId (Guid), Question (string), and optional ThreadId. The method should: 1) load the ArchitectureFinding and its parent AgentResult from persistence; 2) build a structured JSON context containing only that finding's message, severity, category, claims, and evidenceRefs; 3) use a tighter system prompt: "You are an enterprise architect. The operator has a question about one specific architecture finding. Explain it clearly: why it matters, what evidence supports it, and what the smallest concrete fix is. Use only the supplied finding data." Wire this as POST /v1/architecture/finding/{findingId}/ask. In archlucid-ui, add a chat icon next to each finding row that opens an inline Ask panel pre-seeded with this endpoint.
```

---

### 11. Run Summary One-Pager Auto-Generator Missing — No CFO-Ready Artifact in One Click (Deficiency: 11 pts × Low weight)

**The problem:** Producing a sponsor-ready summary of a run currently requires manual export + editing. The export pipeline already emits MD/DOCX. An LLM-populated one-pager template would convert every run into a sponsor artifact automatically, directly addressing the "time spent on reporting" objection in pilots.

**Trade-off:** Adds a new export variant. The LLM-generated executive summary must be labeled as AI-generated. Uses per-run token quota.

**Cursor prompt:**
```
Add a new export variant RunSummaryOnePager to ArchitectureReviewBoardExportDocumentFactory.cs. It should: 1) count findings by severity (Critical/High/Medium/Low); 2) call IAgentCompletionClient with the top-5 High/Critical findings and produce a 3-sentence executive summary; 3) populate a new Markdown template templates/exports/run-summary-one-pager.md.hbs with severity counts, the AI summary, and top-3 finding titles. Expose it as GET /v1/architecture/run/{runId}/export/summary in ArchitectureExportController.cs with a prominent AI-generated disclaimer in the output. Add a "Download Executive Summary" button in the archlucid-ui run detail page next to the existing export options. Guard with feature flag AgentRuntime:GenerateRunSummary (default false).
```

---

### 12. AI-Assisted Architecture Request Authoring Missing — First Run Blank-Page Tax (Deficiency: 10 pts × Low weight)

**The problem:** Operators face a blank `ArchitectureRequest` form with no guidance on what constraints, capabilities, or topology hints to add. AI-assisted draft generation from a free-text description eliminates the blank-page tax and reduces the time to first committed run.

**Trade-off:** New endpoint, no new persistence, no changes to the run contract. Operator confirms every field. Pure assistive pattern.

**Cursor prompt:**
```
Create a new endpoint POST /v1/architecture/request/draft in ArchLucid.Api/Controllers/Planning/ArchitectureRequestController.cs. Accept a DraftArchitectureRequestInput containing a free-text description (string, required, MinLength 20). Call IAgentCompletionClient with the system prompt: "You are an enterprise architecture intake assistant. Given this system description, produce a JSON object with keys: suggestedConstraints (string[]), suggestedCapabilities (string[]), suggestedAssumptions (string[]), topologyHints (string[]), securityBaselineHints (string[]). Be specific and concise. Return ONLY valid JSON." Return the parsed result as DraftArchitectureRequestResponse. In archlucid-ui, add a "✨ Suggest fields" button to the New Request form that calls this endpoint and pre-fills the constraint and capability fields, with each pre-filled value visually marked as AI-suggested until the operator edits or accepts it.
```

---

### 13. Findings-to-IaC Stub Generator Missing — No Actionable Artifact After a Finding (Deficiency: 9 pts × Low weight)

**The problem:** After a committed run, operators see findings but get no automated guidance on *how* to fix them in their IaC. Agents already emit `ProposedChanges` (`ManifestDeltaProposal`). Re-emitting those as Bicep/Terraform snippets with `groundedInClaim` references closes the "what do I do now?" gap.

**Trade-off:** Post-commit LLM pass. Feature-flagged. Must carry explicit "generated, not validated" disclaimer. Bicep quality depends on model grounding quality.

**Cursor prompt:**
```
Create a new service IFindingIacStubGenerator in ArchLucid.Application/Agents/IaC/. For each ArchitectureFinding with a non-null evidenceRefs list, call IAgentCompletionClient with a constrained prompt: "Given this architecture finding: {finding.Message}. Generate the minimal Azure Bicep snippet that resolves it. Return ONLY the bicep code, no prose. Add a comment on the first line: // AI-generated stub — review before use." Append the result as a new string property IacStub (nullable) on ArchitectureFinding. Call this service from AuthorityRunOrchestrator after commit, guarded by a new config key AgentRuntime:GenerateIacStubs (default false). Surface IacStub in the run detail API response and in a collapsible "Bicep Stub" panel in the archlucid-ui findings list.
```

---

### 14. AI Policy-Pack Drafting Assistant Missing — Blank-Page Tax for Enterprise Policy Authoring (Deficiency: 8 pts × Low weight)

**The problem:** Operators write free-text governance intent and must manually translate it into Policy Pack rule JSON. The 23 bundled policy packs are already valid few-shot exemplars. Removing this blank-page friction is one of the primary reasons pilots stall on governance configuration.

**Trade-off:** Operator always reviews and saves — no automatic writes. Few-shot prompt quality depends on exemplar diversity. Must carry human-review disclaimer.

**Cursor prompt:**
```
Create a new endpoint POST /v1/governance/policy-pack/draft in GovernanceController.cs. Accept a DraftPolicyPackInput with FreeTextIntent (string, MinLength 20). Load 3-4 existing bundled policy pack rule examples from the manifest as few-shot context. Call IAgentCompletionClient with the prompt: "You are a cloud governance expert. Based on the following intent, draft a valid ArchLucid policy pack rule JSON object conforming to this schema: {PolicyPackRule schema}. Use these existing rules as examples: {fewShotExamples}." Return the draft as DraftPolicyPackRuleResponse with a prominent disclaimer that it requires human review before activation. In archlucid-ui, add a "✨ Draft a rule from plain English" button to the Policy Pack editor that opens a text input and shows the draft in side-by-side view with the schema.
```

---

### 15. DEFERRED: Automatic Quality-Gate Retry (V1.1 Owner Decision)

The orchestrator does not automatically re-run agents when the quality gate rejects a trace. Operators re-run manually. **This is an explicit owner decision (2026-05-25):** "The orchestrator does not automatically re-run agents when the quality gate rejects a trace. Operators re-run manually via the operator UI or CLI. `reject_reason` and `execution_mode` labels exist so V1.1 can decide whether transient rejects warrant a single automatic retry based on production data."

**Do not implement in V1.** Do not score against V1 readiness. Not DEFERRED in the sense of "blocked" — this is scope-resolved to V1.1.

---

## Trade-offs Summary

| Trade-off | Description |
|---|---|
| Infrastructure depth vs execution evidence | The quality gate, RAG, and observability stacks are production-grade but are guarding simulator outputs. The sophisticated infrastructure creates an expectation of real-mode validation that the current pilot posture does not meet. |
| Critic consensus vs adversarial tension | Current Critic rule 8 ("prefer conservative findings") reduces noise at the cost of real adversarial signal. Flipping to adversarial may initially alarm operators with higher finding counts. |
| Agent confidence uncalibrated | Quality gate threshold numbers in `appsettings.Staging.json` are empirically ungrounded until calibration runs against real-mode data. They are reasonable starting guesses but could be under- or over-restrictive in ways that aren't visible until production volume exists. |
| Multi-model tiered routing | Cost reduction is real but requires operators to manage two deployment configurations. Rollback is safe (Fast defaults to Reasoning) but the cost surface analysis depends on which tasks land on which tier. |
| LLM-as-judge scope limitation | Judge covers only Topology + Critic. Cost and Compliance remain heuristic-only. Compliance semantic quality is the hardest to validate without a judge, and it is also the dimension with the highest buyer scrutiny. |
| Retrieval policy-pack corpus quality | RAG-V1-001 (policy-pack corpus) is shipped, but the quality of compliance findings depends on the depth of rule-text indexed. The 23 bundled packs have varying narrative depth. |

---

## Scoring Justification

**72/100** reflects the following calibration:

- **Why not higher (above 80):** The real-mode CI gate is warn-only. The current pilot posture is SIMULATOR_ONLY. The Critic is consensus-leaning. Agent confidence feeding gates is uncalibrated. 15 operator-facing AI leverage items are unimplemented.
- **Why not lower (below 65):** The underlying infrastructure is genuinely production-grade — the circuit breaker, quality gate, faithfulness evaluator, retrieval grounding trace, prompt regression baseline, and budget controls are not prototype-grade. The RAG foundation (RAG-V1-000 through RAG-V1-011) represents significant engineering completed in the V1 window. Schema enforcement, budget controls, and fallback behavior are mature.
- **Specific deduction anchors:** −10 for SIMULATOR_ONLY pilot posture with warn-only CI gate; −7 for consensus-leaning Critic; −5 for uncalibrated confidence in quality gates; −3 for absence of streaming Ask; −3 for no multi-model tiering.

---

## Pending Questions for Owner (Save for Later)

When you have time to review, please address the following:

**PQ-AI-01 — RESOLVED 2026-06-01:** Azure OpenAI deployment specs are stored in local secrets. The owner can run `.\scripts\Invoke-RealLlmEvidenceGate.ps1` locally at any time and commit the resulting `artifacts/release/real-llm-evidence-gate.json`. Nothing in engineering is blocking this — it is owner-initiated. CI gate flip (TB-137) unblocked once that artifact is committed.

**PQ-AI-02 — RESOLVED 2026-06-01:** Add a dedicated `LlmJudgeBudget` sub-cap (~10% of daily token cap, ≈ 200k tokens/day). Judge calls must be isolated from run-execution quota so a large eval run cannot starve the customer-facing pipeline. This is a prerequisite for TB-190 (extending judge to Cost and Compliance).

**PQ-AI-03 — RESOLVED 2026-06-01:** Promoted to V1. `scripts/Write-AiReadinessPosture.ps1` was implemented (TB-182) and `docs/go-to-market/AI_READINESS_POSTURE.md` §5.1/§5.3 updated to reflect V1 status.

**PQ-AI-04 — RESOLVED 2026-06-01:** Fast tier = `gpt-4o-mini` on Azure OpenAI. Reasoning tier = GPT-4o. Topology initial draft and Cost data-extraction move to Fast; Compliance and Critic stay on Reasoning. Config keys: `Llm:Deployments:Fast` and `Llm:Deployments:Reasoning`. See TB-179. The implementation is backward-compatible either way, but the cost projection depends on this choice.

---

## Improvement Items for tech_backlog.md

The following new items should be added. Items already in the backlog (TB-011, TB-012, TB-034–038, TB-044–056, TB-137, TB-139, TB-140) are excluded.

| Proposed ID | Title | Priority | Cursor-actionable |
|---|---|---|---|
| TB-177 | Adversarial Critic second-pass — replace rule 8 with challenge-first posture | P0 | Yes |
| TB-178 | Streaming Ask SSE — POST /v1/ask/stream + useAskStream() hook | P0 | Yes |
| TB-179 | Multi-model tiered orchestration — ModelTier enum + config-driven deployment | P1 | Yes |
| TB-180 | Calibrated agent confidence — IAgentConfidenceCalibrator + CalibratedConfidence column | P1 | Yes |
| TB-181 | Template eval harness nightly cron — scheduled CI trigger + JSON summary | P1 | Yes |
| TB-182 | Write-AiReadinessPosture.ps1 — automate ai-readiness-posture.json production | P1 | Yes |
| TB-183 | Findings priority re-ranker — IFindingPriorityReranker + PriorityRank column | P2 | Yes |
| TB-184 | Governance-block explainer — AI explanation on governance 409 responses | P2 | Yes |
| TB-185 | Per-finding conversational explainer — POST /v1/architecture/finding/{id}/ask | P2 | Yes |
| TB-186 | Run summary one-pager auto-generator — RunSummaryOnePager export variant | P2 | Yes |
| TB-187 | AI-assisted architecture request authoring — POST /v1/architecture/request/draft | P2 | Yes |
| TB-188 | Findings-to-IaC stub generator — IFindingIacStubGenerator + IacStub property | P3 | Yes |
| TB-189 | AI policy-pack drafting assistant — POST /v1/governance/policy-pack/draft | P3 | Yes |
| TB-190 | LLM-as-judge coverage extension — Cost and Compliance agents (owner budget approval needed) | P2 | Partial (owner input on budget) |
