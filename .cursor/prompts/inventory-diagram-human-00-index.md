<!-- Inventory-diagram human layout — Composer prompts. Paste one numbered
     file per session. Origin: 2026-09-12 owner Export Mermaid of the
     SecureNow Inventory diagrams Executive snapshot (11 VNets, 6 unlabeled
     arrows, 0 subgraphs). Do not implement from this index. -->

# Inventory-diagram human layout — Composer prompt set (IDH-01–IDH-03)

ArchLucid sells a **seat for a repeat professional**. Inventory diagrams must read the way a human would sketch peering: related VNets in a short column, a few columns on one page, 15 px labels, no panning across a white sea.

**Do not implement from this index.** Paste **one** numbered `.cursor/prompts/inventory-diagram-human-0N-*.md` file per Composer / Cloud Agent session.

Canonical wave doc: [`docs/architecture/INFRA_EVIDENCE_INVENTORY_DIAGRAM_HUMAN_COMPOSER_PROMPTS.md`](../../docs/architecture/INFRA_EVIDENCE_INVENTORY_DIAGRAM_HUMAN_COMPOSER_PROMPTS.md).

Locked owner export (do not paraphrase, do not rewrite ids): [`docs/architecture/fixtures/owner-executive-eleven-vnet-2026-09-12.mmd`](../../docs/architecture/fixtures/owner-executive-eleven-vnet-2026-09-12.mmd).

**Do not treat this set as a V1 assessment scorecard.** No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**. **TB-645** vocabulary stays.

**Do not re-run IDS-01–IDS-04, IDL, IDV, IDC, IE-ID.** IDS landed. IDS-02 packing subgraphs are **known-wrong** on this export (see diagnosis). This wave replaces that bet.

## Diagnosis (locked from the owner `.mmd` + Mermaid 11.17.2)

Owner **Export Mermaid** from the screenshot environment (2026-09-12):

- `flowchart TD`
- 11 `microsoft.network/virtualnetworks` nodes (the Nodes table names)
- **6 unlabeled** `A --> B` arrows (not `-->|"peered"|`, not a fabricated n−1 chain)
- **0 subgraphs, 0 `~~~` links**
- Status strip on the screenshot: `11 nodes · 6 edges · 0 subgraphs`

Components in that file (undirected, those six arrows):

| Component | Nodes |
|-----------|--------|
| Triple | `vnet-aep-hi-test-wus-001` → `vnet-edw-hi-nprd-wus-001` → `vnet-eastus-1` |
| Pair | `vnet-avd-hi-nprd` → `vnet-edw-hi-ppd` |
| Pair | `vnet-avd-hi-nonprod01` → `vnet-edw-hi-tst` |
| Pair | `vnet-eastus` → `vnet-pcoe-hi-nprd` |
| Pair | `vnet-edw-hi-dev` → `vnet-userprovision-hi-nonprod01` |

Headless Chrome (Mermaid **11.17.2**, current `createArchitectureDiagramMermaidConfig`: `nodeSpacing: 28`, `rankSpacing: 32`, `padding: 10`, `curve: "linear"`, `wrappingWidth: 240`, `htmlLabels: false`) on that exact text:

| Layout | viewBox | Aspect | At 1180×576 camera |
|--------|---------|--------|---------------------|
| Owner export as-is | 1128 × 208 | 5.3 : 1 | fitScale 1.00, **11/11 visible**, no scroll |
| Master IDS-02 (`alpack_*` subgraphs + one head→head `~~~`) | 2038 × 304 | 7.8 : 1 | fitScale 0.73, **6/11 visible**, horizontal scroll |
| IDH-01 row-pack (no subgraphs; sink of the triple `~~~` every next-row head) | 725 × 357 | 2.0 : 1 | fitScale 1.00, 11/11 visible, 15 px labels |

Mermaid 11 flowchart `extractor` (`chunk-2E4U76K2.mjs`): a subgraph with **no external edges** is extracted into its own dagre graph with rankdir **flipped** (`TB` → `LR`) and **hard-coded** `nodesep: 50`, `ranksep: 50` (+25 on recursive cluster render). IDS-02 wrapping each peering pair in `alpack_*` therefore draws each pair **sideways and wide**, then parks those clusters on one rank. That is the opposite of a human reading.

`ranker: "network-simplex"` in `createArchitectureDiagramMermaidConfig` is a **no-op**. Mermaid's dagre adapter (`dagre-GXQ25YYZ.mjs` `prepareLayoutForDagre`) forwards only `rankdir`, `nodesep`, `ranksep`, `marginx`, `marginy`. Do not keep teaching agents that Mermaid 11 flowcharts default to `tight-tree` (that path is class/state diagrams).

