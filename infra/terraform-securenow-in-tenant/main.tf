data "azurerm_client_config" "current" {}

locals {
  enabled = var.enable_deployment

  resource_group_name     = var.resource_group_name
  prefix                  = lower(trimspace(var.name_prefix))
  automation_account_name = "${local.prefix}-automation"
  collection_runbook_name = "${local.prefix}-collection"
  storage_container_scope = local.enabled ? "${module.storage.storage_account_id}/blobServices/default/containers/securenow-collection" : ""

  api_environment_variables = {
    "NEXT_PUBLIC_ARCHLUCID_PRODUCT"                = "security"
    "SecureNow__Edition"                           = lower(trimspace(var.edition))
    "SecureNow__Hosting"                           = var.hosting_mode
    "SecureNow__Automation__Enabled"               = "true"
    "SecureNow__Automation__SubscriptionId"        = data.azurerm_client_config.current.subscription_id
    "SecureNow__Automation__ResourceGroupName"     = local.resource_group_name
    "SecureNow__Automation__AutomationAccountName" = local.automation_account_name
    "SecureNow__Automation__RunbookName"           = local.collection_runbook_name
  }

  worker_environment_variables = {
    "SecureNow__Edition" = lower(trimspace(var.edition))
    "SecureNow__Hosting" = var.hosting_mode
  }

  ui_environment_variables = {
    "NEXT_PUBLIC_ARCHLUCID_PRODUCT" = "security"
    "NEXT_PUBLIC_SECURENOW_EDITION" = lower(trimspace(var.edition))
    "NEXT_PUBLIC_SECURENOW_HOSTING" = var.hosting_mode
  }
}

resource "azurerm_resource_group" "this" {
  count    = local.enabled ? 1 : 0
  name     = var.resource_group_name
  location = var.location
  tags     = var.tags
}

resource "azurerm_virtual_network" "this" {
  count               = local.enabled ? 1 : 0
  name                = "${local.prefix}-vnet"
  location            = var.location
  resource_group_name = local.resource_group_name
  address_space       = var.vnet_address_space
  tags                = var.tags

  depends_on = [azurerm_resource_group.this]

}

resource "azurerm_subnet" "private_endpoints" {
  count                = local.enabled ? 1 : 0
  name                 = "${local.prefix}-private-endpoints"
  resource_group_name  = local.resource_group_name
  virtual_network_name = azurerm_virtual_network.this[0].name
  address_prefixes     = [var.private_endpoints_subnet_prefix]
}

resource "azurerm_subnet" "container_apps" {
  count                = local.enabled ? 1 : 0
  name                 = "${local.prefix}-container-apps"
  resource_group_name  = local.resource_group_name
  virtual_network_name = azurerm_virtual_network.this[0].name
  address_prefixes     = [var.container_apps_subnet_prefix]

  delegation {
    name = "container-apps"

    service_delegation {
      name = "Microsoft.App/environments"
      actions = [
        "Microsoft.Network/virtualNetworks/subnets/action",
      ]
    }
  }
}

resource "azurerm_user_assigned_identity" "api" {
  count               = local.enabled ? 1 : 0
  name                = "${local.prefix}-api"
  location            = var.location
  resource_group_name = local.resource_group_name
  tags                = var.tags
}

resource "azurerm_user_assigned_identity" "worker" {
  count               = local.enabled ? 1 : 0
  name                = "${local.prefix}-worker"
  location            = var.location
  resource_group_name = local.resource_group_name
  tags                = var.tags
}

resource "azurerm_user_assigned_identity" "collection_agent" {
  count               = local.enabled ? 1 : 0
  name                = "${local.prefix}-collection-agent"
  location            = var.location
  resource_group_name = local.resource_group_name
  tags                = var.tags
}

module "storage" {
  source = "../terraform-storage"

  enable_storage_account        = local.enabled
  create_resource_group         = false
  resource_group_name           = local.resource_group_name
  location                      = var.location
  storage_account_name          = var.storage_account_name
  account_replication_type      = var.account_replication_type
  public_network_access_enabled = false
  network_rule_subnet_ids       = []
  tags                          = var.tags
}

resource "azurerm_storage_container" "collection" {
  count                 = local.enabled ? 1 : 0
  name                  = "securenow-collection"
  storage_account_id    = module.storage.storage_account_id
  container_access_type = "private"
}

