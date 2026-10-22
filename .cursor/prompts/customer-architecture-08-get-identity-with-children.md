# CA-08 — Get identity with child summaries

**Do not return full draft documents or sealed manifest bytes.** **Do not add HTTP** (CA-11). List query (CA-07) should exist.

## Goal

`GetWithChildrenAsync(scope, architectureId)` returns the identity plus **summaries**:

1. Current open draft: `DraftId`, title/system name, updated, spawn-locked yes/no.
2. Child reviews: `ReviewId` / run id, status, sealed or in-flight, updated — **not** findings.
3. Latest sealed manifest id + href-ready id only.
4. 404-shaped null if out of scope (never leak the name of a cross-tenant row).

## Why

The Monday desk (CA-26) must open one system without downloading every package. Child summaries are the collaboration primitive (shared history, no chat).

## Context

- CA-05 computed pointers
- `ArchitectureDraftHandoffPanel` spawn-lock meaning
- Review list DTOs already used by the reviews hub

## What to build

1. Application method + DTO files.
2. Tests: scope miss → null; children from another architecture excluded; spawn-locked draft is not “current editable” if CA-05 defined that rule.
3. No SPA.

## Acceptance criteria

- A Working client can render the desk from this DTO alone.
- Cross-tenant id does not return DisplayName.

## Constraints

- ADR 0037. No new permission names.
- Do not unseal or rewrite manifests.
