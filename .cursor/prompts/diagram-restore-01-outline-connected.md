# DRS-01 — Outline: connected nodes, then unconnected nodes

**Wave:** Diagram restore (**DRS**). **Depends on:** branch `revert/diagram-icon-layout-3585-3592`. **Do not** implement DRS-02–04.

Do not implement from the wave index. Implement only *What to build*.

## Goal

On the Diagrams outline, list nodes that participate in an edge under **Connected nodes (N)**, then nodes with no edge under **Unconnected nodes (N)**. The diagram picture does not change.

## Why

This was the one piece of #3587 (`084b91e2d2`) that does not touch the canvas. #3587 also weakened sort tests to `.some(...)`, which no longer proved order. #3592 (`bfc0ca30e7`) put the order assertions back by skipping the section header rows. Take that test shape, not the weakened one.

## Context

- `archlucid-ui/src/components/infra-evidence/InfraEvidenceDiagramOutline.tsx`
- `archlucid-ui/src/components/infra-evidence/InfraEvidenceDiagramOutline.test.tsx`
- Reference only: `git show 084b91e2d2 -- archlucid-ui/src/components/infra-evidence/InfraEvidenceDiagramOutline.tsx`
- Reference only: `git show bfc0ca30e7 -- archlucid-ui/src/components/infra-evidence/InfraEvidenceDiagramOutline.test.tsx` (`getFirstConnectedDataRow`, `countNodeDataRows`)

## What to build

1. Branch `drs/01-outline-sections` from `revert/diagram-icon-layout-3585-3592`.
2. Split outline node rows into connected and unconnected using edge endpoints. Section header copy, sentence case: `Connected nodes (N)` and `Unconnected nodes (N)`. Omit the unconnected header when that count is 0.
3. Keep the 200-row cap. Count data rows only, not the section headers.
4. Sort tests must use the first **data** row inside the connected section (`getFirstConnectedDataRow`), not `getAllByRole("row")[1]` and not `.some(...)`.
5. Do not edit forest layout, SVG sanitizer, icon assets, edge colors, or `ArchitectureDiagramViewer.tsx`.

## Acceptance criteria

- Connected header, then those nodes, then the unconnected header, then those nodes.
- Clicking Node Name still changes which data row is first, in both directions.
- No file under `ArchLucid.ArtifactSynthesis/` changes.

## Constraints

- Working-tree safety before editing a tracked file. Exit 2 → skip and report.
- Stage only this prompt’s paths. **No `git add -A`.**
- **Do not commit.**

## Verification

```bash
npx vitest run src/components/infra-evidence/InfraEvidenceDiagramOutline.test.tsx
```

From `archlucid-ui/`.

## Done when

Tests pass. Stop and tell the owner: open Diagrams, confirm the outline sections, and confirm the picture matches the demo baseline. Wait for that look before DRS-02.
