resource "azurerm_mssql_server" "main" {
  name                          = local.sql_server_name
  resource_group_name           = azurerm_resource_group.main.name
  location                      = azurerm_resource_group.main.location
  version                       = "12.0"
  administrator_login           = local.sql_admin_login
  administrator_login_password  = random_password.sql_admin.result
  minimum_tls_version           = "1.2"
  public_network_access_enabled = true

  tags = local.merged_tags
}

resource "azurerm_mssql_database" "app" {
  name      = "archlucid"
  server_id = azurerm_mssql_server.main.id
  sku_name  = var.sql_sku_name

  auto_pause_delay_in_minutes = var.sql_auto_pause_delay_in_minutes
  min_capacity                = 0.5
  max_size_gb                 = 2
}

resource "azurerm_mssql_database" "tenant" {
  name      = "archlucidtenantdev"
  server_id = azurerm_mssql_server.main.id
  sku_name  = var.sql_sku_name

  auto_pause_delay_in_minutes = var.sql_auto_pause_delay_in_minutes
  min_capacity                = 0.5
  max_size_gb                 = 2
}

resource "azurerm_mssql_database" "dev" {
  name      = "archlucid-dev"
  server_id = azurerm_mssql_server.main.id
  sku_name  = var.sql_sku_name

  auto_pause_delay_in_minutes = var.sql_auto_pause_delay_in_minutes
  min_capacity                = 0.5
  max_size_gb                 = 2
}

resource "azurerm_mssql_firewall_rule" "allow_azure_services" {
  name             = "allow-azure-services"
  server_id        = azurerm_mssql_server.main.id
  start_ip_address = "0.0.0.0"
  end_ip_address   = "0.0.0.0"
}
