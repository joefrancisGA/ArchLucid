import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ArchitectureDiagramInferredPanel } from "@/components/architecture/ArchitectureDiagramInferredPanel";
import type { ArchitectureDiagramModel } from "@/lib/architecture/architecture-diagram-types";

const model: ArchitectureDiagramModel = {
  nodes: [
    {
      id: "system_billing",
      label: "Billing adapter",
      kind: "system",
      provenance: "inferred",
      removed: false,
      accepted: false,
    },
    {
      id: "system_removed",
      label: "Removed cache",
      kind: "system",
      provenance: "inferred",
      removed: true,
      accepted: false,
    },
  ],
  edges: [],
  trustBoundaryLabels: [],
};

describe("ArchitectureDiagramInferredPanel", () => {
  it("supports accept, remove, and restore without opening the editor modal", () => {
    const onNodeOverride = vi.fn();

    render(<ArchitectureDiagramInferredPanel model={model} canEdit onNodeOverride={onNodeOverride} />);

    expect(screen.getByTestId("architecture-diagram-inferred-list")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("architecture-diagram-accept-system_billing"));
    expect(onNodeOverride).toHaveBeenCalled();

    fireEvent.click(screen.getByTestId("architecture-diagram-restore-system_removed"));
    expect(onNodeOverride).toHaveBeenCalledTimes(2);
  });
});
