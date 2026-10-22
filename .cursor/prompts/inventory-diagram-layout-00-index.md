<!-- Inventory-diagram layout aesthetics — Composer prompts. Paste one numbered
     file per session. Origin: 2026-09-12 owner screenshot on SecureNow Inventory
     diagrams (Executive): camera restored (IDC-01–04) but the graph is a tall
     one-column chain, nodes are tiny at fit, and 1000% shows "nodes far apart".
     Do not implement from this index. -->

# Inventory-diagram layout — Composer prompt set (IDL-01–IDL-06)

ArchLucid sells a **seat for a repeat professional**. Inventory diagrams are an all-day SecureNow tool. A render that is *technically visible* but reads as a 6px-font ribbon on the left 10% of the canvas is not done.

**Do not implement from this index.** Paste **one** numbered `.cursor/prompts/inventory-diagram-layout-0N-*.md` file per Composer / Cloud Agent session.

**Do not treat this set as a V1 assessment scorecard.** No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**. **TB-645** vocabulary stays. Do **not** implement G-REAL-06.

**Do not continue IDV / IDC / IE-ID.** Those waves landed. This wave changes the *shape* of the graph and the *legibility floor* of the camera, which earlier waves were explicitly told not to touch ("do not change `flowchart TD` to LR to dodge the viewer bug"). The viewer bug is closed; the owner has now asked for the layout itself to change. That constraint is **lifted for this wave only**.

## Diagnosis (already closed — do not re-diagnose)

Owner screenshot (2026-09-12): Inventory diagrams, mode **Executive**, snapshot `bebca1ae-…` (889 resources), **Render succeeded** 11 nodes · 10 edges · 0 subgraphs. At **1000%** a single tiny node is visible at the far left of a tall scrollport; other nodes are "far apart from one another".

Reproduced 2026-09-12 against `next dev` with the infra-evidence Mermaid API mocked (same 11 VNet labels, `flowchart TD`, 10 chain edges, `%% al-type=…` metadata comments). Measurements from the live DOM (`[data-testid="architecture-diagram-viewport"]` 1166 × 558 px):

| Fixture | Mermaid viewBox | Fitted SVG (px) | Node box (px) | Notes |
|---|---|---|---|---|
| **Current** — 11 VNets, 10 chain edges, TD | `296 × 1250` | **123 × 520** | ~100 × 24, label ≈ **6 px** | Chain sits in the left 10% of the canvas; 90% blank |
| Current at **1000%** | same | 1230 × **5200** (width capped to 1134 by `max-width:100%`) | ~945 × 224 | Zoom stretches height only; `xMidYMid meet` re-centers; scrollport 5238 px tall |
| Same 11 VNets, **no edges** | `2772 × 105` | 1110 × **42** | ~99 × 23 | dagre puts disconnected peers in one row |
| Same 11 VNets, **4-column grid** via invisible `~~~` links | ink ≈ `1100 × 320`; **measured crop `866 × 206`** | 1110 × 264 | ~316 × 75 (**128% upscaled**) | Ink crop clipped the **first row and left column**; fit upscaled past natural size |

Causal chain (locked):

