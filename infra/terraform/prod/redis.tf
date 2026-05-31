# Optional Azure Cache for Redis (hot-path cache). Disabled by default per V1_DEFERRED optional services.

resource "azurerm_redis_cache" "hot_path" {
  count = var.enable_redis ? 1 : 0

  name                = var.redis_name
  location            = var.location
  resource_group_name = azurerm_resource_group.prod.name
  capacity            = var.redis_capacity
  family              = var.redis_family
  sku_name            = var.redis_sku_name
  tags                = var.tags
}
