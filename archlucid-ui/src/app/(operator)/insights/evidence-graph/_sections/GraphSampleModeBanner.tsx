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
};

/** Customer-facing banner when the evidence graph shows the showcase sample review. */
export function GraphSampleModeBanner(props: GraphSampleModeBannerProps) {
  return (
    <div
      className={cn(
        "rounded-md border px-4 py-3",
        OPERATOR_CALLOUT_WARN_CLASS,
        props.className,
      )}
      data-testid="graph-sample-mode-banner"
      role="status"
    >
      <p className={cn("m-0 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
        {BUYER_EVIDENCE_GRAPH_SAMPLE_BANNER_TITLE}
      </p>
      <p className={cn("m-0 mt-1 max-w-prose", OPERATOR_TYPOGRAPHY.body)}>{BUYER_EVIDENCE_GRAPH_SAMPLE_BANNER_BODY}</p>
      {props.showUseMyReviewAction ? (
        <div className="mt-3">
          <Button type="button" variant="outline" size="sm" asChild>
            <Link href="/insights/evidence-graph">{BUYER_EVIDENCE_GRAPH_USE_MY_REVIEW_CTA}</Link>
          </Button>
        </div>
      ) : null}
    </div>
  );
}
