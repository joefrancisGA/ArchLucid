output "storage_account_id" {
  description = "Resource ID for private endpoint wiring (terraform-private)."
  value       = try(azurerm_storage_account.artifacts[0].id, null)
}

output "storage_account_name" {
  value = try(azurerm_storage_account.artifacts[0].name, null)
}

output "primary_blob_endpoint" {
  description = "Blob service URL for ArtifactLargePayload:AzureBlobServiceUri (e.g. https://name.blob.core.windows.net)."
  value       = try(azurerm_storage_account.artifacts[0].primary_blob_endpoint, null)
}

output "artifact_blob_identity_principal_id" {
  description = "System-assigned principal for Storage Blob Data Contributor RBAC to the API managed identity."
  value       = try(azurerm_storage_account.artifacts[0].identity[0].principal_id, null)
}
