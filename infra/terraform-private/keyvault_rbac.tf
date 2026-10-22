# TB-092 — workload RBAC to read secrets from the vault referenced by var.key_vault_id.
resource "azurerm_role_assignment" "key_vault_secrets_user" {
  for_each = (
    local.pe_enabled &&
    length(trimspace(var.key_vault_id)) > 0
  ) ? toset([for id in var.key_vault_workload_principal_ids : trimspace(id) if length(trimspace(id)) > 0]) : toset([])

  scope                = var.key_vault_id
  role_definition_name = "Key Vault Secrets User"
  principal_id         = each.value
}
