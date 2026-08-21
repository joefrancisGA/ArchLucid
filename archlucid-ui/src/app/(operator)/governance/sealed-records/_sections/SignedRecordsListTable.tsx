"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { HelpCopyableValue } from "@/components/help/HelpCopyableValue";
import { CollapsibleSection } from "@/components/CollapsibleSection";
import { Button } from "@/components/ui/button";
import { StatusTag } from "@/components/ui/status-tag";
import {
  EnterpriseTable,
  EnterpriseTableBody,
  EnterpriseTableCell,
  EnterpriseTableHead,
  EnterpriseTableHeadRow,
  EnterpriseTableHeaderCell,
  EnterpriseTableRow,
} from "@/components/ui/enterprise-table";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

import { SignedRecordsListEmptyValue } from "./signed-records-list-empty-value";
import { SignedRecordsListSealedTimestamp } from "./signed-records-list-sealed-timestamp";
import {
  SIGNED_RECORDS_LIST_ENRICHING_CELL_STATUS,
  SIGNED_RECORDS_LIST_OPEN_RECORD_ACTION,
  SIGNED_RECORDS_LIST_PAGE_TITLE,
  SIGNED_RECORDS_LIST_RETRY_RECORD_ACTION,
  SIGNED_RECORDS_LIST_SEAL_DETAILS_DISCLOSURE,
  SIGNED_RECORDS_LIST_SEAL_DIGEST_LABEL,
  SIGNED_RECORDS_LIST_TABLE_ACTIONS_COLUMN,
  SIGNED_RECORDS_LIST_TABLE_FINALIZED_COLUMN,
  SIGNED_RECORDS_LIST_TABLE_INTEGRITY_COLUMN,
  SIGNED_RECORDS_LIST_TABLE_REVIEW_COLUMN,
  SIGNED_RECORDS_LIST_TABLE_VERSION_COLUMN,
  SIGNED_RECORDS_LIST_VERSION_UNKNOWN,
  signedRecordsListRecordLookupFailureMessage,
} from "./signed-records-list-copy";
import type { SignedRecordsListRow } from "./signed-records-list-row";

export type SignedRecordsListTableProps = {
  readonly rows: readonly SignedRecordsListRow[];
  readonly enriching?: boolean;
  readonly retryingRunId: string | null;
  readonly retryFailedRunId?: string | null;
  readonly retrySucceededRunId?: string | null;
  readonly onRetryRow: (runId: string) => void;
};

type SortKey = "reviewTitle" | "committedUtc";

function sortDirectionFor(
  activeKey: SortKey,
  currentKey: SortKey,
  sortAsc: boolean,
): "ascending" | "descending" | "none" {
  if (activeKey !== currentKey) {
    return "none";
  }

  return sortAsc ? "ascending" : "descending";
}

function compareSignedRecordsListRows(
  left: SignedRecordsListRow,
  right: SignedRecordsListRow,
  sortKey: SortKey,
  sortAsc: boolean,
): number {
  let result = 0;

  if (sortKey === "committedUtc") {
    const leftTime = Date.parse(left.committedUtc.trim());
    const rightTime = Date.parse(right.committedUtc.trim());
    const leftValue = Number.isNaN(leftTime) ? 0 : leftTime;
    const rightValue = Number.isNaN(rightTime) ? 0 : rightTime;
    result = leftValue - rightValue;
  } else {
    result = left.reviewTitle.localeCompare(right.reviewTitle);
  }

  return sortAsc ? result : -result;
}

function SignedRecordsListSealDetails(props: {
  readonly row: SignedRecordsListRow;
}): React.JSX.Element | null {
  const { row } = props;
  const digestFull = row.sealDigestFull?.trim() ?? "";

  if (digestFull.length === 0) {
    return null;
  }

  return (
    <CollapsibleSection
      title={SIGNED_RECORDS_LIST_SEAL_DETAILS_DISCLOSURE}
      summaryAriaLabel={`${SIGNED_RECORDS_LIST_SEAL_DETAILS_DISCLOSURE} for ${row.reviewTitle}`}
      sectionTestId={`signed-record-seal-details-${row.runId}`}
    >
      <HelpCopyableValue
        label={SIGNED_RECORDS_LIST_SEAL_DIGEST_LABEL}
        value={digestFull}
        testId={`signed-record-seal-digest-${row.runId}`}
      />
    </CollapsibleSection>
  );
}

