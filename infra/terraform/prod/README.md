# Hosted production Terraform root

V1 composition scaffold for Azure OpenAI, Azure AI Search, Key Vault references, private endpoints, and diagnostics.  
Owner decision: `docs/library/IAC_RUNTIME_PARITY.md` (2026-05-30).

Mirror into the authoritative root when `infra/` is writable:

```powershell
.\scripts\ci\sync-hosted-prod-terraform-to-infra.ps1
```

```bash
cd deploy/hosted-prod-terraform
terraform init
terraform plan -var-file=terraform.tfvars
```

Copy `terraform.tfvars.example` to `terraform.tfvars` and set region/SKU values validated for your subscription.

When `enable_private_endpoints` is true, set `private_endpoint_subnet_id` and optionally `workload_identity_principal_id` for Key Vault Secrets User RBAC on an existing vault referenced by `key_vault_name`.
