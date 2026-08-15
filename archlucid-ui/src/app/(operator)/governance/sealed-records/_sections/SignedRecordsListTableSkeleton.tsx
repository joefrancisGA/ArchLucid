import {
  EnterpriseTable,
  EnterpriseTableBody,
  EnterpriseTableCell,
  EnterpriseTableHead,
  EnterpriseTableHeadRow,
  EnterpriseTableHeaderCell,
  EnterpriseTableRow,
} from "@/components/ui/enterprise-table";

import {
  SIGNED_RECORDS_LIST_PAGE_TITLE,
  SIGNED_RECORDS_LIST_TABLE_ACTIONS_COLUMN,
  SIGNED_RECORDS_LIST_TABLE_FINALIZED_COLUMN,
  SIGNED_RECORDS_LIST_TABLE_INTEGRITY_COLUMN,
  SIGNED_RECORDS_LIST_TABLE_REVIEW_COLUMN,
  SIGNED_RECORDS_LIST_TABLE_VERSION_COLUMN,
} from "./signed-records-list-copy";

export type SignedRecordsListTableSkeletonProps = {
  readonly rowCount: number;
};

const SKELETON_CELL_CLASS = "h-4 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800";

/** Preserves table layout during page fetches so pagination does not collapse the register. */
export function SignedRecordsListTableSkeleton(props: SignedRecordsListTableSkeletonProps): React.JSX.Element {
  const rowCount = Math.max(1, props.rowCount);

  return (
    <EnterpriseTable ariaLabel={SIGNED_RECORDS_LIST_PAGE_TITLE} aria-busy="true" data-testid="signed-records-list-table-skeleton">
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
        {Array.from({ length: rowCount }, (_, index) => (
          <EnterpriseTableRow key={`skeleton-${index}`}>
            <EnterpriseTableCell>
              <div className={SKELETON_CELL_CLASS} />
            </EnterpriseTableCell>
            <EnterpriseTableCell>
              <div className={SKELETON_CELL_CLASS} />
            </EnterpriseTableCell>
            <EnterpriseTableCell>
              <div className={SKELETON_CELL_CLASS} />
            </EnterpriseTableCell>
            <EnterpriseTableCell>
              <div className={SKELETON_CELL_CLASS} />
            </EnterpriseTableCell>
            <EnterpriseTableCell>
              <div className={SKELETON_CELL_CLASS} />
            </EnterpriseTableCell>
          </EnterpriseTableRow>
        ))}
      </EnterpriseTableBody>
    </EnterpriseTable>
  );
}
