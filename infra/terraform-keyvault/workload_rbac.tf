locals {
  key_vault_workload_principal_ids = distinct(compact([
    trimspace(var.api_managed_identity_principal_id),
    trimspace(var.worker_managed_identity_principal_id),
  ]))
}

resource "azurerm_role_assignment" "vault_secrets_user_workloads" {
  for_each = local.enabled ? toset(local.key_vault_workload_principal_ids) : toset([])

  scope                = azurerm_key_vault.archlucid[0].id
  role_definition_name = "Key Vault Secrets User"
  principal_id         = each.value
}
