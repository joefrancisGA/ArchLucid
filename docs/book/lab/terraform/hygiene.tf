# Chapter 1's decoys and hygiene items. None of them leads to customer data.

# Same finding as custdata's shared key, with no path to anything important.
resource "azurerm_storage_account" "sandbox" {
  for_each = toset(["1", "2", "3"])

  name                            = "sbx${each.key}${local.suffix}"
  resource_group_name             = azurerm_resource_group.sandbox.name
  location                        = azurerm_resource_group.sandbox.location
  account_tier                    = "Standard"
  account_replication_type        = "LRS"
  shared_access_key_enabled       = true
  allow_nested_items_to_be_public = true
}

resource "azurerm_key_vault" "sandbox" {
  for_each = toset(["1", "2"])

  name                       = "kvsbx${each.key}${local.suffix}"
  resource_group_name        = azurerm_resource_group.sandbox.name
  location                   = azurerm_resource_group.sandbox.location
  tenant_id                  = data.azuread_client_config.current.tenant_id
  sku_name                   = "standard"
  rbac_authorization_enabled = true
  soft_delete_retention_days = 7
  purge_protection_enabled   = false
}

resource "azurerm_role_assignment" "decoy_contributor" {
  for_each = {
    batch-dev    = azurerm_resource_group.dev.id
    reports-test = azurerm_resource_group.sandbox.id
  }

  scope                = each.value
  role_definition_name = "Contributor"
  principal_id         = azuread_service_principal.decoy[each.key].object_id
  principal_type       = "ServicePrincipal"
}
