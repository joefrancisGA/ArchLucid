locals {
  tags = merge({ Workload = "archlucid-logic-apps" }, var.tags)

  # When true, attach azurerm_monitor_diagnostic_setting to each deployed Logic App Standard site (see diagnostics.tf).
  logic_app_diagnostics_enabled = var.enable_logic_app_diagnostic_settings && trimspace(var.logic_app_diagnostic_log_analytics_workspace_id) != ""
}

resource "azurerm_storage_account" "logic" {
  count = var.enable_logic_apps ? 1 : 0

  name                     = var.storage_account_name
  resource_group_name      = var.resource_group_name
  location                 = var.location
  account_tier             = "Standard"
  account_replication_type = "ZRS"
  min_tls_version          = "TLS1_2"

  allow_nested_items_to_be_public = false

  tags = local.tags
}

resource "azurerm_storage_share" "logic_workflow" {
  count = var.enable_logic_apps ? 1 : 0

  name                 = var.storage_share_name
  storage_account_name = azurerm_storage_account.logic[0].name
  quota                = 5120
}

resource "azurerm_service_plan" "logic" {
  count = var.enable_logic_apps ? 1 : 0

  name                = var.app_service_plan_name
  resource_group_name = var.resource_group_name
  location            = var.location
  os_type             = "Windows"
  sku_name            = "WS1"

  tags = local.tags
}

resource "azurerm_logic_app_standard" "edge" {
  count = var.enable_logic_apps ? 1 : 0

  name                       = var.logic_app_name
  location                   = var.location
  resource_group_name        = var.resource_group_name
  app_service_plan_id        = azurerm_service_plan.logic[0].id
  storage_account_name       = azurerm_storage_account.logic[0].name
  storage_account_access_key = azurerm_storage_account.logic[0].primary_access_key
  storage_account_share_name = azurerm_storage_share.logic_workflow[0].name
  version                    = "~4"
  https_only                 = true

  identity {
    type = "SystemAssigned"
  }

  site_config {
    always_on = false
  }

  tags = local.tags
}

resource "azurerm_storage_account" "logic_governance" {
  count = var.enable_governance_approval_logic_app ? 1 : 0

  name                     = var.governance_storage_account_name
  resource_group_name      = var.resource_group_name
  location                 = var.location
  account_tier             = "Standard"
  account_replication_type = "ZRS"
  min_tls_version          = "TLS1_2"

  allow_nested_items_to_be_public = false

  tags = local.tags
}

resource "azurerm_storage_share" "logic_governance_workflow" {
  count = var.enable_governance_approval_logic_app ? 1 : 0

  name                 = var.governance_storage_share_name
  storage_account_name = azurerm_storage_account.logic_governance[0].name
  quota                = 5120
}

resource "azurerm_service_plan" "logic_governance" {
  count = var.enable_governance_approval_logic_app ? 1 : 0

  name                = var.governance_app_service_plan_name
  resource_group_name = var.resource_group_name
  location            = var.location
  os_type             = "Windows"
  sku_name            = "WS1"

  tags = local.tags
}

resource "azurerm_logic_app_standard" "governance_approval" {
  count = var.enable_governance_approval_logic_app ? 1 : 0

  name                       = var.governance_logic_app_name
  location                   = var.location
  resource_group_name        = var.resource_group_name
  app_service_plan_id        = azurerm_service_plan.logic_governance[0].id
  storage_account_name       = azurerm_storage_account.logic_governance[0].name
  storage_account_access_key = azurerm_storage_account.logic_governance[0].primary_access_key
  storage_account_share_name = azurerm_storage_share.logic_governance_workflow[0].name
  version                    = "~4"
  https_only                 = true

  identity {
    type = "SystemAssigned"
  }

  site_config {
    always_on = false
  }

  tags = merge(local.tags, { Workflow = "governance-approval-routing" })
}

resource "azurerm_storage_account" "logic_marketplace_fulfillment" {
  count = var.enable_marketplace_fulfillment_logic_app ? 1 : 0

  name                     = var.marketplace_fulfillment_storage_account_name
  resource_group_name      = var.resource_group_name
  location                 = var.location
  account_tier             = "Standard"
  account_replication_type = "ZRS"
  min_tls_version          = "TLS1_2"

  allow_nested_items_to_be_public = false

  tags = local.tags
}

resource "azurerm_storage_share" "logic_marketplace_fulfillment_workflow" {
  count = var.enable_marketplace_fulfillment_logic_app ? 1 : 0

  name                 = var.marketplace_fulfillment_storage_share_name
  storage_account_name = azurerm_storage_account.logic_marketplace_fulfillment[0].name
  quota                = 5120
}

