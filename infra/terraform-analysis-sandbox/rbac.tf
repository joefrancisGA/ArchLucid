locals {
  compute_principal_ids = [
    azurerm_container_app.api.identity[0].principal_id,
    azurerm_container_app.worker.identity[0].principal_id,
  ]

  sql_database_ids = [
    azurerm_mssql_database.app.id,
    azurerm_mssql_database.dev.id,
    azurerm_mssql_database.tenant.id,
  ]
}

resource "azurerm_role_assignment" "api_worker_blob_data_contributor" {
  for_each = toset(local.compute_principal_ids)

  scope                = azurerm_storage_account.artifacts.id
  role_definition_name = "Storage Blob Data Contributor"
  principal_id         = each.value
}

resource "azurerm_role_assignment" "api_queue_sender" {
  scope                = azurerm_storage_account.artifacts.id
  role_definition_name = "Storage Queue Data Message Sender"
  principal_id         = azurerm_container_app.api.identity[0].principal_id
}

resource "azurerm_role_assignment" "worker_queue_processor" {
  scope                = azurerm_storage_account.artifacts.id
  role_definition_name = "Storage Queue Data Message Processor"
  principal_id         = azurerm_container_app.worker.identity[0].principal_id
}

resource "azurerm_role_assignment" "api_worker_keyvault_secrets_user" {
  for_each = toset(local.compute_principal_ids)

  scope                = azurerm_key_vault.main.id
  role_definition_name = "Key Vault Secrets User"
  principal_id         = each.value
}

resource "azurerm_role_assignment" "api_worker_sql_db_contributor" {
  for_each = {
    for pair in setproduct(local.compute_principal_ids, local.sql_database_ids) :
    "${pair[0]}:${pair[1]}" => {
      principal_id = pair[0]
      database_id  = pair[1]
    }
  }

  scope                = each.value.database_id
  role_definition_name = "SQL DB Contributor"
  principal_id         = each.value.principal_id
}

resource "azurerm_role_assignment" "api_servicebus_sender" {
  count = var.enable_service_bus ? 1 : 0

  scope                = azurerm_servicebus_namespace.integration[0].id
  role_definition_name = "Azure Service Bus Data Sender"
  principal_id         = azurerm_container_app.api.identity[0].principal_id
}

resource "azurerm_role_assignment" "worker_servicebus_receiver" {
  count = var.enable_service_bus ? 1 : 0

  scope                = azurerm_servicebus_namespace.integration[0].id
  role_definition_name = "Azure Service Bus Data Receiver"
  principal_id         = azurerm_container_app.worker.identity[0].principal_id
}
