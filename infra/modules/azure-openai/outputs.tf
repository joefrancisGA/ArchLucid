output "endpoint" {
  description = "Azure OpenAI endpoint URL for AzureOpenAI:Endpoint."
  value       = azurerm_cognitive_account.openai.endpoint
}

output "deployment_name" {
  description = "Default deployment name for ArchLucid agent runtime."
  value       = azurerm_cognitive_deployment.default.name
}

output "app_settings" {
  description = "Container Apps / App Service setting keys (no secrets)."
  value = {
    "AzureOpenAI__Endpoint"   = azurerm_cognitive_account.openai.endpoint
    "AzureOpenAI__Deployment" = azurerm_cognitive_deployment.default.name
  }
}