output "waiver_ids" {
  description = "Set of documented posture waiver identifiers."
  value       = local.waiver_ids
}

output "is_production" {
  description = "True when posture_tier is production."
  value       = local.is_production
}

output "is_staging" {
  description = "True when posture_tier is staging."
  value       = local.is_staging
}

output "is_staging_or_production" {
  description = "True when posture_tier is staging or production."
  value       = local.is_staging_or_production
}

output "tier" {
  description = "Resolved posture tier."
  value       = var.posture_tier
}
