# ArchLucid AI Agent / Readiness solution quality — Independent assessment 2026-05-08 — Weighted: 70.24%

**Scope:** AI Agent / Readiness solution quality only (`ArchLucid.AgentRuntime`, `ArchLucid.AgentSimulator`, the prompt-injection precheck under `ArchLucid.Application/Runs/Orchestration`, and the offline `tests/eval-corpus` + `tests/eval-datasets` evaluation surfaces). Independent of prior assessments. SOC 2 CPA, design partner, MCP, distributed Redis, ACA Jobs/DTF, and other items deferred to V1.1/V2 per `docs/library/V1_SCOPE.md` §3 and `docs/library/V1_DEFERRED.md` §6b–§6f are out of scope and **do not** affect the score.

> **Methodology:** First-principles inspection of code, tests, fixtures, scripts, and runbooks. Pillars derived from what an AI-agent platform must actually do well (deterministic structured output, evaluation, safety, cost, forensics, observability, real-LLM grounding). Each pillar scored 0–100 with concrete evidence. Weighted score is the dot product of scores and weights.

## 0. Pillar weights and scores

| # | Pillar | Weight | Score | Contribution |
|---|--------|--------|-------|--------------|
| 1 | Deterministic structured-output discipline (model call config + JSON shape) | 10% | 78 | 7.80 |
| 2 | `AgentResult` parsing, schema validation, and remediation loop | 10% | 76 | 7.60 |
| 3 | Evaluation-harness fidelity (structural + heuristic semantic + LLM judge + reference cases + faithfulness) | 15% | 60 | 9.00 |
| 4 | Quality gate, PilotStrict floors, finding-confidence enrichment | 10% | 72 | 7.20 |
| 5 | Resilience (timeouts, retries, circuit, bulkhead, partial-budget cancellation) | 10% | 80 | 8.00 |
| 6 | Cost and token accounting (per-tenant budgets, per-run guardrail, USD estimation) | 8% | 73 | 5.84 |
| 7 | Safety (content safety, prompt-injection precheck, redactor, output filter) | 12% | 55 | 6.60 |
| 8 | Trace forensics (truncated SQL row + blob + inline fallback + audit) | 10% | 76 | 7.60 |
| 9 | Observability (OTel histograms / counters / activity tags / cache instruments) | 5% | 82 | 4.10 |
| 10 | Real-LLM E2E grounding + offline corpus credibility | 10% | 65 | 6.50 |
| **Total** | | **100%** | | **70.24** |

**Headline:** **70.24%** — solid plumbing, conservative defaults, real instrumentation. Genuinely weak in two places: (a) the eval harness conflates per-agent expectations and lets a single LLM-judge call dictate the outcome; (b) safety is wired generically — there is no jailbreak / Prompt-Shield path, no output-side content filter is actually invoked, and the precheck does not look at evidence-package text that ends up in the user prompt.

---

## 1. Improvement priorities (ordered by impact-weighted gap)

Improvement leverage = `(100 − pillar score) × pillar weight`. Higher leverage moves the headline number more.

| Rank | Improvement | Pillar | Leverage |
|------|-------------|--------|----------|
| 1 | Per-agent-type structural key sets + tightened reference-case keys | 3 | 6.00 |
| 2 | Blend the LLM judge with the heuristic + record disagreement; stop the one-shot replacement | 3 | (in 6.00) |
| 3 | Run prompt-injection precheck and redactor on **evidence** fields, not just the user request | 7 | 5.40 |
| 4 | Wire Azure AI Content Safety **Prompt Shield** (jailbreak + indirect injection) — partial, gated by feature flag | 7 | (in 5.40) |
| 5 | Actually call `IContentSafetyGuard.CheckOutputAsync` on every LLM completion and on the assembled `RawResponse` | 7 | (in 5.40) |
| 6 | Use Azure OpenAI strict `JsonSchema` response format on supported deployments (fallback to `JsonObject` otherwise) | 1 | 2.20 |
| 7 | **DEFERRED** — Embeddings-based evidence-faithfulness scorer (replace token-overlap heuristic) | 3 | 2.40 |
| 8 | LLM-judge mean-of-N + dispersion (median + std as quality signal, not just one call) | 3 | (in 6.00) |
| 9 | Pin per-deployment cost rates in config + properly bill reasoning tokens through `LlmCostEstimator` | 6 | 2.16 |

Because Improvement 7 is **DEFERRED**, the list is **9** items as you instructed.

> Improvements 1, 2, and 8 all sit inside Pillar 3 (the largest and lowest-scoring pillar). I split them because the diagnoses, blast radii, and Cursor prompts are distinct.

---

## 2. Pillar-by-pillar diagnosis (lowest-scoring first)

### 2.1 Pillar 7 — Safety (12%, 55/100, **biggest absolute impact**)

What is actually wired today:

