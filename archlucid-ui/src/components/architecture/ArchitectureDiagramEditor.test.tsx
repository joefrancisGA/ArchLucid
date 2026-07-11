import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ArchitectureDiagramEditor } from "@/components/architecture/ArchitectureDiagramEditor";
import type { ArchitectureDiagramModel } from "@/lib/architecture-diagram-types";

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
  ],
  edges: [],
  trustBoundaryLabels: [],
};

describe("ArchitectureDiagramEditor", () => {
  it("shows inferred labels and supports accept/remove actions", () => {
    const onNodeOverride = vi.fn();

    render(
      <ArchitectureDiagramEditor
        open
        onOpenChange={() => undefined}
        model={model}
        mermaidSource={'flowchart TB\n  system_billing["Billing adapter (inferred)"]'}
        versions={[]}
        canEdit
        onSaveMermaid={() => undefined}
        onNodeOverride={onNodeOverride}
        onActivateVersion={() => undefined}
      />,
    );

    expect(screen.getByTestId("architecture-diagram-inferred-list")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("architecture-diagram-accept-system_billing"));
    expect(onNodeOverride).toHaveBeenCalled();
  });

  it("blocks edits when permission is denied", () => {
    render(
      <ArchitectureDiagramEditor
        open
        onOpenChange={() => undefined}
        model={model}
        mermaidSource={'flowchart TB\n  system_billing["Billing adapter (inferred)"]'}
        versions={[]}
        canEdit={false}
        onSaveMermaid={() => undefined}
        onNodeOverride={() => undefined}
        onActivateVersion={() => undefined}
      />,
    );

    expect(screen.getByText(/Diagram edits are locked/)).toBeInTheDocument();
  });
});
