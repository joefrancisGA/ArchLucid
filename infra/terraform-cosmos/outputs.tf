output "cosmos_account_id" {
  value       = try(azurerm_cosmosdb_account.polyglot[0].id, null)
  description = "Cosmos DB account resource id."
}

output "cosmos_primary_sql_connection_string" {
  value       = try(azurerm_cosmosdb_account.polyglot[0].primary_sql_connection_string, null)
  description = "Maps to CosmosDb:ConnectionString when polyglot features are enabled."
  sensitive   = true
}

output "cosmos_endpoint" {
  value       = try(azurerm_cosmosdb_account.polyglot[0].endpoint, null)
  description = "Cosmos account endpoint URI."
}

output "cosmos_database_name" {
  value       = local.enabled ? var.cosmos_database_name : null
}

output "cosmos_private_endpoint_id" {
  value = try(azurerm_private_endpoint.cosmos[0].id, null)
}

output "cosmos_assessment_note" {
  value       = "Production-like pilots keep CosmosDb feature flags off; enable this root only when GraphSnapshotsEnabled, AgentTracesEnabled, or AuditEventsEnabled are true."
  description = "TB-095 assessment: optional polyglot path, not default hosted footprint."
}
