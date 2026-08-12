# terraform-redis (TB-094 / TB-2120 / TB-2141)

Azure Cache for Redis (or Azure Managed Redis when classic SKU creation is blocked) for `HotPathCache:RedisConnectionString`.

## Apply order

1. Apply this root with `staging.tfvars.example` or `production.tfvars.example`.
2. Wire `terraform output -raw redis_primary_connection_string` into **`infra/terraform-container-apps`** as **`hot_path_cache_redis_connection_string`** (**TB-2141**).
3. Run **`scripts/ops/enable-hot-path-cache-redis-checklist.ps1`**.

See **`docs/library/SCALE_TIER_CACHE_GUIDE.md`**, **`docs/library/IAC_RUNTIME_PARITY.md`**, and **`docs/library/TERRAFORM_CROSS_ROOT_DEPENDENCY_SAFETY.md`**.
