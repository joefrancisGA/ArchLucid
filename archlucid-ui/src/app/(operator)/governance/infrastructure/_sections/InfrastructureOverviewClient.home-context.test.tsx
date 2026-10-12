import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const productLineState = vi.hoisted(() => ({
  current: "security" as "security" | "architecture",
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/components/product-line/ProductLineProvider", () => ({
  useProductLine: () => ({ productLine: productLineState.current }),
}));

vi.mock("@/hooks/useProductionDeskChrome", () => ({
  useProductionEvalChrome: (): boolean => false,
  useProductionDeskChrome: (): boolean => true,
}));

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
}));

vi.mock("@/hooks/use-operator-scope-query-key", () => ({
  useOperatorScopeQueryKey: () => ({
    tenantId: "tenant-1",
    workspaceId: "ws-1",
    projectId: "prj-1",
  }),
}));

vi.mock("@/hooks/use-tenant-workspaces-list-query", () => ({
  useTenantWorkspacesListQuery: () => ({
    data: { workspaces: [] },
    isPending: false,
    isError: false,
  }),
}));

vi.mock("@/hooks/use-assigned-to-me-findings-count-query", () => ({
  useAssignedToMeFindingsCountQuery: () => ({
    data: 1,
    isPending: false,
    isError: false,
    error: null,
  }),
}));

const api = vi.hoisted(() => ({
  fetchInfraEvidenceSnapshots: vi.fn(),
  fetchInfraEvidenceDiffsForSnapshot: vi.fn(),
  fetchRemediationFactorySummary: vi.fn(),
}));

vi.mock("@/lib/infra-evidence/infra-evidence-drift-api", () => ({
  fetchInfraEvidenceSnapshots: api.fetchInfraEvidenceSnapshots,
  fetchInfraEvidenceDiffsForSnapshot: api.fetchInfraEvidenceDiffsForSnapshot,
}));

vi.mock("@/lib/infra-evidence/infra-evidence-remediation-api", () => ({
  fetchRemediationFactorySummary: api.fetchRemediationFactorySummary,
}));

import { InfrastructureOverviewClient } from "./InfrastructureOverviewClient";

function renderOverview(): void {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  render(
    <QueryClientProvider client={queryClient}>
      <InfrastructureOverviewClient secureNowHome={productLineState.current === "security"} />
    </QueryClientProvider>,
  );
}

describe("Infrastructure overview home context", () => {
  it("keeps the Findings heading when the snapshot list fails", async () => {
    productLineState.current = "security";
    api.fetchInfraEvidenceSnapshots.mockRejectedValue(new Error("Snapshot list unavailable"));
    api.fetchRemediationFactorySummary.mockResolvedValue({
      factoryMetrics: {
        openFindings: 0,
        criticalExposureCount: 0,
        remediatedThisWeek: 0,
        verificationFailureCount: 0,
        businessBlockedCount: 0,
      },
      openInstancesByStatus: { ChangeImplemented: 0 },
      waves: [],
    });
    renderOverview();

    expect(await screen.findByText("Snapshot list unavailable")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Findings" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Your work" })).toBeInTheDocument();
  });

  it("does not render the environment line or Your work on Architecture home", () => {
    productLineState.current = "architecture";
    renderOverview();

    expect(screen.queryByTestId("securenow-home-environment-context")).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Your work" })).not.toBeInTheDocument();
    expect(screen.getByText(/All seven destinations are available from this hub/i)).toBeInTheDocument();

    const workbenchHeader = screen.getByRole("columnheader", { name: "Workbench" });

    expect(workbenchHeader).toBeVisible();
    expect(workbenchHeader).not.toHaveClass("sr-only");
  });
});
