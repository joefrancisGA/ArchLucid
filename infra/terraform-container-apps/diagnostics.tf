# TB-099 — Container App diagnostics (console + system logs + per-app metrics).
#
# ContainerAppConsoleLogs / ContainerAppSystemLogs are only valid diagnostic categories on the
# Microsoft.App/managedEnvironments resource (verified via `az monitor diagnostic-settings categories list`);
# Microsoft.App/containerApps only supports AllMetrics. A single environment-level setting captures console +
# system logs for every app in the environment (filterable by ContainerAppName_s / ContainerAppName in queries).

resource "azurerm_monitor_diagnostic_setting" "container_apps_environment" {
  count = var.enable_container_app_diagnostics && local.enabled ? 1 : 0

  name                       = "archlucid-cae-logs"
  target_resource_id         = azurerm_container_app_environment.main[0].id
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

locals {
  container_app_metric_resource_ids = var.enable_container_app_diagnostics && local.enabled ? merge(
    {
      api    = azurerm_container_app.api[0].id
      worker = azurerm_container_app.worker[0].id
      ui     = azurerm_container_app.ui[0].id
    },
    var.enable_marketing_ui_container_app ? {
      ui_marketing = azurerm_container_app.ui_marketing[0].id
    } : {}
  ) : {}
}

resource "azurerm_monitor_diagnostic_setting" "container_apps" {
  for_each = local.container_app_metric_resource_ids

  name                       = "archlucid-ca-${each.key}"
  target_resource_id         = each.value
  log_analytics_workspace_id = azurerm_log_analytics_workspace.container_apps[0].id

  enabled_metric {
    category = "AllMetrics"
  }
}
