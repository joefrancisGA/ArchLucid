# SN-CE-01 — Ranked-path Ask topic

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file as the whole task. Do not use a fast-tier slug and do not use a model outside the workspace allowlist. Do not implement another SN-CE prompt in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/SECURENOW_CUTTING_EDGE_COMPOSER_PROMPTS.md`

## Goal

Infrastructure Ask can name one stored security-evidence path. The topic is `RankedPath`, and it is selected only when the request carries that path id. Keyword text stays on the existing topics.

## Why

Cutting-Edge AI Technology is **62** (weight 8, weighted deficiency 304) on the 31 October 2026 desk pass. Ask already redacts a prompt, calls `CompleteJsonAsync`, and keeps citations inside a bundle. SecureNow’s distinctive record — the ranked path and its cut point — is not an Ask topic. `InfraEvidenceAskIntentResolver` sends “show me” to `DiagramView`. This step adds the topic and the id so later steps can load the stored rows.

## Read first

- `ArchLucid.Contracts/InfraEvidence/InfraEvidenceAskTopicKinds.cs`
- `ArchLucid.Contracts/InfraEvidence/InfraEvidenceAskRequest.cs`
- `ArchLucid.Application/InfraEvidence/Ask/InfraEvidenceAskIntentResolver.cs`
- `ArchLucid.Application/InfraEvidence/InfraEvidenceAskGroundingService.cs` (do not change the grounding flow in this session)
- `ArchLucid.Application/InfraEvidence/SecureNowArchitect/PathRankingEngine.cs` (do not edit it)

## What to build

1. Branch `sn-ce/01-ranked-path-topic` from current `master`.
2. Add `public const string RankedPath = "RankedPath";` to `InfraEvidenceAskTopicKinds`.
3. Add `Guid? SecurityEvidencePathId` to `InfraEvidenceAskRequest`, next to the other optional ids. `Guid.Empty` means unset.
4. In `InfraEvidenceAskIntentResolver.Resolve`, before the audit-control check and before every `ContainsAny` check: when `SecurityEvidencePathId` has a value and that value is not `Guid.Empty`, return `InfraEvidenceAskTopicKinds.RankedPath`.
5. Leave every existing keyword branch as it is. A question that says “ranked path” or “show me” with no path id must not return `RankedPath`.
6. Add `ArchLucid.Application.Tests/InfraEvidence/InfraEvidenceAskIntentResolverTests.cs`. The resolver is `internal`. `ArchLucid.Application.Tests` already has `InternalsVisibleTo`.
7. Cover these cases:
   - Path id set and question `show me this path` → `RankedPath`.
   - Path id set and question `what changed since baseline` → `RankedPath`.
   - Path id null and question `show me the diagram` → `DiagramView`.
   - Path id null and question `ranked path` → `ResourceOverview`.
   - Path id `Guid.Empty` and question `show me this path` → `DiagramView`.

## Tests

From the repo root, with `PATH` including the .NET SDK:

`dotnet test ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj --filter FullyQualifiedName~InfraEvidenceAskIntentResolverTests`

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2. On a Linux Cloud Agent, use `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path '<path>'`.
- Do not edit `PathRankingEngine`, `SecurityEvidencePathRankCalculator`, `SecurityEvidencePathRankExplanationBuilder`, or `CutPointAnalysisEngine`.
- Do not add a keyword list that selects `RankedPath`.
- Do not add `probability`, `likelihood`, or `sortScore` to the Ask JSON schema.
- Do not raise `AskEvidenceRowCap`.
- If the OpenAPI v1 contract snapshot test fails because of the new property, regenerate it with `ARCHLUCID_REGENERATE_UI_API_TYPES=1 bash scripts/ci/update_openapi_contract_snapshot.sh` from the repo root. Do not hand-edit `schemas.generated.ts`.
- Do not commit.

## Done when

A request with `SecurityEvidencePathId` resolves to `RankedPath` even when the question contains “show me”. The same question without a path id still resolves to `DiagramView`.
