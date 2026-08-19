locals {
  cosmos_managed_identity_data_plane         = local.enabled && length(var.cosmos_data_plane_workload_principal_ids) > 0
  cosmos_write_connection_string_secret      = local.enabled && length(trimspace(var.key_vault_id)) > 0 && var.write_connection_string_to_key_vault && !local.cosmos_managed_identity_data_plane
}

resource "azurerm_cosmosdb_sql_role_assignment" "workload_data_contributor" {
  for_each = local.cosmos_managed_identity_data_plane ? toset(var.cosmos_data_plane_workload_principal_ids) : toset([])

  resource_group_name = local.resource_group_name
  account_name        = azurerm_cosmosdb_account.polyglot[0].name
  role_definition_id  = "${azurerm_cosmosdb_account.polyglot[0].id}/sqlRoleDefinitions/00000000-0000-0000-0000-000000000002"
  principal_id        = each.value
  scope               = azurerm_cosmosdb_account.polyglot[0].id
}
