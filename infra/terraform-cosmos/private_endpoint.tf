resource "azurerm_private_dns_zone" "cosmos" {
  count = local.private_endpoint_enabled ? 1 : 0

  name                = "privatelink.documents.azure.com"
  resource_group_name = local.dns_zone_resource_group_name
  tags                = var.tags
}

resource "azurerm_private_dns_zone_virtual_network_link" "cosmos" {
  count = local.private_endpoint_enabled && length(trimspace(var.virtual_network_id)) > 0 ? 1 : 0

  name                  = "${var.cosmos_account_name}-cosmos-dns-link"
  resource_group_name   = local.dns_zone_resource_group_name
  private_dns_zone_name = azurerm_private_dns_zone.cosmos[0].name
  virtual_network_id    = trimspace(var.virtual_network_id)
  tags                  = var.tags
}

resource "azurerm_private_endpoint" "cosmos" {
  count = local.private_endpoint_enabled ? 1 : 0

  name                = "${var.cosmos_account_name}-pe"
  location            = local.azure_location
  resource_group_name = local.resource_group_name
  subnet_id           = trimspace(var.private_endpoint_subnet_id)
  tags                = var.tags

  private_service_connection {
    name                           = "cosmos-psc"
    private_connection_resource_id = azurerm_cosmosdb_account.polyglot[0].id
    subresource_names              = ["Sql"]
    is_manual_connection           = false
  }

  private_dns_zone_group {
    name                 = "cosmos-dns"
    private_dns_zone_ids = [azurerm_private_dns_zone.cosmos[0].id]
  }
}
