variable "enable_monitoring_stack" {
  type        = bool
  description = "When true, create Azure Monitor action group and optional metric alerts. Defaults true (2026-07-20): on its own this only creates one free action group — CPU metric alerts additionally require container_cpu_percent_threshold > 0 plus a resource ID, and checks.tf fails plan fast if alert_email_address is unset. Set false to opt back out (e.g. a throwaway sandbox)."
  default     = true
}

variable "resource_group_name" {
  type        = string
  description = "Existing resource group that holds ArchLucid Container Apps (or shared monitoring RG)."
  default     = ""
}

variable "name_prefix" {
  type        = string
  description = "Short prefix for alert rule and action group names (alphanumeric, no spaces)."
  default     = "archlucid"
}

variable "alert_email_address" {
  type        = string
  description = "Primary operations email for the shared action group (required when enable_monitoring_stack is true)."
  default     = ""
}

variable "alert_webhook_uri" {
  type        = string
  description = "Optional HTTPS webhook (Teams Incoming Webhook, PagerDuty, etc.) registered on the action group."
  default     = ""
  sensitive   = true
}

variable "api_container_app_resource_id" {
  type        = string
  description = "Full Azure resource ID of the API Container App (Microsoft.App/containerApps/...). Empty skips API CPU alert."
  default     = ""
}

variable "worker_container_app_resource_id" {
  type        = string
  description = "Full Azure resource ID of the Worker Container App. Empty skips worker CPU alert."
  default     = ""
}

variable "ui_container_app_resource_id" {
  type        = string
  description = "Full Azure resource ID of the UI Container App. Empty skips TB-731 UI traffic-pressure alerts."
  default     = ""
}

variable "ui_container_cpu_percent_threshold" {
  type        = number
  description = "TB-731: Average UI Container App CPU percent (0-100) over 15m before marketing/product re-split traffic-pressure alert. Set 0 to skip."
  default     = 70

  validation {
    condition     = var.ui_container_cpu_percent_threshold >= 0 && var.ui_container_cpu_percent_threshold <= 100
    error_message = "ui_container_cpu_percent_threshold must be between 0 and 100."
  }
}

variable "ui_replica_saturation_threshold" {
  type        = number
  description = "TB-731: Alert when UI Container App average replica count stays at or above this value for 10m (default 5 when ui_max_replicas is 6 per TB-729). Set 0 to skip."
  default     = 5

  validation {
    condition     = var.ui_replica_saturation_threshold >= 0
    error_message = "ui_replica_saturation_threshold must be >= 0."
  }
}

variable "ui_max_replicas_expected" {
  type        = number
  description = "TB-731 documentation anchor: expected ui_max_replicas from terraform-container-apps (default 6). Used for checks only."
  default     = 6

  validation {
    condition     = var.ui_max_replicas_expected >= 1
    error_message = "ui_max_replicas_expected must be >= 1."
  }
}

variable "enable_first_tenant_funnel_workbook" {
  type        = bool
  description = "TB-731: When true with enable_monitoring_stack and Application Insights, deploy the first-tenant funnel Azure Monitor workbook (signup funnel visibility)."
  default     = false
}

variable "marketing_product_resplit_signup_daily_threshold" {
  type        = number
  description = "TB-731: Prometheus alert when aggregated signup funnel events in 24h reach this count (0 disables the daily signup alert)."
  default     = 25

  validation {
    condition     = var.marketing_product_resplit_signup_daily_threshold >= 0
    error_message = "marketing_product_resplit_signup_daily_threshold must be >= 0."
  }
}

variable "marketing_product_resplit_signup_hourly_threshold" {
  type        = number
  description = "TB-731: Prometheus alert when signup funnel events in 1h reach this count (0 disables the hourly burst alert)."
  default     = 10

  validation {
    condition     = var.marketing_product_resplit_signup_hourly_threshold >= 0
    error_message = "marketing_product_resplit_signup_hourly_threshold must be >= 0."
  }
}

