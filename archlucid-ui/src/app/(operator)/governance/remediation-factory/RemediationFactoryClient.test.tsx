import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const replaceMock = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => "/security/remediation-factory",
  useRouter: () => ({ replace: replaceMock }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/components/product-line/ProductLineProvider", () => ({
  useProductLine: () => ({
    productLine: "security",
    assignmentOverrides: {},
    setProductLine: () => {},
    setHrefAssignment: () => {},
    resetHrefAssignment: () => {},
    resetAllAssignments: () => {},
  }),
}));

vi.mock("@/hooks/use-operator-relative-freshness-now-ms", () => ({
  useOperatorRelativeFreshnessNowMs: () => Date.now(),
}));

vi.mock("@/hooks/useRemediationFactoryShortcuts", () => ({
  useRemediationFactoryShortcuts: vi.fn(),
}));

const rankedRefetch = vi.fn();
const metricsRefetch = vi.fn();
const pathsRefetch = vi.fn();

vi.mock("@/hooks/use-remediation-factory-query", () => ({
  useRemediationRankedFindingsQuery: vi.fn(),
  useRemediationFactoryMetricsQuery: vi.fn(),
}));

vi.mock("@/hooks/use-security-evidence-ranked-paths-query", () => ({
  useSecurityEvidenceRankedPathsQuery: vi.fn(),
}));

vi.mock("@/components/security/SecureNowArchitectOutcomeMetricsPanel", () => ({
  SecureNowArchitectOutcomeMetricsPanel: () => (
    <section data-testid="securenow-architect-outcome-metrics-panel">Architect outcome metrics</section>
  ),
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

import { useRemediationFactoryMetricsQuery, useRemediationRankedFindingsQuery } from "@/hooks/use-remediation-factory-query";
import { useSecurityEvidenceRankedPathsQuery } from "@/hooks/use-security-evidence-ranked-paths-query";
import { RemediationFactoryClient } from "./RemediationFactoryClient";
import {
  SECURENOW_PATH_INSPECT_PANEL_TITLE,
  SECURENOW_PATH_RANKED_PATHS_TITLE,
} from "@/lib/product-line/securenow-path-inspect-copy";
import { REMEDIATION_FACTORY_REFRESHING_LABEL } from "./remediation-factory-freshness";
import { operatorFreshnessMetadataWithClockLabel } from "@/lib/operator/operator-last-refreshed-label";
import { REMEDIATION_FACTORY_LAST_REFRESHED_PREFIX } from "./remediation-factory-freshness";

function mockHappyQueries(options?: { readonly refreshing?: boolean }) {
  const refreshing = options?.refreshing === true;
  const now = Date.now();

  vi.mocked(useRemediationRankedFindingsQuery).mockReturnValue({
    dataUpdatedAt: now,
    isFetching: refreshing,
    refetch: rankedRefetch,
    data: [
      {
        findingId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
        rankOrder: 3,
        totalScore: 0.42,
        explanationSummary: "Rule=IE15-priority-v1; Total=0.4200; Factors=11",
        breakdownJson: "[]",
        controlId: "AC-2",
        patternKey: "storage.encrypt",
      },
    ],
    isError: false,
  } as ReturnType<typeof useRemediationRankedFindingsQuery>);

  vi.mocked(useRemediationFactoryMetricsQuery).mockReturnValue({
    dataUpdatedAt: now,
    isFetching: refreshing,
    refetch: metricsRefetch,
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
  } as ReturnType<typeof useRemediationFactoryMetricsQuery>);

  vi.mocked(useSecurityEvidenceRankedPathsQuery).mockReturnValue({
    dataUpdatedAt: now,
    isFetching: refreshing,
    refetch: pathsRefetch,
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
  } as ReturnType<typeof useSecurityEvidenceRankedPathsQuery>);
}

describe("RemediationFactoryClient", () => {
  it("renders priority queue before metrics disclosure and supports row keyboard selection", () => {
    mockHappyQueries();

    render(<RemediationFactoryClient />);

    expect(screen.getByTestId("remediation-factory-page")).toBeInTheDocument();
    expect(screen.getByTestId("remediation-priority-row-aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa")).toHaveAttribute(
      "tabindex",
      "0",
    );
    expect(screen.getByText(SECURENOW_PATH_RANKED_PATHS_TITLE)).toBeInTheDocument();
    expect(screen.getByTestId("remediation-factory-metrics-disclosure")).toBeInTheDocument();
    expect(screen.getByText(SECURENOW_PATH_INSPECT_PANEL_TITLE)).toBeInTheDocument();

    fireEvent.keyDown(screen.getByTestId("remediation-priority-row-aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"), {
      key: "Enter",
    });

    expect(replaceMock).toHaveBeenCalled();
  });

  it("shows refreshing label only while fetches are in flight", () => {
    mockHappyQueries({ refreshing: true });

    render(<RemediationFactoryClient />);

    expect(screen.getByTestId("remediation-factory-last-refreshed")).toHaveTextContent(
      REMEDIATION_FACTORY_REFRESHING_LABEL,
    );
    expect(screen.getByTestId("remediation-factory-refresh-button")).toHaveAttribute("aria-busy", "true");

    const idleLabel = operatorFreshnessMetadataWithClockLabel({
      prefix: REMEDIATION_FACTORY_LAST_REFRESHED_PREFIX,
      lastRefreshedAt: new Date(),
      refreshingLabel: null,
    });

    expect(idleLabel).toContain("Last refreshed:");
  });
});
