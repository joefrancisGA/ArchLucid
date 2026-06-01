# TB-094 — HotPathCache Redis secret + env on API and Worker.

locals {
  hot_path_cache_redis_configured = local.enabled && length(trimspace(var.hot_path_cache_redis_connection_string)) > 0
}
