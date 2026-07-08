# TB-094 — HotPathCache Redis secret + env on API and Worker.
# TB-580 — ExpectedApiReplicaCount env aligns Provider=Auto with Container Apps max_replicas for Redis L2.

locals {
  hot_path_cache_redis_configured = local.enabled && length(trimspace(var.hot_path_cache_redis_connection_string)) > 0
}
