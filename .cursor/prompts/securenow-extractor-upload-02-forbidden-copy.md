# SN-XU-02 — Say a product-line refusal is a refused route

**Model:** GPT-5.6 Luna. Paste this file as the whole task. Do not change the capability map in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/SECURENOW_EXTRACTOR_UPLOAD_PRODUCT_LINE_LUNA_PROMPTS.md`

**Depends on:** SN-XU-01. The map change is what lets SecureNow upload. This session only corrects the callout for a product-line 403 that still occurs.

## Goal

When extractor upload returns the product-line gate's 403, the callout says this product cannot use the route and that the ZIP was not inspected. It does not tell the operator to fix the extractor package.

## Why

`resolveAzureExtractorUploadError` recognizes ZIP, manifest, and schema sentences. The gate detail `The active product line cannot access this API route.` matches none of them, so `resolveSemanticCode` returns `AZURE_EXTRACTOR_UPLOAD_UNKNOWN`. `guidanceForSemanticCode` then says to review the error, fix the extractor package, and retry. The callout heading is `Azure extractor upload failed`. The real detail appears only as a bullet under that repair advice.

That advice is wrong for this response. `ProductLineRouteGateMiddleware` writes the 403 and returns before ingest. A different `FORBIDDEN` body, such as an authorization failure with another detail, is a different fact and must keep today's resolution.

After SN-XU-01 this particular upload should succeed. The copy still has to be honest the next time a controller is mapped to the wrong product line.

The checklist is a separate signal. `resolveExtractUploadPackageSteps` marks both rows Done when a package id or baseline artifacts are already stored. Leave that behavior. A refused upload must not clear **Inventory on file**.

## Read first

- `archlucid-ui/src/lib/azure-extractor-upload-error-resolver.ts`
- `archlucid-ui/src/lib/azure-extractor-upload-failure.ts`
- `archlucid-ui/src/lib/azure-extractor-upload-failure.test.ts`
- `archlucid-ui/src/components/AzureExtractorUploadFailureCallout.tsx`
- `ArchLucid.Api/Middleware/ProductLineRouteGateMiddleware.cs` (the detail sentence and status 403)
- `ArchLucid.Host.Core/ProblemDetails/ProblemErrorCodes.cs` (`Forbidden` = `FORBIDDEN`)
- `archlucid-ui/src/app/(operator)/administration/extract-upload/_sections/ExtractUploadSettingsPageClient.test.tsx` (the existing upload-failure callout test)
- `archlucid-ui/src/lib/extract-upload-package-checklist.ts`

## What to build

1. Add semantic code `AZURE_EXTRACTOR_UPLOAD_PRODUCT_LINE_FORBIDDEN` to `AzureExtractorUploadSemanticCode`.

2. Resolve that code when the trimmed detail is exactly `The active product line cannot access this API route.` Check this before the ZIP, manifest, and schema matches. When `errorCode` is present and is not `FORBIDDEN`, keep the existing resolution. When `errorCode` is `FORBIDDEN` and the detail is any other sentence, keep the existing resolution.

3. Heading for this code: `This product cannot use this upload route`. Guidance: `The ZIP was not inspected. The active product line cannot call this API route. Include the copied error details when opening a support ticket.` `failureKind` stays `unknown`. The guidance contains neither `fix the extractor package` nor `re-run`.

4. Handle the new code in every switch over `AzureExtractorUploadSemanticCode`, including the `never` default.

Leave the callout's troubleshooting link, correlation id, and **Copy error details** button as they are. Leave the middleware, the capability map, and `resolveExtractUploadPackageSteps` unchanged.

## Tests

Extend `archlucid-ui/src/lib/azure-extractor-upload-failure.test.ts`.

1. A problem whose detail is `The active product line cannot access this API route.`, whose `errorCode` is `FORBIDDEN`, and whose status is 403 resolves to `AZURE_EXTRACTOR_UPLOAD_PRODUCT_LINE_FORBIDDEN`, heading `This product cannot use this upload route`, and guidance that contains `was not inspected`. The guidance does not contain `extractor package`.
2. `errorCode` `FORBIDDEN` with detail `Missing permission to upload inventory.` does not resolve to `AZURE_EXTRACTOR_UPLOAD_PRODUCT_LINE_FORBIDDEN`.
3. The existing unsupported-schemaVersion case still resolves to `AZURE_EXTRACTOR_UNSUPPORTED_SCHEMA_VERSION`.

Extend `ExtractUploadSettingsPageClient.test.tsx`.

4. Baseline reports inventory on file. A client-valid ZIP posts to `/api/proxy/v1/azure-extractor/upload` and the response is 403 problem+json with that detail, title `Product line cannot use this route`, and `errorCode` `FORBIDDEN`. The callout error code is `AZURE_EXTRACTOR_UPLOAD_PRODUCT_LINE_FORBIDDEN`. The checklist rows stay Done.

From `archlucid-ui`, run the focused Vitest files you changed, then `npx tsc --noEmit -p tsconfig.json` if you changed TypeScript.

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2.
- On the Cloud Agent VM the same check is `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path '<path>'`.
- Do not commit unless the user names the branch in that request.
- Do not write to customer Azure.
- Do not hide an Extract & Upload section behind a More menu.

## Done when

The product-line detail renders as `AZURE_EXTRACTOR_UPLOAD_PRODUCT_LINE_FORBIDDEN` with the refused-route heading and guidance. A different `FORBIDDEN` detail still follows the existing resolver. An already-stored inventory stays **Inventory on file** while this 403 is showing.
