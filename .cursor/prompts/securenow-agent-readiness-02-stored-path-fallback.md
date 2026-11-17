# SN-AIR-02 — Fall back to the stored-path summary

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file as the whole task. Do not use a fast-tier slug and do not use a model outside the workspace allowlist. Do not implement another SN-AIR prompt in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/SECURENOW_AGENT_READINESS_COMPOSER_PROMPTS.md`

## Goal

When the live explanation JSON fails validation, or the completion call throws, persist the deterministic stored-path summary and a rejection reason. Do not call the model again.

## Why

`TryBuildExplanationAsync` returns `Succeeded: false` when `TryParseLlmResponse` rejects the JSON, and the catch block returns `ex.Message`. Path inspect then shows `Explanation unavailable`. The deterministic summary from `BuildSimulatorExplanation` already cites only allowed hop evidence refs.

## Read first

- `ArchLucid.Application/InfraEvidence/SecurityEvidencePathExplanationService.cs`
- `ArchLucid.Application/InfraEvidence/SecurityEvidencePathExplanationBuilder.cs`
- `ArchLucid.Application.Tests/InfraEvidence/SecurityEvidencePathExplanationServiceTests.cs`
- `ArchLucid.Core/Persistence/ApplicationPorts/InfraEvidence/SecurityEvidencePathExplanationRecord.cs`
- `ArchLucid.Contracts/InfraEvidence/SecurityEvidencePathExplanationContracts.cs`
- `ArchLucid.Persistence/InfraEvidence/SqlSecurityEvidencePathExplanationRepository.cs`
- `ArchLucid.Persistence/Migrations/386_SecurityEvidencePathExplanations.sql`
- `ArchLucid.Persistence/Migrations/340_ArchitectureVersionArtifactHash_DraftRevisionPin.sql` (idempotent `COL_LENGTH` shape only)
- `archlucid-ui/src/lib/security-evidence-path-api.ts` (`mapExplanation`)

## What to build

1. Branch `sn-air/02-stored-path-fallback` from current `master` after SN-AIR-01 is present.
2. Add `ArchLucid.Persistence/Migrations/420_SecurityEvidencePathExplanationModelOutputRejection.sql`. When `COL_LENGTH(N'dbo.SecurityEvidencePathExplanations', N'ModelOutputRejection')` is null, add `ModelOutputRejection NVARCHAR(512) NULL`. Tenant-plane names must be `###_Name.sql` (see `DatabaseMigrationScriptTests`). Migrations are embedded by `Migrations\*.sql`. Do not edit the csproj include.
3. Thread `string? ModelOutputRejection` through the explanation record, the SQL insert and read, the API response, and `mapExplanation`.
4. In the live branch of `TryBuildExplanationAsync`, after one `CompleteJsonAsync` call:
   - When `TryParseLlmResponse` returns false, or `CompleteJsonAsync` throws anything other than `OperationCanceledException` (let that propagate), build the content with the existing `BuildSimulatorExplanation`.
   - Persist `ProvenanceKind.DeterministicInference`, `SimulatorLabel` = `SecurityEvidencePathExplanationBuilder.SimulatorLabel`, and `ModelOutputRejection` set to the parser rejection reason when one exists. Otherwise set it to `Model output rejected; showing the stored-path summary.`
   - Return `Succeeded: true` with that record.
5. A valid parse still stores `ProvenanceKind.AiInference` and `ModelOutputRejection` null. Do not set a simulator label on that row.
6. Keep the existing skip for `InsufficientEvidence` paths and the empty-summary failure. Those are not model rejections.
7. Extend `SecurityEvidencePathExplanationServiceTests`:
   - Recorded JSON whose executive summary names an ARM id outside `allowedArmIds` returns success, `DeterministicInference`, the simulator label, a non-empty `ModelOutputRejection`, and citations that are only the path id or hop evidence refs. `CompleteJsonAsync` is called once.
   - `CompleteJsonAsync` throwing `InvalidOperationException` follows the same fallback and does not surface `ex.Message` as `ErrorMessage`.
   - The existing valid-JSON test still returns `AiInference` and a null `ModelOutputRejection`.
8. If the OpenAPI v1 contract snapshot fails because of the new property, regenerate it with `ARCHLUCID_REGENERATE_UI_API_TYPES=1 bash scripts/ci/update_openapi_contract_snapshot.sh` from the repo root. Do not hand-edit `schemas.generated.ts`.

## Tests

`dotnet test ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj --filter FullyQualifiedName~SecurityEvidencePathExplanationServiceTests`

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2. On a Linux Cloud Agent, use `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path '<path>'`.
- Do not call `CompleteJsonAsync` a second time on the failure path.
- Do not change path-rank weights or call `PathRankingEngine` from this service.
- Do not set `maxTokens` in this session. SN-AIR-03 owns the cap.
- Do not commit.

## Done when

An invented ARM id and a thrown completion each persist the stored-path summary with a rejection reason. A valid cited JSON completion still persists as `AiInference` with no rejection reason.
