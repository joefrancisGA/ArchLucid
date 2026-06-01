variable "enable_cosmos_account" {
  type        = bool
  description = "When true, create Azure Cosmos DB (SQL API) for optional polyglot persistence. Production-like pilots default false (SQL path)."
  default     = false
}

variable "create_resource_group" {
  type    = bool
  default = false
}

variable "resource_group_name" {
  type        = string
  description = "Resource group for Cosmos DB."
  default     = ""
}

variable "location" {
  type        = string
  default     = ""
}

variable "cosmos_account_name" {
  type        = string
  description = "Globally unique Cosmos account name (lowercase, 3-44 chars)."
  default     = ""
}

variable "cosmos_offer_type" {
  type        = string
  description = "Standard or Serverless."
  default     = "Standard"
}

variable "cosmos_consistency_level" {
  type        = string
  description = "Minimum Session per TB-095."
  default     = "Session"
}

variable "cosmos_enable_free_tier" {
  type        = bool
  default     = false
}

variable "cosmos_enable_automatic_failover" {
  type        = bool
  default     = false
}

variable "cosmos_geo_locations" {
  type = list(object({
    location          = string
    failover_priority = number
    zone_redundant    = optional(bool, false)
  }))
  description = "Geo-replication locations; empty uses single region from location."
  default     = []
}

variable "cosmos_database_name" {
  type        = string
  default     = "ArchLucid"
}

variable "cosmos_sql_container_throughput" {
  type        = number
  description = "Manual RU/s per SQL container when offer is Standard."
  default     = 400
}

variable "cosmos_enable_continuous_backup" {
  type        = bool
  default     = true
}

variable "public_network_access_enabled" {
  type        = bool
  default     = true
}

variable "enable_private_endpoint" {
  type        = bool
  default     = false
}

variable "private_endpoint_subnet_id" {
  type        = string
  default     = ""
}

variable "virtual_network_id" {
  type        = string
  default     = ""
}

variable "private_dns_zone_resource_group_name" {
  type        = string
  default     = ""
}

variable "log_analytics_workspace_id" {
  type        = string
  default     = ""
}

variable "key_vault_id" {
  type        = string
  default     = ""
}

variable "key_vault_secret_name" {
  type        = string
  default     = "archlucid-cosmos-connection-string"
}

variable "tags" {
  type    = map(string)
  default = {}
}
