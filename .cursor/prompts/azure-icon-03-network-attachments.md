# AZI-03 — Network attachments

**Model:** GPT-5.6 Luna. Paste this file as the whole task. Do not implement AZI-04 in this session.

**Repo:** `c:\ArchLucid`

**Wave:** Azure icon coverage (**AZI**). **Depends on:** AZI-02 accepted, or the owner explicitly skipping AZI-02 after AZI-01. Start from that branch. Do not redo the named-service rows from AZI-02.

## Goal

Network resource types that appear beside a virtual network on a resource-group diagram draw the official Architecture Center icon for that type. Virtual network and network security group stay on the icons AZI already embedded.

## Why

Those cards currently share the teal network pictogram. The July 2026 zip has a separate mark for each type in the table. Private DNS zones do not, and must stay on the pictogram.

## Read first

- `.cursor/rules/Azure-Icon-Pack-Accepted.mdc`
- `ArchLucid.ArtifactSynthesis/Assets/AzureIcons/azure-icon-manifest.json`
- `ArchLucid.ArtifactSynthesis.Tests/AzureArchitectureIconCatalogTests.cs`

## What to build

1. Branch `azi/03-network-attachments` from the accepted AZI-02 branch, or from the accepted AZI-01 branch if the owner skipped AZI-02.
2. Copy only the SVGs named below out of `ArchLucid.ArtifactSynthesis/Assets/AzureIcons/Source/Azure_Public_Service_Icons.zip` into `Assets/AzureIcons/Svg/` under the short file name. Copy the bytes. Do not edit the artwork. Delete any temp extract. Do not stage the zip.
3. Add one manifest row per short file. Leave `kind` unset. If a listed zip path is missing, stop and report it. Do not substitute a file whose name contains `Classic`, `Hub`, `Manager`, or `Policy` unless the table names that file.

| ARM type | Zip entry under `Azure_Public_Service_Icons/Icons/` | Short file | Service | Category |
|----------|------------------------------------------------------|------------|---------|----------|
| `Microsoft.Network/networkInterfaces` | `networking/10080-icon-service-Network-Interfaces.svg` | `network-interface.svg` | Network Interfaces | networking |
| `Microsoft.Network/publicIPAddresses` | `networking/10069-icon-service-Public-IP-Addresses.svg` | `public-ip.svg` | Public IP Addresses | networking |
| `Microsoft.Network/loadBalancers` | `networking/10062-icon-service-Load-Balancers.svg` | `load-balancer.svg` | Load Balancers | networking |
| `Microsoft.Network/privateEndpoints` | `other/02579-icon-service-Private-Endpoints.svg` | `private-endpoint.svg` | Private Endpoints | networking |
| `Microsoft.Network/routeTables` | `networking/10082-icon-service-Route-Tables.svg` | `route-table.svg` | Route Tables | networking |
| `Microsoft.Network/virtualNetworks/subnets` | `networking/02742-icon-service-Subnet.svg` | `subnet.svg` | Subnet | networking |
| `Microsoft.Network/applicationGateways` | `networking/10076-icon-service-Application-Gateways.svg` | `application-gateway.svg` | Application Gateways | networking |
| `Microsoft.Network/bastionHosts` | `networking/02422-icon-service-Bastions.svg` | `bastion.svg` | Bastions | networking |
| `Microsoft.Network/azureFirewalls` | `networking/10084-icon-service-Firewalls.svg` | `firewall.svg` | Firewalls | networking |
| `Microsoft.Network/natGateways` | `networking/10310-icon-service-NAT.svg` | `nat-gateway.svg` | NAT | networking |
| `Microsoft.Network/dnszones` | `networking/10064-icon-service-DNS-Zones.svg` | `dns-zone.svg` | DNS Zones | networking |
| `Microsoft.Network/virtualNetworkGateways` | `networking/10063-icon-service-Virtual-Network-Gateways.svg` | `virtual-network-gateway.svg` | Virtual Network Gateways | networking |
| `Microsoft.Network/localNetworkGateways` | `networking/10077-icon-service-Local-Network-Gateways.svg` | `local-network-gateway.svg` | Local Network Gateways | networking |
| `Microsoft.Network/expressRouteCircuits` | `networking/10079-icon-service-ExpressRoute-Circuits.svg` | `expressroute.svg` | ExpressRoute Circuits | networking |
| `Microsoft.Network/applicationSecurityGroups` | `security/10244-icon-service-Application-Security-Groups.svg` | `application-security-group.svg` | Application Security Groups | networking |
| `Microsoft.Network/publicIPPrefixes` | `networking/10372-icon-service-Public-IP-Prefixes.svg` | `public-ip-prefix.svg` | Public IP Prefixes | networking |
| `Microsoft.Network/networkWatchers` | `networking/10066-icon-service-Network-Watcher.svg` | `network-watcher.svg` | Network Watcher | networking |
| `Microsoft.Network/ddosProtectionPlans` | `networking/10072-icon-service-DDoS-Protection-Plans.svg` | `ddos-protection-plan.svg` | DDoS Protection Plans | networking |

Leave these unmapped:

- `Microsoft.Network/privateDnsZones`
- `Microsoft.Network/networkSecurityGroups/securityRules` and any other child rule or route entry
- Firewall Policy, Firewall Manager, and Application Gateway Containers. Those files are different products from the rows above.

4. The existing virtual-network and network-security-group rows stay as they are.
5. Add a catalog resolve test for every ARM type in the table. Add one renderer test: a load balancer emits `class="azure-icon"` and `data-file="Svg/load-balancer.svg"`. `Microsoft.Network/privateDnsZones` still resolves to null and a node of that type still emits `class="pictogram"`.
6. Do not change `Resolve`.

## Acceptance criteria

- Each ARM type in the table resolves to the service name in the table.
- `Microsoft.Network/virtualNetworks` is still Virtual Networks. `Microsoft.Network/networkSecurityGroups` is still Network Security Groups.
- `Microsoft.Network/privateDnsZones` is null.
- Rendered SVG has no `data:image/png` and no `https://` image href.
- A network inventory fixture still contains `class="subscription-frame"`.

## Constraints

- Before editing any tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. If it exits 2, stop and report the blocked path.
- Do not download icons. Do not clone a GitHub icon mirror. Do not restore `*.png`.
- Do not use an Azure icon to represent a child record that has no icon of its own.
- Do not change subscription-frame rules, data-flow placement, edge ink, or outline structure.
- Working-tree safety. Stage only the new SVGs, the manifest, and the tests. **No `git add -A`.** Do not stage the zip.
- **Do not commit.**

## Verification

```powershell
dotnet test ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj --filter FullyQualifiedName~AzureArchitectureIcon
.\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.ArtifactSynthesis/ArchLucid.ArtifactSynthesis.csproj'
```

Heartbeat every 8s on the compile. One compile, plus one retry if it exits 1.

## Done when

Tests pass. Tell the owner to restart the API and look at a network interface, a public IP, a load balancer, and a private endpoint. Each should show its own official mark. A private DNS zone, if present, should still be the teal network pictogram. Wait for that look before any commit.
