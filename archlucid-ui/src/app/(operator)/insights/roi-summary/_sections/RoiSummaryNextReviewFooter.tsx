import Link from "next/link";

import { Button } from "@/components/ui/button";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { RunDetailNextReviewTarget } from "@/lib/resolve-next-runs-list-row";
import { SPONSOR_REPORT_ROI_SUMMARY_PATH } from "@/lib/sponsor-report-navigation";
import { writeRoiSummaryPickedReviewId } from "@/lib/roi-summary/roi-summary-picked-review-storage";
import { cn } from "@/lib/utils";

export type RoiSummaryNextReviewFooterProps = {
  readonly target: RunDetailNextReviewTarget;
};

/** Footer CTA to open the ROI summary for the next review. */
export function RoiSummaryNextReviewFooter(props: RoiSummaryNextReviewFooterProps): React.JSX.Element {
  return (
    <section
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 rounded-md border border-neutral-200 bg-al-surface-raised px-3 py-3 dark:border-neutral-800",
        OPERATOR_TYPOGRAPHY.body,
      )}
      data-testid="roi-summary-next-review-footer"
      aria-label="Next review ROI summary"
    >
      <div className="min-w-0">
        <p className="m-0 font-medium text-al-text-primary">Next review ROI summary</p>
        <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          Continue with <span className="font-medium text-al-text-primary">{props.target.reviewTitle}</span>.
        </p>
      </div>
      <Button type="button" variant="primary" size="sm" asChild data-testid="roi-summary-next-review-action">
        <Link
          href={props.target.href}
          onClick={() => {
            writeRoiSummaryPickedReviewId(props.target.runId);
          }}
        >
          Open next ROI summary
        </Link>
      </Button>
    </section>
  );
}

export function roiSummaryNextReviewHref(runId: string): string {
  return `${SPONSOR_REPORT_ROI_SUMMARY_PATH}?runId=${encodeURIComponent(runId)}`;
}
