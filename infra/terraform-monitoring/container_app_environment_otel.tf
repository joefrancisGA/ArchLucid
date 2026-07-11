# Patches the Container Apps Environment OpenTelemetry agent (AzAPI) so apps export
# traces/logs to Application Insights and metrics to the AMW OTLP ingestion endpoint.

locals {
  # Plan-time gate: AMW default DCE id is unknown until the workspace exists.
  container_app_otel_requested = var.enable_monitoring_stack && var.enable_container_app_environment_otel && var.enable_application_insights && length(trimspace(var.container_app_environment_resource_id)) > 0

  application_insights_connection_string_effective = local.application_insights_enabled ? azurerm_application_insights.archlucid[0].connection_string : ""

  amw_otlp_metrics_endpoint_effective = length(trimspace(var.amw_otlp_metrics_ingestion_endpoint)) > 0 ? trimspace(var.amw_otlp_metrics_ingestion_endpoint) : try(
    data.azapi_resource.amw_default_dce[0].output.properties.logsIngestion.endpoint,
    try(jsondecode(data.azapi_resource.amw_default_dce[0].output).properties.logsIngestion.endpoint, "")
  )

  amw_prometheus_query_endpoint_effective = length(trimspace(var.azure_monitor_prometheus_query_endpoint)) > 0 ? trimspace(var.azure_monitor_prometheus_query_endpoint) : (
    local.managed_prometheus_workspace_enabled ? azurerm_monitor_workspace.prometheus[0].query_endpoint : ""
  )
}

data "azapi_resource" "amw_default_dce" {
  count = local.container_app_otel_requested && local.managed_prometheus_workspace_enabled && length(trimspace(var.amw_otlp_metrics_ingestion_endpoint)) == 0 ? 1 : 0

  type        = "Microsoft.Insights/dataCollectionEndpoints@2022-06-01"
  resource_id = azurerm_monitor_workspace.prometheus[0].default_data_collection_endpoint_id
}

data "azapi_resource" "container_app_environment_current" {
  count = local.container_app_otel_requested ? 1 : 0

  type        = "Microsoft.App/managedEnvironments@2025-02-02-preview"
  resource_id = var.container_app_environment_resource_id
}

resource "azapi_update_resource" "container_app_environment_otel" {
  count = local.container_app_otel_requested && local.application_insights_enabled && length(local.application_insights_connection_string_effective) > 0 && length(local.amw_otlp_metrics_endpoint_effective) > 0 ? 1 : 0

  type        = "Microsoft.App/managedEnvironments@2025-02-02-preview"
  resource_id = var.container_app_environment_resource_id

  body = {
    properties = merge(
      {
        appInsightsConfiguration = {
          connectionString = local.application_insights_connection_string_effective
        }
        openTelemetryConfiguration = {
          tracesConfiguration = {
            destinations = ["appInsights"]
          }
          logsConfiguration = {
            destinations = ["appInsights"]
          }
          metricsConfiguration = {
            destinations = [var.amw_otlp_destination_name]
            includeKeda    = true
          }
          destinationsConfiguration = {
            otlpConfigurations = [
              {
                name     = var.amw_otlp_destination_name
                endpoint = local.amw_otlp_metrics_endpoint_effective
                insecure = true
              }
            ]
          }
        }
      },
      {
        logAnalyticsConfiguration = try(data.azapi_resource.container_app_environment_current[0].output.properties.logAnalyticsConfiguration, null)
        appLogsConfiguration      = try(data.azapi_resource.container_app_environment_current[0].output.properties.appLogsConfiguration, null)
      }
    )
  }

  lifecycle {
    ignore_changes = [
      body.properties.vnetConfiguration,
      body.properties.workloadProfiles,
      body.properties.infrastructureResourceGroup,
    ]
  }
}
