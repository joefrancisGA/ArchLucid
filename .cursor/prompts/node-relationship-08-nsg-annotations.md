# NR-08 — Annotate connectors with NSG protocol and port

**Model:** GPT-5.6 Luna. Paste this file as the whole task.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/INVENTORY_DIAGRAM_NODE_RELATIONSHIP_LUNA_PROMPTS.md`

**Depends on:** NR-02 and NR-07.

## Goal

Keep NSGs off the data-flow diagram. Annotate each proven data-flow connector with the effective protocol and port permitted by the NSGs at both ends. Show blocked and asymmetric flows explicitly.

## Why

The useful NSG information on a data-flow diagram is the traffic that the specific flow allows. The NSG node and its full rule list obscure the path. NR-02 preserves the rule data on the NSG attachment.

## Effective annotation

For each proven connector, evaluate the source NIC or subnet NSG and the destination NIC or subnet NSG. Display the effective allowed result on the connector, such as **TCP 443**. When several rules contribute, show the effective result, not every rule.

The connector detail can identify the NSG name, rule name, priority, and whether the rule came from the subnet or NIC. That detail is available on demand; it is not another node.

## Direction and denial

Evaluate both directions. If either relevant side denies the flow, mark the connector **blocked**. If inbound and outbound permissions differ, show the two directions separately. Do not collapse an asymmetric result into one allowed label.

A connector with no applicable NSG has no protocol annotation. Do not invent a default allow or deny.

## What to build

Add one effective-rule reducer that takes the NR-02 attachments and the NR-07 connector. It returns the annotation, the blocked state, and the supporting rule references. The data-flow edge renderer displays the annotation on the connector.

Do not add an NSG node to the data-flow diagram. Do not change inventory policy edges emitted by NR-02.

## Tests

1. Matching source and destination allow rules for TCP 443 display **TCP 443**.
2. Several overlapping allow rules display one effective result and retain the supporting rule references.
3. A deny on either side marks the connector **blocked**.
4. Different inbound and outbound results produce two directional annotations.
5. A connector without an applicable NSG has no annotation.
6. The data-flow diagram still contains no NSG node.

## Acceptance criteria

- The connector states the effective protocol and port.
- Supporting rule identity remains available on demand.
- Denial and asymmetric direction are visible.
- NSGs remain off the data-flow hop path.
- No new topology inference in this session.

## Constraints

- Before editing any tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. If it exits 2, stop and report the blocked path.
- Compile once with `.\scripts\ci\agent-compile-check.ps1` on the affected test project.
- Do not commit. Do not edit unrelated dirty files.
- One class per file. No `ConfigureAwait(false)` in tests.

## Done when

A reviewer can read the effective protocol, port, and blocked state from the data-flow connector without an NSG node appearing on the path.
