"use client";

import type { ReactNode } from "react";

import { ReviewDetailSiblingInFlightQueue } from "@/components/reviews/ReviewDetailSiblingInFlightQueue";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type RunDetailInFlightDeskChromeProps = {
  readonly runId: string;
  readonly pipelineBanner: ReactNode | null;
};

/** Pipeline banner plus sibling in-flight escape strip on open review (FD-04 / IS-09). */
export function RunDetailInFlightDeskChrome(props: RunDetailInFlightDeskChromeProps): React.JSX.Element | null {
  if (props.pipelineBanner === null) {
    return null;
  }

  return (
    <div className="space-y-4" data-testid="run-detail-in-flight-desk-chrome">
      {props.pipelineBanner}
      <p
        className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
        data-testid="run-detail-in-flight-desk-escape-copy"
      >
        Analysis runs in the background — open Overview, drafts, or other packages from the strip below. Return here
        to finalize when the review is ready; cancel still asks for confirmation.
      </p>
      <ReviewDetailSiblingInFlightQueue runId={props.runId} />
    </div>
  );
}
