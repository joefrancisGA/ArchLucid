# FS-02 — Say why this stored path outranks the next one

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file as the whole task. Do not use a fast-tier slug and do not use a model outside the workspace allowlist. Do not implement another FS prompt in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/FRESH_SCORE_20_COMPOSER_PROMPTS.md`


## Goal

A stored-path explanation names the next stored path and the one stored dimension that separates them. The ranker does not run again.

## Why

Cutting-Edge AI Technology is **64** (weight 8). Ask can explain one stored path. It does not say why that path outranks the next stored path.

## Read first

- `ArchLucid.Application/InfraEvidence/SecurityEvidencePathExplanationBuilder.cs`
- `ArchLucid.Application/InfraEvidence/SecurityEvidencePathExplanationService.cs`
- `ArchLucid.Application/InfraEvidence/SecureNowArchitect/SecurityEvidencePathRankExplanationBuilder.cs`
- `ArchLucid.Application.Tests/InfraEvidence/SecurityEvidencePathExplanationServiceTests.cs`

## What to build

1. Branch `fresh-score/02-next-stored-path` from current `master`.
2. When the explanation service builds or prompts an explanation, load the other stored rank rows for the same snapshot. Do not call `PathRankingEngine`.
3. Pick the next path as the stored row with the next-lower overall score. If the selected path is the only row, the sentence is `No next stored path in this snapshot.`
4. Otherwise append one sentence to the simulator executive summary and to `BuildLlmUserPrompt`: `Selected path {selectedId} outranks stored path {nextId} on {dimension}. This does not change the rank.` `{dimension}` is the stored dimension with the largest positive gap already on the rank records (`TechnicalExposure`, `PrivilegeDepth`, `BlastRadius`, `BusinessConsequence`, or `ConfidenceBand`). If no dimension is higher, say `Selected path {selectedId} does not outrank stored path {nextId} on a stored dimension. This does not change the rank.`
5. A model completion that names a path id other than the selected id or the next id still falls through the existing stored-path rejection path.
6. Add tests: two stored paths with a privilege-depth gap, one stored path, and a completion that cites a third path id.

## Tests

`dotnet test ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj --filter FullyQualifiedName~SecurityEvidencePathExplanationServiceTests`

## Done when

The stored explanation names the next stored path and one stored dimension, or says there is no next stored path. Rank weights are unchanged.

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