- `DefaultRequestContentSafetyPrecheck` runs only on the inbound `ArchitectureRequest` (description, system name, inline requirements, and uploaded document name + content). It is **not** invoked on the `AgentEvidencePackage` content that `AgentUserPromptBuilder` later concatenates into the user prompt — `PolicyEvidence.Title/Summary`, `ServiceCatalogEvidence.Summary`, `PatternEvidence.Summary`, `PriorManifest.Summary`, and `EvidenceNote.Message` flow into the model with **only** secret-pattern redaction (`PromptFieldRedactor`), not jailbreak / instruction-override detection. Indirect prompt injection through any of those fields is undefended.
- `IContentSafetyGuard` is registered in DI (Null / Azure / EnabledButUnconfigured), but a workspace-wide search for callers of `CheckInputAsync` / `CheckOutputAsync` finds **zero** non-test callers. The guard is dead code in the runtime path. Output-side moderation does not happen.
- `AzureContentSafetyGuard` uses `ContentSafetyClient.AnalyzeTextAsync` only — the generic 4-severity-level text classifier (Hate / Sexual / Violence / SelfHarm). Microsoft also exposes a dedicated **Prompt Shield** (`ShieldPrompt`) that targets jailbreak attempts and indirect prompt injection in grounding documents. Not wired.
- The prompt-injection regression dataset (`tests/eval-datasets/prompt-injection/*.json`) is small (≈18 fixtures) and exercises only the precheck and the redactor in the `Application` and `AgentRuntime` test projects. There is no fixture for indirect injection seeded into evidence summaries.

What works: the regex / phrase / homoglyph design is reasonable for direct override; secret redaction is comprehensive (PEM blocks, AWS keys, Azure SAS, JWT, Luhn-validated PANs, SSN-shaped triplets).

**Why this is the highest absolute-impact area:** any organisation that lets evidence packages be composed by anyone other than the requester (policy authors, admins, ingest connectors) has a free path to instruction injection today, and the system already markets a typed audit trail and PilotStrict gate that buyers will read as "the model is supervised". Closing this gap is also cheap relative to the credibility lift.

### 2.2 Pillar 3 — Evaluation harness fidelity (15%, 60/100, **largest pillar weight**)

Concrete defects:

- `AgentOutputEvaluator.GetExpectedKeys(AgentType)` returns **the same shared 10-key list for every agent type**. The XML doc on the file even concedes this is a TODO ("Per-`AgentType` key lists live in `GetExpectedKeys` for future stricter Topology/Cost/Critic profiles"). So "structural completeness" is identical across roles. A `Critic` row with no `proposedChanges` is scored against the same key set as a `Topology` row that should always have one. The signal-to-noise ratio of the structural metric is therefore lower than the dashboards suggest.
- `CompositeAgentOutputSemanticEvaluator` does not blend the heuristic and the LLM judge — when the judge returns a value, it **replaces** `OverallSemanticScore` outright. One LLM call, one model, one prompt, one outcome. There is no min/max clamp against the heuristic, no agreement check, no second-judge or self-consistency call. A drifting judge silently moves every gate decision.
- `AgentResultEvidenceFaithfulnessChecker` is token-overlap with a hand-rolled 80-word stopword list that includes core domain terms — `compliance`, `security`, `system`, `design`, `architecture`, `manifest`, `decision`, `finding(s)`, `issue(s)`, `recommend`, `summary`. A claim that says "the compliance design needs better security" reduces to **zero** scoring tokens after stopword removal. Conversely, generic words that survive may overlap with unrelated evidence text. That is not what a faithfulness signal should look like in a system that markets a typed audit trail.
- The eval corpus (`tests/eval-corpus/`) has **10 synthetic scenarios + 1 real-mode-smoke**, no human-labelled gold, no inter-rater agreement, recall computed as substring match on `evidenceMustContain`. CI default for `eval_agent_corpus.py` is informational (exit-0 even on regression).
- `prompt_regression_baseline.json` already lists Topology / Cost / Compliance / Critic with floors of 0.95 structural / 0.85 semantic for all four — but `docs/library/AI_AGENT_PROMPT_REGRESSION.md` still says "Cost / Compliance / Critic rows in the baseline remain 0.0 until dedicated golden fixtures and tests exist; only Topology is merge-blocking today." The baseline has overtaken the doc; readers cannot tell which is current.
- `ISemanticScorer` is documented as "placeholder seam for embedding-based similarity vs reference text (not wired in DI today)" — the embeddings path was scaffolded then abandoned.

What works: the `AgentOutputQualityGate` is well-factored, per-agent-type floors plug in cleanly, `AgentOutputReferenceCaseRunEvaluator` persists per-case rows for trending, the offline corpus runs in PR CI without AOAI credentials, and `GoldenAgentResultJsonEvaluationTests` regresses the JSON-shape contracts against committed fixtures.

### 2.3 Pillar 10 — Real-LLM E2E grounding + offline corpus credibility (10%, 65/100)

- `RealAzureOpenAIEndToEndTests` is the only live-AOAI test, gated on environment variables, single happy-path scenario (`Live_pipeline_topology_compliance_cost_merge_produces_non_empty_manifest`). One scenario, one deployment, one snapshot.
- The "real-mode" quality scoring path in `tests/eval-corpus/scenario-real-mode-smoke.json` requires the operator to manually export a single `AgentResult` JSON to a path named by `ARCHLUCID_EVAL_CORPUS_REAL_MODE_SMOKE_AGENT_RESULT`. There is no automated capture from a recent real run, no rotation across deployments, no per-tenant slice, no dispersion measurement across repeated runs.
- The release readiness signal documented in `AGENT_OUTPUT_EVALUATION.md` is good — `--enforce-quality-gate` blocks RC builds on rejected simulator rows — but the actual production-strict floors (`StructuralRejectBelow 0.7`, `SemanticRejectBelow 0.5`) are conservative; an enterprise buyer evaluating perceived rigour will read them as low bars.

