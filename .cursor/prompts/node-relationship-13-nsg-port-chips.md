# NR-13 — NSG rules as protocol and port, not a card

**Model:** GPT-5.6 Luna. Paste this file as the whole task.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/INVENTORY_DIAGRAM_NODE_RELATIONSHIP_LUNA_PROMPTS.md`

**Depends on:** NR-09. Do not re-run NR-01 through NR-12. Do not change the NR-08 data-flow annotations.

## Goal

On Full subscription and Network, a network security group is not a card. The inbound allow rules that matter are protocol and port chips on the visible owner the NSG already attaches to. An NSG with no visible owner is named in the outline and is still not a card.

## Why

`TryPromoteNsgNode` in `InventoryDiagramNodeRelationshipApplier` removes the NSG node when `AzureInventoryNsgAssociationParser` resolves a visible endpoint, and it does not paint the rules. `AzureInventoryNsgSecurityRuleParser` has already parsed `Protocol`, `DestinationPortRange`, `Direction`, `Access`, and `SourceAddressPrefix`. When no endpoint resolves, the NSG stays a card with `IsUnresolvedPolicyOutlineOnly`. NR-08 annotates data-flow connectors and explicitly leaves inventory policy edges alone. This session is the inventory plate.

## Chips

For each NSG whose association resolves to a visible owner (the endpoint `TryPromoteNsgNode` already walks: subnet owner or NIC owner), take `AzureInventoryNsgSecurityRule` rows where `Access` is `Allow` and `Direction` is `Inbound`.

Sort by `Priority` ascending, numeric, then `RuleName` ordinal. Skip a rule whose `Priority` is not an integer.

Chip text, one rule: `in {port}/{protocol} · {source}`.

- `{port}` is `DestinationPortRange`. When it is `*`, print `any`.
- `{protocol}` is `Protocol` uppercased. When it is `*`, print `any`.
- `{source}` is `SourceAddressPrefix`. When that is empty, use the first `SourceAddressPrefixes` entry. When the prefix is `*` or `Internet` or `0.0.0.0/0`, print `Internet`.

Show at most three chips, then one chip `+{rest}`. The rest count is the allow-inbound rules not shown.

A chip is risky when `{source}` prints `Internet` and the port is `3389`, `22`, or `any`. Risky chips use class `nsg-rule-chip-risk`. The others use `nsg-rule-chip`.

Paint the chips on the visible owner card, under the existing label, in `DiagramForestNodeSvgEmitter`. When the only resolved owner is a frame and not a card, paint them in that frame's title band. Do not add an NSG icon.

## No card

`TryPromoteNsgNode` removes the NSG node even when `emittedEdgeCount` is 0. Do not set `IsUnresolvedPolicyOutlineOnly` to keep the card.

An NSG with no visible owner gets one mermaid ledger comment the outline already knows how to list, reason `nsg-unattached`, from the NSG node id, to empty. The outline drop-gate disclosure shows `Unattached NSG` and the NSG name. No card, no route, no tab.

Outbound rules and deny rules are not chips. They stay on the graph for NR-08.

## Tests

1. An NSG associated with a subnet whose virtual machine is on the plate emits no NSG card. The virtual machine's SVG contains `in 443/TCP · Internet` when that is the parsed allow-inbound rule.
2. Four allow-inbound rules produce three chips and `+1`.
3. An allow-inbound rule for TCP 3389 from `*` uses `nsg-rule-chip-risk`. An allow-inbound rule for TCP 443 from `VirtualNetwork` uses `nsg-rule-chip`.
4. An NSG with no subnet and no NIC association emits no card. The outline lists `Unattached NSG` and the NSG name.
5. A data-flow diagram still has no NSG node, and an NR-08 `TCP 443` connector annotation is unchanged.

## Acceptance criteria

- Full subscription and Network show no network security group card.
- The visible owner shows at most three inbound allow chips and a remainder count.
- Internet RDP, Internet SSH, and Internet any-port are the risky chips.
- An unattached NSG is a ledger row.
- Data-flow annotations from NR-08 are unchanged.

## Constraints

- Before editing any tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. If it exits 2, stop and report the blocked path.
- Compile once: `.\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj'`
- Run the NSG promotion tests and the new chip tests.
- Do not commit. Do not edit unrelated dirty files.
- Do not collect flow logs. Do not add an icon pack. Do not change VNet packing.

## Done when

A reviewer reads `in 443/TCP · Internet` on the workload the NSG protects, and no NSG card is on the plate.
