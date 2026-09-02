"use client";

import { GovernanceFindingsContinueLastViewedRow } from "@/app/(operator)/governance/findings/GovernanceFindingsContinueLastViewedRow";
import { EnterpriseCompactEmptyState } from "@/components/EnterpriseCompactEmptyState";
import { Button } from "@/components/ui/button";
import { GovernanceFindingsList } from "@/components/governance/findings/GovernanceFindingsList";
import { PolicyPackAssignFromReviewStrip } from "@/components/governance/PolicyPackAssignFromReviewStrip";
import { SponsorStorySynopsisFromCounts } from "@/components/operator/SponsorStorySynopsisPanel";
import { AssignedToMeContinueOldestFindingStrip } from "@/components/usability/AssignedToMeContinueOldestFindingStrip";
import { FindingsTriageFirstFindingStrip } from "@/components/usability/FindingsTriageFirstFindingStrip";
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
          footer={
            <Button type="button" size="sm" variant="outline" onClick={props.onClearAllFilters}>
              Clear filters
            </Button>
          }
          testId="governance-findings-filter-no-match-empty"
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
          <GovernanceFindingsList
            displayedRows={props.displayedRows}
            buyerPolishedShell={props.buyerPolishedShell}
            groupByResource={props.groupByResource}
            queueMode={props.mode}
            selectedFindingIds={props.selectedFindingIds}
            onSelectionChange={props.onSelectionChange}
            onBulkApplied={props.onBulkApplied}
          />
        </>
      ) : null}
    </>
  );
}
