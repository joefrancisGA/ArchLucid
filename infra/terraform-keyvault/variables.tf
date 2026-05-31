variable "enable_key_vault" {
  type        = bool
  description = "When true, create a Key Vault suitable for application secrets and (optionally) storage CMK keys."
  default     = false
}

variable "create_resource_group" {
  type        = bool
  description = "When true and enable_key_vault is true, create the resource group."
  default     = false
}

variable "resource_group_name" {
  type        = string
  description = "Resource group for the Key Vault."
  default     = ""
}

variable "location" {
  type        = string
  description = "Azure region (required when create_resource_group = true)."
  default     = ""
}

variable "key_vault_name" {
  type        = string
  description = "Globally unique Key Vault name (3-24 alphanumeric)."
  default     = ""
}

variable "sku_name" {
  type        = string
  description = "standard or premium."
  default     = "standard"
}

variable "tenant_id" {
  type        = string
  description = "Azure AD tenant id for access policies / RBAC (defaults to current client tenant)."
  default     = ""
}

variable "admin_object_ids" {
  type        = list(string)
  description = "Object IDs (users, groups, or service principals) granted Key Vault Secrets Officer on the vault when RBAC is used."
  default     = []
}

variable "tags" {
  type        = map(string)
  default     = {}
  description = "Tags applied to created resources."
}
variable "api_managed_identity_principal_id" {
  type        = string
  description = "Container App API system-assigned managed identity principal_id. Granted Key Vault Secrets User when enable_key_vault is true."
  default     = ""
}

variable "worker_managed_identity_principal_id" {
  type        = string
  description = "Container App Worker system-assigned managed identity principal_id. Granted Key Vault Secrets User when enable_key_vault is true."
  default     = ""
}