### 2.4 Pillar 4 — Quality gate, PilotStrict floors, finding-confidence enrichment (10%, 72/100)

- The gate is well-factored; PilotStrict adds the right kinds of controls (citation count, evidence-ref count, faithfulness floor). But because `OverallSemanticScore` is replaced by the LLM judge (Pillar 3), the gate's semantic decision is transitively a single LLM-judge call's decision.
- Default `PilotStrictMin*` constants in code are conservative; raising them is a per-tenant configuration decision the operator must make. No documented "release-credible" preset (e.g., `PilotStrict-Strict`, `PilotStrict-LooseDemo`).
- The confidence enricher (`AgentArchitectureFindingConfidenceEnricher`) only runs when traces exist; if a run has zero traces (handler bypass), findings ship without confidence levels.

### 2.5 Pillar 8 — Trace forensics (10%, 76/100)

- `AgentExecutionTraceRecorder` is genuinely well-engineered: 8KB SQL truncation, blob persistence with 3 attempts and inline-SQL fallback, durable audit on failure, mandatory full-text coverage verification.
- The implicit citations check inside `RecordAsync` (lines 167–185) is awkward: it parses the `parsedResultJson` again, looks for a top-level `"citations"` array, and on absence flips `ParseSucceeded` to `false`. This is a side-effect inside the trace-write path, the catch swallows all parse exceptions silently (`// Ignore parse errors here`), and the contract for `AgentResult` already uses `evidenceRefs` rather than `citations` — so this check seems to enforce a separate convention without being explicit about it.
- Blob retry uses fixed 500ms backoff with no jitter; under correlated cloud-storage hiccups multiple traces will retry in lockstep.

### 2.6 Pillar 2 — Parsing and remediation (10%, 76/100)

- Schema validation is pluggable, enforced by default at parse, throws `AgentResultSchemaViolationException` with truncated JSON and a typed audit row.
- `LlmAgentSchemaCompletion` retries up to 3 times with the schema errors fed back in — sound design.
- Confidence `0..1` range is enforced, agent-type identity is enforced, run/task IDs are enforced. Good rigour.
- Minor: the `AgentResult.Claims is null` / `EvidenceRefs is null` checks should be unreachable after `JsonSerializer.Deserialize` with web defaults (these are required POCO collections), but the defensive check is fine.

### 2.7 Pillar 1 — Deterministic structured-output discipline (10%, 78/100)

- `AzureOpenAiCompletionClient` sets `Temperature = 0.1`, `MaxOutputTokenCount`, and `ChatResponseFormat.CreateJsonObjectFormat()`. Good but not great: 0.1 is low-temperature, not deterministic; no `seed` parameter; no strict `JsonSchema` response format (Azure OpenAI exposes `CreateJsonSchemaFormat(...)` on supported deployments — using it would eliminate most schema-violation retries).
- The `TopologySystemPromptTemplate` is well-shaped for structured output (enum lists, conceptual JSON shape, hard "JSON only" rule). Same for compliance / critic templates.
- Prompt versioning + content SHA hashing exist (`AgentPromptCanonicalHasher`); `prompt_template_id`, `prompt_template_version`, `prompt_release_label` flow into trace rows.
- Missing: no per-deployment ablation gate. Switching from `gpt-4o` to a future `gpt-5` deployment has no automated comparison run. Today this is operator discipline.

### 2.8 Pillar 6 — Cost and token accounting (8%, 73/100)

- `CostGuardrailInterceptor` (per-run token + USD ceilings) and `LlmDailyTenantBudgetTracker` / `LlmMonthlyTenantDollarBudgetTracker` are in place.
- `LlmCostEstimator` is a static rate map. New deployments need code or config to be priced — easy to forget.
- Reasoning-token capture is partial: `BuildReasoningTraceSnippet` reads `usage.OutputTokenDetails.ReasoningTokenCount` for the trace, but the cost estimator only multiplies input + output. Reasoning tokens on `o1`-class deployments will silently undercount spend.
- `AsyncLocal` token-usage capture (`LastCompletionTokenUsage`) is fragile — handlers must `TryConsume` before another call resets it. So far the handler patterns respect that, but it is a footgun.

### 2.9 Pillar 5 — Resilience (10%, 80/100)

- Timeouts (per-handler + per-agent override), Polly retry, circuit breaker, bulkhead concurrency gate, linked-cancellation on first failure (or partial-budget retention), `Simmy` chaos tests are all in place.
- Retry uses generic exponential backoff with jitter — does not honour Azure OpenAI `Retry-After` headers. For 429-heavy workloads the header is the better signal.
- Default `MaxConcurrentHandlers = 8` is process-wide, not per-tenant; in a multi-tenant fleet a noisy tenant can starve quiet tenants.
- `FallbackAgentCompletionClient` exists but is not in the default DI chain — no automatic model-tier failover unless the operator opts in.

