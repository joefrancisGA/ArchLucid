variable "enable_sql_failover_group" {
  type        = bool
  description = "When true, manage an azurerm_mssql_failover_group on the primary server (IaC-backed read/write listener). When false, no SQL resources are created."
  default     = false
}

variable "failover_group_name" {
  type        = string
  description = "Globally unique failover group name (Azure naming rules). Used in the listener FQDN: {name}.database.windows.net"
  default     = "archlucid-sqlfg-disabled"

  validation {
    condition     = length(var.failover_group_name) >= 1 && length(var.failover_group_name) <= 63
    error_message = "failover_group_name must be 1-63 characters."
  }
}

variable "primary_sql_server_resource_id" {
  type        = string
  description = "Resource ID of the primary Microsoft.Sql/servers resource. The failover group is created on this server."
  default     = "/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/placeholder-rg/providers/Microsoft.Sql/servers/placeholder-primary"
}

variable "partner_sql_server_resource_id" {
  type        = string
  description = "Resource ID of the geo-secondary Microsoft.Sql/servers resource (partner in the failover group)."
  default     = "/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/placeholder-rg/providers/Microsoft.Sql/servers/placeholder-secondary"
}

variable "database_resource_ids" {
  type        = list(string)
  description = "Resource IDs of databases on the primary server to include in the group (same logical DB replicated to the partner)."
  default     = []
}

variable "read_write_failover_mode" {
  type        = string
  description = "Read/write endpoint policy: Automatic (with grace) or Manual."
  default     = "Automatic"

  validation {
    condition     = contains(["Automatic", "Manual"], var.read_write_failover_mode)
    error_message = "read_write_failover_mode must be Automatic or Manual."
  }
}

variable "read_write_grace_minutes" {
  type        = number
  description = "Grace period for Automatic read/write failover (minutes). Ignored when mode is Manual; must be >= 60 for Automatic per provider/Azure rules."
  default     = 60

  validation {
    condition     = var.read_write_grace_minutes >= 60 && var.read_write_grace_minutes <= 720
    error_message = "read_write_grace_minutes must be between 60 and 720 when used with Automatic mode."
  }
}

variable "readonly_endpoint_failover_enabled" {
  type        = bool
  description = "When true, enables read-only endpoint failover policy on the group (typical for geo secondaries serving read traffic)."
  default     = true
}

variable "tags" {
  type        = map(string)
  description = "Tags applied to the failover group resource."
  default     = {}
}

variable "enable_sql_consumption_budget" {
  type        = bool
  description = "When true and a budget scope is known (sql_consumption_budget_resource_group_id or a non-placeholder primary_sql_server_resource_id), create an azurerm_consumption_budget_resource_group scoped to SQL server/database spend. Defaults true (2026-07-20): budgets are free; notifications use contact_roles (default Owner) when contact_emails is empty. Plan fails fast if the flag is on but scope is still the placeholder server id — set sql_consumption_budget_resource_group_id or a real primary_sql_server_resource_id, or set false to opt out."
  default     = true
}

variable "sql_consumption_budget_resource_group_id" {
  type        = string
  description = "Full ARM id of the resource group for the SQL consumption budget (format /subscriptions/{sub}/resourceGroups/{name}). Leave empty to derive from primary_sql_server_resource_id when it is a valid Microsoft.Sql/servers id."
  default     = ""
}

variable "sql_consumption_budget_name" {
  type        = string
  description = "Budget name (unique within the resource group scope in Cost Management)."
  default     = "archlucid-sql-monthly"

  validation {
    condition     = length(var.sql_consumption_budget_name) >= 1 && length(var.sql_consumption_budget_name) <= 63
    error_message = "sql_consumption_budget_name must be 1-63 characters."
  }
}

variable "sql_consumption_budget_amount" {
  type        = number
  description = "Monthly budget amount in the subscription billing currency (e.g. USD)."
  default     = 500

  validation {
    condition     = var.sql_consumption_budget_amount > 0
    error_message = "sql_consumption_budget_amount must be positive."
  }
}

variable "sql_consumption_budget_time_period_start" {
  type        = string
  description = "Budget period start (RFC3339, first day of a month UTC, e.g. 2026-04-01T00:00:00Z). Azure requires month boundaries."
  default     = "2026-01-01T00:00:00Z"
}

variable "sql_consumption_budget_contact_emails" {
  type        = list(string)
  description = "Email addresses for budget alerts. When empty, contact_roles is used instead."
  default     = []
}

variable "sql_consumption_budget_contact_roles" {
  type        = list(string)
  description = "RBAC roles to notify when sql_consumption_budget_contact_emails is empty (typical: Owner)."
  default     = ["Owner"]
}

variable "enable_sql_automatic_tuning" {
  type        = bool
  description = "When true, set server-level Azure SQL automatic tuning on each eligible logical server (primary always when its id is real; partner when its id is real). Uses Azure/azapi; does not require enable_sql_failover_group."
  default     = false
}

variable "sql_automatic_tuning_force_last_good_plan" {
  type        = string
  description = "Automatic tuning option forceLastGoodPlan: On (recommended), Off, or Default (inherit subscription policy)."
  default     = "On"

  validation {
    condition     = contains(["On", "Off", "Default"], var.sql_automatic_tuning_force_last_good_plan)
    error_message = "sql_automatic_tuning_force_last_good_plan must be On, Off, or Default."
  }
}

variable "sql_automatic_tuning_create_index" {
  type        = string
  description = "Automatic tuning option createIndex: On lets Azure create missing nonclustered indexes from workload signals; Off/Default if you want migrations-only indexes."
  default     = "On"

  validation {
    condition     = contains(["On", "Off", "Default"], var.sql_automatic_tuning_create_index)
    error_message = "sql_automatic_tuning_create_index must be On, Off, or Default."
  }
}

variable "sql_automatic_tuning_drop_index" {
  type        = string
  description = "Automatic tuning option dropIndex: On lets Azure drop indexes it deems redundant; can remove rarely used indexes you ship in DDL—monitor Query Store and IaC drift."
  default     = "On"

  validation {
    condition     = contains(["On", "Off", "Default"], var.sql_automatic_tuning_drop_index)
    error_message = "sql_automatic_tuning_drop_index must be On, Off, or Default."
  }
}

variable "posture_tier" {
  type        = string
  description = "Deployment posture tier for plan-time assertions (dev, staging, production). When production, enable_sql_failover_group must be true (no waiver)."
  default     = "dev"

  validation {
    condition     = contains(["dev", "staging", "production"], var.posture_tier)
    error_message = "posture_tier must be dev, staging, or production."
  }
}

variable "posture_waivers" {
  type = list(object({
    id     = string
    reason = string
  }))
  description = "Documented posture exceptions. Use id staging-sql-failover-drill-window to allow SQL failover off in staging outside drill windows (TB-905)."
  default     = []

  validation {
    condition = alltrue([
      for w in var.posture_waivers :
      length(trimspace(w.id)) > 0 && length(trimspace(w.reason)) > 0
    ])
    error_message = "Each posture_waivers entry must have non-empty id and reason."
  }
}
