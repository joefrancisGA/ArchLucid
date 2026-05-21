output "customer_app_id" {
  description = "Paste into ArchLucid hosted extractor configure UI (application/client id)."
  value       = azuread_application.extractor.client_id
}

output "customer_tenant_id" {
  description = "Customer Entra tenant id."
  value       = var.customer_tenant_id
}

output "subscription_id" {
  description = "Subscription scoped for read-only inventory."
  value       = var.subscription_id
}
