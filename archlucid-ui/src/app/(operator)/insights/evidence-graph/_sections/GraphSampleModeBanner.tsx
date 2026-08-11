import { cn } from "@/lib/utils";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  BUYER_EVIDENCE_GRAPH_SAMPLE_BANNER_BODY,
  BUYER_EVIDENCE_GRAPH_SAMPLE_BANNER_TITLE,
  BUYER_EVIDENCE_GRAPH_USE_MY_REVIEW_CTA,
} from "@/lib/buyer-polish-copy";
import { OPERATOR_CALLOUT_WARN_CLASS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

export type GraphSampleModeBannerProps = {
  readonly className?: string;
  readonly showUseMyReviewAction?: boolean;
  /**
   * Once the graph canvas is visible, collapse the long sample explanation into a one-line status.
   * Full body remains available via a disclosure for operators who want context.
   */
  readonly compact?: boolean;
};

/** Customer-facing banner when the evidence graph shows the showcase sample review. */
export function GraphSampleModeBanner(props: GraphSampleModeBannerProps) {
  const compact = props.compact === true;

  return (
    <div
      className={cn(
        "rounded-md border px-3 py-2",
        OPERATOR_CALLOUT_WARN_CLASS,
        props.className,
      )}
      data-testid="graph-sample-mode-banner"
      data-compact={compact ? "true" : "false"}
      role="status"
    >
      {compact ? (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
            {BUYER_EVIDENCE_GRAPH_SAMPLE_BANNER_TITLE}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {props.showUseMyReviewAction ? (
              <Button type="button" variant="outline" size="sm" asChild>
                <Link href="/insights/evidence-graph">{BUYER_EVIDENCE_GRAPH_USE_MY_REVIEW_CTA}</Link>
              </Button>
            ) : null}
            <details className="min-w-0">
              <summary
                className={cn(
                  "cursor-pointer list-none text-al-link underline-offset-2 hover:underline [&::-webkit-details-marker]:hidden",
                  OPERATOR_TYPOGRAPHY.helper,
                )}
              >
                Why am I seeing this?
              </summary>
              <p className={cn("m-0 mt-2 max-w-3xl", OPERATOR_TYPOGRAPHY.helper)}>
                {BUYER_EVIDENCE_GRAPH_SAMPLE_BANNER_BODY}
              </p>
            </details>
          </div>
        </div>
      ) : (
        <>
          <p className={cn("m-0 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
            {BUYER_EVIDENCE_GRAPH_SAMPLE_BANNER_TITLE}
          </p>
          <p className={cn("m-0 mt-1 max-w-3xl", OPERATOR_TYPOGRAPHY.body)}>
            {BUYER_EVIDENCE_GRAPH_SAMPLE_BANNER_BODY}
          </p>
          {props.showUseMyReviewAction ? (
            <div className="mt-3">
              <Button type="button" variant="outline" size="sm" asChild>
                <Link href="/insights/evidence-graph">{BUYER_EVIDENCE_GRAPH_USE_MY_REVIEW_CTA}</Link>
              </Button>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
