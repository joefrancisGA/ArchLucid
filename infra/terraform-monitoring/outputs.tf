output "action_group_id" {
  description = "Azure Monitor action group resource ID (empty when monitoring stack disabled)."
  value       = try(azurerm_monitor_action_group.ops[0].id, null)
}

output "grafana_endpoint" {
  description = "HTTPS endpoint for Azure Managed Grafana (null when disabled)."
  value       = try(azurerm_dashboard_grafana.archlucid[0].endpoint, null)
}

output "grafana_principal_id" {
  description = "System-assigned managed identity principal ID for Grafana (for Azure Monitor / Log Analytics role assignments)."
  value       = try(azurerm_dashboard_grafana.archlucid[0].identity[0].principal_id, null)
}

output "prometheus_slo_rule_group_id" {
  description = "Azure Monitor Prometheus rule group resource ID when enable_prometheus_slo_rule_group is true."
  value       = try(azurerm_monitor_alert_prometheus_rule_group.archlucid_slo[0].id, null)
}

output "application_insights_connection_string" {
  description = "Application Insights connection string (sensitive). Empty when Application Insights is not created."
  value       = try(azurerm_application_insights.archlucid[0].connection_string, "")
  sensitive   = true
}

output "application_insights_instrumentation_key" {
  description = "Application Insights instrumentation key (sensitive). Prefer connection_string for new integrations."
  value       = try(azurerm_application_insights.archlucid[0].instrumentation_key, "")
  sensitive   = true
}

output "critical_action_group_id" {
  description = "Azure Monitor P0-critical action group resource ID (empty when enable_critical_action_group is false)."
  value       = try(azurerm_monitor_action_group.critical[0].id, null)
}

output "prometheus_p0_rule_group_id" {
  description = "Azure Monitor Prometheus P0 rule group resource ID when critical + prometheus SLO rule group are enabled."
  value       = try(azurerm_monitor_alert_prometheus_rule_group.archlucid_p0[0].id, null)
}

output "prometheus_agent_output_rule_group_id" {
  description = "Azure Monitor Prometheus agent-output quality rule group resource ID when enable_prometheus_slo_rule_group is true."
  value       = try(azurerm_monitor_alert_prometheus_rule_group.archlucid_agent_output[0].id, null)
}

output "azure_monitor_workspace_id" {
  value       = length(trimspace(local.azure_monitor_workspace_id_effective)) > 0 ? local.azure_monitor_workspace_id_effective : null
  description = "TB-098: Managed or BYO Azure Monitor workspace for Prometheus rule scopes."
}