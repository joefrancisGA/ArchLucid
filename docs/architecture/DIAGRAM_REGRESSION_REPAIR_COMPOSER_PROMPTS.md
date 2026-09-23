> **Scope:** Contributor-reference — copy-paste Composer/Cloud Agent prompts that repair the diagram regressions from **#3586** (Azure icon wiring) and **#3587** (data-flow columns, edge ink, subscription-frame removal, outline split). Internal engineering only. **Prompts only** in this set — do not implement from the tables.
> **Index:** [`INFRA_EVIDENCE_COMPOSER_PROMPTS.md`](INFRA_EVIDENCE_COMPOSER_PROMPTS.md).
> **Paste files:** [`.cursor/prompts/diagram-regression-repair-00-index.md`](../../.cursor/prompts/diagram-regression-repair-00-index.md) (one numbered file per session).
>
> **Do not** restore the subscription bounding frame. **Do not** vendor a new Azure icon zip. **Do not** re-run **IDA**, **IDF**, **IDX**, **IDR**, **SN-DF**, or **AX-DE** as greenfield. **Do not** rewrite SecureNow Home hub copy.

# DRR-01–DRR-05 — Diagram regression repair

**Observed (2026-09-23):** After #3587, Data flow forest layout stacks each stage in one column with no stage name, and the orthogonal router’s last resort draws connectors through other cards. Edge strokes are rewritten to `#94a3b8` on the canvas while arrowheads stay `#111827`. After #3586, two icon pairs are the same PNG, Function Apps never pass ARM kind, and every `Microsoft.Cdn/profiles` resolves as Front Door. The outline split counts only the first 200 sorted rows, and the sort test no longer checks order.

**Product framing (locked):** Repair the shipped slice. Data flow stays left-to-right stages. Inventory modes other than Data flow keep resource-group placement. The subscription frame stays off. Icons stay the current PNGs, with false mappings removed. Connected / Unconnected sections stay.

## Diagnosis → prompt

| Class | Prompt | Residual if skipped |
|-------|--------|---------------------|
| Unlabeled data-flow columns, no gutter or sky lane | **DRR-01** | Skip-edges have nowhere to travel except through cards |
| Fallback polyline crosses a third card | **DRR-02** | Source → Storage still cuts the Application column |
| Gray line, black arrowhead; dark arrowhead vanishes | **DRR-03** | Owner’s black-line request never reaches the canvas |
| Shared PNGs, missing kind, CDN shown as Front Door | **DRR-04** | Wrong product marks on the cards |
| Outline counts and sort assert “somewhere in the table” | **DRR-05** | Connected header lies past 200 nodes; sort looks frozen |
| Subscription box, new icon zip, other waves, Home copy | **DRR-HOLD** | Those are different decisions |

## Sequencing

| Prompt | Parallel? | Depends on |
|--------|-----------|------------|
| **DRR-01** Stage labels, gutter, sky lane | **First** for the data-flow canvas | trunk |
| **DRR-02** Gutter and sky-lane edges | After 01 | DRR-01 geometry |
| **DRR-03** Light/dark edge and arrow ink | Parallel with 01 | Do not edit the router |
| **DRR-04** Icon catalog honesty | Parallel with 01 | none |
| **DRR-05** Outline counts and sort | Parallel with 01 | none |
| **DRR-HOLD** | Not implementation | — |

**Run one prompt per chat.** Feature branch per prompt (`cursor/drr-<short-name>`). Name the branch in any commit/push request. Cloud agents append their required branch suffix.

## Shared constraints (every prompt)

- Plane wins. One Azure collector. No `terraform apply` / ARM writes. No second collector. No desktop review tab collapse. Do not reopen GTM **M-90 / M-44 / M-91 / M-92** or closed assurance **TB-135 / TB-136**.
- Working-tree: `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path '<file>'`. Exit 2 → skip and report.
- Prefer LINQ, concrete types, null checks, blank line before `if`/`foreach` unless first in method. Each new class in its own file. No `ConfigureAwait(false)` in tests.
- Mermaid stays dynamically imported. Do not retune `nodeSpacing` / `rankSpacing` / `padding`.
- Stage only this prompt’s paths. **No `git add -A`.**
- Heartbeat `STILL EXECUTING... HH:mm:ss` every 8s on compile/test >15s.

### Locked facts (do not re-diagnose)

- Live canvas is inventory-forest (`layoutSvg`) when present. Mermaid is export / fail-soft. Graphviz is the PNG / layout fallback.
- `IsDataFlowTitle` is `title.Contains("(DataFlow)", OrdinalIgnoreCase)`. The compiler title is `Azure inventory (DataFlow)`. Data architecture is `(DataArchitecture)` and must stay on the resource-group layout.
- `DiagramForestSubscriptionFrameResolver.ShouldDraw` returns false. Leave it false.
- Data-flow resource-group frames stay off. Resource group remains the card caption.
- `paintArchitectureDiagramNodePalette` is what the browser and PNG export actually show for edge color. Setting only the C# constant does not change the canvas.
- Category pictogram is the fallback when icon `Resolve` returns null.
- Do not draw edges just so the Unconnected section is empty.

