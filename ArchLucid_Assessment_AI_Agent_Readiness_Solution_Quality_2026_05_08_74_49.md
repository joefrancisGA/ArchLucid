# ArchLucid AI Agent / Readiness Solution Quality Assessment - 74.49%

**Scope:** Independent assessment of the AI Agent / Readiness solution quality only. I did not look at any prior assessment scores while forming this one. I excluded scope explicitly deferred per `docs/library/V1_SCOPE.md` § 3 and `docs/library/V1_DEFERRED.md`: the inbound MCP membrane is V1.1; the outbound MCP client is V2; Durable Task Framework / Azure Container Apps Jobs orchestration is V2; Redis-as-default + distributed graph projection cache is V2; SOC 2 CPA report, design partner, marketplace publication, and other commercial / procurement items are not part of an AI-agent solution-quality score.

**Bottom line:** **74.49 / 100.** This is a substantially above-prototype AI agent layer. The orchestrator, resilience, cost guardrails, prompt redaction, simulator-based eval corpus, fail-closed content safety in production-like hosts, persisted PilotStrict citation / evidence-ref enforcement, and an explicit sponsor-evidence verdict (`PilotBuyerSafeEvidenceGateEvaluator`) are all real and well-engineered. The honest commercial gap is that the repo proves *deterministic-simulator quality* and *structural shape* far more than it proves *true-vs-evidence-package answer quality* under realistic conditions. There is no committed real-mode AgentResult exemplar for any scenario, no CI workflow that actually invokes the existing release-candidate eval wrapper, and the prompt-injection fixtures are still shape-only with one prompt per category.

## Weighted Score

Categories are ordered by weighted improvement-need (weight × current gap).

| Area | Weight | Score | Weighted Points | Why It Lands There |
|---|---:|---:|---:|---|
| Real-mode proof and release gating | 22% | 70 | 15.40 | `PilotStrict` with `EnforceOnReject=true` + `BlockRunOnReject=true` is now in **both** `appsettings.Production.json` and `appsettings.Staging.json`. `scripts/ci/run_eval_agent_corpus_rc.sh` exists and `--require-real-mode-evidence` correctly fails closed when env vars are missing — but **no workflow invokes the RC wrapper**, so the safety net is opt-in human-driven and easily forgotten on a release cut. The nightly `cohort-real-llm-gate` job's last test step still says "no live OpenAI invoke in CI." |
| Output quality, faithfulness, and evaluator strength | 20% | 70 | 14.00 | `HeuristicAgentOutputSemanticEvaluator` weighs Compliance / Topology / Critic / Cost differently. `AgentOutputTraceQualityEvaluator` enforces PilotStrict citations and `PilotStrictMinEvidenceRefCount`. `ExplanationFaithfulnessChecker` exists with `PilotStrictMinFaithfulnessSupportRatio` wired to options. The remaining gap: `MinDescriptionLength=10` and `MinRecommendationLength=5` make field completeness trivial to satisfy, the LLM judge ships disabled (empty `DeploymentName`), and there is no faithfulness check that compares **AgentResult claims/findings** against the **evidence package** (services, policies, patterns) the agent was given — only an explanation-vs-trace token-overlap heuristic. |
| Eval corpus and CI enforcement | 15% | 65 | 9.75 | The synthetic corpus is real (11 scenarios, 1.00 recall, 0 unexpected, simulator quality gate accepted at strict floors locally). The per-agent `tests/eval-datasets/{topology,cost,compliance,critic}-eval.json` files are placeholder stubs (`"expect": {"minFindings": 0, "maxFindings": 500}` — literally any output passes). `tests/eval-datasets/prompt-injection/{direct-override,exfiltration,tool-abuse}.json` each have **one** prompt and are validated for shape only — no fixture is executed against `DefaultRequestContentSafetyPrecheck`, `AgentResultParser`, `PromptFieldRedactor`, or the simulator/heuristic eval path. PR CI runs the corpus informationally; the scheduled job runs it without `--enforce`. |
| Orchestration, resilience, and failure semantics | 15% | 86 | 12.90 | `RealAgentExecutor` orders tasks deterministically, supports staged-critic two-phase execution, drains parallel handlers on partial budget exhaustion (`AgentRunPartialBudgetException` carries successful peers), cancels peers via linked `CancellationTokenSource`, propagates `AmbientScopeContext` for thread-pool continuations, and applies a per-agent timeout pipeline cached by seconds. `CircuitBreakingAgentCompletionClient`, `FallbackAgentCompletionClient` (with `RecordLlmCompletionFallbackEngaged` + Activity tags), and `CostGuardrailInterceptor` cover the failure surface honestly. `ExecutionCompletedQualityRejected` is a first-class run status and the orchestrator path is unit-tested. |
| Prompt safety, tenant isolation, and cache boundaries | 10% | 80 | 8.00 | `LlmCompletionCacheKey` partitions by tenant scope and isolates simulator entries; null/empty tenant scope is rejected when partitioning is on for non-simulator. `ContentSafetyProductionLikePostConfigure` forces `FailClosedOnSdkError=true` for production-like hosts, and `ContentSafetyRules` startup validation requires endpoint+key in Production / Staging. `ProductionDangerousMisconfigurationLint` requires `LlmPromptRedaction:Enabled=true` for real mode in production. The remaining surface: `PromptFieldRedactor` only redacts emails and `sk-` / `Bearer` tokens, the inbound `DefaultRequestContentSafetyPrecheck` is 11 hardcoded phrases (paraphrase-defeatable), and `QuickScanService` has a hardcoded inline system prompt that bypasses the catalog discipline. |
| Observability and explainability | 10% | 82 | 8.20 | Trace recorder persists prompts/responses with redaction and blob offload; `ArchLucidInstrumentation` emits per-run LLM call counts, parse-failure totals, gate outcomes, fallback-engaged events, and per-handler invocation counts with success/error tags; per-finding trace-completeness is computed; `RunExplanationSummary.FaithfulnessSupportRatio` is exposed; `RunTrustEvidenceCardBuilder` aggregates the operator-facing card. The remaining gap: `LlmTelemetry:RecordPerTenantTokens=false` by default leaves spend visibility coarse, and the merged reasoning trace is text concatenation rather than a structured envelope. |
| Operator readiness and commercial demo defensibility | 8% | 78 | 6.24 | `PilotBuyerSafeEvidenceGateEvaluator` returns `DemoOnly` / `Partial` / `Complete` with explicit `NotSendable` / `SendableWithCaveats` / `Sendable` and named hard- and soft-gap reasons (PilotStrict trace failure, `RealModeFellBackToSimulator`, missing audit rows, demo-tenant detection). `RunTrustEvidenceCardBuilder` builds the card with execution-mode disclosure, AI explainability rollup, top-finding chain, and named links. The remaining gap: no committed real-mode AgentResult exemplar means the verdict has never been demonstrated as `Complete / Sendable` for an actual real-mode run. |

