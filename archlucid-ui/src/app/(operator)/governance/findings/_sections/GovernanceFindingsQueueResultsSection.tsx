"use client";

import { GovernanceFindingsContinueLastViewedRow } from "@/app/(operator)/governance/findings/GovernanceFindingsContinueLastViewedRow";
import { EnterpriseCompactEmptyState } from "@/components/EnterpriseCompactEmptyState";
import { FindingsHiddenFilterHonestyBand } from "@/components/findings/FindingsHiddenFilterHonestyBand";
import { GovernanceFindingsList } from "@/components/governance/findings/GovernanceFindingsList";
import { PolicyPackAssignFromReviewStrip } from "@/components/governance/PolicyPackAssignFromReviewStrip";
import { SponsorStorySynopsisFromCounts } from "@/components/operator/SponsorStorySynopsisPanel";
import { AssignedToMeContinueOldestFindingStrip } from "@/components/usability/AssignedToMeContinueOldestFindingStrip";
import { FindingsTriageFirstFindingStrip } from "@/components/usability/FindingsTriageFirstFindingStrip";
import { WorkingFindingsKeyboardHint } from "@/components/governance/findings/WorkingFindingsKeyboardHint";
import { INSIGHT_DENSITY_GENERIC_THRESHOLD } from "@/lib/governance/governance-findings-density-sort";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

import type { GovernanceFindingsQueueAssignedToMeShellProps } from "@/app/(operator)/governance/findings/GovernanceFindingsQueueAssignedToMeShell";

export function GovernanceFindingsQueueResultsSection(
  props: GovernanceFindingsQueueAssignedToMeShellProps,
): React.JSX.Element {
  return (
    <>
      {props.loading ? (
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>Loading findings…</p>
      ) : null}

      {!props.loading && props.rows.length > 0 && props.displayedRows.length === 0 ? (
        <EnterpriseCompactEmptyState
          {...props.filterNoMatchPreset}
          description={
            props.activeFiltersSummary !== null
              ? `${props.filterNoMatchPreset.description} Active filters: ${props.activeFiltersSummary}.`
              : props.filterNoMatchPreset.description
          }
        />
      ) : null}

      {!props.loading && props.displayedRows.length > 0 ? (
        <>
          <SponsorStorySynopsisFromCounts
            packageTitle={props.sponsorSynopsisPackageTitle}
            counts={props.sponsorSynopsisCounts}
            sponsorHandoffHref={props.sponsorHandoffHref}
          />
          {props.scopedRunId !== null && props.scopedRunId.length > 0 ? (
            <PolicyPackAssignFromReviewStrip
              reviewId={props.scopedRunId}
              reviewTitle={props.scopedRunContextTitle}
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
          {props.hiddenFilterHonesty.hasHidden ? (
            <FindingsHiddenFilterHonestyBand
              honesty={props.hiddenFilterHonesty}
              onShowAll={props.onShowAllFilteredFindings}
            />
          ) : null}
          <WorkingFindingsKeyboardHint />
          <GovernanceFindingsList
            displayedRows={props.displayedRows}
            buyerPolishedShell={props.buyerPolishedShell}
            groupByResource={props.groupByResource}
            queueMode={props.mode}
            selectedFindingIds={props.selectedFindingIds}
            onSelectionChange={props.onSelectionChange}
            onBulkApplied={props.onBulkApplied}
            showInsightDensityScore={props.showInsightDensityScore}
          />
        </>
      ) : null}
    </>
  );
}
