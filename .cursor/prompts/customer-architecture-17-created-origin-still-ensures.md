# CA-17 — Created-origin runs still ensure identity

**Do not delete** `EnsureCreatedRunIdentityAsync`. **Do not** create a second identity when the draft already has one.

## Goal

Legacy / synthesis Created-origin path must remain correct after CA-14–16:

1. If the request/draft already has `ArchitectureId`, link the run to **that** id.
2. If not, keep `EnsureCreatedRunIdentityAsync` and set DisplayName from system name when still Untitled (CA-15 helper).
3. Tests that today assume create-on-run still pass or are updated to the draft-first world without leaving Created-origin orphans.

## Why

Not every historical caller goes through draft autosave. Dropping the run-time ensure empties the desk for synthesis-only paths.

## Context

- `ArchitectureIdentityService.EnsureCreatedRunIdentityAsync`
- `ArchitectureSynthesisKernel.cs`
- `ArchitectureIdentityServiceTests.cs`

## What to build

1. Guard + tests: draft FK wins; null draft still creates one identity per Created-origin run.
2. Do not backfill history (CA-18).

## Acceptance criteria

- No Created-origin run in scope ends with null ArchitectureId after the ensure path.
- Two concurrent Created-origin runs for different drafts stay two identities.

## Constraints

- Tenant isolation. Check nulls.
- Do not add engines.
