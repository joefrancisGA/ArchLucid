import type { ReactNode } from "react";

import type { TrustCenterReviewDateDisplay } from "@/lib/trust-center-review-date";

type TrustCenterReviewTimeProps = {
  readonly reviewDate: TrustCenterReviewDateDisplay;
};

/** Renders review metadata with a machine-readable date only when ISO-8601 is known. */
export function TrustCenterReviewTime(props: TrustCenterReviewTimeProps): ReactNode {
  const { reviewDate } = props;

  if (reviewDate.dateTime === null) {
    return <span>{reviewDate.label}</span>;
  }

  return <time dateTime={reviewDate.dateTime}>{reviewDate.label}</time>;
}
