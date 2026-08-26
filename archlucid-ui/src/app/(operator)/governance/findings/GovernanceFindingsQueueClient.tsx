"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import {
  GovernanceFindingsAssignedToMeHeaderActions,
  GovernanceFindingsAssignedToMeHeaderMetadata,
  GovernanceFindingsAssignedToMeStatusBadge,
} from "@/app/(operator)/governance/findings/GovernanceFindingsAssignedToMeChrome";
import { GovernanceFindingsQueueAssignedToMeShell } from "@/app/(operator)/governance/findings/GovernanceFindingsQueueAssignedToMeShell";
import { GovernanceFindingsQueueHeader } from "@/app/(operator)/governance/findings/GovernanceFindingsQueueHeader";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { useGovernanceFindingsFilter } from "@/components/governance/findings/use-governance-findings-filter";
import { useGovernanceFindingsQuery } from "@/components/governance/findings/use-governance-findings-query";
import { useAssignedToMeFindingsQuery } from "@/components/governance/findings/use-assigned-to-me-findings-query";
import { useAssignedToMeFindingsCountQuery } from "@/hooks/use-assigned-to-me-findings-count-query";
import { useRunDetailWorkspaceContextBundleQuery } from "@/hooks/use-run-detail-workspace-context-bundle-query";
import { useOperatorScopeQueryKey } from "@/hooks/use-operator-scope-query-key";
import { useOperatorScopeRecord } from "@/hooks/use-operator-scope-record";
import { useOperatorNavAuthority } from "@/components/operator/OperatorNavAuthorityProvider";
import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { hasGovernanceApprovalProvenance } from "@/lib/governance/governance-approval-provenance";
import { resolveGovernanceAssignedToMeWorkspaceLabel } from "@/lib/governance/governance-assigned-to-me-empty-state";
import {
  resolveFindingsQueueTriageEmphasizedStepId,
  resolveFindingsQueueTriageSteps,
} from "@/lib/findings-queue-triage-checklist";
import {
  EMPTY_FINDINGS_NATURAL_LANGUAGE_FACETS,
  type FindingsNaturalLanguageFacets,
} from "@/lib/findings/findings-natural-language-filter";
import type { GovernanceFindingsQueueMode } from "@/lib/governance/governance-findings-queue-mode";
import type { GovernanceJobId } from "@/lib/governance/governance-job-router";
import {
  patchGovernanceFindingsQueueFacets,
  readGovernanceFindingsQueueFacets,
} from "@/lib/governance/governance-findings-queue-facets-storage";
import { secondaryViewFromGovernanceQueueRow } from "@/lib/canonical-object-home-registry";
import { resolveWorkspaceScopeEmptyTeachingForHub } from "@/lib/workspace-scope-empty-teaching";
import { usePrefetchItsmFindingCorrelations } from "@/lib/use-itsm-finding-correlations";
import {
  DEFAULT_FINDING_JOB_VIEW,
  resolveEffectiveFindingJobView,
  type FindingJobView,
} from "@/lib/findings/finding-job-view";
import {
  computeGovernanceFindingsRegisterSummary,
  countAssignedToMeLoadedFindings,
  deriveGovernanceFindingsActiveFiltersSummary,
  deriveSponsorSynopsisCounts,
  deriveSponsorSynopsisPackageTitle,
  extractGovernanceFindingIds,
  filterGovernanceFindingsDisplayedRows,
  filterGovernanceFindingsScopedRows,
  hasAssignedToMeCountMismatch,
  resolveAssignedToMeOldestFindingTarget,
  resolveContinueLastFindingTarget,
  resolveFirstFindingTriageTarget,
  resolveGovernanceFindingsFilterNoMatchPreset,
  resolveGovernanceFindingsLoadFailedPreset,
  resolveGovernanceFindingsNavHref,
  resolveGovernanceFindingsPageSubtitle,
  resolveGovernanceFindingsPageTitle,
  resolveGovernanceFindingsSponsorHandoffHref,
  resolveScopedFindingLifecycleCompareHref,
} from "@/app/(operator)/governance/findings/governance-findings-queue-presentation";

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
  const [jobView, setJobViewState] = useState<FindingJobView>(
    () => readGovernanceFindingsQueueFacets(mode).jobView,
  );
  const [nlFacets, setNlFacetsState] = useState<FindingsNaturalLanguageFacets>(
    () => readGovernanceFindingsQueueFacets(mode).nlFacets,
  );
  const isAssignedToMe = mode === "assigned-to-me";
  const { currentPrincipal } = useOperatorNavAuthority();
  const scopeKey = useOperatorScopeQueryKey();
  const scopeRecord = useOperatorScopeRecord();
  const assignedToMeWorkspaceLabel = useMemo(() => resolveGovernanceAssignedToMeWorkspaceLabel(), [scopeKey.workspaceId]);
  const tenantQuery = useGovernanceFindingsQuery(!isAssignedToMe);
  const assignedToMeQuery = useAssignedToMeFindingsQuery(isAssignedToMe);
  const assignedToMeCountQuery = useAssignedToMeFindingsCountQuery({ enabled: isAssignedToMe });
  const activeQuery = isAssignedToMe ? assignedToMeQuery : tenantQuery;
  const { rows, loading, loadFailed, refresh } = activeQuery;
  const assignedToMeFetchBasis = isAssignedToMe ? assignedToMeQuery.fetchBasis : null;
  const assignedToMeCheckedAt =
    isAssignedToMe && assignedToMeQuery.dataUpdatedAt > 0
      ? new Date(assignedToMeQuery.dataUpdatedAt)
      : null;
  const loadFailure = isAssignedToMe ? assignedToMeQuery.loadFailure : tenantQuery.loadFailure;
  const {
    registerFilter,
    setRegisterFilter,
    scopedRunId,
    savedPresets,
    saveCurrentFilterAsPreset,
    removePreset,
    groupByResource,
    toggleGroupByResource,
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

  const setJobView = useCallback((next: FindingJobView): void => {
    setJobViewState(next);
    patchGovernanceFindingsQueueFacets({ jobView: next }, mode);
  }, [mode]);

  const setNlFacets = useCallback((next: FindingsNaturalLanguageFacets): void => {
    setNlFacetsState(next);
    patchGovernanceFindingsQueueFacets({ nlFacets: next }, mode);
  }, [mode]);

  const clearAllFilters = useCallback((): void => {
    setRegisterFilter("all");
    setJobViewState(DEFAULT_FINDING_JOB_VIEW);
    setNlFacetsState(EMPTY_FINDINGS_NATURAL_LANGUAGE_FACETS);
    patchGovernanceFindingsQueueFacets(
      {
        registerFilter: "all",
        jobView: DEFAULT_FINDING_JOB_VIEW,
        nlFacets: EMPTY_FINDINGS_NATURAL_LANGUAGE_FACETS,
      },
      mode,
    );
  }, [mode, setRegisterFilter]);

  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();
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
  const filterBarVisible = !buyerPolishedShell && !loading && rows.length > 0;
  const effectiveJobView = resolveEffectiveFindingJobView(jobView, filterBarVisible);
  const jobViewFilterActive = filterBarVisible && jobView !== DEFAULT_FINDING_JOB_VIEW;
  const scopedRows = useMemo(
    () => filterGovernanceFindingsScopedRows(rows, scopedRunId),
    [rows, scopedRunId],
  );
  const displayedRows = useMemo(
    () =>
      filterGovernanceFindingsDisplayedRows(
        scopedRows,
        registerFilter,
        nlFacets,
        effectiveJobView,
      ),
    [scopedRows, registerFilter, effectiveJobView, nlFacets],
  );
  const registerSummary = useMemo(
    () => computeGovernanceFindingsRegisterSummary(scopedRows),
    [scopedRows],
  );
  const findingIds = useMemo(() => extractGovernanceFindingIds(displayedRows), [displayedRows]);
  usePrefetchItsmFindingCorrelations(findingIds);
  const pageTitle = resolveGovernanceFindingsPageTitle(isAssignedToMe, buyerPolishedShell);
  const pageSubtitle = resolveGovernanceFindingsPageSubtitle(isAssignedToMe, buyerPolishedShell);
  const navHref = resolveGovernanceFindingsNavHref(isAssignedToMe);

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

  const currentJobId: GovernanceJobId = isAssignedToMe ? "assigned-to-me-findings" : "triage-findings";
  const loadFailedPreset = resolveGovernanceFindingsLoadFailedPreset(isAssignedToMe);
  const filterNoMatchPreset = resolveGovernanceFindingsFilterNoMatchPreset(isAssignedToMe);
  const secondaryViewPresentation =
    displayedRows.length > 0 ? secondaryViewFromGovernanceQueueRow(displayedRows[0]) : null;
  const firstFindingTriageTarget = useMemo(
    () => resolveFirstFindingTriageTarget(displayedRows, isAssignedToMe),
    [displayedRows, isAssignedToMe],
  );
  const continueLastFinding = useMemo(
    () => resolveContinueLastFindingTarget(displayedRows),
    [displayedRows],
  );
  const findingsQueueTriageSteps = useMemo(
    () =>
      resolveFindingsQueueTriageSteps({
        reviewPicked: scopedRunFilterActive,
        findingOpened: continueLastFinding !== null,
        dispositionRecorded: displayedRows.some(
          (row) =>
            row.recordKind === "finding" && (row.latestDisposition?.trim() ?? "").length > 0,
        ),
      }),
    [continueLastFinding, displayedRows, scopedRunFilterActive],
  );
  const findingsQueueTriageEmphasizedStepId = useMemo(
    () =>
      resolveFindingsQueueTriageEmphasizedStepId({
        reviewPicked: scopedRunFilterActive,
        findingOpened: continueLastFinding !== null,
        dispositionRecorded: displayedRows.some(
          (row) =>
            row.recordKind === "finding" && (row.latestDisposition?.trim() ?? "").length > 0,
        ),
      }),
    [continueLastFinding, displayedRows, scopedRunFilterActive],
  );
  const assignedToMeOldestFindingTarget = useMemo(
    () => resolveAssignedToMeOldestFindingTarget(rows, isAssignedToMe),
    [isAssignedToMe, rows],
  );
  const sponsorSynopsisPackageTitle = deriveSponsorSynopsisPackageTitle(displayedRows, scopedRunId);
  const sponsorSynopsisCounts = useMemo(
    () => deriveSponsorSynopsisCounts(displayedRows),
    [displayedRows],
  );
  const sponsorHandoffHref = resolveGovernanceFindingsSponsorHandoffHref(scopedRunId);
  const governanceApprovalProvenance = null;
  const showGovernanceApprovalBanner =
    buyerPolishedShell &&
    !loadFailed &&
    !isAssignedToMe &&
    hasGovernanceApprovalProvenance(governanceApprovalProvenance);
  const assignedToMeCount = assignedToMeCountQuery.data ?? rows.length;
  const assignedToMeLoadedFindingCount = useMemo(
    () => countAssignedToMeLoadedFindings(rows),
    [rows],
  );
  const assignedToMeCountMismatch = hasAssignedToMeCountMismatch({
    isAssignedToMe,
    loading,
    loadFailed,
    assignedToMeCountData: assignedToMeCountQuery.data,
    assignedToMeLoadedFindingCount,
  });
  const activeFiltersSummary = useMemo(
    () =>
      deriveGovernanceFindingsActiveFiltersSummary(
        registerFilter,
        jobView,
        nlFacets,
        jobViewFilterActive,
      ),
    [registerFilter, jobView, nlFacets, jobViewFilterActive],
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
      <GovernanceFindingsQueueAssignedToMeShell
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
        onNaturalLanguageFilterApply={setNlFacets}
        nlFacets={nlFacets}
        onClearAllFilters={clearAllFilters}
        loading={loading}
        rows={rows}
        filterNoMatchPreset={filterNoMatchPreset}
        activeFiltersSummary={activeFiltersSummary}
        sponsorSynopsisPackageTitle={sponsorSynopsisPackageTitle}
        sponsorSynopsisCounts={sponsorSynopsisCounts}
        sponsorHandoffHref={sponsorHandoffHref}
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
