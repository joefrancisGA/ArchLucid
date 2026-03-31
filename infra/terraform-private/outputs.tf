output "private_data_plane_enabled" {
  value       = var.enable_private_data_plane
  description = "Whether private endpoints were requested."
}

output "virtual_network_id" {
  value       = var.enable_private_data_plane ? azurerm_virtual_network.main[0].id : null
  description = "VNet resource ID for linking App Service VNet integration or runners."
}

output "private_endpoints_subnet_id" {
  value       = var.enable_private_data_plane ? azurerm_subnet.private_endpoints[0].id : null
  description = "Subnet used for private endpoints."
}

output "sql_private_endpoint_id" {
  value       = var.enable_private_data_plane ? azurerm_private_endpoint.sql[0].id : null
  description = "Private endpoint resource ID for SQL."
}

output "blob_private_endpoint_id" {
  value       = var.enable_private_data_plane ? azurerm_private_endpoint.blob[0].id : null
  description = "Private endpoint resource ID for blob storage."
}
