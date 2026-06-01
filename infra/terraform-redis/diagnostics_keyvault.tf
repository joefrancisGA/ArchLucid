resource "azurerm_monitor_diagnostic_setting" "redis" {
  count = local.enabled && length(trimspace(var.log_analytics_workspace_id)) > 0 ? 1 : 0

  name                       = "archlucid-redis-diagnostics"
  target_resource_id         = azurerm_redis_cache.hot_path[0].id
  log_analytics_workspace_id = trimspace(var.log_analytics_workspace_id)

  enabled_metric {
    category = "AllMetrics"
  }
}

resource "azurerm_key_vault_secret" "hot_path_redis_connection_string" {
  count = local.enabled && length(trimspace(var.key_vault_id)) > 0 ? 1 : 0

  name         = local.key_vault_secret_name_effective
  value        = azurerm_redis_cache.hot_path[0].primary_connection_string
  key_vault_id = trimspace(var.key_vault_id)
}
