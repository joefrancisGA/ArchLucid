# NR-12 — Show the questions. Do not ask the reader to answer them

**Model:** GPT-5.6 Luna. Paste this file as the whole task.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/INVENTORY_DIAGRAM_NODE_RELATIONSHIP_LUNA_PROMPTS.md`

**Depends on:** NR-11. VN-35 owns the shared-services box. Do not re-run NR-01 through NR-11. Do not build that box in this session.

## Goal

An Unknown resource stays on the diagram. The outline says why it is unknown, in one sentence, under a notice that ArchLucid has questions. The reader is not given a form, a save button, or a step they must finish. Empty ledger sections disappear. The five state words become sentences a reviewer can read.

## Why

`InventoryDiagramOrphanedStateApplier` sets `ConnectionState` to Unknown when a visible node has no cited edge, the orphan classifier returns nothing, and `TryResolveUsedMessage` finds no hidden-subnet or effective-control hop. `InfraEvidenceDiagramOutline` then renders a section titled `Unknown nodes` with no reason. The same outline always renders `Used nodes` even when the count is 0. `DiagramNode.UnresolvedRelationshipDetails` already carries the unmatched facts, and the outline does not show them.

Used means the node has no drawn edge and a hidden hop still proves placement or a consumer (`hidden subnet placement` or `effective network control`). The word does not say that.

## What to build

### Questions, display only

In `InfraEvidenceDiagramOutline.tsx`, above the Unknown section, when that section is non-empty, render one paragraph:

`ArchLucid has a question about 1 resource.` when `n` is 1, and `ArchLucid has questions about {n} resources.` otherwise.

`data-testid="infra-diagrams-unknown-questions"`.

Under it, the existing Unknown table. Each row gains the node's reason:

- Join `UnresolvedRelationshipDetails` with a space when that list is non-empty.
- Otherwise: `No cited connection, and this type is not on the shared-service list.`

The parser already has to surface `UnresolvedRelationshipDetails` if the mermaid comment or node token does not carry them. Prefer the token the caption path already has. Do not invent a new collection.

No text input, no checkbox, no modal, no Save, no persistence, and no control that blocks the diagram. The plate renders whether or not the reader opens the outline.

A node whose ARM type is on the VN-35 catalog (`DiagramSharedServiceCatalog.IsSharedService`) is not Unknown. When it has no cited edge and is not Orphaned, the classifier returns Unconnected. If VN-35 has not landed and the catalog type does not exist, add the same six-type check beside the classifier in `ArchLucid.Core` and keep the two lists identical. Do not place the node in a new frame in this session.

### Section titles

Keep the enum values `Connected`, `Used`, `Orphaned`, `Unconnected`, and `Unknown`. Change only the words the outline and the card caption show. Put the outline strings in `governance-infrastructure-copy.ts`.

| Enum | Outline section | Card caption prefix |
| --- | --- | --- |
| Connected | Connected on the diagram | none, as today |
| Used | In use off the diagram | `In use off the diagram` |
| Orphaned | Missing a required link | `Missing a required link` |
| Unconnected | Stands alone | `Stands alone` |
| Unknown | Needs evidence | `Needs evidence` |

`DiagramNodeHumanCaptionFactory` prints the new prefix where it already prints `Used:`, `Orphaned:`, `Unconnected:`, and `Unknown`.

Do not render `InfraEvidenceDiagramOutlineNodeTable` for a state whose node list is empty. A subscription with no Used nodes does not show a zero row.

## Tests

1. A resource type outside the orphan rules, the unconnected allowlist, and the six shared-service types, with no cited edge, stays Unknown. The outline shows `ArchLucid has a question about 1 resource.` and the empty-detail sentence. There is no input and no button in that section.
2. The same resource with one `UnresolvedRelationshipDetails` entry shows that entry instead of the empty-detail sentence.
3. A `Microsoft.OperationalInsights/workspaces` node with no cited edge is Unconnected, and it is absent from the questions notice.
4. A virtual machine whose only proof is `InventoryHiddenSubnetVnetPlacement` is still the Used enum. The outline section title is `In use off the diagram`. The caption contains that phrase and `hidden subnet placement`.
5. A diagram whose nodes are all Connected renders no Used, Orphaned, Unconnected, or Unknown section.

## Acceptance criteria

- The diagram never waits on an answer.
- Every Unknown row states the missing evidence or the empty-detail sentence.
- The questions notice counts only Unknown nodes.
- A zero-count state is not on the page.
- The enum stored on the node is unchanged.

## Constraints

- Before editing any tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. If it exits 2, stop and report the blocked path.
- Compile once: `.\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.ArtifactSynthesis.Tests/ArchLucid.ArtifactSynthesis.Tests.csproj'`
- Run the connection-ledger tests and the outline test that covers these rows.
- Do not commit. Do not edit unrelated dirty files.
- Do not collect flow logs, metrics, or diagnostic settings. Do not add a route or a tab.
- Do not call Unknown an orphan. Do not build the shared-services frame.

## Done when

A reviewer can read why each Unknown resource is unknown, can ignore that list, and no longer sees a section that says zero Used nodes.
