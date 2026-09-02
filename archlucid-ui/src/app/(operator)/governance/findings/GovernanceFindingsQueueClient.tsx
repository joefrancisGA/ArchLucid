"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import {
  GovernanceFindingsAssignedToMeHeaderActions,
  GovernanceFindingsAssignedToMeHeaderMetadata,
  GovernanceFindingsAssignedToMeStatusBadge,
} from "@/app/(operator)/governance/findings/GovernanceFindingsAssignedToMeChrome";
import { GovernanceFindingsQueueHeader } from "@/app/(operator)/governance/findings/GovernanceFindingsQueueHeader";
import { GovernanceFindingsQueueTableShell } from "@/app/(operator)/governance/findings/GovernanceFindingsQueueTableShell";
import { useGovernanceFindingsQueueMode } from "@/app/(operator)/governance/findings/use-governance-findings-queue-mode";
import { useGovernanceFindingsQueueSavedViews } from "@/app/(operator)/governance/findings/use-governance-findings-queue-saved-views";
import { useGovernanceFindingsQueueTriageTargets } from "@/app/(operator)/governance/findings/use-governance-findings-queue-triage-targets";
import { useGovernanceFindingsSponsorSynopsis } from "@/app/(operator)/governance/findings/use-governance-findings-sponsor-synopsis";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { useGovernanceFindingsFilter } from "@/components/governance/findings/use-governance-findings-filter";
import { useRunDetailWorkspaceContextBundleQuery } from "@/hooks/use-run-detail-workspace-context-bundle-query";
import { useOperatorScopeQueryKey } from "@/hooks/use-operator-scope-query-key";
import { useOperatorScopeRecord } from "@/hooks/use-operator-scope-record";
import { useOperatorNavAuthority } from "@/components/operator/OperatorNavAuthorityProvider";
import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { hasGovernanceApprovalProvenance } from "@/lib/governance/governance-approval-provenance";
import { resolveGovernanceAssignedToMeWorkspaceLabel } from "@/lib/governance/governance-assigned-to-me-empty-state";
import { useGovernanceFindingsQueueFacets } from "@/app/(operator)/governance/findings/use-governance-findings-queue-facets";
import type { GovernanceFindingsQueueMode } from "@/lib/governance/governance-findings-queue-mode";
import { secondaryViewFromGovernanceQueueRow } from "@/lib/canonical-object-home-registry";
import { resolveWorkspaceScopeEmptyTeachingForHub } from "@/lib/workspace-scope-empty-teaching";
import {
  DEFAULT_FINDING_JOB_VIEW,
  resolveEffectiveFindingJobView,
} from "@/lib/findings/finding-job-view";
import {
  computeGovernanceFindingsRegisterSummary,
  deriveGovernanceFindingsActiveFiltersSummary,
  filterGovernanceFindingsDisplayedRows,
  filterGovernanceFindingsScopedRows,
  resolveGovernanceFindingsFilterNoMatchPreset,
  resolveScopedFindingLifecycleCompareHref,
} from "@/app/(operator)/governance/findings/governance-findings-queue-presentation";
import { parseGovernanceFindingsSearchQuery } from "@/lib/governance/governance-findings-queue-search";

export type { GovernanceFindingQueueRow } from "./governance-finding-queue-row";

export type { GovernanceFindingsQueueMode };

export type GovernanceFindingsQueueClientProps = {
  readonly mode?: GovernanceFindingsQueueMode;
};

/**
 * Findings hub: cross-run queue from explainability aggregates, plus a deterministic PHI sample row in public demo mode.
 */