1. **The 10 edges are fabricated.** `DiagramAstLayoutEdgeBuilder.EnsureLayoutEdgesWhenEmpty` chains every node to the next in `OrderKey` order whenever a mode has zero real edges. They are rendered as real arrows, listed in the **Edges** outline table as `From → To`, and counted in `edgeCount`. The owner's snapshot has no VNet-to-VNet relationships; the chain order is just ARM-id sort order (`anly-avd-nprd-hi` before `anly-avd-persistent-nonprod-hi`).
2. **A chain in `flowchart TD` is a 1-column layout.** 11 ranks × (`38.5` node + `56` rankSpacing + edge) ≈ 1250 units tall, 296 wide (aspect 1:4.2). The viewport is ~2:1. Contain-fit therefore scales to `min(1134/296, 552/1250) = 0.42`; labels at `fontSize 15px` render at ~6 px.
3. **Contain-fit has no legibility floor and no natural-size ceiling.** `fitMermaidSvgElementToViewport` always returns `scale = min(w/vw, h/vh)`: it shrinks a tall graph until text is unreadable instead of letting the `overflow-auto` viewport scroll, and it enlarges a small graph past 100% natural size.
4. **The SVG host is left-aligned.** `MERMAID_SVG_HOST_CLASSNAME` is `inline-block min-w-0`; a narrow fitted SVG hugs the left padding. The "one node far left" in the owner's screenshot is this alignment plus the tall scrollport.
5. **Zoom is anisotropic.** `applyMermaidSvgInkViewBox` sets `svg.style.maxWidth = "100%"`. `applyMermaidSvgViewportZoom` then sets `width = base × zoom` but the browser caps width at the host width, while height grows freely. With `preserveAspectRatio="xMidYMid meet"` the effective scale is `min(hostWidth/vw, base×zoom×… /vh)`, so "1000%" is not 10×, and the ink re-centers vertically inside a 5200 px tall box. Users scroll through blank space between rows — "far apart".
6. **The ink crop is layout-shape dependent.** For the tall chain, `readMappedNodeInkBBox` happens to produce the right box. For a wide grid it produced a box ~78% of the true ink, offset by `(119, 54)`, clipping a row and a column. Mermaid already emits a correct whole-graph `viewBox`; the measured crop is only needed when Mermaid pads a huge empty canvas, and it is cached per SVG element (`mermaidInkViewBoxBySvg`) with `resetMermaidSvgViewportInkCache` never called.
7. **Executive content is thin for this snapshot.** `IsExecutiveSummaryNode` keeps resource groups, VNets, and subscriptions; the snapshot graph has no RG/subscription nodes, so Executive = 11 VNets with no relationships and no counts. `FlattenSparseSubgraphs` (threshold 8) removed the 11 one-node RG frames, so there is no grouping either.

Signature: **Render succeeded, edgeCount > 0, all edges unlabeled and in `OrderKey` order, viewBox aspect < 1:3, fitted SVG width < 15% of viewport width.**

## What this set *does* change

| Bet | From | To | Prompt |
|-----|------|----|--------|
| **Honesty** | Synthetic chain edges drawn as arrows and listed as edges | Layout-only links are invisible (`~~~`), excluded from outline and metrics | IDL-01 |
| **Shape** | Peers with no relationships form a 1-column chain (or 1 row) | Peers wrap into a grid sized for a ~2:1 viewport | IDL-02 |
| **Fit** | Shrink-to-fit with no floor; upscale past natural size; left-aligned | Fit clamps to `[minLegibleScale, 1.0]`, centers, and scrolls when it must | IDL-03 |
| **Zoom** | `max-width:100%` caps width; percent is not linear | Isotropic zoom; 100% = fitted base; N% = N/100 × base on both axes | IDL-03 |
| **Crop** | Measured ink bbox trusted even when it clips rows | Mermaid `viewBox` authoritative; measured crop only tightens, never clips | IDL-04 |
| **Content** | Executive = bare VNet list | VNet labels carry counts; RG/region grouping when sparse | IDL-05 (owner decisions inside) |
| **Ratchet** | No test renders the real page | Mock-backed Playwright spec asserts legibility + no clipping | IDL-06 |

## What this set does *not* change

Keep: `#3013` client Mermaid compile. IDC-01–04 stable viewport budget and retry. IDV overlay chrome (zoom + Fullscreen **on** the canvas). Partitioned fallback cards, server PNG export, outline tables, `diagZoom` / `diagFullscreen`. Help-topic `MermaidDiagram` **width-fill** path. `%% al-type / al-rg / al-seed` metadata comments and the client stripper. `DiagramSubgraphPlanner` subscription/RG swimlanes for non-sparse modes.

Do **not** add svg-pan-zoom, elk, or any new layout/pan dependency. Do **not** switch the renderer wholesale to `flowchart LR` — the grid in IDL-02 stays `TD` and uses invisible links. Do **not** hide desktop review workspace tabs behind **More**. Do **not** restore `min-h-[18rem]` empty holes.

## Relationship to prior work

| Item | Role | This set |
|------|------|----------|
| **#3013** | Restored Mermaid compile | **Do not revert** |
| **#2951** | Flatten sparse swimlanes; ink crop | Keep flatten; **subordinate** the crop to Mermaid's viewBox (IDL-04) |
| **IDV-01–04** | Contain-fit, camera zoom, overlay chrome | Keep; add floor/ceiling + isotropic zoom (IDL-03) |
| **IDC-01–04** | Stable budget, user-space bbox, retry, ratchet | Keep; IDL-04 extends the ratchet with a wide fixture |
| **IE-ND / IE-ID / IE-RF** | Network, Identity, relationship-first prompts | Do not re-run; IDL-01/02 apply to *any* mode whose AST has zero real edges |

