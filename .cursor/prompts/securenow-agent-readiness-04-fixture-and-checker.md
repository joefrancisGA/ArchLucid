# SN-AIR-04 — Recorded completions and a warn-only checker

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file as the whole task. Do not use a fast-tier slug and do not use a model outside the workspace allowlist. Do not implement another SN-AIR prompt in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/SECURENOW_AGENT_READINESS_COMPOSER_PROMPTS.md`

## Goal

Two recorded completions lock the live path and the fallback path, and CI warns when Path inspect hardcodes simulator-only mode or the fallback disappears. The checker stays warn-only.

## Why

SN-AIR-01 through SN-AIR-03 are easy to regress into `useSimulator: true` with no Real branch, a hard error on bad JSON, or `maxTokens: null`.

## Read first

- `scripts/ci/check_securenow_cutting_edge.py`
- `scripts/ci/test_check_securenow_cutting_edge.py`
- `ArchLucid.Application.Tests/InfraEvidence/SecurityEvidencePathExplanationServiceTests.cs`
- `archlucid-ui/src/components/security/SecurityEvidencePathInspectPanel.tsx`
- `.github/workflows/ci.yml` (the `SecureNow cutting edge unit tests` step)

## What to build

1. Branch `sn-air/04-fixture-and-checker` from current `master` after SN-AIR-01 through SN-AIR-03 are present.
2. Add two JSON files under `tests/fixtures/securenow/`:
   - `path-explanation-cited.json` — a valid explanation body whose `citedEvidenceRefs` are only `evidence-1` and a `path:{guid}` placeholder the test replaces with the real path id.
   - `path-explanation-invented-arm.json` — the same shape, with an ARM id in `executiveSummary` that is not on the hop.
3. Load those files from `SecurityEvidencePathExplanationServiceTests` for the success path and the fallback path. Keep the assertions already required by SN-AIR-02: cited JSON stays `AiInference`; invented ARM falls back once, with `DeterministicInference` and a non-empty `ModelOutputRejection`.
4. Add `scripts/ci/check_securenow_agent_readiness.py`. `validate(root)` returns error strings. Exit 1 when any of these fail:
   - `SecurityEvidencePathInspectPanel.tsx` contains `useSimulator: true` and does not contain `useSimulator: false`.
   - `SecurityEvidencePathInspectPanel.tsx` lacks `useAgentExecutionMode`.
   - `SecurityEvidencePathExplanationService.cs` lacks `BuildSimulatorExplanation`.
   - `SecurityEvidencePathExplanationService.cs` lacks `ModelOutputRejection`.
   - `SecurityEvidencePathExplanationService.cs` lacks `PathExplanationMaxOutputTokens = 800`.
   - `InfraEvidenceAskGroundingService.cs` lacks a `RankedPath` check that passes `800` to `CompleteJsonAsync`.
   - `securenow-path-inspect-copy.ts` lacks `Model — cited stored path`.
5. Add `scripts/ci/test_check_securenow_agent_readiness.py`. The real tree passes. One temp copy that removes `useSimulator: false` from the panel fails. A second temp copy that removes `PathExplanationMaxOutputTokens = 800` from the service fails.
6. In `.github/workflows/ci.yml`, add two steps after `SecureNow cutting edge unit tests`, both `continue-on-error: true`:
   - `SecureNow agent readiness` runs `python scripts/ci/check_securenow_agent_readiness.py`.
   - `SecureNow agent readiness unit tests` runs `python -m unittest scripts.ci.test_check_securenow_agent_readiness`.

## Tests

`dotnet test ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj --filter FullyQualifiedName~SecurityEvidencePathExplanationServiceTests`

`python3 scripts/ci/check_securenow_agent_readiness.py`

`python3 -m unittest scripts.ci.test_check_securenow_agent_readiness`

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2. On a Linux Cloud Agent, use `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path '<path>'`.
- Do not set `continue-on-error` to false.
- Do not add a mailbox, a public price, a `$`, or a "Start trial" control.
- Do not write to Azure.
- Do not commit.

## Done when

The cited fixture stays a model explanation, the invented-ARM fixture falls back, and the checker passes on that tree and fails when the Real-mode post or the 800-token cap is removed.
