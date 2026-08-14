"use client";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import {
  SIGNED_RECORDS_LIST_PAGINATION_ARIA_LABEL,
  formatSignedRecordsListPaginationSummary,
} from "./signed-records-list-copy";

export type SignedRecordsListPaginationProps = {
  readonly page: number;
  readonly shownCount: number;
  readonly hasMore: boolean;
  readonly canGoPrevious: boolean;
  readonly canGoNext: boolean;
  readonly onPrevious: () => void;
  readonly onNext: () => void;
};

export function SignedRecordsListPagination(props: SignedRecordsListPaginationProps): React.JSX.Element {
  return (
    <nav
      className={cn("mt-4 flex flex-wrap items-center gap-4 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}
      aria-label={SIGNED_RECORDS_LIST_PAGINATION_ARIA_LABEL}
      data-testid="signed-records-list-pagination"
    >
      <span data-testid="signed-records-list-pagination-summary">
        {formatSignedRecordsListPaginationSummary(props.page, props.shownCount, props.hasMore)}
      </span>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={!props.canGoPrevious}
        onClick={props.onPrevious}
        data-testid="signed-records-list-pagination-previous"
      >
        Previous
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={!props.canGoNext}
        onClick={props.onNext}
        data-testid="signed-records-list-pagination-next"
      >
        Next
      </Button>
    </nav>
  );
}
