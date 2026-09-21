variable "subscription_id" {
  type        = string
  description = "Customer subscription the agent inventories (Reader + Cost Management Reader)."
}

variable "location" {
  type        = string
  description = "Azure region for the agent resource group."
  default     = "eastus"
}

variable "resource_group_name" {
  type        = string
  description = "Resource group for the scheduled extractor agent."
  default     = "rg-archlucid-extractor-agent"
}

variable "automation_account_name" {
  type        = string
  description = "Azure Automation account that hosts the weekly runbook."
  default     = "aa-archlucid-extractor"
}

variable "archlucid_api_base_url" {
  type        = string
  description = "ArchLucid API origin with no trailing slash, for example https://api.example.com."
}

variable "archlucid_tenant_id" {
  type        = string
  description = "ArchLucid tenant id sent as X-Tenant-Id on upload."
  default     = ""
}

variable "archlucid_workspace_id" {
  type        = string
  description = "ArchLucid workspace id sent as X-Workspace-Id on upload."
  default     = ""
}

variable "archlucid_project_id" {
  type        = string
  description = "Optional ArchLucid project id sent as X-Project-Id on upload."
  default     = ""
}

variable "archlucid_run_id" {
  type        = string
  description = "Optional architecture review id associated with each upload."
  default     = ""
}

variable "archlucid_api_key" {
  type        = string
  description = "Optional ExecuteAuthority API key written to Key Vault. Leave empty and set the secret out of band when you do not want the key in Terraform state."
  default     = ""
  sensitive   = true
}

variable "key_vault_secret_name" {
  type        = string
  description = "Key Vault secret name that stores the ArchLucid API key."
  default     = "archlucid-api-key"
}

variable "collector_container_name" {
  type        = string
  description = "Private blob container that stores the pinned collector script ZIP."
  default     = "extractor-scripts"
}

variable "collector_blob_name" {
  type        = string
  description = "Blob name for the pinned collector script ZIP."
  default     = "archlucid-scheduled-extractor-scripts.zip"
}

variable "include_cost" {
  type        = bool
  description = "When true, the collector includes Cost Management actual-cost summary."
  default     = true
}

variable "schedule_start_time_utc" {
  type        = string
  description = "First run time in UTC (RFC3339). Must be at least five minutes in the future when applying."
}

variable "tags" {
  type        = map(string)
  description = "Extra tags merged onto created resources."
  default     = {}
}
