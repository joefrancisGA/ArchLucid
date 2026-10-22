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
  # Module default standard for create-mode labs. Hosted prod tfvars often override to "basic"
  # (see infra/terraform/prod/variables.tf + docs/library/AI_SEARCH_SKU_GUIDANCE.md).
  # HNSW knobs live on the Search index JSON, not this service SKU.
  description = "Azure AI Search SKU (basic|standard|…). Prod cost default is often basic; raise to standard under load."
  default     = "standard"
}

variable "tags" {
  type        = map(string)
  description = "Resource tags."
  default     = {}
}