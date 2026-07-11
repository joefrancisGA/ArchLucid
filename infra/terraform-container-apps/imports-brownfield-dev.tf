# Brownfield imports for dev resources that already exist in Azure but are missing from the
# remote Terraform state backing CD. Remove this file after the first successful
# `terraform apply` on the dev backend — a second apply errors when imports remain and
# resources are already managed.

data "azurerm_client_config" "brownfield_import" {}

locals {
  brownfield_import_subscription_id = data.azurerm_client_config.brownfield_import.subscription_id
  brownfield_import_rg              = var.resource_group_name
}

import {
  to = azurerm_log_analytics_workspace.container_apps[0]
  id = "/subscriptions/${local.brownfield_import_subscription_id}/resourceGroups/${local.brownfield_import_rg}/providers/Microsoft.OperationalInsights/workspaces/${var.log_analytics_workspace_name}"
}

import {
  to = azurerm_user_assigned_identity.acr_pull[0]
  id = "/subscriptions/${local.brownfield_import_subscription_id}/resourceGroups/${local.brownfield_import_rg}/providers/Microsoft.ManagedIdentity/userAssignedIdentities/id-archlucid-acr-pull"
}

import {
  to = azurerm_user_assigned_identity.api_sql_runtime[0]
  id = "/subscriptions/${local.brownfield_import_subscription_id}/resourceGroups/${local.brownfield_import_rg}/providers/Microsoft.ManagedIdentity/userAssignedIdentities/id-archlucid-api-sql-runtime"
}

import {
  to = azurerm_container_app_environment.main[0]
  id = "/subscriptions/${local.brownfield_import_subscription_id}/resourceGroups/${local.brownfield_import_rg}/providers/Microsoft.App/managedEnvironments/${var.container_app_environment_name}"
}

import {
  to = azurerm_container_app.api[0]
  id = "/subscriptions/${local.brownfield_import_subscription_id}/resourceGroups/${local.brownfield_import_rg}/providers/Microsoft.App/containerApps/${var.api_container_app_name}"
}

import {
  to = azurerm_container_app.worker[0]
  id = "/subscriptions/${local.brownfield_import_subscription_id}/resourceGroups/${local.brownfield_import_rg}/providers/Microsoft.App/containerApps/${var.worker_container_app_name}"
}

import {
  to = azurerm_container_app.ui[0]
  id = "/subscriptions/${local.brownfield_import_subscription_id}/resourceGroups/${local.brownfield_import_rg}/providers/Microsoft.App/containerApps/${var.ui_container_app_name}"
}
