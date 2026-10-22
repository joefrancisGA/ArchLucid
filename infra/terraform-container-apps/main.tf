# Container Apps (API / Worker / UI) Ã¢â‚¬â€ Terraform resource labels use `archlucid` naming (greenfield IaC).
# Rename via `terraform state mv` during a planned maintenance window.
# Greenfield IaC — see docs/library/V1_DEFERRED.md §3 (no brownfield state mv).

# count = local.enabled ? 1 : 0 creates exactly one Azure resource when enabled, zero when disabled.
# data blocks read existing Azure objects; resource blocks declare infrastructure Terraform owns in state.

locals {
  enabled = var.enable_container_apps

  # FinOps: merge application tag + caller tags + optional standard keys (see variables finops_*).
  merged_tags = merge(
    { Application = "ArchLucid" },
    var.tags,
    length(trimspace(var.finops_environment)) > 0 ? { Environment = trimspace(var.finops_environment) } : {},
    length(trimspace(var.finops_cost_center)) > 0 ? { CostCenter = trimspace(var.finops_cost_center) } : {}
  )

  subnet_integrated = local.enabled && length(trimspace(var.container_apps_subnet_id)) > 0

  # Single image: publish ArchLucid.Api + ArchLucid.Worker into /app. Override worker_container_image to use a different tag if needed.
  worker_effective_image = trimspace(var.worker_container_image) != "" ? var.worker_container_image : var.api_container_image

  background_jobs_durable = local.enabled && var.background_jobs_mode == "Durable"

  # KEDA-style azure-queue scale rule (Container Apps): requires a storage connection string secret (see variables).
  worker_queue_scale_enabled = local.background_jobs_durable && var.worker_enable_queue_depth_scaling && length(
    trimspace(var.worker_queue_scale_connection_string)
  ) > 0

  # KEDA Prometheus scaler: authority SQL outbox depth as reported by scraped worker metrics (`archlucid_authority_pipeline_work_pending`).
  worker_authority_prom_scale_enabled = local.enabled && var.worker_enable_authority_outbox_prom_scale && length(
    trimspace(var.worker_authority_outbox_prom_server_address)
  ) > 0

  worker_authority_prom_bearer_configured = length(trimspace(var.worker_authority_outbox_prom_bearer_token)) > 0

  # Parse storage account name from blob endpoint (https://{acct}.blob.core.windows.net) for queue resource + RBAC scope alignment.
  artifact_storage_account_name_from_blob = local.enabled && length(trimspace(var.artifact_blob_service_uri)) > 0 && can(
    regex("^https://([^.]+)\\.blob\\.core\\.windows\\.net/?$", var.artifact_blob_service_uri)
  ) ? regex("^https://([^.]+)\\.blob\\.core\\.windows\\.net/?$", var.artifact_blob_service_uri)[0] : ""

  # Private ACR: shared user-assigned identity + AcrPull (see azurerm_user_assigned_identity.acr_pull).
  acr_pull_enabled = local.enabled && length(trimspace(var.acr_resource_id)) > 0

  acr_registry_id_parts = local.acr_pull_enabled ? regex(
    "^/subscriptions/[0-9a-fA-F-]+/resourceGroups/([^/]+)/providers/Microsoft.ContainerRegistry/registries/([^/]+)$",
    var.acr_resource_id
  ) : []

  acr_rg_for_pull   = length(local.acr_registry_id_parts) > 0 ? local.acr_registry_id_parts[0] : ""
  acr_name_for_pull = length(local.acr_registry_id_parts) > 1 ? local.acr_registry_id_parts[1] : ""

  api_keyvault_uami_enabled    = local.enabled && length(trimspace(var.api_keyvault_user_assigned_identity_id)) > 0
  worker_keyvault_uami_enabled = local.enabled && length(trimspace(var.worker_keyvault_user_assigned_identity_id)) > 0

  # Least-privilege SQL runtime identity: separate from the API's system-assigned identity, which keeps
  # db_owner-equivalent rights for schema bootstrap. See variable enable_api_sql_runtime_identity.
  api_sql_runtime_identity_enabled = local.enabled && var.enable_api_sql_runtime_identity

  api_user_assigned_identity_ids = compact(concat(
    local.acr_pull_enabled ? [azurerm_user_assigned_identity.acr_pull[0].id] : [],
    local.api_keyvault_uami_enabled ? [trimspace(var.api_keyvault_user_assigned_identity_id)] : [],
    local.api_sql_runtime_identity_enabled ? [azurerm_user_assigned_identity.api_sql_runtime[0].id] : [],
  ))

  worker_user_assigned_identity_ids = compact(concat(
    local.acr_pull_enabled ? [azurerm_user_assigned_identity.acr_pull[0].id] : [],
    local.worker_keyvault_uami_enabled ? [trimspace(var.worker_keyvault_user_assigned_identity_id)] : [],
  ))

  api_has_user_assigned_identities    = length(local.api_user_assigned_identity_ids) > 0
  worker_has_user_assigned_identities = length(local.worker_user_assigned_identity_ids) > 0

  # TB-304: Production-like ApiKey hosts need all three claim GUIDs (not headers/defaults).
  api_key_scope_bound = (
    length(trimspace(var.api_key_tenant_id)) > 0 &&
    length(trimspace(var.api_key_workspace_id)) > 0 &&
    length(trimspace(var.api_key_project_id)) > 0
  )

  api_cpu_scale_enabled    = local.enabled && var.api_enable_cpu_scale_rule
  api_memory_scale_enabled = local.enabled && var.api_enable_memory_scale_rule
  ui_cpu_scale_enabled     = local.enabled && var.ui_enable_cpu_scale_rule
}

