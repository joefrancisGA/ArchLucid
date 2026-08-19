output "endpoint" {
  description = "Azure OpenAI endpoint URL for AzureOpenAI:Endpoint."
  value       = azurerm_cognitive_account.openai.endpoint
}

output "deployment_name" {
  description = "Default (Terra / Standard) deployment name for ArchLucid agent runtime."
  value       = azurerm_cognitive_deployment.default.name
}

output "economy_deployment_name" {
  description = "Economy (Luna) deployment name when provisioned."
  value       = var.enable_economy_deployment ? azurerm_cognitive_deployment.economy[0].name : null
}

output "premium_deployment_name" {
  description = "Premium (Sol) deployment name when provisioned."
  value       = var.enable_premium_deployment ? azurerm_cognitive_deployment.premium[0].name : null
}

output "app_settings" {
  description = "Container Apps / App Service setting keys (no secrets)."
  value = merge(
    {
      "AzureOpenAI__Endpoint"       = azurerm_cognitive_account.openai.endpoint
      "AzureOpenAI__DeploymentName" = azurerm_cognitive_deployment.default.name
    },
    var.enable_economy_deployment ? {
      "ArchLucid__AgentModelTiers__EconomyDeploymentName" = azurerm_cognitive_deployment.economy[0].name
    } : {},
    {
      "ArchLucid__AgentModelTiers__StandardDeploymentName" = azurerm_cognitive_deployment.default.name
    },
    var.enable_premium_deployment ? {
      "ArchLucid__AgentModelTiers__PremiumDeploymentName" = azurerm_cognitive_deployment.premium[0].name
    } : {}
  )
}
