resource "azurerm_private_dns_zone" "acr" {
  count = local.private_endpoint_enabled ? 1 : 0

  name                = "privatelink.azurecr.io"
  resource_group_name = local.dns_zone_resource_group_name
  tags                = var.tags
}

resource "azurerm_private_dns_zone_virtual_network_link" "acr" {
  count = local.private_endpoint_enabled && length(trimspace(var.virtual_network_id)) > 0 ? 1 : 0

  name                  = "${var.acr_name}-acr-dns-link"
  resource_group_name   = local.dns_zone_resource_group_name
  private_dns_zone_name = azurerm_private_dns_zone.acr[0].name
  virtual_network_id    = trimspace(var.virtual_network_id)
  tags                  = var.tags
}

resource "azurerm_private_endpoint" "acr" {
  count = local.private_endpoint_enabled ? 1 : 0

  name                = "${var.acr_name}-pe"
  location            = local.azure_location
  resource_group_name = local.resource_group_name
  subnet_id           = trimspace(var.private_endpoint_subnet_id)
  tags                = var.tags

  private_service_connection {
    name                           = "acr-psc"
    private_connection_resource_id = azurerm_container_registry.archlucid[0].id
    subresource_names              = ["registry"]
    is_manual_connection           = false
  }

  private_dns_zone_group {
    name                 = "acr-dns"
    private_dns_zone_ids = [azurerm_private_dns_zone.acr[0].id]
  }
}
