import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  usePathname: () =>
    "/infrastructure/resources/11111111-1111-1111-1111-111111111111",
  useSearchParams: () => new URLSearchParams("tab=overview"),
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
}));

vi.mock("@/hooks/useProductionDeskChrome", () => ({
  useProductionEvalChrome: (): boolean => false,
  useProductionDeskChrome: (): boolean => true,
}));

vi.mock("@/components/product-line/ProductLineProvider", () => ({
  useProductLine: () => ({ productLine: "security" }),
}));

vi.mock("@/lib/infra-evidence/infra-evidence-resource-hub-cache", () => ({
  fetchCachedInfraEvidenceResourceHub: vi.fn(async () => ({
    cloudResourceId: "11111111-1111-1111-1111-111111111111",
    externalResourceId: "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/publicIPAddresses/gw",
    resourceType: "Microsoft.Network/publicIPAddresses",
    currentConfiguration: null,
    terraformAddress: null,
    terraformGenerationMethod: null,
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
    remediationInstances: { items: [], totalCount: 0, page: 1, pageSize: 25, hasMore: false },
    rbacAssignments: [],
    networkRelationships: [],
    recentChanges: [],
    auditLineageLink: {
      available: false,
      degradedReason: "No audit rows",
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

import { ResourceHubClient } from "./ResourceHubClient";

describe("ResourceHubClient SecureNow infrastructure (ICL)", () => {
  it("renders infrastructure wayfinding and skip-target main", async () => {
    render(<ResourceHubClient cloudResourceId="11111111-1111-1111-1111-111111111111" />);

    expect(await screen.findByTestId("infrastructure-resource-hub-wayfinding")).toHaveTextContent(
      "Resource explorer",
    );
    expect(screen.getByTestId("infra-resource-hub-primary-content")).toHaveAttribute("tabIndex", "-1");
    expect(screen.getByRole("link", { name: "Resource explorer" })).toHaveAttribute(
      "href",
      "/infrastructure/resources",
    );
  });
});