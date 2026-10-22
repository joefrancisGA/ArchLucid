resource "azurerm_monitor_diagnostic_setting" "namespace" {
  count = var.enable_servicebus_diagnostics && length(trimspace(var.log_analytics_workspace_id)) > 0 ? 1 : 0

  name                       = "archlucid-servicebus-diagnostics"
  target_resource_id         = azurerm_servicebus_namespace.integration.id
  log_analytics_workspace_id = trimspace(var.log_analytics_workspace_id)

  enabled_log {
    category = "OperationalLogs"
  }

  enabled_log {
    category = "DiagnosticErrorLogs"
  }

  metric {
    category = "AllMetrics"
    enabled  = true
  }
}
