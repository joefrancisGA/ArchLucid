<!-- Inventory-diagram resource-group frame visibility — Composer prompts.
     Paste one numbered file per session. Origin: 2026-09-16 owner Full
     subscription / Executive inventory-forest screenshot (424 resources →
     61 canvas nodes): dashed RG boxes exist after IDA-08 but they overlap,
     share corners so labels overprint, sit 16 px apart vertically, use a
     1 px stroke in the same #94a3b8 dash as peering edges, and get cropped
     by a node-only viewBox. Owner asked to make the boxes more obvious
     (space between them, double the line width) and to hear ideas first.
     Do not implement from this index. -->

# Inventory-diagram resource-group frame visibility — Composer prompt set (IDF-01–IDF-07 + hold)

ArchLucid sells a **seat for a repeat professional**. **IDA-08** shipped pack-by-`ArmResourceGroup` and dashed `g.rg-frame` containers on **inventory-forest**. The owner 2026-09-16 canvas still cannot *read* those boxes: several frames share one top-left corner, labels overprint, a frame border strikes through the name of the group below, and the 1 px `#94a3b8` dash is identical to a peering wire.

**Do not implement from this index.** Paste **one** numbered `.cursor/prompts/inventory-diagram-frames-0N-*.md` file per Composer / Cloud Agent session.

Canonical wave doc (diagnosis + copy-below): [`docs/architecture/INFRA_EVIDENCE_INVENTORY_DIAGRAM_FRAMES_COMPOSER_PROMPTS.md`](../../docs/architecture/INFRA_EVIDENCE_INVENTORY_DIAGRAM_FRAMES_COMPOSER_PROMPTS.md).

**Do not treat this set as a V1 assessment scorecard.** No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**. **TB-645** vocabulary stays.

**Do not re-run IDL, IDS, IDT, IDH, IDG, IDR, IDA, IDP, IE-ND, IE-ID, or IE-DD** inside an IDF session. IDA-08 packing and frames stay; this wave makes the frames **honest and visible**. IDR-HOLD still forbids boxes from **IDR** chats.

## Diagnosis (locked — do not re-diagnose)

### What the owner sees (2026-09-16)

Inventory diagrams (`/governance/infrastructure/diagrams` and SecureNow `/infrastructure/diagrams`), Executive, snapshot ~424 resources / 61 canvas nodes / 31 edges. Live engine: **`inventory-forest`**.

- Dashed rounded RG frames exist (`g.rg-frame`). Several occupy the same top-left, so 11 px labels overprint into unreadable ink (`anly-edw-…nonprod-hi`).
- A frame border runs through the label of the group below (`anly-aep-ppd-hi`).
- Adjacent frames share edges; the “gutter” is 16 px vertically (40 px `ComponentVerticalGap` minus 12 px pad on each side).
- Frame stroke is **omitted** (SVG default **1 px**), `#94a3b8`, `stroke-dasharray="5 4"`. Peering edges are **1.5 px** dashed `#94a3b8` `6 4`. The container is the faintest line on the canvas and looks like a wire.
- Fill `#f1f5f9` at **0.5** opacity over white ≈ `#f8fafc` = card fill. No plate contrast.
- Viewport crop unions **`g.node` only** (`queryInventoryDiagramNodeElements`) plus 12 px. Frames extend 12 px past nodes; labels sit **4 px above** the rect. Outermost borders and labels clip.

### Causal chain (locked)

1. `DiagramResourceGroupPacker.PartitionCells` packs same-RG nodes **inside one connected component**. That is correct IDA-08 packing.
2. `ResolveFrameBounds` then groups **all** placements by `ArmResourceGroup` **name** and takes one AABB. Same RG in two components → one stretched box that swallows everything between them. IDA-08 required an AABB non-overlap test (0.5 px); **it was never written**. There is no `DiagramResourceGroupPackerTests.cs`.
3. Frame pad is a **post-placement** 12 px inflate. Cell gaps (`ComponentHorizontalGap` 48 / `ComponentVerticalGap` 40) are measured between **nodes**, not frames. Visible border-to-border gap = 24 px / **16 px**.
4. `DiagramForestResourceGroupFrameSvgEmitter` has no `stroke-width`. Label is `y = frame.Y - 4` **outside** the rect, `font-size="11"`, fill `#475569`.
5. `help-mermaid.ts` fit/crop ignores `g.rg-frame`.
6. PNG still goes through Graphviz DOT. IDA-08 §6 left `cluster_` out of scope. Executive flatten often removes RG subgraphs, so DOT cannot “just paint `ast.Subgraphs`”.

