<!-- Azure architecture icons — Composer prompts. Paste one numbered file per
     session. Origin: 2026-09-22 owner collected 36 Microsoft Azure service
     PNGs under ArchLucid.ArtifactSynthesis/Assets/AzureIcons and asked to wire
     them into inventory diagrams. Do not implement from this index. -->

# Azure architecture icons — Composer prompt set (AZI-01–AZI-04 + hold)

Inventory diagrams still paint **original category pictograms** (`DiagramInventoryPictogramSvgEmitter`). The owner has approved official Microsoft Azure Architecture Icons and committed a starter set on branch `cursor/azure-icons-starter-set-a0c9` (PR **#3585**).

**Do not implement from this index.** Paste **one** numbered `.cursor/prompts/azure-icons-0N-*.md` file per Composer / Cloud Agent session.

**This set is the authorized exception to IDA-HOLD.** IDA / IDX / IDF chats must still refuse a drive-by icon pack. Icon work starts only from an **AZI** prompt.

**Do not treat this set as a V1 assessment scorecard.** No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**.

## What already exists

| Piece | Where |
|-------|--------|
| 36 PNG icons (18×18) | `ArchLucid.ArtifactSynthesis/Assets/AzureIcons/*.png` |
| ARM-type manifest | `ArchLucid.ArtifactSynthesis/Assets/AzureIcons/azure-icon-manifest.json` |
| Live canvas | `DiagramForestLayoutSvgRenderer` → `DiagramForestNodeSvgEmitter` |
| Fallback glyphs | `DiagramInventoryPictogramSvgEmitter` (keep) |
| Category accent | `rect.node-accent` via `DiagramInventoryPictogramKindColors` (keep) |
| Client SVG sanitize | `sanitizeArchitectureDiagramSvg` in `archlucid-ui/src/lib/architecture/architecture-diagram-svg.ts` |

The PNGs are the chat-captured starter set, not the full Microsoft SVG pack. **Do not re-download icons.** A later asset swap can replace a file of the same name.

`DiagramNode` has `ArmResourceType` and does **not** have an ARM `kind`. `Microsoft.Web/sites` therefore resolves to **App Service** until a later wave threads `kind=functionapp`. The Function App row stays in the manifest and is selected only when a caller passes that kind.

## What this set changes

| Bet | From | To | Prompt |
|-----|------|----|--------|
| **Catalog** | JSON + PNGs on disk, unused | Embedded resources + exact ARM-type resolver | AZI-01 |
| **Forest card** | Category pictogram on every node | Product icon when the resolver hits; pictogram otherwise | AZI-02 |
| **Browser** | DOMPurify may strip `data:` image hrefs | Sanitized forest SVG still shows the icon; legend stays category-level | AZI-03 |
| **Ratchet** | No test that an unmapped type keeps the pictogram | Mapped type embeds the PNG; unmapped type stays a pictogram; accent bar stays | AZI-04 |

## What this set does *not* change

- Card size, padding, accent bar, orthogonal edges, RG frames, hub-spoke, camera, outline tables.
- Legend contents: category kinds (Compute, Network, …), not 36 product names.
- Graphviz HTML labels. Graphviz stays the PNG fallback with the category accent. Do not add `<IMG>` there.
- `archlucid-ui/public/`. Icons are embedded in the SVG, not served as static files.
- Mermaid source. Do not inject icon URLs into Mermaid.
- Prefix matching. `Microsoft.Network/virtualNetworks` must not match `Microsoft.Network/loadBalancers`.

## Run order

**01 → 02 → 03 → 04.**

| Prompt | Depends on |
|--------|------------|
| **AZI-01** Catalog + resolver | Icon assets committed (this branch or merged trunk) |
| **AZI-02** Forest `<image>` | AZI-01 |
| **AZI-03** Sanitize + legend honesty | AZI-02 |
| **AZI-04** Ratchet | AZI-01–03 |
| **AZI-HOLD** | Not implementation |

Each implementation session uses a **new** feature branch. Suggested prefix: `cursor/azure-icons-<short-name>-`. Base on `cursor/azure-icons-starter-set-a0c9` until PR **#3585** merges, then on `master`. Do not copy the PNGs into a second folder.

## Prompt files (paste one per session)

| # | File | What it does |
|---|------|----------------|
| 01 | `azure-icons-01-catalog-resolver.md` | Load the manifest and resolve an ARM type to PNG bytes |
| 02 | `azure-icons-02-forest-svg.md` | Draw the PNG on the forest card; pictogram fallback |
| 03 | `azure-icons-03-sanitize-and-legend.md` | Keep the data-URI image after DOMPurify; do not expand the legend |
| 04 | `azure-icons-04-ratchet.md` | Lock mapped vs unmapped behavior |
| HOLD | `azure-icons-05-hold.md` | Stop Graphviz IMG, public CDN, UI public folder, layout retune |

## After each prompt

Summarize: files changed, tests run, one mapped ARM type that now embeds an image, one unmapped ARM type that still has `g.pictogram`, and whether the accent bar is unchanged.

## Global constraints (every prompt)

Working-tree safety: `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path <file>` before editing a tracked file. Exit 2 → skip and report. Cloud Agent VMs: if `pwsh` is missing, install per `AGENTS.md` or skip the script on a clean branch and say so.

- **Do not** hide desktop review workspace tabs behind **More**.
- **Do not** put icons in `archlucid-ui/public` or fetch a Microsoft CDN.
- **Do not** change `DiagramForestLayoutOptions` sizes.
- **Do not** remove `rect.node-accent` or category pictograms.
- No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**.
- C#: concrete types over `var`, LINQ where it does not degrade performance, blank line before `if` / `foreach` unless first in method, one class per file, null checks. No `ConfigureAwait(false)` in tests.
- Verification: the focused `dotnet test` / Vitest named in the prompt. No full-solution build. Heartbeat `STILL EXECUTING... HH:mm:ss` every 8s when a command is expected to exceed 15s.
