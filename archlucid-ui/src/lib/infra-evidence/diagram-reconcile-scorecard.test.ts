import { describe, expect, it } from "vitest";

import {
  buildDiagramReconcileCsv,
  buildDiagramReconcileDenominatorSentence,
  buildDiagramReconcileScorecard,
  groupDiagramReconcileInventoryOnlyRows,
} from "@/lib/infra-evidence/diagram-reconcile-scorecard";
import type { DiagramInfrastructureReconciliationResult } from "@/lib/infra-evidence/infra-evidence-diagram-reconcile-types";

function row(overrides: Partial<DiagramInfrastructureReconciliationResult["rows"][number]>) {
  return {
    correspondenceId: "row",
    diagramNodeId: null,
    diagramNodeLabel: null,
    cloudResourceId: "resource",
    azureResourceId: "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/storage",
    resourceType: "Microsoft.Storage/storageAccounts",
    resourceGroup: "rg",
    terraformAddress: null,
    matchKind: "InfrastructureOnly",
    confidenceBand: "InsufficientEvidence",
    explainText: "",
    aiRationale: null,
    securityDiscrepancy: false,
    ...overrides,
  };
}

function reconciliation(): DiagramInfrastructureReconciliationResult {
  return {
    comparisonId: "comparison",
    runId: "run",
    snapshotId: "snapshot",
    rows: [
      ...Array.from({ length: 20 }, (_, index) => row({
        correspondenceId: `resource-${index}`,
        azureResourceId: `/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/storage-${index}`,
      })),
      row({
        correspondenceId: "confirmed",
        diagramNodeId: "portal",
        diagramNodeLabel: "Portal",
        cloudResourceId: "portal-resource",
        matchKind: "Confirmed",
        confidenceBand: "Confirmed",
        explainText: "Confirmed by operator.",
      }),
    ],
    diagramNodeCount: 2,
    inventoryResourceCount: 20,
    edgeGaps: [{
      edgeGapId: "gap-1",
      fromCloudResourceId: "portal-resource",
      toCloudResourceId: "db-resource",
      diagramEdgeId: "edge-1",
      associationType: "vnetPeering",
      gapKind: "MissingInDiagram",
      explainText: "Present in inventory and not drawn.",
    }],
  };
}

describe("diagram-reconcile-scorecard", () => {
  it("groups twenty inventory resources while preserving the inventory count", () => {
    const result = reconciliation();
    const groups = groupDiagramReconcileInventoryOnlyRows(result.rows);

    expect(groups).toHaveLength(1);
    expect(groups[0]?.count).toBe(20);
    expect(buildDiagramReconcileScorecard(result).inventoryOnly).toBe(20);
  });

  it("states the visible capture denominator and exclusions", () => {
    const sentence = buildDiagramReconcileDenominatorSentence(20);

    expect(sentence).toContain("20 resources in the visible capture");
    expect(sentence).toContain("Dashboards");
    expect(sentence).toContain("Log Analytics workspaces");
    expect(sentence).toContain("DNS zones");
    expect(sentence).toContain("peering child records");
  });

  it("exports grouped inventory rows, confirmed rows, and connector gaps", () => {
    const csv = buildDiagramReconcileCsv(reconciliation());

    expect(csv).toContain('"kind","match","diagram"');
    expect(csv).toContain('"inventory-group","Inventory only","","rg","Microsoft.Storage/storageAccounts","20"');
    expect(csv).toContain('"correspondence","Confirmed","Portal"');
    expect(csv).toContain('"connector-gap","MissingInDiagram"');
  });
});
