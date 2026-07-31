# Custom hostnames on Container Apps without Front Door (TB-2016 / TB-2017).
#
# Apply order:
# 1. Leave ui_custom_domain_name / marketing_ui_custom_domain_name / api_custom_domain_name empty.
# 2. Apply → read container_app_environment_custom_domain_verification_id.
# 3. DNS: TXT asuid.<hostname> = verification id; CNAME <hostname> → app FQDN.
# 4. Bind managed cert with Azure CLI (azurerm managed-cert resources are unreliable — see README):
#      az containerapp hostname bind --hostname <hostname> -g <rg> -n <app> --environment <env> --validation-method CNAME
#
# Hostname vars are recorded here so tfvars document intended apex vs app split even before bind.

locals {
  operator_ui_custom_domain_configured  = length(trimspace(var.ui_custom_domain_name)) > 0
  marketing_ui_custom_domain_configured = length(trimspace(var.marketing_ui_custom_domain_name)) > 0
  api_custom_domain_configured          = length(trimspace(var.api_custom_domain_name)) > 0
}

output "container_app_environment_custom_domain_verification_id" {
  description = "TXT asuid.<hostname> value for Container Apps custom-domain ownership checks (shared by every app in the CAE)."
  value       = try(azurerm_container_app_environment.main[0].custom_domain_verification_id, null)
}

output "ui_custom_domain_verification_id" {
  description = "Alias of environment verification id (operator UI / app.<domain>)."
  value       = try(azurerm_container_app_environment.main[0].custom_domain_verification_id, null)
}

output "marketing_ui_custom_domain_verification_id" {
  description = "Alias of environment verification id (marketing UI / apex)."
  value       = try(azurerm_container_app_environment.main[0].custom_domain_verification_id, null)
}

output "api_custom_domain_verification_id" {
  description = "Alias of environment verification id (API hostname)."
  value       = try(azurerm_container_app_environment.main[0].custom_domain_verification_id, null)
}

output "ui_custom_domain_name" {
  description = "Configured operator UI custom hostname (empty until set in tfvars; bind via az CLI)."
  value       = local.operator_ui_custom_domain_configured ? var.ui_custom_domain_name : null
}

output "marketing_ui_custom_domain_name" {
  description = "Configured marketing UI custom hostname (empty until set in tfvars; bind via az CLI)."
  value       = local.marketing_ui_custom_domain_configured ? var.marketing_ui_custom_domain_name : null
}

output "api_custom_domain_name" {
  description = "Configured API custom hostname (empty until set in tfvars; bind via az CLI)."
  value       = local.api_custom_domain_configured ? var.api_custom_domain_name : null
}
