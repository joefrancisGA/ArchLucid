> **Scope:** Contributor-reference claim map for engineering and principal-architect diligence; not a buyer brochure.

# Project recycle bin vs sealed evidence — residue map

**Audience:** Engineering, privacy/procurement, principal-architect diligence. Not a buyer brochure.

**Status:** Working contract for **TB-1497** / GTM **M-271**. Pair honesty CI **TB-1498** / **M-271**.

**Verdict (one line):** Soft-delete + retention purge removes the **`dbo.Projects` row** (and emits audit events); it does **not** cascade into sealed runs, golden manifests, artifact blobs, or historical audit — those remain as **permanent residue** keyed by `ProjectId` unless a separate tenant hard purge / future cascade ships.

---

## 1. Lifecycle (shipped)

| Stage | What happens | Code / config |
|-------|--------------|---------------|
| **Soft delete** | `Projects.IsDeleted = 1`, `DeletedUtc` set; workspace default project blocked | `TrySoftDeleteAsync`; `DELETE /v1/tenant/workspaces/{ws}/projects/{id}` |
| **Audit (soft)** | Append `ArchitectureProjectSoftDeleted` | `TenantWorkspacesController` |
| **Recycle bin** | Lists soft-deleted projects; restore clears `IsDeleted` / `DeletedUtc` (name conflict → 409) | `ListSoftDeletedByTenantAsync` / restore endpoint |
| **Hard purge** | After `ArchitectureProjectRetention:RetentionDays` (default **30**), `DELETE FROM dbo.Projects` where soft-deleted and not workspace default | `SqlArchitectureProjectRetentionPurgeService` |
| **Audit (hard)** | Append `ArchitectureProjectHardPurgedRetention` (system actor) | `ArchitectureProjectRetentionPurgeBackgroundWork` |

UI affordance / retention transparency gaps remain open (**TB-1179**–**TB-1182**, **TB-1289**–**TB-1291**) — this map is **semantics**, not UX.

---

## 2. Does purge cascade into audit and evidence?

| Plane | Soft delete | Retention hard purge |
|-------|-------------|----------------------|
| **`dbo.Projects` row** | Hidden (soft) | **Deleted** |
| **`dbo.Runs` / snapshots / golden manifests / agent results** (sealed) | **Unchanged** | **Unchanged** — no cascade DELETE |
| **Artifact blobs** (tenant-prefixed) | **Unchanged** | **Unchanged** |
| **AI Search chunks** | **Unchanged** | **Unchanged** |
| **Historical `AuditEvents`** (incl. soft-delete event) | Soft-delete **adds** a row | Hard purge **adds** a row; prior events **kept** (append-only for app; not purged by project retention) |
| **Tenant hard purge** (`TenantDeletionService`) | N/A | Separate path — deletes tenant-scoped evidence/audit when offboarding (see [`GDPR_ERASURE_VS_APPEND_ONLY_MAP.md`](GDPR_ERASURE_VS_APPEND_ONLY_MAP.md)) |

Sealed-evidence DENY (Done **TB-303**) means the recycle-bin worker **must not** UPDATE sealed rows; today’s purge also **does not** DELETE them. Result: **orphan evidence** still scoped by tenant/workspace/`ProjectId` GUID after the project catalog row is gone.

---

## 3. What a buyer should know (safe pin)

> Moving a project to the recycle bin hides it from active project lists for a configured retention window (default 30 days). When retention expires, ArchLucid permanently removes the **project record**. **Committed architecture packages, runs, sealed evidence, and audit history for that project are not erased by project purge** — they remain in the tenant until a broader tenant offboarding/hard-purge (or a future explicit evidence-cascade product, if ever shipped). Soft-delete and hard-purge themselves are recorded as append-only audit events.

---

## 4. Too-strong vs safe

| Too strong | Safe |
|------------|------|
| “Delete project deletes all its evidence” | Deletes/hides the project row; evidence residue remains |
| “Recycle bin purge = GDPR erasure for that project’s runs” | Project retention ≠ tenant erasure; Art. 17 / offboard are separate |
| “After purge, no trace of the project” | Audit events + sealed runs with that `ProjectId` remain |
| “Soft delete violates append-only” | Soft delete mutates **mutable** `Projects` flags; sealed tables are not rewritten |

---

## 5. Related owners (orchestrate, do not replace)

| ID | Role |
|----|------|
| **TB-1179**–**TB-1182**, **TB-1289**–**TB-1291** | Delete UI, retention transparency, discoverability, polish |
| **TB-1180** | Must not imply purge erases evidence when exposing purge dates |
| **TB-1009** / **M-160** | Append-only / sealed inventory |
| **TB-1470** / **M-265** | Tenant erasure vs sealed |
| Done **TB-303** | App DENY on sealed evidence |

---

## 6. Engineering follow-ons (optional)

1. Buyer/help copy on recycle bin: “Project record only — packages remain until tenant offboard.”
2. Admin dry-run / counts: runs+manifests still keyed to purged `ProjectId` (orphan inventory).
3. Explicit product decision later: evidence cascade on project purge (high risk vs seals) — **not** implied by V1 recycle bin.
