output "endpoint" {
  description = "Azure AI Search HTTPS endpoint for Retrieval:AzureSearch:Endpoint."
  value       = "https://${azurerm_search_service.search.name}.search.windows.net"
}

output "app_settings" {
  description = "Container Apps / App Service setting keys (no secrets)."
  value = {
    "Retrieval__VectorIndex"             = "AzureSearch"
    "Retrieval__AzureSearch__Endpoint"   = "https://${azurerm_search_service.search.name}.search.windows.net"
  }
}