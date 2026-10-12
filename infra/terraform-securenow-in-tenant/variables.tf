variable "location" {
  type        = string
  description = "Azure region for the in-tenant SecureNow install."
}

variable "name_prefix" {
  type        = string
  description = "Lowercase prefix for resource names. UHG installs cannot include the hosted product token."

  validation {
    condition     = can(regex("^[a-z][a-z0-9-]{1,16}$", var.name_prefix))
    error_message = "name_prefix must be 2-17 lowercase letters, digits, or hyphens."
  }
}

variable "edition" {
  type        = string
  description = "SecureNow:Edition. Generic or Uhg. Not user-switchable."

  validation {
    condition     = contains(["generic", "uhg", "Generic", "Uhg"], var.edition)
    error_message = "edition must be Generic or Uhg."
  }
}

variable "enable_support_telemetry" {
  type        = bool
  description = "Generic in-tenant installs may opt in to support telemetry. UHG must stay false. Inventory evidence is never included."
  default     = false
}

variable "enable_private_ingress" {
  type        = bool
  description = "When true, create a VNet-integrated Container Apps environment with an internal load balancer and no public ingress. Default false leaves the UI unreachable."
  default     = false
}

variable "enable_cost_collection" {
  type        = bool
  description = "When true, grant Cost Management Reader on the same resource groups the collector can read."
  default     = false
}

variable "collection_reader_resource_group_ids" {
  type        = list(string)
  description = "Additional resource group ARM ids the collector may read. Subscription and management-group scopes are rejected."
  default     = []
}

variable "collection_schedule_start_time" {
  type        = string
  description = "RFC3339 start time for the daily collection schedule. Must be in the future at apply time."
  default     = "2030-01-01T01:00:00Z"
}

variable "storage_account_name" {
  type        = string
  description = "Globally unique storage account name. Empty derives one from name_prefix."
  default     = ""
}

variable "openai_account_name" {
  type        = string
  description = "Globally unique Azure OpenAI account name. Empty derives one from name_prefix."
  default     = ""
}

variable "sql_admin_login" {
  type        = string
  description = "Break-glass SQL login. The app connects with its managed identity."
  default     = "sqlbreakglass"
}

variable "sql_admin_password" {
  type        = string
  description = "Break-glass SQL password. Set with TF_VAR_sql_admin_password. Do not put it in tfvars."
  sensitive   = true
}

variable "entra_admin_login" {
  type        = string
  description = "Display name of the Entra administrator for the SQL server."
}

variable "entra_admin_object_id" {
  type        = string
  description = "Object id of the Entra administrator for the SQL server."
}

variable "api_container_image" {
  type        = string
  description = "API image pinned by digest (repo@sha256:...). Required when enable_private_ingress is true."
  default     = ""
}

variable "worker_container_image" {
  type        = string
  description = "Worker image pinned by digest. Required when enable_private_ingress is true."
  default     = ""
}

variable "ui_container_image" {
  type        = string
  description = "Operator UI image pinned by digest. Required when enable_private_ingress is true."
  default     = ""
}

variable "ui_redirect_uris" {
  type        = list(string)
  description = "Entra redirect URIs for the UI app registration. Empty until the private ingress hostname is known."
  default     = []
}

variable "container_apps_subnet_prefix" {
  type        = string
  description = "CIDR for the Container Apps subnet. Must sit inside 10.40.0.0/16 and must not overlap 10.40.1.0/24."
  default     = "10.40.2.0/23"
}

variable "tags" {
  type        = map(string)
  description = "Extra tags merged onto every resource this root creates."
  default     = {}
}
