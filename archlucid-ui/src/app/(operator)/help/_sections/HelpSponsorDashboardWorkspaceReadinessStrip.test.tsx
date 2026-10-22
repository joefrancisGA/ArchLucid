import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { HelpSponsorDashboardWorkspaceReadinessStrip } from "@/app/(operator)/help/_sections/HelpSponsorDashboardWorkspaceReadinessStrip";
import type { SponsorDashboardHelpWorkspaceReadinessSnapshot } from "@/lib/use-sponsor-dashboard-help-workspace-readiness";

function buildReadiness(
  overrides: Partial<SponsorDashboardHelpWorkspaceReadinessSnapshot> = {},
): SponsorDashboardHelpWorkspaceReadinessSnapshot {
  return {
    loading: false,
    baselineStatusLabel: "Baseline anchors set",
    baselineStatusKind: "ready",
    workspaceScopeLabel: "Claims Intake Demo",
    reload: () => undefined,
    ...overrides,
  };
}

describe("HelpSponsorDashboardWorkspaceReadinessStrip", () => {
  it("renders workspace scope and baseline status", () => {
    render(<HelpSponsorDashboardWorkspaceReadinessStrip readiness={buildReadiness()} />);

    expect(screen.getByTestId("help-sponsor-dashboard-workspace-readiness")).toBeInTheDocument();
    expect(screen.getByText("Claims Intake Demo")).toBeInTheDocument();
    expect(screen.getByTestId("help-sponsor-dashboard-workspace-readiness-status")).toHaveTextContent(
      "Baseline anchors set",
    );
  });

  it("shows loading status while baseline posture loads", () => {
    render(
      <HelpSponsorDashboardWorkspaceReadinessStrip
        readiness={buildReadiness({
          loading: true,
          baselineStatusLabel: "Loading",
          baselineStatusKind: "neutral",
          workspaceScopeLabel: null,
        })}
      />,
    );

    expect(screen.getByTestId("help-sponsor-dashboard-workspace-readiness")).toHaveAttribute("aria-busy", "true");
    expect(screen.getByTestId("help-sponsor-dashboard-workspace-readiness-status")).toHaveTextContent("Loading");
  });
});
