output "acr_id" {
  value       = try(azurerm_container_registry.archlucid[0].id, null)
  description = "Pass to terraform-container-apps acr_resource_id."
}

output "acr_login_server" {
  value       = try(azurerm_container_registry.archlucid[0].login_server, null)
}

output "acr_resource_group_name" {
  value       = local.enabled ? local.resource_group_name : null
}
