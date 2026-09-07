import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { GovernanceFindingsQueueScopeSection } from "@/app/(operator)/governance/findings/_sections/GovernanceFindingsQueueScopeSection";
import type { GovernanceFindingsQueueAssignedToMeShellProps } from "@/app/(operator)/governance/findings/GovernanceFindingsQueueAssignedToMeShell";

function buildProps(
  overrides: Partial<GovernanceFindingsQueueAssignedToMeShellProps> = {},
): GovernanceFindingsQueueAssignedToMeShellProps {
  return {
    isAssignedToMe: false,
    mode: "operational",
    buyerPolishedShell: false,
    navHref: "/governance/findings",
    pageTitle: "Findings",
    scopedRunId: "run-1",
    scopedRunFilterActive: false,
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
    displayedRows: [],
    scopedRows: [],
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
    lastOpenArchitectureId: null,
    onLoadFindingsSavedView: () => undefined,
    loading: false,
    rows: [],
    filterNoMatchPreset: { testId: "filter-empty", title: "No matches", description: "Adjust filters." },
    activeFiltersSummary: null,
    sponsorSynopsisPackageTitle: "Synopsis",
    sponsorSynopsisCounts: { open: 0, deferred: 0, resolved: 0, dismissed: 0 },
    sponsorHandoffHref: null,
    scopedRunContextTitle: null,
    continueLastFinding: null,
    assignedToMeOldestFindingTarget: null,
    firstFindingTriageTarget: null,
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

describe("GovernanceFindingsQueueScopeSection", () => {
  it("renders scoped run banner when a review is selected", () => {
    render(<GovernanceFindingsQueueScopeSection {...buildProps()} />);
    expect(screen.getByTestId("governance-findings-run-scope-banner")).toHaveTextContent("run-1");
  });
});
