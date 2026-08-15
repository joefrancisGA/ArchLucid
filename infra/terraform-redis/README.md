# terraform-redis (TB-094)

Azure Cache for Redis for `HotPathCache:RedisConnectionString`. See `staging.tfvars.example` and `docs/library/IAC_RUNTIME_PARITY.md`.

**TB-2120 / TB-2141:** When classic `azurerm_redis_cache` / `az redis create` is unavailable (Cache for Redis retirement), provision **Azure Managed Redis** with `scripts/ops/provision-hot-path-cache-managed-redis.ps1` and wire the StackExchange.Redis connection string into `infra/terraform-container-apps` `hot_path_cache_redis_connection_string`. Full steps: `docs/library/SCALE_TIER_CACHE_GUIDE.md`.
