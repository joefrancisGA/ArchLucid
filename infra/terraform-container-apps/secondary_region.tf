# Optional active-secondary region: separate resource group + Log Analytics + CAE + API/worker/UI
# mirroring the primary stack. Wire Azure Front Door secondary origin to output secondary_api_https_url.

locals {
  secondary_stack_enabled = var.enable_container_apps && var.secondary_region_stack_enabled

  secondary_subnet_integrated = local.secondary_stack_enabled && length(trimspace(var.secondary_container_apps_subnet_id)) > 0
}

data "azurerm_resource_group" "secondary_target" {
  count = local.secondary_stack_enabled && !var.secondary_create_resource_group ? 1 : 0

  name = var.secondary_resource_group_name
}

resource "azurerm_resource_group" "secondary" {
  count = local.secondary_stack_enabled && var.secondary_create_resource_group ? 1 : 0

  name     = var.secondary_resource_group_name
  location = var.secondary_location
  tags     = local.merged_tags
}

locals {
  secondary_resource_group_name_effective = !local.secondary_stack_enabled ? "" : (
    var.secondary_create_resource_group ? azurerm_resource_group.secondary[0].name : data.azurerm_resource_group.secondary_target[0].name
  )

  secondary_azure_location = !local.secondary_stack_enabled ? "" : (
    var.secondary_create_resource_group ? var.secondary_location : data.azurerm_resource_group.secondary_target[0].location
  )
}

resource "azurerm_log_analytics_workspace" "secondary" {
  count = local.secondary_stack_enabled ? 1 : 0

  name                = var.secondary_log_analytics_workspace_name
  location            = local.secondary_azure_location
  resource_group_name = local.secondary_resource_group_name_effective
  sku                 = "PerGB2018"
  retention_in_days   = 30
  daily_quota_gb      = var.log_analytics_daily_quota_gb > 0 ? var.log_analytics_daily_quota_gb : null
  tags                = local.merged_tags
}

resource "azurerm_container_app_environment" "secondary" {
  count = local.secondary_stack_enabled ? 1 : 0

  name                       = var.secondary_container_app_environment_name
  location                   = local.secondary_azure_location
  resource_group_name        = local.secondary_resource_group_name_effective
  log_analytics_workspace_id = azurerm_log_analytics_workspace.secondary[0].id
  tags                       = local.merged_tags

  infrastructure_subnet_id = local.secondary_subnet_integrated ? var.secondary_container_apps_subnet_id : null

  internal_load_balancer_enabled = local.secondary_subnet_integrated && var.secondary_container_apps_internal_load_balancer
}

resource "azurerm_container_app" "api_secondary" {
  count = local.secondary_stack_enabled ? 1 : 0

  name                         = var.secondary_api_container_app_name
  container_app_environment_id = azurerm_container_app_environment.secondary[0].id
  resource_group_name          = local.secondary_resource_group_name_effective
  revision_mode                = var.api_revision_mode
  tags                         = local.merged_tags

  identity {
    type = "SystemAssigned"
  }

  template {
    min_replicas = var.secondary_api_min_replicas
    max_replicas = var.secondary_api_max_replicas

    container {
      name   = "archlucid-api-secondary"
      image  = var.api_container_image
      cpu    = var.api_cpu
      memory = var.api_memory

      env {
        name  = "ASPNETCORE_URLS"
        value = "http://0.0.0.0:8080"
      }

      env {
        name  = "Hosting__Role"
        value = "Api"
      }

      env {
        name  = "ArtifactLargePayload__Enabled"
        value = "true"
      }

      env {
        name  = "ArtifactLargePayload__BlobProvider"
        value = "AzureBlob"
      }

      env {
        name  = "ArtifactLargePayload__AzureBlobServiceUri"
        value = var.artifact_blob_service_uri
      }

      dynamic "env" {
        for_each = local.background_jobs_durable ? [1] : []
        content {
          name  = "BackgroundJobs__Mode"
          value = "Durable"
        }
      }

      dynamic "env" {
        for_each = local.background_jobs_durable ? [1] : []
        content {
          name  = "BackgroundJobs__QueueName"
          value = var.background_jobs_queue_name
        }
      }

      dynamic "env" {
        for_each = local.background_jobs_durable ? [1] : []
        content {
          name  = "BackgroundJobs__ResultsContainerName"
          value = var.background_jobs_results_container
        }
      }

      dynamic "env" {
        for_each = length(trimspace(var.secondary_read_replica_connection_string)) > 0 ? [1] : []
        content {
          name  = "SqlServer__ReadReplica__AuthorityRunListReadsConnectionString"
          value = var.secondary_read_replica_connection_string
        }
      }

      liveness_probe {
        transport = "HTTP"
        port      = 8080
        path      = "/health/live"
      }

      readiness_probe {
        transport = "HTTP"
        port      = 8080
        path      = "/health/ready"
      }
    }

    http_scale_rule {
      name                = "http-concurrency"
      concurrent_requests = var.api_scale_concurrent_requests
    }
  }

  ingress {
    allow_insecure_connections = false
    external_enabled           = var.api_ingress_external
    target_port                = 8080
    transport                  = "auto"

    traffic_weight {
      latest_revision = true
      percentage      = 100
    }
  }
}

resource "azurerm_role_assignment" "api_secondary_blob_data_contributor" {
  count = local.secondary_stack_enabled ? 1 : 0

  scope                = var.artifact_storage_account_id
  role_definition_name = "Storage Blob Data Contributor"
  principal_id         = azurerm_container_app.api_secondary[0].identity[0].principal_id
}