**Total weighted score: 74.49 / 100.**

## 1. Real-Mode Proof And Release Gating Need The Most Work

This is the single largest leverage item because the product is sold on AI-assisted architecture judgment, and the repo currently proves simulator quality far more credibly than real-model quality.

What is in:

- `appsettings.Production.json` and `appsettings.Staging.json` both set `Mode=PilotStrict`, `StructuralRejectBelow=0.7`, `SemanticRejectBelow=0.5`, `PilotStrictMinStructuralCompleteness=0.9`, `PilotStrictMinEvidenceRefCount=2`, `EnforceOnReject=true`, `BlockRunOnReject=true`. The `appsettings.Staging.json` posture matches production now (recent commit `f866b241a`).
- `ArchitectureRunExecuteOrchestrator` sets `LegacyRunStatus=ExecutionCompletedQualityRejected`, emits the `RunQualityGateRejected` audit event, and rethrows for the API 409 filter when both flags are on. Tested in `ArchitectureRunExecuteOrchestratorQualityGateBlockingTests`.
- `RealLlmOutputStructuralValidator` rejects non-JSON output, missing top-level keys, missing `findings`, hollow severity, hollow content, missing `trace` object, and missing trace list fields.
- `scripts/ci/run_eval_agent_corpus_rc.sh` already exists. It calls `eval_agent_corpus.py --enforce --min-recall 0.75 --enforce-quality-gate --require-real-mode-evidence`. I ran it locally: with no env vars set it fails fast with `::error::real-mode quality scenarios require captured evidence when using --require-real-mode-evidence`.

What is not good enough:

- **No CI workflow invokes the RC wrapper.** `agent-eval-datasets-nightly.yml` runs `eval_agent_corpus.py` without `--enforce`, `--enforce-quality-gate`, or `--require-real-mode-evidence`, so the existing safety net is functionally human-driven during release cuts.
- **No committed real-mode AgentResult exemplar exists.** `tests/eval-corpus/agent-results/` only holds `*.simulator.json`. The `corpus-real-mode-smoke` scenario points to an env var (`ARCHLUCID_EVAL_CORPUS_REAL_MODE_SMOKE_AGENT_RESULT`) that is never set in any pipeline, so no release run has ever shipped real-mode evidence in the repo.
- **The nightly `cohort-real-llm-gate` job is misnamed.** Its only test step's name explicitly says `Run golden cohort real-LLM gate tests (no live OpenAI invoke in CI)` and `GoldenCohortRealLlmGateTests` only checks that `cohort.json` and `usage-mtd.json` are present and parse. A release reader would reasonably believe live model quality is being continuously gated; the test code does not gate that.

Tradeoff: keeping real-LLM invocation owner-conducted controls cost, avoids flakiness, and matches `Q15` ($50/mo cap with kill-switch). That is rational. The unsafe outcome is invisible silence: a run that looks operationally green can ship without ever producing release-grade real-mode evidence.

## 2. Output Quality Checks Are Useful But Still Too Shape-Friendly

The semantic evaluator is materially better than a JSON parser:

- `HeuristicAgentOutputSemanticEvaluator` weighs Compliance 0.7 claims / 0.3 findings; Topology 0.4 / 0.6; Critic 0.25 / 0.75; Cost 0.55 / 0.45.
- `AgentOutputTraceQualityEvaluator.TryEvaluateTraceAsync` rejects PilotStrict traces below structural / semantic floors, on missing citations (`citations` array), and below evidence-ref count.
- `RunAgentOutputPilotEvidenceAggregator.WouldPilotStrictBlockSponsorEvidenceAsync` aggregates per-trace plus an aggregate `FaithfulnessSupportRatio` floor when `PilotStrictMinFaithfulnessSupportRatio` is set.
- `ExplanationFaithfulnessChecker` exists (token-overlap heuristic of explanation tokens against the trace blob).

