> **Scope:** Paste-ready GPT-5.6 Luna prompts. Let SecureNow upload an inventory ZIP, and stop describing a product-line 403 as a bad package. Internal engineering only.
> **Paste-ready files:** [`.cursor/prompts/securenow-extractor-upload-00-index.md`](../../.cursor/prompts/securenow-extractor-upload-00-index.md)

# SecureNow extractor upload product line — Luna prompts

**Created:** 2026-10-10 · **Status:** ready to paste · **Audience:** GPT-5.6 Luna

Paste **one** prompt per Luna session. Run them in order. Do not implement from this index.

SecureNow Extract & Upload (`/infrastructure/extract-upload`) posts `securenow-azure-package.zip` to `POST /v1/azure-extractor/upload`. The browser accepts the ZIP. `ProductLineRouteGateMiddleware` then returns 403 because `AzureExtractorUploadController` is mapped `architecture` and the effective product line is Security. The callout labels that response `AZURE_EXTRACTOR_UPLOAD_UNKNOWN` and tells the operator to fix the extractor package. **Inventory on file** and both checklist rows stay Done because `TenantWorkspaceBaselineArtifactsController` is already `both`.

| ID | Prompt | Depends on | Intent |
|----|--------|------------|--------|
| **SN-XU-01** | [securenow-extractor-upload-01-shared-route.md](../../.cursor/prompts/securenow-extractor-upload-01-shared-route.md) | — | Map both inventory upload controllers to `infra-evidence` / `both` |
| **SN-XU-02** | [securenow-extractor-upload-02-forbidden-copy.md](../../.cursor/prompts/securenow-extractor-upload-02-forbidden-copy.md) | SN-XU-01 | A product-line 403 says the route was refused, and the ZIP was not inspected |

## Do not pull into these sessions

- Changing `ProductLineRouteGateMiddleware` or `ProductLineRouteGateEvaluator`
- Opening every `Authority` controller to Security
- A second upload controller
- Moving these controllers out of the `Authority` folder
- Changing `ReadAuthority` on the upload controllers
- Clearing the checklist because a new upload was refused
- Hiding Extract & Upload or other desktop workspace tabs behind a More menu
- GTM **M-90 / M-44 / M-91 / M-92**
- Closed assurance **TB-135 / TB-136**
