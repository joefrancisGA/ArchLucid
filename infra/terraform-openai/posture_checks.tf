check "posture_staging_or_production_requires_openai_consumption_budget" {
  assert {
    condition     = !local.posture_is_staging_or_production || var.enable_openai_consumption_budget
    error_message = "posture_tier staging/production requires enable_openai_consumption_budget = true (set openai_consumption_budget_resource_group_id before apply)."
  }
}
