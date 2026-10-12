output "resource_group_name" {
  value       = azurerm_resource_group.this.name
  description = "Resource group for this in-tenant install."
}

output "virtual_network_id" {
  value       = module.private.virtual_network_id
  description = "VNet that hosts private endpoints and, when enabled, Container Apps."
}

output "sql_server_fqdn" {
  value       = module.sql.sql_server_fqdn
  description = "SQL server FQDN. Clients inside the VNet resolve it through the private DNS zone."
}

output "handoff_container_name" {
  value       = azurerm_storage_container.handoff.name
  description = "Blob container that receives securenow-collection/runs/{runId}/ objects."
}

output "collector_identity_principal_id" {
  value       = azurerm_user_assigned_identity.collector.principal_id
  description = "Principal id of the collection agent identity."
}

output "api_identity_principal_id" {
  value       = azurerm_user_assigned_identity.api.principal_id
  description = "Principal id of the API identity. It holds Automation Job Operator for Run now."
}

output "ui_application_client_id" {
  value       = azuread_application.ui.client_id
  description = "Entra application client id for the UI. No client secret is created."
}

output "private_ingress_enabled" {
  value       = var.enable_private_ingress
  description = "Whether the Container Apps environment and its internal load balancer were requested."
}
