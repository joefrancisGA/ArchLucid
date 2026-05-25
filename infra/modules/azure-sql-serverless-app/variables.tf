variable "location" {
  type        = string
  description = "Azure region for SQL resources (primary and read replica must match)."
}

variable "resource_group_name" {
  type        = string
  description = "Resource group hosting the logical SQL server."
}

variable "sql_server_name" {
  type        = string
  description = "Globally unique logical SQL server name."
}

variable "sql_database_name" {
  type        = string
  description = "Primary application database name."
}

variable "sql_admin_login" {
  type        = string
  description = "SQL administrator login (break-glass only; app uses Entra MI)."
  sensitive   = true
}

variable "sql_admin_password" {
  type        = string
  description = "SQL administrator password (break-glass only)."
  sensitive   = true
}

variable "entra_admin_login" {
  type        = string
  description = "Entra ID administrator display name for the SQL server."
}

variable "entra_admin_object_id" {
  type        = string
  description = "Entra object ID for the SQL server Azure AD administrator."
}

variable "sql_sku" {
  type        = string
  description = "Serverless General Purpose SKU for the primary database."
  default     = "GP_S_Gen5_2"

  validation {
    condition     = contains(["GP_S_Gen5_2", "GP_S_Gen5_4", "GP_S_Gen5_8", "GP_S_Gen5_16"], var.sql_sku)
    error_message = "SQL DB SKU must be a Serverless General Purpose tier (GP_S_Gen5_N). Do not use DTU tiers."
  }
}

variable "read_replica_sku" {
  type        = string
  description = "Serverless SKU for the named read replica."
  default     = "GP_S_Gen5_2"
}

variable "auto_pause_delay_in_minutes" {
  type        = number
  description = "Idle minutes before serverless auto-pause (-1 disables pause)."
  default     = 60
}

variable "min_capacity" {
  type        = number
  description = "Minimum vCores billed while serverless DB is active."
  default     = 0.5
}

variable "max_size_gb" {
  type        = number
  description = "Maximum database size in GB."
  default     = 32
}

variable "storage_account_type" {
  type        = string
  description = "Backup storage redundancy (Local or Geo)."
  default     = "Local"
}

variable "enable_read_replica" {
  type        = bool
  description = "Provision named geo-secondary read replica."
  default     = true
}

variable "enable_private_endpoint" {
  type        = bool
  description = "Create private endpoint for SQL server."
  default     = true
}

variable "private_endpoint_subnet_id" {
  type        = string
  description = "Subnet ID for SQL private endpoint."
  default     = null

  validation {
    condition     = var.enable_private_endpoint == false || var.private_endpoint_subnet_id != null
    error_message = "private_endpoint_subnet_id is required when enable_private_endpoint is true."
  }
}

variable "private_endpoint_name" {
  type        = string
  description = "Private endpoint resource name."
  default     = "pe-sql-app"
}

variable "block_public_sql_access" {
  type        = bool
  description = "Disable public network access and add deny-all firewall rule."
  default     = true
}

variable "enable_sql_monitoring" {
  type        = bool
  description = "Enable Azure SQL diagnostic settings and platform metric alerts."
  default     = false
}

variable "log_analytics_workspace_id" {
  type        = string
  description = "Log Analytics workspace ID for SQL diagnostic settings."
  default     = null
}

variable "monitor_action_group_id" {
  type        = string
  description = "Existing Azure Monitor action group ID for SQL metric alerts."
  default     = null
}

variable "backup_storage_redundancy" {
  type        = string
  description = "Backup storage redundancy (Geo replicates to paired region)."
  default     = "Geo"
}

variable "sql_pitr_retention_days" {
  type        = number
  description = "Point-in-time restore retention days (max 35 for GP Serverless)."
  default     = 35
}

variable "sql_ltr_weekly_retention" {
  type        = string
  description = "ISO 8601 weekly LTR retention (PT0S disables)."
  default     = "P1M"
}

variable "sql_ltr_monthly_retention" {
  type        = string
  description = "ISO 8601 monthly LTR retention (PT0S disables)."
  default     = "P12M"
}

variable "sql_ltr_yearly_retention" {
  type        = string
  description = "ISO 8601 yearly LTR retention (PT0S disables)."
  default     = "P7Y"
}

variable "sql_ltr_week_of_year" {
  type        = number
  description = "ISO week number for yearly LTR snapshot."
  default     = 1
}
