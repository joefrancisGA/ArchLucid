> **Scope:** ADR 0072 — Working canonical work URL without merging persistence kernels (livelihood-kernel LK-03).

> **Spine doc:** [`START_HERE.md`](../../START_HERE.md).

# ADR 0072: Working canonical work identity (URL, not table merge)

- **Status:** Accepted
- **Date:** 2026-09-05
- **Implemented:** 2026-09-05 (LK-03 / LK-04; SD-10 handoff panel)

## Context

ADR 0069 (Accepted) stopped two peer **start** products on the Working desk. ADR 0068 (Accepted) keeps architecture **synthesis** and **review execute** as two kernels with separate SQL tables (`DraftRequests` vs `Runs`) and unequal artifacts.

The livelihood diagnosis still finds a second failure mode: after **Start review**, the spawn-locked **draft URL** remains a live editor in bookmark history. An architect who opens yesterday’s draft route edits the wrong object while believing the sealed record tracks that page. That is not fixed by Home chrome alone.

Merging draft and review into one SQL table (Option L) would fight ADR 0068, destroy unequal artifacts, and complicate spawn lock. **URL identity** does not require a table merge.

**Related:** ADR 0068 (kernels), ADR 0069 (Working one start), RS-04 (spawn lock — no localStorage “edit anyway”), IS-03 (`resolveWorkingStartHref`), SD-10 (`ArchitectureDraftHandoffPanel`).

## Decision

1. **Before spawn:** canonical Working URL is the draft editor (`/architecture/architectures/{draftId}`).
2. **After `linkedReviewId` / `spawnedRunId` is set:** canonical Working URL is the **review** (`reviewDetailPath`). Draft URLs **hand off** — read-only summary + primary **Open review**; not a second live instrument.
3. **No new route segment required for V1:** reuse existing draft route as handoff surface on Working when spawn-locked. A future `/architecture/work/{id}` resolver may 302 to draft or review; not mandatory if handoff panel ships (LK-04).
4. **Guided:** may keep the disabled form as teaching (ADR 0067). Working must not.
5. **Persistence:** ADR 0068 two tables unchanged. Clone-from-snapshot (WA-10) remains the legal new draft version after lock.

## Trade-offs

**Gains:** One canonical locator after handoff; bookmarks stop training the wrong desk; ADR 0068 immutability preserved.

**Sacrifices:** Draft row remains in registry (correct — it is the synthesis artifact); deep links to old draft URLs must render handoff, not 404; Guided still shows two-door teaching on draft route.

**Rejected:** Merging `DraftRequests` and `Runs` (Option L); localStorage unlock of spawn lock; making review URL optional when a draft exists.

## Constraints

- Do not rewrite ADR 0068 or ADR 0069 bodies — Related pointers only.
- Desktop review workspace tabs stay a full strip (no **More** menu).
- Autosave disabled when spawn-locked (`enabled: !handoffEditorLocked`).
- Tenant isolation (ADR 0037) unchanged.

## Expected impact

**System:** `ArchitectureDraftWorkspaceBody` Working branch renders `ArchitectureDraftHandoffPanel` when `handoffEditorLocked`. `resolveWorkingStartHref` already prefers linked review (IS-03). Vitest covers Working spawn-locked fixture (LK-04).

**Security:** Handoff is read-only; no new write surface on locked drafts.

**Operations:** No migration. Help/palette may list draft URL as historical; primary CTA is Open review.

**Teams:** Reviewers quote 0072 to refuse live Working editor after spawn and to refuse table merge.

## Consequences

- **Positive:** Aligns URL identity with ADR 0069 one work object; reduces wrong-object seal risk.
- **Negative:** Marketing must not screenshot Guided disabled form as Working handoff.
- **Follow-ups:** Optional work resolver route if bookmark confusion persists after LK-04.
