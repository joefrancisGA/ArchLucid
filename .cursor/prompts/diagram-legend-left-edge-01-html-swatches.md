# DLE-01 — Left-edge swatches under Diagram legend

**Wave:** diagram-legend-left-edge (**DLE**). **Depends on:** IDA-02 (`rect.node-accent` + `FillFor`). **Do not** implement DLE-02, Microsoft icons, a second palette, or ARM-type classification in TypeScript.

Do not implement from the wave index. Implement only *What to build*.

## Goal

On `/governance/infrastructure/diagrams`, the card titled **Diagram legend** gains a **Left edge** group: a 4 px swatch plus one word for each category color **painted on this canvas**, plus one gloss that the color is category, not connection evidence.

## Why

Owner 2026-09-24: the legend explains solid vs dotted lines and never names the colored left edges. The on-canvas SVG legend is below the cropped viewport, so it does not answer the question while the reader is on this card.

Read the locked recommendation in `diagram-legend-left-edge-00-index.md` before choosing a layout. Swatches in this card. Not color-name bullets. Not all six kinds when some are absent.

## Context

- `archlucid-ui/src/components/infra-evidence/InfraEvidenceDiagramLegend.tsx` — today returns `null` unless a declared, probable, or inferred edge exists. Observed-only graphs (the owner screenshot is mostly solid "may access" / "connects") therefore have **no legend at all**.
- Call site: `DiagramsWorkbenchClient.tsx` passes `outline` and `mermaidSource` only. `displayLayoutSvg` is already in scope above `<ArchitectureDiagramViewer>`.
- Accent paint: `DiagramForestNodeSvgEmitter` emits `rect.node-accent` with `DiagramInventoryPictogramKindColors.FillFor`. Client paint in `architecture-diagram-svg.ts` must not recolor that rect (already skipped).
- Copy module: `archlucid-ui/src/lib/infra-evidence/infra-evidence-diagram-copy.ts`.
- Fills (do not drift): Compute `#2563eb`, Network `#0f766e`, Data `#7c3aed`, Storage `#d97706`, Identity `#db2777`, Generic `#475569` labeled **Other**.

## What to build

1. Copy constants (sentence case):
   - Group label: `Left edge`
   - Gloss: `Left edge color is the resource category. It is not connection evidence.`
   - Words: `Compute`, `Network`, `Data`, `Storage`, `Identity`, `Other`

2. A small pure helper (own file under `archlucid-ui/src/lib/infra-evidence/`) that scans an SVG string for `rect` elements whose class list contains `node-accent`, reads `fill`, and returns the matching kinds in this order only: Compute, Network, Data, Storage, Identity, Other. Unknown fills are ignored. Empty or missing SVG returns an empty list. Do not parse Mermaid. Do not map `resourceType` / `al-type` to a kind.

3. `InfraEvidenceDiagramLegend` accepts optional `layoutSvg: string | null`.
   - If there are no declared/probable/inferred edges **and** no accent kinds, still return `null`.
   - If accent kinds exist and there are no special edges, **show the card**: heading, the existing observed bullet (`Solid — observed in Azure inventory`), then the Left edge group. Do not invent dashed/dotted rows.
   - If special edges exist, keep today's bullets and footnote, and append the Left edge group when kinds exist.

4. Left edge group markup, inside the same bordered card, under the connector list:
   - A `p` (or `h3` if a heading level is already used nearby — prefer `p` with `font-medium`) reading `Left edge`.
   - The gloss as helper text.
   - A wrapping row (`flex flex-wrap gap-x-4 gap-y-2`) of items. Each item: a non-interactive `span` 4 px wide by 14 px tall, `aria-hidden`, `style={{ backgroundColor: fill }}` using the hex (not a Tailwind palette class), then the category word.
   - The row is a `ul` so the words are a list. Accessible name on the list: `Left edge`.
   - `data-testid="infra-evidence-diagram-legend-left-edge"`.

5. Pass `layoutSvg={displayLayoutSvg}` from `DiagramsWorkbenchClient`. No other call sites.

6. Vitest in `InfraEvidenceDiagramLegend.test.tsx`:
   - SVG with Identity `#db2777` and Compute `#2563eb` accents, outline of only observed edges: card is visible, words Identity and Compute are present, Network/Data/Storage/Other are absent, gloss is present, observed bullet is present, declared/dotted copy is absent.
   - Same SVG plus an inferred edge: existing inferred bullet remains and the swatch row is also present.
   - No accents and only observed edges: `container.firstChild` is null (today's hide behavior).
   - Duplicate accents of one fill produce one row.
   - A non-palette fill does not add a word.

## Acceptance criteria

- The Diagram legend card on an Identity-style forest names the left-edge colors that are actually on the SVG, with painted swatches.
- Line-style bullets are unchanged.
- A graph with only solid observed connectors still gets the card when accents exist.
- No second color table. No ARM-type switch in the UI.

## Constraints

- Working-tree safety: `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path <file>` before editing a tracked file. Exit 2 → skip and report.
- Do not edit `DiagramForestLegendSvgEmitter` (that is DLE-02). Do not recolor `node-accent`. Do not add Microsoft icons.
- Sentence case. `OPERATOR_TYPOGRAPHY`. No `text-[10px]`.
- Verification: `cd archlucid-ui && npx vitest run src/components/infra-evidence/InfraEvidenceDiagramLegend.test.tsx`. Heartbeat `STILL EXECUTING... HH:mm:ss` every 8s if >15s. No full-solution build. No dev server.
- No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**.
