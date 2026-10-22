variable "location" {
  type        = string
  description = "Azure region for all sandbox resources."
  default     = "centralus"
}

variable "name_prefix" {
  type        = string
  description = "Short lowercase prefix embedded in resource names (letters and digits only after normalization)."
  default     = "alsandbox"

  validation {
    condition     = can(regex("^[a-z][a-z0-9]{2,12}$", var.name_prefix))
    error_message = "name_prefix must be 3-13 lowercase letters/digits and start with a letter."
  }
}

variable "resource_group_name" {
  type        = string
  description = "Resource group name. Leave empty to auto-generate rg-{name_prefix}-analysis."
  default     = ""
}

variable "deployer_object_id" {
  type        = string
  description = "Entra object ID of the principal running terraform (Key Vault Secrets Officer during bootstrap)."
}

variable "budget_contact_email" {
  type        = string
  description = "Optional email for monthly resource-group budget alerts. Leave empty to skip the budget resource."
  default     = ""
}

variable "monthly_budget_usd" {
  type        = number
  description = "Monthly USD cap for the sandbox resource group (Consumption budget)."
  default     = 150
}

variable "container_app_image" {
  type        = string
  description = "Public container image for API, Worker, and UI placeholders (analysis only — not ArchLucid bits)."
  default     = "mcr.microsoft.com/azuredocs/containerapps-helloworld:latest"
}

variable "enable_data_factory" {
  type        = bool
  description = "Deploy Azure Data Factory with blob + SQL linked services and a sample copy pipeline (diagram declared-movement edges)."
  default     = true
}

variable "enable_service_bus" {
  type        = bool
  description = "Deploy a Standard Service Bus namespace + topic (adds ~$10/mo; good for messaging inventory edges)."
  default     = false
}

variable "enable_event_grid" {
  type        = bool
  description = "Deploy Event Grid topic with a storage destination subscription (declared event routing edges)."
  default     = false
}

variable "sql_sku_name" {
  type        = string
  description = "Primary application database SKU. GP_S_Gen5_1 auto-pauses when idle; Basic is cheaper but less representative."
  default     = "GP_S_Gen5_1"
}

variable "sql_auto_pause_delay_in_minutes" {
  type        = number
  description = "Auto-pause delay for serverless SQL (null disables auto-pause)."
  default     = 60
}

variable "log_analytics_daily_quota_gb" {
  type        = number
  description = "Daily ingestion cap for Log Analytics (GB). Use 1 for cost guardrails."
  default     = 1
}

variable "tags" {
  type        = map(string)
  description = "Tags applied to every resource."
  default = {
    workload = "archlucid-analysis-sandbox"
    purpose  = "securenow-diagram-analysis"
    teardown = "true"
  }
}
