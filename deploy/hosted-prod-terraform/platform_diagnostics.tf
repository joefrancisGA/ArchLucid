# Platform diagnostic settings for externally composed resources (TB-099).
resource "azurerm_monitor_diagnostic_setting" "container_apps" {
  for_each = var.log_analytics_workspace_id != null ? toset(var.container_app_resource_ids) : toset([])

  name                       = "archlucid-ca-${substr(md5(each.value), 0, 8)}"
  target_resource_id         = each.value
  log_analytics_workspace_id = var.log_analytics_workspace_id

  enabled_log {
    category = "ContainerAppConsoleLogs"
  }

  enabled_log {
    category = "ContainerAppSystemLogs"
  }

  metric {
    category = "AllMetrics"
    enabled  = true
  }
}

resource "azurerm_monitor_diagnostic_setting" "artifact_storage" {
  count = var.log_analytics_workspace_id != null && var.artifact_storage_account_id != null ? 1 : 0

  name                       = "archlucid-artifact-storage-diagnostics"
  target_resource_id         = var.artifact_storage_account_id
  log_analytics_workspace_id = var.log_analytics_workspace_id

  enabled_log {
    category = "StorageRead"
  }

  enabled_log {
    category = "StorageWrite"
  }

  enabled_log {
    category = "StorageDelete"
  }

  metric {
    category = "Transaction"
    enabled  = true
  }
}

resource "azurerm_monitor_diagnostic_setting" "servicebus" {
  count = var.log_analytics_workspace_id != null && var.servicebus_namespace_id != null ? 1 : 0

  name                       = "archlucid-servicebus-diagnostics"
  target_resource_id         = var.servicebus_namespace_id
  log_analytics_workspace_id = var.log_analytics_workspace_id

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