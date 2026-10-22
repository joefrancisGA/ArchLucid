resource "azuread_group" "helpdesk_tier2" {
  display_name       = "helpdesk-tier2"
  security_enabled   = true
  assignable_to_role = true
  members            = [azuread_user.helpdesk_07.object_id]
}

resource "azuread_directory_role" "application_administrator" {
  display_name = "Application Administrator"
}

resource "azuread_directory_role_assignment" "helpdesk_tier2_app_admin" {
  role_id             = azuread_directory_role.application_administrator.template_id
  principal_object_id = azuread_group.helpdesk_tier2.object_id
  directory_scope_id  = "/"
}
