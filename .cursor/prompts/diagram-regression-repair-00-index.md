<!-- Diagram regression repair — Composer prompts. Paste one numbered file
     per session. Origin: 2026-09-23 diagnosis of #3586 (Azure icon wiring)
     and #3587 (data-flow columns, black edges, subscription-frame removal,
     connected/unconnected outline). Do not implement from this index. -->

# Diagram regression repair — Composer prompt set (DRR-01–DRR-05 + hold)

#3586 and #3587 landed a narrow readability slice. Data flow diagrams now stack each stage in one column and draw connectors through other cards. Black edge ink is overwritten on the canvas. Two icon files are shared by unrelated services, and Function Apps never receive their kind. The outline split broke sort order.

**Do not implement from this index.** Paste **one** numbered `.cursor/prompts/diagram-regression-repair-0N-*.md` file per Composer / Cloud Agent session.

Canonical wave doc: [`docs/architecture/DIAGRAM_REGRESSION_REPAIR_COMPOSER_PROMPTS.md`](../../docs/architecture/DIAGRAM_REGRESSION_REPAIR_COMPOSER_PROMPTS.md).

**Do not treat this set as a V1 assessment scorecard.** No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**.

**Do not re-run IDA, IDF, IDX, IDR, SN-DF, or AX-DE** inside a DRR session. **Do not** restore the subscription bounding frame. **Do not** download or vendor a new Azure icon pack.

## Diagnosis (locked — do not re-diagnose)

### What shipped

| Commit | Effect |
|--------|--------|
| **#3587** `084b91e2d2` | `LayoutDataFlowStageColumns` when the title contains `(DataFlow)`. `DiagramForestSubscriptionFrameResolver.ShouldDraw` always returns false. Edge, arrow, and label ink set to `#111827`. Outline splits Connected / Unconnected. |
| **#3586** | `AzureArchitectureIconCatalog` embeds 18×18 PNGs. `Resolve(armType)` is called without ARM kind. |

### What is wrong

1. **Data flow columns.** `LayoutDataFlowStageColumns` stacks a stage in one vertical column (20px gap, 48px between columns) and emits no stage name. `FrameCellId` stays null, so resource-group frames are omitted on this path. `DiagramForestOrthogonalEdgeRouter.Route` falls back to a polyline that crosses a third node. Fit-to-view then shrinks the tall canvas.
2. **Ink split.** Forest SVG writes `#111827`. `paintArchitectureDiagramNodePalette` rewrites `g.edge path.edge-path` to `architecture-diagram-mermaid-config.ts` edge `#94a3b8` and does not recolor marker `#al-edge-arrow`. Dark-mode CSS targets Mermaid `.edgePath` / `.edgePaths`, not forest `.edge-path`. Arrowheads stay near-black.
3. **Icons.** `container-apps.png` and `container-instances.png` are the same bytes. `event-grid-domains.png` and `event-grid-subscriptions.png` are the same bytes. `DiagramNode` has no ARM kind, so `Microsoft.Web/sites` always resolves to `app-service.png`. Front Door's manifest entry also lists `Microsoft.Cdn/profiles`.
4. **Outline.** Connected membership is computed after `nodeRows` is sliced to 200. Sort tests only assert that a name appears somewhere in the table.

### What stays

- Subscription frame stays **off**. The owner asked to remove that box. This set does not draw a replacement subscription outline.
- Executive, Network, Architecture, Security, Identity, Data, Data architecture, and Full subscription **placement** stays on the resource-group cell layout. Only titles containing `(DataFlow)` use stage columns.
- Connected / Unconnected sections stay. This set repairs counts and sort order.
- Category pictogram stays the fallback when `Resolve` returns null.
- Home hub copy ("All seven destinations") is **not** this set.

## Sequence

| Prompt | Parallel? | Depends on |
|--------|-----------|------------|
| **DRR-01** Stage labels and column gutters | First for the data-flow canvas | trunk |
| **DRR-02** Edges stay out of other cards | After 01 | DRR-01 gutter geometry |
| **DRR-03** Light/dark edge and arrow ink | Parallel with 01 | none (do not edit the router) |
| **DRR-04** Icon catalog honesty | Parallel with 01 | none |
| **DRR-05** Outline counts and sort | Parallel with 01 | none |
| **DRR-HOLD** | Not implementation | — |

**Run one prompt per chat.** Feature branch per prompt (`cursor/drr-<short-name>`). Name the branch in any commit/push request. Cloud agents append their required branch suffix.

## Shared constraints

- Plane wins. One Azure collector. No `terraform apply` / ARM writes. No desktop review tab collapse.
- Working-tree: `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path '<file>'`. Exit 2 → skip and report.
- Prefer LINQ, concrete types, null checks, blank line before `if`/`foreach` unless first in method. Each new class in its own file. No `ConfigureAwait(false)` in tests.
- Stage only this prompt’s paths. **No `git add -A`.**
- Heartbeat `STILL EXECUTING... HH:mm:ss` every 8s on compile/test >15s.
- Mermaid stays dynamically imported. Do not retune Mermaid `nodeSpacing` / `rankSpacing` / `padding`.
