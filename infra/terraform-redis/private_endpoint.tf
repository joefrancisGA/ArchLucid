# TB-094 — optional private endpoint + privatelink.redis.cache.windows.net DNS (TB-091 pattern).

resource "azurerm_private_dns_zone" "redis" {
  count = local.private_endpoint_enabled ? 1 : 0

  name                = "privatelink.redis.cache.windows.net"
  resource_group_name = local.dns_zone_resource_group_name
  tags                = var.tags
}

resource "azurerm_private_dns_zone_virtual_network_link" "redis" {
  count = local.private_endpoint_enabled && length(trimspace(var.virtual_network_id)) > 0 ? 1 : 0

  name                  = "${var.redis_cache_name}-redis-dns-link"
  resource_group_name   = local.dns_zone_resource_group_name
  private_dns_zone_name = azurerm_private_dns_zone.redis[0].name
  virtual_network_id    = trimspace(var.virtual_network_id)
  tags                  = var.tags
}

resource "azurerm_private_endpoint" "redis" {
  count = local.private_endpoint_enabled ? 1 : 0

  name                = "${var.redis_cache_name}-pe"
  location            = local.azure_location
  resource_group_name = local.resource_group_name
  subnet_id           = trimspace(var.private_endpoint_subnet_id)
  tags                = var.tags

  private_service_connection {
    name                           = "redis-psc"
    private_connection_resource_id = azurerm_redis_cache.hot_path[0].id
    subresource_names              = ["redisCache"]
    is_manual_connection           = false
  }

  private_dns_zone_group {
    name                 = "redis-dns"
    private_dns_zone_ids = [azurerm_private_dns_zone.redis[0].id]
  }
}