The blunt issues:

- `MinDescriptionLength=10` and `MinRecommendationLength=5` are trivially satisfied by any reasonable output. A finding is "complete" with `description="placeholder."` (11 chars) and `recommendation="see"` (3 chars actually fails — but `"do x."` (5 chars + 1) passes). That is shape, not truth.
- `AgentOutputLlmSemanticJudge` has `DeploymentName=""` in shipping configs, so the LLM judge is effectively off until an operator wires it.
- There is **no AgentResult ↔ evidence-package faithfulness checker** that verifies the agent's claims and findings are grounded in the evidence the agent was given (`AgentEvidencePackage.Policies`, `ServiceCatalog`, `Patterns`, `PriorManifest`). `ExplanationFaithfulnessChecker` only checks explanation text against the *trace* blob — it does not catch a claim that cites a non-existent policy or a finding that recommends a service the catalog never offered.
- `PerAgentTypeFloors` is supported by `AgentOutputQualityGate` but is empty in every shipping profile.

Tradeoff: the optional LLM judge can be expensive and flaky; heuristics are cheap and deterministic, which is right for CI. But you cannot defensibly claim "AI quality gated" while the heuristic only checks shape, the LLM judge is off by default, and no checker grounds claims in the evidence package.

## 3. Eval Corpus Passes Strict Local Gates But Surrounding Datasets Are Thin And CI Is Informational

I ran:

```bash
python scripts/ci/eval_agent_corpus.py --enforce --min-recall 0.75 --enforce-quality-gate
```

Result: 11 / 11 scenarios at recall 1.00, 0 unexpected, simulator quality gate accepted, `real_mode_quality total=1 skipped_no_env=1 evaluated=0 evidence_captured=no`. The corpus is real and substantive.

The surrounding gaps:

- `tests/eval-datasets/topology-eval.json`, `cost-eval.json`, `compliance-eval.json`, `critic-eval.json` are placeholders. Each case is `{ "id": "topology-01", "expect": { "minFindings": 0, "maxFindings": 500 } }`. A range of 0..500 means the dataset never disproves anything. `eval_agent_quality.py --manifest-only` validates this passes shape, which it always will.
- `tests/eval-datasets/prompt-injection/{direct-override,exfiltration,tool-abuse}.json` each contain **one** entry. `eval_agent_quality.py --prompt-injection-only` validates the JSON shape and the category enum. No fixture is ever executed against the `DefaultRequestContentSafetyPrecheck`, `AgentResultParser`, `PromptFieldRedactor`, or the simulator quality path.
- `agent-eval-datasets-nightly.yml` runs `eval_agent_corpus.py` without `--enforce`, `--enforce-quality-gate`, or `--require-real-mode-evidence`. PR CI calls it informationally too.

Tradeoff: keeping datasets generous early makes corpus growth painless. But a placeholder dataset that "always passes" is worse than no dataset because it implies coverage that does not exist.

## 4. Orchestration Is A Real Strength

The agent execution architecture stands up:

- `RealAgentExecutor` orders tasks by dispatch key, supports staged critic, drains parallel handlers via `Task.WhenAny` so a budget exception with at least one successful peer raises `AgentRunPartialBudgetException` carrying those peers, and cancels in-flight peers via linked `CancellationTokenSource`.
- `AmbientScopeContext.Push(batchScope)` ensures scoped services (LLM accounting, RLS context) resolve correctly on thread-pool continuations.
- `CircuitBreakingAgentCompletionClient` + `FallbackAgentCompletionClient` (Azure SDK 429 / 5xx detection on both `HttpRequestException` and `ClientResultException`) wire through to `ArchLucidInstrumentation.RecordLlmCompletionFallbackEngaged` and Activity tags.
- `CostGuardrailInterceptor` enforces both `MaxTokensPerRun` and `MaxCostPerRun` and throws `CostLimitExceededException` deterministically.
- `AgentExecutionResilienceOptions` supports per-agent timeouts (e.g. `topology=900`), and `Polly` timeout pipelines are cached per timeout-seconds value.

V2 deferred items (Durable Task Framework, Azure Container Apps Jobs) are explicitly out of scope per `V1_DEFERRED.md` § 6f. They are not a deduction here.

## 5. Safety, Cache, And Tenant Boundaries Are Mostly Sound With Two Specific Gaps

Strong:

- `LlmCompletionCacheKey` includes provider/model label, prompt hash, simulator flag, and scope partition. Empty tenant scope is rejected for non-simulator partitioning.
- `ContentSafetyProductionLikePostConfigure` forces `FailClosedOnSdkError=true` for Production / Staging / `ProductionValidation:Strict`. Operators cannot accidentally ship fail-open.
- `ContentSafetyRules` startup validation refuses to start in Production / Staging without `Endpoint` + `ApiKey`.
- `ProductionDangerousMisconfigurationLint` requires `LlmPromptRedaction:Enabled=true` when `AgentExecution:Mode=Real` under production-profile validation, requires telemetry export when `RequireTelemetryExport=true`, and refuses `Authentication:ApiKey:DevelopmentBypassAll`.
- `AgentExecutionRules` rejects Real mode without Azure OpenAI keys (or `Echo` client), and validates `MaxCompletionTokens` bounds.
- `LlmDailyTenantBudgetTracker` and `LlmMonthlyTenantDollarBudgetTracker` exist and are unit-tested.

