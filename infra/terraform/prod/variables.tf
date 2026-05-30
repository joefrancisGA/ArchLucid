variable "resource_group_name" {
  type        = string
  description = "Hosted production resource group name."
}

variable "location" {
  type        = string
  description = "Azure region for the hosted production footprint."
}

variable "tags" {
  type        = map(string)
  description = "Standard resource tags."
  default     = {}
}

variable "openai_compose_mode" {
  type        = string
  description = "create | existing — whether this root creates Azure OpenAI or references BYO."
  default     = "create"

  validation {
    condition     = contains(["create", "existing"], var.openai_compose_mode)
    error_message = "openai_compose_mode must be create or existing."
  }
}

variable "openai_account_name" {
  type        = string
  description = "Azure OpenAI account name when openai_compose_mode = create."
  default     = null
}

variable "openai_custom_subdomain_name" {
  type        = string
  description = "Custom subdomain for Azure OpenAI (required when creating account)."
  default     = null
}

variable "openai_sku_name" {
  type        = string
  description = "Azure OpenAI SKU — confirm regional capacity before apply."
  default     = "S0"
}

variable "openai_public_network_access_enabled" {
  type        = bool
  description = "Prefer false with private endpoints in production-like stacks."
  default     = false
}

variable "openai_existing_resource_id" {
  type        = string
  description = "Resource id when openai_compose_mode = existing."
  default     = null
}

variable "search_compose_mode" {
  type        = string
  description = "create | existing — whether this root creates Azure AI Search or references BYO."
  default     = "create"

  validation {
    condition     = contains(["create", "existing"], var.search_compose_mode)
    error_message = "search_compose_mode must be create or existing."
  }
}

variable "search_service_name" {
  type        = string
  description = "Azure AI Search service name when search_compose_mode = create."
  default     = null
}

variable "search_sku_name" {
  type        = string
  description = "Azure AI Search SKU."
  default     = "basic"
}

variable "search_public_network_access_enabled" {
  type        = bool
  description = "Prefer false with private endpoints in production-like stacks."
  default     = false
}

variable "search_existing_resource_id" {
  type        = string
  description = "Resource id when search_compose_mode = existing."
  default     = null
}

variable "key_vault_name" {
  type        = string
  description = "Existing Key Vault name for secret references (optional)."
  default     = null
}

variable "key_vault_resource_group_name" {
  type        = string
  description = "Resource group containing Key Vault when different from prod RG."
  default     = null
}

variable "log_analytics_workspace_id" {
  type        = string
  description = "Log Analytics workspace id for diagnostic settings (optional)."
  default     = null
}

variable "enable_private_endpoints" {
  type        = bool
  description = "When true, create private endpoints for created OpenAI and Search resources."
  default     = false
}

variable "private_endpoint_subnet_id" {
  type        = string
  description = "Subnet id for private endpoints when enable_private_endpoints is true."
  default     = null

  validation {
    condition     = !var.enable_private_endpoints || var.private_endpoint_subnet_id != null
    error_message = "private_endpoint_subnet_id is required when enable_private_endpoints is true."
  }
}

variable "workload_identity_principal_id" {
  type        = string
  description = "Optional Entra object id for API/worker managed identity — grants Key Vault Secrets User when key_vault_name is set."
  default     = null
}
