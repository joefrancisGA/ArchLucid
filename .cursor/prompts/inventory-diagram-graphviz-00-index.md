<!-- Inventory-diagram Graphviz layout — Composer prompts.
     Paste one numbered file per session. Origin: 2026-09-13 owner screenshot
     after IDS/IDT/Fable: Executive still 11 nodes · 6 edges · 0 subgraphs,
     one node on the right of a white sea. Owner: acceptable diagrams by any
     layout engine; do not change the PowerShell extractor. Do not implement
     from this index. -->

# Inventory-diagram Graphviz layout — Composer prompt set (IDG-01–IDG-05 + hold)

ArchLucid sells a **seat for a repeat professional**. Inventory diagrams are an all-day SecureNow tool. After **IDL**, **IDS**, and **IDT**, the owner still sees a sparse Executive forest painted by **Mermaid dagre**. Further `nodeSpacing` passes will not pack disconnected peering pairs.

**Do not implement from this index.** Paste **one** numbered `.cursor/prompts/inventory-diagram-graphviz-0N-*.md` file per Composer / Cloud Agent session.

Canonical wave doc (diagnosis + copy-below): [`docs/architecture/INFRA_EVIDENCE_INVENTORY_DIAGRAM_GRAPHVIZ_COMPOSER_PROMPTS.md`](../../docs/architecture/INFRA_EVIDENCE_INVENTORY_DIAGRAM_GRAPHVIZ_COMPOSER_PROMPTS.md).

**Do not treat this set as a V1 assessment scorecard.** No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**. **TB-645** vocabulary stays.

Locked owner export (do not rewrite ids): [`docs/architecture/fixtures/owner-executive-eleven-vnet-2026-09-12.mmd`](../../docs/architecture/fixtures/owner-executive-eleven-vnet-2026-09-12.mmd) — 11 VNets, 6 unlabeled `-->`, 0 subgraphs.

**IDH** is a Mermaid-only row-pack (no `alpack_*`). Owner 2026-09-13 still saw the white sea and asked for Composer prompts for **Graphviz**. Do not re-run IDH inside an IDG session. Do not treat IDH measurements of the `.mmd` at 100% as “layout is done.” The workbench still paints dagre unless IDG-03 lands.

**Do not re-run IDL, IDS, IDT, or IDH wholesale.** This set adds a **Graphviz layout backend from `DiagramAst`**. Mermaid remains the docs/export format. IDH `~~~` row-pack, if present, is Mermaid-only — DOT omits `IsLayoutOnly` edges.

## Diagnosis (locked — do not re-diagnose)

### What the owner sees (2026-09-13)

Inventory diagrams (`/governance/infrastructure/diagrams`), snapshot `bebca1aa-9fba-408a-b9ce-2794678c4281` (889 resources). **Executive**. Green **Render succeeded — 11 nodes · 6 edges · 0 subgraphs**. One pale-honey node (`vnet-edw-hi-rprd-wus-001`) on the **right** of a large empty canvas. Horizontal scrollbar. Nodes table lists 11 VNets. Edges table lists six real VNet peerings.

Owner: the saved Mermaid file has **no spacing directives**, but the display has wide distances. They will take **anything that produces acceptable diagrams**. Do **not** change the PowerShell extractor.

### Why Mermaid gap constants cannot finish this

Mermaid `.mmd` is topology (`flowchart TD` + `-->`). Layout lives in browser `mermaid.initialize()` (`architecture-diagram-mermaid-config.ts`). Gap constants are already in a compact band; further `nodeSpacing` passes will not pack a forest. Dagre still assigns ranks to disconnected peering pairs. `ranker: "network-simplex"` is a no-op in Mermaid 11 flowcharts (IDH).

Cropping to the union of `g.node` boxes (IDS-03) only trims padding **outside** the outermost nodes. If eleven nodes already sit at opposite corners, the union is still a white sea **between** them.

**0 subgraphs** on this snapshot means packing clusters (`alpack_*`) are not in the served render. Even if they were, compound-subgraph margin is why IDT-04 exists. Stop steering dagre.

### Causal chain (locked)

1. **The graph is already correct enough to draw.** Six `From → To` peerings and eleven VNet labels are in the outline. The extractor did its job.
2. **ARM `dependsOn` / PowerShell DOT is the wrong source.** **IE-RF-12** holds: deploy DAG ≠ VM∈VNet. Do not add Graphviz to `Get-ArchLucidAzurePackage.ps1`.
3. **`DiagramAst` is the relationship model.** Same compiler spine: snapshot graph → `DiagramAstFromGraphCompiler` → renderer. Graphviz is a **second renderer**, not a second collector.
4. **Layered rankers share the failure.** Mermaid dagre and Graphviz `dot` both stretch forests. Default engine for this wave is **`fdp`** (force-directed). Not `dot`. Not another `nodeSpacing` pass.
5. **Review-detail human Mermaid artifacts stay Mermaid.** This wave is **inventory snapshot diagrams** only.

