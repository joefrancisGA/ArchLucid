"use client";

import Link from "next/link";

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

import {
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
  readonly retryingRunId: string | null;
  readonly onRetryRow: (runId: string) => void;
};

function formatCommittedDate(committedUtc: string): string {
  const trimmed = committedUtc.trim();

  if (trimmed.length === 0) {
    return SIGNED_RECORDS_LIST_VERSION_UNKNOWN;
  }

  const parsed = Date.parse(trimmed);

  if (Number.isNaN(parsed)) {
    return SIGNED_RECORDS_LIST_VERSION_UNKNOWN;
  }

  return new Date(parsed).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function SignedRecordsListSealDetails(props: {
  readonly row: SignedRecordsListRow;
}): React.JSX.Element | null {
  const { row } = props;
  const digest = row.sealDigestTruncated?.trim() ?? "";

  if (digest.length === 0 || digest === SIGNED_RECORDS_LIST_VERSION_UNKNOWN) {
    return null;
  }

  return (
    <CollapsibleSection
      title={SIGNED_RECORDS_LIST_SEAL_DETAILS_DISCLOSURE}
      summaryAriaLabel={`${SIGNED_RECORDS_LIST_SEAL_DETAILS_DISCLOSURE} for ${row.reviewTitle}`}
      sectionTestId={`signed-record-seal-details-${row.runId}`}
    >
      <dl className={cn("m-0 space-y-1", OPERATOR_TYPOGRAPHY.helper)}>
        {row.sealSigner ? (
          <>
            <dt className="text-al-text-secondary">Signer</dt>
            <dd className="m-0 font-medium text-al-text-primary">{row.sealSigner}</dd>
          </>
        ) : null}
        <dt className="text-al-text-secondary">{SIGNED_RECORDS_LIST_SEAL_DIGEST_LABEL}</dt>
        <dd className="m-0 font-mono text-al-text-primary">{digest}</dd>
      </dl>
    </CollapsibleSection>
  );
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
          <EnterpriseTableHeaderCell>{SIGNED_RECORDS_LIST_TABLE_INTEGRITY_COLUMN}</EnterpriseTableHeaderCell>
          <EnterpriseTableHeaderCell>{SIGNED_RECORDS_LIST_TABLE_ACTIONS_COLUMN}</EnterpriseTableHeaderCell>
        </EnterpriseTableHeadRow>
      </EnterpriseTableHead>
      <EnterpriseTableBody>
        {rows.map((row) => {
          const signedRecordHref = row.signedRecordHref;
          const lookupFailure = row.recordLookupFailure;
          const lookupMessage =
            lookupFailure !== null ? signedRecordsListRecordLookupFailureMessage(lookupFailure) : null;

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
                {row.sealIntegrity !== null ? (
                  <div className="space-y-2">
                    <StatusTag
                      kind={row.sealIntegrity.kind}
                      label={row.sealIntegrity.label}
                      data-testid={`signed-record-integrity-${row.runId}`}
                    />
                    <SignedRecordsListSealDetails row={row} />
                  </div>
                ) : (
                  SIGNED_RECORDS_LIST_VERSION_UNKNOWN
                )}
              </EnterpriseTableCell>
              <EnterpriseTableCell>
                <div className="flex flex-col gap-2">
                  {lookupMessage !== null ? (
                    <p
                      className={cn("m-0 max-w-md text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
                      data-testid={`signed-record-unavailable-message-${row.runId}`}
                    >
                      {lookupMessage}
                    </p>
                  ) : null}
                  <div className="flex flex-wrap items-center gap-2">
                    {signedRecordHref !== null ? (
                      <Button asChild variant="default" size="sm">
                        <Link href={signedRecordHref}>{SIGNED_RECORDS_LIST_OPEN_RECORD_ACTION}</Link>
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={retryingRunId === row.runId}
                        onClick={() => onRetryRow(row.runId)}
                      >
                        {SIGNED_RECORDS_LIST_RETRY_RECORD_ACTION}
                      </Button>
                    )}
                  </div>
                </div>
              </EnterpriseTableCell>
            </EnterpriseTableRow>
          );
        })}
      </EnterpriseTableBody>
    </EnterpriseTable>
  );
}