variable "container_cpu_percent_threshold" {
  type        = number
  description = "Average CPU percent (0-100) over 5m for API/worker Container App metric alerts. Set 0 to skip CPU alerts."
  default     = 0

  validation {
    condition     = var.container_cpu_percent_threshold >= 0 && var.container_cpu_percent_threshold <= 100
    error_message = "container_cpu_percent_threshold must be between 0 and 100."
  }
}

variable "tags" {
  type        = map(string)
  default     = {}
  description = "Tags applied to created resources."
}

variable "enable_application_insights" {
  type        = bool
  description = "When true and application_insights_workspace_resource_id is set, create a workspace-based Application Insights resource (connection string for ArchLucid OpenTelemetry dual export)."
  default     = false
}

variable "application_insights_name" {
  type        = string
  description = "Application Insights resource name (unique within the resource group)."
  default     = "archlucid-appinsights"
}

variable "application_insights_workspace_resource_id" {
  type        = string
  description = "Resource id of the Log Analytics workspace to link (same workspace as Container Apps LAW is typical)."
  default     = ""
}

variable "enable_managed_grafana" {
  type        = bool
  description = "When true, deploy Azure Managed Grafana (Standard SKU). Requires a clean region quota; leave false and import infra/grafana dashboards into Grafana Cloud or an existing instance."
  default     = false
}

variable "grafana_name" {
  type        = string
  description = "Azure Managed Grafana instance name (DNS segment)."
  default     = "archlucid-grafana"
}

variable "grafana_location" {
  type        = string
  description = "Azure region for Managed Grafana (can differ from Container Apps region)."
  default     = "eastus2"
}

variable "grafana_api_key_enabled" {
  type        = bool
  description = "Allow Grafana API keys on the managed instance (needed for some automation)."
  default     = true
}

variable "grafana_major_version" {
  type        = string
  description = "Azure Managed Grafana major version supported in your region (provider-validated, e.g. 11 or 12)."
  default     = "11"

  validation {
    condition     = contains(["11", "12"], var.grafana_major_version)
    error_message = "grafana_major_version must be a major version supported by the azurerm provider (e.g. 11 or 12)."
  }
}

variable "grafana_terraform_dashboards_enabled" {
  type        = bool
  description = "When true with enable_managed_grafana, provision committed JSON from infra/grafana via the Grafana Terraform provider (set grafana_url + grafana_auth from the live instance)."
  default     = false
}

variable "grafana_url" {
  type        = string
  description = "Managed Grafana base URL including scheme (copy from terraform output grafana_endpoint after the workspace exists)."
  default     = "https://127.0.0.1:1"
}

variable "grafana_auth" {
  type        = string
  description = "Grafana service account token or basic auth for the Grafana provider. Required when grafana_terraform_dashboards_enabled is true."
  default     = "terraform-validate-placeholder"
  sensitive   = true
}

variable "enable_prometheus_slo_rule_group" {
  type        = bool
  description = "When true with enable_monitoring_stack, deploy azurerm_monitor_alert_prometheus_rule_group for p99 / 5xx / outbox / agent-output quality PromQL (requires azure_monitor_workspace_id)."
  default     = false
}

variable "enable_managed_monitor_workspace" {
  type        = bool
  description = "TB-098: When true with Prometheus rule groups, create azurerm_monitor_workspace unless azure_monitor_workspace_id override is set."
  default     = true
}

variable "azure_monitor_workspace_id" {
  type        = string
  description = "Optional override: full resource ID of an existing Azure Monitor workspace used as Prometheus rule group scope (Microsoft.Monitor/accounts). Empty skips rule group."
  default     = ""
}

variable "enable_critical_action_group" {
  type        = bool
  description = "When true, create the P0-critical action group with SMS, voice, and PagerDuty receivers."
  default     = false
}

variable "alert_sms_country_code" {
  type        = string
  description = "Country code for SMS alerts (digits only, no +, e.g. 1 for US/Canada)."
  default     = ""
  sensitive   = true
}