---

# DRR-01 — Data-flow stage labels and column gutters

**Depends on:** trunk · **Branch:** `cursor/drr-stage-columns`

**Paste file:** [`.cursor/prompts/diagram-regression-repair-01-data-flow-stage-columns.md`](../../.cursor/prompts/diagram-regression-repair-01-data-flow-stage-columns.md)

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH. Goal: Azure inventory (DataFlow) forest layout keeps left-to-right stage columns, paints each stage name, and reserves a gutter plus a sky lane. No resource-group frame and no subscription frame on that path.

This is NOT a new diagram mode. Do not move Executive, Network, or Full subscription onto stage columns. Do not restore the subscription bounding box. Do not reopen TB-135/TB-136 or GTM M-90/M-44/M-91/M-92. Do not hide desktop review workspace tabs.

Read first:
- docs/architecture/DIAGRAM_REGRESSION_REPAIR_COMPOSER_PROMPTS.md
- .cursor/prompts/diagram-regression-repair-00-index.md
- .cursor/prompts/diagram-regression-repair-01-data-flow-stage-columns.md

Working-tree: pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path '<file>' (exit 2 → skip).

Implement only What to build in the paste file. Tests must fail on current master, pass after.

Do not git add -A. Heartbeat every 8s if compile/test >15s.
```

---

# DRR-02 — Data-flow edges stay out of other cards

**Depends on:** DRR-01 · **Branch:** `cursor/drr-edge-gutters`

**Paste file:** [`.cursor/prompts/diagram-regression-repair-02-data-flow-edge-gutters.md`](../../.cursor/prompts/diagram-regression-repair-02-data-flow-edge-gutters.md)

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH. Goal: Data flow edges travel in the DRR-01 gutter and sky lane. A Source → Storage path must not enter the Application card. Do not change the inventory peering router’s last-resort fallback.

Read first: .cursor/prompts/diagram-regression-repair-02-data-flow-edge-gutters.md

Do not restore subscription frames. Do not retune Mermaid spacing. Working-tree script before tracked edits. No git add -A.
```

---

# DRR-03 — Light and dark edge ink, including arrowheads

**Depends on:** trunk · **Branch:** `cursor/drr-edge-ink` · **Parallel with DRR-01**

**Paste file:** [`.cursor/prompts/diagram-regression-repair-03-edge-ink-parity.md`](../../.cursor/prompts/diagram-regression-repair-03-edge-ink-parity.md)

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH. Goal: forest edge stroke and arrowhead fill are #111827 in light mode and #e2e8f0 in dark mode, on the canvas and in sanitized SVG. Edge-label text stays #111827 on the white chip. Do not recolor Azure icon images.

Read first: .cursor/prompts/diagram-regression-repair-03-edge-ink-parity.md

Do not edit the data-flow column layout or the orthogonal router. Working-tree script before tracked edits. No git add -A.
```

---

# DRR-04 — Icon catalog honesty

**Depends on:** trunk · **Branch:** `cursor/drr-icon-honesty` · **Parallel with DRR-01**

**Paste file:** [`.cursor/prompts/diagram-regression-repair-04-icon-catalog-honesty.md`](../../.cursor/prompts/diagram-regression-repair-04-icon-catalog-honesty.md)

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH. Goal: forest icons match the service. Plumb ARM kind so Function Apps resolve function-app.png. Drop byte-identical second icons (Container Instances, Event Grid subscriptions) back to the category pictogram. Microsoft.Cdn/profiles is not Front Door. Do not download a new icon pack.

Read first: .cursor/prompts/diagram-regression-repair-04-icon-catalog-honesty.md and .cursor/rules/Azure-Icon-Pack-Accepted.mdc

Do not crop or recolor icon pixels. Working-tree script before tracked edits. No git add -A.
```

---

# DRR-05 — Outline section counts and within-section sort

**Depends on:** trunk · **Branch:** `cursor/drr-outline-sort` · **Parallel with DRR-01**

**Paste file:** [`.cursor/prompts/diagram-regression-repair-05-outline-sort.md`](../../.cursor/prompts/diagram-regression-repair-05-outline-sort.md)

### Prompt (copy below)

```text
You are working in the ArchLucid repo on a FEATURE BRANCH. Goal: Connected and Unconnected header counts use the full outline, then the table shows at most 200 data rows. Sort order is the first data row inside the section, not “the name appears somewhere.”

Read first: .cursor/prompts/diagram-regression-repair-05-outline-sort.md

Do not remove the Connected / Unconnected split. Do not edit forest SVG. Working-tree script before tracked edits. No git add -A.
```

---

# DRR-HOLD — Written hold

**Not implementation.**

**Paste file:** [`.cursor/prompts/diagram-regression-repair-06-hold.md`](../../.cursor/prompts/diagram-regression-repair-06-hold.md)

Do not paste DRR-HOLD into an implementation chat. It lists work this set must not absorb: subscription-frame restore, a new icon zip, IDA/IDF/IDX/SN-DF greenfield, and the SecureNow Home “seven destinations” sentence.
