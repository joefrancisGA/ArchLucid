# Optional Azure Monitor managed Prometheus rule group — mirrors key PromQL from
# ../prometheus/archlucid-slo-rules.yml (p99 latency, 5xx ratio, outbox depth)
# and ../prometheus/archlucid-alerts.yml (integration event outbox dead-letter gauge,
# LLM monthly budget utilization fraction by tenant, TB-731 signup funnel volume).
# Requires an Azure Monitor workspace (scopes) scraped with the same metric names as self-hosted Prometheus.

locals {
  # Plan-time gate: do not depend on azurerm_monitor_workspace id (unknown until apply).
  prometheus_workspace_requested = var.enable_monitoring_stack && var.enable_prometheus_slo_rule_group && (
    length(trimspace(var.azure_monitor_workspace_id)) > 0 || var.enable_managed_monitor_workspace
  )

  prometheus_slo_rule_group_enabled = local.prometheus_workspace_requested

  archlucid_authority_observability_runbook_url = "https://github.com/ArchLucid/ArchLucid/blob/main/docs/library/OBSERVABILITY.md#authority-pipeline-remediation-runbook"

  # TB-958 — fleet-wide stale in-flight runs (cardinality-safe gauges; triage via logs).
  archlucid_stale_in_flight_runs_runbook_url = "https://github.com/ArchLucid/ArchLucid/blob/main/docs/runbooks/STALE_IN_FLIGHT_RUNS.md"
}

data "azurerm_resource_group" "prometheus_slo" {
  count = local.prometheus_slo_rule_group_enabled ? 1 : 0
  name  = var.resource_group_name
}

resource "azurerm_monitor_alert_prometheus_rule_group" "archlucid_slo" {
  count = local.prometheus_slo_rule_group_enabled ? 1 : 0

  name                = "${var.name_prefix}-prom-slo"
  resource_group_name = var.resource_group_name
  location            = data.azurerm_resource_group.prometheus_slo[0].location
  scopes              = [local.azure_monitor_workspace_id_effective]
  rule_group_enabled  = true
  interval            = "PT1M"

  rule {
    enabled    = true
    alert      = "ArchLucidSloHttpP99HighTf"
    severity   = 2
    for        = "PT10M"
    expression = <<-EOT
(histogram_quantile(0.99, sum(rate(http_server_request_duration_seconds_bucket[5m])) by (le)) or histogram_quantile(0.99, sum(rate(http_server_duration_milliseconds_bucket[5m])) by (le)) / 1000) > 5
EOT
    annotations = {
      summary     = "HTTP p99 latency above 5s (see infra/prometheus/archlucid-slo-rules.yml ArchLucidSloHttpP99High)."
      runbook_url = local.archlucid_authority_observability_runbook_url
    }

    action {
      action_group_id = azurerm_monitor_action_group.ops[0].id
    }
  }

  rule {
    enabled    = true
    alert      = "ArchLucidSloHttp5xxRatioElevatedTf"
    severity   = 2
    for        = "PT10M"
    expression = <<-EOT
(
  (sum(rate(http_server_request_duration_seconds_count{http_response_status_code=~"5.."}[10m])) or sum(rate(http_server_duration_milliseconds_count{http_response_status_code=~"5.."}[10m])))
  /
  clamp_min(sum(rate(http_server_request_duration_seconds_count[10m])) or sum(rate(http_server_duration_milliseconds_count[10m])), 1e-9)
) > 0.02
EOT
    annotations = {
      summary     = "HTTP 5xx ratio above 2% over 10m (see ArchLucidSloHttp5xxRatioElevated)."
      runbook_url = local.archlucid_authority_observability_runbook_url
    }

    action {
      action_group_id = azurerm_monitor_action_group.ops[0].id
    }
  }

  rule {
    enabled    = true
    alert      = "ArchLucidSloOutboxDepthCriticalTf"
    severity   = 1
    for        = "PT15M"
    expression = <<-EOT
(archlucid_authority_pipeline_work_pending > 500) or (archlucid_retrieval_indexing_outbox_pending > 500) or (archlucid_integration_event_outbox_publish_pending > 500)
EOT
    annotations = {
      summary     = "SQL outbox depth SLO breach (any queue > 500 pending)."
      runbook_url = local.archlucid_authority_observability_runbook_url
    }

    action {
      action_group_id = azurerm_monitor_action_group.ops[0].id
    }
  }

  rule {
    enabled    = true
    alert      = "ArchLucidIntegrationOutboxDeadLetterNonZeroTf"
    severity   = 2
    for        = "PT5M"
    expression = <<-EOT
archlucid_integration_event_outbox_dead_letter > 0
EOT
    annotations = {
      summary = "Integration event outbox dead-letter queue is non-zero. See docs/library/OBSERVABILITY.md (Authority pipeline remediation runbook)."
    }

    action {
      action_group_id = azurerm_monitor_action_group.ops[0].id
    }
  }

  rule {
    enabled    = true
    alert      = "ArchLucidLlmBudgetWarnFractionBreachedTf"
    severity   = 3
    for        = "PT5M"
    expression = <<-EOT
max by (tenant_id) (archlucid_llm_budget_utilization_fraction) > 0.75
EOT
    annotations = {
      summary = "Tenant LLM budget utilisation exceeded 75%. Review infra/terraform-monitoring."
    }

    action {
      action_group_id = azurerm_monitor_action_group.ops[0].id
    }
  }

  dynamic "rule" {
    for_each = var.marketing_product_resplit_signup_daily_threshold > 0 ? [1] : []
    content {
      enabled    = true
      alert      = "ArchLucidMarketingProductResplitSignupDailyTf"
      severity   = 2
      for        = "PT15M"
      expression = "sum(increase(archlucid_first_tenant_funnel_events_total{event=\"signup\"}[24h])) >= ${var.marketing_product_resplit_signup_daily_threshold}"
      annotations = {
        summary     = "TB-731: Self-serve signup funnel volume reached the 24h marketing/product re-split review threshold."
        runbook_url = "https://github.com/ArchLucid/ArchLucid/blob/main/docs/library/MARKETING_PRODUCT_SEPARATION_ASSESSMENT.md"
      }

      action {
        action_group_id = azurerm_monitor_action_group.ops[0].id
      }
    }
  }

  dynamic "rule" {
    for_each = var.marketing_product_resplit_signup_hourly_threshold > 0 ? [1] : []
    content {
      enabled    = true
      alert      = "ArchLucidMarketingProductResplitSignupHourlyBurstTf"
      severity   = 2
      for        = "PT10M"
      expression = "sum(increase(archlucid_first_tenant_funnel_events_total{event=\"signup\"}[1h])) >= ${var.marketing_product_resplit_signup_hourly_threshold}"
      annotations = {
        summary     = "TB-731: Self-serve signup funnel burst reached the 1h marketing/product re-split review threshold."
        runbook_url = "https://github.com/ArchLucid/ArchLucid/blob/main/docs/library/MARKETING_PRODUCT_SEPARATION_ASSESSMENT.md"
      }

      action {
        action_group_id = azurerm_monitor_action_group.ops[0].id
      }
    }
  }

  tags = var.tags
}
