import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

import {
  GOVERNANCE_INFRASTRUCTURE_DRIFT_CLAIM_DISCIPLINE,
  GOVERNANCE_INFRASTRUCTURE_DRIFT_PRIMARY_CONTENT_ID,
  GOVERNANCE_INFRASTRUCTURE_DRIFT_SKIP_LINK_LABEL,
} from "@/lib/governance/governance-infrastructure-copy";
import { DriftWorkbenchClient } from "./DriftWorkbenchClient";

let searchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  usePathname: () => "/infrastructure/drift",
  useSearchParams: () => searchParams,
}));

vi.mock("@/hooks/useProductionDeskChrome", () => ({
  useProductionEvalChrome: (): boolean => false,
  useProductionDeskChrome: (): boolean => true,
}));

vi.mock("@/hooks/use-infra-evidence-resource-hub-audit-lineage", () => ({
  useInfraEvidenceResourceHubAuditLineage: () => ({ hub: null, loading: false, loadError: null }),
}));

vi.mock("@/lib/infra-evidence/infra-evidence-drift-api", () => ({
  fetchInfraEvidenceSnapshots: vi.fn(async () => ({
    items: [],
    totalCount: 0,
    page: 1,
    pageSize: 50,
    hasMore: false,
  })),
  fetchInfraEvidenceDiffsForSnapshot: vi.fn(async () => []),
  fetchInfraEvidenceDiffChanges: vi.fn(async () => ({
    items: [],
    totalCount: 0,
    page: 1,
    pageSize: 100,
    hasMore: false,
  })),
  fetchInfraEvidenceSnapshotInventoryRows: vi.fn(async () => ({
    items: [],
    totalCount: 0,
    page: 1,
    pageSize: 100,
    hasMore: false,
  })),
  downloadInfraEvidenceTerraformAdvisoryZip: vi.fn(async () => undefined),
  formatInfraEvidenceApiError: (error: unknown) => String(error),
}));

vi.mock("@/components/usability/PageContextualHelpButton", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/components/usability/PageContextualHelpButton")>();

  return {
    ...actual,
    PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
  };
});

describe("DriftWorkbenchClient working mode", () => {
  beforeEach(() => {
    searchParams = new URLSearchParams();
    window.localStorage.clear();
  });

  it("renders skip link, claim discipline, scope status, shortcuts, and breadcrumb above title", () => {
    render(<DriftWorkbenchClient />);

    expect(screen.getByRole("link", { name: GOVERNANCE_INFRASTRUCTURE_DRIFT_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${GOVERNANCE_INFRASTRUCTURE_DRIFT_PRIMARY_CONTENT_ID}`,
    );
    expect(screen.getByTestId("infra-drift-claim-discipline")).toHaveTextContent(
      GOVERNANCE_INFRASTRUCTURE_DRIFT_CLAIM_DISCIPLINE,
    );
    expect(screen.getByTestId("infra-drift-scope-status")).toHaveTextContent("Not scoped");
    expect(screen.getByTestId("infra-drift-page-shortcuts")).toBeInTheDocument();
    expect(screen.getByTestId("infra-drift-page-shortcuts-entry-arrowdown-snapshots")).toBeInTheDocument();
    expect(screen.getByTestId("infra-drift-breadcrumb")).toBeInTheDocument();
    expect(screen.queryByText("ADVANCED OPERATIONS")).not.toBeInTheDocument();
  });
});
