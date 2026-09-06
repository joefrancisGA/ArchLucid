"use client";

import { useMemo } from "react";

import { InFlightAnalysisDeskList } from "@/components/operations/InFlightAnalysisDeskList";
import { useShellInFlightOperations } from "@/hooks/use-shell-in-flight-operations";
import { useRehydrateInFlightFromWorkingContinuity } from "@/hooks/use-rehydrate-in-flight-from-architecture";
import { OPERATOR_HOME_IN_PROGRESS_HEADING } from "@/lib/buyer-copy/operator-home";
import { mapInFlightOperationsToDeskRows } from "@/lib/operations/map-in-flight-desk-rows";

/** Working Overview: in-flight analysis desk backed by the shell operations store (LI-08). */
export function OperatorHomeInFlightReviewsSection(): React.JSX.Element | null {
  useRehydrateInFlightFromWorkingContinuity();
  const operations = useShellInFlightOperations();
  const rows = useMemo(() => mapInFlightOperationsToDeskRows(operations), [operations]);

  if (rows.length === 0) {
    return null;
  }

  return (
    <InFlightAnalysisDeskList
      rows={rows}
      heading={OPERATOR_HOME_IN_PROGRESS_HEADING}
      headingId="operator-home-in-flight-reviews-heading"
      testId="operator-home-in-flight-reviews"
      rowLinkTestIdPrefix="operator-home-in-flight"
    />
  );
}
