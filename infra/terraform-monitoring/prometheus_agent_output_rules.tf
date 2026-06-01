# Agent-output quality Prometheus alert rules for Azure Monitor managed Prometheus.
# Mirrors ../prometheus/archlucid-alerts.yml group archlucid-agent-output-quality.
# Routes to the ops (email) action group — warning-tier regressions, not P0 phone alerts.

resource "azurerm_monitor_alert_prometheus_rule_group" "archlucid_agent_output" {
  count = local.prometheus_slo_rule_group_enabled ? 1 : 0

  name                = "${var.name_prefix}-prom-agent-output"
  resource_group_name = var.resource_group_name
  location            = data.azurerm_resource_group.prometheus_slo[0].location
  scopes              = [local.azure_monitor_workspace_id_effective]
  rule_group_enabled  = true
  interval            = "PT1M"

  rule {
    enabled    = true
    alert      = "ArchLucidAgentOutputQualityGateRejectedTf"
    severity   = 2
    for        = "PT30M"
    expression = "sum(rate(archlucid_agent_output_quality_gate_total{outcome=\"rejected\"}[15m])) > 0"
    annotations = {
      summary     = "Agent output quality gate is rejecting results."
      runbook_url = "https://github.com/ArchLucid/ArchLucid/blob/main/docs/library/AGENT_OUTPUT_EVALUATION.md"
    }

    action {
      action_group_id = azurerm_monitor_action_group.ops[0].id
    }
  }

  rule {
    enabled    = true
    alert      = "ArchLucidAgentOutputSemanticScoreP10LowTf"
    severity   = 2
    for        = "PT2H"
    expression = <<-EOT
histogram_quantile(
  0.1,
  sum(rate(archlucid_agent_output_semantic_score_bucket[30m])) by (le, agent_type)
) < 0.35
EOT
    annotations = {
      summary = "Agent semantic score p10 is low (per agent_type)."
    }

    action {
      action_group_id = azurerm_monitor_action_group.ops[0].id
    }
  }

  rule {
    enabled    = true
    alert      = "ArchLucidAgentOutputSemanticScoreP50LowTf"
    severity   = 2
    for        = "PT2H"
    expression = <<-EOT
histogram_quantile(
  0.5,
  sum(rate(archlucid_agent_output_semantic_score_bucket[30m])) by (le, agent_type)
) < 0.45
EOT
    annotations = {
      summary = "Agent semantic score p50 is low (per agent_type)."
    }

    action {
      action_group_id = azurerm_monitor_action_group.ops[0].id
    }
  }

  rule {
    enabled    = true
    alert      = "ArchLucidAgentOutputLlmFaithfulnessScoreP50LowTf"
    severity   = 2
    for        = "PT2H"
    expression = <<-EOT
histogram_quantile(
  0.5,
  sum(rate(archlucid_agent_output_llm_faithfulness_score_bucket[30m])) by (le, agent_type)
) < 0.5
EOT
    annotations = {
      summary = "Agent LLM faithfulness score p50 is low (per agent_type)."
    }

    action {
      action_group_id = azurerm_monitor_action_group.ops[0].id
    }
  }

  rule {
    enabled    = true
    alert      = "ArchLucidAgentOutputParseFailuresTf"
    severity   = 2
    for        = "PT30M"
    expression = "sum(rate(archlucid_agent_output_parse_failures_total[15m])) > 0"
    annotations = {
      summary = "Agent output JSON parse failures for metrics path."
    }

    action {
      action_group_id = azurerm_monitor_action_group.ops[0].id
    }
  }

  rule {
    enabled    = true
    alert      = "ArchLucidAgentTraceBlobUploadFailuresTf"
    severity   = 2
    for        = "PT15M"
    expression = "sum(rate(archlucid_agent_trace_blob_upload_failures_total[15m])) > 0"
    annotations = {
      summary = "Agent trace blob uploads exhausted retries."
    }

    action {
      action_group_id = azurerm_monitor_action_group.ops[0].id
    }
  }

  tags = var.tags
}
