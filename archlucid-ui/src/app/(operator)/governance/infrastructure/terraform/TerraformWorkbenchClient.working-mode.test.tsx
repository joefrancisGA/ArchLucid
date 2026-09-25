import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

let searchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  usePathname: () => "/infrastructure/terraform",
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
  downloadInfraEvidenceTerraformAdvisoryZip: vi.fn(async () => undefined),
}));

vi.mock("@/lib/infra-evidence/infra-evidence-resource-hub-cache", () => ({
  fetchCachedInfraEvidenceResourceHub: vi.fn(async () => ({
    cloudResourceId: "11111111-1111-1111-1111-111111111111",
    externalResourceId: "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/publicIPAddresses/gw",
    terraformAddress: null,
    terraformGenerationMethod: null,
    currentConfiguration: null,
    auditLineageLink: {
      available: false,
      degradedReason: null,
      relativePath: null,
      assessmentId: null,
      auditEvidenceSnapshotId: null,
      controlId: null,
      controlNumber: null,
      controlTitle: null,
      matches: [],
    },
    operationalSecurityFindings: { items: [], totalCount: 0, page: 1, pageSize: 25, hasMore: false, streamKind: "", streamLabel: "" },
    architectureReviewFindings: { items: [], totalCount: 0, page: 1, pageSize: 25, hasMore: false, streamKind: "", streamLabel: "" },
    remediationInstances: { items: [], totalCount: 0, page: 1, pageSize: 25, hasMore: false },
    recentChanges: [],
    evidencePointers: [],
    diagramCorrespondence: null,
    rbacAssignments: [],
    networkRelationships: [],
  })),
}));

vi.mock("@/lib/infra-evidence/infra-evidence-hub-api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/infra-evidence/infra-evidence-hub-api")>();

  return {
    ...actual,
    fetchCloudResourceExplorerPage: vi.fn(async () => ({
      items: [
        {
          cloudResourceId: "11111111-1111-1111-1111-111111111111",
          externalResourceId: "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/publicIPAddresses/gw",
          displayName: "gateway-ip",
          resourceType: "Microsoft.Network/publicIPAddresses",
          resourceGroup: "rg",
          region: "eastus",
          lastSeenUtc: "2026-09-01T12:00:00Z",
          workCounts: null,
        },
      ],
      totalCount: 1,
      page: 1,
      pageSize: 8,
      hasMore: false,
    })),
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
  GOVERNANCE_INFRASTRUCTURE_OVERVIEW_PAGE_TITLE,
  GOVERNANCE_INFRASTRUCTURE_TERRAFORM_PRIMARY_CONTENT_ID,
  GOVERNANCE_INFRASTRUCTURE_TERRAFORM_SKIP_LINK_LABEL,
  GOVERNANCE_INFRASTRUCTURE_TERRAFORM_UNSCOPED_ANNOUNCEMENT,
  GOVERNANCE_INFRASTRUCTURE_TERRAFORM_UNSCOPED_DRIFT_ACTION,
  GOVERNANCE_INFRASTRUCTURE_TERRAFORM_UNSCOPED_RESOURCES_ACTION,
} from "@/lib/governance/governance-infrastructure-copy";
import { GOVERNANCE_INFRASTRUCTURE_PATH } from "@/lib/governance/governance-infrastructure-route-paths";
import { SECURENOW_INFRASTRUCTURE_DRIFT_PATH, SECURENOW_INFRASTRUCTURE_RESOURCES_PATH } from "@/lib/governance/governance-infrastructure-route-paths";
import { OPERATOR_RECENT_VIEWS_STORAGE_KEY } from "@/lib/operator/operator-recent-views";
import { TerraformWorkbenchClient } from "./TerraformWorkbenchClient";

