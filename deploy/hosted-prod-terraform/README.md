# Hosted production Terraform root

V1 composition scaffold for **consumed** Azure OpenAI, Azure AI Search, Key Vault references, private endpoints, and diagnostics.  
Owner decision: `docs/library/IAC_RUNTIME_PARITY.md` (2026-05-30). **TB-093 (2026-06-01):** production-like stacks default to `openai_compose_mode = existing` (US East / `eastus`) — this root does **not** create a second OpenAI account.

## Consumed Azure OpenAI (TB-093)

Platform subscription owns the Cognitive Services account, model deployments, content filters, quota, CMK, and private endpoint. This root:

1. Validates `openai_existing_*` contract variables and region (`openai_expected_location`, default `eastus`).
2. Outputs `azure_openai_container_app_env` for Container Apps (`AzureOpenAI__AuthenticationMode=ManagedIdentity`, endpoint, deployment names).
3. Optionally grants **Cognitive Services OpenAI User** when `openai_workload_principal_ids` lists API/Worker `principal_id` values (after Container Apps exist).

For the multi-root path, prefer wiring the same values in `infra/terraform-container-apps` (`azure_openai_*` variables) — RBAC is applied in that root against the API/Worker identities on first apply.

`infra/terraform-openai` remains **budget-only** (optional consumption alerts); use its `consumed_openai_contract` output to document hand-offs.

Mirror into the authoritative root when `infra/` is writable:

```powershell
.\scripts\ci\sync-hosted-prod-terraform-to-infra.ps1
```

```bash
cd deploy/hosted-prod-terraform
terraform init
terraform plan -var-file=terraform.tfvars
```

Copy `terraform.tfvars.example` to `terraform.tfvars` and set your platform-owned OpenAI ARM id, endpoint, and deployment names.

## Consumed Azure AI Search (TB-096)

Default `search_compose_mode = existing` (US East / `eastus`). Set `search_existing_resource_id`, `search_existing_endpoint`, and `search_index_name`. Outputs `azure_search_container_app_env` and `search_service_id` for `terraform-private` private endpoints.

See `docs/library/AZURE_AI_SEARCH_CONSUMED.md`.