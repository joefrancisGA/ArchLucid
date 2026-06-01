# TB-099 — Container App diagnostics (console + system logs).

locals {
  container_app_diagnostic_resource_ids = var.enable_container_app_diagnostics && local.enabled ? {
    api    = azurerm_container_app.api[0].id
    worker = azurerm_container_app.worker[0].id
    ui     = azurerm_container_app.ui[0].id
  } : {}
}

resource "azurerm_monitor_diagnostic_setting" "container_apps" {
  for_each = local.container_app_diagnostic_resource_ids

  name                       = "archlucid-ca-${each.key}"
  target_resource_id         = each.value
  log_analytics_workspace_id = azurerm_log_analytics_workspace.container_apps[0].id

  enabled_log {
    category = "ContainerAppConsoleLogs"
  }

  enabled_log {
    category = "ContainerAppSystemLogs"
  }

  enabled_metric {
    category = "AllMetrics"
  }
}
