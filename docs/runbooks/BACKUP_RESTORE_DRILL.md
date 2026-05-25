> **Scope:** Operators and SRE running scheduled PITR, LTR, and geo-failover drills to validate documented RTO/RPO — not live incident recovery or day-to-day Azure SQL administration.

# Runbook: Backup Restore and Geo-Failover Drill

**Frequency:** At minimum annually; also run after any Terraform SQL infrastructure change.

## Objectives

- Validate that PITR restores succeed within the documented RTO window.
- Validate that geo-failover completes and the application passes health checks.
- Record actual RTO/RPO achieved for [`RTO_RPO_TARGETS.md`](../RTO_RPO_TARGETS.md) review.

## Pre-drill checklist

- [ ] Confirm `terraform-sql-failover` is applied with `enable_sql_failover_group = true`.
- [ ] Confirm `ConnectionStrings:ArchLucid` uses the failover group listener FQDN.
- [ ] Confirm `backup_storage_redundancy = "Geo"` on the database resource.
- [ ] Confirm LTR policy is active (Azure Portal → DB → Manage backups → Long-term retention).
- [ ] When artifact blob offload is enabled, confirm **`terraform-storage`** lifecycle on **`agent-traces/`** (Portal → storage account → Lifecycle management) matches **`agent_trace_blob_*`** variables from the applied tfvars.
- [ ] Notify on-call and relevant stakeholders of drill window.
- [ ] Confirm you have Key Vault write access for connection string rotation if required.

## PITR restore test (non-destructive — restores to a NEW database)

1. In Azure Portal or Azure CLI, initiate a point-in-time restore to a target time 1 hour ago:

   ```bash
   az sql db restore --resource-group <rg> --server <server> --name ArchLucid \
     --dest-name ArchLucid-PitrTest --time "<ISO-8601 target time>"
   ```

2. Confirm the restore database reaches Online status. Record elapsed time.
3. Smoke: connect to the restored database (read-only) and verify row counts on `dbo.Runs`.
4. Delete `ArchLucid-PitrTest` after validation.

## Geo-failover drill (destructive to region; coordinate with SRE)

1. Confirm secondary region database is in sync (Azure Portal → DB → Replicas → replication lag under 5s).
2. Initiate forced failover:

   ```bash
   az sql failover-group set-primary --name archlucid-prod-sqlfg \
     --resource-group <rg> --server <primary-server>
   ```

3. Record time-to-failover-complete (listener FQDN DNS update).
4. Run smoke tests via [`docs/library/LIVE_E2E_HAPPY_PATH.md`](../library/LIVE_E2E_HAPPY_PATH.md) against production endpoint.
5. Confirm API `/health/ready` is Healthy within target RTO (60 minutes from drill start).
6. Record actual RTO and RPO (replication lag at time of failover) in [`RTO_RPO_TARGETS.md`](../RTO_RPO_TARGETS.md).
7. Fail back to original primary when confirmed healthy.

## LTR restore test (verify a monthly snapshot exists and is restorable)

1. In Azure Portal → DB → Manage backups → Long-term retention, confirm at least one monthly backup exists.
2. Initiate a test restore to a new database from the most recent LTR backup.
3. Confirm restore completes successfully. Record elapsed time.
4. Delete the test database.

## Artifact blob lifecycle verification (non-destructive)

When **`ArtifactLargePayload:BlobProvider=AzureBlob`** is enabled in the deployed environment:

1. Azure Portal → artifacts storage account → **Lifecycle management** → confirm rule **`agent-traces-tier-and-expire`** (or equivalent) is **Enabled**.
2. Compare **Cool tier after** and **Delete after** days to the applied **`infra/terraform-storage`** tfvars (`production.tfvars.example`: 30 / 365; `staging.tfvars.example`: 7 / 90).
3. Confirm **`agent-traces`** container exists and **`AgentResultBlobCleanupHostedService`** remains enabled in app config when orphan hygiene is required (`DataArchival:BlobCleanup:Enabled`).

## Post-drill: update RTO_RPO_TARGETS.md

- Record actual RTO achieved (vs target under 1 hour).
- Record replication lag at failover time (vs target RPO under 5 minutes).
- Update the "Last reviewed" date in [`RTO_RPO_TARGETS.md`](../RTO_RPO_TARGETS.md).
