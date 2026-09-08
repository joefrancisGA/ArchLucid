"use client";

import type { ReactNode } from "react";
import Link from "next/link";

import { ReviewDetailSiblingInFlightQueue } from "@/components/reviews/ReviewDetailSiblingInFlightQueue";
import { architectureIdentityPath } from "@/lib/architecture/architecture-routes";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type RunDetailInFlightDeskChromeProps = {
  readonly runId: string;
  readonly architectureId?: string | null;
  readonly pipelineBanner: ReactNode | null;
};

/** Pipeline banner plus sibling in-flight escape strip on open review (FD-04 / IS-09 / WS-17). */
export function RunDetailInFlightDeskChrome(props: RunDetailInFlightDeskChromeProps): React.JSX.Element | null {
  if (props.pipelineBanner === null) {
    return null;
  }

  const architectureId = props.architectureId?.trim() ?? "";
  const deskHref = architectureId.length > 0 ? architectureIdentityPath(architectureId) : null;

  return (
    <div className="space-y-4" data-testid="run-detail-in-flight-desk-chrome">
      {props.pipelineBanner}
      <p
        className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
        data-testid="run-detail-in-flight-desk-escape-copy"
      >
        Analysis runs in the background — continue on your architecture desk or open other packages from the strip
        below. Return here to finalize when the review is ready; cancel still asks for confirmation.
      </p>
      {deskHref !== null ? (
        <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>
          <Link
            className={OPERATOR_LINK.nav}
            data-testid="run-detail-in-flight-desk-continue-link"
            href={deskHref}
          >
            Continue on architecture desk
          </Link>
        </p>
      ) : null}
      <ReviewDetailSiblingInFlightQueue runId={props.runId} />
    </div>
  );
}
