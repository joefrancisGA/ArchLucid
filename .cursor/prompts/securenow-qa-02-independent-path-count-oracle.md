# SN-QA-02 — Independent SecureNow path-count oracle

**Model:** GPT-5.6 Luna. Paste this file as the whole task. Do not implement SN-QA-01 in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/QA_Ideas.md`, Turn 6, recommended item 2.

## Goal

Compare production SecureNow path enumeration with a separate brute-force counter on tiny graphs. This is the architecture equivalent of chess perft: count the paths to a bounded depth, then compare signatures. The oracle must be able to disagree with production.

## Why

Fixed synthetic worlds check a few hand-written answers. They do not catch a pruned branch, a dropped duplicate, or a cycle that is walked twice. A one-graph reachability oracle already exists. Privilege enumeration has no matching oracle.

## Read first

- `docs/library/SECURENOW_SYNTHETIC_AZURE_WORLDS.md` (the paragraph that asks for an independent brute-force oracle)
- `ArchLucid.Application.Tests/InfraEvidence/ReferenceAssurance/ReferenceReachabilityOracle.cs`
- `ArchLucid.Application.Tests/InfraEvidence/SecureNowReferenceReachabilityOracleTests.cs`
- `ArchLucid.Application/InfraEvidence/SecureNowArchitect/IntendedReachabilityPathEnumerator.cs`
- `ArchLucid.Application/InfraEvidence/SecureNowArchitect/PrivilegePathEnumerator.cs`
- `ArchLucid.Application.Tests/InfraEvidence/IntendedReachabilityEngineTests.cs`
- `ArchLucid.Application.Tests/InfraEvidence/PrivilegePathEngineTests.cs`

## What to build

Keep the oracle in `ArchLucid.Application.Tests/InfraEvidence/ReferenceAssurance/`. It may use only plain tuples: node id, edge type, and a hand-listed set of terminal node ids. It must not call production enumerators, `SecurityEvidencePathRankCalculator`, `SecurityEvidenceCutPointAnalyzer`, `InventoryReachabilityPathGraph`, or `InventoryPrivilegePathGraph`.

### Reachability

Extend `SecureNowReferenceReachabilityOracleTests` with three additional tiny graphs. Keep the existing test.

1. A branch from the internet node to two distinct reachability assets. Both signatures must appear.
2. A cycle back to a visited node. The oracle and production must both stop. The test must finish without depending on `MaxPaths`.
3. A walk that reaches a resource only through edges that are not exposure edges (`Exposes`, `RoutesTo`, or `PublicNetworkAccessHopEdgeType`). That walk must not be a path. Hand-list the terminal ids. Do not ask production `IsReachabilityAsset` to decide them.

Set `MaxDepth` and `MaxPaths` high enough that production is not truncated. Assert signature sets are equal, not merely that the counts are equal. A count match can hide a swapped path.

### Privilege

Add `ReferencePrivilegePathOracle` and `SecureNowReferencePrivilegePathOracleTests`.

Limit this slice to graphs whose terminal rule is obvious by inspection:

- start at one principal node
- one `UsesIdentity` or `HasRole` hop
- one final `CanRead` or `CanWrite` hop to a resource node
- no unknown-role expansion, group nesting, federated-deployment tagging, or data-plane role mapping

The oracle walks every simple path to `maxDepth` and keeps a path only when it has an identity hop and ends in `CanRead` or `CanWrite`. Production is `PrivilegePathEnumerator.Enumerate`. Compare hop signatures.

Required graphs:

1. One principal, one identity hop, one `CanWrite` hop. Exactly one path.
2. One principal with two terminal resources. Exactly two paths.
3. A cycle. No duplicate and no non-termination.
4. A `CanRead` or `CanWrite` hop with no `HasRole` and no `UsesIdentity` hop. Zero paths.

If production and the oracle disagree, do not edit the oracle until it matches production. First state which rule each side implemented. Change production only when the oracle's rule is the one already documented by `PrivilegePathEngineTests` and the enumerator, and the missing or extra path is obvious on the tiny graph.

## Docs

Add a short subsection to `docs/library/SECURENOW_SYNTHETIC_AZURE_WORLDS.md` naming the two oracles, the graph limits, and the rule that the oracle must not call production traversal. Keep the contributor-only scope line. This is not buyer-facing proof.

## Acceptance criteria

- Reachability: the existing test plus three new graphs, compared as signature sets.
- Privilege: four new graphs, compared as signature sets.
- Oracles live under `ReferenceAssurance/` and have no production-enumerator dependency.
- No Azure, no LLM, no new `IFindingEngine`, no UI, no change to ranking.
- No `ConfigureAwait(false)` in tests.
- One class per file.

## Constraints

- Before editing any tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. If it exits 2, stop and report the blocked path.
- Compile once: `.\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj'`
- Run only `SecureNowReferenceReachabilityOracleTests` and `SecureNowReferencePrivilegePathOracleTests`.
- Do not commit. Do not edit unrelated dirty files.

## Done when

On each tiny graph, a reviewer can count the expected paths by hand, and the test fails when production returns a different set.