variable "alert_sms_phone_number" {
  type        = string
  description = "Phone number for SMS alerts (digits only, no dashes). Prefer Key Vault via read_alert_secrets_from_key_vault in production."
  default     = ""
  sensitive   = true
}

variable "alert_voice_country_code" {
  type        = string
  description = "Country code for voice call alerts (digits only, e.g. 1 for US/Canada). Same number as SMS is fine."
  default     = ""
  sensitive   = true
}

variable "alert_voice_phone_number" {
  type        = string
  description = "Phone number for voice call alerts (digits only, no dashes). Prefer Key Vault in production."
  default     = ""
  sensitive   = true
}

variable "alert_pagerduty_webhook_uri" {
  type        = string
  description = "PagerDuty Events API v2 URL: https://events.pagerduty.com/integration/{key}/enqueue. Prefer Key Vault in production."
  default     = ""
  sensitive   = true
}

variable "read_alert_secrets_from_key_vault" {
  type        = bool
  description = "When true with enable_critical_action_group, resolve SMS/voice/PagerDuty values from Key Vault secrets instead of tfvars."
  default     = false
}

variable "alert_secrets_key_vault_name" {
  type        = string
  description = "Key Vault name holding alert-sms-phone-number, alert-voice-phone-number, and alert-pagerduty-webhook-uri secrets."
  default     = ""
}

variable "alert_secrets_key_vault_resource_group_name" {
  type        = string
  description = "Resource group of the Key Vault when read_alert_secrets_from_key_vault is true."
  default     = ""
}

variable "alert_sms_phone_number_secret_name" {
  type        = string
  description = "Key Vault secret name for SMS phone number (digits only)."
  default     = "alert-sms-phone-number"
}

variable "alert_voice_phone_number_secret_name" {
  type        = string
  description = "Key Vault secret name for voice phone number (digits only)."
  default     = "alert-voice-phone-number"
}

variable "alert_pagerduty_webhook_uri_secret_name" {
  type        = string
  description = "Key Vault secret name for PagerDuty Events API v2 enqueue URL."
  default     = "alert-pagerduty-webhook-uri"
}

variable "read_alert_pagerduty_secret_from_key_vault" {
  type        = bool
  description = "When true with read_alert_secrets_from_key_vault, also load alert-pagerduty-webhook-uri from Key Vault. Leave false until that secret exists."
  default     = false
}

variable "application_insights_sampling_percentage" {
  type        = number
  description = "TB-102: Application Insights ingestion sampling (0-100). Lower to 10-20 for high-volume production to control Log Analytics cost."
  default     = 100

  validation {
    condition     = var.application_insights_sampling_percentage >= 0 && var.application_insights_sampling_percentage <= 100
    error_message = "application_insights_sampling_percentage must be between 0 and 100."
  }
}

variable "write_alert_secrets_to_key_vault" {
  type        = bool
  description = "When true, Terraform writes alert phone secrets (and Application Insights connection string when enabled) into Key Vault. Use once to bootstrap; prefer read_alert_secrets_from_key_vault for steady state."
  default     = false
}

variable "managed_key_vault_secret_ttl_days" {
  type        = number
  description = "Expiration offset in days for Terraform-managed Key Vault secrets (TB-907)."
  default     = 365

  validation {
    condition     = var.managed_key_vault_secret_ttl_days >= 30 && var.managed_key_vault_secret_ttl_days <= 730
    error_message = "managed_key_vault_secret_ttl_days must be between 30 and 730."
  }
}

variable "application_insights_connection_string_secret_name" {
  type        = string
  description = "Key Vault secret name for the Application Insights connection string when write_alert_secrets_to_key_vault is true."
  default     = "application-insights-connection-string"
}

variable "enable_container_app_environment_otel" {
  type        = bool
  description = "When true with enable_application_insights, patch the Container Apps Environment OpenTelemetry agent (AzAPI) for App Insights traces/logs and AMW OTLP metrics."
  default     = false
}

variable "container_app_environment_resource_id" {
  type        = string
  description = "Full resource ID of the Container Apps Environment (Microsoft.App/managedEnvironments/...). Required when enable_container_app_environment_otel is true."
  default     = ""
}

