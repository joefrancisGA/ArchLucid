output "managed_identity_connection_string_template" {
  value = module.azure_sql_serverless_app.managed_identity_connection_string_template
}
output "read_replica_connection_string_template" {
  value = module.azure_sql_serverless_app.read_replica_connection_string_template
}
output "app_database_id" {
  value = module.azure_sql_serverless_app.app_database_id
}
