check "posture_production_requires_monitoring_stack" {
  assert {
    condition     = !local.posture_is_production || var.enable_monitoring_stack
    error_message = "posture_tier = production requires enable_monitoring_stack = true (free action group; set alert_email_address)."
  }
}
