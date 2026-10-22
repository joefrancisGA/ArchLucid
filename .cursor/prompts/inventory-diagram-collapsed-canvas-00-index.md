<!-- Inventory-diagram collapsed canvas — Composer prompts. Paste one numbered
     file per session. Origin: 2026-09-11 owner screenshot on SecureNow Inventory
     diagrams (Executive): Render succeeded (11 nodes / 10 edges) but the graph
     is gone again after IDV-01–03 camera/chrome landed.
     Do not implement from this index. -->

# Inventory-diagram collapsed canvas — Composer prompt set (IDC-01–IDC-04)

ArchLucid sells a **seat for a repeat professional**. Inventory diagrams are an all-day SecureNow tool. A successful render that shows only zoom chrome + Nodes/Edges is a broken camera, not a missing compiler.

**Do not implement from this index.** Paste **one** numbered `.cursor/prompts/inventory-diagram-collapsed-canvas-0N-*.md` file per Composer / Cloud Agent session.

**Do not treat this set as a V1 assessment scorecard.** No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**. **TB-645** vocabulary stays. Do **not** implement G-REAL-06.

**Do not continue IDV.** IDV-01–04 already landed. This wave fixes the regression they introduced. Do **not** paste IDV-01–04 again.

## Diagnosis (already closed — do not re-diagnose)

Owner screenshot (2026-09-11): Inventory diagrams, mode **Executive**, snapshot `bebca1ae-…`, **Render succeeded** 11 nodes · 10 edges · 0 subgraphs, zoom **90%**, overlay Zoom/Fit/Fullscreen on the canvas, Nodes/Edges tables filled with the VNet chain, **no visible graph**, and **no 36rem empty hole**.

This is **not** the pre-IDV thumbnail-in-a-tall-frame bug. It is **not** `#3013` mermaid compile missing (no render-error UI; overlay chrome is mermaid-only). Backend flatten + `flowchart TD` did their job.

Causal chain (locked):

1. IDV-01 removed `min-h-[18rem]`. Viewport is `max-h-[36rem]` only (`ArchitectureDiagramMermaidCanvas`).
2. IDV-03 overlay (`absolute right-2 top-2`) does **not** contribute height.
3. `readMermaidViewportFitTarget` uses `viewport.clientHeight - padding`. If that is **> 1px**, it becomes the fit height. The SVG’s own height **is** that client height → circular.
4. `ResizeObserver` re-runs `fitMermaidSvgElementToViewport` and **shrinks toward zero**. The 240px fallback only runs when measured height is ≤ 1.
5. `mapLocalBBoxToSvgUserSpace` multiplies `element.getCTM()` with `svg.getScreenCTM().inverse()` (mixed coordinate spaces). Identity CTM crops `viewBox` to a node-sized box at the origin; the TD chain is clipped.
6. Mermaid canvas retries **once** via `requestAnimationFrame`. Static canvas still has `MAX_INITIAL_FIT_RETRIES = 8` × 120ms. Null bbox sets `height: auto` and the frame collapses. Overlay is then the only visible chrome.

Signature: outline tables healthy + zoom overlay present + canvas height ≈ overlay/padding → **blank again**.

## What this set *does* change

| Bet | From | To | Prompt |
|-----|------|----|--------|
| **Budget** | Fit target = current SVG/content height | Stable viewport budget (`max-height` / 576px floor), independent of current SVG height | IDC-01 |
| **Ink box** | Mixed `getCTM` × `getScreenCTM`; re-crop every resize | SVG user-space ink box; crop once per source | IDC-02 |
| **Retry** | One rAF; null bbox → height auto; ResizeObserver shrink loop | 8×120ms mermaid retry; resize re-applies zoom against the **budget**, does not re-crop | IDC-03 |
| **Ratchet** | No test for “outline has nodes, canvas collapsed” | Tests that fail if the camera can shrink to overlay-only | IDC-04 |

## What this set does *not* change

Keep: `#3013` client mermaid compile (`mermaidSource`). `#2951` sparse-subgraph flatten. IDV overlay chrome (zoom + Fullscreen **on** the canvas). IDV layout-affecting zoom (not CSS-scale-as-layout). Help-topic `MermaidDiagram` **width-fill**. Partitioned fallback cards, server PNG export, outline tables, `diagZoom` / `diagFullscreen`. `flowchart TD` emission.

Do **not** restore a forced `min-h-[18rem]` **empty hole** as the “fix” (that was the IDV problem). A content-sized frame **after** a correct contain-fit into a **stable budget** is still the goal. Do **not** change emission to `flowchart LR`. Do **not** add svg-pan-zoom. Do **not** hide desktop review workspace tabs behind **More**.

## Relationship to prior work

| Item | Role | This set |
|------|------|----------|
| **#3013** | Restored Mermaid in `ArchitectureDiagramViewer` | **Do not revert** |
| **#2951** | Flatten + ink crop | Keep flatten; **fix** the crop mapping |
| **IDV-01–03** | Contain-fit + camera zoom + overlay chrome | Keep the **intent**; stop circular height + bad CTM |
| **IDV-04** | Hint honesty | Do not re-run unless a test proves the hint is now false |
| **IE-UX-02 / SH-13** | Workbench + help | Do not re-run |

## Run order

**01 → 02 → 03 → 04.**

Suggested Cloud Agent branch per prompt: `cursor/inventory-diagram-collapsed-<short-name>-3da5`. Implementation sessions use a **new** feature branch per prompt. This prompt-set PR may live on `cursor/inventory-diagram-collapsed-prompts-3da5`.

## Prompt files (paste one per session)

| # | File | Flaw it mitigates |
|---|------|-------------------|
| 01 | `inventory-diagram-collapsed-canvas-01-stable-viewport-budget.md` | Fit target follows collapsed SVG height |
| 02 | `inventory-diagram-collapsed-canvas-02-ink-bbox-user-space.md` | ViewBox crop hides the TD chain at the origin |
| 03 | `inventory-diagram-collapsed-canvas-03-fit-retry-no-shrink.md` | One-shot fit + ResizeObserver shrink-to-zero |
| 04 | `inventory-diagram-collapsed-canvas-04-blank-canvas-ratchet.md` | No regression test for overlay-only canvas |

## After each prompt

Summarize: files changed, tests run, whether an 11-node Executive TD chain is **visible** in the frame at default zoom (not overlay-only), residual risk.

## Global constraints (every prompt)

Working-tree safety: `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path <file>` before editing a tracked file. Exit 2 → skip and report.

- **Do not** hide desktop review workspace tabs behind **More**.
- **Do not** merge `DraftRequests` and `Runs`. **Do not** unseal sealed records.
- No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**.
- TB-645 vocabulary. Sentence case. Visible-boundary `Button` (no ghost/link).
- Verification: focused Vitest from `archlucid-ui/` named in the prompt. No full-solution build, no dev server unless the file says so.
- Implement only *What to build*.
