terraform {
  required_version = ">= 1.5.0"

  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 4.0"
    }
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.4"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.6"
    }
  }
}

provider "azurerm" {
  subscription_id     = var.subscription_id
  storage_use_azuread = true

  features {
    key_vault {
      purge_soft_delete_on_destroy = true
    }
  }
}

data "azurerm_client_config" "current" {}

locals {
  collector_scripts = {
    "Get-ArchLucidAzurePackage.ps1"                           = "${path.module}/../../../../scripts/azure/Get-ArchLucidAzurePackage.ps1"
    "ArchLucid.ExtractorQuickStart.helpers.ps1"               = "${path.module}/../../../../scripts/azure/ArchLucid.ExtractorQuickStart.helpers.ps1"
    "ArchLucid.RetailPrices.helpers.ps1"                      = "${path.module}/../../../../scripts/azure/ArchLucid.RetailPrices.helpers.ps1"
    "ArchLucid.PolicyCompliance.helpers.ps1"                  = "${path.module}/../../../../scripts/azure/ArchLucid.PolicyCompliance.helpers.ps1"
    "ArchLucid.CostManagement.helpers.ps1"                    = "${path.module}/../../../../scripts/azure/ArchLucid.CostManagement.helpers.ps1"
    "ArchLucid.ResourceGraph.helpers.ps1"                     = "${path.module}/../../../../scripts/azure/ArchLucid.ResourceGraph.helpers.ps1"
    "ArchLucid.ResourceGraph.RelationshipQueries.helpers.ps1" = "${path.module}/../../../../scripts/azure/ArchLucid.ResourceGraph.RelationshipQueries.helpers.ps1"
    "ArchLucid.ExtractorTelemetry.helpers.ps1"                = "${path.module}/../../../../scripts/azure/ArchLucid.ExtractorTelemetry.helpers.ps1"
    "ArchLucid.ExtractorProgressHeartbeat.helpers.ps1"        = "${path.module}/../../../../scripts/azure/ArchLucid.ExtractorProgressHeartbeat.helpers.ps1"
    "ArchLucid.SecurityInventory.helpers.ps1"                 = "${path.module}/../../../../scripts/azure/ArchLucid.SecurityInventory.helpers.ps1"
    "ArchLucid.ScheduledExtractor.helpers.ps1"                = "${path.module}/../../../../scripts/azure/ArchLucid.ScheduledExtractor.helpers.ps1"
    "Send-ArchLucidAzureExtractorPackage.ps1"                 = "${path.module}/../../../../scripts/azure/Send-ArchLucidAzureExtractorPackage.ps1"
    "Invoke-ArchLucidScheduledAzureExtractor.ps1"             = "${path.module}/../../../../scripts/azure/Invoke-ArchLucidScheduledAzureExtractor.ps1"
    "ArchLucid.AuthHeaders.ps1"                               = "${path.module}/../../../../scripts/ArchLucid.AuthHeaders.ps1"
  }

  tags = merge({
    application = "archlucid"
    purpose     = "scheduled-azure-extractor"
  }, var.tags)
}

resource "random_string" "suffix" {
  length  = 6
  special = false
  upper   = false
}

resource "azurerm_resource_group" "extractor" {
  name     = var.resource_group_name
  location = var.location
  tags     = local.tags
}

resource "azurerm_role_assignment" "reader" {
  scope                = "/subscriptions/${var.subscription_id}"
  role_definition_name = "Reader"
  principal_id         = azurerm_automation_account.extractor.identity[0].principal_id
}

resource "azurerm_role_assignment" "cost_management_reader" {
  scope                = "/subscriptions/${var.subscription_id}"
  role_definition_name = "Cost Management Reader"
  principal_id         = azurerm_automation_account.extractor.identity[0].principal_id
}

resource "azurerm_storage_account" "collector" {
  name                            = "alextract${random_string.suffix.result}"
  resource_group_name             = azurerm_resource_group.extractor.name
  location                        = azurerm_resource_group.extractor.location
  account_tier                    = "Standard"
  account_replication_type        = "LRS"
  min_tls_version                 = "TLS1_2"
  https_traffic_only_enabled      = true
  allow_nested_items_to_be_public = false
  shared_access_key_enabled       = true
  tags                            = local.tags
}

resource "azurerm_storage_container" "collector" {
  name                  = var.collector_container_name
  storage_account_id    = azurerm_storage_account.collector.id
  container_access_type = "private"
}

data "archive_file" "collector_scripts" {
  type        = "zip"
  output_path = "${path.module}/.generated/archlucid-scheduled-extractor-scripts.zip"

  dynamic "source" {
    for_each = local.collector_scripts
    content {
      filename = source.key
      content  = file(source.value)
    }
  }
}

