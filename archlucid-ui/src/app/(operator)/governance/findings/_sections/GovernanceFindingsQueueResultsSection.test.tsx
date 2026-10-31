import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { GovernanceFindingsQueueResultsSection } from "@/app/(operator)/governance/findings/_sections/GovernanceFindingsQueueResultsSection";
import type { GovernanceFindingsQueueAssignedToMeShellProps } from "@/app/(operator)/governance/findings/GovernanceFindingsQueueAssignedToMeShell";
import type { GovernanceFindingQueueRow } from "@/app/(operator)/governance/findings/governance-finding-queue-row";

vi.mock("next/navigation", () => ({
  usePathname: () => "/governance/findings",
}));

vi.mock("@/components/product-line/ProductLineProvider", () => ({
  useProductLine: () => ({ productLine: "archlucid" }),
}));

vi.mock("@/components/governance/findings/GovernanceFindingsList", () => ({
  GovernanceFindingsList: () => <div data-testid="governance-findings-list-mock" />,
}));

const findingRow: GovernanceFindingQueueRow = {
  runId: "run-1",
  runLabel: "Prod review",
  manifestId: "",
  findingId: "finding-1",
  title: "Encrypt storage",
  severity: "High",
  category: "Security",
  status: "Open",
  recommended: "Review finding.",
  recordKind: "finding",
};

function buildProps(
  overrides: Partial<GovernanceFindingsQueueAssignedToMeShellProps> = {},
): GovernanceFindingsQueueAssignedToMeShellProps {
  return {
    isAssignedToMe: false,
    mode: "operational",
    buyerPolishedShell: false,
    navHref: "/governance/findings",
    clearReviewScopeHref: "/governance/findings",
    pageTitle: "Findings",
    scopedRunId: "run-1",
    scopedRunFilterActive: true,
    scopedFindingLifecycleCompareHref: null,
    secondaryViewPresentation: null,
    findingsQueueTriageSteps: [],
    findingsQueueTriageEmphasizedStepId: null,
    jobView: "all",
    jobViewFilterActive: false,
    onPickReviewForTriage: () => undefined,
    onSetJobView: () => undefined,
    assignedToMeCountMismatch: false,
    assignedToMeCountData: undefined,
    assignedToMeLoadedFindingCount: 0,
    scopeRecordProjectId: undefined,
    filterBarVisible: false,
    compactRegisterFilterVisible: false,
    advancedFiltersDisclosureVisible: false,
    registerFilter: "all",
    onRegisterFilterChange: () => undefined,
    onJobViewChange: () => undefined,
    savedPresets: [],
    onSaveCurrentFilterAsPreset: () => undefined,
    onRemovePreset: () => undefined,
    groupByResource: false,
    onToggleGroupByResource: () => undefined,
    displayedRows: [findingRow],
    scopedRows: [findingRow],
    registerSummary: {
      openRisks: 0,
      expiringExceptions: 0,
      pendingOwner: 0,
      overdueReview: 0,
    },
    findingsSearchQuery: "",
    onNaturalLanguageFilterApply: () => undefined,
    nlFacets: {},
    onClearAllFilters: () => undefined,
    onShowAllFilteredFindings: () => undefined,
    hiddenFilterHonesty: {
      hiddenCount: 0,
      hiddenDecisionGradeCount: 0,
      line: null,
      hasHidden: false,
    },
    architectureScopeHonesty: { hiddenCount: 0, line: null },
    isWorkingMode: false,
    scopedArchitectureId: null,
    architectureDisplayName: null,
    lastOpenArchitectureId: null,
    onLoadFindingsSavedView: () => undefined,
    loading: false,
    rows: [findingRow],
    filterNoMatchPreset: { testId: "filter-empty", title: "No matches", description: "Adjust filters." },
    activeFiltersSummary: null,
    sponsorSynopsisPackageTitle: "Synopsis",
    sponsorSynopsisCounts: { open: 1, deferred: 0, resolved: 0, dismissed: 0 },
    sponsorHandoffHref: null,
    scopedRunContextTitle: "Prod review",
    continueLastFinding: null,
    assignedToMeOldestFindingTarget: null,
    firstFindingTriageTarget: null,
    hideGenericLowDensity: false,
    onHideGenericLowDensityChange: () => undefined,
    showInsightDensityScore: false,
    selectedFindingIds: new Set(),
    onSelectionChange: () => undefined,
    onBulkApplied: () => undefined,
    loadFailed: false,
    loadFailedPreset: { testId: "load-failed", title: "Failed", description: "Retry." },
    loadFailure: null,
    onRefresh: () => undefined,
    workspaceScopeTeaching: null,
    currentPrincipalName: "Operator",
    currentPrincipalRole: null,
    assignedToMeCheckedAt: null,
    assignedToMeFetchBasis: null,
    currentJobId: "findingsQueue",
    ...overrides,
  };
}

describe("GovernanceFindingsQueueResultsSection", () => {
  it("renders the policy pack assign strip when review scope is active", () => {
    render(<GovernanceFindingsQueueResultsSection {...buildProps()} />);

    expect(screen.getByTestId("policy-pack-assign-from-review-strip")).toBeInTheDocument();
  });

  it("does not render the policy pack assign strip for a whitespace-only scoped run id", () => {
    render(
      <GovernanceFindingsQueueResultsSection
        {...buildProps({ scopedRunId: "   ", scopedRunFilterActive: false })}
      />,
    );

    expect(screen.queryByTestId("policy-pack-assign-from-review-strip")).toBeNull();
  });
});