resource "azurerm_service_plan" "logic_marketplace_fulfillment" {
  count = var.enable_marketplace_fulfillment_logic_app ? 1 : 0

  name                = var.marketplace_fulfillment_app_service_plan_name
  resource_group_name = var.resource_group_name
  location            = var.location
  os_type             = "Windows"
  sku_name            = "WS1"

  tags = local.tags
}

resource "azurerm_logic_app_standard" "marketplace_fulfillment" {
  count = var.enable_marketplace_fulfillment_logic_app ? 1 : 0

  name                       = var.marketplace_fulfillment_logic_app_name
  location                   = var.location
  resource_group_name        = var.resource_group_name
  app_service_plan_id        = azurerm_service_plan.logic_marketplace_fulfillment[0].id
  storage_account_name       = azurerm_storage_account.logic_marketplace_fulfillment[0].name
  storage_account_access_key = azurerm_storage_account.logic_marketplace_fulfillment[0].primary_access_key
  storage_account_share_name = azurerm_storage_share.logic_marketplace_fulfillment_workflow[0].name
  version                    = "~4"
  https_only                 = true

  identity {
    type = "SystemAssigned"
  }

  site_config {
    always_on = false
  }

  tags = merge(local.tags, { Workflow = "marketplace-fulfillment-handoff" })
}

resource "azurerm_storage_account" "logic_trial_lifecycle" {
  count = var.enable_trial_lifecycle_logic_app ? 1 : 0

  name                     = var.trial_lifecycle_storage_account_name
  resource_group_name      = var.resource_group_name
  location                 = var.location
  account_tier             = "Standard"
  account_replication_type = "ZRS"
  min_tls_version          = "TLS1_2"

  allow_nested_items_to_be_public = false

  tags = local.tags
}

resource "azurerm_storage_share" "logic_trial_lifecycle_workflow" {
  count = var.enable_trial_lifecycle_logic_app ? 1 : 0

  name                 = var.trial_lifecycle_storage_share_name
  storage_account_name = azurerm_storage_account.logic_trial_lifecycle[0].name
  quota                = 5120
}

resource "azurerm_service_plan" "logic_trial_lifecycle" {
  count = var.enable_trial_lifecycle_logic_app ? 1 : 0

  name                = var.trial_lifecycle_app_service_plan_name
  resource_group_name = var.resource_group_name
  location            = var.location
  os_type             = "Windows"
  sku_name            = "WS1"

  tags = local.tags
}

resource "azurerm_logic_app_standard" "trial_lifecycle" {
  count = var.enable_trial_lifecycle_logic_app ? 1 : 0

  name                       = var.trial_lifecycle_logic_app_name
  location                   = var.location
  resource_group_name        = var.resource_group_name
  app_service_plan_id        = azurerm_service_plan.logic_trial_lifecycle[0].id
  storage_account_name       = azurerm_storage_account.logic_trial_lifecycle[0].name
  storage_account_access_key = azurerm_storage_account.logic_trial_lifecycle[0].primary_access_key
  storage_account_share_name = azurerm_storage_share.logic_trial_lifecycle_workflow[0].name
  version                    = "~4"
  https_only                 = true

  identity {
    type = "SystemAssigned"
  }

  site_config {
    always_on = false
  }

  tags = merge(local.tags, { Workflow = "trial-lifecycle-email" })
}

resource "azurerm_storage_account" "logic_incident_chatops" {
  count = var.enable_incident_chatops_logic_app ? 1 : 0

  name                     = var.incident_chatops_storage_account_name
  resource_group_name      = var.resource_group_name
  location                 = var.location
  account_tier             = "Standard"
  account_replication_type = "ZRS"
  min_tls_version          = "TLS1_2"

  allow_nested_items_to_be_public = false

  tags = local.tags
}

resource "azurerm_storage_share" "logic_incident_chatops_workflow" {
  count = var.enable_incident_chatops_logic_app ? 1 : 0

  name                 = var.incident_chatops_storage_share_name
  storage_account_name = azurerm_storage_account.logic_incident_chatops[0].name
  quota                = 5120
}

resource "azurerm_service_plan" "logic_incident_chatops" {
  count = var.enable_incident_chatops_logic_app ? 1 : 0

  name                = var.incident_chatops_app_service_plan_name
  resource_group_name = var.resource_group_name
  location            = var.location
  os_type             = "Windows"
  sku_name            = "WS1"

  tags = local.tags
}