resource "azurerm_storage_blob" "collector_scripts" {
  name                   = var.collector_blob_name
  storage_account_name   = azurerm_storage_account.collector.name
  storage_container_name = azurerm_storage_container.collector.name
  type                   = "Block"
  source                 = data.archive_file.collector_scripts.output_path
  content_md5            = filemd5(data.archive_file.collector_scripts.output_path)

  depends_on = [azurerm_role_assignment.terraform_blob_contributor]
}

resource "azurerm_role_assignment" "blob_reader" {
  scope                = azurerm_storage_account.collector.id
  role_definition_name = "Storage Blob Data Reader"
  principal_id         = azurerm_automation_account.extractor.identity[0].principal_id
}

resource "azurerm_role_assignment" "terraform_blob_contributor" {
  scope                = azurerm_storage_account.collector.id
  role_definition_name = "Storage Blob Data Contributor"
  principal_id         = data.azurerm_client_config.current.object_id
}

resource "azurerm_key_vault" "extractor" {
  name                          = "kv-alext-${random_string.suffix.result}"
  location                      = azurerm_resource_group.extractor.location
  resource_group_name           = azurerm_resource_group.extractor.name
  tenant_id                     = data.azurerm_client_config.current.tenant_id
  sku_name                      = "standard"
  rbac_authorization_enabled    = true
  purge_protection_enabled      = false
  soft_delete_retention_days    = 7
  public_network_access_enabled = true
  tags                          = local.tags
}

resource "azurerm_role_assignment" "key_vault_secrets_user" {
  scope                = azurerm_key_vault.extractor.id
  role_definition_name = "Key Vault Secrets User"
  principal_id         = azurerm_automation_account.extractor.identity[0].principal_id
}

resource "azurerm_role_assignment" "terraform_key_vault_secrets_officer" {
  count                = length(var.archlucid_api_key) > 0 ? 1 : 0
  scope                = azurerm_key_vault.extractor.id
  role_definition_name = "Key Vault Secrets Officer"
  principal_id         = data.azurerm_client_config.current.object_id
}

resource "azurerm_key_vault_secret" "api_key" {
  count        = length(var.archlucid_api_key) > 0 ? 1 : 0
  name         = var.key_vault_secret_name
  value        = var.archlucid_api_key
  key_vault_id = azurerm_key_vault.extractor.id

  depends_on = [azurerm_role_assignment.terraform_key_vault_secrets_officer]
}

resource "azurerm_automation_account" "extractor" {
  name                = var.automation_account_name
  location            = azurerm_resource_group.extractor.location
  resource_group_name = azurerm_resource_group.extractor.name
  sku_name            = "Basic"

  identity {
    type = "SystemAssigned"
  }

  tags = local.tags
}

resource "azurerm_automation_module" "az_accounts" {
  name                    = "Az.Accounts"
  resource_group_name     = azurerm_resource_group.extractor.name
  automation_account_name = azurerm_automation_account.extractor.name

  module_link {
    uri = "https://www.powershellgallery.com/api/v2/package/Az.Accounts/4.2.0"
  }
}

resource "azurerm_automation_module" "az_resources" {
  name                    = "Az.Resources"
  resource_group_name     = azurerm_resource_group.extractor.name
  automation_account_name = azurerm_automation_account.extractor.name

  module_link {
    uri = "https://www.powershellgallery.com/api/v2/package/Az.Resources/7.8.0"
  }

  depends_on = [azurerm_automation_module.az_accounts]
}

resource "azurerm_automation_module" "az_resource_graph" {
  name                    = "Az.ResourceGraph"
  resource_group_name     = azurerm_resource_group.extractor.name
  automation_account_name = azurerm_automation_account.extractor.name

  module_link {
    uri = "https://www.powershellgallery.com/api/v2/package/Az.ResourceGraph/1.0.0"
  }

  depends_on = [azurerm_automation_module.az_accounts]
}

resource "azurerm_automation_runbook" "extractor" {
  name                    = "Invoke-ArchLucidScheduledAzureExtractor"
  location                = azurerm_resource_group.extractor.location
  resource_group_name     = azurerm_resource_group.extractor.name
  automation_account_name = azurerm_automation_account.extractor.name
  log_verbose             = false
  log_progress            = true
  description             = "Collects read-only Azure inventory and uploads the ZIP to ArchLucid."
  runbook_type            = "PowerShell72"
  content                 = file("${path.module}/../runbook/Invoke-ArchLucidScheduledAzureExtractor.Runbook.ps1")
}

