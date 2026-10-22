# BFF session signing secret (ADR 0059 P1 / LK-05).
# Value is provisioned out-of-band; Terraform tracks the secret name only.

resource "azurerm_key_vault_secret" "bff_session_signing_key" {
  count = local.enabled ? 1 : 0

  name         = "bff-session-signing-key"
  value        = "rotate-after-provision"
  key_vault_id = azurerm_key_vault.archlucid[0].id

  lifecycle {
    ignore_changes = [value]
  }

  tags = var.tags
}
