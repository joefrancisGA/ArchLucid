import Link from "next/link";

import { Button } from "@/components/ui/button";
import type { DigestsHubTabId } from "@/lib/digests-hub-tab";
import { digestsHubScopedHref } from "@/lib/digests-route-paths";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { RunDetailNextReviewTarget } from "@/lib/resolve-next-runs-list-row";
import { cn } from "@/lib/utils";

export type DigestsHubNextReviewFooterProps = {
  readonly target: RunDetailNextReviewTarget;
  readonly tab: DigestsHubTabId;
  readonly title: string;
  readonly actionLabel: string;
  readonly ariaLabel: string;
  readonly testIdPrefix: string;
};

/** Footer CTA to continue digest hub work on the next review for a given tab. */
export function DigestsHubNextReviewFooter(props: DigestsHubNextReviewFooterProps): React.JSX.Element {
  return (
    <section
      className={cn(
        "mt-4 flex flex-wrap items-center justify-between gap-3 rounded-md border border-neutral-200 bg-al-surface-raised px-3 py-3 dark:border-neutral-800",
        OPERATOR_TYPOGRAPHY.body,
      )}
      data-testid={`${props.testIdPrefix}-next-review-footer`}
      aria-label={props.ariaLabel}
    >
      <div className="min-w-0">
        <p className="m-0 font-medium text-al-text-primary">{props.title}</p>
        <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          Continue with <span className="font-medium text-al-text-primary">{props.target.reviewTitle}</span>.
        </p>
      </div>
      <Button
        type="button"
        variant="primary"
        size="sm"
        asChild
        data-testid={`${props.testIdPrefix}-next-review-action`}
      >
        <Link href={props.target.href}>{props.actionLabel}</Link>
      </Button>
    </section>
  );
}

export function digestsHubNextReviewHref(tab: DigestsHubTabId, runId: string): string {
  return digestsHubScopedHref(tab, runId);
}