### 2.10 Pillar 9 — Observability (5%, 82/100)

- OTel coverage is the strongest area. Histograms (`archlucid_agent_output_structural_completeness_ratio`, `archlucid_agent_output_semantic_score`, `archlucid_agent_output_reference_case_score_ratio`, `archlucid_llm_call_*`), counters (`archlucid_agent_output_quality_gate_total`, `archlucid_agent_output_parse_failures_total`, `archlucid_agent_schema_remediation_retries_total`), and `gen_ai.*` semantic-convention activity tags are all present.
- Quality-gate counter has `outcome` and `gate_mode` labels — good.
- Minor gap: no derived "rejected ratio per tenant per day" SLO metric out of the box; that lives in the alert backend.

---

## 3. Cursor prompts for the 9 improvements

> **How to use:** copy the prompt block into a fresh Cursor chat scoped to this repo. Each prompt is self-contained, references the actual file paths, and asks for tests + observability + audit hooks consistent with the codebase's existing patterns.

### Improvement 1 — Per-agent-type structural key sets + tightened reference-case keys

```text
In `ArchLucid.AgentRuntime/Evaluation/AgentOutputEvaluator.cs`, replace `GetExpectedKeys`
with per-`AgentType` key lists:

- Topology: shared keys + require `proposedChanges`. Drop `proposedChanges` from the
  required list for agent types that should not emit it.
- Compliance: shared keys + require `findings` (already in shared) and `claims` with at
  least one element validated downstream. `proposedChanges` is optional.
- Cost: shared keys + require `findings`. `proposedChanges` is optional.
- Critic: shared keys minus `proposedChanges` (Critic does not emit topology deltas in
  any current handler).

Keep the public `IAgentOutputEvaluator` shape unchanged. Update missing-key reporting
so the per-agent expected list is what missing-key counts are computed against.

In `ArchLucid.AgentRuntime/Evaluation/ReferenceCases/`, extend the catalog so each
Topology / Compliance / Cost / Critic reference case can declare a `RequiredJsonKeys`
list specific to its role. Add at least one negative reference case per agent type that
should fail when the role-specific required key is missing.

Add or extend tests in `ArchLucid.AgentRuntime.Tests/Evaluation/`:
- Unit tests proving the structural completeness ratio differs across agent types when
  the same JSON is evaluated.
- Update `prompt_regression_baseline.json` only if new minimums are justified; do not
  silently lower any floor.

Update `docs/library/AGENT_OUTPUT_EVALUATION.md` to reflect the per-agent key lists.
Reconcile `docs/library/AI_AGENT_PROMPT_REGRESSION.md` (which still says
"Cost / Compliance / Critic rows in the baseline remain 0.0") with the actual
`scripts/ci/prompt_regression_baseline.json`.

Run `dotnet build` then `dotnet test ArchLucid.AgentRuntime.Tests` and
`python scripts/ci/assert_prompt_regression.py`. Do not change observability
metric names.
```

### Improvement 2 — Blend the LLM judge with the heuristic + record disagreement

```text
Modify `ArchLucid.AgentRuntime/Evaluation/CompositeAgentOutputSemanticEvaluator.cs` so
the LLM judge no longer overwrites `OverallSemanticScore` when present. Instead:

1. Compute `blended = JudgeBlendWeight * judge.OverallQuality
                    + (1 - JudgeBlendWeight) * heuristic.HeuristicOverallScore`.
   Default `JudgeBlendWeight = 0.5`. Configuration path:
   `ArchLucid:AgentOutput:LlmSemanticJudge:BlendWeight` (clamp 0.0..1.0; normalize on
   bind).
2. Always populate `LlmJudgeOverallQuality` and `LlmJudgeNotes` exactly as today, but
   set `OverallSemanticScore = blended`.
3. Compute `disagreement = abs(judge.OverallQuality - heuristic.HeuristicOverallScore)`.
   Persist on `AgentOutputSemanticScore` as `LlmJudgeHeuristicDisagreement` (new
   nullable double) and emit a histogram
   `archlucid_agent_output_judge_disagreement` with `agent_type` label.
4. When `disagreement > LlmSemanticJudgeOptions.RejectIfDisagreementAbove` (new option,
   default `0.4`) AND either heuristic or judge is below the configured semantic warn
   floor, force the gate outcome to `Warned` (not Rejected — buyer must opt in via
   PilotStrict).

Add unit tests in `ArchLucid.AgentRuntime.Tests/Evaluation/`:
- Judge=null falls back to heuristic only (existing behaviour).
- Judge present and agreement -> blended score, no warn.
- Judge present and high disagreement + low score -> Warned.

Update `docs/library/AGENT_OUTPUT_EVALUATION.md` with the blending formula and the new
config key. Do not rename existing fields.
```

### Improvement 3 — Run prompt-injection precheck and redactor on evidence fields

