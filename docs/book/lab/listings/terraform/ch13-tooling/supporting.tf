# Resources main.tf refers to. Section 13.9 says they follow the same pattern; this is the minimum.

resource "azurerm_resource_group" "tooling" {
  name     = var.resource_group_name
  location = var.location
}

resource "azurerm_private_dns_zone" "openai" {
  name                = "privatelink.openai.azure.com"
  resource_group_name = azurerm_resource_group.tooling.name
}

resource "azurerm_private_dns_zone_virtual_network_link" "openai" {
  name                = "openai"
  private_dns_zone_id = azurerm_private_dns_zone.openai.id
  virtual_network_id  = var.private_endpoint_vnet_id
}

resource "azurerm_user_assigned_identity" "explainer" {
  name                = "mi-explainer"
  resource_group_name = azurerm_resource_group.tooling.name
  location            = var.location
}
