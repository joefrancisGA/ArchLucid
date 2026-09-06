> **Scope:** ADR 0074 — customer-visible durable architecture identity (wave 14 / CA-01).

> **Spine doc:** [`START_HERE.md`](../../START_HERE.md).

# ADR 0074: Customer-visible durable architecture identity

- **Status:** Proposed
- **Date:** 2026-09-06

## Context

Migration **323** introduced `dbo.Architectures` as a tenant-scoped recurrence anchor with `ArchitectureId` on reviews and a version lattice (migration **339**). ADR **0068** keeps synthesis (`DraftRequests`) and review execute (`Runs`/`Reviews`) as **two kernels** with separate SQL tables. ADR **0069** stopped two peer **start** products on Working. ADR **0072** made the **review URL canonical after spawn** without merging tables.

The paying desk still treats **draft rows** as architectures (`architectureId` = `DraftId` in the SPA). There is no named, listable customer object — only GUID anchors created as a side effect of Created-origin runs. The July 2026 object-model assessment concluded there was no customer `ArchitectureId`; that assessment is **stale** relative to migration 323.

A working architect's livelihood object is the **system they own**, not the last pipeline execution or the latest draft row.

**Related:** ADR 0068 (kernels), ADR 0069 (Working one start), ADR 0072 (canonical review URL after spawn), ADR 0071 (draft document undo), ADR 0039 (sealed immutability), migration 323/339.

## Decision

1. **`dbo.Architectures` is the customer-visible durable identity** — a named, tenant-scoped, mutable **anchor**. It is **not** a third kernel, not a sealed record, not a draft document, and not a review.
2. **`DraftRequests` reference the identity** via `ArchitectureId` (FK). Drafts remain unsealed working documents; ADR 0071 undo applies here.
3. **`Runs`/`Reviews` reference the identity** via existing `ArchitectureId`. Reviews remain governed evaluation jobs; ADR 0072 still owns the canonical URL **while that review is the open governed job**.
4. **Sealed review records** (`GoldenManifests`) remain immutable (ADR 0039). Many seals may hang off one architecture via `LatestSealedManifestId` and the version lattice.
5. **Display name is required** on identity create (default `Untitled architecture` only for legacy backfill). Identity is ensured **on or before first successful draft persist** (CA-14), not only on Created-origin runs.
6. **Child pointers are computed**, not stored on `Architectures` except `LatestSealedManifestId` (CA-05). No `CurrentDraftId` column.
7. **Working noun "Architecture"** means `ArchitectureId`. The Working hub lists identities, not relabeled drafts. Guided may still list drafts as teaching (ADR 0067).
8. **No per-architecture ACL in V1.** Tenant/workspace/project scope (ADR 0037) unchanged.

**Rejected:** Option L (merge draft + review tables); "architecture = latest draft row"; relabeling the draft inventory as Architectures; live presence avatars; hard-delete portfolio retirement (soft-archive only, CA-49).

## Trade-offs

**Gains:** A Monday-morning object architects can name, list, open, and resume; honest URLs (`ArchitectureId` ≠ `DraftId`); portfolio scans without GUID archaeology; recurrence and compare scoped to one career object.

**Sacrifices:** Additional HTTP surface (`GET /v1/architectures`, get-by-id, PATCH name); migration + backfill work for legacy null FKs; route split (identity desk vs draft editor) and bookmark redirects; identity display name can diverge from draft `systemName` (intentional — identity owns the career name).

**Rejected alternatives:** Denormalizing `CurrentDraftId` (stale under multi-tab save); making draft list the architecture portfolio (object-model lie); delaying identity until first review run (too late for all-day draft work).

## Constraints

- Do **not** rewrite ADR 0068, 0069, 0071, 0072, or 0073 bodies — Related pointers only.
- Do **not** merge `DraftRequests` and `Runs`/`Reviews`.
- Do **not** put sealed manifest bytes or `DocumentJson` on `dbo.Architectures`.
- Desktop review workspace tabs stay a full strip (no **More** menu).
- Tenant isolation (ADR 0037); no SQL RLS.
- BFF / HttpOnly session (ADR 0059 / LK-05–07) remains out of scope for this ADR.
- No 40th coverage engine; no fake frontier transcripts.

## Expected impact

**System:** New columns (`DisplayName`, `DraftRequests.ArchitectureId`); list/get/PATCH HTTP; Working hub and identity desk; autosave returns both `architectureId` and `draftId`; spawn still copies parent `ArchitectureId` to the review run.

**Security:** Same read/write RBAC as draft inventory; scope miss returns empty/null — never cross-tenant names. Identity rows hold no sealed bytes.

**Operations:** Numbered migrations 366+; conservative backfill (CA-18); OpenAPI snapshot update; acceptance grep audit (CA-50).

**Teams:** Reviewers quote 0074 to refuse "just rename the drafts list to Architectures" and to require a named identity before or at first draft save.

## Consequences

- **Positive:** Closes the livelihood unit-of-work gap without violating ADR 0068 kernel separation.
- **Negative:** URL migration for bookmarks that used draft ids as architecture routes (CA-21 redirect); Guided/Working divergence in hub inventory must stay explicit.
- **Follow-ups:** CA-02–50 implementation; optional ADR status → Accepted when schema + HTTP land; soft-archive (CA-49); global search + CLI (CA-42–43).
