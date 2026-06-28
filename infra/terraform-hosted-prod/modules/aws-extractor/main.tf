locals {
  aws_extractor_app_settings = merge(
    {
      "HostedAwsExtractor__Enabled" = tostring(var.hosted_aws_extractor_enabled)
      "CloudPolling__Aws__Enabled"  = tostring(var.cloud_polling_aws_enabled)
      "CloudPolling__Aws__IntervalHours" = tostring(var.cloud_polling_aws_interval_hours)
    },
    var.archlucid_managed_identity_client_id != "" ? {
      "HostedAwsExtractor__ArchLucidManagedIdentityClientId" = var.archlucid_managed_identity_client_id
    } : {}
  )
}

output "app_settings" {
  description = "Container Apps / App Service configuration keys for TB-402 hosted AWS extractor."
  value       = local.aws_extractor_app_settings
}
