# Optional: write alert phone secrets into Key Vault (digits only). Prefer over TF_VAR for steady-state applies.

locals {
  manage_alert_secrets_in_key_vault = var.enable_monitoring_stack && var.enable_critical_action_group && var.write_alert_secrets_to_key_vault && length(trimspace(var.alert_secrets_key_vault_name)) > 0
}

data "azurerm_key_vault" "managed_alert_secrets" {
  count = local.manage_alert_secrets_in_key_vault ? 1 : 0

  name                = var.alert_secrets_key_vault_name
  resource_group_name = var.alert_secrets_key_vault_resource_group_name
}

resource "azurerm_key_vault_secret" "alert_sms_phone_number" {
  count = local.manage_alert_secrets_in_key_vault && length(trimspace(var.alert_sms_phone_number)) > 0 ? 1 : 0

  name            = var.alert_sms_phone_number_secret_name
  value           = trimspace(var.alert_sms_phone_number)
  key_vault_id    = data.azurerm_key_vault.managed_alert_secrets[0].id
  expiration_date = timeadd(timestamp(), "${var.managed_key_vault_secret_ttl_days * 24}h")
}

resource "azurerm_key_vault_secret" "alert_voice_phone_number" {
  count = local.manage_alert_secrets_in_key_vault && length(trimspace(var.alert_voice_phone_number)) > 0 ? 1 : 0

  name            = var.alert_voice_phone_number_secret_name
  value           = trimspace(var.alert_voice_phone_number)
  key_vault_id    = data.azurerm_key_vault.managed_alert_secrets[0].id
  expiration_date = timeadd(timestamp(), "${var.managed_key_vault_secret_ttl_days * 24}h")
}

resource "azurerm_key_vault_secret" "application_insights_connection_string" {
  count = local.manage_alert_secrets_in_key_vault && local.application_insights_enabled ? 1 : 0

  name            = var.application_insights_connection_string_secret_name
  value           = azurerm_application_insights.archlucid[0].connection_string
  key_vault_id    = data.azurerm_key_vault.managed_alert_secrets[0].id
  expiration_date = timeadd(timestamp(), "${var.managed_key_vault_secret_ttl_days * 24}h")
}
