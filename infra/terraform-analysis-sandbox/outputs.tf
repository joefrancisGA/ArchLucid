output "resource_group_name" {
  value       = azurerm_resource_group.main.name
  description = "Sandbox resource group — delete this group after terraform destroy if anything remains."
}

output "sandbox_id" {
  value       = local.suffix
  description = "Random suffix baked into globally unique names."
}

output "container_app_api_fqdn" {
  value       = "https://${azurerm_container_app.api.ingress[0].fqdn}"
  description = "Public API ingress (placeholder image)."
}

output "container_app_ui_fqdn" {
  value       = "https://${azurerm_container_app.ui.ingress[0].fqdn}"
  description = "Public operator UI ingress (placeholder image)."
}

output "sql_server_fqdn" {
  value       = "${azurerm_mssql_server.main.name}.database.windows.net"
  description = "Logical SQL server hostname for connection-string inventory edges."
}

output "storage_blob_endpoint" {
  value       = local.blob_service_uri
  description = "Primary blob endpoint wired into Container App env vars."
}

output "key_vault_uri" {
  value       = azurerm_key_vault.main.vault_uri
  description = "Key Vault URI wired into Container App env vars."
}

output "data_factory_name" {
  value       = var.enable_data_factory ? azurerm_data_factory.main[0].name : null
  description = "ADF factory name when enable_data_factory is true."
}

output "inventory_capture_hint" {
  value = <<-EOT
    After apply, run the Azure inventory extractor against subscription ${data.azurerm_client_config.current.subscription_id}
    (resource group ${azurerm_resource_group.main.name}). Expect Container Apps, SQL, Storage, Key Vault,
    RBAC assignments, and${var.enable_data_factory ? " ADF linked services + pipeline flows" : ""}${var.enable_service_bus ? ", Service Bus" : ""}${var.enable_event_grid ? ", Event Grid" : ""}.
    Tear down with: terraform destroy (see README.md).
  EOT
  description = "Next step for SecureNow / diagram analysis."
}

output "estimated_monthly_cost_usd_idle" {
  value       = var.enable_service_bus ? "~45-90" : "~35-75"
  description = "Order-of-magnitude idle/low-use USD/month in centralus — see COST_ESTIMATE.md."
}
