import { describe, expect, it } from "vitest";

import {
  formatDiagramReconcileEdgeGapKindLabel,
  formatDiagramReconcileMatchKindLabel,
} from "@/lib/infra-evidence/diagram-reconcile-match-kind-display";

describe("diagram-reconcile-match-kind-display", () => {
  it("maps known match kinds to operator labels", () => {
    expect(formatDiagramReconcileMatchKindLabel("Conflict")).toBe("Conflict");
    expect(formatDiagramReconcileMatchKindLabel("DiagramOnly")).toBe("Diagram only");
  });

  it("maps connector gap kinds to operator labels", () => {
    expect(formatDiagramReconcileEdgeGapKindLabel("MissingInDiagram")).toBe("Missing in diagram");
    expect(formatDiagramReconcileEdgeGapKindLabel("")).toBe("Gap kind was not stored.");
  });
});
