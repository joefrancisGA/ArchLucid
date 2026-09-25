import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ResourcesExplorerClient } from "@/app/(operator)/governance/infrastructure/resources/ResourcesExplorerClient";
import {
  GOVERNANCE_INFRASTRUCTURE_RESOURCES_NAME_PREFIX_LABEL,
  GOVERNANCE_INFRASTRUCTURE_RESOURCES_RESOURCE_GROUP_LABEL,
  GOVERNANCE_INFRASTRUCTURE_RESOURCES_RESOURCE_TYPE_LABEL,
} from "@/lib/governance/governance-infrastructure-copy";
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

vi.mock("@/lib/infra-evidence/infra-evidence-drift-api", () => ({
  fetchInfraEvidenceSnapshots: vi.fn(async () => ({
    items: [
      {
        snapshotId: "22222222-2222-2222-2222-222222222222",
        subscriptionId: "sub-1",
        subscriptionName: "Production",
        capturedUtc: "2026-09-01T10:00:00Z",
        captureStatus: 1,
        resourceCount: 214,
        relationshipCount: 0,
      },
    ],
    totalCount: 1,
    page: 1,
    pageSize: 20,
    hasMore: false,
  })),
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

    const primaryContent = screen.getByTestId("infra-resource-explorer-primary-content");
    expect(primaryContent.className).not.toMatch(/mx-auto/);
    expect(primaryContent).toHaveClass("w-full");
    expect(screen.getByTestId("operator-saved-views-infra-resources")).toBeInTheDocument();

    expect(screen.getByTestId("infra-resource-explorer-name-prefix")).toBeInTheDocument();
    expect(await screen.findByTestId("infra-resource-row-11111111-1111-1111-1111-111111111111")).toBeInTheDocument();
    expect(screen.getByTestId("infra-resource-work-count-11111111-1111-1111-1111-111111111111-findings")).toHaveAttribute(
      "href",
      "/governance/infrastructure/resources/11111111-1111-1111-1111-111111111111?tab=findings",
    );
    expect(screen.getByTestId("infra-resource-work-count-11111111-1111-1111-1111-111111111111-remediation")).toHaveAttribute(
      "href",
      "/governance/infrastructure/resources/11111111-1111-1111-1111-111111111111?tab=remediation",
    );
    expect(screen.getByRole("link", { name: "gateway-pip" })).toHaveAttribute(
      "href",
      "/governance/infrastructure/resources/11111111-1111-1111-1111-111111111111",
    );
    expect(screen.getByTestId("infra-resource-explorer-ask-11111111-1111-1111-1111-111111111111")).toHaveAttribute(
      "href",
      "/governance/infrastructure/ask?cloudResourceId=11111111-1111-1111-1111-111111111111",
    );
    expect(screen.queryByTestId("infra-resource-explorer-overview-11111111-1111-1111-1111-111111111111")).not.toBeInTheDocument();
    expect(screen.queryByTestId("infra-resource-explorer-hub-tab-11111111-1111-1111-1111-111111111111")).not.toBeInTheDocument();
    expect(screen.getByTestId("infra-resource-explorer-snapshot-id")).toBeInTheDocument();
    expect(screen.getByTestId("infra-resource-explorer-inventory-as-of")).toHaveTextContent("Inventory as of");
    expect(screen.getByTestId("infra-resource-type-11111111-1111-1111-1111-111111111111")).toHaveTextContent(
      "Network/publicIPAddresses",
    );
    expect(screen.getByTestId("infra-resource-type-11111111-1111-1111-1111-111111111111")).not.toHaveTextContent(
      "Microsoft.",
    );
    expect(screen.getByTestId("infra-resource-last-seen-11111111-1111-1111-1111-111111111111")).toHaveTextContent(
      "9/1/26, 08:00",
    );
    expect(screen.getByTestId("infra-resource-last-seen-11111111-1111-1111-1111-111111111111")).not.toHaveTextContent(
      /AM|PM|2026/,
    );
    expect(
      screen.queryByTestId("infra-resource-row-arm-id-disclosure-11111111-1111-1111-1111-111111111111"),
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId("infra-resource-row-arm-id-toggle-11111111-1111-1111-1111-111111111111"));
    expect(screen.getByTestId("infra-resource-row-arm-id-disclosure-11111111-1111-1111-1111-111111111111")).toHaveTextContent(
      "resource id: /subscriptions/sub/resourceGroups/rg-net/providers/Microsoft.Network/publicIPAddresses/gateway",
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

  it("passes active work queue into explorer Ask links", async () => {
    searchParams = new URLSearchParams("workQueue=open-findings");
    listOperatorSavedViews.mockResolvedValue([]);
    render(<ResourcesExplorerClient />);

    expect(await screen.findByTestId("infra-resource-explorer-ask-11111111-1111-1111-1111-111111111111")).toHaveAttribute(
      "href",
      "/governance/infrastructure/ask?cloudResourceId=11111111-1111-1111-1111-111111111111&workQueue=open-findings&tab=findings",
    );
    expect(screen.getByTestId("infra-resource-explorer-overview-11111111-1111-1111-1111-111111111111")).toHaveAttribute(
      "href",
      "/governance/infrastructure/resources/11111111-1111-1111-1111-111111111111?workQueue=open-findings",
    );
    expect(screen.getByTestId("infra-resource-explorer-hub-tab-11111111-1111-1111-1111-111111111111")).toHaveAttribute(
      "href",
      "/governance/infrastructure/resources/11111111-1111-1111-1111-111111111111?tab=findings&workQueue=open-findings",
    );
    expect(screen.getByTestId("infra-resource-explorer-hub-11111111-1111-1111-1111-111111111111")).toHaveAttribute(
      "href",
      "/governance/infrastructure/resources/11111111-1111-1111-1111-111111111111?tab=findings&workQueue=open-findings",
    );
    expect(screen.getByTestId("infra-resource-work-count-11111111-1111-1111-1111-111111111111-findings")).toHaveAttribute(
      "href",
      "/governance/infrastructure/ask?cloudResourceId=11111111-1111-1111-1111-111111111111&workQueue=open-findings&tab=findings",
    );
    expect(screen.getByTestId("infra-resource-work-count-11111111-1111-1111-1111-111111111111-remediation")).toHaveAttribute(
      "href",
      "/governance/infrastructure/resources/11111111-1111-1111-1111-111111111111?tab=remediation",
    );
  });

  it("routes drift work count badges to the hub drift tab under recent-drift queue", async () => {
    vi.mocked(fetchCloudResourceExplorerPage).mockResolvedValueOnce({
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
            openOperationalFindingsCount: 0,
            openRemediationInstancesCount: 0,
            inventoryDriftChangeCount: 3,
          },
        },
      ],
      totalCount: 1,
      page: 1,
      pageSize: 50,
      hasMore: false,
    });
    searchParams = new URLSearchParams("workQueue=recent-drift");
    listOperatorSavedViews.mockResolvedValue([]);
    render(<ResourcesExplorerClient />);

    expect(await screen.findByTestId("infra-resource-work-count-11111111-1111-1111-1111-111111111111-drift")).toHaveAttribute(
      "href",
      "/governance/infrastructure/ask?cloudResourceId=11111111-1111-1111-1111-111111111111&workQueue=recent-drift&tab=drift",
    );
    expect(screen.getByTestId("infra-resource-explorer-hub-11111111-1111-1111-1111-111111111111")).toHaveAttribute(
      "href",
      "/governance/infrastructure/resources/11111111-1111-1111-1111-111111111111?tab=drift&workQueue=recent-drift",
    );
    expect(screen.getByTestId("infra-resource-explorer-hub-tab-11111111-1111-1111-1111-111111111111")).toHaveAttribute(
      "href",
      "/governance/infrastructure/resources/11111111-1111-1111-1111-111111111111?tab=drift&workQueue=recent-drift",
    );
  });

  it("renders remediation hub tab row action under open-remediation queue", async () => {
    searchParams = new URLSearchParams("workQueue=open-remediation");
    listOperatorSavedViews.mockResolvedValue([]);
    render(<ResourcesExplorerClient />);

    expect(await screen.findByTestId("infra-resource-explorer-hub-tab-11111111-1111-1111-1111-111111111111")).toHaveAttribute(
      "href",
      "/governance/infrastructure/resources/11111111-1111-1111-1111-111111111111?tab=remediation&workQueue=open-remediation",
    );
    expect(screen.getByRole("link", { name: "Remediation" })).toBeInTheDocument();
    expect(screen.getByTestId("infra-resource-work-count-11111111-1111-1111-1111-111111111111-remediation")).toHaveAttribute(
      "href",
      "/governance/infrastructure/ask?cloudResourceId=11111111-1111-1111-1111-111111111111&workQueue=open-remediation&tab=remediation",
    );
  });

  it("shows None in the work column when a resource has no open work", async () => {
    vi.mocked(fetchCloudResourceExplorerPage).mockResolvedValueOnce({
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
            openOperationalFindingsCount: 0,
            openRemediationInstancesCount: 0,
            inventoryDriftChangeCount: 0,
          },
        },
      ],
      totalCount: 1,
      page: 1,
      pageSize: 50,
      hasMore: false,
    });
    searchParams = new URLSearchParams("");
    listOperatorSavedViews.mockResolvedValue([]);
    render(<ResourcesExplorerClient />);

    const workCell = await screen.findByTestId("infra-resource-work-counts-11111111-1111-1111-1111-111111111111");

    expect(workCell).toHaveTextContent("None");
    expect(workCell).not.toHaveTextContent("—");
  });

  it("displays mixed-case resource names in lowercase", async () => {
    fetchCloudResourceExplorerPage.mockResolvedValueOnce({
      items: [
        {
          cloudResourceId: "11111111-1111-1111-1111-111111111111",
          externalResourceId:
            "/subscriptions/sub/resourceGroups/rg-net/providers/Microsoft.Network/publicIPAddresses/gateway",
          displayName: "Gateway-PIP",
          resourceType: "Microsoft.Network/publicIPAddresses",
          resourceGroup: "rg-net",
          region: "eastus",
          lastSeenUtc: "2026-09-01T12:00:00Z",
          workCounts: null,
        },
      ],
      totalCount: 1,
      page: 1,
      pageSize: 50,
      hasMore: false,
    });
    searchParams = new URLSearchParams("");
    render(<ResourcesExplorerClient />);

    expect(await screen.findByRole("link", { name: "gateway-pip" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Gateway-PIP" })).not.toBeInTheDocument();
  });

  it("renders title-case filter labels and a non-editable apply button", async () => {
    searchParams = new URLSearchParams("");
    listOperatorSavedViews.mockResolvedValue([]);
    render(<ResourcesExplorerClient />);

    expect(screen.getByText(GOVERNANCE_INFRASTRUCTURE_RESOURCES_NAME_PREFIX_LABEL)).toBeInTheDocument();
    expect(screen.getByText(GOVERNANCE_INFRASTRUCTURE_RESOURCES_RESOURCE_TYPE_LABEL)).toBeInTheDocument();
    expect(screen.getByText(GOVERNANCE_INFRASTRUCTURE_RESOURCES_RESOURCE_GROUP_LABEL)).toBeInTheDocument();
    expect(GOVERNANCE_INFRASTRUCTURE_RESOURCES_NAME_PREFIX_LABEL).toBe("Name Prefix");
    expect(GOVERNANCE_INFRASTRUCTURE_RESOURCES_RESOURCE_TYPE_LABEL).toBe("Resource Type");
    expect(GOVERNANCE_INFRASTRUCTURE_RESOURCES_RESOURCE_GROUP_LABEL).toBe("Resource Group");

    const applyButton = screen.getByTestId("infra-resource-explorer-apply");
    expect(applyButton).toHaveAttribute("type", "submit");
    expect(screen.getByTestId("infra-resource-explorer-command-bar")).toBeInTheDocument();
    await screen.findByTestId("infra-resource-row-11111111-1111-1111-1111-111111111111");
    expect(screen.getByTestId("infra-resource-explorer-page-range")).toHaveTextContent("Showing 1–1 of 1");
    expect(screen.getByTestId("infra-resource-explorer-scope-status")).toHaveTextContent("All resources");
    expect(screen.getByTestId("infra-resource-work-markers-key")).toHaveTextContent("F findings");
    expect(screen.getByTestId("infra-resource-explorer-work-queue-all")).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByTestId("infra-resource-explorer-page-shortcuts")).toBeInTheDocument();
  });

  it("sorts resources by name on initial load and toggles sort from column headers", async () => {
    vi.mocked(fetchCloudResourceExplorerPage).mockResolvedValueOnce({
      items: [
        {
          cloudResourceId: "22222222-2222-2222-2222-222222222222",
          externalResourceId:
            "/subscriptions/sub/resourceGroups/rg-net/providers/Microsoft.Network/publicIPAddresses/zebra",
          displayName: "zebra",
          resourceType: "Microsoft.Network/publicIPAddresses",
          resourceGroup: "rg-net",
          region: "eastus",
          lastSeenUtc: "2026-09-01T12:00:00Z",
          workCounts: null,
        },
        {
          cloudResourceId: "11111111-1111-1111-1111-111111111111",
          externalResourceId:
            "/subscriptions/sub/resourceGroups/rg-net/providers/Microsoft.Network/publicIPAddresses/alpha",
          displayName: "alpha",
          resourceType: "Microsoft.Network/publicIPAddresses",
          resourceGroup: "rg-net",
          region: "eastus",
          lastSeenUtc: "2026-09-01T12:00:00Z",
          workCounts: null,
        },
      ],
      totalCount: 2,
      page: 1,
      pageSize: 50,
      hasMore: false,
    });
    searchParams = new URLSearchParams("");
    replace.mockClear();
    listOperatorSavedViews.mockResolvedValue([]);
    const view = render(<ResourcesExplorerClient />);

    await screen.findByTestId("infra-resource-row-11111111-1111-1111-1111-111111111111");

    const rowIds = screen
      .getAllByTestId(/^infra-resource-row-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/)
      .map((row) => row.getAttribute("data-testid")?.replace("infra-resource-row-", ""));

    expect(rowIds).toEqual([
      "11111111-1111-1111-1111-111111111111",
      "22222222-2222-2222-2222-222222222222",
    ]);

    const nameHeader = screen.getByRole("button", { name: "Sort by Name, ascending" });
    fireEvent.click(nameHeader);
    expect(replace).toHaveBeenCalledWith("/governance/infrastructure/resources?dir=desc");
    searchParams = new URLSearchParams("dir=desc");
    view.rerender(<ResourcesExplorerClient />);

    const reversedRowIds = screen
      .getAllByTestId(/^infra-resource-row-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/)
      .map((row) => row.getAttribute("data-testid")?.replace("infra-resource-row-", ""));

    expect(reversedRowIds).toEqual([
      "22222222-2222-2222-2222-222222222222",
      "11111111-1111-1111-1111-111111111111",
    ]);
    expect(screen.getByRole("button", { name: "Sort by Name, descending" })).toBeInTheDocument();
  });

  it("paginates beyond the first page and preserves page in the URL", async () => {
    vi.mocked(fetchCloudResourceExplorerPage).mockResolvedValueOnce({
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
          workCounts: null,
        },
      ],
      totalCount: 214,
      page: 1,
      pageSize: 50,
      hasMore: true,
    });
    searchParams = new URLSearchParams("");
    replace.mockClear();
    listOperatorSavedViews.mockResolvedValue([]);
    render(<ResourcesExplorerClient />);

    await screen.findByTestId("infra-resource-explorer-page-range");
    expect(screen.getByTestId("infra-resource-explorer-page-range")).toHaveTextContent("Showing 1–50 of 214");
    expect(screen.getByTestId("infra-resource-explorer-sort-page-local")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("infra-resource-explorer-page-next"));
    expect(replace).toHaveBeenCalledWith("/governance/infrastructure/resources?page=2");
  });
});
