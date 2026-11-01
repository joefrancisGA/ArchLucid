# SN-CE-04 — Fixture question and cutting-edge checker

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file as the whole task. Do not use a fast-tier slug and do not use a model outside the workspace allowlist. Do not implement another SN-CE prompt in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/SECURENOW_CUTTING_EDGE_COMPOSER_PROMPTS.md`

## Goal

One fixture question runs through grounding with a recorded completion, and CI warns when the ranked-path topic, the refusal sentences, or the 50-row cap drift. The checker stays warn-only.

## Why

SN-CE-01 through SN-CE-03 are easy to regress into a keyword topic, a second ranker, or a probability field on the JSON. The path inspect panel already has a simulator explanation button (`buildSecurityEvidencePathExplanation` with `useSimulator: true`). This session does not replace that button.

## Read first

- `ArchLucid.Application.Tests/InfraEvidence/InfraEvidenceAskGroundingServiceTests.cs`
- `ArchLucid.Application/InfraEvidence/Ask/InfraEvidenceAskPromptBuilder.cs`
- `ArchLucid.Application/InfraEvidence/Ask/InfraEvidenceAskEvidenceCollector.cs`
- `ArchLucid.Application/InfraEvidence/Ask/InfraEvidenceAskIntentResolver.cs`
- `scripts/ci/check_securenow_self_service.py` and `scripts/ci/test_check_securenow_self_service.py` (shape only; do not change them)
- `.github/workflows/ci.yml` (step `SecureNow self-service unit tests`)
- `archlucid-ui/src/lib/infra-evidence/infra-evidence-ask-api.ts` (`submitInfraEvidenceAsk`)
- `archlucid-ui/src/components/security/SecurityEvidencePathInspectPanel.tsx` (existing explanation button; do not replace it)

## What to build

1. Branch `sn-ce/04-fixture-and-checker` from current `master` after SN-CE-01 through SN-CE-03 are present.
2. Add one grounding test whose question is exactly `Explain this ranked path and its stored cut point.` Use a fixed `Guid` path id in the test. Do not add a customer fixture file and do not use `fixture-path-01` as if it were a stored path id.
3. The fake `IAgentCompletionClient` returns JSON whose `citationIds` are the bundle’s path citation and cut-point citation. Assert the response succeeded, `topicKind` is `RankedPath`, both citations are kept, and the answer does not contain a `%` likelihood.
4. Add one grounding test whose recorded JSON cites `SecurityEvidencePathId:not-in-bundle`. Assert `Succeeded` is false and the error is the existing parse-failure message: `LLM response could not be parsed into a grounded answer with citations.`
5. If SN-CE-03 already covers that rejection through `TryParseLlmResponse`, keep this test anyway. It goes through `TryAnswerAsync` and the fake completion client.
6. Add `scripts/ci/check_securenow_cutting_edge.py`. It exits 1 when any of these fail:
   - `InfraEvidenceAskTopicKinds.cs` lacks `RankedPath = "RankedPath"`.
   - `InfraEvidenceAskRequest.cs` lacks `SecurityEvidencePathId`.
   - `InfraEvidenceAskIntentResolver.cs` lacks `SecurityEvidencePathId`, or the first `SecurityEvidencePathId` occurs after the first `ContainsAny`.
   - `InfraEvidenceAskPromptBuilder.cs` lacks `Do not return a new composite sort.`
   - `InfraEvidenceAskPromptBuilder.cs` lacks `Do not return a numeric likelihood or probability.`
   - `InfraEvidenceAskPromptBuilder.cs` contains `"probability"`, `"likelihood"`, or `"sortScore"` (a JSON field). The refusal sentences use the words without those quoted field names, so they must not trip this check. Match the quoted spellings.
   - `InfraEvidenceAskEvidenceCollector.cs` lacks `ISecurityEvidencePathRepository`, `ISecurityEvidencePathRankRepository`, or `ISecurityEvidenceCutPointRepository`.
   - `InfraEvidenceAskEvidenceCollector.cs` contains `PathRankingEngine` or `CutPointAnalysisEngine`.
   - `InfraEvidenceAskPromptBuilder.cs` lacks `AskEvidenceRowCap = 50`.
7. Add `scripts/ci/test_check_securenow_cutting_edge.py`. The real tree passes. A temp copy that deletes `RankedPath = "RankedPath"` fails.
8. In `.github/workflows/ci.yml`, add two steps after `SecureNow self-service unit tests`, both `continue-on-error: true`:
   - `SecureNow cutting edge` runs `python scripts/ci/check_securenow_cutting_edge.py`.
   - `SecureNow cutting edge unit tests` runs `python -m unittest scripts.ci.test_check_securenow_cutting_edge`.

## Optional panel control

You may add one control on `SecurityEvidencePathInspectPanel`, labeled `Ask about this stored path`, shown only when a path id is already resolved. It calls `submitInfraEvidenceAsk` with the question `Explain this ranked path and its stored cut point.`, `securityEvidencePathId` set to that path id, and `snapshotId` when the panel already has one. Show the returned answer and citation ids. When `insufficientEvidence` is true, show the answer text.

Forward `securityEvidencePathId` from `submitInfraEvidenceAsk` and add it to `archlucid-ui/src/lib/infra-evidence/infra-evidence-ask-types.ts`. Do not add the control if the only way to reach Ask is a new route.

Leave `buildSecurityEvidencePathExplanation` and the existing explanation button in place.

## Tests

`dotnet test ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj --filter FullyQualifiedName~InfraEvidenceAskGroundingServiceTests`

`python3 scripts/ci/check_securenow_cutting_edge.py`

`python3 -m unittest scripts.ci.test_check_securenow_cutting_edge`

If you added the panel control, run the existing `SecurityEvidencePathInspectPanel` vitest file.

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2. On a Linux Cloud Agent, use `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path '<path>'`.
- Do not set `continue-on-error` to false.
- Do not add a mailbox, a public price, a `$`, or a "Start trial" control.
- Do not write to Azure.
- Do not commit.

## Done when

The fixture question accepts an on-list recorded completion, rejects an off-list citation, and the checker passes on that tree and fails when `RankedPath` is removed.
