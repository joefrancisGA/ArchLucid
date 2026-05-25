# Terraform provider constraints for this root module.
# required_providers.source: registry namespace (hashicorp/azurerm) â€” plugin downloaded at terraform init.
# required_providers.version: semver constraint on provider releases.
# required_version: minimum Terraform CLI (check {} blocks require >= 1.5.0).
terraform {
  required_version = ">= 1.5.0"

  required_providers {
    azurerm = {
      source = "hashicorp/azurerm"
      # Provider 4.x removed `zone_redundant` on `azurerm_servicebus_namespace`; keep 3.x until the root is migrated.
      version = ">= 3.80.0, < 4.0.0"
    }
  }
}
