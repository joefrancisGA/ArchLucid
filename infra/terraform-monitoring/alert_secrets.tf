# Optional Key Vault secret resolution for P0 alert routing (Improvement #46).
# Populate secrets with:
#   az keyvault secret set --vault-name <kv> --name alert-sms-phone-number --value "<digits-only>"
#   az keyvault secret set --vault-name <kv> --name alert-voice-phone-number --value "<digits-only>"
#   az keyvault secret set --vault-name <kv> --name alert-pagerduty-webhook-uri --value "https://events.pagerduty.com/integration/{key}/enqueue"

data "azurerm_key_vault" "alert_secrets" {
  count = local.critical_action_group_enabled && var.read_alert_secrets_from_key_vault ? 1 : 0

  name                = var.alert_secrets_key_vault_name
  resource_group_name = var.alert_secrets_key_vault_resource_group_name
}

data "azurerm_key_vault_secret" "alert_sms_phone_number" {
  count = local.critical_action_group_enabled && var.read_alert_secrets_from_key_vault ? 1 : 0

  name         = var.alert_sms_phone_number_secret_name
  key_vault_id = data.azurerm_key_vault.alert_secrets[0].id
}

data "azurerm_key_vault_secret" "alert_voice_phone_number" {
  count = local.critical_action_group_enabled && var.read_alert_secrets_from_key_vault ? 1 : 0

  name         = var.alert_voice_phone_number_secret_name
  key_vault_id = data.azurerm_key_vault.alert_secrets[0].id
}

data "azurerm_key_vault_secret" "alert_pagerduty_webhook_uri" {
  count = local.critical_action_group_enabled && var.read_alert_secrets_from_key_vault ? 1 : 0

  name         = var.alert_pagerduty_webhook_uri_secret_name
  key_vault_id = data.azurerm_key_vault.alert_secrets[0].id
}
