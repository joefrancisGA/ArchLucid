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
  description = "existing | create â€” production-like stacks consume a platform-owned account (existing). create is for dev/lab only."
  default     = "existing"

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
  description = "Azure OpenAI SKU â€” confirm regional capacity before apply."
  default     = "S0"
}

variable "openai_public_network_access_enabled" {
  type        = bool
  description = "Prefer false with private endpoints in production-like stacks."
  default     = false
}

variable "openai_existing_resource_id" {
  type        = string
  description = "Full ARM id of the platform-owned Microsoft.CognitiveServices/accounts resource when openai_compose_mode = existing."
  default     = ""
}

variable "openai_existing_endpoint" {
  type        = string
  description = "HTTPS endpoint for the consumed account (maps to AzureOpenAI:Endpoint). Example: https://{name}.openai.azure.com/"
  default     = ""
}

variable "openai_existing_chat_deployment_name" {
  type        = string
  description = "Chat/completion deployment name on the consumed account (maps to AzureOpenAI:DeploymentName)."
  default     = ""
}

variable "openai_existing_embedding_deployment_name" {
  type        = string
  description = "Embedding deployment name on the consumed account (maps to AzureOpenAI:EmbeddingDeploymentName)."
  default     = ""
}

variable "openai_expected_location" {
  type        = string
  description = "Required Azure region for consumed OpenAI (production-like pilot default US East = eastus). Validated against the account when resource id is set."
  default     = "eastus"
}

variable "openai_workload_principal_ids" {
  type        = list(string)
  description = "Entra principal IDs (API, Worker, etc.) granted Cognitive Services OpenAI User on the consumed account. Pass Container Apps system-assigned principal_id outputs after first apply."
  default     = []
}

variable "search_compose_mode" {
  type        = string
  description = "create | existing â€” whether this root creates Azure AI Search or references BYO."
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
  description = "Optional Entra object id for API/worker managed identity â€” grants Key Vault Secrets User when key_vault_name is set."
  default     = null
}

variable "openai_enable_chat_deployment" {
  type        = bool
  description = "When true and openai_compose_mode = create, provision the chat/completion deployment."
  default     = true
}

variable "openai_chat_deployment_name" {
  type        = string
  description = "Azure OpenAI chat deployment name."
  default     = "gpt-4o"
}

variable "openai_chat_model_name" {
  type        = string
  description = "OpenAI model name for chat deployment â€” confirm regional availability."
  default     = "gpt-4o"
}

variable "openai_chat_model_version" {
  type        = string
  description = "OpenAI model version for chat deployment."
  default     = "2024-08-06"
}

variable "openai_chat_capacity" {
  type        = number
  description = "TPM capacity units for chat deployment SKU."
  default     = 10
}

variable "openai_enable_embedding_deployment" {
  type        = bool
  description = "When true and openai_compose_mode = create, provision the embedding deployment."
  default     = true
}

variable "openai_embedding_deployment_name" {
  type        = string
  description = "Azure OpenAI embedding deployment name."
  default     = "text-embedding-3-small"
}

variable "openai_embedding_model_name" {
  type        = string
  description = "OpenAI embedding model name."
  default     = "text-embedding-3-small"
}

variable "openai_embedding_model_version" {
  type        = string
  description = "OpenAI embedding model version."
  default     = "1"
}

variable "openai_embedding_capacity" {
  type        = number
  description = "TPM capacity units for embedding deployment SKU."
  default     = 10
}

variable "enable_openai_consumption_budget" {
  type        = bool
  description = "Emit azurerm_consumption_budget_resource_group for the hosted prod resource group."
  default     = false
}

variable "openai_consumption_budget_name" {
  type        = string
  description = "Budget resource name when enable_openai_consumption_budget is true."
  default     = "archlucid-openai-monthly"
}

variable "openai_consumption_budget_amount" {
  type        = number
  description = "Monthly budget amount (USD) for OpenAI/Cognitive spend alerts."
  default     = 500
}

variable "openai_consumption_budget_period_start" {
  type        = string
  description = "Budget period start date (YYYY-MM-DD)."
  default     = "2026-01-01"
}

variable "openai_consumption_budget_contact_emails" {
  type        = list(string)
  description = "Notification recipients for OpenAI consumption budget thresholds."
  default     = []
}

variable "container_app_resource_ids" {
  type        = list(string)
  description = "Container App resource ids for diagnostic settings (TB-099)."
  default     = []
}

variable "artifact_storage_account_id" {
  type        = string
  description = "Artifact storage account resource id for diagnostic settings (TB-099)."
  default     = null
}
