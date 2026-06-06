output "search_endpoint" {
  value       = length(local.search_endpoint_effective) > 0 ? local.search_endpoint_effective : null
  description = "Maps to Retrieval:AzureSearch:Endpoint (created or consumed)."
}

output "search_service_id" {
  value       = length(local.search_service_id_effective) > 0 ? local.search_service_id_effective : null
  description = "Azure AI Search resource id — pass to terraform-private search_service_id when private networking is enabled."
}

output "search_location" {
  value       = var.location
  description = "Azure region of the Search service (validated against search_expected_location when consumed)."
}

output "search_index_name" {
  value       = length(local.search_index_name_effective) > 0 ? local.search_index_name_effective : null
  description = "Maps to Retrieval:AzureSearch:IndexName."
}

output "search_semantic_configuration_name" {
  value       = length(local.search_semantic_configuration_effective) > 0 ? local.search_semantic_configuration_effective : null
  description = "Maps to Retrieval:Reranking semantic configuration when AzureAiSearchSemantic reranking is enabled."
}

output "azure_search_container_app_env" {
  value = length(local.search_endpoint_effective) > 0 && length(local.search_index_name_effective) > 0 ? {
    Retrieval__VectorIndex                      = "AzureSearch"
    Retrieval__AzureSearch__Endpoint            = local.search_endpoint_effective
    Retrieval__AzureSearch__IndexName           = local.search_index_name_effective
    Retrieval__Reranking__Provider              = "AzureAiSearchSemantic"
  } : {}
  description = "Non-secret Container Apps env keys for production-like Azure AI Search (copy into terraform-container-apps)."
}

output "search_private_endpoint_id" {
  value       = var.enable_private_endpoints && length(local.search_service_id_effective) > 0 ? try(azurerm_private_endpoint.search[0].id, null) : null
  description = "Private endpoint id for Azure AI Search when private connectivity is enabled (created or consumed service)."
}