describe("TerraformWorkbenchClient working mode", () => {
  beforeEach(() => {
    searchParams = new URLSearchParams();
    window.localStorage.clear();
  });

  it("renders skip link, scope picker, handoff links, and unscoped announcement", () => {
    render(<TerraformWorkbenchClient />);

    expect(screen.getByRole("link", { name: GOVERNANCE_INFRASTRUCTURE_TERRAFORM_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${GOVERNANCE_INFRASTRUCTURE_TERRAFORM_PRIMARY_CONTENT_ID}`,
    );
    expect(screen.getByTestId("infra-terraform-primary-content")).toHaveAttribute(
      "id",
      GOVERNANCE_INFRASTRUCTURE_TERRAFORM_PRIMARY_CONTENT_ID,
    );
    expect(screen.getByTestId("infra-terraform-claim-discipline")).toBeInTheDocument();
    expect(screen.getByTestId("infra-terraform-unscoped-panel")).toBeInTheDocument();
    expect(screen.getByTestId("infra-terraform-scope-picker")).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Cloud resource" })).toBeInTheDocument();
    expect(screen.getByTestId("infra-terraform-scope-status")).toHaveTextContent("Not scoped");
    expect(screen.getByTestId("infra-terraform-selection-announcer")).toHaveTextContent(
      GOVERNANCE_INFRASTRUCTURE_TERRAFORM_UNSCOPED_ANNOUNCEMENT,
    );
    expect(screen.queryByTestId("infra-terraform-breadcrumb")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: GOVERNANCE_INFRASTRUCTURE_OVERVIEW_PAGE_TITLE })).toHaveAttribute(
      "href",
      GOVERNANCE_INFRASTRUCTURE_PATH,
    );
    expect(screen.queryByText("ADVANCED OPERATIONS")).not.toBeInTheDocument();
    expect(screen.getByText("Alt+1")).toBeInTheDocument();

    expect(screen.getByRole("link", { name: GOVERNANCE_INFRASTRUCTURE_TERRAFORM_UNSCOPED_RESOURCES_ACTION })).toHaveAttribute(
      "href",
      SECURENOW_INFRASTRUCTURE_RESOURCES_PATH,
    );
    expect(screen.getByRole("link", { name: GOVERNANCE_INFRASTRUCTURE_TERRAFORM_UNSCOPED_DRIFT_ACTION })).toHaveAttribute(
      "href",
      SECURENOW_INFRASTRUCTURE_DRIFT_PATH,
    );
  });

  it("shows continue last viewed row with preserved audit scope ids", () => {
    window.localStorage.setItem(
      OPERATOR_RECENT_VIEWS_STORAGE_KEY,
      JSON.stringify({
        schemaVersion: 2,
        entries: [
          {
            href:
              "/infrastructure/terraform?cloudResourceId=11111111-1111-1111-1111-111111111111&snapshotId=22222222-2222-2222-2222-222222222222&assessmentId=33333333-3333-3333-3333-333333333333&auditEvidenceSnapshotId=44444444-4444-4444-4444-444444444444&controlId=55555555-5555-5555-5555-555555555555",
            label: "gateway-ip",
            kind: "page",
            visitedAtUtc: "2026-09-20T12:00:00Z",
          },
        ],
      }),
    );

    render(<TerraformWorkbenchClient />);

    expect(screen.getByTestId("infra-terraform-continue-last-row")).toBeInTheDocument();
    const continueHref = screen.getByTestId("infra-terraform-continue-last-open").getAttribute("href") ?? "";
    const continueParams = new URLSearchParams(continueHref.split("?")[1] ?? "");

    expect(continueHref.startsWith("/infrastructure/terraform?")).toBe(true);
    expect(continueParams.get("cloudResourceId")).toBe("11111111-1111-1111-1111-111111111111");
    expect(continueParams.get("snapshotId")).toBe("22222222-2222-2222-2222-222222222222");
    expect(continueParams.get("assessmentId")).toBe("33333333-3333-3333-3333-333333333333");
    expect(continueParams.get("auditEvidenceSnapshotId")).toBe("44444444-4444-4444-4444-444444444444");
    expect(continueParams.get("controlId")).toBe("55555555-5555-5555-5555-555555555555");
    expect(screen.getByText(/Snapshot 22222222/)).toBeInTheDocument();
  });

  it("focuses scope picker on Alt+1", () => {
    render(<TerraformWorkbenchClient />);

    const picker = screen.getByRole("combobox", { name: "Cloud resource" });

    window.dispatchEvent(
      new KeyboardEvent("keydown", { key: "1", altKey: true, bubbles: true, cancelable: true }),
    );

    expect(picker).toHaveFocus();
  });
});
