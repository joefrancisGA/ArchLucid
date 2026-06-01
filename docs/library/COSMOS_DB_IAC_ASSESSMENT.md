# Cosmos DB IaC assessment (TB-095)

**Date:** 2026-06-01  
**Backlog:** TB-095  
**Outcome:** **Dormant** on production-like hosted pilots; **codified** as optional `infra/terraform-cosmos/`.

## Assessment

| Question | Finding |
|----------|---------|
| Is Cosmos provisioned in hosted pilot Terraform? | **No** — `deploy/hosted-prod-terraform` and default `appsettings.json` use empty `CosmosDb:ConnectionString`. |
| Are polyglot feature flags on in production-like config? | **No** — `GraphSnapshotsEnabled`, `AgentTracesEnabled`, and `AuditEventsEnabled` default **false** (Development emulator may enable locally). |
| Is `Microsoft.Azure.Cosmos` used? | **Yes**, scoped to `ArchLucid.Persistence` only; runtime creates containers on demand when flags + connection string are set. |
| Authoritative paths without Cosmos | SQL graph snapshots, SQL agent traces, SQL audit; in-memory cache; SQL integration-event outbox. |

## Containers (when enabled)

Aligned with `CosmosClientFactory.cs`:

| Container | Partition key | Notes |
|-----------|---------------|--------|
| `graph-snapshots` | `/graphSnapshotId` | Graph polyglot |
| `agent-traces` | `/runId` | TTL from `AgentTraceTtlSeconds` (default 90d in code) |
| `audit-events` | `/tenantId` | Change feed source |
| `audit-events-leases` | `/id` | Change feed processor leases |

Minimum consistency: **Session** (Terraform `consistency_policy` + app `DefaultConsistencyLevel`).

## Terraform root

- Path: `infra/terraform-cosmos/`
- Default: `enable_cosmos_account = false` (assessment: dormant until flags enabled)
- Optional: private endpoint `privatelink.documents.azure.com`, diagnostics, Key Vault secret for `primary_sql_connection_string`

## Operator actions

1. **Pilot (SQL-only):** No apply required; leave flags off.
2. **Enable polyglot:** Set feature flags, apply `terraform-cosmos` with `enable_cosmos_account = true`, store connection string in Key Vault, wire Container Apps env from secret output.

## Security / cost / reliability

- **Security:** Prefer private endpoint + disable public access when PE subnet is supplied; connection string in Key Vault only.
- **Cost:** Serverless or manual RU per container; default 400 RU/s per container on Standard offer — tune per environment.
- **Reliability:** Optional geo-replication via `cosmos_geo_locations`; continuous backup variable defaults on.
- **Scalability:** Polyglot path for graph/traces/audit at Cosmos scale; not required for single-tenant pilots on SQL.

## References

- `ArchLucid.Persistence/Cosmos/CosmosClientFactory.cs`
- `docs/library/IAC_RUNTIME_PARITY.md`
- `infra/terraform-pilot` nested root order (optional `cosmos` after `redis`)
