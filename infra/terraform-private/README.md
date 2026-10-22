# Private endpoints (SQL + Blob + optional Azure AI Search)

Optional Terraform root for **private data-plane** connectivity: VNet, **private DNS** zones, and **private endpoints** for **Azure SQL** and **Blob storage**, plus **optional** endpoints for **Key Vault** (`key_vault_id`, `privatelink.vaultcore.azure.net`) and **Azure AI Search** (`search_service_id`). Optionally wires **regional VNet integration** for a **Linux Web App** (`linux_web_app_id` + `web_app_vnet_integration_subnet_id`) so the API resolves private DNS inside the VNet. Defaults **`enable_private_data_plane = false`**.

## Why customers care

- Traffic to SQL and blob storage stays on the **Microsoft backbone** instead of the public internet.
- Aligns with **deny-by-default** and **private endpoint** expectations in regulated environments.

## What you must do after apply

1. **Integrate compute** (Container Apps, AKS) with this VNet (**VNet integration** or subnet injection) so workloads resolve private DNS for `*.database.windows.net` and `*.blob.core.windows.net`.
2. Update **`ConnectionStrings:ArchLucid`** to use the **same server FQDN**; with private DNS linked to the VNet, names resolve to private IPs inside the VNet.

**TB-903:** When `enable_private_data_plane = true`, Terraform now sets **`publicNetworkAccess = Disabled`** on the SQL server, storage account, and Key Vault (when their resource IDs are set) via `azapi_update_resource` after the private endpoints are created. You no longer need a manual portal flip for those targets.

## Variables

See `variables.tf` and `terraform.tfvars.example`.

## SMB / port 445

This module does **not** expose SMB. Blob access from the API should use **HTTPS** to `*.blob.core.windows.net`, which resolves privately when the private DNS zone is linked.
## TB-101 � legacy App Service VNet integration

`linux_web_app_id` and `web_app_vnet_integration_subnet_id` are **optional**. Production-like pilots use **Azure Container Apps** (infra/terraform-container-apps). The swift connection in `app_service.tf` is created only when both variables are non-empty; leave them empty when no legacy Linux Web App exists.
