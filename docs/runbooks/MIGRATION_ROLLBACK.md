> **Scope:** SQL migration rollback (DbUp / ArchLucid.Persistence) and rolling Container Apps deploy patterns when old and new API pods share one catalog.

> **Spine doc:** [`START_HERE.md`](../START_HERE.md).


# SQL migration rollback (DbUp / ArchLucid.Persistence)

**Last reviewed:** 2026-08-02

## Objective

Describe how operators recover when a **forward-only** DbUp migration is wrong, partially applied, or must be undone in an emergency. This complements **`docs/SQL_DDL_DISCIPLINE.md`** (item **249**).

## Assumptions

- Production schema evolves via **embedded scripts** under **`ArchLucid.Persistence/Migrations/`**, applied in lexicographic order by **`DatabaseMigrator`**.
- **`ArchLucid.sql`** is the consolidated reference for greenfield bootstrap; brownfield servers may have run the same logical change through a numbered migration first.
- **DbUp does not ship “down” scripts**; rollback is a **manual** DBA operation with a **restore-first** bias.

## Constraints

- Prefer **point-in-time restore** (PITR) or database **snapshot revert** over hand-written `ALTER TABLE DROP` when data loss or referential integrity is unclear.
- Any manual DDL must respect **FK order** (drop children before parents when removing columns/tables).
- Never expose **SMB (port 445)** for backups; use private endpoints and controlled networks for backup storage.

## Architecture overview

| Component | Role |
|-----------|------|
| **`Migrations/NNN_*.sql`** | Ordered, idempotent-forward deltas. |
| **`ArchLucid.sql`** | Full bootstrap parity (includes post-migration sections). |
| **Backup / PITR** | Primary rollback mechanism for production. |

## Data flow (rollback decision)

1. **Detect failure** — migration job fails mid-script, app health checks fail, or incorrect DDL shipped.
2. **Stop traffic** — scale App Service to zero or disable the API until the database state is known-good.
3. **Choose path:**
   - **A. Restore** — restore DB to pre-migration backup / PITR (recommended when migration already committed destructive changes).
   - **B. Forward fix** — ship a **new** migration that repairs schema/data (recommended when restore is too costly and drift is understood).
   - **C. Manual reverse DDL** — only for **additive** migrations (e.g. new nullable column) where dropping the column is provably safe; document the exact `ALTER` in the incident record.

## Security model

- Rollback operations use **least-privilege** DBA accounts; application runtime accounts must not own schema changes.
- Audit who ran rollback DDL and link to **change / incident** ticket.

## Operational considerations

- **After restore:** Re-run DbUp from a clean baseline only if the **`SchemaVersions`** (or DbUp journal) table matches the restored DB; mismatches require **manual journal alignment** (expert-only).
- **028 archival columns example:** `ArchivedUtc` on **`dbo.Runs`**, **`dbo.ArchitectureDigests`**, **`dbo.ConversationThreads`** is nullable and additive. Reversing it is `ALTER TABLE ... DROP COLUMN ArchivedUtc` **only** if no app version depends on the column (coordinate blue/green).
- **Test environments:** Prefer **throwaway database** restore or recreate from **`ArchLucid.sql`** + migrations over editing production.

## Rolling deploy migrations

Operators and contributors use this section when a DbUp script is **not** safe for a rolling Container Apps deploy (old and new API pods share one catalog during the rollout). Not a substitute for migration authoring standards in [`SQL_SCRIPTS.md`](../library/SQL_SCRIPTS.md) or one-shot cutover playbooks.

### Safe patterns (expand / contract)

1. **Add nullable column** in migration N; backfill in N or N+1; enforce `NOT NULL` only after all pods write the column.
2. **CHECK / FK constraints** on legacy rows: add with `WITH NOCHECK`, backfill, then `WITH CHECK` in a later migration or coordinated cutover.
3. **Unique indexes:** add the new unique index **before** dropping the old one; deploy app code that stops creating duplicates **before** enforcing uniqueness.
4. **Data cleanup + UNIQUE:** never `DELETE` duplicates in the same script as `CREATE UNIQUE INDEX` unless all pods are stopped or the app cannot recreate duplicates.

