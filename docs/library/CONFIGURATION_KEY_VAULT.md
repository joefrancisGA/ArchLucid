> **Scope:** Contributor-reference — Key Vault references for secrets (Azure) - full detail, tables, and links in the sections below.

> **Spine doc:** [`START_HERE.md`](../START_HERE.md).


# Key Vault references for secrets (Azure)

Production and shared environments should **not** store SQL connection strings, OpenAI API keys, or long-lived API keys in `appsettings.*.json` committed to git.

## Pattern

1. Create an Azure Key Vault and store each secret (e.g. `archlucid-sql-connection-string`, `archlucid-azure-openai-api-key`).
2. Grant the API’s managed identity **Get** permission on secrets.
3. In **Azure App Service** → **Configuration** → **Application settings**, set each setting to a [Key Vault reference](https://learn.microsoft.com/azure/app-service/app-service-key-vault-references):

   - `ConnectionStrings__ArchLucid` → `@Microsoft.KeyVault(VaultName=...;SecretName=archlucid-sql-connection-string)`
   - `AzureOpenAI__ApiKey` → `@Microsoft.KeyVault(...)`
   - **`ArchLucid__FallbackLlm__Endpoints__0__ApiKey`** → `@Microsoft.KeyVault(...)` only when the fallback row uses an API key. Hosted Container Apps should set **`ArchLucid__FallbackLlm__Endpoints__0__UseManagedIdentity=true`** instead (no secret). Legacy **`ArchLucid__FallbackLlm__ApiKey`** remains valid for the deprecated flat triple.
   - `Authentication__ApiKey__AdminKey` / `Authentication__ApiKey__ReadOnlyKey` → `@Microsoft.KeyVault(...)` (when `ArchLucidAuth:Mode` is `ApiKey` and API key auth is enabled)

Double underscores (`__`) map to nested JSON sections in ASP.NET Core configuration.

## Local first-real-value (`docker-compose.real-aoai.yml`)

For **`archlucid try --real`** on a developer workstation, the CLI expects **shell environment variables** (`AZURE_OPENAI_*`) and passes them through Docker Compose into the API container as **`AzureOpenAI__*`** settings. Treat these like any other secret: **short-lived keys**, **no** committing `.env` files that contain real keys, and prefer a **user-level** secret store or OS keychain if you automate the flow. Hosted deployments should still use **Key Vault references** (above) rather than long-lived keys on disk.

## Sample file

See `ArchLucid.Api/appsettings.KeyVault.sample.json` for a non-functional template of the same shape (do not commit real vault names if they are sensitive; the file is documentation-only).

## Terraform

Represent the App Service settings as `azurerm_app_service` / `azurerm_linux_web_app` `app_settings` blocks whose values are Key Vault reference strings, and use a `azurerm_key_vault_access_policy` or RBAC for the web app’s system-assigned identity.

When `public_network_access_enabled = false` on the vault, provision **`infra/terraform-private`** Key Vault private endpoint + `privatelink.vaultcore.azure.net` DNS (TB-091). Set `enable_private_data_plane = true` and pass `key_vault_id` before apply. Validate with `terraform -chdir=infra/terraform-private validate` (see [`IAC_RUNTIME_PARITY.md`](IAC_RUNTIME_PARITY.md)).

## Workload RBAC (TB-656 / TB-092)

**TB-656 (default):** `infra/terraform-keyvault` creates **user-assigned** API and Worker identities (`workload_identities.tf`) and grants **`Key Vault Secrets User`** in the **same apply** as the vault. Pass the identity outputs into `terraform-container-apps` (`api_keyvault_user_assigned_identity_id`, `worker_keyvault_user_assigned_identity_id`, and matching `*_client_id` values). `infra/apply-saas.ps1 -MultiRoot -Apply` wires these automatically.

**TB-092 (legacy):** Container Apps API and Worker use **system-assigned** managed identities to resolve `@Microsoft.KeyVault(...)` references at runtime. Grant **`Key Vault Secrets User`** on the vault scope (not **Secrets Officer**):

- **`infra/terraform-keyvault`:** `api_managed_identity_principal_id` and `worker_managed_identity_principal_id` (from `terraform-container-apps` outputs `api_system_assigned_principal_id` / `worker_system_assigned_principal_id`).
- **`infra/terraform-private`:** `key_vault_workload_principal_ids` when assigning RBAC on an existing `key_vault_id` with private data plane enabled.

**Apply order (legacy only):** Key Vault is created before Container Apps in the default multi-root sequence; principal IDs exist only after Container Apps apply. Use **`infra/apply-saas.ps1 -MultiRoot -Apply`** (automated TB-092 second pass when user-assigned identities are disabled) or re-apply `terraform-keyvault` with the principal ID variables from Container Apps outputs. Example tfvars: `infra/terraform-keyvault/terraform.tfvars.example`.
