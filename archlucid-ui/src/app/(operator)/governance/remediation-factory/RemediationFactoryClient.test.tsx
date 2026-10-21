import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const selectFinding = vi.fn();
const selectPath = vi.fn();
const setSnapshotPair = vi.fn();
const setRankedPage = vi.fn();
const syncSelection = vi.fn();
const routerReplaceMock = vi.hoisted(() => vi.fn());
let searchParams = vi.hoisted(() => new URLSearchParams());

let mockedFindingId: string | null = null;
let mockedPathId: string | null = null;

vi.mock("next/navigation", () => ({
  usePathname: () => "/governance/remediation-factory",
  useRouter: () => ({ replace: routerReplaceMock, push: vi.fn() }),
  useSearchParams: () => searchParams,
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

vi.mock("@/app/(operator)/governance/remediation-factory/use-remediation-factory-url-state", () => ({
  useRemediationFactoryUrlState: () => ({
    findingId: mockedFindingId,
    pathId: mockedPathId,
    fromSnapshotId: null,
    toSnapshotId: null,
    rankedPage: 1,
    hasSnapshotPair: false,
    selectFinding,
    selectPath,
    setSnapshotPair,
    setRankedPage,
    syncSelection,
  }),
}));

const useRemediationRankedFindingsQueryMock = vi.hoisted(() => vi.fn());
const useRemediationFactoryMetricsQueryMock = vi.hoisted(() => vi.fn());
const useSecurityEvidenceRankedPathsQueryMock = vi.hoisted(() => vi.fn());
const fetchRemediationScoreExplanationMock = vi.hoisted(() => vi.fn());

const useSecurityEvidencePathReportQueryMock = vi.hoisted(() =>
  vi.fn(() => ({
    isLoading: false,
    isFetching: false,
    isSuccess: true,
    isError: false,
    refetch: vi.fn(),
    data: {
      snapshotId: "cccccccc-cccc-cccc-cccc-cccccccccccc",
      vulnerableAttackPaths: [],
      unevaluatedGroups: [],
    },
  })),
);

vi.mock("@/lib/remediation-factory-api", () => ({
  fetchRemediationScoreExplanation: (...args: unknown[]) => fetchRemediationScoreExplanationMock(...args),
}));

vi.mock("@/hooks/use-remediation-factory-query", () => ({
  useRemediationRankedFindingsQuery: () => useRemediationRankedFindingsQueryMock(),
  useRemediationFactoryMetricsQuery: () => useRemediationFactoryMetricsQueryMock(),
}));

vi.mock("@/hooks/use-security-evidence-ranked-paths-query", () => ({
  useSecurityEvidenceRankedPathsQuery: () => useSecurityEvidenceRankedPathsQueryMock(),
}));

vi.mock("@/hooks/use-security-evidence-path-report-query", () => ({
  useSecurityEvidencePathReportQuery: (snapshotId: string | null) => {
    useSecurityEvidencePathReportQueryMock(snapshotId);
    return useSecurityEvidencePathReportQueryMock();
  },
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
        rankOrder: 1,
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

function mockPathReportQuery(overrides: Record<string, unknown> = {}) {
  useSecurityEvidencePathReportQueryMock.mockImplementation(() => ({
    isLoading: false,
    isFetching: false,
    isSuccess: true,
    isError: false,
    refetch: vi.fn(),
    data: {
      snapshotId: "cccccccc-cccc-cccc-cccc-cccccccccccc",
      vulnerableAttackPaths: [],
      unevaluatedGroups: [],
    },
    ...overrides,
  }));
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
          explanationSummary: "SA09-rank-v1: PrivilegePath path ranks by weighted dimensions.",
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

import { COMMAND_PALETTE_REMEDIATION_FACTORY_INSPECT_EVENT } from "@/lib/remediation-factory/remediation-factory-command-palette-events";
import { RemediationFactoryClient } from "./RemediationFactoryClient";
import { PAGE_HELP_SHORT_TRIGGER_TEXT } from "@/components/usability/PageContextualHelpButton";
import {
  SECURENOW_PATH_INSPECT_PANEL_TITLE,
  SECURENOW_PATH_RANKED_PATHS_TITLE,
} from "@/lib/product-line/securenow-path-inspect-copy";
import { REMEDIATION_FACTORY_EXECUTIVE_METRICS_TITLE } from "./remediation-factory-metric-presentation";
import {
  REMEDIATION_FACTORY_PAGE_SUBTITLE,
  REMEDIATION_FACTORY_PATH_INSPECT_PANEL_ID,
} from "./remediation-factory-page-copy";

describe("RemediationFactoryClient", () => {
  beforeEach(() => {
    Element.prototype.scrollIntoView = vi.fn();
    mockedFindingId = null;
    mockedPathId = null;
    searchParams = new URLSearchParams();
    routerReplaceMock.mockReset();
    selectFinding.mockReset();
    selectPath.mockReset();
    syncSelection.mockReset();
    fetchRemediationScoreExplanationMock.mockReset();
    mockRankedFindingsQuery();
    mockMetricsQuery();
    mockRankedPathsQuery();
    mockPathReportQuery();
  });

  it("loads the attack path report from the first ranked path when no snapshot pair is selected", () => {
    useSecurityEvidencePathReportQueryMock.mockClear();
    mockRankedPathsQuery();
    render(<RemediationFactoryClient />);

    expect(useSecurityEvidencePathReportQueryMock).toHaveBeenCalledWith(
      "cccccccc-cccc-cccc-cccc-cccccccccccc",
    );
  });

  it("names SecureNow findings on the priority queue without calling them architecture findings", () => {
    render(<RemediationFactoryClient />);

    const audienceLine = screen.getByTestId("remediation-factory-findings-audience-line");

    expect(audienceLine).toHaveTextContent("These are SecureNow findings for the current inventory snapshot.");
    expect(audienceLine).not.toHaveTextContent(/not architecture review findings/i);
    expect(audienceLine).not.toHaveTextContent(/not architecture findings/i);
  });

  it("distinguishes finding-queue rank from ranked-path rank in the column headers", () => {
    render(<RemediationFactoryClient />);

    expect(screen.getByTestId("remediation-factory-priority-rank-header-helper")).toHaveTextContent(
      "This rank is the SecureNow finding queue, not the path list.",
    );
    expect(screen.getByText("1 is the first path to inspect.")).toBeInTheDocument();
  });

  it("renders executive cards, keyboard-selectable tables, help, context strip, and path inspect panel", () => {
    render(<RemediationFactoryClient />);

    expect(screen.getByTestId("remediation-factory-page")).toBeInTheDocument();
    expect(screen.getByTestId("remediation-factory-page-title")).toHaveTextContent("Priorities & Waves");
    expect(screen.queryByTestId("remediation-factory-claim-discipline")).not.toBeInTheDocument();
    expect(screen.getByTestId("remediation-factory-page-lead")).toHaveTextContent(REMEDIATION_FACTORY_PAGE_SUBTITLE);
    expect(screen.queryByText(/wave planning/i)).not.toBeInTheDocument();
    expect(screen.getByTestId("remediation-factory-last-refreshed")).toBeInTheDocument();
    expect(screen.getByTestId("remediation-factory-context-strip")).toBeInTheDocument();
    expect(screen.getByTestId("remediation-factory-page-shortcuts")).toBeInTheDocument();
    expect(screen.getByTestId("remediation-factory-page-shortcuts-entry-alt-e")).toHaveTextContent(
      "Explain selected score",
    );
    const rankedPathShortcuts = screen.getByTestId("remediation-factory-ranked-path-queue-shortcuts");
    expect(rankedPathShortcuts).toHaveTextContent("alt+j");
    expect(rankedPathShortcuts).toHaveTextContent("alt+k");
    expect(rankedPathShortcuts).toHaveTextContent("alt+i");
    expect(rankedPathShortcuts).toHaveTextContent("alt+o");
    expect(rankedPathShortcuts).toHaveTextContent("alt+q");
    expect(screen.getByText(REMEDIATION_FACTORY_EXECUTIVE_METRICS_TITLE)).toBeInTheDocument();
    expect(screen.getByTestId("page-contextual-help-button")).toHaveTextContent(PAGE_HELP_SHORT_TRIGGER_TEXT);
    expect(screen.getByTestId("remediation-factory-open-waves")).toHaveAttribute(
      "href",
      "/security/remediation-instances#remediation-waves",
    );
    expect(screen.getByText("Sort key for this queue. Not a percentage.")).toBeInTheDocument();
    expect(screen.getByTestId("remediation-factory-priority-rank-header-helper")).toHaveTextContent(
      "This rank is the SecureNow finding queue, not the path list.",
    );
    expect(screen.getByText("1 is the first path to inspect.")).toBeInTheDocument();
    expect(screen.getByText("This week, this month, or later follows the queue order. It is not a separate score.")).toBeInTheDocument();
    const priorityRow = screen.getByTestId("remediation-priority-row-aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    expect(priorityRow).toHaveTextContent("This row does not name a leading factor.");
    expect(priorityRow).toHaveTextContent("This week");
    expect(priorityRow).toHaveTextContent("Name not recorded");
    expect(priorityRow).toHaveTextContent("Show sort key");
    expect(priorityRow).not.toHaveTextContent("0.4200");
    expect(priorityRow).not.toHaveTextContent("Rule=IE15-priority-v1");
    expect(screen.getByText("SecureNow findings that are still open.")).toBeInTheDocument();
    expect(screen.queryByText(/IE15-priority-v1/)).not.toBeInTheDocument();
    expect(screen.getByText("Evidence strength for the whole path.")).toBeInTheDocument();
    expect(screen.getByTestId("remediation-ranked-path-filters-scope")).toHaveTextContent(
      "These filters narrow the path list only.",
    );
    expect(screen.getByTestId("remediation-ranked-path-filters-scope")).toHaveTextContent("paths on this page");
    expect(screen.getByTestId("remediation-factory-context-jump-to-inspect")).toHaveAttribute(
      "href",
      "#remediation-factory-path-inspect",
    );
    expect(screen.getByTestId("remediation-priority-row-aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa")).toBeInTheDocument();
    expect(screen.getByText(SECURENOW_PATH_RANKED_PATHS_TITLE)).toBeInTheDocument();
    expect(screen.getByTestId("securenow-architect-outcome-metrics-panel")).toBeInTheDocument();
    const pathRow = screen.getByTestId("security-evidence-ranked-path-row-bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
    expect(pathRow).toBeInTheDocument();
    expect(pathRow).toHaveTextContent("Exposed on the network. Deep privilege.");
    expect(pathRow).toHaveTextContent("Show sort key");
    expect(pathRow).not.toHaveTextContent("0.8123");
    expect(pathRow).not.toHaveTextContent("SA09-rank-v1");
    expect(screen.getByText("Simulator — not a live scanner feed")).toBeInTheDocument();
    expect(screen.getByText(SECURENOW_PATH_INSPECT_PANEL_TITLE)).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("remediation-priority-row-aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"));

    expect(selectFinding).toHaveBeenCalledWith("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");

    fireEvent.click(
      screen.getByTestId("security-evidence-ranked-path-row-bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
    );

    expect(selectPath).toHaveBeenCalledWith("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
  });

  it("opens the rule line, the sort key, and how the counts are measured", () => {
    const resourceId = "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/customerdata";
    mockRankedFindingsQuery({
      data: [
        {
          findingId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
          rankOrder: 6,
          totalScore: 0.42,
          explanationSummary: "Rule=IE15-priority-v1; Total=0.4200; Factors=11",
          breakdownJson: JSON.stringify([
            { Factor: "InternetExposure", NormalizedValue: 1, WeightedContribution: 0.1, Source: "public" },
            { Factor: "DataSensitivity", NormalizedValue: 0.8, WeightedContribution: 0.08, Source: "customer" },
          ]),
          cloudResourceId: resourceId,
          controlId: "AC-2",
          patternKey: "storage.encrypt",
        },
      ],
    });

    render(<RemediationFactoryClient />);

    const priorityRow = screen.getByTestId("remediation-priority-row-aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    expect(priorityRow).toHaveTextContent("Reachable from the internet. Sensitive data.");
    expect(priorityRow).toHaveTextContent("customerdata");
    expect(priorityRow).toHaveTextContent("This month");
    expect(priorityRow).toHaveTextContent("Pattern");
    expect(priorityRow).not.toHaveTextContent("storage.encrypt");

    fireEvent.click(screen.getByTestId("remediation-priority-pattern-identifiers-aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"));
    expect(priorityRow).toHaveTextContent("storage.encrypt");
    expect(priorityRow).not.toHaveTextContent(resourceId);

    fireEvent.click(screen.getByTestId("remediation-priority-rule-aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"));
    expect(priorityRow).toHaveTextContent("Rule=IE15-priority-v1; Total=0.4200; Factors=11");

    fireEvent.click(screen.getByTestId("remediation-priority-sort-key-aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"));
    expect(priorityRow).toHaveTextContent(
      "Sort key 0.4200. Ordering only — not a percentage, probability, or live risk score.",
    );

    expect(priorityRow).not.toHaveTextContent(resourceId);

    fireEvent.click(screen.getByTestId("remediation-priority-resource-id-aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"));
    expect(priorityRow).toHaveTextContent(resourceId);

    const measurementToggle = screen.getByTestId("remediation-metrics-measurement-help-link");
    expect(measurementToggle).toHaveTextContent("How these counts are measured");
    expect(measurementToggle).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(measurementToggle);

    expect(screen.getByTestId("remediation-metrics-measurement-body")).toHaveTextContent("IE15-priority-v1");
  });

  it("maps rank 26 to Later on the priority queue", () => {
    mockRankedFindingsQuery({
      data: [
        {
          findingId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
          rankOrder: 26,
          totalScore: 0.42,
          explanationSummary: "Rule=IE15-priority-v1; Total=0.4200; Factors=11",
          breakdownJson: "[]",
          cloudResourceId: null,
          controlId: "AC-2",
          patternKey: null,
        },
      ],
    });

    render(<RemediationFactoryClient />);

    const priorityRow = screen.getByTestId("remediation-priority-row-aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    expect(priorityRow).toHaveTextContent("26");
    expect(priorityRow).toHaveTextContent("Later");
  });

  it("derives the when band from row order when rank order is missing", () => {
    mockRankedFindingsQuery({
      data: [
        {
          findingId: "11111111-1111-1111-1111-111111111111",
          totalScore: 0.9,
          explanationSummary: "",
          breakdownJson: "[]",
          controlId: "AC-1",
          patternKey: null,
        },
        {
          findingId: "22222222-2222-2222-2222-222222222222",
          totalScore: 0.8,
          explanationSummary: "",
          breakdownJson: "[]",
          controlId: "AC-2",
          patternKey: null,
        },
      ],
    });

    render(<RemediationFactoryClient />);

    const secondRow = screen.getByTestId("remediation-priority-row-22222222-2222-2222-2222-222222222222");
    expect(secondRow).toHaveTextContent("2");
    expect(secondRow).toHaveTextContent("This week");
  });

  it("opens the path rule line and sort key", () => {
    render(<RemediationFactoryClient />);

    const pathRow = screen.getByTestId("security-evidence-ranked-path-row-bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
    expect(pathRow).toHaveTextContent("Exposed on the network. Deep privilege.");

    fireEvent.click(screen.getByTestId("security-evidence-path-rank-rule-bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"));
    expect(pathRow).toHaveTextContent("SA09-rank-v1: PrivilegePath path ranks by weighted dimensions.");

    fireEvent.click(screen.getByTestId("security-evidence-path-rank-sort-key-bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"));
    expect(pathRow).toHaveTextContent(
      "Composite sort key 0.8123. Ordering only — not a percentage, probability, or live risk score.",
    );
  });

  it("focuses path inspect when a top cut point highlights a path", () => {
    const collapsedPathId = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
    mockRankedPathsQuery({
      data: {
        items: [
          {
            pathId: collapsedPathId,
            snapshotId: "cccccccc-cccc-cccc-cccc-cccccccccccc",
            rankOrder: 1,
            ruleVersion: "SA-09-v1",
            technicalExposureScore: 0.9,
            privilegeDepthScore: 0.8,
            blastRadiusScore: 0.7,
            businessConsequenceScore: null,
            confidenceBandScore: 0.6,
            compositeSortScore: 0.8123,
            explanationSummary: "SA09-rank-v1: PrivilegePath path ranks by weighted dimensions.",
            pathKind: "PrivilegePath",
            pathConfidenceBand: "HighlyLikely",
            computedUtc: "2026-01-01T00:00:00Z",
            relatedCutPoints: [],
          },
        ],
        totalCount: 1,
        page: 1,
        pageSize: 25,
        topCutPoints: [
          {
            cutPointId: "cut-1",
            cutKind: "Node",
            cutOrder: 1,
            fromNodeLabel: "mi-worker",
            toNodeLabel: null,
            edgeType: null,
            explanationSummary: "SA10-cut-v1: removing node mi-worker collapses 1 ranked path(s).",
            suggestedPatternKey: null,
            operationalCostClass: "RoleAssignment",
            pathsCollapsedCount: 1,
            leverageScore: 1,
            collapsedPathIds: [collapsedPathId],
          },
        ],
      },
    });

    render(<RemediationFactoryClient />);

    fireEvent.click(screen.getByRole("button", { name: "Highlight path" }));

    expect(selectPath).toHaveBeenCalledWith(collapsedPathId);
    expect(screen.getByTestId("security-evidence-path-inspect-panel")).toHaveFocus();
  });

  it("focuses path inspect when the attack path report selects a vulnerable path", () => {
    const pathId = "dddddddd-dddd-dddd-dddd-dddddddddddd";
    const pathSummary = {
      pathId,
      snapshotId: "cccccccc-cccc-cccc-cccc-cccccccccccc",
      rankOrder: 1,
      ruleVersion: "SA-09-v1",
      technicalExposureScore: 0.9,
      privilegeDepthScore: 0.8,
      blastRadiusScore: 0.7,
      businessConsequenceScore: null,
      confidenceBandScore: 0.6,
      compositeSortScore: 0.8123,
      explanationSummary: "SA09-rank-v1: PrivilegePath path ranks by weighted dimensions.",
      pathKind: "PrivilegePath",
      pathConfidenceBand: "HighlyLikely",
      computedUtc: "2026-01-01T00:00:00Z",
      relatedCutPoints: [],
    };

    mockPathReportQuery({
      data: {
        snapshotId: "cccccccc-cccc-cccc-cccc-cccccccccccc",
        vulnerableAttackPaths: [pathSummary],
        unevaluatedGroups: [],
      },
    });

    render(<RemediationFactoryClient />);

    const report = screen.getByTestId("attack-path-report-section");

    fireEvent.click(within(report).getByTestId(`security-evidence-ranked-path-row-${pathId}`));

    expect(selectPath).toHaveBeenCalledWith(pathId);
    expect(screen.getByTestId("security-evidence-path-inspect-panel")).toHaveFocus();
  });

  it("shows ranked path pagination when the server reports more than one page", () => {
    mockRankedPathsQuery({
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
            explanationSummary: "SA09-rank-v1",
            pathKind: "PrivilegePath",
            pathConfidenceBand: "HighlyLikely",
            computedUtc: "2026-01-01T00:00:00Z",
            relatedCutPoints: [],
          },
        ],
        totalCount: 30,
        page: 1,
        pageSize: 25,
        topCutPoints: [],
      },
    });

    render(<RemediationFactoryClient />);

    expect(screen.getByTestId("remediation-ranked-paths-pagination")).toHaveTextContent("30");
    expect(screen.getByTestId("remediation-factory-ranked-paths-next-page")).toBeEnabled();
    expect(screen.getByTestId("remediation-factory-ranked-paths-prev-page")).toBeDisabled();
  });

  it("clears simulator output when the selected finding changes", async () => {
    mockedFindingId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
    fetchRemediationScoreExplanationMock.mockResolvedValue({
      findingId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      totalScore: 0.42,
      factors: [],
      ruleVersion: "IE15-priority-v1",
    });
    mockRankedFindingsQuery({
      data: [
        {
          findingId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
          totalScore: 0.42,
          explanationSummary: "first",
          breakdownJson: "[]",
          controlId: "AC-2",
          patternKey: null,
        },
        {
          findingId: "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee",
          totalScore: 0.2,
          explanationSummary: "second",
          breakdownJson: "[]",
          controlId: "AC-3",
          patternKey: null,
        },
      ],
    });

    selectFinding.mockImplementation((findingId: string) => {
      mockedFindingId = findingId;
    });

    const view = render(<RemediationFactoryClient />);

    fireEvent.click(screen.getByRole("button", { name: /Explain selected score/i }));

    await waitFor(() => {
      expect(screen.getByTestId("remediation-simulator-output")).toBeInTheDocument();
    });

    fireEvent.click(
      screen.getByTestId("remediation-priority-row-eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee"),
    );
    view.rerender(<RemediationFactoryClient />);

    await waitFor(() => {
      expect(screen.queryByTestId("remediation-simulator-output")).not.toBeInTheDocument();
    });
  });

  it("focuses path inspect on Alt+I and the command palette inspect event", () => {
    render(<RemediationFactoryClient />);

    const panel = screen.getByTestId("security-evidence-path-inspect-panel");
    expect(panel).toHaveAttribute("id", REMEDIATION_FACTORY_PATH_INSPECT_PANEL_ID);
    fireEvent.keyDown(document, { key: "i", altKey: true });

    expect(panel).toHaveFocus();

    panel.blur();
    window.dispatchEvent(new Event(COMMAND_PALETTE_REMEDIATION_FACTORY_INSPECT_EVENT));

    expect(panel).toHaveFocus();
  });

  it("selects the next ranked finding on Alt+J", () => {
    mockedFindingId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
    mockRankedFindingsQuery({
      data: [
        {
          findingId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
          totalScore: 0.42,
          explanationSummary: "first",
          breakdownJson: "[]",
          controlId: "AC-2",
          patternKey: null,
        },
        {
          findingId: "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee",
          totalScore: 0.2,
          explanationSummary: "second",
          breakdownJson: "[]",
          controlId: "AC-3",
          patternKey: null,
        },
      ],
    });

    render(<RemediationFactoryClient />);

    fireEvent.keyDown(document, { key: "j", altKey: true });

    expect(selectFinding).toHaveBeenCalledWith("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee");
  });

  it("does not throw Alt+E when no finding is selected", () => {
    render(<RemediationFactoryClient />);

    expect(() => {
      fireEvent.keyDown(document, { key: "e", altKey: true });
    }).not.toThrow();
    expect(selectFinding).not.toHaveBeenCalled();
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

  it("clears pathId from the URL when the ranked path view filter hides the selected row", async () => {
    mockedPathId = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
    searchParams = new URLSearchParams("pathView=public-exposure");
    mockRankedPathsQuery();

    render(<RemediationFactoryClient />);

    await waitFor(() => {
      expect(syncSelection).toHaveBeenCalledWith({ pathId: null });
    });
  });
});
