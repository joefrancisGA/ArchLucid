output "resource_group_name" {
  description = "SecureNow resource group."
  value       = try(azurerm_resource_group.this[0].name, null)
}

output "virtual_network_id" {
  description = "Private SecureNow VNet."
  value       = try(azurerm_virtual_network.this[0].id, null)
}

output "storage_account_id" {
  description = "Private Blob account used for application artifacts and collection handoff."
  value       = module.storage.storage_account_id
}

output "collection_container_scope" {
  description = "Resource scope of the private securenow-collection container."
  value       = local.storage_container_scope
}

output "sql_server_id" {
  description = "Private SQL logical server."
  value       = try(module.sql[0].sql_server_id, null)
}

output "key_vault_id" {
  description = "Private Key Vault."
  value       = try(azurerm_key_vault.this[0].id, null)
}

output "api_identity_client_id" {
  description = "Client ID of the API user-assigned managed identity."
  value       = try(azurerm_user_assigned_identity.api[0].client_id, null)
}

output "worker_identity_client_id" {
  description = "Client ID of the Worker user-assigned managed identity."
  value       = try(azurerm_user_assigned_identity.worker[0].client_id, null)
}

output "collection_agent_identity_client_id" {
  description = "Client ID of the Azure Automation collection identity."
  value       = try(azurerm_user_assigned_identity.collection_agent[0].client_id, null)
}

output "automation_account_name" {
  description = "Automation account used by scheduled and on-demand collection."
  value       = try(azurerm_automation_account.collection[0].name, null)
}

output "collection_runbook_name" {
  description = "Runbook name configured into the on-demand trigger."
  value       = try(azurerm_automation_runbook.collection[0].name, null)
}

output "api_container_app_fqdn" {
  description = "Internal API FQDN when the Container Apps environment exposes one."
  value       = module.container_apps.api_container_app_fqdn
}

output "ui_container_app_fqdn" {
  description = "Internal UI FQDN when the Container Apps environment exposes one."
  value       = module.container_apps.ui_container_app_fqdn
}
