# ArchLucid AI Agent / Readiness Solution Quality Assessment - 72.14%

**Scope:** Independent assessment of the AI Agent / Readiness solution quality only. This score excludes intentionally deferred scope: MCP membrane work is V1.1, outbound MCP client and Durable Task / Azure Container Apps Jobs orchestration changes are V2, and SOC/commercial/design-partner milestones are not part of this AI-agent solution-quality score.

**Bottom line:** **72.14 / 100.** The solution is materially above prototype quality: it has real execution paths, deterministic simulator coverage, strict production quality-gate settings, trace persistence, cost controls, fallback labeling, tenant-partitioned LLM cache keys, and a credible offline corpus. The commercial risk is still real: the repository proves simulator and structural quality much more strongly than it proves real-model answer quality under release conditions.

## Weighted Score

The categories are ordered by weighted improvement need, not by implementation size.

| Area | Weight | Score | Weighted Points | Why It Lands There |
|---|---:|---:|---:|---|
| Real-mode proof and release gating | 25% | 58 | 14.50 | Production config can block low-quality output, but staging leaves reject enforcement off, optional real-mode corpus evidence was skipped, and the nightly real-LLM gate is still conditional and does not itself invoke live OpenAI in CI. |
| Output quality, faithfulness, and evaluator strength | 20% | 72 | 14.40 | There is structural scoring, heuristic semantic scoring, PilotStrict evidence floors, and optional LLM judge support. The remaining gap is faithfulness: scoring still overweights shape, citations, and field completeness versus proving the answer is true against the manifest/evidence package. |
| Eval corpus and CI enforcement | 14% | 72 | 10.08 | The offline corpus passed strict local checks: worst recall 1.00, unexpected hits 0, simulator quality gate accepted. But default CI runs it informationally, prompt-injection datasets are shape-validated rather than behavior-executed, and real-mode rows are optional/skipped without failing. |
| Orchestration, resilience, and failure semantics | 16% | 84 | 13.44 | Strong for V1: stable task ordering, staged critic option, cancellation on peer failure, partial-output budget handling, circuit breaker, retry path, and explicit quality-rejected run status. The main issue is operational posture, not core architecture. |
| Safety, tenant isolation, and cache boundaries | 10% | 80 | 8.00 | Cache keys include simulator isolation and optional tenant/workspace/project partitioning, and content safety has fail-closed semantics by default. The weaker part is deploy-time assurance that real production-like environments cannot accidentally run with null or fail-open safety. |
| Observability and explainability | 8% | 80 | 6.40 | Trace recording, quality metrics, parse failure counters, gate outcome metrics, fallback markers, and real-mode evidence templates exist. The gap is buyer-facing rollup: a busy operator still has to piece together real/simulator/fallback mode and quality confidence from several places. |
| Operator readiness and commercial demo usability | 7% | 76 | 5.32 | The system can tell a credible pilot story, especially with strict production config. It is not yet as commercially defensible as it should be for a buyer asking, "Show me that real AI answers are consistently good and blocked when bad." |

**Total weighted score: 72.14 / 100.**

## 1. Real-Mode Proof And Release Gating Need The Most Work

This is the largest gap because the product is sold on AI-assisted architecture judgment, not on simulator determinism.

What is good:

- `appsettings.Production.json` sets `Mode: PilotStrict`, `StructuralRejectBelow: 0.7`, `SemanticRejectBelow: 0.5`, `PilotStrictMinStructuralCompleteness: 0.9`, `PilotStrictMinEvidenceRefCount: 2`, `EnforceOnReject: true`, and `BlockRunOnReject: true`.
- `ArchitectureRunExecuteOrchestrator` can mark `ExecutionCompletedQualityRejected` and surface the quality-gate exception when both enforcement flags are enabled.
- `RealLlmOutputStructuralValidator` catches non-JSON output, missing top-level result fields, empty findings, missing explainability trace shape, blank severity, and hollow finding content.
- `archlucid golden-cohort drift --strict-real --structural-only` refuses to treat simulator fallback as real-model proof.

What is not good enough:

- Staging config is still `PilotStrict` but has `EnforceOnReject: false` and `BlockRunOnReject: false`. That is a commercial credibility problem because staging is where the first serious buyer demo usually gets validated.
- The offline corpus run passed, but its real-mode evidence row was skipped: `real_mode_quality total=1 skipped_no_env=1 evaluated=0 evidence_captured=no`.
- The GitHub `cohort-real-llm-gate` job is conditional on a repo variable and the test step explicitly says "no live OpenAI invoke in CI." That is honest, but it means the repo does not yet prove live model quality continuously.

Tradeoff:

- Keeping real-LLM gates optional controls cost and avoids flaky CI, which is rational for V1.
- But if the first production-like pilot relies on real LLMs, optional evidence is not enough. The buyer risk is silent confidence: a run can look operationally successful while the organization has not produced a recent, release-grade real-mode quality artifact.

