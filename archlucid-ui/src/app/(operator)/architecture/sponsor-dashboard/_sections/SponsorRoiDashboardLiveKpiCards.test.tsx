import { screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  buyerPolishedShellVitestOverride,
  extendBuyerPolishedShellVitestMock,
} from "@/testing/buyer-polished-shell-vitest-override";
import { useOperatorQueryTestLifecycle } from "@/testing/operator-query-test-helpers";
import { renderWithOperatorQuery } from "@/testing/render-with-operator-query";
import { SPONSOR_KPI_DRILL_THROUGH } from "@/lib/sponsor-kpi-drill-through-hrefs";

vi.mock("@/lib/demo-ui-env", async (importOriginal) =>
  extendBuyerPolishedShellVitestMock(importOriginal),
);

import { SponsorRoiDashboardLiveKpiCards } from "./SponsorRoiDashboardLiveKpiCards";

vi.mock("@/lib/api/governance-stickiness-api", () => ({
  getGovernanceDecisionsNeededSummary: vi.fn().mockResolvedValue({
    staleRisks: 4,
    waiversExpiringWithin14Days: 1,
    totalDecisionItems: 5,
  }),
}));

describe("SponsorRoiDashboardLiveKpiCards", () => {
  useOperatorQueryTestLifecycle();

  beforeEach(() => {
    buyerPolishedShellVitestOverride.value = false;
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

  afterEach(() => {
    buyerPolishedShellVitestOverride.value = null;
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("renders drill-through links with expected hrefs", async () => {
    renderWithOperatorQuery(<SponsorRoiDashboardLiveKpiCards />);

    await waitFor(() => {
      expect(screen.getByTestId("kpi-tile-resolved-30d-link")).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByTestId("kpi-tile-resolved-30d-link")).toHaveTextContent("3");
    });

    expect(screen.getByTestId("kpi-tile-resolved-30d-link")).toHaveAttribute(
      "href",
      SPONSOR_KPI_DRILL_THROUGH.resolvedFindings30d,
    );
    expect(screen.getByTestId("kpi-tile-stale-risks-link")).toHaveAttribute(
      "href",
      SPONSOR_KPI_DRILL_THROUGH.staleArchitectureRisks,
    );
    expect(screen.getByTestId("kpi-tile-expiring-waivers-link")).toHaveAttribute(
      "href",
      SPONSOR_KPI_DRILL_THROUGH.expiringWaivers,
    );
  });

  it("shows pilot day badge when firstCommitUtc is present", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-01T12:00:00.000Z"));

    renderWithOperatorQuery(<SponsorRoiDashboardLiveKpiCards />);

    await vi.waitFor(() => {
      expect(screen.getByTestId("exec-kpi-pilot-day-badge")).toHaveTextContent("Day 30 of your ArchLucid pilot");
    });
  });
});
