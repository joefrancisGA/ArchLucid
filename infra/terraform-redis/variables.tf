variable "enable_redis_cache" {
  type        = bool
  description = "When true, create Azure Cache for Redis for HotPathCache (StackExchange.Redis)."
  default     = false
}

variable "create_resource_group" {
  type        = bool
  description = "When true and enable_redis_cache is true, create the resource group."
  default     = false
}

variable "resource_group_name" {
  type        = string
  description = "Resource group for the Redis cache."
  default     = ""
}

variable "location" {
  type        = string
  description = "Azure region (required when create_resource_group = true)."
  default     = ""
}

variable "redis_cache_name" {
  type        = string
  description = "Globally unique Redis cache name (alphanumeric, 1-63 chars)."
  default     = ""
}

variable "redis_sku_name" {
  type        = string
  description = "Standard (staging C1) or Premium (production P1 with persistence options)."
  default     = "Standard"

  validation {
    condition     = contains(["Basic", "Standard", "Premium"], var.redis_sku_name)
    error_message = "redis_sku_name must be Basic, Standard, or Premium."
  }
}

variable "redis_family" {
  type        = string
  description = "SKU family: C for Standard (C1 staging, C3 production), P for Premium."
  default     = "C"

  validation {
    condition     = contains(["C", "P"], var.redis_family)
    error_message = "redis_family must be C or P."
  }
}

variable "redis_capacity" {
  type        = number
  description = "Cache size: 0-6 for C family (1=C1 staging), 1-5 for P family."
  default     = 1
}

variable "maxmemory_policy" {
  type        = string
  description = "Redis maxmemory eviction policy."
  default     = "allkeys-lru"
}

variable "public_network_access_enabled" {
  type        = bool
  description = "Set false when access is only via private endpoint."
  default     = true
}

variable "enable_private_endpoint" {
  type        = bool
  description = "When true, create privatelink.redis.cache.windows.net private endpoint (requires private_endpoint_subnet_id)."
  default     = false
}

variable "private_endpoint_subnet_id" {
  type        = string
  description = "Subnet id for the Redis private endpoint."
  default     = ""
}

variable "private_dns_zone_resource_group_name" {
  type        = string
  description = "Resource group for privatelink.redis.cache.windows.net DNS zone (defaults to cache resource group)."
  default     = ""
}

variable "virtual_network_id" {
  type        = string
  description = "VNet id to link the Redis private DNS zone (required when enable_private_endpoint is true)."
  default     = ""
}

variable "log_analytics_workspace_id" {
  type        = string
  description = "Log Analytics workspace id for diagnostic settings."
  default     = ""
}

variable "key_vault_id" {
  type        = string
  description = "Optional Key Vault id to store primary_connection_string for HotPathCache."
  default     = ""
}

variable "key_vault_secret_name" {
  type        = string
  description = "Secret name when key_vault_id is set (default archlucid-hotpath-redis-connection-string)."
  default     = "archlucid-hotpath-redis-connection-string"
}

variable "tags" {
  type        = map(string)
  default     = {}
  description = "Tags applied to created resources."
}
