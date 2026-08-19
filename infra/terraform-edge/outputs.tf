output "front_door_enabled" {
  value       = var.enable_front_door_waf
  description = "Whether Front Door + WAF was requested."
}

output "front_door_endpoint_hostname" {
  description = "Public hostname for the default Front Door endpoint (when deployed)."
  value       = var.enable_front_door_waf ? azurerm_cdn_frontdoor_endpoint.main[0].host_name : null
}

output "front_door_profile_id" {
  description = "Resource ID of the Front Door profile."
  value       = var.enable_front_door_waf ? azurerm_cdn_frontdoor_profile.main[0].id : null
}

output "front_door_firewall_policy_id" {
  description = "Resource ID of the WAF policy."
  value       = var.enable_front_door_waf ? azurerm_cdn_frontdoor_firewall_policy.main[0].id : null
}

output "marketing_custom_domain_hostname" {
  description = "Operator-supplied marketing hostname (passthrough; empty until set in tfvars)."
  value       = trimspace(var.marketing_custom_domain_hostname) != "" ? trimspace(var.marketing_custom_domain_hostname) : null
}