/** EnterpriseTable body for the signed-records index — deferred off First Load (wave 11). */
export function SignedRecordsListTable(props: SignedRecordsListTableProps): React.JSX.Element {
  const { rows, enriching = false, retryingRunId, onRetryRow } = props;
  const [sortKey, setSortKey] = useState<SortKey>("committedUtc");
  const [sortAsc, setSortAsc] = useState(false);

  const sortedRows = useMemo(() => {
    const copy = [...rows];

    copy.sort((left, right) => compareSignedRecordsListRows(left, right, sortKey, sortAsc));

    return copy;
  }, [rows, sortAsc, sortKey]);

  function onSort(nextKey: SortKey) {
    if (sortKey === nextKey) {
      setSortAsc((value) => !value);
      return;
    }

    setSortKey(nextKey);
    setSortAsc(nextKey === "reviewTitle");
  }

  return (
    <EnterpriseTable ariaLabel={SIGNED_RECORDS_LIST_PAGE_TITLE} data-testid="signed-records-list-table">
      <caption className="sr-only">
        Finalized review records register — sort Review or Finalized columns to reorder the loaded page.
      </caption>
      <EnterpriseTableHead>
        <EnterpriseTableHeadRow>
          <EnterpriseTableHeaderCell sortDirection={sortDirectionFor("reviewTitle", sortKey, sortAsc)}>
            <button type="button" className="font-inherit" onClick={() => onSort("reviewTitle")}>
              {SIGNED_RECORDS_LIST_TABLE_REVIEW_COLUMN}
            </button>
          </EnterpriseTableHeaderCell>
          <EnterpriseTableHeaderCell>{SIGNED_RECORDS_LIST_TABLE_VERSION_COLUMN}</EnterpriseTableHeaderCell>
          <EnterpriseTableHeaderCell sortDirection={sortDirectionFor("committedUtc", sortKey, sortAsc)}>
            <button type="button" className="font-inherit" onClick={() => onSort("committedUtc")}>
              {SIGNED_RECORDS_LIST_TABLE_FINALIZED_COLUMN}
            </button>
          </EnterpriseTableHeaderCell>
          <EnterpriseTableHeaderCell>{SIGNED_RECORDS_LIST_TABLE_INTEGRITY_COLUMN}</EnterpriseTableHeaderCell>
          <EnterpriseTableHeaderCell>{SIGNED_RECORDS_LIST_TABLE_ACTIONS_COLUMN}</EnterpriseTableHeaderCell>
        </EnterpriseTableHeadRow>
      </EnterpriseTableHead>
      <EnterpriseTableBody>
        {sortedRows.map((row) => {
          const signedRecordHref = row.signedRecordHref;
          const lookupFailure = row.recordLookupFailure;
          const lookupMessage =
            lookupFailure !== null ? signedRecordsListRecordLookupFailureMessage(lookupFailure) : null;
          const rowEnriching = enriching && row.committedUtc.trim().length === 0 && lookupFailure === null;

          return (
            <EnterpriseTableRow key={row.runId}>
              <EnterpriseTableCell>
                <Link href={row.reviewHref} className={OPERATOR_LINK.nav}>
                  {row.reviewTitle}
                </Link>
              </EnterpriseTableCell>
              <EnterpriseTableCell>
                {row.manifestVersion === SIGNED_RECORDS_LIST_VERSION_UNKNOWN ? (
                  <SignedRecordsListEmptyValue fieldLabel="Version" />
                ) : (
                  row.manifestVersion
                )}
              </EnterpriseTableCell>
              <EnterpriseTableCell>
                {rowEnriching ? (
                  <span
                    className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
                    role="status"
                    data-testid={`signed-record-sealed-pending-${row.runId}`}
                  >
                    {SIGNED_RECORDS_LIST_ENRICHING_CELL_STATUS}
                  </span>
                ) : (
                  <SignedRecordsListSealedTimestamp committedUtc={row.committedUtc} />
                )}
              </EnterpriseTableCell>
              <EnterpriseTableCell>
                {lookupMessage !== null ? (
                  <p
                    className={cn("m-0 max-w-md text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
                    data-testid={`signed-record-unavailable-message-${row.runId}`}
                  >
                    {lookupMessage}
                  </p>
                ) : null}
                {row.sealIntegrity !== null ? (
                  <div className="space-y-2">
                    <StatusTag
                      kind={row.sealIntegrity.kind}
                      label={row.sealIntegrity.label}
                      data-testid={`signed-record-integrity-${row.runId}`}
                    />
                    <SignedRecordsListSealDetails row={row} />
                  </div>
                ) : lookupMessage === null ? (
                  <SignedRecordsListEmptyValue fieldLabel="Record integrity" />
                ) : null}
              </EnterpriseTableCell>
              <EnterpriseTableCell>
                <div className="flex flex-wrap items-center gap-2">
                  {signedRecordHref !== null ? (
                    <Button asChild variant="outline" size="sm">
                      <Link href={signedRecordHref}>{SIGNED_RECORDS_LIST_OPEN_RECORD_ACTION}</Link>
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={retryingRunId === row.runId}
                      aria-busy={retryingRunId === row.runId}
                      data-testid={`signed-record-retry-${row.runId}`}
                      onClick={() => onRetryRow(row.runId)}
                    >
                      {SIGNED_RECORDS_LIST_RETRY_RECORD_ACTION}
                    </Button>
                  )}
                </div>
              </EnterpriseTableCell>
            </EnterpriseTableRow>
          );
        })}
      </EnterpriseTableBody>
    </EnterpriseTable>
  );
}
