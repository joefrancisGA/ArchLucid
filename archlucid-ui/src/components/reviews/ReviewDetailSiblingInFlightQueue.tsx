"use client";

import Link from "next/link";

import { InFlightAnalysisDeskList } from "@/components/operations/InFlightAnalysisDeskList";
import { useWorkspaceMode } from "@/components/WorkspaceModeProvider";
import { useShellInFlightOperations } from "@/hooks/use-shell-in-flight-operations";
import { REVIEWS_LIST_PATH } from "@/lib/architecture/architecture-routes";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  mapInFlightOperationsToDeskRows,
  type InFlightDeskRow,
} from "@/lib/operations/map-in-flight-desk-rows";
import { cn } from "@/lib/utils";

export type ReviewDetailSiblingInFlightQueueProps = {
  readonly runId: string;
};

function filterSiblingInFlightRows(
  rows: readonly InFlightDeskRow[],
  currentRunId: string,
): readonly InFlightDeskRow[] {
  const trimmedRunId = currentRunId.trim();

  return rows.filter((row) => {
    const hrefRunMatch = /\/architecture\/reviews\/([^/?]+)/.exec(row.href);
    const hrefRunId = hrefRunMatch?.[1]?.trim() ?? "";

    return hrefRunId.length > 0 && hrefRunId !== trimmedRunId;
  });
}

/** Other in-flight packages while this review runs (FD-04). */
export function ReviewDetailSiblingInFlightQueue(
  props: ReviewDetailSiblingInFlightQueueProps,
): React.JSX.Element | null {
  const { isWorkingMode } = useWorkspaceMode();
  const operations = useShellInFlightOperations();
  const allRows = mapInFlightOperationsToDeskRows(operations);
  const siblingRows = filterSiblingInFlightRows(allRows, props.runId);

  if (!isWorkingMode) {
    return null;
  }

  if (siblingRows.length === 0) {
    return (
      <p
        className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
        data-testid="review-detail-sibling-in-flight-empty"
      >
        No other packages are in flight.{" "}
        <Link href={REVIEWS_LIST_PATH} className="text-al-link underline-offset-2 hover:underline">
          Open the reviews hub
        </Link>{" "}
        to scan the full in-flight queue.
      </p>
    );
  }

  return (
    <InFlightAnalysisDeskList
      rows={siblingRows}
      heading="Other packages in flight"
      headingId="review-detail-sibling-in-flight-heading"
      testId="review-detail-sibling-in-flight-queue"
      rowLinkTestIdPrefix="review-detail-sibling-in-flight"
    />
  );
}
