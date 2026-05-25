resource "azurerm_mssql_server" "primary" {
  name                          = var.sql_server_name
  resource_group_name           = var.resource_group_name
  location                      = var.location
  version                       = "12.0"
  administrator_login           = var.sql_admin_login
  administrator_login_password  = var.sql_admin_password
  minimum_tls_version           = "1.2"
  public_network_access_enabled = var.block_public_sql_access ? false : true

  azuread_administrator {
    login_username = var.entra_admin_login
    object_id      = var.entra_admin_object_id
  }
}

resource "azurerm_mssql_database" "app" {
  name                        = var.sql_database_name
  server_id                   = azurerm_mssql_server.primary.id
  collation                   = "SQL_Latin1_General_CP1_CI_AS"
  license_type                = "LicenseIncluded"
  sku_name                    = var.sql_sku
  auto_pause_delay_in_minutes = var.auto_pause_delay_in_minutes
  min_capacity                = var.min_capacity
  storage_account_type        = var.storage_account_type
  max_size_gb                 = var.max_size_gb
}

resource "azurerm_mssql_database" "read_replica" {
  count                       = var.enable_read_replica ? 1 : 0
  name                        = "${var.sql_database_name}-replica"
  server_id                   = azurerm_mssql_server.primary.id
  create_mode                 = "Secondary"
  source_database_id          = azurerm_mssql_database.app.id
  sku_name                    = var.read_replica_sku
  auto_pause_delay_in_minutes = var.auto_pause_delay_in_minutes
  min_capacity                = var.min_capacity
}

resource "azurerm_private_endpoint" "sql" {
  count               = var.enable_private_endpoint ? 1 : 0
  name                = var.private_endpoint_name
  resource_group_name = var.resource_group_name
  location            = var.location
  subnet_id           = var.private_endpoint_subnet_id

  private_service_connection {
    name                           = "psc-${var.private_endpoint_name}"
    private_connection_resource_id = azurerm_mssql_server.primary.id
    subresource_names              = ["sqlServer"]
    is_manual_connection           = false
  }
}

resource "azurerm_mssql_firewall_rule" "deny_all" {
  count            = var.block_public_sql_access ? 1 : 0
  name             = "deny-all"
  server_id        = azurerm_mssql_server.primary.id
  start_ip_address = "0.0.0.0"
  end_ip_address   = "0.0.0.0"
}
