# TB-2016 — Marketing UI Container App (same image as Operator UI; no Front Door).
# Apex / www DNS bind to this app; app.<domain> binds to azurerm_container_app.ui.
# CD rolls both apps from the same ACR digest (CONTAINER_APP_UI_NAME + CONTAINER_APP_MARKETING_UI_NAME).

resource "azurerm_container_app" "ui_marketing" {
  count = local.enabled && var.enable_marketing_ui_container_app ? 1 : 0

  name                         = var.marketing_ui_container_app_name
  container_app_environment_id = azurerm_container_app_environment.main[0].id
  resource_group_name          = local.resource_group_name
  revision_mode                = var.marketing_ui_revision_mode
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
    min_replicas = var.marketing_ui_min_replicas
    max_replicas = var.marketing_ui_max_replicas

    container {
      name   = "archlucid-ui"
      image  = var.ui_container_image
      cpu    = var.marketing_ui_cpu
      memory = var.marketing_ui_memory

      env {
        name  = "PORT"
        value = "3000"
      }

      env {
        name  = "HOSTNAME"
        value = "0.0.0.0"
      }

      # Seed only — CD / ops own ARCHLUCID_* and NEXT_PUBLIC_* after first apply (lifecycle ignore).
      env {
        name  = "ARCHLUCID_UI_ROLE"
        value = "marketing"
      }

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
      concurrent_requests = var.marketing_ui_scale_concurrent_requests
    }
  }

  ingress {
    allow_insecure_connections = false
    external_enabled           = var.marketing_ui_ingress_external
    target_port                = 3000
    transport                  = "auto"

    traffic_weight {
      latest_revision = true
      percentage      = 100
    }
  }

  lifecycle {
    ignore_changes = [
      template[0].container[0].image,
      template[0].container[0].env,
      secret,
    ]
  }
}
