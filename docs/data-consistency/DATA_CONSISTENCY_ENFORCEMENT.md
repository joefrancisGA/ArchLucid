> **Scope:** Data consistency enforcement (orphan probes) - full detail, tables, and links in the sections below.

> **Spine doc:** [Five-document onboarding spine](../FIRST_5_DOCS.md). Read this file only if you have a specific reason beyond those five entry documents.


# Data consistency enforcement (orphan probes)

## Objective

Gradually escalate responses when coordinator rows reference **missing** `dbo.Runs` rows (orphans), without silently hiding drift in production.

## Assumptions

- **SQL** is the authority store (`ArchLucid:StorageProvider=Sql`).
- Probes run only when **`DataConsistency:OrphanProbeEnabled`** is **true** (default).

## Constraints

- **No edits** to historical numbered migrations **001–028**; new behavior uses **`099_DataConsistencyQuarantine.sql`**, follow-on DbUp scripts (**134**, **147** for authority-chain FK parity), and master DDL (`ArchLucid.sql`).
- **Tenant isolation:** quarantine inserts copy **`TenantId`** from **`dbo.GoldenManifests`** and **`dbo.FindingsSnapshots`** (unknown tenant id on legacy findings snapshots maps to the nil GUID — reconcile deliberately).
- **SMB / 445:** unchanged — no file-share exposure for remediation.

## Prevention vs detection (SQL authority chain)

**Detection (unchanged):** Orphan probes and reconciliation queries count rows in `dbo.GoldenManifests`, `dbo.FindingsSnapshots`, `dbo.ContextSnapshots`, `dbo.GraphSnapshots`, and (reconciliation only) `dbo.ArtifactBundles` whose `RunId` has no matching `dbo.Runs` row. Legacy rows remain visible; operators reconcile via existing runbooks and optional quarantine.

**Prevention (SQL path):** Foreign keys from the committed-run authority chain to `dbo.Runs` (`FK_*_Runs_RunId` and related chain FKs on manifests, snapshots, traces, artifact bundles) are defined in **`ArchLucid.Persistence/Scripts/ArchLucid.sql`** using **`ALTER TABLE … WITH NOCHECK ADD CONSTRAINT`** when the constraint is absent. That allows brownfield catalogs that already contain historical orphans to **install** constraints without a failing full-table validation pass, while **new** inserts and updates must still reference a real `dbo.Runs` row and the snapshot chain.

- **DbUp 134** (`134_FK_Authority_Chain_Runs_DbUpParity.sql`) still adds the same constraint **names** when the catalog has **no** rows that would violate them (trusted add where supported).
- **DbUp 147** (`147_AuthorityChain_RunForeignKeys_NotTrustedWhenMissing.sql`) adds **any constraints that remain missing** after 134—typically because legacy orphans blocked 134—using **`WITH NOCHECK`** so new orphan writes are rejected at the database.

RLS / tenant isolation predicates on child tables are unchanged; this work does not widen admin APIs.

## Architecture overview

**Nodes:** `DataConsistencyOrphanProbeHostedService` → `DataConsistencyOrphanProbeExecutor` → SQL (`DataConsistencyOrphanProbeSql`) + optional **`dbo.DataConsistencyQuarantine`**.

**Edges:** counts → **detection counter** → (mode) **alert counter** → (optional) **INSERT quarantine**.

## Component breakdown

| Component | Role |
|-----------|------|
| `DataConsistencyProbeOptions` | Interval, dry-run sample cap |
| `DataConsistencyEnforcementOptions` | `Mode`, `MaxRowsPerBatch`, `AlertThreshold` under **`DataConsistency:Enforcement`** |
| `archlucid_data_consistency_orphans_detected_total` | Raw orphan row detection |
| `archlucid_data_consistency_alerts_total` | Alert channel when mode **Alert** or **Quarantine** |
| `dbo.DataConsistencyQuarantine` | Idempotent staging rows for orphan **`dbo.GoldenManifests`** and **`dbo.FindingsSnapshots`** (**Quarantine** mode + **`AutoQuarantine`**) |

## Data flow

1. Scheduled probe executes count queries.
2. **Warn:** logs + detection counter (historical behaviour).
3. **Alert / Quarantine:** emit **`archlucid_data_consistency_alerts_total`** per table/column slice meeting threshold.
4. **Quarantine:** **`INSERT … SELECT TOP (@MaxRows)`** batches for orphan **`dbo.GoldenManifests`** and **`dbo.FindingsSnapshots`** (missing **`dbo.Runs`** parent), skipping rows already present in quarantine.

## Security model

Quarantine rows include **tenant id** from the orphaned golden manifest or findings snapshot (nil GUID when **`TenantId`** was never denormalized on findings snapshots). Operators must **not** treat quarantine as deletion — it is **evidence + staging** for humans. RBLS and session context apply to normal reads; quarantine is intended for **break-glass** ops (review `ReasonJson`).

## Operational considerations

- **Staging:** `Mode=Alert` — page on `archlucid_data_consistency_alerts_total`.
- **Production:** `Mode=Quarantine` only after runbook sign-off; reconcile rows with **`AdminDiagnosticsService`** remediation endpoints where applicable.
- **Dashboard:** committed Grafana JSON **`infra/grafana/dashboard-archlucid-authority.json`** includes the **`archlucid_data_consistency_*_total`** time series (orphans, alerts, quarantine) on the data consistency panel; Prometheus rules in **`infra/prometheus/archlucid-alerts.yml`**.
- Operator quick-reference: [../runbooks/DATA_CONSISTENCY_ENFORCEMENT.md](../runbooks/DATA_CONSISTENCY_ENFORCEMENT.md).
- See also [../OBSERVABILITY.md](../library/OBSERVABILITY.md) for metric names.
