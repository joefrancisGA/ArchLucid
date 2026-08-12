"use client";

import Link from "next/link";

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
import { OPERATOR_LINK } from "@/lib/design-tokens";

import {
  SIGNED_RECORDS_LIST_OPEN_RECORD_ACTION,
  SIGNED_RECORDS_LIST_PAGE_TITLE,
  SIGNED_RECORDS_LIST_RECORD_UNAVAILABLE_LABEL,
  SIGNED_RECORDS_LIST_RETRY_RECORD_ACTION,
  SIGNED_RECORDS_LIST_TABLE_ACTIONS_COLUMN,
  SIGNED_RECORDS_LIST_TABLE_FINALIZED_COLUMN,
  SIGNED_RECORDS_LIST_TABLE_REVIEW_COLUMN,
  SIGNED_RECORDS_LIST_TABLE_VERSION_COLUMN,
} from "./signed-records-list-copy";
import type { SignedRecordsListRow } from "./signed-records-list-row";

export type SignedRecordsListTableProps = {
  readonly rows: readonly SignedRecordsListRow[];
  readonly retryingRunId: string | null;
  readonly onRetryRow: (runId: string) => void;
};

function formatCommittedDate(committedUtc: string): string {
  const parsed = Date.parse(committedUtc);

  if (Number.isNaN(parsed)) {
    return "—";
  }

  return new Date(parsed).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/** EnterpriseTable body for the signed-records index — deferred off First Load (wave 11). */
export function SignedRecordsListTable(props: SignedRecordsListTableProps): React.JSX.Element {
  const { rows, retryingRunId, onRetryRow } = props;

  return (
    <EnterpriseTable ariaLabel={SIGNED_RECORDS_LIST_PAGE_TITLE}>
      <EnterpriseTableHead>
        <EnterpriseTableHeadRow>
          <EnterpriseTableHeaderCell>{SIGNED_RECORDS_LIST_TABLE_REVIEW_COLUMN}</EnterpriseTableHeaderCell>
          <EnterpriseTableHeaderCell>{SIGNED_RECORDS_LIST_TABLE_VERSION_COLUMN}</EnterpriseTableHeaderCell>
          <EnterpriseTableHeaderCell>{SIGNED_RECORDS_LIST_TABLE_FINALIZED_COLUMN}</EnterpriseTableHeaderCell>
          <EnterpriseTableHeaderCell>{SIGNED_RECORDS_LIST_TABLE_ACTIONS_COLUMN}</EnterpriseTableHeaderCell>
        </EnterpriseTableHeadRow>
      </EnterpriseTableHead>
      <EnterpriseTableBody>
        {rows.map((row) => {
          const signedRecordHref = row.signedRecordHref;

          return (
            <EnterpriseTableRow key={row.runId}>
              <EnterpriseTableCell>
                <Link href={row.reviewHref} className={OPERATOR_LINK.nav}>
                  {row.reviewTitle}
                </Link>
              </EnterpriseTableCell>
              <EnterpriseTableCell>{row.manifestVersion}</EnterpriseTableCell>
              <EnterpriseTableCell>{formatCommittedDate(row.committedUtc)}</EnterpriseTableCell>
              <EnterpriseTableCell>
                <div className="flex flex-wrap items-center gap-2">
                  {signedRecordHref !== null ? (
                    <Button asChild variant="default" size="sm">
                      <Link href={signedRecordHref}>{SIGNED_RECORDS_LIST_OPEN_RECORD_ACTION}</Link>
                    </Button>
                  ) : (
                    <>
                      <StatusTag
                        kind="needs-attention"
                        label={SIGNED_RECORDS_LIST_RECORD_UNAVAILABLE_LABEL}
                        data-testid={`signed-record-unavailable-${row.runId}`}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={retryingRunId === row.runId}
                        onClick={() => onRetryRow(row.runId)}
                      >
                        {SIGNED_RECORDS_LIST_RETRY_RECORD_ACTION}
                      </Button>
                    </>
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
