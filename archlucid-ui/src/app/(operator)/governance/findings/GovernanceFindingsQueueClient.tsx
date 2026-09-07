"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import {
  GovernanceFindingsAssignedToMeHeaderActions,
  GovernanceFindingsAssignedToMeHeaderMetadata,
  GovernanceFindingsAssignedToMeStatusBadge,
} from "@/app/(operator)/governance/findings/GovernanceFindingsAssignedToMeChrome";
import { GovernanceFindingsQueueTableShell } from "@/app/(operator)/governance/findings/GovernanceFindingsQueueTableShell";
import { useGovernanceFindingsQueueBulkActions } from "@/app/(operator)/governance/findings/use-governance-findings-queue-bulk-actions";
import { GovernanceFindingsQueueHeader } from "@/app/(operator)/governance/findings/GovernanceFindingsQueueHeader";
import { useGovernanceFindingsQueueMode } from "@/app/(operator)/governance/findings/use-governance-findings-queue-mode";
import { useGovernanceFindingsQueueSynopsis } from "@/app/(operator)/governance/findings/use-governance-findings-queue-synopsis";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import {
  applyFindingsSavedViewFilters,
} from "@/components/governance/findings/GovernanceFindingsSavedViewsBar";
import { useGovernanceFindingsFilter } from "@/components/governance/findings/use-governance-findings-filter";
import type { OperatorSavedView } from "@/lib/api/operator-saved-views";
import type { FindingsSavedViewFilters } from "@/lib/operator/operator-saved-view-types";
import { useArchitectureDraftRegistryEntries } from "@/hooks/use-architecture-draft-registry-entries";
import { useArchitectureIdentityQuery } from "@/hooks/use-architecture-identity-query";
import { useRunDetailWorkspaceContextBundleQuery } from "@/hooks/use-run-detail-workspace-context-bundle-query";
import { useOperatorScopeRecord } from "@/hooks/use-operator-scope-record";
import { useOperatorNavAuthority } from "@/components/operator/OperatorNavAuthorityProvider";
import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { hasGovernanceApprovalProvenance } from "@/lib/governance/governance-approval-provenance";
import { resolveGovernanceAssignedToMeWorkspaceLabel } from "@/lib/governance/governance-assigned-to-me-empty-state";
import { useGovernanceFindingsQueueFacets } from "@/app/(operator)/governance/findings/use-governance-findings-queue-facets";
import type { GovernanceFindingsQueueMode } from "@/lib/governance/governance-findings-queue-mode";
import {
  resolveScopedFindingLifecycleCompareHref,
} from "@/app/(operator)/governance/findings/governance-findings-queue-presentation";
import { GOVERNANCE_ASSIGNED_TO_ME_FINDINGS_PATH, GOVERNANCE_FINDINGS_PATH } from "@/lib/governance/governance-route-paths";
import { parseGovernanceFindingsSearchQuery, governanceFindingsSearchHrefFromSearch } from "@/lib/governance/governance-findings-queue-search";
import { buildGovernanceFindingsArchitectureRunIdSet } from "@/lib/governance/governance-findings-architecture-scope";
import { useGovernanceFindingsHideGenericState } from "@/hooks/use-governance-findings-hide-generic-state";
import { usePrefetchItsmFindingCorrelations } from "@/lib/use-itsm-finding-correlations";
import { useWorkspaceMode } from "@/components/WorkspaceModeProvider";

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
  const router = useRouter();
  const pathname = usePathname() ?? (mode === "assigned-to-me" ? GOVERNANCE_ASSIGNED_TO_ME_FINDINGS_PATH : GOVERNANCE_FINDINGS_PATH);
  const searchParams = useSearchParams();
  const { hideGenericLowDensity, setHideGenericLowDensity } = useGovernanceFindingsHideGenericState();
  const { jobView, setJobView, nlFacets, setNlFacets, clearFacetFilters } =
    useGovernanceFindingsQueueFacets(mode);
  const { currentPrincipal } = useOperatorNavAuthority();
  const scopeRecord = useOperatorScopeRecord();
  const assignedToMeWorkspaceLabel = resolveGovernanceAssignedToMeWorkspaceLabel();
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
  const bulkActions = useGovernanceFindingsQueueBulkActions({ refresh, mode });
  const { isWorkingMode } = useWorkspaceMode();
  const {
    registerFilter,
    setRegisterFilter,
    scopedRunId,
    scopedArchitectureId,
    architectureScopeFilterActive,
    lastOpenArchitectureId,
    savedPresets,
    saveCurrentFilterAsPreset,
    removePreset,
    groupByResource,
    toggleGroupByResource,
    applyGroupByResource,
  } = useGovernanceFindingsFilter({ mode, isWorkingMode });
  const draftRegistryEntries = useArchitectureDraftRegistryEntries();
  const architectureIdentityQuery = useArchitectureIdentityQuery(
    scopedArchitectureId ?? "",
    architectureScopeFilterActive && (scopedArchitectureId?.trim().length ?? 0) > 0,
  );
  const architectureRunIdSet = useMemo(() => {
    if (!architectureScopeFilterActive || scopedArchitectureId === null) {
      return null;
    }

    return buildGovernanceFindingsArchitectureRunIdSet({
      architectureId: scopedArchitectureId,
      architectureReviews: architectureIdentityQuery.data?.reviews ?? [],
      draftRegistryEntries,
    });
  }, [
    architectureIdentityQuery.data?.reviews,
    architectureScopeFilterActive,
    draftRegistryEntries,
    scopedArchitectureId,
  ]);

  const scopedRunContextQuery = useRunDetailWorkspaceContextBundleQuery(scopedRunId ?? "", {
    enabled: scopedRunId !== null && scopedRunId.length > 0,
  });
  const scopedFindingLifecycleCompareHref = resolveScopedFindingLifecycleCompareHref(
    scopedRunId,
    scopedRunContextQuery.data?.priorCommittedRunId,
  );

  const findingsSearchQuery = parseGovernanceFindingsSearchQuery(searchParams.get("q"));
  const synopsis = useGovernanceFindingsQueueSynopsis({
    mode,
    isAssignedToMe,
    buyerPolishedShell,
    rows,
    loading,
    loadFailed,
    scopedRunId,
    architectureRunIdSet,
    architectureScopeFilterActive,
    registerFilter,
    nlFacets,
    jobView,
    findingsSearchQuery,
    hideGenericLowDensity,
    isWorkingMode,
    scopeRecord,
  });
  usePrefetchItsmFindingCorrelations(synopsis.findingIds);

  const clearAllFilters = useCallback((): void => {
    setRegisterFilter("all");
    clearFacetFilters();
    router.replace(governanceFindingsSearchHrefFromSearch(searchParams.toString(), "", navHref), { scroll: false });
  }, [clearFacetFilters, navHref, router, searchParams, setRegisterFilter]);

  const showAllFilteredFindings = useCallback((): void => {
    setHideGenericLowDensity(false);
    clearAllFilters();
  }, [clearAllFilters, setHideGenericLowDensity]);

  const onPickReviewForTriage = useCallback(
    (reviewId: string) => {
      const trimmed = reviewId.trim();

      if (trimmed.length === 0) {
        return;
      }

      const params = new URLSearchParams(searchParams.toString());
      params.set("runId", trimmed);
      router.replace(`${navHref}?${params.toString()}`, { scroll: false });
    },
    [navHref, router, searchParams],
  );

  const governanceApprovalProvenance = null;
  const showGovernanceApprovalBanner =
    buyerPolishedShell &&
    !loadFailed &&
    !isAssignedToMe &&
    hasGovernanceApprovalProvenance(governanceApprovalProvenance);

  const onLoadFindingsSavedView = useCallback(
    (view: OperatorSavedView) => {
      const filters = view.payload.filters as FindingsSavedViewFilters;
      const applied = applyFindingsSavedViewFilters(filters);

      setRegisterFilter(applied.registerFilter);
      setJobView(applied.jobView);
      setNlFacets(applied.nlFacets);
      applyGroupByResource(applied.groupByResource);

      if (applied.scopedRunId !== null && applied.scopedRunId.trim().length > 0) {
        onPickReviewForTriage(applied.scopedRunId);
      }
    },
    [applyGroupByResource, onPickReviewForTriage, setJobView, setNlFacets, setRegisterFilter],
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
        registerSummary={synopsis.registerSummary}
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
        scopedRunFilterActive={synopsis.scopedRunFilterActive}
        scopedFindingLifecycleCompareHref={scopedFindingLifecycleCompareHref}
        secondaryViewPresentation={synopsis.secondaryViewPresentation}
        findingsQueueTriageSteps={synopsis.findingsQueueTriageSteps}
        findingsQueueTriageEmphasizedStepId={synopsis.findingsQueueTriageEmphasizedStepId}
        jobView={jobView}
        jobViewFilterActive={synopsis.jobViewFilterActive}
        onPickReviewForTriage={onPickReviewForTriage}
        onSetJobView={setJobView}
        assignedToMeCountMismatch={assignedToMeCountMismatch}
        assignedToMeCountData={assignedToMeCountQuery.data}
        assignedToMeLoadedFindingCount={assignedToMeLoadedFindingCount}
        scopeRecordProjectId={scopeRecord?.projectId}
        filterBarVisible={synopsis.filterBarVisible}
        compactRegisterFilterVisible={synopsis.compactRegisterFilterVisible}
        advancedFiltersDisclosureVisible={synopsis.advancedFiltersDisclosureVisible}
        registerFilter={registerFilter}
        onRegisterFilterChange={setRegisterFilter}
        onJobViewChange={setJobView}
        savedPresets={savedPresets}
        onSaveCurrentFilterAsPreset={saveCurrentFilterAsPreset}
        onRemovePreset={removePreset}
        groupByResource={groupByResource}
        onToggleGroupByResource={toggleGroupByResource}
        displayedRows={synopsis.displayedRows}
        scopedRows={synopsis.scopedRows}
        registerSummary={synopsis.registerSummary}
        findingsSearchQuery={findingsSearchQuery}
        onNaturalLanguageFilterApply={setNlFacets}
        nlFacets={nlFacets}
        onClearAllFilters={clearAllFilters}
        onShowAllFilteredFindings={showAllFilteredFindings}
        hiddenFilterHonesty={synopsis.hiddenFilterHonesty}
        architectureScopeHonesty={synopsis.architectureScopeHonesty}
        isWorkingMode={isWorkingMode}
        scopedArchitectureId={scopedArchitectureId}
        lastOpenArchitectureId={lastOpenArchitectureId}
        onLoadFindingsSavedView={onLoadFindingsSavedView}
        loading={loading}
        rows={rows}
        filterNoMatchPreset={synopsis.filterNoMatchPreset}
        activeFiltersSummary={synopsis.activeFiltersSummary}
        sponsorSynopsisPackageTitle={synopsis.sponsorSynopsisPackageTitle}
        sponsorSynopsisCounts={synopsis.sponsorSynopsisCounts}
        sponsorHandoffHref={synopsis.sponsorHandoffHref}
        scopedRunContextTitle={
          scopedRunContextQuery.data?.recentProjectRuns.find((run) => run.runId === scopedRunId)?.displayName ??
          scopedRunContextQuery.data?.recentProjectRuns.find((run) => run.runId === scopedRunId)?.runId ??
          null
        }
        continueLastFinding={synopsis.continueLastFinding}
        assignedToMeOldestFindingTarget={synopsis.assignedToMeOldestFindingTarget}
        firstFindingTriageTarget={synopsis.firstFindingTriageTarget}
        hideGenericLowDensity={hideGenericLowDensity}
        onHideGenericLowDensityChange={setHideGenericLowDensity}
        showInsightDensityScore={isWorkingMode}
        selectedFindingIds={bulkActions.selectedFindingIds}
        onSelectionChange={bulkActions.onSelectionChange}
        onBulkApplied={bulkActions.onBulkApplied}
        loadFailed={loadFailed}
        loadFailedPreset={loadFailedPreset}
        loadFailure={loadFailure}
        onRefresh={refresh}
        workspaceScopeTeaching={synopsis.workspaceScopeTeaching}
        currentPrincipalName={currentPrincipal.name ?? ""}
        currentPrincipalRole={currentPrincipal.primaryAppRole}
        assignedToMeCheckedAt={assignedToMeCheckedAt}
        assignedToMeFetchBasis={assignedToMeFetchBasis}
        currentJobId={currentJobId}
      />
    </OperatorPageContainer>
  );
}
