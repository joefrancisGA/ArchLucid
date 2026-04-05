provider "azurerm" {
  features {}
}

# Used only when count > 0 on grafana_* resources. Defaults keep terraform validate green in CI.
provider "grafana" {
  url  = var.grafana_url
  auth = var.grafana_auth
}
