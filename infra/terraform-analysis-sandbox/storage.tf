resource "azurerm_storage_account" "artifacts" {
  name                     = local.storage_account_name
  resource_group_name      = azurerm_resource_group.main.name
  location                 = azurerm_resource_group.main.location
  account_tier             = "Standard"
  account_kind             = "StorageV2"
  account_replication_type = "LRS"
  min_tls_version          = "TLS1_2"

  tags = local.merged_tags
}

resource "azurerm_storage_container" "artifact_bundles" {
  name                  = "artifact-bundles"
  storage_account_id    = azurerm_storage_account.artifacts.id
  container_access_type = "private"
}

resource "azurerm_storage_container" "golden_manifests" {
  name                  = "golden-manifests"
  storage_account_id    = azurerm_storage_account.artifacts.id
  container_access_type = "private"
}

resource "azurerm_storage_queue" "background_jobs" {
  name                 = "background-jobs"
  storage_account_name = azurerm_storage_account.artifacts.name
}

resource "azurerm_key_vault_secret" "storage_connection_string" {
  name         = "storage-connection-string"
  value        = azurerm_storage_account.artifacts.primary_connection_string
  key_vault_id = azurerm_key_vault.main.id

  depends_on = [azurerm_role_assignment.deployer_secrets_officer]
}

resource "azurerm_key_vault_secret" "sql_app_connection_string" {
  name         = "sql-app-connection-string"
  value        = local.sql_connection_string_app
  key_vault_id = azurerm_key_vault.main.id

  depends_on = [azurerm_role_assignment.deployer_secrets_officer]
}
