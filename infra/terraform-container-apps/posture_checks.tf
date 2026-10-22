check "posture_staging_or_production_requires_secondary_region_stack" {
  assert {
    condition     = !local.posture_is_staging_or_production || !var.enable_container_apps || var.secondary_region_stack_enabled
    error_message = "posture_tier staging/production requires secondary_region_stack_enabled = true when enable_container_apps is true."
  }
}

check "posture_staging_or_production_requires_container_apps_consumption_budget" {
  assert {
    condition     = !local.posture_is_staging_or_production || !var.enable_container_apps || var.enable_container_apps_consumption_budget
    error_message = "posture_tier staging/production requires enable_container_apps_consumption_budget = true when enable_container_apps is true."
  }
}
