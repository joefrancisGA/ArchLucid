> **Scope:** Security and procurement reviewers auditing the read-only Azure extractor script (`Get-ArchLucidAzurePackage.ps1`) — API surfaces, data collected, and explicit exclusions; not tenant onboarding or runtime application security.

# ArchLucid Azure Extractor — InfoSec audit manifest

**Script:** `scripts/azure/Get-ArchLucidAzurePackage.ps1`  
**Purpose:** Read-only Azure Resource Manager inventory for offline ArchLucid ingestion (ZIP upload).  
**Last reviewed:** 2026-05-23

## What the script does

1. Authenticates to Azure using the operator’s existing `Connect-AzAccount` session (no ArchLucid credentials in the tenant).
2. Enumerates ARM resources at subscription, resource-group, or management-group scope.
3. Optionally queries Azure Policy compliance states, policy definitions/assignments, retail prices, and subscription ActualCost.
4. Writes a schema-versioned ZIP (`manifest.json`, `resources.json`, `policy-compliance.json`, `policy.json`, `README.txt`, optional `retail-prices.json`).

## Azure API surfaces (read-only)

| Surface | Method / cmdlet | Data collected |
|--------|------------------|----------------|
| Subscriptions | `Get-AzSubscription`, `Set-AzContext` | Subscription id, display metadata |
| Resource inventory | `Search-AzGraph` (preferred) or `Get-AzResource` | Resource id, type, name, location, SKU, tags, selected properties |
| Policy compliance | Policy Insights `policyStates/latest/queryResults` | Compliance state per resource/policy |
| Policy metadata | `Get-AzPolicyDefinition`, `Get-AzPolicyAssignment` | Definition/assignment metadata (no secrets) |
| Retail prices (optional) | HTTPS GET `https://prices.azure.com` | Public USD price rows for inventoried SKUs |
| Cost (optional) | `az rest` → `Microsoft.CostManagement/query` | Subscription ActualCost summary in `manifest.json` |

## Explicitly NOT collected

- Key Vault **secret values**, certificates, or keys (data plane)
- Connection strings, SAS tokens, storage account keys
- VM passwords, admin credentials, or arbitrary user PII beyond resource **tags**
- Network packet captures or application logs

## Network egress

- Azure Resource Manager (`management.azure.com`) — inventory and policy
- `prices.azure.com` — only when `-IncludeRetailPrices` is specified
- Microsoft Cost Management — only when `-IncludeCost` is specified and `az` CLI is available

## Integrity verification

Verify the script before production use:

```powershell
Get-FileHash -Algorithm SHA256 -Path .\scripts\azure\Get-ArchLucidAzurePackage.ps1
```

Record the SHA-256 in your change-management ticket. Re-compute after any script upgrade.

## Operator modes

- **`-DryRun`:** Lists planned API calls and scope; performs authentication and optional per-namespace resource counts; writes **no ZIP**.
- **Normal run:** Produces the ZIP at `-OutputPath` with `extractionDurationSeconds` in `manifest.json`.

## Upload path

Upload the ZIP via `POST /v1/azure-extractor/upload` (ExecuteAuthority). Trust stance: `docs/go-to-market/TRUST_CENTER.md`.
