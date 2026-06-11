resource "azurerm_private_endpoint" "key_vault" {
  count = var.key_vault_name != null && var.enable_private_endpoints ? 1 : 0

  name                = "${var.key_vault_name}-pe"
  location            = var.location
  resource_group_name = coalesce(var.key_vault_resource_group_name, azurerm_resource_group.prod.name)
  subnet_id           = var.private_endpoint_subnet_id
  tags                = var.tags

  private_service_connection {
    name                           = "keyvault-psc"
    private_connection_resource_id = data.azurerm_key_vault.existing[0].id
    subresource_names              = ["vault"]
    is_manual_connection           = false
  }
}

resource "azurerm_role_assignment" "key_vault_secrets_user" {
  for_each = var.key_vault_name != null ? toset(local.workload_principal_ids_unified) : toset([])

  scope                = data.azurerm_key_vault.existing[0].id
  role_definition_name = "Key Vault Secrets User"
  principal_id         = each.value
}
