# Chapter 3's collector identity: Reader on the subscription, four read-only Graph application permissions, no secrets.

resource "azurerm_user_assigned_identity" "collector" {
  name                = "mi-security-collector"
  resource_group_name = azurerm_resource_group.security_tooling.name
  location            = azurerm_resource_group.security_tooling.location
}

resource "azurerm_role_assignment" "collector_reader" {
  scope                = "/subscriptions/${var.subscription_id}"
  role_definition_name = "Reader"
  principal_id         = azurerm_user_assigned_identity.collector.principal_id
  principal_type       = "ServicePrincipal"
}

data "azuread_application_published_app_ids" "well_known" {}

data "azuread_service_principal" "msgraph" {
  client_id = data.azuread_application_published_app_ids.well_known.result["MicrosoftGraph"]
}

# Granting application permissions this way is admin consent, so the deploying identity needs a role that can grant it.
resource "azuread_app_role_assignment" "collector_graph" {
  for_each = toset([
    "Application.Read.All",
    "GroupMember.Read.All",
    "User.Read.All",
    "RoleManagement.Read.Directory",
  ])

  app_role_id         = data.azuread_service_principal.msgraph.app_role_ids[each.key]
  principal_object_id = azurerm_user_assigned_identity.collector.principal_id
  resource_object_id  = data.azuread_service_principal.msgraph.object_id
}

# A place for the collector to run with its identity. Import Az.ResourceGraph and Microsoft.Graph, then add Chapter 3's script as a runbook.
resource "azurerm_automation_account" "collector" {
  name                = "aa-security-collector"
  resource_group_name = azurerm_resource_group.security_tooling.name
  location            = azurerm_resource_group.security_tooling.location
  sku_name            = "Basic"

  identity {
    type         = "UserAssigned"
    identity_ids = [azurerm_user_assigned_identity.collector.id]
  }
}

# Destination for the diagnostic settings that Chapters 5 and 6 add.
resource "azurerm_log_analytics_workspace" "lab" {
  name                = "law-lab-${local.suffix}"
  resource_group_name = azurerm_resource_group.security_tooling.name
  location            = azurerm_resource_group.security_tooling.location
  sku                 = "PerGB2018"
  retention_in_days   = 30
}
