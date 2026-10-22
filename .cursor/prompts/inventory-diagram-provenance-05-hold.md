# IDP-HOLD — No teal edges, no five-color legend, no promote-to-observed

**This prompt is not implementation.** Paste only if a session starts coloring declared connections teal, inventing a five-row provenance rainbow, restyling the evidence-graph React Flow viewer, restyling architecture-review diagrams, or promoting `HumanAssertion` to `ObservedFact`.

Follow [`.cursor/prompts/inventory-diagram-provenance-00-index.md`](inventory-diagram-provenance-00-index.md) global constraints.

## Goal

Keep IDP as **dash + the word declared** (and, later, dotted `inferred` for AI). Provenance stays honest. Inventory diagrams rhyme with the architecture-review solid/dashed legend. Teal stays interactive.

## Why

Declared connections exist because Azure inventory cannot prove the edge. Painting them with the same solid stroke as NIC→subnet, or painting them teal so they look “primary,” both lie. Color-only encoding fails grayscale PNG, print, and color-vision deficiency. Five `ProvenanceKind` values are a path-inspector table language, not a connector style guide.

## Do not implement (ever from IDP sessions)

| Temptation | Hold |
|-----------|------|
| Teal / `--al-accent-interactive` declared stroke | Teal is focus/CTA, not provenance |
| Amber declared stroke | Reserved for expiry decay, a different signal |
| Five colors or five dash patterns, one per `ProvenanceKind` | Unreadable legend; DerivedFact is still inventory |
| Color-only with no dash and no `declared` word | a11y + print failure |
| Promote HumanAssertion to ObservedFact so path engines “trust it more” | Plane: AI/human claims are not ARM facts |
| Drop declared edges from diagrams “until confirmed” | They exist to be visible as claims |
| Restyle `GraphViewer` React Flow buyer-trail strokes | Different surface; hero-path color is not provenance |
| Change architecture-review `-.->` inferred meaning | Already shipped; inventory should rhyme, not redefine |
| `linkStyle` indexes in Mermaid | Breaks when packing `~~~` edges shift indexes |
| Inline `%%` after `A --> B` | Mermaid lexes it as NODE_STRING (node comments already learned this) |
| New Azure collector / ARM `dependsOn` as architecture arrows | Plane; **IE-RF-12** |
| Desktop review tabs behind **More** | workspace rule |
| GTM M-90 / M-44 / M-91 / M-92; TB-135 / TB-136 | Owner/GTM |

## If a session is already implementing a hold item

Stop. Revert uncommitted hold-item code. Point at **IDP-01–IDP-03** (and **IDP-04** only if the owner named it). Do not ship teal “declared” connectors as a demo.

## Done when

The hold is written. No code from this file.
