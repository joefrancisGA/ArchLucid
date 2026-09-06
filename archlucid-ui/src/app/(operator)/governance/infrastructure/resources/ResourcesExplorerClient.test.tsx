import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ResourcesExplorerClient } from "@/app/(operator)/governance/infrastructure/resources/ResourcesExplorerClient";
import { fetchCloudResourceExplorerPage } from "@/lib/infra-evidence/infra-evidence-hub-api";

const replace = vi.fn();
let searchParams = new URLSearchParams("");
const listOperatorSavedViews = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
  usePathname: () => "/governance/infrastructure/resources",
  useSearchParams: () => searchParams,
}));

vi.mock("@/lib/api/operator-saved-views", () => ({
  listOperatorSavedViews: (...args: unknown[]) => listOperatorSavedViews(...args),
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

describe("ResourcesExplorerClient", () => {
  it("renders filters and resource table rows", async () => {
    searchParams = new URLSearchParams("");
    listOperatorSavedViews.mockResolvedValue([]);
    render(<ResourcesExplorerClient />);

    expect(screen.getByTestId("operator-saved-views-infra-resources")).toBeInTheDocument();

    expect(screen.getByTestId("infra-resource-explorer-name-prefix")).toBeInTheDocument();
    expect(await screen.findByTestId("infra-resource-row-11111111-1111-1111-1111-111111111111")).toBeInTheDocument();
    expect(screen.getByTestId("infra-resource-work-count-11111111-1111-1111-1111-111111111111-findings")).toHaveAttribute(
      "href",
      "/governance/infrastructure/resources/11111111-1111-1111-1111-111111111111?tab=findings",
    );
    expect(screen.getByTestId("infra-resource-work-count-11111111-1111-1111-1111-111111111111-remediation")).toHaveAttribute(
      "href",
      "/governance/infrastructure/remediation?cloudResourceId=11111111-1111-1111-1111-111111111111",
    );
    expect(screen.getByRole("link", { name: "gateway-pip" })).toHaveAttribute(
      "href",
      "/governance/infrastructure/resources/11111111-1111-1111-1111-111111111111",
    );
  });

  it("renders work queue chips and applies open-findings filter", async () => {
    searchParams = new URLSearchParams("");
    replace.mockClear();
    vi.mocked(fetchCloudResourceExplorerPage).mockClear();
    listOperatorSavedViews.mockResolvedValue([]);

    render(<ResourcesExplorerClient />);

    expect(screen.getByTestId("infra-resource-explorer-work-queue-open-findings")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("infra-resource-explorer-work-queue-open-findings"));

    expect(replace).toHaveBeenCalledWith("/governance/infrastructure/resources?workQueue=open-findings");
  });
});
