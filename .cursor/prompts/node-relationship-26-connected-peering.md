# NR-26 — Only a connected peering is a line

**Model:** Composer 2.5 (`composer-2.5`). Paste this file as the whole task. Do not use a fast-tier model. Do not implement NR-27 in this session.

**Repo:** `c:\ArchLucid`

**Depends on:** NR-20. Do not re-run NR-01 through NR-25. Do not edit the NR index.

## Goal

Two virtual networks on the plate with a stored peering in state Connected get one line labeled **Peered**. Any other peering state is outline only: `Peering to {name} is not connected`.

## Why

Azure stores a peering on each virtual network, including Disconnected and Initiated. Drawing those makes a failed peering look like a path.

## What to build

When both virtual networks are diagram nodes and the stored peering state is Connected:

- Draw one line between them, not two.
- Label it **Peered**.
- A peering recorded on both ends is still one line.

When the state is anything else, including Disconnected and Initiated:

- Draw no line.
- Add the outline sentence `Peering to {name} is not connected`, using the remote virtual network's name.

A Connected peering whose remote virtual network is not in the snapshot does not get a card in this session. Keep the remote ARM id for NR-27. Do not use the outline sentence for that case, because the remote was not refused. It is outside the snapshot.

Do not infer peering from a shared name or a shared resource group.

## Tests

1. Two virtual networks with peering state Connected produce one line labeled `Peered`.
2. The same pair recorded from both ends is still one line.
3. State Disconnected produces no line and the outline `Peering to {name} is not connected`.
4. State Initiated does the same.
5. Two virtual networks in one resource group with no peering resource produce no line.

## Acceptance criteria

- Connected peering is one **Peered** line.
- Every other state is the outline sentence and no line.
- A missing remote virtual network is left for NR-27.

## Constraints

- Before editing any tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. If it exits 2, stop and report the blocked path.
- Compile once: `.\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj'`
- Run the new peering tests.
- Do not commit. Do not edit unrelated dirty files.
- One class per file. No `ConfigureAwait(false)` in tests.
- A blank line before `if` and `foreach` unless it is the first line in the method.
- Prefer concrete types over `var`.

## Done when

A Connected peering is a single **Peered** line, and a peering that is not connected is only an outline sentence.