Specific gaps:

- `PromptFieldRedactor` only matches `[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}` and `\b(sk-[a-zA-Z0-9]{16,}|Bearer\s+...)\b`. A pasted SSN, 16-digit card number, AKS connection string, JWT body, or non-Bearer token slips through. For an architecture-context product where buyers paste prod connection strings, this surface deserves more patterns.
- `DefaultRequestContentSafetyPrecheck` is a list of 11 phrases. `"please disregard your earlier rules"` defeats it. Useful as a tripwire, but not the credible defense the docstring implies.
- `QuickScanService` has its own inline `SystemPrompt` and parses `severity` permissively (`Info` fallback on bad enum). It is outside the catalog and outside `AgentOutputTraceQualityEvaluator`. A `.filescan` style operator surface could leak this looseness into customer demos.

## 6. Observability Is Good; The Gaps Are Per-Tenant Spend And Trace Structure

What is present:

- `AgentExecutionTraceRecorder` truncates prompt/response (`MaxContentLength=8192`), offloads larger content to blob (`agent-traces` container), runs prompt redaction before persistence, and emits durable audit events.
- `ArchLucidInstrumentation` emits per-run LLM call counts (`LlmCallsPerRun`), per-handler invocation counters tagged by `agent_type_key` and `outcome=success|error`, parse-failure totals, gate-outcome metrics, and fallback-engaged events.
- `Activity` tags carry `archlucid.run_id`, `archlucid.task_id`, `archlucid.agent.type`, `archlucid.agent.prompt_version`, `archlucid.agent.confidence`, `archlucid.agent.findings_count`, `archlucid.agent.claims_count`, and `archlucid.llm.completion.fallback_engaged`.
- `RunExplanationSummary.FaithfulnessSupportRatio`, `UsedDeterministicFallback`, and `FaithfulnessWarning` are surfaced through the trust-evidence card.

Gaps:

- `LlmTelemetry:RecordPerTenantTokens=false` by default. The trade is privacy / cardinality vs spend visibility — fine as a default, but operators running multiple tenants get aggregate spend without per-tenant breakdown, making cost overruns harder to attribute.
- `MergeProviderReasoningTrace` concatenates string trace using `"\n\n---\n\n"`. There is no structured representation that downstream consumers can reliably parse for citations vs reasoning vs tool calls.

## 7. Operator / Demo Readiness Is Good On Paper But Has Never Been Validated For A Real-Mode Run

`PilotBuyerSafeEvidenceGateEvaluator` returns explicit `(Tier, Sendability)` pairs with named hard- and soft-gap reasons:

- Hard gaps: missing run id, missing committed manifest / wrong status, zero audit rows, PilotStrict agent output failure on aggregate evidence.
- Soft gaps: default manifest UTC timestamps, `RealModeFellBackToSimulator`, top-finding evidence chain that did not resolve, unattested LLM call count, partial / default ROI baseline.

`RunTrustEvidenceCardBuilder` aggregates an operator-facing card with execution-mode (with `LowConfidence` for fallback), manifest snapshot, audit count, trace totals, artifact bundle pointer, AI explainability rollup (with `LowConfidence` for `UsedDeterministicFallback` or `FaithfulnessWarning`), top-finding chain, and named links.

What is missing: no committed real-mode AgentResult exemplar means the verdict has never been observed as `Complete / Sendable` for an actual real-mode run — it has only been demonstrated for simulator runs. From a buyer perspective, that posture is honest but means the first paying real-mode customer is the first proof.

## Exclusions I Did Not Penalize

- **DEFERRED: Inbound MCP membrane** - V1.1. Not scored.
- **DEFERRED: Outbound MCP client to arbitrary external tool servers** - V2 unless promoted. Not scored.
- **DEFERRED: Durable Task Framework / Azure Container Apps Jobs orchestration migration** - V2 situational backlog. Not scored.
- **DEFERRED: Distributed graph snapshot projection cache + Azure Cache for Redis as the default substrate** - V2 enhancement. Not scored.
- SOC 2 CPA report, third-party pen test, design partner, marketplace publication, PGP key drop are outside an AI-agent solution-quality score (`(B)` procurement realism per `.cursor/rules/Assessment-Scope-V1_1.mdc`).

## The Eight Best Improvements (Highest Leverage First)

### 1. Wire `run_eval_agent_corpus_rc.sh` Into A Release-Mode Workflow That Fails Closed When Real-Mode Evidence Is Missing

Why it matters: the wrapper exists and works (I confirmed locally that `--require-real-mode-evidence` fails fast when env vars are missing), but no workflow invokes it. That makes the safety net opt-in human-driven on every release cut.

Can be started without your input: yes for the workflow + branch trigger. Owner action required to (a) name the trigger (release branches, RC tags, manual dispatch), (b) supply the path to a captured Web `AgentResult` JSON in a secure location, and (c) decide if this gate becomes required in branch protection.

Cursor prompt:

