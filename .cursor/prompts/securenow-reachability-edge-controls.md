# SecureNow — Reachability: network edge controls (SA-05 slice)

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file as the whole task.

**Branch:** `cursor/securenow-sa05-edge-controls-4156` from `origin/master` (merged as **PR #4693**).

## Goal

SA-05 intended paths treat **Azure Firewall, App Gateway, Front Door, NVA, and forced-tunnel UDRs** as **InsufficientEvidence** when snapshot evidence cannot defend the hop — not implicit allow. Path headers use the **weakest hop** confidence band.

## Read first

- `.cursor/prompts/securenow-architect-05-intended-reachability.md`
- `docs/book/chapters/07-computing-reachability.md` (indeterminate table)
- `ArchLucid.Application/InfraEvidence/SecureNowArchitect/IntendedReachabilityPathEnumerator.cs`

## What was built (#4693)

1. **`AzureInventoryReachabilityEdgeControlIndex`** (Core) — subnet UDR `VirtualNetworkGateway` / `VirtualAppliance`; AGW/FD backend declarations.
2. Hop type **`network-edge-control-not-collected-or-unverified`** on finalize.
3. **`SecurityEvidencePathConfidenceBandResolver`** — `IntendedReachabilityEngine` persists weakest hop band.

## Out of scope (next slices)

- Traversing collected firewall/AGW/FD hops with rule evaluation
- Custom VNet DNS resolvers → see `securenow-reachability-custom-dns-access-contract.md`
- Full access-decision API contract

## Verification

```powershell
dotnet test ArchLucid.Core.Tests/ArchLucid.Core.Tests.csproj --filter 'FullyQualifiedName~ReachabilityEdgeControl'
dotnet test ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj --filter 'FullyQualifiedName~IntendedReachability'
```

## Done when

Forced-tunnel subnet on a public path and a public asset behind AGW without traversing AGW both append edge-control insufficient hops; NSG-missing paths persist `InsufficientEvidence` on the path record.
