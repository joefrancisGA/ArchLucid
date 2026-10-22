# LK-03 — ADR 0072: Working canonical work identity (do not merge tables)

**Do not rewrite ADR 0068.** Synthesis and review stay two kernels and two SQL tables (`DraftRequests` vs `Runs`). **Do not rewrite ADR 0069** (desk chrome / one primary). This file **changes the bet** previous waves forbade: one work object is not only Home chrome — after spawn, **the canonical Working URL is the review**.

## Goal

Write **ADR 0072**: on an authenticated Working seat, a work item has one canonical locator after handoff.

1. **Before spawn:** canonical URL is the draft editor (`/architecture/architectures/{id}` or the existing draft route).
2. **After `linkedReviewId` is set:** canonical URL is the review (`reviewDetailPath`). Draft URLs **handoff** (read-only summary + Open review). They are not a second live instrument.
3. Optional but authorized: a single Working resolver route (for example `/architecture/work/{id}`) that 302/rewrite to draft or review. If the existing route map makes a new segment expensive, the ADR may choose “no new segment; draft route becomes handoff” — say which, with Trade-offs.
4. Guided may keep the disabled form as teaching. Working must not.
5. Artifacts stay unequal. Spawn lock rule stays. Clone-from-snapshot remains the legal new version (WA-10).

## Why

ADR 0069 stopped two peer *start* products. It did not stop two live *URLs*. An architect who bookmarks yesterday’s draft after Start review will edit the wrong object and believe the sealed record moved. That is how livelihoods get a stamp that does not match the document they thought they sealed.

Merging `DraftRequests` and `Runs` would fight ADR 0068 (Option K) and destroy unequal artifacts. URL identity does not require a table merge.

## Context

- `docs/architecture/adrs/0068-architecture-synthesis-and-review-evaluation-kernels.md` — keep Accepted; Related pointer from 0072 only
- `docs/architecture/adrs/0069-working-desk-one-work-object.md`
- `archlucid-ui/src/lib/working-start-route.ts` `spawn-locked-review`
- `architecture-draft-handoff-gate.ts`
- `ArchitectureDraftHandoffPanel.tsx` (SD-10 may already exist — ADR still required)
- `docs/architecture/adrs/README.md` + `template.md`

## What to build

1. New file `docs/architecture/adrs/0072-working-canonical-work-identity.md` with required sections. Status Proposed unless LK-04 lands in the same PR.
2. Explicit **reject** of Option L (one SQL table) and of localStorage “edit anyway.”
3. Row in ADR README.
4. Do not flip routes in this prompt unless a failing test is required to make the ADR reviewable. Product is LK-04.

## Acceptance criteria

- ADR 0068 file body is not rewritten.
- A reviewer can quote 0072 to refuse a live Working draft editor after spawn and to refuse merging run/draft tables.
- Guided two-door teaching (ADR 0067) remains legal.

## Constraints

- No desktop **More** menu.
- No GTM **M-90 / M-44**.
- Tenant isolation unchanged (ADR 0037).
