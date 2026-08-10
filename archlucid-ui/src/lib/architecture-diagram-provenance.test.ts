import { describe, expect, it } from "vitest";

import { summarizeArchitectureDiagramProvenance } from "@/lib/architecture-diagram-provenance";
import type { ArchitectureDiagramModel } from "@/lib/architecture-diagram-types";

const model: ArchitectureDiagramModel = {
  nodes: [
    {
      id: "system_a",
      label: "A",
      kind: "system",
      provenance: "inferred",
      removed: false,
      accepted: false,
    },
    {
      id: "system_b",
      label: "B",
      kind: "system",
      provenance: "inferred",
      removed: true,
      accepted: false,
    },
  ],
  edges: [
    {
      id: "edge_1",
      sourceId: "system_a",
      targetId: "system_a",
      label: "loop",
      provenance: "inferred",
      removed: false,
    },
  ],
  trustBoundaryLabels: [],
};

describe("summarizeArchitectureDiagramProvenance", () => {
  it("counts unaccepted inferred nodes and inferred edges", () => {
    expect(summarizeArchitectureDiagramProvenance(model).unconfirmedInferredCount).toBe(2);
    expect(summarizeArchitectureDiagramProvenance(null).unconfirmedInferredCount).toBe(0);
  });
});
