# NR-02 — Route tables and NSGs become policy relationships

**Model:** GPT-5.6 Luna. Paste this file as the whole task. Do not implement NR-03 in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/INVENTORY_DIAGRAM_NODE_RELATIONSHIP_LUNA_PROMPTS.md`

**Depends on:** NR-01.

## Goal

Project each proven route and each proven NSG association as a relationship. Remove the route table or NSG as a floating node once its associations are emitted. Keep an unassociated policy as an unresolved relationship.

## Why

A route table is routing policy, and an NSG is filtering policy. Their useful meaning is the association and the rule, not a standalone card. This session emits those relationships. It does not annotate data-flow connectors; NR-08 owns that display.

## Categories

- **route tables:** each route associates a subnet with its next hop. The next hop may be a firewall, gateway, network virtual appliance, or internet.
- **network security groups:** each association attaches the NSG to a subnet or NIC. The NIC relationship must resolve to the compute or network resource that owns that NIC when that owner is proven.

## What to build

Add one classifier for these policy resources.

For every route whose subnet and next hop both resolve, emit an edge from the subnet to the next hop. Label it with the address prefix and next-hop type. Remove the route-table node only after at least one such edge exists.

For every NSG association to a resolved subnet or NIC, emit an attachment edge. Carry the rule set needed by NR-08: protocol, port range, direction, access, priority, and source and destination prefixes. Remove the NSG node only after at least one attachment exists.

A route or rule whose endpoint does not resolve stays an unresolved relationship. Do not draw it to an unrelated node.

## Tests

1. A route from a subnet to a resolved firewall emits one labeled edge and no route-table node.
2. A route whose next hop does not resolve keeps the route table unresolved.
3. An NSG attached to a subnet emits an attachment carrying protocol, port, direction, and access.
4. An NSG with no subnet or NIC association remains unresolved.
5. A route table is not placed as a data-flow hop.

## Acceptance criteria

- Endpoint resolution precedes node removal.
- NSG rule data is preserved for a later connector annotation.
- Unresolved routes and NSGs do not attach to a guessed node.
- No data-flow annotation or parent-property work in this session.

## Constraints

- Before editing any tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. If it exits 2, stop and report the blocked path.
- Compile once with `.\scripts\ci\agent-compile-check.ps1` on the affected test project.
- Do not commit. Do not edit unrelated dirty files.
- One class per file. No `ConfigureAwait(false)` in tests.

## Done when

Route and NSG policy are visible as cited relationships, and an unattached policy remains visible as unresolved.
