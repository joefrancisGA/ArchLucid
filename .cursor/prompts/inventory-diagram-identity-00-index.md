<!-- Inventory diagrams Identity mode — Composer prompts. Paste one numbered
     file per session. Origin: 2026-09-11 owner diagnosis on SecureNow Inventory
     diagrams (Identity mode): server mermaid Succeeded (18 nodes / 17 edges /
     14 subgraphs) but the canvas does not appear.
     Do not implement from this index. -->

# Inventory-diagram Identity — Composer prompt set (IE-ID-01–IE-ID-03)

ArchLucid sells a **seat for a repeat professional**. Inventory diagrams are an all-day SecureNow tool. Identity mode must paint a graph when the snapshot has managed identities, not a zoom cluster sitting on the Nodes table.

**Do not implement from this index.** Paste **one** numbered `.cursor/prompts/inventory-diagram-identity-0N-*.md` file per Composer / Cloud Agent session.

Canonical wave doc (diagnosis + copy-below): [`docs/architecture/INFRA_EVIDENCE_IDENTITY_DIAGRAM_COMPOSER_PROMPTS.md`](../../docs/architecture/INFRA_EVIDENCE_IDENTITY_DIAGRAM_COMPOSER_PROMPTS.md).

**Do not treat this set as a V1 assessment scorecard.** No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**. **TB-645** vocabulary stays. Do **not** implement G-REAL-06.

## Diagnosis (already closed — do not re-diagnose)

Owner screenshot: Inventory diagrams, mode **Identity**, snapshot ~889 resources, **Render succeeded · 18 nodes · 17 edges · 14 subgraphs**. Export Mermaid armed. Nodes/Edges outline populated (resource type column `–`, RG from `RG …` subgraph labels). Right-aligned zoom cluster at 130%. **No diagram frame, no cluster boxes, no mermaid.js error, no “too large” banner.** Footer “Build identity unavailable” is the deployment SHA — unrelated.

Causal chain (locked):

1. Identity filter works. `DiagramMode.Identity` keeps `GraphTopologyCategories.Identity` (ARM `managedidentity` / `authorization`). The 18 rows are real topology nodes.
2. `DiagramSubgraphPlanner` wraps each node in Subscription → `RG {name}` clusters. ~12 RGs + subscription ≈ **14 subgraphs**. Parent subscription cluster has **no direct nodes**, only nested RG children. Seventeen **cross-RG** identity edges.
3. `DiagramAstExecutiveLayoutSimplifier.ModeFlattensSparseSubgraphs` is **Executive | Data | Network** only. Threshold is 8. Identity is excluded. **IE-ND-03** added Network and said do not expand to Identity — this set is that leftover.
4. Renderer emits `flowchart TD` with that nested tree. Server “Succeeded” is Mermaid **text**, not SVG. Outline tables parse the text. Client `mermaid` 11 nested-subgraph + ink `getBBox`/`getCTM` is the paint failure class.
5. After **IDV**, zoom chrome is `position: absolute` on a viewport with `max-h-[36rem]` and **no min-height**. `prepareMermaidSvgForResponsiveLayout` strips SVG height. Contain-fit crops to mapped node ink; nested clusters often yield a tiny origin box or null bbox. Overlay is out of flow → canvas collapses to the toolbar on top of Nodes.

**This is not** an empty Identity query, not IE-17 oversized, not `#3013` missing `mermaidSource`.

## What this set *does* change

| Bet | From | To | Prompt |
|-----|------|----|--------|
| **Flatten** | Identity keeps ≥8 sparse RG swimlanes | Same flatten as Executive / Data / Network | **IE-ID-01** |
| **Contract** | No Identity mermaid snapshot assertion | GET `mode=identity` must include MI labels; sparse compile has no `subgraph` | **IE-ID-02** |
| **Viewport** | Nested leftover (or failed ink bbox) collapses to overlay-only | In-flow ink or render-failure UI; overlay stays on a real frame | **IE-ID-03** |

## What this set does *not* change

Keep: `#3013` client mermaid compile. `#2951` / **IE-ND-03** flatten for Executive / Data / Network. **IDV** contain-fit, camera zoom, overlay chrome. `flowchart TD`. Outline tables. Server PNG export. Partitioned fallback. URL `diagZoom` / `diagFullscreen`.

Do **not** switch emission to `flowchart LR`. Do **not** restore `min-h-[18rem]` as a hole around a successful small graph (IDV-01). Do **not** flatten Full Subscription, Resource Group, Selected Resources, or Dependency Neighborhood. Do **not** re-run IE-ND-01 classifier, IE-ND-04 subnet planner, IE-UX-02, or SH-13. Do **not** treat outline `Resource type` `–` (missing `al-type`) as this blank-canvas bug. Do **not** collapse desktop review workspace tabs behind **More**.

## Relationship to prior work

| Item | Role | This set |
|------|------|----------|
| **IE-ND-03** | Flatten Network sparse RG swimlanes; explicitly deferred Identity | **Do** the Identity expansion |
| **#2951** | Flatten Executive sparse swimlanes | Keep; add Identity to the same helper |
| **IDV-01–04** | Contain-fit + overlay chrome | Keep; **IE-ID-03** only stops overlay-only collapse |
| **#3013** | Client mermaid in `ArchitectureDiagramViewer` | **Do not revert** |
| **IE-ND-05** | mermaid.js throw is not “too large” | Do not re-open; Identity empty/fail stays that contract |

## Run order

**01 → 02.** **03** may start in parallel with 01 (viewport honesty is independent of flatten).

- **01** must not change the viewer or IDV fit math.
- **02** must not flatten (01 does). Rebase/merge 01 before asserting “no subgraph” on a 12-RG fixture.
- **03** must not restore width-stretch or a forced 36rem empty hole.

Suggested Cloud Agent branch per prompt: `cursor/identity-diagram-<short-name>-2527`. Implementation sessions use a **new** feature branch per prompt. This prompt-set PR may live on `cursor/inventory-diagram-identity-prompts-2527`.

## Prompt files (paste one per session)

| # | File | Flaw it mitigates |
|---|------|-------------------|
| 01 | `inventory-diagram-identity-01-flatten-sparse-swimlanes.md` | 14 nested RG swimlanes; Identity omitted from sparse flatten |
| 02 | `inventory-diagram-identity-02-snapshot-mermaid-contract.md` | Identity mermaid can drift empty with no failing test |
| 03 | `inventory-diagram-identity-03-viewport-must-not-collapse.md` | Zero-ink SVG + overlay chrome hides the canvas |

## After each prompt

Summarize: files changed, tests run, whether a 12-RG × one-MI Identity compile is a flat `flowchart TD` with those labels, whether the mermaid viewport still has in-flow content when ink bbox is null, residual risk.

## Global constraints (every prompt)

Working-tree safety: `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path <file>` before editing a tracked file. Exit 2 → skip and report.

- **Do not** hide desktop review workspace tabs behind **More**.
- **Do not** merge `DraftRequests` and `Runs`. **Do not** unseal sealed records.
- No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**.
- TB-645 vocabulary. Sentence case. Visible-boundary `Button` (no ghost/link).
- Plane wins. One Azure collector. No `terraform apply` / ARM writes.
- Mermaid stays dynamically imported on UI hot paths (`mermaid-import-policy`).
- Stage only this prompt’s paths. **No `git add -A`.**
- Heartbeat `STILL EXECUTING... HH:mm:ss` every 8s on compile/test >15s.
- Implement only *What to build*.
