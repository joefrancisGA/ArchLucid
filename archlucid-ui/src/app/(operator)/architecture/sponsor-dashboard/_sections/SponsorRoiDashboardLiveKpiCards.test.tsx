import { screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  buyerPolishedShellVitestOverride,
  extendBuyerPolishedShellVitestMock,
} from "@/testing/buyer-polished-shell-vitest-override";
import { useOperatorQueryTestLifecycle } from "@/testing/operator-query-test-helpers";
import { renderWithOperatorQuery } from "@/testing/render-with-operator-query";
import { SPONSOR_KPI_DRILL_THROUGH } from "@/lib/sponsor-kpi-drill-through-hrefs";
import type { SponsorRoiSummary } from "@/lib/sponsor-report-markdown";

vi.mock("@/lib/demo-ui-env", async (importOriginal) =>
  extendBuyerPolishedShellVitestMock(importOriginal),
);

const sponsorSummary: SponsorRoiSummary = {
  resolvedFindingsCount30Days: 3,
  newlyDiscoveredFindingsCount30Days: 2,
  realizedValue: { findingsRemediatedCount30Days: 1 },
  costEvidenceFreshnessStatus: "Fresh",
  firstCommitUtc: "2026-05-02T00:00:00.000Z",
};

vi.mock("@/hooks/use-sponsor-roi-summary-query", () => ({
  useSponsorRoiSummaryQuery: () => ({
    data: sponsorSummary,
    isError: false,
    isLoading: false,
  }),
}));

vi.mock("@/hooks/use-governance-decisions-needed-summary-query", () => ({
  useGovernanceDecisionsNeededSummaryQuery: () => ({
    data: {
      staleRisks: 4,
      waiversExpiringWithin14Days: 1,
      totalDecisionItems: 5,
    },
    isError: false,
    isLoading: false,
  }),
}));

vi.mock("@/hooks/use-realized-value-attestation-query", () => ({
  useRealizedValueAttestationQuery: () => ({
    data: null,
    isError: false,
    isLoading: false,
    blockedReason: null,
  }),
}));

import { SponsorRoiDashboardLiveKpiCards } from "./SponsorRoiDashboardLiveKpiCards";

describe("SponsorRoiDashboardLiveKpiCards", () => {
  useOperatorQueryTestLifecycle();

  beforeEach(() => {
    buyerPolishedShellVitestOverride.value = false;
  });

  afterEach(() => {
    buyerPolishedShellVitestOverride.value = null;
    vi.useRealTimers();
  });

  it("renders drill-through links with expected hrefs", async () => {
    renderWithOperatorQuery(<SponsorRoiDashboardLiveKpiCards />);

    await waitFor(() => {
      expect(screen.getByTestId("kpi-tile-resolved-30d-link")).toBeInTheDocument();
    });

    expect(screen.getByTestId("kpi-tile-resolved-30d-link")).toHaveTextContent("3");
    expect(screen.getByTestId("kpi-tile-resolved-30d-link")).toHaveAttribute(
      "href",
      SPONSOR_KPI_DRILL_THROUGH.resolvedFindings30d,
    );
    expect(screen.getByTestId("exec-kpi-stale-risks")).toBeInTheDocument();
    expect(screen.getByTestId("exec-kpi-stale-risks-count")).toHaveTextContent("4");
    expect(screen.getByTestId("exec-kpi-expiring-waivers")).toBeInTheDocument();
    expect(screen.getByTestId("exec-kpi-expiring-waivers-count")).toHaveTextContent("1");
  });

  it("shows pilot day badge when firstCommitUtc is present", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(new Date("2026-06-01T12:00:00.000Z"));

    renderWithOperatorQuery(<SponsorRoiDashboardLiveKpiCards />);

    await waitFor(() => {
      expect(screen.getByTestId("exec-kpi-pilot-day-badge")).toHaveTextContent("Day 30 of your ArchLucid pilot");
    });
  });
});
