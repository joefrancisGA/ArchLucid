# Reader stays on resource groups. ADR 0103 also allows a subscription scope; this root rejects
# that wider scope because ADR 0104 requires every assignment to be a resource group or narrower.
resource "azurerm_role_assignment" "collector_reader_install" {
  scope                = azurerm_resource_group.this.id
  role_definition_name = "Reader"
  principal_id         = azurerm_user_assigned_identity.collector.principal_id
}

resource "azurerm_role_assignment" "collector_reader_extra" {
  for_each = toset(var.collection_reader_resource_group_ids)

  scope                = each.value
  role_definition_name = "Reader"
  principal_id         = azurerm_user_assigned_identity.collector.principal_id
}

resource "azurerm_role_assignment" "collector_cost_install" {
  count = var.enable_cost_collection ? 1 : 0

  scope                = azurerm_resource_group.this.id
  role_definition_name = "Cost Management Reader"
  principal_id         = azurerm_user_assigned_identity.collector.principal_id
}

resource "azurerm_role_assignment" "collector_cost_extra" {
  for_each = var.enable_cost_collection ? toset(var.collection_reader_resource_group_ids) : toset([])

  scope                = each.value
  role_definition_name = "Cost Management Reader"
  principal_id         = azurerm_user_assigned_identity.collector.principal_id
}

resource "azurerm_role_assignment" "collector_handoff" {
  # resource_manager_id is the ARM id. The data-plane id is not a valid role scope.
  scope                = azurerm_storage_container.handoff.resource_manager_id
  role_definition_name = "Storage Blob Data Contributor"
  principal_id         = azurerm_user_assigned_identity.collector.principal_id
}

resource "azurerm_role_assignment" "api_handoff_reader" {
  scope                = azurerm_storage_container.handoff.resource_manager_id
  role_definition_name = "Storage Blob Data Reader"
  principal_id         = azurerm_user_assigned_identity.api.principal_id
}

resource "azurerm_role_assignment" "api_run_now" {
  scope                = azurerm_automation_account.collector.id
  role_definition_name = "Automation Job Operator"
  principal_id         = azurerm_user_assigned_identity.api.principal_id
}

resource "azurerm_role_assignment" "api_payloads" {
  scope                = azurerm_storage_container.payloads.resource_manager_id
  role_definition_name = "Storage Blob Data Contributor"
  principal_id         = azurerm_user_assigned_identity.api.principal_id
}

resource "azurerm_role_assignment" "worker_payloads" {
  scope                = azurerm_storage_container.payloads.resource_manager_id
  role_definition_name = "Storage Blob Data Contributor"
  principal_id         = azurerm_user_assigned_identity.worker.principal_id
}

resource "azurerm_role_assignment" "api_key_vault" {
  scope                = azurerm_key_vault.app.id
  role_definition_name = "Key Vault Secrets User"
  principal_id         = azurerm_user_assigned_identity.api.principal_id
}

resource "azurerm_role_assignment" "worker_key_vault" {
  scope                = azurerm_key_vault.app.id
  role_definition_name = "Key Vault Secrets User"
  principal_id         = azurerm_user_assigned_identity.worker.principal_id
}
