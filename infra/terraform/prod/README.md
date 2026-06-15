# Hosted production Terraform root

V1 composition scaffold for **consumed** Azure OpenAI, Azure AI Search, Azure AI Content Safety, Key Vault references, private endpoints, and diagnostics.  
Owner decision: `docs/library/IAC_RUNTIME_PARITY.md` (2026-05-30). **TB-093 (2026-06-01):** production-like stacks default to `openai_compose_mode = existing` (US East / `eastus`) — this root does **not** create a second OpenAI account.

## Single-apply RBAC (workload principals)

Container App **system-assigned** `principal_id` values must exist before Cognitive Services and Key Vault RBAC can bind. This root accepts principals through either:

| Input | Purpose |
|-------|---------|
| `openai_workload_principal_ids` | List of API / Worker Entra object IDs |
| `workload_identity_principal_id` | Legacy single-principal shorthand (merged into the unified set) |

`workload_rbac_locals.tf` deduplicates both inputs into `local.workload_principal_ids_unified`, which drives:

- **Cognitive Services OpenAI User** on the consumed OpenAI account (`openai_workload_rbac.tf`)
- **Key Vault Secrets User** on the referenced vault (`keyvault_private_endpoints.tf`)

### One-shot apply script

After Container Apps exist (any IaC root that creates them), run from the repo root:

```powershell
.\scripts\deploy\Apply-HostedProdStack.ps1 `
  -WorkloadPrincipalIds @('<api-principal-id>', '<worker-principal-id>') `
  -AutoApprove
```

`-PlanOnly` runs `terraform plan` only. Omit `-AutoApprove` to confirm interactively.

When `infra/terraform/prod` is the authoritative copy, sync first:

```powershell
.\scripts\ci\sync-hosted-prod-terraform-to-infra.ps1
```

## Consumed Azure OpenAI (TB-093)

Platform subscription owns the Cognitive Services account, model deployments, content filters, quota, CMK, and private endpoint. This root:

1. Validates `openai_existing_*` contract variables and region (`openai_expected_location`, default `eastus`).
2. Outputs `azure_openai_container_app_env` for Container Apps (`AzureOpenAI__AuthenticationMode=ManagedIdentity`, endpoint, deployment names).
3. Grants **Cognitive Services OpenAI User** to every ID in `local.workload_principal_ids_unified` when non-empty.

`infra/terraform-openai` remains **budget-only** (optional consumption alerts); use its `consumed_openai_contract` output to document hand-offs.

```bash
cd deploy/hosted-prod-terraform
terraform init
terraform plan -var-file=terraform.tfvars
```

Copy `terraform.tfvars.example` to `terraform.tfvars` and set your platform-owned OpenAI ARM id, endpoint, and deployment names.

## Consumed Azure AI Search (TB-096)

Default `search_compose_mode = existing` (US East / `eastus`). Set `search_existing_resource_id`, `search_existing_endpoint`, and `search_index_name`. Outputs `azure_search_container_app_env` and `search_service_id` for private-endpoint wiring.

See `docs/library/AZURE_AI_SEARCH_CONSUMED.md`.

## Consumed Azure AI Content Safety (TB-212)

Default `content_safety_compose_mode = existing` (US East / `eastus`). Set `content_safety_existing_resource_id` and `content_safety_existing_endpoint`. Output `azure_content_safety_container_app_env` maps non-secret keys; store `ArchLucid:ContentSafety:ApiKey` in Key Vault.

Copy `terraform.tfvars.example` alongside OpenAI and Search variables before `terraform plan`.
