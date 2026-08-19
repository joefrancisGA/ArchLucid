# Tenant lifecycle (buyer overview)

ArchLucid provisions each customer tenant as an isolated database catalog with a shared application tier. Lifecycle stages are explicit so procurement reviewers know what changes at each step.

## Stages

| Stage | What happens | Buyer-visible signal |
| --- | --- | --- |
| **Provisioned** | Tenant catalog created; default workspace and pilot policy packs attached | Welcome + first-review guided path |
| **Pilot active** | Reviews, exports, and ROI summaries operate on committed runs in the tenant catalog | Value-report surfaces populate after first finalize |
| **Suspended** | Writes blocked; reads retained for audit | Maintenance banner; exports still available for committed packages |
| **Migrated** | Catalog fan-out per [TENANT_MIGRATION_FANOUT.md](../../operations/TENANT_MIGRATION_FANOUT.md) | Scheduled maintenance notice |
| **Retired** | Catalog detached; backups per contract retention | Access revoked; audit export window documented in order form |

## Isolation reminder

Database-per-tenant limits data blast radius. Request-layer tenant resolution, authorization checks, and append-only audit provide additional nets — see [DATA_HANDLING.md](DATA_HANDLING.md).

## Related

- [REVIEW_RECORD_INTEGRITY.md](REVIEW_RECORD_INTEGRITY.md)
- [DATA_HANDLING.md](DATA_HANDLING.md)
