locals {
  # One diagnostic setting per deployed Logic App Standard site; keys are stable Terraform map keys (not Azure site names).
  logic_app_standard_diagnostic_resource_ids = merge(
    var.enable_logic_apps && local.logic_app_diagnostics_enabled ? { edge = azurerm_logic_app_standard.edge[0].id } : {},
    var.enable_governance_approval_logic_app && local.logic_app_diagnostics_enabled ? { governance_approval = azurerm_logic_app_standard.governance_approval[0].id } : {},
    var.enable_marketplace_fulfillment_logic_app && local.logic_app_diagnostics_enabled ? { marketplace_fulfillment = azurerm_logic_app_standard.marketplace_fulfillment[0].id } : {},
    var.enable_trial_lifecycle_logic_app && local.logic_app_diagnostics_enabled ? { trial_lifecycle = azurerm_logic_app_standard.trial_lifecycle[0].id } : {},
    var.enable_incident_chatops_logic_app && local.logic_app_diagnostics_enabled ? { incident_chatops = azurerm_logic_app_standard.incident_chatops[0].id } : {},
    var.enable_promotion_customer_notify_logic_app && local.logic_app_diagnostics_enabled ? { promotion_customer_notify = azurerm_logic_app_standard.promotion_customer_notify[0].id } : {}
  )
}

resource "azurerm_monitor_diagnostic_setting" "logic_app_standard" {
  for_each = local.logic_app_standard_diagnostic_resource_ids

  name                       = "archlucid-logic-diags-${each.key}"
  target_resource_id         = each.value
  log_analytics_workspace_id = var.logic_app_diagnostic_log_analytics_workspace_id

  enabled_log {
    category_group = "allLogs"
  }

  enabled_metric {
    category = "AllMetrics"
  }
}
