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

    render(<OperatorHomeWorkspaceMetricsStrip runsDashboard={buildRunsDashboard()} />);

    const activeReviewLink = screen.getByTestId("operator-home-metric-active-reviews");
    expect(activeReviewLink.className).toMatch(/no-underline/);
    expect(activeReviewLink).toHaveTextContent("1");
    expect(activeReviewLink).toHaveTextContent("Active review");

    const strip = screen.getByTestId("operator-home-workspace-metrics-strip");
    const row = strip.querySelector("div");
    expect(row?.className).toMatch(/border-b/);
    expect(row?.className).not.toMatch(/border-y/);
  });

  it("hides setup readiness in Working mode", () => {
    useFinishSetupReadinessContext.mockReturnValue({
      phase: "ready",
      readyCount: 2,
      totalCount: 3,
    });

    render(<OperatorHomeWorkspaceMetricsStrip runsDashboard={buildRunsDashboard()} workingMode />);

    expect(screen.queryByTestId("operator-home-metric-setup-readiness")).toBeNull();
    expect(screen.getByTestId("operator-home-metric-active-reviews")).toBeInTheDocument();
  });
});
