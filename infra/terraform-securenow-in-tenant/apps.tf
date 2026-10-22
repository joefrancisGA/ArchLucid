resource "azurerm_subnet" "container_apps" {
  count = var.enable_private_ingress ? 1 : 0

  name                 = "${var.name_prefix}-snet-apps"
  resource_group_name  = azurerm_resource_group.this.name
  virtual_network_name = local.virtual_network_name
  address_prefixes     = [var.container_apps_subnet_prefix]

  delegation {
    name = "container-apps"

    service_delegation {
      name    = "Microsoft.App/environments"
      actions = ["Microsoft.Network/virtualNetworks/subnets/join/action"]
    }
  }

  depends_on = [module.private]
}

resource "azurerm_container_app_environment" "this" {
  count = var.enable_private_ingress ? 1 : 0

  name                           = "${var.name_prefix}-cae"
  location                       = var.location
  resource_group_name            = azurerm_resource_group.this.name
  log_analytics_workspace_id     = azurerm_log_analytics_workspace.this.id
  infrastructure_subnet_id       = azurerm_subnet.container_apps[0].id
  internal_load_balancer_enabled = true
  tags                           = local.tags
}

resource "azurerm_container_app" "api" {
  count = var.enable_private_ingress ? 1 : 0

  name                         = "${var.name_prefix}-api"
  container_app_environment_id = azurerm_container_app_environment.this[0].id
  resource_group_name          = azurerm_resource_group.this.name
  revision_mode                = "Single"
  tags                         = local.tags

  identity {
    type         = "UserAssigned"
    identity_ids = [azurerm_user_assigned_identity.api.id]
  }

  ingress {
    external_enabled = false
    target_port      = 8080
    transport        = "http"

    traffic_weight {
      latest_revision = true
      percentage      = 100
    }
  }

  template {
    min_replicas = 1
    max_replicas = 2

    container {
      name   = "api"
      image  = var.api_container_image
      cpu    = 0.5
      memory = "1Gi"

      env {
        name  = "Hosting__Role"
        value = "Api"
      }

      env {
        name  = "NEXT_PUBLIC_ARCHLUCID_PRODUCT"
        value = "security"
      }

      env {
        name  = "SecureNow__Edition"
        value = local.edition_config
      }

      env {
        name  = "SecureNow__Hosting"
        value = "InTenant"
      }

      env {
        name  = "SecureNow__SupportTelemetry"
        value = local.support_telemetry_enabled ? "true" : "false"
      }

      env {
        name  = "ConnectionStrings__ArchLucid"
        value = module.sql.managed_identity_connection_string_template
      }
    }
  }
}

resource "azurerm_container_app" "worker" {
  count = var.enable_private_ingress ? 1 : 0

  name                         = "${var.name_prefix}-worker"
  container_app_environment_id = azurerm_container_app_environment.this[0].id
  resource_group_name          = azurerm_resource_group.this.name
  revision_mode                = "Single"
  tags                         = local.tags

  identity {
    type         = "UserAssigned"
    identity_ids = [azurerm_user_assigned_identity.worker.id]
  }

  template {
    min_replicas = 1
    max_replicas = 2

    container {
      name   = "worker"
      image  = var.worker_container_image
      cpu    = 0.5
      memory = "1Gi"

      env {
        name  = "Hosting__Role"
        value = "Worker"
      }

      env {
        name  = "SecureNow__Edition"
        value = local.edition_config
      }

      env {
        name  = "SecureNow__Hosting"
        value = "InTenant"
      }

      env {
        name  = "SecureNow__SupportTelemetry"
        value = local.support_telemetry_enabled ? "true" : "false"
      }

      env {
        name  = "ConnectionStrings__ArchLucid"
        value = module.sql.managed_identity_connection_string_template
      }
    }
  }
}

resource "azurerm_container_app" "ui" {
  count = var.enable_private_ingress ? 1 : 0

  name                         = "${var.name_prefix}-ui"
  container_app_environment_id = azurerm_container_app_environment.this[0].id
  resource_group_name          = azurerm_resource_group.this.name
  revision_mode                = "Single"
  tags                         = local.tags

  ingress {
    external_enabled = false
    target_port      = 3000
    transport        = "http"

    traffic_weight {
      latest_revision = true
      percentage      = 100
    }
  }

  template {
    min_replicas = 1
    max_replicas = 2

    container {
      name   = "ui"
      image  = var.ui_container_image
      cpu    = 0.5
      memory = "1Gi"

      env {
        name  = "NEXT_PUBLIC_ARCHLUCID_PRODUCT"
        value = "security"
      }

      env {
        name  = "SecureNow__Edition"
        value = local.edition_config
      }

      env {
        name  = "SecureNow__Hosting"
        value = "InTenant"
      }
    }
  }
}

resource "azuread_application" "ui" {
  display_name     = "${var.name_prefix}-app"
  sign_in_audience = "AzureADMyOrg"

  dynamic "single_page_application" {
    for_each = length(var.ui_redirect_uris) == 0 ? [] : [1]

    content {
      redirect_uris = var.ui_redirect_uris
    }
  }
}

resource "azuread_service_principal" "ui" {
  client_id = azuread_application.ui.client_id
}