data "azurerm_resource_group" "target" {
  count = local.enabled && !var.create_resource_group ? 1 : 0

  name = var.resource_group_name
}

resource "azurerm_resource_group" "this" {
  count = local.enabled && var.create_resource_group ? 1 : 0

  name     = var.resource_group_name
  location = var.location
  tags     = local.merged_tags
}

locals {
  resource_group_name = !local.enabled ? "" : (
    var.create_resource_group ? azurerm_resource_group.this[0].name : data.azurerm_resource_group.target[0].name
  )

  # Prefer explicit var.location so brownfield RGs (metadata region eastus2) can still host
  # compute next to SQL in centralus. Fall back to the existing RG location when location is omitted.
  azure_location = !local.enabled ? "" : (
    length(trimspace(var.location)) > 0 ? trimspace(var.location) : (
      var.create_resource_group ? var.location : data.azurerm_resource_group.target[0].location
    )
  )
}

resource "azurerm_log_analytics_workspace" "container_apps" {
  count = local.enabled ? 1 : 0

  name                = var.log_analytics_workspace_name
  location            = local.azure_location
  resource_group_name = local.resource_group_name
  sku                 = "PerGB2018"
  retention_in_days   = 30
  daily_quota_gb      = var.log_analytics_daily_quota_gb > 0 ? var.log_analytics_daily_quota_gb : null
  tags                = var.tags
}

resource "azurerm_container_app_environment" "main" {
  count = local.enabled ? 1 : 0

  name                       = var.container_app_environment_name
  location                   = local.azure_location
  resource_group_name        = local.resource_group_name
  log_analytics_workspace_id = azurerm_log_analytics_workspace.container_apps[0].id
  tags                       = local.merged_tags

  # azurerm 4.x: do not set internal_load_balancer_enabled when there is no subnet (pair must be omitted together for public-only env).
  infrastructure_subnet_id = local.subnet_integrated ? var.container_apps_subnet_id : null

  internal_load_balancer_enabled = local.subnet_integrated ? var.container_apps_internal_load_balancer : null
}

data "azurerm_container_registry" "for_pull" {
  count = local.acr_pull_enabled ? 1 : 0

  name                = local.acr_name_for_pull
  resource_group_name = local.acr_rg_for_pull
}

