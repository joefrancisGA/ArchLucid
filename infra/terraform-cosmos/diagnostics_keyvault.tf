resource "azurerm_monitor_diagnostic_setting" "cosmos" {
  count = local.enabled && length(trimspace(var.log_analytics_workspace_id)) > 0 ? 1 : 0

  name                       = "archlucid-cosmos-diagnostics"
  target_resource_id         = azurerm_cosmosdb_account.polyglot[0].id
  log_analytics_workspace_id = trimspace(var.log_analytics_workspace_id)

  enabled_metric {
    category = "AllMetrics"
  }
}

resource "azurerm_key_vault_secret" "cosmos_connection_string" {
  count = local.cosmos_write_connection_string_secret ? 1 : 0

  name            = trimspace(var.key_vault_secret_name)
  value           = azurerm_cosmosdb_account.polyglot[0].primary_sql_connection_string
  key_vault_id    = trimspace(var.key_vault_id)
  expiration_date = timeadd(timestamp(), "${var.managed_key_vault_secret_ttl_days * 24}h")
}
