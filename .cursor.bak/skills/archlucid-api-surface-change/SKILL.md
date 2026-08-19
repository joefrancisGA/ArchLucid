---
name: archlucid-api-surface-change
description: >-
  Updates ArchLucid HTTP/OpenAPI surface and keeps snapshot, NSwag .NET client,
  UI api-types, and docs aligned. Use when changing ArchLucid.Api routes or DTOs,
  ArchLucid.Contracts wire types, Problem Details, GET /openapi/v1.json,
  openapi snapshot, Api.Client codegen, or archlucid-ui generated API types.
disable-model-invocation: true
---

# ArchLucid API surface change

## Contract of record

- Canonical OpenAPI: **`GET /openapi/v1.json`** — not `/swagger/v1/swagger.json` (explorer-oriented). See [`docs/library/API_CONTRACTS.md`](../../../docs/library/API_CONTRACTS.md).

## Checklist (same PR when feasible)

1. **Controllers / contracts:** Implement the change under `ArchLucid.Api/Controllers/` (area subfolders: Authority, Governance, Alerts, Admin, Advisory, Evolution, Planning — namespaces `ArchLucid.Api.Controllers.{Area}`) and wire DTOs in [`ArchLucid.Contracts`](../../../ArchLucid.Contracts/) as needed.
2. **OpenAPI snapshot:** Regenerate [`ArchLucid.Api.Tests/Contracts/openapi-v1.contract.snapshot.json`](../../../ArchLucid.Api.Tests/Contracts/openapi-v1.contract.snapshot.json).

   **PowerShell (repo root):**

   ```powershell
   $env:ARCHLUCID_UPDATE_OPENAPI_SNAPSHOT = "1"
   dotnet test ArchLucid.Api.Tests --filter "OpenApiContractSnapshotTests"
   ```

   Or use the helper (builds `ArchLucid.Api.Tests` only): `scripts/ci/check_openapi_contract_snapshot.ps1` or `ARCHLUCID_UPDATE_OPENAPI_SNAPSHOT=1 bash scripts/ci/check_openapi_contract_snapshot.sh`.

   Details: [`docs/library/OPENAPI_CONTRACT_DRIFT.md`](../../../docs/library/OPENAPI_CONTRACT_DRIFT.md).

3. **.NET client:** `dotnet build ArchLucid.Api.Client/ArchLucid.Api.Client.csproj` so [`Generated/ArchLucidApiClient.g.cs`](../../../ArchLucid.Api.Client/Generated/ArchLucidApiClient.g.cs) matches (see [`ArchLucid.Api.Client/README.md`](../../../ArchLucid.Api.Client/README.md)).

4. **TypeScript types:** From [`archlucid-ui/`](../../../archlucid-ui/): `npm run generate:api-types` → `src/lib/api-types.generated.ts`. Optional CI alignment: `scripts/ci/assert_api_types_in_sync.sh` when present in workflow.

5. **Docs:** Update [`docs/library/API_CONTRACTS.md`](../../../docs/library/API_CONTRACTS.md) **PR checklist** and any operator/runbook pages; update [`docs/library/CONFIGURATION_REFERENCE.md`](../../../docs/library/CONFIGURATION_REFERENCE.md) when [`ConfigurationKeyCatalog`](../../../ArchLucid.Core/Configuration/ConfigurationKeyCatalog.cs) entries change.

Repo rule mirror: [`.cursor/rules/Http-Surface-Docs-And-Clients.mdc`](../../../.cursor/rules/Http-Surface-Docs-And-Clients.mdc).

## Verify

- `dotnet build ArchLucid.sln -c Release` (or at least `ArchLucid.Api.Tests` + client + UI typecheck per [`docs/engineering/BUILD.md`](../../../docs/engineering/BUILD.md)).

## Do not

- Merge snapshot-only changes without rebuilding **Api.Client** and **api-types** when wire schemas changed.
