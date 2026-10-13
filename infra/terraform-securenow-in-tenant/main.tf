resource "azurerm_resource_group" "this" {
  name     = "${var.name_prefix}-rg"
  location = var.location
  tags     = local.tags
}

resource "azurerm_user_assigned_identity" "api" {
  name                = "${var.name_prefix}-id-api"
  location            = var.location
  resource_group_name = azurerm_resource_group.this.name
  tags                = local.tags
}

resource "azurerm_user_assigned_identity" "worker" {
  name                = "${var.name_prefix}-id-worker"
  location            = var.location
  resource_group_name = azurerm_resource_group.this.name
  tags                = local.tags
}

resource "azurerm_user_assigned_identity" "collector" {
  name                = "${var.name_prefix}-id-collector"
  location            = var.location
  resource_group_name = azurerm_resource_group.this.name
  tags                = local.tags
}

module "sql" {
  source = "../modules/azure-sql-serverless-app"

  location              = var.location
  resource_group_name   = azurerm_resource_group.this.name
  sql_server_name       = "${var.name_prefix}-sql"
  sql_database_name     = "${var.name_prefix}-db"
  sql_admin_login       = var.sql_admin_login
  sql_admin_password    = var.sql_admin_password
  entra_admin_login     = var.entra_admin_login
  entra_admin_object_id = var.entra_admin_object_id

  # The private-network module owns the SQL private endpoint. A second endpoint here would duplicate it.
  enable_private_endpoint = false
  block_public_sql_access = true
  enable_read_replica     = false
  enable_sql_defender     = false
  enable_sql_monitoring   = false
}

resource "azurerm_storage_account" "app" {
  name                            = local.storage_account_name
  resource_group_name             = azurerm_resource_group.this.name
  location                        = var.location
  account_tier                    = "Standard"
  account_replication_type        = "LRS"
  account_kind                    = "StorageV2"
  min_tls_version                 = "TLS1_2"
  https_traffic_only_enabled      = true
  shared_access_key_enabled       = false
  public_network_access_enabled   = false
  allow_nested_items_to_be_public = false

  blob_properties {
    versioning_enabled = true

    delete_retention_policy {
      days = 30
    }
  }

  identity {
    type = "SystemAssigned"
  }

  # Inline so Trivy config scan (AZU-0012) sees deny-by-default on the account resource.
  # AzureServices bypass is not a substitute for a private endpoint; a Microsoft-hosted
  # Automation sandbox may still be unable to reach this account. That follow-up is a
  # hybrid worker in the VNet, not a public storage account.
  network_rules {
    default_action = "Deny"
    bypass         = ["AzureServices"]
  }

  tags = local.tags
}

resource "azurerm_storage_container" "handoff" {
  name                  = "securenow-collection"
  storage_account_id    = azurerm_storage_account.app.id
  container_access_type = "private"
}

resource "azurerm_storage_container" "payloads" {
  name                  = "app-payloads"
  storage_account_id    = azurerm_storage_account.app.id
  container_access_type = "private"
}

resource "azurerm_key_vault" "app" {
  name                          = "${var.name_prefix}-kv"
  location                      = var.location
  resource_group_name           = azurerm_resource_group.this.name
  tenant_id                     = data.azurerm_client_config.current.tenant_id
  sku_name                      = "standard"
  rbac_authorization_enabled    = true
  purge_protection_enabled      = true
  soft_delete_retention_days    = 7
  public_network_access_enabled = false

  network_acls {
    default_action = "Deny"
    bypass         = "AzureServices"
  }

  tags = local.tags
}

module "openai" {
  source = "../modules/azure-openai"

  location                      = var.location
  resource_group_name           = azurerm_resource_group.this.name
  account_name                  = local.openai_account_name
  public_network_access_enabled = false
  enable_economy_deployment     = false
  enable_premium_deployment     = false
  tags                          = local.tags
}

module "private" {
  source = "../terraform-private"

  enable_private_data_plane     = true
  create_resource_group         = false
  resource_group_name           = azurerm_resource_group.this.name
  resource_group_location       = var.location
  location                      = var.location
  virtual_network_name          = local.virtual_network_name
  private_endpoints_subnet_name = "${var.name_prefix}-snet-pe"

  sql_server_id      = module.sql.sql_server_id
  storage_account_id = azurerm_storage_account.app.id
  key_vault_id       = azurerm_key_vault.app.id
  openai_account_id  = module.openai.account_id

  sql_private_endpoint_name       = "${var.name_prefix}-pe-sql"
  blob_private_endpoint_name      = "${var.name_prefix}-pe-blob"
  key_vault_private_endpoint_name = "${var.name_prefix}-pe-kv"
  openai_private_endpoint_name    = "${var.name_prefix}-pe-oai"

  key_vault_workload_principal_ids = [
    azurerm_user_assigned_identity.api.principal_id,
    azurerm_user_assigned_identity.worker.principal_id,
  ]

  tags = local.tags
}