resource "azurerm_role_assignment" "api_secondary_queue_data_message_sender" {
  count = local.secondary_stack_enabled && local.background_jobs_durable && trimspace(var.artifact_storage_account_id) != "" ? 1 : 0

  scope                = var.artifact_storage_account_id
  role_definition_name = "Storage Queue Data Message Sender"
  principal_id         = azurerm_container_app.api_secondary[0].identity[0].principal_id
}

resource "azurerm_container_app" "worker_secondary" {
  count = local.secondary_stack_enabled ? 1 : 0

  name                         = var.secondary_worker_container_app_name
  container_app_environment_id = azurerm_container_app_environment.secondary[0].id
  resource_group_name          = local.secondary_resource_group_name_effective
  revision_mode                = var.worker_revision_mode
  tags                         = local.merged_tags

  dynamic "secret" {
    for_each = local.worker_queue_scale_enabled ? [1] : []
    content {
      name  = "queue-scale-connection"
      value = var.worker_queue_scale_connection_string
    }
  }

  identity {
    type = "SystemAssigned"
  }

  template {
    min_replicas = var.secondary_worker_min_replicas
    max_replicas = var.secondary_worker_max_replicas

    container {
      name    = "archlucid-worker-secondary"
      image   = local.worker_effective_image
      cpu     = var.worker_cpu
      memory  = var.worker_memory
      command = ["dotnet", "ArchLucid.Worker.dll"]

      env {
        name  = "ASPNETCORE_URLS"
        value = "http://0.0.0.0:8080"
      }

      env {
        name  = "Hosting__Role"
        value = "Worker"
      }

      env {
        name  = "ArtifactLargePayload__Enabled"
        value = "true"
      }

      env {
        name  = "ArtifactLargePayload__BlobProvider"
        value = "AzureBlob"
      }

      env {
        name  = "ArtifactLargePayload__AzureBlobServiceUri"
        value = var.artifact_blob_service_uri
      }

      dynamic "env" {
        for_each = local.background_jobs_durable ? [1] : []
        content {
          name  = "BackgroundJobs__Mode"
          value = "Durable"
        }
      }

      dynamic "env" {
        for_each = local.background_jobs_durable ? [1] : []
        content {
          name  = "BackgroundJobs__QueueName"
          value = var.background_jobs_queue_name
        }
      }

      dynamic "env" {
        for_each = local.background_jobs_durable ? [1] : []
        content {
          name  = "BackgroundJobs__ResultsContainerName"
          value = var.background_jobs_results_container
        }
      }

      liveness_probe {
        transport = "HTTP"
        port      = 8080
        path      = "/health/live"
      }

      readiness_probe {
        transport = "HTTP"
        port      = 8080
        path      = "/health/ready"
      }
    }

    dynamic "custom_scale_rule" {
      for_each = local.worker_queue_scale_enabled ? [1] : []
      content {
        name             = "background-jobs-queue-depth"
        custom_rule_type = "azure-queue"
        metadata = {
          queueName   = var.background_jobs_queue_name
          queueLength = tostring(var.worker_queue_depth_target_messages_per_revision)
        }

        authentication {
          secret_name       = "queue-scale-connection"
          trigger_parameter = "connection"
        }
      }
    }
  }
}

resource "azurerm_role_assignment" "worker_secondary_blob_data_contributor" {
  count = local.secondary_stack_enabled ? 1 : 0

  scope                = var.artifact_storage_account_id
  role_definition_name = "Storage Blob Data Contributor"
  principal_id         = azurerm_container_app.worker_secondary[0].identity[0].principal_id
}

resource "azurerm_role_assignment" "worker_secondary_queue_data_message_processor" {
  count = local.secondary_stack_enabled && local.background_jobs_durable && trimspace(var.artifact_storage_account_id) != "" ? 1 : 0

  scope                = var.artifact_storage_account_id
  role_definition_name = "Storage Queue Data Message Processor"
  principal_id         = azurerm_container_app.worker_secondary[0].identity[0].principal_id
}

resource "azurerm_container_app" "ui_secondary" {
  count = local.secondary_stack_enabled ? 1 : 0

  name                         = var.secondary_ui_container_app_name
  container_app_environment_id = azurerm_container_app_environment.secondary[0].id
  resource_group_name          = local.secondary_resource_group_name_effective
  revision_mode                = var.ui_revision_mode
  tags                         = local.merged_tags

  template {
    min_replicas = var.secondary_ui_min_replicas
    max_replicas = var.secondary_ui_max_replicas

    container {
      name   = "archlucid-ui-secondary"
      image  = var.ui_container_image
      cpu    = var.ui_cpu
      memory = var.ui_memory

      env {
        name  = "PORT"
        value = "3000"
      }

      env {
        name  = "HOSTNAME"
        value = "0.0.0.0"
      }

      liveness_probe {
        transport = "HTTP"
        port      = 3000
        path      = "/"
      }

      readiness_probe {
        transport = "HTTP"
        port      = 3000
        path      = "/"
      }
    }

    http_scale_rule {
      name                = "http-concurrency"
      concurrent_requests = var.ui_scale_concurrent_requests
    }
  }

  ingress {
    allow_insecure_connections = false
    external_enabled           = var.ui_ingress_external
    target_port                = 3000
    transport                  = "auto"

    traffic_weight {
      latest_revision = true
      percentage      = 100
    }
  }
}
