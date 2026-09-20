<!-- Inventory-diagram overwritten labels — Composer prompts.
     Paste one numbered file per session. Origin: 2026-09-16 owner Executive
     inventory canvas (snapshot bebca1aa-…, 424 resources / 61 visible): red
     circle on the top-left card where cluster title, node name, and zoom hint
     occupy the same pixels. Do not implement from this index. -->

# Inventory-diagram label collision — Composer prompt set (IDLC-01–IDLC-04 + hold)

ArchLucid sells a **seat for a repeat professional**. Inventory diagrams are an all-day SecureNow surface. On Executive (and any mermaid/Graphviz cluster plate) the **first card in the first dashed swimlane** paints two or three strings on top of each other: the resource name, the cluster/subgraph title, and sometimes the stacked zoom hint.

**Do not implement from this index.** Paste **one** numbered `.cursor/prompts/inventory-diagram-label-collision-0N-*.md` file per Composer / Cloud Agent session.

Canonical wave doc (diagnosis + copy-below): [`docs/architecture/INFRA_EVIDENCE_INVENTORY_DIAGRAM_LABEL_COLLISION_COMPOSER_PROMPTS.md`](../../docs/architecture/INFRA_EVIDENCE_INVENTORY_DIAGRAM_LABEL_COLLISION_COMPOSER_PROMPTS.md).

**Do not treat this set as a V1 assessment scorecard.** No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**. **TB-645** vocabulary stays.

**Do not re-run IDL, IDS, IDT, IDH, IDG, IDR, IE-ND, IE-ID, or IE-DD** inside an IDLC session. Do **not** undo IDT-01 `16/20/6` node/rank gaps to “make room for titles.” Cluster title geometry is the failure, not dagre slack.

## Diagnosis (locked — do not re-diagnose)

### What the owner sees (2026-09-16)

Inventory diagrams (`/governance/infrastructure/diagrams`), snapshot `bebca1aa-9fba-408a-b9ce-2794678c4281`, **Executive**, 73% zoom. Red circle on the **top-left** card (`vnet-app-hi-test-wus-001`). Glyphs look overwritten. Interior groups show a small grey title on the dashed border (`only app-hi-tst`, `only prod-hi-rgpd`, …) with a few pixels of gutter. The first group is flush with the canvas origin, so that title sits **on** the card. The stacked hint `Focus the diagram, then Ctrl+scroll to zoom…` sits immediately above the frame and is clipped by the same circle.

### Causal chain (locked)

1. **Cluster titles are painted as node labels.** `replaceForeignObjectWithSvgText` converts **every** Mermaid `foreignObject` (cluster titles and edge labels included) to `<text class="nodeLabel">` with `text-anchor="middle"` and `dominant-baseline="middle"` at the foreignObject **center**. Cluster-header boxes extend into the first node. Mermaid 11 still emits HTML labels inside `foreignObject` when `htmlLabels` is false. If a native `cluster-label` `<text>` already exists, converting the foreignObject **duplicates** the title.

2. **Cluster padding is smaller than a title line.** `ARCHITECTURE_DIAGRAM_MERMAID_PADDING = 6` (IDT-01). Graphviz DOT emits `subgraph cluster_* { label=…; }` with no `labelloc` / `labeljust` / `margin`. Default title sits at the top of the cluster, on the first member.

3. **Forest name + RG captions get recentered.** IDR-02 draws a bold name `<text>` plus a muted RG `<text>` below it. Client `wrapExistingNodeSvgLabels` still wraps the **first** `g.node text` with a negative first `dy` (mermaid 15px metrics, center of the original `y`). That `y` is the first line under the pictogram, not the rect center — wrapped name lines move up into the pictogram and down through the RG line.

4. **Display normalize flattens tspans.** `normalizeInfraEvidenceLayoutSvgForDisplay` assigns `textContent` on both `text` and `tspan`. Setting the parent `<text>` destroys child tspans, then wrap/recenter in (3) is more likely.

5. **SVG `overflow: visible`** (`prepareMermaidSvgForResponsiveLayout` and `sanitizeArchitectureDiagramSvg`) lets the first cluster title paint through the top of the SVG. Stacked controls (`viewportControlsLayout="stacked"` on `DiagramsWorkbenchClient`) put `ARCHITECTURE_DIAGRAM_VIEWPORT_HINT` in normal flow just above the frame.

**Signature (fail this wave if still true after IDLC-01–04):** top-left Executive card shows two overlapping strings; cluster title uses `class="nodeLabel"`; a `g.node` with a pictogram plus two `<text>` siblings has wrapped tspans recentered on the name `y`; or the stacked zoom hint is overwritten by diagram ink.