export default function GovernanceFindingsQueueClient({
  mode = "tenant",
}: GovernanceFindingsQueueClientProps) {
  const [selectedFindingIds, setSelectedFindingIds] = useState<ReadonlySet<string>>(new Set());
  const queueMode = useGovernanceFindingsQueueMode({ mode });
  const {
    isAssignedToMe,
    buyerPolishedShell,
    assignedToMeQuery,
    assignedToMeCountQuery,
    rows,
    loading,
    loadFailed,
    refresh,
    assignedToMeFetchBasis,
    assignedToMeCheckedAt,
    loadFailure,
    pageTitle,
    pageSubtitle,
    navHref,
    currentJobId,
    loadFailedPreset,
    assignedToMeCount,
    assignedToMeLoadedFindingCount,
    assignedToMeCountMismatch,
  } = queueMode;

  const { jobView, setJobView, nlFacets, setNlFacets, clearFacetFilters } =
    useGovernanceFindingsQueueFacets(mode);
  const { currentPrincipal } = useOperatorNavAuthority();
  const scopeKey = useOperatorScopeQueryKey();
  const scopeRecord = useOperatorScopeRecord();
  const assignedToMeWorkspaceLabel = useMemo(() => resolveGovernanceAssignedToMeWorkspaceLabel(), [scopeKey.workspaceId]);
  const {
    registerFilter,
    setRegisterFilter,
    scopedRunId,
    savedPresets,
    saveCurrentFilterAsPreset,
    removePreset,
    groupByResource,
    toggleGroupByResource,
    applyGroupByResource,
  } = useGovernanceFindingsFilter({ mode });

  const scopedRunContextQuery = useRunDetailWorkspaceContextBundleQuery(scopedRunId ?? "", {
    enabled: scopedRunId !== null && scopedRunId.length > 0,
  });
  const scopedFindingLifecycleCompareHref = useMemo(
    () =>
      resolveScopedFindingLifecycleCompareHref(
        scopedRunId,
        scopedRunContextQuery.data?.priorCommittedRunId,
      ),
    [scopedRunContextQuery.data?.priorCommittedRunId, scopedRunId],
  );

  const router = useRouter();
  const searchParams = useSearchParams();
  const scopedRunFilterActive = scopedRunId !== null && scopedRunId.trim().length > 0;
  const workspaceScopeTeaching =
    !isAssignedToMe && !scopedRunFilterActive
      ? resolveWorkspaceScopeEmptyTeachingForHub({
          listEmpty: !loading && rows.length === 0 && !loadFailed,
          scopeRecord,
          objectPlural: "findings",
        })
      : null;
  const findingsAdvancedFiltersAvailable = !loading && rows.length > 0 && !isAssignedToMe;
  const filterBarVisible = !buyerPolishedShell && !loading && rows.length > 0;
  const compactRegisterFilterVisible = buyerPolishedShell && !loading && !isAssignedToMe;
  const advancedFiltersDisclosureVisible = buyerPolishedShell && findingsAdvancedFiltersAvailable;
  const effectiveJobView = resolveEffectiveFindingJobView(
    jobView,
    filterBarVisible || advancedFiltersDisclosureVisible,
  );
  const jobViewFilterActive =
    (filterBarVisible || advancedFiltersDisclosureVisible) && jobView !== DEFAULT_FINDING_JOB_VIEW;
  const scopedRows = useMemo(
    () => filterGovernanceFindingsScopedRows(rows, scopedRunId),
    [rows, scopedRunId],
  );
  const findingsSearchQuery = parseGovernanceFindingsSearchQuery(searchParams.get("q"));
  const displayedRows = useMemo(
    () =>
      filterGovernanceFindingsDisplayedRows(
        scopedRows,
        registerFilter,
        nlFacets,
        effectiveJobView,
        findingsSearchQuery,
      ),
    [scopedRows, registerFilter, effectiveJobView, nlFacets, findingsSearchQuery],
  );
  const registerSummary = useMemo(
    () => computeGovernanceFindingsRegisterSummary(scopedRows),
    [scopedRows],
  );

  const {
    onPickReviewForTriage,
    firstFindingTriageTarget,
    continueLastFinding,
    findingsQueueTriageSteps,
    findingsQueueTriageEmphasizedStepId,
    assignedToMeOldestFindingTarget,
  } = useGovernanceFindingsQueueTriageTargets({
    displayedRows,
    rows,
    scopedRunId,
    scopedRunFilterActive,
    isAssignedToMe,
    searchParams,
    navHref,
    router,
  });

  const sponsorSynopsis = useGovernanceFindingsSponsorSynopsis({
    displayedRows,
    scopedRunId,
  });

  const { clearAllFilters, dismissActiveFilterChip, onLoadFindingsSavedView } =
    useGovernanceFindingsQueueSavedViews({
      mode,
      navHref,
      searchParams,
      router,
      setRegisterFilter,
      setJobView,
      setNlFacets,
      applyGroupByResource,
      onPickReviewForTriage,
      clearFacetFilters,
    });

  const filterNoMatchPreset = resolveGovernanceFindingsFilterNoMatchPreset(isAssignedToMe);
  const secondaryViewPresentation =
    displayedRows.length > 0 ? secondaryViewFromGovernanceQueueRow(displayedRows[0]) : null;
  const governanceApprovalProvenance = null;
  const showGovernanceApprovalBanner =
    buyerPolishedShell &&
    !loadFailed &&
    !isAssignedToMe &&
    hasGovernanceApprovalProvenance(governanceApprovalProvenance);
  const activeFiltersSummary = useMemo(
    () =>
      deriveGovernanceFindingsActiveFiltersSummary(
        registerFilter,
        jobView,
        nlFacets,
        jobViewFilterActive,
        findingsSearchQuery,
      ),
    [registerFilter, jobView, nlFacets, jobViewFilterActive, findingsSearchQuery],
  );

  return (
    <OperatorPageContainer variant="dashboard">
      <GovernanceFindingsQueueHeader
        isAssignedToMe={isAssignedToMe}
        buyerPolishedShell={buyerPolishedShell}
        showGovernanceApprovalBanner={showGovernanceApprovalBanner}
        governanceApprovalProvenance={governanceApprovalProvenance}
        pageTitle={pageTitle}
        pageSubtitle={pageSubtitle}
        navHref={navHref}
        assignedToMeStatusBadge={
          isAssignedToMe ? (
            <GovernanceFindingsAssignedToMeStatusBadge
              assignedToMeCount={assignedToMeCount}
              loading={loading}
              loadFailed={loadFailed}
            />
          ) : null
        }
        assignedToMeHeaderMetadata={
          isAssignedToMe ? (
            <GovernanceFindingsAssignedToMeHeaderMetadata
              assignedToMeWorkspaceLabel={assignedToMeWorkspaceLabel}
              assignedToMeCheckedAt={assignedToMeCheckedAt}
              assignedToMeRefreshing={assignedToMeQuery.refreshing}
            />
          ) : undefined
        }
        assignedToMeHeaderActions={
          isAssignedToMe ? (
            <GovernanceFindingsAssignedToMeHeaderActions
              assignedToMeRefreshing={assignedToMeQuery.refreshing}
              onRefresh={refresh}
            />
          ) : (
            <PageContextualHelpButton />
          )
        }
        registerSummary={registerSummary}
        scopedRunId={scopedRunId}
        loading={loading}
        currentJobId={currentJobId}
      />
      <GovernanceFindingsQueueTableShell
        isAssignedToMe={isAssignedToMe}
        mode={mode}
        buyerPolishedShell={buyerPolishedShell}
        navHref={navHref}
        pageTitle={pageTitle}
        scopedRunId={scopedRunId}
        scopedRunFilterActive={scopedRunFilterActive}
        scopedFindingLifecycleCompareHref={scopedFindingLifecycleCompareHref}
        secondaryViewPresentation={secondaryViewPresentation}
        findingsQueueTriageSteps={findingsQueueTriageSteps}
        findingsQueueTriageEmphasizedStepId={findingsQueueTriageEmphasizedStepId}
        jobView={jobView}
        jobViewFilterActive={jobViewFilterActive}
        onPickReviewForTriage={onPickReviewForTriage}
        onSetJobView={setJobView}
        assignedToMeCountMismatch={assignedToMeCountMismatch}
        assignedToMeCountData={assignedToMeCountQuery.data}
        assignedToMeLoadedFindingCount={assignedToMeLoadedFindingCount}
        scopeRecordProjectId={scopeRecord?.projectId}
        filterBarVisible={filterBarVisible}
        compactRegisterFilterVisible={compactRegisterFilterVisible}
        advancedFiltersDisclosureVisible={advancedFiltersDisclosureVisible}
        registerFilter={registerFilter}
        onRegisterFilterChange={setRegisterFilter}
        onJobViewChange={setJobView}
        savedPresets={savedPresets}
        onSaveCurrentFilterAsPreset={saveCurrentFilterAsPreset}
        onRemovePreset={removePreset}
        groupByResource={groupByResource}
        onToggleGroupByResource={toggleGroupByResource}
        displayedRows={displayedRows}
        scopedRows={scopedRows}
        registerSummary={registerSummary}
        findingsSearchQuery={findingsSearchQuery}
        onNaturalLanguageFilterApply={setNlFacets}
        nlFacets={nlFacets}
        onClearAllFilters={clearAllFilters}
        onDismissActiveFilterChip={dismissActiveFilterChip}
        onLoadFindingsSavedView={onLoadFindingsSavedView}
        loading={loading}
        rows={rows}
        filterNoMatchPreset={filterNoMatchPreset}
        activeFiltersSummary={activeFiltersSummary}
        sponsorSynopsisPackageTitle={sponsorSynopsis.sponsorSynopsisPackageTitle}
        sponsorSynopsisCounts={sponsorSynopsis.sponsorSynopsisCounts}
        sponsorHandoffHref={sponsorSynopsis.sponsorHandoffHref}
        scopedRunContextTitle={
          scopedRunContextQuery.data?.recentProjectRuns.find((run) => run.runId === scopedRunId)?.displayName ??
          scopedRunContextQuery.data?.recentProjectRuns.find((run) => run.runId === scopedRunId)?.runId ??
          null
        }
        continueLastFinding={continueLastFinding}
        assignedToMeOldestFindingTarget={assignedToMeOldestFindingTarget}
        firstFindingTriageTarget={firstFindingTriageTarget}
        selectedFindingIds={selectedFindingIds}
        onSelectionChange={setSelectedFindingIds}
        onBulkApplied={() => {
          setSelectedFindingIds(new Set());
          refresh();
        }}
        loadFailed={loadFailed}
        loadFailedPreset={loadFailedPreset}
        loadFailure={loadFailure}
        onRefresh={refresh}
        workspaceScopeTeaching={workspaceScopeTeaching}
        currentPrincipalName={currentPrincipal.name ?? ""}
        currentPrincipalRole={currentPrincipal.primaryAppRole}
        assignedToMeCheckedAt={assignedToMeCheckedAt}
        assignedToMeFetchBasis={assignedToMeFetchBasis}
        currentJobId={currentJobId}
      />
    </OperatorPageContainer>
  );
}
