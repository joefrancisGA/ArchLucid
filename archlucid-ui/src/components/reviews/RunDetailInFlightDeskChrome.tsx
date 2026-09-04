"use client";

import type { ReactNode } from "react";

import { ReviewDetailSiblingInFlightQueue } from "@/components/reviews/ReviewDetailSiblingInFlightQueue";

export type RunDetailInFlightDeskChromeProps = {
  readonly runId: string;
  readonly pipelineBanner: ReactNode | null;
};

/** Pipeline banner plus sibling in-flight escape strip on open review (FD-04). */
export function RunDetailInFlightDeskChrome(props: RunDetailInFlightDeskChromeProps): React.JSX.Element | null {
  if (props.pipelineBanner === null) {
    return null;
  }

  return (
    <div className="space-y-4" data-testid="run-detail-in-flight-desk-chrome">
      {props.pipelineBanner}
      <ReviewDetailSiblingInFlightQueue runId={props.runId} />
    </div>
  );
}
