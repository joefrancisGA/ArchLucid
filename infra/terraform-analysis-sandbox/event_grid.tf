resource "azurerm_eventgrid_topic" "integration" {
  count = var.enable_event_grid ? 1 : 0

  name                = "eg-${var.name_prefix}-${local.suffix}"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  tags                = local.merged_tags
}

resource "azurerm_eventgrid_event_subscription" "archive_to_storage" {
  count = var.enable_event_grid ? 1 : 0

  name  = "es-archive-to-storage"
  scope = azurerm_eventgrid_topic.integration[0].id

  included_event_types = [
    "com.archlucid.analysis.sandbox.v1",
  ]

  storage_queue_endpoint {
    storage_account_id = azurerm_storage_account.artifacts.id
    queue_name         = azurerm_storage_queue.background_jobs.name
  }
}
