"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";
import type { SignedRecordsListRow } from "@/app/(operator)/governance/sealed-records/_sections/signed-records-list-row";

export type SignedRecordsContinueLastViewedRowProps = {
  readonly row: SignedRecordsListRow;
};

/** Pinned continue row for the most recently viewed sealed record. */
export function SignedRecordsContinueLastViewedRow(
  props: SignedRecordsContinueLastViewedRowProps,
): React.JSX.Element {
  const href = props.row.signedRecordHref ?? props.row.reviewHref;

  return (
    <section
      aria-labelledby="signed-records-continue-last-viewed-heading"
      className="mb-4 rounded-lg border border-teal-200 bg-teal-50/60 px-4 py-3 dark:border-teal-900/50 dark:bg-teal-950/20"
      data-testid="signed-records-continue-last-viewed-row"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h2
            id="signed-records-continue-last-viewed-heading"
            className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}
          >
            Continue last viewed record
          </h2>
          <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            <span className="font-medium text-al-text-primary">{props.row.reviewTitle}</span>
          </p>
        </div>
        <Button type="button" variant="primary" size="sm" asChild data-testid="signed-records-continue-last-viewed-open">
          <Link href={href}>Open record</Link>
        </Button>
      </div>
    </section>
  );
}
