resource "azurerm_log_analytics_workspace" "main" {
  name                = "law-${var.name_prefix}-${local.suffix}"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  sku                 = "PerGB2018"
  retention_in_days   = 30
  daily_quota_gb      = var.log_analytics_daily_quota_gb
  tags                = local.merged_tags
}

resource "azurerm_container_app_environment" "main" {
  name                       = "cae-${var.name_prefix}-${local.suffix}"
  location                   = azurerm_resource_group.main.location
  resource_group_name        = azurerm_resource_group.main.name
  log_analytics_workspace_id = azurerm_log_analytics_workspace.main.id
  tags                       = local.merged_tags
}

resource "azurerm_container_app" "api" {
  name                         = "${var.name_prefix}-api"
  container_app_environment_id = azurerm_container_app_environment.main.id
  resource_group_name          = azurerm_resource_group.main.name
  revision_mode                = "Single"
  tags                         = local.merged_tags

  identity {
    type = "SystemAssigned"
  }

  secret {
    name  = "sql-app-connection"
    value = local.sql_connection_string_app
  }

  secret {
    name  = "sql-tenant-connection"
    value = local.sql_connection_string_tenant
  }

  template {
    min_replicas = 0
    max_replicas = 2

    container {
      name   = "api"
      image  = var.container_app_image
      cpu    = 0.25
      memory = "0.5Gi"

      env {
        name  = "Hosting__Role"
        value = "Api"
      }

      env {
        name  = "ConnectionStrings__ArchLucid"
        value = local.sql_connection_string_app
      }

      env {
        name  = "ConnectionStrings__ArchLucidSystem"
        value = local.sql_connection_string_app
      }

      env {
        name  = "ArchLucid__SqlTopology__TenantCatalogConnectionStringTemplate"
        value = replace(local.sql_connection_string_tenant, azurerm_mssql_database.tenant.name, "{0}")
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
        value = local.blob_service_uri
      }

      env {
        name  = "ArchLucid__Secrets__Provider"
        value = "KeyVault"
      }

      env {
        name  = "ArchLucid__Secrets__KeyVaultUri"
        value = azurerm_key_vault.main.vault_uri
      }

      env {
        name  = "BackgroundJobs__Mode"
        value = "Durable"
      }

      env {
        name  = "BackgroundJobs__QueueName"
        value = azurerm_storage_queue.background_jobs.name
      }

      dynamic "env" {
        for_each = var.enable_service_bus ? [1] : []
        content {
          name  = "Integration__ServiceBus__Namespace"
          value = "${azurerm_servicebus_namespace.integration[0].name}.servicebus.windows.net"
        }
      }
    }
  }

  ingress {
    external_enabled = true
    target_port      = 80
    transport        = "auto"

    traffic_weight {
      latest_revision = true
      percentage      = 100
    }
  }
}

resource "azurerm_container_app" "worker" {
  name                         = "${var.name_prefix}-worker"
  container_app_environment_id = azurerm_container_app_environment.main.id
  resource_group_name          = azurerm_resource_group.main.name
  revision_mode                = "Single"
  tags                         = local.merged_tags

  identity {
    type = "SystemAssigned"
  }

  template {
    min_replicas = 0
    max_replicas = 2

    container {
      name   = "worker"
      image  = var.container_app_image
      cpu    = 0.25
      memory = "0.5Gi"

      env {
        name  = "Hosting__Role"
        value = "Worker"
      }

      env {
        name  = "ConnectionStrings__ArchLucid"
        value = local.sql_connection_string_app
      }

      env {
        name  = "ConnectionStrings__ArchLucidSystem"
        value = local.sql_connection_string_app
      }

      env {
        name  = "ArchLucid__SqlTopology__TenantCatalogConnectionStringTemplate"
        value = replace(local.sql_connection_string_tenant, azurerm_mssql_database.tenant.name, "{0}")
      }

      env {
        name  = "ArtifactLargePayload__AzureBlobServiceUri"
        value = local.blob_service_uri
      }

      env {
        name  = "ArchLucid__Secrets__KeyVaultUri"
        value = azurerm_key_vault.main.vault_uri
      }

      env {
        name  = "BackgroundJobs__Mode"
        value = "Durable"
      }

      env {
        name  = "BackgroundJobs__QueueName"
        value = azurerm_storage_queue.background_jobs.name
      }

      dynamic "env" {
        for_each = var.enable_service_bus ? [1] : []
        content {
          name  = "Integration__ServiceBus__Namespace"
          value = "${azurerm_servicebus_namespace.integration[0].name}.servicebus.windows.net"
        }
      }
    }
  }
}

resource "azurerm_container_app" "ui" {
  name                         = "${var.name_prefix}-ui"
  container_app_environment_id = azurerm_container_app_environment.main.id
  resource_group_name          = azurerm_resource_group.main.name
  revision_mode                = "Single"
  tags                         = local.merged_tags

  template {
    min_replicas = 0
    max_replicas = 2

    container {
      name   = "ui"
      image  = var.container_app_image
      cpu    = 0.25
      memory = "0.5Gi"

      env {
        name  = "ARCHLUCID_UI_ROLE"
        value = "operator"
      }

      env {
        name  = "ARCHLUCID_API_BASE_URL"
        value = "https://${azurerm_container_app.api.ingress[0].fqdn}"
      }
    }
  }

  ingress {
    external_enabled = true
    target_port      = 80
    transport        = "auto"

    traffic_weight {
      latest_revision = true
      percentage      = 100
    }
  }
}

resource "azurerm_container_app" "ui_marketing" {
  name                         = "${var.name_prefix}-ui-marketing"
  container_app_environment_id = azurerm_container_app_environment.main.id
  resource_group_name          = azurerm_resource_group.main.name
  revision_mode                = "Single"
  tags                         = local.merged_tags

  template {
    min_replicas = 0
    max_replicas = 2

    container {
      name   = "ui-marketing"
      image  = var.container_app_image
      cpu    = 0.25
      memory = "0.5Gi"

      env {
        name  = "ARCHLUCID_UI_ROLE"
        value = "marketing"
      }

      env {
        name  = "ARCHLUCID_API_BASE_URL"
        value = "https://${azurerm_container_app.api.ingress[0].fqdn}"
      }
    }
  }

  ingress {
    external_enabled = true
    target_port      = 80
    transport        = "auto"

    traffic_weight {
      latest_revision = true
      percentage      = 100
    }
  }
}
