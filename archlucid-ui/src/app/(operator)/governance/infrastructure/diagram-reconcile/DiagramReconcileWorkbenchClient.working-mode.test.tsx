import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

let searchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  usePathname: () => "/infrastructure/diagram-reconcile",
  useSearchParams: () => searchParams,
}));

vi.mock("@/hooks/useProductionDeskChrome", () => ({
  useProductionEvalChrome: (): boolean => false,
  useProductionDeskChrome: (): boolean => true,
}));

vi.mock("@/hooks/use-infra-evidence-resource-hub-audit-lineage", () => ({
  useInfraEvidenceResourceHubAuditLineage: () => ({ hub: null, loading: false, loadError: null }),
}));

vi.mock("@/hooks/use-run-summary-query", () => ({
  useRunSummaryQuery: () => ({
    data: undefined,
    isLoading: false,
    isFetching: false,
    failure: null,
    blockedReason: null,
  }),
}));

vi.mock("@/lib/infra-evidence/infra-evidence-drift-api", () => ({
  fetchInfraEvidenceSnapshots: vi.fn(async () => ({ items: [], totalCount: 0, page: 1, pageSize: 50, hasMore: false })),
  formatInfraEvidenceApiError: (error: unknown) => String(error),
}));

vi.mock("@/components/usability/PageContextualHelpButton", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/components/usability/PageContextualHelpButton")>();

  return {
    ...actual,
    PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
  };
});

import {
  GOVERNANCE_INFRASTRUCTURE_DIAGRAM_RECONCILE_CLAIM_DISCIPLINE,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAM_RECONCILE_PRIMARY_CONTENT_ID,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAM_RECONCILE_RESOURCE_SCOPE_LABEL,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAM_RECONCILE_SKIP_LINK_LABEL,
} from "@/lib/governance/governance-infrastructure-copy";
import { DiagramReconcileWorkbenchClient } from "./DiagramReconcileWorkbenchClient";

describe("DiagramReconcileWorkbenchClient working mode", () => {
  beforeEach(() => {
    searchParams = new URLSearchParams();
  });

  it("renders skip link, claim discipline, breadcrumb, and scope status", () => {
    render(<DiagramReconcileWorkbenchClient />);

    expect(screen.getByRole("link", { name: GOVERNANCE_INFRASTRUCTURE_DIAGRAM_RECONCILE_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${GOVERNANCE_INFRASTRUCTURE_DIAGRAM_RECONCILE_PRIMARY_CONTENT_ID}`,
    );
    expect(screen.getByTestId("infra-diagram-reconcile-claim-discipline")).toHaveTextContent(
      GOVERNANCE_INFRASTRUCTURE_DIAGRAM_RECONCILE_CLAIM_DISCIPLINE,
    );
    expect(screen.getByTestId("infra-diagram-reconcile-scope-status")).toHaveTextContent(
      GOVERNANCE_INFRASTRUCTURE_DIAGRAM_RECONCILE_RESOURCE_SCOPE_LABEL,
    );
    expect(screen.getByTestId("infra-diagram-reconcile-page-shortcuts")).toBeInTheDocument();
    expect(screen.getByTestId("infra-diagram-reconcile-step-1-status")).toBeInTheDocument();
  });
});
