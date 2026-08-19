terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = ">= 3.0.0"
    }
  }
}

variable "location" {
  type        = string
  description = "Azure region for regional resources."
}

variable "resource_group_name" {
  type        = string
  description = "Existing resource group hosting the logical SQL server."
}

variable "mssql_server_name" {
  type        = string
  description = "Logical server name (SQL Server resource name, not FQDN)."
}

variable "elastic_pool_name" {
  type        = string
  description = "Name of the elastic pool hosting pooled tenant databases."
}

variable "system_database_name" {
  type        = string
  description = "Logical name of the system / control-plane database."
}

variable "tenant_database_names" {
  type        = list(string)
  description = "Optional tenant catalog names materialized as databases in the pool (empty if app-provisioned)."
  default     = []
}

variable "sku_name" {
  type        = string
  description = "Elastic pool SKU name string accepted by azurerm for your tier (validate against provider docs)."
  default     = "GP_Gen5_2"
}

variable "sku_tier" {
  type        = string
  description = "Elastic pool tier (e.g. GeneralPurpose, BusinessCritical)."
  default     = "GeneralPurpose"
}

variable "sku_capacity" {
  type        = number
  description = "Elastic pool capacity (DTU/vCore interpretation depends on SKU)."
  default     = 2
}

variable "max_size_gb" {
  type        = number
  description = "Max size of the elastic pool in GB."
  default     = 50
}

variable "per_database_min_capacity" {
  type        = number
  description = "Minimum capacity per database in the pool."
  default     = 0
}

variable "per_database_max_capacity" {
  type        = number
  description = "Maximum capacity per database in the pool."
  default     = 2
}

data "azurerm_mssql_server" "this" {
  name                = var.mssql_server_name
  resource_group_name = var.resource_group_name
}

resource "azurerm_mssql_elasticpool" "tenant" {
  # Azure SQL elastic pool tempdb data file count scales with active pool vCores (platform-managed).
  # Minimum safe sku_capacity for concurrent SampleRunPurge + Archival purge workers: 4.
  # Do not reduce below 4 without serialising purge batch workers.
  name                = var.elastic_pool_name
  resource_group_name = var.resource_group_name
  location            = var.location
  server_name         = var.mssql_server_name
  max_size_gb         = var.max_size_gb
  sku {
    name     = var.sku_name
    tier     = var.sku_tier
    capacity = var.sku_capacity
  }
  per_database_settings {
    min_capacity = var.per_database_min_capacity
    max_capacity = var.per_database_max_capacity
  }
}

resource "azurerm_mssql_database" "system" {
  name            = var.system_database_name
  server_id       = data.azurerm_mssql_server.this.id
  elastic_pool_id = azurerm_mssql_elasticpool.tenant.id
  sku_name        = "ElasticPool"
  read_scale      = false
  zone_redundant  = false
}

resource "azurerm_mssql_database" "tenant" {
  for_each        = toset(var.tenant_database_names)
  name            = each.key
  server_id       = data.azurerm_mssql_server.this.id
  elastic_pool_id = azurerm_mssql_elasticpool.tenant.id
  sku_name        = "ElasticPool"
  read_scale      = false
  zone_redundant  = false
}

output "elastic_pool_id" {
  value       = azurerm_mssql_elasticpool.tenant.id
  description = "Elastic pool resource ID."
}

output "system_database_id" {
  value       = azurerm_mssql_database.system.id
  description = "System database resource ID."
}