**Signature (fail this wave if still true after IDF-01–07):** two packed RG cells share an overlapping AABB; a Full-subscription Executive forest still has 1 px `#94a3b8` `5 4` frame strokes; labels sit outside the box and collide; Fit in view clips frame ink; Export PNG has no RG containers while the canvas does.

## Visual language (locked in IDF-03)

Containers are **not** relationships. Dash is already peering (`6 4`, IDA-06) and declared (`4 3`, IDP-02). Frames must not reuse either.

| Property | IDA-08 (today) | After IDF-03 |
|----------|----------------|--------------|
| `stroke-width` | omitted (1 px) | **2** |
| `stroke` | `#94a3b8` (`LightEdgeStroke`) | **`#64748b`** |
| dash | `5 4` | **none (solid)** |
| `fill` | `#f1f5f9` | `#f1f5f9` |
| `fill-opacity` | `0.5` | **`1`** |
| `rx` | `8` | `8` |
| Label | 11 px, 4 px **above** the rect | **12 px semibold**, **inside** top-left, white halo (IDF-02) |

Owner asked to double the line width and add a little space. Solid + darker stroke is what makes “double width” actually read as a **box** rather than a thicker peering chord. Space comes from **frame-aware cell chrome** (IDF-04), not from bumping global `ComponentHorizontalGap` / `ComponentVerticalGap` (IDT/IDG dense ratchet).

## What this set changes

| Bet | From | To | Prompt |
|-----|------|----|--------|
| **Geometry** | One AABB per RG **name** across the whole canvas | One frame per **packed cell**; same name may appear on multiple disjoint frames | IDF-01 |
| **Label** | 11 px outside, colliding in the 16 px gutter | Inside the frame, halo, reserved top band | IDF-02 |
| **Ink** | 1 px `#94a3b8` dash `5 4`, 50% fill | 2 px solid `#64748b`, opaque plate, legend row | IDF-03 |
| **Gap** | 12 px pad stolen from 40/48 px cell gaps | Named `ResourceGroupFramePad` / label band charged to the cell | IDF-04 |
| **Camera** | Crop = node union + 12 px | Crop includes `g.rg-frame` (label + stroke) | IDF-05 |
| **PNG** | Graphviz has no RG clusters | DOT `cluster_` from `ArmResourceGroup` with the same style | IDF-06 |
| **Ratchet** | Count-frames-only test | Overlap, stroke, crop, PNG parity | IDF-07 |

## What this set does *not* change

Keep: inventory-forest as the live Full/Executive canvas. IDA-08 pack-inside-component (do **not** merge disconnected components solely to share a frame). Singleton RGs: IDR caption, no frame. Sparse flatten. IDH `~~~` honesty. IDA palette/cards/elbows/legend. IDP declared dash `4 3`. Export Mermaid topology. Outline columns.

Do **not** draw nested VNet / subnet / NIC / subscription frames. Do **not** undo `FlattenSparseSubgraphs`. Do **not** restore `alpack_*`. Do **not** retune Mermaid `nodeSpacing` / `rankSpacing`. Do **not** bump global component gaps to fake frame gutters. Do **not** default Graphviz `dot`. Do **not** start IDA/IDR/IDP from an IDF chat.

## Run order

**01 → 02 → 03 → 04 → 05 → 06 → 07.**

