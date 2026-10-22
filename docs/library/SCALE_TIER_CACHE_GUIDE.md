> **Scope:** Contributor-reference — Scale tiers and cache consistency assumptions for hosted and self-hosted pilots.

# Scale tier and cache consistency guide

ArchLucid V1 supports **single-replica** pilots without Redis. Multi-replica fleets need explicit cache posture.

## Tiers

| Tier | Typical use | Hot-path cache | LLM completion cache | Graph projection cache |
| --- | --- | --- | --- | --- |
| **Pilot (single replica)** | First pilot, dev, CI | Memory or Auto→Memory | Memory (default) | In-process memory |
| **Early production (2+ replicas)** | Hosted SaaS scale-out | **Redis required** (Auto or Redis) | Distributed recommended | In-process (V1); distributed V2 |
| **Fleet (many replicas)** | High traffic | Redis + private connectivity | Distributed + budget caps | V2 candidate |

## Configuration keys

- `HotPathCache:Enabled`, `HotPathCache:Provider` (`Memory`, `Redis`, `Auto`)
- `HotPathCache:ExpectedApiReplicaCount` — when **> 1**, effective provider must be **Redis** outside Development (startup validation).
- `HotPathCache:RedisConnectionString`
- `LlmCompletionCache:Provider` — `Distributed` when cross-replica LLM response reuse is required.

See [`CONFIGURATION_REFERENCE.md`](CONFIGURATION_REFERENCE.md) and [`V1_DEFERRED.md`](V1_DEFERRED.md) §6e (distributed graph cache is V2).

## Operational tradeoffs

- **Memory-only on multiple replicas:** stale reads across pods; config lint and startup rules warn or fail in production-like profiles.
- **Redis optional for V1 single-replica:** not a headline readiness defect per scope contract.
- **Cost:** Redis adds Azure Cache spend; prefer private endpoint in production-like Terraform.
- **LLM completion poison (TB-940):** agent schema path admits only after validation; invalid cache hits are busted (not replayed until TTL). Watch `archlucid_llm_cache_poison_busts_total`.

## Security / reliability

- Redis connection strings belong in Key Vault references in production-like hosting.
- Invalidation follows run/snapshot lifecycle; do not treat cache as authoritative — SQL remains source of truth.

## TB-2120 / TB-2141 enablement (hosted HotPathCache Redis L2)

**TB-2120 (Done 2026-08-09, DEV):** Azure Managed Redis `Balanced_B0` on ArchLucid DEV; API + Worker receive `HotPathCache__RedisConnectionString` via Container App secret `hot-path-redis-connection` and `HotPathCache__ExpectedApiReplicaCount` aligned to `api_max_replicas` when `hot_path_cache_redis_connection_string` is set in `infra/terraform-container-apps`.

**TB-2141 (staging → production):** Repeat the same wiring outside DEV. Default **`api_min_replicas = 2`** in staging/production examples means **Redis L2 is required** before scale-out — startup validation fails when `ExpectedApiReplicaCount > 1` and the effective provider resolves to Memory outside Development.

### Apply order

1. **Provision Redis** — either:
   - `infra/terraform-redis` with `staging.tfvars` / `production.tfvars` (classic `azurerm_redis_cache` where still available), **or**
   - `scripts/ops/provision-hot-path-cache-managed-redis.ps1` when classic Cache for Redis creation is blocked (use **Azure Managed Redis** / `az redisenterprise`, same path as DEV **TB-2120**).
2. **Store the connection string** in Key Vault (production-like) or as the sensitive tf var `hot_path_cache_redis_connection_string` on `infra/terraform-container-apps`.
3. **`terraform apply`** container-apps for the target environment. When `hot_path_cache_redis_connection_string` is non-empty, Terraform sets:
   - `HotPathCache__RedisConnectionString` (secret ref `hot-path-redis-connection`) on API + Worker
   - `HotPathCache__ExpectedApiReplicaCount` = `api_max_replicas`
4. **Verify:** `scripts/ops/enable-hot-path-cache-redis-checklist.ps1 -ApiBaseUrl <api-host>` — `/health/ready` **200**, warm list/dashboard reads across **2+** replicas, cache hit / SQL drop observable in metrics.
5. **Rollback:** clear `hot_path_cache_redis_connection_string` and re-apply (removes Redis env), **or** set `HotPathCache__Provider=Memory` with `ExpectedApiReplicaCount=1` only when intentionally running a single-replica pilot.

Committed `appsettings.Staging.json` / `appsettings.Production.json` keep `RedisConnectionString` empty and `ExpectedApiReplicaCount: 1` as safe local defaults; **hosted** values come from Container Apps environment variables above.

### Cost / security notes

- Budget ~**+$55–75**/mo for Standard / Managed Redis class (region-dependent); prefer **private endpoint** in production (`terraform-redis` `enable_private_endpoint`).
- Rotate Redis keys after first wire; never commit connection strings to git.

## Related

- [`../runbooks/HOSTED_AVAILABILITY_ROLLUP.md`](../runbooks/HOSTED_AVAILABILITY_ROLLUP.md)
- [`../engineering/BUILD.md`](../engineering/BUILD.md)
- [`../../scripts/ops/enable-hot-path-cache-redis-checklist.ps1`](../../scripts/ops/enable-hot-path-cache-redis-checklist.ps1)
- [`../../scripts/ops/provision-hot-path-cache-managed-redis.ps1`](../../scripts/ops/provision-hot-path-cache-managed-redis.ps1)
