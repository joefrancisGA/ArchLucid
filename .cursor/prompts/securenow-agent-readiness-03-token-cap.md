# SN-AIR-03 — Cap the explanation and show the grounding line

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file as the whole task. Do not use a fast-tier slug and do not use a model outside the workspace allowlist. Do not implement another SN-AIR prompt in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/SECURENOW_AGENT_READINESS_COMPOSER_PROMPTS.md`

## Goal

The path-explanation completion and the `RankedPath` Ask completion request at most 800 output tokens. Path inspect states how many citations grounded the answer, and shows the rejection sentence when the model output was replaced.

## Why

Both call sites pass `maxTokens: null`. After SN-AIR-02, a fallback row has `ModelOutputRejection`, and the panel does not yet show that sentence or a citation count.

## Read first

- `ArchLucid.Application/InfraEvidence/SecurityEvidencePathExplanationService.cs`
- `ArchLucid.Application/InfraEvidence/InfraEvidenceAskGroundingService.cs`
- `ArchLucid.Application/InfraEvidence/Ask/InfraEvidenceAskTopicKinds.cs`
- `ArchLucid.Application.Tests/InfraEvidence/SecurityEvidencePathExplanationServiceTests.cs`
- `ArchLucid.Application.Tests/InfraEvidence/InfraEvidenceAskGroundingServiceTests.cs`
- `archlucid-ui/src/components/security/SecurityEvidencePathInspectPanel.tsx`
- `archlucid-ui/src/lib/product-line/securenow-path-inspect-copy.ts`
- `archlucid-ui/src/lib/security-evidence-path-api.ts`

## What to build

1. Branch `sn-air/03-token-cap` from current `master` after SN-AIR-01 and SN-AIR-02 are present.
2. Add `public const int PathExplanationMaxOutputTokens = 800;` on `SecurityEvidencePathExplanationService` and pass it as `maxTokens` to `CompleteJsonAsync` in that service.
3. In `InfraEvidenceAskGroundingService.TryAnswerAsync`, pass `800` as `maxTokens` only when `topicKind` is `InfraEvidenceAskTopicKinds.RankedPath`. Leave every other topic at `maxTokens: null`.
4. On the path-inspect explanation output, render `Grounded on {n} citations.` where `{n}` is `citedEvidenceRefs.length`.
5. When `modelOutputRejection` is non-empty, render that string as its own line. Do not prepend it to `executiveSummary`.
6. Assert in `SecurityEvidencePathExplanationServiceTests` that the valid live call receives `maxTokens` 800.
7. Add or extend one `InfraEvidenceAskGroundingServiceTests` case for a `RankedPath` request that verifies `CompleteJsonAsync` received `800`. A non-`RankedPath` request in the same suite must still receive a null `maxTokens` if a test already covers that call; do not retarget other topics to 800.

## Tests

`dotnet test ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj --filter FullyQualifiedName~SecurityEvidencePathExplanationServiceTests|FullyQualifiedName~InfraEvidenceAskGroundingServiceTests`

From `archlucid-ui`:

`npx vitest run src/components/security/SecurityEvidencePathInspectPanel.test.tsx`

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2. On a Linux Cloud Agent, use `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path '<path>'`.
- Do not raise `AskEvidenceRowCap`.
- Do not add `probability`, `likelihood`, or `sortScore` to either JSON schema.
- Do not commit.

## Done when

The path explanation and `RankedPath` Ask pass 800 as `maxTokens`. The panel shows the citation count and, on a fallback row, the rejection sentence.