## Run order

**01 → 02 → 03 → 04 → 05 → 06.**

- **01** must not change column math (02) or the viewer (03/04).
- **02** must not change the renderer's edge honesty (01) or the viewer.
- **03** must not touch the ink crop (04) or backend.
- **04** must not touch zoom semantics (03).
- **05** needs owner answers in its *Decisions* section before pasting.
- **06** last: locks 01–04 with a browser test.

Suggested Cloud Agent branch per prompt: `cursor/inventory-diagram-layout-<short-name>-a5e7`. Implementation sessions use a **new** feature branch per prompt. This prompt-set PR lives on `cursor/inventory-diagram-layout-prompts-a5e7`.

## Prompt files (paste one per session)

| # | File | Flaw it mitigates |
|---|------|-------------------|
| 01 | `inventory-diagram-layout-01-invisible-layout-links.md` | Fabricated chain edges drawn and listed as real |
| 02 | `inventory-diagram-layout-02-peer-grid-columns.md` | 1-column chain / 1-row strip for unrelated peers |
| 03 | `inventory-diagram-layout-03-legibility-floor-and-isotropic-zoom.md` | 6 px labels at fit; width-capped zoom; left-hugging SVG |
| 04 | `inventory-diagram-layout-04-viewbox-authoritative-crop.md` | Measured crop clips rows/columns on wide graphs |
| 05 | `inventory-diagram-layout-05-executive-content-density.md` | Executive shows 11 bare VNets for an 889-resource snapshot |
| 06 | `inventory-diagram-layout-06-browser-legibility-ratchet.md` | No test renders the real page in a browser |

## Open questions for the owner (answer before IDL-03 / IDL-05)

1. **Zoom percent meaning.** Today 100% = "fitted to viewport" (IDV-02, #2968/#2996). IDL-03 keeps that and makes N% linear on both axes. Alternative: 100% = Mermaid natural size (15 px labels) and **Fit in view** shows the computed fit percent (e.g. 73%). Which do you want?
2. **Legibility floor.** IDL-03 proposes a minimum label size of **11 px** (scale ≥ 0.73 of natural). Below that the viewport scrolls instead of shrinking. Is 11 px right, or do you want 12–13 px?
3. **Grid width.** IDL-02 proposes columns = `clamp(ceil(sqrt(n × 2)), 2, 6)` so 11 peers → 5 columns × 3 rows. Do you want a fixed 4 columns instead?
4. **Executive grouping.** For sparse snapshots (one VNet per RG), should Executive group VNets by **region** subgraph, by **resource group**, or stay flat with count-bearing labels only? IDL-05 defaults to region subgraphs + counts.
5. **Edge honesty in metrics.** After IDL-01 the status strip will read "11 nodes · **0 edges**" for this snapshot. Acceptable, or should layout-only links be shown separately ("0 relationships · 8 layout links")?

## Follow-on (do not implement from this file)

After IDL-05 peering edges landed, the owner screenshot is **11 nodes · 6 edges · 0 subgraphs** with readable labels but nodes/connectors too far apart. That leftover is **IDS-01–IDS-04**, not another IDL prompt: [`.cursor/prompts/inventory-diagram-spacing-00-index.md`](inventory-diagram-spacing-00-index.md).

## After each prompt

Summarize: files changed, tests run, whether the 11-VNet Executive snapshot renders as a **multi-column grid with ≥ 11 px labels, no fabricated arrows, no clipped rows**, residual risk.

## Global constraints (every prompt)

Working-tree safety: `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path <file>` before editing a tracked file. Exit 2 → skip and report.

- **Do not** hide desktop review workspace tabs behind **More**.
- **Do not** merge `DraftRequests` and `Runs`. **Do not** unseal sealed records.
- No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**.
- TB-645 vocabulary. Sentence case. Visible-boundary `Button` (no ghost/link).
- C#: concrete types over `var`, LINQ over `foreach` where it does not degrade performance, blank line before `if` / `foreach` unless first in method, one class per file, null checks, no `ConfigureAwait(false)` in tests.
- Verification: focused `dotnet test --filter` or focused Vitest from `archlucid-ui/` named in the prompt. No full-solution build, no dev server unless the file says so.
- Implement only *What to build*.
