locals {
  critical_action_group_enabled = local.enabled && var.enable_critical_action_group

  alert_pagerduty_webhook_uri_effective = length(trimspace(var.alert_pagerduty_webhook_uri)) > 0 ? trimspace(var.alert_pagerduty_webhook_uri) : (
    local.critical_action_group_enabled && var.read_alert_secrets_from_key_vault ? trimspace(data.azurerm_key_vault_secret.alert_pagerduty_webhook_uri[0].value) : ""
  )

  alert_sms_phone_number_effective = length(trimspace(var.alert_sms_phone_number)) > 0 ? trimspace(var.alert_sms_phone_number) : (
    local.critical_action_group_enabled && var.read_alert_secrets_from_key_vault ? trimspace(data.azurerm_key_vault_secret.alert_sms_phone_number[0].value) : ""
  )

  alert_voice_phone_number_effective = length(trimspace(var.alert_voice_phone_number)) > 0 ? trimspace(var.alert_voice_phone_number) : (
    local.critical_action_group_enabled && var.read_alert_secrets_from_key_vault ? trimspace(data.azurerm_key_vault_secret.alert_voice_phone_number[0].value) : ""
  )

  prometheus_p0_rule_group_enabled = local.critical_action_group_enabled && var.enable_prometheus_slo_rule_group && length(trimspace(local.azure_monitor_workspace_id_effective)) > 0
}

