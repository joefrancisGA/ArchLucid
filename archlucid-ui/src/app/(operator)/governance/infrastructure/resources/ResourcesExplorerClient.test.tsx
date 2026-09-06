import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ResourcesExplorerClient } from "@/app/(operator)/governance/infrastructure/resources/ResourcesExplorerClient";

const replace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
  usePathname: () => "/governance/infrastructure/resources",
  useSearchParams: () => new URLSearchParams(""),
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
    render(<ResourcesExplorerClient />);

    expect(screen.getByTestId("infra-resource-explorer-name-prefix")).toBeInTheDocument();
    expect(await screen.findByTestId("infra-resource-row-11111111-1111-1111-1111-111111111111")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "gateway-pip" })).toHaveAttribute(
      "href",
      "/governance/infrastructure/resources/11111111-1111-1111-1111-111111111111",
    );
  });
});
