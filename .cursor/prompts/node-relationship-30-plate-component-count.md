# NR-30 — Connected components are what the plate shows

**Model:** Composer 2.5 (`composer-2.5`). Paste this file as the whole task. Do not use a fast-tier model. Do not implement NR-31 in this session.

**Repo:** `c:\ArchLucid`

**Depends on:** NR-20 and NR-29. Do not re-run NR-01 through NR-29. Do not edit the NR index.

## Goal

The connected-component number counts the visible plate. A solid line and a dashed **Likely** line both join resources. A line drawn through a hidden resource counts. A resource with no painted line is its own component.

## Why

`buildDiagramWalkthrough` counts Mermaid outline edges and includes singletons. `InfraEvidenceSnapshotMermaidService.BuildCompletenessSummary` counts the source graph with a different weight cutoff. The banner and the walkthrough can disagree, and the banner still sees network interfaces that are not on the plate.

The owner wants one number, checkable by eye. Dashed lines count. The dash and the outline question are the warning that a **Likely** line is unproven.

## What to build

Use the diagram the reader is looking at, after NR-19 hiding, NR-20 shortcuts, and NR-29 dashes.

- Join two visible nodes when a painted line exists between them, including a dashed **Likely** line.
- Do not join nodes for a layout-only `~~~` link.
- A visible node with no painted line is a component of one.
- Hidden network interfaces, subnets, and checkbox-hidden attachments are not nodes in this count.
- An **Outside this subscription** card is a visible node and counts.

`buildDiagramWalkthrough` and `InfraEvidenceCompletenessWarningsBanner` must show that same number for the open diagram. Do not leave the banner on `CountConnectedComponents` of the unfiltered snapshot graph.

Do not drop **Likely** lines from the count.

## Tests

1. Two visible resources and one dashed **Likely** line are one connected component. The walkthrough and the banner both say 1.
2. The same two resources with no line are two components.
3. A virtual machine and a virtual network joined only by an NR-20 line, with the network interface hidden, are one component. The hidden interface is not a third node.
4. A `~~~` layout link does not join two resources.
5. A third resource with no line makes the count 2 in the first case and does not disappear as a trivial singleton.

## Acceptance criteria

- The on-screen component count matches the painted lines, including **Likely**.
- The banner uses that count.
- Hidden resources are not extra components.

## Constraints

- Before editing any tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. If it exits 2, stop and report the blocked path.
- Compile once: `.\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj'`
- Run the walkthrough test, the outline component test, and the completeness banner test.
- Do not commit. Do not edit unrelated dirty files.
- One class per file. No `ConfigureAwait(false)` in tests.
- A blank line before `if` and `foreach` unless it is the first line in the method.
- Prefer concrete types over `var`.

## Done when

The component number on the page is the number of groups a reader can see, dashed lines included, and the banner shows that same number.
