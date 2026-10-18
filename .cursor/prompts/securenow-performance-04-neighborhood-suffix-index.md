# SN-PERF-04 — Suffix index for neighborhood seeds

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file as the whole task. Do not use a fast-tier slug. Do not implement another SN-PERF prompt in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/SECURENOW_PERFORMANCE_LUNA_PROMPTS.md`

## Goal

Building a traversal neighborhood no longer compares every nonstandard node with every seed ARM id. A legacy prefixed id that matched before still matches.

## Why

`SecureNowArchitectTraversalNeighborhood` builds the reverse edge index, then walks every node. Exact ARM ids, principal ids, and `/subscriptions/` scopes are handled directly. Every other node runs `seedArmIds.Any` with `EndsWith` in both directions. That is one string scan per node per seed, on every neighborhood recompute, before the depth-bounded ancestor walk.

## Read first

- `ArchLucid.Application/InfraEvidence/SecureNowArchitect/SecureNowArchitectTraversalNeighborhood.cs`
- `ArchLucid.Application.Tests/InfraEvidence/SecureNowArchitectNeighborhoodTraversalTests.cs`
- `ArchLucid.Application/InfraEvidence/SecureNowArchitect/PrivilegePathEnumerator.cs` (how `CanReachSeed` and `TouchesSeed` gate the search)

## What to build

1. Branch `sn-perf/04-neighborhood-suffix-index` from current `master`.
2. Keep the exact-seed set, the inherited `/subscriptions/` scope walk, and the reverse-edge ancestor walk. Keep `maxDepth`.
3. Replace the pairwise `EndsWith` scan with an index built once from the seed ARM ids. A nonstandard node matches when a seed id is a suffix of the node, or the node is a suffix of a seed id. Those are the two checks the loop performs today. Standard ARM ids, principal ids, and `azure-ad://` ids keep the current short circuit and do not consult the index.
4. A reversed trie, or another structure whose lookup cost follows the node length rather than the seed count, is enough. Do not allocate a new string for every node-and-seed pair.
5. `CanReachSeed` and `TouchesSeed` stay the public surface. Do not change enumerator caps or which edges are traversable.

## Tests

1. `SecureNowArchitectNeighborhoodTraversalTests` pass without edited expectations, including inherited role scope.
2. Add a node that is not an ARM id, not a principal id, and not `azure-ad://`, and that ends with a seed ARM id. `TouchesSeed` is true.
3. Add a node that is a proper suffix of a seed ARM id and is not itself a standard id. `TouchesSeed` is true.
4. Add a node that shares neither relationship. `TouchesSeed` is false, and `CanReachSeed` is false when no edge leads to a seed within `maxDepth`.

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'` (Cloud Agent: `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path '<path>'`). Stop on exit code 2.
- Security: the index is built only from seed ids already in the caller’s scope. Do not treat a shared suffix across tenants as a seed.
- Scalability: index build follows the seed ids. Lookup follows the node text.
- Reliability: ancestor depth still stops at `maxDepth`.
- Cost: no new table and no second graph.
- Do not commit.

## Done when

Existing neighborhood paths are unchanged, the two legacy suffix cases still count as seed touches, and the constructor no longer scans seeds inside the node loop.
