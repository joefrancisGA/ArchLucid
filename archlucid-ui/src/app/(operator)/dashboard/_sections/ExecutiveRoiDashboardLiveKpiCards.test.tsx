import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { EXECUTIVE_KPI_DRILL_THROUGH } from "@/lib/executive-kpi-drill-through-hrefs";

import { ExecutiveRoiDashboardLiveKpiCards } from "./ExecutiveRoiDashboardLiveKpiCards";

vi.mock("@/lib/api/governance-stickiness-api", () => ({
  getGovernanceDecisionsNeededSummary: vi.fn().mockResolvedValue({
    staleRisks: 4,
    waiversExpiringWithin14Days: 1,
    totalDecisionItems: 5,
  }),
}));

describe("ExecutiveRoiDashboardLiveKpiCards", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-01T12:00:00.000Z"));
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          resolvedFindingsCount30Days: 3,
          newlyDiscoveredFindingsCount30Days: 2,
          realizedValue: { findingsRemediatedCount30Days: 1 },
          costEvidenceFreshnessStatus: "Fresh",
          firstCommitUtc: "2026-05-02T00:00:00.000Z",
        }),
      } as Response),
    );
  });

  it("renders drill-through links with expected hrefs", async () => {
    render(<ExecutiveRoiDashboardLiveKpiCards />);

    await waitFor(() => {
      expect(screen.getByTestId("kpi-tile-resolved-30d-link")).toBeInTheDocument();
    });

    expect(screen.getByTestId("kpi-tile-resolved-30d-link")).toHaveAttribute(
      "href",
      EXECUTIVE_KPI_DRILL_THROUGH.resolvedFindings30d,
    );
    expect(screen.getByTestId("kpi-tile-stale-risks-link")).toHaveAttribute(
      "href",
      EXECUTIVE_KPI_DRILL_THROUGH.staleArchitectureRisks,
    );
    expect(screen.getByTestId("kpi-tile-expiring-waivers-link")).toHaveAttribute(
      "href",
      EXECUTIVE_KPI_DRILL_THROUGH.expiringWaivers,
    );
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("shows pilot day badge when firstCommitUtc is present", async () => {
    render(<ExecutiveRoiDashboardLiveKpiCards />);

    await waitFor(() => {
      expect(screen.getByTestId("exec-kpi-pilot-day-badge")).toHaveTextContent("Day 30 of your ArchLucid pilot");
    });
  });
});
