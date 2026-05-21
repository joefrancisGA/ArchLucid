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

provider "azuread" {
  tenant_id = var.customer_tenant_id
}

data "azuread_client_config" "current" {}

resource "azuread_application" "extractor" {
  display_name = "archlucid-readonly-extractor"
  owners       = [data.azuread_client_config.current.object_id]
}

resource "azuread_service_principal" "extractor" {
  client_id = azuread_application.extractor.client_id
  owners    = [data.azuread_client_config.current.object_id]
}

resource "azuread_application_federated_identity_credential" "archlucid_wif" {
  application_id = azuread_application.extractor.id
  display_name   = "archlucid-hosted-extractor-wif"
  description    = "Trust ArchLucid hosted managed identity (cross-tenant WIF)."
  audiences      = ["api://AzureADTokenExchange"]
  issuer         = "https://login.microsoftonline.com/${var.archlucid_tenant_id}/v2.0"
  subject        = var.archlucid_managed_identity_object_id
}

resource "azurerm_role_assignment" "reader" {
  scope                = var.subscription_id
  role_definition_name = "Reader"
  principal_id         = azuread_service_principal.extractor.object_id
}

resource "azurerm_role_assignment" "cost_management_reader" {
  scope                = var.subscription_id
  role_definition_name = "Cost Management Reader"
  principal_id         = azuread_service_principal.extractor.object_id
}
