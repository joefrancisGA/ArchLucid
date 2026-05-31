output "resource_group_name" {
  value       = azurerm_resource_group.prod.name
  description = "Hosted production resource group."
}

output "openai_endpoint" {
  value = var.openai_compose_mode == "create"
    ? azurerm_cognitive_account.openai[0].endpoint
    : null
  description = "Maps to AzureOpenAI:Endpoint when created by this root."
}

output "openai_account_id" {
  value = var.openai_compose_mode == "create"
    ? azurerm_cognitive_account.openai[0].id
    : var.openai_existing_resource_id
  description = "Azure OpenAI resource id (created or BYO)."
}

output "search_endpoint" {
  value = var.search_compose_mode == "create"
    ? "https://${azurerm_search_service.search[0].name}.search.windows.net"
    : null
  description = "Maps to Retrieval:AzureSearch:Endpoint when created by this root."
}

output "search_service_id" {
  value = var.search_compose_mode == "create"
    ? azurerm_search_service.search[0].id
    : var.search_existing_resource_id
  description = "Azure AI Search resource id (created or BYO)."
}

output "key_vault_uri" {
  value       = var.key_vault_name != null ? data.azurerm_key_vault.existing[0].vault_uri : null
  description = "Maps to KeyVault:VaultUri when key_vault_name is set."
}

output "openai_private_endpoint_id" {
  value = var.openai_compose_mode == "create" && var.enable_private_endpoints
    ? azurerm_private_endpoint.openai[0].id
    : null
  description = "Private endpoint id for Azure OpenAI when created with private connectivity."
}

output "search_private_endpoint_id" {
  value = var.search_compose_mode == "create" && var.enable_private_endpoints
    ? azurerm_private_endpoint.search[0].id
    : null
  description = "Private endpoint id for Azure AI Search when created with private connectivity."
}

output "key_vault_private_endpoint_id" {
  value = var.key_vault_name != null && var.enable_private_endpoints
    ? azurerm_private_endpoint.key_vault[0].id
    : null
  description = "Private endpoint id for Key Vault when referenced with private connectivity."
}

output "tenant_id" {
  value       = data.azurerm_client_config.current.tenant_id
  description = "Deployment tenant id for RBAC assignments."
}

output "openai_chat_deployment_name" {
  value = var.openai_compose_mode == "create" && var.openai_enable_chat_deployment
    ? azurerm_cognitive_deployment.chat[0].name
    : null
  description = "Azure OpenAI chat deployment name when created by this root."
}

output "openai_embedding_deployment_name" {
  value = var.openai_compose_mode == "create" && var.openai_enable_embedding_deployment
    ? azurerm_cognitive_deployment.embedding[0].name
    : null
  description = "Azure OpenAI embedding deployment name when created by this root."
}
