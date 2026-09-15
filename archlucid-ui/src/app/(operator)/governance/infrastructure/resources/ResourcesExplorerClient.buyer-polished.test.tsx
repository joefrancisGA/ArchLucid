import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

let searchParams = new URLSearchParams("");

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn() }),
  usePathname: () => "/governance/infrastructure/resources",
  useSearchParams: () => searchParams,
}));

vi.mock("@/lib/api/operator-saved-views", () => ({
  listOperatorSavedViews: vi.fn(async () => []),
  createOperatorSavedView: vi.fn(),
  deleteOperatorSavedView: vi.fn(),
}));

vi.mock("@/lib/infra-evidence/infra-evidence-hub-api", () => ({
  fetchCloudResourceExplorerPage: vi.fn(async () => ({
    items: [
      {
        cloudResourceId: "11111111-1111-1111-1111-111111111111",
        externalResourceId:
          "/subscriptions/sub/resourceGroups/rg-net/providers/Microsoft.Network/publicIPAddresses/gateway",
        displayName: "gateway-pip",
        resourceType: "Microsoft.Network/publicIPAddresses",
        resourceGroup: "rg-net",
        region: "eastus",
        lastSeenUtc: "2026-09-01T12:00:00Z",
        workCounts: {
          openOperationalFindingsCount: 2,
          openRemediationInstancesCount: 1,
          inventoryDriftChangeCount: 0,
        },
      },
    ],
    totalCount: 1,
    page: 1,
    pageSize: 50,
    hasMore: false,
  })),
  formatInfraEvidenceHubApiError: (error: unknown) => String(error),
}));

vi.mock("@/lib/use-nav-surface", () => ({
  useNavSurface: () => ({
    layerGuidance: {
      layerBadge: "Advanced operations",
      headline: "Resource explorer",
      useWhen: "Search resources",
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
  GOVERNANCE_INFRASTRUCTURE_RESOURCES_PRIMARY_CONTENT_ID,
  GOVERNANCE_INFRASTRUCTURE_RESOURCES_SKIP_LINK_LABEL,
} from "@/lib/governance/governance-infrastructure-copy";
import { ResourcesExplorerClient } from "./ResourcesExplorerClient";

describe("ResourcesExplorerClient buyer-polished chrome", () => {
  it("renders skip link, filters, table row, and sources strip", async () => {
    searchParams = new URLSearchParams("");
    render(<ResourcesExplorerClient />);

    expect(screen.getByRole("link", { name: GOVERNANCE_INFRASTRUCTURE_RESOURCES_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${GOVERNANCE_INFRASTRUCTURE_RESOURCES_PRIMARY_CONTENT_ID}`,
    );
    expect(screen.queryByTestId("infra-resource-explorer-claim-discipline")).not.toBeInTheDocument();
    expect(screen.getByTestId("governance-infrastructure-resources-sources")).toBeInTheDocument();
    expect(screen.getByTestId("page-contextual-help-button")).toBeInTheDocument();
    expect(screen.queryByText("ADVANCED OPERATIONS")).not.toBeInTheDocument();
    expect(screen.getByTestId("infra-resource-explorer-name-prefix")).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByTestId("infra-resource-row-11111111-1111-1111-1111-111111111111")).toBeInTheDocument();
    });
    expect(
      screen.queryByTestId("infra-resource-row-arm-id-disclosure-11111111-1111-1111-1111-111111111111"),
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId("infra-resource-row-11111111-1111-1111-1111-111111111111"));
    expect(screen.getByTestId("infra-resource-row-arm-id-disclosure-11111111-1111-1111-1111-111111111111")).toHaveTextContent(
      "resource id: /subscriptions/sub/resourceGroups/rg-net/providers/Microsoft.Network/publicIPAddresses/gateway",
    );
    expect(screen.queryByTestId("infra-resource-explorer-snapshot-id")).not.toBeInTheDocument();
    expect(screen.getByTestId("infra-resource-type-11111111-1111-1111-1111-111111111111")).toHaveTextContent(
      "Network/publicIPAddresses",
    );
    expect(screen.getByTestId("infra-resource-last-seen-11111111-1111-1111-1111-111111111111")).toHaveTextContent(
      "9/1/26, 08:00",
    );
  });
});