### Deploy order checklist

| Change type | Migrate first | App first | Notes |
|-------------|---------------|-----------|-------|
| New nullable column | Either | Either | Old pods ignore column. |
| `NOT NULL` on existing column | After backfill + app writes | App that writes column | Old pods inserting NULL will fail. |
| `CREATE UNIQUE INDEX` after dedupe | After app stops creating dupes | App | See migration 223 pattern. |
| Drop unique index | After replacement index live | Either | Uniqueness gap during drop-only window. |

### Historical coordinated migrations

These shipped before CI lint existed; they require **coordinated** deploy (scale to one revision or accept brief failure window):

| Migration | Risk | Tag |
|-----------|------|-----|
| **116** | CHECK constraints reject legacy values | rolling-deploy: coordinated |
| **214** | CHECK constraints reject legacy values | rolling-deploy: coordinated |
| **215** `ScopeColumnsNotNull` | `ALTER NOT NULL` after backfill | rolling-deploy: coordinated |
| **216** | Drops old unique index before filtered replacement | rolling-deploy: coordinated |
| **223** `AgentExecutionTraces_RunTaskAgentType_Unique` | DELETE dupes + CREATE UNIQUE | rolling-deploy: coordinated |

Annotate new risky migrations in [`SQL_SCRIPTS.md`](../library/SQL_SCRIPTS.md) §4.2 with the same tag.

### CI guard (TB-068)

`scripts/ci/check_migration_rolling_deploy_patterns.py` scans **changed** forward migrations in a PR for:

- Bare `ALTER COLUMN … NOT NULL` without expand/contract pairing in the same PR
- `DELETE` before `CREATE UNIQUE`
- `DROP INDEX` before replacement `CREATE UNIQUE INDEX`

Historical scripts above are allow-listed. New violations fail CI unless explicitly allow-listed with a header comment justification.

## Paired rollback scripts (`Migrations/Rollback/`)

Forward schema changes ship via DbUp under `ArchLucid.Persistence/Migrations/`. **DbUp does not run rollback scripts automatically.**

**Greenfield baseline:** `Migrations/Baseline/000_Baseline_2026_04_17.sql` is a **one-shot** cumulative script for **empty** catalogs only (see [`SQL_SCRIPTS.md`](../library/SQL_SCRIPTS.md) §4.0). There is **no** paired `Rollback/R000_*.sql`; recovery for a failed baseline attempt is **restore from backup** or drop/recreate the database.

**Rollback scripts** live in `ArchLucid.Persistence/Migrations/Rollback/` as `RNNN_Description.sql`, paired with the forward script `NNN_Description.sql`. They are **operator-only**: run manually with `sqlcmd` or SSMS during a controlled recovery when a deployment must be reversed. See also [`sql/rollbacks/README.md`](../../sql/rollbacks/README.md).

**CI guard:** the **ten most recent** numbered forward migrations each require at least one matching `Rollback/RNNN_*.sql` file (`scripts/ci/assert_rollback_scripts_exist.py`). Older migrations may still carry paired rollbacks for manual recovery outside that window.

**Risk:** rollback scripts that `DROP TABLE` or `DROP COLUMN` **destroy data**. Use only with backups and an approved incident record.

## Cost / scalability / reliability

- **Cost:** PITR and long retention increase storage; balance against RPO/RTO in **`docs/runbooks/SLO_PROMETHEUS_GRAFANA.md`** themes.
- **Scalability:** Large tables: `DROP COLUMN` can be size-sensitive; plan maintenance windows.
- **Reliability:** Document **RPO** (how much data you accept to lose) before choosing restore vs forward fix.

## Related

| Doc | Use |
|-----|-----|
| [`SQL_SCRIPTS.md`](../library/SQL_SCRIPTS.md) | Schema change checklist and migration tagging |
| [`SQL_DDL_DISCIPLINE.md`](../library/SQL_DDL_DISCIPLINE.md) | DDL authoring discipline |
| [`PRODUCTION_DEPLOYMENT.md`](PRODUCTION_DEPLOYMENT.md) | Staging/production deploy verification |
| [`redirects.md`](../redirects.md) | Former doc paths |
