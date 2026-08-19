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
  description = "System-assigned principal ID of the storage account (optional for keyless scenarios); the API uses its own container identity for blob data plane access."
  value       = try(azurerm_storage_account.artifacts[0].identity[0].principal_id, null)
}

output "agent_trace_blob_lifecycle_enabled" {
  description = "Whether agent-traces storage lifecycle tiering/expiry is active on the artifacts account."
  value       = var.enable_storage_account && var.agent_trace_blob_lifecycle_enabled
}

output "agent_trace_blob_lifecycle_days" {
  description = "Cool-tier and delete thresholds (days since last modification) for agent-traces/ blobs."
  value = var.enable_storage_account && var.agent_trace_blob_lifecycle_enabled ? {
    cool_tier_after_days = var.agent_trace_blob_cool_tier_after_days
    delete_after_days    = var.agent_trace_blob_delete_after_days
  } : null
}