```text
Add a release-candidate workflow file .github/workflows/agent-eval-corpus-rc.yml that invokes scripts/ci/run_eval_agent_corpus_rc.sh.

Goals:
- Trigger on workflow_dispatch and on push tags matching v*-rc* and release/* branches; do not run on default PR or push to main.
- Pass through ARCHLUCID_EVAL_CORPUS_REAL_MODE_SMOKE_AGENT_RESULT and any other agentResultPathEnv values declared in the corpus scenarios so real-mode rows actually evaluate.
- Capture the markdown report (ARCHLUCID_EVAL_CORPUS_MARKDOWN_REPORT) and upload as a workflow artifact named eval-corpus-rc.
- The workflow MUST exit non-zero when --require-real-mode-evidence finds skipped rows, when --enforce trips on recall, or when --enforce-quality-gate trips on simulator gate rejection.
- Add a separate step that asserts at least one tests/eval-corpus/agent-results/*.real.json exists in the workspace; if none, fail the job with an actionable error pointing to docs/quality/REAL_LLM_RUN_EVIDENCE_TEMPLATE.md.
- Document in docs/library/AGENT_EVAL_CORPUS.md how to capture the AgentResult JSON via Invoke-RealLlmEvidenceGate.ps1 and how to commit the resulting real exemplar (or store it in a secret-protected location and pass the path via env var).

Validation:
- Lint the YAML with actionlint if available.
- Run scripts/ci/eval_agent_corpus.py --enforce --min-recall 0.75 --enforce-quality-gate --require-real-mode-evidence locally with and without the env var set; confirm the script's exit code matches what the workflow would observe.
- Do not introduce live LLM calls in default CI; only the RC workflow should pass --require-real-mode-evidence.
- Do not use ConfigureAwait(false) in tests.
```

### 2. Build A Deterministic AgentResult ↔ Evidence-Package Faithfulness Checker (Distinct From Explanation Faithfulness)

Why it matters: `ExplanationFaithfulnessChecker` only checks explanation tokens against the *trace blob*. It cannot catch a claim that cites a policy id that does not exist in the evidence package, or a finding recommending a service the `ServiceCatalog` never offered. This is the next-highest-leverage quality lift after gating real-mode evidence.

Can be started without your input: yes. The persisted `AgentEvidencePackage`, `AgentResult.Claims` (with `evidenceRefs`), `AgentResult.Findings`, and `AgentResult.proposedChanges` are all available.

Cursor prompt:

```text
Add a deterministic AgentResult faithfulness checker in ArchLucid.AgentRuntime that grounds claims and findings against the AgentEvidencePackage and prior manifest, separate from the existing ExplanationFaithfulnessChecker.

Goals:
- New service IAgentResultEvidenceFaithfulnessChecker + AgentResultEvidenceFaithfulnessChecker (each in its own file).
- Input: AgentResult, AgentEvidencePackage, optional GoldenManifest summary.
- Compute and return AgentResultEvidenceFaithfulnessReport with: claims checked, claims supported (claim text shares >=1 token with the cited evidence row, AND evidenceRefs resolve to a real evidence row), findings supported (finding cites a real category present in evidence package or prior manifest), recommendations supported (recommendation text shares >=1 token with at least one allowed service catalog entry or pattern), unsupported list (capped at 32 ids).
- Heuristic only; no LLM call. Token rules consistent with ExplanationFaithfulnessChecker (>=4 chars, stopword filter, lowercased).
- Wire into AgentOutputTraceQualityEvaluator: when PilotStrict and AgentOutputQualityGateOptions.PilotStrictMinAgentResultFaithfulnessSupportRatio is set (new optional double?), reject the trace when the per-trace ratio is below the floor.
- Add the new ratio to the agent-evaluation API response under a new field `agentResultFaithfulnessSupportRatio` (double?), without breaking existing consumers (additive only).

Validation:
- Add unit tests covering: (a) all claims supported, (b) one claim with unresolved evidenceRef, (c) one claim with cited evidence but zero token overlap, (d) one finding citing a category not in evidence/prior manifest, (e) one recommendation referencing a service not in the catalog.
- Update docs/library/AGENT_OUTPUT_EVALUATION.md to clearly distinguish "structural completeness", "heuristic semantic", "explanation→trace token overlap (existing)", and "AgentResult→evidence-package token overlap (new)". State explicitly that none of these are legal-grade truth checks.
- Do not use ConfigureAwait(false) in tests.
```

### 3. Replace Placeholder Per-Agent Eval Datasets With Substantive Cases That Can Actually Fail

Why it matters: `topology-eval.json`, `cost-eval.json`, `compliance-eval.json`, `critic-eval.json` currently each have five rows with `{"expect":{"minFindings":0,"maxFindings":500}}`. Anything passes. The dataset implies coverage that does not exist. The `eval_agent_quality.py` validator is happy because it checks the shape, not the content quality.

Can be started without your input: yes. Owner input optional to confirm calibration realism per category once drafted.

Cursor prompt:

