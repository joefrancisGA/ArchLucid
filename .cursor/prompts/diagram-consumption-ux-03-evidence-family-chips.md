# DCU-03 — Evidence-family chips

**Wave:** diagram consumption UX (**DCU**). **Depends on:** DCU-01 preferred, because both touch connector visibility. **Do not** implement DCU-04 or DCU-05.

Do not implement from the wave index. Implement only *What to build*.

## Goal

On Data flow, Executive, Identity, and Data, the operator can show one evidence family at a time. The canvas and the outline agree. A family with no connectors says so, and the cards stay.

## Why

`AzureInventoryDataFlowEvidenceCatalog` already maps association types to `AzureInventoryDataFlowEvidenceFamily` (`DeclaredMovement`, `AuthorizedAccess`, `StructuralNetworkPath`, `InferredHostname`, `HumanConfirmed`, `ObservedRuntime`). The workbench paints every included edge together. Outline edges already carry `inferenceSource` and `label`, so the filter can run on the client.

## Read first

- `ArchLucid.Core/AzureExtractor/AzureInventoryDataFlowEvidenceCatalog.cs`
- `ArchLucid.Core/AzureExtractor/AzureInventoryDataFlowEvidenceFamily.cs`
- `archlucid-ui/src/lib/infra-evidence/parse-infra-evidence-mermaid-outline.ts` — `InfraEvidenceMermaidOutlineEdge`
- `archlucid-ui/src/lib/infra-evidence/infra-evidence-diagrams-filter-url.ts`
- `archlucid-ui/src/components/architecture/ArchitectureDiagramViewer.tsx`
- `docs/securenow/EVIDENCE_BASED_PROBABLE_DATA_FLOWS.md` — family wording; ordinal bands only

## What to build

1. Add a pure helper (own file) that maps an outline edge to a family using `inferenceSource` first and the catalog verb in `label` second. Unmapped edges belong to **All** only.
2. Chip labels, hidden when the current outline has zero edges in that family:
   - All
   - Pipeline wiring (`DeclaredMovement`)
   - May access (`AuthorizedAccess`)
   - Private network path (`StructuralNetworkPath`)
   - Likely connected (`InferredHostname`)
   - Confirmed connection (`HumanConfirmed`)
   - Observed in logs (`ObservedRuntime`)
3. Render the chips on `dataFlow`, `executive`, `identity`, and `data` when at least one non-All chip would show. Use a real `button` with `aria-pressed`. Visible boundary. Sentence case.
4. Persist the choice in the existing diagrams URL helper as `evidenceFamily`. Unknown values fall back to All and drop the param.
5. While a family is selected, hide non-matching `g.edge` elements and non-matching outline rows. Leave nodes on the canvas. Layout links and attachment hops that are already excluded stay excluded. Do not put `diagnosticToDestination` on Data flow.
6. When the selected family matches nothing on this render, show: “No connectors in this family on this diagram.” Do not claim the subscription lacks the relationship.
7. Selecting a chip clears a DCU-01 connector selection that is no longer visible.

## Acceptance criteria

- A Data flow outline with one **May access** edge and one **Reads from** edge: choosing May access hides the pipeline edge in the outline and dims or hides it on the canvas.
- A family absent from the outline does not render a chip.
- Diagnostics stay off Data flow.
- No numeric confidence and no “observed traffic” copy on the chips.

## Constraints

- Working-tree safety before tracked edits.
- Client filter of the outline and SVG already returned. Do not add a collector or a new compile mode.
- Stage only this prompt’s paths. **No `git add -A`.**

## Verification

```bash
cd archlucid-ui && npx vitest run \
  src/lib/infra-evidence/infra-evidence-diagrams-filter-url.test.ts \
  src/components/infra-evidence/InfraEvidenceDiagramOutline.test.tsx \
  src/app/\(operator\)/governance/infrastructure/diagrams/DiagramsWorkbenchClient.test.tsx
```

Add a focused test file for the family mapper if one does not exist. Heartbeat every 8s if the run exceeds 15s.

## Done when

Choosing **May access** leaves pipeline wiring off the canvas and the outline, and choosing **All** restores both.
