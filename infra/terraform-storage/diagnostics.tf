resource "azurerm_monitor_diagnostic_setting" "artifacts" {
  count = local.enabled && var.enable_storage_diagnostics && length(trimspace(var.log_analytics_workspace_id)) > 0 ? 1 : 0

  name                       = "archlucid-artifact-storage-diagnostics"
  target_resource_id         = azurerm_storage_account.artifacts[0].id
  log_analytics_workspace_id = trimspace(var.log_analytics_workspace_id)

  enabled_log {
    category = "StorageRead"
  }

  enabled_log {
    category = "StorageWrite"
  }

  enabled_log {
    category = "StorageDelete"
  }

  enabled_metric {
    category = "Transaction"
  }
}
