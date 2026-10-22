resource "azurerm_monitor_diagnostic_setting" "custdata_blob" {
  name                       = "blob-read-logging"
  target_resource_id         = "${azurerm_storage_account.custdata.id}/blobServices/default"
  log_analytics_workspace_id = azurerm_log_analytics_workspace.lab.id

  enabled_log {
    category = "StorageRead"
  }
}
