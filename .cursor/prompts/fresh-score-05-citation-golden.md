# FS-05 — Reject three invented citation classes

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file as the whole task. Do not use a fast-tier slug and do not use a model outside the workspace allowlist. Do not implement another FS prompt in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/FRESH_SCORE_20_COMPOSER_PROMPTS.md`


## Goal

A ranked-path completion that cites an unknown hop, an unknown cut point, or a different path id is stored as the deterministic summary with a rejection reason.

## Why

AI/Agent Readiness is **66** (weight 8). One invented ARM id already falls back. The other two citation classes are not locked.

## Read first

- `ArchLucid.Application/InfraEvidence/SecurityEvidencePathExplanationService.cs`
- `ArchLucid.Application.Tests/InfraEvidence/SecurityEvidencePathExplanationServiceTests.cs`
- `ArchLucid.Application/InfraEvidence/SecurityEvidencePathExplanationBuilder.cs`

## What to build

1. Branch `fresh-score/05-citation-golden` from current `master`.
2. Read the existing invalid-citation test. If unknown hop, unknown cut point, and swapped path id are all already asserted, stop.
3. Otherwise extend `TryParseLlmResponse` so a cited cut-point id or path id outside the stored path is a rejection, the same way an ARM id outside `allowedArmIds` is a rejection.
4. Add the missing cases to `SecurityEvidencePathExplanationServiceTests`. Each case calls `CompleteJsonAsync` once, returns success, `ProvenanceKind.DeterministicInference`, a non-empty `ModelOutputRejection`, and citations that are only the stored path id or hop evidence refs.
5. Keep the valid JSON test on `AiInference` with a null rejection.

## Tests

`dotnet test ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj --filter FullyQualifiedName~SecurityEvidencePathExplanationServiceTests`

## Done when

Unknown hop, unknown cut point, and swapped path id each persist the stored-path summary and a rejection reason. A valid cited completion still persists as `AiInference`.

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
