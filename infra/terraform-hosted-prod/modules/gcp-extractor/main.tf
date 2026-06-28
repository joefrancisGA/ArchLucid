locals {
  gcp_extractor_app_settings = merge(
    {
      "HostedGcpExtractor__Enabled" = tostring(var.hosted_gcp_extractor_enabled)
      "CloudPolling__Gcp__Enabled"  = tostring(var.cloud_polling_gcp_enabled)
      "CloudPolling__Gcp__IntervalHours" = tostring(var.cloud_polling_gcp_interval_hours)
    },
    var.archlucid_managed_identity_client_id != "" ? {
      "HostedGcpExtractor__ArchLucidManagedIdentityClientId" = var.archlucid_managed_identity_client_id
    } : {}
  )
}

output "app_settings" {
  description = "Container Apps / App Service configuration keys for TB-403 hosted GCP extractor."
  value       = local.gcp_extractor_app_settings
}
