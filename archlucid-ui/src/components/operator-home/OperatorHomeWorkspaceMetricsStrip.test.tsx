import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { OperatorHomeRunsDashboardModel } from "@/app/(operator)/_sections/operator-home-runs-dashboard-model";

import { OperatorHomeWorkspaceMetricsStrip } from "./OperatorHomeWorkspaceMetricsStrip";

const useFinishSetupReadinessContext = vi.fn();

vi.mock("@/hooks/use-finish-setup-readiness-context", () => ({
  useFinishSetupReadinessContext: () => useFinishSetupReadinessContext(),
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    className,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
    [key: string]: unknown;
  }) => (
    <a href={href} className={className} {...rest}>
      {children}
    </a>
  ),
}));

function buildRunsDashboard(): OperatorHomeRunsDashboardModel {
  return {
    projectId: "proj-1",
    totalCount: 1,
    items: [
      {
        runId: "run-1",
        displayTitle: "Enterprise platform",
        customerStatus: "in_progress",
        updatedAtUtc: "2026-01-15T12:00:00.000Z",
      },
    ],
  } as OperatorHomeRunsDashboardModel;
}

describe("OperatorHomeWorkspaceMetricsStrip", () => {
  it("renders counter-style metrics without resting underline affordance and a single bottom divider", () => {
    useFinishSetupReadinessContext.mockReturnValue({
      phase: "ready",
      readyCount: 2,
      totalCount: 3,
    });

    const runsDashboard = buildRunsDashboard();
    runsDashboard.items = [
      {
        runId: "run-committed",
        displayTitle: "Finalized platform",
        customerStatus: "approved",
        hasGoldenManifest: true,
        updatedAtUtc: "2026-01-10T12:00:00.000Z",
      },
      ...runsDashboard.items,
      {
        runId: "run-2",
        displayTitle: "Payments platform",
        customerStatus: "in_progress",
        updatedAtUtc: "2026-01-14T12:00:00.000Z",
      },
    ] as OperatorHomeRunsDashboardModel["items"];
    runsDashboard.totalCount = 3;

    render(<OperatorHomeWorkspaceMetricsStrip runsDashboard={runsDashboard} />);

    const activeReviewLink = screen.getByTestId("operator-home-metric-active-reviews");
    expect(activeReviewLink.className).toMatch(/no-underline/);
    expect(activeReviewLink).toHaveTextContent("2");
    expect(activeReviewLink).toHaveTextContent("Active reviews");

    const strip = screen.getByTestId("operator-home-workspace-metrics-strip");
    const row = strip.querySelector("div");
    expect(row?.className).toMatch(/border-b/);
    expect(row?.className).not.toMatch(/border-y/);
  });

  it("hides the active-review metric when a single in-progress review is surfaced in Your work", () => {
    useFinishSetupReadinessContext.mockReturnValue({
      phase: "ready",
      readyCount: 2,
      totalCount: 3,
    });

    const runsDashboard = buildRunsDashboard();
    runsDashboard.items = [
      {
        runId: "run-committed",
        displayTitle: "Finalized platform",
        customerStatus: "approved",
        hasGoldenManifest: true,
        updatedAtUtc: "2026-01-10T12:00:00.000Z",
      },
      ...runsDashboard.items,
    ] as OperatorHomeRunsDashboardModel["items"];
    runsDashboard.totalCount = 2;

    render(<OperatorHomeWorkspaceMetricsStrip runsDashboard={runsDashboard} />);

    expect(screen.queryByTestId("operator-home-metric-active-reviews")).toBeNull();
    expect(screen.getByTestId("operator-home-metric-open-findings")).toBeInTheDocument();
    expect(screen.getByTestId("operator-home-metric-open-findings")).toHaveTextContent("0");
  });

  it("hides setup readiness in Working mode", () => {
    useFinishSetupReadinessContext.mockReturnValue({
      phase: "ready",
      readyCount: 2,
      totalCount: 3,
    });

    const runsDashboard = buildRunsDashboard();
    runsDashboard.items = [
      {
        runId: "run-committed",
        displayTitle: "Finalized platform",
        customerStatus: "approved",
        hasGoldenManifest: true,
        updatedAtUtc: "2026-01-10T12:00:00.000Z",
      },
      ...runsDashboard.items,
      {
        runId: "run-2",
        displayTitle: "Payments platform",
        customerStatus: "in_progress",
        updatedAtUtc: "2026-01-14T12:00:00.000Z",
      },
    ] as OperatorHomeRunsDashboardModel["items"];
    runsDashboard.totalCount = 3;

    render(<OperatorHomeWorkspaceMetricsStrip runsDashboard={runsDashboard} workingMode />);

    expect(screen.queryByTestId("operator-home-metric-setup-readiness")).toBeNull();
    expect(screen.getByTestId("operator-home-metric-active-reviews")).toBeInTheDocument();
  });
});
