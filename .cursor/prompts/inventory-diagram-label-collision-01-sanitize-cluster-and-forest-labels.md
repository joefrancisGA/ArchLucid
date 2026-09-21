# IDLC-01 — Sanitize cluster titles and forest cards without overwriting node names

**Wave:** inventory-diagram-label-collision (**IDLC**). **Depends on:** none (UI display pipeline). **Do not** implement IDLC-02–04.

Do not implement from the wave index. Implement only *What to build*.

## Goal

Client SVG sanitizer and SecureNow layout-SVG normalize must stop painting **two labels in the same pixels** on inventory diagrams:

- Cluster / subgraph titles must not become centered `nodeLabel` text.
- A forest card that already has a name `<text>` and an RG `<text>` must not have the name recentered with a negative first `dy`.
- `normalizeInfraEvidenceLayoutSvgForDisplay` must not flatten wrapped tspans by assigning `textContent` on the parent `<text>`.

## Why

Owner Executive screenshot (2026-09-16), red circle on `vnet-app-hi-test-wus-001`: cluster title glyphs sit on the resource name. `replaceForeignObjectWithSvgText` always sets `class="nodeLabel"` and anchors at the foreignObject center. `wrapExistingNodeSvgLabels` then wraps the first `g.node text` as if it were a mermaid-centered label. IDR-02 forest cards and Mermaid cluster FOs both hit that path.

## Context

- `archlucid-ui/src/lib/architecture/architecture-diagram-svg.ts` — `replaceForeignObjectWithSvgText`, `wrapExistingNodeSvgLabels`, `closestNodeGroup`, `appendCenteredLabelTspans`
- `archlucid-ui/src/lib/architecture/architecture-diagram-svg.test.ts`
- `archlucid-ui/src/lib/infra-evidence/normalize-infra-evidence-mermaid-display.ts` — `normalizeInfraEvidenceLayoutSvgForDisplay` queries `text, tspan` and sets `textContent` on each
- `archlucid-ui/src/lib/infra-evidence/normalize-infra-evidence-mermaid-display.test.ts`
- `ArchLucid.ArtifactSynthesis/Layout/DiagramForestNodeSvgEmitter.cs` — already emits pictogram + name text + optional RG text (do **not** change the emitter in this prompt)
- Viewer host already styles `[&_svg_.cluster-label]` in `ArchitectureDiagramViewer.tsx` — keep using that class; do not restyle the whole viewer here

## What to build

1. **Cluster vs node vs edge foreignObjects** in `replaceForeignObjectWithSvgText` (or a small helper in the same file, one function per file if you extract):
   - If the FO is inside `g.cluster` (or a parent with class `cluster-label` / `cluster`) **and not** inside `g.node`: emit `<text class="cluster-label">`. Anchor at the **top-start** of the FO box (`text-anchor="start"`, `dominant-baseline="hanging"` or `text-before-edge`, `x` = FO `x` + small inset, `y` = FO `y` + small inset). Do **not** use middle/center.
   - If the FO is inside `g.edgeLabel` / `g.edge` and not a node: keep a dedicated class (`edgeLabel` or existing mermaid edge label class). Do not use `nodeLabel`.
   - Node FOs stay `nodeLabel` + centered tspans as today.
   - If the parent already contains a `text.cluster-label` (or `text` with the same non-empty label), **remove the FO** instead of adding a second SVG text. Duplicate titles are the overwrite.
2. **`wrapExistingNodeSvgLabels`:**
   - Skip the node when it contains **two or more** `text` descendants (forest name + RG), or when it contains `g.pictogram`.
   - Skip when the matched text is `cluster-label` (query must not pick cluster titles via `text.nodeLabel, text`).
   - Keep wrapping mermaid-only nodes that have a single `text.nodeLabel` (or a single `text`) and a rect, using existing 15px metrics.
3. **`normalizeInfraEvidenceLayoutSvgForDisplay`:**
   - Do **not** set `textContent` on a `<text>` that has `<tspan>` children (that flattens wrapping).
   - Lowercase leaf text: either each `tspan` only, or `text` nodes with no `tspan` children. Preserve `dy` / `x` on tspans.
   - Existing quoted-Mermaid-source normalize stays.
4. Tests (fail on current code, pass after) in `architecture-diagram-svg.test.ts`:
   - Fixture: `g.cluster` with a `foreignObject` whose text is `RG app-hi-test` and a `g.node` with `vnet-app-hi-test-wus-001`. After `replaceMermaidForeignObjectLabelsWithSvgText` / `sanitizeArchitectureDiagramSvg`: output contains `cluster-label` and `RG app-hi-test`; that title `text` does **not** have `class="nodeLabel"`; `vnet-app-hi-test-wus-001` still present once (not twice).
   - Fixture: `g.cluster` with both a native `text.cluster-label` and a `foreignObject` of the same string: sanitized SVG contains that string **once**.
   - Fixture: forest-like `g.node` with `g.pictogram`, name `text` (one tspan), RG `text` (one tspan), long name that would wrap at 15px: after sanitize, **two** `text` elements remain; name `y` unchanged (no new centered tspans with negative `dy` on the name).
   - Existing FO→nodeLabel tests for ordinary mermaid nodes stay green.
5. Tests in `normalize-infra-evidence-mermaid-display.test.ts`:
   - SVG `<text><tspan>Vnet-App</tspan><tspan dy="16">-Hi</tspan></text>` still has **two tspans** after normalize; first tspan lowercased; `dy` preserved.
6. No DOT. No viewport CSS. No mermaid `nodeSpacing` change.

## Acceptance criteria

- A cluster title is `cluster-label` (or equivalent non-`nodeLabel` class) and is not a second copy of the first node name.
- Forest cards keep stacked name + muted RG after client sanitize.
- Wrapped mermaid node names (single label, no pictogram) still wrap.

## Constraints

- Working-tree safety: `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path <file>` before editing a tracked file. Exit 2 → skip and report.
- **Do not** set `htmlLabels: true`. **Do not** change `ARCHITECTURE_DIAGRAM_MERMAID_PADDING` / nodeSpacing / rankSpacing.
- **Do not** hide desktop review workspace tabs behind **More**.
- TypeScript: no inline imports; exhaustive `switch` if you add a FO-kind union.
- Verification from `archlucid-ui/`: `npx vitest run src/lib/architecture/architecture-diagram-svg.test.ts src/lib/infra-evidence/normalize-infra-evidence-mermaid-display.test.ts`. Heartbeat `STILL EXECUTING... HH:mm:ss` every 8s if >15s. No full-solution build.
- No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**.
