resource "azurerm_private_endpoint" "openai" {
  count = var.openai_compose_mode == "create" && var.enable_private_endpoints ? 1 : 0

  name                = "${var.openai_account_name}-pe"
  location            = var.location
  resource_group_name = azurerm_resource_group.prod.name
  subnet_id           = var.private_endpoint_subnet_id
  tags                = var.tags

  private_service_connection {
    name                           = "openai-psc"
    private_connection_resource_id = azurerm_cognitive_account.openai[0].id
    subresource_names              = ["account"]
    is_manual_connection           = false
  }
}

resource "azurerm_private_endpoint" "search" {
  count = var.enable_private_endpoints && length(local.search_service_id_effective) > 0 ? 1 : 0

  name                = "${coalesce(var.search_service_name, "search")}-pe"
  location            = var.location
  resource_group_name = azurerm_resource_group.prod.name
  subnet_id           = var.private_endpoint_subnet_id
  tags                = var.tags

  private_service_connection {
    name                           = "search-psc"
    private_connection_resource_id = local.search_service_id_effective
    subresource_names              = ["searchService"]
    is_manual_connection           = false
  }
}
