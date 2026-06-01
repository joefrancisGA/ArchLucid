variable "enable_acr" {
  type        = bool
  description = "When true, create Azure Container Registry for ArchLucid images."
  default     = false
}

variable "create_resource_group" {
  type    = bool
  default = false
}

variable "resource_group_name" {
  type        = string
  default     = ""
}

variable "location" {
  type        = string
  default     = ""
}

variable "acr_name" {
  type        = string
  description = "Globally unique ACR name (alphanumeric, 5-50 chars)."
  default     = ""
}

variable "acr_sku" {
  type        = string
  description = "Basic | Standard | Premium (Premium required for geo-replication and private endpoint)."
  default     = "Premium"
}

variable "admin_enabled" {
  type        = bool
  description = "Must remain false for production-like stacks."
  default     = false
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

variable "enable_geo_replication" {
  type        = bool
  default     = false
}

variable "geo_replication_location" {
  type        = string
  default     = ""
}

variable "log_analytics_workspace_id" {
  type        = string
  default     = ""
}

variable "tags" {
  type    = map(string)
  default = {}
}