## 2. Output Quality Checks Are Useful But Still Too Shape-Based

The evaluator is better than a naive JSON parser. `HeuristicAgentOutputSemanticEvaluator` scores evidence-backed claims, finding completeness, topology proposed-change surface, and role-specific weights. `AgentOutputTraceQualityEvaluator` adds PilotStrict behavior: missing citations and low evidence-reference counts reject. `CompositeAgentOutputSemanticEvaluator` can use an LLM judge when configured.

The blunt issue: this still does not fully prove truth. A model can cite something, include a long recommendation, pass field completeness, and still make a weak or wrong architectural claim. The optional LLM judge helps, but it is another model grading JSON; it is not a deterministic faithfulness check against the manifest, evidence package, policy pack, and run graph.

Tradeoff:

- Heuristics are cheap, deterministic, and good CI material.
- They are not enough to claim "AI quality" in a commercial setting unless paired with a manifest-grounded faithfulness pass and real-mode sample evidence.

## 3. Eval Corpus And CI Are Credible But Under-Enforced

I ran:

```bash
python scripts/ci/eval_agent_corpus.py
python scripts/ci/eval_agent_corpus.py --enforce --min-recall 0.75 --enforce-quality-gate
```

Both passed. Current evidence:

- 11 / 11 scenarios had recall 1.00.
- Unexpected findings were 0 in every scenario.
- Worst recall was 1.00 against the strict local 0.75 floor.
- Real-mode quality evidence was present as a scenario hook but skipped because no exported real result path was supplied.

The problem is posture. CI appends the report but does not pass `--enforce` or `--enforce-quality-gate`. `eval_agent_quality.py` validates dataset shape and prompt-injection fixture shape, not the runtime's behavioral resistance to those injections.

Tradeoff:

- Informational PR checks are good while the corpus is young.
- For release candidates, informational checks are commercially weak. If you already have stable simulator rows, the release workflow should fail on simulator quality rejection and should explicitly declare whether real-mode evidence was captured or intentionally absent.

## 4. Orchestration Is A Strength

The agent execution architecture is one of the better parts of the solution:

- `RealAgentExecutor` resolves handlers by dispatch key, orders results deterministically, supports staged critic execution, propagates ambient scope, and cancels peers on failure.
- `CircuitBreakingAgentCompletionClient` and `FallbackAgentCompletionClient` provide resilience and fallback telemetry.
- `CostGuardrailInterceptor` and partial-output handling reduce runaway spend risk.
- Quality rejection can become a first-class run status instead of a hidden log line.

The remaining risk is not the basic orchestration model. It is release configuration and operator surfacing. V2 orchestration substrates such as Durable Task Framework or Azure Container Apps Jobs are intentionally deferred and should not reduce this score.

## 5. Safety, Cache, And Tenant Boundaries Are Mostly Sound

The LLM completion cache key includes provider/model label, prompt hash, simulator flag, and optional scope partition. When partitioning is enabled for non-simulator mode, empty tenant scope is rejected to prevent cross-scope cache bleed. That is the right invariant.

Content safety is present and defaults to fail-closed on SDK error at the option type level. The weak spot is deploy posture: `appsettings.Advanced.json` disables content safety and sets `FailClosedOnSdkError: false`. That can be fine for advanced/local testing, but production-like real-mode execution needs a validation rule that makes null/fail-open safety an explicit break-glass decision.

Tradeoff:

- Fail-closed safety can block demos during provider incidents.
- Fail-open safety can create far worse commercial and trust problems. For real-mode pilot stacks, fail-closed should be the default unless the environment name and break-glass flag make the exception unmistakable.

## 6. Observability Exists, But The Buyer-Facing Rollup Is Fragmented

The system emits useful metrics: structural completeness, semantic score, parse failures, quality gate outcomes, fallback engagement, and trace data. The trace and evidence docs are also reasonably honest.

What is missing is a compact operator answer to:

- Was this run real, simulator, or mixed/fallback?
- Did every required agent clear PilotStrict?
- Did the output pass structural, heuristic semantic, LLM-judge, and faithfulness checks?
- Is this run safe to put in front of a sponsor?

Right now that answer exists across config, metrics, trace rows, CLI commands, and docs. A pilot operator should not have to reconstruct it.

## 7. Operator / Demo Readiness Is Adequate, Not Yet Excellent

The system can support a controlled pilot. It should not yet be represented as having mature continuous proof of real-model quality unless real evidence is attached for that release or environment.

Commercially realistic phrasing:

- Good claim: "We have deterministic simulator regression, strict production quality gates, traceability, and optional real-model validation hooks."
- Bad claim: "The AI is validated continuously in production-like real mode." The repo does not prove that yet.

