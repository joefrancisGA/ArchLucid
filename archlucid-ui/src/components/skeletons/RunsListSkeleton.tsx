import { Skeleton } from "@/components/ui/skeleton";
import {
  EnterpriseTable,
  EnterpriseTableBody,
  EnterpriseTableCell,
  EnterpriseTableHead,
  EnterpriseTableHeadRow,
  EnterpriseTableHeaderCell,
  EnterpriseTableRow,
} from "@/components/ui/enterprise-table";

import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

/**
 * Mirrors the reviews list page: heading, controls row, and table-shaped placeholders.
 */
export function RunsListSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading reviews list" className="space-y-4">
      <Skeleton className="h-7 w-48" />
      <Skeleton className="h-4 w-full max-w-xl" />
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <Skeleton className="h-10 w-full max-w-md" />
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-4 w-56" />
      </div>
      <EnterpriseTable ariaLabel="Reviews list loading placeholder" className={OPERATOR_TYPOGRAPHY.body}>
        <EnterpriseTableHead>
          <EnterpriseTableHeadRow>
            <EnterpriseTableHeaderCell>
              <Skeleton className="h-4 w-16" />
            </EnterpriseTableHeaderCell>
            <EnterpriseTableHeaderCell>
              <Skeleton className="h-4 w-14" />
            </EnterpriseTableHeaderCell>
            <EnterpriseTableHeaderCell>
              <Skeleton className="h-4 w-24" />
            </EnterpriseTableHeaderCell>
            <EnterpriseTableHeaderCell>
              <Skeleton className="h-4 w-16" />
            </EnterpriseTableHeaderCell>
            <EnterpriseTableHeaderCell>
              <Skeleton className="h-4 w-20" />
            </EnterpriseTableHeaderCell>
          </EnterpriseTableHeadRow>
        </EnterpriseTableHead>
        <EnterpriseTableBody>
          {[1, 2, 3, 4, 5].map((row) => (
            <EnterpriseTableRow key={row}>
              <EnterpriseTableCell>
                <Skeleton className="h-4 w-28" />
              </EnterpriseTableCell>
              <EnterpriseTableCell>
                <Skeleton className="h-4 w-16" />
              </EnterpriseTableCell>
              <EnterpriseTableCell>
                <Skeleton className="h-4 w-48" />
              </EnterpriseTableCell>
              <EnterpriseTableCell>
                <Skeleton className="h-4 w-24" />
              </EnterpriseTableCell>
              <EnterpriseTableCell>
                <Skeleton className="h-4 w-20" />
              </EnterpriseTableCell>
            </EnterpriseTableRow>
          ))}
        </EnterpriseTableBody>
      </EnterpriseTable>
      <div className="flex flex-wrap gap-4">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-16" />
      </div>
    </div>
  );
}
