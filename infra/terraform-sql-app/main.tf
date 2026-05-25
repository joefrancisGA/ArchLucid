terraform {
  required_version = ">= 1.5.0"
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = ">= 3.90.0"
    }
  }
}

provider "azurerm" {
  features {}
}

module "azure_sql_serverless_app" {
  source = "../modules/azure-sql-serverless-app"

  location                   = var.location
  resource_group_name        = var.resource_group_name
  sql_server_name            = var.sql_server_name
  sql_database_name          = var.sql_database_name
  sql_admin_login            = var.sql_admin_login
  sql_admin_password         = var.sql_admin_password
  entra_admin_login          = var.entra_admin_login
  entra_admin_object_id      = var.entra_admin_object_id
  sql_sku                    = var.sql_sku
  private_endpoint_subnet_id = var.private_endpoint_subnet_id
}