variable "amw_otlp_destination_name" {
  type        = string
  description = "OTLP destination name referenced by the CAE OpenTelemetry metricsConfiguration.destinations list."
  default     = "azure-monitor-metrics"
}

variable "amw_otlp_metrics_ingestion_endpoint" {
  type        = string
  description = "Optional override for the AMW default DCE OTLP ingestion endpoint. Empty resolves the workspace-managed data collection endpoint at apply time."
  default     = ""
}

variable "azure_monitor_prometheus_query_endpoint" {
  type        = string
  description = "Optional override for the AMW Prometheus query endpoint (for Grafana / ad-hoc PromQL). Empty uses the workspace query_endpoint output."
  default     = ""
}

variable "wire_container_app_observability_env" {
  type        = bool
  description = "When true with Application Insights enabled, set APPLICATIONINSIGHTS_CONNECTION_STRING on API and worker Container Apps via AzAPI after the connection string exists."
  default     = false
}

variable "api_container_app_name" {
  type        = string
  description = "API Container App name when wire_container_app_observability_env is true."
  default     = ""
}

variable "worker_container_app_name" {
  type        = string
  description = "Worker Container App name when wire_container_app_observability_env is true."
  default     = ""
}

variable "enable_subscription_cost_management" {
  type        = bool
  description = "TB-909: When true with enable_monitoring_stack, create azurerm_cost_anomaly_alert and azurerm_consumption_budget_subscription rollup (sum of subscription_cost_rollup_budget_components × headroom multiplier). Deliberately not gated by TB-903 posture tier."
  default     = true
}

variable "subscription_cost_rollup_budget_components" {
  type        = map(number)
  description = "TB-909: Per-root monthly budget amounts to sum for the subscription rollup. Mirror production.tfvars.example values from terraform-container-apps, terraform-sql-failover, and terraform-openai."
  default = {
    container_apps = 3500
    sql            = 2500
    openai         = 5000
  }
}

variable "subscription_rollup_budget_headroom_multiplier" {
  type        = number
  description = "TB-909: Multiplier applied to the sum of subscription_cost_rollup_budget_components for the subscription rollup budget amount (default 1.2 = 20% headroom)."
  default     = 1.2

  validation {
    condition     = var.subscription_rollup_budget_headroom_multiplier > 1.0
    error_message = "subscription_rollup_budget_headroom_multiplier must be > 1.0."
  }
}

variable "subscription_cost_rollup_budget_name" {
  type        = string
  description = "TB-909: Azure Cost Management budget resource name for the subscription rollup."
  default     = "archlucid-subscription-rollup"

  validation {
    condition     = length(var.subscription_cost_rollup_budget_name) >= 1 && length(var.subscription_cost_rollup_budget_name) <= 63
    error_message = "subscription_cost_rollup_budget_name must be 1-63 characters."
  }
}

variable "subscription_cost_rollup_budget_time_period_start" {
  type        = string
  description = "TB-909: ISO8601 start date for the subscription rollup budget monthly period (e.g. 2026-04-01T00:00:00Z). Required when enable_subscription_cost_management is true."
  default     = ""
}

variable "subscription_cost_rollup_budget_contact_emails" {
  type        = list(string)
  description = "TB-909: FinOps emails for rollup budget and cost anomaly notifications. When empty, uses alert_email_address."
  default     = []
}

variable "subscription_cost_anomaly_alert_name" {
  type        = string
  description = "TB-909: Azure Cost Management scheduled action name for the subscription cost anomaly alert."
  default     = "archlucid-daily-cost-anomaly"
}

variable "subscription_cost_anomaly_alert_display_name" {
  type        = string
  description = "TB-909: Display name for the subscription cost anomaly alert in Azure Portal."
  default     = "ArchLucid daily cost anomaly"
}

variable "subscription_cost_anomaly_alert_email_subject" {
  type        = string
  description = "TB-909: Email subject line for cost anomaly notifications."
  default     = "ArchLucid Azure cost anomaly detected"
}