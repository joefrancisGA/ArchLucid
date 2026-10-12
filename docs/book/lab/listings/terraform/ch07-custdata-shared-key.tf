resource "azurerm_storage_account" "custdata" {
  # ...existing configuration...

  # Disables account-key and SAS-based access; callers must use Entra ID.
  shared_access_key_enabled = false
}
