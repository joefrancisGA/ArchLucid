check "posture_production_requires_front_door_waf" {
  assert {
    condition     = !local.posture_is_production || var.enable_front_door_waf
    error_message = "posture_tier = production requires enable_front_door_waf = true. Set posture_tier = dev for laptop-only sandboxes."
  }
}
