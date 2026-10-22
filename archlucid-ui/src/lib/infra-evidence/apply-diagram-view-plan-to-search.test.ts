import { describe, expect, it } from "vitest";

import {
  applyDiagramViewPlanToSearch,
  isDiagramViewPlanValid,
} from "@/lib/infra-evidence/apply-diagram-view-plan-to-search";
import type { DiagramViewPlan } from "@/lib/infra-evidence/diagram-view-plan-types";

const basePlan: DiagramViewPlan = {
  mermaidMode: "network",
  resourceGroupName: null,
  seedNodeId: null,
  snapshotId: "22222222-2222-2222-2222-222222222222",
  cloudResourceId: null,
  fitTargetNodeId: null,
  honestyLabel: "Proposed view — existing diagram modes only",
};

describe("applyDiagramViewPlanToSearch", () => {
  it("builds network mode href and keeps snapshotId", () => {
    const result = applyDiagramViewPlanToSearch("snapshotId=22222222-2222-2222-2222-222222222222", basePlan);

    expect(result.error).toBeNull();
    expect(result.href).toContain("mermaidMode=network");
    expect(result.href).toContain("snapshotId=22222222-2222-2222-2222-222222222222");
  });

  it("leaves search unchanged for invalid mode", () => {
    const invalidPlan: DiagramViewPlan = {
      ...basePlan,
      mermaidMode: "bogus-mode",
    };

    const result = applyDiagramViewPlanToSearch("snapshotId=snap-1&mermaidMode=executive", invalidPlan);

    expect(result.error).not.toBeNull();
    expect(result.href).toBe("/governance/infrastructure/diagrams?snapshotId=snap-1&mermaidMode=executive");
  });

  it("validates dependency neighborhood requires seed or cloud resource", () => {
    expect(
      isDiagramViewPlanValid({
        ...basePlan,
        mermaidMode: "dependencyNeighborhood",
        seedNodeId: null,
        cloudResourceId: null,
      }),
    ).toBe(false);
  });
});
