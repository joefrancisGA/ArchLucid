import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

let searchParams = new URLSearchParams("tab=overview&snapshotId=22222222-2222-2222-2222-222222222222");

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn() }),
  usePathname: () => "/governance/infrastructure/resources/11111111-1111-1111-1111-111111111111",
  useSearchParams: () => searchParams,
}));

vi.mock("@/lib/infra-evidence/infra-evidence-resource-hub-cache", () => ({
  fetchCachedInfraEvidenceResourceHub: vi.fn(async () => ({
    cloudResourceId: "11111111-1111-1111-1111-111111111111",
    externalResourceId:
      "/subscriptions/sub/resourceGroups/rg-net/providers/Microsoft.Network/publicIPAddresses/gateway",
    resourceType: "Microsoft.Network/publicIPAddresses",
    currentConfiguration: {
      snapshotId: "22222222-2222-2222-2222-222222222222",
      azureResourceId:
        "/subscriptions/sub/resourceGroups/rg-net/providers/Microsoft.Network/publicIPAddresses/gateway",
      resourceType: "Microsoft.Network/publicIPAddresses",
      resourceGroup: "rg-net",
      region: "eastus",
      properties: {},
      tags: {},
    },
    terraformAddress: "azurerm_public_ip.gateway",
    terraformGenerationMethod: "advisory",
    diagramCorrespondence: null,
    operationalSecurityFindings: {
      streamKind: "OperationalSecurity",
      streamLabel: "Operational security",
      items: [],
      totalCount: 0,
      page: 1,
      pageSize: 25,
      hasMore: false,
    },
    architectureReviewFindings: {
      streamKind: "ArchitectureReview",
      streamLabel: "Architecture review",
      items: [],
      totalCount: 0,
      page: 1,
      pageSize: 25,
      hasMore: false,
    },
    remediationInstances: {
      items: [],
      totalCount: 0,
      page: 1,
      pageSize: 25,
      hasMore: false,
    },
    rbacAssignments: [],
    networkRelationships: [],
    recentChanges: [],
    auditLineageLink: {
      available: false,
      degradedReason: "No audit evidence snapshot rows reference this cloud resource yet.",
      relativePath: null,
      assessmentId: null,
      auditEvidenceSnapshotId: null,
      controlId: null,
      controlNumber: null,
      controlTitle: null,
      matches: [],
    },
    evidencePointers: [],
  })),
  invalidateInfraEvidenceResourceHubCacheForResource: vi.fn(),
}));

vi.mock("@/lib/use-nav-surface", () => ({
  useNavSurface: () => ({
    layerGuidance: {
      layerBadge: "Advanced operations",
      headline: "Resource hub",
      useWhen: "Inspect evidence",
      firstPilotNote: null,
    },
    contextHints: { layerHeaderEnterpriseRankCue: null },
  }),
}));

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: () => true,
  };
});

vi.mock("@/components/usability/PageContextualHelpButton", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/components/usability/PageContextualHelpButton")>();

  return {
    ...actual,
    PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
  };
});

import {
  GOVERNANCE_INFRASTRUCTURE_RESOURCE_HUB_PRIMARY_CONTENT_ID,
  GOVERNANCE_INFRASTRUCTURE_RESOURCE_HUB_SKIP_LINK_LABEL,
} from "@/lib/governance/governance-infrastructure-copy";
import { ResourceHubClient } from "./ResourceHubClient";

describe("ResourceHubClient buyer-polished chrome", () => {
  it("renders skip link, claim discipline, id disclosures, tabs, and sources strip", async () => {
    searchParams = new URLSearchParams("tab=overview&snapshotId=22222222-2222-2222-2222-222222222222");
    render(<ResourceHubClient cloudResourceId="11111111-1111-1111-1111-111111111111" />);

    expect(screen.getByRole("link", { name: GOVERNANCE_INFRASTRUCTURE_RESOURCE_HUB_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${GOVERNANCE_INFRASTRUCTURE_RESOURCE_HUB_PRIMARY_CONTENT_ID}`,
    );
    expect(screen.getByTestId("infra-resource-hub-claim-discipline")).toBeInTheDocument();
    expect(screen.getByTestId("governance-infrastructure-resource-hub-sources")).toBeInTheDocument();
    expect(screen.getByTestId("page-contextual-help-button")).toBeInTheDocument();
    expect(screen.queryByText("ADVANCED OPERATIONS")).not.toBeInTheDocument();
    expect(screen.getByTestId("infra-resource-hub-cloud-resource-id-disclosure")).toBeInTheDocument();
    expect(screen.getByTestId("infra-resource-hub-arm-resource-path-disclosure")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId("infra-resource-hub-tabs")).toBeInTheDocument();
    });
    expect(screen.getByTestId("infra-resource-hub-open-ask")).toBeInTheDocument();
  });

  it("collapses terraform address in buyer mode on terraform tab", async () => {
    searchParams = new URLSearchParams("tab=terraform&snapshotId=22222222-2222-2222-2222-222222222222");
    render(<ResourceHubClient cloudResourceId="11111111-1111-1111-1111-111111111111" />);

    await waitFor(() => {
      expect(screen.getByTestId("infra-resource-hub-terraform-address-disclosure")).toBeInTheDocument();
    });
  });
});
