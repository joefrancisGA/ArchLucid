output "key_vault_id" {
  value       = try(azurerm_key_vault.archlucid[0].id, "")
  description = "Resource id of the Key Vault when created."
}

output "key_vault_uri" {
  value       = try(azurerm_key_vault.archlucid[0].vault_uri, "")
  description = "HTTPS URI for ArchLucid:Secrets:KeyVaultUri."
}

output "user_assigned_keyvault_workload_identities_enabled" {
  description = "TB-656: true when API/Worker user-assigned Key Vault identities are created in this root."
  value       = local.user_assigned_keyvault_workload_identities_enabled
}

output "api_keyvault_user_assigned_identity_id" {
  description = "Resource ID of the API user-assigned identity for Key Vault (pass to terraform-container-apps)."
  value       = try(azurerm_user_assigned_identity.api_keyvault[0].id, "")
}

output "api_keyvault_user_assigned_principal_id" {
  description = "Principal ID of the API user-assigned Key Vault identity."
  value       = try(azurerm_user_assigned_identity.api_keyvault[0].principal_id, "")
}

output "api_keyvault_user_assigned_client_id" {
  description = "Client ID of the API user-assigned Key Vault identity (AZURE_CLIENT_ID on the API Container App)."
  value       = try(azurerm_user_assigned_identity.api_keyvault[0].client_id, "")
}

output "worker_keyvault_user_assigned_identity_id" {
  description = "Resource ID of the Worker user-assigned identity for Key Vault (pass to terraform-container-apps)."
  value       = try(azurerm_user_assigned_identity.worker_keyvault[0].id, "")
}

output "worker_keyvault_user_assigned_principal_id" {
  description = "Principal ID of the Worker user-assigned Key Vault identity."
  value       = try(azurerm_user_assigned_identity.worker_keyvault[0].principal_id, "")
}

output "worker_keyvault_user_assigned_client_id" {
  description = "Client ID of the Worker user-assigned Key Vault identity (AZURE_CLIENT_ID on the Worker Container App)."
  value       = try(azurerm_user_assigned_identity.worker_keyvault[0].client_id, "")
}
