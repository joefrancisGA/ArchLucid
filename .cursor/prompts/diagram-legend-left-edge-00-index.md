<!-- Diagram legend — left-edge category. Paste one numbered file per session.
     Origin: 2026-09-24 owner SecureNow Diagrams screenshot (Identity,
     Hmd_HI_HAP_Non_Prod). Cards already have a 4 px left accent (IDA-02).
     The HTML block titled "Diagram legend" only explains solid vs dotted
     connectors. Do not implement from this index. -->

# Diagram legend — left-edge color (DLE-01–DLE-02)

**Do not implement from this index.** Paste **one** numbered file per session.

The owner asked for a color key for the **left edges of the boxes**, under the existing **Diagram legend**, and asked for the best treatment before any code.

## Recommendation (locked)

Put a **Left edge** swatch row **inside the same card** as the connector bullets. Do not add a second heading, a second card, or color-name sentences ("blue means compute").

Why this and not the alternatives:

| Option | Verdict |
|--------|---------|
| **Swatch row in the existing card** | Use this. The bar on the card and the bar in the key are the same mark. Six categories fit one wrapping row. |
| Color-name bullets ("Blue — compute") | Reject. Color names fail for color-vision differences, and amber/teal/pink are easy to misname (the 2026-09-24 screenshot reads Identity pink and Storage amber as yellow/green). |
| Always list all six categories | Reject for the open row. Unused colors look like missing resources. Teach only what this diagram paints. |
| New section under the card | Reject. Two "legends" split one key. Provenance (line style) and category (left edge) are different channels and belong as two groups in one card. |
| Rely on the on-canvas SVG legend (IDA-09) | Not enough. That legend is real SVG and survives PNG, but it is placed under the node union. The live viewport is cropped (`max-h-[42rem]`), so the owner never sees it while reading **Diagram legend**. Keep it; do not make it the only key. |
| One color per Azure product, or Microsoft icons | Reject. The bar is `DiagramInventoryPictogramKind` (six buckets). Product icons stay out (IDA-HOLD / Azure icon pack is a separate decision). |

## What the colors already mean

Source of truth: `DiagramInventoryPictogramKindColors.FillFor`. Do not invent a second palette.

| Kind | Word in the legend | Fill |
|------|--------------------|------|
| Compute | Compute | `#2563eb` |
| Network | Network | `#0f766e` |
| Data | Data | `#7c3aed` |
| Storage | Storage | `#d97706` |
| Identity | Identity | `#db2777` |
| Generic | Other | `#475569` |

Key Vault is **Identity** (pink), not a yellow status. Storage is **amber**. Network is **teal**. The key icon on a card is not the left edge.

One gloss, always, when the row is shown:

> Left edge color is the resource category. It is not connection evidence.

That sentence is the point of the row. Solid vs dotted stays the evidence key. A reader must not treat a pink bar as "inferred."

## Run order

**01 then 02.**

| Prompt | What it does |
|--------|----------------|
| **DLE-01** | HTML **Diagram legend**: show a Left edge swatch row for fills actually painted on this `layoutSvg`. Show the card when accents exist even if every connector is solid. |
| **DLE-02** | PNG/on-canvas legend: replace the jargon line `Eyebrow color = category swatch` with `Left edge` so export uses the same words as the page. |

## Prompt files

| # | File |
|---|------|
| 01 | `diagram-legend-left-edge-01-html-swatches.md` |
| 02 | `diagram-legend-left-edge-02-svg-wording.md` |

## Global constraints (every prompt)

- Implement only *What to build* in that file.
- Working-tree safety: `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path <file>` before editing a tracked file. Exit 2 → skip and report.
- Do not recolor cards. Do not add Microsoft icons. Do not map ARM types to colors in TypeScript (the painted `rect.node-accent` fill is the fact).
- Sentence case. `OPERATOR_TYPOGRAPHY`. No ghost/link buttons. No new pastel card.
- No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**.
- No full-solution build. No dev server unless the file says so.
