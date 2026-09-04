"use client";

import { InFlightAnalysisDeskList } from "@/components/operations/InFlightAnalysisDeskList";
import { OPERATOR_HOME_IN_PROGRESS_HEADING } from "@/lib/buyer-copy/operator-home";
import type { InFlightDeskRow } from "@/lib/operations/map-in-flight-desk-rows";

export type ReviewsHubInFlightAnalysisDeskProps = {
  readonly rows: readonly InFlightDeskRow[];
};

/** Reviews hub first-class in-flight analysis desk (LI-08). */
export function ReviewsHubInFlightAnalysisDesk(
  props: ReviewsHubInFlightAnalysisDeskProps,
): React.JSX.Element | null {
  if (props.rows.length === 0) {
    return null;
  }

  return (
    <InFlightAnalysisDeskList
      rows={props.rows}
      heading={OPERATOR_HOME_IN_PROGRESS_HEADING}
      headingId="reviews-hub-in-flight-analysis-heading"
      testId="reviews-hub-in-flight-analysis"
      rowLinkTestIdPrefix="reviews-hub-in-flight"
    />
  );
}
