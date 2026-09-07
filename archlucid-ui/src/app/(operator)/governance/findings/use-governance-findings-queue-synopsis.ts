"use client";

import { useMemo } from "react";

import type { GovernanceFindingQueueRow } from "@/app/(operator)/governance/findings/governance-finding-queue-row";
import {
  computeGovernanceFindingsRegisterSummary,
  deriveGovernanceFindingsActiveFiltersSummary,
  deriveSponsorSynopsisCounts,
  deriveSponsorSynopsisPackageTitle,
  extractGovernanceFindingIds,
  filterGovernanceFindingsArchitectureScopedRows,
  filterGovernanceFindingsDisplayedRows,
  filterGovernanceFindingsScopedRows,
  resolveAssignedToMeOldestFindingTarget,
  resolveContinueLastFindingTarget,
  resolveFirstFindingTriageTarget,
  resolveGovernanceFindingsFilterNoMatchPreset,
  resolveGovernanceFindingsSponsorHandoffHref,
} from "@/app/(operator)/governance/findings/governance-findings-queue-presentation";
import { secondaryViewFromGovernanceQueueRow } from "@/lib/canonical-object-home-registry";
import { DEFAULT_FINDING_JOB_VIEW, resolveEffectiveFindingJobView } from "@/lib/findings/finding-job-view";
import {
  resolveFindingsQueueTriageEmphasizedStepId,
  resolveFindingsQueueTriageSteps,
} from "@/lib/findings-queue-triage-checklist";
import type { GovernanceFindingsQueueMode } from "@/lib/governance/governance-findings-queue-mode";
import {
  filterGovernanceFindingsHideGenericRows,
  sortGovernanceFindingsRowsBySignal,
} from "@/lib/governance/governance-findings-density-sort";
import { deriveGovernanceFindingsHiddenFilterHonesty } from "@/lib/governance/governance-findings-hidden-filter-honesty";
import { deriveGovernanceFindingsArchitectureScopeHonesty } from "@/lib/governance/governance-findings-architecture-scope";
import type { RiskRegisterFilter } from "@/lib/architecture/architecture-risk-register-page";
import type { FindingsNaturalLanguageFacets } from "@/lib/findings/findings-natural-language-filter";
import type { FindingJobView } from "@/lib/findings/finding-job-view";
import type { OperatorScopeRecord } from "@/lib/operator/operator-scope-storage";
import { resolveWorkspaceScopeEmptyTeachingForHub } from "@/lib/workspace-scope-empty-teaching";

export type UseGovernanceFindingsQueueSynopsisInput = {
  readonly mode: GovernanceFindingsQueueMode;
  readonly isAssignedToMe: boolean;
  readonly buyerPolishedShell: boolean;
  readonly rows: readonly GovernanceFindingQueueRow[];
  readonly loading: boolean;
  readonly loadFailed: boolean;
  readonly scopedRunId: string | null;
  readonly architectureRunIdSet: ReadonlySet<string> | null;
  readonly architectureScopeFilterActive: boolean;
  readonly registerFilter: RiskRegisterFilter;
  readonly nlFacets: FindingsNaturalLanguageFacets;
  readonly jobView: FindingJobView;
  readonly findingsSearchQuery: string;
  readonly hideGenericLowDensity: boolean;
  readonly isWorkingMode: boolean;
  readonly scopeRecord: OperatorScopeRecord | null;
};

