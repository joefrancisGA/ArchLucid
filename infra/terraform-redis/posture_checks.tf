check "posture_production_requires_redis_private_endpoint" {
  assert {
    condition     = !local.posture_is_production || !var.enable_redis_cache || var.enable_private_endpoint
    error_message = "posture_tier = production requires enable_private_endpoint = true when enable_redis_cache is true."
  }
}
