"use client";

import { GovernanceFindingsContinueLastViewedRow } from "@/app/(operator)/governance/findings/GovernanceFindingsContinueLastViewedRow";
import { EnterpriseCompactEmptyState } from "@/components/EnterpriseCompactEmptyState";
import { FindingsHiddenFilterHonestyBand } from "@/components/findings/FindingsHiddenFilterHonestyBand";
import { GovernanceFindingsList } from "@/components/governance/findings/GovernanceFindingsList";
import { PolicyPackAssignFromReviewStrip } from "@/components/governance/PolicyPackAssignFromReviewStrip";
import { SponsorStorySynopsisFromCounts } from "@/components/operator/SponsorStorySynopsisPanel";
import { AssignedToMeContinueOldestFindingStrip } from "@/components/usability/AssignedToMeContinueOldestFindingStrip";
import { FindingsTriageFirstFindingStrip } from "@/components/usability/FindingsTriageFirstFindingStrip";
import { InhabitedFindingsFocusCoordinator } from "@/components/governance/InhabitedFindingsFocusCoordinator";
import { WorkingFindingsKeyboardHint } from "@/components/governance/findings/WorkingFindingsKeyboardHint";
import { resolveInhabitedFindingsDocumentPresentation } from "@/lib/inhabit/inhabit-findings-document-presentation";
import { usePathname } from "next/navigation";
import { useProductLine } from "@/components/product-line/ProductLineProvider";
import { INSIGHT_DENSITY_GENERIC_THRESHOLD } from "@/lib/governance/governance-findings-density-sort";
import { policyPacksPathForProductLine } from "@/lib/product-line/securenow-compliance-routes";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

