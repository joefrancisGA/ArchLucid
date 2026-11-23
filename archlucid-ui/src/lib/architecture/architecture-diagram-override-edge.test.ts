import { describe, expect, it } from "vitest";

import {
  applyArchitectureDiagramOverrides,
  buildArchitectureDiagramModel,
} from "@/lib/architecture/architecture-diagram-model";

function buildModel(dataFlows: readonly string[]) {
  return buildArchitectureDiagramModel(
    {
      sections: [
        {
          key: "systems-and-services",
          title: "Systems and services",
          narrativeMarkdown: null,
          entities: [
            { label: "Alpha", detail: null, provenance: "asserted" },
            { label: "Beta", detail: null, provenance: "asserted" },
            { label: "Gamma", detail: null, provenance: "asserted" },
          ],
          provenance: "asserted",
        },
        {
          key: "data-flows",
          title: "Data flows",
          narrativeMarkdown: null,
          entities: dataFlows.map((flowText) => ({ label: flowText, detail: null, provenance: "asserted" })),
          provenance: "asserted",
        },
      ],
      hasPartialParseFailure: false,
      suppressedArtifactCount: 0,
      sourceText: "diagram",
    },
    "Payments",
  );
}

describe("applyArchitectureDiagramOverrides", () => {
  it("applies edge removal by stable endpoints when positional edge ids shift", () => {
    const original = buildModel(["Alpha -> Beta"]);
    const alphaBeta = original.edges.find((edge) => edge.sourceId === "system_alpha" && edge.targetId === "system_beta");

    expect(alphaBeta).toBeDefined();
    expect(alphaBeta?.id).toBe("edge_0");

    const shifted = buildModel(["Gamma -> Alpha", "Alpha -> Beta"]);
    const shiftedAlphaBeta = shifted.edges.find((edge) => edge.sourceId === "system_alpha" && edge.targetId === "system_beta");

    expect(shiftedAlphaBeta?.id).toBe("edge_1");

    const applied = applyArchitectureDiagramOverrides(shifted, [], [
      { ...(alphaBeta as NonNullable<typeof alphaBeta>), removed: true },
    ]);

    expect(applied.edges.some((edge) => edge.sourceId === "system_gamma" && edge.targetId === "system_alpha" && !edge.removed)).toBe(true);
    expect(applied.edges.some((edge) => edge.sourceId === "system_alpha" && edge.targetId === "system_beta")).toBe(false);
  });
});