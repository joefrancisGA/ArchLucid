# TDE with customer-managed Key Vault key (Improvement #49).

data "azurerm_client_config" "tde" {
  count = var.enable_sql_tde_cmk ? 1 : 0
}

data "azurerm_key_vault" "sql_tde" {
  count = var.enable_sql_tde_cmk ? 1 : 0

  name                = var.key_vault_name
  resource_group_name = var.key_vault_resource_group_name
}

resource "azurerm_key_vault_key" "sql_tde" {
  count = var.enable_sql_tde_cmk ? 1 : 0

  name         = var.sql_tde_key_name
  key_vault_id = data.azurerm_key_vault.sql_tde[0].id
  key_type     = "RSA"
  key_size     = 2048
  key_opts     = ["decrypt", "encrypt", "sign", "unwrapKey", "verify", "wrapKey"]
}

resource "azurerm_role_assignment" "sql_tde_key" {
  count = var.enable_sql_tde_cmk ? 1 : 0

  scope                = azurerm_key_vault_key.sql_tde[0].id
  role_definition_name = "Key Vault Crypto Service Encryption User"
  principal_id         = azurerm_mssql_server.primary.identity[0].principal_id
}

resource "azurerm_mssql_server_transparent_data_encryption" "primary" {
  count = var.enable_sql_tde_cmk ? 1 : 0

  server_id        = azurerm_mssql_server.primary.id
  key_vault_key_id = azurerm_key_vault_key.sql_tde[0].id
}
