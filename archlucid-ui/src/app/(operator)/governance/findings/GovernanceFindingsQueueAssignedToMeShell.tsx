"use client";

import Link from "next/link";

import {
  GovernanceFindingsAssignedToMeCountMismatchBanner,
} from "@/app/(operator)/governance/findings/GovernanceFindingsAssignedToMeChrome";
import { GovernanceFindingsContinueLastViewedRow } from "@/app/(operator)/governance/findings/GovernanceFindingsContinueLastViewedRow";
import type { AssignedToMeOldestFindingTarget, FirstFindingTriageTarget } from "@/app/(operator)/governance/findings/governance-findings-queue-presentation";
import type { EnterpriseCompactEmptyStateProps } from "@/components/EnterpriseCompactEmptyState";
import { EnterpriseCompactEmptyState } from "@/components/EnterpriseCompactEmptyState";
import { EnterpriseInlineErrorNotification } from "@/components/EnterpriseInlineErrorNotification";
import { GovernanceFindingsBuyerChrome } from "@/components/governance/findings/GovernanceFindingsBuyerChrome";
import { GovernanceFindingsFilterBar } from "@/components/governance/findings/GovernanceFindingsFilterBar";
import { FindingsQueuePickReviewBeforeTriageStrip } from "@/components/governance/findings/FindingsQueuePickReviewBeforeTriageStrip";
import { GovernanceFindingsList } from "@/components/governance/findings/GovernanceFindingsList";
import { GovernanceFindingsQueueActiveFilterChips } from "@/components/governance/findings/GovernanceFindingsQueueActiveFilterChips";
import { GovernanceFindingsQueueNextReviewFooterClient } from "@/components/governance/findings/GovernanceFindingsQueueNextReviewFooterClient";
import { GovernanceFindingsRelatedQueuesDisclosure } from "@/components/governance/findings/GovernanceFindingsRelatedQueuesDisclosure";
import { PolicyPackAssignFromReviewStrip } from "@/components/governance/PolicyPackAssignFromReviewStrip";
import { ArchitecturePosturePillarOverview } from "@/components/governance/posture/ArchitecturePosturePillarOverview";
import { IntegrationConnectChecklist } from "@/components/integrations/IntegrationConnectChecklist";
import { SponsorStorySynopsisFromCounts } from "@/components/operator/SponsorStorySynopsisPanel";
import { CanonicalObjectSecondaryViewStrip } from "@/components/usability/CanonicalObjectSecondaryViewStrip";
import { AssignedToMeContinueOldestFindingStrip } from "@/components/usability/AssignedToMeContinueOldestFindingStrip";
import { FindingsTriageFirstFindingStrip } from "@/components/usability/FindingsTriageFirstFindingStrip";
import { WorkspaceScopeEmptyTeaching } from "@/components/WorkspaceScopeEmptyTeaching";
import { Button } from "@/components/ui/button";
import {
  ARCHITECTURE_RISK_REGISTER_EMPTY_BODY,
  ARCHITECTURE_RISK_REGISTER_EMPTY_TITLE,
  ARCHITECTURE_RISK_REGISTER_POLICY_PACKS_HREF,
} from "@/lib/architecture/architecture-risk-register-page";
import {
  BUYER_RISK_REGISTER_EMPTY_BODY,
  BUYER_RISK_REGISTER_EMPTY_SECONDARY_ACTION,
  BUYER_RISK_REGISTER_EMPTY_TITLE,
} from "@/lib/buyer/buyer-polish-copy";
import type { CanonicalObjectSecondaryViewPresentation } from "@/lib/canonical-object-home-registry";
import { COMPARE_FINDING_LIFECYCLE_ANCHOR } from "@/lib/compare-finding-lifecycle";
import { comparePageHrefAdaptive } from "@/lib/compare-url-query-params";
import { OPERATOR_LAYOUT, OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { GOVERNANCE_ASSIGNED_TO_ME_FINDINGS_EMPTY_COMPACT } from "@/lib/enterprise-compact-empty-state-presets";
import type { GovernanceFindingsFetchFailure } from "@/components/governance/findings/governance-findings-query-fetch";
import {
  buildGovernanceAssignedToMeEmptyDescription,
  GOVERNANCE_ASSIGNED_TO_ME_EMPTY_SECONDARY_HREF,
  GOVERNANCE_ASSIGNED_TO_ME_EMPTY_SECONDARY_LABEL,
} from "@/lib/governance/governance-assigned-to-me-empty-state";
import type { GovernanceAssignedToMeFetchBasis } from "@/lib/governance/governance-assigned-to-me-fetch-basis";
import { GOVERNANCE_FINDINGS_PRIMARY_CONTENT_ID } from "@/lib/governance-findings-page-copy";
import type { GovernanceFindingsQueueMode } from "@/lib/governance/governance-findings-queue-mode";
import type { GovernanceJobId } from "@/lib/governance/governance-job-router";
import type { FindingsNaturalLanguageFacets } from "@/lib/findings/findings-natural-language-filter";
import {
  DEFAULT_FINDING_JOB_VIEW,
  FINDING_JOB_VIEW_LABELS,
  type FindingJobView,
} from "@/lib/findings/finding-job-view";
import type { RiskRegisterFilter } from "@/lib/architecture/architecture-risk-register-page";
import type { GovernanceFindingQueueRow } from "@/app/(operator)/governance/findings/governance-finding-queue-row";
import { cn } from "@/lib/utils";

import type { GovernanceFindingsFilterPreset } from "@/components/governance/findings/governance-findings-filter-presets";
import type { IntegrationConnectChecklistStep } from "@/components/integrations/IntegrationConnectChecklist";

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
  readonly onNaturalLanguageFilterApply: (next: FindingsNaturalLanguageFacets) => void;
  readonly nlFacets: FindingsNaturalLanguageFacets;
  readonly onClearAllFilters: () => void;
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
) {
  const {
    isAssignedToMe,
    mode,
    buyerPolishedShell,
    navHref,
    pageTitle,
    scopedRunId,
    scopedRunFilterActive,
    scopedFindingLifecycleCompareHref,
    secondaryViewPresentation,
    findingsQueueTriageSteps,
    findingsQueueTriageEmphasizedStepId,
    jobView,
    jobViewFilterActive,
    onPickReviewForTriage,
    onSetJobView,
    assignedToMeCountMismatch,
    assignedToMeCountData,
    assignedToMeLoadedFindingCount,
    scopeRecordProjectId,
    filterBarVisible,
    registerFilter,
    onRegisterFilterChange,
    onJobViewChange,
    savedPresets,
    onSaveCurrentFilterAsPreset,
    onRemovePreset,
    groupByResource,
    onToggleGroupByResource,
    displayedRows,
    scopedRows,
    onNaturalLanguageFilterApply,
    nlFacets,
    onClearAllFilters,
    loading,
    rows,
    filterNoMatchPreset,
    activeFiltersSummary,
    sponsorSynopsisPackageTitle,
    sponsorSynopsisCounts,
    sponsorHandoffHref,
    scopedRunContextTitle,
    continueLastFinding,
    assignedToMeOldestFindingTarget,
    firstFindingTriageTarget,
    selectedFindingIds,
    onSelectionChange,
    onBulkApplied,
    loadFailed,
    loadFailedPreset,
    loadFailure,
    onRefresh,
    workspaceScopeTeaching,
    currentPrincipalName,
    currentPrincipalRole,
    assignedToMeCheckedAt,
    assignedToMeFetchBasis,
    currentJobId,
  } = props;

  return (
    <div
      id={!isAssignedToMe ? GOVERNANCE_FINDINGS_PRIMARY_CONTENT_ID : undefined}
      className={cn("mt-4 scroll-mt-24", OPERATOR_LAYOUT.sectionStack)}
      data-testid="governance-findings-queue-body"
    >
      {secondaryViewPresentation !== null ? (
        <CanonicalObjectSecondaryViewStrip
          presentation={secondaryViewPresentation}
          testId="governance-findings-secondary-view-strip"
          className="mb-1"
        />
      ) : null}

      {scopedRunId ? (
        <p
          className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}
          data-testid="governance-findings-run-scope-banner"
        >
          {"Showing findings for review "}
          <span className="font-mono text-al-text-primary">{scopedRunId}</span>
          {" · "}
          <Link className={OPERATOR_LINK.inline} href={navHref}>
            Clear review scope
          </Link>
          {" · "}
          <Link className={OPERATOR_LINK.inline} href={`/architecture/reviews/${encodeURIComponent(scopedRunId)}`}>
            Open review
          </Link>
          {" · "}
          <Link
            className={OPERATOR_LINK.inline}
            href={
              scopedFindingLifecycleCompareHref ??
              `${comparePageHrefAdaptive("", scopedRunId)}#${COMPARE_FINDING_LIFECYCLE_ANCHOR}`
            }
          >
            Compare with prior review (finding lifecycle)
          </Link>
        </p>
      ) : scopedRunId === null || scopedRunId.length === 0 ? (
        <FindingsQueuePickReviewBeforeTriageStrip
          selectedReviewId=""
          onSelectReview={onPickReviewForTriage}
        />
      ) : null}

      {scopedRunFilterActive ? (
        <IntegrationConnectChecklist
          title="Triage checklist"
          steps={findingsQueueTriageSteps}
          emphasizedStepId={findingsQueueTriageEmphasizedStepId ?? ""}
          testIdPrefix="findings-queue-triage"
        />
      ) : null}

      {jobViewFilterActive ? (
        <p
          className={cn("m-0 flex flex-wrap items-center gap-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
          data-testid="governance-findings-job-view-filter-chip"
        >
          <span>
            Filtered by job view:{" "}
            <span className="font-medium text-al-text-primary">{FINDING_JOB_VIEW_LABELS[jobView]}</span>
          </span>
          <Button type="button" size="sm" variant="outline" onClick={() => onSetJobView(DEFAULT_FINDING_JOB_VIEW)}>
            Clear job view filter
          </Button>
        </p>
      ) : null}

      {assignedToMeCountMismatch ? (
        <GovernanceFindingsAssignedToMeCountMismatchBanner
          assignedToMeCountData={assignedToMeCountData}
          assignedToMeLoadedFindingCount={assignedToMeLoadedFindingCount}
        />
      ) : null}

      {!isAssignedToMe ? (
        <ArchitecturePosturePillarOverview projectId={scopeRecordProjectId} enabled />
      ) : null}

      {filterBarVisible ? (
        <>
          <GovernanceFindingsFilterBar
            registerFilter={registerFilter}
            onRegisterFilterChange={onRegisterFilterChange}
            jobView={jobView}
            onJobViewChange={onJobViewChange}
            savedPresets={savedPresets}
            onSaveCurrentFilterAsPreset={onSaveCurrentFilterAsPreset}
            onRemovePreset={onRemovePreset}
            groupByResource={groupByResource}
            onToggleGroupByResource={onToggleGroupByResource}
            displayedRows={displayedRows}
            filterableRows={scopedRows}
            onNaturalLanguageFilterApply={onNaturalLanguageFilterApply}
          />
          <GovernanceFindingsQueueActiveFilterChips
            registerFilter={registerFilter}
            jobView={jobView}
            nlFacets={nlFacets}
            jobViewFilterActive={jobViewFilterActive}
            onClearAll={onClearAllFilters}
          />
        </>
      ) : null}

      {loading ? (
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>Loading findings…</p>
      ) : null}

      {!loading && rows.length > 0 && displayedRows.length === 0 ? (
        <EnterpriseCompactEmptyState
          {...filterNoMatchPreset}
          description={
            activeFiltersSummary !== null
              ? `${filterNoMatchPreset.description} Active filters: ${activeFiltersSummary}.`
              : filterNoMatchPreset.description
          }
        />
      ) : null}

      {!loading && displayedRows.length > 0 ? (
        <>
          <SponsorStorySynopsisFromCounts
            packageTitle={sponsorSynopsisPackageTitle}
            counts={sponsorSynopsisCounts}
            sponsorHandoffHref={sponsorHandoffHref}
          />
          {scopedRunId !== null && scopedRunId.length > 0 ? (
            <PolicyPackAssignFromReviewStrip
              reviewId={scopedRunId}
              reviewTitle={scopedRunContextTitle}
            />
          ) : null}
          {continueLastFinding !== null ? (
            <GovernanceFindingsContinueLastViewedRow target={continueLastFinding} />
          ) : null}
          {assignedToMeOldestFindingTarget !== null ? (
            <AssignedToMeContinueOldestFindingStrip
              target={assignedToMeOldestFindingTarget.target}
              href={assignedToMeOldestFindingTarget.href}
            />
          ) : null}
          {firstFindingTriageTarget !== null ? (
            <FindingsTriageFirstFindingStrip
              findingId={firstFindingTriageTarget.findingId}
              findingTitle={firstFindingTriageTarget.findingTitle}
              href={firstFindingTriageTarget.href}
            />
          ) : null}
          <GovernanceFindingsList
            displayedRows={displayedRows}
            buyerPolishedShell={buyerPolishedShell}
            groupByResource={groupByResource}
            queueMode={mode}
            selectedFindingIds={selectedFindingIds}
            onSelectionChange={onSelectionChange}
            onBulkApplied={onBulkApplied}
          />
        </>
      ) : null}

      {!loading && rows.length === 0 && loadFailed ? (
        <EnterpriseInlineErrorNotification
          testId={loadFailedPreset.testId}
          title={
            !isAssignedToMe && buyerPolishedShell
              ? "Could not load findings for this workspace"
              : loadFailedPreset.title
          }
          description={
            !isAssignedToMe && buyerPolishedShell
              ? "The findings queue did not load. Your existing findings are unchanged — retry the load or check connectivity before navigating away."
              : loadFailedPreset.description
          }
          onRetry={() => {
            onRefresh();
          }}
          diagnostics={
            loadFailure === null
              ? null
              : {
                  attemptedAtUtc: loadFailure.attemptedAtUtc,
                  correlationId: loadFailure.correlationId,
                  errorCode: loadFailure.errorCode,
                  httpStatus: loadFailure.httpStatus,
                }
          }
          reportProblem={{
            surfaceId: "governance-findings-queue-hard-failure",
            errorTitle: pageTitle,
            errorCode: loadFailure?.errorCode ?? "governance-findings-load-failed",
            correlationId: loadFailure?.correlationId ?? null,
            httpStatus: loadFailure?.httpStatus ?? null,
          }}
        />
      ) : null}

      {!loading && rows.length === 0 && !loadFailed ? (
        workspaceScopeTeaching !== null ? (
          <WorkspaceScopeEmptyTeaching
            title={workspaceScopeTeaching.title}
            body={workspaceScopeTeaching.body}
            ctaLabel={workspaceScopeTeaching.ctaLabel}
          />
        ) : (
          <EnterpriseCompactEmptyState
            testId="governance-findings-empty-state"
            title={
              isAssignedToMe
                ? GOVERNANCE_ASSIGNED_TO_ME_FINDINGS_EMPTY_COMPACT.title
                : buyerPolishedShell
                  ? BUYER_RISK_REGISTER_EMPTY_TITLE
                  : ARCHITECTURE_RISK_REGISTER_EMPTY_TITLE
            }
            description={
              isAssignedToMe
                ? buildGovernanceAssignedToMeEmptyDescription({
                    assigneeDisplayName: currentPrincipalName,
                    assigneeRoleLabel: currentPrincipalRole,
                    checkedAt: assignedToMeCheckedAt,
                    fetchBasis: assignedToMeFetchBasis,
                  })
                : buyerPolishedShell
                  ? BUYER_RISK_REGISTER_EMPTY_BODY
                  : ARCHITECTURE_RISK_REGISTER_EMPTY_BODY
            }
            actions={
              isAssignedToMe
                ? undefined
                : [
                    { label: "Open reviews", href: "/architecture/reviews", variant: "primary" },
                    {
                      label: buyerPolishedShell
                        ? BUYER_RISK_REGISTER_EMPTY_SECONDARY_ACTION
                        : "Open resolve outcomes",
                      href: "/governance/approval-queue",
                      variant: "outline",
                    },
                  ]
            }
            footer={
              isAssignedToMe ? (
                <Button asChild size="sm" variant="primary">
                  <Link href={GOVERNANCE_ASSIGNED_TO_ME_EMPTY_SECONDARY_HREF}>
                    {GOVERNANCE_ASSIGNED_TO_ME_EMPTY_SECONDARY_LABEL}
                  </Link>
                </Button>
              ) : !buyerPolishedShell ? (
                <Link className={OPERATOR_LINK.inline} href={ARCHITECTURE_RISK_REGISTER_POLICY_PACKS_HREF}>
                  View policy packs
                </Link>
              ) : undefined
            }
          />
        )
      ) : null}

      {isAssignedToMe ? (
        <GovernanceFindingsRelatedQueuesDisclosure
          capabilitySurfaceId="assignedFindings"
          jobRouterCurrentJobId={currentJobId}
        />
      ) : null}

      {!isAssignedToMe && buyerPolishedShell ? (
        <GovernanceFindingsBuyerChrome scopedRunId={scopedRunId} />
      ) : null}

      {scopedRunFilterActive && scopedRunId !== null ? (
        <GovernanceFindingsQueueNextReviewFooterClient runId={scopedRunId} />
      ) : null}
    </div>
  );
}
