# Terraform: Azure OpenAI consumption budget (optional)

Optional root that creates **`azurerm_consumption_budget_resource_group`** for **Azure OpenAI** workloads billed as **`Microsoft.CognitiveServices/accounts`**.

## Usage

1. Copy **`terraform.tfvars.example`** → **`terraform.tfvars`**.
2. Set **`openai_consumption_budget_resource_group_id`** (budget creation defaults **on** as of 2026-07-20; no budget is created until this id is set). Use **`openai_consumption_budget_contact_emails`** or rely on default **`openai_consumption_budget_contact_roles`** (`Owner`).
3. `terraform init` → `plan` → `apply`.

This root does **not** create the Cognitive Services account; provision OpenAI separately (portal, Bicep, or another Terraform root) and point this stack at the account’s resource group.

## Outputs

| Output | Use |
|--------|-----|
| **`openai_consumption_budget_id`** | Auditing or linking automation to the budget resource. |

See **`docs/DEPLOYMENT_TERRAFORM.md`** for how this root fits the wider `infra/terraform-*` map.

## TB-093 consumed-resource contract

This root does **not** create Cognitive Services accounts for production-like pilots. Set optional consumed_openai_* variables to validate/document the hand-off to deploy/hosted-prod-terraform or infra/terraform-container-apps. See consumed_openai_contract output after apply.
