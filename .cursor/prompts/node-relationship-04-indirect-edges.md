# NR-04 — Proven indirect relationships

**Model:** GPT-5.6 Luna. Paste this file as the whole task. Do not implement NR-05 in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/INVENTORY_DIAGRAM_NODE_RELATIONSHIP_LUNA_PROMPTS.md`

**Depends on:** NR-03.

## Goal

Resolve indirect relationships for the resource categories below from cited evidence. Label every emitted edge **Current**, **Configured**, **Observed**, or **Derived**. Leave a resource unconnected when no cited relationship exists.

## Evidence labels

- **Current:** active Azure metadata or an ARM reference proves it now.
- **Configured:** IaC declares it, without current deployment confirmation.
- **Observed:** logs or telemetry saw it, without proof it remains current.
- **Derived:** a cited chain proves it, such as a VM reaching a subnet through its NIC.

IaC and logs cannot be relabeled **Current**.

## Categories

- **key vaults:** access policies, RBAC assignments, private endpoints, and cited secret or key references.
- **storage accounts:** private endpoints, managed identities, diagnostic settings, mounts, and cited application configuration.
- **registries:** cited image references and identity permissions from container apps, Kubernetes clusters, VM scale sets, and image builds.
- **private link scopes:** the Azure Monitor scope and its VNet private-link configuration.
- **networksecurityperimeters:** explicit profile membership and resource associations.
- **netgateways:** the VNet, local network gateway, and connection endpoints. A gateway with neither VNet nor connection is incomplete data.
- **load balancer:** frontend IP, backend pool members, NAT rules, and probes. Backend membership is the primary relationship.
- **bastionhosts:** subnet and target VNet. Label this management access, not application data flow.
- **azurefirewalls:** VNet or Virtual WAN hub, firewall policy, and networks whose routes use the firewall as next hop.
- **virtual machine:** NIC, subnet, disks, extensions, identities, and load-balancer backends. Resource-group membership alone is not an application connection.
- **VM scale sets:** the VM evidence plus image, registry, and autoscale references.
- **Kubernetes cluster:** node pools, VNet, load balancer, registry, Key Vault, and cited services. Cluster namespaces remain children.
- **mysql** and **redis cache:** private endpoints, access policy, VNet rules, and cited application references.
- **Grafana:** Azure Monitor workspace, data sources, and cited identity or private-network configuration.
- **Fabric Capacity:** workspaces, managed private endpoints, and resources assigned to consume the capacity.
- **staticsites:** linked Functions, APIs, identity providers, and custom domains when explicitly referenced.
- **Hostpools:** application group, workspace, session hosts, and VNet. This is a desktop-delivery boundary. NR-06 decides where it is displayed.

## What to build

Add one indirect-edge resolver. Every edge names its evidence source and one of the four labels. A derived edge must retain the intermediate cited hops that justify it.

Do not infer a consumer from collocation, naming similarity, or the existence of a single resource of a compatible type. A resource with no cited optional relationship stays unconnected and valid.

## Tests

1. A VM, NIC, and subnet chain emits a **Derived** VM-to-subnet relationship that cites the NIC hop.
2. A Key Vault private endpoint emits a **Current** edge.
3. An IaC-only storage mount emits a **Configured** edge.
4. A log-only Redis call emits an **Observed** edge.
5. A storage account with no cited reference remains unconnected.
6. Same-resource-group collocation does not emit an edge.

## Acceptance criteria

- All four evidence labels can be traced to their source.
- No name or collocation inference enters the graph.
- An unconnected valid resource is preserved.
- No orphan classification or AVD filtering in this session.

## Constraints

- Before editing any tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. If it exits 2, stop and report the blocked path.
- Compile once with `.\scripts\ci\agent-compile-check.ps1` on the affected test project.
- Do not commit. Do not edit unrelated dirty files.
- One class per file. No `ConfigureAwait(false)` in tests.

## Done when

A reviewer can trace each indirect edge to cited evidence and can distinguish an unconnected resource from an unresolved one.
