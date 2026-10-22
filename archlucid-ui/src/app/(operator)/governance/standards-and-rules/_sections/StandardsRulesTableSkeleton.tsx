import {
  EnterpriseTable,
  EnterpriseTableBody,
  EnterpriseTableCell,
  EnterpriseTableHead,
  EnterpriseTableHeadRow,
  EnterpriseTableHeaderCell,
  EnterpriseTableRow,
} from "@/components/ui/enterprise-table";
import { STANDARDS_RULES_TABLE_TITLE } from "@/lib/standards-rules-page";

export type StandardsRulesTableSkeletonProps = {
  readonly rowCount: number;
};

const SKELETON_CELL_CLASS = "h-4 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800";

/** Preserves enforced-rules table layout during refresh so filters do not collapse the surface. */
export function StandardsRulesTableSkeleton(props: StandardsRulesTableSkeletonProps): React.JSX.Element {
  const rowCount = Math.max(1, props.rowCount);

  return (
    <EnterpriseTable
      ariaLabel={STANDARDS_RULES_TABLE_TITLE}
      aria-busy="true"
      data-testid="standards-rules-table-skeleton"
    >
      <EnterpriseTableHead>
        <EnterpriseTableHeadRow>
          <EnterpriseTableHeaderCell>Rule</EnterpriseTableHeaderCell>
          <EnterpriseTableHeaderCell>Standard / Framework</EnterpriseTableHeaderCell>
          <EnterpriseTableHeaderCell>Category</EnterpriseTableHeaderCell>
          <EnterpriseTableHeaderCell>Severity</EnterpriseTableHeaderCell>
          <EnterpriseTableHeaderCell>Enforcement mode</EnterpriseTableHeaderCell>
          <EnterpriseTableHeaderCell>Evidence</EnterpriseTableHeaderCell>
          <EnterpriseTableHeaderCell>Source policy pack</EnterpriseTableHeaderCell>
          <EnterpriseTableHeaderCell>Linked findings</EnterpriseTableHeaderCell>
        </EnterpriseTableHeadRow>
      </EnterpriseTableHead>
      <EnterpriseTableBody>
        {Array.from({ length: rowCount }, (_, index) => (
          <EnterpriseTableRow key={`standards-rules-skeleton-${index}`}>
            {Array.from({ length: 8 }, (__, cellIndex) => (
              <EnterpriseTableCell key={`standards-rules-skeleton-cell-${index}-${cellIndex}`}>
                <div className={SKELETON_CELL_CLASS} />
              </EnterpriseTableCell>
            ))}
          </EnterpriseTableRow>
        ))}
      </EnterpriseTableBody>
    </EnterpriseTable>
  );
}
