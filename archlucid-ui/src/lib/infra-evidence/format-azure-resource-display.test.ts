import { describe, expect, it } from "vitest";

import { formatAzureResourceDisplay } from "@/lib/infra-evidence/format-azure-resource-display";

describe("formatAzureResourceDisplay", () => {
  it("returns an empty placeholder when the id is missing", () => {
    expect(formatAzureResourceDisplay(null)).toEqual({
      name: "—",
      resourceType: null,
      resourceGroup: null,
      primaryLabel: "—",
      secondaryLabel: null,
    });
    expect(formatAzureResourceDisplay("   ")).toEqual({
      name: "—",
      resourceType: null,
      resourceGroup: null,
      primaryLabel: "—",
      secondaryLabel: null,
    });
  });

  it("shows the resource name first and keeps type plus resource group on a secondary line", () => {
    expect(
      formatAzureResourceDisplay(
        "/subscriptions/8aa56f3b-18bc-43ca-ad45-bad9e811d33b/resourceGroups/rg-archlucid-demo-cus/providers/Microsoft.Compute/virtualMachines/vm-app-02",
      ),
    ).toEqual({
      name: "vm-app-02",
      resourceType: "Compute/virtualMachines",
      resourceGroup: "rg-archlucid-demo-cus",
      primaryLabel: "vm-app-02",
      secondaryLabel: "Compute/virtualMachines · rg-archlucid-demo-cus",
    });
  });

  it("shows the provider-qualified type without the Microsoft prefix", () => {
    expect(
      formatAzureResourceDisplay(
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.PowerPlatform/enterprisePolicies/policy-1",
      ),
    ).toEqual({
      name: "policy-1",
      resourceType: "PowerPlatform/enterprisePolicies",
      resourceGroup: "rg",
      primaryLabel: "policy-1",
      secondaryLabel: "PowerPlatform/enterprisePolicies · rg",
    });
  });

  it("uses the nested child name for child ARM resources", () => {
    expect(
      formatAzureResourceDisplay(
        "/subscriptions/sub/resourceGroups/rg-net/providers/Microsoft.Network/virtualNetworks/vnet-app/subnets/subnet-app",
      ),
    ).toEqual({
      name: "subnet-app",
      resourceType: "Network/virtualNetworks/subnets",
      resourceGroup: "rg-net",
      primaryLabel: "subnet-app",
      secondaryLabel: "Network/virtualNetworks/subnets · rg-net",
    });
  });

  it("falls back to the last segment when the value is not an ARM id", () => {
    expect(formatAzureResourceDisplay("gateway-public-ip")).toEqual({
      name: "gateway-public-ip",
      resourceType: null,
      resourceGroup: null,
      primaryLabel: "gateway-public-ip",
      secondaryLabel: null,
    });
  });
});
