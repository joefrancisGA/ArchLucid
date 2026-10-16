# SecureNow — Reachability: custom DNS + access-decision honesty (SA-05 / Ch. 7)

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file as the whole task.

**Branch:** `cursor/securenow-custom-dns-reachability-4156` from `origin/master` (after **#4693** is on trunk).

## Goal

1. **Custom DNS** — VNets with non-default `dhcpOptions.dnsServers` make private reachability **indeterminate** unless resolver answers were collected (book Ch. 7).
2. **Access-decision contract** — intended-reachability finding/path copy never implies packets flowed; name the band and weakest-hop reason in narrative metadata.
3. **SA-06 hygiene** — toxic-combination path headers use **weakest hop** band (same resolver as SA-05).

## Why

PE + private zone join is not enough when the spoke uses custom resolvers; operators need an explicit hop and honest copy before SA-06 composes exposure × identity.

## Read first

- `.cursor/prompts/securenow-reachability-edge-controls.md`
- `.cursor/prompts/securenow-architect-06-toxic-combinations.md`
- `ArchLucid.Application/InfraEvidence/SecureNowArchitect/IntendedReachabilityPathNarrative.cs`

## What to build

1. **`AzureInventoryVnetCustomDnsIndex`** (Core) — detect custom DNS on `Microsoft.Network/virtualNetworks` properties (`dhcpOptions` JSON or flattened keys); ignore Azure default-only `168.63.129.16`.
2. **`InventoryReachabilityPathGraph`** — attach index; **`IntendedReachabilityPathEnumerator`** appends `custom-dns-resolver-not-collected-or-unverified` when integrated compute’s VNet uses custom DNS on a private intended path.
3. **`ReachabilityPathMaterializer`** + **`SecureNowArchitectConstants`** — map new hop to `InsufficientEvidence`.
4. **`IntendedReachabilityPathNarrative`** — one sentence: intended control-plane path; weakest band; not observed traffic.
5. **`ToxicCombinationEngine`** — `PathConfidenceBand = SecurityEvidencePathConfidenceBandResolver.ResolveWeakestHopBand(hops)`.
6. Tests: Core index, `IntendedReachabilityEngineTests`, `ToxicCombinationEngineTests` (band downgrade when a composed hop is insufficient).

## Out of scope

- Collecting live DNS answers from resolvers
- Firewall application-rule evaluation
- Flow logs / Network Watcher

## Verification

```powershell
dotnet test ArchLucid.Core.Tests/ArchLucid.Core.Tests.csproj --filter 'FullyQualifiedName~VnetCustomDns'
dotnet test ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj --filter 'FullyQualifiedName~IntendedReachability|ToxicCombination'
pwsh -NoProfile -File scripts/ci/agent-compile-check.ps1 -ProjectPath 'ArchLucid.Application/ArchLucid.Application.csproj'
```

## Done when

A VNet-integrated app → SQL private path with custom DNS on the app VNet gets an insufficient custom-DNS hop; toxic paths inherit the weakest composed hop band.