```text
Replace the placeholder per-agent eval dataset files under tests/eval-datasets with realistic minFindings / maxFindings ranges and per-case input descriptors, so the dataset can actually fail when an agent regresses.

Goals:
- For each of topology-eval.json, cost-eval.json, compliance-eval.json, critic-eval.json: deliver at least 8 cases (was 5), each with: id, a short architecturalContext string (small JSON object describing services/datastores/regions/severity-target), expect.minFindings, expect.maxFindings, expect.requiredCategories (array of category strings the agent must surface), expect.forbiddenCategories (array of categories that must NOT appear).
- Calibrate ranges from current simulator behavior on similar inputs. Prefer narrow ranges (e.g. 2..6 for topology) over loose ranges (0..500). Note any case where the calibration is uncertain in a top-level "calibrationNotes" string per file.
- Update scripts/ci/eval_agent_quality.py to validate the new fields exist (architecturalContext, expect.requiredCategories, expect.forbiddenCategories, with backwards compatibility for older shape during the transition). Add a --strict flag that requires the new fields and turn it on in the nightly workflow.
- Update tests/eval-datasets/manifest.json to bump schemaVersion to 2 and add a minRequiredCategories: 1 minimum gate per dataset.
- Update docs/library/AGENT_EVAL_CORPUS.md (or the per-agent doc) describing how to add a case and how to recalibrate when prompts change.

Validation:
- Run python scripts/ci/eval_agent_quality.py --manifest-only and --prompt-injection-only.
- Run python scripts/ci/eval_agent_quality.py --strict (new flag) and confirm it accepts the updated files.
- Update AgentEvalDatasetShapeTests.cs to assert the same constraints from the .NET side.
```

### 4. Turn Prompt-Injection Fixtures Into Executable Behavioral Regression And Expand To 6+ Prompts Per Category

Why it matters: today the prompt-injection datasets have one prompt per category and are validated for shape only. That proves fixture hygiene, not that the system actually resists the injection. `DefaultRequestContentSafetyPrecheck`'s 11-phrase blocklist has never been adversarially exercised against the fixtures.

Can be started without your input: yes for the executable behavioral regression and the expanded fixture set. Owner input optional on edge-case adjudication (e.g. should a particular paraphrase be expected to block at the precheck or only at the LLM judge layer).

Cursor prompt:

```text
Convert the prompt-injection fixtures from shape-only validation into executable behavioral regression and expand each category to at least 6 prompts.

Goals:
- For each fixture (direct_override, exfiltration, tool_abuse), add 5+ additional prompts per file: paraphrases of the existing one, unicode lookalikes, base64-encoded variants, indirect "summarize this document" wrappers, and pasted-tool-XML variants. Each entry must have id, category, userPrompt, and a new field expectedBlockedAt: "precheck" | "redactor" | "evaluator" | "judge".
- Add ArchLucid.AgentRuntime.Tests/PromptInjection/PromptInjectionExecutableRegressionTests.cs that loads the fixtures and asserts:
  * For expectedBlockedAt=precheck: DefaultRequestContentSafetyPrecheck.EvaluateAsync returns IsAllowed=false with a non-empty Reasons list.
  * For expectedBlockedAt=redactor: PromptFieldRedactor.RedactForPrompt removes the target token (assert the substring no longer appears).
  * For expectedBlockedAt=evaluator: when the prompt is fed through a deterministic simulator path that returns the userPrompt verbatim as a finding description, AgentOutputTraceQualityEvaluator under PilotStrict yields Rejected.
  * For expectedBlockedAt=judge: skip when no LLM judge is configured (do not turn into a flake), but record a counter so the report shows the un-evaluated coverage.
- Add a Python wrapper test in scripts/ci/tests/test_prompt_injection_behavioral.py that covers the precheck and redactor paths offline (no .NET runtime required) so PR CI gets the signal cheaply.
- Wire the new .NET test class into the Tier 1 fast core filter (Suite=Core) so it runs on every PR.

Validation:
- Run the new tests; assert at least one expectedBlockedAt=precheck case proves DefaultRequestContentSafetyPrecheck flags it.
- For any case where the fixture says expectedBlockedAt=precheck but the precheck does not block, EITHER widen DefaultRequestContentSafetyPrecheck.BlockedPhrases (with a unit test that locks the new phrase) OR change the fixture's expectedBlockedAt to a later layer with a justification comment.
- Do not use ConfigureAwait(false) in tests.
```

### 5. Rename The Golden-Cohort "Real-LLM Gate" Job And Separate Preflight From Live-Invocation Honestly

Why it matters: the current `cohort-real-llm-gate` job runs `Run golden cohort real-LLM gate tests (no live OpenAI invoke in CI)` and `GoldenCohortRealLlmGateTests` only checks fixture file presence. A reader scanning workflow names reasonably believes live model quality is being continuously gated. It is not.

Can be started without your input: yes for renaming and documentation alignment. Owner action remains required to provision the dedicated Azure OpenAI deployment and decide if a real live-invocation job is created (Q15-conditional).

Cursor prompt:

```text
Honestly rename and re-scope the golden-cohort "real-LLM gate" job in .github/workflows/golden-cohort-nightly.yml so the workflow name does not overstate what runs.

Goals:
- Rename the job from cohort-real-llm-gate to cohort-real-llm-preflight. Update its display name to "Cohort real-LLM preflight (budget probe + cohort fixture presence; no live model)".
- Rename the test step from "Run golden cohort real-LLM gate tests (no live OpenAI invoke in CI)" to "Cohort fixture presence check (no live LLM invocation in this job)".
- Add a separate, optional cohort-real-llm-live job, gated on workflow_dispatch input run_live_invoke=true AND the same budget kill-switch. Its single command should call archlucid golden-cohort drift --strict-real (CLI surface already exists per .github/workflows/golden-cohort-nightly.yml header comment) against ARCHLUCID_GOLDEN_COHORT_API_HOST. If that env var is not set, the job must fail fast with a clear actionable error rather than silently succeed.
- Update docs/runbooks/GOLDEN_COHORT_REAL_LLM_GATE.md so the section "Flip the gate from disabled -> required" describes the new two-job split: preflight is always optional-with-the-variable, live is owner-driven workflow_dispatch only until promoted.
- Add an assert script scripts/ci/assert_golden_cohort_job_names.py that fails CI if a future PR renames cohort-real-llm-preflight back to a name implying live execution.

Validation:
- Lint the workflow YAML.
- Run python scripts/ci/assert_golden_cohort_job_names.py.
- Confirm GoldenCohortRealLlmGateTests still passes (fixture presence check is unchanged).
```

