<!-- Inventory-diagram viewport chrome — Composer prompts. Paste one numbered
     file per session. Origin: 2026-09-11 owner diagnosis on SecureNow Inventory
     diagrams (Executive mode): mermaid render restored (#3013) but zoom /
     fullscreen sit too far from the ink to be useful.
     Do not implement from this index. -->

# Inventory-diagram viewport — Composer prompt set (IDV-01–IDV-04)

ArchLucid sells a **seat for a repeat professional**. Inventory diagrams are an all-day SecureNow tool, not a thumbnail gallery.

**Do not implement from this index.** Paste **one** numbered `.cursor/prompts/inventory-diagram-viewport-0N-*.md` file per Composer / Cloud Agent session.

**Do not treat this set as a V1 assessment scorecard.** No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**. **TB-645** vocabulary stays. Do **not** implement G-REAL-06.

## Diagnosis (already closed — do not re-diagnose)

Owner screenshot: Inventory diagrams, mode **Executive**, 11 nodes / 10 edges / 0 subgraphs, zoom **10%**, Fullscreen on its own row, ~36rem empty canvas with a scrollbar, graph reduced to a thumbnail at top-left.

**This is better than the blank canvas (#3013 restored Mermaid).** The leftover is that the **controls are too far from the ink to be useful.**

Causal chain (locked):

1. Inventory mermaid is `flowchart TD` (`MermaidDiagramRenderer`). Flattened executive views (`DiagramAstExecutiveLayoutSimplifier`, 0 subgraphs) are a **tall, narrow VNet chain**.
2. `fitMermaidSvgElementToHost` sizes SVG **width to the full host** and height to `max(280px, width × aspectRatio)`. A TD chain **inflates vertically** into thousands of pixels.
3. Mermaid canvas uses `min-h-[18rem] max-h-[36rem] overflow-auto` (`ArchitectureDiagramMermaidCanvas`, raised in #2951).
4. Zoom is CSS `transform: scale(zoom)` with `transform-origin: top left`. **Scale does not shrink layout**, so 10% only paints a thumbnail inside the same huge scrollport.
5. **Fit in view** re-runs width-fit and resets zoom to 100%. For this TD graph that makes the canvas larger, not more compact.
6. Zoom cluster, hint, and Fullscreen live **above** that frame (Fullscreen on a third row), not on the canvas. Provenance graphs overlay a compact cluster (`ProvenanceGraphViewportChrome`).

## What this set *does* change

| Bet | From | To | Prompt |
|-----|------|----|--------|
| **Fit** | Width-stretch TD chain to page; min height 280px then clip | Contain ink in the **visible** viewport | IDV-01 |
| **Zoom** | CSS scale that leaves empty scrollport; Fit = 100% width-fit | Camera/layout zoom; Fit = ink in view; Ctrl+scroll works | IDV-02 |
| **Chrome** | Zoom row + hint + Fullscreen row + 36rem hole | Zoom + Fullscreen clustered on the canvas | IDV-03 |
| **Honesty** | Hint promises Ctrl+scroll; mermaid path has no wheel | Hint matches behavior; tests lock the viewport | IDV-04 |

## What this set does *not* change

Keep: `#3013` client-side Mermaid compile (`mermaidSource` path). `#2951` sparse-subgraph flatten and **ink-based viewBox crop**. Help-topic `MermaidDiagram` **width-fill** (split the helper if inventory fit would break help). Partitioned fallback cards, server PNG export, outline tables, URL `diagZoom` / `diagFullscreen`.

Do **not** change `flowchart TD` emission to LR to dodge the viewer bug. Do **not** revert labeled zoom / percent input (#2968 / #2996). Do **not** collapse desktop review workspace tabs behind **More**. Do **not** restyle the page as a marketing diagram. Do **not** add svg-pan-zoom or a new pan library unless IDV-02 cannot land with CSS + existing fit helpers.

## Relationship to prior work

| Item | Role | This set |
|------|------|----------|
| **#3013** | Restored Mermaid in `ArchitectureDiagramViewer` | **Do not revert** |
| **#2951** | Flatten sparse executive swimlanes; ink fit; min-h 18rem / max-h 36rem | Keep flatten + ink crop; **replace** width-stretch + empty 36rem hole |
| **#2994 / #2996** | Auto-fit + editable zoom percent | Keep the controls; change what they *do* |
| **IE-UX-02** | Inventory diagrams workbench | Landed; this set is leftover chrome |
| **SH-13** | Help copy for this page | Do not re-run |

## Run order

**01 → 02 → 03 → 04.**

- **01** must not overlay chrome or rewrite zoom.
- **02** must not restyle the toolbar (03 does).
- **03** must not change fit math (01) or zoom semantics (02).
- **04** last: wheel/hint honesty leftovers + close tests.

Suggested Cloud Agent branch per prompt: `cursor/inventory-diagram-viewport-<short-name>-24d7`. Implementation sessions use a **new** feature branch per prompt. This prompt-set PR may live on `cursor/inventory-diagram-viewport-prompts-24d7`.

## Prompt files (paste one per session)

| # | File | Flaw it mitigates |
|---|------|-------------------|
| 01 | `inventory-diagram-viewport-01-fit-visible-viewport.md` | Tall TD executive graphs are width-stretched into a huge scrollport |
| 02 | `inventory-diagram-viewport-02-zoom-changes-layout.md` | CSS scale zoom and Fit in view do not bring ink to the visible frame |
| 03 | `inventory-diagram-viewport-03-cluster-canvas-chrome.md` | Zoom / Fit / Fullscreen sit above a tall empty box |
| 04 | `inventory-diagram-viewport-04-hint-honesty-and-close.md` | Ctrl+scroll hint is false on the mermaid path; no lock tests |

## After each prompt

Summarize: files changed, tests run, whether an 11-node Executive TD chain fits in the visible frame at default zoom without a mostly-empty 36rem hole, residual risk.

## Global constraints (every prompt)

Working-tree safety: `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path <file>` before editing a tracked file. Exit 2 → skip and report.

- **Do not** hide desktop review workspace tabs behind **More**.
- **Do not** merge `DraftRequests` and `Runs`. **Do not** unseal sealed records.
- No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**.
- TB-645 vocabulary. Sentence case. Visible-boundary `Button` (no ghost/link).
- Verification: focused Vitest from `archlucid-ui/` named in the prompt. No full-solution build, no dev server unless the file says so.
- Implement only *What to build*.
