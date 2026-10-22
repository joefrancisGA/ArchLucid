output "content_safety_endpoint" {
  value       = length(local.content_safety_endpoint_effective) > 0 ? local.content_safety_endpoint_effective : null
  description = "Maps to ArchLucid:ContentSafety:Endpoint (created or consumed)."
}

output "content_safety_account_id" {
  value       = length(local.content_safety_account_id_effective) > 0 ? local.content_safety_account_id_effective : null
  description = "Azure AI Content Safety resource id (created or consumed)."
}

output "content_safety_location" {
  value       = local.content_safety_location_effective
  description = "Azure region of the Content Safety account (validated against content_safety_expected_location when consumed)."
}

output "azure_content_safety_container_app_env" {
  value = length(local.content_safety_endpoint_effective) > 0 ? {
    ArchLucid__ContentSafety__Enabled  = "true"
    ArchLucid__ContentSafety__Endpoint = local.content_safety_endpoint_effective
  } : {}
  description = "Non-secret Container Apps env keys for production-like Content Safety (ApiKey remains a Key Vault secret reference)."
}

output "content_safety_private_endpoint_id" {
  value       = var.content_safety_compose_mode == "create" && var.enable_private_endpoints ? try(azurerm_private_endpoint.content_safety[0].id, null) : null
  description = "Private endpoint id for Content Safety when created with private connectivity."
}
