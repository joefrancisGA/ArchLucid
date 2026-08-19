output "sql_server_id" { value = azurerm_mssql_server.primary.id }
output "sql_server_fqdn" { value = azurerm_mssql_server.primary.fully_qualified_domain_name }
output "app_database_id" { value = azurerm_mssql_database.app.id }
output "app_database_name" { value = azurerm_mssql_database.app.name }
output "read_replica_database_name" { value = var.enable_read_replica ? azurerm_mssql_database.read_replica[0].name : null }
output "managed_identity_connection_string_template" {
  value = format("Server=tcp:%s,1433;Database=%s;Authentication=Active Directory Default;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;", azurerm_mssql_server.primary.fully_qualified_domain_name, azurerm_mssql_database.app.name)
}
output "read_replica_connection_string_template" {
  value = var.enable_read_replica ? format("Server=tcp:%s,1433;Database=%s;Authentication=Active Directory Default;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;", azurerm_mssql_server.primary.fully_qualified_domain_name, azurerm_mssql_database.read_replica[0].name) : null
}
output "private_endpoint_id" { value = var.enable_private_endpoint ? azurerm_private_endpoint.sql[0].id : null }

output "sql_tde_cmk_enabled" {
  description = "True when customer-managed TDE is configured on the SQL server."
  value       = var.enable_sql_tde_cmk
}
