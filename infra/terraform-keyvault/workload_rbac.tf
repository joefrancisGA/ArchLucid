locals {
  user_assigned_keyvault_principal_ids = local.user_assigned_keyvault_workload_identities_enabled ? compact([
    azurerm_user_assigned_identity.api_keyvault[0].principal_id,
    azurerm_user_assigned_identity.worker_keyvault[0].principal_id,
  ]) : []

  legacy_system_assigned_principal_ids = compact([
    trimspace(var.api_managed_identity_principal_id),
    trimspace(var.worker_managed_identity_principal_id),
  ])

  key_vault_workload_principal_ids = distinct(compact(concat(
    local.user_assigned_keyvault_principal_ids,
    local.legacy_system_assigned_principal_ids,
  )))
}

resource "azurerm_role_assignment" "vault_secrets_user_workloads" {
  for_each = local.enabled ? toset(local.key_vault_workload_principal_ids) : toset([])

  scope                = azurerm_key_vault.archlucid[0].id
  role_definition_name = "Key Vault Secrets User"
  principal_id         = each.value
}
