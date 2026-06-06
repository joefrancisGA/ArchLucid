output "resource_group_name" {
  value       = azurerm_resource_group.prod.name
  description = "Hosted production resource group."
}

output "key_vault_uri" {
  value       = var.key_vault_name != null ? data.azurerm_key_vault.existing[0].vault_uri : null
  description = "Maps to KeyVault:VaultUri when key_vault_name is set."
}

output "openai_private_endpoint_id" {
  value       = var.openai_compose_mode == "create" && var.enable_private_endpoints ? azurerm_private_endpoint.openai[0].id : null
  description = "Private endpoint id for Azure OpenAI when created with private connectivity."
}

output "key_vault_private_endpoint_id" {
  value       = var.key_vault_name != null && var.enable_private_endpoints ? azurerm_private_endpoint.key_vault[0].id : null
  description = "Private endpoint id for Key Vault when referenced with private connectivity."
}

output "tenant_id" {
  value       = data.azurerm_client_config.current.tenant_id
  description = "Deployment tenant id for RBAC assignments."
}
