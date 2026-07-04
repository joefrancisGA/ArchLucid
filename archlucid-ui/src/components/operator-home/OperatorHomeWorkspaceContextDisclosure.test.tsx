import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

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

import type { OperatorHomeRunsDashboardModel } from "@/app/(operator)/_sections/operator-home-runs-dashboard-model";
import { OPERATOR_HOME_WORKSPACE_METRICS_EMPTY_COPY } from "@/lib/operator-home-workspace-metrics";

import { OperatorHomeWorkspaceContextDisclosure } from "./OperatorHomeWorkspaceContextDisclosure";

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
  it("renders compact workspace metrics summary by default with details collapsed", () => {
    render(<OperatorHomeWorkspaceContextDisclosure showWorkspaceStatus runsDashboard={emptyRunsDashboard} />);

    expect(screen.getByRole("heading", { level: 2, name: "Workspace metrics and status" })).toBeInTheDocument();
    expect(screen.getByTestId("operator-home-workspace-metrics-summary")).toBeInTheDocument();
    expect(screen.getByText("Review packages")).toBeInTheDocument();
    expect(screen.getByText("Open findings")).toBeInTheDocument();
    expect(screen.getByText("Governance warnings")).toBeInTheDocument();
    expect(screen.getByText("Evidence sources")).toBeInTheDocument();
    expect(screen.getByText("Setup readiness")).toBeInTheDocument();
    expect(screen.getByText("2 of 4 ready")).toBeInTheDocument();
    expect(screen.getByText(OPERATOR_HOME_WORKSPACE_METRICS_EMPTY_COPY)).toBeInTheDocument();

    const detailsToggle = screen.getByRole("button", { name: "View details" });

    expect(detailsToggle).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByTestId("home-block-delta-panel")).not.toBeInTheDocument();
    expect(screen.queryByTestId("home-block-workspace-status")).not.toBeInTheDocument();
  });

  it("expands details to reveal delta and workspace status panels", async () => {
    render(<OperatorHomeWorkspaceContextDisclosure showWorkspaceStatus runsDashboard={emptyRunsDashboard} />);

    fireEvent.click(screen.getByRole("button", { name: "View details" }));

    await waitFor(() => {
      expect(screen.getByTestId("home-block-delta-panel")).toBeInTheDocument();
      expect(screen.getByTestId("home-block-workspace-status")).toBeInTheDocument();
    });

    expect(screen.getByRole("button", { name: "Hide metrics details" })).toHaveAttribute("aria-expanded", "true");
  });

  it("renders loaded workspace metrics when review packages exist", () => {
    render(<OperatorHomeWorkspaceContextDisclosure showWorkspaceStatus={false} runsDashboard={loadedRunsDashboard} />);

    const summary = screen.getByTestId("operator-home-workspace-metrics-summary");

    expect(within(summary).getByText("2 (1 committed · 1 active)")).toBeInTheDocument();
    expect(within(summary).getByText("6")).toBeInTheDocument();
    expect(within(summary).getByText("2 of 4 ready")).toBeInTheDocument();
    expect(screen.queryByText(OPERATOR_HOME_WORKSPACE_METRICS_EMPTY_COPY)).not.toBeInTheDocument();
  });
});
