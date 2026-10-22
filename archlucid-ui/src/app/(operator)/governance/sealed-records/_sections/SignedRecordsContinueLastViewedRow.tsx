"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { OPERATOR_TYPOGRAPHY, OPERATOR_RESUME } from "@/lib/design-tokens";
import { signedRecordScopedHref } from "@/lib/signed-records-paths";
import { cn } from "@/lib/utils";
import type { SignedRecordsListRow } from "@/app/(operator)/governance/sealed-records/_sections/signed-records-list-row";

export type SignedRecordsContinueLastViewedRowProps = {
  readonly row: SignedRecordsListRow;
  readonly scopedRunId?: string;
};

function continueLastSignedRecordHref(row: SignedRecordsListRow, scopedRunId: string): string {
  const scoped = scopedRunId.trim();
  const manifestId = row.manifestId?.trim() ?? "";

  if (manifestId.length > 0) {
    return signedRecordScopedHref(manifestId, scoped.length > 0 ? scoped : null);
  }

  return row.signedRecordHref ?? row.reviewHref;
}

/** Pinned continue row for the most recently viewed sealed record. */
export function SignedRecordsContinueLastViewedRow(
  props: SignedRecordsContinueLastViewedRowProps,
): React.JSX.Element {
  const href = continueLastSignedRecordHref(props.row, props.scopedRunId ?? "");

  return (
    <section
      aria-labelledby="signed-records-continue-last-viewed-heading"
      className={OPERATOR_RESUME.stripSpaced}
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
