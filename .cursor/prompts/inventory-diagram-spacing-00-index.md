<!-- Inventory-diagram spacing — Composer prompts. Paste one numbered
     file per session. Origin: 2026-09-12 owner screenshot on SecureNow Inventory
     diagrams (Executive) after IDL landed: camera and honesty are better, but
     resources and their connectors sit too far apart on a mostly empty canvas.
     Do not implement from this index. -->

# Inventory-diagram spacing — Composer prompt set (IDS-01–IDS-04)

ArchLucid sells a **seat for a repeat professional**. Inventory diagrams are an all-day SecureNow tool. A render that is *legible* but requires panning across a white sea to follow a peering connector is not done.

**Do not implement from this index.** Paste **one** numbered `.cursor/prompts/inventory-diagram-spacing-0N-*.md` file per Composer / Cloud Agent session.

Canonical wave doc (diagnosis + copy-below): [`docs/architecture/INFRA_EVIDENCE_INVENTORY_DIAGRAM_SPACING_COMPOSER_PROMPTS.md`](../../docs/architecture/INFRA_EVIDENCE_INVENTORY_DIAGRAM_SPACING_COMPOSER_PROMPTS.md).

**Do not treat this set as a V1 assessment scorecard.** No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**. **TB-645** vocabulary stays. Do **not** implement G-REAL-06.

**Do not continue IDV / IDC / IE-ID / IDL.** Those waves landed. IDL-02's grid is correct for *zero* real edges. This wave is the leftover: **real peering edges skip the grid**, Mermaid spacing/curves inflate the plate, and IDL-04's crop refuses to tighten a padded viewBox.

## Diagnosis (already closed — do not re-diagnose)

Owner screenshot (2026-09-12, follow-up after IDL): Inventory diagrams, mode **Executive**, snapshot `bebca1ae-…` (889 resources), **Render succeeded** **11 nodes · 6 edges · 0 subgraphs**. One readable pale-honey node (`vnet-aep-hi-test-wus-001`) sits on the **right** of a large empty canvas. Horizontal and vertical scrollbars. Nodes table lists the 11 VNets. Edges table lists **six real** `From → To` rows (VNet peerings), not the old fabricated chain.

This is **not** the pre-IDL 6 px ribbon, **not** the fabricated 10-edge chain, **not** overlay-only collapse. Owner: "this is better, but the resources and their connectors are too far apart."

Causal chain (locked):

1. **IDL-05 shipped honest peering edges.** `ExecutiveVnetSummaryBuilder.NormalizePeeringEdgeLabels` maps `PEERS_WITH` → `peered`. The status strip's `6 edges` are real topology. That is a win. Do not revert it to a zero-edge grid.
2. **IDL-02's peer-grid never runs when any visible edge exists.** `DiagramAstLayoutEdgeBuilder.EnsureLayoutEdgesWhenEmpty` returns when `DiagramEdgeVisibility.CountVisible > 0`. Eleven VNets with six peerings are a **forest of small components** (pairs / a triple / isolates), not one connected graph and not the zero-edge grid. Dagre / Mermaid `flowchart TD` places those components far apart.
3. **Mermaid 11 flowchart config is still "presentation sparse".** `createArchitectureDiagramMermaidConfig`: `nodeSpacing: 48`, `rankSpacing: 56`, `padding: 18`, `curve: "basis"`, no `ranker` override. Mermaid 11's default ranker is **`tight-tree`**: each tiny tree gets its own ranks, disconnected components are packed with large gaps, and basis Bézier control points swing wide of the nodes. Connectors look like they belong to a different neighborhood.
4. **IDL-03's legibility floor preserves the sparse plate.** `MERMAID_VIEWPORT_MIN_FIT_SCALE = 11/15`. Contain-fit will not shrink a 3–4×-too-wide forest until labels are 6 px. The camera scrolls. One node fills the frame at a comfortable type size — the owner's screenshot.
5. **IDL-04's crop cannot tighten this plate.** `resolveMermaidInkViewBox` only uses measured ink when it is **inside** source, **≥ 60% of source on both axes**, *and* **flush with all four source extents** (`measuredCoversSourceExtents`). A padded Mermaid viewBox with ink in one corner fails those tests, so the camera keeps the empty source viewBox. Signature: one honey node on the right of a white sea.

Signature: **Render succeeded, `edgeCount` equals real peerings (not 0, not n−1 chain), 0 subgraphs, readable labels, viewport shows ≤ 2 nodes, large empty plate, Edges table matches the six From/To pairs.**

## What this set *does* change

| Bet | From | To | Prompt |
|-----|------|----|--------|
| **Spacing** | 48/56/18 + basis + tight-tree | Compact node/rank gap, linear connectors, `network-simplex` | IDS-01 |
| **Packing** | Any visible edge disables the peer-grid | Disconnected components (including isolates) pack into a viewport-shaped grid; real arrows stay | IDS-02 |
| **Crop** | Measured crop only when flush with the source viewBox | Camera follows the union of `g.node` boxes; empty Mermaid padding is dropped | IDS-03 |
| **Ratchet** | IDL-06 fixtures are zero-edge grid + legacy chain | Owner-shape 11 VNets + 6 peering edges must show several nodes in-frame with short connectors | IDS-04 |

