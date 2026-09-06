"use client";

import { GovernanceFindingsQueueOutcomeSection } from "@/app/(operator)/governance/findings/_sections/GovernanceFindingsQueueOutcomeSection";
import { GovernanceFindingsQueueResultsSection } from "@/app/(operator)/governance/findings/_sections/GovernanceFindingsQueueResultsSection";
import { GovernanceFindingsQueueScopeSection } from "@/app/(operator)/governance/findings/_sections/GovernanceFindingsQueueScopeSection";
import { GovernanceFindingsQueueToolbarSection } from "@/app/(operator)/governance/findings/_sections/GovernanceFindingsQueueToolbarSection";
import type { AssignedToMeOldestFindingTarget, FirstFindingTriageTarget } from "@/app/(operator)/governance/findings/governance-findings-queue-presentation";
import type { EnterpriseCompactEmptyStateProps } from "@/components/EnterpriseCompactEmptyState";
import type { FindingsHiddenFilterHonesty } from "@/lib/findings/findings-hidden-filter-honesty";
import type { GovernanceFindingsFetchFailure } from "@/components/governance/findings/governance-findings-query-fetch";
import type { GovernanceFindingsFilterPreset } from "@/components/governance/findings/governance-findings-filter-presets";
import type { IntegrationConnectChecklistStep } from "@/components/integrations/IntegrationConnectChecklist";
import type { GovernanceFindingQueueRow } from "@/app/(operator)/governance/findings/governance-finding-queue-row";
import type { CanonicalObjectSecondaryViewPresentation } from "@/lib/canonical-object-home-registry";
import type { RiskRegisterFilter } from "@/lib/architecture/architecture-risk-register-page";
import type { ArchitectureRiskRegisterSummary } from "@/lib/architecture/architecture-risk-register-page";
import type { FindingsNaturalLanguageFacets } from "@/lib/findings/findings-natural-language-filter";
import type { FindingJobView } from "@/lib/findings/finding-job-view";
import { GOVERNANCE_FINDINGS_PRIMARY_CONTENT_ID } from "@/lib/governance-findings-page-copy";
import { GOVERNANCE_ASSIGNED_TO_ME_PRIMARY_CONTENT_ID } from "@/lib/governance/governance-assigned-to-me-page-copy";
import type { GovernanceFindingsQueueMode } from "@/lib/governance/governance-findings-queue-mode";
import type { GovernanceJobId } from "@/lib/governance/governance-job-router";
import type { GovernanceAssignedToMeFetchBasis } from "@/lib/governance/governance-assigned-to-me-fetch-basis";
import { OPERATOR_LAYOUT } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type GovernanceFindingsQueueAssignedToMeShellProps = {
  readonly isAssignedToMe: boolean;
  readonly mode: GovernanceFindingsQueueMode;
  readonly buyerPolishedShell: boolean;
  readonly navHref: string;
  readonly pageTitle: string;
  readonly scopedRunId: string | null;
  readonly scopedRunFilterActive: boolean;
  readonly scopedFindingLifecycleCompareHref: string | null;
  readonly secondaryViewPresentation: CanonicalObjectSecondaryViewPresentation | null;
  readonly findingsQueueTriageSteps: readonly IntegrationConnectChecklistStep[];
  readonly findingsQueueTriageEmphasizedStepId: string | null;
  readonly jobView: FindingJobView;
  readonly jobViewFilterActive: boolean;
  readonly onPickReviewForTriage: (reviewId: string) => void;
  readonly onSetJobView: (next: FindingJobView) => void;
  readonly assignedToMeCountMismatch: boolean;
  readonly assignedToMeCountData: number | undefined;
  readonly assignedToMeLoadedFindingCount: number;
  readonly scopeRecordProjectId: string | undefined;
  readonly filterBarVisible: boolean;
  readonly compactRegisterFilterVisible: boolean;
  readonly advancedFiltersDisclosureVisible: boolean;
  readonly registerFilter: RiskRegisterFilter;
  readonly onRegisterFilterChange: (next: RiskRegisterFilter) => void;
  readonly onJobViewChange: (next: FindingJobView) => void;
  readonly savedPresets: readonly GovernanceFindingsFilterPreset[];
  readonly onSaveCurrentFilterAsPreset: () => void;
  readonly onRemovePreset: (id: string) => void;
  readonly groupByResource: boolean;
  readonly onToggleGroupByResource: () => void;
  readonly displayedRows: readonly GovernanceFindingQueueRow[];
  readonly scopedRows: readonly GovernanceFindingQueueRow[];
  readonly registerSummary: ArchitectureRiskRegisterSummary;
  readonly findingsSearchQuery: string;
  readonly onNaturalLanguageFilterApply: (next: FindingsNaturalLanguageFacets) => void;
  readonly nlFacets: FindingsNaturalLanguageFacets;
  readonly onClearAllFilters: () => void;
  readonly onShowAllFilteredFindings: () => void;
  readonly hiddenFilterHonesty: FindingsHiddenFilterHonesty;
  readonly onLoadFindingsSavedView: (view: import("@/lib/api/operator-saved-views").OperatorSavedView) => void;
  readonly loading: boolean;
  readonly rows: readonly GovernanceFindingQueueRow[];
  readonly filterNoMatchPreset: EnterpriseCompactEmptyStateProps;
  readonly activeFiltersSummary: string | null;
  readonly sponsorSynopsisPackageTitle: string;
  readonly sponsorSynopsisCounts: ReturnType<
    typeof import("@/lib/sponsor-story-synopsis").buildSponsorStoryDispositionCountsFromRows
  >;
  readonly sponsorHandoffHref: string | null;
  readonly scopedRunContextTitle: string | null;
  readonly continueLastFinding: ReturnType<
    typeof import("@/lib/resolve-continue-last-governance-finding").resolveContinueLastGovernanceFinding
  >;
  readonly assignedToMeOldestFindingTarget: AssignedToMeOldestFindingTarget | null;
  readonly firstFindingTriageTarget: FirstFindingTriageTarget | null;
  readonly hideGenericLowDensity: boolean;
  readonly onHideGenericLowDensityChange: (next: boolean) => void;
  readonly showInsightDensityScore: boolean;
  readonly selectedFindingIds: ReadonlySet<string>;
  readonly onSelectionChange: (next: ReadonlySet<string>) => void;
  readonly onBulkApplied: () => void;
  readonly loadFailed: boolean;
  readonly loadFailedPreset: EnterpriseCompactEmptyStateProps;
  readonly loadFailure: GovernanceFindingsFetchFailure | null;
  readonly onRefresh: () => void;
  readonly workspaceScopeTeaching: {
    readonly title: string;
    readonly body: string;
    readonly ctaLabel: string;
  } | null;
  readonly currentPrincipalName: string;
  readonly currentPrincipalRole: string | null;
  readonly assignedToMeCheckedAt: Date | null;
  readonly assignedToMeFetchBasis: GovernanceAssignedToMeFetchBasis | null;
  readonly currentJobId: GovernanceJobId;
};

export function GovernanceFindingsQueueAssignedToMeShell(
  props: GovernanceFindingsQueueAssignedToMeShellProps,
): React.JSX.Element {
  const primaryContentId =
    props.isAssignedToMe && props.buyerPolishedShell
      ? GOVERNANCE_ASSIGNED_TO_ME_PRIMARY_CONTENT_ID
      : !props.isAssignedToMe
        ? GOVERNANCE_FINDINGS_PRIMARY_CONTENT_ID
        : undefined;

  return (
    <div
      id={primaryContentId}
      className={cn("mt-4 scroll-mt-24", OPERATOR_LAYOUT.sectionStack)}
      data-testid="governance-findings-queue-body"
    >
      <GovernanceFindingsQueueScopeSection {...props} />
      <GovernanceFindingsQueueToolbarSection {...props} />
      <GovernanceFindingsQueueResultsSection {...props} />
      <GovernanceFindingsQueueOutcomeSection {...props} />
    </div>
  );
}
