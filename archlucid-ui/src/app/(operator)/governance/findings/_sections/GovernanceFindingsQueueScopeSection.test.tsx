import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { architectureNestedFindingsPath } from "@/lib/architecture/architecture-routes";

import { GovernanceFindingsQueueScopeSection } from "@/app/(operator)/governance/findings/_sections/GovernanceFindingsQueueScopeSection";
import type { GovernanceFindingsQueueAssignedToMeShellProps } from "@/app/(operator)/governance/findings/GovernanceFindingsQueueAssignedToMeShell";

const pathnameMock = vi.hoisted(() => ({ value: "/governance/findings" }));

vi.mock("next/navigation", () => ({
  usePathname: () => pathnameMock.value,
}));

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
    architectureDisplayName: null,
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

  it("IP-011: hides run-scope Open review banner on inhabited nested findings", () => {
    pathnameMock.value = architectureNestedFindingsPath("architecture-identity-001");

    render(
      <GovernanceFindingsQueueScopeSection
        {...buildProps({
          isWorkingMode: true,
          scopedArchitectureId: "architecture-identity-001",
          architectureDisplayName: "Payments platform",
          scopedRunId: "run-1",
        })}
      />,
    );

    expect(screen.queryByTestId("governance-findings-run-scope-banner")).toBeNull();
    expect(screen.queryByRole("link", { name: "Open review" })).toBeNull();
  });

  it("clear review scope link preserves register filters", () => {
    render(
      <GovernanceFindingsQueueScopeSection
        {...buildProps({ clearReviewScopeHref: "/governance/findings?filter=open" })}
      />,
    );

    expect(screen.getByRole("link", { name: "Clear review scope" })).toHaveAttribute(
      "href",
      "/governance/findings?filter=open",
    );
  });
});
