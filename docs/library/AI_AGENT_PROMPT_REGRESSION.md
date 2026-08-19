> **Scope:** Contributor-reference — Agent prompt regression guard - full detail, tables, and links in the sections below.

> **Spine doc:** [`START_HERE.md`](../START_HERE.md).


# Agent prompt regression guard

## Objective

Provide a **repeatable** local/CI hook that fails when simulator-mode agent outputs drift materially after prompt or handler changes — complementary to **Stryker** (mutation) and **line coverage**.

## Current state

| Layer | Role |
|--------|------|
| **`scripts/ci/prompt_regression_baseline.json`** | Committed **`minStructuralCompletenessByAgentType`** / **`minSemanticScoreByAgentType`** floors (**0.95** structural / **0.85** semantic for all four **`AgentType`** values today). **`assert_prompt_regression.py`** enforces Topology ≥ **0.9** / **0.5** minimums plus Cost / Compliance / Critic ≥ **0.85** / **0.7** minimums so the file cannot regress to placeholders. |
| **`scripts/ci/assert_prompt_regression.py`** | Validates baseline shape (four agent keys in each map) plus the Topology and Cost / Compliance / Critic floor thresholds above (merge-blocking in CI beside the dotnet contract test). |
| **`ArchLucid.AgentRuntime.Tests/Evaluation/PromptRegressionBaselineContractTests`** | Copies the baseline into **`Fixtures/Regression/`** at build and asserts each dedicated golden **`AgentResult`** JSON meets **`min*ByAgentType`** for its type: Topology **`golden-agent-result-valid.json`**, Cost **`golden-agent-result-cost.json`**, Compliance **`golden-agent-result-compliance.json`**, Critic **`golden-agent-result-critic.json`** under **`AgentOutputEvaluator`** + **`HeuristicAgentOutputSemanticEvaluator`**. |
| **`scripts/ci/assert_agent_reference_baselines.py`** | Validates paths in **`scripts/ci/agent-reference-baselines.json`** (golden fixture presence + parse guard); keep that list aligned when adding regressions fixtures. |

**Merge-blocking today:** Topology, Cost, Compliance, and **Critic** — each pair of structural + semantic scores is guarded by the baseline JSON, the Python script, and the contract test suite.

## Usage

From repo root:

```bash
python scripts/ci/assert_prompt_regression.py
dotnet test ArchLucid.AgentRuntime.Tests -c Release --filter "FullyQualifiedName~PromptRegressionBaselineContractTests"
```

CI runs the Python step and the full test suite (including the contract test).

## Evolution

- Raise **`min*ByAgentType`** only after golden fixtures still meet the new thresholds in **`PromptRegressionBaselineContractTests`**; when the Python script enforces different minimum bands for Topology versus Cost / Compliance / Critic, edit **`prompt_regression_baseline.json`**, **`assert_prompt_regression.py`**, and this doc together.
- Optional: emit **`artifacts/prompt_regression_metrics.json`** from tests and extend the Python script to diff across commits (heavier than evaluator-in-test).

## Related

- **`docs/MUTATION_TESTING_STRYKER.md`**
- **`ArchLucid.AgentRuntime.Tests/Evaluation/AgentOutputSemanticEvaluatorTests.cs`**