resource "azurerm_key_vault" "this" {
  count                         = local.enabled ? 1 : 0
  name                          = var.key_vault_name
  location                      = var.location
  resource_group_name           = local.resource_group_name
  tenant_id                     = length(trimspace(var.tenant_id)) > 0 ? var.tenant_id : data.azurerm_client_config.current.tenant_id
  sku_name                      = "standard"
  soft_delete_retention_days    = 90
  purge_protection_enabled      = true
  rbac_authorization_enabled    = true
  public_network_access_enabled = false
  tags                          = var.tags

  depends_on = [azurerm_resource_group.this]
}

resource "azurerm_role_assignment" "key_vault_admin" {
  for_each = local.enabled ? toset(var.key_vault_admin_object_ids) : toset([])

  scope                = azurerm_key_vault.this[0].id
  role_definition_name = "Key Vault Secrets Officer"
  principal_id         = each.value
}

resource "azurerm_role_assignment" "api_key_vault_user" {
  count                = local.enabled ? 1 : 0
  scope                = azurerm_key_vault.this[0].id
  role_definition_name = "Key Vault Secrets User"
  principal_id         = azurerm_user_assigned_identity.api[0].principal_id
}

resource "azurerm_role_assignment" "worker_key_vault_user" {
  count                = local.enabled ? 1 : 0
  scope                = azurerm_key_vault.this[0].id
  role_definition_name = "Key Vault Secrets User"
  principal_id         = azurerm_user_assigned_identity.worker[0].principal_id
}

module "sql" {
  source = "../modules/azure-sql-serverless-app"
  count  = local.enabled ? 1 : 0

  location                   = var.location
  resource_group_name        = local.resource_group_name
  sql_server_name            = "${local.prefix}-sql"
  sql_database_name          = "${local.prefix}-app"
  sql_admin_login            = var.sql_admin_login
  sql_admin_password         = var.sql_admin_password
  entra_admin_login          = var.entra_admin_login
  entra_admin_object_id      = var.entra_admin_object_id
  enable_private_endpoint    = true
  private_endpoint_subnet_id = try(azurerm_subnet.private_endpoints[0].id, "")
  private_endpoint_name      = "${local.prefix}-sql-pe"
  block_public_sql_access    = true
  enable_sql_monitoring      = false

  depends_on = [azurerm_resource_group.this]
}

resource "azurerm_private_endpoint" "storage" {
  count               = local.enabled ? 1 : 0
  name                = "${local.prefix}-storage-pe"
  resource_group_name = local.resource_group_name
  location            = var.location
  subnet_id           = azurerm_subnet.private_endpoints[0].id

  private_service_connection {
    name                           = "${local.prefix}-storage-connection"
    private_connection_resource_id = module.storage.storage_account_id
    subresource_names              = ["blob"]
    is_manual_connection           = false
  }
}

resource "azurerm_private_endpoint" "key_vault" {
  count               = local.enabled ? 1 : 0
  name                = "${local.prefix}-key-vault-pe"
  resource_group_name = local.resource_group_name
  location            = var.location
  subnet_id           = azurerm_subnet.private_endpoints[0].id

  private_service_connection {
    name                           = "${local.prefix}-key-vault-connection"
    private_connection_resource_id = azurerm_key_vault.this[0].id
    subresource_names              = ["vault"]
    is_manual_connection           = false
  }
}

resource "azurerm_private_endpoint" "openai" {
  count               = local.enabled && length(trimspace(var.azure_openai_account_id)) > 0 ? 1 : 0
  name                = "${local.prefix}-openai-pe"
  resource_group_name = local.resource_group_name
  location            = var.location
  subnet_id           = azurerm_subnet.private_endpoints[0].id

  private_service_connection {
    name                           = "${local.prefix}-openai-connection"
    private_connection_resource_id = var.azure_openai_account_id
    subresource_names              = ["account"]
    is_manual_connection           = false
  }
}

resource "azurerm_private_dns_zone" "blob" {
  count               = local.enabled ? 1 : 0
  name                = "privatelink.blob.core.windows.net"
  resource_group_name = local.resource_group_name
}

resource "azurerm_private_dns_zone" "sql" {
  count               = local.enabled ? 1 : 0
  name                = "privatelink.database.windows.net"
  resource_group_name = local.resource_group_name
}

resource "azurerm_private_dns_zone" "key_vault" {
  count               = local.enabled ? 1 : 0
  name                = "privatelink.vaultcore.azure.net"
  resource_group_name = local.resource_group_name
}

