variable "enable_private_data_plane" {
  type        = bool
  description = "When true, create VNet, private DNS zones, and private endpoints for SQL + blob storage. Keep false for local dev or until Azure resource IDs are known."
  default     = false
}

variable "create_resource_group" {
  type    = bool
  default = false
}

variable "resource_group_name" {
  type        = string
  description = "Resource group for VNet, DNS zones, and private endpoints."
  default     = ""
}

variable "location" {
  type    = string
  default = ""
}

variable "virtual_network_name" {
  type        = string
  description = "Name of the VNet that will host the private endpoint subnet."
  default     = "vnet-archlucid-data"
}

variable "vnet_address_space" {
  type    = list(string)
  default = ["10.40.0.0/16"]
}

variable "private_endpoints_subnet_name" {
  type    = string
  default = "snet-private-endpoints"
}

variable "private_endpoints_subnet_prefix" {
  type        = string
  description = "CIDR for private endpoints (must fit in vnet_address_space)."
  default     = "10.40.1.0/24"
}

variable "sql_server_id" {
  type        = string
  description = "Full Azure resource ID of the logical SQL server (Microsoft.Sql/servers/...)."
  default     = ""
}

variable "storage_account_id" {
  type        = string
  description = "Full Azure resource ID of the storage account."
  default     = ""
}

variable "search_service_id" {
  type        = string
  description = "Full Azure resource ID of Azure AI Search (Microsoft.Search/searchServices/...). Leave empty to skip the search private endpoint and DNS zone."
  default     = ""
}

variable "linux_web_app_id" {
  type        = string
  description = "Optional Linux Web App resource ID for regional VNet integration (legacy — Container Apps is the active compute layer). Leave empty in production-like pilots."
  default     = ""
}

variable "web_app_vnet_integration_subnet_id" {
  type        = string
  description = "Dedicated subnet ID for App Service VNet integration (must be delegated to Microsoft.Web/serverFarms). Not the private-endpoints subnet unless your policy allows shared delegation."
  default     = ""
}

variable "tags" {
  type    = map(string)
  default = {}
}

variable "key_vault_id" {
  type        = string
  description = "Full Azure resource ID of the Key Vault (Microsoft.KeyVault/vaults/...). Leave empty to skip the vault private endpoint and DNS zone."
  default     = ""
}
# TB-092 — Key Vault Secrets User for Container Apps / workload managed identities (when key_vault_id is set).
variable "key_vault_workload_principal_ids" {
  type        = list(string)
  description = "Principal IDs (API, Worker, etc.) granted Key Vault Secrets User on var.key_vault_id when private data plane is enabled."
  default     = []
}
