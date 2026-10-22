# NR-07 — Represent every data-flow hop

**Model:** GPT-5.6 Luna. Paste this file as the whole task. Do not implement NR-08 in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/INVENTORY_DIAGRAM_NODE_RELATIONSHIP_LUNA_PROMPTS.md`

**Depends on:** NR-04.

## Goal

Include every resource that traffic actually traverses on the data-flow diagram, in traversal order. A resource that only permits, denies, monitors, or configures traffic annotates a flow later; it is not a hop in this session.

## Required hops

Include a resource when a cited path shows a packet or request can pass through it:

- **Front Door:** entry point, routes, custom domains, and backend origins.
- **Application Gateway:** listeners, backend pools, and backend application components.
- **Azure Firewall:** the firewall and the networks whose routes send traffic through it.
- **Load balancer:** when it sits between a client, gateway, firewall, or service and a backend.
- **NAT Gateway, VPN Gateway, ExpressRoute Gateway, and network virtual appliances:** when a proven route uses them as the next hop.
- **Private endpoints and Private Link services:** when they are the path to a PaaS resource such as storage, SQL, Key Vault, or Redis.

A cited Front Door origin, Application Gateway backend, firewall route, load-balancer backend, or route-table next hop is sufficient evidence.

## Ordering

Represent the proven path in traversal order. For example: client → Front Door → Application Gateway → firewall or load balancer → application → private endpoint → data service. Do not reorder hops for visual grouping.

## Exclude as hops

NSGs, network security perimeters, and diagnostic settings do not become nodes on this diagram. NR-08 owns NSG annotations. A firewall remains a hop because traffic is forwarded through it.

AVD-only internals remain excluded by NR-06.

## What to build

Add a data-flow hop projector. It consumes cited traversal relationships and emits the ordered path. A path with an unresolved intermediate hop ends at the last proven hop and records the missing hop. It does not jump over the gap.

## Tests

1. Front Door, Application Gateway, and firewall all appear when each has a cited place in the same path.
2. Their order follows the cited traversal order.
3. A load balancer with a cited backend appears between its inbound hop and that backend.
4. A private endpoint appears between its consumer and the PaaS resource.
5. An NSG on the same path creates no data-flow node.
6. A missing intermediate hop does not create a direct edge across the gap.

## Acceptance criteria

- Every included node can name the cited evidence that makes it a traversal hop.
- Firewall is included as a hop.
- NSGs are not included as hops.
- Unresolved gaps remain visible.
- No protocol or port annotation work in this session.

## Constraints

- Before editing any tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. If it exits 2, stop and report the blocked path.
- Compile once with `.\scripts\ci\agent-compile-check.ps1` on the affected test project.
- Do not commit. Do not edit unrelated dirty files.
- One class per file. No `ConfigureAwait(false)` in tests.

## Done when

A reviewer can follow a request through Front Door, Application Gateway, firewall, load balancing, and Private Link in the order traffic traverses them.