## Exclusions I Did Not Penalize

- **DEFERRED: Inbound MCP membrane** - V1.1. Not scored as a V1 defect.
- **DEFERRED: Outbound MCP client to arbitrary external tool servers** - V2 unless promoted. Not scored.
- **DEFERRED: Durable Task Framework / Azure Container Apps Jobs orchestration migration** - V2 situational backlog. Not scored.
- SOC 2 CPA report, design partner, marketplace publication, and other commercial/procurement items are outside this AI Agent / Readiness solution-quality score.

## The Eight Best Improvements

### 1. Make PilotStrict Blocking Real In Staging Or Add A Dedicated PilotStrict Release Profile

Why it matters: staging currently looks strict but does not block rejected output. That creates exactly the kind of "green demo, bad AI answer" risk buyers punish.

Can be started without your input: yes. Final branch-protection or environment adoption may require owner action.

Cursor prompt:

```text
Review ArchLucid.Api appsettings for ArchLucid:AgentOutput:QualityGate and make the production-like pilot/staging posture commercially defensible.

Goals:
- Do not change V1 deferred scope.
- Preserve local development usability.
- Ensure there is a documented production-like profile where Mode=PilotStrict, EnforceOnReject=true, and BlockRunOnReject=true.
- If changing appsettings.Staging.json directly is too aggressive, add a clearly named pilot-strict override file or documented env-var recipe and tests that verify the effective options.
- Add focused tests that prove rejected agent output marks the run ExecutionCompletedQualityRejected and prevents ReadyForCommit promotion.
- Update docs that currently imply older warn-only defaults if they conflict with code.

Validation:
- Run the affected .NET unit tests for agent output quality gate and execute orchestration.
- Do not use ConfigureAwait(false) in tests.
```

### 2. Add A Release-Grade Real-Mode Evidence Gate That Fails Closed When Evidence Is Required But Missing

Why it matters: the corpus already has a real-mode hook, but it skipped. That should be acceptable in PR CI and unacceptable in an RC job that claims real-mode readiness.

Can be started without your input: yes. Supplying Azure OpenAI deployment/secrets and deciding when the gate becomes required are owner actions.

Cursor prompt:

```text
Add a release-mode wrapper around scripts/ci/eval_agent_corpus.py that distinguishes PR-safe simulator checks from RC real-mode evidence requirements.

Goals:
- Keep default PR CI Azure OpenAI-free.
- Add a script or workflow mode that fails if qualityEvidence.mode="real" rows are skipped when an explicit RC/real-mode flag is set.
- Preserve --enforce and --enforce-quality-gate behavior for simulator rows.
- Emit a concise Markdown artifact showing simulator rows, real rows, skipped rows, evaluated rows, and pass/fail status.
- Document the exact env vars needed to provide exported AgentResult JSON.

Validation:
- Add Python tests for missing real-mode env var under PR mode vs RC-required mode.
- Run the new tests plus scripts/ci/eval_agent_corpus.py in both default and strict modes.
```

### 3. Build A Deterministic Faithfulness Checker Against Manifest / Evidence References

Why it matters: field completeness and citations are not the same as truth. This is the highest-leverage quality improvement after real evidence gating.

Can be started without your input: yes, using existing persisted manifests, evidence packages, and AgentResult JSON.

Cursor prompt:

```text
Design and implement a deterministic AgentResult faithfulness checker that verifies claims and findings against persisted run evidence instead of only checking JSON shape.

Goals:
- Add a small service that takes run id, AgentResult, evidenceRefs, and the evidence package or manifest summary.
- Flag claims whose evidenceRefs do not resolve, claims with cited evidence that does not contain any supporting term overlap, and findings with recommendations unsupported by the cited context.
- Keep the first version heuristic and explainable; do not call an LLM.
- Add the faithfulness score to the existing agent-evaluation API response without breaking existing clients.
- Add tests with one supported claim, one missing evidence ref, one citation mismatch, and one unsupported recommendation.

Validation:
- Run focused AgentRuntime/Application tests.
- Update docs/library/AGENT_OUTPUT_EVALUATION.md to explain that the metric is heuristic faithfulness, not legal truth.
```

### 4. Turn Prompt-Injection Fixtures Into Executable Behavioral Regression Tests

Why it matters: today the prompt-injection datasets are validated for shape. That proves fixture hygiene, not resistance.

Can be started without your input: yes, at least for simulator and parser/guard behavior.

Cursor prompt:

```text
Extend the prompt-injection eval dataset path from shape-only validation to executable behavioral regression.

Goals:
- Keep tests offline and deterministic.
- For each prompt-injection category, run the relevant prompt-building or simulator/evaluation path and assert forbidden outcomes are absent.
- Cover direct override, exfiltration, and tool abuse fixture families.
- Do not introduce live LLM calls.
- Produce a clear failure message that identifies the fixture id and the violated expected behavior.

Validation:
- Add Python or .NET tests, whichever matches the existing fixture workflow best.
- Wire the executable check into CI only if it remains fast and credential-free.
```

