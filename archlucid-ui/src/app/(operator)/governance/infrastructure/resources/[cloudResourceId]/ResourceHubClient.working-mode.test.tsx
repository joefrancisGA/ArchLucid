import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

let searchParams = new URLSearchParams("tab=overview");

const matchOperationalFinding = vi.fn(async () => undefined);
const createRemediationInstance = vi.fn(async () => ({
  succeeded: true,
  instanceId: "new-instance-1",
  blockers: [] as string[],
  errorMessage: null as string | null,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  usePathname: () => "/governance/infrastructure/resources/11111111-1111-1111-1111-111111111111",
  useSearchParams: () => searchParams,
}));

vi.mock("@/hooks/useProductionDeskChrome", () => ({
  useProductionEvalChrome: (): boolean => false,
  useProductionDeskChrome: (): boolean => true,
}));

vi.mock("@/components/product-line/ProductLineProvider", () => ({
  useProductLine: () => ({ productLine: "archlucid" }),
}));

vi.mock("@/lib/infra-evidence/infra-evidence-remediation-api", () => ({
  matchOperationalFinding: (...args: unknown[]) => matchOperationalFinding(...args),
  createRemediationInstance: (...args: unknown[]) => createRemediationInstance(...args),
  formatInfraEvidenceRemediationApiError: (error: unknown) => String(error),
}));

vi.mock("@/lib/infra-evidence/infra-evidence-hub-api", () => ({
  formatInfraEvidenceHubApiError: (error: unknown) => String(error),
}));

vi.mock("@/lib/infra-evidence/infra-evidence-resource-hub-cache", () => ({
  fetchCachedInfraEvidenceResourceHub: vi.fn(async () => ({
    cloudResourceId: "11111111-1111-1111-1111-111111111111",
    externalResourceId:
      "/subscriptions/sub/resourceGroups/rg-net/providers/Microsoft.Network/publicIPAddresses/gateway",
    resourceType: "Microsoft.Network/publicIPAddresses",
    currentConfiguration: null,
    terraformAddress: null,
    terraformGenerationMethod: null,
    diagramCorrespondence: null,
    operationalSecurityFindings: {
      streamKind: "OperationalSecurity",
      streamLabel: "Operational security",
      items: [
        {
          id: "finding-1",
          title: "Public endpoint",
          severity: "High",
          status: "Open",
          streamKind: "OperationalSecurity",
          streamLabel: "Operational security",
        },
      ],
      totalCount: 1,
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

import {
  GOVERNANCE_INFRASTRUCTURE_RESOURCE_HUB_CLAIM_DISCIPLINE,
  GOVERNANCE_INFRASTRUCTURE_RESOURCE_HUB_PRIMARY_CONTENT_ID,
  GOVERNANCE_INFRASTRUCTURE_RESOURCE_HUB_SKIP_LINK_LABEL,
} from "@/lib/governance/governance-infrastructure-copy";
import { ResourceHubClient } from "./ResourceHubClient";

describe("ResourceHubClient working mode", () => {
  beforeEach(() => {
    matchOperationalFinding.mockClear();
    createRemediationInstance.mockClear();
  });

  it("renders skip link, claim discipline, breadcrumb, and orientation strip without LayerHeader", async () => {
    render(<ResourceHubClient cloudResourceId="11111111-1111-1111-1111-111111111111" />);

    await waitFor(() => {
      expect(screen.getByTestId("infra-resource-hub-primary-content")).toBeInTheDocument();
    });

    expect(screen.getByRole("link", { name: GOVERNANCE_INFRASTRUCTURE_RESOURCE_HUB_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${GOVERNANCE_INFRASTRUCTURE_RESOURCE_HUB_PRIMARY_CONTENT_ID}`,
    );
    expect(screen.getByTestId("infra-resource-hub-claim-discipline")).toHaveTextContent(
      GOVERNANCE_INFRASTRUCTURE_RESOURCE_HUB_CLAIM_DISCIPLINE,
    );
    expect(screen.getByTestId("infra-resource-hub-primary-content")).toHaveAttribute(
      "id",
      GOVERNANCE_INFRASTRUCTURE_RESOURCE_HUB_PRIMARY_CONTENT_ID,
    );
    expect(screen.getByTestId("governance-infrastructure-resource-hub-sources")).toBeInTheDocument();
    expect(screen.getByTestId("infra-resource-hub-page-title")).toBeInTheDocument();
  });

  it("renders inline identifier strip with copy buttons in working mode", async () => {
    render(<ResourceHubClient cloudResourceId="11111111-1111-1111-1111-111111111111" />);

    const strip = await screen.findByTestId("infra-resource-hub-identifier-strip");
    expect(strip).toBeInTheDocument();
    expect(screen.queryByTestId("infra-resource-hub-cloud-resource-id-disclosure")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Copy cloud resource id")).toBeInTheDocument();
    expect(screen.getByLabelText("Copy ARM resource path")).toBeInTheDocument();
  });

  it("does not call remediation API when confirm dialog is cancelled", async () => {
    searchParams = new URLSearchParams("tab=findings");
    render(<ResourceHubClient cloudResourceId="11111111-1111-1111-1111-111111111111" />);

    fireEvent.click(await screen.findByTestId("infra-resource-hub-create-remediation-finding-1"));
    fireEvent.click(await screen.findByRole("button", { name: "Cancel" }));

    expect(matchOperationalFinding).not.toHaveBeenCalled();
    expect(createRemediationInstance).not.toHaveBeenCalled();
  });
});
