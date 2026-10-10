# Companion lab for "Managing Azure Security with AI" (Appendix A).
# DELIBERATELY VULNERABLE. Deploy only into a tenant and subscription you own and use for nothing else.

terraform {
  required_version = ">= 1.6.0"

  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 4.0"
    }
    azuread = {
      source  = "hashicorp/azuread"
      version = "~> 3.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.6"
    }
  }
}

provider "azurerm" {
  subscription_id = var.subscription_id

  features {
    key_vault {
      # The sandbox vaults have no purge protection on purpose, so destroy can purge them.
      purge_soft_delete_on_destroy = true
    }

    resource_group {
      prevent_deletion_if_contains_resources = false
    }
  }
}

provider "azuread" {}
