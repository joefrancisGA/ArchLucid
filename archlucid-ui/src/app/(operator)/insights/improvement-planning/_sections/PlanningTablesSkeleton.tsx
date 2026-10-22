import {
  EnterpriseTable,
  EnterpriseTableBody,
  EnterpriseTableCell,
  EnterpriseTableHead,
  EnterpriseTableHeadRow,
  EnterpriseTableHeaderCell,
  EnterpriseTableRow,
} from "@/components/ui/enterprise-table";

const SKELETON_CELL_CLASS = "h-4 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800";

export type PlanningTablesSkeletonProps = {
  readonly themeRowCount: number;
  readonly planRowCount: number;
};

/** Preserves themes and plans table layout during refresh so the register does not collapse. */
export function PlanningTablesSkeleton(props: PlanningTablesSkeletonProps): React.JSX.Element {
  const themeRows = Math.max(1, props.themeRowCount);
  const planRows = Math.max(1, props.planRowCount);

  return (
    <div className="space-y-7" data-testid="planning-tables-skeleton" aria-busy="true">
      <EnterpriseTable ariaLabel="Improvement planning themes" aria-busy="true">
        <EnterpriseTableHead>
          <EnterpriseTableHeadRow>
            <EnterpriseTableHeaderCell>Theme</EnterpriseTableHeaderCell>
            <EnterpriseTableHeaderCell>Feedback signals</EnterpriseTableHeaderCell>
            <EnterpriseTableHeaderCell>Impacted area</EnterpriseTableHeaderCell>
            <EnterpriseTableHeaderCell>Action</EnterpriseTableHeaderCell>
          </EnterpriseTableHeadRow>
        </EnterpriseTableHead>
        <EnterpriseTableBody>
          {Array.from({ length: themeRows }, (_, index) => (
            <EnterpriseTableRow key={`planning-theme-skeleton-${index}`}>
              {Array.from({ length: 4 }, (__, cellIndex) => (
                <EnterpriseTableCell key={`planning-theme-skeleton-cell-${index}-${cellIndex}`}>
                  <div className={SKELETON_CELL_CLASS} />
                </EnterpriseTableCell>
              ))}
            </EnterpriseTableRow>
          ))}
        </EnterpriseTableBody>
      </EnterpriseTable>
      <EnterpriseTable ariaLabel="Improvement plans" aria-busy="true">
        <EnterpriseTableHead>
          <EnterpriseTableHeadRow>
            <EnterpriseTableHeaderCell>Priority</EnterpriseTableHeaderCell>
            <EnterpriseTableHeaderCell>Plan</EnterpriseTableHeaderCell>
            <EnterpriseTableHeaderCell>Theme</EnterpriseTableHeaderCell>
            <EnterpriseTableHeaderCell>Status</EnterpriseTableHeaderCell>
            <EnterpriseTableHeaderCell>Recommended next action</EnterpriseTableHeaderCell>
          </EnterpriseTableHeadRow>
        </EnterpriseTableHead>
        <EnterpriseTableBody>
          {Array.from({ length: planRows }, (_, index) => (
            <EnterpriseTableRow key={`planning-plan-skeleton-${index}`}>
              {Array.from({ length: 5 }, (__, cellIndex) => (
                <EnterpriseTableCell key={`planning-plan-skeleton-cell-${index}-${cellIndex}`}>
                  <div className={SKELETON_CELL_CLASS} />
                </EnterpriseTableCell>
              ))}
            </EnterpriseTableRow>
          ))}
        </EnterpriseTableBody>
      </EnterpriseTable>
    </div>
  );
}
