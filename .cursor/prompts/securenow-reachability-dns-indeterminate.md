# SecureNow — Reachability: private DNS + indeterminate `canReach` (SA-05 / Ch. 7 slice)

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file as the whole task.

**Branch:** `cursor/securenow-reachability-dns-indeterminate-4156` from `cursor/securenow-reachability-public-network-access-4156` (or `origin/master` after #4684 merges).

## Goal

1. **Intended reachability** honors DNS-joined `peReachableTarget` hops and surfaces **missing private DNS** as `dns-not-collected-or-unverified` (InsufficientEvidence), not implicit allow.
2. **Privilege paths** walk derived **`CAN_REACH`** edges; indeterminate DNS becomes InsufficientEvidence on the path (book Ch. 5–7).

## Read first

- `.cursor/prompts/securenow-architect-05-intended-reachability.md`
- `.cursor/prompts/securenow-probable-evidence-04-pe-reachable-dns-join.md`
- `docs/book/chapters/07-computing-reachability.md` (indeterminate + `canReach`)

## What to build

1. **`AzureInventoryPrivateEndpointDnsJoinIndex`** (Core) — shared PE/DNS join index from snapshot relationships.
2. **`InventoryReachabilityPathGraph`** — integrated compute starts, preserve inference sources, DNS index on snapshot.
3. **`IntendedReachabilityPathEnumerator`** — private paths from integrated compute; append DNS insufficient hop when PE exists without join.
4. **`GraphEdgeTypes.CanReach`** + **`InventoryPrivilegePathCanReachAppender`** — materialized `peReachableTarget` → `CAN_REACH`; usage-intent + missing DNS → indeterminate `CAN_REACH`.
5. Tests: Core index, `IntendedReachabilityEngineTests`, `AzureInventoryPrivateDnsCanReachPrivilegePathTests`.

## Out of scope

- Custom DNS resolver answers, Azure Firewall application rules, full access-decision contract
- Flow logs / Network Watcher

## Verification

```powershell
dotnet test ArchLucid.Core.Tests/ArchLucid.Core.Tests.csproj --filter 'FullyQualifiedName~PrivateEndpointDnsJoinIndex'
dotnet test ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj --filter 'FullyQualifiedName~IntendedReachability|PrivateDnsCanReach|PrivateEndpointReachable'
pwsh -NoProfile -File scripts/ci/agent-compile-check.ps1 -ProjectPath 'ArchLucid.Application/ArchLucid.Application.csproj'
```

## Done when

DNS-joined app→SQL produces a private intended path without an Internet start; missing DNS yields InsufficientEvidence on reachability and on privilege paths that include `CAN_REACH`.
