> **Scope:** Scale tiers and cache consistency assumptions for hosted and self-hosted pilots.

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

## Security / reliability

- Redis connection strings belong in Key Vault references in production-like hosting.
- Invalidation follows run/snapshot lifecycle; do not treat cache as authoritative — SQL remains source of truth.

## Related

- [`../runbooks/HOSTED_AVAILABILITY_ROLLUP.md`](../runbooks/HOSTED_AVAILABILITY_ROLLUP.md)
- [`../engineering/BUILD.md`](../engineering/BUILD.md)
