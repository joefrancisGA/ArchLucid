import { describe, expect, it } from "vitest";

import { formatDiagramArmTypeFriendlyName } from "@/lib/infra-evidence/format-diagram-arm-type-friendly-name";

describe("formatDiagramArmTypeFriendlyName", () => {
  it("maps known ARM types to title-cased friendly phrases", () => {
    expect(formatDiagramArmTypeFriendlyName("Microsoft.Network/virtualNetworks")).toBe("Virtual Network");
    expect(formatDiagramArmTypeFriendlyName("Microsoft.Network/privateEndpoints")).toBe("Private Endpoint");
    expect(formatDiagramArmTypeFriendlyName("Microsoft.Compute/virtualMachines")).toBe("Virtual Machine");
    expect(formatDiagramArmTypeFriendlyName("Microsoft.Storage/storageAccounts")).toBe("Storage Account");
    expect(formatDiagramArmTypeFriendlyName("Microsoft.Sql/servers/databases")).toBe("SQL Database");
  });

  it("splits unknown camelCase type segments", () => {
    expect(formatDiagramArmTypeFriendlyName("Microsoft.Example/widgetFarms")).toBe("Widget Farms");
  });

  it("returns null for blank input", () => {
    expect(formatDiagramArmTypeFriendlyName(null)).toBeNull();
    expect(formatDiagramArmTypeFriendlyName("  ")).toBeNull();
  });
});
