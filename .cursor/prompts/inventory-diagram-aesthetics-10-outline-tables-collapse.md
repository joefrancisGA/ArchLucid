# IDA-10 — Collapse Nodes and Edges tables so the canvas is the hero

**Wave:** inventory-diagram-aesthetics (**IDA**). **Depends on:** none (UI-only). May parallel IDA-01–09. **Do not** implement camera/fit (IDA-11), forest SVG, or IDA-12.

Do not implement from the wave index. Implement only *What to build*.

## Goal

On Inventory diagrams, the **Nodes** and **Edges** outline tables are **collapsed by default** behind disclosure buttons (`aria-expanded`). The diagram viewport is the dominant surface. Operators can expand either table; the choice may persist in `sessionStorage` keyed per page (not per snapshot) as `infra-diagrams-outline-nodes-open` / `…-edges-open`. Seed-picker outline (dependency neighborhood awaiting seed) stays **open** — that table *is* the job.

## Why

Owner screenshot: ~450 px canvas then many screens of tables. The outline is reference material; Carbon puts secondary content in disclosure. `InfraEvidenceDiagramOutline` always paints both headings + full tables. `ArchitectureDiagramViewer` camera is `max-h-[36rem]` — do **not** hide workspace tabs to “make room.”

## Context

- `archlucid-ui/src/components/infra-evidence/InfraEvidenceDiagramOutline.tsx` — `h3` Nodes / Edges, `data-testid="infra-diagrams-mermaid-outline"`
- `archlucid-ui/src/app/(operator)/governance/infrastructure/diagrams/DiagramsWorkbenchClient.tsx` — three mounts: seed catalog, too-large fallback, main canvas
- `archlucid-ui/src/components/infra-evidence/InfraEvidenceDiagramOutline.test.tsx`
- `archlucid-ui/src/lib/governance/governance-infrastructure-copy.ts` — add disclosure labels if needed (`Show nodes`, `Hide nodes`) sentence case
- No shadcn `accordion.tsx` in repo — use `<button aria-expanded>` + conditionally rendered tables, **or** native `<details>`/`<summary>`. Prefer `details/summary` for no-JS-open semantics, styled to match operator headings. Visible-boundary: summary is not a `ghost` Button. If using `Button`, `variant="outline"` only.

Do **not** remove columns, sort, or neighborhood actions. When Nodes is open and `onFocusNeighborhood` is set, keep the existing hint.

## What to build

1. `InfraEvidenceDiagramOutline` props:
   - `defaultNodesOpen?: boolean` (default `false`)
   - `defaultEdgesOpen?: boolean` (default `false`)
   - Seed catalog call site passes `defaultNodesOpen={true}` and may hide Edges if the seed outline has no edges — if edges array empty, omit the Edges disclosure.

2. Each section: heading row is the disclosure control. Count in the label: `Nodes (11)` / `Edges (6)` using outline lengths. `aria-controls` + unique ids.

3. Persistence: on toggle, write sessionStorage. On mount, read it if present (overrides default). Guard `window` for SSR (`useEffect`). Tests: mock storage or skip persistence in jsdom with a helper.

4. Workbench:
   - Main canvas outline: defaults collapsed.
   - `tooLargeForBrowser` outline: **open** (the table is the only map when the canvas is skipped) — pass `defaultNodesOpen={true}` `defaultEdgesOpen={true}`.
   - Seed catalog: nodes open.

5. Optional: raise main viewer `max-h-[36rem]` to `max-h-[42rem]` **only** in `ArchitectureDiagramViewer.tsx` inventory workbench usage if that prop is already passed in — do not change review-detail diagrams. If the class is hardcoded inside the viewer, add an optional `cameraMaxHeightClassName` override prop defaulting to `max-h-[36rem]` and pass `max-h-[42rem]` from `DiagramsWorkbenchClient` only. Do not fight IDA-11.

6. Tests:
   - Default render: tables not visible (`toBeNull` or `not.toBeVisible`); buttons show `Nodes (` count.
   - Click Nodes: table appears; `aria-expanded="true"`.
   - Seed / explicit default open: table visible without click.
   - Existing sort and focus-neighborhood tests run with `{ defaultNodesOpen: true }`.

## Acceptance criteria

- Inventory diagrams workbench: canvas first; outline collapsed with counts.
- Dependency seed picker still shows the node list immediately.
- Too-large Mermaid fallback still shows the outline.
- No desktop review tab collapse.

## Constraints

- Working-tree safety: `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path <file>` before editing a tracked file. Exit 2 → skip and report.
- **Do not** use `Button variant="ghost"` or `link`. Sentence case. No GTM / TB-135 / TB-136.
- Verification: `cd archlucid-ui && npx vitest run src/components/infra-evidence/InfraEvidenceDiagramOutline.test.tsx src/app/(operator)/governance/infrastructure/diagrams/DiagramsWorkbenchClient.test.tsx` (if the workbench test file exists; otherwise outline tests + any workbench test that renders the outline). Heartbeat `STILL EXECUTING... HH:mm:ss` every 8s if >15s. No full-solution build / no `next dev`.
