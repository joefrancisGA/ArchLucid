# GDPR erasure vs append-only / sealed evidence — plane map

**Audience:** Engineering, privacy counsel, principal-architect diligence. Not a buyer brochure.

**Status:** Working contract for **TB-1470** / GTM **M-265**. Pair honesty CI **TB-1471** / **M-265**.

**Verdict (one line):** Append-only sealed evidence and “we delete your data” are **not contradictory** when scoped correctly — **sealed during tenant life** (app principal cannot UPDATE/DELETE) vs **lifecycle hard purge after admin-approved erasure**. They **are** contradictory if either claim is absolute (“immutable forever” or “every copy including Search/backups/telemetry gone on day one”).

---

## 1. Two different requests (do not fuse)

| Request | Typical path | Audit / sealed rows |
|--------|--------------|---------------------|
| **Per-user GDPR Art. 17** (subject erasure) | [`DSAR_PROCESS.md`](../security/DSAR_PROCESS.md) — often **pseudonymize** actor fields under break-glass `dbo`; app `DENY` blocks DELETE on `AuditEvents` | Prefer Art. 17(3) retention / pseudonymization over row delete |
| **Tenant offboard / full deletion** | Quarantine → Admin `TenantErasureApprovedUtc` → `TenantDeletionService.DeleteTenantAsync` | Hard purge **does** DELETE tenant-scoped `AuditEvents` when `DeleteTenantScopedAuditEvents = true` |

Fully **automated** quarantine→purge product pipeline remains **V2** ([`V1_DEFERRED.md`](V1_DEFERRED.md) §6m). V1 still has operator/trial hard purge — do not claim “no deletion capability.”

---

## 2. What hard purge actually touches today

Orchestration: `TenantDeletionService` → (1) blob prefixes → (2) `ITenantHardPurgeService` → (3) platform audit `TenantDataDeleted` (counts JSON; **survives** tenant SQL purge).

| Plane | Deleted on admin-approved hard purge? | Notes |
|-------|----------------------------------------|-------|
| **SQL — runs / manifests / snapshots / agent tasks** | **Yes** | Including `GoldenManifests`, artifact bundles, runs, comparison records (`SqlTenantHardPurgeService`) |
| **SQL — allowlisted tenant-scoped tables** | **Yes** | Billing, alerts, advisory schedules, policy packs, usage, etc. (frozen allowlist) |
| **SQL — `AuditEvents` (tenant-scoped)** | **Yes** (offboarding flag) | App-role `DENY UPDATE/DELETE` does **not** apply to elevated/lifecycle purge principal |
| **SQL — `Tenants` / projects / workspaces** | **Yes** | After dependents |
| **Blob — tenant prefixes** | **Yes** | `golden-manifests`, `artifact-bundles`, `agent-traces` under tenant segment |
| **Blob — content-addressed `artifact-contents`** | **No** (by design) | Shared dedup container; skipped so other tenants’ hashes stay |
| **Platform audit** | **No** | `TenantDataDeleted` (+ metadata) remains for controller accountability |
| **Azure AI Search index** | **Not in purge orchestration** | Client has scoped `RemoveChunksForDocumentAsync` only; **no** tenant-wide delete step in `TenantDeletionService` — residual risk until closed |
| **Backups / PITR / geo-replicas** | **No (immediate)** | Expire per retention; DPA ~90-day delete window after termination except legal hold / backups |
| **App Insights / AOAI provider logs / subprocessors** | **No (product purge)** | Disclose; subprocessors register + DPA |

“Committed / sealed golden manifests” means **immutable while the tenant is live**, not **eternal retention after offboard**. Hard purge deletes those SQL rows and tenant-prefixed blobs.

---

## 3. Claim-safe wording

| Too strong | Safe pin |
|------------|----------|
| “Append-only forever — nothing can ever be deleted” | “Sealed evidence and audit are append-only for the **application** principal during tenant life; lifecycle hard purge is a separate elevated path after Admin approval.” |
| “We delete all your data everywhere instantly” | “After Admin-approved erasure we purge tenant SQL rows (incl. golden manifests + tenant audit), tenant blob prefixes, and record a platform deletion receipt; Search/backup/telemetry residual windows are disclosed.” |
| “GDPR Art. 17 always hard-deletes audit” | “Per-user Art. 17 often **pseudonymizes** audit actors; tenant offboard may hard-delete tenant-scoped audit under the erasure policy.” |
| “V1 has no erasure” | “V1 has operator/trial hard purge; **fully automated** quarantine pipeline is V2 (§6m).” |

---

## 4. Related owners (orchestrate, do not reopen Done)

| ID | Role |
|----|------|
| **TB-1009** / **TB-1010** / **M-160** / **M-161** | Append-only / sealed inventory + honesty CI |
| **TB-506** | Retention/deletion copy on security-trust |
| **TB-1180** | Project recycle retention transparency |
| Done **TB-303** / ADR 0039+ | App DENY on sealed tables |
| Done **TB-071** | Search tenant filter on query/delete (not tenant hard purge) |
| `DSAR_PROCESS.md`, `DPA_TEMPLATE.md`, trust-center DSAR link | Buyer/operator process |

---

## 5. Engineering follow-ons implied by this map

1. **Document** Search residual (this file) until a tenant-scoped Search purge is wired into `TenantDeletionService` (or explicitly deferred with buyer-visible honesty).
2. **Honesty CI** — fail “append-only forever” and “complete erasure including Search/backups” without caveats (**TB-1471**).
3. Keep **per-user DSAR** vs **tenant hard purge** language separate in trust center and PA one-pager (**M-266**).