### 5. Add A Single Operator-Facing "Run AI Quality Verdict" Rollup

Why it matters: buyers and operators need one answer, not five telemetry breadcrumbs.

Can be started without your input: yes.

Cursor prompt:

```text
Add an operator-facing AI quality verdict for an architecture run.

Goals:
- Aggregate per-trace structural score, heuristic semantic score, optional LLM judge score, quality gate outcome, parse failures, fallback/simulator/real-mode indicators, and evidence-ref/citation failures.
- Return a compact API DTO such as verdict: SponsorReady | NeedsReview | Blocked, with reasons.
- Ensure simulator, real, and fallback/mixed mode are explicit in the response.
- Reuse existing evaluation services and trace repositories; do not duplicate scoring logic.
- Add UI copy or CLI rollup output if the existing UI route is easy to extend.

Validation:
- Unit test the rollup for all-accepted, warned, rejected, parse-failed, and real-fell-back-to-simulator cases.
```

### 6. Enforce Production-Like Content Safety Configuration For Real-Mode Runs

Why it matters: content safety can be disabled or fail-open in advanced config. That is acceptable for local experimentation, not for real-mode pilot claims unless explicitly break-glassed.

Can be started without your input: yes.

Cursor prompt:

```text
Add configuration validation that prevents production-like real-mode agent execution from silently running with disabled or fail-open content safety.

Goals:
- Detect AgentExecution:Mode=Real with production/staging/pilot environment names.
- Require ArchLucid:ContentSafety:Enabled=true and FailClosedOnSdkError=true unless an explicit break-glass setting is present.
- Make the failure message actionable and safe for startup logs.
- Preserve local simulator and test ergonomics.
- Add tests for production real mode, staging real mode, development simulator mode, and explicit break-glass.

Validation:
- Run relevant host composition/configuration tests.
```

### 7. Populate Per-Agent Quality Floors And Test Them Against Role-Specific Expectations

Why it matters: the option model supports per-agent floors, and the semantic evaluator already weights agent roles differently. The config should use that capability instead of treating all agents as equivalent.

Can be started without your input: yes.

Cursor prompt:

```text
Introduce explicit per-agent quality floor defaults for Topology, Cost, Compliance, and Critic agent outputs.

Goals:
- Use the existing AgentOutputQualityGateOptions.PerAgentTypeFloors support.
- Calibrate initial floors conservatively from current simulator fixtures, not wishful targets.
- Add tests proving per-agent overrides take precedence over global floors.
- Document why Compliance should emphasize claims/evidence, Critic should emphasize findings/actionability, and Topology may rely more on proposedChanges.
- Avoid breaking local development; keep production-like profile strict.

Validation:
- Run AgentOutputQualityGate tests and eval corpus strict mode.
```

### 8. Make The Golden Cohort Real-LLM Gate Honest In Naming And Capabilities

Why it matters: the workflow currently contains a "real LLM gate" job, but its test step says it does not invoke live OpenAI. That is honest in the comment but misleading as a release signal.

Can be started without your input: yes for naming, documentation, and preflight checks. Actual live invocation requires owner-provided Azure deployment, secrets, and branch-protection decision.

Cursor prompt:

```text
Review .github/workflows/golden-cohort-nightly.yml and docs/runbooks/GOLDEN_COHORT_REAL_LLM_GATE.md for naming and evidence accuracy.

Goals:
- Rename or annotate jobs so no step implies live Azure OpenAI quality was tested when only budget/preflight/unit checks ran.
- Add a separate clearly named future/live path for invoking archlucid golden-cohort drift --strict-real against a configured API host.
- Keep the kill-switch and budget probe intact.
- Ensure the docs clearly distinguish: simulator drift, real-mode preflight, and live real-LLM execution.
- Add CI checks if practical to prevent docs/workflow drift around this distinction.

Validation:
- Run YAML/static checks already used in the repo if present.
- Do not add secrets or require live Azure access.
```

## Pending Questions Saved For Later

I am not asking these now, per instruction. They are the questions that affect full completion of the highest-leverage improvements:

- Which environment should be the first production-like **blocking** PilotStrict environment: staging, a separate pilot stack, or production only?
- When should real-mode evidence become required: every release candidate, only customer pilot release candidates, or only named golden cohorts?
- What Azure OpenAI deployment should be the reference model for release evidence?
- Should content safety fail closed for every real-mode pilot stack, or do you want a named break-glass setting for controlled demos?
- Who owns the GitHub branch-protection change if the real-LLM gate becomes required?

