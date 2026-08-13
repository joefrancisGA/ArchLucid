import { EnterpriseTableCell, EnterpriseTableRow } from "@/components/ui/enterprise-table";
import { Skeleton } from "@/components/ui/skeleton";

export type EnterpriseTableSkeletonRowsProps = {
  readonly columns: number;
  readonly rows?: number;
  /** Announced to assistive technology while the rows are placeholders. */
  readonly label?: string;
  readonly testId?: string;
};

/**
 * Placeholder rows held under a table's header while its data loads (TB-2381).
 *
 * Tables that rendered an empty `<tbody>` during load were visually identical to tables with no
 * data, so "still loading" and "nothing here" looked the same, and the row area jumped once the
 * response landed. Reserving rows keeps the shape stable and makes the two states distinguishable.
 */
export function EnterpriseTableSkeletonRows({
  columns,
  rows = 3,
  label = "Loading rows…",
  testId,
}: EnterpriseTableSkeletonRowsProps): React.ReactElement {
  const resolvedTestId = testId ?? "enterprise-table-skeleton-rows";

  return (
    <>
      {Array.from({ length: rows }, (_unusedRow, rowIndex) => (
        <EnterpriseTableRow key={`skeleton-row-${rowIndex}`} data-testid={`${resolvedTestId}-row`}>
          {Array.from({ length: columns }, (_unusedColumn, columnIndex) => (
            <EnterpriseTableCell key={`skeleton-cell-${columnIndex}`}>
              {rowIndex === 0 && columnIndex === 0 ? (
                <span className="sr-only" role="status">
                  {label}
                </span>
              ) : null}
              <Skeleton className="h-4 w-full max-w-[12rem]" aria-hidden />
            </EnterpriseTableCell>
          ))}
        </EnterpriseTableRow>
      ))}
    </>
  );
}
