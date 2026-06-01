check "redis_cache_name_length" {
  assert {
    condition     = !var.enable_redis_cache || (length(var.redis_cache_name) >= 1 && length(var.redis_cache_name) <= 63)
    error_message = "redis_cache_name must be 1-63 characters when enable_redis_cache is true."
  }
}

check "resource_group_when_enabled" {
  assert {
    condition     = !var.enable_redis_cache || length(trimspace(var.resource_group_name)) > 0
    error_message = "resource_group_name is required when enable_redis_cache is true."
  }
}

check "location_when_creating_rg" {
  assert {
    condition     = !var.enable_redis_cache || !var.create_resource_group || length(trimspace(var.location)) > 0
    error_message = "location is required when create_resource_group is true."
  }
}

check "private_endpoint_subnet_when_enabled" {
  assert {
    condition     = !var.enable_private_endpoint || length(trimspace(var.private_endpoint_subnet_id)) > 0
    error_message = "private_endpoint_subnet_id is required when enable_private_endpoint is true."
  }
}

check "private_endpoint_vnet_link" {
  assert {
    condition     = !local.private_endpoint_enabled || length(trimspace(var.virtual_network_id)) > 0
    error_message = "virtual_network_id is required when enable_private_endpoint is true (private DNS zone link)."
  }
}
