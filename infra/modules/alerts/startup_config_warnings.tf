locals {
  rule_group_enabled = (
    var.enabled
    && length(trimspace(var.azure_monitor_workspace_id)) > 0
    && length(trimspace(var.resource_group_name)) > 0
    && length(trimspace(var.ops_action_group_id)) > 0
  )
}

data "azurerm_resource_group" "startup_config_warnings" {
  count = local.rule_group_enabled ? 1 : 0

  name = var.resource_group_name
}

# TB-002 stub: attach this module where Azure Monitor managed Prometheus scrapes archlucid_* from API/worker hosts.
# Severity 2 mirrors Production-class alerts; set alert_severity = 3 when targeting a Staging-class workspace scrape.
resource "azurerm_monitor_alert_prometheus_rule_group" "startup_config_warnings" {
  count = local.rule_group_enabled ? 1 : 0

  name                = "${var.name_prefix}-startup-cfg-warn"
  resource_group_name = var.resource_group_name
  location            = data.azurerm_resource_group.startup_config_warnings[0].location
  scopes              = [var.azure_monitor_workspace_id]
  rule_group_enabled  = true
  interval            = "PT1M"

  rule {
    enabled    = true
    alert      = "ArchLucidStartupConfigWarningsTf"
    severity   = var.alert_severity
    for        = "PT5M"
    expression = "sum(increase(archlucid_startup_config_warnings_total[5m])) > 0"

    annotations = {
      summary = "Startup emitted TB-002 advisory counters (archlucid_startup_config_warnings_total); inspect rule_name labels and host logs."
    }

    action {
      action_group_id = var.ops_action_group_id
    }
  }

  tags = var.tags
}
