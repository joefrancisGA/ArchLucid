# CA-01 — ADR 0074: Customer-visible durable architecture identity

**Skip if** `docs/architecture/adrs/0074-customer-visible-architecture-identity.md` already exists on the branch (DA-01 shipped). **Do not rewrite ADR 0068.** Synthesis and review stay two kernels and two SQL tables. **Do not rewrite ADR 0069** or **0072**. This file **changes the bet** those ADRs left internal: `dbo.Architectures` becomes the **customer-visible durable object**.

## Goal

Write **ADR 0074** (next free number after 0073): ArchLucid has a third *customer* noun that is **not** a third kernel.

1. **Architecture identity (`dbo.Architectures`):** named, tenant-scoped, mutable **anchor**. Not a sealed record. Not a draft document. Not a review.
2. **Draft (`DraftRequests`):** unsealed working document **of** an architecture (FK `ArchitectureId`). ADR 0071 undo applies here.
3. **Review (`Runs`/`Reviews`):** governed evaluation **of** an architecture. ADR 0072 still makes the review URL canonical **while that review is the open governed job**.
4. **Sealed review record:** immutable (ADR 0039). Many seals may hang off one architecture.

Reject Option L (merge draft+review). Reject “architecture = latest draft row.” Reject adding a top-level nav item that lists drafts and calls them architectures.

Status **Proposed** is enough if CA-02 lands Accepted in the same PR.

## Why

A working architect’s livelihood object is the **system they own**, not the last pipeline execution. July 2026 `architecture_review_object_model_assessment.md` concluded there was no `ArchitectureId` and told the product **not** to add an Architectures destination. That assessment is **stale**: migration **323** created `dbo.Architectures`.

ADR 0069 stopped two *start products*. ADR 0072 stopped two *live URLs after spawn*. Neither created a Monday-morning object.

## Context

- `docs/architecture/adrs/template.md` — Trade-offs, Constraints, Expected impact are merge-blocking
- `docs/architecture/adrs/README.md` (next is **0074**)
- `docs/architecture/adrs/0068-architecture-synthesis-and-review-evaluation-kernels.md`
- `docs/architecture/adrs/0069-working-desk-one-work-object.md`
- `docs/architecture/adrs/0072-working-canonical-work-identity.md`
- `ArchLucid.Persistence/Migrations/323_Architectures.sql`
- `ArchLucid.Contracts/Architecture/ArchitectureIdentityRecord.cs`
- `docs/architecture/architecture_review_object_model_assessment.md`
- `docs/ARCHLUCID_FOUNDATIONAL_DESIGN_DEBATE.md` R13

## What to build

1. `docs/architecture/adrs/0074-customer-visible-architecture-identity.md` with required sections.
2. Falsifiable decisions: Working noun **Architecture** = `ArchitectureId`; display name required on create; drafts/reviews **reference** the identity; no per-architecture ACL in V1; Guided may list drafts as teaching; after spawn ADR 0072 still owns the review job URL; the architecture desk remains the parent.
3. Explicit reject of table merge, latest-draft-as-architecture, and live presence as collaboration.
4. Row in `docs/architecture/adrs/README.md`.
5. Do **not** implement schema/API. Product is CA-02+.

## Acceptance criteria

- ADR 0068 / 0069 / 0072 bodies are not rewritten (Related pointers only).
- A reviewer can quote 0074 to refuse “just rename the drafts list to Architectures.”
- A reviewer can quote 0074 to require a named identity **before or at** first draft save.

## Constraints

- No desktop **More** menu. No GTM **M-90 / M-44**. No **LK-05–07**. No finding engines.
- Tenant isolation unchanged (ADR 0037).