resource "azurerm_logic_app_standard" "incident_chatops" {
  count = var.enable_incident_chatops_logic_app ? 1 : 0

  name                       = var.incident_chatops_logic_app_name
  location                   = var.location
  resource_group_name        = var.resource_group_name
  app_service_plan_id        = azurerm_service_plan.logic_incident_chatops[0].id
  storage_account_name       = azurerm_storage_account.logic_incident_chatops[0].name
  storage_account_access_key = azurerm_storage_account.logic_incident_chatops[0].primary_access_key
  storage_account_share_name = azurerm_storage_share.logic_incident_chatops_workflow[0].name
  version                    = "~4"
  https_only                 = true

  identity {
    type = "SystemAssigned"
  }

  site_config {
    always_on = false
  }

  tags = merge(local.tags, { Workflow = "incident-chatops" })
}

resource "azurerm_storage_account" "logic_promotion_customer_notify" {
  count = var.enable_promotion_customer_notify_logic_app ? 1 : 0

  name                     = var.promotion_customer_notify_storage_account_name
  resource_group_name      = var.resource_group_name
  location                 = var.location
  account_tier             = "Standard"
  account_replication_type = "ZRS"
  min_tls_version          = "TLS1_2"

  allow_nested_items_to_be_public = false

  tags = local.tags
}

resource "azurerm_storage_share" "logic_promotion_customer_notify_workflow" {
  count = var.enable_promotion_customer_notify_logic_app ? 1 : 0

  name                 = var.promotion_customer_notify_storage_share_name
  storage_account_name = azurerm_storage_account.logic_promotion_customer_notify[0].name
  quota                = 5120
}

resource "azurerm_service_plan" "logic_promotion_customer_notify" {
  count = var.enable_promotion_customer_notify_logic_app ? 1 : 0

  name                = var.promotion_customer_notify_app_service_plan_name
  resource_group_name = var.resource_group_name
  location            = var.location
  os_type             = "Windows"
  sku_name            = "WS1"

  tags = local.tags
}

resource "azurerm_logic_app_standard" "promotion_customer_notify" {
  count = var.enable_promotion_customer_notify_logic_app ? 1 : 0

  name                       = var.promotion_customer_notify_logic_app_name
  location                   = var.location
  resource_group_name        = var.resource_group_name
  app_service_plan_id        = azurerm_service_plan.logic_promotion_customer_notify[0].id
  storage_account_name       = azurerm_storage_account.logic_promotion_customer_notify[0].name
  storage_account_access_key = azurerm_storage_account.logic_promotion_customer_notify[0].primary_access_key
  storage_account_share_name = azurerm_storage_share.logic_promotion_customer_notify_workflow[0].name
  version                    = "~4"
  https_only                 = true

  identity {
    type = "SystemAssigned"
  }

  site_config {
    always_on = false
  }

  tags = merge(local.tags, { Workflow = "promotion-customer-notifications" })
}

resource "azurerm_storage_account" "logic_teams_notifications" {
  count = var.enable_teams_notifications_logic_app ? 1 : 0

  name                     = var.teams_notifications_storage_account_name
  resource_group_name      = var.resource_group_name
  location                 = var.location
  account_tier             = "Standard"
  account_replication_type = "ZRS"
  min_tls_version          = "TLS1_2"

  allow_nested_items_to_be_public = false

  tags = local.tags
}

resource "azurerm_storage_share" "logic_teams_notifications_workflow" {
  count = var.enable_teams_notifications_logic_app ? 1 : 0

  name                 = var.teams_notifications_storage_share_name
  storage_account_name = azurerm_storage_account.logic_teams_notifications[0].name
  quota                = 5120
}

resource "azurerm_service_plan" "logic_teams_notifications" {
  count = var.enable_teams_notifications_logic_app ? 1 : 0

  name                = var.teams_notifications_app_service_plan_name
  resource_group_name = var.resource_group_name
  location            = var.location
  os_type             = "Windows"
  sku_name            = "WS1"

  tags = local.tags
}

resource "azurerm_logic_app_standard" "teams_notifications" {
  count = var.enable_teams_notifications_logic_app ? 1 : 0

  name                       = var.teams_notifications_logic_app_name
  location                   = var.location
  resource_group_name        = var.resource_group_name
  app_service_plan_id        = azurerm_service_plan.logic_teams_notifications[0].id
  storage_account_name       = azurerm_storage_account.logic_teams_notifications[0].name
  storage_account_access_key = azurerm_storage_account.logic_teams_notifications[0].primary_access_key
  storage_account_share_name = azurerm_storage_share.logic_teams_notifications_workflow[0].name
  version                    = "~4"
  https_only                 = true

  identity {
    type = "SystemAssigned"
  }

  site_config {
    always_on = false
  }

  tags = merge(local.tags, { Workflow = "teams-notifications" })
}
