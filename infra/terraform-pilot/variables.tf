variable "pilot_monthly_budget_usd" {
  type        = number
  description = "Soft cap for FinOps review (not enforced by Terraform alone; set Azure budgets in portal or consumption_budget stacks)."
  default     = 500
}

variable "sql_sku_hint" {
  type        = string
  description = "Human-readable Azure SQL target for pilot (actual deployment uses terraform-sql-failover variables)."
  default     = "Basic or S0 single-region"
}

variable "container_apps_max_replicas" {
  type        = number
  description = "Suggested maxReplicas for API/Worker during pilot."
  default     = 3
}

variable "app_insights_sampling_percent" {
  type        = number
  description = "Target sampling percentage for Application Insights in pilot (coordinate with terraform-monitoring)."
  default     = 25
}
