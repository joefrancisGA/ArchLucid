import { describe, expect, it } from "vitest";

import {
  filterInfraEvidenceMermaidOutline,
  shouldOmitAzureInventoryNeverShowArmType,
  shouldOmitInfraEvidenceOutlineNode,
} from "@/lib/infra-evidence/azure-inventory-never-show-arm-types";

describe("azure-inventory-never-show-arm-types", () => {
  it("omits metric alerts and workbooks", () => {
    expect(shouldOmitAzureInventoryNeverShowArmType("Microsoft.Insights/metricAlerts")).toBe(true);
    expect(shouldOmitAzureInventoryNeverShowArmType("Microsoft.Insights/workbooks")).toBe(true);
    expect(shouldOmitAzureInventoryNeverShowArmType("Microsoft.AlertsManagement/smartDetectorAlertRules")).toBe(true);
  });

  it("keeps backbone inventory types", () => {
    expect(shouldOmitAzureInventoryNeverShowArmType("Microsoft.Network/virtualNetworks")).toBe(false);
    expect(shouldOmitAzureInventoryNeverShowArmType("Microsoft.Compute/virtualMachines")).toBe(false);
  });

  it("filters never-show nodes from diagram outlines by default", () => {
    const outline = filterInfraEvidenceMermaidOutline(
      {
        nodes: [
          { id: "n1", label: "vnet-a", resourceType: "Microsoft.Network/virtualNetworks", resourceGroup: "rg-net" },
          { id: "n2", label: "cpu-alert", resourceType: "Microsoft.Insights/metricAlerts", resourceGroup: "rg-ops" },
          { id: "n3", label: "workbook-1", resourceType: "Microsoft.Insights/workbooks", resourceGroup: "rg-ops" },
        ],
        edges: [
          { from: "n1", to: "n2", label: null },
          { from: "n2", to: "n3", label: null },
        ],
      },
      false,
    );

    expect(outline.nodes.map((node) => node.id)).toEqual(["n1"]);
    expect(outline.edges).toEqual([]);
    expect(shouldOmitInfraEvidenceOutlineNode(outline.nodes[0]!)).toBe(false);
  });

  it("keeps never-show nodes when includeNeverShow is true", () => {
    const source = {
      nodes: [
        { id: "n2", label: "cpu-alert", resourceType: "Microsoft.Insights/metricAlerts", resourceGroup: "rg-ops" },
      ],
      edges: [],
    };

    expect(filterInfraEvidenceMermaidOutline(source, true)).toEqual(source);
  });
});
