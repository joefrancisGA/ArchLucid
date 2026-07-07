# TB-656 — user-assigned managed identities for API/Worker Key Vault access.
# Principal IDs exist before Container Apps apply, eliminating the TB-092 second pass.

locals {
  user_assigned_keyvault_workload_identities_enabled = local.enabled && var.enable_user_assigned_keyvault_workload_identities
}

resource "azurerm_user_assigned_identity" "api_keyvault" {
  count = local.user_assigned_keyvault_workload_identities_enabled ? 1 : 0

  location            = local.azure_location
  name                = var.api_keyvault_identity_name
  resource_group_name = local.resource_group_name
  tags                = var.tags
}

resource "azurerm_user_assigned_identity" "worker_keyvault" {
  count = local.user_assigned_keyvault_workload_identities_enabled ? 1 : 0

  location            = local.azure_location
  name                = var.worker_keyvault_identity_name
  resource_group_name = local.resource_group_name
  tags                = var.tags
}
