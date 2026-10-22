# NR-24 — A hidden private endpoint is Private access

**Model:** Composer 2.5 (`composer-2.5`). Paste this file as the whole task. Do not use a fast-tier model. Do not implement NR-25 in this session.

**Repo:** `c:\ArchLucid`

**Depends on:** VN-10 and NR-19. Do not re-run VN-10 or NR-01 through NR-23. Do not edit the NR index.

## Goal

A hidden private endpoint draws one line from its virtual network to the target service, labeled **Private access**. The service stays outside the virtual network box.

## Why

VN-10 already draws that connector and labels it `private endpoint`. The owner wants the words **Private access**. The subnet is hidden, so the virtual network is the visible network end.

## What to build

Change the VN-10 hidden-private-endpoint connector label from `private endpoint` to **Private access**.

Keep the rest of VN-10:

- The line runs from the target service to the virtual network that contains the endpoint.
- The service is not a member of the virtual network frame.
- A visible private endpoint, when **Show network details** is on, stays a card in the virtual network. Do not also draw the **Private access** shortcut.
- Two private endpoints in two virtual networks produce two lines and one service card.
- The line is a cited edge, so the service is Connected.

If NR-20 also drew a generic line for the same pair, keep **Private access** and drop the generic line.

When the target service is not in the snapshot, do not invent a card. Leave the stored target id on the evidence for NR-27.

## Tests

1. Full subscription, checkbox off. A private endpoint in virtual network A targets a Key Vault. The diagram has one line labeled `Private access`. The Key Vault is not inside the virtual network frame.
2. Checkbox on. The private endpoint card is drawn. There is no **Private access** shortcut skipping it.
3. Update the existing VN-10 test that expects the label `private endpoint` so it expects `Private access`.

## Acceptance criteria

- The hidden connector says **Private access**.
- The service stays in its resource group.
- Showing the private endpoint card removes the shortcut.

## Constraints

- Before editing any tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. If it exits 2, stop and report the blocked path.
- Compile once: `.\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj'`
- Run `DiagramHiddenPrivateEndpointConnectorTests` and the new label test.
- Do not commit. Do not edit unrelated dirty files.
- One class per file. No `ConfigureAwait(false)` in tests.
- A blank line before `if` and `foreach` unless it is the first line in the method.
- Prefer concrete types over `var`.

## Done when

A hidden private endpoint reads **Private access** from the service to its virtual network, and the service is not drawn inside that virtual network.