| Prompt | Parallel? | Depends on |
|--------|-----------|------------|
| **IDF-01** Per-cell frame bounds + AABB tests | First | trunk (IDA-08 frames already on forest) |
| **IDF-02** Label inside + top band | After 01 | Disjoint frames, or labels still overprint |
| **IDF-03** Stroke 2 / solid / opaque fill / legend row | After 02 | Label position stable so halo is not cropped by the old outside-Y |
| **IDF-04** Frame-aware cell chrome (the space) | After 02 | Pad + label band exist as named constants |
| **IDF-05** Crop includes frames | After 02 | Labels inside *or* crop must include outside labels; prefer after 02 |
| **IDF-06** Graphviz PNG cluster parity | After 03 | Style constants exist; packing rule matches forest |
| **IDF-07** Ratchet | Last | 01–06 merged (or land failing tests only for merged slices) |
| **IDF-HOLD** | Not implementation | — |

**IDF-01 before IDF-03.** Doubling stroke on overlapping boxes makes the current canvas *worse*.

**IDF-HOLD** is not implementation. Paste `inventory-diagram-frames-08-hold.md` only if a session starts nested VNet/subnet boxes, a global gap bump, RG frames from an **IDR** chat, Microsoft icons, Mermaid gap retune, Graphviz `dot` as live canvas, or restoring `5 4` / peering `6 4` on frames after IDF-03.

Suggested Cloud Agent branch per prompt: `cursor/inventory-diagram-frames-<short-name>-idf1`. Implementation sessions use a **new** feature branch per prompt. This prompt-set PR lives on `cursor/inventory-diagram-frame-prompts-2688`.

## Prompt files (paste one per session)

| # | File | Flaw it mitigates |
|---|------|-------------------|
| 01 | `inventory-diagram-frames-01-per-cell-bounds.md` | One AABB per RG name overlaps packed cells |
| 02 | `inventory-diagram-frames-02-label-inside.md` | Labels overprint and sit in a 16 px gutter |
| 03 | `inventory-diagram-frames-03-stroke-and-fill.md` | 1 px edge-colored dash reads as a peering wire |
| 04 | `inventory-diagram-frames-04-frame-aware-gap.md` | Pad steals the cell gutter; boxes share edges |
| 05 | `inventory-diagram-frames-05-crop-includes-frames.md` | Fit in view clips frame stroke and labels |
| 06 | `inventory-diagram-frames-06-graphviz-png-parity.md` | PNG has no RG containers |
| 07 | `inventory-diagram-frames-07-visibility-ratchet.md` | Next agent restores name-union / 1 px dash |
| HOLD | `inventory-diagram-frames-08-hold.md` | Nested frames / global gap bump / IDR boxes |

## Follow-on (do not implement from this file)

Nested subscription → RG → VNet → subnet frames stay **IDA-HOLD / IDF-HOLD** when started from those waves. Authorized nesting is **IDX-05 / IDX-06**. Merging disconnected components so one RG is a single island is a later layout engine, not IDF-01 (multiple disjoint frames with the same name are honest).

## After each prompt

Summarize: files changed, tests run, whether two packed cells of the same `ArmResourceGroup` still share one AABB (01: no), whether a Full-subscription Executive forest frame is a **2 px solid `#64748b` plate** (03), residual risk (PNG vs canvas, dense `viewBoxToUnion` ratchet).

## Global constraints (every prompt)

Working-tree safety: `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path <file>` before editing a tracked file. Exit 2 → skip and report. Cloud Agent VMs: if `pwsh` is missing, install per `AGENTS.md` **or** skip the script on a clean branch and say so.

- **Do not** hide desktop review workspace tabs behind **More**.
- **Do not** merge `DraftRequests` and `Runs`. **Do not** unseal sealed records.
- No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**.
- TB-645 vocabulary. Sentence case. Visible-boundary `Button` (no ghost/link).
- C#: concrete types over `var`, LINQ over `foreach` where it does not degrade performance, blank line before `if` / `foreach` unless first in method, one class per file, null checks, no `ConfigureAwait(false)` in tests.
- Verification: focused `dotnet test --filter` or focused Vitest / Playwright named in the prompt. No full-solution build, no dev server unless the file says so.
- Implement only *What to build*.