## What this set changes

| Bet | From | To | Prompt |
|-----|------|----|--------|
| **Sanitize labels** | Every FO → centered `nodeLabel`; wrap first text in every `g.node` | Cluster FO → `cluster-label` at the title box top; skip wrap when the node already has name+RG texts; do not duplicate native cluster text; do not flatten tspans via parent `textContent` | IDLC-01 |
| **Title band** | 6px cluster padding, title inside first node | Cluster rect reserves a title band above the first node (no IDT gap rewind) | IDLC-02 |
| **Graphviz clusters** | `label=` only | `labelloc=t`, `labeljust=l`, explicit `margin` so PNG/fallback SVG titles are not on the first member | IDLC-03 |
| **Hint vs ink** | `overflow: visible` into stacked hint | Camera/host clips or pads so title ink cannot paint the hint; hint copy stays honest | IDLC-04 |

## What this set does *not* change

Keep: IDT-01 `nodeSpacing` 16 / `rankSpacing` 20 / `padding` 6 as **node/rank** gaps. IDR forest RG captions (muted second line). Forest packing by connected component. Sparse flatten. `htmlLabels: false`. Export Mermaid topology. Help-topic `MermaidDiagram`. `alpack_*` stays deleted. IDV stacked vs overlay control layouts.

Do **not** set `htmlLabels: true`. Do **not** hide the zoom hint. Do **not** draw RG bounding boxes or pack-by-RG. Do **not** restore packing subgraphs. Do **not** hide desktop review workspace tabs.

## Run order

**01 → 02.** **03** and **04** may start in parallel with **01** (no file overlap).

- **01** sanitizer + SecureNow SVG display normalize. Land before 02.
- **02** needs 01 (`cluster-label` class and non-centered cluster text).
- **03** backend DOT only. Parallel with 01.
- **04** viewport frame / camera only. Parallel with 01. Merge 01 before calling the wave done if 04 depends on remaining overflow from unconverted labels.

**IDLC-HOLD** is not implementation. Paste `inventory-diagram-label-collision-05-hold.md` only if a session starts loosening IDT gaps, `htmlLabels: true`, RG frames, or deleting the zoom hint.

Suggested Cloud Agent branch per prompt: `cursor/inventory-diagram-label-collision-<short-name>-a3c1`. Implementation sessions use a **new** feature branch per prompt. This prompt-set PR lives on `cursor/inventory-diagram-label-collision-prompts-8f8c`.

## Prompt files (paste one per session)

| # | File | Flaw it mitigates |
|---|------|-------------------|
| 01 | `inventory-diagram-label-collision-01-sanitize-cluster-and-forest-labels.md` | Cluster FO painted as nodeLabel; forest wrap recenter; tspan flatten |
| 02 | `inventory-diagram-label-collision-02-cluster-title-band.md` | Title still inside first node after 01 |
| 03 | `inventory-diagram-label-collision-03-graphviz-cluster-margin.md` | DOT cluster title on first member (PNG / fdp fallback) |
| 04 | `inventory-diagram-label-collision-04-viewport-hint-clip.md` | Overflow into stacked zoom hint |
| HOLD | `inventory-diagram-label-collision-05-hold.md` | Gap rewind / htmlLabels / RG boxes / hide hint |

## Follow-on (do not implement from this file)

RG **bounding boxes** stay IDR-HOLD. Another IDT `nodeSpacing` pass is not this wave. Honest empty-title clusters (hide packing labels) is only in scope if a remaining `alpack_*` or empty `label` still ships — do not restore those subgraphs to “fix” titles.

## After each prompt

Summarize: files changed, tests run, whether a fixture cluster title still uses `class="nodeLabel"` or shares a bbox with the first node rect, whether a forest card with name + RG still has two sibling `<text>` elements after sanitize, residual risk (edge labels, Export PNG).

## Global constraints (every prompt)

Working-tree safety: `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path <file>` before editing a tracked file. Exit 2 → skip and report.

- **Do not** hide desktop review workspace tabs behind **More**.
- **Do not** merge `DraftRequests` and `Runs`. **Do not** unseal sealed records.
- No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**.
- TB-645 vocabulary. Sentence case.
- C#: concrete types over `var`, LINQ over `foreach` where it does not degrade performance, blank line before `if` / `foreach` unless first in method, one class per file, null checks, no `ConfigureAwait(false)` in tests.
- TypeScript: no inline imports; exhaustive `switch` on unions.
- Verification: focused `dotnet test --filter` / Vitest named in the prompt. No full-solution build unless the file says so.
- Implement only *What to build*.