import { GovernanceFindingsFilterNoMatchPartialHonesty } from "@/app/(operator)/governance/findings/_sections/GovernanceFindingsFilterNoMatchPartialHonesty";
import { GovernanceFindingsNlFacetFilterNoMatchPartialHonesty } from "@/app/(operator)/governance/findings/_sections/GovernanceFindingsNlFacetFilterNoMatchPartialHonesty";
import { GovernanceFindingsJobViewFilterNoMatchPartialHonesty } from "@/app/(operator)/governance/findings/_sections/GovernanceFindingsJobViewFilterNoMatchPartialHonesty";
import { GOVERNANCE_FINDINGS_JOB_VIEW_FILTER_EMPTY_NOT_LOAD_FAILURE_LINE } from "@/lib/governance/governance-findings-job-view-filter-empty-not-load-failure-copy";
import { GovernanceFindingsRegisterFilterNoMatchPartialHonesty } from "@/app/(operator)/governance/findings/_sections/GovernanceFindingsRegisterFilterNoMatchPartialHonesty";
import { GOVERNANCE_FINDINGS_REGISTER_FILTER_EMPTY_NOT_LOAD_FAILURE_LINE } from "@/lib/governance/governance-findings-register-filter-empty-not-load-failure-copy";
import { hasGovernanceFindingsNlFacetFilterActive } from "@/lib/governance/governance-findings-nl-facet-filter-active";
import { GovernanceFindingsJobViewAndNlFacetFilterNoMatchPartialHonesty } from "@/app/(operator)/governance/findings/_sections/GovernanceFindingsJobViewAndNlFacetFilterNoMatchPartialHonesty";
import { GOVERNANCE_FINDINGS_JOB_VIEW_AND_NL_FACET_COMBINED_FILTER_EMPTY_NOT_LOAD_FAILURE_LINE } from "@/lib/governance/governance-findings-job-view-and-nl-facet-combined-filter-empty-not-load-failure-copy";
import { GovernanceFindingsRegisterAndNlFacetFilterNoMatchPartialHonesty } from "@/app/(operator)/governance/findings/_sections/GovernanceFindingsRegisterAndNlFacetFilterNoMatchPartialHonesty";
import { GOVERNANCE_FINDINGS_REGISTER_AND_NL_FACET_COMBINED_FILTER_EMPTY_NOT_LOAD_FAILURE_LINE } from "@/lib/governance/governance-findings-register-and-nl-facet-combined-filter-empty-not-load-failure-copy";
import { GovernanceFindingsRegisterAndJobViewFilterNoMatchPartialHonesty } from "@/app/(operator)/governance/findings/_sections/GovernanceFindingsRegisterAndJobViewFilterNoMatchPartialHonesty";
import { GOVERNANCE_FINDINGS_REGISTER_AND_JOB_VIEW_COMBINED_FILTER_EMPTY_NOT_LOAD_FAILURE_LINE } from "@/lib/governance/governance-findings-register-and-job-view-combined-filter-empty-not-load-failure-copy";
import { GovernanceFindingsRegisterAndJobViewAndNlFacetFilterNoMatchPartialHonesty } from "@/app/(operator)/governance/findings/_sections/GovernanceFindingsRegisterAndJobViewAndNlFacetFilterNoMatchPartialHonesty";
import { GOVERNANCE_FINDINGS_REGISTER_AND_JOB_VIEW_AND_NL_FACET_COMBINED_FILTER_EMPTY_NOT_LOAD_FAILURE_LINE } from "@/lib/governance/governance-findings-register-and-job-view-and-nl-facet-combined-filter-empty-not-load-failure-copy";
import {
  GOVERNANCE_FINDINGS_COMBINED_FILTER_MODE_JOB_NL_LINE,
  GOVERNANCE_FINDINGS_COMBINED_FILTER_MODE_REGISTER_JOB_LINE,
  GOVERNANCE_FINDINGS_COMBINED_FILTER_MODE_REGISTER_NL_LINE,
  GOVERNANCE_FINDINGS_COMBINED_FILTER_MODE_TRIPLE_LINE,
} from "@/lib/governance/governance-findings-combined-filter-mode-legend-copy";
import { GovernanceFindingsQueueResultsPartialCaptureFootnote } from "@/app/(operator)/governance/findings/_sections/GovernanceFindingsQueueResultsPartialCaptureFootnote";
import { GovernanceFindingsArchitectureScopeAndSeverityFilterNoMatchPartialHonesty } from "@/app/(operator)/governance/findings/_sections/GovernanceFindingsArchitectureScopeAndSeverityFilterNoMatchPartialHonesty";
import { GOVERNANCE_FINDINGS_ARCHITECTURE_SCOPE_AND_SEVERITY_COMBINED_FILTER_EMPTY_NOT_LOAD_FAILURE_LINE } from "@/lib/governance/governance-findings-architecture-scope-and-severity-combined-filter-empty-not-load-failure-copy";
import { GovernanceFindingsArchitectureScopeOnlyFilterNoMatchPartialHonesty } from "@/app/(operator)/governance/findings/_sections/GovernanceFindingsArchitectureScopeOnlyFilterNoMatchPartialHonesty";
import { GOVERNANCE_FINDINGS_ARCHITECTURE_SCOPE_ONLY_FILTER_EMPTY_NOT_LOAD_FAILURE_LINE } from "@/lib/governance/governance-findings-architecture-scope-only-filter-empty-not-load-failure-copy";
import type { GovernanceFindingsQueueAssignedToMeShellProps } from "@/app/(operator)/governance/findings/GovernanceFindingsQueueAssignedToMeShell";

