# TB-903: disable public network access on private-endpoint targets when the data plane is enabled.
# Replaces the manual post-apply step documented in README.md.

resource "azapi_update_resource" "sql_public_network_access" {
  count = local.pe_enabled && length(trimspace(var.sql_server_id)) > 0 ? 1 : 0

  type        = "Microsoft.Sql/servers@2023-08-01-preview"
  resource_id = var.sql_server_id

  body = {
    properties = {
      publicNetworkAccess = "Disabled"
    }
  }

  depends_on = [azurerm_private_endpoint.sql]
}

resource "azapi_update_resource" "storage_public_network_access" {
  count = local.pe_enabled && length(trimspace(var.storage_account_id)) > 0 ? 1 : 0

  type        = "Microsoft.Storage/storageAccounts@2023-01-01"
  resource_id = var.storage_account_id

  body = {
    properties = {
      publicNetworkAccess = "Disabled"
    }
  }

  depends_on = [azurerm_private_endpoint.blob]
}

resource "azapi_update_resource" "key_vault_public_network_access" {
  count = local.pe_enabled && length(trimspace(var.key_vault_id)) > 0 ? 1 : 0

  type        = "Microsoft.KeyVault/vaults@2023-07-01"
  resource_id = var.key_vault_id

  body = {
    properties = {
      publicNetworkAccess = "Disabled"
    }
  }

  depends_on = [azurerm_private_endpoint.key_vault]
}
