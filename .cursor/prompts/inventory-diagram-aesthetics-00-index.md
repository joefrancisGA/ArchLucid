<!-- Inventory-diagram aesthetics — Composer prompts. Paste one numbered
     file per session. Origin: 2026-09-15 owner Full subscription / Executive
     inventory-forest screenshot: ~80 identical honey 400 px cards, unreadably
     muted RG captions, peering lines crossing nodes, stacked "peering" pills,
     no containers, Nodes/Edges tables longer than the canvas. Do not implement
     from this index. -->

# Inventory-diagram aesthetics — Composer prompt set (IDA-01–IDA-12 + hold)

ArchLucid sells a **seat for a repeat professional**. Inventory diagrams are an all-day SecureNow tool. Layout waves (**IDL / IDS / IDT / IDH / IDG / IDR**) made the graph *fit*. They did not make it *look like a human architecture sketch*. The owner 2026-09-15 canvas is a wall of saturated honey rectangles.

**Do not implement from this index.** Paste **one** numbered `.cursor/prompts/inventory-diagram-aesthetics-0N-*.md` file per Composer / Cloud Agent session.

Canonical wave doc (diagnosis + copy-below): [`docs/architecture/INFRA_EVIDENCE_INVENTORY_DIAGRAM_AESTHETICS_COMPOSER_PROMPTS.md`](../../docs/architecture/INFRA_EVIDENCE_INVENTORY_DIAGRAM_AESTHETICS_COMPOSER_PROMPTS.md).

**Do not treat this set as a V1 assessment scorecard.** No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**. **TB-645** vocabulary stays.

**Do not re-run IDL, IDS, IDT, IDH, IDG, IDR, IE-ND, IE-ID, or IE-DD** inside an IDA session. IDA paints and packs the **inventory-forest** canvas humans already see. Mermaid remains Export Mermaid / fail-soft. Graphviz remains PNG fallback.

**IDR-HOLD stands for IDR chats.** Resource-group **frames** are authorized here as **IDA-08**, not as a drive-by in captions.

## Diagnosis (locked — do not re-diagnose)

### What the owner sees (2026-09-15)

Inventory diagrams (`/governance/infrastructure/diagrams`), Executive (and Full subscription forest). Live engine: **`inventory-forest`** (`DiagramForestLayoutSvgRenderer` → `layoutSvg`).

- Every node is the same saturated honey `#D4A84B` rectangle, uniform **400 px** wide (`DiagramForestLayoutOptions.UniformNodeWidth` / `MinNodeWidth` / `MaxNodeWidth` all 400).
- Category pictograms exist (`DiagramInventoryPictogramSvgEmitter`) but sit on gold, so teal/blue/purple strokes fight the fill.
- Resource-group captions (IDR-02) use `#64748b` on `#D4A84B` (~2.1:1). Unreadable. PNG export inherits it.
- Peering edges are straight `<line>` elements through neighboring cards. Six "peering" pills stack on one midpoint.
- No subscription / resource-group containers. Membership is a repeated caption, not a frame.
- Disconnected singletons get the same 400 px weight as the hub.
- Canvas viewport is `max-h-[36rem]`. Below it, **Nodes** and **Edges** tables are always expanded (screenshot: table height dwarfs the diagram).
- No on-canvas legend. PNG has none.

### Why this is not another spacing wave

`INFRA_EVIDENCE_GRAPHVIZ_LAYOUT_HOLD.md` and IDT forbids another Mermaid `nodeSpacing` pass. The owner graph already fits at 100% (IDH). The failure is **visual language**: one fill, one width, one line style, no grouping, no legend, tables stealing the page.

Carbon / `UI-Enterprise-Design-Standard.mdc`: operator surfaces are **neutral grays**; amber elsewhere means attention. Honey node fill makes the diagram look like eighty warnings.

### Causal chain (locked)

