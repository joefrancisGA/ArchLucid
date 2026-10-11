variable "enable_deployment" {
  type        = bool
  description = "Create the in-tenant SecureNow resources. Defaults false so validation and planning are safe without Azure inputs."
  default     = false
}

variable "location" {
  type        = string
  description = "Azure region for the SecureNow resource group."
  default     = "eastus"
}

variable "resource_group_name" {
  type        = string
  description = "Resource group containing the SecureNow deployment."
  default     = ""
}

variable "name_prefix" {
  type        = string
  description = "Lowercase resource-name prefix. UHG values must not contain archlucid."
  default     = "securenow"
}

variable "edition" {
  type        = string
  description = "SecureNow edition. generic is the reusable product; uhg is the tenant-specific specialization."
  default     = "generic"

  validation {
    condition     = contains(["generic", "uhg"], lower(trimspace(var.edition)))
    error_message = "edition must be generic or uhg."
  }
}

variable "hosting_mode" {
  type        = string
  description = "Runtime hosting mode passed to the application."
  default     = "InTenant"

  validation {
    condition     = var.hosting_mode == "InTenant"
    error_message = "This root only provisions the SecureNow InTenant hosting mode."
  }
}

variable "tags" {
  type        = map(string)
  description = "Tags applied to SecureNow resources."
  default     = {}
}

variable "api_container_image" {
  type        = string
  description = "API image. Required when enable_deployment is true."
  default     = ""
}

variable "worker_container_image" {
  type        = string
  description = "Worker image. Empty reuses api_container_image."
  default     = ""
}

variable "ui_container_image" {
  type        = string
  description = "SecureNow UI image. Required when enable_deployment is true."
  default     = ""
}

variable "acr_resource_id" {
  type        = string
  description = "Optional Azure Container Registry resource ID for private image pulls."
  default     = ""
}

variable "tenant_id" {
  type        = string
  description = "Entra tenant ID used by Key Vault and SQL."
  default     = ""
}

variable "entra_admin_login" {
  type        = string
  description = "Entra administrator display name/login for the SQL logical server."
  default     = ""
}

variable "entra_admin_object_id" {
  type        = string
  description = "Entra administrator object ID for the SQL logical server."
  default     = ""
}

variable "sql_admin_login" {
  type        = string
  description = "Break-glass SQL administrator login. Store the value outside source control."
  default     = ""
}

variable "sql_admin_password" {
  type        = string
  description = "Break-glass SQL administrator password. Use a secret manager or environment variable."
  sensitive   = true
  default     = ""
}

variable "vnet_address_space" {
  type        = list(string)
  description = "Address space for the private SecureNow VNet."
  default     = ["10.80.0.0/16"]
}

variable "private_endpoints_subnet_prefix" {
  type        = string
  description = "Subnet CIDR for SQL, Blob, Key Vault, and Azure OpenAI private endpoints."
  default     = "10.80.1.0/24"
}

variable "container_apps_subnet_prefix" {
  type        = string
  description = "Delegated subnet CIDR for the internal Container Apps environment."
  default     = "10.80.2.0/23"
}

variable "storage_account_name" {
  type        = string
  description = "Globally unique lowercase storage account name."
  default     = ""
}

variable "account_replication_type" {
  type        = string
  description = "Storage redundancy for the collection handoff and application artifacts."
  default     = "LRS"

  validation {
    condition     = contains(["LRS", "ZRS", "GRS", "RAGRS", "GZRS", "RAGZRS"], var.account_replication_type)
    error_message = "account_replication_type must be a valid Azure Storage redundancy value."
  }
}

variable "key_vault_name" {
  type        = string
  description = "Globally unique Key Vault name."
  default     = ""
}

variable "key_vault_admin_object_ids" {
  type        = list(string)
  description = "Object IDs granted Key Vault Secrets Officer."
  default     = []
}

variable "azure_openai_account_id" {
  type        = string
  description = "Optional existing Azure OpenAI account resource ID. When set, create its private endpoint and grant API/Worker OpenAI User."
  default     = ""
}

variable "azure_openai_endpoint" {
  type        = string
  description = "Optional Azure OpenAI endpoint used by the application."
  default     = ""
}

variable "azure_openai_chat_deployment_name" {
  type        = string
  description = "Optional Azure OpenAI chat deployment name."
  default     = ""
}

variable "azure_openai_embedding_deployment_name" {
  type        = string
  description = "Optional Azure OpenAI embedding deployment name."
  default     = ""
}

variable "collection_read_scope" {
  type        = string
  description = "Explicit ARM scope the collection agent may read. Do not use a subscription root unless that is an intentional customer decision."
  default     = ""
}

variable "enable_collection_schedule" {
  type        = bool
  description = "Create an Azure Automation schedule for recurring collection. On-demand API triggering remains available when false."
  default     = false
}

variable "collection_schedule_frequency" {
  type        = string
  description = "Azure Automation schedule frequency."
  default     = "Day"

  validation {
    condition     = contains(["Day", "Hour", "Month", "Week"], var.collection_schedule_frequency)
    error_message = "collection_schedule_frequency must be Day, Hour, Month, or Week."
  }
}

variable "collection_schedule_interval" {
  type        = number
  description = "Azure Automation schedule interval."
  default     = 1
}

variable "collection_schedule_start_time" {
  type        = string
  description = "RFC3339 start time for the collection schedule."
  default     = "2027-01-01T00:00:00Z"
}

variable "collection_runbook_content" {
  type        = string
  description = "PowerShell runbook content. The runbook must publish the collection snapshot to the securenow-collection Blob container."
  default     = ""
}