resource "azurerm_automation_variable_string" "subscription_id" {
  name                    = "ARCHLUCID_AZURE_SUBSCRIPTION_ID"
  resource_group_name     = azurerm_resource_group.extractor.name
  automation_account_name = azurerm_automation_account.extractor.name
  value                   = var.subscription_id
}

resource "azurerm_automation_variable_string" "api_base_url" {
  name                    = "ARCHLUCID_API_BASE_URL"
  resource_group_name     = azurerm_resource_group.extractor.name
  automation_account_name = azurerm_automation_account.extractor.name
  value                   = var.archlucid_api_base_url
}

resource "azurerm_automation_variable_string" "tenant_id" {
  name                    = "ARCHLUCID_TENANT_ID"
  resource_group_name     = azurerm_resource_group.extractor.name
  automation_account_name = azurerm_automation_account.extractor.name
  value                   = var.archlucid_tenant_id
}

resource "azurerm_automation_variable_string" "workspace_id" {
  name                    = "ARCHLUCID_WORKSPACE_ID"
  resource_group_name     = azurerm_resource_group.extractor.name
  automation_account_name = azurerm_automation_account.extractor.name
  value                   = var.archlucid_workspace_id
}

resource "azurerm_automation_variable_string" "project_id" {
  name                    = "ARCHLUCID_PROJECT_ID"
  resource_group_name     = azurerm_resource_group.extractor.name
  automation_account_name = azurerm_automation_account.extractor.name
  value                   = var.archlucid_project_id
}

resource "azurerm_automation_variable_string" "run_id" {
  name                    = "ARCHLUCID_RUN_ID"
  resource_group_name     = azurerm_resource_group.extractor.name
  automation_account_name = azurerm_automation_account.extractor.name
  value                   = var.archlucid_run_id
}

resource "azurerm_automation_variable_string" "key_vault_name" {
  name                    = "ARCHLUCID_KEY_VAULT_NAME"
  resource_group_name     = azurerm_resource_group.extractor.name
  automation_account_name = azurerm_automation_account.extractor.name
  value                   = azurerm_key_vault.extractor.name
}

resource "azurerm_automation_variable_string" "key_vault_secret_name" {
  name                    = "ARCHLUCID_KEY_VAULT_SECRET_NAME"
  resource_group_name     = azurerm_resource_group.extractor.name
  automation_account_name = azurerm_automation_account.extractor.name
  value                   = var.key_vault_secret_name
}

resource "azurerm_automation_variable_string" "storage_account" {
  name                    = "ARCHLUCID_COLLECTOR_STORAGE_ACCOUNT"
  resource_group_name     = azurerm_resource_group.extractor.name
  automation_account_name = azurerm_automation_account.extractor.name
  value                   = azurerm_storage_account.collector.name
}

resource "azurerm_automation_variable_string" "container" {
  name                    = "ARCHLUCID_COLLECTOR_CONTAINER"
  resource_group_name     = azurerm_resource_group.extractor.name
  automation_account_name = azurerm_automation_account.extractor.name
  value                   = azurerm_storage_container.collector.name
}

resource "azurerm_automation_variable_string" "blob_name" {
  name                    = "ARCHLUCID_COLLECTOR_BLOB_NAME"
  resource_group_name     = azurerm_resource_group.extractor.name
  automation_account_name = azurerm_automation_account.extractor.name
  value                   = var.collector_blob_name
}

resource "azurerm_automation_variable_string" "include_cost" {
  name                    = "ARCHLUCID_INCLUDE_COST"
  resource_group_name     = azurerm_resource_group.extractor.name
  automation_account_name = azurerm_automation_account.extractor.name
  value                   = var.include_cost ? "true" : "false"
}

resource "azurerm_automation_schedule" "weekly" {
  name                    = "archlucid-weekly-extractor"
  resource_group_name     = azurerm_resource_group.extractor.name
  automation_account_name = azurerm_automation_account.extractor.name
  frequency               = "Week"
  interval                = 1
  timezone                = "Etc/UTC"
  start_time              = var.schedule_start_time_utc
  week_days               = ["Monday"]
  description             = "Weekly read-only Azure inventory collection for ArchLucid."

  lifecycle {
    ignore_changes = [start_time]
  }
}

resource "azurerm_automation_job_schedule" "weekly" {
  resource_group_name     = azurerm_resource_group.extractor.name
  automation_account_name = azurerm_automation_account.extractor.name
  schedule_name           = azurerm_automation_schedule.weekly.name
  runbook_name            = azurerm_automation_runbook.extractor.name
}
