import Link from "next/link";

import { Button } from "@/components/ui/button";
import { DIGESTS_HUB_GET_STARTED_TAB_ID } from "@/lib/digests-hub-tab";
import { digestsHubScopedHref } from "@/lib/digests-route-paths";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { RunDetailNextReviewTarget } from "@/lib/resolve-next-runs-list-row";
import { cn } from "@/lib/utils";

export type DigestsBrowseNextReviewFooterProps = {
  readonly target: RunDetailNextReviewTarget;
};

/** Footer CTA to browse digests for the next review. */
export function DigestsBrowseNextReviewFooter(props: DigestsBrowseNextReviewFooterProps): React.JSX.Element {
  return (
    <section
      className={cn(
        "mt-4 flex flex-wrap items-center justify-between gap-3 rounded-md border border-neutral-200 bg-al-surface-raised px-3 py-3 dark:border-neutral-800",
        OPERATOR_TYPOGRAPHY.body,
      )}
      data-testid="digests-browse-next-review-footer"
      aria-label="Next review digest browse"
    >
      <div className="min-w-0">
        <p className="m-0 font-medium text-al-text-primary">Next review digest browse</p>
        <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          Continue with <span className="font-medium text-al-text-primary">{props.target.reviewTitle}</span>.
        </p>
      </div>
      <Button type="button" variant="primary" size="sm" asChild data-testid="digests-browse-next-review-action">
        <Link href={props.target.href}>Browse next digests</Link>
      </Button>
    </section>
  );
}

export function digestsBrowseNextReviewHref(runId: string): string {
  return digestsHubScopedHref(DIGESTS_HUB_GET_STARTED_TAB_ID, runId);
}
