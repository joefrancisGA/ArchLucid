import { describe, expect, it } from "vitest";

import { resolveInfraDiagramsExportDisabledReason } from "@/lib/infra-evidence/resolve-infra-diagrams-export-disabled-reason";

const baseInput = {
  exportBusy: false,
  renderInFlight: false,
  selectedSnapshotId: "snap-1",
  deepLinkedSnapshotMissing: false,
  diagramsSubscriptionChosen: true,
  diagramTypeSelected: true,
  dependencyNeighborhoodAwaitingSeed: false,
  resourceGroupPickerAwaitingSelection: false,
  paintDiagramCanvas: true,
  forMermaidExport: false,
};

describe("resolveInfraDiagramsExportDisabledReason", () => {
  it("returns null when PNG export is allowed", () => {
    expect(resolveInfraDiagramsExportDisabledReason(baseInput)).toBeNull();
  });

  it("explains missing subscription", () => {
    expect(
      resolveInfraDiagramsExportDisabledReason({
        ...baseInput,
        diagramsSubscriptionChosen: false,
      }),
    ).toBe("Select a subscription first.");
  });

  it("explains missing diagram canvas for Mermaid export", () => {
    expect(
      resolveInfraDiagramsExportDisabledReason({
        ...baseInput,
        forMermaidExport: true,
        paintDiagramCanvas: false,
      }),
    ).toBe("Diagram source is not ready to export yet.");
  });
});