resource "azurerm_private_dns_zone" "openai" {
  count               = local.enabled && length(trimspace(var.azure_openai_account_id)) > 0 ? 1 : 0
  name                = "privatelink.openai.azure.com"
  resource_group_name = local.resource_group_name
}

resource "azurerm_private_dns_zone_virtual_network_link" "blob" {
  count                 = local.enabled ? 1 : 0
  name                  = "${local.prefix}-blob-dns-link"
  resource_group_name   = local.resource_group_name
  private_dns_zone_name = azurerm_private_dns_zone.blob[0].name
  virtual_network_id    = azurerm_virtual_network.this[0].id
}

resource "azurerm_private_dns_zone_virtual_network_link" "sql" {
  count                 = local.enabled ? 1 : 0
  name                  = "${local.prefix}-sql-dns-link"
  resource_group_name   = local.resource_group_name
  private_dns_zone_name = azurerm_private_dns_zone.sql[0].name
  virtual_network_id    = azurerm_virtual_network.this[0].id
}

resource "azurerm_private_dns_zone_virtual_network_link" "key_vault" {
  count                 = local.enabled ? 1 : 0
  name                  = "${local.prefix}-key-vault-dns-link"
  resource_group_name   = local.resource_group_name
  private_dns_zone_name = azurerm_private_dns_zone.key_vault[0].name
  virtual_network_id    = azurerm_virtual_network.this[0].id
}

resource "azurerm_private_dns_zone_virtual_network_link" "openai" {
  count                 = local.enabled && length(trimspace(var.azure_openai_account_id)) > 0 ? 1 : 0
  name                  = "${local.prefix}-openai-dns-link"
  resource_group_name   = local.resource_group_name
  private_dns_zone_name = azurerm_private_dns_zone.openai[0].name
  virtual_network_id    = azurerm_virtual_network.this[0].id
}

resource "azurerm_private_dns_zone_group" "storage" {
  count               = local.enabled ? 1 : 0
  name                = "default"
  private_endpoint_id = azurerm_private_endpoint.storage[0].id

  private_dns_zone_configs {
    name                = "blob"
    private_dns_zone_id = azurerm_private_dns_zone.blob[0].id
  }
}

resource "azurerm_private_dns_zone_group" "key_vault" {
  count               = local.enabled ? 1 : 0
  name                = "default"
  private_endpoint_id = azurerm_private_endpoint.key_vault[0].id

  private_dns_zone_configs {
    name                = "vault"
    private_dns_zone_id = azurerm_private_dns_zone.key_vault[0].id
  }
}

resource "azurerm_private_dns_zone_group" "openai" {
  count               = local.enabled && length(trimspace(var.azure_openai_account_id)) > 0 ? 1 : 0
  name                = "default"
  private_endpoint_id = azurerm_private_endpoint.openai[0].id

  private_dns_zone_configs {
    name                = "openai"
    private_dns_zone_id = azurerm_private_dns_zone.openai[0].id
  }
}

resource "azurerm_private_dns_zone_group" "sql" {
  count               = local.enabled ? 1 : 0
  name                = "default"
  private_endpoint_id = module.sql[0].private_endpoint_id

  private_dns_zone_configs {
    name                = "sql"
    private_dns_zone_id = azurerm_private_dns_zone.sql[0].id
  }
}

resource "azurerm_role_assignment" "api_collection_blob" {
  count                = local.enabled ? 1 : 0
  scope                = local.storage_container_scope
  role_definition_name = "Storage Blob Data Contributor"
  principal_id         = azurerm_user_assigned_identity.api[0].principal_id
}

resource "azurerm_role_assignment" "worker_collection_blob" {
  count                = local.enabled ? 1 : 0
  scope                = local.storage_container_scope
  role_definition_name = "Storage Blob Data Contributor"
  principal_id         = azurerm_user_assigned_identity.worker[0].principal_id
}

resource "azurerm_role_assignment" "collection_blob" {
  count                = local.enabled ? 1 : 0
  scope                = local.storage_container_scope
  role_definition_name = "Storage Blob Data Contributor"
  principal_id         = azurerm_user_assigned_identity.collection_agent[0].principal_id
}

resource "azurerm_role_assignment" "collection_read" {
  count                = local.enabled ? 1 : 0
  scope                = var.collection_read_scope
  role_definition_name = "Reader"
  principal_id         = azurerm_user_assigned_identity.collection_agent[0].principal_id
}

