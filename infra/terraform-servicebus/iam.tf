resource "azurerm_role_assignment" "api_servicebus_sender" {
  count = trimspace(var.api_managed_identity_principal_id) != "" ? 1 : 0

  scope                = azurerm_servicebus_namespace.integration.id
  role_definition_name = "Azure Service Bus Data Sender"
  principal_id         = var.api_managed_identity_principal_id
}

resource "azurerm_role_assignment" "worker_servicebus_sender" {
  count = trimspace(var.worker_managed_identity_principal_id) != "" ? 1 : 0

  scope                = azurerm_servicebus_namespace.integration.id
  role_definition_name = "Azure Service Bus Data Sender"
  principal_id         = var.worker_managed_identity_principal_id
}

resource "azurerm_role_assignment" "worker_servicebus_receiver" {
  count = trimspace(var.worker_managed_identity_principal_id) != "" ? 1 : 0

  scope                = azurerm_servicebus_namespace.integration.id
  role_definition_name = "Azure Service Bus Data Receiver"
  principal_id         = var.worker_managed_identity_principal_id
}

resource "azurerm_role_assignment" "governance_logic_app_servicebus_receiver" {
  count = var.enable_logic_app_governance_approval_subscription && trimspace(var.governance_logic_app_managed_identity_principal_id) != "" ? 1 : 0

  scope                = azurerm_servicebus_namespace.integration.id
  role_definition_name = "Azure Service Bus Data Receiver"
  principal_id         = var.governance_logic_app_managed_identity_principal_id
}

resource "azurerm_role_assignment" "trial_lifecycle_logic_app_servicebus_receiver" {
  count = var.enable_logic_app_trial_lifecycle_email_subscription && trimspace(var.trial_lifecycle_logic_app_managed_identity_principal_id) != "" ? 1 : 0

  scope                = azurerm_servicebus_namespace.integration.id
  role_definition_name = "Azure Service Bus Data Receiver"
  principal_id         = var.trial_lifecycle_logic_app_managed_identity_principal_id
}

resource "azurerm_role_assignment" "incident_chatops_logic_app_servicebus_receiver" {
  count = var.enable_logic_app_incident_chatops_subscription && trimspace(var.incident_chatops_logic_app_managed_identity_principal_id) != "" ? 1 : 0

  scope                = azurerm_servicebus_namespace.integration.id
  role_definition_name = "Azure Service Bus Data Receiver"
  principal_id         = var.incident_chatops_logic_app_managed_identity_principal_id
}

resource "azurerm_role_assignment" "promotion_customer_notify_logic_app_servicebus_receiver" {
  count = var.enable_logic_app_promotion_prod_customer_subscription && trimspace(var.promotion_customer_notify_logic_app_managed_identity_principal_id) != "" ? 1 : 0

  scope                = azurerm_servicebus_namespace.integration.id
  role_definition_name = "Azure Service Bus Data Receiver"
  principal_id         = var.promotion_customer_notify_logic_app_managed_identity_principal_id
}

resource "azurerm_role_assignment" "marketplace_fulfillment_logic_app_servicebus_receiver" {
  count = var.enable_logic_app_marketplace_fulfillment_subscription && trimspace(var.marketplace_fulfillment_logic_app_managed_identity_principal_id) != "" ? 1 : 0

  scope                = azurerm_servicebus_namespace.integration.id
  role_definition_name = "Azure Service Bus Data Receiver"
  principal_id         = var.marketplace_fulfillment_logic_app_managed_identity_principal_id
}
