# IDT-01 — Tighten Mermaid dagre gaps (undo IDL-07 loosening)

**Wave:** inventory-diagram-dense-spacing (**IDT**). **Depends on:** IDS-01, IDL-07 on trunk. **Do not** implement IDT-02–04.

Do not implement from the wave index. Implement only *What to build*.

## Goal

Restore and surpass **IDS-01** compact spacing. Inventory / architecture Mermaid init must use the **owner-tight** dagre gap band so nodes and ranks sit closer without dropping below the IDL-03 **11 px** legibility floor.

## Why

**IDS-01** (#3154) set `nodeSpacing: 24`, `rankSpacing: 28`, `padding: 8`. **IDL-07** (#3160) changed them to `28`, `32`, `10` while improving zero-edge crop — sparse-peering forests got **looser** dagre gaps the same day the owner said spacing was still too much.

Current `architecture-diagram-mermaid-config.ts` exports `ARCHITECTURE_DIAGRAM_MERMAID_NODE_SPACING = 28`, etc. Tests assert those looser values.

## Context

- `archlucid-ui/src/lib/architecture/architecture-diagram-mermaid-config.ts`
- `archlucid-ui/src/lib/architecture/architecture-diagram-mermaid-config.test.ts`
- `archlucid-ui/src/lib/infra-evidence/export-mermaid-source-to-png.ts` — must share the same init
- `archlucid-ui/src/components/help/MermaidDiagram.tsx` — **must not change**

## What to build

1. Set exported constants to the **owner-tight** band (default unless owner picks fallback in index open questions):
   - `ARCHITECTURE_DIAGRAM_MERMAID_NODE_SPACING = 16`
   - `ARCHITECTURE_DIAGRAM_MERMAID_RANK_SPACING = 20`
   - `ARCHITECTURE_DIAGRAM_MERMAID_PADDING = 6`
   Keep `curve: "linear"`, `ranker: "network-simplex"`, `wrappingWidth: 240`, `useMaxWidth: false`, `htmlLabels: false`.
2. Comment that IDL-07 temporarily loosened gaps for the zero-edge grid; IDT-01 re-tightens for sparse forests. IDL-07 crop logic in `help-mermaid.ts` stays — do not touch fit/crop in this prompt.
3. Update `architecture-diagram-mermaid-config.test.ts` to assert the new constants for light and dark configs.
4. If the zero-edge peer-grid Playwright case (`maxHorizontalGapRatio ≤ 0.75`) fails after tightening, **do not loosen gaps** — report that IDT-04 or label wrapping may be needed. Prefer adjusting only if labels overlap at 11 px floor (then use fallback band `20/24/8` and document in commit).

## Acceptance criteria

- PNG export and on-page canvas share the tighter init.
- Vitest green for config tests.
- Zero-edge IDL-06 peer-grid mock still renders (may need IDT-04 if cluster margin is the failure).

## Constraints

- Working-tree safety before tracked edits.
- **Do not** touch `ArchLucid.ArtifactSynthesis` (IDT-02). **Do not** touch `help-mermaid.ts` crop (IDT-03/04).
- Verification: `cd archlucid-ui && npx vitest run src/lib/architecture/architecture-diagram-mermaid-config.test.ts`
