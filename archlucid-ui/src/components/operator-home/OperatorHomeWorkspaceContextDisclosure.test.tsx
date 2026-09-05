import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { operatorNavOutsideProviderPrincipal } from "@/lib/current-principal";

vi.mock("./OperatorHomeDeferredPanels", () => ({
  OperatorHomeDeltaPanel: () => <div data-testid="home-block-delta-panel" />,
  OperatorHomeWorkspaceStatusPanel: () => <div data-testid="home-block-workspace-status" />,
}));

vi.mock("@/hooks/use-finish-setup-readiness-context", () => ({
  useFinishSetupReadinessContext: () => ({
    phase: "ready",
    context: {
      healthReady: true,
      healthLoadFailed: false,
      principalAdmin: true,
    },
    readyCount: 2,
    totalCount: 4,
  }),
}));

vi.mock("@/components/operator/OperatorNavAuthorityProvider", () => ({
  useNavCommittedArchitectureReview: vi.fn(() => true),
  useOperatorNavAuthority: () => ({
    currentPrincipal: {
      ...operatorNavOutsideProviderPrincipal,
      authorityRank: 3,
      hasCommittedArchitectureReview: true,
    },
    callerAuthorityRank: 3,
    isAuthorityLoading: false,
  }),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({ replace: vi.fn() }),
}));

import type { OperatorHomeRunsDashboardModel } from "@/app/(operator)/_sections/operator-home-runs-dashboard-model";
import { OPERATOR_HOME_WORKSPACE_METRICS_EMPTY_COPY } from "@/lib/operator/operator-home-workspace-metrics";

import { OperatorHomeWorkspaceContextDisclosure } from "./OperatorHomeWorkspaceContextDisclosure";

import { useNavCommittedArchitectureReview } from "@/components/operator/OperatorNavAuthorityProvider";

const emptyRunsDashboard: OperatorHomeRunsDashboardModel = {
  projectId: "default",
  page: 1,
  pageSize: 5,
  items: [],
  totalCount: 0,
  loadFailure: null,
  malformedMessage: null,
  usedStaticRunsFallback: false,
  buyerPolishedShell: false,
};

const loadedRunsDashboard: OperatorHomeRunsDashboardModel = {
  ...emptyRunsDashboard,
  totalCount: 2,
  items: [
    {
      runId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      projectId: "default",
      createdUtc: "2026-01-01T00:00:00Z",
      hasGoldenManifest: true,
      findingCount: 4,
      hasGovernanceWarnings: true,
      hasContextSnapshot: true,
    },
    {
      runId: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
      projectId: "default",
      createdUtc: "2026-01-02T00:00:00Z",
      hasFindingsSnapshot: true,
      findingCount: 2,
      hasGraphSnapshot: true,
    },
  ],
};

describe("OperatorHomeWorkspaceContextDisclosure", () => {
  it("does not render before the first committed architecture review", () => {
    vi.mocked(useNavCommittedArchitectureReview).mockReturnValue(false);

    render(<OperatorHomeWorkspaceContextDisclosure showWorkspaceStatus runsDashboard={emptyRunsDashboard} />);

    expect(screen.queryByTestId("operator-home-workspace-context")).not.toBeInTheDocument();
  });

  it("suppresses zero KPI theater on empty workspace (TB-1037)", () => {
    vi.mocked(useNavCommittedArchitectureReview).mockReturnValue(true);

    render(<OperatorHomeWorkspaceContextDisclosure showWorkspaceStatus runsDashboard={emptyRunsDashboard} />);

    expect(screen.getByRole("heading", { level: 2, name: "Workspace metrics and status" })).toBeInTheDocument();
    expect(screen.getByTestId("operator-home-workspace-metrics-summary")).toBeInTheDocument();
    expect(screen.getByText(OPERATOR_HOME_WORKSPACE_METRICS_EMPTY_COPY)).toBeInTheDocument();
    expect(screen.queryByText("Reviews")).not.toBeInTheDocument();
    expect(screen.queryByText("Open findings")).not.toBeInTheDocument();
    expect(screen.queryByText("Governance warnings")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Expand Workspace metrics and status" })).not.toBeInTheDocument();
    expect(screen.queryByTestId("home-block-delta-panel")).not.toBeInTheDocument();
  });

  it("expands details to reveal secondary metrics, delta, and workspace status panels", async () => {
    vi.mocked(useNavCommittedArchitectureReview).mockReturnValue(true);

    render(<OperatorHomeWorkspaceContextDisclosure showWorkspaceStatus runsDashboard={loadedRunsDashboard} />);

    fireEvent.click(screen.getByRole("button", { name: "Expand Workspace metrics and status" }));

    await waitFor(() => {
      expect(screen.getByTestId("operator-home-workspace-metrics-secondary")).toBeInTheDocument();
      expect(screen.getByText("Evidence sources")).toBeInTheDocument();
      expect(screen.getByTestId("home-block-delta-panel")).toBeInTheDocument();
      expect(screen.getByTestId("home-block-workspace-status")).toBeInTheDocument();
    });

    expect(screen.getByRole("button", { name: "Collapse Workspace metrics and status" })).toHaveAttribute("aria-expanded", "true");
  });

  it("renders loaded workspace metrics when reviews exist", () => {
    vi.mocked(useNavCommittedArchitectureReview).mockReturnValue(true);

    render(<OperatorHomeWorkspaceContextDisclosure showWorkspaceStatus={false} runsDashboard={loadedRunsDashboard} />);

    const summary = screen.getByTestId("operator-home-workspace-metrics-summary");

    expect(within(summary).getByText("2 (1 finalized · 1 active)")).toBeInTheDocument();
    expect(within(summary).getByText("6")).toBeInTheDocument();
    expect(within(summary).getByText("2 of 4 ready")).toBeInTheDocument();
    expect(within(summary).getByRole("link", { name: "2 of 4 ready" })).toHaveAttribute(
      "href",
      "/architecture/first-review-guide#onboarding-optional-setup-heading",
    );
    expect(screen.queryByText(OPERATOR_HOME_WORKSPACE_METRICS_EMPTY_COPY)).not.toBeInTheDocument();
  });
});