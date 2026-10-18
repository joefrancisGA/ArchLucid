# SN-PERF-03 — Reuse the path search buffer

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file as the whole task. Do not use a fast-tier slug. Do not implement another SN-PERF prompt in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/SECURENOW_PERFORMANCE_LUNA_PROMPTS.md`

## Goal

Privilege and reachability enumeration visit the same edges in the same order, without sorting on every visit and without allocating a new path list and a new visited set on every edge.

## Why

`PrivilegePathEnumerator.DepthFirstSearch` and `IntendedReachabilityPathEnumerator` call `edges.OrderBy` inside the recursive loop, then copy the path and the visited set before the recursive call. `MaxPaths` stops the result list. The copies still happen until that cap trips. `TryFinalizePath` stores `Hops = hops` on the candidate, so the stored hops cannot be the buffer the search keeps mutating.

## Read first

- `ArchLucid.Application/InfraEvidence/SecureNowArchitect/PrivilegePathEnumerator.cs` (`DepthFirstSearch`, `TryFinalizePath`)
- `ArchLucid.Application/InfraEvidence/SecureNowArchitect/IntendedReachabilityPathEnumerator.cs`
- `ArchLucid.Application/InfraEvidence/SecureNowArchitect/InventoryPrivilegePathGraph.cs` (`AddEdge`)
- `ArchLucid.Application/InfraEvidence/SecureNowArchitect/InventoryReachabilityPathGraph.cs`
- `ArchLucid.Application.Tests/InfraEvidence/SecureNowArchitectNeighborhoodTraversalTests.cs`
- `ArchLucid.Application.Tests/InfraEvidence/PrivilegePathEngineTests.cs`
- `ArchLucid.Application.Tests/InfraEvidence/SecureNowReferencePrivilegePathOracleTests.cs`

## What to build

1. Branch `sn-perf/03-path-search-alloc` from current `master`.
2. After each graph build finishes adding edges, sort each adjacency list once by `EdgeType` with `StringComparer.Ordinal`. `Enumerable.OrderBy` is stable, so equal types keep today's insertion order. Do the same for the reachability graph.
3. In both depth-first searches, iterate that list directly. Push the edge and the node, recurse, then pop them. One path list and one visited set per start node.
4. When a candidate is kept, its hop list must be a copy taken at that moment. Later pops must not change a candidate already in `results`. Paths that are not kept do not need that copy.
5. Keep the start-node filter and the start-node order. Keep `MaxDepth`, `MaxPaths`, and `MaxFanOutPerNode` behavior, including limit-hit recording.
6. Do not change which paths are emitted, their hop order, or their signatures.

## Tests

1. Existing privilege, reachability, neighborhood, and reference-oracle tests pass without edited expectations.
2. Add one test that stores a candidate and then continues the search, and asserts the stored hop list still has the length and last edge it had when it was stored.
3. Add one test with two edges of the same type from one node, inserted in a known order, and assert the search still visits them in that order.

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'` (Cloud Agent: `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path '<path>'`). Stop on exit code 2.
- Security: this is read-only traversal of inventory already in the snapshot. Do not widen the edge types.
- Scalability: allocations follow accepted paths, not visited edges.
- Reliability: the visited set still blocks cycles. Backtrack removes only the node this call added.
- Cost: no new stored paths and no higher caps.
- Do not commit.

## Done when

The same path signatures come out in the same order, and a stored candidate's hops stay stable after the search continues.
