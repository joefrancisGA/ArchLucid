# FS-06 — Fail CI when a starter-pack finding has no anchor

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file as the whole task. Do not use a fast-tier slug and do not use a model outside the workspace allowlist. Do not implement another FS prompt in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/FRESH_SCORE_20_COMPOSER_PROMPTS.md`


## Goal

One azure-cost-governance starter-pack trace fails `AgentOutputTraceQualityEvaluator` when a finding has no evidence anchor, and passes when the anchor is present.

## Why

ArchLucid Cutting-Edge AI Technology is **76** (weight 8). The evaluator exists. A starter-pack trace is not in that test file.

## Read first

- `ArchLucid.AgentRuntime/Evaluation/AgentOutputTraceQualityEvaluator.cs`
- `ArchLucid.AgentRuntime.Tests/Evaluation/AgentOutputTraceQualityEvaluatorTests.cs`
- `templates/starter-proof-packs/azure-cost-governance/starter-pack.json`
- `docs/library/POLICY_PACK_EXPECTATION_FACET.md` (WK-21 boundary only; do not edit it)

## What to build

1. Branch `fresh-score/06-starter-pack-eval` from current `master`.
2. Add two tests in `AgentOutputTraceQualityEvaluatorTests` that build a trace the evaluator already accepts as input.
3. Name both tests with `azure_cost_governance_starter_pack`.
4. The failing trace has one finding whose evidence anchor is empty. Assert the quality gate does not accept it.
5. The passing trace uses the same finding with one non-empty evidence anchor drawn from a field that already exists on the starter-pack JSON. Assert the gate accepts it.
6. Do not add a new evaluator, a nightly workflow, or a pack-awareness flag. Do not edit the starter-pack JSON.

## Tests

`dotnet test ArchLucid.AgentRuntime.Tests/ArchLucid.AgentRuntime.Tests.csproj --filter FullyQualifiedName~AgentOutputTraceQualityEvaluatorTests`

## Done when

The unanchored starter-pack trace is rejected and the anchored trace is accepted by the existing evaluator.

## Constraints

- Before editing a tracked file, run `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2.
- If the done-when text is already present, stop and report that. Do not add a second copy.
- Read `.cursor/prompts/fresh-score-hold.md` before editing.
- Do not implement another FS prompt in this session.
- Do not commit.
- Beta remains **NO_GO**. Do not publish a fee, a public list price, a CPA SOC 2 report, or a third-party pen-test claim.
- Do not write a customer result, a timed SLA, or a minutes-to-value claim.
- Do not hide review workspace tabs behind a More menu.
- Do not call `PathRankingEngine` or change rank weights.
