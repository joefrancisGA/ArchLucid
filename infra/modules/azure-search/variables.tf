variable "location" {
  type        = string
  description = "Azure region for Azure AI Search (default US East)."
  default     = "eastus"
}

variable "resource_group_name" {
  type        = string
  description = "Existing resource group name."
}

variable "service_name" {
  type        = string
  description = "Globally unique search service name."
}

variable "sku" {
  type        = string
  description = "Search SKU (owner default S0 / standard)."
  default     = "standard"
}

variable "tags" {
  type        = map(string)
  description = "Resource tags."
  default     = {}
}