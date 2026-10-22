# CA-46 — In-flight rehydrate by architecture

**Skip if** DA-10 already shipped. **Do not fork LK-10** wait copy.

## Goal

In-flight operations for reviews **of this architecture** rehydrate from the **server**, not only `sessionStorage`.

1. Architecture desk (and Working shell) asks for active operations filtered by `ArchitectureId` / child review ids (reuse `GET /v1/operations` if it can filter; otherwise fetch child reviews then operations).
2. Scope switch still clears the **wrong tenant’s** sessionStorage (keep that). It must not look like this architecture has no in-flight work when the server has a running child.
3. `architectureId` on `TrackedInFlightOperation` means **ArchitectureId**, not draft id (CA-22).

## Why

Scope switch that empties the only tracker is a casual SPA. Meetings change workspace and come back.

## Context

- `in-flight-operations-store.ts` / persistence
- DA-10 (do not paste)
- LK-10 wait-is-not-the-desk
- TB-2074 operations poll

## What to build

1. Rehydrate on desk mount + tests (sessionStorage empty, server pending → strip shows).
2. Do not invent wait-on-this-tab copy.

## Acceptance criteria

- Working desk of an architecture with a running child shows the operation after a new tab.
- Guided may keep thinner chrome.

## Constraints

- No BFF. No live presence avatars.
- Do not call a missing `GET /v1/runs/{id}/progress` (TB-2072).
