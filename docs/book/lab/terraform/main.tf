data "azuread_client_config" "current" {}

data "azuread_domains" "initial" {
  only_initial = true
}

# Storage account and app names are global, so every lab gets a short random suffix.
resource "random_string" "suffix" {
  length  = 5
  upper   = false
  special = false
}

locals {
  suffix = random_string.suffix.result
  domain = data.azuread_domains.initial.domains[0].domain_name

  # Subject format matches Chapter 3: repo:<owner>/<repo>:<trust>.
  github_subject = "repo:${var.github_repository}:${var.github_trust}"
}

resource "azurerm_resource_group" "payments_prod" {
  name     = "rg-payments-prod"
  location = var.location
}

# Functions runtime storage lives outside rg-payments-prod, so the payments group holds only what the book describes.
resource "azurerm_resource_group" "payments_runtime" {
  name     = "rg-payments-runtime"
  location = var.location
}

# custarchive lives outside rg-payments-prod too. Contributor there can list storage keys, so an archive in that
# group would be readable directly and add three paths the book doesn't count; P4 to P6 reach it only through
# mi-pay-reconcile's data role.
resource "azurerm_resource_group" "payments_archive" {
  name     = "rg-payments-archive"
  location = var.location
}

resource "azurerm_resource_group" "network" {
  name     = "rg-network"
  location = var.location
}

resource "azurerm_resource_group" "dev" {
  name     = "rg-dev"
  location = var.location
}

resource "azurerm_resource_group" "sandbox" {
  name     = "rg-sandbox"
  location = var.location
}

resource "azurerm_resource_group" "security_tooling" {
  name     = "rg-security-tooling"
  location = var.location
}
