
check "sql_defender_requires_alert_email" {
  assert {
    condition     = !var.enable_sql_defender || length(trimspace(var.alert_email_address)) > 0
    error_message = "enable_sql_defender = true requires alert_email_address for Defender notifications."
  }
}

check "sql_defender_requires_log_analytics_for_auditing" {
  assert {
    condition     = !var.enable_sql_defender || local.sql_auditing_enabled
    error_message = "enable_sql_defender = true requires log_analytics_workspace_id for unified SQL auditing."
  }
}
