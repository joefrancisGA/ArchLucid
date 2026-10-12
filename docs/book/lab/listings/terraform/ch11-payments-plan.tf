# 1. Remove dev-lead as an owner of the payments-deploy app registration.
#    Delete the owner resource; ownership remains with the platform automation identity.
# resource "azuread_application_owner" "payments_deploy_dev_lead" {
#   application_id  = azuread_application_registration.payments_deploy.id
#   owner_object_id = data.azuread_user.dev_lead.object_id
# }

# 2. Replace the tenant-wide directory role with a scoped one for the help desk.
#    (Delete the Cloud Application Administrator assignment; add the narrower role
#    the help desk actually needs, agreed with the identity team.)

# 3. Disable shared key access on custdata, and deny re-enabling it.
resource "azurerm_storage_account" "custdata" {
  # ...existing configuration...
  shared_access_key_enabled = false
}

resource "azurerm_resource_group_policy_assignment" "deny_storage_shared_key" {
  name                 = "deny-storage-shared-key"
  resource_group_id    = azurerm_resource_group.payments_prod.id
  policy_definition_id = var.builtin_policy_storage_prevent_shared_key_id
  parameters           = jsonencode({ effect = { value = "Deny" } })
}
