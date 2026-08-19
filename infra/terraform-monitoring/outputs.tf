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

output "azure_monitor_prometheus_query_endpoint" {
  value       = length(trimspace(local.amw_prometheus_query_endpoint_effective)) > 0 ? local.amw_prometheus_query_endpoint_effective : null
  description = "AMW Prometheus query endpoint for Grafana or ad-hoc PromQL (null when workspace disabled)."
}

output "amw_otlp_metrics_ingestion_endpoint" {
  value       = length(trimspace(local.amw_otlp_metrics_endpoint_effective)) > 0 ? local.amw_otlp_metrics_endpoint_effective : null
  description = "Default DCE OTLP ingestion endpoint wired to the CAE OpenTelemetry agent when enabled."
}

output "container_app_environment_otel_patch_id" {
  value       = try(azapi_update_resource.container_app_environment_otel[0].id, null)
  description = "AzAPI resource id when CAE OpenTelemetry configuration was patched."
}

output "first_tenant_funnel_workbook_id" {
  value       = module.first_tenant_funnel_workbook.workbook_id
  description = "TB-731: Azure Monitor workbook id for first-tenant signup funnel when enable_first_tenant_funnel_workbook is true."
}

output "subscription_cost_rollup_budget_id" {
  description = "TB-909: Resource id of the subscription rollup consumption budget when enable_subscription_cost_management is true; otherwise null."
  value       = try(azurerm_consumption_budget_subscription.rollup[0].id, null)
}

output "subscription_cost_rollup_budget_amount" {
  description = "TB-909: Computed monthly rollup budget amount (sum of subscription_cost_rollup_budget_components × headroom multiplier) when enabled; otherwise null."
  value       = local.subscription_cost_management_enabled ? local.subscription_rollup_budget_amount : null
}

output "subscription_cost_anomaly_alert_id" {
  description = "TB-909: Resource id of the subscription cost anomaly alert when enable_subscription_cost_management is true; otherwise null."
  value       = try(azurerm_cost_anomaly_alert.subscription[0].id, null)
}