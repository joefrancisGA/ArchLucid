> **Scope:** Operator and contributor runbook for DbUp migrations during rolling Container Apps deploys when old and new API pods share one catalog; not a substitute for migration authoring standards or one-shot cutover playbooks.

# Rolling deploy migrations

Operators and contributors use this runbook when a DbUp script is **not** safe for a rolling Container Apps deploy (old and new API pods share one catalog during the rollout).

## Safe patterns (expand / contract)

1. **Add nullable column** in migration N; backfill in N or N+1; enforce `NOT NULL` only after all pods write the column.
2. **CHECK / FK constraints** on legacy rows: add with `WITH NOCHECK`, backfill, then `WITH CHECK` in a later migration or coordinated cutover.
3. **Unique indexes:** add the new unique index **before** dropping the old one; deploy app code that stops creating duplicates **before** enforcing uniqueness.
4. **Data cleanup + UNIQUE:** never `DELETE` duplicates in the same script as `CREATE UNIQUE INDEX` unless all pods are stopped or the app cannot recreate duplicates.

## Deploy order checklist

| Change type | Migrate first | App first | Notes |
|-------------|---------------|-----------|-------|
| New nullable column | Either | Either | Old pods ignore column. |
| `NOT NULL` on existing column | After backfill + app writes | App that writes column | Old pods inserting NULL will fail. |
| `CREATE UNIQUE INDEX` after dedupe | After app stops creating dupes | App | See migration 223 pattern. |
| Drop unique index | After replacement index live | Either | Uniqueness gap during drop-only window. |

## Historical coordinated migrations

These shipped before CI lint existed; they require **coordinated** deploy (scale to one revision or accept brief failure window):

| Migration | Risk | Tag |
|-----------|------|-----|
| **116** | CHECK constraints reject legacy values | rolling-deploy: coordinated |
| **214** | CHECK constraints reject legacy values | rolling-deploy: coordinated |
| **215** `ScopeColumnsNotNull` | `ALTER NOT NULL` after backfill | rolling-deploy: coordinated |
| **216** | Drops old unique index before filtered replacement | rolling-deploy: coordinated |
| **223** `AgentExecutionTraces_RunTaskAgentType_Unique` | DELETE dupes + CREATE UNIQUE | rolling-deploy: coordinated |

Annotate new risky migrations in `docs/library/SQL_SCRIPTS.md` §4.2 with the same tag.

## CI guard

`scripts/ci/check_migration_rolling_deploy_patterns.py` scans **changed** forward migrations in a PR for:

- Bare `ALTER COLUMN … NOT NULL` without expand/contract pairing in the same PR
- `DELETE` before `CREATE UNIQUE`
- `DROP INDEX` before replacement `CREATE UNIQUE INDEX`

Historical scripts above are allow-listed. New violations fail CI unless explicitly allow-listed with a header comment justification.

## Related

- [`docs/library/SQL_SCRIPTS.md`](../library/SQL_SCRIPTS.md) — schema change checklist
- [`MIGRATION_ROLLBACK.md`](MIGRATION_ROLLBACK.md) — rollback discipline
- **TB-068** in [`docs/library/TECH_BACKLOG.md`](../library/TECH_BACKLOG.md)
