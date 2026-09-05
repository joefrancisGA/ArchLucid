> **Scope:** ADR 0074 — Customer-visible durable architecture identity (`dbo.Architectures`).

> **Spine doc:** [`START_HERE.md`](../../START_HERE.md).

# ADR 0074: Customer-visible durable architecture identity

- **Status:** Accepted
- **Date:** 2026-09-05

## Context

ArchLucid sells a **Working seat** for repeat professionals (ADR 0052 / R13). Their livelihood object is the **system they own** — a named architecture they reopen across days — not the last pipeline execution or the latest draft row.

Persistence already has `dbo.Architectures` (migration 323), `ArchitectureId` on reviews, and `ArchitectureVersions`. `ArchitectureIdentityService` links Created-origin and re-review runs. The product still treats **draft ids** as `architectureId` in the SPA, lists drafts under `/architecture/architectures`, creates identity only when a Created-origin **run** appears, and stores no customer display name on the identity row.

The July 2026 `architecture_review_object_model_assessment.md` concluded there was no customer `ArchitectureId` and advised against an Architectures destination. That assessment is **superseded for Working** by migration 323 and this ADR. Guided may still teach with draft-first inventory; Working must list **identities**, not relabeled drafts.

ADR 0068 keeps synthesis and review as **two kernels** and **two SQL tables** (`DraftRequests` vs `Runs`/`Reviews`). ADR 0069 gives Working one resumable work object on Home. ADR 0072 makes the **review URL canonical after spawn** for the open governed job. None of those ADRs productized a named parent object. This ADR does — without merging kernels or tables.

**Rejected alternatives:**

- **Option L:** Merge `DraftRequests` and `Runs` into one table — violates ADR 0068, spawn lock, and sealed-record immutability (ADR 0039).
- **Architecture = latest draft row:** Makes the mutable document the identity; breaks portfolio scan, multi-draft history, and honest sealed-record labeling.
- **Rename the drafts list to Architectures:** Cosmetic; does not create a durable parent or FK from drafts.
- **Live presence / finding-comment chat as collaboration:** Out of scope; collaboration is shared identity + review history under workspace scope (ADR 0037).

**Related (not rewritten):** ADR 0068, ADR 0069, ADR 0072, ADR 0037, ADR 0039, ADR 0064, ADR 0067 (Guided only).

## Decision

1. **Architecture identity** (`dbo.Architectures`) is the **customer-visible Working noun**: tenant/workspace/project-scoped, named, mutable **anchor**. It is not a sealed record, not a draft document, and not a review. It points at the current unsealed working copy (draft and/or knowledge model) and the latest sealed manifest when one exists.
2. **Display name** is required when an identity is created (from draft system name / title when ensuring; fallback `Untitled architecture` only when empty).
3. **Draft** (`DraftRequests`) is an unsealed working document **of** an architecture (`ArchitectureId` FK). ADR 0071 undo applies to draft documents only.
4. **Review** (`Runs`/`Reviews`) is a governed evaluation **of** an architecture at a pinned version (`ArchitectureId` + `ArchitectureVersionId`). ADR 0072 still makes the review URL canonical **while that review is the open governed job**; the architecture desk remains reachable as the parent object.
5. **Sealed review record** stays immutable (ADR 0039). Many seals may hang off one architecture over time.
6. **Permissions:** No per-architecture ACL in V1. Workspace scope (ADR 0037) is the permission boundary — same as drafts and reviews today.
7. **Guided / demo / trial:** May keep draft-first teaching inventory (ADR 0067). **Working** lists and opens **identities** via list/get HTTP and the architecture desk (DA-04).

Identity must be ensured on **first successful server persist of a draft**, not only on first Created-origin run.

## Trade-offs

**Gains:** A Monday-morning object architects can name, list, and reopen; drafts and reviews become children instead of competing identities; portfolio and desk UIs can show honest inventory (DA-07/08/11); recurrence and re-review link to a stable parent without merging tables.

**Sacrifices:** Additional schema, API, and UI surface to maintain; migration and backfill work for legacy rows (DA-12); engineers must keep `ArchitectureId` distinct from `DraftId` in routes and hooks (DA-05); two URLs after spawn (review job + parent desk) require clear wayfinding (ADR 0072 unchanged).

**Rejected:** Merging kernels/tables (flexibility loss, sealed-record risk); identity-only-on-run (too late for week-long drafting); per-architecture ACL (operational and security review cost in V1).

## Constraints

- ADR 0068, 0069, and 0072 bodies are not rewritten — only Related pointers.
- `DraftRequests` and `Runs`/`Reviews` remain separate tables; no sealed manifest bytes on `dbo.Architectures`.
- Tenant isolation on every query (ADR 0037); no cross-tenant list or get.
- BFF / HttpOnly session remains LK-05–07 — not part of this ADR.
- No 40th coverage engine (`HOLD_NO_COVERAGE_ENGINES.md`).
- Desktop review workspace tabs stay a full strip (no **More** overflow).
- TB-645 vocabulary: architecture, review, finding, sealed review record — drafts are not sealed records.

## Expected impact

**System:** New columns on `Architectures` and `DraftRequests`; list/get/ensure APIs; Working architecture desk; SPA stops aliasing `DraftId` as `architectureId`; identity ensured on draft create.

**Security:** Unchanged trust boundary — workspace-scoped RBAC; 404/empty on out-of-scope ids; no new public unauthenticated architecture list.

**Operations:** One-time backfill job for legacy null `ArchitectureId` on drafts (DA-12); DbUp migration 366+; OpenAPI snapshot updates when HTTP ships.

**Cost:** Modest storage for display names and FK index; negligible query cost for scoped list with pagination.

**Teams:** Engineering implements DA-02–12 in sequence; GTM unchanged; Guided eval flows unchanged.

## Consequences

- **Positive:** Working desk matches how architects think about their portfolio; sealed records stay honest children; re-review and recurrence have a stable parent key.
- **Negative:** Short-term migration and dual-route period while SPA adopts real `ArchitectureId`; reviewers must refuse “rename drafts list” shortcuts.
- **Follow-ups:** DA-02 schema, DA-03 API, DA-06 ensure-on-save, DA-04 desk, DA-05 SPA ids, DA-12 backfill, DA-07/08/11 inventory honesty, DA-09 eval leakage, DA-10 in-flight rehydrate.
