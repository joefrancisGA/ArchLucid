# IE-RF-04 — VM→NIC and all IP configurations

Follow [`.cursor/prompts/infra-evidence-relationship-first-00-index.md`](infra-evidence-relationship-first-00-index.md) global constraints. **Depends on IE-RF-01** and at least one of **IE-RF-02** / **IE-RF-03** (or fixture properties if those are not merged yet).

## Goal

Stop using only `ipConfigurations[0]` and only `privateLinkServiceConnections[0]`. Emit `vmToNic` for every NIC on the VM. Emit one `nicToSubnet` / public-IP association per IP configuration.

## Why

Multi-NIC VMs and dual-stack / multiple ipconfigs are normal. The current flatteners hide those edges, so Network-mode Mermaid and SA-05 reachability under-connect.

## Context

- `Add-ArchLucidSecurityInventoryResourceProperties` in `ArchLucid.SecurityInventory.helpers.ps1`
- `HostedAzureInventoryResourcePropertyExpander.cs` (`TryReadFirstIpConfigurationProperty`)
- `HostedAzureInventoryNetworkAssociationBuilder.cs`
- `AzureInventorySecurityEdgeMaterializer.AddObservedNicSubnet` (maps flattened keys — full mapping of `vmToNic` may wait for **IE-RF-07**, but ZIP rows must exist here)

## What to build

1. PowerShell: iterate **all** `ipConfigurations`; write `nicToSubnet` for each subnet id; write `publicIpToNic` when a public IP id is present. Keep a backward-compatible first-config flatten key (`ipConfiguration.subnet.id`) for old materializers **and** emit association rows for every config.
2. VM: read `properties.networkProfile.networkInterfaces[]` (id, optionally primary). Emit `vmToNic` for each. Do not invent a NIC that is not in the array.
3. Private endpoints: iterate **all** `privateLinkServiceConnections` (and `manualPrivateLinkServiceConnections` if present). Emit `privateEndpointTarget` per target id. Add `peToSubnet` / `peToNic` when those ids exist on the PE resource (`properties.subnet.id`, `properties.networkInterfaces`).
4. Hosted expander/builder: same cardinality. Replace “first only” helpers with “all” helpers in own methods; keep first-key flatten for compatibility.
5. Tests:
   - Two ipconfigs → two subnet association rows (different subnets).
   - VM with two NIC ids → two `vmToNic`.
   - PE with two PLS connections → two `privateEndpointTarget`.
   - Missing `networkProfile` → no `vmToNic`, no throw.
6. Pester + C# tests on the files you touch.

## Acceptance criteria

- Existing single-NIC fixtures still produce one `nicToSubnet`.
- No ObservedFact for “VM is in VNet” here (that is **IE-RF-08** display inference).

## Constraints

- Do not add peering/NSG types (**IE-RF-05**).
- Compile: extractor tests csproj **or** Application.Tests if you also touch the materializer flatten keys. Prefer **not** mapping new graph edges until RF-07 unless a one-line association→edge pass-through already exists for `nicToSubnet`.

## Done when

Cardinality tests fail on master-style `[0]` flatteners and pass after.
