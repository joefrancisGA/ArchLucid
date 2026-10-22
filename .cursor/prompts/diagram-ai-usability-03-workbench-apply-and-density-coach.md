# DAU-03 — Workbench applies ViewPlan; density coach named exits

**Wave:** diagram-ai-usability (**DAU**). **Depends on:** DAU-02. **Do not** implement DAU-04–DAU-12.

Do not implement from the wave index. Implement only *What to build*.

## Goal

On Inventory diagrams, a grounded Ask answer that includes `viewPlan` can be applied with one primary action that writes the **existing** query params (`mermaidMode`, `seedNodeId`, `snapshotId`, …). When the current render is unreadable (Partitioned, empty paint, or over peel budget), show **three named exits** instead of a technical dead-end.

## Why

DAU-02 produces a plan. Without apply, the operator still copy-pastes dropdown values. First paint on an 889-resource snapshot is the other hole: IE-17 already refuses to mark 8k-node graphs Succeeded, but the human still does not know to pick Executive vs neighborhood.

## Context

- `archlucid-ui/src/app/(operator)/governance/infrastructure/diagrams/DiagramsWorkbenchClient.tsx`
- `archlucid-ui/src/lib/infra-evidence/infra-evidence-diagrams-filter-url.ts` — `buildDiagramsWorkbenchHref`, `INFRA_DIAGRAMS_MODE_OPTIONS`
- `archlucid-ui/src/lib/infra-evidence/infra-evidence-diagrams-partitioned-view.ts`
- `archlucid-ui/src/lib/infra-evidence/infra-evidence-mermaid-client-guard.ts`
- `archlucid-ui/src/lib/governance/governance-infrastructure-copy.ts`
- Ask client: `archlucid-ui/src/app/(operator)/governance/infrastructure/ask/InfrastructureAskClient.tsx`
- `buildInfrastructureAskHref` in `infra-evidence-hub-filter-url.ts`
- Render status: `resolveInfraEvidenceMermaidRenderStatusPresentation`

Do **not** retune layout constants. Do **not** re-run IDG/IDH.

## What to build

1. Shared helper `applyDiagramViewPlanToSearch` (own file under `archlucid-ui/src/lib/infra-evidence/`):
   - Input: current search string + `DiagramViewPlan`
   - Output: href using `infraDiagramsFilterHrefFromSearch` / equivalent existing builder
   - Ignore unknown modes (do not throw; keep current search and surface inline error)
   - Preserve audit/hub scope params already merged by workbench helpers
2. Inventory Ask result: when `viewPlan` is present and valid, primary **Apply this view** `Button` (`variant="primary"`, `CTA_WIDTH.content`) navigates to the diagrams workbench href. Secondary remains the existing Ask answer. TB-2005: disable Apply when the plan is invalid.
3. Density coach on `DiagramsWorkbenchClient` (not a new route):
   - Show when: render status is Partitioned **or** client guard too-large **or** paint failure **or** node count ≥ peel `MaxNodes` with a non-executive mode.
   - Copy: sentence case, TB-645. Heading like “This view is too large to read.”
   - Up to **three** outline `Button`s: (a) Executive, (b) Pick a Resource Group if RG artifacts exist, (c) Dependency neighborhood — but neighborhood CTA opens the **existing** seed dialog, it does not invent a seed.
   - Do not add a fourth invented mode.
4. Vitest: href builder for each mode; invalid mode leaves query unchanged; density coach testids; Apply disabled without plan.
5. Do **not** auto-apply a plan on Ask load (explicit click). Do **not** persist `diagZoom=0.3` as a coach action (IDH-02 already resets zoom on source change).

## Acceptance criteria

- Ask `ViewPlan.MermaidMode=network` → Apply → URL contains `mermaidMode=network` and keeps `snapshotId`.
- Partitioned full-subscription first paint shows Executive + RG + neighborhood exits; no new Mermaid source from the LLM.
- Keyboard: Apply is a button, named exits are buttons; no clickable divs.

## Constraints

- Working-tree safety script before tracked edits.
- Visible-boundary `Button` only (no ghost/link). Sentence case. `OPERATOR_TYPOGRAPHY`.
- **Do not** collapse review workspace tabs. This is the infrastructure diagrams workbench, not review-detail tabs.
- **Do not** implement smart-camera fit math (DAU-04).
- Verification:
  ```bash
  cd archlucid-ui && npx vitest run src/lib/infra-evidence/infra-evidence-diagrams-filter-url.test.ts src/app/\(operator\)/governance/infrastructure/diagrams/DiagramsWorkbenchClient.test.tsx src/app/\(operator\)/governance/infrastructure/ask/InfrastructureAskClient.test.tsx
  ```
  Adjust globs to files you actually add. No Playwright unless a named test already exists and stays green.
- No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**.
