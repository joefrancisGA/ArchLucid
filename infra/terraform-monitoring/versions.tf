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
