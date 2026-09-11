import { fireEvent, render, screen } from "@testing-library/react";
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

vi.mock("@/hooks/use-security-evidence-ranked-paths-query", () => ({
  useSecurityEvidenceRankedPathsQuery: () => ({
    data: {
      items: [
        {
          pathId: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
          snapshotId: "cccccccc-cccc-cccc-cccc-cccccccccccc",
          rankOrder: 1,
          ruleVersion: "SA-09-v1",
          technicalExposureScore: 0.9,
          privilegeDepthScore: 0.8,
          blastRadiusScore: 0.7,
          businessConsequenceScore: null,
          confidenceBandScore: 0.6,
          compositeSortScore: 0.8123,
          explanationSummary: "Top ranked architect path.",
          pathKind: "PrivilegePath",
          pathConfidenceBand: "HighlyLikely",
          computedUtc: "2026-01-01T00:00:00Z",
          relatedCutPoints: [],
        },
      ],
      totalCount: 1,
      page: 1,
      pageSize: 25,
      topCutPoints: [],
    },
    isError: false,
  }),
}));

vi.mock("@/hooks/use-operational-security-finding-detail-query", () => ({
  useOperationalSecurityFindingDetailQuery: () => ({
    data: { findingId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", pathId: null, title: "Sample" },
    isLoading: false,
    isError: false,
  }),
}));

vi.mock("@/hooks/use-security-evidence-path-detail-query", () => ({
  useSecurityEvidencePathDetailQuery: () => ({
    data: undefined,
    isLoading: false,
    isError: false,
  }),
}));

vi.mock("@/lib/infra-evidence/infra-evidence-remediation-api", () => ({
  fetchRemediationInstances: vi.fn(async () => []),
}));

import { RemediationFactoryClient } from "./RemediationFactoryClient";
import {
  SECURENOW_PATH_INSPECT_PANEL_TITLE,
  SECURENOW_PATH_RANKED_PATHS_TITLE,
} from "@/lib/product-line/securenow-path-inspect-copy";

describe("RemediationFactoryClient", () => {
  it("renders executive cards, operator table, simulator disclaimer, and path inspect panel", () => {
    render(<RemediationFactoryClient />);

    expect(screen.getByTestId("remediation-factory-page")).toBeInTheDocument();
    expect(screen.getByText("Open findings")).toBeInTheDocument();
    expect(screen.getByTestId("remediation-priority-row-aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa")).toBeInTheDocument();
    expect(screen.getByText(SECURENOW_PATH_RANKED_PATHS_TITLE)).toBeInTheDocument();
    expect(
      screen.getByTestId("security-evidence-ranked-path-row-bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
    ).toBeInTheDocument();
    expect(screen.getByText("Simulator — not a live scanner feed")).toBeInTheDocument();
    expect(screen.getByText(SECURENOW_PATH_INSPECT_PANEL_TITLE)).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("remediation-priority-row-aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"));

    expect(screen.getByTestId("security-evidence-path-inspect-panel")).toHaveFocus();

    fireEvent.click(
      screen.getByTestId("security-evidence-ranked-path-row-bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
    );

    expect(screen.getByTestId("security-evidence-path-inspect-panel")).toHaveFocus();
  });
});
