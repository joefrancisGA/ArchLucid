import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { GovernanceFindingsQueueAssignedToMeShell } from "./GovernanceFindingsQueueAssignedToMeShell";
import type { GovernanceFindingsQueueAssignedToMeShellProps } from "./GovernanceFindingsQueueAssignedToMeShell";
import { GOVERNANCE_FINDINGS_CLAIM_DISCIPLINE, GOVERNANCE_FINDINGS_FOLLOW_UPS_TITLE } from "@/lib/governance/governance-findings-evidence-copy";
import {
  GOVERNANCE_FINDINGS_BUYER_START_HERE_HELPER,
  GOVERNANCE_FINDINGS_PAGE_LEAD,
  GOVERNANCE_FINDINGS_PRIMARY_CONTENT_ID,
} from "@/lib/governance-findings-page-copy";

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: () => true,
    isOperatorExperienceFullShellEnv: () => false,
  };
});

vi.mock("@/components/WhereToGoNextPreferenceProvider", () => ({
  useWhereToGoNextVisible: () => true,
}));

vi.mock("./_sections/GovernanceFindingsQueueScopeSection", () => ({
  GovernanceFindingsQueueScopeSection: () => <div data-testid="governance-findings-scope-stub" />,
}));

vi.mock("./_sections/GovernanceFindingsQueueToolbarSection", () => ({
  GovernanceFindingsQueueToolbarSection: () => <div data-testid="governance-findings-toolbar-stub" />,
}));

vi.mock("./_sections/GovernanceFindingsQueueResultsSection", () => ({
  GovernanceFindingsQueueResultsSection: () => <div data-testid="governance-findings-results-stub" />,
}));

vi.mock("./_sections/GovernanceFindingsQueueOutcomeSection", () => ({
  GovernanceFindingsQueueOutcomeSection: () => (
    <>
      <div data-testid="governance-findings-empty-state" />
      <div data-testid="governance-findings-orientation-bottom">
        <h2>{GOVERNANCE_FINDINGS_FOLLOW_UPS_TITLE}</h2>
      </div>
    </>
  ),
}));

function buildProps(
  overrides: Partial<GovernanceFindingsQueueAssignedToMeShellProps> = {},
): GovernanceFindingsQueueAssignedToMeShellProps {
  return {
    isAssignedToMe: false,
    mode: "tenant",
    buyerPolishedShell: true,
    navHref: "/governance/findings",
    clearReviewScopeHref: "/governance/findings",
    pageTitle: "Findings",
    scopedRunId: null,
    scopedRunFilterActive: false,
    scopedFindingLifecycleCompareHref: null,
    secondaryViewPresentation: null,
    findingsQueueTriageSteps: [],
    findingsQueueTriageEmphasizedStepId: null,
    jobView: "all",
    jobViewFilterActive: false,
    onPickReviewForTriage: vi.fn(),
    onSetJobView: vi.fn(),
    assignedToMeCountMismatch: false,
    assignedToMeCountData: undefined,
    assignedToMeLoadedFindingCount: 0,
    scopeRecordProjectId: "proj-1",
    filterBarVisible: false,
    compactRegisterFilterVisible: false,
    advancedFiltersDisclosureVisible: false,
    registerFilter: "all",
    onRegisterFilterChange: vi.fn(),
    onJobViewChange: vi.fn(),
    savedPresets: [],
    onSaveCurrentFilterAsPreset: vi.fn(),
    onRemovePreset: vi.fn(),
    groupByResource: false,
    onToggleGroupByResource: vi.fn(),
    displayedRows: [],
    scopedRows: [],
    registerSummary: {
      openRisks: 0,
      expiringExceptions: 0,
      pendingOwner: 0,
      overdueReview: 0,
    },
    findingsSearchQuery: "",
    onNaturalLanguageFilterApply: vi.fn(),
    nlFacets: { severity: null, status: null, titleKeywords: [] },
    onClearAllFilters: vi.fn(),
    onShowAllFilteredFindings: vi.fn(),
    hiddenFilterHonesty: { hiddenCount: 0, line: null },
    architectureScopeHonesty: { hiddenCount: 0, line: null },
    isWorkingMode: false,
    scopedArchitectureId: null,
    lastOpenArchitectureId: null,
    onLoadFindingsSavedView: vi.fn(),
    loading: false,
    rows: [],
    filterNoMatchPreset: { testId: "filter-no-match", title: "No match", description: "None" },
    activeFiltersSummary: null,
    sponsorSynopsisPackageTitle: "",
    sponsorSynopsisCounts: {
      accepted: 0,
      waived: 0,
      deferred: 0,
      open: 0,
    },
    sponsorHandoffHref: null,
    scopedRunContextTitle: null,
    continueLastFinding: null,
    assignedToMeOldestFindingTarget: null,
    firstFindingTriageTarget: null,
    hideGenericLowDensity: false,
    onHideGenericLowDensityChange: vi.fn(),
    showInsightDensityScore: false,
    selectedFindingIds: new Set<string>(),
    onSelectionChange: vi.fn(),
    onBulkApplied: vi.fn(),
    loadFailed: false,
    loadFailedPreset: { testId: "load-failed", title: "Failed", description: "Failed" },
    loadFailure: null,
    onRefresh: vi.fn(),
    workspaceScopeTeaching: null,
    currentPrincipalName: "Jordan Lee",
    currentPrincipalRole: "Architect",
    assignedToMeCheckedAt: null,
    assignedToMeFetchBasis: null,
    currentJobId: "triage-findings",
    ...overrides,
  };
}

describe("GovernanceFindingsQueueAssignedToMeShell buyer-polished shell (GFN)", () => {
  it("renders first-viewport intro and primary content landmark", () => {
    render(<GovernanceFindingsQueueAssignedToMeShell {...buildProps()} />);

    expect(screen.getByTestId("governance-findings-primary-content")).toHaveAttribute(
      "id",
      GOVERNANCE_FINDINGS_PRIMARY_CONTENT_ID,
    );
    expect(screen.getByTestId("governance-findings-first-viewport")).toBeInTheDocument();
    expect(screen.getByTestId("governance-findings-intro")).toHaveTextContent(GOVERNANCE_FINDINGS_PAGE_LEAD);
    expect(screen.getByTestId("governance-findings-buyer-start-here-helper")).toHaveTextContent(
      GOVERNANCE_FINDINGS_BUYER_START_HERE_HELPER,
    );
    expect(screen.getByRole("heading", { level: 2, name: GOVERNANCE_FINDINGS_FOLLOW_UPS_TITLE })).toBeInTheDocument();
    expect(GOVERNANCE_FINDINGS_CLAIM_DISCIPLINE.length).toBeGreaterThan(0);
  });
});
