terraform {
  required_version = ">= 1.5.0"

  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 4.0"
    }
    azuread = {
      source  = "hashicorp/azuread"
      version = "~> 3.0"
    }
  }
}

provider "azurerm" {
  features {}
}

provider "azuread" {}

variable "archlucid_tenant_id" {
  type        = string
  description = "ArchLucid Entra tenant id used as the federated credential issuer."
}

variable "archlucid_managed_identity_object_id" {
  type        = string
  description = "Object id of ArchLucid's user-assigned managed identity (federated subject)."
}

variable "subscription_id" {
  type        = string
  description = "Customer subscription id scoped for Reader + Cost Management Reader."
}

variable "location" {
  type        = string
  description = "Azure region metadata for provider registration (no resources deployed here)."
  default     = "eastus"
}

resource "azuread_application" "extractor" {
  display_name = "archlucid-readonly-extractor"
}

resource "azuread_service_principal" "extractor" {
  client_id = azuread_application.extractor.client_id
}

resource "azuread_application_federated_identity_credential" "archlucid_wif" {
  application_id = azuread_application.extractor.id
  display_name   = "archlucid-tier2-extractor"
  audiences      = ["api://AzureADTokenExchange"]
  issuer         = "https://login.microsoftonline.com/${var.archlucid_tenant_id}/v2.0"
  subject        = var.archlucid_managed_identity_object_id
}

resource "azurerm_role_assignment" "reader" {
  scope                = "/subscriptions/${var.subscription_id}"
  role_definition_name = "Reader"
  principal_id         = azuread_service_principal.extractor.object_id
}

resource "azurerm_role_assignment" "cost_management_reader" {
  scope                = "/subscriptions/${var.subscription_id}"
  role_definition_name = "Cost Management Reader"
  principal_id         = azuread_service_principal.extractor.object_id
}

output "customer_tenant_id" {
  value       = data.azurerm_client_config.current.tenant_id
  description = "Customer Entra tenant id."
}

output "customer_app_id" {
  value       = azuread_application.extractor.client_id
  description = "Customer service principal application (client) id for ArchLucid Tier-2 configuration."
}

output "subscription_id" {
  value       = var.subscription_id
  description = "Scoped subscription id."
}

data "azurerm_client_config" "current" {}
