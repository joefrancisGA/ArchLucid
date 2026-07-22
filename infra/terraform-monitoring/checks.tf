check "monitoring_requires_resource_group" {
  assert {
    condition     = !var.enable_monitoring_stack || length(trimspace(var.resource_group_name)) > 0
    error_message = "enable_monitoring_stack = true requires resource_group_name."
  }
}

check "monitoring_requires_alert_email" {
  assert {
    condition     = !var.enable_monitoring_stack || length(trimspace(var.alert_email_address)) > 0
    error_message = "enable_monitoring_stack = true requires alert_email_address for the action group."
  }
}

check "managed_grafana_requires_resource_group" {
  assert {
    condition     = !var.enable_managed_grafana || length(trimspace(var.resource_group_name)) > 0
    error_message = "enable_managed_grafana = true requires resource_group_name."
  }
}

check "grafana_dashboards_require_managed_instance" {
  assert {
    condition     = !var.grafana_terraform_dashboards_enabled || var.enable_managed_grafana
    error_message = "grafana_terraform_dashboards_enabled requires enable_managed_grafana."
  }
}

check "grafana_dashboards_require_real_auth" {
  assert {
    condition = !var.grafana_terraform_dashboards_enabled || (
      length(trimspace(var.grafana_auth)) > 0 &&
      var.grafana_auth != "terraform-validate-placeholder"
    )
    error_message = "grafana_terraform_dashboards_enabled requires a real grafana_auth token (not the CI placeholder)."
  }
}

check "prometheus_slo_requires_workspace" {
  assert {
    condition     = !var.enable_prometheus_slo_rule_group || local.prometheus_workspace_requested
    error_message = "enable_prometheus_slo_rule_group = true requires azure_monitor_workspace_id or enable_managed_monitor_workspace = true."
  }
}

check "prometheus_slo_requires_monitoring_stack" {
  assert {
    condition     = !var.enable_prometheus_slo_rule_group || var.enable_monitoring_stack
    error_message = "enable_prometheus_slo_rule_group = true requires enable_monitoring_stack (action group + shared ops wiring)."
  }
}

check "critical_action_group_requires_monitoring_stack" {
  assert {
    condition     = !var.enable_critical_action_group || var.enable_monitoring_stack
    error_message = "enable_critical_action_group = true requires enable_monitoring_stack = true."
  }
}

check "critical_action_group_key_vault_names" {
  assert {
    condition = !var.read_alert_secrets_from_key_vault || (
      length(trimspace(var.alert_secrets_key_vault_name)) > 0 &&
      length(trimspace(var.alert_secrets_key_vault_resource_group_name)) > 0
    )
    error_message = "read_alert_secrets_from_key_vault = true requires alert_secrets_key_vault_name and alert_secrets_key_vault_resource_group_name."
  }
}

check "container_app_otel_requires_environment_id" {
  assert {
    condition     = !var.enable_container_app_environment_otel || length(trimspace(var.container_app_environment_resource_id)) > 0
    error_message = "enable_container_app_environment_otel = true requires container_app_environment_resource_id."
  }
}

check "container_app_otel_requires_application_insights" {
  assert {
    condition     = !var.enable_container_app_environment_otel || var.enable_application_insights
    error_message = "enable_container_app_environment_otel = true requires enable_application_insights = true."
  }
}

check "wire_container_app_observability_env_requires_apps" {
  assert {
    condition = !var.wire_container_app_observability_env || (
      (length(trimspace(var.api_container_app_resource_id)) > 0 || length(trimspace(var.api_container_app_name)) > 0) &&
      (length(trimspace(var.worker_container_app_resource_id)) > 0 || length(trimspace(var.worker_container_app_name)) > 0) &&
      var.enable_application_insights
    )
    error_message = "wire_container_app_observability_env = true requires api/worker app identifiers and enable_application_insights = true. Env injection is applied via scripts/ops/wire-application-insights-env.ps1 (AzAPI full-container PUT breaks secret refs)."
  }
}

check "ui_replica_saturation_within_max" {
  assert {
    condition     = var.ui_replica_saturation_threshold == 0 || var.ui_replica_saturation_threshold <= var.ui_max_replicas_expected
    error_message = "ui_replica_saturation_threshold must be <= ui_max_replicas_expected."
  }
}

check "subscription_cost_management_requires_monitoring_stack" {
  assert {
    condition     = !var.enable_subscription_cost_management || var.enable_monitoring_stack
    error_message = "enable_subscription_cost_management = true requires enable_monitoring_stack = true (uses alert_email_address for notifications)."
  }
}

check "subscription_cost_rollup_requires_components" {
  assert {
    condition = !var.enable_subscription_cost_management || !var.enable_monitoring_stack || (
      length(var.subscription_cost_rollup_budget_components) > 0 &&
      alltrue([for amount in values(var.subscription_cost_rollup_budget_components) : amount > 0])
    )
    error_message = "With subscription cost management enabled, subscription_cost_rollup_budget_components must be a non-empty map of positive monthly amounts (mirror per-root production.tfvars.example budgets)."
  }
}

check "subscription_cost_rollup_requires_time_period" {
  assert {
    condition     = !var.enable_subscription_cost_management || !var.enable_monitoring_stack || length(trimspace(var.subscription_cost_rollup_budget_time_period_start)) > 0
    error_message = "With subscription cost management enabled, set subscription_cost_rollup_budget_time_period_start (e.g. 2026-04-01T00:00:00Z)."
  }
}

check "subscription_cost_management_requires_contact_email" {
  assert {
    condition = !var.enable_subscription_cost_management || !var.enable_monitoring_stack || (
      length(var.subscription_cost_rollup_budget_contact_emails) > 0 ||
      length(trimspace(var.alert_email_address)) > 0
    )
    error_message = "With subscription cost management enabled, set subscription_cost_rollup_budget_contact_emails and/or alert_email_address for anomaly and budget notifications."
  }
}
