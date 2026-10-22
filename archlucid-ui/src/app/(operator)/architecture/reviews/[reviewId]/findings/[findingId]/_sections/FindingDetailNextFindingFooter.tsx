import Link from "next/link";

import { Button } from "@/components/ui/button";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { FindingDetailNextFindingTarget } from "@/lib/findings/resolve-next-finding-in-review";
import { cn } from "@/lib/utils";

export type FindingDetailNextFindingFooterProps = {
  readonly target: FindingDetailNextFindingTarget;
};

/** Footer CTA to continue triage with the next finding in this review. */
export function FindingDetailNextFindingFooter(
  props: FindingDetailNextFindingFooterProps,
): React.JSX.Element {
  return (
    <section
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 rounded-md border border-neutral-200 bg-al-surface-raised px-3 py-3 dark:border-neutral-800",
        OPERATOR_TYPOGRAPHY.body,
      )}
      data-testid="finding-detail-next-finding-footer"
      aria-label="Next finding in this review"
    >
      <div className="min-w-0">
        <p className="m-0 font-medium text-al-text-primary">Next finding in this review</p>
        <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          Continue triage with <span className="font-medium text-al-text-primary">{props.target.title}</span>.
        </p>
      </div>
      <Button type="button" variant="primary" size="sm" asChild data-testid="finding-detail-next-finding-action">
        <Link href={props.target.href}>Open next finding</Link>
      </Button>
    </section>
  );
}
