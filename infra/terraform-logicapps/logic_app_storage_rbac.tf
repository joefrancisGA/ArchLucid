# TB-100 — Logic App Standard hosting storage RBAC (managed identity path).

resource "azurerm_role_assignment" "logic_edge_storage_blob_owner" {
  count = var.enable_logic_apps && var.logic_app_storage_use_managed_identity ? 1 : 0

  scope                = azurerm_storage_account.logic[0].id
  role_definition_name = "Storage Blob Data Owner"
  principal_id         = azurerm_logic_app_standard.edge[0].identity[0].principal_id
}

resource "azurerm_role_assignment" "logic_edge_storage_file_contributor" {
  count = var.enable_logic_apps && var.logic_app_storage_use_managed_identity ? 1 : 0

  scope                = azurerm_storage_account.logic[0].id
  role_definition_name = "Storage File Data SMB Share Contributor"
  principal_id         = azurerm_logic_app_standard.edge[0].identity[0].principal_id
}

resource "azurerm_role_assignment" "logic_governance_storage_blob_owner" {
  count = var.enable_governance_approval_logic_app && var.logic_app_storage_use_managed_identity ? 1 : 0

  scope                = azurerm_storage_account.logic_governance[0].id
  role_definition_name = "Storage Blob Data Owner"
  principal_id         = azurerm_logic_app_standard.governance_approval[0].identity[0].principal_id
}

resource "azurerm_role_assignment" "logic_governance_storage_file_contributor" {
  count = var.enable_governance_approval_logic_app && var.logic_app_storage_use_managed_identity ? 1 : 0

  scope                = azurerm_storage_account.logic_governance[0].id
  role_definition_name = "Storage File Data SMB Share Contributor"
  principal_id         = azurerm_logic_app_standard.governance_approval[0].identity[0].principal_id
}

resource "azurerm_role_assignment" "logic_marketplace_storage_blob_owner" {
  count = var.enable_marketplace_fulfillment_logic_app && var.logic_app_storage_use_managed_identity ? 1 : 0

  scope                = azurerm_storage_account.logic_marketplace_fulfillment[0].id
  role_definition_name = "Storage Blob Data Owner"
  principal_id         = azurerm_logic_app_standard.marketplace_fulfillment[0].identity[0].principal_id
}

resource "azurerm_role_assignment" "logic_marketplace_storage_file_contributor" {
  count = var.enable_marketplace_fulfillment_logic_app && var.logic_app_storage_use_managed_identity ? 1 : 0

  scope                = azurerm_storage_account.logic_marketplace_fulfillment[0].id
  role_definition_name = "Storage File Data SMB Share Contributor"
  principal_id         = azurerm_logic_app_standard.marketplace_fulfillment[0].identity[0].principal_id
}

resource "azurerm_role_assignment" "logic_trial_storage_blob_owner" {
  count = var.enable_trial_lifecycle_logic_app && var.logic_app_storage_use_managed_identity ? 1 : 0

  scope                = azurerm_storage_account.logic_trial_lifecycle[0].id
  role_definition_name = "Storage Blob Data Owner"
  principal_id         = azurerm_logic_app_standard.trial_lifecycle[0].identity[0].principal_id
}

resource "azurerm_role_assignment" "logic_trial_storage_file_contributor" {
  count = var.enable_trial_lifecycle_logic_app && var.logic_app_storage_use_managed_identity ? 1 : 0

  scope                = azurerm_storage_account.logic_trial_lifecycle[0].id
  role_definition_name = "Storage File Data SMB Share Contributor"
  principal_id         = azurerm_logic_app_standard.trial_lifecycle[0].identity[0].principal_id
}

resource "azurerm_role_assignment" "logic_incident_storage_blob_owner" {
  count = var.enable_incident_chatops_logic_app && var.logic_app_storage_use_managed_identity ? 1 : 0

  scope                = azurerm_storage_account.logic_incident_chatops[0].id
  role_definition_name = "Storage Blob Data Owner"
  principal_id         = azurerm_logic_app_standard.incident_chatops[0].identity[0].principal_id
}

resource "azurerm_role_assignment" "logic_incident_storage_file_contributor" {
  count = var.enable_incident_chatops_logic_app && var.logic_app_storage_use_managed_identity ? 1 : 0

  scope                = azurerm_storage_account.logic_incident_chatops[0].id
  role_definition_name = "Storage File Data SMB Share Contributor"
  principal_id         = azurerm_logic_app_standard.incident_chatops[0].identity[0].principal_id
}

resource "azurerm_role_assignment" "logic_promotion_storage_blob_owner" {
  count = var.enable_promotion_customer_notify_logic_app && var.logic_app_storage_use_managed_identity ? 1 : 0

  scope                = azurerm_storage_account.logic_promotion_customer_notify[0].id
  role_definition_name = "Storage Blob Data Owner"
  principal_id         = azurerm_logic_app_standard.promotion_customer_notify[0].identity[0].principal_id
}

resource "azurerm_role_assignment" "logic_promotion_storage_file_contributor" {
  count = var.enable_promotion_customer_notify_logic_app && var.logic_app_storage_use_managed_identity ? 1 : 0

  scope                = azurerm_storage_account.logic_promotion_customer_notify[0].id
  role_definition_name = "Storage File Data SMB Share Contributor"
  principal_id         = azurerm_logic_app_standard.promotion_customer_notify[0].identity[0].principal_id
}

resource "azurerm_role_assignment" "logic_teams_storage_blob_owner" {
  count = var.enable_teams_notifications_logic_app && var.logic_app_storage_use_managed_identity ? 1 : 0

  scope                = azurerm_storage_account.logic_teams_notifications[0].id
  role_definition_name = "Storage Blob Data Owner"
  principal_id         = azurerm_logic_app_standard.teams_notifications[0].identity[0].principal_id
}

resource "azurerm_role_assignment" "logic_teams_storage_file_contributor" {
  count = var.enable_teams_notifications_logic_app && var.logic_app_storage_use_managed_identity ? 1 : 0

  scope                = azurerm_storage_account.logic_teams_notifications[0].id
  role_definition_name = "Storage File Data SMB Share Contributor"
  principal_id         = azurerm_logic_app_standard.teams_notifications[0].identity[0].principal_id
}


