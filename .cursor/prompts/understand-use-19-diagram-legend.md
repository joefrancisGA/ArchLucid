# UU-19 — Diagram legend

**Model:** GPT-5.6 Luna. Paste this file as the whole task. Do not implement UU-20 in this session.

**Repo:** `c:\ArchLucid`

**Wave:** Understand and use, wave B (**UU-19**). **Depends on:** the inventory diagram mode already selected in `DiagramsWorkbenchClient`.

## Goal

Under the diagram, three questions say what a box means, what a connector means, and whether the drawing is capability, configuration, or observed traffic.

## Why

Executive, Data category, Data architecture, and Data flow share one canvas. A connector does not mean the same thing in each mode, and data flow is declared wiring rather than observed traffic.

## Read first

- `archlucid-ui/src/app/(operator)/governance/infrastructure/diagrams/DiagramsWorkbenchClient.tsx`
- `archlucid-ui/src/lib/infra-evidence/infra-evidence-diagrams-filter-url.ts`
- `archlucid-ui/src/lib/infra-evidence/infra-evidence-data-flow-diagram.ts`
- `docs/securenow/DATA_ARCHITECTURE_AND_DATA_FLOW_DIAGRAMS.md`

## What to build

1. Branch `uu/19-diagram-legend` from current `master`.
2. When a diagram is painted, show a legend titled "How to read this diagram" under the mode caption and above the canvas. Three lines:
   - What the boxes are.
   - What the connectors are.
   - What kind of evidence the drawing is: capability, configuration, or observed traffic.
3. Use these answers. Do not invent a fourth evidence kind.
   - `dataFlow`: boxes are resources on a declared path; connectors are declared wiring; evidence kind is configuration, not observed traffic. Keep the existing honesty prefix.
   - `dataArchitecture`: boxes are data stores; connectors are declared repository relationships; evidence kind is configuration.
   - `data`: boxes are data resources in the infrastructure forest; connectors are the forest relationships already drawn; evidence kind is configuration.
   - Every other painted mode: boxes are Azure resources in this view; connectors are relationships already on the diagram; evidence kind is configuration from inventory.
4. Do not say observed traffic for any current inventory mode. Observed traffic is allowed only if the selected mode already cites flow logs. If none does, do not add that sentence.
5. Do not change layout, icons, or mode ids.

## Acceptance criteria

- Data flow shows "not observed traffic".
- Executive shows the generic three lines.
- A diagram that is not painted does not show the legend.

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2.
- Sentence case. The legend is text, not a new toolbar.
- **Do not commit.**

## Verification

```powershell
cd archlucid-ui
npx vitest run "src/app/(operator)/governance/infrastructure/diagrams/DiagramsWorkbenchClient.test.tsx"
```

Add a legend test if that file cannot render the canvas. A pure helper test is enough. Run only the tests you add or change.

## Done when

Tests pass. Tell the owner to open Data flow and Executive and read the three lines. Wait for that look before any commit.
