# CA-10 — PATCH display name (application)

**Do not add HTTP yet** (CA-12). **Do not add the desk rename form** (CA-31). Ensure/list (CA-07–09) should exist.

## Goal

Architects can **rename** the career object without editing a draft document.

1. `RenameAsync(scope, architectureId, displayName)` — trim; reject whitespace-only (`ArgumentException` or a typed result).
2. Updates `DisplayName` + `UpdatedUtc`. Does **not** rewrite draft DocumentJson.
3. Optional description patch in the same method or `PatchAsync` args type (own file).
4. Out of scope → null / not-found, not another tenant’s row.

## Why

Meetings change the system name (“Payments API” → “Retail payments”). If the only name source is the draft title, the portfolio lies the moment two drafts disagree. The identity owns the name.

## Context

- CA-02 DisplayName
- `ArchitectureIdentityRecord`
- TB-2005 will apply on the form in CA-31 — Application still validates empty names

## What to build

1. Application method + tests (happy path, empty rejected, scope miss).
2. Do not sync-rename all child drafts (state that one-way identity name ≠ draft title in the PR).

## Acceptance criteria

- Rename does not change `ArchitectureId`.
- Sealed manifests are not rewritten.

## Constraints

- No per-architecture ACL. Same workspace write rank as draft update.
- Do not implement BFF.
