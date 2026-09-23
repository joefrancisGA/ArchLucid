# DRR-05 — Outline section counts and within-section sort

**Wave:** diagram regression repair (**DRR**). **Depends on:** trunk. **Parallel with DRR-01.** UI only. Do not edit the forest renderer.

Do not implement from the wave index. Implement only *What to build*.

## Goal

Connected and Unconnected stay as two sections. Header counts describe the whole outline. Column sort orders the rows inside the section that is being sorted. The sort test checks the first data row again.

## Why

`InfraEvidenceDiagramOutline` slices `nodeRows` to 200, then classifies that slice with `edge.from` / `edge.to`. A node past the slice can be connected in the diagram and still absent from the Connected count. The Connected header is the slice count, while the disclosure uses `outline.nodes.length`. After #3587, `sorts node rows when a column heading is clicked` only asserts that `app-storage` or `core-vnet` appears in some row, so a frozen order still passes.

## Context

- `archlucid-ui/src/components/infra-evidence/InfraEvidenceDiagramOutline.tsx` — `nodeRows`, `connectedNodeIds`, section header rows
- `archlucid-ui/src/components/infra-evidence/InfraEvidenceDiagramOutline.test.tsx` — `sorts node rows when a column heading is clicked` around the `getAllByRole("row").some(...)` assertions
- Edge endpoints and node ids already come from the same parser (`parse-infra-evidence-mermaid-outline.ts` sets `from: fromNode.id`). Do not change the parser.
- Keep the disclosure label’s full node count.

## What to build

1. Classify every `outline.nodes` entry against every `outline.edges` endpoint **before** any 200 cap.
   - Connected header count = full connected count.
   - Unconnected header count = full unconnected count.
   - Hide the Unconnected header when that full count is 0. Keep the Connected header even when its count is 0 and the unconnected count is greater than 0.

2. Sort the full connected list and the full unconnected list with the existing sort key and direction. Then take a prefix so the table shows at most 200 node data rows in total (headers do not count). Fill from the connected list first, then the unconnected list.

3. When `outline.nodes.length` is greater than the number of data rows shown, render one line under the table: `Showing {shown} of {outline.nodes.length} nodes.` Use a `data-testid="infra-diagrams-outline-nodes-truncated"`. Do not invent a second table.

4. Tests in `InfraEvidenceDiagramOutline.test.tsx`:
   - Restore order assertions. Ignore section header rows (the row whose text starts with `Connected nodes` or `Unconnected nodes`). After each sort click, the first **data** row in the connected section contains the name the old test expected (`app-storage` or `core-vnet` as the test’s fixture sort dictates).
   - A fixture with 3 nodes and one edge: Connected count is 2 and Unconnected count is 1, including when a sort would have placed the orphan first in a single list.
   - A fixture with 201 nodes: the truncated line is present, the Connected count is the full connected total, and at most 200 data rows render.
   - Do not weaken assertions back to `.some(row => ...)`.

## Acceptance criteria

- Sorting changes which data row is first inside the connected section.
- Header counts match the full outline, not the visible prefix.
- Diagrams with 200 nodes or fewer show no truncation line.

## Constraints

- Working-tree safety: `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path <file>` before editing a tracked file. Exit 2 → skip and report.
- Do not remove the Connected / Unconnected split. Do not hide desktop review workspace tabs. Do not change forest SVG.
- Verification: from `archlucid-ui`, `npx vitest run src/components/infra-evidence/InfraEvidenceDiagramOutline.test.tsx`. Heartbeat `STILL EXECUTING... HH:mm:ss` every 8s if >15s.
- No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**.
