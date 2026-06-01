# TB-098 — Azure Monitor workspace for managed Prometheus rule groups.

locals {
  managed_prometheus_workspace_enabled = var.enable_monitoring_stack && var.enable_prometheus_slo_rule_group && var.enable_managed_monitor_workspace

  azure_monitor_workspace_id_effective = length(trimspace(var.azure_monitor_workspace_id)) > 0 ? trimspace(var.azure_monitor_workspace_id) : (
    local.managed_prometheus_workspace_enabled ? azurerm_monitor_workspace.prometheus[0].id : ""
  )
}

resource "azurerm_monitor_workspace" "prometheus" {
  count = local.managed_prometheus_workspace_enabled ? 1 : 0

  name                = "${var.name_prefix}-amw"
  resource_group_name = var.resource_group_name
  location            = var.grafana_location
  tags                = var.tags
}
