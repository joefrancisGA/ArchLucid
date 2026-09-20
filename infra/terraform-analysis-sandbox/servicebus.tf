resource "azurerm_servicebus_namespace" "integration" {
  count = var.enable_service_bus ? 1 : 0

  name                = "sb-${var.name_prefix}-${local.suffix}"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  sku                 = "Standard"
  tags                = local.merged_tags
}

resource "azurerm_servicebus_topic" "integration_events" {
  count = var.enable_service_bus ? 1 : 0

  name         = "integration-events"
  namespace_id = azurerm_servicebus_namespace.integration[0].id
}

resource "azurerm_servicebus_subscription" "worker" {
  count = var.enable_service_bus ? 1 : 0

  name               = "worker"
  topic_id           = azurerm_servicebus_topic.integration_events[0].id
  max_delivery_count = 10
}
