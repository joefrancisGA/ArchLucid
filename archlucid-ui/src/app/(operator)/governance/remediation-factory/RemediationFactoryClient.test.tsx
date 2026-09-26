import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const selectFinding = vi.fn();
const selectPath = vi.fn();
const setSnapshotPair = vi.fn();
const syncSelection = vi.fn();

let mockedFindingId: string | null = null;
let mockedPathId: string | null = null;

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

vi.mock("@/app/(operator)/governance/remediation-factory/use-remediation-factory-url-state", () => ({
  useRemediationFactoryUrlState: () => ({
    findingId: mockedFindingId,
    pathId: mockedPathId,
    fromSnapshotId: null,
    toSnapshotId: null,
    hasSnapshotPair: false,
    selectFinding,
    selectPath,
    setSnapshotPair,
    syncSelection,
  }),
}));

const useRemediationRankedFindingsQueryMock = vi.hoisted(() => vi.fn());
const useRemediationFactoryMetricsQueryMock = vi.hoisted(() => vi.fn());
const useSecurityEvidenceRankedPathsQueryMock = vi.hoisted(() => vi.fn());

vi.mock("@/hooks/use-remediation-factory-query", () => ({
  useRemediationRankedFindingsQuery: () => useRemediationRankedFindingsQueryMock(),
  useRemediationFactoryMetricsQuery: () => useRemediationFactoryMetricsQueryMock(),
}));

vi.mock("@/hooks/use-security-evidence-ranked-paths-query", () => ({
  useSecurityEvidenceRankedPathsQuery: () => useSecurityEvidenceRankedPathsQueryMock(),
}));

function mockRankedFindingsQuery(overrides: Record<string, unknown> = {}) {
  useRemediationRankedFindingsQueryMock.mockReturnValue({
    dataUpdatedAt: Date.now(),
    isFetching: false,
    isSuccess: true,
    refetch: vi.fn(),
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
    ...overrides,
  });
}

function mockMetricsQuery() {
  useRemediationFactoryMetricsQueryMock.mockReturnValue({
    dataUpdatedAt: Date.now(),
    isFetching: false,
    isSuccess: true,
    refetch: vi.fn(),
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
  });
}

function mockRankedPathsQuery(overrides: Record<string, unknown> = {}) {
  useSecurityEvidenceRankedPathsQueryMock.mockReturnValue({
    dataUpdatedAt: Date.now(),
    isFetching: false,
    isSuccess: true,
    refetch: vi.fn(),
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
    ...overrides,
  });
}

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

import { RemediationFactoryClient } from "./RemediationFactoryClient";
import { PAGE_HELP_SHORT_TRIGGER_TEXT } from "@/components/usability/PageContextualHelpButton";
import {
  SECURENOW_PATH_INSPECT_PANEL_TITLE,
  SECURENOW_PATH_RANKED_PATHS_TITLE,
} from "@/lib/product-line/securenow-path-inspect-copy";
import { REMEDIATION_FACTORY_EXECUTIVE_METRICS_TITLE } from "./remediation-factory-metric-presentation";

describe("RemediationFactoryClient", () => {
  beforeEach(() => {
    mockedFindingId = null;
    mockedPathId = null;
    selectFinding.mockReset();
    selectPath.mockReset();
    syncSelection.mockReset();
    mockRankedFindingsQuery();
    mockMetricsQuery();
    mockRankedPathsQuery();
  });

  it("renders executive cards, keyboard-selectable tables, help, context strip, and path inspect panel", () => {
    render(<RemediationFactoryClient />);

    expect(screen.getByTestId("remediation-factory-page")).toBeInTheDocument();
    expect(screen.getByTestId("remediation-factory-page-title")).toHaveTextContent("Remediation factory");
    expect(screen.getByTestId("remediation-factory-claim-discipline")).toHaveTextContent("sealed-record proof");
    expect(screen.getByTestId("remediation-factory-last-refreshed")).toBeInTheDocument();
    expect(screen.getByTestId("remediation-factory-context-strip")).toBeInTheDocument();
    expect(screen.getByText(REMEDIATION_FACTORY_EXECUTIVE_METRICS_TITLE)).toBeInTheDocument();
    expect(screen.getByTestId("page-contextual-help-button")).toHaveTextContent(PAGE_HELP_SHORT_TRIGGER_TEXT);
    expect(screen.getByTestId("remediation-priority-row-aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa")).toBeInTheDocument();
    expect(screen.getByText(SECURENOW_PATH_RANKED_PATHS_TITLE)).toBeInTheDocument();
    expect(screen.getByTestId("securenow-architect-outcome-metrics-panel")).toBeInTheDocument();
    expect(
      screen.getByTestId("security-evidence-ranked-path-row-bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
    ).toBeInTheDocument();
    expect(screen.getByText("Simulator — not a live scanner feed")).toBeInTheDocument();
    expect(screen.getByText(SECURENOW_PATH_INSPECT_PANEL_TITLE)).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("remediation-priority-row-aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"));

    expect(selectFinding).toHaveBeenCalledWith("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");

    fireEvent.click(
      screen.getByTestId("security-evidence-ranked-path-row-bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
    );

    expect(selectPath).toHaveBeenCalledWith("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
  });

  it("clears stale findingId from the URL when the finding is missing from loaded ranked rows", async () => {
    mockedFindingId = "dddddddd-dddd-dddd-dddd-dddddddddddd";
    mockRankedFindingsQuery();

    render(<RemediationFactoryClient />);

    await waitFor(() => {
      expect(syncSelection).toHaveBeenCalledWith({ findingId: null });
    });
  });

  it("clears stale pathId from the URL when the path is missing from loaded ranked paths", async () => {
    mockedPathId = "dddddddd-dddd-dddd-dddd-dddddddddddd";
    mockRankedPathsQuery();

    render(<RemediationFactoryClient />);

    await waitFor(() => {
      expect(syncSelection).toHaveBeenCalledWith({ pathId: null });
    });
  });
});
