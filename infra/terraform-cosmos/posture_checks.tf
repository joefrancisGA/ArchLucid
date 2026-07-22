check "posture_production_requires_cosmos_private_endpoint" {
  assert {
    condition     = !local.posture_is_production || !var.enable_cosmos_account || var.enable_private_endpoint
    error_message = "posture_tier = production requires enable_private_endpoint = true when enable_cosmos_account is true."
  }
}
