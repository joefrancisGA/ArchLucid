variable "location" {
  type = string
}

variable "resource_group_name" {
  type = string
}

variable "sql_server_name" {
  type = string
}

variable "sql_database_name" {
  type    = string
  default = "ArchLucid"
}

variable "sql_admin_login" {
  type      = string
  sensitive = true
}

variable "sql_admin_password" {
  type      = string
  sensitive = true
}

variable "entra_admin_login" {
  type = string
}

variable "entra_admin_object_id" {
  type = string
}

variable "sql_sku" {
  type    = string
  default = "GP_S_Gen5_2"
}

variable "private_endpoint_subnet_id" {
  type = string
}

variable "log_analytics_workspace_id" {
  type        = string
  description = "Log Analytics workspace for SQL auditing diagnostics and Defender log correlation."
  default     = null
}

variable "enable_sql_monitoring" {
  type        = bool
  description = "Enable SQL diagnostic settings and platform metric alerts."
  default     = false
}

variable "monitor_action_group_id" {
  type        = string
  description = "Azure Monitor action group for SQL platform metric alerts."
  default     = null
}

variable "enable_sql_defender" {
  type        = bool
  description = "Enable Microsoft Defender for SQL on the logical server."
  default     = false
}

variable "alert_email_address" {
  type        = string
  description = "Email for Defender threat and vulnerability assessment notifications."
  default     = ""
}

variable "sql_audit_retention_days" {
  type        = number
  description = "SQL extended auditing retention days."
  default     = 90
}
