import Link from "next/link";

import { Button } from "@/components/ui/button";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { RunDetailNextReviewTarget } from "@/lib/resolve-next-runs-list-row";
import { SIGNED_RECORDS_LIST_PATH } from "@/lib/signed-records-paths";
import { cn } from "@/lib/utils";

export type SignedRecordsListNextReviewFooterProps = {
  readonly target: RunDetailNextReviewTarget;
};

/** Footer CTA to open signed records for the next review. */
export function SignedRecordsListNextReviewFooter(
  props: SignedRecordsListNextReviewFooterProps,
): React.JSX.Element {
  return (
    <section
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 rounded-md border border-neutral-200 bg-al-surface-raised px-3 py-3 dark:border-neutral-800",
        OPERATOR_TYPOGRAPHY.body,
      )}
      data-testid="signed-records-list-next-review-footer"
      aria-label="Next review signed records"
    >
      <div className="min-w-0">
        <p className="m-0 font-medium text-al-text-primary">Next review signed records</p>
        <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          Continue with <span className="font-medium text-al-text-primary">{props.target.reviewTitle}</span>.
        </p>
      </div>
      <Button
        type="button"
        variant="primary"
        size="sm"
        asChild
        data-testid="signed-records-list-next-review-action"
      >
        <Link href={props.target.href}>Open next records</Link>
      </Button>
    </section>
  );
}

export function signedRecordsListNextReviewHref(runId: string): string {
  const params = new URLSearchParams();
  params.set("runId", runId.trim());

  return `${SIGNED_RECORDS_LIST_PATH}?${params.toString()}`;
}
