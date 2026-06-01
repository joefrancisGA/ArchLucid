variable "enable_storage_account" {
  type        = bool
  description = "When true, create the storage account and blob containers for large artifact offload (API ArtifactLargePayload)."
  default     = false
}

variable "create_resource_group" {
  type    = bool
  default = false
}

variable "resource_group_name" {
  type        = string
  description = "Resource group for the storage account."
  default     = ""
}

variable "location" {
  type        = string
  description = "Azure region (required when create_resource_group is true)."
  default     = ""
}

variable "storage_account_name" {
  type        = string
  description = "Globally unique storage account name (3-24 chars, lowercase alphanumeric)."
  default     = ""
}

variable "account_replication_type" {
  type        = string
  description = "Storage replication type. Use LRS for dev/test. Production should use GRS or RAGRS for cross-region artifact durability (blob artifacts are primary evidence records)."

  default = "LRS"

  validation {
    condition     = contains(["LRS", "ZRS", "GRS", "RAGRS", "GZRS", "RAGZRS"], var.account_replication_type)
    error_message = "account_replication_type must be a valid Azure storage redundancy value."
  }
}

variable "public_network_access_enabled" {
  type        = bool
  description = "Set false when access is only via private endpoint (see terraform-private)."
  default     = true
}

variable "network_rule_ip_allowlist" {
  type        = list(string)
  description = "Public IPv4 addresses allowed through the storage firewall (single-host /32 style strings Azure accepts). Leave empty for private-endpoint-only access."
  default     = []
}

variable "network_rule_subnet_ids" {
  type        = list(string)
  description = "Subnet resource IDs permitted to reach the storage account over the service endpoint. Leave empty when using private link only."
  default     = []
}

variable "tags" {
  type    = map(string)
  default = {}
}

variable "customer_managed_key_enabled" {
  type        = bool
  description = "When true and customer_managed_key_id is set, enable CMK on the artifacts storage account via azurerm_storage_account_customer_managed_key."
  default     = false
}

variable "customer_managed_key_id" {
  type        = string
  description = "Full Azure Resource Manager id of the Key Vault key version used for storage encryption (see docs/runbooks/CMK_ENCRYPTION.md)."
  default     = ""
}

variable "agent_trace_blob_lifecycle_enabled" {
  type        = bool
  description = "When true, apply azurerm_storage_management_policy tiering and expiry on agent-traces/ block blobs (Improvement #13)."
  default     = true
}

variable "agent_trace_blob_cool_tier_after_days" {
  type        = number
  description = "Move agent-traces block blobs to Cool after this many days since last modification. Align with DataArchival:BlobCleanup:MinAgeDays for orphan cleanup (default 30)."
  default     = 30

  validation {
    condition     = var.agent_trace_blob_cool_tier_after_days >= 1 && var.agent_trace_blob_cool_tier_after_days <= 3650
    error_message = "agent_trace_blob_cool_tier_after_days must be between 1 and 3650."
  }
}

variable "agent_trace_blob_delete_after_days" {
  type        = number
  description = "Delete agent-traces block blobs after this many days since last modification. Staging should use a shorter value than Production."
  default     = 365

  validation {
    condition     = var.agent_trace_blob_delete_after_days >= 2 && var.agent_trace_blob_delete_after_days <= 3650
    error_message = "agent_trace_blob_delete_after_days must be between 2 and 3650."
  }
}
variable "enable_storage_diagnostics" {
  type        = bool
  description = "TB-099: forward blob storage logs to Log Analytics."
  default     = false
}

variable "log_analytics_workspace_id" {
  type        = string
  description = "Log Analytics workspace id when enable_storage_diagnostics is true."
  default     = ""
}
