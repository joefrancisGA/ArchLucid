output "resource_group_name" {
  value       = azurerm_resource_group.extractor.name
  description = "Resource group that hosts the scheduled extractor agent."
}

output "automation_account_name" {
  value       = azurerm_automation_account.extractor.name
  description = "Automation account that runs the weekly collector."
}

output "automation_principal_id" {
  value       = azurerm_automation_account.extractor.identity[0].principal_id
  description = "Managed identity used for ARM reads, blob download, and Key Vault."
}

output "key_vault_name" {
  value       = azurerm_key_vault.extractor.name
  description = "Key Vault that should hold the ArchLucid API key secret."
}

output "key_vault_secret_name" {
  value       = var.key_vault_secret_name
  description = "Secret name the runbook reads for X-Api-Key."
}

output "collector_storage_account_name" {
  value       = azurerm_storage_account.collector.name
  description = "Storage account that pins the collector script ZIP."
}

output "collector_blob_name" {
  value       = var.collector_blob_name
  description = "Blob name of the pinned collector script ZIP."
}

output "next_step" {
  value       = "Set the Key Vault secret if it was not provided to Terraform, wait for Az.Accounts/Az.Resources/Az.ResourceGraph module import, then start the runbook once to verify upload."
  description = "Operator follow-up after apply."
}
