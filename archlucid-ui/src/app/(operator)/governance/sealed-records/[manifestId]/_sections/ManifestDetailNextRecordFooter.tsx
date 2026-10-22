import Link from "next/link";

import { Button } from "@/components/ui/button";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { ManifestDetailNextRecordTarget } from "@/lib/resolve-next-signed-records-list-row";
import { cn } from "@/lib/utils";

export type ManifestDetailNextRecordFooterProps = {
  readonly target: ManifestDetailNextRecordTarget;
};

/** Footer CTA to continue triage with the next sealed record in the list. */
export function ManifestDetailNextRecordFooter(
  props: ManifestDetailNextRecordFooterProps,
): React.JSX.Element {
  return (
    <section
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 rounded-md border border-neutral-200 bg-al-surface-raised px-3 py-3 dark:border-neutral-800",
        OPERATOR_TYPOGRAPHY.body,
      )}
      data-testid="manifest-detail-next-record-footer"
      aria-label="Next sealed record in workspace"
    >
      <div className="min-w-0">
        <p className="m-0 font-medium text-al-text-primary">Next record in workspace</p>
        <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          Continue with <span className="font-medium text-al-text-primary">{props.target.reviewTitle}</span>.
        </p>
      </div>
      <Button type="button" variant="primary" size="sm" asChild data-testid="manifest-detail-next-record-action">
        <Link href={props.target.href}>Open next record</Link>
      </Button>
    </section>
  );
}
