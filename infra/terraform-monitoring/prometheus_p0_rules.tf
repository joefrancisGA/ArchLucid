# P0 (tier: p0) Prometheus alert rules routed to azurerm_monitor_action_group.critical.
# Mirrors ../prometheus/archlucid-alerts.yml P0 labels; requires Azure Monitor workspace scrape
# with the same OTel metric names as self-hosted Prometheus.

resource "azurerm_monitor_alert_prometheus_rule_group" "archlucid_p0" {
  count = local.prometheus_p0_rule_group_enabled ? 1 : 0

  name                = "${var.name_prefix}-prom-p0"
  resource_group_name = var.resource_group_name
  location            = data.azurerm_resource_group.prometheus_slo[0].location
  scopes              = [local.azure_monitor_workspace_id_effective]
  rule_group_enabled  = true
  interval            = "PT1M"

  rule {
    enabled    = true
    alert      = "ArchLucidAuthorityPipelineWorkDeadLettersTf"
    severity   = 0
    for        = "PT30M"
    expression = "archlucid_authority_pipeline_work_dead_letter > 0"
    annotations = {
      summary     = "Authority pipeline outbox rows exhausted retries (P0)."
      runbook_url = local.archlucid_authority_observability_runbook_url
    }

    action {
      action_group_id = azurerm_monitor_action_group.critical[0].id
    }
  }

  rule {
    enabled    = true
    alert      = "ArchLucidCircuitBreakerOpenTf"
    severity   = 0
    for        = "PT5M"
    expression = "archlucid_circuit_breaker_state > 0"
    annotations = {
      summary = "OpenAI circuit breaker not fully closed (P0)."
    }

    action {
      action_group_id = azurerm_monitor_action_group.critical[0].id
    }
  }

  rule {
    enabled    = true
    alert      = "ArchLucidTrialSignupFailuresHighTf"
    severity   = 0
    for        = "PT10M"
    expression = "sum(rate(archlucid_trial_signup_failures_total[1m])) > (5.0 / 60.0)"
    annotations = {
      summary = "Trial signup failures sustained above 5/min (P0)."
    }

    action {
      action_group_id = azurerm_monitor_action_group.critical[0].id
    }
  }

  rule {
    enabled    = true
    alert      = "ArchLucidApiUnavailableTf"
    severity   = 0
    for        = "PT2M"
    expression = "absent(up{job=\"archlucid-api\"}) or sum(up{job=\"archlucid-api\"}) == 0"
    annotations = {
      summary = "ArchLucid API is unreachable — no healthy instances (P0)."
    }

    action {
      action_group_id = azurerm_monitor_action_group.critical[0].id
    }
  }

  rule {
    enabled    = true
    alert      = "ArchLucidSqlConnectionFailuresSustainedTf"
    severity   = 0
    for        = "PT3M"
    expression = "archlucid_sql_connection_failures_total > 0"
    annotations = {
      summary = "SQL connection failures sustained (P0)."
    }

    action {
      action_group_id = azurerm_monitor_action_group.critical[0].id
    }
  }

  rule {
    enabled    = true
    alert      = "ArchLucidHealthCheckUnhealthyTf"
    severity   = 0
    for        = "PT2M"
    expression = "archlucid_health_check_status{status=\"Unhealthy\"} > 0"
    annotations = {
      summary = "ArchLucid /health/ready reporting Unhealthy (P0)."
    }

    action {
      action_group_id = azurerm_monitor_action_group.critical[0].id
    }
  }

  tags = var.tags
}
