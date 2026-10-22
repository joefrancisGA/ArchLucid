import Link from "next/link";

import { Button } from "@/components/ui/button";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { buildPolicyPacksHrefWithReviewId } from "@/lib/policy-packs-review-handoff";
import type { RunDetailNextReviewTarget } from "@/lib/resolve-next-runs-list-row";
import { cn } from "@/lib/utils";

export type PolicyPacksNextReviewFooterProps = {
  readonly target: RunDetailNextReviewTarget;
};

/** Footer CTA to open policy packs for the next review. */
export function PolicyPacksNextReviewFooter(props: PolicyPacksNextReviewFooterProps): React.JSX.Element {
  return (
    <section
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 rounded-md border border-neutral-200 bg-al-surface-raised px-3 py-3 dark:border-neutral-800",
        OPERATOR_TYPOGRAPHY.body,
      )}
      data-testid="policy-packs-next-review-footer"
      aria-label="Next review policy packs"
    >
      <div className="min-w-0">
        <p className="m-0 font-medium text-al-text-primary">Next review policy packs</p>
        <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          Continue with <span className="font-medium text-al-text-primary">{props.target.reviewTitle}</span>.
        </p>
      </div>
      <Button
        type="button"
        variant="primary"
        size="sm"
        asChild
        data-testid="policy-packs-next-review-action"
      >
        <Link href={props.target.href}>Open next policy packs</Link>
      </Button>
    </section>
  );
}

export function policyPacksNextReviewHref(runId: string): string {
  return buildPolicyPacksHrefWithReviewId(runId.trim());
}
