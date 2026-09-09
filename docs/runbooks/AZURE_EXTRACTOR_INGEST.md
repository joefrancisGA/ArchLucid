> **Scope:** Operator runbook — customer Azure extractor ZIP upload, schema, and audit events; not buyer legal text.

# Azure extractor ingest (operator)

## Overview

Customers run **`scripts/azure/Get-ArchLucidAzurePackage.ps1`** in their tenant (no ArchLucid credentials in their environment) and upload the resulting **`.zip`** to ArchLucid.

First-review workspaces surface a **skippable** “Upload Azure inventory ZIP” prompt on the review checklist and review detail — it links here and to `POST /v1/azure-extractor/upload`. Skipping is allowed and does **not** block finalize; engines still fail closed when inventory is absent (R5). This is **not** a hard gate, **not** SOC 2 attestation, and **not** default-on AWS/GCP inventory collection.

## API

- **`POST /v1/azure-extractor/upload`**
  - **Auth:** ReadAuthority on the route; **ExecuteAuthority** required for the mutation.
  - **Body:** `multipart/form-data` with field **`file`** (ZIP).
  - **Query:** optional **`runId`** to associate the upload with an architecture review run in the current workspace scope (run must exist).
  - **Success:** **202 Accepted** with **`packageId`** (GUID).
  - **Failure:** **422** when the archive is invalid, **`manifest.json`** is missing or unreadable, or **`schemaVersion`** is not supported (**`1` or `2`**).

## Schema (`manifest.json`)

Minimum required fields align with the PowerShell script and API reader:

- **`schemaVersion`** (int): **`1`** (legacy) or **`2`** (current packager / hosted collector).
- **`scriptVersion`**, **`collectionTimestamp`** (ISO-8601), **`subscriptionId`**, **`scope`**, **`switchesUsed`**, **`azModuleVersion`**.

Unsupported schema versions are rejected with no silent parsing.

## Persistence and security

- Stored in **`dbo.AzureExtractorPackages`** (`PackageBytes` VARBINARY plus **`ManifestJson`** copy for citation).
- ZIP may contain customer configuration data — treat as **tenant confidential**; retention follows your deployment SQL backup and data-lifecycle policy.

## Audit

Durable events are listed in **`docs/library/AUDIT_COVERAGE_MATRIX.md`**, including **`AzureExtractorPackage.Uploaded`**, **`AzureExtractorPackage.ParseFailed`**, **`AzureExtractorPackage.SchemaRejected`**, **`AzureExtractorPackage.IngestSucceeded`**.

## CLI — Terraform export (advisory)

Wraps Microsoft **`aztfexport`** (resource group scope):

```powershell
archlucid azure terraform-export --subscription <subId> --resource-group <rg> --out bundle.zip
```

ArchLucid never calls **`terraform apply`** or **`terraform destroy`**. Microsoft’s `aztfexport` may invoke **terraform import** internally as part of export; review their documentation for your compliance story.

## Links

- **PowerShell execution policy blocked?** [EXTRACTOR_EXECUTION_POLICY_BYPASS.md](./EXTRACTOR_EXECUTION_POLICY_BYPASS.md)
- **Sample ZIP contents (redacted):** [../samples/AZURE_EXTRACTOR_SAMPLE_OUTPUT.md](../samples/AZURE_EXTRACTOR_SAMPLE_OUTPUT.md)
- Buyer RBAC posture: **`docs/go-to-market/trust-center.md`**
- InfoSec pre-read (security reviewers): **`docs/go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md#azure-extractor--infosec-pre-read`**
- Outstanding engineering: **`docs/library/AZURE_EXTRACTOR_TECHNICAL_BACKLOG.md`**
- Product scope: **`docs/library/V1_SCOPE.md`** sections 2.16–2.17
