output "openai_endpoint" {
  value       = length(local.openai_endpoint_effective) > 0 ? local.openai_endpoint_effective : null
  description = "Maps to AzureOpenAI:Endpoint (created or consumed)."
}

output "openai_account_id" {
  value       = length(local.openai_account_id_effective) > 0 ? local.openai_account_id_effective : null
  description = "Azure OpenAI resource id (created or consumed)."
}

output "openai_location" {
  value       = local.openai_location_effective
  description = "Azure region of the OpenAI account (validated against openai_expected_location when consumed)."
}

output "openai_chat_deployment_name" {
  value       = length(local.openai_chat_deployment_effective) > 0 ? local.openai_chat_deployment_effective : null
  description = "Maps to AzureOpenAI:DeploymentName (Standard / Terra)."
}

output "openai_economy_deployment_name" {
  value       = length(local.openai_economy_deployment_effective) > 0 ? local.openai_economy_deployment_effective : null
  description = "Maps to ArchLucid:AgentModelTiers:EconomyDeploymentName (Luna)."
}

output "openai_premium_deployment_name" {
  value       = length(local.openai_premium_deployment_effective) > 0 ? local.openai_premium_deployment_effective : null
  description = "Maps to ArchLucid:AgentModelTiers:PremiumDeploymentName (Sol)."
}

output "openai_embedding_deployment_name" {
  value       = length(local.openai_embedding_deployment_effective) > 0 ? local.openai_embedding_deployment_effective : null
  description = "Maps to AzureOpenAI:EmbeddingDeploymentName."
}

output "azure_openai_container_app_env" {
  value = length(local.openai_endpoint_effective) > 0 ? merge(
    {
      AzureOpenAI__AuthenticationMode      = "ManagedIdentity"
      AzureOpenAI__Endpoint                = local.openai_endpoint_effective
      AzureOpenAI__DeploymentName          = local.openai_chat_deployment_effective
      AzureOpenAI__EmbeddingDeploymentName = local.openai_embedding_deployment_effective
      ArchLucid__AgentModelTiers__StandardDeploymentName = local.openai_chat_deployment_effective
    },
    length(local.openai_economy_deployment_effective) > 0 ? {
      ArchLucid__AgentModelTiers__EconomyDeploymentName = local.openai_economy_deployment_effective
    } : {},
    length(local.openai_premium_deployment_effective) > 0 ? {
      ArchLucid__AgentModelTiers__PremiumDeploymentName = local.openai_premium_deployment_effective
    } : {}
  ) : {}
  description = "Non-secret Container Apps env keys for TB-080 managed-identity OpenAI (copy into terraform-container-apps or app settings)."
}
