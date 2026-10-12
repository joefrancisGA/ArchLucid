resource "azurerm_role_assignment" "analyst_04_reader" {
  scope                = azurerm_resource_group.payments_prod.id
  role_definition_name = "Reader"
  principal_id         = azuread_user.analyst_04.object_id
  principal_type       = "User"
}
