> **Scope:** Contributor-reference claim map for engineering and principal-architect diligence; not a buyer brochure.

# Zero-downtime SQL migration model (DDL executor / identity / rolling code×schema)

**Audience:** Engineering, security reviewers, principal-architect diligence. Not a buyer brochure.

**Status:** **Done** (**TB-1557**, 2026-08-10). GTM **M-286** / **M-287**. Pair honesty CI **TB-1558** / **M-286**.

**Buyer / PA one-pager:** [`BUYER_SECURITY_PROCUREMENT_PACKET.md#zero-downtime-sql-migration-m-287`](../go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md#zero-downtime-sql-migration-m-287) (GTM **M-287**).  
**Claim honesty:** [`PUBLIC_CLAIM_BOUNDARY_GUIDE.md#gtm-do-not-promise`](PUBLIC_CLAIM_BOUNDARY_GUIDE.md#gtm-do-not-promise) (GTM **M-286**).

**Verdict (one line):** Production brownfield DDL is **DbUp on API/Worker (and Jobs.Cli) process startup** — **not** a separate CD/SQL migrator job; consolidated `ArchLucid.sql` / `ArchLucid.System.sql` are the **single-file reference + bootstrap** per logical DB. Zero-downtime is an **expand/contract discipline + CI lint**, not automatic. SQL identity today is still **bootstrap/`db_owner`-equivalent on the API managed identity** unless operators opt into an unwired runtime split.

---

## 1. Single-file DDL vs what production applies

| Plane | Consolidated file | Brownfield upgrades |
|-------|-------------------|---------------------|
| Tenant / product | `ArchLucid.Persistence/Scripts/ArchLucid.sql` | `Migrations/NNN_*.sql` via DbUp |
| System / control | `ArchLucid.Persistence/Scripts/ArchLucid.System.sql` | `Migrations/System/*.sql` via DbUp |
| IaC snapshot | `ArchLucid_Unified_Schema.sql` (generated) | Not applied by DbUp |

**Order:** DbUp first → then `SqlSchemaBootstrapper` (idempotent IF NOT EXISTS). Greenfield may baseline-stamp early scripts then DbUp **051+**.

**Safe pin:** One consolidated DDL file **per logical database** (CI **TB-359**); production evolves via **ordered DbUp scripts** that must stay mirrored into the consolidated file — not “only the mega-file is applied.”

---

## 2. Who executes DDL (and with what identity)

| Actor | Role |
|-------|------|
| **API / Worker / Jobs.Cli startup** | `ArchLucidPersistenceStartup` → `DatabaseMigrator` (DbUp) → `SqlSchemaBootstrapper` |
| Tenant provision / warm pool | `SqlTenantSqlCatalogProvisioner` / warm-pool when upgrade required |
| CI verify | `ArchLucid.Persistence.MigrateVerify` (+ sentinel drift) |
| GitHub Actions / Azure Pipeline / Terraform | Deploy images/infra — **do not** apply schema |

| Identity | Reality |
|----------|---------|
| Intended query role | Database role `[ArchLucidApp]` (least-privilege DML + DENYs) |
| Default production bootstrap | API **system-assigned MI** treated as **`db_owner`-equivalent** for schema |
| Optional split | `enable_api_sql_runtime_identity` + `ConnectionStrings:ArchLucidRuntime` — **not app-wired by default** (see **TB-1244**) |

---

## 3. Machines (old code × new schema)

| Machine | Behavior |
|---------|----------|
| **A — Expand (nullable / new table)** | Old pods ignore new objects; safe mid-roll |
| **B — Contract too early** (`NOT NULL` / CHECK / UNIQUE) | Old writers fail until scaled off — **coordinated** |
| **C — New revision starts** | That process runs DbUp before readiness; schema advances while old revisions still traffic |
| **D — Migration failure** | New revision fails ready (unless break-glass degraded-startup) |
| **E — App rollback after non-additive DDL** | CD schema gate **blocks** automatic revision rollback; DB rollback = PITR / forward-fix |

There is **no** “migration job completes before any pod starts” gate in the default CD path.

---

## 4. Too-strong vs safe

| Too strong | Safe |
|------------|------|
| “Single SQL file is the only production schema mechanism” | Consolidated reference + DbUp deltas |
| “Migrations run in a separate least-privilege CD/SQL job” | In-process DbUp on API/Worker startup |
| “Production API SQL is least-privilege / non-db_owner” | Only if runtime UAMI split is **on and wired** |
| “Rolling deploys are always zero-downtime for schema” | Expand/contract required; some migrations coordinated |
| “DbUp has automatic down migrations” | Forward-only; PITR / forward-fix / manual Rollback scripts |
| “Old pods always safe after migrate” | False for NOT NULL / CHECK / UNIQUE patterns |
| “Terraform applies schema” | Explicitly false |

---

## 5. Related owners

| ID | Role |
|----|------|
| Done **TB-064**–**TB-070**, **TB-359** | DDL hygiene, rolling lint, single-file CI |
| Open **TB-1244** / **M-215** | Bootstrap MI co-located PE seam — [`AZURE_WORKLOAD_PRIVILEGE_ESCALATION_SEAM_CONTRACT.md`](AZURE_WORKLOAD_PRIVILEGE_ESCALATION_SEAM_CONTRACT.md); identity split affects “least-privilege SQL” claims |
| Open **TB-903** | Broader CA production posture (not DDL executor) |
| [`MIGRATION_ROLLBACK.md`](../runbooks/MIGRATION_ROLLBACK.md) § Rolling deploy | Expand/contract + coordinated list |
| `check_migration_rolling_deploy_patterns.py` | Done **TB-068** CI lint |
| Done **TB-1557** / **M-286** | This migration-model claim map |
| Open **TB-1558** / **M-286** | Honesty CI follow-on |

---

## 6. Optional follow-ons (not required to close honesty pin)

1. Wire `ArchLucidRuntime` + turn on runtime UAMI split in prod (owns with **TB-1244**).  
2. Optional dedicated migrator job before traffic (product/ops gap — do not sell as shipped).  
3. Keep expanding rolling-deploy lint allow-list comments on coordinated scripts.
