# NR-27 — A resource outside the snapshot is one shared card

**Model:** Composer 2.5 (`composer-2.5`). Paste this file as the whole task. Do not use a fast-tier model. Do not implement NR-28 in this session.

**Repo:** `c:\ArchLucid`

**Depends on:** NR-24, NR-25, and NR-26. Do not re-run NR-01 through NR-26. Do not edit the NR index.

## Goal

A stored link whose other end is not in the snapshot draws a line to one small card, **Outside this subscription: {name}**. Every link to that same resource shares the card.

## Why

Hub-and-spoke designs peer to a virtual network in another subscription, and a private endpoint can target a service that was not collected. Without a card, the spoke looks isolated.

## What to build

Use the target ARM ids that NR-24, NR-25, and NR-26 left unresolved, plus any other stored diagram edge whose target id is not a snapshot node.

- Create one diagram node per distinct target ARM id.
- The card title is `Outside this subscription: {name}`. Take `{name}` from the last ARM segment. Do not invent a resource group or a type beyond what the id already contains.
- Draw the same line the in-snapshot case would draw: **Private access**, **Sends traffic to**, or **Peered**.
- Two resources that point at the same ARM id share one card.
- The card is Connected because it has a cited line.

Do not draw this card for a peering that is not Connected. NR-26 owns that outline sentence.

Do not draw this card for an unattached public IP or for a route whose next hop does not resolve. Those stay on their existing outline sentences.

Do not query Azure for the missing resource.

## Tests

1. A Connected peering names a virtual network ARM id that is not in the snapshot. The diagram has one card `Outside this subscription: {name}` and one **Peered** line.
2. Two spokes peer to that same ARM id. There is one outside card and two lines.
3. A private endpoint targets a storage account that is not in the snapshot. The line is **Private access** to one outside card.
4. A Disconnected peering to a missing virtual network does not create an outside card.
5. An unresolved route next hop does not create an outside card.

## Acceptance criteria

- Missing stored targets become one shared outside card.
- The line label is the label already defined for that relationship.
- Unconnected peerings and unresolved routes do not become cards.

## Constraints

- Before editing any tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. If it exits 2, stop and report the blocked path.
- Compile once: `.\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj'`
- Run the new outside-card tests.
- Do not commit. Do not edit unrelated dirty files.
- One class per file. No `ConfigureAwait(false)` in tests.
- A blank line before `if` and `foreach` unless it is the first line in the method.
- Prefer concrete types over `var`.

## Done when

A stored link that leaves the snapshot is visible as one shared **Outside this subscription** card, and a disconnected peering is not.
