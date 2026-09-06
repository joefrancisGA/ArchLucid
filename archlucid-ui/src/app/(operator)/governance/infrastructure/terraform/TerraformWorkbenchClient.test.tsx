import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { TerraformWorkbenchClient } from "@/app/(operator)/governance/infrastructure/terraform/TerraformWorkbenchClient";

let searchParams = new URLSearchParams(
  "snapshotId=22222222-2222-2222-2222-222222222222&cloudResourceId=11111111-1111-1111-1111-111111111111",
);

vi.mock("next/navigation", () => ({
  useSearchParams: () => searchParams,
}));

vi.mock("@/lib/infra-evidence/infra-evidence-hub-api", () => ({
  fetchCloudResourceEvidenceHub: vi.fn(async () => ({
    cloudResourceId: "11111111-1111-1111-1111-111111111111",
    externalResourceId: "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/publicIPAddresses/gw",
    terraformAddress: "azurerm_public_ip.gateway",
    terraformGenerationMethod: "advisory",
    currentConfiguration: {
      snapshotId: "22222222-2222-2222-2222-222222222222",
      azureResourceId: "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/publicIPAddresses/gw",
      resourceType: "Microsoft.Network/publicIPAddresses",
      resourceGroup: "rg",
      region: "eastus",
      properties: {},
      tags: {},
    },
    auditLineageLink: { available: false },
    operationalSecurityFindings: { items: [], totalCount: 0, page: 1, pageSize: 25, hasMore: false, streamKind: "", streamLabel: "" },
    architectureReviewFindings: { items: [], totalCount: 0, page: 1, pageSize: 25, hasMore: false, streamKind: "", streamLabel: "" },
    remediationInstances: { items: [], totalCount: 0, page: 1, pageSize: 25, hasMore: false },
    recentChanges: [],
    evidencePointers: [],
  })),
  formatInfraEvidenceHubApiError: (error: unknown) => String(error),
}));

describe("TerraformWorkbenchClient", () => {
  it("renders advisory mapping and hub links for scoped resource", async () => {
    render(<TerraformWorkbenchClient />);

    expect(await screen.findByTestId("infra-terraform-workbench")).toBeInTheDocument();
    expect(screen.getByText("azurerm_public_ip.gateway")).toBeInTheDocument();
    expect(screen.getByTestId("infra-terraform-open-primary-hub")).toHaveAttribute(
      "href",
      "/governance/infrastructure/resources/11111111-1111-1111-1111-111111111111?tab=terraform&snapshotId=22222222-2222-2222-2222-222222222222",
    );
  });
});
