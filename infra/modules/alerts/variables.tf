variable "enabled" {
  type        = bool
  description = "When true (and workspace/RG/action group are set), create the Prometheus rule group for TB-002 startup config warnings."
  default     = false
}

variable "resource_group_name" {
  type        = string
  description = "Resource group containing the Azure Monitor workspace (same pattern as terraform-monitoring)."
  default     = ""
}

variable "name_prefix" {
  type        = string
  description = "Short alphanumeric prefix for alert rule group naming."
  default     = "archlucid"
}

variable "azure_monitor_workspace_id" {
  type        = string
  description = "Azure Monitor workspace resource ID used as Prometheus rule scope (managed Prometheus)."
  default     = ""
}

variable "ops_action_group_id" {
  type        = string
  description = "Existing ops action group resource ID for alert actions."
  default     = ""
}

variable "alert_severity" {
  type        = number
  description = "Azure alert severity (2 = Sev2 typical Production; 3 = Sev3 warning tier for Staging-class scrapes)."
  default     = 2
}

variable "tags" {
  type        = map(string)
  description = "Tags applied to the rule group resource."
  default     = {}
}
