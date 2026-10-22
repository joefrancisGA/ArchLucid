<!-- Diagram edge crossings — Composer prompts. Paste one numbered file per
     session. Origin: 2026-09-24 owner request: connection lines should not
     cross one another. A wider or taller canvas is acceptable. A leftover
     crossing is acceptable when there is no easy uncrossing. Do not implement
     from this index. -->

# Diagram edge crossings — Composer prompt set (DEC-01–DEC-05)

Inventory-forest and data-flow diagrams already keep connectors off **other cards** (`DiagramForestOrthogonalEdgeRouter`, `DiagramForestDataFlowEdgeRouter`). They still let **connectors cross each other**. Each edge is routed alone. Data-flow adjacent columns share one gutter X. Nodes inside a column or rank stay in `OrderKey` order.

**Do not implement from this index.** Paste **one** numbered `.cursor/prompts/diagram-edge-crossings-0N-*.md` file per Composer session.

**Do not treat this set as a V1 assessment scorecard.** No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**.

**Do not re-run IDA, DRS, IDL, IDS, IDT, IDH, IDG, or IDR** inside a DEC session.

## Policy (locked)

1. Prefer fewer edge–edge crossings.
2. A wider or taller diagram is an acceptable cost.
3. If every cheap route still crosses, keep the crossing. Do not add long detours, a new layout library, or a second packing pass to force zero.
4. Shared endpoints are not crossings. Two segments cross only when their interiors intersect.

## What this set changes

| Bet | From | To | Prompt |
|-----|------|----|--------|
| **Count** | No crossing metric | Proper segment intersections, ignoring shared endpoints | DEC-01 |
| **Order** | `OrderKey` inside a column or rank | A few barycenter sweeps inside the column or rank; stop when the count does not drop | DEC-02 |
| **Lanes** | One gutter X and one sky Y | Distinct lanes while the gutter or sky band still fits; share a lane after the cap | DEC-03 |
| **Choice** | First node-clear elbow wins | Among node-clear candidates, pick the one that crosses fewer already routed edges | DEC-04 |
| **Ratchet** | No lock | A swappable pair goes to zero crossings; a known irreducible pair may stay crossed | DEC-05 |

## What this set does not change

Keep inventory-forest as the live canvas. Keep data-flow stage columns. Keep orthogonal strokes, arrow markers, and edge-label collapse. Keep resource-group and subscription frames. Do not move a node into another resource group or another data-flow stage. Do not retune Mermaid `nodeSpacing` or `rankSpacing`. Do not add elk, React Flow, svg-pan-zoom, or Graphviz `splines=ortho`.

## Run order

**01 → 02 → 03 → 04 → 05.**

DEC-01 is measurement only. Later prompts call that counter. DEC-05 only locks the number; it does not invent a new router.
