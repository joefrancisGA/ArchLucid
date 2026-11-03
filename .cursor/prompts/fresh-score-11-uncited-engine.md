# FS-11 — Reject an unanchored cost or topology finding

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file as the whole task. Do not use a fast-tier slug and do not use a model outside the workspace allowlist. Do not implement another FS prompt in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/FRESH_SCORE_20_COMPOSER_PROMPTS.md`


## Goal

One WK-21 engine that is not pack-aware fails the same uncited-finding gate as a pack-aware finding when its evidence anchor is empty.

## Why

ArchLucid Correctness is **84** (weight 8). Pack-aware findings already fail closed without an anchor. Topology and cost still run outside that pack boundary.

## Read first

- `docs/go-to-market/DEFAULT_POLICY_PACKS_V1.md` (WK-21 paragraph only)
- `ArchLucid.AgentRuntime/Evaluation/AgentOutputTraceQualityEvaluator.cs`
- The cost finding builder and the topology finding builder. Search for the engine the WK-21 copy names as still running when a pack is assigned.

## What to build

1. Branch `fresh-score/11-uncited-engine` from current `master`.
2. Pick one engine: the cost engine if it can emit a finding with an empty evidence anchor, otherwise the topology engine. Name that engine in the test name.
3. Add one regression: an empty evidence anchor on that engine's finding is not accepted by the same gate `AgentOutputTraceQualityEvaluator` uses for an uncited Real finding.
4. Add the paired case with one non-empty anchor, which is accepted.
5. Do not make the engine pack-aware. Do not edit WK-21 copy. Do not add a 40th engine.

## Tests

Run the test project that contains the new regression. Filter on the test name.

## Done when

The chosen engine's empty-anchor finding is rejected and its anchored finding is accepted. The engine remains outside pack assignment.

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
