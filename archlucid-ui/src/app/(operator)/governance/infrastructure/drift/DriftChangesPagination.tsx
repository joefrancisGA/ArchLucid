"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  DRIFT_CHANGES_PAGE_SIZE_OPTIONS,
  type DriftChangesPageSize,
} from "@/lib/infra-evidence/infra-evidence-drift-table-filter";
import { formatInventoryPageRangeLine, inventoryTotalPageCount } from "@/lib/inventory-showing-count";
import { cn } from "@/lib/utils";

export const DRIFT_CHANGES_PAGINATION_ARIA_LABEL = "Drift changes pagination";
export const DRIFT_CHANGES_PAGE_SELECT_LABEL = "Page";
export const DRIFT_CHANGES_PAGE_SIZE_LABEL = "Rows per page";

export type DriftChangesPaginationProps = {
  readonly page: number;
  readonly pageSize: DriftChangesPageSize;
  readonly totalCount: number;
  readonly disabled?: boolean;
  readonly onPageChange: (page: number) => void;
  readonly onPageSizeChange: (pageSize: DriftChangesPageSize) => void;
};

export function DriftChangesPagination(props: DriftChangesPaginationProps): React.JSX.Element | null {
  const pageCount = inventoryTotalPageCount(props.totalCount, props.pageSize);
  const safePage = Math.min(pageCount, Math.max(1, props.page));
  const showingLine = formatInventoryPageRangeLine(safePage, props.pageSize, props.totalCount);
  const controlsDisabled = props.disabled === true;
  const canGoPrevious = safePage > 1;
  const canGoNext = safePage < pageCount;

  if (showingLine == null) {
    return null;
  }

  const pageNumbers = Array.from({ length: pageCount }, (_, index) => index + 1);

  return (
    <nav
      className={cn("flex flex-wrap items-end justify-between gap-3", OPERATOR_TYPOGRAPHY.body)}
      aria-label={DRIFT_CHANGES_PAGINATION_ARIA_LABEL}
      data-testid="infra-drift-changes-pagination"
    >
      <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)} data-testid="infra-drift-changes-showing-line">
        {showingLine}
      </p>
      <div className="flex flex-wrap items-end gap-3">
        <div className="grid gap-1">
          <Label htmlFor="infra-drift-changes-page-select">{DRIFT_CHANGES_PAGE_SELECT_LABEL}</Label>
          <select
            id="infra-drift-changes-page-select"
            className={cn(
              "rounded-md border border-neutral-200 bg-white px-3 py-2 dark:border-neutral-800 dark:bg-neutral-950",
            )}
            data-testid="infra-drift-changes-page-select"
            disabled={controlsDisabled}
            value={safePage}
            onChange={(event) => {
              const nextPage = Number.parseInt(event.target.value, 10);

              if (!Number.isFinite(nextPage) || nextPage < 1) {
                return;
              }

              props.onPageChange(nextPage);
            }}
          >
            {pageNumbers.map((pageNumber) => (
              <option key={pageNumber} value={pageNumber}>
                {pageNumber} of {pageCount}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            data-testid="infra-drift-changes-previous"
            disabled={controlsDisabled || !canGoPrevious}
            onClick={() => {
              props.onPageChange(safePage - 1);
            }}
          >
            Previous
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            data-testid="infra-drift-changes-next"
            disabled={controlsDisabled || !canGoNext}
            onClick={() => {
              props.onPageChange(safePage + 1);
            }}
          >
            Next
          </Button>
        </div>
        <div className="grid gap-1">
          <Label htmlFor="infra-drift-changes-page-size">{DRIFT_CHANGES_PAGE_SIZE_LABEL}</Label>
          <select
            id="infra-drift-changes-page-size"
            className={cn(
              "rounded-md border border-neutral-200 bg-white px-3 py-2 dark:border-neutral-800 dark:bg-neutral-950",
            )}
            data-testid="infra-drift-changes-page-size"
            disabled={controlsDisabled}
            value={props.pageSize}
            onChange={(event) => {
              const nextPageSize = Number.parseInt(event.target.value, 10);

              for (const option of DRIFT_CHANGES_PAGE_SIZE_OPTIONS) {
                if (nextPageSize === option) {
                  props.onPageSizeChange(option);
                  return;
                }
              }
            }}
          >
            {DRIFT_CHANGES_PAGE_SIZE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      </div>
    </nav>
  );
}