resource "azurerm_automation_account" "collection" {
  count               = local.enabled ? 1 : 0
  name                = local.automation_account_name
  location            = var.location
  resource_group_name = local.resource_group_name
  sku_name            = "Basic"
  tags                = var.tags

  identity {
    type         = "UserAssigned"
    identity_ids = [azurerm_user_assigned_identity.collection_agent[0].id]
  }
}

resource "azurerm_role_assignment" "automation_job_operator" {
  count                = local.enabled ? 1 : 0
  scope                = azurerm_automation_account.collection[0].id
  role_definition_name = "Automation Job Operator"
  principal_id         = module.container_apps.api_system_assigned_principal_id
}

resource "azurerm_automation_runbook" "collection" {
  count                   = local.enabled ? 1 : 0
  name                    = local.collection_runbook_name
  location                = var.location
  resource_group_name     = local.resource_group_name
  automation_account_name = azurerm_automation_account.collection[0].name
  runbook_type            = "PowerShell"
  log_progress            = false
  log_verbose             = false
  content                 = var.collection_runbook_content
}

resource "azurerm_automation_schedule" "collection" {
  count                   = local.enabled && var.enable_collection_schedule ? 1 : 0
  name                    = "${local.prefix}-collection-schedule"
  resource_group_name     = local.resource_group_name
  automation_account_name = azurerm_automation_account.collection[0].name
  frequency               = var.collection_schedule_frequency
  interval                = var.collection_schedule_interval
  start_time              = var.collection_schedule_start_time
  timezone                = "UTC"
}

resource "azurerm_automation_job_schedule" "collection" {
  count                   = local.enabled && var.enable_collection_schedule ? 1 : 0
  resource_group_name     = local.resource_group_name
  automation_account_name = azurerm_automation_account.collection[0].name
  schedule_name           = azurerm_automation_schedule.collection[0].name
  runbook_name            = azurerm_automation_runbook.collection[0].name
}

module "container_apps" {
  source = "../terraform-container-apps"

  enable_container_apps                            = local.enabled
  create_resource_group                            = false
  resource_group_name                              = local.resource_group_name
  location                                         = var.location
  tags                                             = var.tags
  container_app_environment_name                   = "${local.prefix}-container-apps"
  container_apps_subnet_id                         = try(azurerm_subnet.container_apps[0].id, "")
  container_apps_internal_load_balancer            = true
  api_container_app_name                           = "${local.prefix}-api"
  ui_container_app_name                            = "${local.prefix}-ui"
  worker_container_app_name                        = "${local.prefix}-worker"
  api_container_image                              = var.api_container_image
  worker_container_image                           = var.worker_container_image
  ui_container_image                               = var.ui_container_image
  acr_resource_id                                  = var.acr_resource_id
  api_ingress_external                             = false
  ui_ingress_external                              = false
  artifact_blob_service_uri                        = module.storage.primary_blob_endpoint
  artifact_storage_account_id                      = module.storage.storage_account_id
  api_keyvault_user_assigned_identity_id           = try(azurerm_user_assigned_identity.api[0].id, "")
  api_keyvault_user_assigned_identity_client_id    = try(azurerm_user_assigned_identity.api[0].client_id, "")
  worker_keyvault_user_assigned_identity_id        = try(azurerm_user_assigned_identity.worker[0].id, "")
  worker_keyvault_user_assigned_identity_client_id = try(azurerm_user_assigned_identity.worker[0].client_id, "")
  api_environment_variables                        = local.api_environment_variables
  worker_environment_variables                     = local.worker_environment_variables
  ui_environment_variables                         = local.ui_environment_variables
  azure_openai_account_resource_id                 = var.azure_openai_account_id
  azure_openai_endpoint                            = var.azure_openai_endpoint
  azure_openai_chat_deployment_name                = var.azure_openai_chat_deployment_name
  azure_openai_embedding_deployment_name           = var.azure_openai_embedding_deployment_name

}

resource "azurerm_role_assignment" "api_openai_user" {
  count                = local.enabled && length(trimspace(var.azure_openai_account_id)) > 0 ? 1 : 0
  scope                = var.azure_openai_account_id
  role_definition_name = "Cognitive Services OpenAI User"
  principal_id         = module.container_apps.api_system_assigned_principal_id
}

resource "azurerm_role_assignment" "worker_openai_user" {
  count                = local.enabled && length(trimspace(var.azure_openai_account_id)) > 0 ? 1 : 0
  scope                = var.azure_openai_account_id
  role_definition_name = "Cognitive Services OpenAI User"
  principal_id         = module.container_apps.worker_system_assigned_principal_id
}
