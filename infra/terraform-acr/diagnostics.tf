resource "azurerm_monitor_diagnostic_setting" "acr" {
  count = local.enabled && length(trimspace(var.log_analytics_workspace_id)) > 0 ? 1 : 0

  name                       = "archlucid-acr-diagnostics"
  target_resource_id         = azurerm_container_registry.archlucid[0].id
  log_analytics_workspace_id = trimspace(var.log_analytics_workspace_id)

  enabled_log {
    category_group = "allLogs"
  }

  enabled_metric {
    category = "AllMetrics"
  }
}
