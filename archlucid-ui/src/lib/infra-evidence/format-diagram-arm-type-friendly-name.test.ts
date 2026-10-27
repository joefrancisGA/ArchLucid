import { describe, expect, it } from "vitest";

import {
  formatDiagramArmTypeForOutline,
  formatDiagramArmTypeFriendlyName,
} from "@/lib/infra-evidence/format-diagram-arm-type-friendly-name";

describe("formatDiagramArmTypeFriendlyName", () => {
  it("maps known ARM types to title-cased friendly phrases", () => {
    expect(formatDiagramArmTypeFriendlyName("Microsoft.Network/virtualNetworks")).toBe("Virtual Network");
    expect(formatDiagramArmTypeFriendlyName("Microsoft.Network/privateEndpoints")).toBe("Private Endpoint");
    expect(formatDiagramArmTypeFriendlyName("Microsoft.Compute/virtualMachines")).toBe("Virtual Machine");
    expect(formatDiagramArmTypeFriendlyName("Microsoft.Storage/storageAccounts")).toBe("Storage Account");
    expect(formatDiagramArmTypeFriendlyName("Microsoft.Sql/servers/databases")).toBe("SQL Database");
  });

  it("maps Logic App, connection, and Static Web App types (P-12–P-14)", () => {
    expect(formatDiagramArmTypeFriendlyName("Microsoft.Logic/workflows")).toBe("Logic App");
    expect(formatDiagramArmTypeFriendlyName("Microsoft.Web/connections")).toBe("Logic App Connection");
    expect(formatDiagramArmTypeFriendlyName("Microsoft.Web/staticSites")).toBe("Static Web App");
  });

  it("splits unknown camelCase type segments", () => {
    expect(formatDiagramArmTypeFriendlyName("Microsoft.Example/widgetFarms")).toBe("Widget Farms");
  });

  it("returns null for blank input", () => {
    expect(formatDiagramArmTypeFriendlyName(null)).toBeNull();
    expect(formatDiagramArmTypeFriendlyName("  ")).toBeNull();
  });
});

describe("formatDiagramArmTypeForOutline", () => {
  it("uses unmapped caption for types outside the known catalog", () => {
    expect(formatDiagramArmTypeForOutline("Microsoft.Example/widgetFarms")).toContain(
      "ARM resource type has no reviewer label:",
    );
    expect(formatDiagramArmTypeForOutline("Microsoft.Example/widgetFarms")).toContain(
      "Microsoft.Example/widgetFarms",
    );
  });
});
