# In-tenant SecureNow

One SecureNow instance and its collection agent in a customer subscription. This root follows ADR 0104 and ADR 0103. It does not deploy ArchLucid PaaS, and it does not copy the hosted Container Apps root.

`terraform apply` is a customer action. This repository's checks run `terraform init -backend=false` and `terraform validate` only.

## What it creates

- A resource group, three user-assigned managed identities (API, worker, collection agent), and an Entra app registration with no client secret.
- Azure SQL through `infra/modules/azure-sql-serverless-app`, with public network access disabled. The app connects with its managed identity. The break-glass SQL password is `TF_VAR_sql_admin_password`, not a tfvars value.
- A storage account with shared keys disabled and public network access disabled. Containers: `securenow-collection` (ADR 0103 handoff) and `app-payloads`.
- Key Vault and Azure OpenAI (`infra/modules/azure-openai`) with public network access disabled.
- `infra/terraform-private` for one VNet and private endpoints for SQL, Blob, Key Vault, and Azure OpenAI. Endpoint names come from `name_prefix`, so the hosted defaults are not used.
- An Azure Automation account, a PowerShell 7 runbook stub, a daily schedule, and a job schedule. Publish the customer-owned collector over the stub before the schedule runs.
- Container Apps for the API, worker, and UI only when `enable_private_ingress` is true. The environment uses an internal load balancer. API and UI ingress are not external. Image tags are rejected; digests (`@sha256:`) are required. Terraform does not ignore image changes.

## Hosting configuration

The API, worker, and UI get:

- `NEXT_PUBLIC_ARCHLUCID_PRODUCT=security` on the API and UI
- `SecureNow__Edition` = `Generic` or `Uhg`
- `SecureNow__Hosting` = `InTenant`
- `SecureNow__SupportTelemetry` = `false` unless the edition is Generic and `enable_support_telemetry` is true

UHG cannot enable support telemetry. The check fails the plan if it is set.

## Identity

| Identity | Roles |
|---|---|
| Collector | `Reader` on this resource group and on `collection_reader_resource_group_ids`. `Cost Management Reader` on those groups only when `enable_cost_collection` is true. `Storage Blob Data Contributor` on `securenow-collection`. |
| API | `Storage Blob Data Reader` on the handoff container, `Storage Blob Data Contributor` on `app-payloads`, `Automation Job Operator` on the Automation account, `Key Vault Secrets User` on the vault. |
| Worker | `Storage Blob Data Contributor` on `app-payloads`, `Key Vault Secrets User` on the vault. |

Subscription and management-group role assignments are not created. ADR 0103 allows subscription `Reader` for a wide estate; this root keeps every scope at a resource group or narrower, which is what ADR 0104 requires the checks to enforce. List each resource group the collector should read.

Graph application permissions are not granted here. Add them only for the evidence catalog that needs them, with admin consent recorded outside this root.

## Names

`name_prefix` is required. For `edition = "uhg"` the prefix cannot contain the hosted product token. `terraform.tfvars.example` uses `securenow`. `scripts/ci/assert_securenow_in_tenant_names.py` fails if that example or a resource name in this root contains it.

## Private ingress

`enable_private_ingress` defaults to false, so the first apply does not publish a URL. Set it to true with a delegated subnet (`container_apps_subnet_prefix`, default `10.40.2.0/23`) and three image digests. Reach the UI through private DNS or a jump host.

## Uncertainty

A Microsoft-hosted Automation job may be unable to write a storage account whose public network access is disabled, because that sandbox is not in the customer VNet. The storage account stays private. If collection cannot write the handoff container, add a hybrid runbook worker in this VNet. Do not turn public network access back on.

Image signature verification is a customer registry policy. This root pins digests and does not implement a signing service.

The analysis sandbox under `infra/terraform-analysis-sandbox/` is a disposable diagram footprint, not this install.
