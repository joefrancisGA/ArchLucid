# NR-23 — A default route draws through the next hop

**Model:** Composer 2.5 (`composer-2.5`). Paste this file as the whole task. Do not use a fast-tier model. Do not implement NR-24 in this session.

**Repo:** `c:\ArchLucid`

**Depends on:** NR-02, NR-10, and NR-20. Do not re-run NR-01 through NR-22. Do not edit the NR index.

## Goal

A stored default route (`0.0.0.0/0`) whose next hop is a visible firewall, network virtual appliance, or VPN gateway draws the workload's outbound line through that resource, labeled **Routed through {name}**. Every other route stays in the outline. Route table names, prefixes, and system routes are never shown.

## Why

Route tables are hidden on Full subscription unless **Show network details** is on. A default route to a firewall is the one route a reader needs on the plate. The other routes are easy to misread, so they stay as sentences.

## What to build

Read stored routes only. Do not invent a route from a resource group.

When the address prefix is `0.0.0.0/0` and the next hop resolves to a firewall, network virtual appliance, or VPN gateway that is on the diagram:

- Draw one line from the workload that the route table is stored against to that next hop.
- Label it **Routed through {name}**, using the next hop's resource name.
- If NR-20 already drew a generic line for this same path, replace that line. Do not draw both.

Outline only, including when the route table card is hidden:

- A more specific prefix whose next hop resolves: `Traffic to {range} goes through {name}`.
- Next hop Internet: `Outbound internet is sent directly`.
- Next hop None: `Traffic to {range} is dropped`.
- A next hop that does not resolve: the existing sentence `route next hop does not resolve`.

Never put a route table name, a prefix list, or a system route on a card or a line. With **Show network details** on, the route table may be a card, and the default-route line is still **Routed through {name}**. Do not label that line with the route table name.

A default route whose next hop is not a firewall, network virtual appliance, or VPN gateway does not get this line. Use the outline sentences above.

## Tests

1. A subnet route table sends `0.0.0.0/0` to a firewall that is on the diagram. Full subscription hides the route table and the subnet. The virtual machine has one line to the firewall labeled `Routed through {firewall name}`.
2. A route for `10.20.0.0/16` to that firewall is not a line. The outline says `Traffic to 10.20.0.0/16 goes through {firewall name}`.
3. Next hop Internet produces `Outbound internet is sent directly` and no line.
4. Next hop None produces `Traffic to {range} is dropped` and no line.
5. An unknown next hop keeps `route next hop does not resolve`.
6. No card or line contains the route table name.

## Acceptance criteria

- Only a default route to a visible firewall, network virtual appliance, or VPN gateway becomes a line.
- The label is **Routed through {name}**.
- Other routes are outline sentences, and the route table's own name is absent.

## Constraints

- Before editing any tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. If it exits 2, stop and report the blocked path.
- Compile once: `.\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj'`
- Run the new route tests.
- Do not commit. Do not edit unrelated dirty files.
- One class per file. No `ConfigureAwait(false)` in tests.
- A blank line before `if` and `foreach` unless it is the first line in the method.
- Prefer concrete types over `var`.

## Done when

A default route to a firewall is a named line on the plate, and every other route is one outline sentence without the route table's name.
