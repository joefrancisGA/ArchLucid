# SN-PERF-05 — Pair toxic combinations by shared asset

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file as the whole task. Do not use a fast-tier slug. Do not implement another SN-PERF prompt in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/SECURENOW_PERFORMANCE_LUNA_PROMPTS.md`

## Goal

Toxic combination composition considers only privilege paths that can share an asset with the reachability path. The candidate that wins for each selection key stays the same.

## Why

`ToxicCombinationPathComposer.Compose` loops every reachability path against every privilege path. Each pair calls `TryResolveSharedAsset`, and shared pairs merge hops. `ToxicCombinationEngine` still loads every path and hop for the snapshot before that loop, including neighborhood runs. The nested loop is the work this session removes. A new SQL filter is a later change.

## Read first

- `ArchLucid.Application/InfraEvidence/SecureNowArchitect/ToxicCombinationPathComposer.cs`
- `ArchLucid.Application/InfraEvidence/SecureNowArchitect/ToxicCombinationPathSnapshot.cs` (`NodeIds`, `TerminalCloudResourceId`, `TerminalNodeId`)
- `ArchLucid.Application/InfraEvidence/SecureNowArchitect/ToxicCombinationEngine.cs`
- `ArchLucid.Application.Tests/InfraEvidence/ToxicCombinationEngineTests.cs`

## What to build

1. Branch `sn-perf/05-toxic-pair-index` from current `master`.
2. Build an index from node id to the privilege paths that contain that node. Use ordinal ignore-case, matching `NodeIds`. Build a second index from `TerminalCloudResourceId` to privilege paths when that id is present. That second index covers the branch in `TryResolveSharedAsset` that matches equal terminal cloud resource ids even when the node sets do not overlap.
3. For each reachability path, collect the privilege paths from its node ids and from its terminal cloud resource id. Run the existing shared-asset, merge, score, and selection-key logic only on that set. Honor `includePair` before merge, as today.
4. Keep the final hop-hash dedupe and the sort by data-plane write, egress, then shared asset node id.
5. Leave `ListWithHopsBySnapshotAsync` as the engine’s read. Do not add a neighborhood SQL filter in this session.
6. A privilege path must be scored at most once per reachability path, even if it is reached through several nodes.

## Tests

1. `ToxicCombinationEngineTests` pass without edited expectations.
2. Add a composer test with two privilege paths where only one shares a node with the reachability path. The result contains the shared pair and not the other.
3. Add a pair that shares no node and shares `TerminalCloudResourceId`. It still composes.
4. Add two privilege paths that share the same reachability asset and assert the higher `ScoreCandidate` result remains, including the selection key’s egress flag.

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'` (Cloud Agent: `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path '<path>'`). Stop on exit code 2.
- Security: the index is built from paths already loaded for this tenant snapshot. Do not pull paths from another snapshot.
- Scalability: pairs follow shared nodes, not the product of the two lists.
- Reliability: empty reachability or empty privilege still returns an empty list. Cancelation behavior of the engine stays as it is.
- Cost: no new table. Hashing stays on the survivors after selection.
- Do not commit.

## Done when

The same toxic candidates are emitted for the existing fixtures, and a privilege path that shares nothing with a reachability path is not merged with it.
