# DIC-05 — Show match kind on the imported drawing

**Model:** GPT-5.6 Luna. Paste this file as the whole task.

**Repo:** `c:\ArchLucid`

**Wave:** Diagram import comparison (**DIC**). **Depends on:** DIC-01 on `master`. DIC-02 preferred so Confirmed has a color.

## Goal

On Diagram reconciliation, the imported drawing outlines each box with its match kind. The table remains. Conflict does not look like a match.

## Why

Week 3 item 5 is a colored drawing, not a table-only readout. **DAU-08** (`.cursor/prompts/diagram-ai-usability-08-reconcile-overlay.md`) targets the inventory diagram canvas and is still not started. This session paints the **imported** drawing on the reconcile page. Do not implement DAU-08.

## Read first

- `.cursor/prompts/diagram-ai-usability-08-reconcile-overlay.md` (do not implement it)
- `archlucid-ui/src/lib/infra-evidence/infra-evidence-diagram-reconcile-explanation.ts`
- `DiagramReconcileWorkbenchClient.tsx`
- `DiagramInfrastructureCorrespondenceRow`
- `docs/library/UI_DESIGN_SYSTEM.md` status colors

## What to build

1. Branch `cursor/dic-05-canvas-overlay` from current `master`.
2. After a comparison, render the ingested diagram on the reconcile page and join `diagramNodeId` to the drawn node id. A node with no row keeps its ordinary outline.
3. Legend, sentence case, using existing status tokens (`StatusTag` / semantic borders). No pastel card fills.
   - Confirmed and Exact: ready
   - Probable: in progress
   - Possible and Unknown: neutral, and the caption may include the existing AI rationale
   - Diagram only: needs attention
   - Conflict: the conflict / high status, never the ready status
4. Exact and Confirmed captions use `formatDiagramReconcileExplanation` and do not add an AI rationale line.
5. Toggle **Show match on drawing**, default on for this page. Off returns the drawing to its ordinary outlines. Infrastructure-only groups have no box on the drawing; they stay in the table.
6. Do not change Full subscription, Network, Data flow, or any other inventory diagram mode.
7. Vitest: Conflict does not use the ready token; Exact explanation has no AI rationale; the toggle hides the outlines.

## Acceptance criteria

- A Conflict node is visibly different from a Confirmed or Exact node.
- Toggle off leaves the drawing unchanged from the pre-overlay render.
- Inventory diagrams elsewhere in SecureNow look the same as before this session.

## Constraints

- Before editing any tracked file, run `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path '<path>'`. If it exits 2, stop and report the blocked path.
- Do not change matcher rules, confidence bands, or the sealed guard.
- Do not call vision. Do not download icons.
- Stage only the overlay, legend, toggle, and tests. **No `git add -A`.**
- **Do not commit.**
- No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**.

## Verification

Vitest for the explanation helper and the new overlay mapping. One UI typecheck if you touch the workbench, plus one retry if it exits 1. Heartbeat every 8s.

## How to check

Restart the UI. Hard-refresh **Diagram reconciliation** and run Compare on a drawing that has one matched node, one Diagram only node, and, if DIC-02 is on master, one Confirmed node.

1. The drawing sits on the page. Matched boxes and the diagram-only box use different outlines. The legend names the kinds in sentence case.
2. A Conflict, if you have one, is not the same color as Confirmed or Exact.
3. Turn **Show match on drawing** off. The outlines return to the ordinary drawing. Turn it on. They return.
4. Open **Diagrams** for the same capture. Full subscription and Data flow do not gain this legend.
5. The count strip and CSV from DIC-04, when that prompt has already landed, stay as they were.

Wait for that look before any commit.
