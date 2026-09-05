# DA-01 — ADR 0074: Customer-visible durable architecture identity

**Do not rewrite ADR 0068.** Synthesis and review stay two kernels and two SQL tables (`DraftRequests` vs `Runs`/`Reviews`). **Do not rewrite ADR 0069** (Working one-primary chrome). **Do not rewrite ADR 0072** (after spawn, the review URL is canonical for *that governed job*). This file **changes the bet** those ADRs left internal: `dbo.Architectures` becomes the **customer-visible durable object** a repeat professional reopens all week.

## Goal

Write **ADR 0074** (next free number after 0073): ArchLucid has a third *customer* noun that is **not** a third kernel.

1. **Architecture identity (`dbo.Architectures`):** named, tenant-scoped, mutable **anchor**. It is not a sealed record. It is not a draft document. It is not a review. It points at the current unsealed working copy (draft and/or knowledge model) and the latest sealed manifest when one exists.
2. **Draft (`DraftRequests`):** unsealed working document **of** an architecture (FK `ArchitectureId`). ADR 0071 undo applies here.
3. **Review (`Runs`/`Reviews`):** governed evaluation **of** an architecture at a pinned version (`ArchitectureId` + `ArchitectureVersionId` already exist). ADR 0072 still makes the review URL canonical **while that review is the open governed job**.
4. **Sealed review record:** immutable (ADR 0039). Many seals may hang off one architecture over time.

Reject Option L (merge draft+review into one table). Reject “architecture = latest draft row.” Reject adding a top-level nav item that lists drafts and calls them architectures.

Status **Proposed** is enough if DA-02 lands Accepted in the same PR. Prefer Accepted when 01+02 ship together.

## Why

A working architect’s livelihood object is the **system they own**, not the last pipeline execution. July 2026 `architecture_review_object_model_assessment.md` concluded there was no `ArchitectureId` and told the product **not** to add an Architectures destination. That assessment is **stale**: migration **323** created `dbo.Architectures`, reviews already carry `ArchitectureId`, and `ArchitectureIdentityService` already links Created-origin and re-review runs.

The remaining failure is productization. Identity has no display name, drafts have no FK, the SPA uses `architectureId` as a synonym for `DraftId`, and identity is created only when a Created-origin **run** appears — too late for a week of drafting.

ADR 0069 stopped two *start products*. ADR 0072 stopped two *live URLs after spawn*. Neither created a Monday-morning object. Overlay chrome cannot substitute.

## Context

- `docs/architecture/adrs/template.md` — Trade-offs, Constraints, Expected impact are merge-blocking
- `docs/architecture/adrs/README.md` numbering (next is **0074**)
- `docs/architecture/adrs/0068-architecture-synthesis-and-review-evaluation-kernels.md`
- `docs/architecture/adrs/0069-working-desk-one-work-object.md`
- `docs/architecture/adrs/0072-working-canonical-work-identity.md`
- `ArchLucid.Persistence/Migrations/323_Architectures.sql` (comment: “mutable identity anchors — not sealed records”)
- `ArchLucid.Contracts/Architecture/ArchitectureIdentityRecord.cs` — no display name today
- `ArchLucid.Application/Architecture/ArchitectureIdentityService.cs`
- `docs/architecture/architecture_review_object_model_assessment.md` § Required conclusion (stale; ADR must say it is superseded for the “do not add Architectures nav” line **on Working**)
- `docs/ARCHLUCID_FOUNDATIONAL_DESIGN_DEBATE.md` R13 / ADR 0052

## What to build

1. New file `docs/architecture/adrs/0074-customer-visible-architecture-identity.md` with required sections.
2. Decision points (falsifiable):
   - Customer Working noun **Architecture** = `ArchitectureId` on `dbo.Architectures`, not `DraftId`.
   - Display name is required on create (from draft system name / title when ensuring).
   - Drafts and reviews **reference** the identity; they are not the identity.
   - No per-architecture ACL in V1 — workspace scope (ADR 0037) is the permission boundary.
   - Guided may keep listing drafts as the teaching inventory; Working must list identities.
   - After spawn, ADR 0072 still applies to the **review job URL**; the architecture desk remains reachable as the parent object.
3. Explicit **reject** of merging `DraftRequests`/`Runs`, of treating latest draft as the architecture, and of live presence/comments as the collaboration model (collaboration = shared identity + review history).
4. Row in `docs/architecture/adrs/README.md`.
5. Do **not** implement schema/API in this prompt unless the ADR cannot be reviewed without a failing test. Product is DA-02+.

## Acceptance criteria

- ADR 0068 / 0069 / 0072 file bodies are not rewritten (Related pointers only).
- A reviewer can quote 0074 to refuse “just rename the drafts list to Architectures” and to refuse merging run/draft tables.
- A reviewer can quote 0074 to require a named identity **before or at** first draft save, not only at first Created-origin run.
- Guided two-door teaching (ADR 0067) remains legal.

## Constraints

- No desktop **More** menu.
- No GTM **M-90 / M-44**.
- Tenant isolation unchanged (ADR 0037).
- Do not implement **LK-05–07**.
- Do not add finding engines.
