import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { OperatorHomeWorkspaceMetricsSummary } from "@/components/operator-home/OperatorHomeWorkspaceMetricsSummary";
import type { OperatorHomeRunsDashboardModel } from "@/app/(operator)/_sections/operator-home-runs-dashboard-model";
import { OPERATOR_HOME_SETUP_READINESS_HREF } from "@/lib/operator/operator-home-metric-hrefs";
import type { RunSummary } from "@/types/authority";
import { within } from "@testing-library/react";

function buildModel(items: RunSummary[]): OperatorHomeRunsDashboardModel {
  return {
    projectId: "default",
    page: 1,
    pageSize: 5,
    items,
    totalCount: items.length,
    loadFailure: null,
    malformedMessage: null,
    usedStaticRunsFallback: false,
    buyerPolishedShell: true,
  };
}

describe("OperatorHomeWorkspaceMetricsSummary", () => {
  it("renders hero-inline KPI strip when the workspace has reviews", () => {
    const run: RunSummary = {
      runId: "run-001",
      projectId: "default",
      createdUtc: "2026-01-15T12:00:00.000Z",
      hasFindingsSnapshot: true,
      hasGoldenManifest: true,
      hasGovernanceWarnings: true,
      findingCount: 2,
    };

    render(
      <OperatorHomeWorkspaceMetricsSummary
        runsDashboard={buildModel([run])}
        setupReadyCount={4}
        setupTotalCount={4}
        setupReadinessLoading={false}
        variant="hero-inline"
      />,
    );

    expect(screen.getByTestId("operator-home-hero-kpi-strip")).toBeInTheDocument();

    const strip = screen.getByTestId("operator-home-hero-kpi-strip");
    const links = within(strip).getAllByRole("link");

    expect(links.some((link) => link.getAttribute("href") === "/architecture/reviews")).toBe(true);
    expect(links.some((link) => link.getAttribute("href") === "/governance/findings?filter=open")).toBe(
      true,
    );
    expect(links.some((link) => link.getAttribute("href") === "/?warnings=1")).toBe(true);
  });

  it("keeps empty-state copy off the hero strip before the first review", () => {
    render(
      <OperatorHomeWorkspaceMetricsSummary
        runsDashboard={buildModel([])}
        setupReadyCount={4}
        setupTotalCount={4}
        setupReadinessLoading={false}
        variant="hero-inline"
      />,
    );

    expect(screen.queryByTestId("operator-home-hero-kpi-strip")).toBeNull();
    expect(screen.getByTestId("operator-home-workspace-metrics-empty-copy")).toBeInTheDocument();
  });

  it("deep-links setup readiness in secondary metrics to optional workspace setup", () => {
    render(
      <OperatorHomeWorkspaceMetricsSummary
        runsDashboard={buildModel([])}
        setupReadyCount={1}
        setupTotalCount={3}
        setupReadinessLoading={false}
        variant="secondary"
      />,
    );

    expect(screen.getByRole("link", { name: "1 of 3 ready" })).toHaveAttribute(
      "href",
      OPERATOR_HOME_SETUP_READINESS_HREF,
    );
  });
});
