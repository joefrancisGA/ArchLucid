"use client";
import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import Link from "next/link";

import { InAppHelpLink } from "@/components/InAppHelpLink";
import { Button } from "@/components/ui/button";
import { OperatorWarningCallout } from "@/components/operator/OperatorShellMessage";

type StalledReviewGuidanceCalloutProps = {
  readonly elapsedMinutes: number;
  readonly runId: string;
};

/** Shown when a review has been in progress longer than the stalled threshold. */
export function StalledReviewGuidanceCallout(props: StalledReviewGuidanceCalloutProps) {
  return (
    <OperatorWarningCallout>
      <strong>Review still running ({props.elapsedMinutes}+ min)</strong>
      <p className={cn("m-0 mt-2", OPERATOR_TYPOGRAPHY.body)}>
        Large evidence bundles or cold-start infrastructure can extend pipeline time. The assessment coordinator is still
        working — refresh this page in a few minutes.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button asChild type="button" size="sm" variant="outline">
          <Link href={`/architecture/reviews/${encodeURIComponent(props.runId)}`}>Refresh review detail</Link>
        </Button>
        <InAppHelpLink
          helpSlug="troubleshooting"
          hashFragment="review-package-does-not-open"
          label="Troubleshooting guide"
          variant="text"
        />
      </div>
    </OperatorWarningCallout>
  );
}