```text
Today `DefaultRequestContentSafetyPrecheck` (in
`ArchLucid.Application/Runs/Orchestration/`) only inspects the inbound
`ArchitectureRequest`. The model also ingests evidence text via
`AgentUserPromptBuilder.AppendArchitectureRequestAndEvidence`
(`ArchLucid.AgentRuntime/Prompts/AgentUserPromptBuilder.cs`) — `PolicyEvidence.Title`,
`PolicyEvidence.Summary`, `ServiceCatalogEvidence.Summary`, `PatternEvidence.Summary`,
`PriorManifest.Summary`, `EvidenceNote.Message`. None of these run through the
injection precheck.

1. Introduce `IEvidenceContentSafetyPrecheck` (in `ArchLucid.Application/Runs/Orchestration`)
   plus a default implementation that reuses the `DefaultRequestContentSafetyPrecheck`
   regex / phrase / homoglyph engine.
2. Call it from the run-create or run-execute orchestrator (whichever already loads the
   evidence package) BEFORE the first agent handler runs. Configurable mode:
   - `Block` (default `false` for V1 backward compat): fail the run with a typed
     audit event `AgentExecution.EvidenceContentSafetyBlocked`.
   - `RedactAndWarn` (default `true`): replace matched substrings with
     `[redacted-injection-pattern]`, emit OTel counter
     `archlucid_evidence_injection_redactions_total{agent_type, source_field}`, and log
     a typed audit event `AgentExecution.EvidenceContentSafetyRedacted`.
3. Always call `PromptFieldRedactor.RedactForPrompt` AFTER the injection check so
   secret patterns are still stripped.
4. Extend `tests/eval-datasets/prompt-injection/` with at least one new file
   (`indirect-evidence.json`) containing at least 6 fixtures targeting evidence-side
   fields. Wire those fixtures through a new test in
   `ArchLucid.AgentRuntime.Tests/PromptInjection/` (or
   `ArchLucid.Application.Tests/Orchestration/`) that builds an evidence package
   containing the fixture text and asserts the precheck triggers.
5. Update `docs/security/SYSTEM_THREAT_MODEL.md` with the indirect-injection mitigation,
   and `docs/runbooks/AGENT_EXECUTION_FAILURES.md` with the new failure mode and audit
   event names.

Default the production posture for V1 to `RedactAndWarn` (no run failure) so this is
forward-compatible; opt-in to `Block` via configuration.
```

### Improvement 4 — Wire Azure AI Content Safety Prompt Shield (PARTIAL)

```text
This is a PARTIAL implementation pending owner confirmation that the pinned
`Azure.AI.ContentSafety` package version exposes the Prompt Shield API
(`ShieldPromptAsync` / equivalent). State the uncertainty in the PR body.

1. Add `IPromptShieldGuard` in `ArchLucid.Core/Safety/` with
   `Task<PromptShieldResult> EvaluateAsync(string userPrompt,
   IReadOnlyList<string> groundingDocuments, CancellationToken ct);`.
2. Add `NullPromptShieldGuard` (always returns "allowed") and register as the default.
3. Add `AzurePromptShieldGuard` in `ArchLucid.AgentRuntime/Safety/` skeletoned to call
   the Prompt Shield endpoint when `ContentSafety:PromptShieldEnabled = true` AND a
   non-empty endpoint + key are configured. If the SDK does not expose Prompt Shield
   directly, build a thin HTTP client against the documented REST surface
   (`/contentsafety/text:shieldPrompt` API), keep it isolated in this single class,
   and add an integration test marked `[Trait("Category","Slow")]` that skips without
   credentials (mirror `RealAzureOpenAIEndToEndTests` skip pattern).
4. Call `IPromptShieldGuard.EvaluateAsync` from the run-execute orchestrator AFTER
   evidence is loaded, passing the user-request text as `userPrompt` and the
   evidence-derived strings as `groundingDocuments`. Honour
   `ContentSafetyOptions.FailClosedOnSdkError` for transient SDK errors.
5. Emit OTel counter `archlucid_prompt_shield_evaluations_total{outcome}` and audit
   event `AgentExecution.PromptShieldBlocked` on a positive detection.
6. Default `PromptShieldEnabled = false` in `appsettings.json` so the V1 ship surface
   is unchanged. Set it to `true` in `appsettings.Production.json` ONLY after the
   owner confirms the SDK / endpoint posture.

In the PR description, list explicitly: (a) which SDK version is currently pinned,
(b) whether that version exposes Prompt Shield in stable or preview, (c) any new
Azure cost line item, (d) the additional Key Vault secret needed for the dedicated
endpoint if separate from the existing `ContentSafety` resource.
```

### Improvement 5 — Actually call `IContentSafetyGuard.CheckOutputAsync` on every LLM completion

