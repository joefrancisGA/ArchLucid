import Link from "next/link";

import { Button } from "@/components/ui/button";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { RunDetailNextReviewTarget } from "@/lib/resolve-next-runs-list-row";
import { SPONSOR_REPORT_PATH } from "@/lib/sponsor-report-navigation";
import { writeSponsorReportPickedReviewId } from "@/lib/sponsor-report/sponsor-report-picked-review-storage";
import { cn } from "@/lib/utils";

export type SponsorReportNextReviewFooterProps = {
  readonly target: RunDetailNextReviewTarget;
};

/** Footer CTA to open the sponsor report for the next review. */
export function SponsorReportNextReviewFooter(props: SponsorReportNextReviewFooterProps): React.JSX.Element {
  return (
    <section
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 rounded-md border border-neutral-200 bg-al-surface-raised px-3 py-3 dark:border-neutral-800",
        OPERATOR_TYPOGRAPHY.body,
      )}
      data-testid="sponsor-report-next-review-footer"
      aria-label="Next review sponsor report"
    >
      <div className="min-w-0">
        <p className="m-0 font-medium text-al-text-primary">Next review sponsor report</p>
        <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          Continue with <span className="font-medium text-al-text-primary">{props.target.reviewTitle}</span>.
        </p>
      </div>
      <Button type="button" variant="primary" size="sm" asChild data-testid="sponsor-report-next-review-action">
        <Link
          href={props.target.href}
          onClick={() => {
            writeSponsorReportPickedReviewId(props.target.runId);
          }}
        >
          Open next sponsor report
        </Link>
      </Button>
    </section>
  );
}

export function sponsorReportNextReviewHref(runId: string): string {
  return `${SPONSOR_REPORT_PATH}?runId=${encodeURIComponent(runId)}`;
}