### 6. Populate `PerAgentTypeFloors` In Production-Like Profiles And Add A PilotStrict Faithfulness Floor That Bites

Why it matters: `AgentOutputQualityGateOptions.PerAgentTypeFloors` is supported but empty in every shipping profile. Compliance, Topology, Critic, and Cost have very different output shapes (per `HeuristicAgentOutputSemanticEvaluator.SemanticWeights`); using a single global floor under-protects the agents that should be held to higher claim/finding bars. `PilotStrictMinFaithfulnessSupportRatio` is wired but not set, so the existing faithfulness check almost never gates anything.

Can be started without your input: yes for calibrated defaults and tests. Owner input optional on the actual numeric thresholds before pushing to a customer-facing environment.

Cursor prompt:

```text
Populate AgentOutputQualityGateOptions.PerAgentTypeFloors with calibrated defaults for Topology, Cost, Compliance, Critic and add a PilotStrict faithfulness floor that bites in production-like profiles.

Goals:
- In appsettings.Production.json and appsettings.Staging.json, set ArchLucid:AgentOutput:QualityGate:PerAgentTypeFloors as follows (calibrate from current simulator outputs; if any value is more than 0.05 above current observed, downgrade):
  * Compliance: StructuralRejectBelow=0.75, SemanticRejectBelow=0.6 (claims-heavy profile).
  * Critic: StructuralRejectBelow=0.7, SemanticRejectBelow=0.55 (findings-heavy).
  * Topology: StructuralRejectBelow=0.7, SemanticRejectBelow=0.5 (proposedChanges may dominate).
  * Cost: StructuralRejectBelow=0.7, SemanticRejectBelow=0.55.
- In the same two profiles, set ArchLucid:AgentOutput:QualityGate:PilotStrictMinFaithfulnessSupportRatio=0.6 so the existing aggregator actually rejects when explanation tokens fall off the trace blob.
- Add unit tests proving that per-agent overrides take precedence over global floors and that the new faithfulness floor causes RunAgentOutputPilotEvidenceAggregator.WouldPilotStrictBlockSponsorEvidenceAsync to return true when the run-level FaithfulnessSupportRatio is below the floor.
- Document the calibration rationale in docs/library/AGENT_OUTPUT_EVALUATION.md (add a "Per-agent floors" subsection citing why Compliance is held to a higher claims bar).

Validation:
- Run AgentOutputQualityGateTests, AgentOutputTraceQualityEvaluatorTests, RunAgentOutputPilotEvidenceAggregator-related tests (search for type name).
- Run scripts/ci/eval_agent_corpus.py --enforce --min-recall 0.75 --enforce-quality-gate locally to confirm the simulator corpus still passes; if any scenario falls below a per-agent floor, lower that floor (do not silence the test) and add a calibrationNotes line in the appsettings section comments.
```

### 7. Tighten The Heuristic Semantic Evaluator So It Does More Than Validate Field Length

Why it matters: `MinDescriptionLength=10` and `MinRecommendationLength=5` make it trivial for a weak agent output to score 1.0 on findings completeness. The evaluator is the floor of "AI quality" claims; a meaningful floor is not "did the field have eleven characters."

Can be started without your input: yes. Owner input optional on whether to make this a step-change or a feature-flagged ramp.

Cursor prompt:

```text
Strengthen HeuristicAgentOutputSemanticEvaluator without breaking determinism, gated by an opt-in option so existing simulator fixtures remain calibrated until rerun.

Goals:
- Add AgentOutputQualityGateOptions.HeuristicEvaluatorTightenedThresholds (default false). When true:
  * Require finding.description length >= 60 (currently 10), require finding.recommendation length >= 25 (currently 5), require finding.recommendation to share at least one token (>=4 chars, stopword-filtered) with finding.description (otherwise findingsRatio for that finding is 0.5 instead of 1.0).
  * Require claim.evidence (when present as string) to be >= 30 chars OR claim.evidenceRefs.Length >= 2 to count as evidence-backed.
  * Require proposedChanges arrays to have at least one element where every required sub-field (e.g. addedServices[].serviceName, sku, region) is non-empty for that surface to count toward proposedSurfaceRatio.
- Set HeuristicEvaluatorTightenedThresholds=true in appsettings.Production.json and appsettings.Staging.json.
- Add unit tests covering each new check: long-but-tautological recommendation (no token overlap with description) penalized; short evidence string with single evidenceRef penalized; empty inner fields on proposedChanges not counted as a hit.
- Update docs/library/AGENT_OUTPUT_EVALUATION.md to make explicit that the heuristic remains a SHAPE / GROUNDING heuristic, NOT a truth check.

Validation:
- Run the new tests plus the existing AgentOutputEvaluationHarnessGoldenFixtureTests to confirm the simulator corpus still scores above current PilotStrict floors. If any fixture regresses, EITHER edit the fixture to be substantive (not the threshold), OR record the calibration delta in the test name as a known-baseline comment.
- Run scripts/ci/eval_agent_corpus.py --enforce --min-recall 0.75 --enforce-quality-gate.
- Do not use ConfigureAwait(false) in tests.
```

