# PC-06 — Read-only assumption delta vs last seal (no billable run)

**Do not fork LS-06** (R12 billable what-if execute). **Do not fork WA-20** what-if entry — this is **read-only**. **Do not add** draft-diff merge engine (LK-12).

## Goal

On Working architecture desk and review-detail (when `ArchitectureId` is known), show a **read-only** “Changes since last seal” panel: diff asserted/inferred fields and manifest summary sections vs the **latest golden manifest** for that architecture. Explicit copy: **not a governed re-run**; does not update findings; for orientation only. Link to **Compare** and to **Run what-if** (LS-06) when user needs a billable branch.

## Why

Iteration priced as two full runs (R12) is correct for governance but feels like CI to an all-day architect. A **document-style delta** against last seal supports “what changed this week?” without another $1 GPU job.

## Context

- `AuthorityCompareService` / compare DTOs (read paths only)
- Architecture desk, `ArchitectureDraftHandoffPanel`
- Latest manifest pointer on `dbo.Architectures` (CA schema)
- ADR 0072 canonical review URL

## What to build

1. API: `GET` lightweight delta projection (architecture id → last seal vs current draft snapshot fields). No mutation.
2. UI: collapsible panel on architecture desk; optional tab on review-detail when same architecture.
3. Empty state: no prior seal → honest copy, no fake diff.
4. Tests: fixture with one seal + draft edit shows one changed assumption row.

## Acceptance criteria

- Architect sees delta without starting a run.
- Copy forbids treating panel as sealed evidence.

## Constraints

- Tenant isolation (ADR 0037). No cross-architecture compare.
