# AZI-HOLD — No CDN, no public folder, no Graphviz IMG, no layout retune

**This prompt is not implementation.** Paste it only if a session starts a second icon pipeline, a Microsoft CDN, Graphviz `<IMG>`, a layout/spacing pass, or a 36-row product legend.

Follow `.cursor/prompts/azure-icons-00-index.md` global constraints.

## Goal

Keep Azure product icons on the inventory-forest card slot, loaded from the embedded manifest, with category pictograms as the miss path.

## Why

The owner already collected the starter set under `ArchLucid.ArtifactSynthesis/Assets/AzureIcons/`. IDA-HOLD still blocks icon work that starts inside an aesthetics chat. AZI is the only authorized wave. Graphviz HTML labels cannot reliably keep `data:` URIs, and Graphviz is not the live canvas.

## Do not implement (from an AZI session)

| Temptation | Hold |
|------------|------|
| Copy PNGs into `archlucid-ui/public` or import them from React | Forest SVG embeds the bytes; the UI only sanitizes |
| `<image href="https://...">` or a Microsoft icon CDN | Sanitize must reject non-data hrefs |
| Prefix match (`Microsoft.Network/` → one icon) | Exact ARM type only |
| Graphviz `<IMG SRC>` or swapping the live engine to Graphviz | PNG fallback stays accent + text |
| Change `PictogramSize`, card width, gaps, frames, edges | Icon occupies the current slot |
| Legend row per product | Legend stays Compute / Network / Data / Storage / Identity |
| Re-download the full Azure icon ZIP | Asset swap is a same-filename replace, not a new wave |
| Thread ARM `kind` by scraping labels | Function App waits until `DiagramNode` has a real kind field |
| Put icons on nav / page headings | Those stay Lucide |

## If a session is already implementing a hold item

Stop. Revert uncommitted hold-item code. Point at **AZI-01–AZI-04**.

## Done when

The hold is written. No code from this file.