resource "azurerm_user_assigned_identity" "acr_pull" {
  count = local.acr_pull_enabled ? 1 : 0

  location            = local.azure_location
  resource_group_name = local.resource_group_name
  name                = "id-archlucid-acr-pull"
  tags                = local.merged_tags
}

resource "azurerm_role_assignment" "acr_pull_identity" {
  count = local.acr_pull_enabled ? 1 : 0

  scope                = var.acr_resource_id
  role_definition_name = "AcrPull"
  principal_id         = azurerm_user_assigned_identity.acr_pull[0].principal_id
}

# Least-privilege SQL runtime identity (see variable enable_api_sql_runtime_identity). Not granted any
# Azure RBAC role here: SQL-side authorization is a database role membership ([ArchLucidApp]), created
# out of band per docs/security/MANAGED_IDENTITY_SQL_BLOB.md. The API's system-assigned identity keeps
# db_owner-equivalent rights for schema bootstrap; this identity is for tenant-data/query connections only.
resource "azurerm_user_assigned_identity" "api_sql_runtime" {
  count = local.api_sql_runtime_identity_enabled ? 1 : 0

  location            = local.azure_location
  resource_group_name = local.resource_group_name
  name                = "id-archlucid-api-sql-runtime"
  tags                = local.merged_tags
}

