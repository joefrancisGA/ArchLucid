# Thin composition root — wire module blocks to sibling stacks when your fork pins remote state.
# Default repository leaves resources in existing `infra/terraform-*` roots; this file validates cleanly.

output "apply_order_doc" {
  value       = "See docs/REFERENCE_SAAS_STACK_ORDER.md and docs/deployment/PILOT_PROFILE.md"
  description = "Canonical sequencing for Azure roots."
}

output "cost_variables" {
  value = {
    pilot_monthly_budget_usd      = var.pilot_monthly_budget_usd
    sql_sku_hint                  = var.sql_sku_hint
    container_apps_max_replicas   = var.container_apps_max_replicas
    app_insights_sampling_percent = var.app_insights_sampling_percent
  }
}
