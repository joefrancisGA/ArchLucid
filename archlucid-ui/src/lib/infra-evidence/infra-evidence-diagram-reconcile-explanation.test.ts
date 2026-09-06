import { describe, expect, it } from "vitest";

import {
  buildDiagramReconcileOperationalFindingFingerprint,
  formatDiagramReconcileExplanation,
} from "@/lib/infra-evidence/infra-evidence-diagram-reconcile-explanation";
import type { DiagramInfrastructureCorrespondenceRow } from "@/lib/infra-evidence/infra-evidence-diagram-reconcile-types";

describe("infra-evidence-diagram-reconcile-explanation", () => {
  it("includes AI rationale only for Possible or Unknown rows", () => {
    const possibleRow: DiagramInfrastructureCorrespondenceRow = {
      correspondenceId: "diagram-node-1",
      diagramNodeId: "node-1",
      diagramNodeLabel: "gateway",
      cloudResourceId: null,
      azureResourceId: null,
      resourceType: null,
      resourceGroup: null,
      terraformAddress: null,
      matchKind: "Possible",
      confidenceBand: "Possible",
      explainText: "Name similarity only.",
      aiRationale: "Labels are close but resource type differs.",
      securityDiscrepancy: false,
    };

    expect(formatDiagramReconcileExplanation(possibleRow)).toContain("AI rationale:");
    expect(formatDiagramReconcileExplanation({
      ...possibleRow,
      matchKind: "Conflict",
      aiRationale: "Should not appear",
    })).not.toContain("AI rationale:");
  });

  it("builds stable operational finding fingerprints", () => {
    expect(
      buildDiagramReconcileOperationalFindingFingerprint("run", "snap", "corr-1"),
    ).toBe("diagram-reconcile:run:snap:corr-1");
  });
});
