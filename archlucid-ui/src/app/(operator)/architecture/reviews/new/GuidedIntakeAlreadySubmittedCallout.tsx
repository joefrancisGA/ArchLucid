"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { reviewDetailPath } from "@/lib/architecture/architecture-routes";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  GUIDED_INTAKE_ALREADY_SUBMITTED_BODY,
  GUIDED_INTAKE_ALREADY_SUBMITTED_LEAD,
  GUIDED_INTAKE_ALREADY_SUBMITTED_OPEN_REVIEW_CTA,
  GUIDED_INTAKE_ALREADY_SUBMITTED_STUCK_BODY,
} from "@/lib/guided-intake-copy";
import { cn } from "@/lib/utils";

type GuidedIntakeAlreadySubmittedCalloutProps = {
  readonly linkedSpawnedRunId: string | null;
};

export function GuidedIntakeAlreadySubmittedCallout(
  props: GuidedIntakeAlreadySubmittedCalloutProps,
): React.JSX.Element {
  const linkedReviewId = props.linkedSpawnedRunId?.trim() ?? "";
  const hasLinkedReview = linkedReviewId.length > 0;

  return (
    <div
      className={cn(
        "space-y-3 rounded-md border border-amber-200 bg-amber-50/80 px-3 py-3 text-neutral-800 dark:border-amber-900/60 dark:bg-amber-950/20 dark:text-neutral-100",
        OPERATOR_TYPOGRAPHY.body,
      )}
      data-testid="guided-intake-already-submitted-callout"
      role="status"
    >
      <p className="m-0 font-medium text-neutral-900 dark:text-neutral-100">{GUIDED_INTAKE_ALREADY_SUBMITTED_LEAD}</p>
      <p className="m-0 text-neutral-700 dark:text-neutral-300">
        {hasLinkedReview ? GUIDED_INTAKE_ALREADY_SUBMITTED_BODY : GUIDED_INTAKE_ALREADY_SUBMITTED_STUCK_BODY}
      </p>
      {hasLinkedReview ? (
        <Button type="button" variant="primary" size="sm" className="w-fit" asChild>
          <Link href={reviewDetailPath(linkedReviewId)} data-testid="guided-intake-open-linked-review">
            {GUIDED_INTAKE_ALREADY_SUBMITTED_OPEN_REVIEW_CTA}
          </Link>
        </Button>
      ) : null}
    </div>
  );
}
