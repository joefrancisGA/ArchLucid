# Scaffolding so Chapter 13's tooling module (main.tf, printed in section 13.9) validates on its own.
# It pins azurerm 5.x, like the companion lab.

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

  # azurerm 5.x registers no resource providers by default.
  resource_providers_to_register = [
    "Microsoft.CognitiveServices",
    "Microsoft.ManagedIdentity",
    "Microsoft.Network",
    "Microsoft.Storage",
  ]

  features {}
}