resource "azurerm_container_app" "api" {
  count = local.enabled ? 1 : 0

  name                         = var.api_container_app_name
  container_app_environment_id = azurerm_container_app_environment.main[0].id
  resource_group_name          = local.resource_group_name
  revision_mode                = var.api_revision_mode
  tags                         = local.merged_tags

  depends_on = [azurerm_role_assignment.acr_pull_identity]

  identity {
    type = local.api_has_user_assigned_identities ? "SystemAssigned, UserAssigned" : "SystemAssigned"

    identity_ids = local.api_has_user_assigned_identities ? local.api_user_assigned_identity_ids : null
  }

  dynamic "registry" {
    for_each = local.acr_pull_enabled ? [1] : []
    content {
      server   = data.azurerm_container_registry.for_pull[0].login_server
      identity = azurerm_user_assigned_identity.acr_pull[0].id
    }
  }


  dynamic "secret" {
    for_each = local.hot_path_cache_redis_configured ? [1] : []
    content {
      name  = "hot-path-redis-connection"
      value = var.hot_path_cache_redis_connection_string
    }
  }


  template {
    min_replicas = var.api_min_replicas
    max_replicas = var.api_max_replicas

    container {
      name   = "archlucid-api"
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

      # TB-304 trusted ApiKey scope claims (omit when unset — see variables api_key_*_id).
      dynamic "env" {
        for_each = local.api_key_scope_bound ? [1] : []
        content {
          name  = "Authentication__ApiKey__TenantId"
          value = trimspace(var.api_key_tenant_id)
        }
      }

      dynamic "env" {
        for_each = local.api_key_scope_bound ? [1] : []
        content {
          name  = "Authentication__ApiKey__WorkspaceId"
          value = trimspace(var.api_key_workspace_id)
        }
      }

      dynamic "env" {
        for_each = local.api_key_scope_bound ? [1] : []
        content {
          name  = "Authentication__ApiKey__ProjectId"
          value = trimspace(var.api_key_project_id)
        }
      }

      dynamic "env" {
        for_each = local.api_keyvault_uami_enabled && length(trimspace(var.api_keyvault_user_assigned_identity_client_id)) > 0 ? [1] : []
        content {
          name  = "AZURE_CLIENT_ID"
          value = trimspace(var.api_keyvault_user_assigned_identity_client_id)
        }
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
        for_each = local.azure_openai_app_configured ? [1] : []
        content {
          name  = "AzureOpenAI__AuthenticationMode"
          value = "ManagedIdentity"
        }
      }

      dynamic "env" {
        for_each = local.azure_openai_app_configured ? [1] : []
        content {
          name  = "AzureOpenAI__Endpoint"
          value = trimspace(var.azure_openai_endpoint)
        }
      }

      dynamic "env" {
        for_each = local.azure_openai_app_configured ? [1] : []
        content {
          name  = "AzureOpenAI__DeploymentName"
          value = trimspace(var.azure_openai_chat_deployment_name)
        }
      }

      dynamic "env" {
        for_each = local.azure_openai_app_configured ? [1] : []
        content {
          name  = "AzureOpenAI__EmbeddingDeploymentName"
          value = trimspace(var.azure_openai_embedding_deployment_name)
        }
      }

      dynamic "env" {
        for_each = local.fallback_llm_app_configured ? [1] : []
        content {
          name  = "ArchLucid__FallbackLlm__Enabled"
          value = "true"
        }
      }

      dynamic "env" {
        for_each = local.fallback_llm_app_configured ? [1] : []
        content {
          name  = "ArchLucid__FallbackLlm__Endpoints__0__Endpoint"
          value = trimspace(var.fallback_llm_endpoint)
        }
      }

      dynamic "env" {
        for_each = local.fallback_llm_app_configured ? [1] : []
        content {
          name  = "ArchLucid__FallbackLlm__Endpoints__0__DeploymentName"
          value = trimspace(var.fallback_llm_deployment_name)
        }
      }

      dynamic "env" {
        for_each = local.fallback_llm_app_configured ? [1] : []
        content {
          name  = "ArchLucid__FallbackLlm__Endpoints__0__UseManagedIdentity"
          value = "true"
        }
      }

      dynamic "env" {
        for_each = local.azure_search_app_configured ? [1] : []
        content {
          name  = "Retrieval__VectorIndex"
          value = "AzureSearch"
        }
      }

      dynamic "env" {
        for_each = local.azure_search_app_configured ? [1] : []
        content {
          name  = "Retrieval__AzureSearch__Endpoint"
          value = trimspace(var.azure_search_endpoint)
        }
      }

      dynamic "env" {
        for_each = local.azure_search_app_configured ? [1] : []
        content {
          name  = "Retrieval__AzureSearch__IndexName"
          value = trimspace(var.azure_search_index_name)
        }
      }

      dynamic "env" {
        for_each = local.azure_search_app_configured ? [1] : []
        content {
          name  = "Retrieval__Reranking__Provider"
          value = "AzureAiSearchSemantic"
        }
      }
      dynamic "env" {
        for_each = local.hot_path_cache_redis_configured ? [1] : []
        content {
          name        = "HotPathCache__RedisConnectionString"
          secret_name = "hot-path-redis-connection"
        }
      }
      dynamic "env" {
        for_each = local.hot_path_cache_redis_configured ? [1] : []
        content {
          name  = "HotPathCache__ExpectedApiReplicaCount"
          value = tostring(var.api_max_replicas)
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
        transport               = "HTTP"
        port                    = 8080
        path                    = "/health/live"
        initial_delay           = 10
        interval_seconds        = 10
        timeout                 = 5
        failure_count_threshold = 3
      }

      # ACA readiness uses /health/live (fast). CD smoke requires GET /health/ready Healthy —
      # deep ready exceeds ACA probe budgets and recycled revisions. See
      # docs/operations/HEALTH_LIVE_READY_DEPENDENCY_MATRIX.md.
      readiness_probe {
        transport               = "HTTP"
        port                    = 8080
        path                    = "/health/live"
        initial_delay           = 5
        interval_seconds        = 5
        timeout                 = 5
        failure_count_threshold = 6
        success_count_threshold = 1
      }
    }

    http_scale_rule {
      name                = "http-concurrency"
      concurrent_requests = var.api_scale_concurrent_requests
    }

    dynamic "custom_scale_rule" {
      for_each = local.api_cpu_scale_enabled ? [1] : []
      content {
        name             = "cpu-utilization"
        custom_rule_type = "cpu"
        metadata = {
          type  = "Utilization"
          value = tostring(var.api_cpu_scale_utilization_percent)
        }
      }
    }

    dynamic "custom_scale_rule" {
      for_each = local.api_memory_scale_enabled ? [1] : []
      content {
        name             = "memory-utilization"
        custom_rule_type = "memory"
        metadata = {
          type  = "Utilization"
          value = tostring(var.api_memory_scale_utilization_percent)
        }
      }
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
  # TB-657: CD owns runtime image tags (cd.yml `az containerapp update`). Terraform seeds warm-start pins only.
  # env/secret also drift from ad-hoc `az containerapp update --set-env-vars` / `secret set` calls (deployment
  # metadata, auth mode toggles, ConnectionStrings overrides) made outside this module; ignore to avoid apply
  # deleting operator/CD-managed values that Terraform's config does not declare.
  lifecycle {
    ignore_changes = [
      template[0].container[0].image,
      template[0].container[0].env,
      secret,
    ]
  }
}

resource "azurerm_role_assignment" "api_blob_data_contributor" {
  count = local.enabled ? 1 : 0

  scope                = var.artifact_storage_account_id
  role_definition_name = "Storage Blob Data Contributor"
  principal_id         = azurerm_container_app.api[0].identity[0].principal_id
}

resource "azurerm_storage_queue" "background_jobs" {
  count = local.background_jobs_durable && local.artifact_storage_account_name_from_blob != "" ? 1 : 0

  name                 = var.background_jobs_queue_name
  storage_account_name = local.artifact_storage_account_name_from_blob
}

resource "azurerm_role_assignment" "api_queue_data_message_sender" {
  count = local.background_jobs_durable && trimspace(var.artifact_storage_account_id) != "" ? 1 : 0

  scope                = var.artifact_storage_account_id
  role_definition_name = "Storage Queue Data Message Sender"
  principal_id         = azurerm_container_app.api[0].identity[0].principal_id
}

resource "azurerm_container_app" "worker" {
  count = local.enabled ? 1 : 0

  name                         = var.worker_container_app_name
  container_app_environment_id = azurerm_container_app_environment.main[0].id
  resource_group_name          = local.resource_group_name
  revision_mode                = var.worker_revision_mode
  tags                         = local.merged_tags

  depends_on = [azurerm_role_assignment.acr_pull_identity]

  dynamic "secret" {
    for_each = local.worker_queue_scale_enabled ? [1] : []
    content {
      name  = "queue-scale-connection"
      value = var.worker_queue_scale_connection_string
    }
  }

  dynamic "secret" {
    for_each = local.worker_authority_prom_scale_enabled && local.worker_authority_prom_bearer_configured ? [1] : []
    content {
      name  = "authority-outbox-prom-bearer"
      value = var.worker_authority_outbox_prom_bearer_token
    }
  }

  identity {
    type = local.worker_has_user_assigned_identities ? "SystemAssigned, UserAssigned" : "SystemAssigned"

    identity_ids = local.worker_has_user_assigned_identities ? local.worker_user_assigned_identity_ids : null
  }

  dynamic "registry" {
    for_each = local.acr_pull_enabled ? [1] : []
    content {
      server   = data.azurerm_container_registry.for_pull[0].login_server
      identity = azurerm_user_assigned_identity.acr_pull[0].id
    }
  }


  dynamic "secret" {
    for_each = local.hot_path_cache_redis_configured ? [1] : []
    content {
      name  = "hot-path-redis-connection"
      value = var.hot_path_cache_redis_connection_string
    }
  }


  template {
    min_replicas                      = var.worker_min_replicas
    max_replicas                      = var.worker_max_replicas
    termination_grace_period_seconds  = var.worker_termination_grace_period_seconds

    container {
      name    = "archlucid-worker"
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
      dynamic "env" {
        for_each = local.worker_keyvault_uami_enabled && length(trimspace(var.worker_keyvault_user_assigned_identity_client_id)) > 0 ? [1] : []
        content {
          name  = "AZURE_CLIENT_ID"
          value = trimspace(var.worker_keyvault_user_assigned_identity_client_id)
        }
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
        for_each = local.azure_openai_app_configured ? [1] : []
        content {
          name  = "AzureOpenAI__AuthenticationMode"
          value = "ManagedIdentity"
        }
      }

      dynamic "env" {
        for_each = local.azure_openai_app_configured ? [1] : []
        content {
          name  = "AzureOpenAI__Endpoint"
          value = trimspace(var.azure_openai_endpoint)
        }
      }

      dynamic "env" {
        for_each = local.azure_openai_app_configured ? [1] : []
        content {
          name  = "AzureOpenAI__DeploymentName"
          value = trimspace(var.azure_openai_chat_deployment_name)
        }
      }

      dynamic "env" {
        for_each = local.azure_openai_app_configured ? [1] : []
        content {
          name  = "AzureOpenAI__EmbeddingDeploymentName"
          value = trimspace(var.azure_openai_embedding_deployment_name)
        }
      }

      dynamic "env" {
        for_each = local.fallback_llm_app_configured ? [1] : []
        content {
          name  = "ArchLucid__FallbackLlm__Enabled"
          value = "true"
        }
      }

      dynamic "env" {
        for_each = local.fallback_llm_app_configured ? [1] : []
        content {
          name  = "ArchLucid__FallbackLlm__Endpoints__0__Endpoint"
          value = trimspace(var.fallback_llm_endpoint)
        }
      }

      dynamic "env" {
        for_each = local.fallback_llm_app_configured ? [1] : []
        content {
          name  = "ArchLucid__FallbackLlm__Endpoints__0__DeploymentName"
          value = trimspace(var.fallback_llm_deployment_name)
        }
      }

      dynamic "env" {
        for_each = local.fallback_llm_app_configured ? [1] : []
        content {
          name  = "ArchLucid__FallbackLlm__Endpoints__0__UseManagedIdentity"
          value = "true"
        }
      }

      dynamic "env" {
        for_each = local.azure_search_app_configured ? [1] : []
        content {
          name  = "Retrieval__VectorIndex"
          value = "AzureSearch"
        }
      }

      dynamic "env" {
        for_each = local.azure_search_app_configured ? [1] : []
        content {
          name  = "Retrieval__AzureSearch__Endpoint"
          value = trimspace(var.azure_search_endpoint)
        }
      }

      dynamic "env" {
        for_each = local.azure_search_app_configured ? [1] : []
        content {
          name  = "Retrieval__AzureSearch__IndexName"
          value = trimspace(var.azure_search_index_name)
        }
      }

      dynamic "env" {
        for_each = local.azure_search_app_configured ? [1] : []
        content {
          name  = "Retrieval__Reranking__Provider"
          value = "AzureAiSearchSemantic"
        }
      }

      dynamic "env" {
        for_each = local.hot_path_cache_redis_configured ? [1] : []
        content {
          name        = "HotPathCache__RedisConnectionString"
          secret_name = "hot-path-redis-connection"
        }
      }

      dynamic "env" {
        for_each = local.hot_path_cache_redis_configured ? [1] : []
        content {
          name  = "HotPathCache__ExpectedApiReplicaCount"
          value = tostring(var.api_max_replicas)
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

    dynamic "custom_scale_rule" {
      for_each = local.worker_authority_prom_scale_enabled ? [1] : []
      content {
        name             = "authority-sql-outbox-depth-prometheus"
        custom_rule_type = "prometheus"
        metadata = merge(
          {
            serverAddress       = trimspace(var.worker_authority_outbox_prom_server_address)
            query               = trimspace(var.worker_authority_outbox_prom_query)
            threshold           = tostring(var.worker_authority_outbox_prom_pending_scale_threshold)
            activationThreshold = tostring(var.worker_authority_outbox_prom_activation_threshold)
            ignoreNullValues    = "false"
          },
          local.worker_authority_prom_bearer_configured ? { authModes = "bearer" } : {}
        )

        dynamic "authentication" {
          for_each = local.worker_authority_prom_bearer_configured ? [1] : []
          content {
            secret_name       = "authority-outbox-prom-bearer"
            trigger_parameter = "bearerToken"
          }
        }
      }
    }
  }

  # TB-657: CD owns runtime image tags (cd.yml `az containerapp update`). Terraform seeds warm-start pins only.
  # env/secret also drift from ad-hoc `az containerapp update --set-env-vars` / `secret set` calls (deployment
  # metadata, auth mode toggles, ConnectionStrings overrides) made outside this module; ignore to avoid apply
  # deleting operator/CD-managed values that Terraform's config does not declare.
  lifecycle {
    ignore_changes = [
      template[0].container[0].image,
      template[0].container[0].env,
      secret,
    ]
  }
}

resource "azurerm_role_assignment" "worker_blob_data_contributor" {
  count = local.enabled ? 1 : 0

  scope                = var.artifact_storage_account_id
  role_definition_name = "Storage Blob Data Contributor"
  principal_id         = azurerm_container_app.worker[0].identity[0].principal_id
}

resource "azurerm_role_assignment" "worker_queue_data_message_processor" {
  count = local.background_jobs_durable && trimspace(var.artifact_storage_account_id) != "" ? 1 : 0

  scope                = var.artifact_storage_account_id
  role_definition_name = "Storage Queue Data Message Processor"
  principal_id         = azurerm_container_app.worker[0].identity[0].principal_id
}

resource "azurerm_container_app" "ui" {
  count = local.enabled ? 1 : 0

  name                         = var.ui_container_app_name
  container_app_environment_id = azurerm_container_app_environment.main[0].id
  resource_group_name          = local.resource_group_name
  revision_mode                = var.ui_revision_mode
  tags                         = local.merged_tags

  depends_on = [azurerm_role_assignment.acr_pull_identity]

  dynamic "identity" {
    for_each = local.acr_pull_enabled ? [1] : []
    content {
      type = "UserAssigned"

      identity_ids = [azurerm_user_assigned_identity.acr_pull[0].id]
    }
  }

  dynamic "registry" {
    for_each = local.acr_pull_enabled ? [1] : []
    content {
      server   = data.azurerm_container_registry.for_pull[0].login_server
      identity = azurerm_user_assigned_identity.acr_pull[0].id
    }
  }

  template {
    min_replicas = var.ui_min_replicas
    max_replicas = var.ui_max_replicas

    container {
      name   = "archlucid-ui"
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

      env {
        name  = "ARCHLUCID_UI_ROLE"
        value = "operator"
      }

      # Lightweight UI process health (build fingerprint JSON). Does not call the API.
      liveness_probe {
        transport = "HTTP"
        port      = 3000
        path      = "/api/health"
      }

      readiness_probe {
        transport = "HTTP"
        port      = 3000
        path      = "/api/health"
      }
    }

    http_scale_rule {
      name                = "http-concurrency"
      concurrent_requests = var.ui_scale_concurrent_requests
    }

    dynamic "custom_scale_rule" {
      for_each = local.ui_cpu_scale_enabled ? [1] : []
      content {
        name             = "cpu-utilization"
        custom_rule_type = "cpu"
        metadata = {
          type  = "Utilization"
          value = tostring(var.ui_cpu_scale_utilization_percent)
        }
      }
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

  # TB-657: CD owns runtime image tags (cd.yml `az containerapp update`). Terraform seeds warm-start pins only.
  # env/secret also drift from ad-hoc `az containerapp update --set-env-vars` / `secret set` calls (deployment
  # metadata, auth mode toggles, ConnectionStrings overrides) made outside this module; ignore to avoid apply
  # deleting operator/CD-managed values that Terraform's config does not declare.
  lifecycle {
    ignore_changes = [
      template[0].container[0].image,
      template[0].container[0].env,
      secret,
    ]
  }
}
