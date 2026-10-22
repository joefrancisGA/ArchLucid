# Terraform provider constraints for this root module.
# required_providers.source: registry namespace (hashicorp/azurerm) â€” plugin downloaded at terraform init.
# required_providers.version: semver constraint on provider releases.
# required_version: minimum Terraform CLI (check {} blocks require >= 1.5.0).
terraform {
  required_version = ">= 1.5.0"
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = ">= 3.90.0"
    }
  }
}