1. `ArchitectureDiagramMermaidPalette` + `architecture-diagram-mermaid-config.ts` hard-code honey. Forest emitter, Graphviz DOT, Mermaid theme, CLI config, and `paintArchitectureDiagramNodePalette` all consume those constants.
2. `paintArchitectureDiagramNodePalette` selects **every** `g.node rect` and overwrites fill/stroke. Accent bars, pictogram rects, and white cards will be clobbered unless the paint function becomes class-scoped (**IDA-03** after **IDA-01/02**).
3. Uniform 400 px width is asserted in `DiagramForestLayoutSvgRendererTests.Render_owner_shape_executive_vnets_use_uniform_node_width`. Content-sized cards must rewrite that test, not sneak around it.
4. `ResolveEdgeEndpoints` picks a side then draws a straight line. Labels share one midpoint offset (`DiagramForestEdgeLabelSvgEmitter`).
5. Forest packing is by **connected component** (`DiagramComponentRowPlanner`). RG frames on that grid overlap — that is why IDR-HOLD exists. **IDA-08** must pack by `ArmResourceGroup` *before* drawing frames.
6. IDH-02 locked **100% zoom on mermaidSource change**. Do not revert that for the 11-VNet owner export. **IDA-11** only changes the default for graphs that **overflow** the viewport.

**Signature (fail this wave if still true after IDA-01–12):** default Executive/Full forest canvas is a honey wall; RG caption fails WCAG AA on the card; peering labels stack; PNG uses a different node fill than the canvas; Nodes/Edges tables are the tallest thing on the page.

## What this set changes

| Bet | From | To | Prompt |
|-----|------|----|--------|
| **Palette** | Honey `#D4A84B` fill, brown border, slate caption on gold | White/neutral card, slate border, AA caption, `rx` 6 | IDA-01 |
| **Category** | Pictogram only, same gold behind every type | 4 px left accent from existing pictogram kind colors | IDA-02 |
| **Paint parity** | Client paint / Graphviz / CLI still honey; paint hits every rect | All three renderers + PNG use the new palette; paint skips pictogram/accent | IDA-03 |
| **Card geometry** | 400×~36 icon-above-text | Content width (min ~160 / max ~280), icon-left, two-line text-right | IDA-04 |
| **Edges** | Straight lines through boxes; no markers | Orthogonal elbows; arrowheads on directed edges | IDA-05 |
| **Edge labels** | One pill per edge, stacked | Collapse identical labels to a style + legend; offset leftovers | IDA-06 |
| **Hubs** | Degree ignored except node-count LR switch | High-degree node as hub, neighbors in the adjacent column | IDA-07 |
| **RG frames** | Captions only (IDR) | Pack by RG, dashed container, drop per-node RG line inside | IDA-08 |
| **Legend** | None | SVG legend (kinds, lock, edge styles) that survives PNG | IDA-09 |
| **Outline** | Always-open Nodes/Edges | Collapsed disclosure; canvas is the hero | IDA-10 |
| **Camera** | Always 100% even when ink overflows | Overflow → Fit in view; 11-VNet owner export stays 100% | IDA-11 |
| **Ratchet** | Honey + 400 px width tests | Palette, contrast, no-cross, collapsed outline, PNG parity | IDA-12 |

## What this set does *not* change

Keep: one Azure collector. **IE-RF-12**. Inventory-forest as the live Full/Executive canvas when `layoutSvg` is present. Export Mermaid topology. IDH `~~~` honesty. IDL-03 11 px floor. IDR captions **until IDA-08** suppresses them inside frames. Original category pictograms (not Microsoft artwork). Sparse flatten on Executive / Network / Data / Identity. `%% al-type / al-rg / al-seed`. Outline **columns** (just collapse the tables). Help-topic `MermaidDiagram`. DAU intent-to-view.

Do **not** retune Mermaid `nodeSpacing` / `rankSpacing`. Do **not** default Graphviz `dot`. Do **not** add elk / svg-pan-zoom / React Flow for inventory. Do **not** hide desktop review workspace tabs. Do **not** ship Microsoft Azure product icons (see **IDA-HOLD**). Do **not** draw nested VNet/subnet frames in IDA-08.

## Run order

**01 → 02 → 03 → 04 → 05 → 06 → 07 → 08 → 09 → 10 → 11 → 12.**

| Prompt | Parallel? | Depends on |
|--------|-----------|------------|
| **IDA-01** Neutral palette + caption contrast | First | trunk (IDR-02 caption line already on forest) |
| **IDA-02** Category accent bar | After 01 | IDA-01 (`node-card` class) |
| **IDA-03** Paint / Graphviz / CLI / PNG parity | After 02 | IDA-01 + IDA-02 (must not clobber accent/pictogram) |
| **IDA-04** Content-sized icon-left cards | After 03 | Palette stable; geometry tests rewrite 400 px |
| **IDA-05** Orthogonal edges + markers | After 04 | New card sizes change endpoints |
| **IDA-06** Edge-label collapse | After 05 | Elbows exist to hang one label on |
| **IDA-07** Hub-and-spoke | After 04; parallel with 05–06 if no file overlap on the LR planner | IDA-04 metrics |
| **IDA-08** RG pack + frames | After 04 | Content-sized cards; **not** before packing exists |
| **IDA-09** SVG legend | After 02 + 06 | Kinds and edge styles exist to name |
| **IDA-10** Outline collapse | Parallel with 01–09 (UI-only) | none |
| **IDA-11** Overflow camera | After 04 (sizes change overflow) | Do not fight IDH-02 on small graphs |
| **IDA-12** Ratchet | Last | 01–11 merged |
| **IDA-HOLD** | Not implementation | — |

