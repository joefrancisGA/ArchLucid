# ArchLucid Tier-2 Azure Extractor — customer WIF templates

Run these templates **once per customer Azure subscription** to provision a read-only service principal that trusts ArchLucid's user-assigned managed identity via federated workload identity (WIF).

## Parameters (from ArchLucid)

| Parameter | Description |
|---|---|
| `archlucid_tenant_id` | ArchLucid Entra tenant id (issuer) |
| `archlucid_managed_identity_object_id` | Object id of ArchLucid's user-assigned managed identity |
| `subscription_id` | Customer subscription ArchLucid will read |

## Outputs (paste into ArchLucid)

- `customer_tenant_id`
- `customer_app_id` (service principal application/client id)
- `subscription_id`

## Least privilege

- **`Reader`** on the target subscription only
- **`Cost Management Reader`** on the same subscription only
- No secrets stored in ArchLucid — federation only

## Terraform

```powershell
cd deploy/customer-templates/terraform
terraform init
terraform validate
terraform fmt -check -recursive .
terraform apply `
  -var-file=terraform.tfvars.example `
  -var "archlucid_tenant_id=<guid>" `
  -var "archlucid_managed_identity_object_id=<guid>" `
  -var "subscription_id=<guid>"
```

Copy `terraform.tfvars.example` to `terraform.tfvars` for local dry-runs (do not commit real subscription ids).

## Bicep

```powershell
cd deploy/customer-templates/bicep
az bicep build --file main.bicep
az deployment sub create `
  --location eastus `
  --template-file main.bicep `
  --parameters archLucidTenantId=<guid> `
               archLucidManagedIdentityObjectId=<guid> `
               subscriptionId=<guid>
```

## Validate (no Azure credentials)

From repo root:

```powershell
python scripts/ci/validate_customer_wif_templates.py
```

CI runs the same script in warn-only mode when `terraform` / `az` / `bicep` CLIs are available.

See also: `docs/library/AZURE_EXTRACTOR.md`.