```text
A workspace search shows `IContentSafetyGuard.CheckInputAsync` and `CheckOutputAsync`
have ZERO non-test callers. The guard is wired in DI but never invoked.

1. Decorate `IAgentCompletionClient` with `ContentSafetyEnforcingAgentCompletionClient`
   in `ArchLucid.AgentRuntime/`. The decorator must:
   - Call `IContentSafetyGuard.CheckInputAsync(userPrompt, ct)` before the inner
     `CompleteJsonAsync`. On `IsAllowed = false`, throw a new
     `AgentInputBlockedBySafetyGuardException` carrying the category and severity.
     Do NOT log the prompt body.
   - Call `IContentSafetyGuard.CheckOutputAsync(rawJson, ct)` after the inner call
     succeeds. On `IsAllowed = false`, throw
     `AgentOutputBlockedBySafetyGuardException` with the same shape and emit OTel
     counter `archlucid_agent_output_safety_blocks_total{agent_type, category}`.
2. Register the decorator at the top of the completion-client chain in
   `ArchLucid.Host.Composition/Startup/ServiceCollectionExtensions.AgentsGovernanceRetrieval.cs`
   so caching and circuit-breaking sit beneath it.
3. Add typed audit events `AgentExecution.InputBlockedBySafety` and
   `AgentExecution.OutputBlockedBySafety` and emit them from the orchestrator's
   exception-handling path.
4. Add unit tests in `ArchLucid.AgentRuntime.Tests/Safety/` with a fake guard that
   blocks on a configured marker string. Cover both input-block and output-block
   paths and assert the counter increments.
5. Default behaviour when the registered guard is `NullContentSafetyGuard` is
   pass-through (no extra latency). When it is
   `ContentSafetyEnabledButUnconfiguredGuard`, fail closed to match existing posture.

Update `docs/library/AGENT_OUTPUT_EVALUATION.md` and
`docs/runbooks/AGENT_EXECUTION_FAILURES.md` with the new exception types and counters.
```

### Improvement 6 — Strict `JsonSchema` response format on Azure OpenAI (with fallback)

```text
`ArchLucid.AgentRuntime/AzureOpenAiCompletionClient.cs` currently uses
`ChatResponseFormat.CreateJsonObjectFormat()`. Azure OpenAI on supported deployments
(gpt-4o, gpt-5.x) supports `ChatResponseFormat.CreateJsonSchemaFormat(name, schema, ...)`
which forces the model to emit JSON conforming to the declared schema. This eliminates
the majority of schema-violation retries.

1. Add `AzureOpenAiOptions.UseStrictJsonSchemaResponseFormat` (default `false` to keep
   the V1 behaviour stable). Path: `AzureOpenAI:UseStrictJsonSchemaResponseFormat`.
2. When true AND a schema can be resolved for the active `AgentType`, build the strict
   response format from the existing `schemas/agentresult.schema.json` (or the per-role
   subschema if you also do Improvement 1). Pass `strict: true` and a stable schema
   name like `agent_result_v1`.
3. Wrap the `CompleteJsonAsync` call so that if the deployment rejects the strict
   format with a 400 (`unsupported_parameter` / `unsupported_response_format`), log
   one warning per (deployment, agentType) pair, fall back to
   `CreateJsonObjectFormat`, and remember the fallback in a process-local
   `ConcurrentDictionary` so subsequent calls skip the strict attempt.
4. Emit OTel counter `archlucid_agent_strict_schema_fallbacks_total{deployment,
   agent_type, reason}`.
5. Tests:
   - Unit test that the constructor builds a `JsonSchemaFormat` instance when the flag
     is true and a schema exists.
   - Integration test in `RealAzureOpenAIEndToEndTests` (skippable) that runs once
     with the flag on and asserts zero `AgentResultSchemaViolationException`s for the
     three handler agents.
6. Update `docs/library/AGENT_OUTPUT_EVALUATION.md` to mention the option and the
   expected reduction in remediation retries.
```

### Improvement 7 — DEFERRED — Embeddings-based evidence-faithfulness scorer

> **DEFERRED.** Title only, no full prompt. This requires owner approval for: (a) which Azure OpenAI text-embedding deployment to use (`text-embedding-3-large` vs `-small`), (b) whether to call embeddings on every trace evaluation or only on a sampled / RC subset, (c) the per-tenant cost budget impact, (d) the Key Vault secret rotation procedure for the embedding deployment if separate from the chat deployment.

### Improvement 8 — LLM-judge mean-of-N + dispersion

```text
`AgentOutputLlmSemanticJudge.TryJudgeAsync` calls the judge once. That is brittle for
a quality signal that drives a gate.

1. Add `AgentOutputLlmSemanticJudgeOptions.JudgeRepetitions` (default `1`, ceiling `5`,
   normalize on bind). Path: `ArchLucid:AgentOutput:LlmSemanticJudge:JudgeRepetitions`.
2. When `JudgeRepetitions > 1`, run the judge `N` times concurrently with the same
   prompt but distinct request ids. If any individual call returns null, treat its
   contribution as missing (do not zero-fill).
3. Aggregate:
   - `OverallQuality = median(values)` when at least 2 values returned, else the single
     value's quality, else null.
   - `Dispersion = stddev(values)` (population or sample — pick population for
     stability with small N; document the choice).
   - `Rationale` = the rationale of the median observation (or the first if even count).
4. Persist `LlmJudgeRepetitionsObserved` and `LlmJudgeQualityDispersion` on
   `AgentOutputSemanticScore`. Emit histogram
   `archlucid_agent_output_judge_dispersion` with `agent_type` label.
5. When `JudgeRepetitions > 1` AND `Dispersion > LlmSemanticJudgeOptions.MaxAcceptableDispersion`
   (new option, default `0.25`), set the gate outcome to at least `Warned`.
6. Tests:
   - With `N = 3`, mocked judge returns [0.6, 0.65, 0.9] -> median 0.65, dispersion
     non-trivial.
   - With `N = 3` and one null -> median of remaining two.
   - With `N = 1` -> existing behaviour preserved.

Update `docs/library/AGENT_OUTPUT_EVALUATION.md`. Highlight in the PR body that this
multiplies AOAI judge spend by `JudgeRepetitions` when used; default stays at 1 so the
V1 cost surface is unchanged.
```

