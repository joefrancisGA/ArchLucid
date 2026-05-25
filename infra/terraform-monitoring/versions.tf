# Terraform provider constraints for this root module.
# required_providers.source: registry namespace (hashicorp/azurerm) â€” plugin downloaded at terraform init.
# required_providers.version: semver constraint on provider releases.
# required_version: minimum Terraform CLI (check {} blocks require >= 1.5.0).
terraform {
  required_version = ">= 1.5.0"

  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = ">= 3.100.0, < 5.0.0"
    }
    grafana = {
      source  = "grafana/grafana"
      version = ">= 3.0.0, < 4.0.0"
    }
  }
}
