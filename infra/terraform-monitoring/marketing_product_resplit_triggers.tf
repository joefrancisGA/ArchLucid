# TB-731 — marketing/product re-split trigger metrics (traffic pressure + signup funnel).
# Does not split origins or Front Door routes; only instruments signals that justify revisiting Option B later.

locals {
  ui_cpu_alert = local.enabled && var.ui_container_cpu_percent_threshold > 0 && length(trimspace(var.ui_container_app_resource_id)) > 0

  ui_replica_saturation_alert = local.enabled && var.ui_replica_saturation_threshold > 0 && length(trimspace(var.ui_container_app_resource_id)) > 0

  first_tenant_funnel_workbook_enabled = var.enable_monitoring_stack && var.enable_first_tenant_funnel_workbook && local.application_insights_enabled
}

resource "azurerm_monitor_metric_alert" "ui_container_cpu_high" {
  count = local.ui_cpu_alert ? 1 : 0

  name                = "${var.name_prefix}-ui-cpu-high"
  resource_group_name = var.resource_group_name
  scopes              = [var.ui_container_app_resource_id]
  description         = "TB-731: UI Container App average CPU exceeded threshold — marketing/product re-split traffic-pressure signal."
  severity            = 2
  frequency           = "PT1M"
  window_size         = "PT15M"
  enabled             = true
  auto_mitigate       = true

  criteria {
    metric_namespace = "Microsoft.App/containerApps"
    metric_name      = "CpuPercentage"
    aggregation      = "Average"
    operator         = "GreaterThan"
    threshold        = var.ui_container_cpu_percent_threshold
  }

  action {
    action_group_id = azurerm_monitor_action_group.ops[0].id
  }

  tags = var.tags
}

resource "azurerm_monitor_metric_alert" "ui_container_replicas_saturated" {
  count = local.ui_replica_saturation_alert ? 1 : 0

  name                = "${var.name_prefix}-ui-replicas-saturated"
  resource_group_name = var.resource_group_name
  scopes              = [var.ui_container_app_resource_id]
  description         = "TB-731: UI Container App replica count at or above saturation threshold — marketing/product re-split traffic-pressure signal."
  severity            = 2
  frequency           = "PT1M"
  window_size         = "PT15M"
  enabled             = true
  auto_mitigate       = true

  criteria {
    metric_namespace = "Microsoft.App/containerApps"
    metric_name      = "Replicas"
    aggregation      = "Average"
    operator         = "GreaterThanOrEqual"
    threshold        = var.ui_replica_saturation_threshold
  }

  action {
    action_group_id = azurerm_monitor_action_group.ops[0].id
  }

  tags = var.tags
}

module "first_tenant_funnel_workbook" {
  source = "../modules/first-tenant-funnel-dashboard"

  enable_workbook = local.first_tenant_funnel_workbook_enabled
  resource_group_name = var.resource_group_name
  location = local.first_tenant_funnel_workbook_enabled ? data.azurerm_resource_group.insights[0].location : "eastus"
  application_insights_resource_id = local.first_tenant_funnel_workbook_enabled ? azurerm_application_insights.archlucid[0].id : ""
  tags = var.tags
}