`g.node.getBBox()` is **local to a translated group** (this export: union ≈ 273 × 43 around the origin). Mapping through `getCTM()` is required. The IDS-04 Playwright case uses unmapped `getBBox` and a node-id regex that does not match Mermaid 11 ids (`{renderId}-flowchart-n_…-{n}`), so it cannot fail this screenshot. `ui-playwright-mock-smoke` is `if: github.event_name != 'pull_request'` — the spec has never run on the IDS PRs.

The screenshot zoom control reads **30%**. On this export at zoom 0.3 the camera still shows all 11 nodes (≈13 px tall) with **no** scroll. Two tiny honey nodes far apart on a dual-scrollbar plate is **not** this source at 30%. It is either an older camera, a persisted `diagZoom` against a previous huge plate, or the IDS-02 packed emission. Do not re-fit a diagnosis to the screenshot geometry; lock tests to this `.mmd`.

Unlabeled `-->` means this environment's AST labels are blank (IDL-05 `NormalizePeeringEdgeLabels` only rewrites `GraphEdgeTypes.PeersWith`). Honesty residual, not the spacing bug. IDH-01 must accept unlabeled `-->` **or** `-->|"peered"|` as the six visible edges.

## What this set changes

| Bet | From | To | Prompt |
|-----|------|----|--------|
| **Packing** | IDS-02 `alpack_*` subgraphs + `DiagramPeerGridPlanner` on component **heads** (`ResolveColumnCount(5)=4` → one `~~~`) | No packing subgraphs. Visible components stay `flowchart TD`. Row-pack with layout-only `~~~` from each previous-row **sink** to the next-row **heads**. | IDH-01 |
| **Viewer** | Dead `ranker` key; `diagZoom` survives a new mermaid source; unmapped bbox looks like a 273×43 crop | Drop `ranker`. Reset zoom to 100% when `mermaidSource` changes. Never set `viewBox` from unmapped `getBBox`. | IDH-02 |
| **Ratchet** | IDS-04 packed golden + unmapped bbox + PR-skipped job | This owner `.mmd` (and the IDH-01 packed form) with mapped geometry; job runs on PRs that touch the packer or the spec | IDH-03 |

## What this set does not change

Keep: IDL-01 `~~~` honesty (layout-only excluded from outline/metrics). IDL-02 **zero-edge** peer-grid. IDL-03 11 px floor and isotropic zoom. IDL-05 counts / region swimlanes (`Region ` prefix). Client Mermaid compile. Partitioned fallback, server PNG, outline tables. Help-topic `MermaidDiagram` width-fill. `%% al-type / al-rg / al-seed` comments. `#3177` SVG label wrap.

Do **not** wrap components in subgraphs (including `direction TB` inside `alpack_*` — still 1386×484 vs 1128×208 without subgraphs). Do **not** drop the six real arrows. Do **not** switch the renderer wholesale to `flowchart LR`. Do **not** add elk / svg-pan-zoom. Do **not** hide desktop review workspace tabs.

## Run order

**01 → 02 → 03.** 01 is backend. 02 is viewer-only and may start in parallel with 01 (no file overlap). 03 last; needs 01's emission and 02's camera.

Suggested Cloud Agent branch per prompt: `cursor/inventory-diagram-human-<short-name>-c5f0`. This prompt-set PR lives on `cursor/inventory-diagram-human-prompts-c5f0`.

## Prompt files (paste one per session)

| # | File | Flaw it mitigates |
|---|------|-------------------|
| 01 | `inventory-diagram-human-01-row-pack-components.md` | IDS-02 packing subgraphs flip pairs to LR and widen the plate |
| 02 | `inventory-diagram-human-02-viewer-zoom-and-camera.md` | Dead ranker; persisted 30% zoom; unmapped bbox crop |
| 03 | `inventory-diagram-human-03-owner-mmd-ratchet.md` | Vacuous IDS-04 + job skipped on pull_request |

## After each prompt

Summarize: files changed, tests run, whether the **owner `.mmd`** (and the post-01 packed form) paints as a **human forest — several columns of short TD peerings, 15 px labels, no fabricated arrows, no `alpack_*`**, residual risk.

## Global constraints (every prompt)

Working-tree safety: `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path <file>` before editing a tracked file. Exit 2 → skip and report. Cloud Agent VMs: if `pwsh` is missing, install per `AGENTS.md` **or** skip the script on a clean branch and say so.

- **Do not** hide desktop review workspace tabs behind **More**.
- **Do not** merge `DraftRequests` and `Runs`. **Do not** unseal sealed records.
- No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**.
- TB-645 vocabulary. Sentence case. Visible-boundary `Button` (no ghost/link).
- C#: concrete types over `var`, LINQ over `foreach` where it does not degrade performance, blank line before `if` / `foreach` unless first in method, one class per file, null checks, no `ConfigureAwait(false)` in tests.
- Verification: focused `dotnet test --filter` or focused Vitest / Playwright named in the prompt. No full-solution build, no dev server unless the file says so.
- Implement only *What to build*.
