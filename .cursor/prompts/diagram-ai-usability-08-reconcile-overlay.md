# DAU-08 — Reconcile MatchKind overlay on the diagram canvas

**Wave:** diagram-ai-usability (**DAU**). **Depends on:** DAU-04. **Do not** implement DAU-09–DAU-12.

Do not implement from the wave index. Implement only *What to build*.

## Goal

Paint inventory/review diagram nodes with **existing** reconcile `MatchKind` (Exact / Probable / Possible / DiagramOnly / InfrastructureOnly / Conflict / Unknown) so correspondence is visible on the picture, not only in the EnterpriseTable. Keep AI rationale **Possible/Unknown only**.

## Why

IE-19 and IE-UX-03 shipped a table workbench. Operators comparing “the drawing vs the estate” still mentally join rows to boxes. Overlay is a usability compiler: same rows, spatial.

## Context

- `archlucid-ui/src/lib/infra-evidence/infra-evidence-diagram-reconcile-types.ts`
- `archlucid-ui/src/lib/infra-evidence/infra-evidence-diagram-reconcile-explanation.ts` — **do not** put `aiRationale` on Exact/Confirmed
- `archlucid-ui/src/app/(operator)/governance/infrastructure/diagram-reconcile/DiagramReconcileWorkbenchClient.tsx`
- Diagrams workbench + resource hub diagram tab
- `DiagramInfrastructureCorrespondenceRow`
- Status/severity tokens: `StatusTag` / `SeverityTag` — do not invent pastel node fills that fight a11y. Prefer border/dash + legend.

IE-19: AI cannot flip InsufficientEvidence to Confirmed. Overlay colors must not look like Confirmed when band is Possible.

## What to build

1. Legend on diagrams workbench (and reconcile workbench preview if a canvas exists): MatchKind → existing status kind mapping documented in copy (Exact → approved/ready, Conflict → high, DiagramOnly/InfrastructureOnly → needs-attention, Possible/Unknown → neutral + “AI may explain”).
2. Join correspondence `diagramNodeId` to painted SVG/Mermaid node ids (same sanitizer as outline). Unmatched rows stay table-only.
3. Toggle **Show inventory match** default **off** on huge graphs (full subscription) and **on** when mode is executive/network/identity/data **or** when `correspondenceId` is in the URL.
4. Click Conflict / DiagramOnly node: existing reconcile filter href / finding handoff (`buildResourceHubDiagramReconcileWorkbenchHref`). Do not open a chat.
5. Tooltip/caption uses `formatDiagramReconcileExplanation` (deterministic + AI only on Possible/Unknown).
6. Vitest: mapping; Exact explanation has no “AI rationale”; toggle URL if you add a query param (`diagMatch=1`) using existing filter-url patterns.

## Acceptance criteria

- A Conflict row paints the matching node and does not display as a green “match.”
- Possible row may show `AI rationale:` text already on the row; Exact must not.
- Overlay off ⇒ canvas unchanged from current render.

## Constraints

- Working-tree safety script before tracked edits.
- **Do not** change matcher confidence rules. **Do not** call vision.
- Branding: severity colors stay semantic (`--al-status`). No logo-as-node.
- Verification: focused Vitest on reconcile explanation + new overlay helper + workbench test if present.
- No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**.
