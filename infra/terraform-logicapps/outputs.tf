output "logic_app_id" {
  description = "Resource ID of the Logic App (Standard) when deployed."
  value       = try(azurerm_logic_app_standard.edge[0].id, null)
}

output "logic_app_principal_id" {
  description = "System-assigned managed identity principal ID (for Service Bus RBAC) when deployed."
  value       = try(azurerm_logic_app_standard.edge[0].identity[0].principal_id, null)
}

output "logic_storage_account_id" {
  description = "Backing storage account ID when deployed."
  value       = try(azurerm_storage_account.logic[0].id, null)
}

output "governance_logic_app_id" {
  description = "Resource ID of the governance approval Logic App (Standard) when deployed."
  value       = try(azurerm_logic_app_standard.governance_approval[0].id, null)
}

output "governance_logic_app_principal_id" {
  description = "System-assigned managed identity principal ID for the governance Logic App (use as governance_logic_app_managed_identity_principal_id in terraform-servicebus)."
  value       = try(azurerm_logic_app_standard.governance_approval[0].identity[0].principal_id, null)
}

output "governance_logic_storage_account_id" {
  description = "Backing storage account ID for the governance Logic App when deployed."
  value       = try(azurerm_storage_account.logic_governance[0].id, null)
}

output "marketplace_fulfillment_logic_app_id" {
  description = "Resource ID of the Marketplace fulfillment Logic App (Standard) when deployed."
  value       = try(azurerm_logic_app_standard.marketplace_fulfillment[0].id, null)
}

output "marketplace_fulfillment_logic_app_principal_id" {
  description = "System-assigned managed identity principal ID for the Marketplace fulfillment Logic App (use as marketplace_fulfillment_logic_app_managed_identity_principal_id in terraform-servicebus)."
  value       = try(azurerm_logic_app_standard.marketplace_fulfillment[0].identity[0].principal_id, null)
}

output "marketplace_fulfillment_logic_storage_account_id" {
  description = "Backing storage account ID for the Marketplace fulfillment Logic App when deployed."
  value       = try(azurerm_storage_account.logic_marketplace_fulfillment[0].id, null)
}

output "trial_lifecycle_logic_app_id" {
  description = "Resource ID of the trial lifecycle Logic App (Standard) when deployed."
  value       = try(azurerm_logic_app_standard.trial_lifecycle[0].id, null)
}

output "trial_lifecycle_logic_app_principal_id" {
  description = "System-assigned managed identity principal ID for the trial lifecycle Logic App (use as trial_lifecycle_logic_app_managed_identity_principal_id in terraform-servicebus)."
  value       = try(azurerm_logic_app_standard.trial_lifecycle[0].identity[0].principal_id, null)
}

output "trial_lifecycle_logic_storage_account_id" {
  description = "Backing storage account ID for the trial lifecycle Logic App when deployed."
  value       = try(azurerm_storage_account.logic_trial_lifecycle[0].id, null)
}

output "incident_chatops_logic_app_id" {
  description = "Resource ID of the incident ChatOps Logic App (Standard) when deployed."
  value       = try(azurerm_logic_app_standard.incident_chatops[0].id, null)
}

output "incident_chatops_logic_app_principal_id" {
  description = "System-assigned managed identity principal ID for the incident ChatOps Logic App (use as incident_chatops_logic_app_managed_identity_principal_id in terraform-servicebus)."
  value       = try(azurerm_logic_app_standard.incident_chatops[0].identity[0].principal_id, null)
}

output "incident_chatops_logic_storage_account_id" {
  description = "Backing storage account ID for the incident ChatOps Logic App when deployed."
  value       = try(azurerm_storage_account.logic_incident_chatops[0].id, null)
}

output "promotion_customer_notify_logic_app_id" {
  description = "Resource ID of the promotion customer-notify Logic App (Standard) when deployed."
  value       = try(azurerm_logic_app_standard.promotion_customer_notify[0].id, null)
}

output "promotion_customer_notify_logic_app_principal_id" {
  description = "System-assigned managed identity principal ID for the promotion customer-notify Logic App (use as promotion_customer_notify_logic_app_managed_identity_principal_id in terraform-servicebus)."
  value       = try(azurerm_logic_app_standard.promotion_customer_notify[0].identity[0].principal_id, null)
}

output "promotion_customer_notify_logic_storage_account_id" {
  description = "Backing storage account ID for the promotion customer-notify Logic App when deployed."
  value       = try(azurerm_storage_account.logic_promotion_customer_notify[0].id, null)
}

output "teams_notifications_logic_app_id" {
  description = "Resource ID of the Teams notifications Logic App (Standard) when deployed."
  value       = try(azurerm_logic_app_standard.teams_notifications[0].id, null)
}

output "teams_notifications_logic_app_principal_id" {
  description = "System-assigned managed identity principal ID for the Teams notifications Logic App (use as teams_notifications_logic_app_managed_identity_principal_id in terraform-servicebus)."
  value       = try(azurerm_logic_app_standard.teams_notifications[0].identity[0].principal_id, null)
}

output "teams_notifications_logic_storage_account_id" {
  description = "Backing storage account ID for the Teams notifications Logic App when deployed."
  value       = try(azurerm_storage_account.logic_teams_notifications[0].id, null)
}
