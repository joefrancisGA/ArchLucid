import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/hooks/use-remediation-factory-query", () => ({
  useRemediationRankedFindingsQuery: () => ({
    data: [
      {
        findingId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
        totalScore: 0.42,
        explanationSummary: "Rule=IE15-priority-v1; Total=0.4200; Factors=11",
        breakdownJson: "[]",
        controlId: "AC-2",
        patternKey: "storage.encrypt",
      },
    ],
    isError: false,
  }),
  useRemediationFactoryMetricsQuery: () => ({
    data: {
      openFindings: 3,
      riskWeightedOpen: 1.2,
      criticalExposureCount: 1,
      createdThisWeek: 2,
      remediatedThisWeek: 1,
      netBurn: 1,
      recurrenceCount: 0,
      patternCoverageExactMatchPercent: 50,
      automationPercent: 25,
      verificationFailureCount: 0,
      exceptionsActive: 1,
      exceptionsExpiringSoon: 0,
      exceptionsExpired: 0,
      businessBlockedCount: 0,
      averageAgeDays: 4.5,
      topControlIds: [],
      topPatternKeys: [],
    },
    isError: false,
  }),
}));

import { RemediationFactoryClient } from "./RemediationFactoryClient";

describe("RemediationFactoryClient", () => {
  it("renders executive cards, operator table, and simulator disclaimer", () => {
    render(<RemediationFactoryClient />);

    expect(screen.getByTestId("remediation-factory-page")).toBeInTheDocument();
    expect(screen.getByText("Open findings")).toBeInTheDocument();
    expect(screen.getByTestId("remediation-priority-row-aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa")).toBeInTheDocument();
    expect(screen.getByText("Simulator — not a live scanner feed")).toBeInTheDocument();
  });
});
