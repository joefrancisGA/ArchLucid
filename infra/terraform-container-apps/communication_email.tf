# Azure Communication Services Email for transactional mail (OTP, invites, trial lifecycle).
# Custom domain (archlucid.net) + sender username (noreply) via azapi — azurerm has no senderUsernames resource.
# Container App Email:* env wiring stays CD-owned (lifecycle.ignore_changes on template env); Terraform creates
# the ACS account, domain link, RBAC for API/Worker managed identities, and outputs DNS verification records.
#
# Brownfield import examples:
#   terraform import 'azurerm_email_communication_service.communication_email[0]' \
#     /subscriptions/<sub>/resourceGroups/<rg>/providers/Microsoft.Communication/emailServices/<name>
#   terraform import 'azurerm_communication_service.communication_email[0]' \
#     /subscriptions/<sub>/resourceGroups/<rg>/providers/Microsoft.Communication/communicationServices/<name>

locals {
  communication_email_enabled = local.enabled && var.enable_communication_email_account

  communication_email_custom_domain = trimspace(var.communication_email_custom_domain_name)

  communication_email_sender_username = trimspace(var.communication_email_sender_username)

  communication_email_from_address = (
    local.communication_email_enabled &&
    length(local.communication_email_custom_domain) > 0 &&
    length(local.communication_email_sender_username) > 0
  ) ? "${local.communication_email_sender_username}@${local.communication_email_custom_domain}" : null
}

resource "azurerm_email_communication_service" "communication_email" {
  count = local.communication_email_enabled ? 1 : 0

  name                = var.communication_email_email_service_name
  resource_group_name = local.resource_group_name
  data_location       = var.communication_email_data_location
  tags                = local.merged_tags
}

resource "azurerm_email_communication_service_domain" "communication_email_custom" {
  count = local.communication_email_enabled && length(local.communication_email_custom_domain) > 0 ? 1 : 0

  name              = local.communication_email_custom_domain
  email_service_id  = azurerm_email_communication_service.communication_email[0].id
  domain_management = "CustomerManaged"
  tags              = local.merged_tags
}

resource "azurerm_communication_service" "communication_email" {
  count = local.communication_email_enabled ? 1 : 0

  name                = var.communication_email_communication_service_name
  resource_group_name = local.resource_group_name
  data_location       = var.communication_email_data_location
  tags                = local.merged_tags
}

resource "azurerm_communication_service_email_domain_association" "communication_email" {
  count = local.communication_email_enabled && length(local.communication_email_custom_domain) > 0 ? 1 : 0

  communication_service_id = azurerm_communication_service.communication_email[0].id
  email_service_domain_id  = azurerm_email_communication_service_domain.communication_email_custom[0].id
}

resource "azapi_resource" "communication_email_sender_username" {
  count = local.communication_email_enabled && local.communication_email_from_address != null ? 1 : 0

  type      = "Microsoft.Communication/emailServices/domains/senderUsernames@2023-04-01"
  name      = local.communication_email_sender_username
  parent_id = azurerm_email_communication_service_domain.communication_email_custom[0].id

  # azapi 2.x: body must be an HCL object, not a jsonencode() string.
  body = {
    properties = {
      displayName = var.communication_email_sender_display_name
      username    = local.communication_email_sender_username
    }
  }
}

# Run only after DNS verification records are published (set communication_email_initiate_domain_verification = true).
resource "azapi_resource_action" "communication_email_domain_verify" {
  count = local.communication_email_enabled && var.communication_email_initiate_domain_verification ? 1 : 0

  type        = "Microsoft.Communication/emailServices/domains@2023-04-01"
  resource_id = azurerm_email_communication_service_domain.communication_email_custom[0].id
  action      = "initiateVerification"

  # azapi 2.x: body must be an HCL object, not a jsonencode() string.
  body = {
    verificationType = "Domain"
  }
}

resource "azurerm_role_assignment" "api_communication_email_contributor" {
  count = local.communication_email_enabled ? 1 : 0

  scope                = azurerm_communication_service.communication_email[0].id
  role_definition_name = "Contributor"
  principal_id         = azurerm_container_app.api[0].identity[0].principal_id
}

resource "azurerm_role_assignment" "worker_communication_email_contributor" {
  count = local.communication_email_enabled ? 1 : 0

  scope                = azurerm_communication_service.communication_email[0].id
  role_definition_name = "Contributor"
  principal_id         = azurerm_container_app.worker[0].identity[0].principal_id
}
