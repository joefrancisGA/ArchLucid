# SA-13 — Incremental path invalidation

**Do not** recompute the whole estate on every snapshot by default. Follow [`.cursor/prompts/securenow-architect-00-index.md`](securenow-architect-00-index.md) global constraints.

## Goal

Subscribe to `IAzureInventoryDiffConsumer` (IE-06). Re-run privilege / reachability / combination engines only for the **neighborhood** of changed `CloudResourceId`s (the resource, its identities, NSGs, and 1-hop dependents). Persist new paths on snapshot B; do not mutate snapshot A paths.

## Why

Continuous architecture review is neighborhood recalculation, not a SIEM and not a nightly full-graph AI. Full recompute may exist as an explicit flag for tests/ops, default off for large subscriptions.

## Context

- Plane §§1, 10; IE-06 consumer hook
- SA-03, SA-05, SA-06 entry points
- `AzureInventoryChangeRecord`

## What to build

1. Neighborhood expander: ChangeType PermissionChanged / NetworkExposureChanged / IdentityChanged / Relationship* / SecurityControlChanged → seed ids → 1-hop via snapshot relationships.
2. Engine runner scoped to seeds; other PathKinds optional no-op if not implemented yet.
3. Config: `FullRecompute` default false. Tests cover both.
4. Audit event `SecureNowArchitect.NeighborhoodRecomputed` with change and path counts (no ARM payloads).
5. Tests: unrelated RG change does not delete/recreate paths in another RG; RBAC change on MI rebuilds that privilege path; identical diff empty → no engine call (mock).

## Acceptance criteria

- Snapshot A paths remain immutable.
- No activity-log streaming.

## Constraints

- Compile: `.\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj'`

## Done when

IE-06 diffs drive bounded recomputation.
