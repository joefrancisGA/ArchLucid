output "redis_cache_id" {
  description = "Resource id for private endpoint / RBAC wiring."
  value       = try(azurerm_redis_cache.hot_path[0].id, null)
}

output "redis_hostname" {
  description = "Redis hostname (SSL port 6380)."
  value       = try(azurerm_redis_cache.hot_path[0].hostname, null)
}

output "redis_primary_connection_string" {
  description = "Primary connection string for HotPathCache:RedisConnectionString (store in Key Vault in production)."
  value       = try(azurerm_redis_cache.hot_path[0].primary_connection_string, null)
  sensitive   = true
}

output "hot_path_cache_key_vault_secret_name" {
  description = "Key Vault secret name when key_vault_id is set."
  value       = length(trimspace(var.key_vault_id)) > 0 && local.enabled ? local.key_vault_secret_name_effective : null
}

output "hot_path_cache_container_app_secret_env" {
  description = "Map of Container App secret name -> connection string for HotPathCache__RedisConnectionString (wire via terraform-container-apps)."
  value = local.enabled ? {
    hot-path-redis-connection = azurerm_redis_cache.hot_path[0].primary_connection_string
  } : {}
  sensitive = true
}

output "redis_private_endpoint_id" {
  description = "Private endpoint id when enable_private_endpoint is true."
  value       = try(azurerm_private_endpoint.redis[0].id, null)
}
