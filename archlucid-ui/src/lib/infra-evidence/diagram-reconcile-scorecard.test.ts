import { describe, expect, it } from "vitest";

import {
  buildDiagramReconcileCsv,
  buildDiagramReconcileDenominatorSentence,
  buildDiagramReconcileScorecard,
  DIAGRAM_RECONCILE_CONNECTOR_GAPS_NOT_STORED_COPY,
  formatDiagramReconcileConnectorGapsLabel,
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

    expect(csv).toContain('"Kind","Match","Diagram"');
    expect(csv).toContain('"inventory-group","Inventory only","","rg","Microsoft.Storage/storageAccounts","20"');
    expect(csv).toContain('"correspondence","Confirmed","Portal"');
    expect(csv).toContain('"connector-gap","MissingInDiagram"');
  });

  it("labels omitted edgeGaps instead of exporting zero connector gaps", () => {
    const scorecard = buildDiagramReconcileScorecard({ ...reconciliation(), edgeGaps: undefined });
    const csv = buildDiagramReconcileCsv({ ...reconciliation(), edgeGaps: undefined });

    expect(scorecard.connectorGaps).toBeNull();
    expect(formatDiagramReconcileConnectorGapsLabel(scorecard.connectorGaps)).toBe(
      DIAGRAM_RECONCILE_CONNECTOR_GAPS_NOT_STORED_COPY,
    );
    expect(csv).toContain(DIAGRAM_RECONCILE_CONNECTOR_GAPS_NOT_STORED_COPY);
  });

  it("labels missing resource group and type without inventing placeholders", () => {
    const groups = groupDiagramReconcileInventoryOnlyRows([
      row({ resourceGroup: null, resourceType: null }),
      row({ correspondenceId: "empty-type", resourceGroup: "rg", resourceType: "" }),
    ]);

    expect(groups[0]?.resourceGroup).toBe("Resource group was not stored.");
    expect(groups[0]?.resourceType).toBe("Resource type was not stored.");
    expect(groups.some((group) => group.resourceType === "Unknown resource type")).toBe(false);
    expect(groups.some((group) => group.resourceGroup === "Unassigned resource group")).toBe(false);
    expect(groups.find((group) => group.resourceGroup === "rg")?.resourceType).toBe("");
  });

  it("uses diagram label omission copy instead of ids in csv (P-08)", () => {
    const csv = buildDiagramReconcileCsv({
      ...reconciliation(),
      rows: [
        row({
          correspondenceId: "corr-1",
          diagramNodeId: "node-1",
          diagramNodeLabel: null,
          matchKind: "Confirmed",
        }),
      ],
      edgeGaps: [],
    });

    expect(csv).toContain('"Diagram label was not stored."');
    expect(csv).not.toContain("node-1");
    expect(csv).not.toContain("corr-1");
  });

  it("labels missing azure resource id and empty resource group in csv (P-09)", () => {
    const csv = buildDiagramReconcileCsv({
      ...reconciliation(),
      rows: [
        row({ azureResourceId: null, resourceGroup: "" }),
      ],
      edgeGaps: [],
    });

    expect(csv).toContain("Resource name was not stored.");
    expect(csv).toContain("Resource group was stored empty.");
  });

  it("labels missing connector endpoints without inventing an empty value", () => {
    const result = {
      ...reconciliation(),
      edgeGaps: [{
        ...reconciliation().edgeGaps[0],
        fromCloudResourceId: null,
        toCloudResourceId: "",
      }],
    };

    const csv = buildDiagramReconcileCsv(result);

    expect(csv).toContain('"Endpoint was not stored → Endpoint was not stored"');
    expect(csv).not.toContain('"— → —"');
  });
});
