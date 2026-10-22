import Link from "next/link";

import { Button } from "@/components/ui/button";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { SPONSOR_DASHBOARD_HREF } from "@/lib/sponsor/sponsor-dashboard-route";
import type { RunDetailNextReviewTarget } from "@/lib/resolve-next-runs-list-row";
import { writeSponsorDashboardPickedReviewId } from "@/lib/sponsor-dashboard-picked-review-storage";
import { cn } from "@/lib/utils";

export type SponsorRoiDashboardNextReviewFooterProps = {
  readonly target: RunDetailNextReviewTarget;
};

/** Footer CTA to open the sponsor dashboard for the next review. */
export function SponsorRoiDashboardNextReviewFooter(
  props: SponsorRoiDashboardNextReviewFooterProps,
): React.JSX.Element {
  return (
    <section
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 rounded-md border border-neutral-200 bg-al-surface-raised px-3 py-3 dark:border-neutral-800",
        OPERATOR_TYPOGRAPHY.body,
      )}
      data-testid="sponsor-roi-dashboard-next-review-footer"
      aria-label="Next review sponsor dashboard"
    >
      <div className="min-w-0">
        <p className="m-0 font-medium text-al-text-primary">Next review sponsor dashboard</p>
        <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          Continue with <span className="font-medium text-al-text-primary">{props.target.reviewTitle}</span>.
        </p>
      </div>
      <Button type="button" variant="primary" size="sm" asChild data-testid="sponsor-roi-dashboard-next-review-action">
        <Link
          href={sponsorRoiDashboardNextReviewHref(props.target.runId)}
          onClick={() => {
            writeSponsorDashboardPickedReviewId(props.target.runId);
          }}
        >
          Open next dashboard
        </Link>
      </Button>
    </section>
  );
}

export function sponsorRoiDashboardNextReviewHref(_runId: string): string {
  return SPONSOR_DASHBOARD_HREF;
}
