import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

let searchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  usePathname: () => "/infrastructure/resources",
  useSearchParams: () => searchParams,
}));

vi.mock("@/components/product-line/ProductLineProvider", () => ({
  useProductLine: () => ({ productLine: "security" }),
}));

vi.mock("@/hooks/useProductionDeskChrome", () => ({
  useProductionEvalChrome: (): boolean => false,
  useProductionDeskChrome: (): boolean => true,
}));

vi.mock("@/lib/infra-evidence/infra-evidence-drift-api", () => ({
  fetchInfraEvidenceSnapshots: vi.fn(async () => ({
    items: [],
    totalCount: 0,
    page: 1,
    pageSize: 20,
    hasMore: false,
  })),
}));

vi.mock("@/lib/infra-evidence/infra-evidence-hub-api", () => ({
  fetchCloudResourceExplorerPage: vi.fn(async () => ({
    items: [],
    totalCount: 0,
    page: 1,
    pageSize: 25,
    hasMore: false,
  })),
  formatInfraEvidenceHubApiError: (error: unknown) => String(error),
}));

vi.mock("@/components/usability/PageContextualHelpButton", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/components/usability/PageContextualHelpButton")>();

  return {
    ...actual,
    PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
  };
});

import {
  GOVERNANCE_INFRASTRUCTURE_RESOURCES_CLAIM_DISCIPLINE,
  GOVERNANCE_INFRASTRUCTURE_RESOURCES_PRIMARY_CONTENT_ID,
  GOVERNANCE_INFRASTRUCTURE_RESOURCES_SKIP_LINK_LABEL,
} from "@/lib/governance/governance-infrastructure-copy";
import { ResourcesExplorerClient } from "./ResourcesExplorerClient";

describe("ResourcesExplorerClient working mode", () => {
  beforeEach(() => {
    searchParams = new URLSearchParams();
  });

  it("renders skip link, claim discipline, breadcrumb, and scope status", async () => {
    render(<ResourcesExplorerClient />);

    expect(screen.getByRole("link", { name: GOVERNANCE_INFRASTRUCTURE_RESOURCES_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${GOVERNANCE_INFRASTRUCTURE_RESOURCES_PRIMARY_CONTENT_ID}`,
    );
    expect(screen.getByTestId("infra-resource-explorer-claim-discipline")).toHaveTextContent(
      GOVERNANCE_INFRASTRUCTURE_RESOURCES_CLAIM_DISCIPLINE,
    );
    expect(screen.queryByTestId("infra-resource-explorer-breadcrumb")).not.toBeInTheDocument();
    expect(screen.getByTestId("infra-resource-explorer-scope-status")).toBeInTheDocument();
    expect(await screen.findByTestId("infra-resource-explorer-empty-state")).toBeInTheDocument();
  });
});