### 8. Expand `PromptFieldRedactor` And `DefaultRequestContentSafetyPrecheck` Beyond Today's Narrow Surface

Why it matters: `PromptFieldRedactor` covers email + `sk-` / `Bearer`. That is far too narrow for a product where customers paste connection strings, configuration files, ARM exports, and architecture descriptions that routinely contain SAS tokens, AWS keys, JWT bodies, SSNs, and 16-digit card numbers. `DefaultRequestContentSafetyPrecheck` is 11 phrases; trivial paraphrases defeat it.

Can be started without your input: yes. Owner input optional on whether SSN / card-number patterns should be redacted (recommended) or rejected outright.

Cursor prompt:

```text
Expand PromptFieldRedactor and DefaultRequestContentSafetyPrecheck to cover the most common high-value patterns operators paste into architecture context, while preserving determinism and zero-LLM cost.

Goals (PromptFieldRedactor):
- Add patterns (each with a comment naming the family): Azure SAS token query strings (?sv=...&sig=...), Azure storage account access keys (Base64 88-char), Azure connection strings (DefaultEndpointsProtocol=...;AccountKey=...), AWS access key ids (AKIA[0-9A-Z]{16}) and secret keys (length-40 base64), basic JWT bodies (three base64url segments separated by .), SSH private key headers (BEGIN ... PRIVATE KEY-----), credit-card-shaped 16-digit sequences with Luhn check, US SSN-shaped (XXX-XX-XXXX). Each unique replacement token (e.g. [redacted-azure-sas]) so debugging is possible without leaking data.
- Add unit tests for each pattern with a positive and a near-miss negative case.
- Bound the regex timeout (TimeSpan.FromMilliseconds(250) - keep current pattern; do not introduce catastrophic backtracking risks).

Goals (DefaultRequestContentSafetyPrecheck):
- Expand BlockedPhrases to cover paraphrase variants: "ignore (the )?(prior|earlier|preceding) (instructions|rules|prompts)", "(disregard|forget) (your|all) (prior|earlier|previous|system) (instructions|rules|prompt)", "reveal (your|the) (system|hidden) (prompt|instructions)", "act as (a |an )?(unrestricted|unfiltered|jailbroken)", "developer mode", "DAN mode", "pretend you (have no|are without) (rules|restrictions|guidelines)". Add unit tests proving each new phrase blocks.
- Add a unicode-normalization step (FormC) before the lower-case match so common lookalike characters (full-width, cyrillic 'a', etc.) cannot trivially evade.

Cross-cutting:
- Update docs/library/AGENT_OUTPUT_EVALUATION.md (or a new doc docs/security/PROMPT_INPUT_DEFENSE.md if more appropriate) describing the layered defense: precheck (heuristic), Azure Content Safety (when configured fail-closed), prompt redaction, persistence redaction, explicit citations.
- Do not import any non-NET libraries; rely on System.Text.RegularExpressions and System.Globalization.
- Do not relax existing redaction patterns.

Validation:
- Run ArchLucid.AgentRuntime.Tests/Prompts/PromptFieldRedactorTests and any DefaultRequestContentSafetyPrecheckTests.
- Run dotnet test on the affected projects.
- Do not use ConfigureAwait(false) in tests.
```

## Pending Questions Saved For Later

I am not asking these now, per instruction. They are the questions that would let me complete or harden the highest-leverage improvements. When you ask later what is still open, I will be ready with these:

1. Which environment is the first **blocking** PilotStrict environment intended to be? Production-only, the staging stack, or a dedicated pilot stack? Both production and staging now block on reject; if staging blocking surprises a buyer-pilot demo, I need to know whether to add a third profile.
2. When does real-mode evidence become **required** (vs nice-to-have)? Every release candidate, only customer pilot RCs, or only named golden cohorts?
3. Which Azure OpenAI deployment is the reference model for release-mode evidence (deployment name, region, model id)? Without this, Improvement 1 cannot capture an actual real exemplar — only the tooling.
4. Should content safety **fail closed** for every real-mode pilot stack, or do you want a named break-glass setting for controlled customer-on-premises demos? The current force-fail-closed for production-like is opinionated; a buyer running an air-gapped POC may need a documented exception path.
5. Who owns the GitHub branch-protection change if the new release-mode RC workflow becomes required? It is currently nobody's named obligation.
6. For Improvement 6 (per-agent floors), should the calibrated thresholds be allowed to drop on a regression (auto-relax with an audit row), or always require an explicit owner approval to lower? The current code path defaults to "operator must edit appsettings" which is safe but slow.
7. For Improvement 8 (expanded redaction), should SSN / credit-card / Azure storage key patterns be **redacted** (silently masked) or **rejected** (block the request)? The two defenses are different commercial promises.
8. Is there a desired location for committed real-mode AgentResult exemplars (`tests/eval-corpus/agent-results/*.real.json`), or should they live in a secret-protected location accessed via env var? Either is workable but the answer affects Improvement 1's gate logic.
