> **Scope:** Operator and customer onboarding for Azure extractor Tier 1 (local ZIP) and Tier 2 (hosted WIF pull).

# Azure extractor

ArchLucid ingests read-only Azure inventory from a schema-versioned ZIP produced either by the customer-run PowerShell collector (**Tier 1**) or by ArchLucid's hosted collector (**Tier 2**, opt-in).

## Tier 1 — customer-run PowerShell

- Script: [`scripts/azure/Get-ArchLucidAzurePackage.ps1`](../../scripts/azure/Get-ArchLucidAzurePackage.ps1)
- Upload: `POST /v1/azure-extractor/upload` (multipart `file`, optional `runId`)
- No ArchLucid credentials run in the customer tenant.

## Tier 2 — cloud-hosted extractor (Workload Identity Federation)

Customers who cannot run local scripts provision a **read-only service principal** in their tenant and trust ArchLucid's user-assigned managed identity via **federated credentials**. ArchLucid stores only `customerTenantId` + `customerAppId` + `subscriptionId` — **never client secrets**.

### Customer onboarding (run once in customer tenant)

| Artifact | Path |
|----------|------|
| Terraform | [`infra/terraform-customer-onboarding/`](../../infra/terraform-customer-onboarding/) |
| Bicep | [`infra/bicep-customer-onboarding/main.bicep`](../../infra/bicep-customer-onboarding/main.bicep) |

Parameters (published by ArchLucid):

- `archLucidTenantId`
- `archLucidManagedIdentityObjectId`

Creates:

- Service principal `archlucid-readonly-extractor`
- Federated identity credential (issuer = ArchLucid tenant, subject = ArchLucid MI object id)
- Role assignments: **`Reader`** and **`Cost Management Reader`** on the subscription only

Outputs: `customer_app_id`, `customer_tenant_id` — paste into ArchLucid.

### ArchLucid operator API (Admin / ExecuteAuthority)

| Endpoint | Auth | Purpose |
|----------|------|---------|
| `POST /v1/admin/azure-extractor/hosted/configure` | Admin | Persist `{ CustomerTenantId, CustomerAppId, SubscriptionId, IncludeCost }` in `dbo.TenantHostedExtractorConfigurations` |
| `GET /v1/admin/azure-extractor/hosted/configuration?subscriptionId=` | Admin | Read back tenant row |
| `POST /v1/admin/azure-extractor/hosted/run` | ExecuteAuthority | Collect via WIF + ingest through existing upload pipeline |

Configuration gate: `HostedAzureExtractor:Enabled` (default `false`).

Audit: `Integration.HostedAzureExtractorConfigured` on configure.

### Trust boundary

- Hosted ARM collection uses **GET-only** calls to `management.azure.com` (Resource Manager list resources).
- Cost Management and Policy Insights surfaces that require POST are **not** collected on the hosted path; Tier 1 PowerShell remains the full-fidelity collector.
- No write or destructive ARM operations.

See also: [`docs/runbooks/AZURE_EXTRACTOR_INGEST.md`](../runbooks/AZURE_EXTRACTOR_INGEST.md), [`docs/library/V1_SCOPE.md`](V1_SCOPE.md) §2.16.