export function useGovernanceFindingsQueueSynopsis(input: UseGovernanceFindingsQueueSynopsisInput) {
  const {
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
  } = input;

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

  const architectureScopedRows = useMemo(
    () => filterGovernanceFindingsArchitectureScopedRows(rows, architectureRunIdSet),
    [architectureRunIdSet, rows],
  );
  const scopedRows = useMemo(
    () => filterGovernanceFindingsScopedRows(architectureScopedRows, scopedRunId),
    [architectureScopedRows, scopedRunId],
  );
  const filteredRows = useMemo(
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
  const densityFilteredRows = useMemo(
    () =>
      filterGovernanceFindingsHideGenericRows(
        filteredRows,
        isWorkingMode && hideGenericLowDensity,
      ),
    [filteredRows, hideGenericLowDensity, isWorkingMode],
  );
  const displayedRows = useMemo(
    () => (isWorkingMode ? sortGovernanceFindingsRowsBySignal(densityFilteredRows) : densityFilteredRows),
    [densityFilteredRows, isWorkingMode],
  );
  const registerSummary = useMemo(
    () => computeGovernanceFindingsRegisterSummary(scopedRows),
    [scopedRows],
  );
  const findingIds = useMemo(() => extractGovernanceFindingIds(displayedRows), [displayedRows]);
  const filterNoMatchPreset = resolveGovernanceFindingsFilterNoMatchPreset(isAssignedToMe);
  const secondaryViewPresentation =
    displayedRows.length > 0 ? secondaryViewFromGovernanceQueueRow(displayedRows[0]) : null;
  const firstFindingTriageTarget = useMemo(
    () =>
      resolveFirstFindingTriageTarget(
        displayedRows,
        isAssignedToMe,
        scopedRunFilterActive ? scopedRunId : null,
      ),
    [displayedRows, isAssignedToMe, scopedRunFilterActive, scopedRunId],
  );
  const continueLastFinding = useMemo(
    () =>
      resolveContinueLastFindingTarget(
        displayedRows,
        scopedRunFilterActive ? scopedRunId : null,
      ),
    [displayedRows, scopedRunFilterActive, scopedRunId],
  );
  const dispositionRecorded = useMemo(
    () =>
      displayedRows.some(
        (row) =>
          row.recordKind === "finding" && (row.latestDisposition?.trim() ?? "").length > 0,
      ),
    [displayedRows],
  );
  const findingsQueueTriageSteps = useMemo(
    () =>
      resolveFindingsQueueTriageSteps({
        reviewPicked: scopedRunFilterActive,
        findingOpened: continueLastFinding !== null,
        dispositionRecorded,
      }),
    [continueLastFinding, dispositionRecorded, scopedRunFilterActive],
  );
  const findingsQueueTriageEmphasizedStepId = useMemo(
    () =>
      resolveFindingsQueueTriageEmphasizedStepId({
        reviewPicked: scopedRunFilterActive,
        findingOpened: continueLastFinding !== null,
        dispositionRecorded,
      }),
    [continueLastFinding, dispositionRecorded, scopedRunFilterActive],
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
  const hiddenFilterHonesty = useMemo(
    () => deriveGovernanceFindingsHiddenFilterHonesty(scopedRows, displayedRows),
    [displayedRows, scopedRows],
  );
  const architectureScopeHonesty = useMemo(
    () =>
      deriveGovernanceFindingsArchitectureScopeHonesty(
        rows,
        architectureScopedRows,
        architectureScopeFilterActive,
      ),
    [architectureScopeFilterActive, architectureScopedRows, rows],
  );

  return {
    scopedRunFilterActive,
    workspaceScopeTeaching,
    findingsAdvancedFiltersAvailable,
    filterBarVisible,
    compactRegisterFilterVisible,
    advancedFiltersDisclosureVisible,
    effectiveJobView,
    jobViewFilterActive,
    scopedRows,
    displayedRows,
    registerSummary,
    findingIds,
    filterNoMatchPreset,
    secondaryViewPresentation,
    firstFindingTriageTarget,
    continueLastFinding,
    findingsQueueTriageSteps,
    findingsQueueTriageEmphasizedStepId,
    assignedToMeOldestFindingTarget,
    sponsorSynopsisPackageTitle,
    sponsorSynopsisCounts,
    sponsorHandoffHref,
    activeFiltersSummary,
    hiddenFilterHonesty,
    architectureScopeHonesty,
  };
}
