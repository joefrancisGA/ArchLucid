import { describe, expect, it } from "vitest";

import { buildArchitectureManifestUnifiedLines } from "@/lib/architecture/architecture-manifest-line-diff";
import { buildCompareGovernanceDiffView } from "@/lib/compare-effective-governance-diff";
import { runInpOffloadTaskSync } from "@/lib/workers/inp-offload-tasks";
import type { GraphViewModel } from "@/types/graph";

const sampleGraph: GraphViewModel = {
  nodes: [
    { id: "a", label: "Subnet A", type: "TopologyResource" },
    { id: "b", label: "VM 1", type: "TopologyResource" },
  ],
  edges: [{ source: "a", target: "b", type: "contains" }],
  nodeCount: 2,
  edgeCount: 1,
};

describe("inp-offload-tasks (TB-2166)", () => {
  it("prepares finding evidence graph nodes off-thread contract", () => {
    const result = runInpOffloadTaskSync("findingEvidenceGraphPrep", {
      graph: sampleGraph,
      graphNodeIdsExamined: ["vm-1", "b"],
      viewMode: "reasoningPath",
    });

    expect(result.nodes.length).toBeGreaterThan(0);
    expect(result.edges.length).toBeGreaterThan(0);
  });

  it("builds compare governance diff via the shared task runner", () => {
    const baselineManifest = {
      ruleSetId: "rules-a",
      ruleSetVersion: "1",
      complianceRuleKeyCount: 1,
      complianceRuleKeys: ["key-a"],
      atCommit: null,
    };
    const targetManifest = {
      ruleSetId: "rules-b",
      ruleSetVersion: "2",
      complianceRuleKeyCount: 1,
      complianceRuleKeys: ["key-b"],
      atCommit: null,
    };

    const workerResult = runInpOffloadTaskSync("compareGovernanceDiff", {
      baselineManifest,
      targetManifest,
      currentEffective: null,
    });
    const directResult = buildCompareGovernanceDiffView({
      baselineManifest,
      targetManifest,
      currentEffective: null,
    });

    expect(workerResult).toEqual(directResult);
    expect(workerResult.manifestRuleSetChanges).toHaveLength(2);
  });

  it("builds manifest line diff via the shared task runner", () => {
    const beforeText = "{\n  \"a\": 1\n}";
    const afterText = "{\n  \"a\": 2\n}";

    const workerResult = runInpOffloadTaskSync("manifestLineDiff", {
      beforeText,
      afterText,
    });
    const directResult = buildArchitectureManifestUnifiedLines(beforeText, afterText);

    expect(workerResult).toEqual(directResult);
    expect(workerResult.some((line) => line.kind === "remove")).toBe(true);
    expect(workerResult.some((line) => line.kind === "add")).toBe(true);
  });
});
