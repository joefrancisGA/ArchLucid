# NR-19 — One checkbox shows the four network attachment types

**Model:** Composer 2.5 (`composer-2.5`). Paste this file as the whole task. Do not use a fast-tier model. Do not implement NR-20 in this session.

**Repo:** `c:\ArchLucid`

**Depends on:** NR-18. Do not re-run NR-01 through NR-18. Do not edit the NR index.

## Goal

On Full subscription, public IPs, network security groups, route tables, and private endpoints stay off the plate until the reader checks **Show network details**. Network interfaces and subnets stay off. A resource-group view shows all of them.

## Why

Those four types are evidence for connectivity. On a full subscription they crowd the plate. The page already has a separate **Show private endpoints** checkbox (`includePrivateEndpoints` in `DiagramsWorkbenchClient`). The owner wants one checkbox for all four types.

Network interfaces and subnets are analysis inputs. They are cards only on `DiagramMode.ResourceGroup`.

## What to build

On `DiagramMode.FullSubscription`:

- Default: omit `Microsoft.Network/publicIPAddresses`, `Microsoft.Network/networkSecurityGroups`, `Microsoft.Network/routeTables`, and `Microsoft.Network/privateEndpoints`.
- **Show network details** checked: include those four types.
- Never include `Microsoft.Network/networkInterfaces` or `Microsoft.Network/virtualNetworks/subnets` on Full subscription, whether or not the checkbox is on.

On `DiagramMode.ResourceGroup`, show network interfaces, subnets, and the four types. Do not add the checkbox there.

Replace **Show private endpoints** with **Show network details** on the Full subscription toolbar. One control. Checking it must not leave a second private-endpoint checkbox.

Persist the choice in the diagrams URL with one parameter, `includeNetworkDetails`. Stop writing `includePrivateEndpoints` for this control. Read an old `includePrivateEndpoints=1` URL as the new checkbox on, so an existing link does not silently hide private endpoints while the reader thinks the old control is still there.

Do not change Executive, Architecture, Network, Security, Data flow, or AVD visibility in this session.

Do not draw replacement lines for the hidden cards here. NR-20 does that. A hidden card's stored edges may disappear with the card until NR-20.

## Tests

1. Full subscription, checkbox off: none of the four types are nodes. Network interfaces and subnets are not nodes.
2. Full subscription, checkbox on: the four types are nodes. Network interfaces and subnets are still not nodes.
3. Resource group: a network interface, a subnet, a public IP, a network security group, a route table, and a private endpoint are nodes, with no checkbox required.
4. The Full subscription toolbar has **Show network details** and does not have **Show private endpoints**.
5. A URL with `includePrivateEndpoints=1` and no `includeNetworkDetails` opens Full subscription with the new checkbox on.

## Acceptance criteria

- Full subscription hides the four types until one checkbox is on.
- Network interfaces and subnets appear on the resource-group view only.
- The old private-endpoint checkbox is gone from Full subscription.

## Constraints

- Before editing any tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. If it exits 2, stop and report the blocked path.
- Compile once: `.\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj'`
- Run the new visibility tests and the diagrams workbench test that covers the private-endpoint checkbox.
- Do not commit. Do not edit unrelated dirty files.
- One class per file. No `ConfigureAwait(false)` in tests.
- A blank line before `if` and `foreach` unless it is the first line in the method.
- Prefer concrete types over `var`.

## Done when

Full subscription shows public IPs, network security groups, route tables, and private endpoints only after **Show network details** is checked, and a resource-group view still shows the network interfaces and subnets.
