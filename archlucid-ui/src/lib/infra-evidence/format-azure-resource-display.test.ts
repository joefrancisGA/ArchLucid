import { describe, expect, it } from "vitest";

import {
  formatAzureResourceDisplay,
  formatAzureResourceTypeForDisplay,
  formatCloudResourceDisplayName,
  isSecureNowResourceDisplayNameMissing,
  normalizeSecureNowResourceNameForDisplay,
} from "@/lib/infra-evidence/format-azure-resource-display";

describe("formatAzureResourceDisplay", () => {
  it("returns Name not recorded when the id is missing", () => {
    expect(formatAzureResourceDisplay(null)).toEqual({
      name: "Resource name was not stored.",
      resourceType: null,
      resourceGroup: null,
      primaryLabel: "Resource name was not stored.",
      secondaryLabel: null,
    });
    expect(formatAzureResourceDisplay("   ")).toEqual({
      name: "Resource name was not stored.",
      resourceType: null,
      resourceGroup: null,
      primaryLabel: "Resource name was not stored.",
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

  it("states when type and resource group were not stored on ARM ids (P-20)", () => {
    expect(formatAzureResourceDisplay("/subscriptions/sub-id/custom-segment-only")).toEqual({
      name: "custom-segment-only",
      resourceType: null,
      resourceGroup: null,
      primaryLabel: "custom-segment-only",
      secondaryLabel: "Resource type was not stored. Resource group was not stored.",
    });
  });

  it("states when only resource group was not stored on ARM ids (P-19)", () => {
    expect(
      formatAzureResourceDisplay(
        "/subscriptions/sub/providers/Microsoft.Storage/storageAccounts/acct1",
      ).secondaryLabel,
    ).toBe("Storage/storageAccounts · Resource group was not stored.");
  });
});

describe("normalizeSecureNowResourceNameForDisplay", () => {
  it("lowercases mixed-case Azure resource names", () => {
    expect(normalizeSecureNowResourceNameForDisplay("Gateway-PIP")).toBe("gateway-pip");
    expect(normalizeSecureNowResourceNameForDisplay("  VNet-AEP-HI-TEST  ")).toBe("vnet-aep-hi-test");
  });

  it("preserves the empty placeholder", () => {
    expect(normalizeSecureNowResourceNameForDisplay("—")).toBe("Resource name was not stored.");
  });

  it("treats empty and em-dash names as missing for outline omission copy (P-02)", () => {
    expect(isSecureNowResourceDisplayNameMissing("")).toBe(true);
    expect(isSecureNowResourceDisplayNameMissing("—")).toBe(true);
    expect(isSecureNowResourceDisplayNameMissing("gateway-pip")).toBe(false);
  });
});

describe("formatCloudResourceDisplayName", () => {
  it("prefers displayName and lowercases it", () => {
    expect(
      formatCloudResourceDisplayName({
        displayName: "Gateway-PIP",
        externalResourceId: "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/publicIPAddresses/gateway",
      }),
    ).toBe("gateway-pip");
  });

  it("uses the ARM id tail when displayName is missing", () => {
    expect(
      formatCloudResourceDisplayName({
        displayName: null,
        externalResourceId: "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/publicIPAddresses/Gateway",
      }),
    ).toBe("gateway");
    expect(
      formatCloudResourceDisplayName({
        displayName: null,
        externalResourceId:
          "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/customerdata",
      }),
    ).toBe("customerdata");
  });
});

describe("formatAzureResourceTypeForDisplay", () => {
  it("strips the Microsoft provider prefix from an ARM type", () => {
    expect(formatAzureResourceTypeForDisplay("Microsoft.Network/publicIPAddresses")).toBe(
      "Network/publicIPAddresses",
    );
    expect(formatAzureResourceTypeForDisplay("microsoft.compute/virtualMachines")).toBe(
      "compute/virtualMachines",
    );
  });

  it("leaves non-Microsoft types unchanged", () => {
    expect(formatAzureResourceTypeForDisplay("Oracle.Database/autonomousDatabases")).toBe(
      "Oracle.Database/autonomousDatabases",
    );
  });

  it("returns an em dash when the type is missing", () => {
    expect(formatAzureResourceTypeForDisplay(null)).toBe("Resource type was not stored.");
    expect(formatAzureResourceTypeForDisplay("  ")).toBe("Resource type was not stored.");
  });
});
