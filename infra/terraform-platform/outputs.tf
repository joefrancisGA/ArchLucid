output "composition_wave" {
  value       = "platform"
  description = "Operator wave name for this metadata root."
}

output "child_roots" {
  value       = local.child_roots
  description = "Leaf Terraform directories Azure-applied in this wave (paths relative to repo root)."
}

output "azure_apply" {
  value       = false
  description = "Composition roots are never Azure-applied; apply-saas.ps1 validates them only."
}

output "deployment_profile" {
  value       = var.deployment_profile
  description = "hosted / pilot / production documentation label."
}
