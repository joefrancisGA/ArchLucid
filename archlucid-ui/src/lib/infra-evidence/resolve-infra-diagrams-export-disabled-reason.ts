export type InfraDiagramsExportDisabledInput = {
  readonly exportBusy: boolean;
  readonly renderInFlight: boolean;
  readonly selectedSnapshotId: string;
  readonly deepLinkedSnapshotMissing: boolean;
  readonly diagramsSubscriptionChosen: boolean;
  readonly diagramTypeSelected: boolean;
  readonly dependencyNeighborhoodAwaitingSeed: boolean;
  readonly resourceGroupPickerAwaitingSelection: boolean;
  readonly paintDiagramCanvas: boolean;
  readonly forMermaidExport: boolean;
};

/** Human-readable reason when diagram export actions stay disabled. */
export function resolveInfraDiagramsExportDisabledReason(
  input: InfraDiagramsExportDisabledInput,
): string | null {
  if (input.exportBusy) {
    return "Export is in progress.";
  }

  if (input.renderInFlight) {
    return "Wait for the diagram to finish rendering.";
  }

  if (!input.diagramsSubscriptionChosen) {
    return "Select a subscription first.";
  }

  if (input.selectedSnapshotId.length === 0) {
    return "Select a snapshot first.";
  }

  if (input.deepLinkedSnapshotMissing) {
    return "Linked snapshot is not available — pick a snapshot from the list.";
  }

  if (!input.diagramTypeSelected) {
    return "Select a diagram type first.";
  }

  if (input.dependencyNeighborhoodAwaitingSeed) {
    return "Choose a starting resource for the dependency neighborhood diagram.";
  }

  if (input.resourceGroupPickerAwaitingSelection) {
    return "Choose a resource group for this diagram.";
  }

  if (input.forMermaidExport && !input.paintDiagramCanvas) {
    return "Diagram source is not ready to export yet.";
  }

  return null;
}