### Improvement 9 — Pin per-deployment cost rates + bill reasoning tokens

```text
`ArchLucid.AgentRuntime/LlmCostEstimator.cs` uses a static rate map. Two concrete
issues:

(a) Adding a new Azure OpenAI deployment requires a code change. That is the wrong
    cadence for a billing surface a buyer will read in dashboards.
(b) `BuildReasoningTraceSnippet` reads
    `usage.OutputTokenDetails.ReasoningTokenCount` for the trace, but the cost
    estimator only multiplies input + output. Reasoning tokens on `o1`-class
    deployments will silently undercount spend.

1. Move the rate table into options:
   `LlmCostEstimationOptions.PerDeploymentRates : Dictionary<string,
   LlmRateRow>` where `LlmRateRow` has `InputUsdPer1kTokens`,
   `OutputUsdPer1kTokens`, optional `ReasoningUsdPer1kTokens`. Bind from
   `AzureOpenAI:CostEstimation:PerDeploymentRates:<deploymentName>`. Keep current
   defaults as fallback when no per-deployment row matches.
2. Plumb a `reasoningTokens` argument through `ILlmCostEstimator.EstimateUsd` (overload
   that accepts a third arg, default 0 for back compat). When the active deployment has
   `ReasoningUsdPer1kTokens`, multiply through. Otherwise fold reasoning tokens into
   the output-token count (or document the choice if otherwise).
3. Capture `ReasoningTokenCount` in `AzureOpenAiCompletionClient` alongside the
   existing `(Prompt, Completion)` `AsyncLocal` so the recorder can pass it to
   `EstimateUsd`. Add `LastCompletionReasoningTokens` analogous to
   `LastCompletionTokenUsage`.
4. `AgentExecutionTraceRecorder.RecordAsync`: accept and persist
   `reasoningTokenCount` (new optional column on `AgentExecutionTrace` — add a DbUp
   migration to the single SQL DDL file per the workspace rule). Emit
   `archlucid_llm_reasoning_tokens_per_call` histogram tagged by `tenant_label`.
5. Tests:
   - `LlmCostEstimatorTests`: per-deployment rate match overrides defaults.
   - `LlmCostEstimatorTests`: reasoning-token row is billed when configured.
   - `AgentExecutionTraceRecorderReproTests`: a recorded trace round-trips a
     reasoning-token count when supplied.

Update `docs/CONFIGURATION_REFERENCE.md` (or whichever current keys reference is
authoritative — verify, do not assume). Do not rename existing observability
instruments.
```

---

## 4. Additional improvements I think matter (not in the top-9, smaller leverage but worth tracking)

These are intentionally listed without full Cursor prompts; they are observations from the same first-principles read.

1. **Honour Azure OpenAI `Retry-After` headers in the LLM retry pipeline.** Generic exponential backoff with jitter is fine for transient errors, but 429s carry a precise hint that should be respected ahead of the jitter formula. `LlmCallResilienceDefaults` is the obvious extension point.
2. **Per-tenant concurrency bulkhead.** `AgentHandlerConcurrencyGate` is process-wide. A noisy tenant can starve quiet tenants. Add a per-tenant `SemaphoreSlim` keyed by `ScopeContext.TenantId` with a smaller default than the process-wide gate.
3. **Default `FallbackAgentCompletionClient` into the Production composition.** It exists, is tested, and is currently opt-in. Putting it in the Production chain (with a documented secondary deployment) gives buyers a real "model failover" story.
4. **Replace the implicit `citations` array check inside `AgentExecutionTraceRecorder.RecordAsync` with an explicit `IAgentResultCitationGuard` invoked by handlers.** The current side-effect-inside-write semantics are confusing; an explicit guard is testable and aligns with the contract that `evidenceRefs` is the canonical citation surface.
5. **Reconcile `AI_AGENT_PROMPT_REGRESSION.md` with `prompt_regression_baseline.json`.** The doc still says only Topology has merge-blocking floors; the JSON shows all four agent types at 0.95 / 0.85. Pick one and align both.
6. **Add a "judge-of-judge" or self-consistency sampling on RC builds only.** For PR CI, single judge call is fine. For RC, run the judge `N=3` (Improvement 8) AND additionally evaluate the median-of-medians across 3 runs of the corpus. This is a release-candidate gate, not a per-trace cost.
7. **Add evidence-injection fixtures to `tests/eval-corpus/`.** Today the corpus exercises agent-output quality. Adding a few "evidence contains 'ignore all previous instructions' inside `PolicyEvidence.Summary`" scenarios would verify Improvements 3 + 4 in CI.
8. **Tighten the `AgentResultEvidenceFaithfulnessChecker` stopword list before introducing the embeddings scorer (Improvement 7).** Removing `compliance`, `security`, `system`, `design`, `architecture`, `manifest`, `decision`, `finding(s)`, `recommend`, `summary` from the stopword list would dramatically improve overlap signal even before embeddings ship.
9. **Make `archlucid_agent_output_*` histograms tenant-tagged (cardinality-bounded) in the gate metric.** Today only `agent_type`, `outcome`, `gate_mode` are labels. A `tenant_label` (already used by the cost histogram with `unknown` fallback for unscoped) would let dashboards show per-tenant rejected-ratio without backend joins.
10. **Documented "release-credible threshold preset" in `appsettings.Production.json`.** Floors of 0.7 structural / 0.5 semantic are conservative; an enterprise security review will read them as low. A second preset (`Mode: PilotStrictReleaseCredible` or similar) at 0.9 / 0.75 would give buyers a visible "we run the gate at higher floors than the defaults" answer.

