<!-- Diagram import comparison — Luna prompts.
     Origin: 2026-10-04. Optum week-3 documentation accuracy:
     import a customer drawing and compare it to an Azure inventory capture.
     The matcher exists. The workbench still requires a sealed architecture review.
     Do not implement from this index. -->

# Diagram import comparison — Luna prompt set (DIC-01–DIC-05)

**Do not implement from this index.** Paste **one** numbered `.cursor/prompts/diagram-import-comparison-0N-*.md` file per GPT-5.6 Luna session.

Canonical wave doc: [`docs/architecture/DIAGRAM_IMPORT_COMPARISON_LUNA_PROMPTS.md`](../../docs/architecture/DIAGRAM_IMPORT_COMPARISON_LUNA_PROMPTS.md).

Engagement scope: [`docs/optum/WEEK_03_DOCUMENTATION_ACCURACY_GOALS.md`](../../docs/optum/WEEK_03_DOCUMENTATION_ACCURACY_GOALS.md).

**Base:** current `master`. Structured ingest and `DiagramInfrastructureMatcher` already exist. This set does not replace them.

## What this set changes

| Step | From | To | Prompt |
|------|------|----|--------|
| **Compare without a sealed review** | `/infrastructure/diagram-reconcile` blocks until a sealed review record id is present. `POST /v1/architecture/runs/{runId}/diagrams/reconcile` calls `DiagramInfrastructureReconciliationSealedManifestHashGuard`. | Upload a Mermaid, Visio `.vsdx`, draw.io, sanitized SVG, or diagram JSON file, pick an inventory capture, and compare. The page says advisory documentation accuracy. The sealed route stays sealed. | **DIC-01** |
| **Architect mapping** | Labels are lowercased. Seven type tokens. No saved “this box is that resource.” | A saved mapping wins over the label parser on the next compare. The row says Confirmed. | **DIC-02** |
| **Connectors** | `DiagramInfrastructureMatcher` never reads `diagram.Edges`. | A drawn connector with no inventory relationship, and an inventory relationship with no drawn connector, each become a gap row when both ends already matched. | **DIC-03** |
| **Scorecard and file** | One table row per unmatched inventory resource. No headline figure. No download. | A count strip, inventory-only rows grouped by resource group and type, the visible-inventory denominator, and a CSV. | **DIC-04** |
| **Drawing overlay** | Match kinds live only in the table. | The imported drawing outlines each box by match kind. Conflict is not painted as a match. | **DIC-05** |

## Run order

**DIC-01** first. **DIC-02** after **01**. **DIC-03** after **02**. **DIC-04** after **03**. **DIC-05** after **01** (after **02** preferred). **DIC-HOLD** is not a build step.

Do not run two of these in one session. Each implementation prompt ends **before commit**. The owner checks the page, then says whether to commit.

## Prompt files (paste one per session)

| # | File | Branch to create |
|---|------|------------------|
| 01 | `diagram-import-comparison-01-snapshot-reconcile.md` | `cursor/dic-01-snapshot-reconcile` |
| 02 | `diagram-import-comparison-02-confirmed-mapping.md` | `cursor/dic-02-confirmed-mapping` |
| 03 | `diagram-import-comparison-03-edge-gaps.md` | `cursor/dic-03-edge-gaps` |
| 04 | `diagram-import-comparison-04-scorecard-export.md` | `cursor/dic-04-scorecard-export` |
| 05 | `diagram-import-comparison-05-canvas-overlay.md` | `cursor/dic-05-canvas-overlay` |
| — | `diagram-import-comparison-06-hold.md` | Hold. Not a branch. |

## How the owner checks

After each session, restart the API and the UI, hard-refresh **Diagram reconciliation** (`/infrastructure/diagram-reconcile`), and follow that prompt’s **How to check** section. The checks use one small Mermaid drawing and one inventory capture that contains at least one of the names in the drawing.