## What this set does *not* change

Keep: `#3013` client Mermaid compile. IDL-01 invisible `~~~` honesty. IDL-02 zero-edge peer-grid. IDL-03 legibility floor and isotropic zoom. IDL-05 counts / `peered` labels / region swimlanes. IDC-01–04 stable budget. IDV overlay chrome. `#2951` / IE-ID sparse flatten. Partitioned fallback, server PNG export, outline tables, `diagZoom` / `diagFullscreen`. Help-topic `MermaidDiagram` **width-fill** path. `%% al-type / al-rg / al-seed` comments.

Do **not** hide peering arrows to recover the zero-edge grid. Do **not** switch the renderer wholesale to `flowchart LR`. Do **not** add svg-pan-zoom, elk, or a new layout engine. Do **not** restore `min-h-[18rem]` empty holes. Do **not** hide desktop review workspace tabs behind **More**. Do **not** flatten region subgraphs (`Region ` prefix stays exempt).

## Relationship to prior work

| Item | Role | This set |
|------|------|----------|
| **IDL-01** | Layout-only links are `~~~`, excluded from outline/metrics | **Keep.** Packing links in IDS-02 are also `IsLayoutOnly` |
| **IDL-02** | Peer-grid only when `CountVisible == 0` | **Keep** that path; IDS-02 is the `CountVisible > 0` leftover |
| **IDL-03** | Min 11 px labels; no upscale; isotropic zoom | Keep the floor. Packing + crop make the floor compatible with "several nodes in view" |
| **IDL-04** | Mermaid viewBox authoritative; 60% + flush-extents | **Subordinate** empty source padding to the node-union crop (IDS-03) |
| **IDL-05** | Executive counts + `peered` edges | **Keep** the edges. They caused this wave; do not drop them |
| **IDL-06** | Zero-edge grid + legacy chain Playwright | Keep; IDS-04 adds the sparse-peering fixture |
| **IDV / IDC / IE-ID** | Camera, collapse, Identity flatten | Do not re-run |

## Run order

**01 → 02 → 03 → 04.**

- **01** is viewer-only (Mermaid init + cluster CSS). Must not change AST emission.
- **02** is backend-only (component packer). Must not change fit/crop/zoom.
- **03** is viewer-only (crop). Must not change Mermaid init constants (01) or AST (02).
- **04** last: locks 01–03 with a browser test on the owner-shape fixture.

**01** and **02** may start in parallel (no file overlap). **03** may start in parallel with **02**. **04** needs 01–03 merged.

Suggested Cloud Agent branch per prompt: `cursor/inventory-diagram-spacing-<short-name>-457d`. Implementation sessions use a **new** feature branch per prompt. This prompt-set PR lives on `cursor/inventory-diagram-spacing-prompts-457d`.

## Prompt files (paste one per session)

| # | File | Flaw it mitigates |
|---|------|-------------------|
| 01 | `inventory-diagram-spacing-01-compact-mermaid-spacing.md` | 48/56 gaps, basis curves, tight-tree component spread |
| 02 | `inventory-diagram-spacing-02-pack-disconnected-components.md` | Real peerings skip the peer-grid; forest laid out as far-apart trees |
| 03 | `inventory-diagram-spacing-03-crop-to-node-union.md` | IDL-04 flush-extents crop keeps the empty Mermaid plate |
| 04 | `inventory-diagram-spacing-04-dense-layout-ratchet.md` | No test for "11 nodes / 6 peerings shows one node in a white sea" |

## Open questions for the owner (defaults apply if unanswered)

1. **Gap size.** IDS-01 defaults: `nodeSpacing: 24`, `rankSpacing: 28`, `padding: 8`. Tighter (`16` / `20` / `6`) if you still see slack after 02/03. Which band?
2. **Packing chrome.** IDS-02 wraps each connected component in an `alpack-*` subgraph so dagre packs clusters, then hides cluster fill/stroke. Alternative: labeled "Peering" groups. Default = **invisible chrome**.
3. **Pair orientation.** Inside a packed cell, a two-node peering stays `TD` (source above target) with a short linear connector. Do not flip those pairs to `LR` unless you say so.

## After each prompt

Summarize: files changed, tests run, whether the owner-shape Executive snapshot (11 VNets, 6 peering edges) renders as a **compact forest — several nodes in the default viewport, peering connectors short, no fabricated arrows, no empty-plate crop**, residual risk.

## Global constraints (every prompt)

Working-tree safety: `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path <file>` before editing a tracked file. Exit 2 → skip and report.

- **Do not** hide desktop review workspace tabs behind **More**.
- **Do not** merge `DraftRequests` and `Runs`. **Do not** unseal sealed records.
- No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**.
- TB-645 vocabulary. Sentence case. Visible-boundary `Button` (no ghost/link).
- C#: concrete types over `var`, LINQ over `foreach` where it does not degrade performance, blank line before `if` / `foreach` unless first in method, one class per file, null checks, no `ConfigureAwait(false)` in tests.
- Verification: focused `dotnet test --filter` or focused Vitest from `archlucid-ui/` named in the prompt. No full-solution build, no dev server unless the file says so.
- Implement only *What to build*.
