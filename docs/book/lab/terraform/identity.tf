# Entra side of the payments paths (Chapters 1, 4, 9, 10).

resource "random_password" "user" {
  for_each = toset(["dev-lead", "helpdesk-07", "analyst-04"])

  length           = 24
  special          = true
  override_special = "!#%*-_=+"
}

resource "azuread_user" "dev_lead" {
  user_principal_name   = "dev-lead@${local.domain}"
  display_name          = "dev-lead"
  password              = random_password.user["dev-lead"].result
  force_password_change = true
}

resource "azuread_user" "helpdesk_07" {
  user_principal_name   = "helpdesk-07@${local.domain}"
  display_name          = "helpdesk-07"
  password              = random_password.user["helpdesk-07"].result
  force_password_change = true
}

# The "fourth user" from Chapter 4 Step 3. The reader adds its Reader assignment during the lab.
resource "azuread_user" "analyst_04" {
  user_principal_name   = "analyst-04@${local.domain}"
  display_name          = "analyst-04"
  password              = random_password.user["analyst-04"].result
  force_password_change = true
}

# Chapter 9's change refers to the user through a data source, as it would in an estate where users aren't managed here.
data "azuread_user" "dev_lead" {
  object_id = azuread_user.dev_lead.object_id
}

resource "azuread_application_registration" "payments_deploy" {
  display_name     = "payments-deploy"
  sign_in_audience = "AzureADMyOrg"
}

resource "azuread_service_principal" "payments_deploy" {
  client_id = azuread_application_registration.payments_deploy.client_id
}

# Path entry for P1 and P4 (hop H1).
resource "azuread_application_federated_identity_credential" "payments_deploy_github" {
  application_id = azuread_application_registration.payments_deploy.id
  display_name   = "github-payments"
  audiences      = ["api://AzureADTokenExchange"]
  issuer         = "https://token.actions.githubusercontent.com"
  subject        = local.github_subject
}

# The identity running Terraform plays "the platform automation identity" that stays an owner after Chapter 9.
resource "azuread_application_owner" "payments_deploy_platform" {
  application_id  = azuread_application_registration.payments_deploy.id
  owner_object_id = data.azuread_client_config.current.object_id
}

# Path entry for P2 and P5 (hop H2). Chapter 9 deletes this resource.
resource "azuread_application_owner" "payments_deploy_dev_lead" {
  application_id  = azuread_application_registration.payments_deploy.id
  owner_object_id = data.azuread_user.dev_lead.object_id
}

# Activates the built-in role in the tenant if it isn't already.
resource "azuread_directory_role" "cloud_application_administrator" {
  display_name = "Cloud Application Administrator"
}

# Path entry for P3 and P6 (hop H3). Tenant scope ("/") is what lets it fan out to every app.
resource "azuread_directory_role_assignment" "helpdesk_07_cloud_app_admin" {
  role_id             = azuread_directory_role.cloud_application_administrator.template_id
  principal_object_id = azuread_user.helpdesk_07.object_id
  directory_scope_id  = "/"
}

# Hygiene: a guest that never redeemed its invitation, so it has no sign-in at all.
resource "azuread_invitation" "stale_guest" {
  user_email_address = var.guest_email
  user_display_name  = "Former contractor (lab guest)"
  redirect_url       = "https://myapps.microsoft.com"
}

# Decoys for Chapter 1: Contributor on non-production groups, with no path to customer data.
resource "azuread_application_registration" "decoy" {
  for_each = toset(["batch-dev", "reports-test"])

  display_name     = each.key
  sign_in_audience = "AzureADMyOrg"
}

resource "azuread_service_principal" "decoy" {
  for_each = azuread_application_registration.decoy

  client_id = each.value.client_id
}
