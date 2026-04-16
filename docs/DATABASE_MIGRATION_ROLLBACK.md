# Database migration rollback scripts

Forward schema changes ship via DbUp under `ArchLucid.Persistence/Migrations/`. **DbUp does not run rollback scripts.**

**Rollback scripts** live in `ArchLucid.Persistence/Migrations/Rollback/` as `RNNN_Description.sql`, paired with the forward script `NNN_Description.sql`. They are **operator-only**: run manually with `sqlcmd` or SSMS during a controlled recovery when a deployment must be reversed.

## Guard

CI enforces that the **ten most recent** numbered forward migrations each have at least one matching `Rollback/RNNN_*.sql` file (`scripts/ci/assert_rollback_scripts_exist.py`).

Older migrations (for example **055** audit-event indexes) may still carry a paired `R055_*.sql` rollback for manual recovery even when they are outside the “latest ten” CI window.

## Risk

Rollback scripts that `DROP TABLE` or `DROP COLUMN` **destroy data**. Use only with backups and an approved runbook.