export function GovernanceFindingsQueueResultsSection(
  props: GovernanceFindingsQueueAssignedToMeShellProps,
): React.JSX.Element {
  const pathname = usePathname();
  const { productLine } = useProductLine();
  const nlFacetFilterActive = hasGovernanceFindingsNlFacetFilterActive(props.nlFacets);
  const registerFilterActive = props.registerFilter !== "all";
  const combinedRegisterAndJobViewAndNlFacet = registerFilterActive && props.jobViewFilterActive && nlFacetFilterActive;
  const combinedRegisterAndJobView = registerFilterActive && props.jobViewFilterActive && !nlFacetFilterActive;
  const combinedRegisterAndNlFacet = registerFilterActive && nlFacetFilterActive && !props.jobViewFilterActive;
  const combinedJobViewAndNlFacet = props.jobViewFilterActive && nlFacetFilterActive && !registerFilterActive;
  const architectureScopeChipActive = (props.scopedArchitectureId?.trim().length ?? 0) > 0;
  const severityFacetActive = props.nlFacets.severity !== null;
  const combinedArchitectureScopeAndSeverity =
    architectureScopeChipActive
    && severityFacetActive
    && !registerFilterActive
    && !props.jobViewFilterActive;
  const architectureScopeOnlyFilter =
    architectureScopeChipActive
    && !severityFacetActive
    && !registerFilterActive
    && !props.jobViewFilterActive
    && !nlFacetFilterActive;
  const inhabitedFindingsDocument =
    resolveInhabitedFindingsDocumentPresentation({
      workingMode: props.isWorkingMode,
      pathname,
      scopedArchitectureId: props.scopedArchitectureId,
      architectureDisplayName: props.architectureDisplayName,
      scopedRunId: props.scopedRunId,
      scopedRunTitle: props.scopedRunContextTitle,
      productLineId: productLine,
    }) !== null;

  return (
    <>
      {props.loading ? (
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>Loading findings…</p>
      ) : null}

      {!props.loading
      && props.rows.length > 0
      && props.displayedRows.length === 0
      && props.activeFiltersSummary !== null ? (
        <EnterpriseCompactEmptyState
          {...props.filterNoMatchPreset}
          description={
            props.activeFiltersSummary !== null
              ? `${props.filterNoMatchPreset.description} Active filters: ${props.activeFiltersSummary}.`
              : props.filterNoMatchPreset.description
          }
          footer={
            <div className="space-y-2">
              {architectureScopeOnlyFilter ? (
                <div
                  className="space-y-2"
                  data-testid={
                    props.isAssignedToMe
                      ? "governance-findings-assigned-to-me-architecture-scope-only-filter-empty"
                      : "governance-findings-architecture-scope-only-filter-empty"
                  }
                >
                  <p
                    className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
                    data-testid="governance-findings-architecture-scope-only-filter-empty-not-load-failure"
                  >
                    {GOVERNANCE_FINDINGS_ARCHITECTURE_SCOPE_ONLY_FILTER_EMPTY_NOT_LOAD_FAILURE_LINE}
                  </p>
                  <GovernanceFindingsArchitectureScopeOnlyFilterNoMatchPartialHonesty />
                </div>
              ) : null}
              {combinedArchitectureScopeAndSeverity ? (
                <div className="space-y-2" data-testid="governance-findings-architecture-scope-and-severity-combined-filter-empty">
                  <p
                    className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
                    data-testid="governance-findings-architecture-scope-and-severity-combined-filter-empty-not-load-failure"
                  >
                    {GOVERNANCE_FINDINGS_ARCHITECTURE_SCOPE_AND_SEVERITY_COMBINED_FILTER_EMPTY_NOT_LOAD_FAILURE_LINE}
                  </p>
                  <GovernanceFindingsArchitectureScopeAndSeverityFilterNoMatchPartialHonesty />
                </div>
              ) : null}
              {combinedRegisterAndJobViewAndNlFacet || combinedRegisterAndJobView || combinedRegisterAndNlFacet || combinedJobViewAndNlFacet ? (
                <p
                  className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
                  data-testid="governance-findings-combined-filter-mode-legend"
                >
                  {combinedRegisterAndJobViewAndNlFacet
                    ? GOVERNANCE_FINDINGS_COMBINED_FILTER_MODE_TRIPLE_LINE
                    : combinedRegisterAndJobView
                      ? GOVERNANCE_FINDINGS_COMBINED_FILTER_MODE_REGISTER_JOB_LINE
                      : combinedRegisterAndNlFacet
                        ? GOVERNANCE_FINDINGS_COMBINED_FILTER_MODE_REGISTER_NL_LINE
                        : GOVERNANCE_FINDINGS_COMBINED_FILTER_MODE_JOB_NL_LINE}
                </p>
              ) : null}
              {combinedRegisterAndJobViewAndNlFacet ? (
                <div className="space-y-2" data-testid="governance-findings-register-and-job-view-and-nl-facet-combined-filter-empty">
                  <p
                    className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
                    data-testid="governance-findings-register-and-job-view-and-nl-facet-combined-filter-empty-not-load-failure"
                  >
                    {GOVERNANCE_FINDINGS_REGISTER_AND_JOB_VIEW_AND_NL_FACET_COMBINED_FILTER_EMPTY_NOT_LOAD_FAILURE_LINE}
                  </p>
                  <GovernanceFindingsRegisterAndJobViewAndNlFacetFilterNoMatchPartialHonesty />
                </div>
              ) : null}
              {combinedRegisterAndJobView ? (
                <div className="space-y-2" data-testid="governance-findings-register-and-job-view-combined-filter-empty">
                  <p
                    className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
                    data-testid="governance-findings-register-and-job-view-combined-filter-empty-not-load-failure"
                  >
                    {GOVERNANCE_FINDINGS_REGISTER_AND_JOB_VIEW_COMBINED_FILTER_EMPTY_NOT_LOAD_FAILURE_LINE}
                  </p>
                  <GovernanceFindingsRegisterAndJobViewFilterNoMatchPartialHonesty />
                </div>
              ) : null}
              {combinedRegisterAndNlFacet ? (
                <div className="space-y-2" data-testid="governance-findings-register-and-nl-facet-combined-filter-empty">
                  <p
                    className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
                    data-testid="governance-findings-register-and-nl-facet-combined-filter-empty-not-load-failure"
                  >
                    {GOVERNANCE_FINDINGS_REGISTER_AND_NL_FACET_COMBINED_FILTER_EMPTY_NOT_LOAD_FAILURE_LINE}
                  </p>
                  <GovernanceFindingsRegisterAndNlFacetFilterNoMatchPartialHonesty />
                </div>
              ) : null}
              {!combinedRegisterAndJobViewAndNlFacet && !combinedRegisterAndJobView && !combinedRegisterAndNlFacet && registerFilterActive ? (
                <p
                  className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
                  data-testid="governance-findings-register-filter-empty-not-load-failure"
                >
                  {GOVERNANCE_FINDINGS_REGISTER_FILTER_EMPTY_NOT_LOAD_FAILURE_LINE}
                </p>
              ) : null}
              {!combinedRegisterAndJobViewAndNlFacet && !combinedRegisterAndJobView && !combinedRegisterAndNlFacet && registerFilterActive ? (
                <GovernanceFindingsRegisterFilterNoMatchPartialHonesty />
              ) : null}
              {combinedJobViewAndNlFacet ? (
                <div className="space-y-2" data-testid="governance-findings-job-view-and-nl-facet-combined-filter-empty">
                  <p
                    className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
                    data-testid="governance-findings-job-view-and-nl-facet-combined-filter-empty-not-load-failure"
                  >
                    {GOVERNANCE_FINDINGS_JOB_VIEW_AND_NL_FACET_COMBINED_FILTER_EMPTY_NOT_LOAD_FAILURE_LINE}
                  </p>
                  <GovernanceFindingsJobViewAndNlFacetFilterNoMatchPartialHonesty />
                </div>
              ) : null}
              {!combinedRegisterAndJobViewAndNlFacet && !combinedRegisterAndJobView && !combinedJobViewAndNlFacet && props.jobViewFilterActive ? (
                <p
                  className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
                  data-testid="governance-findings-job-view-filter-empty-not-load-failure"
                >
                  {GOVERNANCE_FINDINGS_JOB_VIEW_FILTER_EMPTY_NOT_LOAD_FAILURE_LINE}
                </p>
              ) : null}
              {!combinedRegisterAndJobViewAndNlFacet && !combinedRegisterAndJobView && !combinedJobViewAndNlFacet && props.jobViewFilterActive ? (
                <GovernanceFindingsJobViewFilterNoMatchPartialHonesty />
              ) : null}
              {!combinedRegisterAndJobViewAndNlFacet && !combinedRegisterAndNlFacet && !combinedJobViewAndNlFacet && !combinedArchitectureScopeAndSeverity && nlFacetFilterActive ? (
                <GovernanceFindingsNlFacetFilterNoMatchPartialHonesty />
              ) : null}
              {!combinedRegisterAndJobViewAndNlFacet
              && !combinedRegisterAndJobView
              && !combinedRegisterAndNlFacet
              && !combinedJobViewAndNlFacet
              && !nlFacetFilterActive
              && !architectureScopeOnlyFilter ? (
                <GovernanceFindingsFilterNoMatchPartialHonesty />
              ) : null}
            </div>
          }
        />
      ) : null}

      {!props.loading && props.isAssignedToMe && props.rows.length === 0 ? (
        <div className="space-y-3" data-testid="governance-assigned-to-me-zero-row-resume">
          {props.continueLastFinding !== null ? (
            <GovernanceFindingsContinueLastViewedRow target={props.continueLastFinding} />
          ) : null}
          <WorkingFindingsKeyboardHint />
        </div>
      ) : null}

      {!props.loading && props.displayedRows.length > 0 ? (
        <>
          <SponsorStorySynopsisFromCounts
            packageTitle={props.sponsorSynopsisPackageTitle}
            counts={props.sponsorSynopsisCounts}
            sponsorHandoffHref={props.sponsorHandoffHref}
          />
          {props.scopedRunFilterActive && props.scopedRunId !== null ? (
            <PolicyPackAssignFromReviewStrip
              reviewId={props.scopedRunId}
              reviewTitle={props.scopedRunContextTitle}
              policyPacksHubPath={policyPacksPathForProductLine(productLine)}
            />
          ) : null}
          {props.continueLastFinding !== null ? (
            <GovernanceFindingsContinueLastViewedRow target={props.continueLastFinding} />
          ) : null}
          {props.assignedToMeOldestFindingTarget !== null ? (
            <AssignedToMeContinueOldestFindingStrip
              target={props.assignedToMeOldestFindingTarget.target}
              href={props.assignedToMeOldestFindingTarget.href}
            />
          ) : null}
          {props.firstFindingTriageTarget !== null ? (
            <FindingsTriageFirstFindingStrip
              findingId={props.firstFindingTriageTarget.findingId}
              findingTitle={props.firstFindingTriageTarget.findingTitle}
              href={props.firstFindingTriageTarget.href}
            />
          ) : null}
          {props.showInsightDensityScore ? (
            <label
              className={cn(
                "mb-3 flex items-center gap-2 text-al-text-secondary",
                OPERATOR_TYPOGRAPHY.helper,
              )}
              data-testid="governance-findings-hide-generic-control"
            >
              <input
                type="checkbox"
                checked={props.hideGenericLowDensity}
                onChange={(event) => {
                  props.onHideGenericLowDensityChange(event.target.checked);
                }}
              />
              Hide generic findings (density score below {INSIGHT_DENSITY_GENERIC_THRESHOLD}) — advisory only
            </label>
          ) : null}
          {props.architectureScopeHonesty.line !== null ? (
            <p
              className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
              data-testid="governance-findings-architecture-scope-honesty"
            >
              {props.architectureScopeHonesty.line}
            </p>
          ) : null}
          {props.hiddenFilterHonesty.hasHidden ? (
            <FindingsHiddenFilterHonestyBand
              honesty={props.hiddenFilterHonesty}
              onShowAll={props.onShowAllFilteredFindings}
            />
          ) : null}
          <WorkingFindingsKeyboardHint />
          {inhabitedFindingsDocument ? (
            <InhabitedFindingsFocusCoordinator
              enabled={inhabitedFindingsDocument}
              hasFindingCards={props.displayedRows.some((row) => row.recordKind === "finding")}
            />
          ) : null}
          <GovernanceFindingsList
            displayedRows={props.displayedRows}
            buyerPolishedShell={props.buyerPolishedShell}
            inhabitedFindingsDocument={inhabitedFindingsDocument}
            scopedArchitectureId={props.scopedArchitectureId}
            isWorkingMode={props.isWorkingMode}
            groupByResource={props.groupByResource}
            queueMode={props.mode}
            selectedFindingIds={props.selectedFindingIds}
            onSelectionChange={props.onSelectionChange}
            onBulkApplied={props.onBulkApplied}
            showInsightDensityScore={props.showInsightDensityScore}
          />
          <GovernanceFindingsQueueResultsPartialCaptureFootnote />
        </>
      ) : null}
    </>
  );
}
