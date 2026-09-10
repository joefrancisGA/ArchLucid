# SecureNow incremental path invalidation (SA-13)

Default: **neighborhood recompute** driven by IE-06 diffs. Full-estate recompute is opt-in via configuration.

## Configuration

`ArchLucid:SecureNowArchitect:Neighborhood:FullRecompute` — default **false**.

When false:

1. Post-materialize computes IE-06 diff (snapshot A → B).
2. `SecureNowArchitectDiffConsumer` expands changed `CloudResourceId`s to a 1-hop neighborhood (identities, NSGs, dependents).
3. Non-neighborhood paths are **carried forward** from snapshot A to B (immutable A rows).
4. Privilege, intended-reachability, and toxic-combination engines run **scoped** to the neighborhood on snapshot B only.
5. Downstream four-reality drift, path ranking, and cut-point analysis still run on snapshot B.

When true: post-materialize runs the full SecureNow pipeline (tests/ops).

## Seed change types

`PermissionChanged`, `NetworkExposureChanged`, `IdentityChanged`, `RelationshipAdded`, `RelationshipRemoved`, `SecurityControlChanged`.

## Audit

`SecureNowArchitect.NeighborhoodRecomputed` — logs diff id, change count, seed count, carry-forward count, and path counts (no ARM payloads).

## Non-goals

- No activity-log streaming
- Snapshot A path rows are never mutated
- Capability/shared-control engines are not neighborhood-scoped in v1 (full run only on first materialization / FullRecompute)