**Signature (fail this wave if still true after IDG-01–05):** Executive owner snapshot, default zoom, fewer than **8 of 11** nodes in the visible viewport, or a white sea with one node on the right, or PNG/canvas layout that does not match.

## What this set changes

| Bet | From | To | Prompt |
|-----|------|----|--------|
| **DOT from AST** | Mermaid text is the only layout input | `DiagramAst` → Graphviz DOT (`fdp`) | IDG-01 |
| **Server SVG** | Browser dagre paints inventory | `fdp -Tsvg`, sanitized, fail-soft to Mermaid | IDG-02 |
| **Canvas** | Client `mermaid.render` for inventory | Paint sanitized SVG; **Export Mermaid** unchanged | IDG-03 |
| **Fit** | Viewport helpers assume Mermaid `g.node` only | Fit Graphviz SVG; PNG matches canvas | IDG-04 |
| **Ratchet** | Sparse-peering mock still allows a white sea | Owner-shape: ≥8/11 nodes in view, short peerings | IDG-05 |

## What this set does *not* change

Keep: one Azure collector. **IE-RF-12**. IDL-01 `~~~` honesty on the Mermaid export path. IDL-03 11 px floor. IDL-05 `peered` labels. IDS/IDT Mermaid init (do not retune). `#3013` client Mermaid for **non-inventory** diagrams. Outline tables from AST / Mermaid source. `diagZoom` / `diagFullscreen`. Help-topic `MermaidDiagram`. `%% al-type / al-rg / al-seed` comments.

Do **not** hide peering arrows. Do **not** shrink labels below 11 px. Do **not** add elk or svg-pan-zoom. Do **not** hide desktop review workspace tabs behind **More**.

## Run order

**01 → 02 → 03 → 04 → 05.**

- **01** backend DOT only. May start without UI.
- **02** needs 01 (renderer + Docker `graphviz`).
- **03** needs 02 (workbench paints SVG).
- **04** needs 03 (fit + PNG).
- **05** last (Playwright).

**IDG-HOLD** is not implementation. Paste `inventory-diagram-graphviz-06-hold.md` only if a session starts editing the extractor, ARM `dependsOn` arrows, or a second ZIP.

Suggested Cloud Agent branch per prompt: `cursor/inventory-diagram-graphviz-<short-name>-717e`. Implementation sessions use a **new** feature branch per prompt. This prompt-set PR lives on `cursor/inventory-diagram-graphviz-prompts-717e`.

## Prompt files (paste one per session)

| # | File | Flaw it mitigates |
|---|------|-------------------|
| 01 | `inventory-diagram-graphviz-01-diagramast-to-dot.md` | Dagre/Mermaid text cannot pack a peering forest |
| 02 | `inventory-diagram-graphviz-02-server-fdp-svg.md` | No native `fdp` layout in the API image |
| 03 | `inventory-diagram-graphviz-03-inventory-canvas-svg.md` | Workbench still calls client Mermaid for inventory |
| 04 | `inventory-diagram-graphviz-04-fit-and-png.md` | Graphviz SVG/PNG not fitted like the mermaid camera |
| 05 | `inventory-diagram-graphviz-05-owner-shape-ratchet.md` | No browser lock that 11/6 is compact |
| HOLD | `inventory-diagram-graphviz-06-hold.md` | Extractor DOT / `dependsOn` temptation |

## Open questions for the owner (defaults apply if unanswered)

1. **Default engine.** IDG-03 default: Graphviz `fdp` for inventory snapshot canvases when `fdp` exists; Mermaid if the binary is missing. Review-detail architecture artifacts stay Mermaid. OK?
2. **Connected graphs.** Sparse forests use `fdp`. If a mode is one large connected component, still `fdp` (not `dot`) unless overlap is proven worse. OK?
3. **Export PNG.** After IDG-04, inventory PNG uses Graphviz `-Tpng` so it matches the canvas. Export Mermaid (saved) stays `.mmd`. OK?

## After each prompt

Summarize: files changed, tests run, whether Executive snapshot `bebca1aa-…` would show a **compact forest** (most VNets in the default viewport, short peering connectors, no fabricated arrows, no extractor changes), residual risk.

## Global constraints (every prompt)

Working-tree safety: `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path <file>` before editing a tracked file. Exit 2 → skip and report.

- **Do not** hide desktop review workspace tabs behind **More**.
- **Do not** merge `DraftRequests` and `Runs`. **Do not** unseal sealed records.
- No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**.
- TB-645 vocabulary. Sentence case. Visible-boundary `Button` (no ghost/link).
- C#: concrete types over `var`, LINQ over `foreach` where it does not degrade performance, blank line before `if` / `foreach` unless first in method, one class per file, null checks, no `ConfigureAwait(false)` in tests.
- Verification: focused `dotnet test --filter` or focused Vitest / Playwright named in the prompt. No full-solution build unless the file says so.
- Implement only *What to build*.
