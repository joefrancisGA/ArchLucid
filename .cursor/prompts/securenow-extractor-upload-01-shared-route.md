# SN-XU-01 — Share the inventory upload routes with SecureNow

**Model:** GPT-5.6 Luna. Paste this file as the whole task. Do not implement SN-XU-02 in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/SECURENOW_EXTRACTOR_UPLOAD_PRODUCT_LINE_LUNA_PROMPTS.md`

## Goal

A Security session can call the Azure inventory upload controller and the AWS/GCP inventory upload controller. Both rows in the product capability map are capability `infra-evidence`, product line `both`, status `assigned`.

## Why

SecureNow Extract & Upload is a Security route. `product-line-catalog.ts` assigns `/infrastructure/extract-upload` and `/governance/infrastructure/extract-upload` to `security`. The page posts to `/api/proxy/v1/azure-extractor/upload`, and the proxy sends `X-ArchLucid-Product-Line: security`.

`ProductLineRouteGateEvaluator` forbids that call when the controller's map row is `architecture`. `AzureExtractorUploadController` is that row today: capability `authority`, product line `architecture`. The `Authority` folder rule in `scripts/ci/build_product_capability_map.py` paints every controller in that folder `architecture`. The ingest code is already shared: `ArchLucid.Application.AzureExtractor` and `ArchLucid.Application.CloudInventoryExtractor` are capability `infra-evidence`. Hosted extractor admin controllers under `Admin` are already `both`. `TenantWorkspaceBaselineArtifactsController` is already `both`, which is why **Inventory on file** and the upload checklist can read Done while this POST returns 403.

The 403 body is Problem Details: title `Product line cannot use this route`, detail `The active product line cannot access this API route.`, `errorCode` `FORBIDDEN`. The ZIP is not inspected.

`Tier2ConnectionController` is the existing exception for this folder. It lives under `Authority` and is listed in `CONTROLLER_OVERRIDES` as `infra-evidence` / `both` because cloud connections serve both shells. Inventory ZIP ingest is the same kind of shared intake.

`use-extract-upload-page-client.ts` hardcodes `selectedPlatform` to `azure`, so the screenshot's POST is only `AzureExtractorUploadController`. `uploadTier1InventoryPackage` posts AWS and GCP to `CloudInventoryExtractorUploadController` (`/v1/extractor/aws/upload`, `/v1/extractor/gcp/upload`). That controller has the same folder-rule row. Leave it `architecture` and the next platform repeats this 403. Chunked upload sessions and package download live on the same two controllers, so one override per controller covers those actions.

`ReadAuthority` stays the authorization policy. `both` means both shells may pass the product-line gate. It does not open Architecture review controllers.

## Read first

- `scripts/ci/build_product_capability_map.py` (`CONTROLLER_OVERRIDES`, `CONTROLLER_FOLDER_RULES` for `Authority`)
- `docs/architecture/data/product-capability-map.json` (the two controller rows, and the `Tier2ConnectionController` row)
- `ArchLucid.Core/ProductCapability/ProductLineRouteGateEvaluator.cs`
- `ArchLucid.Api/Middleware/ProductLineRouteGateMiddleware.cs`
- `ArchLucid.Architecture.Tests/ProductCapability/ProductCapabilityMapCoverageTests.cs`
- `archlucid-ui/src/lib/product-line/product-line-catalog.ts` (`/infrastructure/extract-upload`)
- `archlucid-ui/src/app/(operator)/administration/extract-upload/_sections/use-extract-upload-upload.ts`
- `archlucid-ui/src/lib/upload-tier1-inventory-package.ts`

## What to build

1. In `CONTROLLER_OVERRIDES`, next to `Tier2ConnectionController`, add:
   - `ArchLucid.Api.Controllers.Authority.AzureExtractorUploadController` → capability `infra-evidence`, product line `both`, status `assigned`, owner note `None`
   - `ArchLucid.Api.Controllers.Authority.CloudInventoryExtractorUploadController` → the same four values

2. Regenerate the map with `python3 scripts/ci/build_product_capability_map.py`. If that rewrite changes any other assigned row, restore those rows and keep only these two controller updates.

3. In `ProductCapabilityMapCoverageTests`, add one fact that loads the map and asserts both type names are capability `infra-evidence`, product line `both`, and status `assigned`.

Leave the middleware, the evaluator, both controllers, their `Authorize` policies, and the Extract & Upload page unchanged. Leave checklist completion in `resolveExtractUploadPackageSteps` unchanged.

## Tests

The new coverage fact is the lock. `ProductLineRouteGateEvaluatorTests` already allows Security against map product line `both`. Leave that theory as it is.

Compile once:

`pwsh -NoProfile -File scripts/ci/agent-compile-check.ps1 -ProjectPath 'ArchLucid.Architecture.Tests/ArchLucid.Architecture.Tests.csproj'`

Run `ProductCapabilityMapCoverageTests`.

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2.
- On the Cloud Agent VM the same check is `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path '<path>'`.
- One class per file. No `ConfigureAwait(false)` in tests.
- Do not commit unless the user names the branch in that request.
- Do not write to customer Azure.
- Do not hide an Extract & Upload section behind a More menu.

## Done when

Both upload controllers are `infra-evidence` / `both` / `assigned` in `product-capability-map.json`, the coverage fact fails if either row drifts, and a Security session is no longer forbidden from those controllers by the product-line gate. The gate still forbids Security from a controller whose row remains `architecture`.
