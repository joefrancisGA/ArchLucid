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

function buildQueuesModel(
  order: readonly { readonly label: string; readonly detail: string | null }[],
) {
  return buildArchitectureDiagramModel(
    {
      sections: [
        {
          key: "systems-and-services",
          title: "Systems",
          narrativeMarkdown: null,
          entities: order.map((entity) => ({ ...entity, provenance: "asserted" as const })),
          provenance: "asserted",
        },
      ],
      hasPartialParseFailure: false,
      suppressedArtifactCount: 0,
      sourceText: "diagram",
    },
    "Test",
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

  it("applies node removal by entity fingerprint when positional node ids shift after reorder", () => {
    const original = buildQueuesModel([
      { label: "Queue", detail: "first" },
      { label: "Queue", detail: "second" },
    ]);
    const removedTarget = original.nodes[1];

    expect(removedTarget.id).toBe("system_queue_1");

    const shifted = buildQueuesModel([
      { label: "Queue", detail: "second" },
      { label: "Queue", detail: "first" },
    ]);
    const applied = applyArchitectureDiagramOverrides(shifted, [{ ...removedTarget, removed: true }], []);

    expect(applied.nodes.filter((node) => !node.removed).map((node) => node.id)).toEqual(["system_queue_1"]);
  });

  it("ignores legacy id-only node overrides when the live node has an entity fingerprint", () => {
    const shifted = buildQueuesModel([
      { label: "Queue", detail: "second" },
      { label: "Queue", detail: "first" },
    ]);
    const node = shifted.nodes.find((candidate) => candidate.id === "system_queue_1");

    expect(node).toBeDefined();

    const legacyOverride = {
      ...(node as NonNullable<typeof node>),
      entityFingerprint: "",
      removed: true,
    };
    const applied = applyArchitectureDiagramOverrides(shifted, [legacyOverride], []);

    expect(applied.nodes.find((candidate) => candidate.id === "system_queue_1")?.removed).toBe(false);
  });
});
