> **Scope:** Paste-ready GPT-5.6 Luna prompts. Import a customer architecture drawing and compare it to an Azure inventory capture without a sealed architecture review. Internal engineering only.
> **Paste-ready files:** [`.cursor/prompts/diagram-import-comparison-00-index.md`](../../.cursor/prompts/diagram-import-comparison-00-index.md) through [`.cursor/prompts/diagram-import-comparison-06-hold.md`](../../.cursor/prompts/diagram-import-comparison-06-hold.md)

# Diagram import comparison — Luna prompts

**Created:** 2026-10-04 · **Status:** ready to paste · **Audience:** GPT-5.6 Luna

Paste **one** prompt per Luna session. Do not implement from this index.

Engagement scope: [`../optum/WEEK_03_DOCUMENTATION_ACCURACY_GOALS.md`](../optum/WEEK_03_DOCUMENTATION_ACCURACY_GOALS.md). The matcher and the Diagram reconciliation workbench exist. Compare still requires a sealed review record, node labels only, and a row per unmatched inventory resource.

| ID | Prompt | Intent |
|----|--------|--------|
| **DIC-01** | [diagram-import-comparison-01-snapshot-reconcile.md](../../.cursor/prompts/diagram-import-comparison-01-snapshot-reconcile.md) | Upload a structured drawing, pick a capture, compare. Advisory documentation accuracy. The sealed run-linked route stays sealed. |
| **DIC-02** | [diagram-import-comparison-02-confirmed-mapping.md](../../.cursor/prompts/diagram-import-comparison-02-confirmed-mapping.md) | Save “this box is that resource.” The next compare says Confirmed. The matcher cannot invent that kind. |
| **DIC-03** | [diagram-import-comparison-03-edge-gaps.md](../../.cursor/prompts/diagram-import-comparison-03-edge-gaps.md) | Drawn and missing, or in the capture and not drawn, once both ends already match. Structural relationships only. |
| **DIC-04** | [diagram-import-comparison-04-scorecard-export.md](../../.cursor/prompts/diagram-import-comparison-04-scorecard-export.md) | Count strip, inventory-only rows grouped by resource group and type, visible-capture denominator, CSV. |
| **DIC-05** | [diagram-import-comparison-05-canvas-overlay.md](../../.cursor/prompts/diagram-import-comparison-05-canvas-overlay.md) | Match-kind outlines on the imported drawing. Does not implement DAU-08. |
| **DIC-HOLD** | [diagram-import-comparison-06-hold.md](../../.cursor/prompts/diagram-import-comparison-06-hold.md) | Vision, PowerPoint, sealed-route bypass, and observed-traffic claims stay out. |

## Run order

**01 → owner look → 02 → 03 → 04.** **05** after **01**, and after **02** when Confirmed should appear on the drawing. Do not run two of these in one session.

## How to check

Restart the API and the UI after each session. Open SecureNow **Diagram reconciliation** at `/infrastructure/diagram-reconcile` and hard-refresh.

Use one inventory capture and this drawing, or a Visio / draw.io file with the same names. The capture should contain `stprodmemberportal01` and should not contain a resource named Member Portal — Prod.

```mermaid
flowchart LR
  portal["stprodmemberportal01 (rg-app)"]
  missing["Member Portal — Prod"]
  portal --> missing
```

| After | What you should see |
|-------|---------------------|
| **DIC-01** | Sealed Review Record ID can stay empty. Compare returns a matched row for `stprodmemberportal01` and a Diagram only row for Member Portal — Prod. The page says advisory documentation accuracy and that this is not a sealed review record. |
| **DIC-02** | **This box is** on the Diagram only row. Save it against `stprodmemberportal01`. The row says Confirmed. Compare again. It is still Confirmed. |
| **DIC-03** | A connector between two matched nodes with no inventory relationship is “Drawn on the diagram and not present in this inventory capture.” A `vnetPeering` between two matched virtual networks with no connector is “Present in this inventory capture and not drawn.” May access does not create a gap by itself. |
| **DIC-04** | The strip counts Matched, Possible, Diagram only, Inventory only, Conflicts, and Connector gaps. Inventory-only rows are a resource group, a type, and a count. **Download CSV** matches those counts. The denominator sentence names the visible capture and the never-show exclusions. |
| **DIC-05** | The imported drawing outlines boxes by match kind. Conflict does not use the ready color. **Show match on drawing** off restores ordinary outlines. Inventory **Diagrams** (Full subscription, Data flow) do not gain this legend. |

Each prompt ends before commit. Look at the page, then say whether to commit.

## Not in this set

- Vision or OCR on PNG, JPEG, PDF, or PowerPoint
- Legacy `.vsd`
- Removing the sealed-manifest guard from `POST /v1/architecture/runs/{runId}/diagrams/reconcile`
- DAU-08 on the inventory diagram canvas
- A new collector, Terraform apply, or a compliance attestation
- GTM **M-90 / M-44 / M-91 / M-92**
- Closed assurance **TB-135 / TB-136**
