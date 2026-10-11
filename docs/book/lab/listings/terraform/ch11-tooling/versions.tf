# Scaffolding so Chapter 11's tooling module (main.tf, printed in section 11.9) validates on its own.
# It pins azurerm 5.x, where storage accounts take public_network_access; the companion lab pins 4.x.

terraform {
  required_version = ">= 1.6.0"

  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 5.0"
    }
  }
}

provider "azurerm" {
  subscription_id = var.subscription_id

  # The evidence account rejects shared keys, so Terraform must use Entra ID for blob operations.
  storage_use_azuread = true

  features {}
}
