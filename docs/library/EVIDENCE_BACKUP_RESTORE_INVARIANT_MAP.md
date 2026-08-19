> **Scope:** Contributor-reference claim map for engineering and principal-architect diligence; not a buyer brochure.

# Evidence backup/restore vs append-only / commit invariants

**Audience:** Engineering, SRE, principal-architect diligence. Not a buyer brochure.

**Status:** **Done** (**TB-1490**, 2026-08-10). GTM **M-269** / **M-270**. Pair honesty CI **TB-1491** / **M-269**.

**Buyer / PA one-pager:** [`BUYER_SECURITY_PROCUREMENT_PACKET.md#evidence-backup-restore-invariant-m-270`](../go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md#evidence-backup-restore-invariant-m-270) (GTM **M-270**).  
**Claim honesty:** [`PUBLIC_CLAIM_BOUNDARY_GUIDE.md#gtm-do-not-promise`](PUBLIC_CLAIM_BOUNDARY_GUIDE.md#gtm-do-not-promise) (GTM **M-269**).

**Verdict (one line):** Backup/restore is **Azure SQL (PITR/LTR/geo) + separate blob durability**, not an app “evidence restore” product; a restore can preserve **point-in-time** sealed consistency while still looking identical to a **dbo-level rewrite** unless you keep **external** anchors (export ZIPs / out-of-band receipts). Restored ≠ cryptographically labeled “restore event.”

---

## 1. What the backup/restore design actually is

| Layer | Mechanism | Authoritative docs | Code / ops anchor |
|-------|-----------|-------------------|-------------------|
| **SQL (evidence + audit + manifests)** | Azure SQL automated backups, **PITR** to a new DB (drill), optional **LTR**, **geo-failover** / auto-failover group | [`BACKUP_RESTORE_DRILL.md`](../runbooks/BACKUP_RESTORE_DRILL.md), [`DATABASE_FAILOVER.md`](../runbooks/DATABASE_FAILOVER.md), [`RTO_RPO_TARGETS.md`](RTO_RPO_TARGETS.md) | Azure platform; per-tenant catalog restore in [`TENANT_SQL_TOPOLOGY_RUNBOOK.md`](../operations/TENANT_SQL_TOPOLOGY_RUNBOOK.md) |
| **Per-tenant catalogs** | Restore **that** tenant catalog; re-run tenant DbUp; verify binding Active | [`TENANT_SQL_TOPOLOGY_RUNBOOK.md`](../operations/TENANT_SQL_TOPOLOGY_RUNBOOK.md) | Tenant DbUp on startup |
| **Blob (artifacts / traces)** | Storage redundancy / GRS + lifecycle (e.g. `agent-traces`); **not** the same PITR clock as SQL | Drill § artifact blob lifecycle; [`RTO_RPO_TARGETS.md`](RTO_RPO_TARGETS.md) | Azure Storage; separate continuity clock |
| **App principal seals** | `DENY UPDATE/DELETE` on sealed tables for `[ArchLucidApp]` (Done **TB-303** / ADR 0039) | [`EVIDENCE_IMMUTABILITY.md`](EVIDENCE_IMMUTABILITY.md) | `SqlSealedEvidenceImmutabilityRules`, migrations `247_*` / `259_*` |
| **Hash lineage (external anchor)** | `ManifestHash` + export verify (Done **TB-307** / ADR 0040) — detects divergence **if** external export anchors exist | ADR 0040; [`OFFLINE_VERIFIABLE_EXPORT_PORTABILITY.md`](OFFLINE_VERIFIABLE_EXPORT_PORTABILITY.md) | `RunExportLineageVerifier`, `GET …/export/verify` |

There is **no** first-class in-product “restore evidence store” API that re-validates append-only or emits a buyer-visible restore attestation.

---

## 2. Does restore silently violate append-only / manifest-commit invariants?

| Question | Answer |
|----------|--------|
| Does PITR go through `UPDATE`/`DELETE` as `ArchLucidApp`? | **No** — Azure replaces the database (or catalog) with a prior image. App DENY is irrelevant to the restore operator. |
| Is the restored DB internally consistent at time *T*? | **Yes, for SQL** — sealed rows, DENYs, and commit anchors as they existed at *T* (assuming restore completed cleanly). |
| Does restore preserve “append-only across wall-clock forever”? | **No** — later appends after *T* disappear. That is intentional DR time-travel, not an app mutation path. |
| Can SQL↔blob skew break evidence pointers? | **Yes (residual)** — SQL PITR to *T* while blobs advanced (or lifecycle-deleted) can leave missing/orphan artifact bytes. Drill checks SQL row counts and blob lifecycle separately; no fused evidence-store consistency gate. |
| Can restore undo hard purge / GDPR? | **Yes within backup retention** — already disclosed in [`GDPR_ERASURE_VS_APPEND_ONLY_MAP.md`](GDPR_ERASURE_VS_APPEND_ONLY_MAP.md). |

**Safe pin:** Restore preserves **point-in-time commit-sealed consistency**; it is **not** a silent in-place edit via the app. It **does** rewrite history relative to the pre-restore live tip — treat as a **controlled discontinuity**, not as continuous append-only.

---

## 3. Is a restored tenant distinguishable from a tampered one?

| Signal | Distinguishes restore vs hostile rewrite? |
|--------|-------------------------------------------|
| SQL row contents alone after overwrite | **No** — both can yield a “valid looking” sealed past |
| App DENY still present after restore | **No** — both honest restore and crafted dump can include DENY |
| Live `/export/verify` after restore | Matches **restored** SQL vs **restored** audit — does **not** prove continuity with pre-restore tip |
| **Externally retained** export ZIP + `export-manifest.json` / verify receipt from before the event | **Yes** — mismatch ⇒ tamper or wrong restore point (ADR 0040) |
| Platform / Azure activity logs (PITR job, who restored) | **Ops attribution** — not embedded in tenant evidence tables today |
| Cryptographic “this DB was restored at UTC…” row in tenant audit | **Not shipped** |

ADR 0040 already states: a malicious `dbo` can alter SQL despite app DENY; hash lineage detects **after the fact** only if exports were taken. **Restore without external anchors is observationally equivalent to a full catalog rewrite to an older (or adversary-chosen) consistent state.**

---

## 4. Claim-safe wording

| Too strong | Safe |
|------------|------|
| “Append-only means backups can’t change history” | Append-only binds the **app principal** during tenant life; DR restore is a separate elevated discontinuity |
| “Restored tenants are cryptographically labeled vs tampered” | Distinguish via **external** export anchors + Azure/ops audit — not via SQL state alone |
| “We restore evidence with blob-perfect PITR” | SQL and blob have **separate** continuity clocks; skew is a residual |
| “PITR proves manifests weren’t tampered” | PITR proves recoverability to *T*; tamper detection needs **pre-event** external hashes |

---

## 5. Related owners (orchestrate, do not reopen Done)

| ID / doc | Role |
|----------|------|
| Done **TB-303** / ADR 0039 | App DENY seals |
| Done **TB-307** / ADR 0040 | Export hash lineage (external anchor) |
| Done **TB-310** / **TB-311** | Run-header seal + FK repoint detection |
| **TB-1009** / **M-160** | Append-only inventory |
| Done **TB-1488** / **M-267** | Offline export portability (external anchors) |
| **TB-1470** / **M-265** | Backups survive hard purge |
| `BACKUP_RESTORE_DRILL.md`, `RTO_RPO_TARGETS.md` | Ops drill / RPO |

---

## 6. Engineering follow-ons (optional)

1. Extend PITR drill: after restore-to-new-DB, run sealed-evidence startup probes + sample `/export/verify` + note SQL/blob skew.
2. Platform audit / runbook step: record restore operator, target time, catalog name (ops attribution).
3. Do **not** claim in-tenant “RestoreAttested” rows unless productized — honesty CI forbids “restored ≠ tampered by SQL alone.”

## CI anchors for **TB-1491**

| Anchor | Role |
| --- | --- |
| `scripts/ci/check_evidence_backup_restore_honesty.py` | Fail PITR-continuous-append / SQL-alone-restore-proof / perfect-fused-PITR overclaims |
| `ArchLucid.Host.Core/Startup/Validation/Rules/SqlSealedEvidenceImmutabilityRules.cs` | App-principal sealed evidence anchor |
| `ArchLucid.Application/Analysis/RunExportLineageVerifier.cs` | External export anchor for post-restore comparison |

Honesty CI shipped: **TB-1491**.

---

## 7. Code entry points (verification)

| Concern | Primary file |
|---------|--------------|
| Startup sealed-evidence DENY validation | `ArchLucid.Host.Core/Startup/Validation/Rules/SqlSealedEvidenceImmutabilityRules.cs` |
| Startup committed-run-header DENY validation | `ArchLucid.Host.Core/Startup/Validation/Rules/SqlCommittedRunHeaderImmutabilityRules.cs` |
| Host wiring (validate on startup) | `ArchLucid.Host.Core/Startup/ArchLucidPersistenceStartup.cs` |
| Committed header anchor guard (runtime) | `ArchLucid.Core/Persistence/CommittedRunHeaderAnchorGuard.cs` |
| Export lineage verify (external anchor) | `ArchLucid.Application/Analysis/RunExportLineageVerifier.cs` |
| Sealed table registry | `ArchLucid.Core/Persistence/SealedEvidenceTableRegistry.cs` |
| SQL migrations (DENY triggers) | `ArchLucid.Persistence/Migrations/247_CommitSealedEvidenceImmutability.sql`, `259_SealCommittedRunHeader.sql` |