---

## 5. Pending questions for you (need your input before I can do the work)

These are the items I cannot complete without an owner decision. Hold these for when you have time; if you ask "what pending questions do you have?" I will surface this list.

| # | Question | Blocks |
|---|----------|--------|
| Q1 | Does the `Azure.AI.ContentSafety` package version pinned in this repo expose the **Prompt Shield** API (`ShieldPrompt` / jailbreak detection / indirect-injection detection) in stable, or do we need to upgrade to a preview channel? If preview, is that acceptable for V1 GA? | Improvement 4 (Prompt Shield) — the partial implementation can land behind a feature flag, but turning it on in `appsettings.Production.json` requires this answer. |
| Q2 | Will the org pay for an **Azure OpenAI text-embedding deployment** call on every trace evaluation (`Improvement 7` — embeddings-based evidence faithfulness), or only on a sampled subset / RC pipeline? Which deployment (`text-embedding-3-large` vs `-small`)? | Improvement 7 (DEFERRED) — entire feature gated on this. |
| Q3 | For the LLM-judge mean-of-N (`Improvement 8`), what `JudgeRepetitions` cap is acceptable in `PilotStrict`? Default `1`, optional `3`, ceiling `5` is my proposal — confirm or adjust. The cost multiplier on judge spend is linear in N. | Improvement 8 default is 1 so I can ship it without your sign-off, but the recommended `appsettings.Production.json` value (3?) needs confirmation. |
| Q4 | For the indirect-injection precheck on evidence fields (`Improvement 3`), should the production default be `Block` (run fails before execute) or `RedactAndWarn` (precheck stamps audit, content gets redacted, run continues)? My proposed default is `RedactAndWarn` for V1 backward-compat, opt-in `Block` per tenant. | Improvement 3 default behaviour. |
| Q5 | Owner-pinned **reference Azure OpenAI deployment** name(s) for the release-credibility floor — should the new strict `JsonSchema` response format (Improvement 6) require those exact deployments to be a known-good model (e.g., `gpt-4o`, `gpt-5`)? Or fall back transparently for any deployment that 400s on the strict format? | Improvement 6 production posture (today my prompt says "fall back transparently" — confirm). |

---

## 6. What this assessment intentionally did NOT score

These items are deferred to V1.1 / V2 per `docs/library/V1_SCOPE.md` §3 and `docs/library/V1_DEFERRED.md` §6b–§6f. Per workspace rule `Assessment-Scope-V1_1.mdc`, they are excluded from `(A)` headline weighted readiness:

- **MCP membrane (V1.1, §6d)** — no MCP host or tool surface scored. The agent runtime exposes services through REST / CLI for V1; that is the supportable shape.
- **SOC 2 CPA attestation (post-V1.1)** — agent-runtime safety is not penalised for absence of a CPA SOC 2 report. Trust posture and self-assessment narratives are what V1 commits to.
- **Design partner / signed early-adopter (V1.1, §6b)** — no agent-runtime score deduction for absence of a design-partner contract.
- **Distributed Redis as default substrate (V2, §6e)** — agent-runtime caching uses optional Redis or in-memory per current contract; no score impact for not provisioning Redis at single-replica.
- **Azure Container Apps Jobs / Durable Task Framework (V2, §6f)** — orchestration substrate is the current `RealAgentExecutor` + `AuthorityRunOrchestrator`; not penalised for not adopting DTF.
- **Third-party pen-test summary (V2, §6c)** — not in scope.

I located these markdown files cleanly. **No deferred-task markdown is missing for any of the items in this assessment.** If you point me at a specific deferral you think I should also exclude, I will re-run with it.

---

## 7. Summary

- **Weighted score: 70.24%.**
- **Two pillars dominate the gap:** Pillar 3 (eval harness fidelity, weight 15%, score 60) and Pillar 7 (safety, weight 12%, score 55). Together they account for **12.0 / 29.76** points of the gap.
- **Highest-leverage individual fixes:** Improvements 1, 2, 3, 5 — none of them require new vendor dependencies and all four can be implemented this week without owner sign-off.
- **One DEFERRED item** (Improvement 7, embeddings-based faithfulness) — owner must decide cost / deployment posture before that work can land.
- **Five pending questions** are listed in §5 for when you have time. I can implement Improvements 1, 2, 3 (default `RedactAndWarn`), 5, 6 (default fall-back-transparently), 8 (default `1`), and 9 with no further input. I can ship Improvement 4 as a partial behind a feature flag with an explicit "verify SDK exposes Prompt Shield" note in the PR.
