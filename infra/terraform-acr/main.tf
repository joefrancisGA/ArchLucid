locals {
  enabled = var.enable_acr

  resource_group_name = local.enabled ? (
    var.create_resource_group ? azurerm_resource_group.this[0].name : data.azurerm_resource_group.target[0].name
  ) : ""

  azure_location = local.enabled ? (
    var.create_resource_group ? var.location : data.azurerm_resource_group.target[0].location
  ) : ""

  private_endpoint_enabled = local.enabled && var.enable_private_endpoint && length(trimspace(var.private_endpoint_subnet_id)) > 0

  dns_zone_resource_group_name = length(trimspace(var.private_dns_zone_resource_group_name)) > 0 ? trimspace(var.private_dns_zone_resource_group_name) : local.resource_group_name
}

data "azurerm_resource_group" "target" {
  count = local.enabled && !var.create_resource_group ? 1 : 0
  name  = var.resource_group_name
}

resource "azurerm_resource_group" "this" {
  count    = local.enabled && var.create_resource_group ? 1 : 0
  name     = var.resource_group_name
  location = var.location
  tags     = var.tags
}

resource "azurerm_container_registry" "archlucid" {
  count = local.enabled ? 1 : 0

  name                          = var.acr_name
  resource_group_name           = local.resource_group_name
  location                      = local.azure_location
  sku                           = var.acr_sku
  admin_enabled                 = var.admin_enabled
  public_network_access_enabled = local.private_endpoint_enabled ? false : var.public_network_access_enabled
  tags                          = var.tags
}
