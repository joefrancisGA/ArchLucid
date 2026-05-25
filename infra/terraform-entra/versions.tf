# Terraform provider constraints for this root module.
# required_providers.source: registry namespace (hashicorp/azurerm) â€” plugin downloaded at terraform init.
# required_providers.version: semver constraint on provider releases.
# required_version: minimum Terraform CLI (check {} blocks require >= 1.5.0).
terraform {
  required_version = ">= 1.5.0"

  required_providers {
    azuread = {
      source  = "hashicorp/azuread"
      version = ">= 2.47.0, < 3.0.0"
    }
    random = {
      source  = "hashicorp/random"
      version = ">= 3.6.0, < 4.0.0"
    }
  }
}
