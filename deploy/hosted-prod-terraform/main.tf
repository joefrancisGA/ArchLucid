terraform {
  required_version = ">= 1.5.0"

  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 4.0"
    }
  }
}

provider "azurerm" {
  features {
    key_vault {
      purge_soft_delete_on_destroy = false
    }
  }
}

data "azurerm_client_config" "current" {}

resource "azurerm_resource_group" "prod" {
  name     = var.resource_group_name
  location = var.location
  tags     = var.tags
}

resource "azurerm_cognitive_account" "openai" {
  count = var.openai_compose_mode == "create" ? 1 : 0

  name                = var.openai_account_name
  location            = var.location
  resource_group_name = azurerm_resource_group.prod.name
  kind                = "OpenAI"
  sku_name            = var.openai_sku_name
  tags                = var.tags

  custom_subdomain_name         = var.openai_custom_subdomain_name
  public_network_access_enabled = var.openai_public_network_access_enabled
}

resource "azurerm_search_service" "search" {
  count = var.search_compose_mode == "create" ? 1 : 0

  name                = var.search_service_name
  location            = var.location
  resource_group_name = azurerm_resource_group.prod.name
  sku                 = var.search_sku_name
  tags                = var.tags

  public_network_access_enabled = var.search_public_network_access_enabled
}

data "azurerm_key_vault" "existing" {
  count = var.key_vault_name != null ? 1 : 0

  name                = var.key_vault_name
  resource_group_name = coalesce(var.key_vault_resource_group_name, azurerm_resource_group.prod.name)
}

resource "azurerm_monitor_diagnostic_setting" "openai" {
  count = var.openai_compose_mode == "create" && var.log_analytics_workspace_id != null ? 1 : 0

  name                       = "archlucid-openai-diagnostics"
  target_resource_id         = azurerm_cognitive_account.openai[0].id
  log_analytics_workspace_id = var.log_analytics_workspace_id

  enabled_log {
    category = "Audit"
  }

  enabled_log {
    category = "RequestResponse"
  }

  metric {
    category = "AllMetrics"
    enabled  = true
  }
}

resource "azurerm_monitor_diagnostic_setting" "search" {
  count = var.log_analytics_workspace_id != null && length(local.search_service_id_effective) > 0 ? 1 : 0

  name                       = "archlucid-search-diagnostics"
  target_resource_id         = local.search_service_id_effective
  log_analytics_workspace_id = var.log_analytics_workspace_id

  metric {
    category = "AllMetrics"
    enabled  = true
  }
}