**IDA-HOLD** is not implementation. Paste `inventory-diagram-aesthetics-13-hold.md` only if a session starts Microsoft product icons, nested VNet/subnet frames, a Mermaid gap-constant pass, Graphviz `dot` as default, elk/React Flow, or packing-by-RG **without** IDA-08's non-overlap rule.

Suggested Cloud Agent branch per prompt: `cursor/inventory-diagram-aesthetics-<short-name>-ida1`. Implementation sessions use a **new** feature branch per prompt. This prompt-set PR lives on `cursor/inventory-diagram-aesthetics-prompts-d912`.

## Prompt files (paste one per session)

| # | File | Flaw it mitigates |
|---|------|-------------------|
| 01 | `inventory-diagram-aesthetics-01-neutral-palette.md` | Honey wall; RG caption contrast |
| 02 | `inventory-diagram-aesthetics-02-category-accent.md` | Type is invisible except a muddy pictogram |
| 03 | `inventory-diagram-aesthetics-03-paint-parity.md` | Client paint / Graphviz / PNG still honey; paint clobbers accents |
| 04 | `inventory-diagram-aesthetics-04-content-sized-cards.md` | 400 px empty cards; icon stacked above text |
| 05 | `inventory-diagram-aesthetics-05-orthogonal-edges.md` | Lines through nodes; no direction |
| 06 | `inventory-diagram-aesthetics-06-edge-label-collapse.md` | Stacked "peering" pills |
| 07 | `inventory-diagram-aesthetics-07-hub-spoke-placement.md` | High-degree node treated like a leaf |
| 08 | `inventory-diagram-aesthetics-08-rg-containers.md` | Membership only as repeated captions |
| 09 | `inventory-diagram-aesthetics-09-svg-legend.md` | PNG/canvas have no key |
| 10 | `inventory-diagram-aesthetics-10-outline-tables-collapse.md` | Tables taller than the diagram |
| 11 | `inventory-diagram-aesthetics-11-large-graph-camera.md` | Overflowing ink at locked 100% |
| 12 | `inventory-diagram-aesthetics-12-visual-ratchet.md` | No test that honey/400 px/crossing cannot return |
| HOLD | `inventory-diagram-aesthetics-13-hold.md` | Icons / nested frames / gap retune temptation |

## Follow-on (do not implement from this file)

Microsoft Azure architecture icons require a **license/product decision** (IDA-HOLD). Nested VNet → subnet frames are a later layout engine, not IDA-08. Owner 2026-09-16: IDA-08 frames exist but overlap and read as peering wires — that visibility wave is **IDF** ([`inventory-diagram-frames-00-index.md`](inventory-diagram-frames-00-index.md)). Do not start IDF from an IDA chat. DAU walkthrough/spotlight stays DAU.

## After each prompt

Summarize: files changed, tests run, whether a Full subscription forest card is a **neutral Carbon-like card** (not honey), residual risk (Playwright layout numbers, PNG vs canvas).

## Global constraints (every prompt)

Working-tree safety: `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path <file>` before editing a tracked file. Exit 2 → skip and report. Cloud Agent VMs: if `pwsh` is missing, install per `AGENTS.md` **or** skip the script on a clean branch and say so.

- **Do not** hide desktop review workspace tabs behind **More**.
- **Do not** merge `DraftRequests` and `Runs`. **Do not** unseal sealed records.
- No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**.
- TB-645 vocabulary. Sentence case. Visible-boundary `Button` (no ghost/link).
- C#: concrete types over `var`, LINQ over `foreach` where it does not degrade performance, blank line before `if` / `foreach` unless first in method, one class per file, null checks, no `ConfigureAwait(false)` in tests.
- Verification: focused `dotnet test --filter` or focused Vitest / Playwright named in the prompt. No full-solution build, no dev server unless the file says so.
- Implement only *What to build*.
