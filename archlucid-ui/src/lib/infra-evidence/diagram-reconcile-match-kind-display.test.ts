import { describe, expect, it } from "vitest";

import {
  formatDiagramReconcileEdgeGapKindLabel,
  formatDiagramReconcileMatchKindLabel,
} from "@/lib/infra-evidence/diagram-reconcile-match-kind-display";

describe("diagram-reconcile-match-kind-display", () => {
  it("maps known match kinds to operator labels", () => {
    expect(formatDiagramReconcileMatchKindLabel("Conflict")).toBe("Conflict");
    expect(formatDiagramReconcileMatchKindLabel("DiagramOnly")).toBe("Diagram only");
    expect(formatDiagramReconcileMatchKindLabel(null)).toBe("Match kind was not stored.");
    expect(formatDiagramReconcileMatchKindLabel("")).toBe("Match kind was stored empty.");
    expect(formatDiagramReconcileMatchKindLabel("Unknown")).toBe("Match kind recorded as unknown.");
    expect(formatDiagramReconcileMatchKindLabel("NewKind")).toBe("NewKind");
  });

  it("maps connector gap kinds to operator labels", () => {
    expect(formatDiagramReconcileEdgeGapKindLabel("MissingInDiagram")).toBe("Missing in diagram");
    expect(formatDiagramReconcileEdgeGapKindLabel("")).toBe("Gap kind was not stored.");
  });
});
