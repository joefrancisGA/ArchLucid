import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

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
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          resolvedFindingsCount30Days: 3,
          newlyDiscoveredFindingsCount30Days: 2,
          realizedValue: { findingsRemediatedCount30Days: 1 },
          costEvidenceFreshnessStatus: "Fresh",
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
});
